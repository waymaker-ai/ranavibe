/**
 * @rana/mcp
 * Model Context Protocol (MCP) support for RANA
 *
 * MCP enables AI models to connect to external tools and data sources
 * in a standardized way.
 *
 * @example
 * ```typescript
 * import { createMCPClient, createRanaMCPServer } from '@rana/mcp';
 *
 * // Client: Connect to MCP servers
 * const client = createMCPClient({
 *   servers: [
 *     { name: 'rana', type: 'builtin' },
 *     { name: 'filesystem', type: 'stdio', command: 'mcp-server-filesystem' },
 *   ]
 * });
 *
 * await client.connect();
 *
 * // Get all available tools
 * const tools = client.getTools();
 *
 * // Call a tool
 * const result = await client.callTool({
 *   name: 'read_file',
 *   arguments: { path: '/path/to/file' }
 * });
 *
 * // Server: Expose RANA as an MCP server
 * const server = createRanaMCPServer();
 * await server.start();
 * ```
 */

// Client
export { MCPClient, createMCPClient } from './client';

// Server
export { MCPServer, createRanaMCPServer } from './server';
export type { ToolHandler, ResourceHandler, MCPServerOptions } from './server';

// Scaffolding
export { scaffoldMCPServer, TEMPLATES, mcpTemplates } from './scaffold';
export type {
  MCPServerTemplate,
  ToolDefinition,
  ParameterDefinition,
  ResourceDefinition,
  PromptDefinition,
  EnvVar,
  ScaffoldOptions,
  ScaffoldResult,
  GeneratedFile,
} from './scaffold';

// Testing
export {
  createMockServer,
  runToolTests,
  assertToolExists,
  assertResourceExists,
  assertToolSuccess,
  assertResultContains,
  generateToolTestCases,
  generateMockArgs,
  formatTestResults,
  createSnapshot,
  compareSnapshot,
} from './testing';
export type {
  MockMCPServer,
  TestResult,
  TestSuiteResult,
  ToolTestCase,
  Snapshot,
} from './testing';

// Types
export type {
  // Core MCP types
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPPromptArgument,
  MCPCapabilities,
  MCPServerInfo,
  MCPToolCall,
  MCPToolResult,
  MCPContent,
  // Configuration types
  MCPServerConfig,
  RanaMCPConfig,
} from './types';

// Zod schemas for validation
export {
  MCPToolSchema,
  MCPResourceSchema,
  MCPPromptSchema,
  MCPToolCallSchema,
  MCPContentSchema,
  MCPToolResultSchema,
} from './types';
