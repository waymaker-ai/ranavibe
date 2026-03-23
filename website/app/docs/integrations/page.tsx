'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Link2, Bot, Shield, Blocks, Server, Cloud, Cpu, Plug } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Integrations</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Connect CoFounder with popular AI frameworks, web frameworks, cloud providers, and
            development tools. Each integration includes full code examples.
          </p>
        </motion.div>

        {/* Anthropic Agent SDK */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Bot className="mr-3 h-6 w-6 text-gradient-from" />
            Anthropic Agent SDK
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-agent-sdk</code> package
            provides an audit interceptor that wraps Anthropic Agent SDK calls with CoFounder guardrails,
            cost tracking, and compliance checks.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { AuditInterceptor } from '@waymakerai/aicofounder-agent-sdk';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Create interceptor with guardrails
const interceptor = new AuditInterceptor({
  pii: 'redact',
  injection: { sensitivity: 'high', action: 'block' },
  compliance: ['hipaa', 'gdpr'],
  budget: { limit: 50, period: 'day' },
  audit: { enabled: true, level: 'verbose' },
});

// Wrap your Anthropic calls
const response = await interceptor.intercept(
  () => client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: userMessage }],
  }),
  { userId: 'user-123', channel: 'api' }
);

// Access the response and audit data
console.log(response.result);          // Anthropic API response
console.log(response.guardResult);     // PII, injection, toxicity findings
console.log(response.cost);           // Cost tracking info
console.log(response.auditEntry);     // Full audit log entry`}</pre>
          </div>
        </motion.section>

        {/* OpenClaw */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            OpenClaw Integration
          </h2>
          <p className="text-foreground-secondary mb-4">
            OpenClaw is an open standard for AI agent guardrails.
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-openclaw</code> package
            provides a full OpenClaw skill, a bridge for Express/Fastify middleware, and hook-based lifecycle
            integration for any agent framework.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">OpenClaw Skill</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  pii: 'redact',
  injectionSensitivity: 'high',
  injectionAction: 'block',
  toxicity: 'warn',
  compliance: ['hipaa', 'gdpr'],
  budget: { limit: 100, period: 'day', warningThreshold: 0.8, onExceeded: 'block' },
  model: 'claude-sonnet-4-20250514',
  audit: { enabled: true, level: 'standard' },
  guardToolCalls: true,
  allowedChannels: ['web', 'api', 'slack'],
});

// Skill manifest for registration
console.log(skill.manifest);
// { name: 'cofounder-guard', version: '1.0.0', capabilities: [...] }

// Use lifecycle hooks
const beforeResult = await skill.hooks.beforeMessage(
  { role: 'user', content: 'Process my order for card 4111-1111-1111-1111' },
  {
    user: { id: 'user-1', name: 'Alice', role: 'customer' },
    channel: 'web',
    sessionId: 'sess-abc',
  }
);

if (!beforeResult.proceed) {
  console.log(beforeResult.userMessage);  // Blocked message
  console.log(beforeResult.guardResult.piiFindings);
}

// Guard tool calls
const toolResult = await skill.hooks.beforeToolCall(
  'send_email',
  { to: 'user@example.com', body: 'Your SSN is 123-45-6789' },
  { user: { id: 'user-1' } }
);`}</pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">OpenClaw Bridge (Express/Fastify Middleware)</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawBridge } from '@waymakerai/aicofounder-openclaw';
import express from 'express';

const app = express();
app.use(express.json());

// Create the bridge with guard options
const bridge = createOpenClawBridge({
  guardOptions: {
    pii: 'redact',
    injectionSensitivity: 'high',
    toxicity: 'block',
    compliance: ['hipaa'],
  },
  dashboardEnabled: true,
  auditEnabled: true,
  webhookUrl: 'https://your-app.com/webhooks/guard',
});

// Use as Express middleware - guards all requests
app.use('/api/ai', bridge.middleware());

// Or guard specific routes
app.post('/api/chat', bridge.guard(), async (req, res) => {
  // req.guardResult contains PII/injection/toxicity findings
  // req.body.content is redacted if PII mode is 'redact'
  const response = await generateAIResponse(req.body.content);
  res.json({ response });
});

// Dashboard endpoint (serves metrics JSON)
app.get('/api/guard/dashboard', bridge.dashboardHandler());

// Reports endpoint
app.get('/api/guard/report', bridge.reportHandler());`}</pre>
          </div>
        </motion.section>

        {/* LangChain */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Blocks className="mr-3 h-6 w-6 text-gradient-from" />
            LangChain Adapter
          </h2>
          <p className="text-foreground-secondary mb-4">
            Wrap LangChain chains and agents with CoFounder guardrails using
            the <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-langchain</code> package.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { CoFounderLangChainGuard } from '@waymakerai/aicofounder-langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({ modelName: 'gpt-4o' });

// Wrap LangChain model with CoFounder guards
const guard = new CoFounderLangChainGuard({
  pii: 'redact',
  injection: { sensitivity: 'high', action: 'block' },
  toxicity: 'block',
  compliance: ['gdpr'],
  costTracking: true,
});

// Guard individual calls
const result = await guard.call(model, {
  messages: [new HumanMessage('Summarize this document')],
});

console.log(result.response);       // LangChain response
console.log(result.guardReport);    // Guard findings
console.log(result.cost);           // Cost tracking

// Or use as a LangChain callback handler
const guardCallback = guard.asCallbackHandler();

const response = await model.invoke(
  [new HumanMessage('Hello')],
  { callbacks: [guardCallback] }
);

// Access guard results from the callback
console.log(guardCallback.lastResult);`}</pre>
          </div>
        </motion.section>

        {/* CrewAI */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Blocks className="mr-3 h-6 w-6 text-gradient-from" />
            CrewAI Adapter
          </h2>
          <p className="text-foreground-secondary mb-4">
            Add guardrails to CrewAI multi-agent workflows with
            the <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-crewai</code> package.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { CoFounderCrewGuard } from '@waymakerai/aicofounder-crewai';

const guard = new CoFounderCrewGuard({
  pii: 'redact',
  injection: { sensitivity: 'medium' },
  compliance: ['hipaa'],
  budget: { limit: 10, period: 'hour' },
});

// Wrap CrewAI agent execution
const result = await guard.guardAgent(myAgent, {
  task: 'Research patient outcomes for treatment protocol',
  context: { userId: 'doctor-1', channel: 'api' },
});

// Guard entire crew execution
const crewResult = await guard.guardCrew(myCrew, {
  inputs: { topic: 'quarterly financial analysis' },
  guardInterAgentMessages: true,  // Guard messages between agents
});

console.log(crewResult.output);          // Crew output
console.log(crewResult.totalCost);       // Aggregated cost
console.log(crewResult.guardEvents);     // All guard events from execution`}</pre>
          </div>
        </motion.section>

        {/* Express/Fastify Middleware */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Server className="mr-3 h-6 w-6 text-gradient-from" />
            Express &amp; Fastify Middleware
          </h2>
          <p className="text-foreground-secondary mb-4">
            Use CoFounder as middleware in any Node.js web framework. The guard middleware
            intercepts requests, checks for PII and injection attacks, and optionally blocks unsafe content.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Express middleware
import express from 'express';
import { createGuardMiddleware } from '@waymakerai/aicofounder-openclaw';

const app = express();
app.use(express.json());

const guardMiddleware = createGuardMiddleware({
  pii: 'redact',
  injectionSensitivity: 'high',
  injectionAction: 'block',
  toxicity: 'block',
});

app.post('/api/chat', guardMiddleware, async (req, res) => {
  // req.body.content has been redacted if PII was found
  // If injection was detected, a 403 was already sent
  const aiResponse = await generateResponse(req.body.content);
  res.json({ response: aiResponse });
});

// ─── Fastify ─────────────────────────────────────────────────
import Fastify from 'fastify';
import { createFastifyPlugin } from '@waymakerai/aicofounder-openclaw';

const fastify = Fastify();

await fastify.register(createFastifyPlugin({
  pii: 'redact',
  injectionSensitivity: 'high',
  toxicity: 'block',
  routes: ['/api/chat', '/api/completion'],  // Only guard these routes
}));

fastify.post('/api/chat', async (request, reply) => {
  const { content } = request.body as { content: string };
  const response = await generateResponse(content);
  return { response };
});`}</pre>
          </div>
        </motion.section>

        {/* Next.js */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Server className="mr-3 h-6 w-6 text-gradient-from" />
            Next.js API Routes
          </h2>
          <p className="text-foreground-secondary mb-4">
            Use CoFounder guardrails in Next.js App Router API routes and Server Actions.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  pii: 'redact',
  injectionSensitivity: 'high',
  injectionAction: 'block',
  toxicity: 'block',
  compliance: ['gdpr'],
  budget: { limit: 50, period: 'day', onExceeded: 'block' },
});

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  // Guard the input
  const guardResult = await skill.hooks.beforeMessage(
    { role: 'user', content: message },
    { user: { id: userId }, channel: 'web' }
  );

  if (!guardResult.proceed) {
    return NextResponse.json(
      { error: guardResult.userMessage || 'Message blocked by safety filter' },
      { status: 403 }
    );
  }

  // Use redacted content if PII was found
  const safeMessage = guardResult.modifiedContent || message;

  // Generate AI response
  const aiResponse = await generateResponse(safeMessage);

  // Guard the output
  const outputGuard = await skill.hooks.afterMessage(
    { role: 'assistant', content: aiResponse },
    { user: { id: userId }, channel: 'web' }
  );

  return NextResponse.json({
    response: outputGuard.modifiedContent || aiResponse,
    warnings: outputGuard.guardResult.violations.length > 0
      ? ['Response was modified for safety']
      : [],
  });
}`}</pre>
          </div>
        </motion.section>

        {/* Vercel Edge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Cloud className="mr-3 h-6 w-6 text-gradient-from" />
            Vercel Edge Functions
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder&apos;s guard system is lightweight and works in edge runtimes. Use it in Vercel
            Edge Functions for low-latency AI guardrails at the edge.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// app/api/chat/route.ts
import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

// Edge runtime
export const runtime = 'edge';

const skill = createOpenClawSkill({
  pii: 'redact',
  injectionSensitivity: 'high',
  injectionAction: 'block',
  toxicity: 'block',
});

export async function POST(request: Request) {
  const { message } = await request.json();

  const guardResult = await skill.hooks.beforeMessage(
    { role: 'user', content: message },
    { channel: 'web' }
  );

  if (!guardResult.proceed) {
    return new Response(
      JSON.stringify({ error: 'Blocked by safety filter' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Forward safe content to your AI backend
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: guardResult.modifiedContent || message }],
    }),
  });

  return response;
}`}</pre>
          </div>
        </motion.section>

        {/* AWS Bedrock */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Cpu className="mr-3 h-6 w-6 text-gradient-from" />
            AWS Bedrock Adapter
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-adapters</code> package
            includes a Bedrock adapter that normalizes AWS Bedrock API calls to CoFounder&apos;s
            standard interface with built-in cost tracking.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { BedrockAdapter } from '@waymakerai/aicofounder-adapters';

const bedrock = new BedrockAdapter({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Chat completion (normalized API)
const result = await bedrock.chat({
  model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  messages: [
    { role: 'user', content: 'Explain quantum computing briefly' },
  ],
  maxTokens: 1024,
  temperature: 0.7,
});

console.log(result.content);      // Response text
console.log(result.usage);        // { inputTokens, outputTokens, totalTokens }
console.log(result.cost);         // Calculated cost in USD

// Streaming
const stream = await bedrock.stream({
  model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  messages: [{ role: 'user', content: 'Tell me a story' }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

// Use with CoFounder guard
import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({ pii: 'redact', injectionSensitivity: 'high' });

// Guard input, then call Bedrock
const guardResult = await skill.hooks.beforeMessage(
  { role: 'user', content: userInput },
  { user: { id: 'user-1' } }
);

if (guardResult.proceed) {
  const response = await bedrock.chat({
    model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages: [{ role: 'user', content: guardResult.modifiedContent || userInput }],
  });
}`}</pre>
          </div>
        </motion.section>

        {/* MCP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Plug className="mr-3 h-6 w-6 text-gradient-from" />
            MCP (Model Context Protocol)
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder includes both an MCP server (for use with Claude Desktop, Cursor, and other MCP
            clients) and an MCP client for connecting to external tool servers.
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-mcp</code> and <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-mcp-server</code> packages
            provide both sides.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">MCP Server (for Claude Desktop / Cursor)</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { MCPServer } from '@waymakerai/aicofounder-mcp';

const server = new MCPServer({
  name: 'cofounder-guard',
  version: '1.0.0',
});

// Register guard tools that Claude Desktop can call
server.addTool({
  name: 'guard_check',
  description: 'Check text for PII, injection attacks, and toxicity',
  inputSchema: {
    text: { type: 'string', description: 'Text to check' },
    mode: { type: 'string', description: 'detect | redact | block' },
  },
  handler: async ({ text, mode }) => {
    const skill = createOpenClawSkill({ pii: mode || 'detect' });
    const result = await skill.hooks.beforeMessage(
      { role: 'user', content: text },
      {}
    );
    return result.guardResult;
  },
});

server.addTool({
  name: 'compliance_check',
  description: 'Check AI output for compliance violations',
  inputSchema: {
    input: { type: 'string' },
    output: { type: 'string' },
    frameworks: { type: 'array', items: { type: 'string' } },
  },
  handler: async ({ input, output, frameworks }) => {
    // Run compliance check
    const enforcer = new ComplianceEnforcer({ enableAllPresets: true });
    return await enforcer.enforce(input, output, { input, output });
  },
});

// Expose resources
server.addResource({
  name: 'guard_report',
  description: 'Current guard statistics and metrics',
  handler: async () => skill.getReport(),
});

// Start server (stdio transport for Claude Desktop)
await server.start();`}</pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">Claude Desktop Configuration</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// claude_desktop_config.json
{
  "mcpServers": {
    "cofounder-guard": {
      "command": "npx",
      "args": ["@waymakerai/aicofounder-mcp-server"],
      "env": {
        "COFOUNDER_PII_MODE": "redact",
        "COFOUNDER_INJECTION_SENSITIVITY": "high"
      }
    }
  }
}

// Cursor .cursor/mcp.json
{
  "mcpServers": {
    "cofounder-guard": {
      "command": "npx",
      "args": ["@waymakerai/aicofounder-mcp-server"],
      "env": {
        "COFOUNDER_PII_MODE": "detect"
      }
    }
  }
}`}</pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">MCP Client (Connecting to External Servers)</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { MCPClient } from '@waymakerai/aicofounder-mcp';

const client = new MCPClient({
  serverUrl: 'http://localhost:3001',
  capabilities: ['tools', 'resources'],
});

// List available tools from the server
const tools = await client.listTools();
console.log(tools);
// [{ name: 'search', description: 'Search the web', inputSchema: {...} }]

// Call a tool on the remote server
const result = await client.callTool('search', {
  query: 'CoFounder AI framework',
});

// List and read resources
const resources = await client.listResources();
const config = await client.readResource('app-config');`}</pre>
          </div>
        </motion.section>

        {/* All Integrations Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">All Supported Integrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Anthropic SDK', 'OpenAI SDK', 'LangChain', 'CrewAI',
              'AWS Bedrock', 'Azure OpenAI', 'Google Vertex', 'Hugging Face',
              'Express.js', 'Fastify', 'Next.js', 'Vercel Edge',
              'MCP Protocol', 'Supabase', 'Sentry', 'W&B',
              'Datadog', 'Prometheus', 'Grafana', 'Slack',
            ].map((name) => (
              <div
                key={name}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium text-sm"
              >
                {name}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/configuration"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Configuration
          </Link>
          <Link
            href="/docs/testing"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Testing Guide
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
