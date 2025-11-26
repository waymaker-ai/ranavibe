import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/**
 * OpenAI client instance
 * Lazy-loaded to avoid initialization if API key not provided
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Anthropic client instance
 * Lazy-loaded to avoid initialization if API key not provided
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * xAI Grok client instance (OpenAI-compatible)
 * Lazy-loaded to avoid initialization if API key not provided
 */
export const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

/**
 * LLM provider configuration
 */
export const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4-turbo-preview': {
        inputCost: 0.01, // per 1K tokens
        outputCost: 0.03,
        contextWindow: 128000,
      },
      'gpt-3.5-turbo': {
        inputCost: 0.0005,
        outputCost: 0.0015,
        contextWindow: 16385,
      },
    },
  },
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-3-5-sonnet-20241022': {
        inputCost: 0.003,
        outputCost: 0.015,
        contextWindow: 200000,
      },
      'claude-3-haiku-20240307': {
        inputCost: 0.00025,
        outputCost: 0.00125,
        contextWindow: 200000,
      },
    },
  },
  grok: {
    name: 'xAI Grok',
    models: {
      'grok-beta': {
        inputCost: 0.005,
        outputCost: 0.015,
        contextWindow: 131072,
      },
    },
  },
} as const;

/**
 * Get the cheapest model for a given task
 * Based on estimated token count and complexity
 */
export function selectModel(options: {
  estimatedTokens: number;
  complexity: 'low' | 'medium' | 'high';
  provider?: 'openai' | 'anthropic' | 'grok';
}) {
  const { estimatedTokens, complexity, provider } = options;

  // For low complexity tasks, use cheapest model
  if (complexity === 'low') {
    if (provider === 'anthropic') return 'claude-3-haiku-20240307';
    if (provider === 'grok') return 'grok-beta';
    return 'gpt-3.5-turbo';
  }

  // For high complexity or large context, use best model
  if (complexity === 'high' || estimatedTokens > 50000) {
    if (provider === 'anthropic') return 'claude-3-5-sonnet-20241022';
    if (provider === 'grok') return 'grok-beta';
    return 'gpt-4-turbo-preview';
  }

  // Medium complexity: Grok offers good balance
  if (provider === 'anthropic') return 'claude-3-5-sonnet-20241022';
  if (provider === 'grok') return 'grok-beta';
  if (provider === 'openai') return 'gpt-3.5-turbo';

  // Default to Grok for good cost/quality balance
  return 'grok-beta';
}

/**
 * Calculate cost for a given model and token count
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const allModels = {
    ...LLM_PROVIDERS.openai.models,
    ...LLM_PROVIDERS.anthropic.models,
  };

  const modelConfig = allModels[model as keyof typeof allModels];
  if (!modelConfig) return 0;

  const inputCost = (inputTokens / 1000) * modelConfig.inputCost;
  const outputCost = (outputTokens / 1000) * modelConfig.outputCost;

  return inputCost + outputCost;
}
