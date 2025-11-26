/**
 * @rana/core
 * Core SDK for RANA - Rapid AI Native Architecture
 *
 * @example
 * ```typescript
 * import { createRana } from '@rana/core';
 *
 * const rana = createRana({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY,
 *     openai: process.env.OPENAI_API_KEY,
 *   }
 * });
 *
 * // Simple usage
 * const response = await rana.chat('Hello!');
 *
 * // Advanced usage with fluent API
 * const response = await rana
 *   .provider('anthropic')
 *   .model('claude-3-5-sonnet-20241022')
 *   .optimize('cost')
 *   .cache(true)
 *   .chat({ messages: [...] });
 * ```
 */

// Main client
export { RanaClient, Rana, createRana } from './client';

// Types
export type {
  // Core types
  RanaConfig,
  RanaChatRequest,
  RanaChatResponse,
  RanaStreamChunk,

  // Provider types
  LLMProvider,
  LLMModel,
  AnthropicModel,
  OpenAIModel,
  GoogleModel,

  // Message types
  Message,
  MessageRole,
  ContentPart,

  // Tool types
  ToolDefinition,
  ToolCall,

  // Cost types
  CostStats,
  CostBreakdown,

  // Plugin types
  RanaPlugin,

  // Database types
  RanaDBConfig,
  RanaDBQuery,

  // Security types
  RanaSecurityConfig,
} from './types';

// Errors
export {
  RanaError,
  RanaAuthError,
  RanaRateLimitError,
  RanaNetworkError,
} from './types';

// Utilities
export { CostTracker } from './cost-tracker';
export { CacheManager } from './cache';
export { ProviderManager } from './providers/manager';

// Plugin helpers
export { definePlugin } from './plugins/helpers';

// Config helpers
export { defineConfig } from './config';

// Utility helpers
export {
  quickChat,
  compareProviders,
  findCheapestProvider,
  formatCost,
  formatLatency,
  calculateSavings,
  formatCostStats,
  createMessage,
  createConversation,
  extractContent,
  batchProcess,
  sleep,
  retry,
  chunkText,
  estimateTokens,
  truncateToTokens,
  estimateCost,
  validateApiKey,
  getProviderName,
  parseStreamChunk,
  Spinner,
  createProgressBar,
} from './utils/helpers';

// Presets and templates
export {
  presets,
  templates,
  strategies,
  getPreset,
  getTemplate,
  getStrategy,
} from './presets';
