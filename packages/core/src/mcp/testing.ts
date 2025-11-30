/**
 * @rana/mcp/testing
 * MCP Testing utilities for testing MCP servers and tools
 *
 * @example
 * ```typescript
 * import { createMCPTestClient, mockTransport } from '@rana/core';
 *
 * describe('My MCP Server', () => {
 *   it('should handle get_weather tool', async () => {
 *     const { client, server } = await createMCPTestHarness(myServer);
 *
 *     const result = await client.callTool('get_weather', {
 *       location: 'San Francisco',
 *     });
 *
 *     expect(result.isError).toBe(false);
 *     expect(result.content[0].text).toContain('San Francisco');
 *   });
 * });
 * ```
 */

import {
  MCPTransport,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContents,
  MCPPrompt,
  MCPGetPromptResult,
  MCPServerInfo,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  MCPContent,
} from './types';
import { MCPServer, ToolDefinition } from './server';
import { MCPClient } from './client';

// ============================================================================
// Mock Transport
// ============================================================================

/**
 * In-memory transport for testing
 */
export class MockTransport implements MCPTransport {
  private messageHandler?: (message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification) => void;
  private closeHandler?: () => void;
  private errorHandler?: (error: Error) => void;
  private peer?: MockTransport;
  private started = false;
  private closed = false;
  private messageLog: Array<{
    direction: 'sent' | 'received';
    message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;
    timestamp: number;
  }> = [];

  async start(): Promise<void> {
    this.started = true;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.closeHandler?.();
  }

  async send(message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification): Promise<void> {
    if (this.closed) {
      throw new Error('Transport is closed');
    }

    this.messageLog.push({
      direction: 'sent',
      message,
      timestamp: Date.now(),
    });

    // Deliver to peer
    if (this.peer) {
      this.peer.receive(message);
    }
  }

  receive(message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification): void {
    this.messageLog.push({
      direction: 'received',
      message,
      timestamp: Date.now(),
    });

    this.messageHandler?.(message);
  }

  onMessage(handler: (message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification) => void): void {
    this.messageHandler = handler;
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Connect this transport to another (for bidirectional communication)
   */
  connect(peer: MockTransport): void {
    this.peer = peer;
    peer.peer = this;
  }

  /**
   * Get message log
   */
  getMessageLog(): typeof this.messageLog {
    return [...this.messageLog];
  }

  /**
   * Clear message log
   */
  clearMessageLog(): void {
    this.messageLog = [];
  }

  /**
   * Simulate an error
   */
  simulateError(error: Error): void {
    this.errorHandler?.(error);
  }

  /**
   * Check if transport is started
   */
  isStarted(): boolean {
    return this.started;
  }

  /**
   * Check if transport is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Create a connected pair of mock transports
 */
export function createMockTransportPair(): [MockTransport, MockTransport] {
  const clientTransport = new MockTransport();
  const serverTransport = new MockTransport();
  clientTransport.connect(serverTransport);
  return [clientTransport, serverTransport];
}

// ============================================================================
// Test Harness
// ============================================================================

export interface MCPTestHarness {
  client: MCPClient;
  server: MCPServer;
  clientTransport: MockTransport;
  serverTransport: MockTransport;
  serverInfo: MCPServerInfo;

  /** Call a tool and return the result */
  callTool(name: string, args?: Record<string, unknown>): Promise<MCPToolResult>;

  /** Read a resource */
  readResource(uri: string): Promise<MCPResourceContents>;

  /** Get a prompt */
  getPrompt(name: string, args?: Record<string, string>): Promise<MCPGetPromptResult>;

  /** Get all sent messages */
  getMessages(): Array<{
    direction: 'sent' | 'received';
    message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;
    timestamp: number;
  }>;

  /** Clean up */
  cleanup(): Promise<void>;
}

/**
 * Create a test harness for an MCP server
 */
export async function createMCPTestHarness(server: MCPServer): Promise<MCPTestHarness> {
  const [clientTransport, serverTransport] = createMockTransportPair();

  server.setTransport(serverTransport);

  const client = new MCPClient({
    name: 'test-client',
    version: '1.0.0',
    transport: clientTransport,
  });

  // Start server first
  await server.start();

  // Then connect client
  const serverInfo = await client.connect();

  return {
    client,
    server,
    clientTransport,
    serverTransport,
    serverInfo,

    callTool: (name, args) => client.callTool(name, args),
    readResource: (uri) => client.readResource(uri),
    getPrompt: (name, args) => client.getPrompt(name, args),
    getMessages: () => [
      ...clientTransport.getMessageLog(),
      ...serverTransport.getMessageLog(),
    ].sort((a, b) => a.timestamp - b.timestamp),

    cleanup: async () => {
      await client.disconnect();
      await server.stop();
    },
  };
}

// ============================================================================
// Test Client
// ============================================================================

/**
 * Lightweight test client for testing MCP servers directly
 */
export class MCPTestClient {
  private server: MCPServer;

  constructor(server: MCPServer) {
    this.server = server;
  }

  /**
   * List all tools
   */
  listTools(): MCPTool[] {
    return this.server.listTools();
  }

  /**
   * Call a tool directly
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPToolResult> {
    return this.server.callTool(name, args);
  }

  /**
   * List all resources
   */
  listResources(): MCPResource[] {
    return this.server.listResources();
  }

  /**
   * Read a resource directly
   */
  async readResource(uri: string): Promise<MCPResourceContents> {
    return this.server.readResource(uri);
  }

  /**
   * List all prompts
   */
  listPrompts(): MCPPrompt[] {
    return this.server.listPrompts();
  }

  /**
   * Get a prompt directly
   */
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<MCPGetPromptResult> {
    return this.server.getPrompt(name, args);
  }

  /**
   * Get server info
   */
  getServerInfo(): MCPServerInfo {
    return this.server.getInfo();
  }
}

/**
 * Create a test client for direct server testing
 */
export function createMCPTestClient(server: MCPServer): MCPTestClient {
  return new MCPTestClient(server);
}

// ============================================================================
// Assertions
// ============================================================================

export interface MCPAssertions {
  /** Assert tool exists */
  toHaveTool(name: string): void;

  /** Assert tool doesn't exist */
  notToHaveTool(name: string): void;

  /** Assert resource exists */
  toHaveResource(uri: string): void;

  /** Assert prompt exists */
  toHavePrompt(name: string): void;

  /** Assert tool result is successful */
  toBeSuccessfulResult(result: MCPToolResult): void;

  /** Assert tool result is an error */
  toBeErrorResult(result: MCPToolResult): void;

  /** Assert content contains text */
  toContainText(content: MCPContent[], text: string): void;

  /** Assert content matches pattern */
  toMatchText(content: MCPContent[], pattern: RegExp): void;
}

/**
 * Create assertions for an MCP server
 */
export function createMCPAssertions(server: MCPServer): MCPAssertions {
  return {
    toHaveTool(name: string): void {
      const tools = server.listTools();
      const found = tools.some((t) => t.name === name);
      if (!found) {
        throw new MCPTestError(`Expected server to have tool "${name}", but it doesn't`);
      }
    },

    notToHaveTool(name: string): void {
      const tools = server.listTools();
      const found = tools.some((t) => t.name === name);
      if (found) {
        throw new MCPTestError(`Expected server not to have tool "${name}", but it does`);
      }
    },

    toHaveResource(uri: string): void {
      const resources = server.listResources();
      const found = resources.some((r) => r.uri === uri);
      if (!found) {
        throw new MCPTestError(`Expected server to have resource "${uri}", but it doesn't`);
      }
    },

    toHavePrompt(name: string): void {
      const prompts = server.listPrompts();
      const found = prompts.some((p) => p.name === name);
      if (!found) {
        throw new MCPTestError(`Expected server to have prompt "${name}", but it doesn't`);
      }
    },

    toBeSuccessfulResult(result: MCPToolResult): void {
      if (result.isError) {
        const text = result.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('\n');
        throw new MCPTestError(`Expected successful result, but got error: ${text}`);
      }
    },

    toBeErrorResult(result: MCPToolResult): void {
      if (!result.isError) {
        throw new MCPTestError('Expected error result, but got success');
      }
    },

    toContainText(content: MCPContent[], text: string): void {
      const allText = content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      if (!allText.includes(text)) {
        throw new MCPTestError(
          `Expected content to contain "${text}", but got: ${allText.slice(0, 200)}`
        );
      }
    },

    toMatchText(content: MCPContent[], pattern: RegExp): void {
      const allText = content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      if (!pattern.test(allText)) {
        throw new MCPTestError(
          `Expected content to match ${pattern}, but got: ${allText.slice(0, 200)}`
        );
      }
    },
  };
}

// ============================================================================
// Tool Testing Utilities
// ============================================================================

export interface ToolTestCase {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  expectedOutput?: string | RegExp;
  expectedError?: boolean;
  validate?: (result: MCPToolResult) => void | Promise<void>;
}

/**
 * Run test cases against a tool
 */
export async function runToolTests(
  server: MCPServer,
  toolName: string,
  testCases: ToolTestCase[]
): Promise<ToolTestResult[]> {
  const results: ToolTestResult[] = [];

  for (const testCase of testCases) {
    const startTime = Date.now();
    let passed = true;
    let error: string | undefined;
    let result: MCPToolResult | undefined;

    try {
      result = await server.callTool(toolName, testCase.input);

      // Check expected error
      if (testCase.expectedError !== undefined) {
        if (testCase.expectedError !== result.isError) {
          passed = false;
          error = testCase.expectedError
            ? 'Expected error but got success'
            : 'Expected success but got error';
        }
      }

      // Check expected output
      if (testCase.expectedOutput && !result.isError) {
        const text = result.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('\n');

        if (typeof testCase.expectedOutput === 'string') {
          if (!text.includes(testCase.expectedOutput)) {
            passed = false;
            error = `Expected output to contain "${testCase.expectedOutput}"`;
          }
        } else {
          if (!testCase.expectedOutput.test(text)) {
            passed = false;
            error = `Expected output to match ${testCase.expectedOutput}`;
          }
        }
      }

      // Run custom validation
      if (testCase.validate) {
        await testCase.validate(result);
      }
    } catch (e) {
      passed = false;
      error = (e as Error).message;
    }

    results.push({
      name: testCase.name,
      passed,
      error,
      result,
      duration: Date.now() - startTime,
    });
  }

  return results;
}

export interface ToolTestResult {
  name: string;
  passed: boolean;
  error?: string;
  result?: MCPToolResult;
  duration: number;
}

/**
 * Format test results as a string
 */
export function formatToolTestResults(results: ToolTestResult[]): string {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  let output = `\nTool Tests: ${passed} passed, ${failed} failed\n`;
  output += '─'.repeat(50) + '\n';

  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    output += `${icon} ${result.name} (${result.duration}ms)\n`;
    if (!result.passed && result.error) {
      output += `  Error: ${result.error}\n`;
    }
  }

  return output;
}

// ============================================================================
// Snapshot Testing
// ============================================================================

export interface MCPSnapshot {
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  serverInfo: MCPServerInfo;
}

/**
 * Create a snapshot of an MCP server
 */
export function createMCPSnapshot(server: MCPServer): MCPSnapshot {
  return {
    tools: server.listTools(),
    resources: server.listResources(),
    prompts: server.listPrompts(),
    serverInfo: server.getInfo(),
  };
}

/**
 * Compare two snapshots
 */
export function compareMCPSnapshots(
  a: MCPSnapshot,
  b: MCPSnapshot
): MCPSnapshotDiff {
  const diff: MCPSnapshotDiff = {
    tools: {
      added: [],
      removed: [],
      changed: [],
    },
    resources: {
      added: [],
      removed: [],
    },
    prompts: {
      added: [],
      removed: [],
    },
    hasChanges: false,
  };

  // Compare tools
  const aToolNames = new Set(a.tools.map((t) => t.name));
  const bToolNames = new Set(b.tools.map((t) => t.name));

  for (const tool of b.tools) {
    if (!aToolNames.has(tool.name)) {
      diff.tools.added.push(tool.name);
      diff.hasChanges = true;
    }
  }

  for (const tool of a.tools) {
    if (!bToolNames.has(tool.name)) {
      diff.tools.removed.push(tool.name);
      diff.hasChanges = true;
    }
  }

  // Compare resources
  const aResourceUris = new Set(a.resources.map((r) => r.uri));
  const bResourceUris = new Set(b.resources.map((r) => r.uri));

  for (const resource of b.resources) {
    if (!aResourceUris.has(resource.uri)) {
      diff.resources.added.push(resource.uri);
      diff.hasChanges = true;
    }
  }

  for (const resource of a.resources) {
    if (!bResourceUris.has(resource.uri)) {
      diff.resources.removed.push(resource.uri);
      diff.hasChanges = true;
    }
  }

  // Compare prompts
  const aPromptNames = new Set(a.prompts.map((p) => p.name));
  const bPromptNames = new Set(b.prompts.map((p) => p.name));

  for (const prompt of b.prompts) {
    if (!aPromptNames.has(prompt.name)) {
      diff.prompts.added.push(prompt.name);
      diff.hasChanges = true;
    }
  }

  for (const prompt of a.prompts) {
    if (!bPromptNames.has(prompt.name)) {
      diff.prompts.removed.push(prompt.name);
      diff.hasChanges = true;
    }
  }

  return diff;
}

export interface MCPSnapshotDiff {
  tools: {
    added: string[];
    removed: string[];
    changed: string[];
  };
  resources: {
    added: string[];
    removed: string[];
  };
  prompts: {
    added: string[];
    removed: string[];
  };
  hasChanges: boolean;
}

// ============================================================================
// Mock Tool Builder
// ============================================================================

/**
 * Build mock tools for testing
 */
export class MockToolBuilder {
  private tools: ToolDefinition[] = [];

  /**
   * Add a mock tool that returns static text
   */
  addStaticTool(name: string, response: string): this {
    this.tools.push({
      name,
      description: `Mock tool: ${name}`,
      inputSchema: { type: 'object' },
      handler: async () => ({
        content: [{ type: 'text', text: response }],
        isError: false,
      }),
    });
    return this;
  }

  /**
   * Add a mock tool that echoes input
   */
  addEchoTool(name: string): this {
    this.tools.push({
      name,
      description: `Echo tool: ${name}`,
      inputSchema: { type: 'object', additionalProperties: true },
      handler: async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(args, null, 2) }],
        isError: false,
      }),
    });
    return this;
  }

  /**
   * Add a mock tool that always errors
   */
  addErrorTool(name: string, errorMessage: string): this {
    this.tools.push({
      name,
      description: `Error tool: ${name}`,
      inputSchema: { type: 'object' },
      handler: async () => ({
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      }),
    });
    return this;
  }

  /**
   * Add a mock tool with custom handler
   */
  addTool(definition: ToolDefinition): this {
    this.tools.push(definition);
    return this;
  }

  /**
   * Build the tools array
   */
  build(): ToolDefinition[] {
    return this.tools;
  }

  /**
   * Create a server with these mock tools
   */
  createServer(name = 'mock-server', version = '1.0.0'): MCPServer {
    const server = new MCPServer({ name, version });
    server.tools(this.tools);
    return server;
  }
}

/**
 * Create a mock tool builder
 */
export function mockTools(): MockToolBuilder {
  return new MockToolBuilder();
}

// ============================================================================
// Errors
// ============================================================================

export class MCPTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPTestError';
  }
}
