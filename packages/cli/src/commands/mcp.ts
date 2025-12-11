/**
 * MCP Server Creation commands
 * rana mcp create, rana mcp list, rana mcp add-tool
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Server template configuration
 */
interface MCPServerTemplate {
  name: string;
  description: string;
  tools: MCPToolTemplate[];
  resources: MCPResourceTemplate[];
  prompts: MCPPromptTemplate[];
}

interface MCPToolTemplate {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

interface MCPResourceTemplate {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

interface MCPPromptTemplate {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Register MCP commands
 */
export function registerMCPCommands(program: Command): void {
  const mcp = program
    .command('mcp')
    .description('MCP (Model Context Protocol) server management');

  // Create new MCP server
  mcp
    .command('create [name]')
    .description('Create a new MCP server project')
    .option('-t, --template <template>', 'Server template (basic, data-source, api-wrapper)', 'basic')
    .option('-d, --dir <directory>', 'Output directory')
    .option('--ts', 'Use TypeScript (default)', true)
    .option('--js', 'Use JavaScript instead of TypeScript')
    .action(async (name, options) => {
      try {
        // Interactive mode if no name provided
        const config = name
          ? { name, template: options.template, useTypeScript: !options.js }
          : await runMCPWizard();

        const outputDir = options.dir || path.join(process.cwd(), config.name);

        await createMCPServer(config, outputDir);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Add tool to existing MCP server
  mcp
    .command('add-tool <name>')
    .description('Add a new tool to an existing MCP server')
    .option('-d, --description <desc>', 'Tool description')
    .action(async (name, options) => {
      try {
        await addToolToServer(name, options.description);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Add resource to existing MCP server
  mcp
    .command('add-resource <uri>')
    .description('Add a new resource to an existing MCP server')
    .option('-n, --name <name>', 'Resource name')
    .option('-d, --description <desc>', 'Resource description')
    .action(async (uri, options) => {
      try {
        await addResourceToServer(uri, options);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // List available templates
  mcp
    .command('templates')
    .description('List available MCP server templates')
    .action(() => {
      console.log(chalk.bold.blue('\n MCP Server Templates\n'));

      const templates = [
        {
          name: 'basic',
          desc: 'Minimal MCP server with one example tool',
          useCase: 'Learning MCP, simple integrations',
        },
        {
          name: 'data-source',
          desc: 'MCP server for exposing data sources',
          useCase: 'Database access, file systems, APIs',
        },
        {
          name: 'api-wrapper',
          desc: 'MCP server wrapping external APIs',
          useCase: 'Third-party API integration',
        },
        {
          name: 'full',
          desc: 'Complete MCP server with all features',
          useCase: 'Production-ready servers',
        },
      ];

      for (const t of templates) {
        console.log(chalk.cyan(`  ${t.name.padEnd(15)}`), chalk.white(t.desc));
        console.log(chalk.gray(`                 Use case: ${t.useCase}`));
        console.log();
      }
    });

  // Generate Claude Desktop config
  mcp
    .command('config')
    .description('Generate Claude Desktop MCP configuration')
    .option('-n, --name <name>', 'Server name', 'my-mcp-server')
    .option('-p, --path <path>', 'Server path', '.')
    .action((options) => {
      const config = generateClaudeConfig(options.name, path.resolve(options.path));
      console.log(chalk.bold.blue('\n Claude Desktop MCP Configuration\n'));
      console.log(chalk.gray('Add this to your Claude Desktop config:\n'));
      console.log(chalk.white(JSON.stringify(config, null, 2)));
      console.log();
      console.log(chalk.gray('Config file location:'));
      console.log(chalk.gray('  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json'));
      console.log(chalk.gray('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json'));
      console.log();
    });

  // Validate MCP server
  mcp
    .command('validate [dir]')
    .description('Validate MCP server structure')
    .action(async (dir) => {
      const targetDir = dir || process.cwd();
      const spinner = ora('Validating MCP server...').start();

      try {
        const result = await validateMCPServer(targetDir);

        if (result.valid) {
          spinner.succeed('MCP server structure is valid');
        } else {
          spinner.fail('MCP server validation failed');
        }

        if (result.errors.length > 0) {
          console.log(chalk.red('\n Errors:'));
          result.errors.forEach(e => console.log(chalk.red(`   ✗ ${e}`)));
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\n Warnings:'));
          result.warnings.forEach(w => console.log(chalk.yellow(`   ⚠ ${w}`)));
        }

        if (result.valid && result.warnings.length === 0) {
          console.log(chalk.green('\n ✓ All checks passed'));
        }
        console.log();
      } catch (error) {
        spinner.fail('Validation error');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Test MCP server
  mcp
    .command('test [dir]')
    .description('Test MCP server')
    .action(async (dir) => {
      const targetDir = dir || process.cwd();
      const spinner = ora('Testing MCP server...').start();

      try {
        const result = await testMCPServer(targetDir);
        spinner.stop();

        console.log(chalk.bold.blue('\n MCP Server Test Results\n'));
        console.log('─'.repeat(50));

        for (const test of result.results) {
          const icon = test.passed ? chalk.green('✓') : chalk.red('✗');
          const status = test.passed ? chalk.green('PASS') : chalk.red('FAIL');
          console.log(`${icon} [${status}] ${test.test}`);
          if (test.error) {
            console.log(chalk.gray(`     └─ ${test.error}`));
          }
        }

        console.log('─'.repeat(50));
        const passedCount = result.results.filter(r => r.passed).length;
        console.log(`Total: ${result.results.length} | Passed: ${passedCount} | Failed: ${result.results.length - passedCount}`);
        console.log();

        if (!result.passed) {
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Test error');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // Publish MCP server
  mcp
    .command('publish [dir]')
    .description('Publish MCP server to npm')
    .option('--dry-run', 'Show what would be published without actually publishing')
    .option('--tag <tag>', 'npm tag', 'latest')
    .action(async (dir, options) => {
      const targetDir = dir || process.cwd();

      // First validate
      const validation = await validateMCPServer(targetDir);
      if (!validation.valid) {
        console.error(chalk.red('\n Server validation failed. Fix errors before publishing:\n'));
        validation.errors.forEach(e => console.log(chalk.red(`   ✗ ${e}`)));
        process.exit(1);
      }

      // Check if npm logged in
      const { execSync } = await import('child_process');

      try {
        execSync('npm whoami', { stdio: 'pipe' });
      } catch {
        console.error(chalk.red('\n Not logged in to npm. Run: npm login'));
        process.exit(1);
      }

      // Publish
      const spinner = ora(options.dryRun ? 'Running dry-run publish...' : 'Publishing to npm...').start();

      try {
        const cmd = options.dryRun
          ? `npm publish --dry-run --tag ${options.tag}`
          : `npm publish --tag ${options.tag}`;

        execSync(cmd, { cwd: targetDir, stdio: 'inherit' });

        if (options.dryRun) {
          spinner.succeed('Dry run completed');
        } else {
          spinner.succeed('Published to npm');
          console.log(chalk.green('\n ✓ MCP server published successfully!'));
          console.log(chalk.gray('\n Users can install with:'));
          const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
          console.log(chalk.white(`   npm install -g ${pkg.name}`));
        }
      } catch (error) {
        spinner.fail('Publish failed');
        process.exit(1);
      }
    });
}

/**
 * Interactive wizard for MCP server creation
 */
async function runMCPWizard(): Promise<{
  name: string;
  description: string;
  template: string;
  useTypeScript: boolean;
  tools: string[];
}> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   MCP Server Generator                         │'));
  console.log(chalk.cyan('│   Create servers for AI tool integration       │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Server name:',
      default: 'my-mcp-server',
      validate: (input: string) =>
        /^[a-z0-9-]+$/.test(input) || 'Use lowercase letters, numbers, and hyphens only',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: 'A custom MCP server',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Template:',
      choices: [
        { name: 'Basic - Minimal server with example tool', value: 'basic' },
        { name: 'Data Source - For exposing data (DB, files)', value: 'data-source' },
        { name: 'API Wrapper - For third-party API integration', value: 'api-wrapper' },
        { name: 'Full - Complete server with all features', value: 'full' },
      ],
    },
    {
      type: 'confirm',
      name: 'useTypeScript',
      message: 'Use TypeScript?',
      default: true,
    },
    {
      type: 'checkbox',
      name: 'tools',
      message: 'Include example tools:',
      choices: [
        { name: 'echo - Simple echo tool', value: 'echo', checked: true },
        { name: 'fetch - HTTP fetch tool', value: 'fetch' },
        { name: 'read_file - File reading tool', value: 'read_file' },
        { name: 'search - Search tool', value: 'search' },
        { name: 'execute - Command execution', value: 'execute' },
      ],
    },
  ]);

  return answers;
}

/**
 * Create MCP server project
 */
async function createMCPServer(
  config: {
    name: string;
    description?: string;
    template: string;
    useTypeScript: boolean;
    tools?: string[];
  },
  outputDir: string
): Promise<void> {
  const spinner = ora('Creating MCP server...').start();

  try {
    // Create directory
    if (fs.existsSync(outputDir)) {
      spinner.fail(`Directory already exists: ${outputDir}`);
      return;
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Generate files based on template
    const ext = config.useTypeScript ? 'ts' : 'js';

    // package.json
    const packageJson = generatePackageJson(config);
    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Main server file
    const serverCode = generateServerCode(config, ext);
    const srcDir = path.join(outputDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, `index.${ext}`), serverCode);

    // TypeScript config
    if (config.useTypeScript) {
      const tsConfig = generateTsConfig();
      fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    }

    // README
    const readme = generateReadme(config);
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);

    // Claude Desktop config example
    const claudeConfig = generateClaudeConfig(config.name, outputDir);
    fs.writeFileSync(
      path.join(outputDir, 'claude_desktop_config.example.json'),
      JSON.stringify(claudeConfig, null, 2)
    );

    spinner.succeed(`Created MCP server: ${config.name}`);

    console.log(chalk.bold.blue('\n Next Steps:\n'));
    console.log(chalk.gray(`  cd ${config.name}`));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  npm run build'));
    console.log(chalk.gray('  npm start'));
    console.log();
    console.log(chalk.gray('Then add to Claude Desktop using the config in claude_desktop_config.example.json'));
    console.log();
  } catch (error) {
    spinner.fail('Failed to create MCP server');
    throw error;
  }
}

/**
 * Generate package.json
 */
function generatePackageJson(config: { name: string; description?: string; useTypeScript: boolean }): object {
  return {
    name: config.name,
    version: '1.0.0',
    description: config.description || 'A custom MCP server',
    type: 'module',
    main: config.useTypeScript ? 'dist/index.js' : 'src/index.js',
    bin: {
      [config.name]: config.useTypeScript ? './dist/index.js' : './src/index.js',
    },
    scripts: {
      build: config.useTypeScript ? 'tsc' : 'echo "No build needed for JavaScript"',
      start: config.useTypeScript ? 'node dist/index.js' : 'node src/index.js',
      dev: config.useTypeScript ? 'tsc --watch' : 'node --watch src/index.js',
      inspect: 'npx @anthropic-ai/mcp-inspector',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      zod: '^3.23.0',
    },
    devDependencies: config.useTypeScript
      ? {
          '@types/node': '^20.0.0',
          typescript: '^5.3.0',
        }
      : {},
    keywords: ['mcp', 'model-context-protocol', 'ai', 'claude', 'tools'],
    license: 'MIT',
  };
}

/**
 * Generate main server code
 */
function generateServerCode(
  config: { name: string; description?: string; tools?: string[] },
  ext: string
): string {
  const isTS = ext === 'ts';
  const tools = config.tools || ['echo'];

  let code = `#!/usr/bin/env node
/**
 * ${config.name}
 * ${config.description || 'A custom MCP server'}
 *
 * This server provides tools and resources for AI assistants
 * via the Model Context Protocol (MCP).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
`;

  if (isTS) {
    code += `import type { Tool, Resource } from '@modelcontextprotocol/sdk/types.js';\n`;
  }

  code += `
// ============================================================================
// Server Setup
// ============================================================================

const server = new Server(
  {
    name: '${config.name}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================================================
// Tools
// ============================================================================

`;

  // Generate tool definitions
  const toolDefs: string[] = [];

  if (tools.includes('echo')) {
    toolDefs.push(`  {
    name: 'echo',
    description: 'Echoes back the input message',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to echo back',
        },
      },
      required: ['message'],
    },
  }`);
  }

  if (tools.includes('fetch')) {
    toolDefs.push(`  {
    name: 'fetch_url',
    description: 'Fetches content from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch',
        },
      },
      required: ['url'],
    },
  }`);
  }

  if (tools.includes('read_file')) {
    toolDefs.push(`  {
    name: 'read_file',
    description: 'Reads content from a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read',
        },
      },
      required: ['path'],
    },
  }`);
  }

  if (tools.includes('search')) {
    toolDefs.push(`  {
    name: 'search',
    description: 'Searches for content',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
        },
      },
      required: ['query'],
    },
  }`);
  }

  code += `const tools${isTS ? ': Tool[]' : ''} = [
${toolDefs.join(',\n')}
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
`;

  // Generate tool handlers
  if (tools.includes('echo')) {
    code += `    case 'echo': {
      const message = ${isTS ? '(args as { message: string }).message' : 'args.message'};
      return {
        content: [{ type: 'text', text: \`Echo: \${message}\` }],
      };
    }
`;
  }

  if (tools.includes('fetch')) {
    code += `    case 'fetch_url': {
      const url = ${isTS ? '(args as { url: string }).url' : 'args.url'};
      try {
        const response = await fetch(url);
        const text = await response.text();
        return {
          content: [{ type: 'text', text: text.slice(0, 10000) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: \`Error fetching URL: \${error}\` }],
          isError: true,
        };
      }
    }
`;
  }

  if (tools.includes('read_file')) {
    code += `    case 'read_file': {
      const filePath = ${isTS ? '(args as { path: string }).path' : 'args.path'};
      try {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          content: [{ type: 'text', text: content }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: \`Error reading file: \${error}\` }],
          isError: true,
        };
      }
    }
`;
  }

  if (tools.includes('search')) {
    code += `    case 'search': {
      const { query, limit = 10 } = ${isTS ? 'args as { query: string; limit?: number }' : 'args'};
      // Implement your search logic here
      return {
        content: [{ type: 'text', text: \`Search results for "\${query}" (limit: \${limit}): [Your results here]\` }],
      };
    }
`;
  }

  code += `    default:
      return {
        content: [{ type: 'text', text: \`Unknown tool: \${name}\` }],
        isError: true,
      };
  }
});

// ============================================================================
// Resources
// ============================================================================

const resources${isTS ? ': Resource[]' : ''} = [
  {
    uri: '${config.name}://status',
    name: 'Server Status',
    description: 'Current server status and information',
    mimeType: 'application/json',
  },
];

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources,
}));

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case '${config.name}://status':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              status: 'running',
              version: '1.0.0',
              tools: tools.length,
              uptime: process.uptime(),
            }),
          },
        ],
      };
    default:
      throw new Error(\`Unknown resource: \${uri}\`);
  }
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;

  return code;
}

/**
 * Generate TypeScript config
 */
function generateTsConfig(): object {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };
}

/**
 * Generate README
 */
function generateReadme(config: { name: string; description?: string }): string {
  return `# ${config.name}

${config.description || 'A custom MCP server'}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (\`~/Library/Application Support/Claude/claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["${path.join(process.cwd(), config.name, 'dist', 'index.js')}"]
    }
  }
}
\`\`\`

### Testing with MCP Inspector

\`\`\`bash
npm run inspect
\`\`\`

## Available Tools

See the \`tools\` array in \`src/index.ts\` for all available tools.

## Available Resources

- \`${config.name}://status\` - Server status and information

## Development

\`\`\`bash
npm run dev  # Watch mode
npm start    # Run server
\`\`\`

## License

MIT
`;
}

/**
 * Generate Claude Desktop config
 */
function generateClaudeConfig(name: string, serverPath: string): object {
  return {
    mcpServers: {
      [name]: {
        command: 'node',
        args: [path.join(serverPath, 'dist', 'index.js')],
      },
    },
  };
}

/**
 * Add a tool to existing MCP server
 */
async function addToolToServer(name: string, description?: string): Promise<void> {
  // Find the server file
  const possiblePaths = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
  let serverFile: string | null = null;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serverFile = p;
      break;
    }
  }

  if (!serverFile) {
    console.error(chalk.red('No MCP server file found. Run from the server directory.'));
    process.exit(1);
  }

  const desc = description || `${name} tool`;
  const isTS = serverFile.endsWith('.ts');

  // Generate tool snippet
  const toolSnippet = `
  // Tool: ${name}
  {
    name: '${name}',
    description: '${desc}',
    inputSchema: {
      type: 'object',
      properties: {
        // Add your parameters here
        input: {
          type: 'string',
          description: 'Input parameter',
        },
      },
      required: ['input'],
    },
  },`;

  const handlerSnippet = `    case '${name}': {
      const { input } = ${isTS ? 'args as { input: string }' : 'args'};
      // Implement your tool logic here
      return {
        content: [{ type: 'text', text: \`Result for ${name}: \${input}\` }],
      };
    }
`;

  console.log(chalk.bold.blue('\n Add this tool definition to the tools array:\n'));
  console.log(chalk.white(toolSnippet));
  console.log(chalk.bold.blue('\n Add this handler case to the switch statement:\n'));
  console.log(chalk.white(handlerSnippet));
  console.log();
}

/**
 * Add a resource to existing MCP server
 */
async function addResourceToServer(
  uri: string,
  options: { name?: string; description?: string }
): Promise<void> {
  const resourceSnippet = `
  // Resource: ${options.name || uri}
  {
    uri: '${uri}',
    name: '${options.name || uri}',
    description: '${options.description || 'Custom resource'}',
    mimeType: 'application/json',
  },`;

  const handlerSnippet = `    case '${uri}':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              // Your resource data here
            }),
          },
        ],
      };
`;

  console.log(chalk.bold.blue('\n Add this resource definition to the resources array:\n'));
  console.log(chalk.white(resourceSnippet));
  console.log(chalk.bold.blue('\n Add this handler case to the ReadResourceRequestSchema handler:\n'));
  console.log(chalk.white(handlerSnippet));
  console.log();
}

/**
 * Validate MCP server structure
 */
async function validateMCPServer(dir: string): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check package.json exists
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    errors.push('Missing package.json');
  } else {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

      // Check required dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!deps['@modelcontextprotocol/sdk']) {
        errors.push('Missing @modelcontextprotocol/sdk dependency');
      }

      // Check scripts
      if (!pkg.scripts?.build && pkg.devDependencies?.typescript) {
        warnings.push('TypeScript project without build script');
      }

      if (!pkg.scripts?.start) {
        warnings.push('No start script defined');
      }

      // Check bin
      if (!pkg.bin) {
        warnings.push('No bin entry - server may not be easily executable');
      }
    } catch {
      errors.push('Invalid package.json');
    }
  }

  // Check source files
  const srcFiles = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js'];
  const hasSource = srcFiles.some(f => fs.existsSync(path.join(dir, f)));
  if (!hasSource) {
    errors.push('No source file found (src/index.ts or src/index.js)');
  }

  // Check TypeScript config
  if (fs.existsSync(path.join(dir, 'src/index.ts')) && !fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    errors.push('TypeScript source without tsconfig.json');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test MCP server by spawning it and checking responses
 */
async function testMCPServer(dir: string): Promise<{ passed: boolean; results: Array<{ test: string; passed: boolean; error?: string }> }> {
  const results: Array<{ test: string; passed: boolean; error?: string }> = [];

  // Validate structure first
  const validation = await validateMCPServer(dir);
  results.push({
    test: 'Structure validation',
    passed: validation.valid,
    error: validation.errors.join(', ') || undefined,
  });

  if (!validation.valid) {
    return { passed: false, results };
  }

  // Check if built (for TypeScript projects)
  const pkgPath = path.join(dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (pkg.devDependencies?.typescript) {
    const distExists = fs.existsSync(path.join(dir, 'dist'));
    results.push({
      test: 'TypeScript compiled',
      passed: distExists,
      error: distExists ? undefined : 'dist/ directory not found - run npm run build',
    });

    if (!distExists) {
      return { passed: false, results };
    }
  }

  // Check main entry point exists
  const mainPath = path.join(dir, pkg.main || 'dist/index.js');
  const mainExists = fs.existsSync(mainPath);
  results.push({
    test: 'Main entry point exists',
    passed: mainExists,
    error: mainExists ? undefined : `${mainPath} not found`,
  });

  // Check file is valid JavaScript
  if (mainExists) {
    try {
      const content = fs.readFileSync(mainPath, 'utf-8');
      // Basic syntax check - look for Server import
      const hasServerImport = content.includes('@modelcontextprotocol/sdk');
      results.push({
        test: 'Uses MCP SDK',
        passed: hasServerImport,
        error: hasServerImport ? undefined : 'Server code does not import MCP SDK',
      });

      // Check for stdio transport
      const hasStdioTransport = content.includes('StdioServerTransport');
      results.push({
        test: 'Uses stdio transport',
        passed: hasStdioTransport,
        error: hasStdioTransport ? undefined : 'Server does not use StdioServerTransport',
      });
    } catch (error) {
      results.push({
        test: 'File readable',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const passed = results.every(r => r.passed);
  return { passed, results };
}
