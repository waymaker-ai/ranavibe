/**
 * Multi-Agent Orchestrator
 *
 * Coordinates multiple agents using various orchestration patterns.
 *
 * @example
 * ```typescript
 * const orchestrator = new AgentOrchestrator();
 *
 * // Register agents
 * orchestrator.registerAgent(researchAgent);
 * orchestrator.registerAgent(writerAgent);
 * orchestrator.registerAgent(reviewerAgent);
 *
 * // Execute task with pattern
 * const result = await orchestrator.executeTask(
 *   { taskId: '1', description: 'Write a blog post', input: { topic: 'AI' } },
 *   'sequential'
 * );
 * ```
 */

import { randomUUID } from 'crypto';
import {
  AgentIdentity,
  AgentMessage,
  AgentStatus,
  MessageType,
  TaskRequest,
  TaskResponse,
  OrchestrationPattern,
  OrchestrationConfig,
  SharedState,
  StateOperation,
  StateChange,
  HandoffRequest,
  HandoffResult,
  OrchestratorEvent,
  EventHandler,
  IOrchestrator,
  IOrchestratableAgent,
  PatternOptions,
} from './types';

// ============================================================================
// Agent Orchestrator
// ============================================================================

export class AgentOrchestrator implements IOrchestrator {
  private agents: Map<string, AgentEntry> = new Map();
  private tasks: Map<string, TaskEntry> = new Map();
  private state: SharedState;
  private eventHandlers: Set<EventHandler> = new Set();
  private stateSubscribers: Set<(state: SharedState) => void> = new Set();
  private running = false;

  constructor(initialState?: Record<string, unknown>) {
    this.state = {
      id: randomUUID(),
      version: 0,
      data: initialState || {},
      lastModified: new Date(),
      modifiedBy: 'system',
    };
  }

  // ============================================================================
  // Agent Management
  // ============================================================================

  async registerAgent(agent: AgentIdentity | IOrchestratableAgent): Promise<void> {
    const identity = 'identity' in agent ? agent.identity : agent;

    if (this.agents.has(identity.id)) {
      throw new Error(`Agent ${identity.id} is already registered`);
    }

    const entry: AgentEntry = {
      identity,
      agent: 'identity' in agent ? agent : undefined,
      status: 'idle',
      currentTask: undefined,
      messageQueue: [],
    };

    this.agents.set(identity.id, entry);

    // Call onRegister if agent implements interface
    if ('identity' in agent && agent.onRegister) {
      agent.onRegister(this);
    }

    this.emit({ type: 'agent_registered', agent: identity });
  }

  async unregisterAgent(agentId: string): Promise<void> {
    const entry = this.agents.get(agentId);
    if (!entry) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Call onUnregister if agent implements interface
    if (entry.agent?.onUnregister) {
      entry.agent.onUnregister();
    }

    this.agents.delete(agentId);
    this.emit({ type: 'agent_unregistered', agentId });
  }

  getAgent(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId)?.identity;
  }

  getAllAgents(): AgentIdentity[] {
    return Array.from(this.agents.values()).map(e => e.identity);
  }

  // ============================================================================
  // Task Execution
  // ============================================================================

  async executeTask(
    task: TaskRequest,
    pattern: OrchestrationPattern = 'sequential'
  ): Promise<TaskResponse> {
    const taskEntry: TaskEntry = {
      request: task,
      status: 'pending',
      startTime: new Date(),
      results: [],
    };

    this.tasks.set(task.taskId, taskEntry);

    try {
      let result: TaskResponse;

      switch (pattern) {
        case 'sequential':
          result = await this.executeSequential(task);
          break;
        case 'parallel':
          result = await this.executeParallel(task);
          break;
        case 'hierarchical':
          result = await this.executeHierarchical(task);
          break;
        case 'consensus':
          result = await this.executeConsensus(task);
          break;
        case 'pipeline':
          result = await this.executePipeline(task);
          break;
        case 'scatter-gather':
          result = await this.executeScatterGather(task);
          break;
        default:
          result = await this.executeSequential(task);
      }

      taskEntry.status = 'completed';
      taskEntry.endTime = new Date();
      taskEntry.results.push(result);

      return result;
    } catch (error) {
      taskEntry.status = 'failed';
      taskEntry.endTime = new Date();

      return {
        taskId: task.taskId,
        status: 'failure',
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sequential execution: Agents execute one after another
   */
  private async executeSequential(task: TaskRequest): Promise<TaskResponse> {
    const availableAgents = this.getAvailableAgents();

    if (availableAgents.length === 0) {
      throw new Error('No available agents');
    }

    let currentInput = task.input;
    let lastResponse: TaskResponse | undefined;

    for (const agent of availableAgents) {
      const agentTask: TaskRequest = {
        ...task,
        taskId: `${task.taskId}-${agent.id}`,
        input: currentInput,
      };

      this.emit({ type: 'task_started', taskId: agentTask.taskId, agentId: agent.id });

      const entry = this.agents.get(agent.id)!;
      entry.status = 'busy';
      entry.currentTask = agentTask.taskId;

      try {
        if (entry.agent?.handleTaskRequest) {
          lastResponse = await entry.agent.handleTaskRequest(agentTask);
        } else {
          // Simulate task execution for non-orchestratable agents
          lastResponse = {
            taskId: agentTask.taskId,
            status: 'success',
            output: { processed: true, by: agent.id, input: currentInput },
          };
        }

        currentInput = lastResponse.output;

        this.emit({
          type: 'task_completed',
          taskId: agentTask.taskId,
          agentId: agent.id,
          status: lastResponse.status,
        });
      } catch (error) {
        this.emit({
          type: 'task_failed',
          taskId: agentTask.taskId,
          agentId: agent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        entry.status = 'idle';
        entry.currentTask = undefined;
      }
    }

    return lastResponse || {
      taskId: task.taskId,
      status: 'failure',
      output: null,
      error: 'No agents processed the task',
    };
  }

  /**
   * Parallel execution: All agents execute simultaneously
   */
  private async executeParallel(task: TaskRequest): Promise<TaskResponse> {
    const availableAgents = this.getAvailableAgents();

    if (availableAgents.length === 0) {
      throw new Error('No available agents');
    }

    const promises = availableAgents.map(async (agent) => {
      const agentTask: TaskRequest = {
        ...task,
        taskId: `${task.taskId}-${agent.id}`,
      };

      const entry = this.agents.get(agent.id)!;
      entry.status = 'busy';
      entry.currentTask = agentTask.taskId;

      try {
        let response: TaskResponse;

        if (entry.agent?.handleTaskRequest) {
          response = await entry.agent.handleTaskRequest(agentTask);
        } else {
          response = {
            taskId: agentTask.taskId,
            status: 'success',
            output: { processed: true, by: agent.id },
          };
        }

        return { agent, response };
      } finally {
        entry.status = 'idle';
        entry.currentTask = undefined;
      }
    });

    const results = await Promise.allSettled(promises);

    const successful = results
      .filter((r): r is PromiseFulfilledResult<{ agent: AgentIdentity; response: TaskResponse }> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value);

    const outputs = successful.map(s => s.response.output);

    return {
      taskId: task.taskId,
      status: successful.length > 0 ? 'success' : 'failure',
      output: outputs,
    };
  }

  /**
   * Hierarchical execution: Coordinator delegates to workers
   */
  private async executeHierarchical(task: TaskRequest): Promise<TaskResponse> {
    const coordinators = this.getAgentsByType('coordinator');
    const workers = this.getAgentsByType('worker');

    if (coordinators.length === 0) {
      // Fall back to sequential if no coordinator
      return this.executeSequential(task);
    }

    const coordinator = coordinators[0];

    // Coordinator plans the work
    const subtasks = this.planSubtasks(task, workers);

    // Delegate to workers
    const results = await Promise.all(
      subtasks.map(async (subtask, i) => {
        const worker = workers[i % workers.length];
        const entry = this.agents.get(worker.id)!;

        entry.status = 'busy';
        try {
          if (entry.agent?.handleTaskRequest) {
            return await entry.agent.handleTaskRequest(subtask);
          }
          return {
            taskId: subtask.taskId,
            status: 'success' as const,
            output: { delegated: true, to: worker.id },
          };
        } finally {
          entry.status = 'idle';
        }
      })
    );

    // Aggregate results
    return {
      taskId: task.taskId,
      status: 'success',
      output: {
        coordinator: coordinator.id,
        subtasks: results.map(r => r.output),
      },
    };
  }

  /**
   * Consensus execution: Agents vote on the result
   */
  private async executeConsensus(task: TaskRequest): Promise<TaskResponse> {
    const availableAgents = this.getAvailableAgents();

    if (availableAgents.length < 2) {
      throw new Error('Consensus requires at least 2 agents');
    }

    // Get responses from all agents
    const responses = await Promise.all(
      availableAgents.map(async (agent) => {
        const entry = this.agents.get(agent.id)!;
        entry.status = 'busy';

        try {
          if (entry.agent?.handleTaskRequest) {
            return await entry.agent.handleTaskRequest(task);
          }
          return {
            taskId: task.taskId,
            status: 'success' as const,
            output: { vote: Math.random() > 0.5 ? 'yes' : 'no' },
          };
        } finally {
          entry.status = 'idle';
        }
      })
    );

    // Simple majority voting (can be extended)
    const votes = responses.map(r =>
      JSON.stringify(r.status === 'success' ? r.output : null)
    );

    const voteCount = new Map<string, number>();
    for (const vote of votes) {
      voteCount.set(vote, (voteCount.get(vote) || 0) + 1);
    }

    let maxVotes = 0;
    let consensusResult: string | null = null;

    for (const [vote, count] of voteCount) {
      if (count > maxVotes) {
        maxVotes = count;
        consensusResult = vote;
      }
    }

    const quorum = Math.ceil(availableAgents.length / 2);
    const consensusReached = maxVotes >= quorum;

    return {
      taskId: task.taskId,
      status: consensusReached ? 'success' : 'partial',
      output: {
        consensusReached,
        result: consensusResult ? JSON.parse(consensusResult) : null,
        votes: Object.fromEntries(voteCount),
        quorum,
      },
    };
  }

  /**
   * Pipeline execution: Stream data through agents
   */
  private async executePipeline(task: TaskRequest): Promise<TaskResponse> {
    // Pipeline is similar to sequential but optimized for streaming
    return this.executeSequential(task);
  }

  /**
   * Scatter-gather execution: Broadcast request, aggregate responses
   */
  private async executeScatterGather(task: TaskRequest): Promise<TaskResponse> {
    // Scatter-gather is similar to parallel with aggregation
    const result = await this.executeParallel(task);

    // Aggregate results
    const outputs = result.output as unknown[];
    const aggregated = {
      count: outputs.length,
      results: outputs,
      aggregatedAt: new Date().toISOString(),
    };

    return {
      ...result,
      output: aggregated,
    };
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
    }
  }

  getTaskStatus(taskId: string): TaskResponse | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    return task.results[task.results.length - 1];
  }

  // ============================================================================
  // Messaging
  // ============================================================================

  async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date(),
    };

    const recipients = Array.isArray(message.to) ? message.to : [message.to];

    for (const recipientId of recipients) {
      const entry = this.agents.get(recipientId);
      if (entry) {
        entry.messageQueue.push(fullMessage);

        // Deliver message to agent
        if (entry.agent?.handleMessage) {
          await entry.agent.handleMessage(fullMessage);
        }
      }
    }

    this.emit({ type: 'message_sent', message: fullMessage });
  }

  async broadcast(type: MessageType, payload: unknown): Promise<void> {
    const allAgentIds = Array.from(this.agents.keys());

    await this.sendMessage({
      type,
      from: 'orchestrator',
      to: allAgentIds,
      payload,
    });
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): SharedState {
    return { ...this.state };
  }

  async updateState(operation: StateOperation): Promise<void> {
    const previousValue = this.state.data[operation.key];
    let newValue: unknown;

    switch (operation.type) {
      case 'set':
        newValue = operation.value;
        this.state.data[operation.key] = newValue;
        break;

      case 'update':
        if (typeof previousValue === 'object' && typeof operation.value === 'object') {
          newValue = { ...previousValue as object, ...operation.value as object };
        } else {
          newValue = operation.value;
        }
        this.state.data[operation.key] = newValue;
        break;

      case 'delete':
        newValue = undefined;
        delete this.state.data[operation.key];
        break;

      case 'increment':
        const numValue = typeof previousValue === 'number' ? previousValue : 0;
        newValue = numValue + (typeof operation.value === 'number' ? operation.value : 1);
        this.state.data[operation.key] = newValue;
        break;

      case 'append':
        const arrayValue = Array.isArray(previousValue) ? previousValue : [];
        newValue = [...arrayValue, operation.value];
        this.state.data[operation.key] = newValue;
        break;
    }

    this.state.version++;
    this.state.lastModified = new Date();

    const change: StateChange = {
      operation,
      previousValue,
      newValue,
      timestamp: new Date(),
      agentId: 'orchestrator',
    };

    this.emit({ type: 'state_changed', change });
    this.notifyStateSubscribers();
  }

  subscribeToState(callback: (state: SharedState) => void): () => void {
    this.stateSubscribers.add(callback);
    return () => this.stateSubscribers.delete(callback);
  }

  private notifyStateSubscribers(): void {
    for (const subscriber of this.stateSubscribers) {
      subscriber(this.getState());
    }
  }

  // ============================================================================
  // Handoff
  // ============================================================================

  async requestHandoff(request: HandoffRequest): Promise<HandoffResult> {
    this.emit({ type: 'handoff_requested', request });

    let targetAgent: AgentEntry | undefined;

    if (request.toAgent === 'auto') {
      // Auto-select based on capability matching
      const candidates = this.getAgentsByCapability(request.reason);
      targetAgent = candidates[0] ? this.agents.get(candidates[0].id) : undefined;
    } else {
      targetAgent = this.agents.get(request.toAgent);
    }

    if (!targetAgent) {
      const result: HandoffResult = {
        success: false,
        rejectionReason: 'No suitable agent found',
      };
      this.emit({ type: 'handoff_completed', result });
      return result;
    }

    // Check if agent can accept
    if (targetAgent.agent?.canAcceptHandoff) {
      const canAccept = await targetAgent.agent.canAcceptHandoff(request);
      if (!canAccept) {
        const result: HandoffResult = {
          success: false,
          rejectionReason: 'Agent rejected handoff',
        };
        this.emit({ type: 'handoff_completed', result });
        return result;
      }
    }

    // Perform handoff
    if (targetAgent.agent?.acceptHandoff) {
      await targetAgent.agent.acceptHandoff(request);
    }

    const result: HandoffResult = {
      success: true,
      acceptedBy: targetAgent.identity.id,
      newTaskId: `${request.taskId}-handoff-${Date.now()}`,
    };

    this.emit({ type: 'handoff_completed', result });
    return result;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  on(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: OrchestratorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  async start(): Promise<void> {
    this.running = true;
    this.startHeartbeat();
  }

  async stop(): Promise<void> {
    this.running = false;

    // Unregister all agents
    for (const agentId of this.agents.keys()) {
      await this.unregisterAgent(agentId);
    }
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      if (!this.running) {
        clearInterval(interval);
        return;
      }

      this.broadcast('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000); // Every 30 seconds
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getAvailableAgents(): AgentIdentity[] {
    return Array.from(this.agents.values())
      .filter(e => e.status === 'idle')
      .map(e => e.identity);
  }

  private getAgentsByType(type: string): AgentIdentity[] {
    return Array.from(this.agents.values())
      .filter(e => e.identity.type === type)
      .map(e => e.identity);
  }

  private getAgentsByCapability(capability: string): AgentIdentity[] {
    return Array.from(this.agents.values())
      .filter(e => e.identity.capabilities.includes(capability))
      .map(e => e.identity);
  }

  private planSubtasks(task: TaskRequest, workers: AgentIdentity[]): TaskRequest[] {
    // Simple task splitting - can be made more sophisticated
    return workers.map((worker, i) => ({
      ...task,
      taskId: `${task.taskId}-subtask-${i}`,
      context: {
        ...task.context,
        parentTaskId: task.taskId,
        assignedTo: worker.id,
      },
    }));
  }
}

// ============================================================================
// Internal Types
// ============================================================================

interface AgentEntry {
  identity: AgentIdentity;
  agent?: IOrchestratableAgent;
  status: AgentStatus;
  currentTask?: string;
  messageQueue: AgentMessage[];
}

interface TaskEntry {
  request: TaskRequest;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  results: TaskResponse[];
}

// Export singleton factory
export function createOrchestrator(initialState?: Record<string, unknown>): AgentOrchestrator {
  return new AgentOrchestrator(initialState);
}
