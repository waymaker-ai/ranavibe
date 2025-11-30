/**
 * @rana/mcp
 * Model Context Protocol support for RANA
 *
 * This module provides:
 * - MCP Server creation for building tool servers
 * - MCP Client for connecting to MCP servers
 * - Testing utilities for MCP development
 * - Registry of official and community MCP servers
 */

// Types
export type {
  // JSON-RPC
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  JsonRpcNotification,

  // MCP Protocol
  MCPCapabilities,
  MCPServerInfo,
  MCPClientInfo,

  // Tools
  MCPTool,
  MCPToolInputSchema,
  MCPPropertySchema,
  MCPToolCall,
  MCPToolResult,

  // Resources
  MCPResource,
  MCPResourceTemplate,
  MCPResourceContents,

  // Prompts
  MCPPrompt,
  MCPPromptArgument,
  MCPPromptMessage,
  MCPGetPromptResult,

  // Content
  MCPContent,
  MCPTextContent,
  MCPImageContent,
  MCPEmbeddedResource,

  // Logging
  MCPLogLevel,
  MCPLogMessage,

  // Sampling
  MCPSamplingMessage,
  MCPSamplingRequest,
  MCPModelPreferences,
  MCPModelHint,
  MCPSamplingResult,

  // Progress
  MCPProgressNotification,

  // Roots
  MCPRoot,

  // Handlers
  MCPToolHandler,
  MCPResourceHandler,
  MCPPromptHandler,
  MCPSamplingHandler,

  // Transport
  MCPTransport,
  MCPTransportOptions,

  // Options
  MCPServerOptions,
  MCPClientOptions,
} from './types';

// Server
export {
  MCPServer,
  MCPServerError,
  createMCPServer,
  text,
  image,
  resource,
  toolResult,
  toolError,
} from './server';
export type { ToolDefinition, ResourceDefinition, PromptDefinition } from './server';

// Client
export { MCPClient, MCPClientError, createMCPClient } from './client';

// Testing
export {
  // Mock Transport
  MockTransport,
  createMockTransportPair,

  // Test Harness
  createMCPTestHarness,

  // Test Client
  MCPTestClient,
  createMCPTestClient,

  // Assertions
  createMCPAssertions,

  // Tool Testing
  runToolTests,
  formatToolTestResults,

  // Snapshots
  createMCPSnapshot,
  compareMCPSnapshots,

  // Mock Builder
  MockToolBuilder,
  mockTools,

  // Errors
  MCPTestError,
} from './testing';
export type {
  MCPTestHarness,
  MCPAssertions,
  ToolTestCase,
  ToolTestResult,
  MCPSnapshot,
  MCPSnapshotDiff,
} from './testing';

// Registry
export {
  MCPRegistry,
  createMCPRegistry,
  createOfficialRegistry,
  createFullRegistry,
  generateMCPConfig,
  formatRegistry,
  officialServers,
  communityServers,
} from './registry';
export type {
  MCPServerEntry,
  RegistrySearchOptions,
  MCPClientConfig,
} from './registry';
