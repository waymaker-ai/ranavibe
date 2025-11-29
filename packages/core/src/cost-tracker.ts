/**
 * Cost Tracking Module with Budget Enforcement
 * Tracks LLM usage, cost savings, and enforces spending limits
 */

import type {
  RanaChatResponse,
  CostStats,
  CostBreakdown,
  LLMProvider,
  BudgetConfig,
  BudgetPeriod,
} from './types';
import { RanaBudgetExceededError, RanaBudgetWarningError } from './types';

export interface CostTrackingConfig {
  enabled?: boolean;
  log_to_console?: boolean;
  save_to_db?: boolean;
  budget?: BudgetConfig;
}

export interface BudgetStatus {
  spent: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  period: BudgetPeriod;
  periodStart: Date;
  periodEnd: Date;
  isExceeded: boolean;
  isWarning: boolean;
}

export class CostTracker {
  private costs: RanaChatResponse[] = [];
  private config: CostTrackingConfig;
  private warningEmitted: boolean = false;

  constructor(config: CostTrackingConfig = {}) {
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
    this.warningEmitted = false;
  }

  // ============================================================================
  // Budget Enforcement
  // ============================================================================

  /**
   * Check if budget allows a request
   * Call this BEFORE making an API call
   * @throws RanaBudgetExceededError if budget is exceeded and action is 'block'
   */
  checkBudget(options: { critical?: boolean } = {}): void {
    const budget = this.config.budget;
    if (!budget) return;

    // Allow critical requests to bypass if configured
    if (options.critical && budget.allowCriticalBypass) {
      return;
    }

    const status = this.getBudgetStatus();
    if (!status) return;

    // Check if exceeded
    if (status.isExceeded) {
      if (budget.onExceeded) {
        budget.onExceeded(status.spent, status.limit);
      }

      switch (budget.action) {
        case 'block':
          throw new RanaBudgetExceededError(
            status.spent,
            status.limit,
            status.period
          );
        case 'warn':
          console.warn(
            `[RANA BUDGET WARNING] Budget exceeded: $${status.spent.toFixed(4)} / $${status.limit.toFixed(2)}`
          );
          break;
        case 'log':
          console.log(
            `[RANA BUDGET] Exceeded: $${status.spent.toFixed(4)} / $${status.limit.toFixed(2)}`
          );
          break;
      }
      return;
    }

    // Check for warning threshold
    const warningThreshold = budget.warningThreshold ?? 80;
    if (status.percentUsed >= warningThreshold && !this.warningEmitted) {
      this.warningEmitted = true;

      if (budget.onWarning) {
        budget.onWarning(status.spent, status.limit, status.percentUsed);
      }

      console.warn(
        `[RANA BUDGET WARNING] ${status.percentUsed.toFixed(1)}% of budget used ` +
          `($${status.spent.toFixed(4)} / $${status.limit.toFixed(2)})`
      );
    }
  }

  /**
   * Get current budget status
   */
  getBudgetStatus(): BudgetStatus | null {
    const budget = this.config.budget;
    if (!budget) return null;

    const { start, end } = this.getPeriodBounds(budget.period);
    const periodCosts = this.costs.filter(
      (c) => c.created_at >= start && c.created_at <= end
    );

    const spent = periodCosts.reduce((sum, c) => sum + c.cost.total_cost, 0);
    const remaining = Math.max(0, budget.limit - spent);
    const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    const warningThreshold = budget.warningThreshold ?? 80;

    return {
      spent,
      limit: budget.limit,
      remaining,
      percentUsed,
      period: budget.period,
      periodStart: start,
      periodEnd: end,
      isExceeded: spent >= budget.limit,
      isWarning: percentUsed >= warningThreshold,
    };
  }

  /**
   * Estimate if a request will exceed budget
   * @param estimatedCost Estimated cost of the upcoming request
   */
  willExceedBudget(estimatedCost: number): boolean {
    const status = this.getBudgetStatus();
    if (!status) return false;
    return status.spent + estimatedCost > status.limit;
  }

  /**
   * Update budget configuration
   */
  setBudget(budget: BudgetConfig): void {
    this.config.budget = budget;
    this.warningEmitted = false;
  }

  /**
   * Remove budget enforcement
   */
  clearBudget(): void {
    this.config.budget = undefined;
    this.warningEmitted = false;
  }

  /**
   * Get period bounds based on budget period
   */
  private getPeriodBounds(period: BudgetPeriod): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
      case 'hourly':
        start.setMinutes(0, 0, 0);
        end.setMinutes(59, 59, 999);
        break;

      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;

      case 'total':
        // For total, start from beginning of time
        start.setTime(0);
        // End is far future
        end.setFullYear(9999);
        break;
    }

    return { start, end };
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
