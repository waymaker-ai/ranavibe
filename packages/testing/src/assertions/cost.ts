/**
 * Cost Assertions
 * Test that AI operations stay within budget
 */

import type { CostTracker } from '../types';

/**
 * Model pricing per 1M tokens (as of 2025)
 */
export const MODEL_PRICING: Record<
  string,
  { input: number; output: number; provider: string }
> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10.0, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  'gpt-4-turbo': { input: 10.0, output: 30.0, provider: 'openai' },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, provider: 'openai' },
  'o1': { input: 15.0, output: 60.0, provider: 'openai' },
  'o1-mini': { input: 3.0, output: 12.0, provider: 'openai' },

  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0, provider: 'anthropic' },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0, provider: 'anthropic' },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0, provider: 'anthropic' },

  // Google
  'gemini-1.5-pro': { input: 1.25, output: 5.0, provider: 'google' },
  'gemini-1.5-flash': { input: 0.075, output: 0.3, provider: 'google' },
  'gemini-2.0-flash': { input: 0.1, output: 0.4, provider: 'google' },

  // Groq
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79, provider: 'groq' },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08, provider: 'groq' },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24, provider: 'groq' },

  // xAI
  'grok-2': { input: 2.0, output: 10.0, provider: 'xai' },
  'grok-2-mini': { input: 0.2, output: 1.0, provider: 'xai' },

  // Local (free)
  'ollama/*': { input: 0, output: 0, provider: 'ollama' },
};

/**
 * Current test cost tracking
 */
let currentTestCost: CostTracker | null = null;

/**
 * Start tracking cost for a test
 */
export function startCostTracking(): void {
  currentTestCost = {
    totalCost: 0,
    inputTokens: 0,
    outputTokens: 0,
    model: '',
    provider: '',
  };
}

/**
 * Record token usage
 */
export function recordUsage(
  model: string,
  inputTokens: number,
  outputTokens: number
): void {
  if (!currentTestCost) {
    startCostTracking();
  }

  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  currentTestCost!.inputTokens += inputTokens;
  currentTestCost!.outputTokens += outputTokens;
  currentTestCost!.totalCost += inputCost + outputCost;
  currentTestCost!.model = model;
  currentTestCost!.provider = pricing.provider;
}

/**
 * Get current test cost
 */
export function getCurrentCost(): CostTracker | null {
  return currentTestCost;
}

/**
 * End cost tracking and return results
 */
export function endCostTracking(): CostTracker | null {
  const result = currentTestCost;
  currentTestCost = null;
  return result;
}

/**
 * Calculate cost for given usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Predict cost for a request
 */
export function predictCost(
  model: string,
  inputText: string,
  estimatedOutputTokens: number = 500
): { estimatedCost: number; inputTokens: number; outputTokens: number } {
  // Rough estimation: 1 token ≈ 4 characters
  const inputTokens = Math.ceil(inputText.length / 4);

  return {
    estimatedCost: calculateCost(model, inputTokens, estimatedOutputTokens),
    inputTokens,
    outputTokens: estimatedOutputTokens,
  };
}

/**
 * Assert cost is less than threshold
 */
export function assertCostLessThan(maxCost: number): void {
  const cost = getCurrentCost();

  if (!cost) {
    throw new Error('No cost tracking data available. Did you forget to track cost?');
  }

  if (cost.totalCost > maxCost) {
    const error = new Error(
      `Cost assertion failed.\n` +
        `Expected cost: <= $${maxCost.toFixed(6)}\n` +
        `Actual cost: $${cost.totalCost.toFixed(6)}\n\n` +
        `Breakdown:\n` +
        `  - Input tokens: ${cost.inputTokens}\n` +
        `  - Output tokens: ${cost.outputTokens}\n` +
        `  - Model: ${cost.model}\n` +
        `  - Provider: ${cost.provider}`
    );
    error.name = 'CostAssertionError';
    throw error;
  }
}

/**
 * Assert token usage is less than threshold
 */
export function assertTokensLessThan(
  maxTokens: number,
  type: 'input' | 'output' | 'total' = 'total'
): void {
  const cost = getCurrentCost();

  if (!cost) {
    throw new Error('No cost tracking data available. Did you forget to track cost?');
  }

  let actualTokens: number;
  switch (type) {
    case 'input':
      actualTokens = cost.inputTokens;
      break;
    case 'output':
      actualTokens = cost.outputTokens;
      break;
    default:
      actualTokens = cost.inputTokens + cost.outputTokens;
  }

  if (actualTokens > maxTokens) {
    const error = new Error(
      `Token assertion failed.\n` +
        `Expected ${type} tokens: <= ${maxTokens}\n` +
        `Actual ${type} tokens: ${actualTokens}\n\n` +
        `Full breakdown:\n` +
        `  - Input tokens: ${cost.inputTokens}\n` +
        `  - Output tokens: ${cost.outputTokens}\n` +
        `  - Total tokens: ${cost.inputTokens + cost.outputTokens}`
    );
    error.name = 'TokenAssertionError';
    throw error;
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.000001) {
    return '< $0.000001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format tokens for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Get cheaper model suggestion
 */
export function suggestCheaperModel(
  currentModel: string,
  currentCost: number
): { model: string; estimatedCost: number; savings: number } | null {
  const currentPricing = MODEL_PRICING[currentModel];
  if (!currentPricing) return null;

  // Find cheaper alternatives
  const alternatives = Object.entries(MODEL_PRICING)
    .filter(([_, pricing]) => {
      const avgCost = (pricing.input + pricing.output) / 2;
      const currentAvg = (currentPricing.input + currentPricing.output) / 2;
      return avgCost < currentAvg * 0.5; // At least 50% cheaper
    })
    .sort((a, b) => {
      const aAvg = (a[1].input + a[1].output) / 2;
      const bAvg = (b[1].input + b[1].output) / 2;
      return bAvg - aAvg; // Best quality first (most expensive of cheap options)
    });

  if (alternatives.length === 0) return null;

  const [model, pricing] = alternatives[0];
  const ratio = (pricing.input + pricing.output) / (currentPricing.input + currentPricing.output);
  const estimatedCost = currentCost * ratio;

  return {
    model,
    estimatedCost,
    savings: currentCost - estimatedCost,
  };
}
