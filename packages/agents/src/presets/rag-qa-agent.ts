/**
 * @rana/agents - RAG QA Agent
 * Answers questions using knowledge base retrieval
 */

import { BaseAgent } from '../base-agent';
import { AgentInput, AgentOutput, AgentContext, AgentMessage } from '../types';

/**
 * RAG-powered Question Answering Agent
 *
 * @example
 * ```typescript
 * const agent = createRagQAAgent(ctx);
 * const result = await agent.handle({
 *   user: { id: 'u1', orgId: 'o1', roles: [] },
 *   message: 'What is our return policy?',
 *   context: { kbId: 'policies' },
 * });
 * ```
 */
export class RagQAAgent extends BaseAgent {
  id = 'rag_qa';
  name = 'RAG QA Agent';
  description = 'Answers questions using knowledge base retrieval with citations';

  async handle(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const outputId = `${this.id}:${Date.now()}`;

    // Validate RAG client
    if (!this.ctx.rag) {
      throw new Error('RAG client not configured for RagQAAgent');
    }

    // Get knowledge base ID from context or vibe
    const kbId = input.context?.kbId || this.getKbIdFromVibe();
    if (!kbId) {
      throw new Error('kbId is required in context or vibe configuration');
    }

    this.log('rag_qa:start', {
      kbId,
      query: input.message.substring(0, 100),
      userId: input.user.id,
    });

    try {
      // Query the RAG system
      const result = await this.ctx.rag.ask({
        kbId,
        orgId: input.user.orgId,
        query: input.message,
        mode: 'qa',
        userId: input.user.id,
        vibe: this.ctx.vibe,
      });

      this.log('rag_qa:success', {
        kbId,
        answerLength: result.answer.length,
        citationCount: result.citations?.length || 0,
        durationMs: Date.now() - start,
      });

      const messages: AgentMessage[] = [
        {
          role: 'assistant',
          content: result.answer,
          timestamp: new Date(),
        },
      ];

      return {
        id: outputId,
        messages,
        citations: result.citations,
        metadata: {
          kbId,
          queryType: 'qa',
        },
        usage: result.usage
          ? {
              tokensPrompt: result.usage.tokensPrompt,
              tokensCompletion: result.usage.tokensCompletion,
              totalTokens: result.usage.tokensPrompt + result.usage.tokensCompletion,
              costUsd: result.usage.costUsd,
              provider: result.usage.provider,
              model: result.usage.model,
              totalDurationMs: Date.now() - start,
            }
          : undefined,
      };
    } catch (error) {
      this.log('rag_qa:error', {
        kbId,
        error: String(error),
        durationMs: Date.now() - start,
      });

      return {
        id: outputId,
        messages: [
          {
            role: 'assistant',
            content: `I was unable to find an answer to your question. Error: ${String(error)}`,
            timestamp: new Date(),
          },
        ],
        metadata: {
          kbId,
          error: String(error),
        },
      };
    }
  }

  private getKbIdFromVibe(): string | undefined {
    // Check if vibe has RAG config (from VibeSpec)
    const vibe = this.ctx.vibe as any;
    return vibe?.rag?.kbId;
  }
}

/**
 * Create a RAG QA agent
 */
export function createRagQAAgent(ctx: AgentContext): RagQAAgent {
  return new RagQAAgent(ctx);
}
