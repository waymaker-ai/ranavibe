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

// Retry utilities
export {
  withRetry,
  createRetryWrapper,
  classifyError,
  shouldRetryError,
  calculateDelay,
  getProviderRetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './providers/retry';
export type {
  RetryConfig,
  RetryableErrorType,
  RetryMetadata,
  RetryResult,
} from './providers/retry';

// Rate Limiting
export {
  RateLimiter,
  createRateLimiter,
} from './providers/rate-limiter';
export type {
  RateLimitConfig,
  ProviderRateLimitConfig,
  RateLimiterOptions,
  RateLimitHeaders,
} from './providers/rate-limiter';

// Provider Fallback System
export {
  FallbackManager,
  createFallbackManager,
  FallbackConfig,
  FallbackMetadata,
  FallbackResponse,
  ProviderRetryConfig,
} from './providers/fallback';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerError,
  createCircuitBreaker,
} from './providers/circuit-breaker';
export type {
  CircuitBreakerConfig,
  CircuitState,
} from './providers/circuit-breaker';

// Request Queue
export {
  RequestQueue,
  createRequestQueue,
} from './providers/queue';
export type {
  QueuePriority,
  QueueConfig,
  QueueStats,
  QueueEvent,
  QueueEventType,
  QueuedRequest,
} from './providers/queue';

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

// Slack Plugin
export {
  SlackBot,
  createSlackPlugin,
  slackPlugin,
} from './plugins/slack';
export type {
  SlackConfig,
  SlackMessage,
  SlackCommand,
  SlackBlock,
  SlackAttachment,
  SlackInteraction,
  MessageHandler,
  CommandHandler,
  InteractionHandler,
  EventHandler,
} from './plugins/slack';

// Voice Plugin
export {
  VoicePlugin,
  createVoicePlugin,
  useVoicePlugin,
  createAudioBuffer,
  validateVoiceProvider,
  getRecommendedSampleRate,
  estimateAudioDuration,
} from './plugins/voice';
export type {
  VoiceProvider,
  AudioFormat,
  VoiceQuality,
  VADState,
  VoiceConfig,
  AudioBuffer,
  TranscriptionResult,
  SynthesisResult,
  Voice,
  VoiceSession,
  VoiceSessionStats,
  CustomVoiceProvider,
  VADResult,
} from './plugins/voice';

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

// Memory Management (Context Compression & Vector Memory)
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

// Vector Memory
export {
  VectorMemory,
  InMemoryVectorBackend,
  FileVectorBackend,
  createVectorMemory,
  createInMemoryVectorMemory,
  createFileVectorMemory,
  cosineSimilarity,
  euclideanDistance,
  euclideanToSimilarity,
  dotProduct,
  normalize,
  calculateSimilarity,
} from './memory';
export type {
  VectorMemoryEntry,
  VectorSearchResult,
  VectorMemoryBackend,
  EmbeddingProvider,
  VectorMemoryConfig,
  VectorMemoryStats,
  SimilarityMetric,
} from './memory';

// Entity Extraction
export { EntityExtractor, createEntityExtractor } from './memory';
export type {
  EntityType,
  ConfidenceScore,
  Entity,
  EntityContext,
  EntityRelationship,
  EntityGraph,
  ExtractionResult,
  EntityTimelineEvent,
  EntityExtractorConfig,
} from './memory';

// Shared Memory
export { SharedMemory, createSharedMemory } from './memory';
export type {
  PermissionLevel,
  ConflictStrategy,
  MemoryEntry,
  NamespaceConfig,
  AccessLogEntry,
  SubscriptionCallback,
  BroadcastMessage,
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

// Observability & Tracing
export {
  // Performance Monitoring
  PerformanceMonitor,
  createPerformanceMonitor,
  // Tracing
  Tracer,
  createTracer,
  getGlobalTracer,
  setGlobalTracer,
  traced,
  tracedSync,
  createTraceContext,
  // Error Tracking
  ErrorTracker,
  createErrorTracker,
  captureError,
  getErrorStats,
  getRecentErrors,
  configureErrorTracker,
  getErrorTracker,
  // OpenTelemetry
  OTelExporter,
  createOTelExporter,
  createOTelPlugin,
  isOTelAvailable,
  // Token Analytics
  TokenAnalytics,
  createMemoryAnalytics,
  createFileAnalytics,
  createAutoSaveAnalytics,
  // Logging
  Logger,
  createLogger,
  getGlobalLogger as getGlobalLoggerInstance,
  setGlobalLogger,
  logger,
  LOG_LEVELS,
  // Log Transports
  ConsoleTransport,
  FileTransport,
  CustomTransport,
  createConsoleTransport,
  createFileTransport,
  createCustomTransport,
  // Logging Middleware
  RequestResponseLogger,
  createLoggingMiddleware,
} from './observability';

// Security - Content Filtering, Audit Logging & Prompt Injection Detection
export {
  // Content Filtering
  ContentFilter,
  createContentFilter,
  isContentSafe,
  assertContentSafe,
  ContentFilterError,
  ContentBlockedError,
  // Audit Logging
  AuditLogger,
  createAuditLogger,
  getGlobalAuditLogger,
  setGlobalAuditLogger,
  hashApiKey,
  detectPII,
  detectInjectionAttempt,
  // Prompt Injection Detection
  PromptInjectionDetector,
  createInjectionDetector,
  detectInjection,
  // PII Detection & Redaction
  PIIDetector,
  createPIIDetector,
  detectPIIAdvanced,
  redactPII,
  maskPII,
  validateCreditCard,
  detectCreditCardType,
} from './security';
export type {
  // Content Filtering Types
  FilterAction,
  FilterCategory,
  FilterSeverity,
  FilterViolation,
  FilterResult,
  FilterPattern,
  ContentFilterConfig,
  // Audit Logging Types
  AuditEventType,
  AuditOutcome,
  SecurityEventSeverity,
  AuditEntry,
  SecurityEvent,
  AccessPattern,
  AuditLoggerConfig,
  AuditDestination,
  AuditStore,
  AuditQueryFilter,
  // Prompt Injection Detection Types
  SensitivityLevel,
  RiskLevel,
  InjectionDetectionResult,
  PromptInjectionDetectorConfig,
  // PII Detection Types
  PIIType,
  PIIMode,
  PIIRegion,
  PIIDetection,
  PIIResult,
  CustomPattern,
  PIIDetectorConfig,
} from './security';

export type {
  // Performance Monitoring Types
  LatencyMetrics,
  StreamingMetrics,
  CacheMetrics,
  QueueMetrics,
  CircuitBreakerMetrics,
  ProviderMetrics,
  PerformanceSnapshot,
  AlertThreshold,
  PerformanceMonitorConfig,
  RequestRecord,
  TimeWindow,
  // Tracing Types
  Span,
  SpanContext,
  SpanAttributes,
  SpanStatus,
  TraceExport,
  TracerConfig,
  // Error Tracking Types
  ErrorTrackerConfig,
  ErrorLevel,
  ErrorCategory,
  ErrorContext,
  Breadcrumb,
  TrackedError,
  ErrorStats,
  // OpenTelemetry Types
  OTelConfig,
  OTelSpan,
  OTelResource,
  OTelBatch,
  // Token Analytics Types
  TokenUsageRecord,
  TimeRange,
  UsageByProvider,
  UsageByModel,
  HourlyUsage,
  DailyUsage,
  TopModel,
  CostBreakdownItem,
  AnalyticsSummary,
  PersistenceOptions,
  TokenAnalyticsConfig,
  // Logging Types
  LogLevel,
  LogEntry,
  StructuredLogEntry,
  RequestLogEntry,
  ResponseLogEntry,
  RequestResponseLog,
  LoggerConfig,
  LogFilter,
  LogTransport,
  ConsoleTransportConfig,
  FileTransportConfig,
  CustomTransportConfig,
  LoggingMiddlewareConfig,
  LoggingMiddleware,
  LogContext,
} from './observability';

// Discord Plugin
export {
  DiscordPlugin,
  createDiscordPlugin,
} from './plugins/discord';
export type {
  DiscordPluginConfig,
  DiscordBotConfig,
  DiscordMessage,
  DiscordChannel,
  DiscordInteraction,
  DiscordEmbed,
  DiscordButton,
  DiscordSlashCommand,
  DiscordPresence,
  DiscordRateLimitConfig,
  DiscordMessageHandler,
  DiscordCommandHandler,
  DiscordButtonHandler,
} from './plugins/discord';

// Docs Plugin
export {
  DocsPlugin,
  createDocsPlugin,
} from './plugins/docs';
export type {
  DocsPluginConfig,
  DocumentSource,
  DocumentChunk,
  SourceCitation,
  DocsAnswer,
  SourceType,
  IngestionProgress,
} from './plugins/docs';

// Email Plugin
export {
  EmailPlugin,
  createEmailPlugin,
} from './plugins/email';
export type {
  EmailProvider,
  EmailPriority,
  EmailCategory,
  EmailAddress,
  EmailAttachment,
  Email,
  EmailClassification,
  EmailSummary,
  EmailReply,
  IMAPConfig,
  SMTPConfig,
  GmailConfig,
  OutlookConfig,
  EmailFilter,
  EmailPluginConfig,
  EmailHandler,
} from './plugins/email';

// ============================================================================
// Integrations
// ============================================================================

// Hugging Face
export {
  HuggingFaceProvider,
  HuggingFaceError,
  ModelLoadingError,
  createHuggingFaceProvider,
  createHuggingFaceEmbeddings,
  POPULAR_MODELS,
} from './integrations';
export type {
  HuggingFaceTask,
  HuggingFaceConfig,
  GenerationOptions,
  EmbeddingOptions as HFEmbeddingOptions,
  ClassificationOptions,
  SummarizationOptions,
  QAOptions,
  TranslationOptions,
  GenerationResult,
  EmbeddingResult,
  ClassificationResult,
  SummarizationResult,
  QAResult,
  TranslationResult,
  StreamChunk as HFStreamChunk,
  ModelInfo,
} from './integrations';

// Vercel
export {
  VercelClient,
  VercelError,
  createVercelClient,
  createVercelConfig,
  createRanaVercelConfig,
  deployToVercel,
  getDeployButton,
  generateDeployReadme,
} from './integrations';
export type {
  VercelFramework,
  VercelRegion,
  VercelConfigOptions,
  VercelJson,
  CronJob,
  Rewrite,
  Redirect,
  Header,
  GitSettings,
  VercelDeployOptions,
  Deployment,
  DeploymentStatus,
  BuildLog,
  Project as VercelProject,
  Domain,
} from './integrations';

// Supabase
export {
  SupabaseVectorStore,
  SupabaseVectorError,
  createSupabaseVectorStore,
  createAndInitSupabaseVectorStore,
  getSupabaseSetupSQL,
} from './integrations';
export type {
  SupabaseConfig,
  EmbeddingProvider as SupabaseEmbeddingProvider,
  Document as SupabaseDocument,
  SearchOptions as SupabaseSearchOptions,
  HybridSearchOptions,
  SearchResult as SupabaseSearchResult,
  SupabaseVectorStats,
} from './integrations';

// Weights & Biases
export {
  WandbTracker,
  WandbRun,
  WandbError,
  createWandbTracker,
  createRanaWandbMiddleware,
  withExperiment,
} from './integrations';
export type {
  WandbConfig,
  RunConfig,
  LogData,
  PromptVersion,
  TableData,
  ImageData,
  RunSummary,
  Artifact,
  RanaWandbMiddleware,
} from './integrations';

// Sentry
export {
  SentryIntegration,
  createSentryIntegration,
  initSentry,
  withSentry,
} from './integrations';
export type {
  SentryConfig,
  SentryLevel,
  SentryEvent,
  SentryUser,
  Breadcrumb as SentryBreadcrumb,
  CaptureOptions,
  Transaction as SentryTransaction,
  Span as SentrySpan,
  LLMContext,
} from './integrations';

// ============================================================================
// MCP (Model Context Protocol)
// ============================================================================

// MCP Server
export {
  MCPServer,
  MCPServerError,
  createMCPServer,
  text as mcpText,
  image as mcpImage,
  resource as mcpResource,
  toolResult,
  toolError,
} from './mcp';
export type {
  ToolDefinition as MCPToolDefinition,
  ResourceDefinition as MCPResourceDefinition,
  PromptDefinition as MCPPromptDefinition,
} from './mcp';

// MCP Client
export { MCPClient, MCPClientError, createMCPClient } from './mcp';

// MCP Testing
export {
  MockTransport,
  createMockTransportPair,
  createMCPTestHarness,
  MCPTestClient,
  createMCPTestClient,
  createMCPAssertions,
  runToolTests,
  formatToolTestResults,
  createMCPSnapshot,
  compareMCPSnapshots,
  MockToolBuilder,
  mockTools,
  MCPTestError,
} from './mcp';
export type {
  MCPTestHarness,
  MCPAssertions,
  ToolTestCase,
  ToolTestResult,
  MCPSnapshot,
  MCPSnapshotDiff,
} from './mcp';

// MCP Registry
export {
  MCPRegistry,
  createMCPRegistry,
  createOfficialRegistry,
  createFullRegistry,
  generateMCPConfig,
  formatRegistry,
  officialServers,
  communityServers,
} from './mcp';
export type {
  MCPServerEntry,
  RegistrySearchOptions,
  MCPClientConfig,
} from './mcp';

// MCP Types
export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  JsonRpcNotification,
  MCPCapabilities,
  MCPServerInfo,
  MCPClientInfo,
  MCPTool,
  MCPToolInputSchema,
  MCPPropertySchema,
  MCPToolCall,
  MCPToolResult,
  MCPResource,
  MCPResourceTemplate,
  MCPResourceContents,
  MCPPrompt,
  MCPPromptArgument,
  MCPPromptMessage,
  MCPGetPromptResult,
  MCPContent,
  MCPTextContent,
  MCPImageContent,
  MCPEmbeddedResource,
  MCPLogLevel,
  MCPLogMessage,
  MCPSamplingMessage,
  MCPSamplingRequest,
  MCPModelPreferences,
  MCPModelHint,
  MCPSamplingResult,
  MCPProgressNotification,
  MCPRoot,
  MCPToolHandler,
  MCPResourceHandler,
  MCPPromptHandler,
  MCPSamplingHandler,
  MCPTransport,
  MCPTransportOptions,
  MCPServerOptions,
  MCPClientOptions,
} from './mcp';

// ============================================================================
// AI-Native Features (Phase 5.1)
// ============================================================================

// Prompt Optimizer
export {
  PromptOptimizer,
  createPromptOptimizer,
  getGlobalOptimizer,
  optimizePrompt,
  compressPrompt,
} from './ai-native';
export type {
  OptimizationStrategy,
  OptimizationGoal,
  OptimizationResult,
  FewShotExample,
  PromptTemplate,
  PromptVersion as OptimizerPromptVersion,
  PromptOptimizerConfig,
} from './ai-native';

// Hallucination Detector
export {
  HallucinationDetector,
  createHallucinationDetector,
  getGlobalHallucinationDetector,
  detectHallucinations,
  hasHallucinations,
} from './ai-native';
export type {
  HallucinationType,
  SeverityLevel as HallucinationSeverity,
  HallucinationInstance,
  HallucinationResult,
  GroundingContext,
  EntityInfo as HallucinationEntityInfo,
  HallucinationDetectorConfig,
} from './ai-native';

// Confidence Scorer
export {
  ConfidenceScorer,
  createConfidenceScorer,
  getGlobalConfidenceScorer,
  scoreConfidence,
  isConfident,
} from './ai-native';
export type {
  ConfidenceLevel,
  ConfidenceScore as AIConfidenceScore,
  ConfidenceFactor,
  ConsistencyCheckResult,
  ConfidenceScorerConfig,
} from './ai-native';

// Fact Verifier
export {
  FactVerifier,
  createFactVerifier,
  getGlobalFactVerifier,
  verifyFacts,
  extractClaims,
} from './ai-native';
export type {
  ClaimType,
  VerificationStatus,
  Claim,
  VerificationSource,
  VerificationEvidence,
  ClaimVerification,
  VerificationResult,
  KnowledgeEntry,
  FactVerifierConfig,
} from './ai-native';

// Quality Scorer
export {
  QualityScorer,
  createQualityScorer,
  getGlobalQualityScorer,
  scoreQuality,
  getQualityLevel,
} from './ai-native';
export type {
  QualityDimension,
  QualityLevel,
  QualityScore,
  QualityEvaluation,
  QualityScorerConfig,
} from './ai-native';

// Comprehensive Analysis
export {
  analyzeResponse,
  isTrustworthy,
  isQualityResponse,
} from './ai-native';
export type { ComprehensiveAnalysis } from './ai-native';
