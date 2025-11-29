/**
 * Statistical Assertions
 * Handle non-deterministic AI outputs with statistical testing
 */

import type { StatisticalOptions } from '../types';

/**
 * Run a function multiple times and collect results
 */
export async function runTimes<T>(
  times: number,
  fn: () => Promise<T> | T
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < times; i++) {
    results.push(await fn());
  }

  return results;
}

/**
 * Run a function multiple times in parallel
 */
export async function runTimesParallel<T>(
  times: number,
  fn: () => Promise<T> | T,
  maxConcurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const pending: Promise<void>[] = [];

  for (let i = 0; i < times; i++) {
    const promise = (async () => {
      results.push(await fn());
    })();

    pending.push(promise);

    if (pending.length >= maxConcurrency) {
      await Promise.race(pending);
      // Remove completed promises
      for (let j = pending.length - 1; j >= 0; j--) {
        // Check if promise is settled by racing with an immediate resolve
        const settled = await Promise.race([
          pending[j].then(() => true).catch(() => true),
          Promise.resolve(false),
        ]);
        if (settled) {
          pending.splice(j, 1);
        }
      }
    }
  }

  await Promise.all(pending);
  return results;
}

/**
 * Calculate the mode (most common value) of an array
 */
export function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;

  const counts = new Map<string, { value: T; count: number }>();

  for (const value of arr) {
    const key = JSON.stringify(value);
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { value, count: 1 });
    }
  }

  let maxCount = 0;
  let modeValue: T | undefined;

  for (const { value, count } of counts.values()) {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  }

  return modeValue;
}

/**
 * Calculate mean of numbers
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;

  const avg = mean(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);

  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate percentage of values matching expected
 */
export function matchPercentage<T>(arr: T[], expected: T): number {
  if (arr.length === 0) return 0;

  const expectedStr = JSON.stringify(expected);
  const matches = arr.filter((v) => JSON.stringify(v) === expectedStr).length;

  return matches / arr.length;
}

/**
 * Assert that most results match expected value
 */
export function assertMostlyBe<T>(
  results: T[],
  expected: T,
  options: StatisticalOptions = {}
): void {
  const { threshold = 0.8 } = options;

  const percentage = matchPercentage(results, expected);

  if (percentage < threshold) {
    // Count occurrences of each value
    const counts = new Map<string, number>();
    for (const result of results) {
      const key = JSON.stringify(result);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const distribution = Array.from(counts.entries())
      .map(([value, count]) => `  - ${value}: ${count}/${results.length} (${((count / results.length) * 100).toFixed(1)}%)`)
      .join('\n');

    const error = new Error(
      `Statistical assertion failed.\n` +
        `Expected at least ${(threshold * 100).toFixed(0)}% to be: ${JSON.stringify(expected)}\n` +
        `Actual percentage: ${(percentage * 100).toFixed(1)}%\n\n` +
        `Distribution:\n${distribution}`
    );
    error.name = 'StatisticalAssertionError';
    throw error;
  }
}

/**
 * Assert variance is within acceptable range
 */
export function assertLowVariance(
  results: number[],
  maxStdDev: number
): void {
  const stdDev = standardDeviation(results);

  if (stdDev > maxStdDev) {
    const error = new Error(
      `Variance assertion failed.\n` +
        `Expected standard deviation: <= ${maxStdDev}\n` +
        `Actual standard deviation: ${stdDev.toFixed(4)}\n` +
        `Mean: ${mean(results).toFixed(4)}\n` +
        `Min: ${Math.min(...results)}\n` +
        `Max: ${Math.max(...results)}`
    );
    error.name = 'VarianceAssertionError';
    throw error;
  }
}

/**
 * Assert that results are consistent (low variance in semantic similarity)
 */
export async function assertConsistent(
  results: string[],
  options: { threshold?: number } = {}
): Promise<void> {
  const { threshold = 0.8 } = options;

  if (results.length < 2) return;

  const { semanticSimilarity } = await import('./semantic');

  // Calculate pairwise similarities
  const similarities: number[] = [];
  const reference = results[0];

  for (let i = 1; i < results.length; i++) {
    const similarity = await semanticSimilarity(reference, results[i]);
    similarities.push(similarity);
  }

  const avgSimilarity = mean(similarities);
  const minSimilarity = Math.min(...similarities);

  if (avgSimilarity < threshold || minSimilarity < threshold - 0.1) {
    const error = new Error(
      `Consistency assertion failed.\n` +
        `Expected average similarity: >= ${threshold}\n` +
        `Actual average similarity: ${avgSimilarity.toFixed(4)}\n` +
        `Minimum similarity: ${minSimilarity.toFixed(4)}\n\n` +
        `This means the AI output varies too much between runs.`
    );
    error.name = 'ConsistencyAssertionError';
    throw error;
  }
}

/**
 * Chi-squared test for categorical distributions
 */
export function chiSquaredTest(
  observed: number[],
  expected: number[]
): { statistic: number; pValue: number } {
  if (observed.length !== expected.length) {
    throw new Error('Observed and expected arrays must have same length');
  }

  let statistic = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      statistic += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }

  // Approximate p-value using chi-squared distribution
  // This is a simplified approximation
  const df = observed.length - 1;
  const pValue = 1 - chiSquaredCDF(statistic, df);

  return { statistic, pValue };
}

/**
 * Approximate chi-squared CDF
 */
function chiSquaredCDF(x: number, df: number): number {
  if (x < 0) return 0;

  // Use incomplete gamma function approximation
  return gammainc(df / 2, x / 2);
}

/**
 * Incomplete gamma function (regularized)
 * Simple approximation for testing purposes
 */
function gammainc(a: number, x: number): number {
  if (x === 0) return 0;
  if (x < 0) return 0;

  // Series expansion for small x
  if (x < a + 1) {
    let sum = 0;
    let term = 1 / a;
    sum = term;

    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }

    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }

  // Continued fraction for large x
  return 1 - gammainc(a, x);
}

/**
 * Log gamma function approximation
 */
function logGamma(x: number): number {
  // Stirling's approximation
  return (
    0.5 * Math.log(2 * Math.PI) +
    (x - 0.5) * Math.log(x) -
    x +
    1 / (12 * x)
  );
}

/**
 * Assert distribution matches expected
 */
export function assertDistribution(
  results: string[],
  expectedDistribution: Record<string, number>,
  options: { significanceLevel?: number } = {}
): void {
  const { significanceLevel = 0.05 } = options;

  // Count actual occurrences
  const counts = new Map<string, number>();
  for (const result of results) {
    counts.set(result, (counts.get(result) || 0) + 1);
  }

  // Build observed and expected arrays
  const categories = Object.keys(expectedDistribution);
  const observed = categories.map((cat) => counts.get(cat) || 0);
  const total = results.length;
  const expected = categories.map((cat) => expectedDistribution[cat] * total);

  const { statistic, pValue } = chiSquaredTest(observed, expected);

  if (pValue < significanceLevel) {
    const distribution = categories
      .map(
        (cat, i) =>
          `  - ${cat}: expected ${expected[i].toFixed(1)}, got ${observed[i]}`
      )
      .join('\n');

    const error = new Error(
      `Distribution assertion failed.\n` +
        `Chi-squared statistic: ${statistic.toFixed(4)}\n` +
        `P-value: ${pValue.toFixed(4)} < ${significanceLevel}\n\n` +
        `Distribution:\n${distribution}`
    );
    error.name = 'DistributionAssertionError';
    throw error;
  }
}
