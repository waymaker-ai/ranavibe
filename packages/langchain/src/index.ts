/**
 * @rana/langchain
 * LangChain adapter for RANA Framework
 *
 * Provides a LangChain-compatible chat model that uses RANA
 * for multi-provider routing, cost optimization, and security.
 *
 * @example
 * ```typescript
 * import { RanaChatModel } from '@rana/langchain';
 * import { createRana } from '@rana/core';
 *
 * const rana = createRana({
 *   providers: { openai: process.env.OPENAI_API_KEY }
 * });
 *
 * const model = new RanaChatModel({ rana });
 *
 * // Use in LangChain chains
 * const result = await model.invoke([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * ```
 */

export interface RanaChatModelConfig {
  /** RANA client instance */
  rana: any; // RanaClient - using any to avoid import issues
  /** Provider to use (optional, uses RANA routing if not specified) */
  provider?: string;
  /** Model to use */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Max tokens for response */
  maxTokens?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Whether to stream responses */
  streaming?: boolean;
}

/**
 * Message format compatible with LangChain
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: string;
  name?: string;
  function_call?: any;
  tool_calls?: any[];
}

/**
 * Response format compatible with LangChain
 */
export interface ChatResult {
  content: string;
  additional_kwargs: {
    tool_calls?: any[];
    function_call?: any;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  response_metadata?: {
    provider?: string;
    model?: string;
    cost?: number;
  };
}

/**
 * LangChain-compatible chat model that uses RANA
 *
 * This allows you to use RANA's multi-provider routing,
 * cost optimization, and security features within LangChain chains.
 */
export class RanaChatModel {
  private rana: any;
  private config: RanaChatModelConfig;

  constructor(config: RanaChatModelConfig) {
    this.rana = config.rana;
    this.config = config;
  }

  /**
   * Invoke the model with messages
   */
  async invoke(messages: ChatMessage[], options?: any): Promise<ChatResult> {
    const response = await this.rana.chat({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      provider: options?.provider || this.config.provider,
      model: options?.model || this.config.model,
      temperature: options?.temperature || this.config.temperature,
      maxTokens: options?.maxTokens || this.config.maxTokens,
      stop: options?.stop || this.config.stopSequences,
      tools: options?.tools,
    });

    return {
      content: response.content || '',
      additional_kwargs: {
        tool_calls: response.toolCalls,
        usage: response.usage
          ? {
              prompt_tokens: response.usage.promptTokens || 0,
              completion_tokens: response.usage.completionTokens || 0,
              total_tokens:
                (response.usage.promptTokens || 0) +
                (response.usage.completionTokens || 0),
            }
          : undefined,
      },
      response_metadata: {
        provider: response.provider,
        model: response.model,
        cost: response.usage?.cost,
      },
    };
  }

  /**
   * Stream responses from the model
   */
  async *stream(
    messages: ChatMessage[],
    options?: any
  ): AsyncGenerator<{ content: string; additional_kwargs: any }> {
    const response = await this.rana.chat({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      provider: options?.provider || this.config.provider,
      model: options?.model || this.config.model,
      temperature: options?.temperature || this.config.temperature,
      maxTokens: options?.maxTokens || this.config.maxTokens,
    });

    // If response is an async iterator
    if (Symbol.asyncIterator in response) {
      for await (const chunk of response) {
        yield {
          content: chunk.content || chunk.delta?.content || '',
          additional_kwargs: {},
        };
      }
    } else {
      // Single response
      yield {
        content: response.content || '',
        additional_kwargs: {
          tool_calls: response.toolCalls,
        },
      };
    }
  }

  /**
   * Bind tools to the model
   */
  bindTools(tools: any[]): RanaChatModel {
    return new RanaChatModelWithTools(this.config, tools);
  }

  /**
   * Get the model name
   */
  get modelName(): string {
    return this.config.model || 'rana-default';
  }
}

/**
 * Chat model with bound tools
 */
class RanaChatModelWithTools extends RanaChatModel {
  private tools: any[];

  constructor(config: RanaChatModelConfig, tools: any[]) {
    super(config);
    this.tools = tools;
  }

  async invoke(messages: ChatMessage[], options?: any): Promise<ChatResult> {
    return super.invoke(messages, {
      ...options,
      tools: this.tools,
    });
  }
}

/**
 * Create a RANA chat model for LangChain
 */
export function createRanaChatModel(config: RanaChatModelConfig): RanaChatModel {
  return new RanaChatModel(config);
}

/**
 * Utility to convert LangChain tools to RANA format
 */
export function langchainToolToRana(tool: any): any {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema || { type: 'object', properties: {} },
    },
  };
}

/**
 * Utility to convert RANA tools to LangChain format
 */
export function ranaToolToLangchain(tool: any): any {
  return {
    name: tool.name,
    description: tool.description,
    schema: tool.inputSchema || tool.function?.parameters,
  };
}
