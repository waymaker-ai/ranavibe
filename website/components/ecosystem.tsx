'use client';

import { motion } from 'framer-motion';
import { Layers, Shield, Plug, Wrench, Building2, Code2 } from 'lucide-react';

interface EcosystemPackage {
  name: string;
  description: string;
  isNew?: boolean;
}

interface EcosystemLayer {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  packages: EcosystemPackage[];
}

const layers: EcosystemLayer[] = [
  {
    title: 'Core Layer',
    icon: Shield,
    color: 'from-red-500 to-pink-500',
    packages: [
      { name: 'guard', description: 'Zero-dep runtime guard with PII, injection, toxicity detection' },
      { name: 'agent-sdk', description: 'Anthropic Agent SDK guardrail interceptors' },
      { name: 'policies', description: 'Declarative YAML policy engine with 9 compliance presets' },
      { name: 'compliance', description: 'HIPAA, GDPR, SEC, CCPA enforcement with audit trails' },
      { name: 'guidelines', description: 'Dynamic behavioral control with context-aware rules' },
    ],
  },
  {
    title: 'Integration Layer',
    icon: Plug,
    color: 'from-blue-500 to-indigo-500',
    packages: [
      { name: 'openclaw', description: 'OpenClaw agent framework guardrails' },
      { name: 'adapters', description: 'Multi-provider LLM adapters (Anthropic, OpenAI, Google)' },
      { name: 'colang', description: 'Colang dialogue flow integration' },
      { name: 'mcp-server', description: '15+ MCP tools for Claude Desktop, Code, Cursor' },
      { name: 'mcp', description: 'Model Context Protocol client utilities' },
    ],
  },
  {
    title: 'DevOps Layer',
    icon: Wrench,
    color: 'from-green-500 to-emerald-500',
    packages: [
      { name: 'ci', description: 'GitHub Action for AI security scanning in CI/CD' },
      { name: 'dashboard', description: 'Real-time observability, cost tracking, compliance scoring' },
      { name: 'benchmark', description: '252 test cases measuring PII, injection, toxicity accuracy', isNew: true },
      { name: 'sandbox', description: 'Isolated execution of untrusted AI-generated code', isNew: true },
    ],
  },
  {
    title: 'Enterprise Layer',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    packages: [
      { name: 'multi-tenant', description: 'Tenant isolation, per-tenant policies, usage metering' },
      { name: 'soc2', description: 'SOC 2 compliance controls and evidence collection' },
      { name: 'marketplace', description: 'Community guardrail and policy marketplace' },
      { name: 'llm-detect', description: 'LLM-powered secondary classification for nuanced detection' },
    ],
  },
  {
    title: 'Tools',
    icon: Code2,
    color: 'from-amber-500 to-orange-500',
    packages: [
      { name: 'streaming', description: 'Token-by-token guardrail evaluation on streaming responses', isNew: true },
      { name: 'VS Code Extension', description: 'Inline PII highlighting, injection warnings, policy quickfixes', isNew: true },
      { name: 'cli', description: 'Command-line guardrail scanning and policy management' },
      { name: 'create-aicofounder-app', description: 'Project scaffolding with guardrails pre-configured' },
    ],
  },
];

export function Ecosystem() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="container-wide">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 mb-6 rounded-full border border-border bg-background"
          >
            <Layers className="h-4 w-4 text-gradient-from" />
            <span className="text-sm font-medium">CoFounder 3.1 Ecosystem</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            The Complete Guardrail Stack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            35 packages organized in 5 layers — use what you need, from a single guard import to the full enterprise stack
          </motion.p>
        </div>

        <div className="space-y-6">
          {layers.map((layer, layerIndex) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: layerIndex * 0.1 }}
              className="card hover:border-foreground/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${layer.color}`}>
                  <layer.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">{layer.title}</h3>
                <span className="text-sm text-foreground-secondary">
                  {layer.packages.length} packages
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {layer.packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="p-3 rounded-lg border border-border bg-background hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">{pkg.name}</span>
                      {pkg.isNew && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-secondary">{pkg.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
