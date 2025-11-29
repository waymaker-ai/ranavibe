/**
 * Tool Registry and Built-in Tools
 * Common tools for agents to use
 */

import { Tool } from './base.js';

/**
 * Tool Registry - manages available tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  clear(): void {
    this.tools.clear();
  }
}

// ============================================================================
// Built-in Tools
// ============================================================================

// Web search tool is now exported from web-search.ts
// Re-export for backwards compatibility
export { webSearchTool, createWebSearchTool, configureWebSearch } from './web-search.js';

/**
 * Calculator Tool
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, and common math functions.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "15% of 200")',
      },
    },
    required: ['expression'],
  },
  execute: async (args) => {
    const expr = args.expression as string;

    try {
      // Handle percentage expressions
      let processedExpr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, '($1 / 100) * $2');

      // Handle common math functions
      processedExpr = processedExpr
        .replace(/sqrt\(/gi, 'Math.sqrt(')
        .replace(/pow\(/gi, 'Math.pow(')
        .replace(/abs\(/gi, 'Math.abs(')
        .replace(/round\(/gi, 'Math.round(')
        .replace(/floor\(/gi, 'Math.floor(')
        .replace(/ceil\(/gi, 'Math.ceil(')
        .replace(/sin\(/gi, 'Math.sin(')
        .replace(/cos\(/gi, 'Math.cos(')
        .replace(/tan\(/gi, 'Math.tan(')
        .replace(/log\(/gi, 'Math.log(')
        .replace(/exp\(/gi, 'Math.exp(')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![xp])/gi, 'Math.E');

      // Validate expression (only allow safe characters)
      if (!/^[\d\s+\-*/().Math,sqrtpowabsroundflorceilsincostanlgexpPIE]+$/.test(processedExpr)) {
        throw new Error('Invalid characters in expression');
      }

      // Evaluate safely using Function
      const result = new Function(`return ${processedExpr}`)();

      return { expression: expr, result };
    } catch (error: any) {
      return { expression: expr, error: error.message };
    }
  },
};

/**
 * Date/Time Tool
 */
export const dateTimeTool: Tool = {
  name: 'datetime',
  description: 'Get current date/time or perform date calculations.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Operation to perform',
        enum: ['now', 'format', 'add', 'diff', 'parse'],
      },
      date: {
        type: 'string',
        description: 'Date string (for format, add, diff, parse operations)',
      },
      format: {
        type: 'string',
        description: 'Output format (e.g., "YYYY-MM-DD", "readable")',
      },
      timezone: {
        type: 'string',
        description: 'Timezone (e.g., "America/New_York")',
      },
      amount: {
        type: 'number',
        description: 'Amount to add (for add operation)',
      },
      unit: {
        type: 'string',
        description: 'Unit for add operation',
        enum: ['days', 'hours', 'minutes', 'weeks', 'months', 'years'],
      },
    },
    required: ['operation'],
  },
  execute: async (args) => {
    const operation = args.operation as string;
    const dateStr = args.date as string | undefined;
    const timezone = args.timezone as string | undefined;

    try {
      const now = new Date();

      switch (operation) {
        case 'now':
          return {
            iso: now.toISOString(),
            unix: Math.floor(now.getTime() / 1000),
            readable: now.toLocaleString('en-US', { timeZone: timezone }),
            timezone: timezone || 'local',
          };

        case 'format':
          const dateToFormat = dateStr ? new Date(dateStr) : now;
          return {
            iso: dateToFormat.toISOString(),
            readable: dateToFormat.toLocaleString('en-US', { timeZone: timezone }),
            date: dateToFormat.toLocaleDateString('en-US', { timeZone: timezone }),
            time: dateToFormat.toLocaleTimeString('en-US', { timeZone: timezone }),
          };

        case 'add':
          const baseDate = dateStr ? new Date(dateStr) : now;
          const amount = (args.amount as number) || 0;
          const unit = (args.unit as string) || 'days';

          const msPerUnit: Record<string, number> = {
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000,
            weeks: 7 * 24 * 60 * 60 * 1000,
          };

          if (unit === 'months') {
            baseDate.setMonth(baseDate.getMonth() + amount);
          } else if (unit === 'years') {
            baseDate.setFullYear(baseDate.getFullYear() + amount);
          } else {
            baseDate.setTime(baseDate.getTime() + amount * (msPerUnit[unit] || msPerUnit.days));
          }

          return {
            result: baseDate.toISOString(),
            readable: baseDate.toLocaleString('en-US'),
          };

        case 'diff':
          const date1 = dateStr ? new Date(dateStr) : now;
          const date2 = args.date2 ? new Date(args.date2 as string) : now;
          const diffMs = date2.getTime() - date1.getTime();

          return {
            milliseconds: diffMs,
            seconds: Math.floor(diffMs / 1000),
            minutes: Math.floor(diffMs / 60000),
            hours: Math.floor(diffMs / 3600000),
            days: Math.floor(diffMs / 86400000),
          };

        default:
          return { error: `Unknown operation: ${operation}` };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  },
};

/**
 * JSON Tool - Parse and manipulate JSON
 */
export const jsonTool: Tool = {
  name: 'json',
  description: 'Parse, validate, or transform JSON data.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Operation to perform',
        enum: ['parse', 'stringify', 'validate', 'get', 'set'],
      },
      data: {
        type: 'string',
        description: 'JSON string or object',
      },
      path: {
        type: 'string',
        description: 'JSON path for get/set operations (e.g., "user.name")',
      },
      value: {
        type: 'string',
        description: 'Value to set (for set operation)',
      },
    },
    required: ['operation', 'data'],
  },
  execute: async (args) => {
    const operation = args.operation as string;
    const data = args.data as string;
    const path = args.path as string | undefined;

    try {
      switch (operation) {
        case 'parse':
          return { result: JSON.parse(data) };

        case 'stringify':
          const obj = typeof data === 'string' ? JSON.parse(data) : data;
          return { result: JSON.stringify(obj, null, 2) };

        case 'validate':
          JSON.parse(data);
          return { valid: true };

        case 'get':
          if (!path) return { error: 'Path required for get operation' };
          const parsed = JSON.parse(data);
          const parts = path.split('.');
          let current: any = parsed;
          for (const part of parts) {
            current = current?.[part];
          }
          return { result: current };

        case 'set':
          if (!path) return { error: 'Path required for set operation' };
          const objToModify = JSON.parse(data);
          const pathParts = path.split('.');
          let target: any = objToModify;
          for (let i = 0; i < pathParts.length - 1; i++) {
            target = target[pathParts[i]] = target[pathParts[i]] || {};
          }
          target[pathParts[pathParts.length - 1]] = args.value;
          return { result: objToModify };

        default:
          return { error: `Unknown operation: ${operation}` };
      }
    } catch (error: any) {
      if (operation === 'validate') {
        return { valid: false, error: error.message };
      }
      return { error: error.message };
    }
  },
};

/**
 * Memory Tool - Store and retrieve information during conversation
 */
export const memoryTool: Tool = {
  name: 'memory',
  description: 'Store and retrieve information during the conversation. Use this to remember important facts, user preferences, or intermediate results.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Operation to perform',
        enum: ['store', 'retrieve', 'list', 'delete', 'clear'],
      },
      key: {
        type: 'string',
        description: 'Key to store/retrieve',
      },
      value: {
        type: 'string',
        description: 'Value to store',
      },
    },
    required: ['operation'],
  },
  execute: async (args) => {
    // Use a simple in-memory store
    const store = (global as any).__ranaMemoryStore || {};
    (global as any).__ranaMemoryStore = store;

    const operation = args.operation as string;
    const key = args.key as string | undefined;
    const value = args.value as string | undefined;

    switch (operation) {
      case 'store':
        if (!key || value === undefined) {
          return { error: 'Key and value required for store operation' };
        }
        store[key] = value;
        return { success: true, key, value };

      case 'retrieve':
        if (!key) return { error: 'Key required for retrieve operation' };
        return { key, value: store[key] ?? null };

      case 'list':
        return { keys: Object.keys(store), count: Object.keys(store).length };

      case 'delete':
        if (!key) return { error: 'Key required for delete operation' };
        const existed = key in store;
        delete store[key];
        return { success: true, existed };

      case 'clear':
        (global as any).__ranaMemoryStore = {};
        return { success: true, message: 'Memory cleared' };

      default:
        return { error: `Unknown operation: ${operation}` };
    }
  },
};

/**
 * Create a tool from a simple function
 */
export function createTool(config: {
  name: string;
  description: string;
  parameters: Tool['parameters'];
  execute: Tool['execute'];
}): Tool {
  return config;
}

/**
 * Default tool registry with built-in tools
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry
    .register(calculatorTool)
    .register(dateTimeTool)
    .register(jsonTool)
    .register(memoryTool);
  // Note: webSearchTool requires API integration
  return registry;
}
