'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Shield, Scale, Bot, Database, Terminal,
  Building2, Layers, Sparkles, Brain, Search, Zap, Activity,
  FlaskConical, Puzzle, Code2, GitBranch, RefreshCw, Radio,
  Package, FileCode, Eye, DollarSign, Lock, Cpu,
} from 'lucide-react';

interface PackageInfo {
  name: string;
  shortName: string;
  icon: any;
  description: string;
  install: string;
  isNew?: boolean;
  layer: string;
  keyExports: string[];
  example: string;
  deps?: string[];
}

const layers = [
  {
    name: 'Core',
    description: 'Foundation packages. Start here.',
    color: 'from-blue-500 to-cyan-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-guard',
        shortName: 'guard',
        icon: Shield,
        description: 'PII detection, prompt injection blocking, toxicity filtering, budget enforcement, rate limiting, and model gating. The primary security package.',
        install: 'npm install @waymakerai/aicofounder-guard',
        isNew: true,
        layer: 'Core',
        keyExports: ['createGuard', 'guard', 'detectPII', 'redactPII', 'detectInjection', 'detectToxicity', 'BudgetEnforcer', 'RateLimiter', 'ModelGate'],
        example: `import { createGuard } from '@waymakerai/aicofounder-guard';

const guard = createGuard({
  pii: 'redact',
  injection: 'block',
  toxicity: 'block',
  budget: { limit: 50, period: 'day', warningAt: 0.8, action: 'block' },
});

const result = guard.check(userInput, { model: 'claude-sonnet-4-20250514' });
if (result.blocked) {
  console.log('Blocked:', result.reason);
} else {
  const safeInput = result.redacted || userInput;
  // Send safeInput to LLM
}`,
      },
      {
        name: '@waymakerai/aicofounder-core',
        shortName: 'core',
        icon: Zap,
        description: 'Main SDK client with multi-provider support, cost tracking, caching, retries, rate limiting, and fallbacks. Supports Anthropic, OpenAI, and Google.',
        install: 'npm install @waymakerai/aicofounder-core',
        layer: 'Core',
        keyExports: ['createCoFounder', 'CostTracker', 'withRetry', 'RateLimiter', 'ProviderManager', 'CacheManager'],
        example: `import { createCoFounder } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    openai: process.env.OPENAI_API_KEY!,
  },
  cache: true,
  optimize: 'cost',
});

const response = await cofounder.chat('Explain quantum computing');`,
      },
      {
        name: '@waymakerai/aicofounder-policies',
        shortName: 'policies',
        icon: Scale,
        description: 'Declarative policy engine with 9 industry presets (HIPAA, GDPR, CCPA, SEC, PCI, FERPA, SOX, safety, enterprise). Composable rules for PII, content, models, costs, and data retention.',
        install: 'npm install @waymakerai/aicofounder-policies',
        isNew: true,
        layer: 'Core',
        keyExports: ['PolicyEngine', 'compose', 'evaluatePolicy', 'hipaaPolicy', 'gdprPolicy', 'secPolicy', 'PolicyBuilder', 'ALL_PII_PATTERNS'],
        example: `import { PolicyEngine, hipaaPolicy, gdprPolicy, compose } from '@waymakerai/aicofounder-policies';

const policy = compose([hipaaPolicy, gdprPolicy], 'strict');
const engine = new PolicyEngine([policy]);

const result = engine.evaluate(text, { model: 'claude-sonnet-4-20250514', direction: 'output' });
console.log(result.allowed, result.violations);`,
        deps: [],
      },
    ] as PackageInfo[],
  },
  {
    name: 'Security & Compliance',
    description: 'Enterprise compliance, guidelines, and content control.',
    color: 'from-red-500 to-orange-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-compliance',
        shortName: 'compliance',
        icon: Lock,
        description: '9 preset compliance rules for HIPAA, SEC/FINRA, GDPR, CCPA, legal, safety, and security. Rules can block, redact, replace, or append disclaimers to AI output.',
        install: 'npm install @waymakerai/aicofounder-compliance',
        isNew: true,
        layer: 'Security',
        keyExports: ['ComplianceEnforcer', 'createComplianceEnforcer', 'PresetRules', 'createComplianceRule', 'detectPII', 'redactPII'],
        example: `import { ComplianceEnforcer, PresetRules } from '@waymakerai/aicofounder-compliance';

const enforcer = new ComplianceEnforcer({
  rules: [PresetRules.hipaaNoMedicalAdvice(), PresetRules.secFinancialDisclaimer()],
  strictMode: true,
});

const result = await enforcer.enforce(userInput, aiOutput, { topic: 'medical' });
if (!result.compliant) {
  console.log('Violations:', result.violations);
}`,
      },
      {
        name: '@waymakerai/aicofounder-guidelines',
        shortName: 'guidelines',
        icon: FileCode,
        description: 'Dynamic behavioral control with context-aware rules. Define guidelines that match based on topic, user role, or custom conditions. Includes 8+ presets.',
        install: 'npm install @waymakerai/aicofounder-guidelines',
        isNew: true,
        layer: 'Security',
        keyExports: ['GuidelineManager', 'createGuideline', 'PresetGuidelines', 'Conditions'],
        example: `import { GuidelineManager, PresetGuidelines } from '@waymakerai/aicofounder-guidelines';

const manager = new GuidelineManager();
await manager.addGuideline(PresetGuidelines.noMedicalAdvice());

const matched = await manager.match({ topic: 'medical', message: 'I have a headache' });`,
      },
      {
        name: '@waymakerai/aicofounder-soc2',
        shortName: 'soc2',
        icon: Building2,
        description: 'SOC2 audit evidence collection and report generation. Automatically generates compliance reports with timestamps and evidence trails.',
        install: 'npm install @waymakerai/aicofounder-soc2',
        isNew: true,
        layer: 'Security',
        keyExports: ['EvidenceCollector', 'ReportGenerator', 'SOC2Templates'],
        example: `import { EvidenceCollector, ReportGenerator } from '@waymakerai/aicofounder-soc2';

const collector = new EvidenceCollector();
const report = new ReportGenerator(collector);
const pdf = await report.generate('Type II', { period: 'Q1 2026' });`,
      },
    ] as PackageInfo[],
  },
  {
    name: 'Agent',
    description: 'Build guarded AI agents with interceptors and factories.',
    color: 'from-purple-500 to-pink-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-agent-sdk',
        shortName: 'agent-sdk',
        icon: Bot,
        description: 'Guardrail wrapper for the Anthropic Agent SDK. 7 interceptors (PII, injection, compliance, content, cost, audit, rate limit) and 4 pre-built factories (HIPAA, Financial, GDPR, Safe).',
        install: 'npm install @waymakerai/aicofounder-agent-sdk',
        isNew: true,
        layer: 'Agent',
        keyExports: ['createGuardedAgent', 'createHIPAAAgent', 'createFinancialAgent', 'createGDPRAgent', 'createSafeAgent', 'GuardPipeline', 'guardTool'],
        example: `import { createGuardedAgent } from '@waymakerai/aicofounder-agent-sdk';

const agent = createGuardedAgent({
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a helpful assistant.',
  guards: {
    pii: { mode: 'redact', onDetection: 'redact' },
    injection: { sensitivity: 'medium', onDetection: 'block' },
    cost: { budgetPeriod: 'day', warningThreshold: 0.8 },
    audit: { destination: 'file', filePath: './audit.log', tamperProof: true },
  },
});

const result = await agent.run('Help me with my account');`,
        deps: ['@waymakerai/aicofounder-guard'],
      },
      {
        name: '@waymakerai/aicofounder-agents',
        shortName: 'agents',
        icon: GitBranch,
        description: 'Multi-agent orchestration with typed messaging, pub/sub channels, request/response patterns, and delivery guarantees.',
        install: 'npm install @waymakerai/aicofounder-agents',
        layer: 'Agent',
        keyExports: ['createMessageBroker', 'createChannel', 'createRequestChannel', 'BaseAgent', 'LLMAgent'],
        example: `import { createMessageBroker, createChannel } from '@waymakerai/aicofounder-agents';

const broker = createMessageBroker({ deliveryGuarantee: 'at-least-once' });
const tasks = createChannel<{ task: string }>({ name: 'tasks', type: 'topic' });

broker.subscribe(tasks, async (msg, ctx) => {
  console.log('Task:', msg.payload.task);
  await ctx.acknowledge();
});`,
      },
    ] as PackageInfo[],
  },
  {
    name: 'Data & AI',
    description: 'RAG, helpers, prompts, context optimization.',
    color: 'from-green-500 to-emerald-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-helpers',
        shortName: 'helpers',
        icon: Sparkles,
        description: '10 one-line AI functions: summarize, translate, classify, extract, sentiment, answer, rewrite, generate, compare, moderate.',
        install: 'npm install @waymakerai/aicofounder-helpers',
        layer: 'Data',
        keyExports: ['summarize', 'translate', 'classify', 'extract', 'sentiment', 'answer', 'rewrite', 'generate', 'compare', 'moderate'],
        example: `import { summarize, classify, extract } from '@waymakerai/aicofounder-helpers';

const summary = await summarize(document, { style: 'brief' });
const category = await classify(email, ['support', 'sales', 'billing']);
const data = await extract(resume, { name: 'string', skills: 'string[]' });`,
      },
      {
        name: '@waymakerai/aicofounder-prompts',
        shortName: 'prompts',
        icon: Brain,
        description: 'Enterprise prompt management with versioning, A/B testing, analytics, and React hooks.',
        install: 'npm install @waymakerai/aicofounder-prompts',
        layer: 'Data',
        keyExports: ['PromptManager', 'register', 'execute', 'createABTest', 'getAnalytics', 'usePrompt'],
        example: `import { PromptManager } from '@waymakerai/aicofounder-prompts';

const pm = new PromptManager({ workspace: 'my-app' });
await pm.register('greeting', { template: 'Hello {{name}}!', variables: ['name'] });
const result = await pm.execute('greeting', { variables: { name: 'World' } });`,
      },
      {
        name: '@waymakerai/aicofounder-rag',
        shortName: 'rag',
        icon: Search,
        description: 'Advanced RAG with presets (balanced, fast, accurate, code), hybrid retrieval, cross-encoder re-ranking, and automatic citations.',
        install: 'npm install @waymakerai/aicofounder-rag',
        layer: 'Data',
        keyExports: ['RAGPresets', 'createRAGPipeline', 'SemanticChunker', 'HybridRetriever', 'CrossEncoderReranker'],
        example: `import { RAGPresets } from '@waymakerai/aicofounder-rag';

const pipeline = RAGPresets.balanced();
await pipeline.index([{ id: 'doc1', content: 'Your docs...' }]);
const result = await pipeline.query({ query: 'How does auth work?' });
console.log(result.answer, result.citations);`,
      },
      {
        name: '@waymakerai/aicofounder-context-optimizer',
        shortName: 'context-optimizer',
        icon: Layers,
        description: 'Handle 400K+ token contexts with ~70% cost savings. Smart chunking, file prioritization, and quality scoring.',
        install: 'npm install @waymakerai/aicofounder-context-optimizer',
        isNew: true,
        layer: 'Data',
        keyExports: ['ContextOptimizer', 'optimize', 'prioritizeFiles', 'chunkRepository', 'scoreQuality'],
        example: `import { ContextOptimizer } from '@waymakerai/aicofounder-context-optimizer';

const optimizer = new ContextOptimizer({ strategy: 'hybrid', maxTokens: 400000 });
const result = await optimizer.optimize({ files: repoFiles, query: 'Explain auth flow' });
console.log(result.tokens, result.costSavings);`,
      },
    ] as PackageInfo[],
  },
  {
    name: 'DevOps',
    description: 'CLI tools, CI/CD, testing, streaming, and observability.',
    color: 'from-yellow-500 to-amber-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-cli',
        shortName: 'cli',
        icon: Terminal,
        description: '25+ CLI commands for project setup, code generation, testing, dashboard, and deployment.',
        install: 'npm install -g @waymakerai/aicofounder-cli',
        layer: 'DevOps',
        keyExports: ['rana init', 'rana generate', 'rana test', 'rana dashboard', 'rana deploy'],
        example: `# Create a new project
npx @waymakerai/aicofounder-cli init my-app

# Generate code
rana generate api --schema ./schema.yml

# Run AI tests
rana test --semantic --coverage`,
      },
      {
        name: '@waymakerai/aicofounder-ci',
        shortName: 'ci',
        icon: RefreshCw,
        description: 'CI/CD integration for GitHub Actions. Runs guard checks on PRs, generates SARIF reports, posts compliance comments.',
        install: 'npm install @waymakerai/aicofounder-ci',
        layer: 'DevOps',
        keyExports: ['CIRunner', 'SARIFReporter', 'PRCommentReporter'],
        example: `# .github/workflows/rana.yml
- uses: waymaker-ai/cofounder-ci@v1
  with:
    guard: true
    compliance: hipaa,gdpr
    fail-on: critical`,
      },
      {
        name: '@waymakerai/aicofounder-testing',
        shortName: 'testing',
        icon: FlaskConical,
        description: 'AI-aware testing framework with semantic matching, statistical assertions, and cost tracking per test suite.',
        install: 'npm install @waymakerai/aicofounder-testing',
        layer: 'DevOps',
        keyExports: ['TestRunner', 'semanticMatch', 'assertSimilar', 'trackCost'],
        example: `import { TestRunner } from '@waymakerai/aicofounder-testing';

const runner = new TestRunner({ semantic: true });
await runner.run([
  { input: 'Summarize this...', expected: 'A brief overview...', threshold: 0.8 },
]);`,
      },
      {
        name: '@waymakerai/aicofounder-streaming',
        shortName: 'streaming',
        icon: Radio,
        description: 'Streaming guards for Anthropic, OpenAI, and SSE streams. Real-time content detection on streaming responses.',
        install: 'npm install @waymakerai/aicofounder-streaming',
        isNew: true,
        layer: 'DevOps',
        keyExports: ['StreamGuard', 'AnthropicAdapter', 'OpenAIAdapter', 'SSEAdapter', 'StreamBuffer'],
        example: `import { StreamGuard, AnthropicAdapter } from '@waymakerai/aicofounder-streaming';

const guard = new StreamGuard({ pii: 'redact', injection: 'block' });
const stream = guard.wrap(anthropicStream, new AnthropicAdapter());`,
      },
    ] as PackageInfo[],
  },
  {
    name: 'Enterprise',
    description: 'Production-grade infrastructure packages.',
    color: 'from-indigo-500 to-violet-500',
    packages: [
      {
        name: '@waymakerai/aicofounder-react',
        shortName: 'react',
        icon: Code2,
        description: 'React hooks and provider for CoFounder. useChat, useRAG, usePrompt, useGuard hooks with built-in state management.',
        install: 'npm install @waymakerai/aicofounder-react',
        layer: 'Enterprise',
        keyExports: ['CoFounderProvider', 'useChat', 'useRAG', 'usePrompt', 'useGuard'],
        example: `import { CoFounderProvider, useChat } from '@waymakerai/aicofounder-react';

function App() {
  return (
    <CoFounderProvider config={{ apiKey: '...' }}>
      <ChatComponent />
    </CoFounderProvider>
  );
}`,
      },
      {
        name: '@waymakerai/aicofounder-dashboard',
        shortName: 'dashboard',
        icon: Activity,
        description: 'Real-time monitoring dashboard for costs, usage, compliance violations, and guard activity.',
        install: 'npm install @waymakerai/aicofounder-dashboard',
        layer: 'Enterprise',
        keyExports: ['Dashboard', 'FileStorage', 'DashboardAPI'],
        example: `import { Dashboard } from '@waymakerai/aicofounder-dashboard';

const dashboard = new Dashboard({ port: 3001, storage: 'file' });
await dashboard.start();
// Open http://localhost:3001`,
      },
      {
        name: '@waymakerai/aicofounder-mcp-server',
        shortName: 'mcp-server',
        icon: Puzzle,
        description: 'Model Context Protocol server for exposing CoFounder tools to MCP-compatible clients.',
        install: 'npm install @waymakerai/aicofounder-mcp-server',
        layer: 'Enterprise',
        keyExports: ['MCPServer', 'ScaffoldingTools'],
        example: `import { MCPServer } from '@waymakerai/aicofounder-mcp-server';

const server = new MCPServer({ tools: ['guard', 'compliance', 'rag'] });
await server.start();`,
      },
      {
        name: '@waymakerai/aicofounder-benchmark',
        shortName: 'benchmark',
        icon: Gauge,
        description: 'Performance benchmarking for LLM operations. Measure latency, throughput, cost efficiency, and quality across providers.',
        install: 'npm install @waymakerai/aicofounder-benchmark',
        isNew: true,
        layer: 'Enterprise',
        keyExports: ['BenchmarkRunner', 'BenchmarkSuite', 'compareProviders'],
        example: `import { BenchmarkRunner } from '@waymakerai/aicofounder-benchmark';

const runner = new BenchmarkRunner();
const results = await runner.compare(['claude-sonnet-4-20250514', 'gpt-4o'], {
  prompts: testPrompts,
  metrics: ['latency', 'cost', 'quality'],
});`,
      },
    ] as PackageInfo[],
  },
];

export default function PackagesPage() {
  const allPackages = layers.flatMap((l) => l.packages);

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-5xl">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Packages</h1>
          <p className="text-lg text-foreground-secondary mb-4">
            {allPackages.length} packages organized into {layers.length} layers. Each package is
            independently installable, fully typed, and ships with ESM + CJS builds.
          </p>
        </motion.div>

        {/* Where to start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-12 p-6 rounded-lg border border-blue-500/30 bg-blue-500/10"
        >
          <h3 className="font-bold text-blue-400 mb-2">Where to Start</h3>
          <p className="text-foreground-secondary mb-3">
            Most projects need just 1-2 packages. Here are the recommended starting points:
          </p>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Securing an existing app:</span> <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-guard</code></div>
            <div><span className="font-semibold">Building a guarded agent:</span> <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-agent-sdk</code></div>
            <div><span className="font-semibold">Regulated industry (healthcare, finance):</span> <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-guard</code> + <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-compliance</code></div>
            <div><span className="font-semibold">Policy-driven governance:</span> <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-policies</code></div>
            <div><span className="font-semibold">Full-stack AI app:</span> <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-core</code> + <code className="px-1 py-0.5 bg-background-secondary rounded font-mono text-xs">@waymakerai/aicofounder-guard</code></div>
          </div>
        </motion.div>

        {/* Layer sections */}
        <div className="space-y-16">
          {layers.map((layer, layerIndex) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + layerIndex * 0.05 }}
            >
              <div className="mb-6 pb-3 border-b border-border">
                <h2 className="text-2xl font-bold mb-1">{layer.name}</h2>
                <p className="text-foreground-secondary">{layer.description}</p>
              </div>

              <div className="space-y-8">
                {layer.packages.map((pkg) => (
                  <div key={pkg.name} className="card relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-gradient-subtle">
                        <pkg.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-bold font-mono break-all">{pkg.name}</h3>
                          {pkg.isNew && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-foreground-secondary text-sm mt-1">{pkg.description}</p>
                      </div>
                    </div>

                    <div className="code-block font-mono text-sm mb-4">
                      {pkg.install}
                    </div>

                    <h4 className="text-sm font-semibold mb-2">Key Exports</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pkg.keyExports.map((exp) => (
                        <code
                          key={exp}
                          className="px-2 py-1 rounded bg-background-secondary font-mono text-xs"
                        >
                          {exp}
                        </code>
                      ))}
                    </div>

                    {pkg.deps && pkg.deps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-1">Dependencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {pkg.deps.map((dep) => (
                            <code key={dep} className="px-2 py-1 rounded bg-background-secondary font-mono text-xs text-foreground-secondary">{dep}</code>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="text-sm font-semibold mb-2">Quick Example</h4>
                    <div className="code-block font-mono text-sm overflow-x-auto">
                      <pre>{pkg.example}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dependency graph summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-4">Package Dependencies</h2>
          <p className="text-foreground-secondary mb-4">
            All packages are independently installable. Here are the key dependency relationships:
          </p>
          <div className="space-y-2 text-sm font-mono">
            {[
              { from: 'agent-sdk', arrow: 'depends on', to: 'guard (for interceptors)' },
              { from: 'agent-sdk', arrow: 'optionally uses', to: '@anthropic-ai/sdk (peer dependency)' },
              { from: 'compliance', arrow: 'standalone', to: '(no CoFounder dependencies)' },
              { from: 'policies', arrow: 'standalone', to: '(no CoFounder dependencies)' },
              { from: 'guard', arrow: 'standalone', to: '(no CoFounder dependencies)' },
              { from: 'core', arrow: 'standalone', to: '(no CoFounder dependencies)' },
              { from: 'helpers / prompts / rag', arrow: 'optionally use', to: 'core (for provider management)' },
              { from: 'streaming', arrow: 'depends on', to: 'guard (for stream detection)' },
            ].map((dep, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="text-gradient-from">{dep.from}</code>
                <span className="text-foreground-secondary">{dep.arrow}</span>
                <code>{dep.to}</code>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-12 flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Documentation
          </Link>
          <Link
            href="/docs/api"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            API Reference
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
