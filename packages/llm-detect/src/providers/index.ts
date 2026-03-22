/**
 * LLM provider registry.
 */

export { AnthropicProvider } from './anthropic';
export { OpenAIProvider } from './openai';

import type { LLMProviderInterface, LLMProvider } from '../types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

/**
 * Create an LLM provider instance by name.
 */
export function createProvider(provider: LLMProvider): LLMProviderInterface {
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
