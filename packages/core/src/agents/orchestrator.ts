/**
 * Agent Orchestrator
 * Coordinates multiple agents to accomplish complex tasks.
 * Supports sequential, parallel, and hierarchical execution patterns.
 */

import { EventEmitter } from 'events';
import { BaseAgent, AgentState, Tool } from './base.js';

export interface OrchestratorConfig {
  name: string;
  description?: string;
  strategy: 'sequential' | 'parallel' | 'hierarchical' | 'router';
  maxConcurrency?: number;
  timeout?: number;
  verbose?: boolean;
}

export interface AgentRegistration {
  agent: BaseAgent;
  name: string;
  description: string;
  capabilities?: string[];
  priority?: number;
}

export interface TaskResult {
  agentName: string;
  success: boolean;
  result: string;
  duration: number;
  error?: string;
}

export interface OrchestratorState {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  completedTasks: string[];
  results: TaskResult[];
  startedAt?: Date;
  completedAt?: Date;
}

type RouteDecision = {
  agentName: string;
  reason: string;
};

/**
 * Multi-Agent Orchestrator
 */
export class Orchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private agents: Map<string, AgentRegistration>;
  private state: OrchestratorState;
  private routerFn: ((input: string, agents: AgentRegistration[]) => Promise<RouteDecision>) | null = null;

  constructor(config: OrchestratorConfig) {
    super();
    this.config = {
      maxConcurrency: 5,
      timeout: 600000, // 10 minutes
      verbose: false,
      ...config,
    };

    this.agents = new Map();
    this.state = {
      status: 'idle',
      completedTasks: [],
      results: [],
    };
  }

  /**
   * Register an agent with the orchestrator
   */
  register(registration: AgentRegistration): this {
    this.agents.set(registration.name, registration);
    return this;
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  /**
   * Set custom router function for 'router' strategy
   */
  setRouter(routerFn: (input: string, agents: AgentRegistration[]) => Promise<RouteDecision>): this {
    this.routerFn = routerFn;
    return this;
  }

  /**
   * Run a task through the orchestrated agents
   */
  async run(input: string): Promise<string> {
    this.state.status = 'running';
    this.state.startedAt = new Date();
    this.state.results = [];
    this.state.completedTasks = [];

    this.emit('start', { input, strategy: this.config.strategy });

    try {
      let result: string;

      switch (this.config.strategy) {
        case 'sequential':
          result = await this.runSequential(input);
          break;
        case 'parallel':
          result = await this.runParallel(input);
          break;
        case 'hierarchical':
          result = await this.runHierarchical(input);
          break;
        case 'router':
          result = await this.runRouter(input);
          break;
        default:
          throw new Error(`Unknown strategy: ${this.config.strategy}`);
      }

      this.state.status = 'completed';
      this.state.completedAt = new Date();
      this.emit('complete', { result, results: this.state.results });

      return result;
    } catch (error: any) {
      this.state.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Run agents sequentially, passing output from one to the next
   */
  private async runSequential(input: string): Promise<string> {
    const agents = this.getAgents().sort((a, b) => (a.priority || 0) - (b.priority || 0));
    let currentInput = input;

    for (const registration of agents) {
      this.state.currentTask = registration.name;
      this.emit('agent_start', { agent: registration.name, input: currentInput });

      const startTime = Date.now();

      try {
        const result = await registration.agent.run(currentInput);
        const duration = Date.now() - startTime;

        this.state.results.push({
          agentName: registration.name,
          success: true,
          result,
          duration,
        });

        this.state.completedTasks.push(registration.name);
        this.emit('agent_complete', { agent: registration.name, result, duration });

        // Use this agent's output as input for the next
        currentInput = result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        this.state.results.push({
          agentName: registration.name,
          success: false,
          result: '',
          duration,
          error: error.message,
        });

        this.emit('agent_error', { agent: registration.name, error });
        throw error;
      }
    }

    return currentInput;
  }

  /**
   * Run agents in parallel and aggregate results
   */
  private async runParallel(input: string): Promise<string> {
    const agents = this.getAgents();
    const maxConcurrency = this.config.maxConcurrency || 5;

    // Process in batches if we have more agents than maxConcurrency
    const batches: AgentRegistration[][] = [];
    for (let i = 0; i < agents.length; i += maxConcurrency) {
      batches.push(agents.slice(i, i + maxConcurrency));
    }

    const allResults: TaskResult[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (registration) => {
        this.emit('agent_start', { agent: registration.name, input });

        const startTime = Date.now();

        try {
          const result = await registration.agent.run(input);
          const duration = Date.now() - startTime;

          const taskResult: TaskResult = {
            agentName: registration.name,
            success: true,
            result,
            duration,
          };

          this.state.completedTasks.push(registration.name);
          this.emit('agent_complete', { agent: registration.name, result, duration });

          return taskResult;
        } catch (error: any) {
          const duration = Date.now() - startTime;

          const taskResult: TaskResult = {
            agentName: registration.name,
            success: false,
            result: '',
            duration,
            error: error.message,
          };

          this.emit('agent_error', { agent: registration.name, error });

          return taskResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
    }

    this.state.results = allResults;

    // Aggregate successful results
    const successfulResults = allResults
      .filter(r => r.success)
      .map(r => `[${r.agentName}]: ${r.result}`)
      .join('\n\n');

    return successfulResults || 'No agents returned successful results.';
  }

  /**
   * Run with a master agent that delegates to specialized agents
   */
  private async runHierarchical(input: string): Promise<string> {
    // Find the master agent (highest priority or first)
    const agents = this.getAgents().sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const masterAgent = agents[0];
    const workerAgents = agents.slice(1);

    if (!masterAgent) {
      throw new Error('No agents registered');
    }

    // Create delegation tool for master agent
    const delegateTool: Tool = {
      name: 'delegate',
      description: `Delegate a task to a specialized agent. Available agents: ${workerAgents.map(a => `${a.name} (${a.description})`).join(', ')}`,
      parameters: {
        type: 'object',
        properties: {
          agent: {
            type: 'string',
            description: 'Name of the agent to delegate to',
            enum: workerAgents.map(a => a.name),
          },
          task: {
            type: 'string',
            description: 'The task to delegate',
          },
        },
        required: ['agent', 'task'],
      },
      execute: async (args) => {
        const agentName = args.agent as string;
        const task = args.task as string;

        const workerReg = workerAgents.find(a => a.name === agentName);
        if (!workerReg) {
          return { success: false, error: `Agent "${agentName}" not found` };
        }

        try {
          const result = await workerReg.agent.run(task);
          this.state.results.push({
            agentName,
            success: true,
            result,
            duration: 0,
          });
          return { success: true, result };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    };

    // Add delegation tool to master agent
    masterAgent.agent.registerTool(delegateTool);

    // Run master agent
    return await masterAgent.agent.run(input);
  }

  /**
   * Route the input to the most appropriate agent
   */
  private async runRouter(input: string): Promise<string> {
    const agents = this.getAgents();

    if (agents.length === 0) {
      throw new Error('No agents registered');
    }

    let selectedAgent: AgentRegistration;

    if (this.routerFn) {
      // Use custom router function
      const decision = await this.routerFn(input, agents);
      const found = agents.find(a => a.name === decision.agentName);
      if (!found) {
        throw new Error(`Router selected unknown agent: ${decision.agentName}`);
      }
      selectedAgent = found;
      this.emit('route', { agent: selectedAgent.name, reason: decision.reason });
    } else {
      // Simple keyword-based routing
      selectedAgent = this.simpleRoute(input, agents);
      this.emit('route', { agent: selectedAgent.name, reason: 'keyword match' });
    }

    this.state.currentTask = selectedAgent.name;
    this.emit('agent_start', { agent: selectedAgent.name, input });

    const startTime = Date.now();
    const result = await selectedAgent.agent.run(input);
    const duration = Date.now() - startTime;

    this.state.results.push({
      agentName: selectedAgent.name,
      success: true,
      result,
      duration,
    });

    this.emit('agent_complete', { agent: selectedAgent.name, result, duration });

    return result;
  }

  /**
   * Simple keyword-based routing
   */
  private simpleRoute(input: string, agents: AgentRegistration[]): AgentRegistration {
    const inputLower = input.toLowerCase();

    for (const registration of agents) {
      // Check capabilities
      if (registration.capabilities) {
        for (const capability of registration.capabilities) {
          if (inputLower.includes(capability.toLowerCase())) {
            return registration;
          }
        }
      }

      // Check description keywords
      if (registration.description) {
        const descWords = registration.description.toLowerCase().split(/\s+/);
        for (const word of descWords) {
          if (word.length > 3 && inputLower.includes(word)) {
            return registration;
          }
        }
      }
    }

    // Default to first agent
    return agents[0];
  }

  /**
   * Get current state
   */
  getState(): OrchestratorState {
    return { ...this.state };
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.state = {
      status: 'idle',
      completedTasks: [],
      results: [],
    };
  }

  /**
   * Log if verbose mode enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.config.verbose) {
      console.log(`[Orchestrator:${this.config.name}] ${message}`, data || '');
    }
  }
}

/**
 * Create an orchestrator with builder pattern
 */
export function createOrchestrator(config: OrchestratorConfig): Orchestrator {
  return new Orchestrator(config);
}
