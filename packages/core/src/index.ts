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

  // Cost & Budget types
  CostStats,
  CostBreakdown,
  BudgetConfig,
  BudgetPeriod,
  BudgetAction,

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
  RanaBudgetExceededError,
  RanaBudgetWarningError,
} from './types';

// Utilities
export { CostTracker, BudgetStatus, CostTrackingConfig } from './cost-tracker';
export { CacheManager } from './cache-legacy';
export { ProviderManager } from './providers/manager';

// Modern Cache System
export {
  CacheProvider,
  CacheConfig,
  CacheEntry,
  CacheStats,
  MemoryCache,
  RedisCache,
  FileCache,
  createCache,
} from './cache';
export type { RedisConfig, CacheType } from './cache';

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

// Agent Framework
export {
  // Base Agent
  BaseAgent,
  AgentConfig,
  AgentState,
  AgentMessage,
  Tool,
  ToolCall as AgentToolCall,
  ToolResult,
  AgentEventType,
  AgentEvent,
  // LLM Agent
  LLMAgent,
  LLMAgentConfig,
  createAgent,
  // Orchestrator
  Orchestrator,
  OrchestratorConfig,
  AgentRegistration,
  TaskResult,
  OrchestratorState,
  createOrchestrator,
  // Tools
  ToolRegistry,
  webSearchTool,
  calculatorTool,
  dateTimeTool,
  jsonTool,
  memoryTool,
  createTool,
  createDefaultToolRegistry,
  createWebSearchTool,
  configureWebSearch,
  // Web Search
  webSearch,
  tavilySearch,
  braveSearch,
  serperSearch,
  SearchResult,
  SearchResponse,
  WebSearchConfig,
  // Streaming Agent
  StreamingAgent,
  createStreamingAgent,
  createStreamingAdapter,
  AgentStreamChunk,
  StreamingLLMConfig,
  StreamingLLMClient,
} from './agents';

// Persistence (Cost Storage)
export {
  CostStore,
  CostRecord,
  CostQuery,
  CostSummary,
  FileCostStore,
  SQLiteCostStore,
  PostgresCostStore,
  createCostStore,
  getGlobalCostStore,
  setGlobalCostStore,
} from './persistence';
export type { CostStoreConfig } from './persistence';

// Memory Management (Context Compression)
export { MemoryManager, createMemoryManager } from './memory';
export type {
  CompressionStrategy,
  MessageImportance,
  CompressedMessage,
  MemoryWindowConfig,
  CompressionResult,
  MemoryStats,
  MemoryState,
} from './memory';

// Environment-Based Model Selection
export {
  getModelForEnv,
  getAllModelsForEnv,
  getBestModelForEnv,
  getCurrentEnv,
  setModelOverrides,
  isOllamaAvailable,
  envModels,
  printEnvModelConfig,
} from './env-models';
export type {
  ModelPurpose,
  Environment,
  ModelConfig,
  EnvModelConfig,
  EnvAwareConfig,
} from './env-models';
