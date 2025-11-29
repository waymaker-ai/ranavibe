/**
 * @rana/testing
 *
 * AI-Native Testing Framework
 * Test AI code like regular code - with semantic matching,
 * regression detection, cost assertions, and statistical testing.
 *
 * @example
 * ```typescript
 * import { describe, aiTest, expect, runTimes } from '@rana/testing';
 *
 * describe('My AI Feature', () => {
 *   aiTest('should summarize correctly', async ({ expect }) => {
 *     const result = await summarize(article);
 *
 *     // Semantic matching - compares meaning, not exact strings
 *     await expect(result).toSemanticMatch('concise overview of main points');
 *
 *     // Cost assertion - ensure we stay within budget
 *     await expect(result).toCostLessThan(0.01);
 *   });
 *
 *   aiTest('should classify consistently', async ({ expect }) => {
 *     // Run multiple times for non-deterministic outputs
 *     const results = await runTimes(10, () => classify(email));
 *
 *     // At least 80% should be 'spam'
 *     await expect(results).toMostlyBe('spam', { threshold: 0.8 });
 *   });
 * });
 * ```
 *
 * @packageDocumentation
 */

// Test runner and core functions
export {
  describe,
  aiTest,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  run,
  reset,
  configure,
  getConfig,
} from './runners/test-runner';

// Re-export types
export type {
  AITestContext,
  AITestConfig,
  AITestResult,
  AITestFn,
  AIExpect,
  AIMatchers,
  SemanticMatchOptions,
  RegressionOptions,
  StatisticalOptions,
  FactCheckOptions,
  JSONSchema,
  CostTracker,
  LatencyTracker,
  EvalItem,
  EvalResults,
  EvalItemResult,
  ABTestConfig,
  ABTestResults,
  ModelComparisonConfig,
  ModelComparisonResults,
  DescribeOptions,
} from './types';

// Assertion utilities (for advanced users)
export {
  // Semantic
  semanticSimilarity,
  cosineSimilarity,
  getEmbedding,
  clearEmbeddingCache,

  // Cost
  calculateCost,
  predictCost,
  formatCost,
  formatTokens,
  suggestCheaperModel,
  MODEL_PRICING,
  recordUsage,

  // Regression
  evaluateQuality,
  loadBaseline,
  saveBaseline,
  listBaselines,
  deleteBaseline,
  compareVersions,

  // Statistical
  runTimes,
  runTimesParallel,
  mean,
  standardDeviation,
  mode,
  matchPercentage,
} from './assertions';

export type { QualityMetrics, Baseline } from './assertions';

/**
 * Quick helper to create an eval set
 */
export function evalSet(items: Array<{
  input: string;
  expected: string;
  type?: 'exact' | 'contains' | 'semantic' | 'regex';
  tags?: string[];
}>): {
  items: typeof items;
  run: (fn: (input: string) => Promise<string>) => Promise<{
    passRate: number;
    passed: number;
    failed: number;
    results: Array<{ input: string; expected: string; actual: string; passed: boolean }>;
  }>;
} {
  return {
    items,
    async run(fn) {
      const results: Array<{
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
      }> = [];

      for (const item of items) {
        const actual = await fn(item.input);
        let passed = false;

        switch (item.type || 'contains') {
          case 'exact':
            passed = actual === item.expected;
            break;
          case 'contains':
            passed = actual.toLowerCase().includes(item.expected.toLowerCase());
            break;
          case 'regex':
            passed = new RegExp(item.expected).test(actual);
            break;
          case 'semantic':
            const { semanticSimilarity: semSim } = await import('./assertions/semantic');
            const similarity = await semSim(actual, item.expected);
            passed = similarity >= 0.8;
            break;
        }

        results.push({
          input: item.input,
          expected: item.expected,
          actual,
          passed,
        });
      }

      const passed = results.filter((r) => r.passed).length;

      return {
        passRate: results.length > 0 ? passed / results.length : 0,
        passed,
        failed: results.length - passed,
        results,
      };
    },
  };
}

/**
 * Load eval set from JSON file
 */
export async function loadEvalSet(filePath: string): Promise<ReturnType<typeof evalSet>> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const items = JSON.parse(content);
  return evalSet(items);
}

/**
 * A/B test helper for comparing prompts/configurations
 */
export async function abTest<T>(
  name: string,
  config: {
    variants: Record<string, T>;
    runs: number;
    evaluate: (result: string) => Promise<number> | number;
  },
  fn: (variant: T) => Promise<string>
): Promise<{
  results: Record<string, { avgScore: number; avgLatency: number; runs: number }>;
  winner: string | null;
  confidence: number;
}> {
  const results: Record<string, { scores: number[]; latencies: number[] }> = {};

  for (const [variantName, variantConfig] of Object.entries(config.variants)) {
    results[variantName] = { scores: [], latencies: [] };

    for (let i = 0; i < config.runs; i++) {
      const start = Date.now();
      const output = await fn(variantConfig);
      const latency = Date.now() - start;

      const score = await config.evaluate(output);

      results[variantName].scores.push(score);
      results[variantName].latencies.push(latency);
    }
  }

  // Calculate averages
  const summary: Record<string, { avgScore: number; avgLatency: number; runs: number }> = {};
  let bestVariant: string | null = null;
  let bestScore = -Infinity;

  for (const [name, data] of Object.entries(results)) {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const avgLatency = data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length;

    summary[name] = { avgScore, avgLatency, runs: config.runs };

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestVariant = name;
    }
  }

  // Simple confidence calculation (would use proper statistical test in production)
  const scores = Object.values(summary).map((s) => s.avgScore);
  const maxDiff = Math.max(...scores) - Math.min(...scores);
  const confidence = Math.min(0.99, maxDiff * config.runs / 10);

  return {
    results: summary,
    winner: confidence > 0.8 ? bestVariant : null,
    confidence,
  };
}

/**
 * Model comparison helper
 */
export async function compareModels(
  models: string[],
  testFn: (model: string) => Promise<string>,
  evaluate: (result: string) => Promise<number> | number,
  runs: number = 5
): Promise<{
  results: Record<string, { avgScore: number; avgLatency: number }>;
  recommendation: { bestQuality: string; fastest: string };
}> {
  const results: Record<string, { scores: number[]; latencies: number[] }> = {};

  for (const model of models) {
    results[model] = { scores: [], latencies: [] };

    for (let i = 0; i < runs; i++) {
      const start = Date.now();
      const output = await testFn(model);
      const latency = Date.now() - start;

      const score = await evaluate(output);

      results[model].scores.push(score);
      results[model].latencies.push(latency);
    }
  }

  // Calculate averages and find best
  const summary: Record<string, { avgScore: number; avgLatency: number }> = {};
  let bestQuality = models[0];
  let fastest = models[0];
  let bestScore = -Infinity;
  let bestLatency = Infinity;

  for (const [model, data] of Object.entries(results)) {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const avgLatency = data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length;

    summary[model] = { avgScore, avgLatency };

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestQuality = model;
    }
    if (avgLatency < bestLatency) {
      bestLatency = avgLatency;
      fastest = model;
    }
  }

  return {
    results: summary,
    recommendation: { bestQuality, fastest },
  };
}

// Version
export const version = '1.0.0';
