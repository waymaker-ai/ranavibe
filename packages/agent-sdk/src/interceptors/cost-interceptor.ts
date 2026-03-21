import type { Interceptor, InterceptorResult, InterceptorContext, CostConfig, Violation, CostEntry } from '../types.js';

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'gpt-4o': { input: 2.50, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'o1': { input: 15, output: 60 },
  'o3-mini': { input: 1.10, output: 4.40 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'mistral-large': { input: 2, output: 6 },
};

const PERIOD_MS: Record<string, number> = {
  request: 0,
  hour: 3_600_000,
  day: 86_400_000,
  month: 2_592_000_000,
};

export class CostInterceptor implements Interceptor {
  name = 'cost';
  private config: Required<CostConfig>;
  private entries: CostEntry[] = [];
  totalCost = 0;

  constructor(config: CostConfig | true) {
    const c = config === true ? {} : config;
    this.config = {
      budgetLimit: c.budgetLimit ?? Infinity,
      budgetPeriod: c.budgetPeriod ?? 'day',
      warningThreshold: c.warningThreshold ?? 0.8,
      onExceeded: c.onExceeded ?? 'block',
      preferredModels: c.preferredModels ?? [],
      fallbackModel: c.fallbackModel ?? '',
    };
  }

  processInput(text: string, ctx: InterceptorContext): InterceptorResult {
    this.cleanup();
    const currentSpent = this.getCurrentSpent();
    const violations: Violation[] = [];

    if (currentSpent >= this.config.budgetLimit) {
      if (this.config.onExceeded === 'block') {
        return {
          allowed: false, blocked: true,
          reason: `Budget exceeded: $${currentSpent.toFixed(2)} / $${this.config.budgetLimit.toFixed(2)}`,
          violations: [{ interceptor: 'cost', rule: 'budget_exceeded', severity: 'high', message: `Budget exceeded`, action: 'block' }],
          metadata: { spent: currentSpent, limit: this.config.budgetLimit },
        };
      }
      violations.push({ interceptor: 'cost', rule: 'budget_exceeded', severity: 'high', message: `Budget exceeded: $${currentSpent.toFixed(2)}`, action: 'warn' });
    } else if (currentSpent >= this.config.budgetLimit * this.config.warningThreshold) {
      violations.push({ interceptor: 'cost', rule: 'budget_warning', severity: 'medium', message: `Budget at ${((currentSpent / this.config.budgetLimit) * 100).toFixed(0)}%`, action: 'warn' });
    }

    return { allowed: true, blocked: false, violations, metadata: { spent: currentSpent, limit: this.config.budgetLimit } };
  }

  processOutput(_text: string, _ctx: InterceptorContext): InterceptorResult {
    return { allowed: true, blocked: false, violations: [], metadata: {} };
  }

  recordUsage(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.getModelPricing(model);
    const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
    this.entries.push({ timestamp: Date.now(), model, inputTokens, outputTokens, cost });
    this.totalCost += cost;
    return cost;
  }

  getReport() {
    this.cleanup();
    const spent = this.getCurrentSpent();
    return {
      totalSpent: this.totalCost,
      periodSpent: spent,
      budgetLimit: this.config.budgetLimit,
      remaining: Math.max(0, this.config.budgetLimit - spent),
      entries: this.entries.length,
    };
  }

  private getModelPricing(model: string): { input: number; output: number } {
    if (MODEL_PRICING[model]) return MODEL_PRICING[model];
    const key = Object.keys(MODEL_PRICING).find((k) => model.includes(k) || k.includes(model));
    return key ? MODEL_PRICING[key] : { input: 3, output: 15 }; // default to Sonnet pricing
  }

  private getCurrentSpent(): number {
    if (this.config.budgetPeriod === 'request') return 0;
    return this.entries.reduce((s, e) => s + e.cost, 0);
  }

  private cleanup(): void {
    const windowMs = PERIOD_MS[this.config.budgetPeriod] || PERIOD_MS.day;
    if (windowMs === 0) return;
    const cutoff = Date.now() - windowMs;
    this.entries = this.entries.filter((e) => e.timestamp > cutoff);
  }
}
