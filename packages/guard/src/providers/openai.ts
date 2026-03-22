import type { UsageInfo, ModelPricing } from '../types.js';

export const OPENAI_MODELS: Record<string, ModelPricing> = {
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10, contextWindow: 128000 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, contextWindow: 128000 },
  'gpt-4-turbo': { inputPer1M: 10, outputPer1M: 30, contextWindow: 128000 },
  'gpt-4': { inputPer1M: 30, outputPer1M: 60, contextWindow: 8192 },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50, contextWindow: 16385 },
  'o1': { inputPer1M: 15, outputPer1M: 60, contextWindow: 200000 },
  'o1-mini': { inputPer1M: 3, outputPer1M: 12, contextWindow: 128000 },
  'o3-mini': { inputPer1M: 1.10, outputPer1M: 4.40, contextWindow: 200000 },
};

export function isOpenAIClient(client: any): boolean {
  if (!client || typeof client !== 'object') return false;
  return !!(client.chat?.completions || client._client?.baseURL?.includes('openai'));
}

export function parseOpenAIResponse(response: any): UsageInfo | null {
  if (!response || typeof response !== 'object') return null;

  const usage = response.usage;
  if (!usage) return null;

  return {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    model: response.model || 'unknown',
  };
}

export function extractOpenAIModel(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && 'model' in arg) {
      return arg.model;
    }
  }
  return undefined;
}
