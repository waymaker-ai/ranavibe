/**
 * @rana/mcp/types
 * Model Context Protocol types and interfaces
 */

// ============================================================================
// JSON-RPC Types
// ============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
  sampling?: {};
}

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion?: string;
  capabilities?: MCPCapabilities;
}

export interface MCPClientInfo {
  name: string;
  version: string;
  capabilities?: MCPCapabilities;
}

// ============================================================================
// Tools
// ============================================================================

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: MCPToolInputSchema;
}

export interface MCPToolInputSchema {
  type: 'object';
  properties?: Record<string, MCPPropertySchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  description?: string;
  enum?: unknown[];
  items?: MCPPropertySchema;
  properties?: Record<string, MCPPropertySchema>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

// ============================================================================
// Resources
// ============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: {
    audience?: ('user' | 'assistant')[];
    priority?: number;
  };
}

export interface MCPResourceTemplate {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContents {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string; // base64 encoded
}

// ============================================================================
// Prompts
// ============================================================================

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

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

export interface MCPGetPromptResult {
  description?: string;
  messages: MCPPromptMessage[];
}

// ============================================================================
// Content Types
// ============================================================================

export type MCPContent = MCPTextContent | MCPImageContent | MCPEmbeddedResource;

export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
  data: string; // base64 encoded
  mimeType: string;
}

export interface MCPEmbeddedResource {
  type: 'resource';
  resource: MCPResourceContents;
}

// ============================================================================
// Logging
// ============================================================================

export type MCPLogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

export interface MCPLogMessage {
  level: MCPLogLevel;
  logger?: string;
  data?: unknown;
}

// ============================================================================
// Sampling
// ============================================================================

export interface MCPSamplingMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

export interface MCPSamplingRequest {
  messages: MCPSamplingMessage[];
  modelPreferences?: MCPModelPreferences;
  systemPrompt?: string;
  includeContext?: 'none' | 'thisServer' | 'allServers';
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface MCPModelPreferences {
  hints?: MCPModelHint[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

export interface MCPModelHint {
  name?: string;
}

export interface MCPSamplingResult {
  role: 'user' | 'assistant';
  content: MCPContent;
  model: string;
  stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens' | string;
}

// ============================================================================
// Progress
// ============================================================================

export interface MCPProgressNotification {
  progressToken: string | number;
  progress: number;
  total?: number;
}

// ============================================================================
// Roots
// ============================================================================

export interface MCPRoot {
  uri: string;
  name?: string;
}

// ============================================================================
// Handler Types
// ============================================================================

export type MCPToolHandler = (
  args: Record<string, unknown>
) => Promise<MCPToolResult> | MCPToolResult;

export type MCPResourceHandler = (
  uri: string
) => Promise<MCPResourceContents> | MCPResourceContents;

export type MCPPromptHandler = (
  args: Record<string, string>
) => Promise<MCPGetPromptResult> | MCPGetPromptResult;

export type MCPSamplingHandler = (
  request: MCPSamplingRequest
) => Promise<MCPSamplingResult>;

// ============================================================================
// Transport Types
// ============================================================================

export interface MCPTransport {
  start(): Promise<void>;
  close(): Promise<void>;
  send(message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification): Promise<void>;
  onMessage(handler: (message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
}

export interface MCPTransportOptions {
  timeout?: number;
}

// ============================================================================
// Server Options
// ============================================================================

export interface MCPServerOptions {
  name: string;
  version: string;
  capabilities?: MCPCapabilities;
  transport?: MCPTransport;
}

// ============================================================================
// Client Options
// ============================================================================

export interface MCPClientOptions {
  name: string;
  version: string;
  capabilities?: MCPCapabilities;
  transport: MCPTransport;
}
