/**
 * @rana/mcp/registry
 * MCP Registry for discovering and managing MCP servers
 *
 * @example
 * ```typescript
 * import { MCPRegistry, officialServers } from '@rana/core';
 *
 * const registry = new MCPRegistry();
 *
 * // Add official servers
 * registry.addAll(officialServers);
 *
 * // Search for servers
 * const fileServers = registry.search('file');
 *
 * // Get server by name
 * const filesystem = registry.get('filesystem');
 * console.log(filesystem.command); // 'npx -y @modelcontextprotocol/server-filesystem'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface MCPServerEntry {
  /** Server name/identifier */
  name: string;
  /** Human-readable description */
  description: string;
  /** NPM package name */
  package: string;
  /** Version constraint (e.g., "^1.0.0" or "latest") */
  version?: string;
  /** Command to run the server */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables needed */
  env?: Record<string, string>;
  /** Required environment variables */
  requiredEnv?: string[];
  /** Categories/tags */
  categories: string[];
  /** Author/maintainer */
  author?: string;
  /** Repository URL */
  repository?: string;
  /** Documentation URL */
  docs?: string;
  /** Whether this is an official MCP server */
  official?: boolean;
  /** Server capabilities */
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
  /** Example tool names */
  exampleTools?: string[];
}

export interface RegistrySearchOptions {
  /** Filter by category */
  category?: string;
  /** Only official servers */
  official?: boolean;
  /** Has specific capability */
  capability?: 'tools' | 'resources' | 'prompts';
  /** Limit results */
  limit?: number;
}

// ============================================================================
// Official MCP Servers
// ============================================================================

export const officialServers: MCPServerEntry[] = [
  {
    name: 'filesystem',
    description: 'Read, write, and manage files and directories',
    package: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    categories: ['files', 'storage'],
    official: true,
    capabilities: { tools: true, resources: true },
    exampleTools: ['read_file', 'write_file', 'list_directory', 'create_directory'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  },
  {
    name: 'github',
    description: 'Interact with GitHub repositories, issues, and pull requests',
    package: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    requiredEnv: ['GITHUB_TOKEN'],
    categories: ['git', 'development', 'api'],
    official: true,
    capabilities: { tools: true, resources: true },
    exampleTools: ['create_issue', 'search_code', 'get_file_contents', 'create_pull_request'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
  {
    name: 'postgres',
    description: 'Query and manage PostgreSQL databases',
    package: '@modelcontextprotocol/server-postgres',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiredEnv: ['POSTGRES_CONNECTION_STRING'],
    categories: ['database', 'sql'],
    official: true,
    capabilities: { tools: true, resources: true },
    exampleTools: ['query', 'list_tables', 'describe_table'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
  },
  {
    name: 'sqlite',
    description: 'Query and manage SQLite databases',
    package: '@modelcontextprotocol/server-sqlite',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    categories: ['database', 'sql'],
    official: true,
    capabilities: { tools: true, resources: true },
    exampleTools: ['query', 'list_tables', 'describe_table'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
  },
  {
    name: 'memory',
    description: 'Persistent memory and knowledge graph for AI assistants',
    package: '@modelcontextprotocol/server-memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    categories: ['memory', 'knowledge'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['create_entities', 'create_relations', 'search_nodes', 'open_nodes'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
  },
  {
    name: 'puppeteer',
    description: 'Browser automation and web scraping',
    package: '@modelcontextprotocol/server-puppeteer',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    categories: ['browser', 'automation', 'web'],
    official: true,
    capabilities: { tools: true, resources: true },
    exampleTools: ['navigate', 'screenshot', 'click', 'fill', 'evaluate'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  },
  {
    name: 'brave-search',
    description: 'Web and local search using Brave Search API',
    package: '@modelcontextprotocol/server-brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    requiredEnv: ['BRAVE_API_KEY'],
    categories: ['search', 'web'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['brave_web_search', 'brave_local_search'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
  },
  {
    name: 'google-maps',
    description: 'Location services, directions, and place information',
    package: '@modelcontextprotocol/server-google-maps',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    requiredEnv: ['GOOGLE_MAPS_API_KEY'],
    categories: ['maps', 'location', 'api'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['geocode', 'reverse_geocode', 'search_places', 'get_directions'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps',
  },
  {
    name: 'slack',
    description: 'Interact with Slack workspaces',
    package: '@modelcontextprotocol/server-slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    requiredEnv: ['SLACK_BOT_TOKEN'],
    categories: ['messaging', 'communication', 'api'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['send_message', 'list_channels', 'get_channel_history'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  },
  {
    name: 'fetch',
    description: 'Fetch and convert web content to markdown',
    package: '@modelcontextprotocol/server-fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    categories: ['web', 'content'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['fetch'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
  },
  {
    name: 'everything',
    description: 'Reference server implementing all MCP features',
    package: '@modelcontextprotocol/server-everything',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    categories: ['reference', 'testing'],
    official: true,
    capabilities: { tools: true, resources: true, prompts: true },
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',
  },
  {
    name: 'sequential-thinking',
    description: 'Dynamic problem-solving through thought sequences',
    package: '@modelcontextprotocol/server-sequential-thinking',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    categories: ['reasoning', 'thinking'],
    official: true,
    capabilities: { tools: true },
    exampleTools: ['create_thought_sequence'],
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking',
  },
];

// ============================================================================
// Community Servers
// ============================================================================

export const communityServers: MCPServerEntry[] = [
  {
    name: 'docker',
    description: 'Manage Docker containers and images',
    package: '@mcp/docker',
    command: 'npx',
    args: ['-y', '@mcp/docker'],
    categories: ['containers', 'devops'],
    capabilities: { tools: true },
    exampleTools: ['list_containers', 'run_container', 'stop_container', 'build_image'],
  },
  {
    name: 'kubernetes',
    description: 'Manage Kubernetes clusters and resources',
    package: '@mcp/kubernetes',
    command: 'npx',
    args: ['-y', '@mcp/kubernetes'],
    categories: ['containers', 'devops', 'cloud'],
    capabilities: { tools: true, resources: true },
    exampleTools: ['list_pods', 'get_logs', 'apply_manifest', 'scale_deployment'],
  },
  {
    name: 'aws',
    description: 'Interact with AWS services',
    package: '@mcp/aws',
    command: 'npx',
    args: ['-y', '@mcp/aws'],
    requiredEnv: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    categories: ['cloud', 'aws'],
    capabilities: { tools: true, resources: true },
    exampleTools: ['s3_list', 's3_get', 'lambda_invoke', 'ec2_list'],
  },
  {
    name: 'notion',
    description: 'Read and write Notion pages and databases',
    package: '@mcp/notion',
    command: 'npx',
    args: ['-y', '@mcp/notion'],
    requiredEnv: ['NOTION_TOKEN'],
    categories: ['productivity', 'docs'],
    capabilities: { tools: true, resources: true },
    exampleTools: ['search_pages', 'get_page', 'create_page', 'query_database'],
  },
  {
    name: 'linear',
    description: 'Manage Linear issues and projects',
    package: '@mcp/linear',
    command: 'npx',
    args: ['-y', '@mcp/linear'],
    requiredEnv: ['LINEAR_API_KEY'],
    categories: ['productivity', 'project-management'],
    capabilities: { tools: true },
    exampleTools: ['create_issue', 'list_issues', 'update_issue', 'search_issues'],
  },
  {
    name: 'jira',
    description: 'Manage Jira issues and projects',
    package: '@mcp/jira',
    command: 'npx',
    args: ['-y', '@mcp/jira'],
    requiredEnv: ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'],
    categories: ['productivity', 'project-management'],
    capabilities: { tools: true },
    exampleTools: ['create_issue', 'search_issues', 'get_issue', 'transition_issue'],
  },
  {
    name: 'stripe',
    description: 'Manage Stripe payments and subscriptions',
    package: '@mcp/stripe',
    command: 'npx',
    args: ['-y', '@mcp/stripe'],
    requiredEnv: ['STRIPE_API_KEY'],
    categories: ['payments', 'api'],
    capabilities: { tools: true },
    exampleTools: ['list_customers', 'create_payment', 'list_subscriptions'],
  },
  {
    name: 'openapi',
    description: 'Generate MCP tools from OpenAPI specs',
    package: '@mcp/openapi',
    command: 'npx',
    args: ['-y', '@mcp/openapi'],
    categories: ['api', 'development'],
    capabilities: { tools: true },
  },
  {
    name: 'graphql',
    description: 'Execute GraphQL queries and mutations',
    package: '@mcp/graphql',
    command: 'npx',
    args: ['-y', '@mcp/graphql'],
    categories: ['api', 'development'],
    capabilities: { tools: true },
    exampleTools: ['query', 'mutate', 'introspect'],
  },
  {
    name: 'redis',
    description: 'Interact with Redis databases',
    package: '@mcp/redis',
    command: 'npx',
    args: ['-y', '@mcp/redis'],
    requiredEnv: ['REDIS_URL'],
    categories: ['database', 'cache'],
    capabilities: { tools: true },
    exampleTools: ['get', 'set', 'del', 'keys', 'hget', 'hset'],
  },
  {
    name: 'mongodb',
    description: 'Query and manage MongoDB databases',
    package: '@mcp/mongodb',
    command: 'npx',
    args: ['-y', '@mcp/mongodb'],
    requiredEnv: ['MONGODB_URI'],
    categories: ['database', 'nosql'],
    capabilities: { tools: true, resources: true },
    exampleTools: ['find', 'insert', 'update', 'delete', 'aggregate'],
  },
];

// ============================================================================
// MCP Registry
// ============================================================================

export class MCPRegistry {
  private servers: Map<string, MCPServerEntry> = new Map();
  private categories: Set<string> = new Set();

  constructor() {
    // Initialize with empty registry
  }

  /**
   * Add a server to the registry
   */
  add(server: MCPServerEntry): this {
    this.servers.set(server.name, server);
    for (const category of server.categories) {
      this.categories.add(category);
    }
    return this;
  }

  /**
   * Add multiple servers
   */
  addAll(servers: MCPServerEntry[]): this {
    for (const server of servers) {
      this.add(server);
    }
    return this;
  }

  /**
   * Remove a server
   */
  remove(name: string): boolean {
    return this.servers.delete(name);
  }

  /**
   * Get a server by name
   */
  get(name: string): MCPServerEntry | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if a server exists
   */
  has(name: string): boolean {
    return this.servers.has(name);
  }

  /**
   * List all servers
   */
  list(options?: RegistrySearchOptions): MCPServerEntry[] {
    let servers = Array.from(this.servers.values());

    if (options?.category) {
      servers = servers.filter((s) => s.categories.includes(options.category!));
    }

    if (options?.official !== undefined) {
      servers = servers.filter((s) => s.official === options.official);
    }

    if (options?.capability) {
      servers = servers.filter((s) => s.capabilities?.[options.capability!]);
    }

    if (options?.limit) {
      servers = servers.slice(0, options.limit);
    }

    return servers;
  }

  /**
   * Search servers by name or description
   */
  search(query: string, options?: RegistrySearchOptions): MCPServerEntry[] {
    const lowerQuery = query.toLowerCase();

    let servers = Array.from(this.servers.values()).filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.categories.some((c) => c.toLowerCase().includes(lowerQuery)) ||
        s.exampleTools?.some((t) => t.toLowerCase().includes(lowerQuery))
    );

    if (options?.category) {
      servers = servers.filter((s) => s.categories.includes(options.category!));
    }

    if (options?.official !== undefined) {
      servers = servers.filter((s) => s.official === options.official);
    }

    if (options?.capability) {
      servers = servers.filter((s) => s.capabilities?.[options.capability!]);
    }

    if (options?.limit) {
      servers = servers.slice(0, options.limit);
    }

    return servers;
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Get servers by category
   */
  byCategory(category: string): MCPServerEntry[] {
    return Array.from(this.servers.values()).filter((s) =>
      s.categories.includes(category)
    );
  }

  /**
   * Get official servers
   */
  getOfficial(): MCPServerEntry[] {
    return Array.from(this.servers.values()).filter((s) => s.official);
  }

  /**
   * Get count
   */
  count(): number {
    return this.servers.size;
  }

  /**
   * Get the command to run a server
   */
  getCommand(name: string): string | undefined {
    const server = this.get(name);
    if (!server) return undefined;

    const args = server.args?.join(' ') || '';
    return `${server.command} ${args}`.trim();
  }

  /**
   * Get required environment variables for a server
   */
  getRequiredEnv(name: string): string[] {
    const server = this.get(name);
    return server?.requiredEnv || [];
  }

  /**
   * Check if a server's environment is configured
   */
  isConfigured(name: string): boolean {
    const requiredEnv = this.getRequiredEnv(name);
    return requiredEnv.every((key) => process.env[key]);
  }

  /**
   * Get missing environment variables
   */
  getMissingEnv(name: string): string[] {
    const requiredEnv = this.getRequiredEnv(name);
    return requiredEnv.filter((key) => !process.env[key]);
  }

  /**
   * Export registry as JSON
   */
  toJSON(): MCPServerEntry[] {
    return Array.from(this.servers.values());
  }

  /**
   * Import from JSON
   */
  static fromJSON(data: MCPServerEntry[]): MCPRegistry {
    const registry = new MCPRegistry();
    registry.addAll(data);
    return registry;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an empty registry
 */
export function createMCPRegistry(): MCPRegistry {
  return new MCPRegistry();
}

/**
 * Create a registry with official servers
 */
export function createOfficialRegistry(): MCPRegistry {
  return new MCPRegistry().addAll(officialServers);
}

/**
 * Create a registry with all known servers
 */
export function createFullRegistry(): MCPRegistry {
  return new MCPRegistry()
    .addAll(officialServers)
    .addAll(communityServers);
}

// ============================================================================
// Server Configuration Generator
// ============================================================================

export interface MCPClientConfig {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

/**
 * Generate MCP client configuration for Claude Desktop or other clients
 */
export function generateMCPConfig(
  serverNames: string[],
  registry: MCPRegistry = createFullRegistry()
): MCPClientConfig {
  const config: MCPClientConfig = { mcpServers: {} };

  for (const name of serverNames) {
    const server = registry.get(name);
    if (!server) {
      console.warn(`Server not found: ${name}`);
      continue;
    }

    config.mcpServers[name] = {
      command: server.command,
      args: server.args,
      env: server.env,
    };
  }

  return config;
}

/**
 * Format registry for display
 */
export function formatRegistry(registry: MCPRegistry): string {
  const servers = registry.list();
  let output = `\nMCP Server Registry (${servers.length} servers)\n`;
  output += '═'.repeat(60) + '\n\n';

  const byCategory = new Map<string, MCPServerEntry[]>();
  for (const server of servers) {
    for (const category of server.categories) {
      const list = byCategory.get(category) || [];
      list.push(server);
      byCategory.set(category, list);
    }
  }

  for (const [category, categoryServers] of byCategory) {
    output += `📁 ${category.toUpperCase()}\n`;
    output += '─'.repeat(40) + '\n';

    for (const server of categoryServers) {
      const official = server.official ? ' ⭐' : '';
      output += `  ${server.name}${official}\n`;
      output += `    ${server.description}\n`;
      if (server.exampleTools?.length) {
        output += `    Tools: ${server.exampleTools.slice(0, 3).join(', ')}\n`;
      }
    }
    output += '\n';
  }

  return output;
}
