import type { BudgetConfig, BudgetState, CostEstimate, ModelPricing } from '../types.js';

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-opus-4-6': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-sonnet-4-6': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-3-opus-20240229': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-3-sonnet-20240229': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25, contextWindow: 200000 },

  // OpenAI
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10, contextWindow: 128000 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, contextWindow: 128000 },
  'gpt-4-turbo': { inputPer1M: 10, outputPer1M: 30, contextWindow: 128000 },
  'gpt-4': { inputPer1M: 30, outputPer1M: 60, contextWindow: 8192 },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50, contextWindow: 16385 },
  'o1': { inputPer1M: 15, outputPer1M: 60, contextWindow: 200000 },
  'o1-mini': { inputPer1M: 3, outputPer1M: 12, contextWindow: 128000 },
  'o3-mini': { inputPer1M: 1.10, outputPer1M: 4.40, contextWindow: 200000 },

  // Google
  'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40, contextWindow: 1048576 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, contextWindow: 1048576 },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5, contextWindow: 2097152 },
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10, contextWindow: 1048576 },

  // Mistral
  'mistral-large': { inputPer1M: 2, outputPer1M: 6, contextWindow: 128000 },
  'mistral-small': { inputPer1M: 0.20, outputPer1M: 0.60, contextWindow: 32000 },

  // Groq
  'llama-3.1-70b': { inputPer1M: 0.59, outputPer1M: 0.79, contextWindow: 131072 },
  'llama-3.1-8b': { inputPer1M: 0.05, outputPer1M: 0.08, contextWindow: 131072 },
};

const PERIOD_MS: Record<string, number> = {
  request: 0,
  hour: 3600000,
  day: 86400000,
  month: 2592000000,
};

export class BudgetEnforcer {
  private config: Required<BudgetConfig>;
  private spent: number = 0;
  private periodStart: number = Date.now();
  private entries: Array<{ cost: number; timestamp: number; model: string }> = [];

  constructor(config: BudgetConfig) {
    this.config = {
      limit: config.limit,
      period: config.period,
      warningThreshold: config.warningThreshold ?? 0.8,
      onExceeded: config.onExceeded ?? 'block',
    };
  }

  getModelPricing(model: string): ModelPricing | undefined {
    if (MODEL_PRICING[model]) return MODEL_PRICING[model];
    const key = Object.keys(MODEL_PRICING).find((k) => model.includes(k) || k.includes(model));
    return key ? MODEL_PRICING[key] : undefined;
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): CostEstimate {
    const pricing = this.getModelPricing(model);
    const provider = model.startsWith('claude') ? 'anthropic' :
      model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') ? 'openai' :
      model.startsWith('gemini') ? 'google' :
      model.startsWith('mistral') ? 'mistral' :
      model.startsWith('llama') ? 'groq' : 'unknown';

    if (!pricing) {
      return { model, provider, inputTokens, outputTokens, inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

    return { model, provider, inputTokens, outputTokens, inputCost, outputCost, totalCost: inputCost + outputCost };
  }

  recordCost(model: string, inputTokens: number, outputTokens: number): void {
    const estimate = this.estimateCost(model, inputTokens, outputTokens);
    this.entries.push({ cost: estimate.totalCost, timestamp: Date.now(), model });
    this.cleanupOldEntries();
  }

  checkBudget(additionalCost: number = 0): BudgetState {
    this.cleanupOldEntries();
    const spent = this.getCurrentSpent();

    return {
      spent,
      limit: this.config.limit,
      period: this.config.period,
      remaining: Math.max(0, this.config.limit - spent),
      warning: spent + additionalCost >= this.config.limit * this.config.warningThreshold,
      periodStart: this.periodStart,
    };
  }

  isExceeded(additionalCost: number = 0): boolean {
    this.cleanupOldEntries();
    return this.getCurrentSpent() + additionalCost >= this.config.limit;
  }

  get action(): string {
    return this.config.onExceeded;
  }

  reset(): void {
    this.entries = [];
    this.spent = 0;
    this.periodStart = Date.now();
  }

  private getCurrentSpent(): number {
    if (this.config.period === 'request') return 0;
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  private cleanupOldEntries(): void {
    if (this.config.period === 'request') return;
    const windowMs = PERIOD_MS[this.config.period] || PERIOD_MS.day;
    const cutoff = Date.now() - windowMs;
    this.entries = this.entries.filter((e) => e.timestamp > cutoff);
  }

  static getAllPricing(): Record<string, ModelPricing> {
    return { ...MODEL_PRICING };
  }

  static compareModels(inputTokens: number, outputTokens: number): CostEstimate[] {
    const enforcer = new BudgetEnforcer({ limit: Infinity, period: 'month' });
    return Object.keys(MODEL_PRICING)
      .map((model) => enforcer.estimateCost(model, inputTokens, outputTokens))
      .sort((a, b) => a.totalCost - b.totalCost);
  }
}
