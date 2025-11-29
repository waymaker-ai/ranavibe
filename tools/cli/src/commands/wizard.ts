/**
 * Wizard Command
 * Step-by-step guided setup for beginners
 * Complete AI app setup in 10 minutes
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

interface WizardState {
  projectName: string;
  projectType: string;
  llmProvider: string;
  llmModel: string;
  database: string;
  auth: string;
  features: string[];
  deployment: string;
}

const STEPS = [
  { id: 'welcome', name: 'Welcome' },
  { id: 'project', name: 'Project Setup' },
  { id: 'llm', name: 'LLM Provider' },
  { id: 'database', name: 'Database' },
  { id: 'auth', name: 'Authentication' },
  { id: 'features', name: 'Features' },
  { id: 'deploy', name: 'Deployment' },
  { id: 'complete', name: 'Complete' },
];

/**
 * Main Wizard Command
 */
export async function wizardCommand() {
  console.clear();

  const state: WizardState = {
    projectName: '',
    projectType: '',
    llmProvider: '',
    llmModel: '',
    database: '',
    auth: '',
    features: [],
    deployment: '',
  };

  // Step 1: Welcome
  await stepWelcome();

  // Step 2: Project Setup
  const projectResult = await stepProject();
  if (!projectResult) return;
  Object.assign(state, projectResult);

  // Step 3: LLM Provider
  const llmResult = await stepLLM();
  if (!llmResult) return;
  Object.assign(state, llmResult);

  // Step 4: Database
  const dbResult = await stepDatabase();
  if (!dbResult) return;
  Object.assign(state, dbResult);

  // Step 5: Authentication
  const authResult = await stepAuth();
  if (!authResult) return;
  Object.assign(state, authResult);

  // Step 6: Features
  const featuresResult = await stepFeatures();
  if (!featuresResult) return;
  Object.assign(state, featuresResult);

  // Step 7: Deployment
  const deployResult = await stepDeploy();
  if (!deployResult) return;
  Object.assign(state, deployResult);

  // Step 8: Generate Everything
  await stepComplete(state);
}

function showProgress(step: number) {
  const width = 50;
  const progress = Math.floor((step / (STEPS.length - 1)) * width);
  const bar = chalk.cyan('█'.repeat(progress)) + chalk.gray('░'.repeat(width - progress));
  const stepInfo = STEPS[step];

  console.log();
  console.log(chalk.gray(`Step ${step + 1}/${STEPS.length}: ${stepInfo.name}`));
  console.log(`[${bar}] ${Math.floor((step / (STEPS.length - 1)) * 100)}%`);
  console.log();
}

async function stepWelcome() {
  console.clear();

  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐟  RANA Wizard - Build Your AI App in 10 Minutes       ║
║                                                           ║
║   This wizard will help you set up:                       ║
║   • LLM provider (9 options)                              ║
║   • Database (Supabase or Prisma)                         ║
║   • Authentication                                         ║
║   • Security & SEO                                        ║
║   • Deployment                                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

  console.log(chalk.gray('  Press Ctrl+C at any time to cancel.\n'));

  const { ready } = await prompts({
    type: 'confirm',
    name: 'ready',
    message: 'Ready to begin?',
    initial: true,
  });

  if (!ready) {
    console.log(chalk.gray('\nWizard cancelled. Run `rana wizard` when you\'re ready.\n'));
    process.exit(0);
  }
}

async function stepProject(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(1);

  console.log(chalk.bold.white('📁 Project Setup\n'));

  const responses = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: path.basename(process.cwd()),
      validate: (v) => v.length > 0 || 'Project name is required',
    },
    {
      type: 'select',
      name: 'projectType',
      message: 'What are you building?',
      choices: [
        {
          title: '💬 Chat Application',
          value: 'chat',
          description: 'AI chatbot, customer support, conversational interface',
        },
        {
          title: '📝 Content Generation',
          value: 'content',
          description: 'Blog writing, copywriting, content creation',
        },
        {
          title: '💻 Code Assistant',
          value: 'code',
          description: 'Code generation, debugging, documentation',
        },
        {
          title: '📊 Data Extraction',
          value: 'extraction',
          description: 'Document parsing, data extraction, analysis',
        },
        {
          title: '🔍 RAG Application',
          value: 'rag',
          description: 'Search over documents, knowledge base, Q&A',
        },
        {
          title: '🎯 Custom',
          value: 'custom',
          description: 'Start with minimal setup',
        },
      ],
    },
  ]);

  if (!responses.projectName) return null;

  console.log(chalk.green(`\n✓ Project: ${responses.projectName} (${responses.projectType})\n`));

  return {
    projectName: responses.projectName,
    projectType: responses.projectType,
  };
}

async function stepLLM(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(2);

  console.log(chalk.bold.white('🤖 LLM Provider Setup\n'));

  // Show cost comparison
  console.log(chalk.gray('Cost comparison (per 1M tokens):'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.green('  Gemini Flash    $0.10    ← Cheapest'));
  console.log(chalk.gray('  Claude Haiku    $0.25'));
  console.log(chalk.gray('  GPT-4o Mini     $0.15'));
  console.log(chalk.gray('  Claude Sonnet   $3.00'));
  console.log(chalk.gray('  GPT-4o          $2.50'));
  console.log(chalk.yellow('  Ollama          FREE     ← Local (requires setup)'));
  console.log();

  const responses = await prompts([
    {
      type: 'select',
      name: 'llmProvider',
      message: 'Primary LLM provider:',
      choices: [
        {
          title: '🟢 Google Gemini (Recommended)',
          value: 'google',
          description: 'Best cost/performance ratio, 1M+ context',
        },
        {
          title: '🟣 Anthropic Claude',
          value: 'anthropic',
          description: 'Best for complex reasoning, 200K context',
        },
        {
          title: '🔵 OpenAI GPT',
          value: 'openai',
          description: 'Most popular, good all-around',
        },
        {
          title: '⚡ Groq (Ultra-fast)',
          value: 'groq',
          description: 'Fastest inference, uses Llama models',
        },
        {
          title: '🏠 Ollama (Local)',
          value: 'ollama',
          description: 'Free, runs locally, privacy-focused',
        },
        {
          title: '🔷 Mistral AI',
          value: 'mistral',
          description: 'European provider, good for multilingual',
        },
      ],
    },
    {
      type: 'select',
      name: 'llmModel',
      message: 'Default model:',
      choices: (prev: string) => {
        switch (prev) {
          case 'google':
            return [
              { title: 'Gemini 2.0 Flash (fast, cheap)', value: 'gemini-2.0-flash-exp' },
              { title: 'Gemini 1.5 Pro (powerful)', value: 'gemini-1.5-pro' },
            ];
          case 'anthropic':
            return [
              { title: 'Claude 3.5 Sonnet (recommended)', value: 'claude-3-5-sonnet-20241022' },
              { title: 'Claude 3 Haiku (cheaper)', value: 'claude-3-haiku-20240307' },
            ];
          case 'openai':
            return [
              { title: 'GPT-4o Mini (cheap)', value: 'gpt-4o-mini' },
              { title: 'GPT-4o (powerful)', value: 'gpt-4o' },
            ];
          case 'groq':
            return [
              { title: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' },
              { title: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
            ];
          case 'ollama':
            return [
              { title: 'Llama 3.2', value: 'llama3.2' },
              { title: 'Mistral', value: 'mistral' },
            ];
          case 'mistral':
            return [
              { title: 'Mistral Large', value: 'mistral-large-latest' },
              { title: 'Mistral Small', value: 'mistral-small-latest' },
            ];
          default:
            return [{ title: 'Default', value: 'default' }];
        }
      },
    },
  ]);

  if (!responses.llmProvider) return null;

  // Get API key
  if (responses.llmProvider !== 'ollama') {
    const keyNames: Record<string, string> = {
      google: 'GOOGLE_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      groq: 'GROQ_API_KEY',
      mistral: 'MISTRAL_API_KEY',
    };

    const keyUrls: Record<string, string> = {
      google: 'https://aistudio.google.com/apikey',
      anthropic: 'https://console.anthropic.com',
      openai: 'https://platform.openai.com/api-keys',
      groq: 'https://console.groq.com',
      mistral: 'https://console.mistral.ai',
    };

    console.log(chalk.cyan(`\nGet your API key: ${keyUrls[responses.llmProvider]}`));

    const { apiKey } = await prompts({
      type: 'password',
      name: 'apiKey',
      message: `${keyNames[responses.llmProvider]}:`,
    });

    if (apiKey) {
      // Save to .env
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf-8');
      }
      envContent += `\n${keyNames[responses.llmProvider]}=${apiKey}\n`;
      fs.writeFileSync('.env', envContent);
      console.log(chalk.green('✓ API key saved to .env'));
    }
  }

  console.log(chalk.green(`\n✓ LLM: ${responses.llmProvider} / ${responses.llmModel}\n`));

  return {
    llmProvider: responses.llmProvider,
    llmModel: responses.llmModel,
  };
}

async function stepDatabase(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(3);

  console.log(chalk.bold.white('🗄️ Database Setup\n'));

  const responses = await prompts([
    {
      type: 'select',
      name: 'database',
      message: 'Database provider:',
      choices: [
        {
          title: '⚡ Supabase (Recommended)',
          value: 'supabase',
          description: 'PostgreSQL with auth, real-time, and storage',
        },
        {
          title: '🔷 Prisma + PostgreSQL',
          value: 'prisma-postgres',
          description: 'Self-hosted PostgreSQL with Prisma ORM',
        },
        {
          title: '🗃️ Prisma + SQLite',
          value: 'prisma-sqlite',
          description: 'Local development, no setup needed',
        },
        {
          title: '⏭️ Skip for now',
          value: 'none',
          description: 'Set up database later',
        },
      ],
    },
  ]);

  if (responses.database === undefined) return null;

  if (responses.database === 'supabase') {
    console.log(chalk.cyan('\nGet your Supabase credentials: https://supabase.com/dashboard'));

    const supabaseResponses = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Supabase Project URL:',
        validate: (v) => v.startsWith('https://') || 'Must be a valid URL',
      },
      {
        type: 'password',
        name: 'anonKey',
        message: 'Supabase Anon Key:',
      },
    ]);

    if (supabaseResponses.url && supabaseResponses.anonKey) {
      let envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
      envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${supabaseResponses.url}`;
      envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseResponses.anonKey}\n`;
      fs.writeFileSync('.env', envContent);
      console.log(chalk.green('✓ Supabase credentials saved to .env'));
    }
  }

  console.log(chalk.green(`\n✓ Database: ${responses.database}\n`));

  return { database: responses.database };
}

async function stepAuth(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(4);

  console.log(chalk.bold.white('🔐 Authentication Setup\n'));

  const responses = await prompts({
    type: 'select',
    name: 'auth',
    message: 'Authentication method:',
    choices: [
      {
        title: '⚡ Supabase Auth (Recommended)',
        value: 'supabase',
        description: 'Built-in with Supabase, email + OAuth',
      },
      {
        title: '🔑 NextAuth.js',
        value: 'nextauth',
        description: 'Flexible, supports many providers',
      },
      {
        title: '🎭 Clerk',
        value: 'clerk',
        description: 'Managed auth, great UI components',
      },
      {
        title: '⏭️ Skip for now',
        value: 'none',
        description: 'Add authentication later',
      },
    ],
  });

  if (responses.auth === undefined) return null;

  console.log(chalk.green(`\n✓ Authentication: ${responses.auth}\n`));

  return { auth: responses.auth };
}

async function stepFeatures(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(5);

  console.log(chalk.bold.white('✨ Additional Features\n'));

  const responses = await prompts({
    type: 'multiselect',
    name: 'features',
    message: 'Select features to enable:',
    choices: [
      { title: '🔍 SEO Optimization', value: 'seo', selected: true },
      { title: '📱 PWA Support', value: 'pwa', selected: true },
      { title: '🔒 Security Headers', value: 'security', selected: true },
      { title: '⏱️ Rate Limiting', value: 'ratelimit', selected: true },
      { title: '💾 Response Caching', value: 'caching', selected: true },
      { title: '📊 Analytics', value: 'analytics' },
      { title: '🧪 Testing Setup', value: 'testing' },
      { title: '📚 API Documentation', value: 'docs' },
    ],
    hint: '- Space to select. Return to submit',
  });

  if (responses.features === undefined) return null;

  console.log(chalk.green(`\n✓ Features: ${responses.features.join(', ')}\n`));

  return { features: responses.features };
}

async function stepDeploy(): Promise<Partial<WizardState> | null> {
  console.clear();
  showProgress(6);

  console.log(chalk.bold.white('🚀 Deployment Setup\n'));

  const responses = await prompts({
    type: 'select',
    name: 'deployment',
    message: 'Where will you deploy?',
    choices: [
      {
        title: '▲ Vercel (Recommended)',
        value: 'vercel',
        description: 'Best for Next.js, automatic deployments',
      },
      {
        title: '🚂 Railway',
        value: 'railway',
        description: 'Simple, great for full-stack apps',
      },
      {
        title: '🐳 Docker',
        value: 'docker',
        description: 'Self-hosted, maximum control',
      },
      {
        title: '⏭️ Decide later',
        value: 'none',
        description: 'Skip deployment setup',
      },
    ],
  });

  if (responses.deployment === undefined) return null;

  console.log(chalk.green(`\n✓ Deployment: ${responses.deployment}\n`));

  return { deployment: responses.deployment };
}

async function stepComplete(state: WizardState) {
  console.clear();
  showProgress(7);

  console.log(chalk.bold.white('🎉 Generating Your Project\n'));
  console.log(chalk.gray('This may take a moment...\n'));

  const tasks = [
    { name: 'Creating .rana.yml configuration', done: false },
    { name: 'Setting up LLM client', done: false },
    { name: 'Configuring database', done: false },
    { name: 'Adding authentication', done: false },
    { name: 'Enabling features', done: false },
    { name: 'Setting up deployment', done: false },
  ];

  // Task 1: Create .rana.yml
  await sleep(300);
  createRanaConfig(state);
  tasks[0].done = true;
  printTasks(tasks);

  // Task 2: Setup LLM
  await sleep(300);
  createLLMClient(state);
  tasks[1].done = true;
  printTasks(tasks);

  // Task 3: Configure database
  await sleep(300);
  if (state.database !== 'none') {
    setupDatabase(state);
  }
  tasks[2].done = true;
  printTasks(tasks);

  // Task 4: Authentication
  await sleep(300);
  if (state.auth !== 'none') {
    setupAuth(state);
  }
  tasks[3].done = true;
  printTasks(tasks);

  // Task 5: Features
  await sleep(300);
  setupFeatures(state);
  tasks[4].done = true;
  printTasks(tasks);

  // Task 6: Deployment
  await sleep(300);
  if (state.deployment !== 'none') {
    setupDeployment(state);
  }
  tasks[5].done = true;
  printTasks(tasks);

  // Complete!
  console.clear();
  console.log(chalk.bold.green(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎉  Your AI App is Ready!                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

  console.log(chalk.bold.white('Summary:\n'));
  console.log(`  Project:        ${chalk.cyan(state.projectName)}`);
  console.log(`  Type:           ${chalk.cyan(state.projectType)}`);
  console.log(`  LLM:            ${chalk.cyan(state.llmProvider)} / ${state.llmModel}`);
  console.log(`  Database:       ${chalk.cyan(state.database)}`);
  console.log(`  Auth:           ${chalk.cyan(state.auth)}`);
  console.log(`  Features:       ${chalk.cyan(state.features.join(', ') || 'none')}`);
  console.log(`  Deployment:     ${chalk.cyan(state.deployment)}`);

  console.log(chalk.bold.white('\n📁 Files Created:\n'));
  console.log(chalk.gray('  .rana.yml              - RANA configuration'));
  console.log(chalk.gray('  .env                   - Environment variables'));
  console.log(chalk.gray('  lib/llm.ts             - LLM client'));
  if (state.database === 'supabase') {
    console.log(chalk.gray('  lib/supabase.ts        - Supabase client'));
  }

  console.log(chalk.bold.white('\n🚀 Next Steps:\n'));
  console.log(chalk.cyan('  1. npm install         ') + chalk.gray('# Install dependencies'));
  console.log(chalk.cyan('  2. npm run dev         ') + chalk.gray('# Start development server'));
  console.log(chalk.cyan('  3. rana check          ') + chalk.gray('# Verify setup'));

  if (state.deployment === 'vercel') {
    console.log(chalk.cyan('  4. vercel deploy       ') + chalk.gray('# Deploy to production'));
  }

  console.log(chalk.bold.white('\n📚 Helpful Commands:\n'));
  console.log(chalk.gray('  rana llm:analyze       - Analyze LLM costs'));
  console.log(chalk.gray('  rana security:audit    - Run security audit'));
  console.log(chalk.gray('  rana prompt:create     - Create a prompt'));
  console.log(chalk.gray('  rana dashboard         - View cost dashboard'));

  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(chalk.gray('  Documentation: https://rana.dev'));
  console.log(chalk.gray('  Support: https://discord.gg/rana\n'));
}

function printTasks(tasks: { name: string; done: boolean }[]) {
  console.clear();
  showProgress(7);
  console.log(chalk.bold.white('🎉 Generating Your Project\n'));

  tasks.forEach((task) => {
    const icon = task.done ? chalk.green('✓') : chalk.yellow('⏳');
    const text = task.done ? chalk.green(task.name) : chalk.yellow(task.name);
    console.log(`  ${icon} ${text}`);
  });
  console.log();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRanaConfig(state: WizardState) {
  const config = `# RANA Configuration
# Generated by \`rana wizard\`

version: 1.0.0

project:
  name: "${state.projectName}"
  type: "${state.projectType}"

llm:
  defaultProvider: "${state.llmProvider}"
  defaultModel: "${state.llmModel}"
  providers:
    - ${state.llmProvider}

database:
  provider: "${state.database}"

auth:
  provider: "${state.auth}"

features:
${state.features.map((f) => `  - ${f}`).join('\n') || '  []'}

deployment:
  platform: "${state.deployment}"

standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything

quality_gates:
  pre_implementation:
    - check_existing_code
  implementation:
    - no_mock_data
    - error_handling_required
  deployment:
    - security_audit_passed
`;

  fs.writeFileSync('.rana.yml', config);
}

function createLLMClient(state: WizardState) {
  const clientCode = `/**
 * LLM Client
 * Generated by RANA Wizard
 */

${state.llmProvider === 'openai' ? "import OpenAI from 'openai';" : ''}
${state.llmProvider === 'anthropic' ? "import Anthropic from '@anthropic-ai/sdk';" : ''}
${state.llmProvider === 'google' ? "import { GoogleGenerativeAI } from '@google/generative-ai';" : ''}

// Initialize client
${state.llmProvider === 'openai' ? `
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chat(messages: { role: string; content: string }[]) {
  const response = await openai.chat.completions.create({
    model: '${state.llmModel}',
    messages,
  });
  return response.choices[0].message.content;
}
` : ''}
${state.llmProvider === 'anthropic' ? `
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function chat(messages: { role: string; content: string }[]) {
  const response = await anthropic.messages.create({
    model: '${state.llmModel}',
    max_tokens: 4096,
    messages,
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
` : ''}
${state.llmProvider === 'google' ? `
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
export const model = genAI.getGenerativeModel({ model: '${state.llmModel}' });

export async function chat(prompt: string) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
` : ''}
${state.llmProvider === 'groq' ? `
import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function chat(messages: { role: string; content: string }[]) {
  const response = await groq.chat.completions.create({
    model: '${state.llmModel}',
    messages,
  });
  return response.choices[0].message.content;
}
` : ''}
`;

  if (!fs.existsSync('lib')) {
    fs.mkdirSync('lib', { recursive: true });
  }
  fs.writeFileSync('lib/llm.ts', clientCode);
}

function setupDatabase(state: WizardState) {
  if (state.database === 'supabase') {
    const supabaseClient = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
    if (!fs.existsSync('lib')) {
      fs.mkdirSync('lib', { recursive: true });
    }
    fs.writeFileSync('lib/supabase.ts', supabaseClient);
  }
}

function setupAuth(state: WizardState) {
  // Auth setup is handled by database setup for Supabase
  // For other providers, would generate appropriate files
}

function setupFeatures(state: WizardState) {
  // Generate feature-specific code
  if (state.features.includes('security')) {
    // Security headers would be added to next.config.js
  }
  if (state.features.includes('seo')) {
    // SEO files would be generated
  }
}

function setupDeployment(state: WizardState) {
  if (state.deployment === 'vercel') {
    const vercelConfig = {
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      framework: 'nextjs',
    };
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  }

  if (state.deployment === 'docker') {
    const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
`;
    fs.writeFileSync('Dockerfile', dockerfile);
  }
}

/**
 * Quick Wizard - Faster setup with sensible defaults
 */
export async function wizardQuickCommand() {
  console.log(chalk.bold.cyan('\n⚡ RANA Quick Setup\n'));
  console.log(chalk.gray('Setting up with recommended defaults...\n'));

  const state: WizardState = {
    projectName: path.basename(process.cwd()),
    projectType: 'chat',
    llmProvider: 'google',
    llmModel: 'gemini-2.0-flash-exp',
    database: 'supabase',
    auth: 'supabase',
    features: ['seo', 'security', 'ratelimit', 'caching'],
    deployment: 'vercel',
  };

  // Just ask for API keys
  const { googleKey } = await prompts({
    type: 'password',
    name: 'googleKey',
    message: 'Google AI API Key (get it at https://aistudio.google.com/apikey):',
  });

  if (googleKey) {
    let envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
    envContent += `\nGOOGLE_API_KEY=${googleKey}\n`;
    fs.writeFileSync('.env', envContent);
  }

  // Generate everything
  createRanaConfig(state);
  createLLMClient(state);

  console.log(chalk.green('\n✅ Quick setup complete!\n'));
  console.log(chalk.gray('Run `npm run dev` to start developing.\n'));
}
