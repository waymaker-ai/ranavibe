/**
 * Agent Streaming Module
 * Real streaming support for LLM agents with event emission
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface AgentStreamChunk {
  type: 'thinking' | 'content' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  delta?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    toolCallId: string;
    name: string;
    result: unknown;
    success: boolean;
    error?: string;
  };
  error?: string;
  metadata?: {
    iteration?: number;
    maxIterations?: number;
    tokensUsed?: number;
    model?: string;
    provider?: string;
  };
}

export interface StreamingLLMConfig {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  systemPrompt?: string;
  maxIterations?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface StreamingLLMClient {
  stream(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: Array<{
        type: 'function';
        function: {
          name: string;
          description: string;
          parameters: unknown;
        };
      }>;
    }
  ): AsyncGenerator<{
    type: 'content' | 'tool_call' | 'done';
    delta?: string;
    toolCall?: {
      id: string;
      name: string;
      arguments: string;
    };
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }>;
}

// ============================================================================
// Streaming Agent
// ============================================================================

export class StreamingAgent extends EventEmitter {
  private config: StreamingLLMConfig;
  private client: StreamingLLMClient | null = null;
  private tools: Map<string, ToolDefinition> = new Map();
  private history: Array<{ role: string; content: string }> = [];
  private aborted = false;

  constructor(config: StreamingLLMConfig = {}) {
    super();
    this.config = {
      temperature: 0.7,
      maxTokens: 4096,
      maxIterations: 10,
      ...config,
    };

    // Register tools from config
    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.set(tool.name, tool);
      }
    }
  }

  /**
   * Set the streaming LLM client
   */
  setClient(client: StreamingLLMClient): this {
    this.client = client;
    return this;
  }

  /**
   * Register a tool
   */
  registerTool(tool: ToolDefinition): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  /**
   * Stream agent response with real-time updates
   */
  async *stream(input: string): AsyncGenerator<AgentStreamChunk, string, unknown> {
    if (!this.client) {
      yield {
        type: 'error',
        error: 'LLM client not set. Call setClient() first.',
      };
      return '';
    }

    this.aborted = false;
    let iteration = 0;
    const maxIterations = this.config.maxIterations || 10;
    let finalResponse = '';

    // Add user message to history
    this.history.push({ role: 'user', content: input });

    while (iteration < maxIterations && !this.aborted) {
      iteration++;

      yield {
        type: 'thinking',
        metadata: {
          iteration,
          maxIterations,
          model: this.config.model,
          provider: this.config.provider,
        },
      };

      // Build messages
      const messages = this.buildMessages();

      // Get tool definitions
      const toolDefs = this.getToolDefinitions();

      // Stream LLM response
      let contentBuffer = '';
      let pendingToolCall: {
        id: string;
        name: string;
        arguments: string;
      } | null = null;

      try {
        const stream = this.client.stream(messages, {
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          tools: toolDefs.length > 0 ? toolDefs : undefined,
        });

        for await (const chunk of stream) {
          if (this.aborted) break;

          if (chunk.type === 'content' && chunk.delta) {
            contentBuffer += chunk.delta;
            yield {
              type: 'content',
              delta: chunk.delta,
              content: contentBuffer,
            };
          } else if (chunk.type === 'tool_call' && chunk.toolCall) {
            pendingToolCall = chunk.toolCall;
            yield {
              type: 'tool_call',
              toolCall: {
                id: chunk.toolCall.id,
                name: chunk.toolCall.name,
                arguments: JSON.parse(chunk.toolCall.arguments || '{}'),
              },
            };
          } else if (chunk.type === 'done') {
            if (chunk.usage) {
              yield {
                type: 'thinking',
                metadata: {
                  tokensUsed: chunk.usage.total_tokens,
                },
              };
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        yield {
          type: 'error',
          error: errorMsg,
        };
        return '';
      }

      // Handle tool call if present
      if (pendingToolCall) {
        // Add assistant message with tool call
        this.history.push({
          role: 'assistant',
          content: contentBuffer || `Calling tool: ${pendingToolCall.name}`,
        });

        // Execute tool
        const tool = this.tools.get(pendingToolCall.name);
        if (tool) {
          try {
            const args = JSON.parse(pendingToolCall.arguments || '{}');
            const result = await tool.execute(args);

            yield {
              type: 'tool_result',
              toolResult: {
                toolCallId: pendingToolCall.id,
                name: pendingToolCall.name,
                result,
                success: true,
              },
            };

            // Add tool result to history
            this.history.push({
              role: 'tool',
              content: JSON.stringify(result),
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            yield {
              type: 'tool_result',
              toolResult: {
                toolCallId: pendingToolCall.id,
                name: pendingToolCall.name,
                result: null,
                success: false,
                error: errorMsg,
              },
            };

            // Add error to history
            this.history.push({
              role: 'tool',
              content: JSON.stringify({ error: errorMsg }),
            });
          }
        } else {
          yield {
            type: 'error',
            error: `Unknown tool: ${pendingToolCall.name}`,
          };
        }

        // Continue loop to process tool result
        continue;
      }

      // No tool call - this is the final response
      if (contentBuffer) {
        this.history.push({
          role: 'assistant',
          content: contentBuffer,
        });
        finalResponse = contentBuffer;
        break;
      }
    }

    yield {
      type: 'done',
      content: finalResponse,
    };

    return finalResponse;
  }

  /**
   * Stop the current stream
   */
  abort(): void {
    this.aborted = true;
    this.emit('abort');
  }

  /**
   * Reset conversation history
   */
  reset(): void {
    this.history = [];
    this.aborted = false;
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return [...this.history];
  }

  private buildMessages(): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // System message
    if (this.config.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.config.systemPrompt,
      });
    } else {
      messages.push({
        role: 'system',
        content: this.getDefaultSystemPrompt(),
      });
    }

    // Add history
    messages.push(...this.history);

    return messages;
  }

  private getDefaultSystemPrompt(): string {
    const toolList = Array.from(this.tools.values())
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `You are a helpful AI assistant that can use tools to accomplish tasks.

${toolList ? `Available tools:\n${toolList}` : 'No tools available.'}

When you need to use a tool, call the appropriate function.
Think step by step about how to accomplish the user's request.
When the task is complete, provide a clear final answer.`;
  }

  private getToolDefinitions(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: unknown;
    };
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}

// ============================================================================
// Helper: Create adapter for RANA client
// ============================================================================

/**
 * Create a streaming client adapter from RANA client
 */
export function createStreamingAdapter(ranaClient: {
  stream(request: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    tools?: unknown[];
    stream: boolean;
  }): AsyncGenerator<{
    delta: string;
    done: boolean;
    tool_calls?: Array<{
      id: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }>;
}): StreamingLLMClient {
  return {
    async *stream(messages, options) {
      const stream = ranaClient.stream({
        messages: messages as Array<{ role: string; content: string }>,
        model: options.model,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        tools: options.tools,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.tool_calls && chunk.tool_calls.length > 0) {
          for (const tc of chunk.tool_calls) {
            yield {
              type: 'tool_call',
              toolCall: {
                id: tc.id,
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            };
          }
        } else if (chunk.delta) {
          yield {
            type: 'content',
            delta: chunk.delta,
          };
        }

        if (chunk.done) {
          yield {
            type: 'done',
            usage: chunk.usage,
          };
        }
      }
    },
  };
}

/**
 * Factory function to create a streaming agent
 */
export function createStreamingAgent(config: StreamingLLMConfig): StreamingAgent {
  return new StreamingAgent(config);
}
