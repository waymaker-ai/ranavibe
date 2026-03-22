/**
 * Configuration Helpers
 */

import type { CoFounderConfig } from './types';

/**
 * Define a CoFounder configuration with TypeScript support
 *
 * @example
 * ```typescript
 * // cofounder.config.ts
 * import { defineConfig } from '@cofounder/core';
 *
 * export default defineConfig({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY,
 *     openai: process.env.OPENAI_API_KEY,
 *   },
 *   defaults: {
 *     provider: 'anthropic',
 *     optimize: 'cost',
 *   },
 *   cache: {
 *     enabled: true,
 *     ttl: 3600,
 *   }
 * });
 * ```
 */
export function defineConfig(config: CoFounderConfig): CoFounderConfig {
  return config;
}

/**
 * Load configuration from file or environment
 */
export async function loadConfig(): Promise<CoFounderConfig> {
  // Try to load from cofounder.config.ts
  try {
    const config = await import(process.cwd() + '/cofounder.config');
    return config.default || config;
  } catch {
    // Fall back to environment variables
    return {
      providers: {
        anthropic: process.env.ANTHROPIC_API_KEY,
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_AI_API_KEY,
        xai: process.env.XAI_API_KEY,
        mistral: process.env.MISTRAL_API_KEY,
        cohere: process.env.COHERE_API_KEY,
        together: process.env.TOGETHER_API_KEY,
        groq: process.env.GROQ_API_KEY,
        ollama: process.env.OLLAMA_URL || 'http://localhost:11434',
      },
    };
  }
}
