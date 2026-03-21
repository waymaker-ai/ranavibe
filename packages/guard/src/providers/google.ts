import type { UsageInfo, ModelPricing } from '../types.js';

export const GOOGLE_MODELS: Record<string, ModelPricing> = {
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10, contextWindow: 1048576 },
  'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40, contextWindow: 1048576 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, contextWindow: 1048576 },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5, contextWindow: 2097152 },
};

export function isGoogleClient(client: any): boolean {
  if (!client || typeof client !== 'object') return false;
  return !!(client.generateContent || client._client?.baseURL?.includes('generativelanguage'));
}

export function parseGoogleResponse(response: any): UsageInfo | null {
  if (!response || typeof response !== 'object') return null;

  const metadata = response.usageMetadata;
  if (!metadata) return null;

  return {
    inputTokens: metadata.promptTokenCount || 0,
    outputTokens: metadata.candidatesTokenCount || 0,
    model: response.modelVersion || 'unknown',
  };
}

export function extractGoogleModel(args: any[]): string | undefined {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && 'model' in arg) {
      return arg.model;
    }
  }
  return undefined;
}
