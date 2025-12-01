/**
 * Agent Debugger Module
 * Step-through debugging, visualization, and time travel for agents
 *
 * @example
 * ```typescript
 * import { createAgentDebugger, debug } from '@rana/core';
 *
 * // Quick start with global debugger
 * const session = debug('MyAgent');
 *
 * // Or create a custom debugger
 * const debugger = createAgentDebugger({
 *   enabled: true,
 *   autoSnapshot: true,
 *   logToConsole: true,
 *   onBreakpoint: async (bp, event) => {
 *     console.log('Breakpoint hit:', bp.id);
 *     return 'step'; // or 'run', 'stop', etc.
 *   },
 * });
 *
 * // Start session
 * const session = debugger.startSession('MyAgent');
 *
 * // Add breakpoints
 * debugger.addBreakpoint(session, {
 *   type: 'tool-call',
 *   toolName: 'web_search',
 * });
 *
 * // Record events during agent execution
 * debugger.recordLLMRequest(session, 'anthropic', 'claude-3-5-sonnet', messages);
 * debugger.recordLLMResponse(session, 'anthropic', 'claude-3-5-sonnet', content, usage, latency);
 * debugger.recordToolCall(session, 'web_search', 'call-123', { query: 'test' });
 *
 * // Visualize
 * const tree = debugger.buildDecisionTree(session);
 * const tokens = debugger.getTokenBreakdown(session);
 *
 * // Time travel
 * debugger.goToStep(session, 5);
 * debugger.goBack(session);
 *
 * // Replay
 * for await (const event of debugger.replay(session, { speed: 2 })) {
 *   console.log(event.type);
 * }
 * ```
 */

// Debugger
export {
  AgentDebugger,
  createAgentDebugger,
  getGlobalDebugger,
  setGlobalDebugger,
  debug,
} from './debugger';

// Types
export type {
  // Event types
  DebugEventType,
  DebugEvent,
  LLMRequestEvent,
  LLMResponseEvent,
  ToolCallEvent,
  ToolResultEvent,
  ThinkingEvent,
  StateChangeEvent,
  ErrorEvent,

  // Mode & breakpoint types
  DebugMode,
  BreakpointType,
  Breakpoint,

  // Session types
  DebugSession,
  StateSnapshot,

  // Visualization types
  DecisionNode,
  DecisionTree,
  TokenBreakdown,

  // Time travel types
  TimeTravelState,
  ReplayOptions,

  // Configuration types
  AgentDebuggerConfig,
  DebugStorageAdapter,

  // Command types
  DebugCommand,
  DebugCommandResult,
} from './types';
