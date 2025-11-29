#!/usr/bin/env node

/**
 * create-rana-app
 *
 * Create a new RANA AI application in seconds
 *
 * @example
 * ```bash
 * npx create-rana-app my-ai-app
 * npx create-rana-app my-ai-app --template chatbot
 * npx create-rana-app my-ai-app --template rag --provider anthropic
 * ```
 */

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import validatePackageName from 'validate-npm-package-name';

// Templates
type Template = 'default' | 'chatbot' | 'rag' | 'agent' | 'api' | 'minimal';
type Provider = 'openai' | 'anthropic' | 'google' | 'auto';
type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

interface CreateOptions {
  template: Template;
  provider: Provider;
  typescript: boolean;
  git: boolean;
  install: boolean;
  packageManager: PackageManager;
}

const TEMPLATES: Record<Template, { name: string; description: string }> = {
  default: { name: 'Default', description: 'Full-featured starter with chat, RAG, and agents' },
  chatbot: { name: 'Chatbot', description: 'Conversational AI chatbot with streaming' },
  rag: { name: 'RAG', description: 'Document Q&A with retrieval-augmented generation' },
  agent: { name: 'Agent', description: 'AI agent with tools and multi-step reasoning' },
  api: { name: 'API', description: 'REST API with AI endpoints' },
  minimal: { name: 'Minimal', description: 'Bare minimum to get started' },
};

const PROVIDERS: Record<Provider, { name: string; env: string }> = {
  openai: { name: 'OpenAI (GPT-4)', env: 'OPENAI_API_KEY' },
  anthropic: { name: 'Anthropic (Claude)', env: 'ANTHROPIC_API_KEY' },
  google: { name: 'Google (Gemini)', env: 'GOOGLE_API_KEY' },
  auto: { name: 'Auto-detect', env: '' },
};

// Banner
const banner = `
${chalk.bold.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.bold.cyan('║')}                                                             ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}   ${chalk.bold.white('create-rana-app')}                                        ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}   ${chalk.gray('Create production-ready AI apps in seconds')}              ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}                                                             ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

async function main() {
  console.log(banner);

  const program = new Command()
    .name('create-rana-app')
    .description('Create a new RANA AI application')
    .version('2.0.0')
    .argument('[project-name]', 'Name of your project')
    .option('-t, --template <template>', 'Template to use', 'default')
    .option('-p, --provider <provider>', 'Default LLM provider', 'auto')
    .option('--no-typescript', 'Use JavaScript instead of TypeScript')
    .option('--no-git', 'Skip git initialization')
    .option('--no-install', 'Skip dependency installation')
    .option('--npm', 'Use npm')
    .option('--pnpm', 'Use pnpm')
    .option('--yarn', 'Use yarn')
    .option('--bun', 'Use bun')
    .parse(process.argv);

  const opts = program.opts();
  let projectName = program.args[0];

  // Interactive mode if no project name provided
  if (!projectName) {
    const response = await prompts([
      {
        type: 'text',
        name: 'projectName',
        message: 'What is your project named?',
        initial: 'my-ai-app',
        validate: (value) => {
          const validation = validatePackageName(value);
          if (!validation.validForNewPackages) {
            return validation.errors?.[0] || 'Invalid package name';
          }
          return true;
        },
      },
      {
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: Object.entries(TEMPLATES).map(([value, { name, description }]) => ({
          title: `${name} ${chalk.gray(`- ${description}`)}`,
          value,
        })),
      },
      {
        type: 'select',
        name: 'provider',
        message: 'Which LLM provider do you want to use?',
        choices: Object.entries(PROVIDERS).map(([value, { name }]) => ({
          title: name,
          value,
        })),
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript?',
        initial: true,
      },
    ]);

    if (!response.projectName) {
      console.log(chalk.yellow('\nProject creation cancelled.'));
      process.exit(0);
    }

    projectName = response.projectName;
    opts.template = response.template;
    opts.provider = response.provider;
    opts.typescript = response.typescript;
  }

  // Validate project name
  const validation = validatePackageName(projectName);
  if (!validation.validForNewPackages) {
    console.log(chalk.red(`\nInvalid project name: ${validation.errors?.[0]}`));
    process.exit(1);
  }

  // Determine package manager
  let packageManager: PackageManager = 'npm';
  if (opts.pnpm) packageManager = 'pnpm';
  else if (opts.yarn) packageManager = 'yarn';
  else if (opts.bun) packageManager = 'bun';
  else {
    // Auto-detect from user agent or lockfile
    const userAgent = process.env.npm_config_user_agent || '';
    if (userAgent.includes('pnpm')) packageManager = 'pnpm';
    else if (userAgent.includes('yarn')) packageManager = 'yarn';
    else if (userAgent.includes('bun')) packageManager = 'bun';
  }

  const options: CreateOptions = {
    template: opts.template as Template,
    provider: opts.provider as Provider,
    typescript: opts.typescript !== false,
    git: opts.git !== false,
    install: opts.install !== false,
    packageManager,
  };

  await createApp(projectName, options);
}

async function createApp(projectName: string, options: CreateOptions) {
  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`\nDirectory ${projectName} already exists.`));
    process.exit(1);
  }

  const spinner = ora('Creating your RANA app...').start();

  try {
    // Create directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Generate files based on template
    await generateTemplate(projectPath, projectName, options);

    spinner.succeed('Project created!');

    // Initialize git
    if (options.git) {
      spinner.start('Initializing git...');
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
        execSync('git commit -m "Initial commit from create-rana-app"', { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('Git initialized!');
      } catch {
        spinner.warn('Git initialization failed (git may not be installed)');
      }
    }

    // Install dependencies
    if (options.install) {
      spinner.start(`Installing dependencies with ${options.packageManager}...`);
      try {
        const installCmd = options.packageManager === 'yarn' ? 'yarn' : `${options.packageManager} install`;
        execSync(installCmd, { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('Dependencies installed!');
      } catch {
        spinner.warn('Dependency installation failed. Run install manually.');
      }
    }

    // Success message
    console.log('\n' + chalk.green.bold('Success!') + ` Created ${projectName} at ${projectPath}\n`);

    console.log('Inside that directory, you can run:\n');

    const runCmd = options.packageManager === 'npm' ? 'npm run' : options.packageManager;

    console.log(chalk.cyan(`  ${runCmd} dev`));
    console.log('    Start the development server\n');

    console.log(chalk.cyan(`  ${runCmd} test`));
    console.log('    Run AI tests\n');

    console.log(chalk.cyan(`  ${runCmd} build`));
    console.log('    Build for production\n');

    console.log('We suggest that you begin by typing:\n');
    console.log(chalk.cyan(`  cd ${projectName}`));

    if (options.provider !== 'auto') {
      console.log(chalk.cyan(`  rana config:set ${options.provider} YOUR_API_KEY`));
    } else {
      console.log(chalk.cyan('  rana config:set openai YOUR_API_KEY'));
    }

    console.log(chalk.cyan(`  ${runCmd} dev`));

    console.log('\n' + chalk.gray('Happy hacking!') + '\n');

  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(error);
    process.exit(1);
  }
}

async function generateTemplate(
  projectPath: string,
  projectName: string,
  options: CreateOptions
) {
  const ext = options.typescript ? 'ts' : 'js';
  const provider = options.provider === 'auto' ? 'anthropic' : options.provider;

  // Package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: options.typescript ? 'tsc' : 'echo "No build needed"',
      start: 'node dist/index.js',
      test: 'rana test',
      lint: options.typescript ? 'tsc --noEmit' : 'echo "No lint configured"',
    },
    dependencies: {
      '@rana/core': '^2.0.0',
      ...(options.template === 'rag' && { '@rana/rag': '^2.0.0' }),
      ...(options.template === 'api' && { express: '^4.18.0' }),
    },
    devDependencies: {
      '@rana/testing': '^2.0.0',
      tsx: '^4.7.0',
      ...(options.typescript && {
        typescript: '^5.5.0',
        '@types/node': '^22.0.0',
        ...(options.template === 'api' && { '@types/express': '^4.17.0' }),
      }),
    },
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // TypeScript config
  if (options.typescript) {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2020'],
        declaration: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: 'dist',
        rootDir: 'src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  // RANA config
  const ranaConfig = `# RANA Configuration
# https://rana.dev/docs/config

defaults:
  provider: ${provider}
  optimize: balanced

cache:
  enabled: true
  ttl: 3600

cost_tracking:
  enabled: true
  budget:
    limit: 10
    period: daily
    action: warn
`;

  fs.writeFileSync(path.join(projectPath, '.rana.yml'), ranaConfig);

  // Environment file
  const envFile = `# RANA Environment Variables
# Get your API keys from:
# - OpenAI: https://platform.openai.com/api-keys
# - Anthropic: https://console.anthropic.com/
# - Google: https://aistudio.google.com/app/apikey

${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'}=your_api_key_here
`;

  fs.writeFileSync(path.join(projectPath, '.env.example'), envFile);

  // Gitignore
  const gitignore = `# Dependencies
node_modules/

# Build
dist/

# Environment
.env
.env.local
.env.*.local

# RANA
.rana/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

  // Create src directory
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });

  // Generate template-specific files
  switch (options.template) {
    case 'chatbot':
      await generateChatbotTemplate(projectPath, ext, provider);
      break;
    case 'rag':
      await generateRagTemplate(projectPath, ext, provider);
      break;
    case 'agent':
      await generateAgentTemplate(projectPath, ext, provider);
      break;
    case 'api':
      await generateApiTemplate(projectPath, ext, provider);
      break;
    case 'minimal':
      await generateMinimalTemplate(projectPath, ext, provider);
      break;
    case 'default':
    default:
      await generateDefaultTemplate(projectPath, ext, provider);
      break;
  }

  // README
  const readme = `# ${projectName}

A RANA AI application.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your API key:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API key
   \`\`\`

   Or use the RANA CLI:
   \`\`\`bash
   rana config:set ${provider} YOUR_API_KEY
   \`\`\`

3. Start development:
   \`\`\`bash
   npm run dev
   \`\`\`

## Commands

- \`npm run dev\` - Start development server
- \`npm run test\` - Run AI tests
- \`npm run build\` - Build for production

## Learn More

- [RANA Documentation](https://rana.dev/docs)
- [API Reference](https://rana.dev/docs/api)
- [Examples](https://rana.dev/examples)

## License

MIT
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}

async function generateDefaultTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * RANA AI Application
 * Full-featured starter with chat, RAG, and agents
 */

import { createRana } from '@rana/core';

// Initialize RANA
const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
  defaults: {
    provider: '${provider}',
    optimize: 'balanced',
  },
  cost_tracking: {
    enabled: true,
    budget: {
      limit: 10,
      period: 'daily',
      action: 'warn',
    },
  },
});

async function main() {
  console.log('\\n🚀 RANA AI Application\\n');

  // Simple chat
  console.log('💬 Chat Example:');
  const response = await rana.chat('Hello! What can you help me with today?');
  console.log('Assistant:', response.content);
  console.log('Cost: $' + response.cost.total_cost.toFixed(6));

  // Cost tracking
  console.log('\\n📊 Cost Stats:');
  const stats = rana.cost.stats();
  console.log('Total Spent: $' + stats.total_spent.toFixed(6));
  console.log('Total Saved: $' + stats.total_saved.toFixed(6));
  console.log('Savings: ' + stats.savings_percentage.toFixed(1) + '%');
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);

  // Test file
  const testFile = `/**
 * AI Tests
 */

import { describe, aiTest } from '@rana/testing';

describe('AI Application', () => {
  aiTest('should respond helpfully', async ({ expect }) => {
    // Your test here
    expect(true).toBe(true);
  });
});
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.test.${ext}`), testFile);
}

async function generateChatbotTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * RANA Chatbot
 * Conversational AI with streaming
 */

import { createRana } from '@rana/core';
import * as readline from 'readline';

const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
});

const history${ext === 'ts' ? ': Array<{ role: "user" | "assistant"; content: string }>' : ''} = [];

async function chat(message${ext === 'ts' ? ': string' : ''}) {
  history.push({ role: 'user', content: message });

  process.stdout.write('\\nAssistant: ');

  let fullResponse = '';
  for await (const chunk of rana.stream({
    messages: [
      { role: 'system', content: 'You are a helpful, friendly assistant.' },
      ...history,
    ],
  })) {
    process.stdout.write(chunk.delta);
    fullResponse += chunk.delta;
  }

  console.log('\\n');
  history.push({ role: 'assistant', content: fullResponse });
}

async function main() {
  console.log('\\n🤖 RANA Chatbot');
  console.log('Type your message and press Enter. Type "exit" to quit.\\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('\\nGoodbye! 👋\\n');
        rl.close();
        return;
      }

      await chat(input);
      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);
}

async function generateRagTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * RANA RAG Application
 * Document Q&A with retrieval-augmented generation
 */

import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
});

// Sample documents (in production, load from files/database)
const documents = [
  { content: 'RANA supports 9 different LLM providers including OpenAI, Anthropic, and Google.', source: 'docs' },
  { content: 'RANA can reduce AI costs by up to 70% through smart caching and model selection.', source: 'docs' },
  { content: 'The @rana/testing package provides AI-native testing with semantic matching.', source: 'docs' },
];

async function askQuestion(question${ext === 'ts' ? ': string' : ''}) {
  console.log('\\n🔍 Question:', question);

  // Simple retrieval (in production, use vector similarity)
  const relevant = documents.filter(d =>
    d.content.toLowerCase().includes(question.toLowerCase().split(' ')[0])
  );

  const context = relevant.length > 0
    ? relevant.map(d => d.content).join('\\n')
    : documents.map(d => d.content).join('\\n');

  const response = await rana.chat({
    messages: [
      {
        role: 'system',
        content: \`Answer questions based on the following context. If you don't know, say so.

Context:
\${context}\`
      },
      { role: 'user', content: question },
    ],
  });

  console.log('\\n📝 Answer:', response.content);
  console.log('\\n📚 Sources:', relevant.map(d => d.source).join(', ') || 'general knowledge');
}

async function main() {
  console.log('\\n📚 RANA RAG Application\\n');

  await askQuestion('How many providers does RANA support?');
  await askQuestion('How can RANA reduce costs?');
  await askQuestion('What is @rana/testing?');
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);
}

async function generateAgentTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * RANA AI Agent
 * Autonomous agent with tools and multi-step reasoning
 */

import { createRana, LLMAgent, calculatorTool, dateTimeTool } from '@rana/core';

const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
});

// Create an agent with tools
const agent = new LLMAgent({
  name: 'Assistant',
  model: '${provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-pro'}',
  systemPrompt: \`You are a helpful assistant with access to tools.
Use the calculator for math and dateTime for date/time questions.
Always explain your reasoning.\`,
  tools: [calculatorTool, dateTimeTool],
});

async function main() {
  console.log('\\n🤖 RANA AI Agent\\n');

  // Agent will use tools automatically
  const tasks = [
    'What is 15% of 847?',
    'What day of the week was January 1, 2024?',
    'Calculate the compound interest on $1000 at 5% for 3 years',
  ];

  for (const task of tasks) {
    console.log('📋 Task:', task);

    const result = await agent.run(task);

    console.log('🤖 Result:', result.content);
    console.log('🔧 Tools used:', result.toolsUsed?.join(', ') || 'none');
    console.log('');
  }
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);
}

async function generateApiTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * RANA API Server
 * REST API with AI endpoints
 */

import express from 'express';
import { createRana } from '@rana/core';

const app = express();
app.use(express.json());

const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
  cost_tracking: {
    enabled: true,
    budget: {
      limit: 10,
      period: 'daily',
      action: 'block',
    },
  },
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await rana.chat(message);

    res.json({
      content: response.content,
      usage: response.usage,
      cost: response.cost,
    });
  } catch (error${ext === 'ts' ? ': any' : ''}) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of rana.stream(message)) {
      res.write(\`data: \${JSON.stringify({ delta: chunk.delta })}\\n\\n\`);
    }

    res.write('data: [DONE]\\n\\n');
    res.end();
  } catch (error${ext === 'ts' ? ': any' : ''}) {
    console.error('Stream error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Cost stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = rana.cost.stats();
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`\\n🚀 RANA API Server running on http://localhost:\${PORT}\`);
  console.log('\\nEndpoints:');
  console.log('  POST /api/chat         - Chat completion');
  console.log('  POST /api/chat/stream  - Streaming chat');
  console.log('  GET  /api/stats        - Cost statistics');
  console.log('  GET  /health           - Health check\\n');
});
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);
}

async function generateMinimalTemplate(projectPath: string, ext: string, provider: string) {
  const mainFile = `/**
 * Minimal RANA Application
 */

import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    ${provider}: process.env.${PROVIDERS[provider as keyof typeof PROVIDERS]?.env || 'OPENAI_API_KEY'},
  },
});

async function main() {
  const response = await rana.chat('Hello, RANA!');
  console.log(response.content);
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(projectPath, 'src', `index.${ext}`), mainFile);
}

// Run
main().catch(console.error);
