/**
 * MCP Server Scaffolding Generator
 * Create production-ready MCP servers with best practices
 */

import type { MCPTool, MCPResource, MCPPrompt } from './types';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerTemplate {
  name: string;
  description: string;
  category: 'database' | 'api' | 'filesystem' | 'integration' | 'utility' | 'custom';
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  dependencies: string[];
  devDependencies: string[];
  envVars: EnvVar[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  returns: string;
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  dynamic?: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: { name: string; description: string; required?: boolean }[];
  template: string;
}

export interface EnvVar {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
}

export interface ScaffoldOptions {
  name: string;
  description: string;
  template?: string;
  outputDir?: string;
  author?: string;
  license?: string;
  includeTests?: boolean;
  includeDocker?: boolean;
  includeClaude?: boolean;
  typescript?: boolean;
}

export interface ScaffoldResult {
  files: GeneratedFile[];
  instructions: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

// ============================================================================
// Built-in Templates
// ============================================================================

export const TEMPLATES: Record<string, MCPServerTemplate> = {
  database: {
    name: 'Database MCP Server',
    description: 'MCP server for database operations (PostgreSQL, MySQL, SQLite)',
    category: 'database',
    tools: [
      {
        name: 'query',
        description: 'Execute a SQL query',
        parameters: [
          { name: 'sql', type: 'string', description: 'SQL query to execute', required: true },
          { name: 'params', type: 'array', description: 'Query parameters' },
        ],
        returns: 'Query results as JSON',
      },
      {
        name: 'insert',
        description: 'Insert a record into a table',
        parameters: [
          { name: 'table', type: 'string', description: 'Table name', required: true },
          { name: 'data', type: 'object', description: 'Record data', required: true },
        ],
        returns: 'Inserted record with ID',
      },
      {
        name: 'update',
        description: 'Update records in a table',
        parameters: [
          { name: 'table', type: 'string', description: 'Table name', required: true },
          { name: 'data', type: 'object', description: 'Fields to update', required: true },
          { name: 'where', type: 'object', description: 'Where conditions', required: true },
        ],
        returns: 'Number of affected rows',
      },
      {
        name: 'delete',
        description: 'Delete records from a table',
        parameters: [
          { name: 'table', type: 'string', description: 'Table name', required: true },
          { name: 'where', type: 'object', description: 'Where conditions', required: true },
        ],
        returns: 'Number of deleted rows',
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        parameters: [],
        returns: 'Array of table names',
      },
      {
        name: 'describe_table',
        description: 'Get table schema/structure',
        parameters: [
          { name: 'table', type: 'string', description: 'Table name', required: true },
        ],
        returns: 'Table columns and types',
      },
    ],
    resources: [
      { uri: 'db://schema', name: 'Database Schema', description: 'Complete database schema', mimeType: 'application/json' },
      { uri: 'db://tables/{table}', name: 'Table Data', description: 'Data from a specific table', mimeType: 'application/json', dynamic: true },
    ],
    prompts: [
      {
        name: 'generate_query',
        description: 'Generate SQL query from natural language',
        arguments: [{ name: 'description', description: 'What to query', required: true }],
        template: 'Generate a SQL query for: {{description}}',
      },
    ],
    dependencies: ['pg', 'mysql2', 'better-sqlite3'],
    devDependencies: ['@types/pg', '@types/better-sqlite3'],
    envVars: [
      { name: 'DATABASE_URL', description: 'Database connection string', required: true },
      { name: 'DATABASE_TYPE', description: 'Database type: postgres, mysql, sqlite', default: 'postgres' },
    ],
  },

  api: {
    name: 'REST API MCP Server',
    description: 'MCP server for interacting with REST APIs',
    category: 'api',
    tools: [
      {
        name: 'get',
        description: 'Make a GET request',
        parameters: [
          { name: 'url', type: 'string', description: 'URL to request', required: true },
          { name: 'headers', type: 'object', description: 'Request headers' },
        ],
        returns: 'Response data',
      },
      {
        name: 'post',
        description: 'Make a POST request',
        parameters: [
          { name: 'url', type: 'string', description: 'URL to request', required: true },
          { name: 'data', type: 'object', description: 'Request body', required: true },
          { name: 'headers', type: 'object', description: 'Request headers' },
        ],
        returns: 'Response data',
      },
      {
        name: 'put',
        description: 'Make a PUT request',
        parameters: [
          { name: 'url', type: 'string', description: 'URL to request', required: true },
          { name: 'data', type: 'object', description: 'Request body', required: true },
        ],
        returns: 'Response data',
      },
      {
        name: 'delete',
        description: 'Make a DELETE request',
        parameters: [
          { name: 'url', type: 'string', description: 'URL to request', required: true },
        ],
        returns: 'Response data',
      },
    ],
    resources: [
      { uri: 'api://endpoints', name: 'API Endpoints', description: 'Configured endpoints', mimeType: 'application/json' },
    ],
    prompts: [],
    dependencies: ['axios'],
    devDependencies: [],
    envVars: [
      { name: 'API_BASE_URL', description: 'Base URL for API requests' },
      { name: 'API_KEY', description: 'API authentication key' },
    ],
  },

  filesystem: {
    name: 'Filesystem MCP Server',
    description: 'MCP server for file system operations',
    category: 'filesystem',
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        parameters: [
          { name: 'path', type: 'string', description: 'File path', required: true },
        ],
        returns: 'File contents',
      },
      {
        name: 'write_file',
        description: 'Write contents to a file',
        parameters: [
          { name: 'path', type: 'string', description: 'File path', required: true },
          { name: 'content', type: 'string', description: 'Content to write', required: true },
        ],
        returns: 'Success confirmation',
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        parameters: [
          { name: 'path', type: 'string', description: 'Directory path', required: true },
        ],
        returns: 'Array of entries',
      },
      {
        name: 'search',
        description: 'Search for files matching a pattern',
        parameters: [
          { name: 'path', type: 'string', description: 'Directory to search', required: true },
          { name: 'pattern', type: 'string', description: 'Glob pattern', required: true },
        ],
        returns: 'Matching file paths',
      },
    ],
    resources: [
      { uri: 'file://{path}', name: 'File Content', description: 'Contents of a file', mimeType: 'text/plain', dynamic: true },
    ],
    prompts: [],
    dependencies: ['glob', 'fs-extra'],
    devDependencies: ['@types/fs-extra'],
    envVars: [
      { name: 'ALLOWED_PATHS', description: 'Comma-separated allowed paths' },
    ],
  },

  github: {
    name: 'GitHub MCP Server',
    description: 'MCP server for GitHub operations',
    category: 'integration',
    tools: [
      {
        name: 'get_repo',
        description: 'Get repository information',
        parameters: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
        ],
        returns: 'Repository details',
      },
      {
        name: 'list_issues',
        description: 'List repository issues',
        parameters: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'state', type: 'string', description: 'Issue state', enum: ['open', 'closed', 'all'] },
        ],
        returns: 'Array of issues',
      },
      {
        name: 'create_issue',
        description: 'Create a new issue',
        parameters: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'title', type: 'string', description: 'Issue title', required: true },
          { name: 'body', type: 'string', description: 'Issue body' },
        ],
        returns: 'Created issue',
      },
      {
        name: 'create_pr',
        description: 'Create a pull request',
        parameters: [
          { name: 'owner', type: 'string', description: 'Repository owner', required: true },
          { name: 'repo', type: 'string', description: 'Repository name', required: true },
          { name: 'title', type: 'string', description: 'PR title', required: true },
          { name: 'head', type: 'string', description: 'Head branch', required: true },
          { name: 'base', type: 'string', description: 'Base branch', required: true },
        ],
        returns: 'Created pull request',
      },
    ],
    resources: [
      { uri: 'github://repos/{owner}/{repo}', name: 'Repository', description: 'Repository info', mimeType: 'application/json', dynamic: true },
    ],
    prompts: [
      {
        name: 'review_pr',
        description: 'Review a pull request',
        arguments: [
          { name: 'owner', description: 'Repository owner', required: true },
          { name: 'repo', description: 'Repository name', required: true },
          { name: 'pr_number', description: 'PR number', required: true },
        ],
        template: 'Review PR #{{pr_number}} in {{owner}}/{{repo}}',
      },
    ],
    dependencies: ['@octokit/rest'],
    devDependencies: [],
    envVars: [
      { name: 'GITHUB_TOKEN', description: 'GitHub personal access token', required: true },
    ],
  },

  slack: {
    name: 'Slack MCP Server',
    description: 'MCP server for Slack operations',
    category: 'integration',
    tools: [
      {
        name: 'send_message',
        description: 'Send a message to a channel',
        parameters: [
          { name: 'channel', type: 'string', description: 'Channel ID or name', required: true },
          { name: 'text', type: 'string', description: 'Message text', required: true },
        ],
        returns: 'Message timestamp',
      },
      {
        name: 'list_channels',
        description: 'List available channels',
        parameters: [],
        returns: 'Array of channels',
      },
      {
        name: 'get_messages',
        description: 'Get messages from a channel',
        parameters: [
          { name: 'channel', type: 'string', description: 'Channel ID', required: true },
          { name: 'limit', type: 'number', description: 'Number of messages' },
        ],
        returns: 'Array of messages',
      },
    ],
    resources: [
      { uri: 'slack://channels', name: 'Slack Channels', description: 'List of channels', mimeType: 'application/json' },
    ],
    prompts: [],
    dependencies: ['@slack/web-api'],
    devDependencies: [],
    envVars: [
      { name: 'SLACK_BOT_TOKEN', description: 'Slack bot token', required: true },
    ],
  },

  minimal: {
    name: 'Minimal MCP Server',
    description: 'Minimal MCP server template',
    category: 'custom',
    tools: [
      {
        name: 'hello',
        description: 'A simple hello world tool',
        parameters: [
          { name: 'name', type: 'string', description: 'Name to greet' },
        ],
        returns: 'Greeting message',
      },
    ],
    resources: [
      { uri: 'example://info', name: 'Server Info', description: 'Server information', mimeType: 'application/json' },
    ],
    prompts: [],
    dependencies: [],
    devDependencies: [],
    envVars: [],
  },
};

// ============================================================================
// Scaffolding Generator
// ============================================================================

export function scaffoldMCPServer(options: ScaffoldOptions): ScaffoldResult {
  const template = options.template ? TEMPLATES[options.template] : TEMPLATES.minimal;
  if (!template) {
    throw new Error(`Unknown template: ${options.template}`);
  }

  const files: GeneratedFile[] = [];
  const instructions: string[] = [];
  const serverName = options.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const className = toPascalCase(options.name);

  // package.json
  files.push({
    path: 'package.json',
    content: generatePackageJson(serverName, options, template),
  });

  // tsconfig.json
  if (options.typescript !== false) {
    files.push({ path: 'tsconfig.json', content: generateTsConfig() });
  }

  // Main server file
  files.push({
    path: options.typescript !== false ? 'src/index.ts' : 'src/index.js',
    content: generateServerCode(serverName, options, template),
  });

  // Tools file
  files.push({
    path: options.typescript !== false ? 'src/tools.ts' : 'src/tools.js',
    content: generateToolsCode(template, options.typescript !== false),
  });

  // .env.example
  if (template.envVars.length > 0) {
    files.push({
      path: '.env.example',
      content: template.envVars.map(e => `# ${e.description}${e.required ? ' (required)' : ''}\n${e.name}=${e.default || ''}`).join('\n\n'),
    });
  }

  // README.md
  files.push({
    path: 'README.md',
    content: generateReadme(serverName, options, template),
  });

  // Tests
  if (options.includeTests) {
    files.push({
      path: options.typescript !== false ? 'tests/server.test.ts' : 'tests/server.test.js',
      content: generateTests(template, options.typescript !== false),
    });
  }

  // Docker
  if (options.includeDocker) {
    files.push({ path: 'Dockerfile', content: generateDockerfile() });
  }

  // Claude config
  if (options.includeClaude) {
    files.push({
      path: 'claude-desktop-config.json',
      content: JSON.stringify({ mcpServers: { [serverName]: { command: 'node', args: ['./dist/index.js'] } } }, null, 2),
    });
  }

  instructions.push(`cd ${options.outputDir || serverName}`);
  instructions.push('npm install');
  if (template.envVars.length > 0) {
    instructions.push('cp .env.example .env && edit .env');
  }
  instructions.push('npm run build');
  instructions.push('npm start');

  return { files, instructions };
}

// ============================================================================
// Code Generators
// ============================================================================

function generatePackageJson(name: string, options: ScaffoldOptions, template: MCPServerTemplate): string {
  return JSON.stringify({
    name: `mcp-server-${name}`,
    version: '1.0.0',
    description: options.description || template.description,
    main: options.typescript !== false ? 'dist/index.js' : 'src/index.js',
    bin: { [`mcp-server-${name}`]: options.typescript !== false ? './dist/index.js' : './src/index.js' },
    scripts: {
      build: options.typescript !== false ? 'tsc' : 'echo "No build"',
      start: options.typescript !== false ? 'node dist/index.js' : 'node src/index.js',
      dev: options.typescript !== false ? 'ts-node src/index.ts' : 'node src/index.js',
      test: 'vitest run',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      zod: '^3.22.0',
      ...Object.fromEntries(template.dependencies.map(d => [d, 'latest'])),
    },
    devDependencies: {
      ...(options.typescript !== false ? { typescript: '^5.3.0', '@types/node': '^20.0.0', 'ts-node': '^10.9.0' } : {}),
      vitest: '^1.0.0',
      ...Object.fromEntries(template.devDependencies.map(d => [d, 'latest'])),
    },
  }, null, 2);
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      declaration: true,
    },
    include: ['src/**/*'],
  }, null, 2);
}

function generateServerCode(name: string, options: ScaffoldOptions, template: MCPServerTemplate): string {
  const ts = options.typescript !== false;
  return `#!/usr/bin/env node
/**
 * ${options.name} MCP Server
 * ${options.description || template.description}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools, handleToolCall } from './tools${ts ? '' : '.js'}';

const server = new Server(
  { name: 'mcp-server-${name}', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleToolCall(name, args${ts ? ' as Record<string, unknown>' : ''});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error${ts ? ': unknown' : ''}) {
    return {
      content: [{ type: 'text', text: \`Error: \${error instanceof Error ? error.message : 'Unknown'}\` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${options.name} MCP server running');
}

main().catch(console.error);
`;
}

function generateToolsCode(template: MCPServerTemplate, ts: boolean): string {
  const toolDefs = template.tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(t.parameters.map(p => [p.name, { type: p.type, description: p.description }])),
      required: t.parameters.filter(p => p.required).map(p => p.name),
    },
  }));

  const cases = template.tools.map(t => `    case '${t.name}':
      // TODO: Implement ${t.name}
      return { success: true, tool: '${t.name}' };`).join('\n');

  return `${ts ? "import type { Tool } from '@modelcontextprotocol/sdk/types.js';\n\n" : ''}export const tools${ts ? ': Tool[]' : ''} = ${JSON.stringify(toolDefs, null, 2)};

export async function handleToolCall(name${ts ? ': string' : ''}, args${ts ? ': Record<string, unknown>' : ''})${ts ? ': Promise<unknown>' : ''} {
  switch (name) {
${cases}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
}
`;
}

function generateReadme(name: string, options: ScaffoldOptions, template: MCPServerTemplate): string {
  return `# MCP Server: ${options.name}

${options.description || template.description}

## Installation

\`\`\`bash
npm install && npm run build
\`\`\`

## Usage with Claude Desktop

Add to \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "node",
      "args": ["path/to/dist/index.js"]
    }
  }
}
\`\`\`

## Tools

${template.tools.map(t => `### ${t.name}\n${t.description}\n`).join('\n')}

---
Generated with [RANA](https://rana.cx)
`;
}

function generateTests(template: MCPServerTemplate, ts: boolean): string {
  return `import { describe, it, expect } from 'vitest';
import { tools, handleToolCall } from '../src/tools${ts ? '' : '.js'}';

describe('Tools', () => {
  it('should have ${template.tools.length} tools', () => {
    expect(tools).toHaveLength(${template.tools.length});
  });

  it('should throw for unknown tool', async () => {
    await expect(handleToolCall('unknown', {})).rejects.toThrow();
  });
});
`;
}

function generateDockerfile(): string {
  return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
`;
}

function toPascalCase(str: string): string {
  return str.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

export { TEMPLATES as mcpTemplates };
