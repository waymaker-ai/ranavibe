/**
 * Multi-Agent Orchestration Types
 *
 * Types for agent communication, coordination, and orchestration patterns.
 */

// ============================================================================
// Agent Identity & Registration
// ============================================================================

export interface AgentIdentity {
  id: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  version: string;
  status: AgentStatus;
  metadata?: Record<string, unknown>;
}

export type AgentType =
  | 'coordinator'
  | 'worker'
  | 'specialist'
  | 'validator'
  | 'router'
  | 'custom';

export type AgentStatus =
  | 'idle'
  | 'busy'
  | 'waiting'
  | 'error'
  | 'offline';

// ============================================================================
// Message Types
// ============================================================================

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string;
  to: string | string[];
  payload: unknown;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
  priority?: MessagePriority;
  ttl?: number;
}

export type MessageType =
  | 'request'
  | 'response'
  | 'broadcast'
  | 'notification'
  | 'heartbeat'
  | 'error'
  | 'handoff'
  | 'complete';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TaskRequest {
  taskId: string;
  description: string;
  input: unknown;
  context?: TaskContext;
  constraints?: TaskConstraints;
  timeout?: number;
}

export interface TaskResponse {
  taskId: string;
  status: 'success' | 'failure' | 'partial';
  output: unknown;
  error?: string;
  metrics?: TaskMetrics;
}

export interface TaskContext {
  parentTaskId?: string;
  conversationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskConstraints {
  maxDuration?: number;
  maxCost?: number;
  maxTokens?: number;
  requiredCapabilities?: string[];
}

export interface TaskMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  tokensUsed?: number;
  cost?: number;
  retryCount?: number;
}

// ============================================================================
// Orchestration Patterns
// ============================================================================

export type OrchestrationPattern =
  | 'sequential'
  | 'parallel'
  | 'hierarchical'
  | 'consensus'
  | 'pipeline'
  | 'scatter-gather'
  | 'saga';

export interface OrchestrationConfig {
  pattern: OrchestrationPattern;
  agents: string[];
  options?: PatternOptions;
}

export interface PatternOptions {
  // Sequential options
  stopOnError?: boolean;
  passOutputToNext?: boolean;

  // Parallel options
  waitForAll?: boolean;
  minSuccess?: number;
  timeout?: number;

  // Hierarchical options
  maxDepth?: number;
  delegationStrategy?: 'round-robin' | 'least-busy' | 'capability-match';

  // Consensus options
  quorum?: number;
  votingStrategy?: 'majority' | 'unanimous' | 'weighted';

  // Pipeline options
  batchSize?: number;
  bufferSize?: number;

  // Scatter-gather options
  aggregationStrategy?: 'merge' | 'first' | 'best';

  // Saga options
  compensationEnabled?: boolean;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

// ============================================================================
// State Management
// ============================================================================

export interface SharedState {
  id: string;
  version: number;
  data: Record<string, unknown>;
  lastModified: Date;
  modifiedBy: string;
  locks?: StateLock[];
}

export interface StateLock {
  key: string;
  heldBy: string;
  acquiredAt: Date;
  expiresAt?: Date;
}

export interface StateOperation {
  type: 'set' | 'update' | 'delete' | 'increment' | 'append';
  key: string;
  value?: unknown;
  expectedVersion?: number;
}

export interface StateChange {
  operation: StateOperation;
  previousValue: unknown;
  newValue: unknown;
  timestamp: Date;
  agentId: string;
}

// ============================================================================
// Handoff & Delegation
// ============================================================================

export interface HandoffRequest {
  taskId: string;
  fromAgent: string;
  toAgent: string | 'auto';
  reason: HandoffReason;
  context: unknown;
  state?: unknown;
  priority?: MessagePriority;
}

export type HandoffReason =
  | 'capability_mismatch'
  | 'workload_balance'
  | 'escalation'
  | 'specialization'
  | 'error_recovery'
  | 'user_request';

export interface HandoffResult {
  success: boolean;
  acceptedBy?: string;
  rejectionReason?: string;
  newTaskId?: string;
}

// ============================================================================
// Events
// ============================================================================

export type OrchestratorEvent =
  | { type: 'agent_registered'; agent: AgentIdentity }
  | { type: 'agent_unregistered'; agentId: string }
  | { type: 'task_started'; taskId: string; agentId: string }
  | { type: 'task_completed'; taskId: string; agentId: string; status: string }
  | { type: 'task_failed'; taskId: string; agentId: string; error: string }
  | { type: 'handoff_requested'; request: HandoffRequest }
  | { type: 'handoff_completed'; result: HandoffResult }
  | { type: 'state_changed'; change: StateChange }
  | { type: 'message_sent'; message: AgentMessage }
  | { type: 'error'; error: string; context?: unknown };

export type EventHandler = (event: OrchestratorEvent) => void | Promise<void>;

// ============================================================================
// Orchestrator Interface
// ============================================================================

export interface IOrchestrator {
  // Agent management
  registerAgent(agent: AgentIdentity): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): AgentIdentity | undefined;
  getAllAgents(): AgentIdentity[];

  // Task execution
  executeTask(task: TaskRequest, pattern?: OrchestrationPattern): Promise<TaskResponse>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): TaskResponse | undefined;

  // Messaging
  sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void>;
  broadcast(type: MessageType, payload: unknown): Promise<void>;

  // State management
  getState(): SharedState;
  updateState(operation: StateOperation): Promise<void>;
  subscribeToState(callback: (state: SharedState) => void): () => void;

  // Event handling
  on(handler: EventHandler): () => void;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}

// ============================================================================
// Agent Interface for Orchestration
// ============================================================================

export interface IOrchestratableAgent {
  identity: AgentIdentity;

  // Message handling
  handleMessage(message: AgentMessage): Promise<void>;
  handleTaskRequest(request: TaskRequest): Promise<TaskResponse>;

  // Handoff
  canAcceptHandoff(request: HandoffRequest): Promise<boolean>;
  acceptHandoff(request: HandoffRequest): Promise<void>;

  // Lifecycle
  onRegister(orchestrator: IOrchestrator): void;
  onUnregister(): void;
}
