import type { UsageInfo, ModelPricing } from '../types.js';

export const ANTHROPIC_MODELS: Record<string, ModelPricing> = {
  'claude-opus-4-6': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-sonnet-4-6': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-sonnet-4-5-20250929': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4, contextWindow: 200000 },
  'claude-3-opus-20240229': { inputPer1M: 15, outputPer1M: 75, contextWindow: 200000 },
  'claude-3-sonnet-20240229': { inputPer1M: 3, outputPer1M: 15, contextWindow: 200000 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25, contextWindow: 200000 },
};

export function isAnthropicClient(client: any): boolean {
  if (!client || typeof client !== 'object') return false;
  return !!(client.messages || client.completions || client._client?.baseURL?.includes('anthropic'));
}

export function parseAnthropicResponse(response: any): UsageInfo | null {
  if (!response || typeof response !== 'object') return null;

  const usage = response.usage;
  if (!usage) return null;

  return {
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    model: response.model || 'unknown',
  };
}

export function extractAnthropicModel(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && 'model' in arg) {
      return arg.model;
    }
  }
  return undefined;
}
