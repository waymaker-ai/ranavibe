export { ANTHROPIC_MODELS, isAnthropicClient, parseAnthropicResponse, extractAnthropicModel } from './anthropic.js';
export { OPENAI_MODELS, isOpenAIClient, parseOpenAIResponse, extractOpenAIModel } from './openai.js';
export { GOOGLE_MODELS, isGoogleClient, parseGoogleResponse, extractGoogleModel } from './google.js';

import { isAnthropicClient } from './anthropic.js';
import { isOpenAIClient } from './openai.js';
import { isGoogleClient } from './google.js';

export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown';

export function detectProvider(client: any): Provider {
  if (isAnthropicClient(client)) return 'anthropic';
  if (isOpenAIClient(client)) return 'openai';
  if (isGoogleClient(client)) return 'google';
  return 'unknown';
}
