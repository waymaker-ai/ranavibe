/**
 * @rana/agents - LLMAgent
 * Agent that uses LLM for reasoning with tool calling
 */

import { BaseAgent } from './base-agent';
import {
  AgentInput,
  AgentOutput,
  AgentMessage,
  AgentContext,
  LLMAgentConfig,
  ToolCallRecord,
  Tool,
} from './types';

/**
 * LLM-powered agent with tool calling capabilities
 *
 * @example
 * ```typescript
 * const agent = new LLMAgent(ctx, 'support', 'Support Agent', 'Helps users', {
 *   provider: 'anthropic',
 *   model: 'claude-3-5-sonnet-20241022',
 *   temperature: 0.7,
 * });
 *
 * const result = await agent.handle({
 *   user: { id: 'u1', orgId: 'o1', roles: ['user'] },
 *   message: 'Help me with my order',
 * });
 * ```
 */
export class LLMAgent extends BaseAgent {
  id: string;
  name: string;
  description?: string;

  private config: Required<LLMAgentConfig>;

  constructor(
    ctx: AgentContext,
    id: string,
    name: string,
    description?: string,
    config: LLMAgentConfig = {}
  ) {
    super(ctx);
    this.id = id;
    this.name = name;
    this.description = description;
    this.config = {
      maxIterations: config.maxIterations ?? 10,
      provider: config.provider ?? '',
      model: config.model ?? '',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      systemPrompt: config.systemPrompt ?? '',
      stopSequences: config.stopSequences ?? [],
    };
  }

  async handle(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    const outputId = `${this.id}:${Date.now()}`;

    this.log('agent:start', {
      inputId: input.id,
      userId: input.user.id,
      messageLength: input.message.length,
    });

    // Build messages array
    const systemPrompt = this.config.systemPrompt || this.buildSystemPrompt();
    const messages: AgentMessage[] = [
      { role: 'system', content: systemPrompt, timestamp: new Date() },
      ...(input.conversationHistory || []),
      { role: 'user', content: input.message, timestamp: new Date() },
    ];

    const usedTools: ToolCallRecord[] = [];
    let iterations = 0;
    let totalTokensPrompt = 0;
    let totalTokensCompletion = 0;
    let totalCost = 0;
    let lastProvider = '';
    let lastModel = '';

    try {
      while (iterations < this.config.maxIterations) {
        iterations++;

        this.log('llm:request', { iteration: iterations });

        // Call LLM
        const response = await this.ctx.rana.chat({
          messages: messages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          tools: this.formatToolsForLLM(),
          provider: this.config.provider || undefined,
          model: this.config.model || undefined,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          stop: this.config.stopSequences.length > 0 ? this.config.stopSequences : undefined,
        });

        // Track usage
        if (response.usage) {
          totalTokensPrompt += response.usage.promptTokens || 0;
          totalTokensCompletion += response.usage.completionTokens || 0;
          totalCost += response.usage.cost || 0;
          lastProvider = response.provider || '';
          lastModel = response.model || '';
        }

        this.log('llm:response', {
          iteration: iterations,
          hasToolCalls: !!response.toolCalls?.length,
          contentLength: response.content?.length || 0,
        });

        // If no tool calls, we're done
        if (!response.toolCalls?.length) {
          messages.push({
            role: 'assistant',
            content: response.content || '',
            timestamp: new Date(),
          });

          return this.buildOutput(outputId, messages, usedTools, {
            iterations,
            totalDurationMs: Date.now() - start,
            tokensPrompt: totalTokensPrompt,
            tokensCompletion: totalTokensCompletion,
            costUsd: totalCost,
            provider: lastProvider,
            model: lastModel,
          });
        }

        // Process tool calls
        for (const toolCall of response.toolCalls) {
          const toolName = toolCall.function?.name || toolCall.name;
          const toolArgs = this.parseToolArgs(toolCall);

          const tool = this.getTool(toolName);
          if (!tool) {
            this.log('tool:not_found', { tool: toolName });
            continue;
          }

          const toolStart = Date.now();
          const result = await this.callTool(tool, toolArgs);
          const durationMs = Date.now() - toolStart;

          const record: ToolCallRecord = {
            id: toolCall.id,
            tool: toolName,
            input: toolArgs,
            result,
            durationMs,
          };
          usedTools.push(record);

          // Add tool result to messages
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.ok ? result.data : { error: result.error }),
            toolCalls: [record],
            timestamp: new Date(),
          });
        }
      }

      // Max iterations reached
      this.log('agent:max_iterations', { iterations });

      messages.push({
        role: 'assistant',
        content:
          'I apologize, but I was unable to complete the task within the allowed number of steps. Please try rephrasing your request or breaking it into smaller parts.',
        timestamp: new Date(),
      });

      return this.buildOutput(outputId, messages, usedTools, {
        iterations,
        maxIterationsReached: true,
        totalDurationMs: Date.now() - start,
        tokensPrompt: totalTokensPrompt,
        tokensCompletion: totalTokensCompletion,
        costUsd: totalCost,
        provider: lastProvider,
        model: lastModel,
      });
    } catch (error) {
      this.log('agent:error', { error: String(error) });

      messages.push({
        role: 'assistant',
        content: `I encountered an error while processing your request: ${String(error)}`,
        timestamp: new Date(),
      });

      return this.buildOutput(outputId, messages, usedTools, {
        iterations,
        error: String(error),
        totalDurationMs: Date.now() - start,
        tokensPrompt: totalTokensPrompt,
        tokensCompletion: totalTokensCompletion,
        costUsd: totalCost,
        provider: lastProvider,
        model: lastModel,
      });
    }
  }

  private formatToolsForLLM(): any[] {
    return this.ctx.tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema || { type: 'object', properties: {} },
      },
    }));
  }

  private parseToolArgs(toolCall: any): Record<string, any> {
    const args = toolCall.function?.arguments || toolCall.arguments || '{}';
    if (typeof args === 'string') {
      try {
        return JSON.parse(args);
      } catch {
        return {};
      }
    }
    return args;
  }

  private buildOutput(
    id: string,
    messages: AgentMessage[],
    usedTools: ToolCallRecord[],
    meta: Record<string, any>
  ): AgentOutput {
    this.log('agent:end', {
      id,
      iterations: meta.iterations,
      toolsUsed: usedTools.length,
      durationMs: meta.totalDurationMs,
    });

    return {
      id,
      messages,
      usedTools,
      metadata: {
        iterations: meta.iterations,
        maxIterationsReached: meta.maxIterationsReached,
        error: meta.error,
      },
      usage: {
        tokensPrompt: meta.tokensPrompt,
        tokensCompletion: meta.tokensCompletion,
        totalTokens: meta.tokensPrompt + meta.tokensCompletion,
        costUsd: meta.costUsd,
        provider: meta.provider,
        model: meta.model,
        totalDurationMs: meta.totalDurationMs,
      },
    };
  }
}

/**
 * Create an LLM agent
 */
export function createAgent(
  ctx: AgentContext,
  config: {
    id: string;
    name: string;
    description?: string;
    llmConfig?: LLMAgentConfig;
  }
): LLMAgent {
  return new LLMAgent(
    ctx,
    config.id,
    config.name,
    config.description,
    config.llmConfig
  );
}

/**
 * Create a simple agent for quick prototyping
 */
export function createSimpleAgent(
  ctx: AgentContext,
  name: string,
  systemPrompt?: string
): LLMAgent {
  return new LLMAgent(ctx, name.toLowerCase().replace(/\s+/g, '_'), name, undefined, {
    systemPrompt,
  });
}
