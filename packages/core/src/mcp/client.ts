/**
 * @rana/mcp/client
 * MCP Client implementation for connecting to MCP servers
 *
 * @example
 * ```typescript
 * import { createMCPClient, StdioTransport } from '@rana/core';
 *
 * const client = createMCPClient({
 *   name: 'my-app',
 *   version: '1.0.0',
 *   transport: new StdioTransport({
 *     command: 'npx',
 *     args: ['-y', '@modelcontextprotocol/server-filesystem'],
 *   }),
 * });
 *
 * await client.connect();
 *
 * // List available tools
 * const tools = await client.listTools();
 *
 * // Call a tool
 * const result = await client.callTool('read_file', { path: '/path/to/file' });
 *
 * await client.disconnect();
 * ```
 */

import {
  MCPClientOptions,
  MCPClientInfo,
  MCPServerInfo,
  MCPCapabilities,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContents,
  MCPResourceTemplate,
  MCPPrompt,
  MCPGetPromptResult,
  MCPSamplingRequest,
  MCPSamplingResult,
  MCPRoot,
  MCPTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from './types';

// ============================================================================
// MCP Client
// ============================================================================

export class MCPClient {
  private options: MCPClientOptions;
  private transport: MCPTransport;
  private serverInfo?: MCPServerInfo;
  private connected = false;
  private requestId = 0;
  private pendingRequests: Map<string | number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private notificationHandlers: Map<string, Array<(params: unknown) => void>> = new Map();
  private samplingHandler?: (request: MCPSamplingRequest) => Promise<MCPSamplingResult>;
  private rootsHandler?: () => Promise<MCPRoot[]>;

  constructor(options: MCPClientOptions) {
    this.options = options;
    this.transport = options.transport;
  }

  /**
   * Get client info
   */
  getInfo(): MCPClientInfo {
    return {
      name: this.options.name,
      version: this.options.version,
      capabilities: this.options.capabilities,
    };
  }

  /**
   * Get server info (after connection)
   */
  getServerInfo(): MCPServerInfo | undefined {
    return this.serverInfo;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect to the server
   */
  async connect(timeout = 30000): Promise<MCPServerInfo> {
    if (this.connected) {
      throw new MCPClientError('Already connected');
    }

    // Set up message handling
    this.transport.onMessage(this.handleMessage.bind(this));
    this.transport.onClose(() => {
      this.connected = false;
      this.emit('disconnect');
    });
    this.transport.onError((error) => {
      this.emit('error', error);
    });

    // Start transport
    await this.transport.start();

    // Initialize connection
    const serverInfo = await this.request<MCPServerInfo>('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: this.getCapabilities(),
      clientInfo: this.getInfo(),
    }, timeout);

    this.serverInfo = serverInfo;
    this.connected = true;

    // Send initialized notification
    this.notify('notifications/initialized', {});

    return serverInfo;
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    // Cancel pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new MCPClientError('Client disconnected'));
    }
    this.pendingRequests.clear();

    await this.transport.close();
    this.connected = false;
  }

  /**
   * Get client capabilities
   */
  private getCapabilities(): MCPCapabilities {
    const caps: MCPCapabilities = {};

    if (this.rootsHandler) {
      // Roots capability is implicit
    }

    if (this.samplingHandler) {
      caps.sampling = {};
    }

    return { ...caps, ...this.options.capabilities };
  }

  // --------------------------------------------------------------------------
  // Tools
  // --------------------------------------------------------------------------

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.request<{ tools: MCPTool[] }>('tools/list', {});
    return result.tools;
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<MCPToolResult> {
    return this.request<MCPToolResult>('tools/call', {
      name,
      arguments: args,
    });
  }

  // --------------------------------------------------------------------------
  // Resources
  // --------------------------------------------------------------------------

  /**
   * List available resources
   */
  async listResources(): Promise<MCPResource[]> {
    const result = await this.request<{ resources: MCPResource[] }>('resources/list', {});
    return result.resources;
  }

  /**
   * List resource templates
   */
  async listResourceTemplates(): Promise<MCPResourceTemplate[]> {
    const result = await this.request<{ resourceTemplates: MCPResourceTemplate[] }>(
      'resources/templates/list',
      {}
    );
    return result.resourceTemplates;
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<MCPResourceContents> {
    const result = await this.request<{ contents: MCPResourceContents[] }>('resources/read', {
      uri,
    });
    return result.contents[0];
  }

  /**
   * Subscribe to resource changes
   */
  async subscribeResource(uri: string): Promise<void> {
    await this.request('resources/subscribe', { uri });
  }

  /**
   * Unsubscribe from resource changes
   */
  async unsubscribeResource(uri: string): Promise<void> {
    await this.request('resources/unsubscribe', { uri });
  }

  // --------------------------------------------------------------------------
  // Prompts
  // --------------------------------------------------------------------------

  /**
   * List available prompts
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    const result = await this.request<{ prompts: MCPPrompt[] }>('prompts/list', {});
    return result.prompts;
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args: Record<string, string> = {}): Promise<MCPGetPromptResult> {
    return this.request<MCPGetPromptResult>('prompts/get', {
      name,
      arguments: args,
    });
  }

  // --------------------------------------------------------------------------
  // Logging
  // --------------------------------------------------------------------------

  /**
   * Set logging level
   */
  async setLoggingLevel(level: string): Promise<void> {
    await this.request('logging/setLevel', { level });
  }

  // --------------------------------------------------------------------------
  // Sampling
  // --------------------------------------------------------------------------

  /**
   * Set the sampling handler (for servers that support sampling)
   */
  setSamplingHandler(handler: (request: MCPSamplingRequest) => Promise<MCPSamplingResult>): void {
    this.samplingHandler = handler;
  }

  // --------------------------------------------------------------------------
  // Roots
  // --------------------------------------------------------------------------

  /**
   * Set the roots handler
   */
  setRootsHandler(handler: () => Promise<MCPRoot[]>): void {
    this.rootsHandler = handler;
  }

  /**
   * Notify server that roots have changed
   */
  notifyRootsChanged(): void {
    this.notify('notifications/roots/list_changed', {});
  }

  // --------------------------------------------------------------------------
  // Ping
  // --------------------------------------------------------------------------

  /**
   * Ping the server
   */
  async ping(): Promise<void> {
    await this.request('ping', {});
  }

  // --------------------------------------------------------------------------
  // Event Handling
  // --------------------------------------------------------------------------

  /**
   * Subscribe to notifications
   */
  on(event: string, handler: (params: unknown) => void): () => void {
    const handlers = this.notificationHandlers.get(event) || [];
    handlers.push(handler);
    this.notificationHandlers.set(event, handlers);

    return () => {
      const current = this.notificationHandlers.get(event) || [];
      this.notificationHandlers.set(
        event,
        current.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Emit an event
   */
  private emit(event: string, data?: unknown): void {
    const handlers = this.notificationHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  // --------------------------------------------------------------------------
  // Message Handling
  // --------------------------------------------------------------------------

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
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);
        if ('error' in message && message.error) {
          pending.reject(new MCPClientError(message.error.message, message.error.code));
        } else {
          pending.resolve(message.result);
        }
      }
      return;
    }

    // Handle requests from server
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
    this.handleNotification(message as JsonRpcNotification);
  }

  /**
   * Handle a request from the server
   */
  private async handleRequest(request: JsonRpcRequest): Promise<unknown> {
    const { method, params } = request;

    switch (method) {
      case 'sampling/createMessage':
        if (!this.samplingHandler) {
          throw new MCPClientError('Sampling not supported');
        }
        return this.samplingHandler(params as unknown as MCPSamplingRequest);

      case 'roots/list':
        if (!this.rootsHandler) {
          return { roots: [] };
        }
        const roots = await this.rootsHandler();
        return { roots };

      default:
        throw new MCPClientError(`Unknown method: ${method}`, -32601);
    }
  }

  /**
   * Handle a notification from the server
   */
  private handleNotification(notification: JsonRpcNotification): void {
    const { method, params } = notification;

    // Emit specific event
    this.emit(method, params);

    // Handle well-known notifications
    switch (method) {
      case 'notifications/tools/list_changed':
        this.emit('toolsChanged');
        break;

      case 'notifications/resources/list_changed':
        this.emit('resourcesChanged');
        break;

      case 'notifications/resources/updated':
        this.emit('resourceUpdated', params);
        break;

      case 'notifications/prompts/list_changed':
        this.emit('promptsChanged');
        break;

      case 'notifications/message':
        this.emit('log', params);
        break;

      case 'notifications/progress':
        this.emit('progress', params);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // Transport Communication
  // --------------------------------------------------------------------------

  /**
   * Send a request and wait for response
   */
  private async request<T>(method: string, params: Record<string, unknown>, timeout = 30000): Promise<T> {
    if (!this.connected && method !== 'initialize') {
      throw new MCPClientError('Not connected');
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new MCPClientError('Request timed out'));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timeout: timeoutHandle,
      });

      this.transport.send({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });
    });
  }

  /**
   * Send a notification
   */
  private notify(method: string, params: Record<string, unknown>): void {
    this.transport.send({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  /**
   * Send a response
   */
  private sendResponse(id: string | number, result: unknown): void {
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
    this.transport.send({
      jsonrpc: '2.0',
      id,
      error: {
        code: error instanceof MCPClientError ? error.code : -32000,
        message: error.message,
      },
    });
  }
}

// ============================================================================
// Errors
// ============================================================================

export class MCPClientError extends Error {
  constructor(
    message: string,
    public code: number = -32000
  ) {
    super(message);
    this.name = 'MCPClientError';
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an MCP client
 */
export function createMCPClient(options: MCPClientOptions): MCPClient {
  return new MCPClient(options);
}
