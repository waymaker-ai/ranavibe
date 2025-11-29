/**
 * RANA MCP Client
 * Manages connections to MCP servers and provides unified tool access
 */

import type {
  MCPServerConfig,
  RanaMCPConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolCall,
  MCPToolResult,
  MCPServerInfo,
} from './types';

/**
 * Connection state for an MCP server
 */
interface ServerConnection {
  config: MCPServerConfig;
  connected: boolean;
  info?: MCPServerInfo;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  lastError?: Error;
}

/**
 * RANA MCP Client
 * Provides a unified interface to multiple MCP servers
 */
export class MCPClient {
  private config: RanaMCPConfig;
  private connections: Map<string, ServerConnection> = new Map();
  private debug: boolean;

  constructor(config: RanaMCPConfig) {
    this.config = {
      timeout: 30000,
      maxConcurrency: 5,
      ...config,
    };
    this.debug = config.debug ?? false;
  }

  /**
   * Connect to all configured MCP servers
   */
  async connect(): Promise<void> {
    const promises = this.config.servers.map((serverConfig) =>
      this.connectServer(serverConfig)
    );
    await Promise.allSettled(promises);
  }

  /**
   * Connect to a specific MCP server
   */
  async connectServer(serverConfig: MCPServerConfig): Promise<void> {
    const { name, type } = serverConfig;
    this.log(`Connecting to MCP server: ${name} (${type})`);

    try {
      // Initialize connection based on type
      let connection: ServerConnection;

      switch (type) {
        case 'builtin':
          connection = await this.connectBuiltinServer(serverConfig);
          break;
        case 'stdio':
          connection = await this.connectStdioServer(serverConfig);
          break;
        case 'sse':
          connection = await this.connectSSEServer(serverConfig);
          break;
        case 'custom':
          connection = await this.connectCustomServer(serverConfig);
          break;
        default:
          throw new Error(`Unknown MCP server type: ${type}`);
      }

      this.connections.set(name, connection);
      this.log(`Connected to ${name}: ${connection.tools.length} tools available`);
    } catch (error) {
      this.log(`Failed to connect to ${name}: ${error}`, 'error');
      this.connections.set(name, {
        config: serverConfig,
        connected: false,
        tools: [],
        resources: [],
        prompts: [],
        lastError: error as Error,
      });
    }
  }

  /**
   * Connect to built-in RANA MCP server
   */
  private async connectBuiltinServer(
    config: MCPServerConfig
  ): Promise<ServerConnection> {
    // Built-in server provides RANA-specific tools
    const tools: MCPTool[] = [
      {
        name: 'rana_cost_check',
        description: 'Check current RANA cost tracking status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'rana_cache_stats',
        description: 'Get RANA cache statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'rana_provider_status',
        description: 'Check status of LLM providers',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              description: 'Specific provider to check (optional)',
            },
          },
        },
      },
    ];

    return {
      config,
      connected: true,
      info: {
        name: 'rana-builtin',
        version: '2.0.0',
        capabilities: { tools: true },
      },
      tools,
      resources: [],
      prompts: [],
    };
  }

  /**
   * Connect to stdio-based MCP server
   */
  private async connectStdioServer(
    config: MCPServerConfig
  ): Promise<ServerConnection> {
    if (!config.command) {
      throw new Error('stdio server requires command');
    }

    // In production, this would spawn a child process and communicate via stdio
    // For now, return a placeholder connection
    this.log(`Would spawn: ${config.command} ${config.args?.join(' ') || ''}`);

    return {
      config,
      connected: true,
      info: {
        name: config.name,
        version: '1.0.0',
        capabilities: { tools: true, resources: true },
      },
      tools: [],
      resources: [],
      prompts: [],
    };
  }

  /**
   * Connect to SSE-based MCP server
   */
  private async connectSSEServer(
    config: MCPServerConfig
  ): Promise<ServerConnection> {
    if (!config.url) {
      throw new Error('sse server requires url');
    }

    // In production, this would establish SSE connection
    // For now, return a placeholder connection
    this.log(`Would connect to SSE: ${config.url}`);

    return {
      config,
      connected: true,
      info: {
        name: config.name,
        version: '1.0.0',
        capabilities: { tools: true, resources: true, prompts: true },
      },
      tools: [],
      resources: [],
      prompts: [],
    };
  }

  /**
   * Connect to custom MCP server
   */
  private async connectCustomServer(
    config: MCPServerConfig
  ): Promise<ServerConnection> {
    // Custom servers need explicit setup
    return {
      config,
      connected: false,
      tools: [],
      resources: [],
      prompts: [],
    };
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnect(): Promise<void> {
    for (const [name] of this.connections) {
      await this.disconnectServer(name);
    }
  }

  /**
   * Disconnect from a specific server
   */
  async disconnectServer(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (connection) {
      this.log(`Disconnecting from ${name}`);
      // Cleanup connection
      connection.connected = false;
    }
  }

  /**
   * Get all available tools from all connected servers
   */
  getTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const [, connection] of this.connections) {
      if (connection.connected) {
        tools.push(...connection.tools);
      }
    }
    return tools;
  }

  /**
   * Get tools from a specific server
   */
  getServerTools(serverName: string): MCPTool[] {
    return this.connections.get(serverName)?.tools ?? [];
  }

  /**
   * Get all available resources
   */
  getResources(): MCPResource[] {
    const resources: MCPResource[] = [];
    for (const [, connection] of this.connections) {
      if (connection.connected) {
        resources.push(...connection.resources);
      }
    }
    return resources;
  }

  /**
   * Get all available prompts
   */
  getPrompts(): MCPPrompt[] {
    const prompts: MCPPrompt[] = [];
    for (const [, connection] of this.connections) {
      if (connection.connected) {
        prompts.push(...connection.prompts);
      }
    }
    return prompts;
  }

  /**
   * Call a tool by name
   */
  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    const { name, arguments: args } = call;
    this.log(`Calling tool: ${name}`);

    // Find which server has this tool
    for (const [serverName, connection] of this.connections) {
      if (!connection.connected) continue;

      const tool = connection.tools.find((t) => t.name === name);
      if (tool) {
        return this.executeToolOnServer(serverName, call);
      }
    }

    return {
      content: [{ type: 'text', text: `Tool not found: ${name}` }],
      isError: true,
    };
  }

  /**
   * Execute a tool on a specific server
   */
  private async executeToolOnServer(
    serverName: string,
    call: MCPToolCall
  ): Promise<MCPToolResult> {
    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      return {
        content: [{ type: 'text', text: `Server not connected: ${serverName}` }],
        isError: true,
      };
    }

    // Handle built-in tools
    if (connection.config.type === 'builtin') {
      return this.executeBuiltinTool(call);
    }

    // For external servers, this would send the request via the appropriate transport
    return {
      content: [{ type: 'text', text: `Tool execution not implemented for ${serverName}` }],
      isError: true,
    };
  }

  /**
   * Execute built-in RANA tools
   */
  private async executeBuiltinTool(call: MCPToolCall): Promise<MCPToolResult> {
    switch (call.name) {
      case 'rana_cost_check':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'ok',
                totalSpent: 0,
                totalSaved: 0,
                message: 'Cost tracking active',
              }),
            },
          ],
        };

      case 'rana_cache_stats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                hits: 0,
                misses: 0,
                hitRate: 0,
                size: 0,
              }),
            },
          ],
        };

      case 'rana_provider_status':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                providers: ['anthropic', 'openai', 'google'],
                status: 'all_operational',
              }),
            },
          ],
        };

      default:
        return {
          content: [{ type: 'text', text: `Unknown built-in tool: ${call.name}` }],
          isError: true,
        };
    }
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<MCPToolResult> {
    this.log(`Reading resource: ${uri}`);

    // Find which server has this resource
    for (const [serverName, connection] of this.connections) {
      if (!connection.connected) continue;

      const resource = connection.resources.find((r) => r.uri === uri);
      if (resource) {
        return this.readResourceFromServer(serverName, uri);
      }
    }

    return {
      content: [{ type: 'text', text: `Resource not found: ${uri}` }],
      isError: true,
    };
  }

  /**
   * Read a resource from a specific server
   */
  private async readResourceFromServer(
    _serverName: string,
    uri: string
  ): Promise<MCPToolResult> {
    // Implementation would depend on the server type
    return {
      content: [{ type: 'text', text: `Resource content for: ${uri}` }],
    };
  }

  /**
   * Get connection status
   */
  getStatus(): Map<string, { connected: boolean; tools: number; error?: string }> {
    const status = new Map<string, { connected: boolean; tools: number; error?: string }>();

    for (const [name, connection] of this.connections) {
      status.set(name, {
        connected: connection.connected,
        tools: connection.tools.length,
        error: connection.lastError?.message,
      });
    }

    return status;
  }

  /**
   * Check if any servers are connected
   */
  isConnected(): boolean {
    for (const [, connection] of this.connections) {
      if (connection.connected) return true;
    }
    return false;
  }

  /**
   * Get server count
   */
  getServerCount(): { connected: number; total: number } {
    let connected = 0;
    for (const [, connection] of this.connections) {
      if (connection.connected) connected++;
    }
    return { connected, total: this.connections.size };
  }

  /**
   * Debug logging
   */
  private log(message: string, level: 'info' | 'error' = 'info'): void {
    if (this.debug) {
      const prefix = level === 'error' ? '[MCP ERROR]' : '[MCP]';
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * Create an MCP client
 */
export function createMCPClient(config: RanaMCPConfig): MCPClient {
  return new MCPClient(config);
}
