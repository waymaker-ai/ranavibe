/**
 * @rana/agents - Core Types
 * Agent Development Kit (ADK) for RANA Framework
 */

// Re-export RanaClient type for convenience
export type { RanaClient, RanaChatRequest, RanaChatResponse } from '@rana/core';

/**
 * User identity for authentication and authorization
 */
export interface UserIdentity {
  id: string;
  orgId: string;
  roles: string[];
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Vibe configuration - defines agent personality and constraints
 */
export interface VibeConfig {
  id: string;
  name: string;
  description?: string;
  tone?: string;
  constraints?: string[];
  allowedActions?: string[];
  disallowedActions?: string[];
}

/**
 * Context passed to tool execution
 */
export interface ToolContext {
  user: UserIdentity;
  orgId: string;
  agentId?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool input - flexible key-value pairs
 */
export interface ToolInput {
  [key: string]: any;
}

/**
 * Result from tool execution
 */
export interface ToolResult {
  ok: boolean;
  data?: any;
  error?: string;
  metadata?: {
    durationMs?: number;
    cached?: boolean;
  };
}

/**
 * Tool definition with safety metadata
 */
export interface Tool {
  /** Unique tool name */
  name: string;
  /** Human-readable description */
  description: string;
  /** JSON Schema for input validation */
  inputSchema?: Record<string, any>;
  /** Whether tool requires authentication */
  requiresAuth?: boolean;
  /** Whether tool has side effects (non-idempotent) */
  sideEffects?: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  /** Allowed roles for this tool */
  allowedRoles?: string[];
  /** Execute the tool */
  run(input: ToolInput, ctx: ToolContext): Promise<ToolResult>;
}

/**
 * Memory store interface for agent state persistence
 */
export interface MemoryStore {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  append?(key: string, value: any): Promise<void>;
  delete?(key: string): Promise<void>;
  list?(prefix: string): Promise<string[]>;
}

/**
 * Agent message in conversation history
 */
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCallRecord[];
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Record of a tool call
 */
export interface ToolCallRecord {
  id?: string;
  tool: string;
  input: ToolInput;
  result: ToolResult;
  durationMs: number;
}

/**
 * Input to an agent
 */
export interface AgentInput {
  /** Optional unique ID for this interaction */
  id?: string;
  /** User making the request */
  user: UserIdentity;
  /** User's message */
  message: string;
  /** Additional context */
  context?: Record<string, any>;
  /** Conversation history */
  conversationHistory?: AgentMessage[];
  /** Stream response */
  stream?: boolean;
}

/**
 * Output from an agent
 */
export interface AgentOutput {
  /** Unique ID for this response */
  id: string;
  /** Messages generated */
  messages: AgentMessage[];
  /** Tools that were used */
  usedTools?: ToolCallRecord[];
  /** Citations from RAG */
  citations?: Citation[];
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Token usage and cost */
  usage?: AgentUsage;
}

/**
 * Citation from RAG retrieval
 */
export interface Citation {
  chunkId: string;
  documentId: string;
  score: number;
  snippet: string;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Token usage and cost tracking
 */
export interface AgentUsage {
  tokensPrompt: number;
  tokensCompletion: number;
  totalTokens: number;
  costUsd: number;
  provider: string;
  model: string;
  totalDurationMs: number;
}

/**
 * Agent context - everything an agent needs to operate
 */
export interface AgentContext {
  /** RANA client for LLM calls */
  rana: any; // RanaClient - using any to avoid circular deps
  /** Optional RAG client */
  rag?: any; // RAGClient
  /** Available tools */
  tools: Tool[];
  /** Optional memory store */
  memory?: MemoryStore;
  /** Vibe configuration */
  vibe?: VibeConfig;
  /** Current user */
  user: UserIdentity;
  /** Logger function */
  logger?: AgentLogger;
}

/**
 * Agent logger function
 */
export type AgentLogger = (event: string, payload: Record<string, any>) => void;

/**
 * Agent event types for observability
 */
export type AgentEventType =
  | 'agent:start'
  | 'agent:end'
  | 'agent:error'
  | 'llm:request'
  | 'llm:response'
  | 'tool:call'
  | 'tool:result'
  | 'rag:query'
  | 'rag:result';

/**
 * Agent event for observability
 */
export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  timestamp: Date;
  payload: Record<string, any>;
}

/**
 * LLM Agent configuration
 */
export interface LLMAgentConfig {
  /** Maximum tool call iterations */
  maxIterations?: number;
  /** LLM provider to use */
  provider?: string;
  /** Model to use */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Max tokens for response */
  maxTokens?: number;
  /** System prompt override */
  systemPrompt?: string;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Agent registration for orchestrator
 */
export interface AgentRegistration {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  agent: BaseAgent;
}

/**
 * Task result from orchestrator
 */
export interface TaskResult {
  agentId: string;
  taskId: string;
  success: boolean;
  output?: AgentOutput;
  error?: string;
  durationMs: number;
}

// Forward declaration for BaseAgent
export interface BaseAgent {
  id: string;
  name: string;
  description?: string;
  handle(input: AgentInput): Promise<AgentOutput>;
}
