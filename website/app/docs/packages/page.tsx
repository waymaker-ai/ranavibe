'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Brain, Search, Shield, Scale, Layers } from 'lucide-react';

const packages = [
  {
    name: '@rana/compliance',
    icon: Shield,
    description: 'Automatic HIPAA, SEC, GDPR, CCPA compliance enforcement',
    npm: 'npm install @rana/compliance',
    isNew: true,
    functions: [
      { name: 'ComplianceEnforcer', desc: 'Main enforcement engine' },
      { name: 'PresetRules.hipaa()', desc: 'HIPAA compliance preset' },
      { name: 'PresetRules.sec()', desc: 'SEC/FINRA compliance' },
      { name: 'PresetRules.gdpr()', desc: 'GDPR compliance' },
      { name: 'PresetRules.ccpa()', desc: 'CCPA compliance' },
      { name: 'enforce()', desc: 'Enforce compliance on requests' },
      { name: 'getViolations()', desc: 'Get violation history' },
      { name: 'detectPII()', desc: 'Detect PII in content' },
    ],
    example: `import { ComplianceEnforcer, PresetRules } from '@rana/compliance';

const enforcer = new ComplianceEnforcer([
  PresetRules.hipaa(),
  PresetRules.gdpr()
]);

const result = await enforcer.enforce({
  request: userMessage,
  response: aiResponse
});

if (result.action === 'block') {
  console.log('Compliance violation:', result.violations);
}`,
  },
  {
    name: '@rana/guidelines',
    icon: Scale,
    description: 'Dynamic behavioral control with context-aware rules',
    npm: 'npm install @rana/guidelines',
    isNew: true,
    functions: [
      { name: 'GuidelineManager', desc: 'Main manager class' },
      { name: 'createGuideline()', desc: 'Create custom guidelines' },
      { name: 'PresetGuidelines', desc: '8+ preset guidelines' },
      { name: 'Conditions', desc: 'Condition builders' },
      { name: 'match()', desc: 'Match guidelines to context' },
      { name: 'validate()', desc: 'Validate responses' },
      { name: 'getAnalytics()', desc: 'View guideline analytics' },
    ],
    example: `import { GuidelineManager, PresetGuidelines, Conditions } from '@rana/guidelines';

const manager = new GuidelineManager();

await manager.addGuideline(
  PresetGuidelines.noMedicalAdvice()
);

const matched = await manager.match({
  topic: 'medical',
  message: 'I have a headache'
});

console.log(matched); // Returns matching guidelines`,
  },
  {
    name: '@rana/context-optimizer',
    icon: Layers,
    description: 'Handle 400K+ token contexts with 70% cost savings',
    npm: 'npm install @rana/context-optimizer',
    isNew: true,
    functions: [
      { name: 'ContextOptimizer', desc: 'Main optimizer class' },
      { name: 'optimize()', desc: 'Optimize context size' },
      { name: 'prioritizeFiles()', desc: 'File prioritization' },
      { name: 'chunkRepository()', desc: 'Smart chunking' },
      { name: 'scoreQuality()', desc: 'Content quality scoring' },
      { name: 'getCacheStats()', desc: 'Cache statistics' },
    ],
    example: `import { ContextOptimizer } from '@rana/context-optimizer';

const optimizer = new ContextOptimizer({
  strategy: 'hybrid',
  maxTokens: 400000
});

const result = await optimizer.optimize({
  files: repositoryFiles,
  query: 'Explain the authentication flow'
});

console.log(result.tokens); // ~400K tokens (from 2.5M)
console.log(result.costSavings); // ~70%`,
  },
  {
    name: '@rana/helpers',
    icon: Sparkles,
    description: '10 one-line AI functions for common tasks',
    npm: 'npm install @rana/helpers',
    functions: [
      { name: 'summarize()', desc: 'Summarize text with customizable style' },
      { name: 'translate()', desc: 'Translate to any language' },
      { name: 'classify()', desc: 'Classify into categories' },
      { name: 'extract()', desc: 'Extract structured data' },
      { name: 'sentiment()', desc: 'Analyze sentiment' },
      { name: 'answer()', desc: 'Answer questions from context' },
      { name: 'rewrite()', desc: 'Rewrite in different styles' },
      { name: 'generate()', desc: 'Generate content' },
      { name: 'compare()', desc: 'Compare texts' },
      { name: 'moderate()', desc: 'Content moderation' },
    ],
    example: `import { summarize, translate, classify } from '@rana/helpers';

const summary = await summarize(document, { style: 'brief' });
const spanish = await translate(text, { to: 'es' });
const category = await classify(email, ['spam', 'ham']);`,
  },
  {
    name: '@rana/prompts',
    icon: Brain,
    description: 'Enterprise prompt management with versioning and A/B testing',
    npm: 'npm install @rana/prompts',
    functions: [
      { name: 'PromptManager', desc: 'Main manager class' },
      { name: 'register()', desc: 'Register prompts with versioning' },
      { name: 'execute()', desc: 'Execute with tracking' },
      { name: 'createABTest()', desc: 'A/B test variants' },
      { name: 'getAnalytics()', desc: 'View prompt analytics' },
      { name: 'usePrompt()', desc: 'React hook for prompts' },
    ],
    example: `import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'app' });

await pm.register('greeting', {
  template: 'Hello {{name}}!',
  variables: ['name'],
});

const result = await pm.execute('greeting', {
  variables: { name: 'John' },
});`,
  },
  {
    name: '@rana/rag',
    icon: Search,
    description: 'Advanced RAG with hybrid retrieval and re-ranking',
    npm: 'npm install @rana/rag',
    functions: [
      { name: 'RAGPresets', desc: 'Pre-configured pipelines' },
      { name: 'createRAGPipeline()', desc: 'Custom pipeline builder' },
      { name: 'SemanticChunker', desc: 'Semantic text chunking' },
      { name: 'HybridRetriever', desc: 'Vector + keyword search' },
      { name: 'CrossEncoderReranker', desc: 'Re-ranking results' },
      { name: 'useRAG()', desc: 'React hook for RAG' },
    ],
    example: `import { RAGPresets } from '@rana/rag';

const pipeline = RAGPresets.balanced();

await pipeline.index([
  { id: 'doc1', content: '...' },
]);

const result = await pipeline.query({
  query: 'How does this work?',
});`,
  },
];

export default function PackagesPage() {
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
          <p className="text-lg text-foreground-secondary mb-12">
            Six powerful packages with built-in compliance, guidelines, and context optimization
          </p>
        </motion.div>

        <div className="space-y-16">
          {packages.map((pkg, index) => (
            <motion.section
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card relative"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <pkg.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold font-mono">{pkg.name}</h2>
                    {pkg.isNew && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-foreground-secondary">{pkg.description}</p>
                </div>
              </div>

              <div className="code-block font-mono text-sm mb-6">
                {pkg.npm}
              </div>

              <h3 className="text-lg font-semibold mb-4">API</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {pkg.functions.map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <code className="px-2 py-1 rounded bg-background-secondary font-mono">
                      {fn.name}
                    </code>
                    <span className="text-foreground-secondary">{fn.desc}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4">Example</h3>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{pkg.example}</pre>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
