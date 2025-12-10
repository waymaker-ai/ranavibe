/**
 * Multi-Agent Orchestration Module
 *
 * Provides tools for coordinating multiple AI agents including:
 * - Agent registration and management
 * - Message passing between agents
 * - Orchestration patterns (sequential, parallel, hierarchical, consensus)
 * - Shared state management with transactions
 * - Task handoff and delegation
 *
 * @example
 * ```typescript
 * import {
 *   AgentOrchestrator,
 *   SharedStateManager,
 *   createOrchestrator,
 * } from '@rana/agents/orchestration';
 *
 * // Create orchestrator
 * const orchestrator = createOrchestrator({
 *   taskCount: 0,
 * });
 *
 * // Register agents
 * await orchestrator.registerAgent({
 *   id: 'researcher',
 *   name: 'Research Agent',
 *   type: 'specialist',
 *   capabilities: ['research', 'summarize'],
 *   version: '1.0.0',
 *   status: 'idle',
 * });
 *
 * await orchestrator.registerAgent({
 *   id: 'writer',
 *   name: 'Writer Agent',
 *   type: 'specialist',
 *   capabilities: ['write', 'edit'],
 *   version: '1.0.0',
 *   status: 'idle',
 * });
 *
 * // Execute task with orchestration pattern
 * const result = await orchestrator.executeTask(
 *   {
 *     taskId: 'blog-post-1',
 *     description: 'Write a blog post about AI',
 *     input: { topic: 'AI in healthcare' },
 *   },
 *   'sequential' // or 'parallel', 'hierarchical', 'consensus'
 * );
 *
 * // Listen for events
 * orchestrator.on((event) => {
 *   console.log('Event:', event.type);
 * });
 *
 * // Update shared state
 * await orchestrator.updateState({
 *   type: 'increment',
 *   key: 'taskCount',
 *   value: 1,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Export types
export type {
  AgentIdentity,
  AgentType,
  AgentStatus,
  AgentMessage,
  MessageType,
  MessagePriority,
  TaskRequest,
  TaskResponse,
  TaskContext,
  TaskConstraints,
  TaskMetrics,
  OrchestrationPattern,
  OrchestrationConfig,
  PatternOptions,
  RetryPolicy,
  SharedState,
  StateLock,
  StateOperation,
  StateChange,
  HandoffRequest,
  HandoffReason,
  HandoffResult,
  OrchestratorEvent,
  EventHandler,
  IOrchestrator,
  IOrchestratableAgent,
} from './types';

// Export orchestrator
export {
  AgentOrchestrator,
  createOrchestrator,
} from './orchestrator';

// Export state manager
export {
  SharedStateManager,
  createStateManager,
} from './state-manager';

export type {
  StateSnapshot,
  StateSubscriber,
  TransactionContext,
  LockInfo,
} from './state-manager';

// ============================================================================
// Convenience Factories
// ============================================================================

import { AgentOrchestrator, createOrchestrator } from './orchestrator';
import { SharedStateManager, createStateManager } from './state-manager';
import type { AgentIdentity, TaskRequest, OrchestrationPattern } from './types';

/**
 * Create a simple agent pipeline
 */
export function createPipeline(
  agents: AgentIdentity[],
  initialState?: Record<string, unknown>
): {
  orchestrator: AgentOrchestrator;
  execute: (task: TaskRequest) => Promise<unknown>;
} {
  const orchestrator = createOrchestrator(initialState);

  // Register all agents
  for (const agent of agents) {
    orchestrator.registerAgent(agent);
  }

  return {
    orchestrator,
    execute: async (task: TaskRequest) => {
      const result = await orchestrator.executeTask(task, 'sequential');
      return result.output;
    },
  };
}

/**
 * Create a parallel worker pool
 */
export function createWorkerPool(
  workers: AgentIdentity[],
  options?: {
    maxConcurrent?: number;
    timeout?: number;
  }
): {
  orchestrator: AgentOrchestrator;
  execute: (tasks: TaskRequest[]) => Promise<unknown[]>;
} {
  const orchestrator = createOrchestrator();

  // Register all workers
  for (const worker of workers) {
    orchestrator.registerAgent({ ...worker, type: 'worker' });
  }

  return {
    orchestrator,
    execute: async (tasks: TaskRequest[]) => {
      const results = await Promise.all(
        tasks.map(task => orchestrator.executeTask(task, 'parallel'))
      );
      return results.map(r => r.output);
    },
  };
}

/**
 * Create a hierarchical team structure
 */
export function createTeam(config: {
  coordinator: AgentIdentity;
  workers: AgentIdentity[];
  validators?: AgentIdentity[];
}): {
  orchestrator: AgentOrchestrator;
  execute: (task: TaskRequest) => Promise<unknown>;
} {
  const orchestrator = createOrchestrator();

  // Register coordinator
  orchestrator.registerAgent({ ...config.coordinator, type: 'coordinator' });

  // Register workers
  for (const worker of config.workers) {
    orchestrator.registerAgent({ ...worker, type: 'worker' });
  }

  // Register validators
  for (const validator of config.validators || []) {
    orchestrator.registerAgent({ ...validator, type: 'validator' });
  }

  return {
    orchestrator,
    execute: async (task: TaskRequest) => {
      const result = await orchestrator.executeTask(task, 'hierarchical');
      return result.output;
    },
  };
}

/**
 * Create a consensus group
 */
export function createConsensusGroup(
  agents: AgentIdentity[],
  options?: {
    quorum?: number;
    votingStrategy?: 'majority' | 'unanimous' | 'weighted';
  }
): {
  orchestrator: AgentOrchestrator;
  vote: (task: TaskRequest) => Promise<{
    consensusReached: boolean;
    result: unknown;
    votes: Record<string, number>;
  }>;
} {
  const orchestrator = createOrchestrator();

  // Register all agents
  for (const agent of agents) {
    orchestrator.registerAgent(agent);
  }

  return {
    orchestrator,
    vote: async (task: TaskRequest) => {
      const result = await orchestrator.executeTask(task, 'consensus');
      return result.output as {
        consensusReached: boolean;
        result: unknown;
        votes: Record<string, number>;
      };
    },
  };
}
