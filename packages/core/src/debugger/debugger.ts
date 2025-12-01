/**
 * Agent Debugger Implementation
 * Step-through debugging, visualization, and time travel for agents
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import type { AgentState, Tool, ToolResult } from '../agents';
import type { LLMProvider, Message } from '../types';
import type {
  AgentDebuggerConfig,
  DebugSession,
  DebugEvent,
  DebugEventType,
  DebugMode,
  Breakpoint,
  BreakpointType,
  StateSnapshot,
  DecisionTree,
  DecisionNode,
  TokenBreakdown,
  TimeTravelState,
  ReplayOptions,
  DebugCommand,
  DebugCommandResult,
  LLMRequestEvent,
  LLMResponseEvent,
  ToolCallEvent,
  ToolResultEvent,
  ThinkingEvent,
  StateChangeEvent,
  ErrorEvent,
  DebugStorageAdapter,
} from './types';

// ============================================================================
// In-Memory Storage Adapter
// ============================================================================

class InMemoryDebugStorage implements DebugStorageAdapter {
  private sessions: Map<string, DebugSession> = new Map();
  private snapshots: Map<string, StateSnapshot> = new Map();

  async saveSession(session: DebugSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async loadSession(sessionId: string): Promise<DebugSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async listSessions(options?: { limit?: number; offset?: number }): Promise<string[]> {
    const ids = Array.from(this.sessions.keys());
    const offset = options?.offset || 0;
    const limit = options?.limit || ids.length;
    return ids.slice(offset, offset + limit);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async saveSnapshot(snapshot: StateSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async loadSnapshot(snapshotId: string): Promise<StateSnapshot | null> {
    return this.snapshots.get(snapshotId) || null;
  }
}

// ============================================================================
// Agent Debugger Implementation
// ============================================================================

export class AgentDebugger extends EventEmitter {
  private config: AgentDebuggerConfig;
  private storage: DebugStorageAdapter;
  private sessions: Map<string, DebugSession> = new Map();
  private activeSession: DebugSession | null = null;
  private isPaused: boolean = false;
  private pausePromise: Promise<DebugMode> | null = null;
  private pauseResolve: ((mode: DebugMode) => void) | null = null;
  private eventCounter: number = 0;
  private breakpointCounter: number = 0;

  constructor(config?: Partial<AgentDebuggerConfig>) {
    super();
    this.config = this.normalizeConfig(config || {});
    this.storage = this.config.storage || new InMemoryDebugStorage();
  }

  private normalizeConfig(config: Partial<AgentDebuggerConfig>): AgentDebuggerConfig {
    return {
      enabled: config.enabled ?? true,
      autoSnapshot: config.autoSnapshot ?? true,
      maxEvents: config.maxEvents ?? 10000,
      maxSnapshots: config.maxSnapshots ?? 100,
      persist: config.persist ?? false,
      prettyPrint: config.prettyPrint ?? false,
      logToConsole: config.logToConsole ?? false,
      ...config,
    };
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Start a new debug session
   */
  startSession(agentName: string, metadata?: Record<string, any>): DebugSession {
    const session: DebugSession = {
      id: `debug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentName,
      startTime: new Date(),
      currentStep: 0,
      mode: 'run',
      events: [],
      breakpoints: [],
      stateSnapshots: [],
      totalCost: 0,
      totalTokens: { input: 0, output: 0 },
      metadata: metadata || {},
    };

    // Add default breakpoints
    if (this.config.defaultBreakpoints) {
      for (const bp of this.config.defaultBreakpoints) {
        this.addBreakpoint(session, bp);
      }
    }

    this.sessions.set(session.id, session);
    this.activeSession = session;

    this.recordEvent(session, 'session-start', {
      agentName,
      metadata,
    });

    this.emit('session-start', session);

    if (this.config.logToConsole) {
      console.log(`[DEBUG] Session started: ${session.id}`);
    }

    return session;
  }

  /**
   * End the current session
   */
  endSession(sessionId?: string): void {
    const session = sessionId
      ? this.sessions.get(sessionId)
      : this.activeSession;

    if (!session) return;

    session.endTime = new Date();
    session.mode = 'stop';

    this.recordEvent(session, 'session-end', {
      duration: session.endTime.getTime() - session.startTime.getTime(),
      totalSteps: session.currentStep,
      totalCost: session.totalCost,
      totalTokens: session.totalTokens,
    });

    if (this.config.persist) {
      this.storage.saveSession(session);
    }

    this.emit('session-end', session);

    if (session === this.activeSession) {
      this.activeSession = null;
    }

    if (this.config.logToConsole) {
      console.log(`[DEBUG] Session ended: ${session.id}`);
    }
  }

  /**
   * Get active session
   */
  getActiveSession(): DebugSession | null {
    return this.activeSession;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Load session from storage
   */
  async loadSession(sessionId: string): Promise<DebugSession | null> {
    return this.storage.loadSession(sessionId);
  }

  // ============================================================================
  // Event Recording
  // ============================================================================

  /**
   * Record a debug event
   */
  recordEvent(
    session: DebugSession,
    type: DebugEventType,
    data: Record<string, any>,
    parentId?: string
  ): DebugEvent {
    const event: DebugEvent = {
      id: `event-${++this.eventCounter}`,
      sessionId: session.id,
      type,
      timestamp: new Date(),
      step: session.currentStep,
      data,
      parentId,
    };

    // Apply event filter
    if (this.config.eventFilter && !this.config.eventFilter.includes(type)) {
      return event;
    }

    session.events.push(event);

    // Trim events if over limit
    if (session.events.length > this.config.maxEvents) {
      session.events = session.events.slice(-this.config.maxEvents);
    }

    // Emit event
    this.emit('event', event);
    this.config.onEvent?.(event);

    // Log to console
    if (this.config.logToConsole) {
      this.logEvent(event);
    }

    return event;
  }

  /**
   * Record LLM request
   */
  recordLLMRequest(
    session: DebugSession,
    provider: LLMProvider,
    model: string,
    messages: Message[],
    options?: { tools?: any[]; temperature?: number; maxTokens?: number }
  ): DebugEvent {
    const estimatedInputTokens = messages.reduce((acc, m) => {
      const len = typeof m.content === 'string' ? m.content.length : 100;
      return acc + Math.ceil(len / 4);
    }, 0);

    return this.recordEvent(session, 'llm-request', {
      provider,
      model,
      messages,
      tools: options?.tools,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      estimatedInputTokens,
    });
  }

  /**
   * Record LLM response
   */
  recordLLMResponse(
    session: DebugSession,
    provider: LLMProvider,
    model: string,
    content: string,
    usage: { inputTokens: number; outputTokens: number; cost: number },
    latency: number,
    toolCalls?: any[],
    finishReason?: string,
    requestEventId?: string
  ): DebugEvent {
    session.totalTokens.input += usage.inputTokens;
    session.totalTokens.output += usage.outputTokens;
    session.totalCost += usage.cost;

    const event = this.recordEvent(session, 'llm-response', {
      provider,
      model,
      content,
      toolCalls,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      latency,
      finishReason: finishReason || 'stop',
    }, requestEventId);

    // Update request event duration
    if (requestEventId) {
      const requestEvent = session.events.find(e => e.id === requestEventId);
      if (requestEvent) {
        requestEvent.duration = latency;
      }
    }

    return event;
  }

  /**
   * Record tool call
   */
  recordToolCall(
    session: DebugSession,
    toolName: string,
    toolId: string,
    args: Record<string, any>,
    schema?: any
  ): DebugEvent {
    return this.recordEvent(session, 'tool-call', {
      toolName,
      toolId,
      arguments: args,
      schema,
    });
  }

  /**
   * Record tool result
   */
  recordToolResult(
    session: DebugSession,
    toolName: string,
    toolId: string,
    result: any,
    success: boolean,
    duration: number,
    error?: string,
    callEventId?: string
  ): DebugEvent {
    const event = this.recordEvent(session, 'tool-result', {
      toolName,
      toolId,
      result,
      success,
      error,
      duration,
    }, callEventId);

    // Update call event duration
    if (callEventId) {
      const callEvent = session.events.find(e => e.id === callEventId);
      if (callEvent) {
        callEvent.duration = duration;
      }
    }

    return event;
  }

  /**
   * Record thinking/reasoning
   */
  recordThinking(
    session: DebugSession,
    thought: string,
    reasoning?: string,
    nextAction?: string
  ): DebugEvent {
    return this.recordEvent(session, 'thinking', {
      thought,
      reasoning,
      nextAction,
    });
  }

  /**
   * Record state change
   */
  recordStateChange(
    session: DebugSession,
    previousState: Partial<AgentState>,
    newState: Partial<AgentState>
  ): DebugEvent {
    const changedFields = Object.keys(newState).filter(
      key => JSON.stringify(previousState[key as keyof AgentState]) !==
             JSON.stringify(newState[key as keyof AgentState])
    );

    const event = this.recordEvent(session, 'state-change', {
      previousState,
      newState,
      changedFields,
    });

    // Auto-snapshot if enabled
    if (this.config.autoSnapshot) {
      this.createSnapshot(session, newState as AgentState, event.id);
    }

    return event;
  }

  /**
   * Record error
   */
  recordError(
    session: DebugSession,
    error: Error | string,
    recoverable: boolean,
    context?: Record<string, any>
  ): DebugEvent {
    const errorObj = error instanceof Error ? error : new Error(error);

    return this.recordEvent(session, 'error', {
      error: errorObj.message,
      code: (errorObj as any).code,
      recoverable,
      stack: errorObj.stack,
      context: context || {},
    });
  }

  // ============================================================================
  // Stepping & Breakpoints
  // ============================================================================

  /**
   * Move to next step
   */
  nextStep(session: DebugSession): number {
    session.currentStep++;
    this.recordEvent(session, 'step-start', { step: session.currentStep });
    this.emit('step', session.currentStep);
    return session.currentStep;
  }

  /**
   * Complete current step
   */
  endStep(session: DebugSession): void {
    this.recordEvent(session, 'step-end', { step: session.currentStep });
  }

  /**
   * Add a breakpoint
   */
  addBreakpoint(session: DebugSession, config: Partial<Breakpoint>): Breakpoint {
    const breakpoint: Breakpoint = {
      id: `bp-${++this.breakpointCounter}`,
      type: config.type || 'step',
      enabled: config.enabled ?? true,
      condition: config.condition,
      toolName: config.toolName,
      stepNumber: config.stepNumber,
      hitCount: 0,
      maxHits: config.maxHits,
      logMessage: config.logMessage,
    };

    session.breakpoints.push(breakpoint);
    this.emit('breakpoint-added', breakpoint);

    return breakpoint;
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(session: DebugSession, breakpointId: string): boolean {
    const index = session.breakpoints.findIndex(bp => bp.id === breakpointId);
    if (index >= 0) {
      session.breakpoints.splice(index, 1);
      this.emit('breakpoint-removed', breakpointId);
      return true;
    }
    return false;
  }

  /**
   * Toggle a breakpoint
   */
  toggleBreakpoint(session: DebugSession, breakpointId: string): boolean {
    const bp = session.breakpoints.find(b => b.id === breakpointId);
    if (bp) {
      bp.enabled = !bp.enabled;
      this.emit('breakpoint-toggled', bp);
      return true;
    }
    return false;
  }

  /**
   * Check breakpoints for current event
   */
  async checkBreakpoints(
    session: DebugSession,
    event: DebugEvent,
    state?: AgentState
  ): Promise<boolean> {
    for (const bp of session.breakpoints) {
      if (!bp.enabled) continue;

      let shouldBreak = false;

      switch (bp.type) {
        case 'step':
          shouldBreak = bp.stepNumber === undefined || bp.stepNumber === session.currentStep;
          break;
        case 'tool-call':
          shouldBreak = event.type === 'tool-call' &&
            (!bp.toolName || event.data.toolName === bp.toolName);
          break;
        case 'tool-result':
          shouldBreak = event.type === 'tool-result' &&
            (!bp.toolName || event.data.toolName === bp.toolName);
          break;
        case 'llm-request':
          shouldBreak = event.type === 'llm-request';
          break;
        case 'llm-response':
          shouldBreak = event.type === 'llm-response';
          break;
        case 'error':
          shouldBreak = event.type === 'error';
          break;
        case 'condition':
          shouldBreak = bp.condition ? bp.condition(event, state!) : false;
          break;
      }

      if (shouldBreak) {
        bp.hitCount++;

        // Log message (logpoint)
        if (bp.logMessage) {
          console.log(`[LOGPOINT ${bp.id}] ${bp.logMessage}`);
        }

        // Check max hits
        if (bp.maxHits && bp.hitCount >= bp.maxHits) {
          bp.enabled = false;
        }

        // Emit breakpoint hit
        this.recordEvent(session, 'breakpoint-hit', {
          breakpointId: bp.id,
          breakpointType: bp.type,
          hitCount: bp.hitCount,
        });

        this.emit('breakpoint-hit', bp, event);

        // If logpoint only, continue
        if (bp.logMessage && !bp.condition) {
          continue;
        }

        // Pause execution
        if (this.config.onBreakpoint) {
          session.mode = await this.config.onBreakpoint(bp, event);
        } else {
          session.mode = 'pause';
          await this.waitForResume(session);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Wait for resume command
   */
  private async waitForResume(session: DebugSession): Promise<DebugMode> {
    this.isPaused = true;
    this.emit('paused', session);

    this.pausePromise = new Promise(resolve => {
      this.pauseResolve = resolve;
    });

    const mode = await this.pausePromise;
    this.isPaused = false;
    this.pausePromise = null;
    this.pauseResolve = null;

    return mode;
  }

  /**
   * Resume execution
   */
  resume(mode: DebugMode = 'run'): void {
    if (this.pauseResolve) {
      this.pauseResolve(mode);
    }
  }

  /**
   * Check if debugger is paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  // ============================================================================
  // State Snapshots & Time Travel
  // ============================================================================

  /**
   * Create a state snapshot
   */
  createSnapshot(session: DebugSession, state: AgentState, eventId: string): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      step: session.currentStep,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      eventId,
      checksum: this.computeChecksum(state),
    };

    session.stateSnapshots.push(snapshot);

    // Trim snapshots if over limit
    if (session.stateSnapshots.length > this.config.maxSnapshots) {
      session.stateSnapshots = session.stateSnapshots.slice(-this.config.maxSnapshots);
    }

    if (this.config.persist) {
      this.storage.saveSnapshot(snapshot);
    }

    this.emit('snapshot', snapshot);

    return snapshot;
  }

  /**
   * Get time travel state
   */
  getTimeTravelState(session: DebugSession): TimeTravelState {
    const snapshots = session.stateSnapshots;
    const currentIndex = snapshots.findIndex(s => s.step === session.currentStep);

    return {
      position: currentIndex >= 0 ? currentIndex : snapshots.length - 1,
      total: snapshots.length,
      canGoBack: currentIndex > 0 || (currentIndex === -1 && snapshots.length > 0),
      canGoForward: currentIndex < snapshots.length - 1 && currentIndex !== -1,
      currentSnapshot: snapshots[currentIndex] || snapshots[snapshots.length - 1] || null,
    };
  }

  /**
   * Go to a specific step (time travel)
   */
  goToStep(session: DebugSession, step: number): StateSnapshot | null {
    const snapshot = session.stateSnapshots.find(s => s.step === step);
    if (snapshot) {
      session.currentStep = step;
      this.emit('time-travel', { step, snapshot });
      return snapshot;
    }
    return null;
  }

  /**
   * Go back one step
   */
  goBack(session: DebugSession): StateSnapshot | null {
    const state = this.getTimeTravelState(session);
    if (state.canGoBack) {
      const prevSnapshot = session.stateSnapshots[state.position - 1];
      if (prevSnapshot) {
        return this.goToStep(session, prevSnapshot.step);
      }
    }
    return null;
  }

  /**
   * Go forward one step
   */
  goForward(session: DebugSession): StateSnapshot | null {
    const state = this.getTimeTravelState(session);
    if (state.canGoForward) {
      const nextSnapshot = session.stateSnapshots[state.position + 1];
      if (nextSnapshot) {
        return this.goToStep(session, nextSnapshot.step);
      }
    }
    return null;
  }

  /**
   * Replay session
   */
  async *replay(
    session: DebugSession,
    options?: Partial<ReplayOptions>
  ): AsyncGenerator<DebugEvent> {
    const opts: ReplayOptions = {
      speed: options?.speed ?? 1,
      startStep: options?.startStep,
      endStep: options?.endStep,
      pauseAtBreakpoints: options?.pauseAtBreakpoints ?? true,
      emitEvents: options?.emitEvents ?? true,
    };

    const events = session.events.filter(e => {
      if (opts.startStep !== undefined && e.step < opts.startStep) return false;
      if (opts.endStep !== undefined && e.step > opts.endStep) return false;
      return true;
    });

    let lastTimestamp = events[0]?.timestamp.getTime() || 0;

    for (const event of events) {
      // Calculate delay
      const delay = (event.timestamp.getTime() - lastTimestamp) / opts.speed;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      lastTimestamp = event.timestamp.getTime();

      // Check breakpoints
      if (opts.pauseAtBreakpoints) {
        await this.checkBreakpoints(session, event);
      }

      // Emit event
      if (opts.emitEvents) {
        this.emit('replay-event', event);
      }

      yield event;
    }
  }

  // ============================================================================
  // Visualization
  // ============================================================================

  /**
   * Build decision tree from events
   */
  buildDecisionTree(session: DebugSession): DecisionTree {
    const nodes: Map<string, DecisionNode> = new Map();
    let currentParentId: string | undefined;

    // Create root node
    const rootNode: DecisionNode = {
      id: 'root',
      type: 'start',
      label: 'Start',
      step: 0,
      timestamp: session.startTime,
      children: [],
      eventId: session.events[0]?.id || '',
      data: { agentName: session.agentName },
    };
    nodes.set('root', rootNode);
    currentParentId = 'root';

    let totalCost = 0;
    let lastNodeId = 'root';

    for (const event of session.events) {
      let node: DecisionNode | undefined;

      switch (event.type) {
        case 'llm-request':
          node = {
            id: `llm-${event.id}`,
            type: 'llm',
            label: `LLM: ${event.data.model}`,
            step: event.step,
            timestamp: event.timestamp,
            duration: event.duration,
            children: [],
            parent: lastNodeId,
            eventId: event.id,
            data: event.data,
          };
          break;

        case 'llm-response':
          // Update previous LLM node
          const prevLLM = Array.from(nodes.values()).reverse()
            .find(n => n.type === 'llm' && !n.cost);
          if (prevLLM) {
            prevLLM.cost = event.data.cost;
            prevLLM.duration = event.data.latency;
            totalCost += event.data.cost;
          }
          break;

        case 'tool-call':
          node = {
            id: `tool-${event.id}`,
            type: 'tool',
            label: `Tool: ${event.data.toolName}`,
            step: event.step,
            timestamp: event.timestamp,
            children: [],
            parent: lastNodeId,
            eventId: event.id,
            data: event.data,
          };
          break;

        case 'thinking':
          node = {
            id: `think-${event.id}`,
            type: 'decision',
            label: event.data.nextAction || 'Thinking',
            step: event.step,
            timestamp: event.timestamp,
            children: [],
            parent: lastNodeId,
            eventId: event.id,
            data: event.data,
          };
          break;

        case 'error':
          node = {
            id: `error-${event.id}`,
            type: 'error',
            label: `Error: ${event.data.error.slice(0, 30)}...`,
            step: event.step,
            timestamp: event.timestamp,
            children: [],
            parent: lastNodeId,
            eventId: event.id,
            data: event.data,
          };
          break;
      }

      if (node) {
        nodes.set(node.id, node);

        // Link to parent
        const parent = nodes.get(node.parent!);
        if (parent) {
          parent.children.push(node.id);
        }

        lastNodeId = node.id;
      }
    }

    // Add end node
    const endNode: DecisionNode = {
      id: 'end',
      type: 'end',
      label: 'End',
      step: session.currentStep,
      timestamp: session.endTime || new Date(),
      children: [],
      parent: lastNodeId,
      eventId: '',
      data: {
        totalCost: session.totalCost,
        totalTokens: session.totalTokens,
      },
    };
    nodes.set('end', endNode);
    const lastNode = nodes.get(lastNodeId);
    if (lastNode) {
      lastNode.children.push('end');
    }

    return {
      sessionId: session.id,
      rootId: 'root',
      nodes,
      totalSteps: session.currentStep,
      totalCost: session.totalCost,
      totalDuration: (session.endTime?.getTime() || Date.now()) - session.startTime.getTime(),
    };
  }

  /**
   * Get token breakdown
   */
  getTokenBreakdown(session: DebugSession): TokenBreakdown {
    const byStep: TokenBreakdown['byStep'] = [];
    const byTool: TokenBreakdown['byTool'] = {};
    const byModel: TokenBreakdown['byModel'] = {};
    const cumulative: TokenBreakdown['cumulative'] = [];

    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;

    for (const event of session.events) {
      if (event.type === 'llm-response') {
        const { model, inputTokens, outputTokens, cost } = event.data;

        byStep.push({
          step: event.step,
          inputTokens,
          outputTokens,
          cost,
          model,
        });

        // By model
        if (!byModel[model]) {
          byModel[model] = { requests: 0, inputTokens: 0, outputTokens: 0, totalCost: 0 };
        }
        byModel[model].requests++;
        byModel[model].inputTokens += inputTokens;
        byModel[model].outputTokens += outputTokens;
        byModel[model].totalCost += cost;

        // Cumulative
        totalInput += inputTokens;
        totalOutput += outputTokens;
        totalCost += cost;
        cumulative.push({
          step: event.step,
          totalInputTokens: totalInput,
          totalOutputTokens: totalOutput,
          totalCost,
        });
      }

      if (event.type === 'tool-call') {
        const { toolName } = event.data;
        if (!byTool[toolName]) {
          byTool[toolName] = { calls: 0, totalTokens: 0, totalCost: 0 };
        }
        byTool[toolName].calls++;
      }
    }

    return { byStep, byTool, byModel, cumulative };
  }

  // ============================================================================
  // Debug Commands
  // ============================================================================

  /**
   * Execute a debug command
   */
  async executeCommand(
    session: DebugSession,
    command: DebugCommand
  ): Promise<DebugCommandResult> {
    const result: DebugCommandResult = {
      command,
      success: true,
      mode: session.mode,
      step: session.currentStep,
    };

    try {
      switch (command.type) {
        case 'continue':
          this.resume('run');
          session.mode = 'run';
          break;

        case 'step':
          this.resume('step');
          session.mode = 'step';
          break;

        case 'step-over':
          this.resume('step-over');
          session.mode = 'step-over';
          break;

        case 'step-into':
          this.resume('step-into');
          session.mode = 'step-into';
          break;

        case 'pause':
          session.mode = 'pause';
          break;

        case 'stop':
          this.endSession(session.id);
          session.mode = 'stop';
          break;

        case 'restart':
          // Reset session state
          session.currentStep = 0;
          session.events = [];
          session.stateSnapshots = [];
          session.totalCost = 0;
          session.totalTokens = { input: 0, output: 0 };
          session.mode = 'run';
          break;

        case 'goto':
          const snapshot = this.goToStep(session, command.step);
          result.data = snapshot;
          break;

        case 'set-breakpoint':
          const bp = this.addBreakpoint(session, command.breakpoint);
          result.data = bp;
          break;

        case 'remove-breakpoint':
          result.success = this.removeBreakpoint(session, command.id);
          break;

        case 'toggle-breakpoint':
          result.success = this.toggleBreakpoint(session, command.id);
          break;

        case 'inspect':
          switch (command.target) {
            case 'state':
              result.data = this.getTimeTravelState(session);
              break;
            case 'events':
              result.data = session.events.slice(-50); // Last 50 events
              break;
            case 'tokens':
              result.data = this.getTokenBreakdown(session);
              break;
            case 'tree':
              result.data = this.buildDecisionTree(session);
              break;
          }
          break;

        case 'eval':
          // Safe evaluation (limited)
          result.data = { expression: command.expression, note: 'Eval not implemented for security' };
          break;
      }

      result.mode = session.mode;
      result.step = session.currentStep;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private computeChecksum(state: AgentState): string {
    return createHash('md5')
      .update(JSON.stringify(state))
      .digest('hex')
      .slice(0, 8);
  }

  private logEvent(event: DebugEvent): void {
    const time = event.timestamp.toISOString().slice(11, 23);
    const prefix = `[${time}] [Step ${event.step}]`;

    switch (event.type) {
      case 'llm-request':
        console.log(`${prefix} 📤 LLM Request to ${event.data.model}`);
        break;
      case 'llm-response':
        console.log(`${prefix} 📥 LLM Response (${event.data.outputTokens} tokens, $${event.data.cost.toFixed(4)})`);
        break;
      case 'tool-call':
        console.log(`${prefix} 🔧 Tool Call: ${event.data.toolName}(${JSON.stringify(event.data.arguments).slice(0, 50)}...)`);
        break;
      case 'tool-result':
        console.log(`${prefix} ✅ Tool Result: ${event.data.success ? 'success' : 'failed'}`);
        break;
      case 'thinking':
        console.log(`${prefix} 💭 ${event.data.thought.slice(0, 80)}...`);
        break;
      case 'error':
        console.log(`${prefix} ❌ Error: ${event.data.error}`);
        break;
      case 'breakpoint-hit':
        console.log(`${prefix} 🔴 Breakpoint hit: ${event.data.breakpointId}`);
        break;
      default:
        console.log(`${prefix} ${event.type}: ${JSON.stringify(event.data).slice(0, 80)}`);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalDebugger: AgentDebugger | null = null;

/**
 * Create a new agent debugger
 */
export function createAgentDebugger(
  config?: Partial<AgentDebuggerConfig>
): AgentDebugger {
  return new AgentDebugger(config);
}

/**
 * Get the global debugger instance
 */
export function getGlobalDebugger(): AgentDebugger {
  if (!globalDebugger) {
    globalDebugger = createAgentDebugger();
  }
  return globalDebugger;
}

/**
 * Set the global debugger instance
 */
export function setGlobalDebugger(debugger_: AgentDebugger): void {
  globalDebugger = debugger_;
}

/**
 * Start debugging an agent (convenience function)
 */
export function debug(agentName: string, metadata?: Record<string, any>): DebugSession {
  return getGlobalDebugger().startSession(agentName, metadata);
}
