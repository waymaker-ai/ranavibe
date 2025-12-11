#!/usr/bin/env node
/**
 * Calculator MCP Server Example
 * Demonstrates tool validation and error handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'calculator-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: 'calculate',
    description: 'Perform basic arithmetic operations',
    inputSchema: {
      type: 'object' as const,
      properties: {
        operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'mod'] },
        a: { type: 'number', description: 'First operand' },
        b: { type: 'number', description: 'Second operand (not needed for sqrt)' },
      },
      required: ['operation', 'a'],
    },
  },
  {
    name: 'convert_units',
    description: 'Convert between units',
    inputSchema: {
      type: 'object' as const,
      properties: {
        value: { type: 'number', description: 'Value to convert' },
        from: { type: 'string', description: 'Source unit' },
        to: { type: 'string', description: 'Target unit' },
      },
      required: ['value', 'from', 'to'],
    },
  },
  {
    name: 'statistics',
    description: 'Calculate statistics for a list of numbers',
    inputSchema: {
      type: 'object' as const,
      properties: {
        numbers: { type: 'array', items: { type: 'number' }, description: 'List of numbers' },
      },
      required: ['numbers'],
    },
  },
];

// Unit conversion factors (to base unit)
const unitFactors: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, in: 0.0254 },
  weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
  temperature: { c: 1, f: 1, k: 1 }, // Special handling
};

function convertTemp(value: number, from: string, to: string): number {
  // Convert to Celsius first
  let celsius = value;
  if (from === 'f') celsius = (value - 32) * 5/9;
  else if (from === 'k') celsius = value - 273.15;

  // Convert from Celsius to target
  if (to === 'c') return celsius;
  if (to === 'f') return celsius * 9/5 + 32;
  if (to === 'k') return celsius + 273.15;
  return celsius;
}

function findUnitCategory(unit: string): string | null {
  const u = unit.toLowerCase();
  for (const [category, units] of Object.entries(unitFactors)) {
    if (u in units) return category;
  }
  return null;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'calculate': {
      const { operation, a, b } = args as { operation: string; a: number; b?: number };

      let result: number;
      switch (operation) {
        case 'add': result = a + (b ?? 0); break;
        case 'subtract': result = a - (b ?? 0); break;
        case 'multiply': result = a * (b ?? 1); break;
        case 'divide':
          if (b === 0) return { content: [{ type: 'text', text: 'Error: Division by zero' }], isError: true };
          result = a / (b ?? 1);
          break;
        case 'power': result = Math.pow(a, b ?? 2); break;
        case 'sqrt':
          if (a < 0) return { content: [{ type: 'text', text: 'Error: Cannot sqrt negative number' }], isError: true };
          result = Math.sqrt(a);
          break;
        case 'mod':
          if (b === 0) return { content: [{ type: 'text', text: 'Error: Modulo by zero' }], isError: true };
          result = a % (b ?? 1);
          break;
        default:
          return { content: [{ type: 'text', text: `Unknown operation: ${operation}` }], isError: true };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ operation, a, b, result }, null, 2) }],
      };
    }

    case 'convert_units': {
      const { value, from, to } = args as { value: number; from: string; to: string };
      const fromLower = from.toLowerCase();
      const toLower = to.toLowerCase();

      // Check temperature conversion
      if (['c', 'f', 'k'].includes(fromLower) && ['c', 'f', 'k'].includes(toLower)) {
        const result = convertTemp(value, fromLower, toLower);
        return {
          content: [{ type: 'text', text: JSON.stringify({ value, from, to, result: Math.round(result * 100) / 100 }, null, 2) }],
        };
      }

      // Find categories
      const fromCategory = findUnitCategory(fromLower);
      const toCategory = findUnitCategory(toLower);

      if (!fromCategory || !toCategory) {
        return { content: [{ type: 'text', text: `Unknown unit: ${!fromCategory ? from : to}` }], isError: true };
      }

      if (fromCategory !== toCategory) {
        return { content: [{ type: 'text', text: `Cannot convert ${from} to ${to} (different categories)` }], isError: true };
      }

      const baseValue = value * unitFactors[fromCategory][fromLower];
      const result = baseValue / unitFactors[toCategory][toLower];

      return {
        content: [{ type: 'text', text: JSON.stringify({ value, from, to, result: Math.round(result * 10000) / 10000 }, null, 2) }],
      };
    }

    case 'statistics': {
      const { numbers } = args as { numbers: number[] };

      if (numbers.length === 0) {
        return { content: [{ type: 'text', text: 'Error: Empty array' }], isError: true };
      }

      const sorted = [...numbers].sort((a, b) => a - b);
      const sum = numbers.reduce((a, b) => a + b, 0);
      const mean = sum / numbers.length;
      const median = numbers.length % 2 === 0
        ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
        : sorted[Math.floor(numbers.length / 2)];
      const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numbers.length;
      const stdDev = Math.sqrt(variance);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: numbers.length,
            sum: Math.round(sum * 100) / 100,
            mean: Math.round(mean * 100) / 100,
            median: Math.round(median * 100) / 100,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            range: sorted[sorted.length - 1] - sorted[0],
            variance: Math.round(variance * 100) / 100,
            stdDev: Math.round(stdDev * 100) / 100,
          }, null, 2),
        }],
      };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Calculator MCP server running');
}

main().catch(console.error);
