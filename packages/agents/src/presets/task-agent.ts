/**
 * @rana/agents - Task Agent
 * Agent for executing structured tasks with tools
 */

import { LLMAgent } from '../llm-agent';
import { AgentContext, LLMAgentConfig } from '../types';

/**
 * Task execution agent with structured output
 *
 * @example
 * ```typescript
 * const agent = createTaskAgent(ctx, {
 *   task: 'Extract customer information from the provided text',
 *   outputSchema: {
 *     type: 'object',
 *     properties: {
 *       name: { type: 'string' },
 *       email: { type: 'string' },
 *     },
 *   },
 * });
 * ```
 */
export class TaskAgent extends LLMAgent {
  private taskDescription: string;
  private outputSchema?: Record<string, any>;

  constructor(
    ctx: AgentContext,
    config: {
      id?: string;
      name?: string;
      task: string;
      outputSchema?: Record<string, any>;
      llmConfig?: LLMAgentConfig;
    }
  ) {
    super(
      ctx,
      config.id || 'task_agent',
      config.name || 'Task Agent',
      `Executes task: ${config.task}`,
      {
        ...config.llmConfig,
        systemPrompt: buildTaskSystemPrompt(config.task, config.outputSchema),
      }
    );
    this.taskDescription = config.task;
    this.outputSchema = config.outputSchema;
  }
}

function buildTaskSystemPrompt(
  task: string,
  outputSchema?: Record<string, any>
): string {
  const parts = [
    'You are a task execution agent. Your job is to complete the following task:',
    '',
    task,
    '',
    'Follow these guidelines:',
    '1. Focus only on completing the specified task',
    '2. Use available tools when necessary',
    '3. Provide clear, structured output',
    '4. If you cannot complete the task, explain why',
  ];

  if (outputSchema) {
    parts.push('');
    parts.push('Your output must conform to this schema:');
    parts.push('```json');
    parts.push(JSON.stringify(outputSchema, null, 2));
    parts.push('```');
  }

  return parts.join('\n');
}

/**
 * Create a task agent
 */
export function createTaskAgent(
  ctx: AgentContext,
  config: {
    id?: string;
    name?: string;
    task: string;
    outputSchema?: Record<string, any>;
    llmConfig?: LLMAgentConfig;
  }
): TaskAgent {
  return new TaskAgent(ctx, config);
}
