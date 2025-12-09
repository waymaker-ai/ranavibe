/**
 * @rana/agents - Chat Agent
 * Simple conversational agent
 */

import { BaseAgent } from '../base-agent';
import { AgentInput, AgentOutput, AgentContext, AgentMessage } from '../types';

/**
 * Simple conversational chat agent
 *
 * @example
 * ```typescript
 * const agent = createChatAgent(ctx, {
 *   systemPrompt: 'You are a friendly assistant.',
 * });
 * const result = await agent.handle({
 *   user: { id: 'u1', orgId: 'o1', roles: [] },
 *   message: 'Hello!',
 * });
 * ```
 */
export class ChatAgent extends BaseAgent {
  id = 'chat';
  name = 'Chat Agent';
  description = 'A friendly conversational assistant';

  private systemPrompt?: string;
  private provider?: string;
  private model?: string;
  private temperature: number;
  private maxTokens: number;

  constructor(
    ctx: AgentContext,
    config?: {
      id?: string;
      name?: string;
      description?: string;
      systemPrompt?: string;
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    super(ctx);
    if (config?.id) this.id = config.id;
    if (config?.name) this.name = config.name;
    if (config?.description) this.description = config.description;
    this.systemPrompt = config?.systemPrompt;
    this.provider = config?.provider;
    this.model = config?.model;
    this.temperature = config?.temperature ?? 0.7;
    this.maxTokens = config?.maxTokens ?? 2048;
  }

  async handle(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const outputId = `${this.id}:${Date.now()}`;

    this.log('chat:start', {
      userId: input.user.id,
      messageLength: input.message.length,
      historyLength: input.conversationHistory?.length || 0,
    });

    // Build messages
    const systemPrompt = this.systemPrompt || this.buildSystemPrompt();
    const messages: AgentMessage[] = [
      { role: 'system', content: systemPrompt, timestamp: new Date() },
      ...(input.conversationHistory || []),
      { role: 'user', content: input.message, timestamp: new Date() },
    ];

    try {
      const response = await this.ctx.rana.chat({
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        provider: this.provider,
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      this.log('chat:success', {
        responseLength: response.content?.length || 0,
        durationMs: Date.now() - start,
      });

      messages.push({
        role: 'assistant',
        content: response.content || '',
        timestamp: new Date(),
      });

      return {
        id: outputId,
        messages,
        usage: response.usage
          ? {
              tokensPrompt: response.usage.promptTokens || 0,
              tokensCompletion: response.usage.completionTokens || 0,
              totalTokens:
                (response.usage.promptTokens || 0) +
                (response.usage.completionTokens || 0),
              costUsd: response.usage.cost || 0,
              provider: response.provider || '',
              model: response.model || '',
              totalDurationMs: Date.now() - start,
            }
          : undefined,
      };
    } catch (error) {
      this.log('chat:error', {
        error: String(error),
        durationMs: Date.now() - start,
      });

      return {
        id: outputId,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: `I encountered an error: ${String(error)}`,
            timestamp: new Date(),
          },
        ],
        metadata: { error: String(error) },
      };
    }
  }
}

/**
 * Create a chat agent
 */
export function createChatAgent(
  ctx: AgentContext,
  config?: {
    id?: string;
    name?: string;
    description?: string;
    systemPrompt?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): ChatAgent {
  return new ChatAgent(ctx, config);
}
