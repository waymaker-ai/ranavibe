#!/usr/bin/env node

/**
 * create-aicofounder-app
 *
 * Scaffolds a new CoFounder AI application with guardrails.
 *
 * Templates:
 *   chatbot    - Guarded chatbot with PII/injection protection
 *   agent      - Guarded Anthropic agent with tool use
 *   api-guard  - Express API with guardrails middleware
 *   full-stack - Next.js app with guardrails
 */

import { Command } from 'commander';
import prompts from 'prompts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

// ---- Types ----

export type Template = 'chatbot' | 'agent' | 'api-guard' | 'full-stack';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface CreateOptions {
  projectName: string;
  template: Template;
  packageManager: PackageManager;
  skipInstall: boolean;
  skipGit: boolean;
}

export const TEMPLATES: Record<Template, { name: string; description: string }> = {
  chatbot: { name: 'Chatbot', description: 'Guarded chatbot with PII and injection protection' },
  agent: { name: 'Agent', description: 'Guarded Anthropic agent with tool use' },
  'api-guard': { name: 'API Guard', description: 'Express API with guardrails middleware' },
  'full-stack': { name: 'Full-Stack', description: 'Next.js app with guardrails' },
};

// ---- File generators ----

export function generatePackageJson(name: string, template: Template): string {
  const base: Record<string, unknown> = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {} as Record<string, string>,
    dependencies: {} as Record<string, string>,
    devDependencies: {} as Record<string, string>,
  };

  const deps = base.dependencies as Record<string, string>;
  const devDeps = base.devDependencies as Record<string, string>;
  const scripts = base.scripts as Record<string, string>;

  // Common dependencies
  deps['@waymakerai/aicofounder-core'] = '^2.0.0';
  deps['@waymakerai/aicofounder-guard'] = '^1.0.0';
  devDeps['typescript'] = '^5.5.0';
  devDeps['@types/node'] = '^22.0.0';
  devDeps['tsx'] = '^4.7.0';

  switch (template) {
    case 'chatbot':
      deps['@waymakerai/aicofounder-streaming'] = '^1.0.0';
      scripts.dev = 'tsx watch src/index.ts';
      scripts.build = 'tsc';
      scripts.start = 'node dist/index.js';
      break;

    case 'agent':
      deps['@anthropic-ai/sdk'] = '^0.30.0';
      deps['@waymakerai/aicofounder-agents'] = '^1.0.0';
      scripts.dev = 'tsx watch src/index.ts';
      scripts.build = 'tsc';
      scripts.start = 'node dist/index.js';
      break;

    case 'api-guard':
      deps['express'] = '^4.21.0';
      deps['@waymakerai/aicofounder-streaming'] = '^1.0.0';
      devDeps['@types/express'] = '^4.17.21';
      scripts.dev = 'tsx watch src/index.ts';
      scripts.build = 'tsc';
      scripts.start = 'node dist/index.js';
      break;

    case 'full-stack':
      deps['next'] = '^14.2.0';
      deps['react'] = '^18.3.0';
      deps['react-dom'] = '^18.3.0';
      deps['@waymakerai/aicofounder-react'] = '^1.0.0';
      devDeps['@types/react'] = '^18.3.0';
      devDeps['@types/react-dom'] = '^18.3.0';
      scripts.dev = 'next dev';
      scripts.build = 'next build';
      scripts.start = 'next start';
      // Remove tsx for next.js template
      delete devDeps['tsx'];
      break;
  }

  return JSON.stringify(base, null, 2);
}

export function generateTsconfig(template: Template): string {
  const base: Record<string, unknown> = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022'],
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

  if (template === 'full-stack') {
    const opts = base.compilerOptions as Record<string, unknown>;
    opts.jsx = 'preserve';
    opts.lib = ['ES2022', 'DOM', 'DOM.Iterable'];
    opts.module = 'ESNext';
    opts.plugins = [{ name: 'next' }];
    opts.paths = { '@/*': ['./src/*'] };
    delete opts.outDir;
    delete opts.rootDir;
    delete opts.declaration;
    base.include = ['src/**/*', 'next-env.d.ts', '.next/types/**/*.ts'];
  }

  return JSON.stringify(base, null, 2);
}

export function generateCoFounderConfig(template: Template): string {
  return `# CoFounder Configuration
# https://cofounder.cx/docs/configuration

guard:
  rules:
    - no-pii-in-prompts
    - no-injection-vuln
    - no-hardcoded-keys
    - approved-models
  fail-on: high

models:
  approved:
    - gpt-4o
    - gpt-4o-mini
    - claude-sonnet-4-5-20250929
    - claude-3-haiku-20240307

budget:
  monthly: 100
  per-call: 0.50

scan:
  include:
    - "src/**/*.ts"
    - "src/**/*.tsx"
  exclude:
    - "node_modules"
    - "dist"
    - ".next"
`;
}

export function generateGitignore(): string {
  return `node_modules/
dist/
.next/
.env
.env.local
.env.*.local
.cofounder/cache/
*.log
.DS_Store
`;
}

export function generateEnvExample(template: Template): string {
  let content = '# CoFounder Environment Variables\n\n';

  if (template === 'agent') {
    content += '# Anthropic (required for agent template)\nANTHROPIC_API_KEY=your_api_key_here\n';
  } else {
    content += '# Choose your provider\nOPENAI_API_KEY=your_api_key_here\n# ANTHROPIC_API_KEY=your_api_key_here\n';
  }

  if (template === 'api-guard') {
    content += '\n# Server\nPORT=3000\n';
  }

  if (template === 'full-stack') {
    content += '\n# Next.js requires NEXT_PUBLIC_ prefix for client-side vars\n# Keep API keys server-side only\n';
  }

  return content;
}

export function generateReadme(name: string, template: Template): string {
  const templateNames: Record<Template, string> = {
    chatbot: 'Guarded Chatbot',
    agent: 'Guarded Anthropic Agent',
    'api-guard': 'Express API with Guardrails',
    'full-stack': 'Next.js with Guardrails',
  };

  return `# ${name}

${templateNames[template]} - built with [CoFounder](https://cofounder.cx).

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API key
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Guardrails

This project includes CoFounder guardrails that protect against:
- **PII Leakage** - Detects and blocks personal information in prompts
- **Prompt Injection** - Detects injection attacks in user input
- **Hardcoded Secrets** - Prevents API keys from being committed
- **Model Governance** - Ensures only approved models are used

Configure guardrails in \`.cofounder.yml\`.

## CI Integration

Add to your GitHub Actions workflow:

\`\`\`yaml
- uses: waymaker-ai/cofounder@main
  with:
    scan: pii,injection,secrets
    fail-on: high
\`\`\`

## Learn More

- [CoFounder Docs](https://cofounder.cx/docs)
- [Guardrails Guide](https://cofounder.cx/docs/security)
- [API Reference](https://cofounder.cx/docs/api)
`;
}

// ---- Template source files ----

export function generateChatbotSource(): string {
  return `/**
 * Guarded Chatbot
 *
 * A conversational chatbot with CoFounder guardrails that protect
 * against PII leakage and prompt injection attacks.
 */

import { createCoFounder } from '@waymakerai/aicofounder-core';
import { createGuard, piiDetector, injectionDetector } from '@waymakerai/aicofounder-guard';
import * as readline from 'node:readline';

// Initialize CoFounder with guardrails
const cofounder = createCoFounder({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Set up guard pipeline
const guard = createGuard({
  detectors: [
    piiDetector({ action: 'redact', types: ['email', 'phone', 'ssn', 'credit-card'] }),
    injectionDetector({ action: 'block', sensitivity: 'medium' }),
  ],
  onBlock: (result) => {
    console.error('\\n[GUARD] Blocked:', result.reason);
  },
  onRedact: (result) => {
    console.warn('\\n[GUARD] Redacted PII:', result.redactedTypes.join(', '));
  },
});

const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

async function chat(userMessage: string): Promise<string> {
  // Run input through guardrails
  const guardResult = await guard.check(userMessage);

  if (guardResult.blocked) {
    return \`I can't process that message. Reason: \${guardResult.reason}\`;
  }

  // Use the sanitized message (PII redacted)
  const sanitizedMessage = guardResult.sanitized || userMessage;
  history.push({ role: 'user', content: sanitizedMessage });

  const response = await cofounder.chat({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Never ask for or repeat personal information like emails, phone numbers, or SSNs.',
      },
      ...history,
    ],
  });

  // Also guard the output
  const outputGuard = await guard.check(response.content);
  const safeResponse = outputGuard.sanitized || response.content;

  history.push({ role: 'assistant', content: safeResponse });
  return safeResponse;
}

async function main(): Promise<void> {
  console.log('CoFounder Guarded Chatbot');
  console.log('========================');
  console.log('Type a message to chat. Type "exit" to quit.');
  console.log('PII is automatically redacted. Injection attempts are blocked.\\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === 'exit') {
        console.log('\\nGoodbye!');
        rl.close();
        return;
      }
      if (!trimmed) {
        ask();
        return;
      }

      const reply = await chat(trimmed);
      console.log(\`Assistant: \${reply}\\n\`);
      ask();
    });
  };

  ask();
}

main().catch(console.error);
`;
}

export function generateAgentSource(): string {
  return `/**
 * Guarded Anthropic Agent
 *
 * An AI agent powered by Claude with CoFounder guardrails.
 * Includes tool use with safety checks on every interaction.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createGuard, injectionDetector, piiDetector } from '@waymakerai/aicofounder-guard';

const client = new Anthropic();

// Set up guard pipeline
const guard = createGuard({
  detectors: [
    injectionDetector({ action: 'block', sensitivity: 'high' }),
    piiDetector({ action: 'redact', types: ['email', 'phone', 'ssn'] }),
  ],
});

// Define tools the agent can use
const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a given location.',
    input_schema: {
      type: 'object' as const,
      properties: {
        location: { type: 'string', description: 'City name, e.g. "San Francisco"' },
      },
      required: ['location'],
    },
  },
  {
    name: 'calculate',
    description: 'Perform a mathematical calculation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        expression: { type: 'string', description: 'Math expression, e.g. "15 * 847 / 100"' },
      },
      required: ['expression'],
    },
  },
];

// Tool implementations
function handleToolCall(name: string, input: Record<string, string>): string {
  switch (name) {
    case 'get_weather':
      // Simulated weather data
      return JSON.stringify({
        location: input.location,
        temperature: Math.round(60 + Math.random() * 30),
        unit: 'fahrenheit',
        condition: ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)],
      });
    case 'calculate':
      try {
        // Safe math evaluation (no eval)
        const result = Function(\`"use strict"; return (\${input.expression.replace(/[^0-9+\\-*/.() ]/g, '')})\`)();
        return String(result);
      } catch {
        return 'Error: Invalid expression';
      }
    default:
      return 'Unknown tool';
  }
}

async function runAgent(userMessage: string): Promise<string> {
  // Guard the input
  const inputCheck = await guard.check(userMessage);
  if (inputCheck.blocked) {
    return \`[BLOCKED] \${inputCheck.reason}\`;
  }

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: inputCheck.sanitized || userMessage },
  ];

  // Agent loop - keep running until no more tool calls
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: 'You are a helpful assistant with access to tools. Use them when appropriate.',
      tools,
      messages,
    });

    // Check if the model wants to use tools
    if (response.stop_reason === 'tool_use') {
      // Add assistant message
      messages.push({ role: 'assistant', content: response.content });

      // Process each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(\`  [Tool] \${block.name}(\${JSON.stringify(block.input)})\`);
          const result = handleToolCall(block.name, block.input as Record<string, string>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Extract text response
    const textBlocks = response.content.filter(b => b.type === 'text');
    const finalText = textBlocks.map(b => b.type === 'text' ? b.text : '').join('\\n');

    // Guard the output
    const outputCheck = await guard.check(finalText);
    return outputCheck.sanitized || finalText;
  }

  return 'Agent reached maximum iterations.';
}

async function main(): Promise<void> {
  console.log('CoFounder Guarded Agent');
  console.log('======================');
  console.log('An Anthropic Claude agent with guardrails.\\n');

  const tasks = [
    'What is the weather in San Francisco?',
    'Calculate 15% tip on a $127.50 dinner bill.',
    'What is the weather in Tokyo and what is 100 * 1.5?',
  ];

  for (const task of tasks) {
    console.log(\`Task: \${task}\`);
    const result = await runAgent(task);
    console.log(\`Result: \${result}\\n\`);
  }
}

main().catch(console.error);
`;
}

export function generateApiGuardSource(): string {
  return `/**
 * Express API with CoFounder Guardrails
 *
 * REST API with middleware that guards all AI interactions
 * against PII leakage, injection attacks, and cost overruns.
 */

import express from 'express';
import { createCoFounder } from '@waymakerai/aicofounder-core';
import { createGuard, piiDetector, injectionDetector } from '@waymakerai/aicofounder-guard';

const app = express();
app.use(express.json());

// Initialize CoFounder
const cofounder = createCoFounder({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Create guard instance
const guard = createGuard({
  detectors: [
    piiDetector({ action: 'redact', types: ['email', 'phone', 'ssn', 'credit-card'] }),
    injectionDetector({ action: 'block', sensitivity: 'medium' }),
  ],
});

// Guardrails middleware
function guardrailsMiddleware() {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> => {
    // Only guard requests with a message/prompt body
    const input = req.body?.message || req.body?.prompt;
    if (!input || typeof input !== 'string') {
      next();
      return;
    }

    try {
      const result = await guard.check(input);

      if (result.blocked) {
        res.status(400).json({
          error: 'Request blocked by guardrails',
          reason: result.reason,
          detectors: result.triggered,
        });
        return;
      }

      // Replace body with sanitized version
      if (result.sanitized) {
        if (req.body.message) req.body.message = result.sanitized;
        if (req.body.prompt) req.body.prompt = result.sanitized;
        req.body._guardrails = {
          sanitized: true,
          redacted: result.redactedTypes || [],
        };
      }

      next();
    } catch (err) {
      console.error('[Guardrails] Error:', err);
      next(); // Fail open - let request through if guard errors
    }
  };
}

// Apply guardrails to all /api routes
app.use('/api', guardrailsMiddleware());

// Chat endpoint
app.post('/api/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const response = await cofounder.chat({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message },
      ],
      model: model || 'gpt-4o-mini',
    });

    // Guard the output too
    const outputCheck = await guard.check(response.content);

    res.json({
      content: outputCheck.sanitized || response.content,
      usage: response.usage,
      guardrails: req.body._guardrails || { sanitized: false },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Completions endpoint
app.post('/api/complete', async (req: express.Request, res: express.Response) => {
  try {
    const { prompt, maxTokens } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const response = await cofounder.chat({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: maxTokens || 256,
    });

    res.json({
      text: response.content,
      usage: response.usage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Health check
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', guardrails: 'active', timestamp: new Date().toISOString() });
});

// Guard status endpoint
app.get('/api/guard/status', (_req: express.Request, res: express.Response) => {
  res.json({
    active: true,
    detectors: ['pii', 'injection'],
    config: {
      pii: { action: 'redact', types: ['email', 'phone', 'ssn', 'credit-card'] },
      injection: { action: 'block', sensitivity: 'medium' },
    },
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(\`CoFounder Guarded API running on http://localhost:\${PORT}\`);
  console.log('');
  console.log('Endpoints:');
  console.log('  POST /api/chat          Chat with guardrails');
  console.log('  POST /api/complete      Completion with guardrails');
  console.log('  GET  /api/guard/status   Guardrail status');
  console.log('  GET  /health            Health check');
  console.log('');
  console.log('Guardrails: PII redaction + injection blocking');
});
`;
}

export function generateFullStackSource(): string {
  // Return multiple files as a map
  return ''; // handled separately
}

export function generateFullStackFiles(projectPath: string): void {
  // src/app/layout.tsx
  const layout = `import type { Metadata } from 'next';
import { CoFounderProvider } from '@waymakerai/aicofounder-react';

export const metadata: Metadata = {
  title: 'CoFounder App',
  description: 'Next.js app with AI guardrails',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CoFounderProvider
          config={{
            guard: {
              detectors: ['pii', 'injection'],
              failOn: 'high',
            },
          }}
        >
          {children}
        </CoFounderProvider>
      </body>
    </html>
  );
}
`;

  // src/app/page.tsx
  const page = `'use client';

import { useState } from 'react';
import { useCoFounder } from '@waymakerai/aicofounder-react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { guard } = useCoFounder();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Client-side guard check
      const guardResult = await guard.check(userMessage);
      if (guardResult.blocked) {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: \`Blocked: \${guardResult.reason}\` },
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: guardResult.sanitized || userMessage }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'system', content: 'Error: Failed to get response' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>CoFounder Chat</h1>
      <p style={{ color: '#666' }}>Protected by AI guardrails</p>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, minHeight: 300 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              margin: '4px 0',
              borderRadius: 6,
              background: msg.role === 'user' ? '#e3f2fd' : msg.role === 'system' ? '#fff3e0' : '#f5f5f5',
            }}
          >
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div style={{ color: '#999', padding: 8 }}>Thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 16px', borderRadius: 6, background: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Send
        </button>
      </form>
    </main>
  );
}
`;

  // src/app/api/chat/route.ts
  const apiRoute = `import { NextResponse } from 'next/server';
import { createCoFounder } from '@waymakerai/aicofounder-core';
import { createGuard, piiDetector, injectionDetector } from '@waymakerai/aicofounder-guard';

const cofounder = createCoFounder({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

const guard = createGuard({
  detectors: [
    piiDetector({ action: 'redact', types: ['email', 'phone', 'ssn'] }),
    injectionDetector({ action: 'block', sensitivity: 'medium' }),
  ],
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Guard the input
    const inputCheck = await guard.check(message);
    if (inputCheck.blocked) {
      return NextResponse.json(
        { error: 'blocked', reason: inputCheck.reason },
        { status: 400 },
      );
    }

    const response = await cofounder.chat({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Never reveal personal information.' },
        { role: 'user', content: inputCheck.sanitized || message },
      ],
    });

    // Guard the output
    const outputCheck = await guard.check(response.content);

    return NextResponse.json({
      content: outputCheck.sanitized || response.content,
      usage: response.usage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
`;

  // next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`;

  // Write all files
  mkdirp(path.join(projectPath, 'src', 'app', 'api', 'chat'));

  fs.writeFileSync(path.join(projectPath, 'src', 'app', 'layout.tsx'), layout);
  fs.writeFileSync(path.join(projectPath, 'src', 'app', 'page.tsx'), page);
  fs.writeFileSync(path.join(projectPath, 'src', 'app', 'api', 'chat', 'route.ts'), apiRoute);
  fs.writeFileSync(path.join(projectPath, 'next.config.js'), nextConfig);
}

// ---- Utility ----

export function mkdirp(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent || '';
  if (ua.includes('pnpm')) return 'pnpm';
  if (ua.includes('yarn')) return 'yarn';
  if (ua.includes('bun')) return 'bun';
  return 'npm';
}

function isValidProjectName(name: string): boolean {
  // Simple validation: lowercase, no spaces, valid path characters
  return /^[a-z0-9@][a-z0-9._\-/]*$/.test(name);
}

// ---- Main scaffold function (exported for testing) ----

export function scaffoldProject(projectPath: string, options: CreateOptions): void {
  const { projectName, template } = options;

  // Create root directory
  mkdirp(projectPath);

  // Write common files
  fs.writeFileSync(path.join(projectPath, 'package.json'), generatePackageJson(projectName, template));
  fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), generateTsconfig(template));
  fs.writeFileSync(path.join(projectPath, '.cofounder.yml'), generateCoFounderConfig(template));
  fs.writeFileSync(path.join(projectPath, '.gitignore'), generateGitignore());
  fs.writeFileSync(path.join(projectPath, '.env.example'), generateEnvExample(template));
  fs.writeFileSync(path.join(projectPath, 'README.md'), generateReadme(projectName, template));

  // Generate template-specific source files
  if (template === 'full-stack') {
    generateFullStackFiles(projectPath);
  } else {
    mkdirp(path.join(projectPath, 'src'));
    let sourceContent: string;

    switch (template) {
      case 'chatbot':
        sourceContent = generateChatbotSource();
        break;
      case 'agent':
        sourceContent = generateAgentSource();
        break;
      case 'api-guard':
        sourceContent = generateApiGuardSource();
        break;
      default:
        sourceContent = generateChatbotSource();
    }

    fs.writeFileSync(path.join(projectPath, 'src', 'index.ts'), sourceContent);
  }
}

// ---- CLI entry point ----

async function main(): Promise<void> {
  const program = new Command()
    .name('create-aicofounder-app')
    .description('Create a new CoFounder AI application with guardrails')
    .version('2.0.0')
    .argument('[project-name]', 'Name of your project')
    .option('-t, --template <template>', 'Template: chatbot, agent, api-guard, full-stack')
    .option('--skip-install', 'Skip dependency installation')
    .option('--skip-git', 'Skip git initialization')
    .option('--npm', 'Use npm')
    .option('--pnpm', 'Use pnpm')
    .option('--yarn', 'Use yarn')
    .option('--bun', 'Use bun')
    .parse(process.argv);

  const opts = program.opts();
  let projectName = program.args[0];
  let template = opts.template as Template | undefined;

  // Interactive mode if missing args
  if (!projectName || !template) {
    const answers = await prompts([
      ...(!projectName
        ? [
            {
              type: 'text' as const,
              name: 'projectName',
              message: 'Project name:',
              initial: 'my-ai-app',
              validate: (v: string) => isValidProjectName(v) || 'Invalid name. Use lowercase letters, numbers, and hyphens.',
            },
          ]
        : []),
      ...(!template
        ? [
            {
              type: 'select' as const,
              name: 'template',
              message: 'Choose a template:',
              choices: Object.entries(TEMPLATES).map(([value, { name, description }]) => ({
                title: `${name} - ${description}`,
                value,
              })),
            },
          ]
        : []),
    ]);

    if (!projectName) projectName = answers.projectName;
    if (!template) template = answers.template;
  }

  if (!projectName) {
    console.error('Error: Project name is required.');
    process.exit(1);
  }

  if (!template || !TEMPLATES[template]) {
    console.error(`Error: Invalid template. Choose one of: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  // Determine package manager
  let packageManager: PackageManager = detectPackageManager();
  if (opts.pnpm) packageManager = 'pnpm';
  else if (opts.yarn) packageManager = 'yarn';
  else if (opts.bun) packageManager = 'bun';
  else if (opts.npm) packageManager = 'npm';

  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  const options: CreateOptions = {
    projectName,
    template,
    packageManager,
    skipInstall: !!opts.skipInstall,
    skipGit: !!opts.skipGit,
  };

  console.log(`\nCreating ${projectName} with template "${template}"...\n`);

  // Scaffold the project
  scaffoldProject(projectPath, options);

  // Initialize git
  if (!options.skipGit) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from create-aicofounder-app"', {
        cwd: projectPath,
        stdio: 'ignore',
      });
      console.log('Initialized git repository.');
    } catch {
      console.warn('Warning: Could not initialize git repository.');
    }
  }

  // Install dependencies
  if (!options.skipInstall) {
    try {
      const installCmd = packageManager === 'yarn' ? 'yarn' : `${packageManager} install`;
      console.log(`Installing dependencies with ${packageManager}...`);
      execSync(installCmd, { cwd: projectPath, stdio: 'inherit' });
    } catch {
      console.warn('Warning: Could not install dependencies. Run install manually.');
    }
  }

  // Success output
  const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;
  console.log(`\nDone! Created ${projectName} at ${projectPath}\n`);
  console.log('Next steps:\n');
  console.log(`  cd ${projectName}`);
  console.log('  cp .env.example .env');
  console.log('  # Add your API key to .env');
  console.log(`  ${runCmd} dev\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : String(err));
  if (typeof process !== 'undefined' && process.exitCode !== undefined) {
    process.exitCode = 1;
  }
});
