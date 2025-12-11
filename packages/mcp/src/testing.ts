/**
 * MCP Server Testing Utilities
 * Helpers for testing MCP servers
 */

import type { MCPTool, MCPToolCall, MCPToolResult, MCPResource, MCPPrompt } from './types';

// ============================================================================
// Types
// ============================================================================

export interface MockMCPServer {
  name: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  callTool: (call: MCPToolCall) => Promise<MCPToolResult>;
  readResource: (uri: string) => Promise<MCPToolResult>;
  getPrompt: (name: string) => MCPPrompt | undefined;
}

export interface TestResult {
  passed: boolean;
  name: string;
  duration: number;
  error?: string;
  details?: unknown;
}

export interface TestSuiteResult {
  server: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  results: TestResult[];
}

export interface ToolTestCase {
  name: string;
  tool: string;
  args: Record<string, unknown>;
  expect?: {
    success?: boolean;
    contains?: string;
    matches?: RegExp;
    validate?: (result: MCPToolResult) => boolean;
  };
}

// ============================================================================
// Mock Server
// ============================================================================

/**
 * Create a mock MCP server for testing
 */
export function createMockServer(config: {
  name: string;
  version?: string;
  tools?: Array<{ tool: MCPTool; handler: (args: Record<string, unknown>) => Promise<unknown> }>;
  resources?: Array<{ resource: MCPResource; handler: () => Promise<unknown> }>;
  prompts?: MCPPrompt[];
}): MockMCPServer {
  const toolHandlers = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();
  const resourceHandlers = new Map<string, () => Promise<unknown>>();

  for (const { tool, handler } of config.tools || []) {
    toolHandlers.set(tool.name, handler);
  }

  for (const { resource, handler } of config.resources || []) {
    resourceHandlers.set(resource.uri, handler);
  }

  return {
    name: config.name,
    version: config.version || '1.0.0',
    tools: (config.tools || []).map(t => t.tool),
    resources: (config.resources || []).map(r => r.resource),
    prompts: config.prompts || [],

    async callTool(call: MCPToolCall): Promise<MCPToolResult> {
      const handler = toolHandlers.get(call.name);
      if (!handler) {
        return {
          content: [{ type: 'text', text: `Tool not found: ${call.name}` }],
          isError: true,
        };
      }

      try {
        const result = await handler(call.arguments);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown'}` }],
          isError: true,
        };
      }
    },

    async readResource(uri: string): Promise<MCPToolResult> {
      const handler = resourceHandlers.get(uri);
      if (!handler) {
        return {
          content: [{ type: 'text', text: `Resource not found: ${uri}` }],
          isError: true,
        };
      }

      try {
        const result = await handler();
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown'}` }],
          isError: true,
        };
      }
    },

    getPrompt(name: string): MCPPrompt | undefined {
      return (config.prompts || []).find(p => p.name === name);
    },
  };
}

// ============================================================================
// Test Runner
// ============================================================================

/**
 * Run test cases against an MCP server
 */
export async function runToolTests(
  server: MockMCPServer,
  testCases: ToolTestCase[]
): Promise<TestSuiteResult> {
  const results: TestResult[] = [];
  const startTime = Date.now();

  for (const testCase of testCases) {
    const testStart = Date.now();
    let passed = false;
    let error: string | undefined;
    let details: unknown;

    try {
      const result = await server.callTool({
        name: testCase.tool,
        arguments: testCase.args,
      });

      details = result;

      if (testCase.expect) {
        // Check success expectation
        if (testCase.expect.success !== undefined) {
          passed = testCase.expect.success === !result.isError;
          if (!passed) {
            error = `Expected success=${testCase.expect.success}, got isError=${result.isError}`;
          }
        }

        // Check contains
        if (passed !== false && testCase.expect.contains) {
          const text = result.content.map(c => c.type === 'text' ? c.text : '').join('');
          passed = text.includes(testCase.expect.contains);
          if (!passed) {
            error = `Expected response to contain "${testCase.expect.contains}"`;
          }
        }

        // Check regex match
        if (passed !== false && testCase.expect.matches) {
          const text = result.content.map(c => c.type === 'text' ? c.text : '').join('');
          passed = testCase.expect.matches.test(text);
          if (!passed) {
            error = `Expected response to match ${testCase.expect.matches}`;
          }
        }

        // Custom validation
        if (passed !== false && testCase.expect.validate) {
          passed = testCase.expect.validate(result);
          if (!passed) {
            error = 'Custom validation failed';
          }
        }

        // If no expectations set, just check it didn't error
        if (
          testCase.expect.success === undefined &&
          !testCase.expect.contains &&
          !testCase.expect.matches &&
          !testCase.expect.validate
        ) {
          passed = !result.isError;
        }
      } else {
        // No expectations, just check it didn't error
        passed = !result.isError;
        if (!passed) {
          const errorText = result.content.find(c => c.type === 'text');
          error = errorText?.type === 'text' ? errorText.text : 'Tool returned error';
        }
      }
    } catch (err) {
      passed = false;
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    results.push({
      name: testCase.name,
      passed,
      duration: Date.now() - testStart,
      error,
      details,
    });
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    server: server.name,
    passed,
    failed,
    total: results.length,
    duration: Date.now() - startTime,
    results,
  };
}

// ============================================================================
// Assertions
// ============================================================================

/**
 * Assert that a tool exists in the server
 */
export function assertToolExists(server: MockMCPServer, toolName: string): void {
  const tool = server.tools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool "${toolName}" not found in server "${server.name}"`);
  }
}

/**
 * Assert that a resource exists in the server
 */
export function assertResourceExists(server: MockMCPServer, uri: string): void {
  const resource = server.resources.find(r => r.uri === uri);
  if (!resource) {
    throw new Error(`Resource "${uri}" not found in server "${server.name}"`);
  }
}

/**
 * Assert tool result is successful
 */
export function assertToolSuccess(result: MCPToolResult): void {
  if (result.isError) {
    const errorText = result.content.find(c => c.type === 'text');
    throw new Error(`Tool call failed: ${errorText?.type === 'text' ? errorText.text : 'Unknown error'}`);
  }
}

/**
 * Assert tool result contains text
 */
export function assertResultContains(result: MCPToolResult, text: string): void {
  const content = result.content.map(c => c.type === 'text' ? c.text : '').join('');
  if (!content.includes(text)) {
    throw new Error(`Result does not contain "${text}". Got: ${content}`);
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate test cases for all tools in a server
 */
export function generateToolTestCases(server: MockMCPServer): ToolTestCase[] {
  return server.tools.map(tool => ({
    name: `${tool.name} - basic call`,
    tool: tool.name,
    args: generateMockArgs(tool),
    expect: { success: true },
  }));
}

/**
 * Generate mock arguments for a tool based on its schema
 */
export function generateMockArgs(tool: MCPTool): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
    const prop = schema as { type?: string; default?: unknown; enum?: string[] };

    // Use default if available
    if (prop.default !== undefined) {
      args[name] = prop.default;
      continue;
    }

    // Generate mock value based on type
    switch (prop.type) {
      case 'string':
        args[name] = prop.enum ? prop.enum[0] : 'test';
        break;
      case 'number':
        args[name] = 1;
        break;
      case 'boolean':
        args[name] = true;
        break;
      case 'array':
        args[name] = [];
        break;
      case 'object':
        args[name] = {};
        break;
      default:
        args[name] = null;
    }
  }

  return args;
}

/**
 * Format test results for console output
 */
export function formatTestResults(results: TestSuiteResult): string {
  const lines: string[] = [];

  lines.push(`\n📊 Test Results: ${results.server}`);
  lines.push('─'.repeat(50));

  for (const result of results.results) {
    const icon = result.passed ? '✓' : '✗';
    const status = result.passed ? 'PASS' : 'FAIL';
    lines.push(`${icon} [${status}] ${result.name} (${result.duration}ms)`);
    if (result.error) {
      lines.push(`  └─ ${result.error}`);
    }
  }

  lines.push('─'.repeat(50));
  lines.push(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  lines.push(`Duration: ${results.duration}ms`);

  return lines.join('\n');
}

// ============================================================================
// Snapshot Testing
// ============================================================================

export interface Snapshot {
  tool: string;
  args: Record<string, unknown>;
  result: MCPToolResult;
  timestamp: string;
}

/**
 * Create a snapshot of tool results
 */
export async function createSnapshot(
  server: MockMCPServer,
  tool: string,
  args: Record<string, unknown>
): Promise<Snapshot> {
  const result = await server.callTool({ name: tool, arguments: args });
  return {
    tool,
    args,
    result,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compare a result against a snapshot
 */
export function compareSnapshot(snapshot: Snapshot, result: MCPToolResult): boolean {
  const snapshotText = snapshot.result.content.map(c => c.type === 'text' ? c.text : '').join('');
  const resultText = result.content.map(c => c.type === 'text' ? c.text : '').join('');

  // For JSON responses, compare parsed objects
  try {
    const snapshotData = JSON.parse(snapshotText);
    const resultData = JSON.parse(resultText);
    return JSON.stringify(snapshotData) === JSON.stringify(resultData);
  } catch {
    // For non-JSON, compare strings
    return snapshotText === resultText;
  }
}
