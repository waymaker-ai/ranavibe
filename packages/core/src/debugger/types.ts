/**
 * Agent Debugger Types
 * Step-through debugging, visualization, and time travel for agents
 */

import type { LLMProvider, Message, ToolCall } from '../types';
import type { AgentState, Tool, ToolResult } from '../agents';

// ============================================================================
// Debug Session Types
// ============================================================================

export type DebugEventType =
  | 'session-start'
  | 'session-end'
  | 'step-start'
  | 'step-end'
  | 'tool-call'
  | 'tool-result'
  | 'llm-request'
  | 'llm-response'
  | 'thinking'
  | 'error'
  | 'breakpoint-hit'
  | 'state-change'
  | 'memory-update'
  | 'user-input'
  | 'agent-output';

export type DebugMode = 'run' | 'step' | 'step-over' | 'step-into' | 'pause' | 'stop';

export type BreakpointType =
  | 'tool-call'      // Break before tool execution
  | 'tool-result'    // Break after tool execution
  | 'llm-request'    // Break before LLM call
  | 'llm-response'   // Break after LLM response
  | 'step'           // Break at each step
  | 'condition'      // Break on condition
  | 'error';         // Break on error

// ============================================================================
// Debug Event Types
// ============================================================================

export interface DebugEvent {
  /** Unique event ID */
  id: string;
  /** Session ID */
  sessionId: string;
  /** Event type */
  type: DebugEventType;
  /** Timestamp */
  timestamp: Date;
  /** Step number */
  step: number;
  /** Event data */
  data: Record<string, any>;
  /** Duration in ms (for completed events) */
  duration?: number;
  /** Parent event ID (for nested events) */
  parentId?: string;
  /** Stack trace */
  stack?: string[];
}

export interface LLMRequestEvent extends DebugEvent {
  type: 'llm-request';
  data: {
    provider: LLMProvider;
    model: string;
    messages: Message[];
    tools?: any[];
    temperature?: number;
    maxTokens?: number;
    estimatedInputTokens: number;
  };
}

export interface LLMResponseEvent extends DebugEvent {
  type: 'llm-response';
  data: {
    provider: LLMProvider;
    model: string;
    content: string;
    toolCalls?: ToolCall[];
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    finishReason: string;
  };
}

export interface ToolCallEvent extends DebugEvent {
  type: 'tool-call';
  data: {
    toolName: string;
    toolId: string;
    arguments: Record<string, any>;
    schema?: any;
  };
}

export interface ToolResultEvent extends DebugEvent {
  type: 'tool-result';
  data: {
    toolName: string;
    toolId: string;
    result: any;
    success: boolean;
    error?: string;
    duration: number;
  };
}

export interface ThinkingEvent extends DebugEvent {
  type: 'thinking';
  data: {
    thought: string;
    reasoning?: string;
    nextAction?: string;
  };
}

export interface StateChangeEvent extends DebugEvent {
  type: 'state-change';
  data: {
    previousState: Partial<AgentState>;
    newState: Partial<AgentState>;
    changedFields: string[];
  };
}

export interface ErrorEvent extends DebugEvent {
  type: 'error';
  data: {
    error: string;
    code?: string;
    recoverable: boolean;
    stack?: string;
    context: Record<string, any>;
  };
}

// ============================================================================
// Breakpoint Types
// ============================================================================

export interface Breakpoint {
  /** Unique breakpoint ID */
  id: string;
  /** Breakpoint type */
  type: BreakpointType;
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Condition for conditional breakpoints */
  condition?: (event: DebugEvent, state: AgentState) => boolean;
  /** Tool name filter (for tool breakpoints) */
  toolName?: string;
  /** Step number (for step breakpoints) */
  stepNumber?: number;
  /** Hit count */
  hitCount: number;
  /** Max hits before auto-disable (0 = unlimited) */
  maxHits?: number;
  /** Log message (for logpoints) */
  logMessage?: string;
}

// ============================================================================
// Debug Session Types
// ============================================================================

export interface DebugSession {
  /** Session ID */
  id: string;
  /** Agent name */
  agentName: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Current step */
  currentStep: number;
  /** Debug mode */
  mode: DebugMode;
  /** Events recorded */
  events: DebugEvent[];
  /** Breakpoints */
  breakpoints: Breakpoint[];
  /** Agent state snapshots (for time travel) */
  stateSnapshots: StateSnapshot[];
  /** Total cost */
  totalCost: number;
  /** Total tokens */
  totalTokens: { input: number; output: number };
  /** Metadata */
  metadata: Record<string, any>;
}

export interface StateSnapshot {
  /** Snapshot ID */
  id: string;
  /** Step number */
  step: number;
  /** Timestamp */
  timestamp: Date;
  /** Agent state */
  state: AgentState;
  /** Event ID that triggered this snapshot */
  eventId: string;
  /** Checksum for integrity */
  checksum: string;
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface DecisionNode {
  /** Node ID */
  id: string;
  /** Node type */
  type: 'start' | 'llm' | 'tool' | 'decision' | 'end' | 'error';
  /** Node label */
  label: string;
  /** Step number */
  step: number;
  /** Timestamp */
  timestamp: Date;
  /** Duration */
  duration?: number;
  /** Cost */
  cost?: number;
  /** Children node IDs */
  children: string[];
  /** Parent node ID */
  parent?: string;
  /** Associated event ID */
  eventId: string;
  /** Node data */
  data: Record<string, any>;
  /** Visual position (x, y) */
  position?: { x: number; y: number };
}

export interface DecisionTree {
  /** Session ID */
  sessionId: string;
  /** Root node ID */
  rootId: string;
  /** All nodes */
  nodes: Map<string, DecisionNode>;
  /** Total steps */
  totalSteps: number;
  /** Total cost */
  totalCost: number;
  /** Total duration */
  totalDuration: number;
}

export interface TokenBreakdown {
  /** By step */
  byStep: Array<{
    step: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    model: string;
  }>;
  /** By tool */
  byTool: Record<string, {
    calls: number;
    totalTokens: number;
    totalCost: number;
  }>;
  /** By model */
  byModel: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  }>;
  /** Cumulative */
  cumulative: Array<{
    step: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  }>;
}

// ============================================================================
// Time Travel Types
// ============================================================================

export interface TimeTravelState {
  /** Current position in history */
  position: number;
  /** Total positions */
  total: number;
  /** Can go back */
  canGoBack: boolean;
  /** Can go forward */
  canGoForward: boolean;
  /** Current snapshot */
  currentSnapshot: StateSnapshot | null;
}

export interface ReplayOptions {
  /** Speed multiplier (1 = real-time, 2 = 2x speed) */
  speed: number;
  /** Start from step */
  startStep?: number;
  /** End at step */
  endStep?: number;
  /** Pause at breakpoints */
  pauseAtBreakpoints: boolean;
  /** Emit events */
  emitEvents: boolean;
}

// ============================================================================
// Debugger Configuration
// ============================================================================

export interface AgentDebuggerConfig {
  /** Enable debugging (affects performance) */
  enabled: boolean;
  /** Auto-snapshot on each step */
  autoSnapshot: boolean;
  /** Max events to keep in memory */
  maxEvents: number;
  /** Max snapshots to keep */
  maxSnapshots: number;
  /** Persist sessions to storage */
  persist: boolean;
  /** Storage adapter */
  storage?: DebugStorageAdapter;
  /** Default breakpoints */
  defaultBreakpoints?: Partial<Breakpoint>[];
  /** Event filters (which events to record) */
  eventFilter?: DebugEventType[];
  /** Pretty print events */
  prettyPrint: boolean;
  /** Log to console */
  logToConsole: boolean;
  /** Callback on breakpoint hit */
  onBreakpoint?: (breakpoint: Breakpoint, event: DebugEvent) => Promise<DebugMode>;
  /** Callback on event */
  onEvent?: (event: DebugEvent) => void;
}

export interface DebugStorageAdapter {
  /** Save session */
  saveSession(session: DebugSession): Promise<void>;
  /** Load session */
  loadSession(sessionId: string): Promise<DebugSession | null>;
  /** List sessions */
  listSessions(options?: { limit?: number; offset?: number }): Promise<string[]>;
  /** Delete session */
  deleteSession(sessionId: string): Promise<void>;
  /** Save snapshot */
  saveSnapshot(snapshot: StateSnapshot): Promise<void>;
  /** Load snapshot */
  loadSnapshot(snapshotId: string): Promise<StateSnapshot | null>;
}

// ============================================================================
// Debug Commands
// ============================================================================

export type DebugCommand =
  | { type: 'continue' }
  | { type: 'step' }
  | { type: 'step-over' }
  | { type: 'step-into' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'restart' }
  | { type: 'goto'; step: number }
  | { type: 'set-breakpoint'; breakpoint: Partial<Breakpoint> }
  | { type: 'remove-breakpoint'; id: string }
  | { type: 'toggle-breakpoint'; id: string }
  | { type: 'inspect'; target: 'state' | 'events' | 'tokens' | 'tree' }
  | { type: 'eval'; expression: string };

export interface DebugCommandResult {
  /** Command executed */
  command: DebugCommand;
  /** Success */
  success: boolean;
  /** Result data */
  data?: any;
  /** Error message */
  error?: string;
  /** Current mode after command */
  mode: DebugMode;
  /** Current step after command */
  step: number;
}
