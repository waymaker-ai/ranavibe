/**
 * Playground / REPL Command
 * Interactive environment for testing RANA features
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Types
interface PlaygroundSession {
  id: string;
  startedAt: string;
  history: HistoryEntry[];
  context: Record<string, unknown>;
}

interface HistoryEntry {
  timestamp: string;
  type: 'command' | 'result' | 'error';
  content: string;
}

type PlaygroundCommand = {
  name: string;
  aliases: string[];
  description: string;
  usage?: string;
  handler: (args: string[], session: PlaygroundSession) => Promise<string | void>;
};

// Constants
const PLAYGROUND_DIR = path.join(os.homedir(), '.rana', 'playground');
const HISTORY_FILE = path.join(PLAYGROUND_DIR, 'history.json');

// Ensure directories exist
function ensurePlaygroundDir(): void {
  if (!fs.existsSync(PLAYGROUND_DIR)) {
    fs.mkdirSync(PLAYGROUND_DIR, { recursive: true });
  }
}

// Generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Sample code templates for quick testing
const QUICK_TEMPLATES: Record<string, string> = {
  agent: `import { createAgent, createRana } from '@rana/agents';

const rana = createRana({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY }
});

const agent = createAgent({
  rana,
  tools: [],
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] },
}, {
  id: 'test_agent',
  name: 'Test Agent',
  description: 'A test agent for experimentation',
});

const result = await agent.handle({
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] },
  message: 'Hello, can you help me?',
});

console.log(result);`,

  tool: `import { createTool } from '@rana/agents';

const myTool = createTool({
  name: 'greet',
  description: 'Greets a person by name',
  parameters: {
    name: {
      type: 'string',
      description: 'The name to greet',
      required: true,
    },
  },
  handler: async ({ name }) => {
    return \`Hello, \${name}! Welcome to RANA.\`;
  },
});

// Test the tool
const result = await myTool.handler({ name: 'Developer' });
console.log(result);`,

  orchestrator: `import { createOrchestrator, createPipeline } from '@rana/agents';

const orchestrator = createOrchestrator();

const { execute } = createPipeline([
  {
    id: 'researcher',
    name: 'Research Agent',
    capabilities: ['research', 'summarize'],
  },
  {
    id: 'writer',
    name: 'Writer Agent',
    capabilities: ['write', 'edit'],
  },
]);

const result = await execute({
  taskId: 'content-task',
  description: 'Research and write about AI agents',
  input: { topic: 'AI agents' },
});

console.log(result);`,

  mcp: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register a tool
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'hello',
      description: 'Says hello',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  ],
}));

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);`,

  security: `import {
  InjectionDetector,
  PIIDetector,
  wrapToolWithSafety
} from '@rana/agents';

// Detect prompt injection
const injectionDetector = new InjectionDetector();
const result = injectionDetector.detect('Ignore previous instructions and...');
console.log('Injection detected:', result.detected);
console.log('Matches:', result.matches);

// Detect PII
const piiDetector = new PIIDetector();
const piiResult = piiDetector.detect('Contact john@example.com or call 555-1234');
console.log('PII found:', piiResult.matches);

// Wrap tool with safety
const safeTool = wrapToolWithSafety(myTool, {
  validateInput: true,
  sanitizeOutput: true,
  rateLimit: { maxRequests: 10, windowMs: 60000 },
});`,

  generate: `import { generate, validateCode } from '@rana/generate';

const result = await generate({
  prompt: 'Create a React button component with loading state',
  language: 'typescript',
  framework: 'react',
  options: {
    includeTests: true,
    validateOutput: true,
  },
});

console.log('Generated code:');
console.log(result.code);

// Validate the output
const validation = await validateCode(result.code, {
  checkSecurity: true,
  checkAccessibility: true,
});

console.log('Validation:', validation);`,
};

// Playground commands
const commands: PlaygroundCommand[] = [
  {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show available commands',
    handler: async () => {
      let output = chalk.blue.bold('\n📚 Playground Commands\n\n');

      commands.forEach(cmd => {
        const aliases = cmd.aliases.length > 0 ? chalk.gray(` (${cmd.aliases.join(', ')})`) : '';
        output += `  ${chalk.green(cmd.name)}${aliases}\n`;
        output += chalk.gray(`    ${cmd.description}\n`);
        if (cmd.usage) {
          output += chalk.gray(`    Usage: ${cmd.usage}\n`);
        }
        output += '\n';
      });

      return output;
    },
  },
  {
    name: 'template',
    aliases: ['t', 'templates'],
    description: 'Show or use a quick start template',
    usage: 'template [name]',
    handler: async (args) => {
      if (args.length === 0) {
        let output = chalk.blue.bold('\n📄 Available Templates\n\n');
        Object.keys(QUICK_TEMPLATES).forEach(name => {
          output += `  ${chalk.green(name)}\n`;
        });
        output += chalk.gray('\nUse `template <name>` to see the code.\n');
        return output;
      }

      const name = args[0].toLowerCase();
      if (!QUICK_TEMPLATES[name]) {
        return chalk.red(`Template not found: ${name}\nAvailable: ${Object.keys(QUICK_TEMPLATES).join(', ')}`);
      }

      return chalk.blue.bold(`\n📄 Template: ${name}\n\n`) + chalk.gray('```typescript\n') + QUICK_TEMPLATES[name] + chalk.gray('\n```\n');
    },
  },
  {
    name: 'save',
    aliases: ['s'],
    description: 'Save code snippet to file',
    usage: 'save <filename> <content>',
    handler: async (args) => {
      if (args.length < 2) {
        return chalk.red('Usage: save <filename> <content>');
      }

      const filename = args[0];
      const content = args.slice(1).join(' ');

      const filepath = path.join(PLAYGROUND_DIR, filename);
      fs.writeFileSync(filepath, content);

      return chalk.green(`Saved to: ${filepath}`);
    },
  },
  {
    name: 'run',
    aliases: ['r', 'exec'],
    description: 'Run a template or saved file',
    usage: 'run <template-or-file>',
    handler: async (args) => {
      if (args.length === 0) {
        return chalk.red('Usage: run <template-name> or run <filepath>');
      }

      const target = args[0];

      // Check if it's a template
      if (QUICK_TEMPLATES[target]) {
        return chalk.yellow('Note: Running templates requires a configured environment.\n') +
               chalk.gray('Copy the template code and run it in your project:\n\n') +
               chalk.green(`rana playground template ${target}`);
      }

      // Check if it's a file
      const filepath = path.isAbsolute(target) ? target : path.join(PLAYGROUND_DIR, target);
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        return chalk.blue(`Content of ${target}:\n\n`) + content;
      }

      return chalk.red(`Not found: ${target}`);
    },
  },
  {
    name: 'list',
    aliases: ['ls', 'dir'],
    description: 'List saved playground files',
    handler: async () => {
      ensurePlaygroundDir();
      const files = fs.readdirSync(PLAYGROUND_DIR).filter(f => !f.startsWith('.'));

      if (files.length === 0) {
        return chalk.gray('No saved files in playground.\nUse `save <filename> <content>` to save code.');
      }

      let output = chalk.blue.bold('\n📁 Playground Files\n\n');
      files.forEach(file => {
        const stats = fs.statSync(path.join(PLAYGROUND_DIR, file));
        const size = (stats.size / 1024).toFixed(1) + ' KB';
        output += `  ${chalk.green(file)} ${chalk.gray(`(${size})`)}\n`;
      });

      return output;
    },
  },
  {
    name: 'cat',
    aliases: ['show', 'view'],
    description: 'Show contents of a saved file',
    usage: 'cat <filename>',
    handler: async (args) => {
      if (args.length === 0) {
        return chalk.red('Usage: cat <filename>');
      }

      const filepath = path.join(PLAYGROUND_DIR, args[0]);
      if (!fs.existsSync(filepath)) {
        return chalk.red(`File not found: ${args[0]}`);
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      return chalk.blue.bold(`\n📄 ${args[0]}\n\n`) + content;
    },
  },
  {
    name: 'rm',
    aliases: ['delete', 'del'],
    description: 'Delete a saved file',
    usage: 'rm <filename>',
    handler: async (args) => {
      if (args.length === 0) {
        return chalk.red('Usage: rm <filename>');
      }

      const filepath = path.join(PLAYGROUND_DIR, args[0]);
      if (!fs.existsSync(filepath)) {
        return chalk.red(`File not found: ${args[0]}`);
      }

      fs.unlinkSync(filepath);
      return chalk.green(`Deleted: ${args[0]}`);
    },
  },
  {
    name: 'quickstart',
    aliases: ['qs', 'start'],
    description: 'Show quickstart guide for RANA',
    handler: async () => {
      return `
${chalk.blue.bold('🚀 RANA Quickstart Guide')}

${chalk.white.bold('1. Initialize a project:')}
${chalk.green('   rana init')}

${chalk.white.bold('2. Generate code from natural language:')}
${chalk.green('   rana generate "Create a login form with email validation"')}

${chalk.white.bold('3. Create an MCP server:')}
${chalk.green('   rana mcp create my-server')}

${chalk.white.bold('4. Save and reuse prompts:')}
${chalk.green('   rana prompts save')}
${chalk.green('   rana prompts list')}
${chalk.green('   rana prompts use "My Prompt"')}

${chalk.white.bold('5. Analyze prompt quality:')}
${chalk.green('   rana prompts analyze')}

${chalk.white.bold('6. View templates:')}
${chalk.green('   rana templates')}
${chalk.green('   rana mcp templates')}

${chalk.gray('For more help: rana --help')}
`;
    },
  },
  {
    name: 'docs',
    aliases: ['documentation', 'doc'],
    description: 'Show links to documentation',
    handler: async () => {
      return `
${chalk.blue.bold('📖 RANA Documentation')}

${chalk.white('Core Concepts:')}
  ${chalk.cyan('• Agents')}        - AI agents with tools and guardrails
  ${chalk.cyan('• VibeSpecs')}     - Declarative agent configuration
  ${chalk.cyan('• Orchestration')} - Multi-agent coordination patterns
  ${chalk.cyan('• Security')}      - Injection detection, PII filtering

${chalk.white('Packages:')}
  ${chalk.green('@rana/agents')}   - Agent Development Kit
  ${chalk.green('@rana/core')}     - Core utilities and configs
  ${chalk.green('@rana/generate')} - Natural language code generation
  ${chalk.green('@rana/cli')}      - Command line interface

${chalk.white('Quick Links:')}
  ${chalk.gray('GitHub:')} https://github.com/waymaker-ai/ranavibe
  ${chalk.gray('Website:')} https://rana.dev

${chalk.gray('Use `template <name>` to see code examples.')}
`;
    },
  },
  {
    name: 'clear',
    aliases: ['cls', 'c'],
    description: 'Clear the screen',
    handler: async () => {
      console.clear();
      return '';
    },
  },
  {
    name: 'exit',
    aliases: ['quit', 'q'],
    description: 'Exit the playground',
    handler: async () => {
      console.log(chalk.blue('\n👋 Thanks for using RANA Playground!\n'));
      process.exit(0);
    },
  },
];

// Find command by name or alias
function findCommand(input: string): PlaygroundCommand | undefined {
  const lower = input.toLowerCase();
  return commands.find(cmd =>
    cmd.name === lower || cmd.aliases.includes(lower)
  );
}

// Interactive playground loop
async function runInteractivePlayground(): Promise<void> {
  ensurePlaygroundDir();

  const session: PlaygroundSession = {
    id: generateSessionId(),
    startedAt: new Date().toISOString(),
    history: [],
    context: {},
  };

  console.clear();
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ${chalk.white.bold('🐸 RANA Playground')}                                        ║
║                                                               ║
║   ${chalk.gray('Interactive environment for testing RANA features')}          ║
║   ${chalk.gray('Type "help" for commands, "exit" to quit')}                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

  // Show quick tips
  console.log(chalk.gray('Quick tips:'));
  console.log(chalk.gray('  • Type "quickstart" for getting started guide'));
  console.log(chalk.gray('  • Type "template agent" to see an agent example'));
  console.log(chalk.gray('  • Type "docs" for documentation links\n'));

  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.green('rana>'),
        prefix: '',
      },
    ]);

    const trimmed = input.trim();
    if (!trimmed) continue;

    // Parse command and args
    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0];
    const args = parts.slice(1);

    // Add to history
    session.history.push({
      timestamp: new Date().toISOString(),
      type: 'command',
      content: trimmed,
    });

    // Find and execute command
    const cmd = findCommand(cmdName);

    if (!cmd) {
      console.log(chalk.red(`Unknown command: ${cmdName}`));
      console.log(chalk.gray('Type "help" for available commands.\n'));
      continue;
    }

    try {
      const result = await cmd.handler(args, session);
      if (result) {
        console.log(result);
        session.history.push({
          timestamp: new Date().toISOString(),
          type: 'result',
          content: result,
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`Error: ${errMsg}`));
      session.history.push({
        timestamp: new Date().toISOString(),
        type: 'error',
        content: errMsg,
      });
    }

    console.log();
  }
}

// Quick demo mode
async function runQuickDemo(): Promise<void> {
  console.log(chalk.blue.bold('\n🐸 RANA Quick Demo\n'));

  const spinner = ora('Setting up demo environment...').start();
  await new Promise(resolve => setTimeout(resolve, 500));
  spinner.succeed('Demo ready');

  console.log(chalk.white.bold('\n1. Creating an Agent\n'));
  console.log(chalk.gray(QUICK_TEMPLATES.agent.split('\n').slice(0, 10).join('\n')));
  console.log(chalk.gray('...\n'));

  console.log(chalk.white.bold('2. Defining a Tool\n'));
  console.log(chalk.gray(QUICK_TEMPLATES.tool.split('\n').slice(0, 12).join('\n')));
  console.log(chalk.gray('...\n'));

  console.log(chalk.white.bold('3. Multi-Agent Orchestration\n'));
  console.log(chalk.gray(QUICK_TEMPLATES.orchestrator.split('\n').slice(0, 12).join('\n')));
  console.log(chalk.gray('...\n'));

  console.log(chalk.green.bold('✅ Demo complete!\n'));
  console.log(chalk.gray('To explore more, run: rana playground\n'));
}

// Command Registration
export function registerPlaygroundCommands(program: Command): void {
  program
    .command('playground')
    .alias('play')
    .description('Interactive playground for testing RANA features')
    .option('-d, --demo', 'Run quick demo mode')
    .option('-t, --template <name>', 'Show a specific template')
    .action(async (options) => {
      if (options.demo) {
        await runQuickDemo();
        return;
      }

      if (options.template) {
        const template = QUICK_TEMPLATES[options.template.toLowerCase()];
        if (template) {
          console.log(chalk.blue.bold(`\n📄 Template: ${options.template}\n`));
          console.log(template);
          console.log();
        } else {
          console.error(chalk.red(`Template not found: ${options.template}`));
          console.log(chalk.gray(`Available: ${Object.keys(QUICK_TEMPLATES).join(', ')}\n`));
        }
        return;
      }

      await runInteractivePlayground();
    });

  // Quick access commands
  program
    .command('demo')
    .description('Run a quick demo of RANA features')
    .action(async () => {
      await runQuickDemo();
    });

  program
    .command('quickstart')
    .alias('qs')
    .description('Show quickstart guide')
    .action(async () => {
      const cmd = commands.find(c => c.name === 'quickstart');
      if (cmd) {
        const result = await cmd.handler([], {} as PlaygroundSession);
        console.log(result);
      }
    });
}
