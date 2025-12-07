'use client';

import { motion } from 'framer-motion';
import { Package, Sparkles, Brain, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const packages = [
  {
    name: '@rana/helpers',
    icon: Sparkles,
    description: '10 one-line AI functions for common tasks',
    features: ['summarize()', 'translate()', 'classify()', 'extract()', 'sentiment()'],
    color: 'from-purple-500 to-pink-500',
    example: `const summary = await summarize(longText);
const spanish = await translate(text, { to: 'es' });
const category = await classify(text, ['spam', 'ham']);`,
  },
  {
    name: '@rana/prompts',
    icon: Brain,
    description: 'Enterprise prompt management with A/B testing',
    features: ['Versioning', 'A/B Testing', 'Analytics', 'Optimization'],
    color: 'from-blue-500 to-cyan-500',
    example: `const pm = new PromptManager({ workspace: 'app' });
await pm.register('greeting', { template: '...' });
const result = await pm.execute('greeting', vars);`,
  },
  {
    name: '@rana/rag',
    icon: Search,
    description: 'Advanced RAG with hybrid retrieval & re-ranking',
    features: ['Semantic Chunking', 'Hybrid Search', 'Re-ranking', 'Streaming'],
    color: 'from-green-500 to-emerald-500',
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
            Three Powerful Packages
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            Production-ready AI building blocks that work together or standalone
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
              <div className={`mb-4 p-3 rounded-lg bg-gradient-to-r ${pkg.color} w-fit`}>
                <pkg.icon className="h-6 w-6 text-white" />
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
