/**
 * @ranavibe/agents/tools
 * Common tools and tool utilities
 */

import { Tool, ToolInput, ToolContext, ToolResult } from '../types';

/**
 * Create a tool with type safety
 */
export function createTool<T extends ToolInput = ToolInput>(config: {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  requiresAuth?: boolean;
  sideEffects?: boolean;
  rateLimit?: { requests: number; windowMs: number };
  allowedRoles?: string[];
  run: (input: T, ctx: ToolContext) => Promise<ToolResult>;
}): Tool {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    requiresAuth: config.requiresAuth,
    sideEffects: config.sideEffects,
    rateLimit: config.rateLimit,
    allowedRoles: config.allowedRoles,
    run: config.run as (input: ToolInput, ctx: ToolContext) => Promise<ToolResult>,
  };
}

/**
 * Create a simple tool without extra configuration
 */
export function simpleTool(
  name: string,
  description: string,
  run: (input: ToolInput, ctx: ToolContext) => Promise<any>
): Tool {
  return {
    name,
    description,
    async run(input, ctx) {
      try {
        const data = await run(input, ctx);
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    },
  };
}

// Common built-in tools

/**
 * Calculator tool for math operations
 */
export const calculatorTool = createTool({
  name: 'calculator',
  description: 'Evaluate a mathematical expression',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'The math expression to evaluate' },
    },
    required: ['expression'],
  },
  async run(input) {
    try {
      // Safe math evaluation (no eval)
      const expr = input.expression;
      // Only allow numbers and basic operators
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        return { ok: false, error: 'Invalid expression. Only numbers and +, -, *, /, (, ) are allowed.' };
      }
      const result = Function(`'use strict'; return (${expr})`)();
      return { ok: true, data: { result, expression: expr } };
    } catch (error) {
      return { ok: false, error: `Failed to evaluate: ${String(error)}` };
    }
  },
});

/**
 * Date/time tool
 */
export const dateTimeTool = createTool({
  name: 'datetime',
  description: 'Get current date, time, or perform date calculations',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['now', 'parse', 'format', 'add', 'diff'],
        description: 'The date operation to perform',
      },
      value: { type: 'string', description: 'Date string or value' },
      format: { type: 'string', description: 'Date format string' },
      amount: { type: 'number', description: 'Amount for add operation' },
      unit: { type: 'string', enum: ['days', 'hours', 'minutes', 'seconds'] },
    },
    required: ['action'],
  },
  async run(input) {
    const { action, value, amount, unit } = input;

    switch (action) {
      case 'now':
        return {
          ok: true,
          data: {
            iso: new Date().toISOString(),
            unix: Date.now(),
            formatted: new Date().toLocaleString(),
          },
        };

      case 'parse':
        if (!value) return { ok: false, error: 'value required for parse' };
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
          return { ok: false, error: 'Invalid date string' };
        }
        return { ok: true, data: { iso: parsed.toISOString(), unix: parsed.getTime() } };

      case 'add':
        if (!value || !amount || !unit) {
          return { ok: false, error: 'value, amount, and unit required for add' };
        }
        const date = new Date(value);
        const msPerUnit: Record<string, number> = {
          days: 86400000,
          hours: 3600000,
          minutes: 60000,
          seconds: 1000,
        };
        const ms = msPerUnit[unit as string] || 0;
        date.setTime(date.getTime() + amount * ms);
        return { ok: true, data: { iso: date.toISOString(), unix: date.getTime() } };

      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  },
});

/**
 * HTTP fetch tool (read-only)
 */
export const httpFetchTool = createTool({
  name: 'http_fetch',
  description: 'Fetch data from a URL (GET only)',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch' },
      headers: { type: 'object', description: 'Optional headers' },
    },
    required: ['url'],
  },
  async run(input) {
    try {
      const response = await fetch(input.url, {
        method: 'GET',
        headers: input.headers || {},
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: true,
        data: {
          status: response.status,
          contentType,
          data,
        },
      };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  },
});

/**
 * JSON manipulation tool
 */
export const jsonTool = createTool({
  name: 'json',
  description: 'Parse, stringify, or query JSON data',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['parse', 'stringify', 'get'] },
      data: { type: 'string', description: 'JSON string or data' },
      path: { type: 'string', description: 'Path for get action (e.g., "user.name")' },
    },
    required: ['action'],
  },
  async run(input) {
    const { action, data, path } = input;

    switch (action) {
      case 'parse':
        try {
          return { ok: true, data: JSON.parse(data) };
        } catch (e) {
          return { ok: false, error: 'Invalid JSON' };
        }

      case 'stringify':
        return { ok: true, data: JSON.stringify(data, null, 2) };

      case 'get':
        if (!path) return { ok: false, error: 'path required for get' };
        let obj = typeof data === 'string' ? JSON.parse(data) : data;
        const parts = path.split('.');
        for (const part of parts) {
          obj = obj?.[part];
        }
        return { ok: true, data: obj };

      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  },
});

/**
 * Get all default tools
 */
export function getDefaultTools(): Tool[] {
  return [calculatorTool, dateTimeTool, httpFetchTool, jsonTool];
}

/**
 * Create a tool registry
 */
export function createToolRegistry(tools: Tool[] = []): {
  tools: Tool[];
  add: (tool: Tool) => void;
  get: (name: string) => Tool | undefined;
  list: () => string[];
} {
  const registry = new Map<string, Tool>();
  for (const tool of tools) {
    registry.set(tool.name, tool);
  }

  return {
    get tools() {
      return Array.from(registry.values());
    },
    add(tool: Tool) {
      registry.set(tool.name, tool);
    },
    get(name: string) {
      return registry.get(name);
    },
    list() {
      return Array.from(registry.keys());
    },
  };
}
