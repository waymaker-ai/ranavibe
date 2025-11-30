/**
 * @rana/mcp/server
 * MCP Server implementation for creating tool servers
 *
 * @example
 * ```typescript
 * import { createMCPServer } from '@rana/core';
 *
 * const server = createMCPServer({
 *   name: 'my-tools',
 *   version: '1.0.0',
 * });
 *
 * // Register a tool
 * server.tool({
 *   name: 'get_weather',
 *   description: 'Get current weather for a location',
 *   inputSchema: {
 *     type: 'object',
 *     properties: {
 *       location: { type: 'string', description: 'City name' },
 *     },
 *     required: ['location'],
 *   },
 *   handler: async ({ location }) => ({
 *     content: [{ type: 'text', text: `Weather in ${location}: Sunny, 72°F` }],
 *   }),
 * });
 *
 * // Start the server
 * await server.start();
 * ```
 */

import {
  MCPServerOptions,
  MCPServerInfo,
  MCPCapabilities,
  MCPTool,
  MCPToolHandler,
  MCPToolResult,
  MCPResource,
  MCPResourceHandler,
  MCPResourceContents,
  MCPResourceTemplate,
  MCPPrompt,
  MCPPromptHandler,
  MCPGetPromptResult,
  MCPLogLevel,
  MCPTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  MCPToolInputSchema,
  MCPContent,
} from './types';

// ============================================================================
// MCP Server
// ============================================================================

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: MCPToolInputSchema;
  handler: MCPToolHandler;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: MCPResourceHandler;
}

export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
  handler: MCPPromptHandler;
}

export class MCPServer {
  private options: MCPServerOptions;
  private toolRegistry: Map<string, ToolDefinition> = new Map();
  private resourceRegistry: Map<string, ResourceDefinition> = new Map();
  private resourceTemplates: MCPResourceTemplate[] = [];
  private promptRegistry: Map<string, PromptDefinition> = new Map();
  private transport?: MCPTransport;
  private initialized = false;
  private requestId = 0;
  private pendingRequests: Map<string | number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(options: MCPServerOptions) {
    this.options = options;
    this.transport = options.transport;
  }

  /**
   * Register a tool
   */
  tool(definition: ToolDefinition): this {
    this.toolRegistry.set(definition.name, definition);
    return this;
  }

  /**
   * Register multiple tools
   */
  tools(definitions: ToolDefinition[]): this {
    for (const def of definitions) {
      this.tool(def);
    }
    return this;
  }

  /**
   * Register a resource
   */
  resource(definition: ResourceDefinition): this {
    this.resourceRegistry.set(definition.uri, definition);
    return this;
  }

  /**
   * Register a resource template
   */
  resourceTemplate(template: MCPResourceTemplate, handler: MCPResourceHandler): this {
    this.resourceTemplates.push(template);
    // Store handler for template matching
    this.resourceRegistry.set(`template:${template.uriTemplate}`, {
      ...template,
      uri: template.uriTemplate,
      handler,
    });
    return this;
  }

  /**
   * Register a prompt
   */
  prompt(definition: PromptDefinition): this {
    this.promptRegistry.set(definition.name, definition);
    return this;
  }

  /**
   * Get server info
   */
  getInfo(): MCPServerInfo {
    return {
      name: this.options.name,
      version: this.options.version,
      protocolVersion: '2024-11-05',
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): MCPCapabilities {
    const capabilities: MCPCapabilities = {};

    if (this.toolRegistry.size > 0) {
      capabilities.tools = { listChanged: true };
    }

    if (this.resourceRegistry.size > 0 || this.resourceTemplates.length > 0) {
      capabilities.resources = { subscribe: true, listChanged: true };
    }

    if (this.promptRegistry.size > 0) {
      capabilities.prompts = { listChanged: true };
    }

    capabilities.logging = {};

    return { ...capabilities, ...this.options.capabilities };
  }

  /**
   * List all registered tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.toolRegistry.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  /**
   * List all registered resources
   */
  listResources(): MCPResource[] {
    return Array.from(this.resourceRegistry.values())
      .filter((r) => !r.uri.startsWith('template:'))
      .map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      }));
  }

  /**
   * List resource templates
   */
  listResourceTemplates(): MCPResourceTemplate[] {
    return this.resourceTemplates;
  }

  /**
   * List all registered prompts
   */
  listPrompts(): MCPPrompt[] {
    return Array.from(this.promptRegistry.values()).map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    }));
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPToolResult> {
    const tool = this.toolRegistry.get(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Tool not found: ${name}` }],
        isError: true,
      };
    }

    try {
      return await tool.handler(args);
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<MCPResourceContents> {
    // Try exact match first
    let resource = this.resourceRegistry.get(uri);

    // Try template matching
    if (!resource) {
      for (const template of this.resourceTemplates) {
        if (this.matchesTemplate(uri, template.uriTemplate)) {
          resource = this.resourceRegistry.get(`template:${template.uriTemplate}`);
          break;
        }
      }
    }

    if (!resource) {
      throw new MCPServerError(`Resource not found: ${uri}`);
    }

    return resource.handler(uri);
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<MCPGetPromptResult> {
    const prompt = this.promptRegistry.get(name);
    if (!prompt) {
      throw new MCPServerError(`Prompt not found: ${name}`);
    }

    return prompt.handler(args);
  }

  /**
   * Send a log message
   */
  log(level: MCPLogLevel, message: string, data?: unknown): void {
    if (this.transport) {
      this.sendNotification('notifications/message', {
        level,
        logger: this.options.name,
        data: data ?? message,
      });
    }
  }

  /**
   * Notify that tools have changed
   */
  notifyToolsChanged(): void {
    this.sendNotification('notifications/tools/list_changed', {});
  }

  /**
   * Notify that resources have changed
   */
  notifyResourcesChanged(): void {
    this.sendNotification('notifications/resources/list_changed', {});
  }

  /**
   * Notify that prompts have changed
   */
  notifyPromptsChanged(): void {
    this.sendNotification('notifications/prompts/list_changed', {});
  }

  /**
   * Set the transport
   */
  setTransport(transport: MCPTransport): void {
    this.transport = transport;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (!this.transport) {
      throw new MCPServerError('No transport configured');
    }

    this.transport.onMessage(this.handleMessage.bind(this));
    this.transport.onClose(() => {
      this.initialized = false;
    });
    this.transport.onError((error) => {
      this.log('error', `Transport error: ${error.message}`);
    });

    await this.transport.start();
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }
    this.initialized = false;
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(
    message: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification
  ): Promise<void> {
    // Handle responses
    if ('result' in message || 'error' in message) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if ('error' in message && message.error) {
          pending.reject(new MCPServerError(message.error.message, message.error.code));
        } else {
          pending.resolve(message.result);
        }
      }
      return;
    }

    // Handle requests
    if ('id' in message) {
      try {
        const result = await this.handleRequest(message as JsonRpcRequest);
        this.sendResponse(message.id, result);
      } catch (error) {
        this.sendError(message.id, error as Error);
      }
      return;
    }

    // Handle notifications
    await this.handleNotification(message as JsonRpcNotification);
  }

  /**
   * Handle a request
   */
  private async handleRequest(request: JsonRpcRequest): Promise<unknown> {
    const { method, params } = request;

    switch (method) {
      case 'initialize':
        return this.handleInitialize(params as { clientInfo: { name: string; version: string } });

      case 'tools/list':
        return { tools: this.listTools() };

      case 'tools/call':
        return this.callTool(
          (params as { name: string; arguments?: Record<string, unknown> }).name,
          (params as { arguments?: Record<string, unknown> }).arguments
        );

      case 'resources/list':
        return { resources: this.listResources() };

      case 'resources/templates/list':
        return { resourceTemplates: this.listResourceTemplates() };

      case 'resources/read':
        const contents = await this.readResource((params as { uri: string }).uri);
        return { contents: [contents] };

      case 'prompts/list':
        return { prompts: this.listPrompts() };

      case 'prompts/get':
        return this.getPrompt(
          (params as { name: string; arguments?: Record<string, string> }).name,
          (params as { arguments?: Record<string, string> }).arguments
        );

      case 'ping':
        return {};

      default:
        throw new MCPServerError(`Unknown method: ${method}`, -32601);
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(params: { clientInfo: { name: string; version: string } }): MCPServerInfo {
    this.initialized = true;
    this.log('info', `Client connected: ${params.clientInfo.name} v${params.clientInfo.version}`);
    return this.getInfo();
  }

  /**
   * Handle a notification
   */
  private async handleNotification(notification: JsonRpcNotification): Promise<void> {
    const { method } = notification;

    switch (method) {
      case 'notifications/initialized':
        this.log('info', 'Client initialized');
        break;

      case 'notifications/cancelled':
        // Handle request cancellation
        break;

      default:
        // Unknown notification, ignore
        break;
    }
  }

  /**
   * Send a response
   */
  private sendResponse(id: string | number, result: unknown): void {
    if (!this.transport) return;

    this.transport.send({
      jsonrpc: '2.0',
      id,
      result,
    });
  }

  /**
   * Send an error response
   */
  private sendError(id: string | number, error: Error): void {
    if (!this.transport) return;

    this.transport.send({
      jsonrpc: '2.0',
      id,
      error: {
        code: error instanceof MCPServerError ? error.code : -32000,
        message: error.message,
      },
    });
  }

  /**
   * Send a notification
   */
  private sendNotification(method: string, params: Record<string, unknown>): void {
    if (!this.transport) return;

    this.transport.send({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  /**
   * Send a request and wait for response
   */
  async request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.transport) {
      throw new MCPServerError('No transport configured');
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve: resolve as (v: unknown) => void, reject });

      this.transport!.send({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new MCPServerError('Request timed out'));
        }
      }, 30000);
    });
  }

  /**
   * Check if URI matches a template
   */
  private matchesTemplate(uri: string, template: string): boolean {
    const regex = template.replace(/\{[^}]+\}/g, '([^/]+)');
    return new RegExp(`^${regex}$`).test(uri);
  }
}

// ============================================================================
// Errors
// ============================================================================

export class MCPServerError extends Error {
  constructor(
    message: string,
    public code: number = -32000
  ) {
    super(message);
    this.name = 'MCPServerError';
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an MCP server
 */
export function createMCPServer(options: MCPServerOptions): MCPServer {
  return new MCPServer(options);
}

// ============================================================================
// Helper: Create text content
// ============================================================================

export function text(content: string): MCPContent {
  return { type: 'text', text: content };
}

export function image(data: string, mimeType: string): MCPContent {
  return { type: 'image', data, mimeType };
}

export function resource(uri: string, text?: string, mimeType?: string): MCPContent {
  return {
    type: 'resource',
    resource: { uri, text, mimeType },
  };
}

/**
 * Create a successful tool result
 */
export function toolResult(content: string | MCPContent[]): MCPToolResult {
  return {
    content: typeof content === 'string' ? [text(content)] : content,
    isError: false,
  };
}

/**
 * Create an error tool result
 */
export function toolError(message: string): MCPToolResult {
  return {
    content: [text(message)],
    isError: true,
  };
}
