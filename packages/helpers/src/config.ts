/**
 * Configuration for @rana/helpers
 */

import type { Provider, HelperConfig } from './types';

// Default configuration
const defaultConfig: Required<HelperConfig> = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: '',
  cache: true,
  cacheTTL: 3600, // 1 hour
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};

// Global config storage
let globalConfig: HelperConfig = { ...defaultConfig };

/**
 * Configure default settings for all helpers
 *
 * @example
 * ```typescript
 * import { configure } from '@rana/helpers';
 *
 * configure({
 *   provider: 'anthropic',
 *   model: 'claude-3-haiku',
 *   cache: true
 * });
 * ```
 */
export function configure(config: Partial<HelperConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current configuration
 */
export function getConfig(): Required<HelperConfig> {
  return {
    ...defaultConfig,
    ...globalConfig,
    apiKey: globalConfig.apiKey || getApiKeyFromEnv(globalConfig.provider || defaultConfig.provider),
  };
}

/**
 * Get merged configuration with options
 */
export function mergeConfig(options?: HelperConfig): Required<HelperConfig> {
  const base = getConfig();
  if (!options) return base;

  return {
    ...base,
    ...options,
    apiKey: options.apiKey || base.apiKey || getApiKeyFromEnv(options.provider || base.provider),
  };
}

/**
 * Get API key from environment variables
 */
function getApiKeyFromEnv(provider: Provider): string {
  const envVars: Record<Provider, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    groq: 'GROQ_API_KEY',
    together: 'TOGETHER_API_KEY',
    mistral: 'MISTRAL_API_KEY',
  };

  const envVar = envVars[provider];
  return process.env[envVar] || '';
}

/**
 * Model recommendations by task type
 */
export const recommendedModels: Record<string, Record<Provider, string>> = {
  summarize: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
  translate: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-70b-versatile',
    together: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    mistral: 'mistral-large-latest',
  },
  classify: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
  extract: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    groq: 'llama-3.1-70b-versatile',
    together: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    mistral: 'mistral-large-latest',
  },
  sentiment: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
  answer: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    groq: 'llama-3.1-70b-versatile',
    together: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    mistral: 'mistral-large-latest',
  },
  rewrite: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
  generate: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
    groq: 'llama-3.1-70b-versatile',
    together: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    mistral: 'mistral-large-latest',
  },
  compare: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
  moderate: {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash',
    groq: 'llama-3.1-8b-instant',
    together: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    mistral: 'mistral-small-latest',
  },
};

/**
 * Cost per 1M tokens by provider/model (input/output)
 */
export const modelCosts: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  // Google
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  // Groq
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  // Together
  'meta-llama/Llama-3.1-70B-Instruct-Turbo': { input: 0.88, output: 0.88 },
  'meta-llama/Llama-3.1-8B-Instruct-Turbo': { input: 0.18, output: 0.18 },
  // Mistral
  'mistral-large-latest': { input: 3.0, output: 9.0 },
  'mistral-small-latest': { input: 0.1, output: 0.3 },
};
