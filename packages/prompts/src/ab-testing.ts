/**
 * A/B Test Manager for prompt experiments
 */

import type {
  ABTestConfig,
  ABTestVariant,
  ABTestResult,
  VariantMetrics,
} from './types';

/**
 * A/B Test Manager
 * Manages experiments for prompt optimization
 */
export class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  /**
   * Create a new A/B test
   */
  async create(
    promptId: string,
    config: {
      name: string;
      variants: Array<{
        name: string;
        template: string;
        traffic?: number;
      }>;
      metric: string;
      trafficSplit?: number[];
      minSampleSize?: number;
      maxDuration?: number;
    }
  ): Promise<string> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate traffic split
    const numVariants = config.variants.length;
    const defaultTraffic = 100 / numVariants;
    const trafficSplit = config.trafficSplit || config.variants.map(() => defaultTraffic);

    const variants: ABTestVariant[] = config.variants.map((v, i) => ({
      id: `var_${i}`,
      name: v.name,
      template: v.template,
      traffic: v.traffic ?? trafficSplit[i],
      metrics: this.initializeMetrics(),
    }));

    const test: ABTestConfig = {
      id: testId,
      promptId,
      name: config.name,
      variants,
      metric: config.metric,
      trafficSplit,
      minSampleSize: config.minSampleSize || 100,
      maxDuration: config.maxDuration || 14,
      status: 'draft',
      createdAt: new Date(),
    };

    this.tests.set(testId, test);
    return testId;
  }

  /**
   * Start an A/B test
   */
  async start(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    test.status = 'running';
    test.startedAt = new Date();
    this.tests.set(testId, test);
  }

  /**
   * Pause an A/B test
   */
  async pause(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    test.status = 'paused';
    this.tests.set(testId, test);
  }

  /**
   * Complete an A/B test and declare winner
   */
  async complete(testId: string, winnerId?: string): Promise<ABTestResult> {
    const test = this.tests.get(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    // Calculate winner if not specified
    if (!winnerId) {
      const sorted = [...test.variants].sort(
        (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
      );
      winnerId = sorted[0]?.id;
    }

    test.status = 'completed';
    test.winner = winnerId;
    test.completedAt = new Date();
    this.tests.set(testId, test);

    return this.getResults(testId);
  }

  /**
   * Select variant for a user
   */
  async selectVariant(
    testId: string,
    userId?: string
  ): Promise<{ variantId: string; template: string } | null> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return null;

    // Check for existing assignment
    if (userId) {
      const userTests = this.userAssignments.get(userId);
      if (userTests?.has(testId)) {
        const variantId = userTests.get(testId)!;
        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
          return { variantId, template: variant.template };
        }
      }
    }

    // Select variant based on traffic split
    const variant = this.selectByTraffic(test.variants);

    // Store assignment
    if (userId) {
      if (!this.userAssignments.has(userId)) {
        this.userAssignments.set(userId, new Map());
      }
      this.userAssignments.get(userId)!.set(testId, variant.id);
    }

    return { variantId: variant.id, template: variant.template };
  }

  /**
   * Record an impression (prompt execution)
   */
  async recordImpression(testId: string, variantId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (variant) {
      variant.metrics.impressions++;
      this.updateConversionRate(variant.metrics);
      this.tests.set(testId, test);
    }
  }

  /**
   * Record a conversion
   */
  async recordConversion(
    testId: string,
    variantId: string,
    value: number = 1
  ): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (variant) {
      variant.metrics.conversions += value;
      this.updateConversionRate(variant.metrics);
      this.tests.set(testId, test);

      // Check if test should auto-complete
      await this.checkAutoComplete(testId);
    }
  }

  /**
   * Record custom metric
   */
  async recordMetric(
    testId: string,
    variantId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (variant) {
      variant.metrics.customMetrics[metric] =
        (variant.metrics.customMetrics[metric] || 0) + value;
      this.tests.set(testId, test);
    }
  }

  /**
   * Get test results
   */
  getResults(testId: string): ABTestResult {
    const test = this.tests.get(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    const sortedVariants = [...test.variants].sort(
      (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
    );

    const control = sortedVariants[sortedVariants.length - 1];
    const leader = sortedVariants[0];

    // Calculate statistical significance (simplified)
    const confidence = this.calculateConfidence(
      leader?.metrics || this.initializeMetrics(),
      control?.metrics || this.initializeMetrics()
    );

    const variants = sortedVariants.map((v, i) => ({
      name: v.name,
      metrics: v.metrics,
      improvement:
        i === sortedVariants.length - 1
          ? 0
          : ((v.metrics.conversionRate - control.metrics.conversionRate) /
              (control.metrics.conversionRate || 1)) *
            100,
    }));

    let recommendation: string;
    if (test.status !== 'completed') {
      recommendation = `Test is ${test.status}. Collect more data before making decisions.`;
    } else if (confidence < 0.95) {
      recommendation = 'Results are not statistically significant. Consider running longer.';
    } else {
      recommendation = `${leader.name} is the winner with ${leader.metrics.conversionRate.toFixed(2)}% conversion rate.`;
    }

    return {
      testId,
      status: test.status === 'completed' ? 'completed' : 'running',
      winner: test.winner,
      confidence,
      variants,
      recommendation,
    };
  }

  /**
   * List all tests
   */
  list(filters?: {
    promptId?: string;
    status?: ABTestConfig['status'];
  }): ABTestConfig[] {
    let tests = Array.from(this.tests.values());

    if (filters?.promptId) {
      tests = tests.filter(t => t.promptId === filters.promptId);
    }
    if (filters?.status) {
      tests = tests.filter(t => t.status === filters.status);
    }

    return tests;
  }

  /**
   * Delete a test
   */
  async delete(testId: string): Promise<boolean> {
    return this.tests.delete(testId);
  }

  // Private methods

  private initializeMetrics(): VariantMetrics {
    return {
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      avgLatency: 0,
      avgCost: 0,
      customMetrics: {},
    };
  }

  private updateConversionRate(metrics: VariantMetrics): void {
    metrics.conversionRate =
      metrics.impressions > 0
        ? (metrics.conversions / metrics.impressions) * 100
        : 0;
  }

  private selectByTraffic(variants: ABTestVariant[]): ABTestVariant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.traffic;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private calculateConfidence(
    treatment: VariantMetrics,
    control: VariantMetrics
  ): number {
    // Simplified confidence calculation
    // In production, use proper statistical tests (Chi-square, Z-test, etc.)
    const totalSamples = treatment.impressions + control.impressions;
    if (totalSamples < 100) return 0;

    const diff = Math.abs(treatment.conversionRate - control.conversionRate);
    const pooledRate =
      (treatment.conversions + control.conversions) / totalSamples;
    const se = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / treatment.impressions + 1 / control.impressions)
    ) * 100;

    if (se === 0) return 0;

    const zScore = diff / se;
    // Approximate p-value from z-score
    const confidence = 1 - 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return Math.min(confidence, 0.9999);
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private async checkAutoComplete(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return;

    const totalImpressions = test.variants.reduce(
      (sum, v) => sum + v.metrics.impressions,
      0
    );

    // Auto-complete if min sample size reached
    if (totalImpressions >= (test.minSampleSize || 100)) {
      const results = this.getResults(testId);
      if (results.confidence >= 0.95) {
        await this.complete(testId);
      }
    }

    // Auto-complete if max duration reached
    if (test.startedAt) {
      const daysSinceStart =
        (Date.now() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceStart >= (test.maxDuration || 14)) {
        await this.complete(testId);
      }
    }
  }
}
