/**
 * MCP (Model Context Protocol) Types
 * Based on Anthropic's MCP specification
 */

import { z } from 'zod';

// ============================================================================
// Core MCP Types
// ============================================================================

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Prompt template
 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * MCP Server capabilities
 */
export interface MCPCapabilities {
  tools?: boolean | { listChanged?: boolean };
  resources?: boolean | { subscribe?: boolean; listChanged?: boolean };
  prompts?: boolean | { listChanged?: boolean };
  logging?: boolean;
}

/**
 * MCP Server info
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion?: string;
  capabilities?: MCPCapabilities;
}

/**
 * MCP Tool call request
 */
export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * MCP Tool call result
 */
export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

/**
 * MCP Content types
 */
export type MCPContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: MCPResource };

// ============================================================================
// RANA MCP Configuration
// ============================================================================

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  /** Server name/identifier */
  name: string;
  /** Server type: built-in, stdio, sse, or custom */
  type: 'builtin' | 'stdio' | 'sse' | 'custom';
  /** For stdio: command to run */
  command?: string;
  /** For stdio: command arguments */
  args?: string[];
  /** For stdio: environment variables */
  env?: Record<string, string>;
  /** For sse: server URL */
  url?: string;
  /** Server timeout in ms */
  timeout?: number;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Capabilities filter */
  capabilities?: MCPCapabilities;
}

/**
 * RANA MCP client configuration
 */
export interface RanaMCPConfig {
  /** MCP servers to connect */
  servers: MCPServerConfig[];
  /** Default timeout for tool calls */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Max concurrent tool calls */
  maxConcurrency?: number;
}

// ============================================================================
// Zod Schemas for validation
// ============================================================================

export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
  }),
});

export const MCPResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

export const MCPPromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
  })).optional(),
});

export const MCPToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

export const MCPContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('image'), data: z.string(), mimeType: z.string() }),
  z.object({ type: z.literal('resource'), resource: MCPResourceSchema }),
]);

export const MCPToolResultSchema = z.object({
  content: z.array(MCPContentSchema),
  isError: z.boolean().optional(),
});
