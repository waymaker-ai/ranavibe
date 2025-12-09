/**
 * @rana/crewai
 * CrewAI adapter for RANA Framework
 *
 * Provides a CrewAI-compatible model wrapper that uses RANA
 * for multi-provider routing, cost optimization, and security.
 *
 * @example
 * ```typescript
 * import { RanaCrewModel } from '@rana/crewai';
 * import { createRana } from '@rana/core';
 *
 * const rana = createRana({
 *   providers: { anthropic: process.env.ANTHROPIC_API_KEY }
 * });
 *
 * const model = new RanaCrewModel({
 *   rana,
 *   provider: 'anthropic',
 *   model: 'claude-3-5-sonnet-20241022',
 * });
 *
 * // Use with CrewAI agents
 * const agent = new Agent({
 *   role: 'Researcher',
 *   goal: 'Find information',
 *   llm: model,
 * });
 * ```
 */

export interface RanaCrewModelConfig {
  /** RANA client instance */
  rana: any; // RanaClient
  /** Provider to use */
  provider?: string;
  /** Model to use */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Max tokens for response */
  maxTokens?: number;
}

/**
 * CrewAI-compatible model that uses RANA
 *
 * This allows you to use RANA's multi-provider routing
 * and cost optimization with CrewAI crews.
 */
export class RanaCrewModel {
  private rana: any;
  private provider?: string;
  private model?: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: RanaCrewModelConfig) {
    this.rana = config.rana;
    this.provider = config.provider;
    this.model = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  /**
   * Generate a response (CrewAI compatible)
   */
  async generate(prompt: string, options?: any): Promise<string> {
    const response = await this.rana.chat({
      messages: [{ role: 'user', content: prompt }],
      provider: options?.provider || this.provider,
      model: options?.model || this.model,
      temperature: options?.temperature ?? this.temperature,
      maxTokens: options?.maxTokens ?? this.maxTokens,
    });

    return response.content || '';
  }

  /**
   * Generate with tools (CrewAI compatible)
   */
  async generateWithTools(
    prompt: string,
    tools: any[],
    options?: any
  ): Promise<{
    content: string;
    toolCalls?: Array<{
      id: string;
      name: string;
      arguments: Record<string, any>;
    }>;
  }> {
    const response = await this.rana.chat({
      messages: [{ role: 'user', content: prompt }],
      tools: tools.map(formatToolForRana),
      provider: options?.provider || this.provider,
      model: options?.model || this.model,
      temperature: options?.temperature ?? this.temperature,
      maxTokens: options?.maxTokens ?? this.maxTokens,
    });

    const toolCalls = response.toolCalls?.map((tc: any) => ({
      id: tc.id,
      name: tc.function?.name || tc.name,
      arguments:
        typeof tc.function?.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function?.arguments || tc.arguments || {},
    }));

    return {
      content: response.content || '',
      toolCalls,
    };
  }

  /**
   * Chat with message history (CrewAI compatible)
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: any
  ): Promise<string> {
    const response = await this.rana.chat({
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      provider: options?.provider || this.provider,
      model: options?.model || this.model,
      temperature: options?.temperature ?? this.temperature,
      maxTokens: options?.maxTokens ?? this.maxTokens,
    });

    return response.content || '';
  }

  /**
   * Stream response (if supported by CrewAI)
   */
  async *stream(prompt: string, options?: any): AsyncGenerator<string> {
    const response = await this.rana.chat({
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      provider: options?.provider || this.provider,
      model: options?.model || this.model,
      temperature: options?.temperature ?? this.temperature,
      maxTokens: options?.maxTokens ?? this.maxTokens,
    });

    if (Symbol.asyncIterator in response) {
      for await (const chunk of response) {
        const content = chunk.content || chunk.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } else {
      yield response.content || '';
    }
  }

  /**
   * Get model info
   */
  get modelInfo(): { provider?: string; model?: string } {
    return {
      provider: this.provider,
      model: this.model,
    };
  }
}

/**
 * Format a CrewAI tool for RANA
 */
function formatToolForRana(tool: any): any {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.args_schema || tool.schema || { type: 'object', properties: {} },
    },
  };
}

/**
 * Create a RANA model for CrewAI
 */
export function createRanaCrewModel(config: RanaCrewModelConfig): RanaCrewModel {
  return new RanaCrewModel(config);
}

/**
 * Convert RANA tool to CrewAI format
 */
export function ranaToolToCrewAI(tool: any): any {
  return {
    name: tool.name,
    description: tool.description,
    args_schema: tool.inputSchema || tool.function?.parameters,
    func: async (args: any) => {
      const result = await tool.run(args, {});
      return result.ok ? result.data : { error: result.error };
    },
  };
}

/**
 * Wrapper to create a crew with RANA-powered agents
 */
export interface RanaCrewConfig {
  rana: any;
  defaultProvider?: string;
  defaultModel?: string;
  temperature?: number;
}

export function createRanaCrewLLM(config: RanaCrewConfig): RanaCrewModel {
  return new RanaCrewModel({
    rana: config.rana,
    provider: config.defaultProvider,
    model: config.defaultModel,
    temperature: config.temperature,
  });
}
