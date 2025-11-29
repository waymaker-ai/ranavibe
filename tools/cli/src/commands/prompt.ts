/**
 * Prompt CLI Commands
 * Surfaces @rana/prompts package functionality via CLI
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';

interface PromptDefinition {
  id: string;
  name: string;
  template: string;
  variables: string[];
  version: string;
  description?: string;
  tags?: string[];
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptStore {
  prompts: Record<string, PromptDefinition>;
  version: string;
}

const PROMPTS_FILE = '.rana/prompts.json';
const PROMPTS_DIR = '.rana/prompts';

/**
 * Get or create prompts store
 */
function getPromptsStore(): PromptStore {
  const dir = path.dirname(PROMPTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(PROMPTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf-8'));
    } catch {
      return { prompts: {}, version: '1.0.0' };
    }
  }
  return { prompts: {}, version: '1.0.0' };
}

/**
 * Save prompts store
 */
function savePromptsStore(store: PromptStore): void {
  const dir = path.dirname(PROMPTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(store, null, 2));
}

/**
 * Extract variables from template ({{variable}} syntax)
 */
function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Prompt Create Command
 * Create a new prompt template
 */
export async function promptCreate(options: {
  id?: string;
  template?: string;
  file?: string;
  model?: string;
  provider?: string;
} = {}) {
  console.log(chalk.bold.cyan('\n📝 RANA Prompt Creator\n'));

  let id = options.id;
  let template = options.template;
  let name: string;
  let description: string;
  let tags: string[] = [];
  let model = options.model;
  let provider = options.provider;

  // If template file provided, read it
  if (options.file && fs.existsSync(options.file)) {
    template = fs.readFileSync(options.file, 'utf-8');
    console.log(chalk.gray(`Loaded template from ${options.file}`));
  }

  // Interactive mode if no ID provided
  if (!id) {
    const responses = await prompts([
      {
        type: 'text',
        name: 'id',
        message: 'Prompt ID (e.g., summarize, translate, classify):',
        validate: (value) => {
          if (!value) return 'ID is required';
          if (!/^[a-z][a-z0-9-_]*$/.test(value)) {
            return 'ID must start with lowercase letter and contain only a-z, 0-9, -, _';
          }
          return true;
        },
      },
      {
        type: 'text',
        name: 'name',
        message: 'Display name:',
        initial: (prev: string) => prev.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      },
      {
        type: 'text',
        name: 'description',
        message: 'Description (optional):',
      },
      {
        type: 'list',
        name: 'tags',
        message: 'Tags (comma-separated):',
        separator: ',',
      },
    ]);

    if (!responses.id) {
      console.log(chalk.gray('Cancelled.'));
      return;
    }

    id = responses.id;
    name = responses.name;
    description = responses.description;
    tags = responses.tags || [];
  } else {
    name = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    description = '';
  }

  // Get template if not provided
  if (!template) {
    const templateResponse = await prompts({
      type: 'text',
      name: 'template',
      message: 'Prompt template (use {{variable}} for variables):',
      validate: (value) => value.length > 0 || 'Template is required',
    });

    if (!templateResponse.template) {
      console.log(chalk.gray('Cancelled.'));
      return;
    }

    template = templateResponse.template;
  }

  // Ensure template is defined
  if (!template) {
    console.log(chalk.gray('No template provided.'));
    return;
  }

  // Extract variables
  const variables = extractVariables(template);

  if (variables.length > 0) {
    console.log(chalk.gray(`\nDetected variables: ${variables.join(', ')}`));
  }

  // Get model/provider if not set
  if (!model || !provider) {
    const modelResponse = await prompts([
      {
        type: 'select',
        name: 'provider',
        message: 'Default LLM provider:',
        choices: [
          { title: 'OpenAI', value: 'openai' },
          { title: 'Anthropic', value: 'anthropic' },
          { title: 'Google Gemini', value: 'google' },
          { title: 'Groq', value: 'groq' },
          { title: 'Ollama (local)', value: 'ollama' },
        ],
        initial: 0,
      },
      {
        type: 'select',
        name: 'model',
        message: 'Default model:',
        choices: (prev: string) => {
          switch (prev) {
            case 'openai':
              return [
                { title: 'GPT-4o (recommended)', value: 'gpt-4o' },
                { title: 'GPT-4o Mini (cheaper)', value: 'gpt-4o-mini' },
                { title: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
              ];
            case 'anthropic':
              return [
                { title: 'Claude 3.5 Sonnet (recommended)', value: 'claude-3-5-sonnet-20241022' },
                { title: 'Claude 3 Haiku (cheaper)', value: 'claude-3-haiku-20240307' },
              ];
            case 'google':
              return [
                { title: 'Gemini 2.0 Flash (fast)', value: 'gemini-2.0-flash-exp' },
                { title: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
              ];
            case 'groq':
              return [
                { title: 'Llama 3.1 70B (fast)', value: 'llama-3.1-70b-versatile' },
                { title: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
              ];
            case 'ollama':
              return [
                { title: 'Llama 3.2', value: 'llama3.2' },
                { title: 'Mistral', value: 'mistral' },
              ];
            default:
              return [{ title: 'GPT-4o Mini', value: 'gpt-4o-mini' }];
          }
        },
      },
    ]);

    provider = modelResponse.provider || 'openai';
    model = modelResponse.model || 'gpt-4o-mini';
  }

  // Save prompt
  const store = getPromptsStore();
  const now = new Date();

  store.prompts[id!] = {
    id: id!,
    name: name!,
    template: template as string,
    variables,
    version: '1.0.0',
    description,
    tags,
    model,
    provider,
    createdAt: now,
    updatedAt: now,
  };

  savePromptsStore(store);

  // Also save as individual file
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(PROMPTS_DIR, `${id}.json`),
    JSON.stringify(store.prompts[id!], null, 2)
  );

  console.log(chalk.green(`\n✅ Prompt "${id}" created successfully!\n`));
  console.log(chalk.gray('Files created:'));
  console.log(chalk.gray(`  - ${PROMPTS_FILE}`));
  console.log(chalk.gray(`  - ${PROMPTS_DIR}/${id}.json`));
  console.log();
  console.log(chalk.gray('Test your prompt:'));
  console.log(chalk.cyan(`  rana prompt:test ${id}`));
  console.log();
}

/**
 * Prompt List Command
 * List all registered prompts
 */
export async function promptList(options: { verbose?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n📋 RANA Prompts\n'));

  const store = getPromptsStore();
  const promptsList = Object.values(store.prompts);

  if (promptsList.length === 0) {
    console.log(chalk.yellow('No prompts registered yet.'));
    console.log(chalk.gray('\nCreate your first prompt:'));
    console.log(chalk.cyan('  rana prompt:create'));
    console.log();
    return;
  }

  console.log(chalk.gray(`Found ${promptsList.length} prompt(s)\n`));

  // Table header
  console.log(
    chalk.bold(
      'ID'.padEnd(20) +
      'Name'.padEnd(25) +
      'Variables'.padEnd(20) +
      'Provider'.padEnd(12) +
      'Model'
    )
  );
  console.log(chalk.gray('─'.repeat(90)));

  promptsList.forEach((prompt) => {
    const varsStr = prompt.variables.length > 0
      ? prompt.variables.slice(0, 3).join(', ') + (prompt.variables.length > 3 ? '...' : '')
      : '-';

    console.log(
      chalk.cyan(prompt.id.padEnd(20)) +
      chalk.white(prompt.name.padEnd(25)) +
      chalk.gray(varsStr.padEnd(20)) +
      chalk.yellow((prompt.provider || 'openai').padEnd(12)) +
      chalk.gray(prompt.model || 'gpt-4o-mini')
    );

    if (options.verbose && prompt.description) {
      console.log(chalk.gray(`  └─ ${prompt.description}`));
    }
  });

  console.log();
}

/**
 * Prompt Test Command
 * Test a prompt with sample variables
 */
export async function promptTest(promptId: string, options: {
  variables?: string;
  dryRun?: boolean;
} = {}) {
  console.log(chalk.bold.cyan('\n🧪 RANA Prompt Tester\n'));

  const store = getPromptsStore();
  const prompt = store.prompts[promptId];

  if (!prompt) {
    console.log(chalk.red(`Prompt "${promptId}" not found.`));
    console.log(chalk.gray('\nAvailable prompts:'));
    Object.keys(store.prompts).forEach((id) => {
      console.log(chalk.gray(`  - ${id}`));
    });
    return;
  }

  console.log(chalk.white('Prompt:'), chalk.cyan(prompt.name));
  console.log(chalk.white('Template:'));
  console.log(chalk.gray('  ' + prompt.template.split('\n').join('\n  ')));
  console.log();

  // Parse variables from options or prompt for them
  let variables: Record<string, string> = {};

  if (options.variables) {
    // Parse "key=value,key2=value2" format
    options.variables.split(',').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        variables[key.trim()] = value.trim();
      }
    });
  }

  // Prompt for missing variables
  if (prompt.variables.length > 0) {
    const missingVars = prompt.variables.filter((v) => !variables[v]);

    if (missingVars.length > 0) {
      console.log(chalk.gray('Enter variable values:\n'));

      for (const varName of missingVars) {
        const response = await prompts({
          type: 'text',
          name: 'value',
          message: `${varName}:`,
        });

        if (response.value !== undefined) {
          variables[varName] = response.value;
        }
      }
      console.log();
    }
  }

  // Render template
  const rendered = renderTemplate(prompt.template, variables);

  console.log(chalk.white('Rendered Prompt:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.green(rendered));
  console.log(chalk.gray('─'.repeat(60)));

  // Estimate tokens and cost
  const estimatedTokens = Math.ceil(rendered.length / 4);
  const costs: Record<string, Record<string, { input: number; output: number }>> = {
    openai: {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
    },
    anthropic: {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    },
    google: {
      'gemini-2.0-flash-exp': { input: 0.0001, output: 0.0004 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    },
    groq: {
      'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
    },
    ollama: {
      'llama3.2': { input: 0, output: 0 },
      'mistral': { input: 0, output: 0 },
    },
  };

  const providerCosts = costs[prompt.provider || 'openai'] || {};
  const modelCost = providerCosts[prompt.model || 'gpt-4o-mini'] || { input: 0.001, output: 0.002 };
  const estimatedCost = (estimatedTokens / 1000) * modelCost.input + (200 / 1000) * modelCost.output;

  console.log(chalk.white('\nEstimated:'));
  console.log(chalk.gray(`  Input tokens:  ~${estimatedTokens}`));
  console.log(chalk.gray(`  Output tokens: ~200 (estimated)`));
  console.log(chalk.gray(`  Cost:          ~$${estimatedCost.toFixed(6)}`));
  console.log(chalk.gray(`  Provider:      ${prompt.provider || 'openai'}`));
  console.log(chalk.gray(`  Model:         ${prompt.model || 'gpt-4o-mini'}`));

  if (options.dryRun) {
    console.log(chalk.yellow('\n[Dry run - not executing]'));
  } else {
    const { execute } = await prompts({
      type: 'confirm',
      name: 'execute',
      message: 'Execute this prompt?',
      initial: false,
    });

    if (execute) {
      console.log(chalk.cyan('\n⏳ Executing prompt...\n'));

      // Here we would call the actual LLM
      // For now, show what would happen
      console.log(chalk.yellow('Note: LLM execution requires API keys configured.'));
      console.log(chalk.gray('Run `rana llm:setup` to configure providers.\n'));
    }
  }

  console.log();
}

/**
 * Prompt Protect Command
 * Enable security protections for prompts
 */
export async function promptProtect(options: {
  enable?: boolean;
  disable?: boolean;
  status?: boolean;
} = {}) {
  console.log(chalk.bold.cyan('\n🔒 RANA Prompt Protection\n'));

  const configFile = '.rana/protection.json';
  let config: {
    enabled: boolean;
    injectionDetection: boolean;
    piiMasking: boolean;
    maxTokens: number;
    rateLimit: number;
    blockedPatterns: string[];
  } = {
    enabled: false,
    injectionDetection: true,
    piiMasking: true,
    maxTokens: 4096,
    rateLimit: 100,
    blockedPatterns: [],
  };

  // Load existing config
  if (fs.existsSync(configFile)) {
    try {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    } catch {
      // Use defaults
    }
  }

  if (options.status) {
    console.log(chalk.bold('Protection Status:\n'));
    console.log(`  ${config.enabled ? chalk.green('●') : chalk.red('●')} Protection: ${config.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`  ${config.injectionDetection ? chalk.green('●') : chalk.gray('●')} Injection Detection: ${config.injectionDetection ? 'On' : 'Off'}`);
    console.log(`  ${config.piiMasking ? chalk.green('●') : chalk.gray('●')} PII Masking: ${config.piiMasking ? 'On' : 'Off'}`);
    console.log(`  Max Tokens: ${config.maxTokens}`);
    console.log(`  Rate Limit: ${config.rateLimit} req/min`);
    console.log(`  Blocked Patterns: ${config.blockedPatterns.length}`);
    console.log();
    return;
  }

  if (options.disable) {
    config.enabled = false;
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log(chalk.yellow('⚠️ Prompt protection disabled\n'));
    return;
  }

  // Interactive setup
  const responses = await prompts([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable prompt protection?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'injectionDetection',
      message: 'Enable injection detection? (blocks prompt injection attacks)',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'piiMasking',
      message: 'Enable PII masking? (masks emails, SSNs, phone numbers)',
      initial: true,
    },
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Maximum tokens per request:',
      initial: 4096,
    },
    {
      type: 'number',
      name: 'rateLimit',
      message: 'Rate limit (requests per minute):',
      initial: 100,
    },
  ]);

  if (responses.enabled === undefined) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  config = {
    enabled: responses.enabled,
    injectionDetection: responses.injectionDetection,
    piiMasking: responses.piiMasking,
    maxTokens: responses.maxTokens,
    rateLimit: responses.rateLimit,
    blockedPatterns: config.blockedPatterns,
  };

  const dir = path.dirname(configFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

  // Generate middleware code
  const middlewareCode = `/**
 * RANA Prompt Protection Middleware
 * Generated by \`rana prompt:protect\`
 */

const BLOCKED_PATTERNS = ${JSON.stringify(config.blockedPatterns)};

const PII_PATTERNS = [
  /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g, // Email
  /\\b\\d{3}-\\d{2}-\\d{4}\\b/g, // SSN
  /\\b\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b/g, // Phone
  /\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b/g, // Credit Card
];

const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?(instructions|prompts?)/i,
  /disregard (all |previous |above )?(instructions|prompts?)/i,
  /forget (all |previous |above )?(instructions|prompts?)/i,
  /new instructions?:/i,
  /system prompt:/i,
  /you are now/i,
  /pretend (to be|you are)/i,
];

export interface ProtectionResult {
  safe: boolean;
  issues: string[];
  sanitized: string;
}

export function protectPrompt(input: string): ProtectionResult {
  const issues: string[] = [];
  let sanitized = input;

  // Check for injection attempts
  ${config.injectionDetection ? `
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      issues.push(\`Potential injection detected: \${pattern.toString()}\`);
    }
  }
  ` : '// Injection detection disabled'}

  // Mask PII
  ${config.piiMasking ? `
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  if (sanitized !== input) {
    issues.push('PII detected and masked');
  }
  ` : '// PII masking disabled'}

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (input.includes(pattern)) {
      issues.push(\`Blocked pattern found: \${pattern}\`);
    }
  }

  return {
    safe: issues.filter(i => i.includes('injection') || i.includes('Blocked')).length === 0,
    issues,
    sanitized,
  };
}

export const PROTECTION_CONFIG = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync('.rana/protection-middleware.ts', middlewareCode);

  console.log(chalk.green('\n✅ Prompt protection configured!\n'));
  console.log(chalk.gray('Files created:'));
  console.log(chalk.gray(`  - ${configFile}`));
  console.log(chalk.gray(`  - .rana/protection-middleware.ts`));
  console.log();
  console.log(chalk.gray('Usage in your code:'));
  console.log(chalk.cyan(`  import { protectPrompt } from './.rana/protection-middleware';`));
  console.log(chalk.cyan(`  const { safe, sanitized } = protectPrompt(userInput);`));
  console.log();
}

/**
 * Prompt Delete Command
 * Delete a prompt
 */
export async function promptDelete(promptId: string) {
  console.log(chalk.bold.cyan('\n🗑️  Delete Prompt\n'));

  const store = getPromptsStore();

  if (!store.prompts[promptId]) {
    console.log(chalk.red(`Prompt "${promptId}" not found.`));
    return;
  }

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: `Delete prompt "${promptId}"?`,
    initial: false,
  });

  if (!confirm) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  delete store.prompts[promptId];
  savePromptsStore(store);

  // Delete individual file if exists
  const promptFile = path.join(PROMPTS_DIR, `${promptId}.json`);
  if (fs.existsSync(promptFile)) {
    fs.unlinkSync(promptFile);
  }

  console.log(chalk.green(`\n✅ Prompt "${promptId}" deleted.\n`));
}

/**
 * Prompt Export Command
 * Export all prompts to a file
 */
export async function promptExport(options: { output?: string } = {}) {
  console.log(chalk.bold.cyan('\n📤 Export Prompts\n'));

  const store = getPromptsStore();
  const output = options.output || `rana-prompts-${new Date().toISOString().split('T')[0]}.json`;

  fs.writeFileSync(output, JSON.stringify(store, null, 2));

  console.log(chalk.green(`✅ Exported ${Object.keys(store.prompts).length} prompts to ${output}\n`));
}

/**
 * Prompt Import Command
 * Import prompts from a file
 */
export async function promptImport(file: string) {
  console.log(chalk.bold.cyan('\n📥 Import Prompts\n'));

  if (!fs.existsSync(file)) {
    console.log(chalk.red(`File not found: ${file}`));
    return;
  }

  try {
    const imported = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const store = getPromptsStore();

    let count = 0;
    for (const [id, prompt] of Object.entries(imported.prompts || imported)) {
      store.prompts[id] = prompt as PromptDefinition;
      count++;
    }

    savePromptsStore(store);
    console.log(chalk.green(`✅ Imported ${count} prompts from ${file}\n`));
  } catch (error) {
    console.log(chalk.red(`Failed to import: ${error}`));
  }
}

/**
 * Prompt Templates Command
 * Show built-in prompt templates
 */
export async function promptTemplates() {
  console.log(chalk.bold.cyan('\n📚 Built-in Prompt Templates\n'));

  const templates = [
    {
      id: 'summarize',
      name: 'Summarize Text',
      template: 'Summarize the following text in {{style}} style:\n\n{{text}}',
      description: 'Summarize any text in different styles (brief, detailed, bullet-points)',
    },
    {
      id: 'translate',
      name: 'Translate Text',
      template: 'Translate the following text to {{language}}:\n\n{{text}}',
      description: 'Translate text to any language',
    },
    {
      id: 'classify',
      name: 'Classify Content',
      template: 'Classify the following into one of these categories: {{categories}}\n\nContent: {{content}}\n\nRespond with only the category name.',
      description: 'Classify content into categories',
    },
    {
      id: 'extract',
      name: 'Extract Data',
      template: 'Extract the following information from the text:\n{{fields}}\n\nText: {{text}}\n\nReturn as JSON.',
      description: 'Extract structured data from unstructured text',
    },
    {
      id: 'rewrite',
      name: 'Rewrite Text',
      template: 'Rewrite the following text in a {{tone}} tone:\n\n{{text}}',
      description: 'Rewrite text in different tones (professional, casual, formal)',
    },
    {
      id: 'code-review',
      name: 'Code Review',
      template: 'Review the following {{language}} code for:\n- Bugs\n- Security issues\n- Performance improvements\n- Best practices\n\n```{{language}}\n{{code}}\n```',
      description: 'Review code for issues and improvements',
    },
    {
      id: 'chat-system',
      name: 'Chat System Prompt',
      template: 'You are {{assistant_name}}, a helpful assistant for {{company}}. Your role is to {{role}}. Always be {{personality}}.',
      description: 'System prompt for chat assistants',
    },
  ];

  templates.forEach((t) => {
    console.log(chalk.bold.white(t.name) + chalk.gray(` (${t.id})`));
    console.log(chalk.gray(`  ${t.description}`));
    console.log(chalk.cyan(`  Template: ${t.template.substring(0, 60)}...`));
    console.log();
  });

  console.log(chalk.gray('Create a prompt from template:'));
  console.log(chalk.cyan('  rana prompt:create --id my-prompt --template "Your template here"'));
  console.log();
}
