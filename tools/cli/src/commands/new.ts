/**
 * RANA New Command - Scaffolding Generator
 *
 * Rails-like scaffolding for AI applications.
 * Generate production-ready components in seconds.
 *
 * @example
 * ```bash
 * # Generate a chatbot
 * rana new chatbot support-bot
 *
 * # Generate a RAG system
 * rana new rag docs-search
 *
 * # Generate an AI agent
 * rana new agent data-analyst
 *
 * # Generate an API endpoint
 * rana new api chat
 * ```
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';

interface NewOptions {
  provider?: string;
  model?: string;
  dir?: string;
}

interface Template {
  files: Array<{
    path: string;
    content: string;
  }>;
  dependencies: string[];
  postCreate: string[];
}

/**
 * Main new command
 */
export async function newCommand(
  type: string,
  name?: string,
  options: NewOptions = {}
): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 RANA Generator\n'));

  const validTypes = ['chatbot', 'rag', 'agent', 'api', 'helper', 'prompt'];

  if (!validTypes.includes(type)) {
    console.log(chalk.yellow(`Unknown type: ${type}\n`));
    console.log('Available generators:');
    console.log(chalk.gray('  • chatbot  - Chat interface with streaming'));
    console.log(chalk.gray('  • rag      - RAG system with document indexing'));
    console.log(chalk.gray('  • agent    - AI agent with tools'));
    console.log(chalk.gray('  • api      - API endpoint for AI'));
    console.log(chalk.gray('  • helper   - Custom AI helper function'));
    console.log(chalk.gray('  • prompt   - Managed prompt template'));
    console.log(chalk.gray('\nExample: rana new chatbot support-bot\n'));
    return;
  }

  // Get name if not provided
  if (!name) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: `Name for your ${type}:`,
      initial: `my-${type}`,
    });
    name = response.name;
  }

  if (!name) {
    console.log(chalk.yellow('Name is required.\n'));
    return;
  }

  // Normalize name
  const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  const pascalName = safeName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1);

  const provider = options.provider || 'openai';
  const model = options.model || getDefaultModel(provider);
  const baseDir = options.dir || 'src';

  console.log(chalk.gray(`Creating ${type}: ${safeName}`));
  console.log(chalk.gray(`Provider: ${provider}, Model: ${model}\n`));

  // Generate template
  let template: Template;

  switch (type) {
    case 'chatbot':
      template = generateChatbot(safeName, pascalName, camelName, provider, model);
      break;
    case 'rag':
      template = generateRAG(safeName, pascalName, camelName, provider, model);
      break;
    case 'agent':
      template = generateAgent(safeName, pascalName, camelName, provider, model);
      break;
    case 'api':
      template = generateAPI(safeName, pascalName, camelName, provider, model);
      break;
    case 'helper':
      template = generateHelper(safeName, pascalName, camelName, provider, model);
      break;
    case 'prompt':
      template = generatePrompt(safeName, pascalName, camelName);
      break;
    default:
      console.log(chalk.red('Unknown type'));
      return;
  }

  // Create files
  for (const file of template.files) {
    const fullPath = path.join(process.cwd(), baseDir, file.path);
    const dir = path.dirname(fullPath);

    // Create directory if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file exists
    if (fs.existsSync(fullPath)) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `${file.path} exists. Overwrite?`,
        initial: false,
      });

      if (!overwrite) {
        console.log(chalk.gray(`  Skipped: ${file.path}`));
        continue;
      }
    }

    fs.writeFileSync(fullPath, file.content);
    console.log(chalk.green(`  ✓ Created: ${file.path}`));
  }

  // Show next steps
  console.log(chalk.bold.green('\n✨ Generated successfully!\n'));

  if (template.dependencies.length > 0) {
    console.log(chalk.gray('Install dependencies:'));
    console.log(chalk.white(`  npm install ${template.dependencies.join(' ')}\n`));
  }

  if (template.postCreate.length > 0) {
    console.log(chalk.gray('Next steps:'));
    for (const step of template.postCreate) {
      console.log(chalk.white(`  ${step}`));
    }
  }

  console.log('');
}

/**
 * Get default model for provider
 */
function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-70b-versatile',
    xai: 'grok-2',
    ollama: 'llama3.1',
  };
  return defaults[provider] || 'gpt-4o-mini';
}

/**
 * Generate chatbot template
 */
function generateChatbot(
  safeName: string,
  pascalName: string,
  camelName: string,
  provider: string,
  model: string
): Template {
  return {
    files: [
      {
        path: `${safeName}/${camelName}.ts`,
        content: `/**
 * ${pascalName} Chatbot
 * Generated by RANA
 */

import { RanaClient } from '@rana/core';

export interface ${pascalName}Config {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class ${pascalName}Chat {
  private client: RanaClient;
  private config: ${pascalName}Config;
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(config: ${pascalName}Config = {}) {
    this.client = new RanaClient();
    this.config = {
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };
  }

  /**
   * Send a message and get a response
   */
  async chat(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    const response = await this.client.chat({
      model: '${model}',
      messages: [
        { role: 'system', content: this.config.systemPrompt! },
        ...this.history,
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    const assistantMessage = response.content;
    this.history.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  }

  /**
   * Stream a response
   */
  async *stream(message: string): AsyncGenerator<string> {
    this.history.push({ role: 'user', content: message });

    const stream = await this.client.stream({
      model: '${model}',
      messages: [
        { role: 'system', content: this.config.systemPrompt! },
        ...this.history,
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    this.history.push({ role: 'assistant', content: fullResponse });
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.history];
  }
}

// Export singleton instance
export const ${camelName} = new ${pascalName}Chat();
`,
      },
      {
        path: `${safeName}/${camelName}.test.ts`,
        content: `/**
 * Tests for ${pascalName} Chatbot
 */

import { describe, aiTest } from '@rana/testing';
import { ${camelName} } from './${camelName}';

describe('${pascalName} Chatbot', () => {
  aiTest('should respond to greetings', async ({ expect }) => {
    const response = await ${camelName}.chat('Hello!');

    expect(response).toBeTruthy();
    await expect(response).toSemanticMatch('a friendly greeting response');
    await expect(response).toCostLessThan(0.01);
  });

  aiTest('should maintain conversation context', async ({ expect }) => {
    ${camelName}.clearHistory();

    await ${camelName}.chat('My name is Alice');
    const response = await ${camelName}.chat('What is my name?');

    expect(response.toLowerCase()).toContain('alice');
  });
});
`,
      },
    ],
    dependencies: ['@rana/core', '@rana/testing'],
    postCreate: [
      '1. Configure your API key: rana config:set --provider openai',
      '2. Import and use: import { ' + camelName + " } from './src/" + safeName + "'",
      '3. Run tests: rana test',
    ],
  };
}

/**
 * Generate RAG template
 */
function generateRAG(
  safeName: string,
  pascalName: string,
  camelName: string,
  provider: string,
  model: string
): Template {
  return {
    files: [
      {
        path: `${safeName}/${camelName}.ts`,
        content: `/**
 * ${pascalName} RAG System
 * Generated by RANA
 */

import { RAGPresets, type RAGPipeline } from '@rana/rag';

export interface ${pascalName}Config {
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
}

export class ${pascalName}RAG {
  private pipeline: RAGPipeline;
  private config: ${pascalName}Config;
  private indexed: boolean = false;

  constructor(config: ${pascalName}Config = {}) {
    this.config = {
      chunkSize: 500,
      chunkOverlap: 50,
      topK: 5,
      ...config,
    };

    // Use balanced preset (good quality + speed)
    this.pipeline = RAGPresets.balanced({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      topK: this.config.topK,
    });
  }

  /**
   * Index documents
   */
  async index(documents: Array<{ content: string; metadata?: Record<string, string> }>): Promise<void> {
    await this.pipeline.index(documents);
    this.indexed = true;
    console.log(\`Indexed \${documents.length} documents\`);
  }

  /**
   * Query the RAG system
   */
  async query(question: string): Promise<{
    answer: string;
    citations: Array<{ content: string; metadata?: Record<string, string> }>;
    confidence: number;
  }> {
    if (!this.indexed) {
      throw new Error('No documents indexed. Call index() first.');
    }

    const result = await this.pipeline.query({ query: question });

    return {
      answer: result.answer,
      citations: result.citations || [],
      confidence: result.confidence || 0,
    };
  }

  /**
   * Index from files
   */
  async indexFromFiles(filePaths: string[]): Promise<void> {
    const fs = await import('fs/promises');
    const documents = await Promise.all(
      filePaths.map(async (filePath) => ({
        content: await fs.readFile(filePath, 'utf-8'),
        metadata: { source: filePath },
      }))
    );
    await this.index(documents);
  }
}

// Export singleton instance
export const ${camelName} = new ${pascalName}RAG();
`,
      },
      {
        path: `${safeName}/${camelName}.test.ts`,
        content: `/**
 * Tests for ${pascalName} RAG System
 */

import { describe, aiTest } from '@rana/testing';
import { ${pascalName}RAG } from './${camelName}';

describe('${pascalName} RAG', () => {
  aiTest('should answer questions from indexed documents', async ({ expect }) => {
    const rag = new ${pascalName}RAG();

    await rag.index([
      { content: 'RANA supports 9 different LLM providers.', metadata: { source: 'docs' } },
      { content: 'Caching can reduce costs by up to 70%.', metadata: { source: 'docs' } },
    ]);

    const result = await rag.query('How many providers does RANA support?');

    expect(result.answer).toBeTruthy();
    await expect(result.answer).toSemanticMatch('9 providers');
    expect(result.citations.length).toBeGreaterThan(0);
  });
});
`,
      },
    ],
    dependencies: ['@rana/core', '@rana/rag', '@rana/testing'],
    postCreate: [
      '1. Configure your API key: rana config:set --provider openai',
      '2. Index your documents: await ' + camelName + '.indexFromFiles(["docs/*.md"])',
      '3. Query: const result = await ' + camelName + '.query("your question")',
    ],
  };
}

/**
 * Generate Agent template
 */
function generateAgent(
  safeName: string,
  pascalName: string,
  camelName: string,
  provider: string,
  model: string
): Template {
  return {
    files: [
      {
        path: `${safeName}/${camelName}.ts`,
        content: `/**
 * ${pascalName} AI Agent
 * Generated by RANA
 */

import {
  LLMAgent,
  calculatorTool,
  dateTimeTool,
  type Tool,
} from '@rana/core';

export interface ${pascalName}Config {
  systemPrompt?: string;
  tools?: Tool[];
  maxIterations?: number;
}

/**
 * Create custom tools for your agent
 */
const customTools: Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
      },
      required: ['location'],
    },
    execute: async ({ location }) => {
      // Replace with real weather API
      return \`The weather in \${location} is sunny, 72°F\`;
    },
  },
];

export class ${pascalName}Agent {
  private agent: LLMAgent;

  constructor(config: ${pascalName}Config = {}) {
    const defaultPrompt = \`You are ${pascalName}, a helpful AI assistant.
You have access to tools that let you perform actions.
Always use the appropriate tool when needed.\`;

    this.agent = new LLMAgent({
      name: '${pascalName}',
      model: '${model}',
      systemPrompt: config.systemPrompt || defaultPrompt,
      tools: [
        calculatorTool,
        dateTimeTool,
        ...customTools,
        ...(config.tools || []),
      ],
      maxIterations: config.maxIterations || 5,
    });
  }

  /**
   * Run the agent with a task
   */
  async run(task: string): Promise<string> {
    return await this.agent.run(task);
  }

  /**
   * Stream agent responses
   */
  async *stream(task: string): AsyncGenerator<{
    type: 'thinking' | 'tool_call' | 'response';
    content: string;
  }> {
    // Simplified streaming - in production, use StreamingAgent
    const result = await this.run(task);
    yield { type: 'response', content: result };
  }
}

// Export singleton instance
export const ${camelName} = new ${pascalName}Agent();
`,
      },
      {
        path: `${safeName}/${camelName}.test.ts`,
        content: `/**
 * Tests for ${pascalName} Agent
 */

import { describe, aiTest } from '@rana/testing';
import { ${camelName} } from './${camelName}';

describe('${pascalName} Agent', () => {
  aiTest('should use calculator tool', async ({ expect }) => {
    const result = await ${camelName}.run('What is 15% of 200?');

    expect(result).toBeTruthy();
    await expect(result).toSemanticMatch('30');
    await expect(result).toCostLessThan(0.05);
  });

  aiTest('should use date tool', async ({ expect }) => {
    const result = await ${camelName}.run('What day of the week is today?');

    expect(result).toBeTruthy();
  });
});
`,
      },
    ],
    dependencies: ['@rana/core', '@rana/testing'],
    postCreate: [
      '1. Configure your API key: rana config:set --provider openai',
      '2. Add custom tools in ' + safeName + '/' + camelName + '.ts',
      '3. Run: const result = await ' + camelName + '.run("your task")',
    ],
  };
}

/**
 * Generate API endpoint template
 */
function generateAPI(
  safeName: string,
  pascalName: string,
  camelName: string,
  provider: string,
  model: string
): Template {
  return {
    files: [
      {
        path: `api/${safeName}/route.ts`,
        content: `/**
 * ${pascalName} API Route
 * Generated by RANA
 *
 * Works with Next.js App Router
 */

import { NextRequest, NextResponse } from 'next/server';
import { RanaClient } from '@rana/core';

const client = new RanaClient({
  cache: {
    type: 'memory',
    ttl: 3600, // Cache for 1 hour
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stream = false } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          const stream = await client.stream({
            model: '${model}',
            messages: [{ role: 'user', content: message }],
          });

          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ content: chunk })}\\n\\n\`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
          controller.close();
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await client.chat({
      model: '${model}',
      messages: [{ role: 'user', content: message }],
    });

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: '${pascalName} API',
    version: '1.0.0',
    endpoints: {
      POST: 'Send a message to the AI',
    },
  });
}
`,
      },
    ],
    dependencies: ['@rana/core'],
    postCreate: [
      '1. Configure your API key: rana config:set --provider openai',
      '2. Start your Next.js app: npm run dev',
      '3. Test: curl -X POST http://localhost:3000/api/' + safeName + ' -H "Content-Type: application/json" -d \'{"message":"Hello"}\'',
    ],
  };
}

/**
 * Generate helper function template
 */
function generateHelper(
  safeName: string,
  pascalName: string,
  camelName: string,
  provider: string,
  model: string
): Template {
  return {
    files: [
      {
        path: `helpers/${camelName}.ts`,
        content: `/**
 * ${pascalName} Helper
 * Generated by RANA
 */

import { RanaClient } from '@rana/core';

const client = new RanaClient();

export interface ${pascalName}Options {
  temperature?: number;
  maxTokens?: number;
}

/**
 * ${pascalName} - Your custom AI helper
 *
 * @example
 * const result = await ${camelName}('input text');
 */
export async function ${camelName}(
  input: string,
  options: ${pascalName}Options = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 1000 } = options;

  const response = await client.chat({
    model: '${model}',
    messages: [
      {
        role: 'system',
        content: \`You are a specialized assistant for ${pascalName}.
Provide helpful, accurate responses.\`,
      },
      { role: 'user', content: input },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return response.content;
}

// Named export for tree-shaking
export default ${camelName};
`,
      },
    ],
    dependencies: ['@rana/core'],
    postCreate: [
      '1. Customize the system prompt in helpers/' + camelName + '.ts',
      '2. Import: import { ' + camelName + " } from './helpers/" + camelName + "'",
      '3. Use: const result = await ' + camelName + '("your input")',
    ],
  };
}

/**
 * Generate managed prompt template
 */
function generatePrompt(
  safeName: string,
  pascalName: string,
  camelName: string
): Template {
  return {
    files: [
      {
        path: `prompts/${camelName}.ts`,
        content: `/**
 * ${pascalName} Prompt
 * Generated by RANA
 */

import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'my-app' });

// Register the prompt
export async function register${pascalName}Prompt(): Promise<void> {
  await pm.register('${safeName}', {
    template: \`You are ${pascalName}.

Your task: {{task}}

Context: {{context}}

Provide a helpful response.\`,
    description: '${pascalName} prompt template',
    tags: ['${safeName}'],
    variables: {
      task: { type: 'string', required: true },
      context: { type: 'string', required: false, default: 'None' },
    },
  });
}

// Execute the prompt
export async function execute${pascalName}(
  task: string,
  context?: string
): Promise<string> {
  const result = await pm.execute('${safeName}', {
    variables: { task, context: context || 'None' },
  });

  return result.content;
}

// Export for testing
export { pm as promptManager };
`,
      },
    ],
    dependencies: ['@rana/prompts'],
    postCreate: [
      '1. Register the prompt: await register' + pascalName + 'Prompt()',
      '2. Execute: const result = await execute' + pascalName + '("your task")',
      '3. View analytics: rana prompt:stats ' + safeName,
    ],
  };
}
