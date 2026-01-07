'use client';

import { motion } from 'framer-motion';
import { Package, Sparkles, Brain, Search, Shield, Scale, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const packages = [
  {
    name: '@rana/compliance',
    icon: Shield,
    description: 'Automatic HIPAA, SEC, GDPR, CCPA compliance enforcement',
    features: ['PII Detection', 'Auto Redaction', 'Audit Trail', 'Disclaimers'],
    color: 'from-red-500 to-orange-500',
    example: `const enforcer = new ComplianceEnforcer([
  PresetRules.hipaa(),
  PresetRules.gdpr()
]);
const result = await enforcer.enforce(request);`,
    isNew: true,
  },
  {
    name: '@rana/guidelines',
    icon: Scale,
    description: 'Dynamic behavioral control with context-aware rules',
    features: ['Priority Rules', 'Analytics', 'Violations', '8+ Presets'],
    color: 'from-blue-500 to-indigo-500',
    example: `const manager = createGuidelineManager();
await manager.addGuideline(
  PresetGuidelines.noMedicalAdvice()
);
const matched = await manager.match(context);`,
    isNew: true,
  },
  {
    name: '@rana/context-optimizer',
    icon: Layers,
    description: 'Handle 400K+ token contexts with 70% cost savings',
    features: ['400K Tokens', '70% Savings', 'Smart Chunking', 'Caching'],
    color: 'from-violet-500 to-purple-500',
    example: `const optimizer = new ContextOptimizer({
  strategy: 'hybrid'
});
const result = await optimizer.optimize(context);
// 2.5M tokens → 400K tokens`,
    isNew: true,
  },
  {
    name: '@rana/helpers',
    icon: Sparkles,
    description: '10 one-line AI functions for common tasks',
    features: ['summarize()', 'translate()', 'classify()', 'extract()', 'sentiment()'],
    color: 'from-pink-500 to-rose-500',
    example: `const summary = await summarize(longText);
const spanish = await translate(text, { to: 'es' });
const category = await classify(text, ['spam', 'ham']);`,
  },
  {
    name: '@rana/prompts',
    icon: Brain,
    description: 'Enterprise prompt management with A/B testing',
    features: ['Versioning', 'A/B Testing', 'Analytics', 'Optimization'],
    color: 'from-cyan-500 to-teal-500',
    example: `const pm = new PromptManager({ workspace: 'app' });
await pm.register('greeting', { template: '...' });
const result = await pm.execute('greeting', vars);`,
  },
  {
    name: '@rana/rag',
    icon: Search,
    description: 'Advanced RAG with hybrid retrieval & re-ranking',
    features: ['Semantic Chunking', 'Hybrid Search', 'Re-ranking', 'Streaming'],
    color: 'from-emerald-500 to-green-500',
    example: `const pipeline = RAGPresets.balanced();
await pipeline.index(documents);
const result = await pipeline.query({ query: '...' });`,
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
            <span className="text-sm font-medium">New in 2025</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Six Powerful Packages
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            Production-ready AI building blocks with built-in compliance, guidelines, and context optimization
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
            href="https://github.com/waymaker-ai/ranavibe"
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
