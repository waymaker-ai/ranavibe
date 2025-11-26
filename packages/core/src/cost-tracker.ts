/**
 * Cost Tracking Module
 * Tracks LLM usage and cost savings
 */

import type { RanaChatResponse, CostStats, CostBreakdown, LLMProvider } from './types';

export class CostTracker {
  private costs: RanaChatResponse[] = [];
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Track a response
   */
  async track(response: RanaChatResponse): Promise<void> {
    this.costs.push(response);

    if (this.config?.log_to_console) {
      console.log(`[RANA Cost] $${response.cost.total_cost.toFixed(4)} | ${response.provider} | ${response.usage.total_tokens} tokens`);
    }

    // TODO: Save to database if enabled
    if (this.config?.save_to_db) {
      // await this.saveToDB(response);
    }
  }

  /**
   * Get comprehensive cost statistics
   */
  getStats(): CostStats {
    const now = new Date();
    const startOfPeriod = new Date(now);
    startOfPeriod.setHours(0, 0, 0, 0);

    // Filter to current period
    const periodCosts = this.costs.filter(
      (c) => c.created_at >= startOfPeriod
    );

    // Calculate totals
    const total_spent = periodCosts.reduce(
      (sum, c) => sum + c.cost.total_cost,
      0
    );

    const total_tokens = periodCosts.reduce(
      (sum, c) => sum + c.usage.total_tokens,
      0
    );

    const total_requests = periodCosts.length;

    const cache_hits = periodCosts.filter((c) => c.cached).length;
    const cache_hit_rate = total_requests > 0 ? cache_hits / total_requests : 0;

    // Calculate what it WOULD have cost without optimization
    const estimated_without_optimization = this.estimateWithoutOptimization(periodCosts);
    const total_saved = estimated_without_optimization - total_spent;
    const savings_percentage = estimated_without_optimization > 0
      ? (total_saved / estimated_without_optimization) * 100
      : 0;

    // Breakdown by provider
    const breakdown = this.calculateBreakdown(periodCosts, total_spent);

    return {
      total_spent,
      total_saved,
      savings_percentage,
      total_requests,
      total_tokens,
      cache_hit_rate,
      breakdown,
      period: {
        start: startOfPeriod,
        end: now,
      },
    };
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.costs.reduce((sum, c) => sum + c.cost.total_cost, 0);
  }

  /**
   * Get total saved
   */
  getTotalSaved(): number {
    const stats = this.getStats();
    return stats.total_saved;
  }

  /**
   * Reset tracking
   */
  reset(): void {
    this.costs = [];
  }

  /**
   * Calculate breakdown by provider
   */
  private calculateBreakdown(
    costs: RanaChatResponse[],
    totalCost: number
  ): CostBreakdown[] {
    const byProvider = new Map<LLMProvider, RanaChatResponse[]>();

    costs.forEach((c) => {
      if (!byProvider.has(c.provider)) {
        byProvider.set(c.provider, []);
      }
      byProvider.get(c.provider)!.push(c);
    });

    return Array.from(byProvider.entries()).map(([provider, providerCosts]) => {
      const provider_cost = providerCosts.reduce(
        (sum, c) => sum + c.cost.total_cost,
        0
      );
      const provider_tokens = providerCosts.reduce(
        (sum, c) => sum + c.usage.total_tokens,
        0
      );

      return {
        provider,
        model: providerCosts[0].model,
        requests: providerCosts.length,
        total_tokens: provider_tokens,
        total_cost: provider_cost,
        percentage: totalCost > 0 ? (provider_cost / totalCost) * 100 : 0,
      };
    });
  }

  /**
   * Estimate cost without RANA optimization
   * Assumes everything would be GPT-4o without caching
   */
  private estimateWithoutOptimization(costs: RanaChatResponse[]): number {
    const GPT4O_INPUT_COST = 2.5 / 1_000_000; // $2.50 per 1M tokens
    const GPT4O_OUTPUT_COST = 10.0 / 1_000_000; // $10.00 per 1M tokens

    return costs.reduce((sum, c) => {
      // Skip cached responses (wouldn't exist without RANA)
      if (c.cached) return sum;

      const input_cost = c.usage.prompt_tokens * GPT4O_INPUT_COST;
      const output_cost = c.usage.completion_tokens * GPT4O_OUTPUT_COST;
      return sum + input_cost + output_cost;
    }, 0);
  }
}
