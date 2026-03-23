'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Bot, Shield, Layers, Factory, Wrench,
  GitBranch, Lock, AlertTriangle, Eye, DollarSign, ClipboardList,
  Gauge, FileCode, Radio, Send, CheckCircle2,
} from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-5xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Bot className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Agent Development</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Build AI agents with built-in guardrails using the <code className="px-1.5 py-0.5 bg-background-secondary rounded text-sm font-mono">@waymakerai/aicofounder-agent-sdk</code> package.
            Every agent runs user inputs and LLM outputs through a configurable pipeline of 7 interceptors:
            rate limiting, injection detection, PII protection, compliance enforcement, content filtering,
            cost tracking, and audit logging.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @waymakerai/aicofounder-agent-sdk
          </div>
        </motion.div>

        {/* ───── Creating a Guarded Agent ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Creating a Guarded Agent</h2>
              <p className="text-foreground-secondary">
                The <code className="font-mono text-sm">createGuardedAgent</code> function creates an agent with a full guard pipeline.
                Configure which interceptors to enable, then call <code className="font-mono text-sm">agent.run()</code> to process messages.
                The pipeline runs in this order: rate limit, injection, PII, compliance, content, cost, audit.
              </p>
            </div>
          </div>

          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createGuardedAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createGuardedAgent({
  // Required: which model to use
  model: 'claude-sonnet-4-20250514',

  // Optional: system instructions for the agent
  instructions: 'You are a helpful customer service agent for Acme Corp.',

  // Configure guards (or pass true for sensible defaults)
  guards: {
    // PII Protection
    pii: {
      mode: 'redact',             // 'detect' | 'redact' | 'block'
      onDetection: 'redact',      // What to do when PII is found
    },

    // Prompt Injection
    injection: {
      sensitivity: 'medium',      // 'low' | 'medium' | 'high'
      onDetection: 'block',       // 'block' | 'warn'
    },

    // Compliance (industry-specific rules)
    compliance: {
      frameworks: ['hipaa', 'gdpr'],
    },

    // Content Filtering
    contentFilter: true,           // Enable toxicity detection

    // Cost Tracking
    cost: {
      budgetPeriod: 'day',
      warningThreshold: 0.8,      // Warn at 80% of budget
    },

    // Audit Logging
    audit: {
      destination: 'file',        // 'console' | 'file' | 'custom'
      filePath: './audit.log',
      tamperProof: true,           // SHA-256 hash chain
      events: ['request', 'response', 'violation', 'cost', 'error'],
    },

    // Rate Limiting
    rateLimit: {
      maxRequests: 100,
      windowMs: 60_000,            // 1 minute window
    },
  },
});

// Run the agent
const result = await agent.run('I need to update my billing address to 123 Main St');

console.log(result.output);         // The AI response (PII redacted if found)
console.log(result.blocked);        // false (unless a guard blocked it)
console.log(result.violations);     // Any guard violations found
console.log(result.cost);           // Cost of this request
console.log(result.tokensUsed);     // { input: 150, output: 200 }
console.log(result.guardsApplied);  // ['rate-limit', 'injection', 'pii', 'compliance', ...]`}</pre>
          </div>
        </motion.div>

        {/* ───── Quick Setup ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="card mb-12"
        >
          <h2 className="text-2xl font-bold mb-4">Quick Setup: Pass guards: true</h2>
          <p className="text-foreground-secondary mb-4">
            Passing <code className="font-mono text-sm">guards: true</code> enables all 7 interceptors
            with sensible defaults. This is the fastest way to get a fully guarded agent.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Quick setup with all defaults:
// - PII: redact mode
// - Injection: medium sensitivity, block on detection
// - Cost: daily budget tracking with 80% warning
// - Content filter: enabled
// - Audit: console logging
// - Rate limit: 100 requests per minute
const agent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  guards: true,
});`}</pre>
          </div>
        </motion.div>

        {/* ───── 7 Interceptors ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">The 7 Interceptors</h2>
          <p className="text-foreground-secondary mb-6">
            Each interceptor implements <code className="font-mono text-sm">processInput()</code> and <code className="font-mono text-sm">processOutput()</code>.
            They run in a fixed order on every request and response. Any interceptor can block the request,
            transform the text, or add warnings.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: Gauge,
                num: 1,
                name: 'RateLimitInterceptor',
                description: 'Runs first to prevent abuse before any processing. Uses a sliding window to count requests. When the limit is exceeded, the request is blocked immediately with a "rate limit exceeded" violation.',
                config: `rateLimit: {
  maxRequests: 100,      // Max requests per window
  windowMs: 60_000,      // Window in milliseconds
}`,
              },
              {
                icon: AlertTriangle,
                num: 2,
                name: 'InjectionInterceptor',
                description: 'Scans input text for 40+ prompt injection patterns across 8 attack categories (direct, system_leak, jailbreak, role_manipulation, delimiter, encoding, context_manipulation, multi_language). Computes a 0-100 injection score and blocks if it exceeds the sensitivity threshold.',
                config: `injection: {
  sensitivity: 'medium', // 'low' (70) | 'medium' (45) | 'high' (25)
  onDetection: 'block',  // 'block' | 'warn'
}`,
              },
              {
                icon: Eye,
                num: 3,
                name: 'PIIInterceptor',
                description: 'Detects 14+ PII types (email, SSN, credit card, phone, IP, DOB, address, medical records, passport, driver\'s license) on both input and output. Can detect, redact, or block. Redacted text replaces original before reaching the LLM.',
                config: `pii: {
  mode: 'redact',        // 'detect' | 'redact' | 'block'
  onDetection: 'redact', // Action when PII is found
}`,
              },
              {
                icon: Lock,
                num: 4,
                name: 'ComplianceInterceptor',
                description: 'Enforces industry-specific compliance rules on AI outputs. Supports HIPAA (no medical advice, PHI protection), SEC/FINRA (financial disclaimers, no investment advice), GDPR, CCPA, and custom rules. Can block, redact, replace, or append disclaimers.',
                config: `compliance: {
  frameworks: ['hipaa', 'gdpr', 'sec'],
  // Or pass custom ComplianceRule[] array
}`,
              },
              {
                icon: FileCode,
                num: 5,
                name: 'ContentInterceptor',
                description: 'Toxicity detection across 7 categories: profanity, hate speech, violence, self-harm, sexual content, harassment, and spam. Critical and high severity findings block by default.',
                config: `contentFilter: true,
// Or configure with specific categories and thresholds`,
              },
              {
                icon: DollarSign,
                num: 6,
                name: 'CostInterceptor',
                description: 'Tracks token usage and estimated cost per request. Records spending against a per-period budget. When the budget is exceeded, it can block further requests or issue warnings.',
                config: `cost: {
  budgetPeriod: 'day',       // 'hour' | 'day' | 'week' | 'month'
  warningThreshold: 0.8,     // Warn at 80% of budget
  // Budget amount is tracked cumulatively
}`,
              },
              {
                icon: ClipboardList,
                num: 7,
                name: 'AuditInterceptor',
                description: 'Logs every event (request, response, tool_call, violation, cost, error) with timestamps, model info, and violation details. Supports console, file, and custom destinations. Optional SHA-256 hash chaining for tamper-proof audit trails.',
                config: `audit: {
  destination: 'file',        // 'console' | 'file' | 'custom'
  filePath: './audit.log',
  events: ['request', 'response', 'violation', 'cost', 'error'],
  includePayload: false,      // Include text (up to 1000 chars)
  tamperProof: true,          // SHA-256 hash chain
}`,
              },
            ].map((interceptor) => (
              <div key={interceptor.name} className="card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white text-xs font-bold">
                      {interceptor.num}
                    </span>
                    <div className="p-2 rounded-lg bg-background-secondary">
                      <interceptor.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-mono">{interceptor.name}</h3>
                    <p className="text-foreground-secondary text-sm mt-1">{interceptor.description}</p>
                  </div>
                </div>
                <div className="code-block font-mono text-sm overflow-x-auto">
                  <pre>{interceptor.config}</pre>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ───── Pre-built Factories ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Factory className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Pre-built Agent Factories</h2>
          </div>
          <p className="text-foreground-secondary mb-6">
            Four factory functions create agents with industry-specific guard configurations.
            Each factory pre-configures the interceptors appropriate for its compliance domain.
          </p>

          <div className="space-y-8">
            {[
              {
                name: 'createHIPAAAgent',
                title: 'HIPAA Healthcare Agent',
                description: 'Pre-configured for healthcare applications. Enables PII redaction (focusing on PHI: SSN, medical records, date of birth), HIPAA compliance rules (no medical advice, PHI protection), audit logging with tamper-proof hashing, and rate limiting.',
                example: `import { createHIPAAAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createHIPAAAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: \`You are a healthcare information assistant. You provide
general health education but never diagnose conditions or recommend treatments.
Always direct patients to consult their healthcare provider.\`,
});

const result = await agent.run('What are the symptoms of diabetes?');
// Output includes health education without medical advice
// PHI is automatically redacted from inputs and outputs
// All interactions are audit-logged`,
              },
              {
                name: 'createFinancialAgent',
                title: 'Financial Services Agent',
                description: 'Pre-configured for financial applications. Enables SEC/FINRA compliance (financial disclaimers, no specific investment advice), cost controls with strict budget limits, PII protection for financial data, and comprehensive audit logging.',
                example: `import { createFinancialAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createFinancialAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: \`You provide general financial education and market analysis.
You never recommend specific investments or provide personalized advice.\`,
});

const result = await agent.run('Tell me about index fund investing');
// Financial disclaimers automatically appended
// Specific buy/sell recommendations blocked`,
              },
              {
                name: 'createGDPRAgent',
                title: 'GDPR Compliance Agent',
                description: 'Pre-configured for EU data protection. Enables GDPR PII protection (email, phone, address, IP address redaction), data minimization, consent-aware processing, and audit logging for accountability.',
                example: `import { createGDPRAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createGDPRAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a customer support assistant operating under GDPR.',
});

const result = await agent.run('My email is hans@example.de, please look up my order');
// Email is redacted before reaching the LLM
// Output is checked for any PII leakage`,
              },
              {
                name: 'createSafeAgent',
                title: 'General Safety Agent',
                description: 'Maximum protection for general-purpose applications. Enables all 7 interceptors: PII redaction, injection blocking (high sensitivity), toxicity filtering, content filtering, cost tracking, rate limiting (100 req/min), and audit logging.',
                example: `import { createSafeAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createSafeAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a helpful assistant.',
});

// Full protection out of the box
const result = await agent.run(userInput);

// Check the guard report
const report = agent.getGuardReport();
console.log(report.totalRequests);
console.log(report.injectionAttempts);
console.log(report.totalCost);`,
              },
            ].map((factory) => (
              <div key={factory.name} className="card">
                <h3 className="text-lg font-bold mb-1">{factory.title}</h3>
                <code className="text-sm font-mono text-gradient-from">{factory.name}(config)</code>
                <p className="text-foreground-secondary text-sm mt-2 mb-4">{factory.description}</p>
                <div className="code-block font-mono text-sm overflow-x-auto">
                  <pre>{factory.example}</pre>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ───── Custom Pipeline ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Custom Guard Pipeline</h2>
              <p className="text-foreground-secondary">
                For advanced use cases, build a custom pipeline with individual interceptors.
                This gives you full control over the order and configuration of each interceptor.
              </p>
            </div>
          </div>

          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import {
  GuardPipeline,
  PIIInterceptor,
  InjectionInterceptor,
  CostInterceptor,
  AuditInterceptor,
} from '@waymakerai/aicofounder-agent-sdk';

// Build a custom pipeline
const pipeline = new GuardPipeline();

// Add interceptors in your preferred order
pipeline.use(new InjectionInterceptor({ sensitivity: 'high', onDetection: 'block' }));
pipeline.use(new PIIInterceptor({ mode: 'redact', onDetection: 'redact' }));
pipeline.use(new CostInterceptor({ budgetPeriod: 'day', warningThreshold: 0.8 }));
pipeline.use(new AuditInterceptor({
  destination: 'file',
  filePath: './custom-audit.log',
  tamperProof: true,
}));

// Process input
const inputResult = await pipeline.processInput(userMessage, { model: 'claude-sonnet-4-20250514' });

if (inputResult.blocked) {
  console.log('Blocked:', inputResult.reason);
} else {
  const safeInput = inputResult.transformed || userMessage;
  // Send safeInput to your LLM
  const aiResponse = await callYourLLM(safeInput);

  // Process output
  const outputResult = await pipeline.processOutput(aiResponse, { model: 'claude-sonnet-4-20250514' });
  const finalOutput = outputResult.transformed || aiResponse;
}

// Get pipeline stats
console.log(pipeline.stats);
console.log(pipeline.getViolations());
console.log(pipeline.getInterceptorNames());`}</pre>
          </div>
        </motion.div>

        {/* ───── Tool Authorization ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Tool Authorization</h2>
              <p className="text-foreground-secondary">
                Wrap individual tool definitions with guards using <code className="font-mono text-sm">guardTool()</code>.
                The tool's handler is intercepted so that tool inputs are checked before execution
                and tool outputs are checked after execution.
              </p>
            </div>
          </div>

          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { guardTool } from '@waymakerai/aicofounder-agent-sdk';

// Define a tool
const databaseTool = {
  name: 'query_database',
  description: 'Query the customer database',
  parameters: {
    sql: { type: 'string', description: 'SQL query to execute' },
  },
  handler: async ({ sql }) => {
    return await db.query(sql);
  },
};

// Wrap it with guards
const guardedTool = guardTool(databaseTool, {
  pii: { mode: 'redact', onDetection: 'redact' },
  injection: { sensitivity: 'high', onDetection: 'block' },
  audit: { destination: 'file', filePath: './tool-audit.log' },
});

// The guarded tool will:
// 1. Check the SQL input for injection patterns
// 2. Check input/output for PII and redact
// 3. Log the tool call to the audit trail`}</pre>
          </div>
        </motion.div>

        {/* ───── Multi-Agent Orchestration ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Multi-Agent Orchestration</h2>
              <p className="text-foreground-secondary">
                The <code className="font-mono text-sm">@waymakerai/aicofounder-agents</code> package
                provides typed messaging, pub/sub channels, and request/response patterns for
                coordinating multiple agents. Each agent can have its own guard configuration.
              </p>
            </div>
          </div>

          <div className="code-block font-mono text-sm overflow-x-auto mb-6">
            <pre>{`import { createGuardedAgent } from '@waymakerai/aicofounder-agent-sdk';
import { createMessageBroker, createChannel, createRequestChannel } from '@waymakerai/aicofounder-agents';

// Create specialized agents with different guard configs
const triageAgent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You classify incoming support requests by urgency and topic.',
  guards: { pii: { mode: 'redact', onDetection: 'redact' }, injection: { sensitivity: 'high', onDetection: 'block' } },
});

const healthAgent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You handle health-related support inquiries.',
  guards: { pii: { mode: 'redact', onDetection: 'redact' }, compliance: { frameworks: ['hipaa'] } },
});

const financeAgent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You handle billing and financial inquiries.',
  guards: { pii: { mode: 'redact', onDetection: 'redact' }, compliance: { frameworks: ['sec'] } },
});

// Set up message broker for inter-agent communication
const broker = createMessageBroker({ deliveryGuarantee: 'at-least-once' });

// Create typed channels
const taskChannel = createChannel<{ query: string; topic: string; urgency: string }>({
  name: 'support-tasks',
  type: 'topic',
});

// Request/response channel for synchronous coordination
const classifyChannel = createRequestChannel<
  { query: string },
  { topic: string; urgency: string }
>({ name: 'classify', timeout: 5000 });

// Triage agent classifies requests
broker.registerHandler(classifyChannel, async (request) => {
  const result = await triageAgent.run(
    \`Classify this support request: "\${request.payload.query}". Return JSON: { "topic": "health"|"finance"|"general", "urgency": "low"|"medium"|"high" }\`
  );
  return JSON.parse(result.output);
});

// Route to specialized agents
async function handleSupportRequest(query: string) {
  // Step 1: Classify
  const classification = await broker.request(classifyChannel, { query });

  // Step 2: Route to the right agent
  const agent = classification.topic === 'health' ? healthAgent
    : classification.topic === 'finance' ? financeAgent
    : triageAgent;

  // Step 3: Run with appropriate guards
  return await agent.run(query);
}`}</pre>
          </div>
        </motion.div>

        {/* ───── Reporting ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Guard Reports and Cost Tracking</h2>
              <p className="text-foreground-secondary">
                Every guarded agent tracks its activity. Use <code className="font-mono text-sm">getGuardReport()</code> for
                a real-time summary, or generate formatted reports for compliance audits.
              </p>
            </div>
          </div>

          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import {
  createGuardedAgent,
  generateCostReport,
  formatCostReport,
  generateComplianceReport,
  formatComplianceReport,
} from '@waymakerai/aicofounder-agent-sdk';

const agent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  guards: true,
});

// After running the agent multiple times...
await agent.run('First message');
await agent.run('Second message');

// Get the guard report
const report = agent.getGuardReport();
console.log(report.totalRequests);           // 2
console.log(report.totalCost);               // $0.003
console.log(report.ppiDetections);           // 0
console.log(report.injectionAttempts);       // 0
console.log(report.complianceViolations);    // 0
console.log(report.contentFiltered);         // 0
console.log(report.rateLimitHits);           // 0
console.log(report.auditEvents);             // 4 (2 requests + 2 responses)

// Generate formatted reports
const costData = generateCostReport(agent);
console.log(formatCostReport(costData));
// Outputs: per-model token usage, spending, and budget remaining

const complianceData = generateComplianceReport(agent);
console.log(formatComplianceReport(complianceData));
// Outputs: violations by framework, severity breakdown`}</pre>
          </div>
        </motion.div>

        {/* ───── Supported Models ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-12"
        >
          <h2 className="text-2xl font-bold mb-4">Supported Models</h2>
          <p className="text-foreground-secondary mb-4">
            The agent-sdk uses the Anthropic SDK as an optional peer dependency for LLM calls.
            If the Anthropic SDK is not installed, the agent processes all guards and returns the
            guarded input ready for any LLM provider.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Claude Sonnet 4',
              'Claude Opus 4',
              'Claude 3.5 Sonnet',
              'Claude 3 Opus',
              'GPT-4o',
              'GPT-4o Mini',
              'GPT-4 Turbo',
              'Gemini 2.0 Flash',
              'Gemini 1.5 Pro',
              'Llama 3.1',
              'Mistral Large',
              'Any custom model',
            ].map((model) => (
              <div
                key={model}
                className="p-3 rounded-lg bg-background-secondary text-center text-sm font-medium"
              >
                {model}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ───── Best Practices ───── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Agent Development Best Practices</h2>
          </div>
          <div className="space-y-3">
            {[
              'Start with a factory (createSafeAgent, createHIPAAAgent) and customize from there.',
              'Always enable audit logging in production with tamperProof: true for compliance.',
              'Use high injection sensitivity for public-facing agents; medium for internal tools.',
              'Set budget limits before deploying. Start conservative and increase based on usage.',
              'Guard tools individually with guardTool() for tools that access sensitive data.',
              'Use the compliance interceptor for regulated industries, not just the basic toxicity filter.',
              'Call getGuardReport() periodically to monitor guard activity and catch anomalies.',
              'In multi-agent systems, give each agent the minimum guards it needs for its role.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground-secondary">{tip}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/security"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Security
          </Link>
          <Link
            href="/docs/packages"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Package Catalog
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
