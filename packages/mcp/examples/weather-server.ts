#!/usr/bin/env node
/**
 * Weather MCP Server Example
 * Demonstrates a simple API integration server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'weather-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tools
const tools = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    inputSchema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City name or coordinates' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' },
      },
      required: ['location'],
    },
  },
  {
    name: 'get_forecast',
    description: 'Get weather forecast for the next days',
    inputSchema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City name or coordinates' },
        days: { type: 'number', description: 'Number of days (1-7)' },
      },
      required: ['location'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_weather': {
      const { location, units = 'celsius' } = args as { location: string; units?: string };
      // In production, call a weather API here
      const weather = {
        location,
        temperature: units === 'celsius' ? 22 : 72,
        units,
        condition: 'Partly Cloudy',
        humidity: 65,
        wind: '15 km/h NW',
      };
      return { content: [{ type: 'text', text: JSON.stringify(weather, null, 2) }] };
    }

    case 'get_forecast': {
      const { location, days = 5 } = args as { location: string; days?: number };
      const forecast = Array.from({ length: Math.min(days, 7) }, (_, i) => ({
        day: i + 1,
        high: 20 + Math.floor(Math.random() * 10),
        low: 10 + Math.floor(Math.random() * 8),
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ location, forecast }, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather MCP server running');
}

main().catch(console.error);
