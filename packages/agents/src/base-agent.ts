/**
 * @rana/agents - BaseAgent
 * Abstract base class for all RANA agents
 */

import {
  AgentInput,
  AgentOutput,
  AgentContext,
  Tool,
  ToolResult,
  ToolContext,
} from './types';
import { compileVibe } from './vibe-spec';

/**
 * Abstract base class for RANA agents
 *
 * @example
 * ```typescript
 * class MyAgent extends BaseAgent {
 *   id = 'my_agent';
 *   name = 'My Custom Agent';
 *
 *   async handle(input: AgentInput): Promise<AgentOutput> {
 *     // Custom implementation
 *   }
 * }
 * ```
 */
export abstract class BaseAgent {
  /** Unique agent identifier */
  abstract id: string;
  /** Human-readable agent name */
  abstract name: string;
  /** Agent description */
  description?: string;

  /** Agent context with dependencies */
  protected ctx: AgentContext;

  constructor(ctx: AgentContext) {
    this.ctx = ctx;
  }

  /**
   * Handle an agent input and produce output
   * Must be implemented by subclasses
   */
  abstract handle(input: AgentInput): Promise<AgentOutput>;

  /**
   * Log an event for observability
   */
  protected log(event: string, payload: Record<string, any>): void {
    this.ctx.logger?.(event, {
      agentId: this.id,
      agentName: this.name,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  /**
   * Call a tool with safety checks
   */
  protected async callTool(tool: Tool, input: any): Promise<ToolResult> {
    const start = Date.now();

    // Check if tool is disallowed by vibe
    if (this.ctx.vibe?.disallowedActions?.includes(tool.name)) {
      this.log('tool:blocked', { tool: tool.name, reason: 'disallowed_by_vibe' });
      return {
        ok: false,
        error: `Tool "${tool.name}" is not allowed by current vibe configuration`,
      };
    }

    // Check if tool is in allowed list (if specified)
    if (
      this.ctx.vibe?.allowedActions?.length &&
      !this.ctx.vibe.allowedActions.includes(tool.name)
    ) {
      this.log('tool:blocked', { tool: tool.name, reason: 'not_in_allowed_list' });
      return {
        ok: false,
        error: `Tool "${tool.name}" is not in the allowed actions list`,
      };
    }

    // Check auth requirements
    if (tool.requiresAuth && !this.ctx.user?.id) {
      this.log('tool:blocked', { tool: tool.name, reason: 'auth_required' });
      return {
        ok: false,
        error: `Tool "${tool.name}" requires authentication`,
      };
    }

    // Check role requirements
    if (tool.allowedRoles?.length) {
      const hasRole = this.ctx.user?.roles?.some((r) =>
        tool.allowedRoles!.includes(r)
      );
      if (!hasRole) {
        this.log('tool:blocked', { tool: tool.name, reason: 'insufficient_roles' });
        return {
          ok: false,
          error: `Insufficient permissions for tool "${tool.name}"`,
        };
      }
    }

    const toolContext: ToolContext = {
      user: this.ctx.user,
      orgId: this.ctx.user.orgId,
      agentId: this.id,
    };

    this.log('tool:call', { tool: tool.name, input });

    try {
      const result = await tool.run(input, toolContext);
      const durationMs = Date.now() - start;

      this.log('tool:result', {
        tool: tool.name,
        success: result.ok,
        durationMs,
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          durationMs,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      this.log('tool:error', {
        tool: tool.name,
        error: String(error),
        durationMs,
      });

      return {
        ok: false,
        error: String(error),
        metadata: { durationMs },
      };
    }
  }

  /**
   * Build the system prompt from vibe config
   */
  protected buildSystemPrompt(): string {
    if (this.ctx.vibe) {
      return compileVibe(this.ctx.vibe).systemPrompt;
    }

    const parts = [`You are ${this.name}.`];

    if (this.description) {
      parts.push(this.description);
    }

    return parts.join(' ');
  }

  /**
   * Get a tool by name
   */
  protected getTool(name: string): Tool | undefined {
    return this.ctx.tools.find((t) => t.name === name);
  }

  /**
   * Store a value in memory
   */
  protected async remember(key: string, value: any, ttl?: number): Promise<void> {
    if (this.ctx.memory) {
      await this.ctx.memory.set(`${this.id}:${key}`, value, ttl);
    }
  }

  /**
   * Retrieve a value from memory
   */
  protected async recall(key: string): Promise<any | null> {
    if (this.ctx.memory) {
      return this.ctx.memory.get(`${this.id}:${key}`);
    }
    return null;
  }

  /**
   * Forget a value from memory
   */
  protected async forget(key: string): Promise<void> {
    if (this.ctx.memory?.delete) {
      await this.ctx.memory.delete(`${this.id}:${key}`);
    }
  }
}
