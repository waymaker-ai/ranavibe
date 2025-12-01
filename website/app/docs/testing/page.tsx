'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical, CheckCircle, Clock, DollarSign, BarChart3, Camera } from 'lucide-react';

const features = [
  {
    icon: FlaskConical,
    title: 'AI Test Runner',
    description: 'Purpose-built test runner for AI applications with special matchers',
    code: `import { aiTest, expect } from '@rana/testing';

aiTest('summarizes articles correctly', async () => {
  const result = await summarize(article);

  // Semantic matching - not exact string comparison
  await expect(result).toSemanticMatch('A brief overview of AI trends');

  // Check it mentions key topics
  await expect(result).toContainConcepts(['machine learning', 'neural networks']);
});`,
  },
  {
    icon: CheckCircle,
    title: 'Semantic Matching',
    description: 'Compare outputs by meaning, not exact strings',
    code: `import { semanticMatch, semanticSimilarity } from '@rana/testing';

// Check if two texts have the same meaning
const match = await semanticMatch(
  "The weather is nice today",
  "It's a beautiful day outside"
);
// match.isMatch: true, match.similarity: 0.87

// Get similarity score
const score = await semanticSimilarity(text1, text2);
// Returns 0-1 similarity score`,
  },
  {
    icon: BarChart3,
    title: 'Statistical Assertions',
    description: 'Handle non-deterministic AI outputs with statistical testing',
    code: `import { aiTest, expect } from '@rana/testing';

aiTest('classifier is mostly accurate', async () => {
  const results = await runMultiple(100, () =>
    classify(email, ['spam', 'ham'])
  );

  // Pass if 90%+ are correct
  await expect(results).toMostlyBe('ham', { threshold: 0.9 });

  // Check distribution
  await expect(results).toHaveDistribution({
    'ham': { min: 0.85, max: 0.95 },
    'spam': { min: 0.05, max: 0.15 }
  });
});`,
  },
  {
    icon: Clock,
    title: 'Latency Assertions',
    description: 'Ensure responses meet performance requirements',
    code: `import { aiTest, expect } from '@rana/testing';

aiTest('responds within SLA', async () => {
  const result = await timed(() => chat('Hello'));

  // Assert latency
  await expect(result).toRespondWithin(2000); // 2 seconds

  // P95 latency over multiple runs
  const results = await runMultiple(50, () => chat('Hello'));
  await expect(results).toHaveP95LatencyUnder(3000);
});`,
  },
  {
    icon: DollarSign,
    title: 'Cost Assertions',
    description: 'Control costs with per-test budget limits',
    code: `import { aiTest, expect } from '@rana/testing';

aiTest('stays within budget', async () => {
  const result = await tracked(() =>
    summarize(longDocument)
  );

  // Assert cost
  await expect(result).toCostLessThan(0.05); // $0.05

  // Assert token usage
  await expect(result).toUseTokensLessThan({
    input: 1000,
    output: 500
  });
});`,
  },
  {
    icon: Camera,
    title: 'Snapshot Testing',
    description: 'Catch regressions with semantic snapshots',
    code: `import { aiTest, expect } from '@rana/testing';

aiTest('prompt output is stable', async () => {
  const result = await generate(prompt);

  // Semantic snapshot - allows minor wording changes
  await expect(result).toMatchSemanticSnapshot();

  // Regression testing against baseline
  await expect(result).toPassRegression({
    baseline: 'baseline-v1',
    tolerance: 0.1 // Allow 10% variation
  });
});`,
  },
];

export default function TestingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
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
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <FlaskConical className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Testing Framework</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Purpose-built testing tools for AI applications. Semantic matching,
            statistical assertions, cost tracking, and regression testing.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/testing
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-4">Configuration</h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// rana.test.config.ts
import { defineConfig } from '@rana/testing';

export default defineConfig({
  // Run tests in parallel
  parallel: true,

  // Global timeout
  timeout: 30000,

  // Cost limits
  maxCostPerTest: 0.10,
  maxCostPerSuite: 1.00,

  // Semantic matching model
  semanticModel: 'text-embedding-3-small',

  // Snapshot directory
  snapshotDir: '__snapshots__',

  // Reporter
  reporter: ['default', 'html'],
});`}</pre>
          </div>
        </motion.div>

        {/* Jest Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-4">Jest Integration</h2>
          <p className="text-foreground-secondary mb-4">
            Use RANA&apos;s AI matchers with your existing Jest setup:
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// jest.setup.ts
import '@rana/testing/jest';

// Now use in any Jest test
test('AI output is correct', async () => {
  const result = await myAIFunction();
  await expect(result).toSemanticMatch('expected meaning');
});`}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
