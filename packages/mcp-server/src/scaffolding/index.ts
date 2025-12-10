/**
 * MCP Server Scaffolding Tools
 *
 * Tools for creating custom MCP servers with resources, tools, and prompts.
 *
 * @example
 * ```typescript
 * import { createMCPServer, addTool, addResource } from '@rana/mcp-server/scaffolding';
 *
 * // Create new server
 * await createMCPServer({
 *   name: 'my-mcp-server',
 *   description: 'Custom MCP server',
 *   outputDir: './my-server',
 * });
 *
 * // Add components
 * await addTool('my-server', {
 *   name: 'search',
 *   description: 'Search the database',
 *   parameters: { query: 'string', limit: 'number' },
 * });
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  description: string;
  version?: string;
  outputDir: string;
  features?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

export interface MCPToolConfig {
  name: string;
  description: string;
  parameters: Record<string, string | ParameterConfig>;
  returns?: string;
  handler?: string;
}

export interface ParameterConfig {
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
}

export interface MCPResourceConfig {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler?: string;
}

export interface MCPPromptConfig {
  name: string;
  description: string;
  arguments?: Record<string, ParameterConfig>;
  template: string;
}

// ============================================================================
// Server Scaffolding
// ============================================================================

/**
 * Create a new MCP server project
 */
export async function createMCPServer(config: MCPServerConfig): Promise<void> {
  const {
    name,
    description,
    version = '1.0.0',
    outputDir,
    features = { tools: true, resources: true, prompts: true },
  } = config;

  const serverDir = path.resolve(outputDir);

  // Create directory structure
  await fs.mkdir(serverDir, { recursive: true });
  await fs.mkdir(path.join(serverDir, 'src'), { recursive: true });
  if (features.tools) await fs.mkdir(path.join(serverDir, 'src/tools'), { recursive: true });
  if (features.resources) await fs.mkdir(path.join(serverDir, 'src/resources'), { recursive: true });
  if (features.prompts) await fs.mkdir(path.join(serverDir, 'src/prompts'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: `@mcp/${name}`,
    version,
    description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    bin: {
      [name]: './dist/index.js',
    },
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'ts-node src/index.ts',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^0.5.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      typescript: '^5.0.0',
      'ts-node': '^10.9.0',
    },
  };

  await fs.writeFile(
    path.join(serverDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'commonjs',
      lib: ['ES2022'],
      declaration: true,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await fs.writeFile(
    path.join(serverDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Create main index.ts
  const indexContent = generateServerIndex(name, description, features);
  await fs.writeFile(path.join(serverDir, 'src/index.ts'), indexContent);

  // Create README
  const readmeContent = generateReadme(name, description);
  await fs.writeFile(path.join(serverDir, 'README.md'), readmeContent);

  // Create example files
  if (features.tools) {
    await fs.writeFile(
      path.join(serverDir, 'src/tools/example.ts'),
      generateExampleTool()
    );
  }

  if (features.resources) {
    await fs.writeFile(
      path.join(serverDir, 'src/resources/example.ts'),
      generateExampleResource()
    );
  }

  if (features.prompts) {
    await fs.writeFile(
      path.join(serverDir, 'src/prompts/example.ts'),
      generateExamplePrompt()
    );
  }
}

/**
 * Add a tool to an existing MCP server
 */
export async function addTool(serverDir: string, config: MCPToolConfig): Promise<void> {
  const toolsDir = path.join(serverDir, 'src/tools');
  await fs.mkdir(toolsDir, { recursive: true });

  const fileName = `${config.name}.ts`;
  const content = generateToolFile(config);

  await fs.writeFile(path.join(toolsDir, fileName), content);
}

/**
 * Add a resource to an existing MCP server
 */
export async function addResource(serverDir: string, config: MCPResourceConfig): Promise<void> {
  const resourcesDir = path.join(serverDir, 'src/resources');
  await fs.mkdir(resourcesDir, { recursive: true });

  const fileName = `${config.name.replace(/[^a-zA-Z0-9]/g, '-')}.ts`;
  const content = generateResourceFile(config);

  await fs.writeFile(path.join(resourcesDir, fileName), content);
}

/**
 * Add a prompt to an existing MCP server
 */
export async function addPrompt(serverDir: string, config: MCPPromptConfig): Promise<void> {
  const promptsDir = path.join(serverDir, 'src/prompts');
  await fs.mkdir(promptsDir, { recursive: true });

  const fileName = `${config.name}.ts`;
  const content = generatePromptFile(config);

  await fs.writeFile(path.join(promptsDir, fileName), content);
}

// ============================================================================
// Code Generators
// ============================================================================

function generateServerIndex(name: string, description: string, features: MCPServerConfig['features']): string {
  return `#!/usr/bin/env node
/**
 * ${name} - MCP Server
 * ${description}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

${features?.tools ? "import { tools, handleToolCall } from './tools';" : ''}
${features?.resources ? "import { resources, handleResourceRead } from './resources';" : ''}
${features?.prompts ? "import { prompts, handlePromptGet } from './prompts';" : ''}

const server = new Server(
  {
    name: '${name}',
    version: '1.0.0',
  },
  {
    capabilities: {
      ${features?.tools ? 'tools: {},' : ''}
      ${features?.resources ? 'resources: {},' : ''}
      ${features?.prompts ? 'prompts: {},' : ''}
    },
  }
);

${features?.tools ? `
// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleToolCall(request.params.name, request.params.arguments || {});
});
` : ''}

${features?.resources ? `
// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resources.map((resource) => ({
    uri: resource.uri,
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
  })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleResourceRead(request.params.uri);
});
` : ''}

${features?.prompts ? `
// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: prompts.map((prompt) => ({
    name: prompt.name,
    description: prompt.description,
    arguments: prompt.arguments,
  })),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return handlePromptGet(request.params.name, request.params.arguments || {});
});
` : ''}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${name} MCP server running on stdio');
}

main().catch(console.error);
`;
}

function generateExampleTool(): string {
  return `/**
 * Example MCP Tool
 */

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const tools: Tool[] = [
  {
    name: 'example_tool',
    description: 'An example tool that echoes input',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to echo',
        },
      },
      required: ['message'],
    },
    handler: async (args) => {
      return {
        content: [
          {
            type: 'text',
            text: \`Echo: \${args.message}\`,
          },
        ],
      };
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const tool = tools.find((t) => t.name === name);

  if (!tool) {
    throw new Error(\`Unknown tool: \${name}\`);
  }

  return tool.handler(args) as Promise<{ content: Array<{ type: string; text: string }> }>;
}
`;
}

function generateExampleResource(): string {
  return `/**
 * Example MCP Resource
 */

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: () => Promise<string>;
}

export const resources: Resource[] = [
  {
    uri: 'example://readme',
    name: 'README',
    description: 'Server documentation',
    mimeType: 'text/markdown',
    handler: async () => {
      return '# Example MCP Server\\n\\nThis is an example resource.';
    },
  },
];

export async function handleResourceRead(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType?: string; text: string }> }> {
  const resource = resources.find((r) => r.uri === uri);

  if (!resource) {
    throw new Error(\`Unknown resource: \${uri}\`);
  }

  const content = await resource.handler();

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: content,
      },
    ],
  };
}
`;
}

function generateExamplePrompt(): string {
  return `/**
 * Example MCP Prompt
 */

export interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  handler: (args: Record<string, string>) => Promise<string>;
}

export const prompts: Prompt[] = [
  {
    name: 'greeting',
    description: 'Generate a greeting message',
    arguments: [
      {
        name: 'name',
        description: 'Name to greet',
        required: true,
      },
    ],
    handler: async (args) => {
      return \`Hello, \${args.name}! Welcome to the MCP server.\`;
    },
  },
];

export async function handlePromptGet(
  name: string,
  args: Record<string, string>
): Promise<{ messages: Array<{ role: string; content: { type: string; text: string } }> }> {
  const prompt = prompts.find((p) => p.name === name);

  if (!prompt) {
    throw new Error(\`Unknown prompt: \${name}\`);
  }

  const content = await prompt.handler(args);

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  };
}
`;
}

function generateToolFile(config: MCPToolConfig): string {
  const params = Object.entries(config.parameters).map(([name, type]) => {
    const typeStr = typeof type === 'string' ? type : (type as ParameterConfig).type;
    return `        ${name}: { type: '${typeStr}' },`;
  });

  return `/**
 * ${config.name} - ${config.description}
 */

import { Tool } from './index';

export const ${camelCase(config.name)}Tool: Tool = {
  name: '${config.name}',
  description: '${config.description}',
  inputSchema: {
    type: 'object',
    properties: {
${params.join('\\n')}
    },
    required: [${Object.keys(config.parameters).map(k => `'${k}'`).join(', ')}],
  },
  handler: async (args) => {
    // TODO: Implement ${config.name}
    return {
      content: [
        {
          type: 'text',
          text: 'Tool executed successfully',
        },
      ],
    };
  },
};
`;
}

function generateResourceFile(config: MCPResourceConfig): string {
  return `/**
 * ${config.name} Resource
 * ${config.description || ''}
 */

import { Resource } from './index';

export const ${camelCase(config.name)}Resource: Resource = {
  uri: '${config.uri}',
  name: '${config.name}',
  description: '${config.description || ''}',
  mimeType: '${config.mimeType || 'text/plain'}',
  handler: async () => {
    // TODO: Implement resource handler
    return 'Resource content here';
  },
};
`;
}

function generatePromptFile(config: MCPPromptConfig): string {
  const args = config.arguments
    ? Object.entries(config.arguments).map(([name, cfg]) => ({
        name,
        description: cfg.description,
        required: cfg.required,
      }))
    : [];

  return `/**
 * ${config.name} Prompt
 * ${config.description}
 */

import { Prompt } from './index';

export const ${camelCase(config.name)}Prompt: Prompt = {
  name: '${config.name}',
  description: '${config.description}',
  ${args.length > 0 ? `arguments: ${JSON.stringify(args, null, 2)},` : ''}
  handler: async (args) => {
    // Template: ${config.template}
    return \`${config.template}\`;
  },
};
`;
}

function generateReadme(name: string, description: string): string {
  return `# ${name}

${description}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "node",
      "args": ["path/to/${name}/dist/index.js"]
    }
  }
}
\`\`\`

### Standalone

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Features

### Tools

List available tools and their descriptions.

### Resources

List available resources and their URIs.

### Prompts

List available prompts and their templates.

## License

MIT
`;
}

function camelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

// Export for CLI use
export default {
  createMCPServer,
  addTool,
  addResource,
  addPrompt,
};
