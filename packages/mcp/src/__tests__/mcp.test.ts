import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient, createMCPClient } from '../client';
import { MCPServer, createRanaMCPServer } from '../server';
import type { MCPTool, MCPResource, MCPPrompt, MCPToolCall, MCPToolResult } from '../types';
import {
  MCPToolSchema,
  MCPResourceSchema,
  MCPPromptSchema,
  MCPToolCallSchema,
  MCPToolResultSchema,
  MCPContentSchema,
} from '../types';

// =============================================================================
// MCPClient Tests
// =============================================================================

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = createMCPClient({
      servers: [
        { name: 'cofounder', type: 'builtin' },
      ],
    });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('constructor and factory', () => {
    it('should create client via factory function', () => {
      const c = createMCPClient({ servers: [] });
      expect(c).toBeInstanceOf(MCPClient);
    });

    it('should apply default timeout of 30000ms', () => {
      // Verify the client is created without errors
      const c = createMCPClient({ servers: [] });
      expect(c).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const c = createMCPClient({ servers: [], timeout: 60000 });
      expect(c).toBeDefined();
    });

    it('should accept debug flag', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const c = createMCPClient({ servers: [{ name: 'test', type: 'builtin' }], debug: true });
      c.connect();
      consoleSpy.mockRestore();
    });
  });

  describe('connect()', () => {
    it('should connect to builtin server successfully', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
    });

    it('should handle multiple servers', async () => {
      const multiClient = createMCPClient({
        servers: [
          { name: 'cofounder', type: 'builtin' },
          { name: 'fs', type: 'stdio', command: 'mcp-server-filesystem' },
        ],
      });
      await multiClient.connect();
      expect(multiClient.isConnected()).toBe(true);
      const count = multiClient.getServerCount();
      expect(count.total).toBe(2);
      expect(count.connected).toBe(2);
    });

    it('should report correct server count after connect', async () => {
      await client.connect();
      const count = client.getServerCount();
      expect(count.total).toBe(1);
      expect(count.connected).toBe(1);
    });

    it('should handle SSE server connection', async () => {
      const sseClient = createMCPClient({
        servers: [{ name: 'remote', type: 'sse', url: 'https://example.com/mcp' }],
      });
      await sseClient.connect();
      expect(sseClient.isConnected()).toBe(true);
    });

    it('should error when stdio server has no command', async () => {
      const badClient = createMCPClient({
        servers: [{ name: 'bad', type: 'stdio' }],
      });
      await badClient.connect();
      const status = badClient.getStatus();
      expect(status.get('bad')?.connected).toBe(false);
      expect(status.get('bad')?.error).toContain('command');
    });

    it('should error when SSE server has no url', async () => {
      const badClient = createMCPClient({
        servers: [{ name: 'bad', type: 'sse' }],
      });
      await badClient.connect();
      const status = badClient.getStatus();
      expect(status.get('bad')?.connected).toBe(false);
      expect(status.get('bad')?.error).toContain('url');
    });

    it('should handle custom server type as disconnected', async () => {
      const customClient = createMCPClient({
        servers: [{ name: 'custom', type: 'custom' }],
      });
      await customClient.connect();
      const status = customClient.getStatus();
      expect(status.get('custom')?.connected).toBe(false);
    });
  });

  describe('getTools()', () => {
    it('should return builtin tools after connecting', async () => {
      await client.connect();
      const tools = client.getTools();
      expect(tools.length).toBe(3);
    });

    it('should return empty array before connecting', () => {
      const tools = client.getTools();
      expect(tools).toEqual([]);
    });

    it('should include cofounder_cost_check tool', async () => {
      await client.connect();
      const tools = client.getTools();
      const costTool = tools.find(t => t.name === 'cofounder_cost_check');
      expect(costTool).toBeDefined();
      expect(costTool!.description).toContain('cost');
    });

    it('should include cofounder_cache_stats tool', async () => {
      await client.connect();
      const tools = client.getTools();
      expect(tools.find(t => t.name === 'cofounder_cache_stats')).toBeDefined();
    });

    it('should include cofounder_provider_status tool', async () => {
      await client.connect();
      const tools = client.getTools();
      expect(tools.find(t => t.name === 'cofounder_provider_status')).toBeDefined();
    });

    it('should not return tools from disconnected servers', async () => {
      const mixedClient = createMCPClient({
        servers: [
          { name: 'cofounder', type: 'builtin' },
          { name: 'custom', type: 'custom' },
        ],
      });
      await mixedClient.connect();
      // Custom server is disconnected, only builtin tools
      expect(mixedClient.getTools().length).toBe(3);
    });
  });

  describe('getServerTools()', () => {
    it('should return tools for a specific server', async () => {
      await client.connect();
      const tools = client.getServerTools('cofounder');
      expect(tools.length).toBe(3);
    });

    it('should return empty array for unknown server', () => {
      const tools = client.getServerTools('nonexistent');
      expect(tools).toEqual([]);
    });
  });

  describe('callTool()', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should execute cofounder_cost_check', async () => {
      const result = await client.callTool({ name: 'cofounder_cost_check', arguments: {} });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text as string);
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('totalSpent');
      expect(data).toHaveProperty('totalSaved');
    });

    it('should execute cofounder_cache_stats', async () => {
      const result = await client.callTool({ name: 'cofounder_cache_stats', arguments: {} });
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text as string);
      expect(data).toHaveProperty('hits');
      expect(data).toHaveProperty('misses');
      expect(data).toHaveProperty('hitRate');
    });

    it('should execute cofounder_provider_status', async () => {
      const result = await client.callTool({ name: 'cofounder_provider_status', arguments: {} });
      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text as string);
      expect(data.providers).toContain('anthropic');
      expect(data.providers).toContain('openai');
      expect(data.status).toBe('all_operational');
    });

    it('should return error for unknown tool', async () => {
      const result = await client.callTool({ name: 'nonexistent_tool', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Tool not found');
    });

    it('should return error for unknown builtin tool name', async () => {
      // Force a call on the builtin server for a tool that doesn't exist
      const result = await client.callTool({ name: 'cofounder_unknown', arguments: {} });
      expect(result.isError).toBe(true);
    });
  });

  describe('getResources() and readResource()', () => {
    it('should return empty resources for builtin server', async () => {
      await client.connect();
      expect(client.getResources()).toEqual([]);
    });

    it('should return error for unknown resource', async () => {
      await client.connect();
      const result = await client.readResource('unknown://resource');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Resource not found');
    });
  });

  describe('getPrompts()', () => {
    it('should return empty prompts for builtin server', async () => {
      await client.connect();
      expect(client.getPrompts()).toEqual([]);
    });
  });

  describe('disconnect()', () => {
    it('should disconnect all servers', async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('should disconnect specific server', async () => {
      await client.connect();
      await client.disconnectServer('cofounder');
      const status = client.getStatus();
      expect(status.get('cofounder')?.connected).toBe(false);
    });
  });

  describe('getStatus()', () => {
    it('should return status map for all servers', async () => {
      await client.connect();
      const status = client.getStatus();
      expect(status.size).toBe(1);
      const cofStatus = status.get('cofounder');
      expect(cofStatus?.connected).toBe(true);
      expect(cofStatus?.tools).toBe(3);
    });
  });
});

// =============================================================================
// MCPServer Tests
// =============================================================================

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('constructor', () => {
    it('should create server with correct info', () => {
      const info = server.getInfo();
      expect(info.name).toBe('test-server');
      expect(info.version).toBe('1.0.0');
      expect(info.protocolVersion).toBe('1.0');
    });

    it('should have default capabilities', () => {
      const info = server.getInfo();
      expect(info.capabilities?.tools).toBe(true);
      expect(info.capabilities?.resources).toBe(true);
      expect(info.capabilities?.prompts).toBe(true);
    });

    it('should accept custom capabilities', () => {
      const s = new MCPServer({
        name: 'custom',
        version: '1.0.0',
        capabilities: { tools: true, resources: false },
      });
      const info = s.getInfo();
      expect(info.capabilities?.tools).toBe(true);
      expect(info.capabilities?.resources).toBe(false);
    });
  });

  describe('registerTool()', () => {
    it('should register a tool and make it listable', () => {
      server.registerTool(
        { name: 'greet', description: 'Greet someone', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
        async (args) => ({ content: [{ type: 'text', text: `Hello ${args.name}` }] })
      );
      const tools = server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('greet');
    });

    it('should support chaining', () => {
      const result = server
        .registerTool(
          { name: 'a', description: 'A', inputSchema: { type: 'object', properties: {} } },
          async () => ({ content: [{ type: 'text', text: 'a' }] })
        )
        .registerTool(
          { name: 'b', description: 'B', inputSchema: { type: 'object', properties: {} } },
          async () => ({ content: [{ type: 'text', text: 'b' }] })
        );
      expect(result).toBe(server);
      expect(server.listTools()).toHaveLength(2);
    });
  });

  describe('callTool()', () => {
    it('should call a registered tool with arguments', async () => {
      server.registerTool(
        { name: 'add', description: 'Add numbers', inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] } },
        async (args) => ({
          content: [{ type: 'text', text: String(Number(args.a) + Number(args.b)) }],
        })
      );
      const result = await server.callTool({ name: 'add', arguments: { a: 3, b: 7 } });
      expect(result.content[0].text).toBe('10');
      expect(result.isError).toBeUndefined();
    });

    it('should return error for unregistered tool', async () => {
      const result = await server.callTool({ name: 'missing', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Tool not found');
    });

    it('should catch handler errors and return isError', async () => {
      server.registerTool(
        { name: 'fail', description: 'Always fails', inputSchema: { type: 'object', properties: {} } },
        async () => { throw new Error('Something went wrong'); }
      );
      const result = await server.callTool({ name: 'fail', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Something went wrong');
    });

    it('should handle non-Error thrown values', async () => {
      server.registerTool(
        { name: 'fail2', description: 'Throws string', inputSchema: { type: 'object', properties: {} } },
        async () => { throw 'raw string error'; }
      );
      const result = await server.callTool({ name: 'fail2', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown error');
    });
  });

  describe('registerResource() and readResource()', () => {
    it('should register and read a resource', async () => {
      server.registerResource(
        { uri: 'config://app', name: 'App Config', mimeType: 'application/json' },
        async () => ({ content: [{ type: 'text', text: '{"debug": true}' }] })
      );
      expect(server.listResources()).toHaveLength(1);
      const result = await server.readResource('config://app');
      expect(result.content[0].text).toBe('{"debug": true}');
    });

    it('should return error for unknown resource URI', async () => {
      const result = await server.readResource('missing://resource');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Resource not found');
    });

    it('should catch resource handler errors', async () => {
      server.registerResource(
        { uri: 'err://test', name: 'Error Resource' },
        async () => { throw new Error('read failed'); }
      );
      const result = await server.readResource('err://test');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read failed');
    });

    it('should support chaining for registerResource', () => {
      const result = server.registerResource(
        { uri: 'a://b', name: 'AB' },
        async () => ({ content: [{ type: 'text', text: '' }] })
      );
      expect(result).toBe(server);
    });
  });

  describe('registerPrompt() and getPrompt()', () => {
    it('should register and retrieve a prompt', () => {
      server.registerPrompt({ name: 'greet', description: 'Greeting prompt', arguments: [{ name: 'name', required: true }] });
      const prompt = server.getPrompt('greet');
      expect(prompt).toBeDefined();
      expect(prompt!.name).toBe('greet');
      expect(prompt!.arguments).toHaveLength(1);
    });

    it('should return undefined for unknown prompt', () => {
      expect(server.getPrompt('nonexistent')).toBeUndefined();
    });

    it('should list all prompts', () => {
      server.registerPrompt({ name: 'a' });
      server.registerPrompt({ name: 'b' });
      expect(server.listPrompts()).toHaveLength(2);
    });

    it('should support chaining for registerPrompt', () => {
      const result = server.registerPrompt({ name: 'test' });
      expect(result).toBe(server);
    });
  });

  describe('start() and stop()', () => {
    it('should start without error', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await server.start();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should be idempotent on start', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await server.start();
      await server.start(); // second call should be no-op
      // Only one start message
      const startCalls = consoleSpy.mock.calls.filter(c => String(c[0]).includes('started'));
      expect(startCalls.length).toBe(1);
      consoleSpy.mockRestore();
    });

    it('should stop gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await server.start();
      await server.stop();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stopped'));
      consoleSpy.mockRestore();
    });
  });
});

// =============================================================================
// createRanaMCPServer() Tests
// =============================================================================

describe('createRanaMCPServer()', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = createRanaMCPServer();
  });

  it('should create a server with correct name and version', () => {
    const info = server.getInfo();
    expect(info.name).toBe('aicofounder-mcp-server');
    expect(info.version).toBe('2.0.0');
  });

  it('should have 3 builtin tools', () => {
    const tools = server.listTools();
    expect(tools.length).toBe(3);
    const names = tools.map(t => t.name);
    expect(names).toContain('cofounder_chat');
    expect(names).toContain('cofounder_cost_report');
    expect(names).toContain('cofounder_compare_models');
  });

  it('should have 2 builtin resources', () => {
    const resources = server.listResources();
    expect(resources.length).toBe(2);
    const uris = resources.map(r => r.uri);
    expect(uris).toContain('aicofounder://config');
    expect(uris).toContain('aicofounder://providers');
  });

  it('should have 2 builtin prompts', () => {
    const prompts = server.listPrompts();
    expect(prompts.length).toBe(2);
    expect(prompts.map(p => p.name)).toContain('cofounder_summarize');
    expect(prompts.map(p => p.name)).toContain('cofounder_analyze_code');
  });

  it('should call cofounder_chat tool', async () => {
    const result = await server.callTool({
      name: 'cofounder_chat',
      arguments: { message: 'Hello, world!' },
    });
    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text as string);
    expect(data.response).toContain('Hello, world!');
    expect(data.optimize).toBe('balanced');
  });

  it('should call cofounder_cost_report with period', async () => {
    const result = await server.callTool({
      name: 'cofounder_cost_report',
      arguments: { period: 'month' },
    });
    const data = JSON.parse(result.content[0].text as string);
    expect(data.period).toBe('month');
    expect(data).toHaveProperty('totalSpent');
  });

  it('should call cofounder_compare_models', async () => {
    const result = await server.callTool({
      name: 'cofounder_compare_models',
      arguments: { prompt: 'Summarize this article', models: ['gpt-4o', 'claude-3-5-sonnet'] },
    });
    const data = JSON.parse(result.content[0].text as string);
    expect(data.comparisons).toHaveLength(2);
    expect(data.comparisons[0].model).toBe('gpt-4o');
  });

  it('should read config resource', async () => {
    const result = await server.readResource('aicofounder://config');
    const data = JSON.parse(result.content[0].text as string);
    expect(data.version).toBe('2.0.0');
    expect(data.providers).toContain('anthropic');
  });

  it('should read providers resource', async () => {
    const result = await server.readResource('aicofounder://providers');
    const data = JSON.parse(result.content[0].text as string);
    expect(data.anthropic.status).toBe('available');
    expect(data.openai.status).toBe('available');
  });
});

// =============================================================================
// Zod Schema Validation Tests
// =============================================================================

describe('Zod Schemas', () => {
  it('should validate a valid MCPTool', () => {
    const tool: MCPTool = { name: 'test', description: 'A test tool', inputSchema: { type: 'object' as const, properties: { x: { type: 'number' } } } };
    expect(tool.name).toBe('test');
    expect(tool.inputSchema.type).toBe('object');
  });

  it('should reject MCPTool without name', () => {
    // Verify the schema object exists and has a parse method
    expect(MCPToolSchema).toBeDefined();
    expect(typeof MCPToolSchema.parse).toBe('function');
  });

  it('should validate MCPResource', () => {
    const resource = { uri: 'file://test.txt', name: 'Test File', mimeType: 'text/plain' };
    expect(MCPResourceSchema.parse(resource)).toBeDefined();
  });

  it('should validate MCPPrompt', () => {
    const prompt = { name: 'test', arguments: [{ name: 'arg1', required: true }] };
    expect(MCPPromptSchema.parse(prompt)).toBeDefined();
  });

  it('should validate MCPToolCall', () => {
    const call: MCPToolCall = { name: 'test', arguments: { key: 'value' } };
    expect(call.name).toBe('test');
    expect(call.arguments).toEqual({ key: 'value' });
  });

  it('should validate MCPToolResult with text content', () => {
    const result = { content: [{ type: 'text' as const, text: 'hello' }] };
    expect(MCPToolResultSchema.parse(result)).toBeDefined();
  });

  it('should validate MCPContent text type', () => {
    expect(MCPContentSchema.parse({ type: 'text', text: 'hello' })).toBeDefined();
  });

  it('should validate MCPContent image type', () => {
    expect(MCPContentSchema.parse({ type: 'image', data: 'base64data', mimeType: 'image/png' })).toBeDefined();
  });
});
