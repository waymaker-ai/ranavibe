'use client';

import { motion } from 'framer-motion';
import { Package, Sparkles, Brain, Search, Shield, Scale, Layers, ArrowRight, Lock, Activity, GitBranch, Eye, Cpu, FileCheck } from 'lucide-react';
import Link from 'next/link';

const packages = [
  {
    name: '@aicofounder/agent-sdk',
    icon: Cpu,
    description: 'Wrap Anthropic Agent SDK with guardrails — PII, injection, compliance, cost',
    features: ['7 Interceptors', 'HIPAA Agent', 'GDPR Agent', 'Financial Agent'],
    color: 'from-amber-500 to-orange-500',
    example: `const agent = createGuardedAgent({
  model: 'claude-sonnet-4-6',
  guards: {
    pii: { mode: 'redact' },
    injection: { sensitivity: 'high' },
    compliance: { frameworks: ['hipaa'] }
  }
});`,
    isNew: true,
  },
  {
    name: '@aicofounder/guard',
    icon: Lock,
    description: 'Zero-dependency runtime guard — one import, any framework',
    features: ['Zero Deps', 'Client Proxy', 'PII/Injection', '25+ Models'],
    color: 'from-red-500 to-pink-500',
    example: `import { createGuard } from '@aicofounder/guard';
const g = createGuard({ pii: 'redact', injection: 'block' });
const client = g.wrap(new Anthropic());
// All calls now guarded automatically`,
    isNew: true,
  },
  {
    name: '@aicofounder/policies',
    icon: FileCheck,
    description: 'Declarative YAML policies with 9 compliance presets',
    features: ['HIPAA', 'GDPR', 'SEC', 'PCI', 'SOX', 'FERPA', 'CCPA'],
    color: 'from-blue-500 to-indigo-500',
    example: `const engine = PolicyEngine.fromPresets(['hipaa', 'gdpr']);
const result = engine.evaluate(text, {
  direction: 'input', model: 'claude-sonnet-4-6'
});
// { allowed: false, violations: [...] }`,
    isNew: true,
  },
  {
    name: '@aicofounder/ci',
    icon: GitBranch,
    description: 'GitHub Action & CLI for AI security scanning in CI/CD',
    features: ['PR Scanning', 'SARIF Output', 'Key Detection', 'Cost Estimation'],
    color: 'from-green-500 to-emerald-500',
    example: `# .github/workflows/cofounder.yml
- uses: waymaker-ai/aicofounder-ci@v1
  with:
    fail-on: 'high'
    approved-models: 'claude-sonnet-4-6,gpt-4o'
    comment-on-pr: 'true'`,
    isNew: true,
  },
  {
    name: '@aicofounder/dashboard',
    icon: Activity,
    description: 'AI observability — cost tracking, security alerts, compliance metrics',
    features: ['Real-time Metrics', 'Anomaly Detection', 'Prometheus Export', 'HTTP API'],
    color: 'from-violet-500 to-purple-500',
    example: `const dashboard = new CoFounderDashboard({
  storage: new FileStorage('./aicofounder-data')
});
dashboard.collect(event);
await dashboard.serve({ port: 3456 });`,
    isNew: true,
  },
  {
    name: '@aicofounder/mcp-server',
    icon: Eye,
    description: '15+ MCP tools for Claude Desktop, Code, and Cursor',
    features: ['PII Scan', 'Injection Detect', 'Cost Estimate', 'Code Safety'],
    color: 'from-cyan-500 to-teal-500',
    example: `// In Claude Desktop settings:
{ "mcpServers": { "cofounder": {
  "command": "npx",
  "args": ["@aicofounder/mcp-server"]
}}}
// Now use cofounder_scan_pii, cofounder_detect_injection...`,
    isNew: true,
  },
  {
    name: '@aicofounder/compliance',
    icon: Shield,
    description: 'Automatic HIPAA, SEC, GDPR, CCPA compliance enforcement',
    features: ['PII Detection', 'Auto Redaction', 'Audit Trail', 'Disclaimers'],
    color: 'from-red-500 to-orange-500',
    example: `const enforcer = new ComplianceEnforcer([
  PresetRules.hipaa(),
  PresetRules.gdpr()
]);
const result = await enforcer.enforce(request);`,
  },
  {
    name: '@aicofounder/guidelines',
    icon: Scale,
    description: 'Dynamic behavioral control with context-aware rules',
    features: ['Priority Rules', 'Analytics', 'Violations', '8+ Presets'],
    color: 'from-blue-400 to-indigo-400',
    example: `const manager = createGuidelineManager();
await manager.addGuideline(
  PresetGuidelines.noMedicalAdvice()
);
const matched = await manager.match(context);`,
  },
  {
    name: '@aicofounder/context-optimizer',
    icon: Layers,
    description: 'Handle 400K+ token contexts with 70% cost savings',
    features: ['400K Tokens', '70% Savings', 'Smart Chunking', 'Caching'],
    color: 'from-violet-400 to-purple-400',
    example: `const optimizer = new ContextOptimizer({
  strategy: 'hybrid'
});
const result = await optimizer.optimize(context);
// 2.5M tokens → 400K tokens`,
  },
];

export function Packages() {
  return (
    <section className="py-20 md:py-32 border-t border-border bg-background-secondary">
      <div className="container-wide">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 mb-6 rounded-full border border-border bg-background"
          >
            <Package className="h-4 w-4 text-gradient-from" />
            <span className="text-sm font-medium">New in CoFounder 3.1</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            35 Production-Ready Packages
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            The complete AI guardrail ecosystem — from core detection to enterprise compliance, CI/CD, streaming, sandbox, and VS Code extension
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:border-foreground/20 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${pkg.color} w-fit`}>
                  <pkg.icon className="h-6 w-6 text-white" />
                </div>
                {pkg.isNew && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                    NEW
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2 font-mono">{pkg.name}</h3>
              <p className="text-foreground-secondary mb-4">{pkg.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {pkg.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-2 py-1 text-xs rounded-md bg-background border border-border"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                <div className="code-block font-mono text-xs overflow-x-auto">
                  <pre className="text-foreground-secondary whitespace-pre-wrap">{pkg.example}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="https://github.com/waymaker-ai/cofounder"
            target="_blank"
            className="btn-primary px-6 py-3 text-base group inline-flex items-center"
          >
            View on GitHub
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
