/**
 * Base Agent Class
 * Foundation for all RANA agents with lifecycle management,
 * state handling, and tool execution capabilities.
 */

import { EventEmitter } from 'events';

export interface AgentConfig {
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  systemPrompt?: string;
  maxIterations?: number;
  timeout?: number;
  verbose?: boolean;
}

export interface AgentState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  history: AgentMessage[];
  context: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  result: unknown;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export type AgentEventType =
  | 'start'
  | 'step'
  | 'message'
  | 'tool_call'
  | 'tool_result'
  | 'thinking'
  | 'complete'
  | 'error'
  | 'pause'
  | 'resume';

export interface AgentEvent {
  type: AgentEventType;
  data: unknown;
  timestamp: Date;
}

/**
 * Abstract Base Agent
 * Provides common functionality for all agent types
 */
export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected state: AgentState;
  protected tools: Map<string, Tool>;
  protected abortController: AbortController | null = null;

  constructor(config: AgentConfig) {
    super();
    this.config = {
      maxIterations: 10,
      timeout: 300000, // 5 minutes
      verbose: false,
      ...config,
    };

    this.state = {
      status: 'idle',
      currentStep: 0,
      totalSteps: 0,
      history: [],
      context: {},
    };

    this.tools = new Map();
  }

  /**
   * Register a tool for the agent to use
   */
  registerTool(tool: Tool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: Tool[]): this {
    tools.forEach(tool => this.registerTool(tool));
    return this;
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions(): object[] {
    return this.getTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Execute a tool by name
   */
  protected async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        success: false,
        result: null,
        error: `Tool "${toolCall.name}" not found`,
      };
    }

    try {
      this.emit('tool_call', { tool: toolCall.name, args: toolCall.arguments });
      const result = await tool.execute(toolCall.arguments);
      this.emit('tool_result', { tool: toolCall.name, result });

      return {
        toolCallId: toolCall.id,
        success: true,
        result,
      };
    } catch (error: any) {
      return {
        toolCallId: toolCall.id,
        success: false,
        result: null,
        error: error.message,
      };
    }
  }

  /**
   * Add message to history
   */
  protected addMessage(message: Omit<AgentMessage, 'timestamp'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      timestamp: new Date(),
    };
    this.state.history.push(fullMessage);
    this.emit('message', fullMessage);
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Set context value
   */
  setContext(key: string, value: unknown): this {
    this.state.context[key] = value;
    return this;
  }

  /**
   * Get context value
   */
  getContext(key: string): unknown {
    return this.state.context[key];
  }

  /**
   * Run the agent with an input
   */
  async run(input: string): Promise<string> {
    if (this.state.status === 'running') {
      throw new Error('Agent is already running');
    }

    this.abortController = new AbortController();
    this.state.status = 'running';
    this.state.startedAt = new Date();
    this.state.currentStep = 0;
    this.state.error = undefined;

    this.emit('start', { input });

    try {
      // Add user message
      this.addMessage({ role: 'user', content: input });

      // Run the agent loop
      const result = await this.executeLoop(input);

      this.state.status = 'completed';
      this.state.completedAt = new Date();
      this.emit('complete', { result });

      return result;
    } catch (error: any) {
      this.state.status = 'error';
      this.state.error = error;
      this.emit('error', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Pause the agent
   */
  pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
      this.emit('pause', {});
    }
  }

  /**
   * Resume the agent
   */
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
      this.emit('resume', {});
    }
  }

  /**
   * Stop the agent
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.state.status = 'idle';
  }

  /**
   * Reset the agent state
   */
  reset(): void {
    this.stop();
    this.state = {
      status: 'idle',
      currentStep: 0,
      totalSteps: 0,
      history: [],
      context: {},
    };
  }

  /**
   * Abstract method: Execute the main agent loop
   * Must be implemented by subclasses
   */
  protected abstract executeLoop(input: string): Promise<string>;

  /**
   * Log if verbose mode is enabled
   */
  protected log(message: string, data?: unknown): void {
    if (this.config.verbose) {
      console.log(`[${this.config.name}] ${message}`, data || '');
    }
  }
}
