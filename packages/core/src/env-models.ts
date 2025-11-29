/**
 * RANA Environment-Based Model Selection
 *
 * Automatically selects models based on NODE_ENV and configuration.
 * Uses cheap/local models in development, production models in prod.
 *
 * @example
 * ```typescript
 * import { getModelForEnv, createEnvAwareRana } from '@rana/core';
 *
 * // Get model based on environment
 * const model = getModelForEnv('chat');
 * // dev: 'llama3.2' (Ollama), prod: 'gpt-4o-mini'
 *
 * // Or use env-aware RANA instance
 * const rana = createEnvAwareRana({
 *   providers: { openai: process.env.OPENAI_API_KEY }
 * });
 * ```
 */

export type ModelPurpose =
  | 'chat'           // General chat
  | 'completion'     // Text completion
  | 'code'           // Code generation
  | 'embedding'      // Text embeddings
  | 'vision'         // Image understanding
  | 'fast'           // Low latency
  | 'smart'          // High quality
  | 'cheap';         // Cost optimized

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface ModelConfig {
  provider: string;
  model: string;
  fallback?: { provider: string; model: string };
}

export interface EnvModelConfig {
  development: ModelConfig;
  staging: ModelConfig;
  production: ModelConfig;
  test: ModelConfig;
}

/**
 * Default model configurations per purpose and environment
 */
const DEFAULT_MODELS: Record<ModelPurpose, EnvModelConfig> = {
  chat: {
    development: { provider: 'ollama', model: 'llama3.2', fallback: { provider: 'openai', model: 'gpt-4o-mini' } },
    staging: { provider: 'openai', model: 'gpt-4o-mini' },
    production: { provider: 'openai', model: 'gpt-4o' },
    test: { provider: 'ollama', model: 'llama3.2:1b', fallback: { provider: 'openai', model: 'gpt-4o-mini' } },
  },
  completion: {
    development: { provider: 'ollama', model: 'llama3.2', fallback: { provider: 'openai', model: 'gpt-4o-mini' } },
    staging: { provider: 'openai', model: 'gpt-4o-mini' },
    production: { provider: 'openai', model: 'gpt-4o' },
    test: { provider: 'ollama', model: 'llama3.2:1b' },
  },
  code: {
    development: { provider: 'ollama', model: 'codellama', fallback: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' } },
    staging: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
    production: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    test: { provider: 'ollama', model: 'codellama' },
  },
  embedding: {
    development: { provider: 'ollama', model: 'nomic-embed-text', fallback: { provider: 'openai', model: 'text-embedding-3-small' } },
    staging: { provider: 'openai', model: 'text-embedding-3-small' },
    production: { provider: 'openai', model: 'text-embedding-3-large' },
    test: { provider: 'ollama', model: 'nomic-embed-text' },
  },
  vision: {
    development: { provider: 'ollama', model: 'llava', fallback: { provider: 'openai', model: 'gpt-4o-mini' } },
    staging: { provider: 'openai', model: 'gpt-4o-mini' },
    production: { provider: 'openai', model: 'gpt-4o' },
    test: { provider: 'ollama', model: 'llava' },
  },
  fast: {
    development: { provider: 'ollama', model: 'llama3.2:1b', fallback: { provider: 'groq', model: 'llama-3.1-8b-instant' } },
    staging: { provider: 'groq', model: 'llama-3.1-8b-instant' },
    production: { provider: 'groq', model: 'llama-3.1-70b-versatile' },
    test: { provider: 'ollama', model: 'llama3.2:1b' },
  },
  smart: {
    development: { provider: 'ollama', model: 'llama3.2', fallback: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' } },
    staging: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    production: { provider: 'anthropic', model: 'claude-3-opus-20240229' },
    test: { provider: 'ollama', model: 'llama3.2' },
  },
  cheap: {
    development: { provider: 'ollama', model: 'llama3.2:1b' },
    staging: { provider: 'openai', model: 'gpt-4o-mini' },
    production: { provider: 'openai', model: 'gpt-4o-mini' },
    test: { provider: 'ollama', model: 'llama3.2:1b' },
  },
};

/**
 * Custom model overrides (can be set via RANA_MODELS env var or config)
 */
let customModelOverrides: Partial<Record<ModelPurpose, Partial<EnvModelConfig>>> = {};

/**
 * Get the current environment
 */
export function getCurrentEnv(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() || 'development';

  if (env === 'prod' || env === 'production') return 'production';
  if (env === 'staging' || env === 'stage') return 'staging';
  if (env === 'test' || env === 'testing') return 'test';

  return 'development';
}

/**
 * Get model configuration for a purpose in the current environment
 */
export function getModelForEnv(purpose: ModelPurpose = 'chat'): ModelConfig {
  const env = getCurrentEnv();

  // Check for custom overrides first
  const override = customModelOverrides[purpose]?.[env];
  if (override) {
    return override;
  }

  // Check for environment variable override
  const envVarName = `RANA_MODEL_${purpose.toUpperCase()}`;
  const envOverride = process.env[envVarName];
  if (envOverride) {
    const [provider, model] = envOverride.split(':');
    if (provider && model) {
      return { provider, model };
    }
  }

  // Return default
  return DEFAULT_MODELS[purpose][env];
}

/**
 * Get all model configurations for the current environment
 */
export function getAllModelsForEnv(): Record<ModelPurpose, ModelConfig> {
  const purposes: ModelPurpose[] = ['chat', 'completion', 'code', 'embedding', 'vision', 'fast', 'smart', 'cheap'];
  const result: Record<string, ModelConfig> = {};

  for (const purpose of purposes) {
    result[purpose] = getModelForEnv(purpose);
  }

  return result as Record<ModelPurpose, ModelConfig>;
}

/**
 * Set custom model overrides
 */
export function setModelOverrides(overrides: Partial<Record<ModelPurpose, Partial<EnvModelConfig>>>): void {
  customModelOverrides = overrides;
}

/**
 * Check if Ollama is available for local development
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the best available model for the environment
 * Falls back if primary (e.g., Ollama) is not available
 */
export async function getBestModelForEnv(purpose: ModelPurpose = 'chat'): Promise<ModelConfig> {
  const config = getModelForEnv(purpose);

  // In development, check if Ollama is running
  if (getCurrentEnv() === 'development' && config.provider === 'ollama') {
    const ollamaAvailable = await isOllamaAvailable();

    if (!ollamaAvailable && config.fallback) {
      console.warn(`[RANA] Ollama not available, falling back to ${config.fallback.provider}:${config.fallback.model}`);
      return config.fallback;
    }
  }

  return config;
}

/**
 * Configuration for environment-aware RANA
 */
export interface EnvAwareConfig {
  providers: Record<string, string>;
  modelOverrides?: Partial<Record<ModelPurpose, Partial<EnvModelConfig>>>;
  autoFallback?: boolean;
}

/**
 * Model selection helper that integrates with RANA
 */
export const envModels = {
  /**
   * Get model for general chat
   * @example envModels.chat() // { provider: 'ollama', model: 'llama3.2' } in dev
   */
  chat: () => getModelForEnv('chat'),

  /**
   * Get model for code generation
   * @example envModels.code() // { provider: 'ollama', model: 'codellama' } in dev
   */
  code: () => getModelForEnv('code'),

  /**
   * Get model for embeddings
   * @example envModels.embedding() // { provider: 'openai', model: 'text-embedding-3-large' } in prod
   */
  embedding: () => getModelForEnv('embedding'),

  /**
   * Get fastest available model
   * @example envModels.fast() // { provider: 'groq', model: 'llama-3.1-8b-instant' } in staging
   */
  fast: () => getModelForEnv('fast'),

  /**
   * Get smartest available model
   * @example envModels.smart() // { provider: 'anthropic', model: 'claude-3-opus' } in prod
   */
  smart: () => getModelForEnv('smart'),

  /**
   * Get cheapest model
   * @example envModels.cheap() // { provider: 'ollama', model: 'llama3.2:1b' } in dev
   */
  cheap: () => getModelForEnv('cheap'),

  /**
   * Get vision-capable model
   * @example envModels.vision() // { provider: 'openai', model: 'gpt-4o' } in prod
   */
  vision: () => getModelForEnv('vision'),

  /**
   * Get current environment
   */
  env: getCurrentEnv,

  /**
   * Get all models for current environment
   */
  all: getAllModelsForEnv,

  /**
   * Check if running locally with Ollama
   */
  isLocal: () => getCurrentEnv() === 'development',

  /**
   * Check if Ollama is available
   */
  isOllamaAvailable,
};

/**
 * Show environment model configuration (for debugging)
 */
export function printEnvModelConfig(): void {
  const env = getCurrentEnv();
  console.log(`\n🔧 RANA Environment Model Configuration`);
  console.log(`   Environment: ${env.toUpperCase()}\n`);

  const models = getAllModelsForEnv();

  for (const [purpose, config] of Object.entries(models)) {
    const isLocal = config.provider === 'ollama';
    const badge = isLocal ? '🏠' : '☁️';
    console.log(`   ${badge} ${purpose.padEnd(12)} → ${config.provider}:${config.model}`);
  }

  console.log('\n   Set custom models via environment variables:');
  console.log('   RANA_MODEL_CHAT=anthropic:claude-3-5-sonnet-20241022\n');
}
