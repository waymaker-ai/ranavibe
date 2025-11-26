'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export default function QuickStartPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quick Start</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Get up and running with RANA in 5 minutes
          </p>
        </motion.div>

        {/* Step 1 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white text-sm font-bold mr-3">
              1
            </span>
            Install Packages
          </h2>
          <div className="code-block font-mono text-sm">
            <div>npm install @rana/helpers @rana/prompts @rana/rag</div>
          </div>
        </motion.section>

        {/* Step 2 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white text-sm font-bold mr-3">
              2
            </span>
            Use @rana/helpers for One-Line AI
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { summarize, translate, classify, extract } from '@rana/helpers';

// Summarize any text
const summary = await summarize(longDocument, { style: 'brief' });

// Translate to any language
const spanish = await translate(text, { to: 'es' });

// Classify into categories
const category = await classify(email, ['support', 'sales', 'billing']);

// Extract structured data
const data = await extract(resume, {
  name: 'string',
  email: 'string',
  skills: 'string[]'
});`}</pre>
          </div>
        </motion.section>

        {/* Step 3 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white text-sm font-bold mr-3">
              3
            </span>
            Use @rana/prompts for Enterprise Management
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'my-app' });

// Register a prompt with versioning
await pm.register('greeting', {
  template: 'Hello {{name}}, how can I help you today?',
  variables: ['name'],
});

// Execute with automatic tracking
const result = await pm.execute('greeting', {
  variables: { name: 'John' },
});

// A/B test different variants
await pm.createABTest('greeting', {
  variants: [
    { name: 'formal', template: 'Good day, {{name}}.' },
    { name: 'casual', template: 'Hey {{name}}!' },
  ],
  metric: 'user_satisfaction',
});`}</pre>
          </div>
        </motion.section>

        {/* Step 4 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white text-sm font-bold mr-3">
              4
            </span>
            Use @rana/rag for Advanced Retrieval
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { RAGPresets, createRAGPipeline } from '@rana/rag';

// Use a preset for quick setup
const pipeline = RAGPresets.balanced();

// Index your documents
await pipeline.index([
  { id: 'doc1', content: 'Your documentation content...' },
  { id: 'doc2', content: 'More content here...' },
]);

// Query with automatic citations
const result = await pipeline.query({
  query: 'How do I configure authentication?',
});

console.log(result.answer);    // Generated answer
console.log(result.citations); // Source references
console.log(result.sources);   // Unique documents used`}</pre>
          </div>
        </motion.section>

        {/* Features included */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">What You Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '70% automatic cost reduction',
              '9 LLM providers supported',
              'Intelligent caching',
              'Automatic retries & fallbacks',
              'Real-time cost tracking',
              'TypeScript support',
              'React hooks included',
              'Enterprise security',
            ].map((feature) => (
              <div key={feature} className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Documentation
          </Link>
          <Link
            href="/docs/packages"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Explore Packages
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
