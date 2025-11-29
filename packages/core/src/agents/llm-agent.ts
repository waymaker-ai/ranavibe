/**
 * LLM Agent
 * An agent powered by an LLM that can use tools to accomplish tasks.
 * Implements ReAct (Reasoning + Acting) pattern.
 */

import { BaseAgent, AgentConfig, ToolCall, ToolResult, AgentMessage } from './base.js';

export interface LLMAgentConfig extends AgentConfig {
  /** Temperature for LLM responses */
  temperature?: number;
  /** Maximum tokens per response */
  maxTokens?: number;
  /** Custom thinking prompt */
  thinkingPrompt?: string;
  /** Stop sequences */
  stopSequences?: string[];
}

interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

/**
 * LLM Agent with tool use capabilities
 */
export class LLMAgent extends BaseAgent {
  private llmConfig: LLMAgentConfig;
  private chatFn: ((messages: any[], options: any) => Promise<LLMResponse>) | null = null;

  constructor(config: LLMAgentConfig) {
    super(config);
    this.llmConfig = {
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };
  }

  /**
   * Set the chat function (from @rana/core)
   */
  setLLM(chatFn: (messages: any[], options: any) => Promise<LLMResponse>): this {
    this.chatFn = chatFn;
    return this;
  }

  /**
   * Build messages array for LLM
   */
  private buildMessages(): any[] {
    const messages: any[] = [];

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

    // Convert history to messages
    for (const msg of this.state.history) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          content: JSON.stringify(msg.toolResult?.result),
          tool_call_id: msg.toolResult?.toolCallId,
        });
      } else {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return messages;
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    const toolList = this.getTools()
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `You are a helpful AI assistant that can use tools to accomplish tasks.

Available tools:
${toolList || 'No tools available.'}

When you need to use a tool, use the appropriate function call.
Think step by step about how to accomplish the user's request.
If you're unsure, ask clarifying questions.
When the task is complete, provide a final summary.`;
  }

  /**
   * Execute the main agent loop
   */
  protected async executeLoop(input: string): Promise<string> {
    if (!this.chatFn) {
      throw new Error('LLM function not set. Call setLLM() first.');
    }

    let iteration = 0;
    const maxIterations = this.config.maxIterations || 10;

    while (iteration < maxIterations) {
      iteration++;
      this.state.currentStep = iteration;

      this.log(`Iteration ${iteration}/${maxIterations}`);
      this.emit('step', { iteration, maxIterations });

      // Check for abort
      if (this.abortController?.signal.aborted) {
        throw new Error('Agent was stopped');
      }

      // Build messages and get LLM response
      const messages = this.buildMessages();
      const tools = this.getToolDefinitions();

      this.emit('thinking', { messages });

      const response = await this.chatFn(messages, {
        model: this.llmConfig.model,
        provider: this.llmConfig.provider,
        temperature: this.llmConfig.temperature,
        maxTokens: this.llmConfig.maxTokens,
        tools: tools.length > 0 ? tools : undefined,
        stopSequences: this.llmConfig.stopSequences,
      });

      // Handle tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Add assistant message with tool calls
        this.addMessage({
          role: 'assistant',
          content: response.content || '',
          toolCall: response.toolCalls[0],
        });

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);

          // Add tool result message
          this.addMessage({
            role: 'tool',
            content: JSON.stringify(result.result),
            toolResult: result,
          });

          // If tool failed, we might want to handle it
          if (!result.success) {
            this.log(`Tool ${toolCall.name} failed: ${result.error}`);
          }
        }

        // Continue the loop to process tool results
        continue;
      }

      // No tool calls - this is the final response
      if (response.content) {
        this.addMessage({
          role: 'assistant',
          content: response.content,
        });
        return response.content;
      }

      // Empty response, something went wrong
      throw new Error('LLM returned empty response');
    }

    // Exceeded max iterations
    const lastMessage = this.state.history
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastMessage) {
      return lastMessage.content;
    }

    throw new Error(`Agent exceeded maximum iterations (${maxIterations})`);
  }

  /**
   * Stream the agent's response
   */
  async *stream(input: string): AsyncGenerator<string, string, unknown> {
    // For now, we just yield the final result
    // TODO: Implement true streaming with intermediate steps
    const result = await this.run(input);
    yield result;
    return result;
  }
}

/**
 * Create a simple LLM agent with one-liner syntax
 */
export function createAgent(config: LLMAgentConfig): LLMAgent {
  return new LLMAgent(config);
}
