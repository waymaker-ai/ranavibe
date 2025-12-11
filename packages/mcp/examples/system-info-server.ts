#!/usr/bin/env node
/**
 * System Info MCP Server Example
 * Demonstrates system information and monitoring
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const server = new Server(
  { name: 'system-info-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

const tools = [
  {
    name: 'get_system_info',
    description: 'Get detailed system information',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_cpu_usage',
    description: 'Get current CPU usage',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_memory_usage',
    description: 'Get current memory usage',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_disk_usage',
    description: 'Get disk usage for a path',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Path to check (default: /)' },
      },
    },
  },
  {
    name: 'get_network_info',
    description: 'Get network interface information',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_process_info',
    description: 'Get current process information',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_env_var',
    description: 'Get an environment variable (safe subset)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Environment variable name' },
      },
      required: ['name'],
    },
  },
];

// Safe environment variables that can be read
const SAFE_ENV_VARS = ['PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'TERM', 'NODE_ENV', 'PWD'];

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let totalIdle = 0, totalTick = 0;

      for (let i = 0; i < start.length; i++) {
        const startCpu = start[i].times;
        const endCpu = end[i].times;

        const idle = endCpu.idle - startCpu.idle;
        const total = Object.values(endCpu).reduce((a, b) => a + b, 0) -
                      Object.values(startCpu).reduce((a, b) => a + b, 0);

        totalIdle += idle;
        totalTick += total;
      }

      resolve(Math.round((1 - totalIdle / totalTick) * 100));
    }, 100);
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_system_info': {
      const info = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        type: os.type(),
        uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        totalMemory: formatBytes(os.totalmem()),
        freeMemory: formatBytes(os.freemem()),
        homeDir: os.homedir(),
        tmpDir: os.tmpdir(),
        nodeVersion: process.version,
      };
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    }

    case 'get_cpu_usage': {
      const usage = await getCpuUsage();
      const cpus = os.cpus().map((cpu, i) => ({
        core: i,
        model: cpu.model,
        speed: `${cpu.speed} MHz`,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify({ usage: `${usage}%`, cores: cpus.length, cpus }, null, 2) }],
      };
    }

    case 'get_memory_usage': {
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      const info = {
        total: formatBytes(total),
        used: formatBytes(used),
        free: formatBytes(free),
        usedPercent: `${Math.round((used / total) * 100)}%`,
        freePercent: `${Math.round((free / total) * 100)}%`,
      };
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    }

    case 'get_disk_usage': {
      const targetPath = (args as { path?: string }).path || '/';
      try {
        const stats = fs.statfsSync(targetPath);
        const total = stats.blocks * stats.bsize;
        const free = stats.bfree * stats.bsize;
        const used = total - free;
        const info = {
          path: targetPath,
          total: formatBytes(total),
          used: formatBytes(used),
          free: formatBytes(free),
          usedPercent: `${Math.round((used / total) * 100)}%`,
        };
        return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown'}` }],
          isError: true,
        };
      }
    }

    case 'get_network_info': {
      const interfaces = os.networkInterfaces();
      const info: Record<string, unknown[]> = {};
      for (const [name, addrs] of Object.entries(interfaces)) {
        if (addrs) {
          info[name] = addrs.map(addr => ({
            address: addr.address,
            family: addr.family,
            internal: addr.internal,
            mac: addr.mac,
          }));
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    }

    case 'get_process_info': {
      const info = {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        argv: process.argv,
        cwd: process.cwd(),
        execPath: process.execPath,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: {
          rss: formatBytes(process.memoryUsage().rss),
          heapTotal: formatBytes(process.memoryUsage().heapTotal),
          heapUsed: formatBytes(process.memoryUsage().heapUsed),
          external: formatBytes(process.memoryUsage().external),
        },
        uptime: `${Math.floor(process.uptime())}s`,
      };
      return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
    }

    case 'get_env_var': {
      const { name: varName } = args as { name: string };
      if (!SAFE_ENV_VARS.includes(varName.toUpperCase())) {
        return {
          content: [{ type: 'text', text: `Cannot read ${varName}. Safe vars: ${SAFE_ENV_VARS.join(', ')}` }],
          isError: true,
        };
      }
      const value = process.env[varName.toUpperCase()];
      return { content: [{ type: 'text', text: JSON.stringify({ name: varName, value: value || null }, null, 2) }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'system://info', name: 'System Info', description: 'Full system information', mimeType: 'application/json' },
    { uri: 'system://status', name: 'System Status', description: 'Current system status', mimeType: 'application/json' },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'system://info':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: formatBytes(os.totalmem()),
          }),
        }],
      };
    case 'system://status': {
      const usage = await getCpuUsage();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            cpu: `${usage}%`,
            memory: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`,
            uptime: `${Math.floor(os.uptime() / 3600)}h`,
          }),
        }],
      };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('System Info MCP server running');
}

main().catch(console.error);
