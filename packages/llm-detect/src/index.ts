/**
 * @ranavibe/llm-detect
 *
 * LLM-augmented detection using a small model (Haiku/mini) for edge cases
 * that regex patterns cannot catch. Zero runtime dependencies.
 */

export { LLMDetector } from './detector';
export { HybridDetector, regexDetect } from './hybrid';

export { AnthropicProvider } from './providers/anthropic';
export { OpenAIProvider } from './providers/openai';
export { createProvider } from './providers';

export {
  getSystemPrompt,
  buildUserPrompt,
  PII_SYSTEM_PROMPT,
  INJECTION_SYSTEM_PROMPT,
  TOXICITY_SYSTEM_PROMPT,
  getComplianceSystemPrompt,
} from './prompts';

export type {
  LLMDetectorConfig,
  LLMProvider,
  DetectionRequest,
  DetectionResult,
  DetectionType,
  Finding,
  LLMResponse,
  LLMProviderInterface,
} from './types';
