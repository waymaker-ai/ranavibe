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
// RANA Core Features (Config, Quality Gates, REPM, etc.)
// ============================================================================

// Configuration Parser
export { ConfigParser, RanaConfigSchema } from './config/index.js';
export type { QualityGate } from './config/index.js';

// Quality Gates
export { QualityGateChecker } from './quality-gates/index.js';

// REPM Validator
export { REPMValidator } from './repm/index.js';

// Design System Checker
export { DesignSystemChecker } from './design-system/index.js';

// Template Manager
export { TemplateManager } from './templates/index.js';

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

// ============================================================================
// Multi-Modal Features (Phase 5.2)
// ============================================================================

// Image Understanding
export {
  ImageUnderstanding,
  createImageUnderstanding,
  getGlobalImageUnderstanding,
  analyzeImage,
  askAboutImage,
  extractTextFromImage,
} from './multi-modal';
export type {
  ImageBoundingBox,
  DetectedObject,
  SceneDescription,
  ExtractedText,
  ImageClassification,
  ImageAnalysisResult,
  VisualQAResult,
  ImageUnderstandingConfig,
  ImageInput,
} from './multi-modal';

// Image Generation
export {
  ImageGenerator,
  createImageGenerator,
  getGlobalImageGenerator,
  generateImage,
  generateSingleImage,
  editImage,
  upscaleImage,
} from './multi-modal';
export type {
  ImageSize,
  ImageQuality as ImageGenQuality,
  ImageStyle,
  OutputFormat as ImageOutputFormat,
  GeneratedImage,
  GenerationOptions as ImageGenerationOptions,
  EditOptions as ImageEditOptions,
  VariationOptions,
  UpscaleOptions,
  StyleTransferOptions,
  ImageGenerationConfig,
} from './multi-modal';

// Audio Transcription
export {
  AudioTranscriber,
  RealtimeTranscriptionSession,
  createAudioTranscriber,
  getGlobalAudioTranscriber,
  transcribeAudio,
  transcribeToText,
  transcribeToSRT,
  transcribeToVTT,
} from './multi-modal';
export type {
  AudioFormat as SpeechAudioFormat,
  TranscriptionModel,
  Word,
  Segment,
  Speaker as TranscriptionSpeaker,
  TranscriptionResult as SpeechTranscriptionResult,
  TranscriptionOptions,
  RealtimeTranscriptionOptions,
  TranscriptionEvent,
  TranscriptionEventHandler,
  AudioTranscriptionConfig,
  AudioInput,
} from './multi-modal';

// Text-to-Speech
export {
  TextToSpeech,
  createTextToSpeech,
  getGlobalTextToSpeech,
  speak,
  speakToFile,
  getVoices,
  speakStream,
} from './multi-modal';
export type {
  VoiceGender,
  TTSAudioQuality,
  OutputAudioFormat,
  Voice as TTSVoice,
  SpeechOptions,
  SpeechResult,
  SSMLOptions,
  VoiceCloningOptions,
  ClonedVoice,
  TextToSpeechConfig,
} from './multi-modal';

// Video Understanding
export {
  VideoUnderstanding,
  createVideoUnderstanding,
  getGlobalVideoUnderstanding,
  analyzeVideo,
  askAboutVideo,
  searchVideo,
  summarizeVideo,
  transcribeVideo,
} from './multi-modal';
export type {
  Frame,
  VideoBoundingBox,
  TrackedObject,
  Scene,
  Action,
  VideoMetadata,
  VideoAnalysisResult,
  VideoQAResult,
  VideoSearchResult,
  VideoUnderstandingConfig,
  VideoInput,
} from './multi-modal';

// Unified Multi-Modal
export {
  MultiModal,
  createMultiModal,
  getGlobalMultiModal,
} from './multi-modal';
export type { MultiModalConfig } from './multi-modal';

// ============================================================================
// Enterprise Features (Phase 5.3)
// ============================================================================

// SSO/SAML
export {
  SSOManager,
  SSOMemoryStorage,
  createSSOManager,
} from './enterprise';
export type {
  SSOProvider,
  IdentityProvider,
  SAMLConfig,
  OIDCConfig,
  SSOUser,
  SSOSession,
  AuthenticationResult,
  SSOProviderConfig,
  SSOManagerConfig,
  SSOStorageAdapter,
} from './enterprise';

// RBAC
export {
  RBACManager,
  MemoryRBACStorage,
  createRBACManager,
  SYSTEM_ROLES,
} from './enterprise';
export type {
  Permission,
  ResourceType,
  Action as RBACAction,
  Role,
  Policy,
  PolicyCondition,
  UserRoleAssignment,
  AccessCheckResult,
  RBACContext,
  RBACAuditLogEntry,
  RBACConfig,
  RBACStorageAdapter,
} from './enterprise';

// Compliance
export {
  ComplianceManager,
  MemoryComplianceStorage,
  createComplianceManager,
} from './enterprise';
export type {
  ComplianceStandard,
  DataCategory,
  RetentionAction,
  AuditEvent,
  DataInventoryItem,
  RetentionPolicy,
  DataSubjectRequest,
  ComplianceReport,
  ComplianceControl,
  ComplianceFinding,
  ComplianceManagerConfig,
  ComplianceStorageAdapter,
  AuditQuery,
} from './enterprise';

// Self-Hosted
export {
  SelfHostedManager,
  createSelfHostedManager,
  createMinimalConfig,
  createAirGappedConfig,
} from './enterprise';
export type {
  DeploymentMode,
  ComponentStatus,
  DeploymentConfig,
  ComponentConfig,
  NetworkingConfig,
  StorageConfig as SelfHostedStorageConfig,
  SecurityConfig,
  TelemetryConfig as SelfHostedTelemetryConfig,
  TelemetryExporter,
  ModelEndpoint,
  VectorStoreEndpoint,
  HealthStatus,
  SelfHostedConfig,
} from './enterprise';

// SLA Support
export {
  SLAManager,
  MemorySLAStorage,
  createSLAManager,
  SLA_TEMPLATES,
} from './enterprise';
export type {
  SLOType,
  TimeWindow as SLATimeWindow,
  AlertSeverity,
  SLODefinition,
  SLOStatus,
  SLADefinition,
  SLAPenalty,
  SLAReport,
  SLABreach,
  AppliedPenalty,
  MetricDataPoint,
  AlertRule,
  AlertChannel,
  Alert as SLAAlert,
  SLAManagerConfig,
  SLAStorageAdapter,
} from './enterprise';

// Unified Enterprise
export {
  Enterprise,
  createEnterprise,
  getGlobalEnterprise,
  initializeEnterprise,
} from './enterprise';
export type { EnterpriseConfig } from './enterprise';

// ============================================================================
// Model Router/Gateway (Phase 3.1)
// ============================================================================

export {
  ModelRouter,
  ModelRegistry,
  createModelRouter,
  createModelRegistry,
  getGlobalRouter,
  route,
} from './router';
export type {
  RoutingStrategy,
  TaskType,
  ModelCapabilities,
  ModelDefinition,
  ModelPricing,
  RoutingConstraints,
  RoutingFeedback,
  RoutingDecision,
  RoutingRule,
  ModelRouterConfig,
} from './router';

// ============================================================================
// Agent Debugger (Phase 3.1)
// ============================================================================

export {
  AgentDebugger,
  createAgentDebugger,
  getGlobalDebugger,
  debug,
} from './debugger';
export type {
  DebugEventType,
  BreakpointType,
  DebugEvent,
  LLMRequestEvent,
  LLMResponseEvent,
  ToolCallEvent,
  ToolResultEvent,
  ThinkingEvent,
  StateChangeEvent,
  ErrorEvent,
  Breakpoint,
  StateSnapshot,
  DebugSession,
  DecisionTree,
  DecisionNode,
  TokenBreakdown,
  ReplayOptions,
  AgentDebuggerConfig,
} from './debugger';

// ============================================================================
// Structured Output (Phase 3.1)
// ============================================================================

export {
  StructuredOutput,
  SchemaValidator,
  createStructuredOutput,
  createSchemaValidator,
  generateStructured,
  zodToJsonSchema,
  jsonSchemaToTypeScript,
} from './structured';
export type {
  SchemaType,
  SchemaProperty,
  SchemaDefinition,
  ValidationError as StructuredValidationError,
  ValidationResult as StructuredValidationResult,
  PartialParseResult,
  OutputFormat,
  FormatOptions,
  ExtractionField,
  ExtractionSchema,
  RetryStrategy as StructuredRetryStrategy,
  RetryConfig as StructuredRetryConfig,
  RetryResult as StructuredRetryResult,
  StructuredOutputConfig,
  GenerationRequest,
  GenerationResult as StructuredGenerationResult,
  ZodSchema,
  ZodToJsonSchemaOptions,
} from './structured';

// ============================================================================
// Fine-Tuning Pipeline (Phase 3.1)
// ============================================================================

export {
  FineTuner,
  createFineTuner,
  prepareDataset,
} from './finetuning';
export type {
  FineTuneProvider,
  DatasetFormat,
  JobStatus,
  DatasetExample,
  DatasetConfig,
  Dataset,
  TrainingConfig,
  FineTuneJob,
  ModelVersion,
  FineTunerConfig,
} from './finetuning';

// ============================================================================
// Collaboration (Prompt Versioning) (Phase 3.1)
// ============================================================================

export {
  PromptLibrary,
  createPromptLibrary,
  getGlobalPromptLibrary,
} from './collaboration';
export type {
  PromptStatus,
  PromptMetadata,
  PromptVersion as CollabPromptVersion,
  Prompt,
  PromptDiff,
  ReviewComment,
  ReviewRequest,
  LibraryConfig,
} from './collaboration';

// ============================================================================
// Edge/Offline Support (Phase 3.1)
// ============================================================================

export {
  EdgeRuntime,
  ModelManager,
  HybridRuntime,
  OfflineQueue,
  createEdgeRuntime,
  createModelManager,
  createHybridRuntime,
  createOfflineQueue,
  getGlobalModelManager,
  runLocal,
} from './edge';
export type {
  EdgeBackend,
  QuantizationType,
  ExecutionProvider,
  ModelInfo as EdgeModelInfo,
  ONNXOptions,
  LlamaCppOptions,
  TransformersJsOptions,
  EdgeRuntimeConfig,
  GenerateOptions as EdgeGenerateOptions,
  GenerateResult as EdgeGenerateResult,
  StreamChunk as EdgeStreamChunk,
  EmbeddingOptions as EdgeEmbeddingOptions,
  EmbeddingResult as EdgeEmbeddingResult,
  ModelDownloadProgress,
  PrebuiltModel,
  HybridConfig,
  QueuedRequest as EdgeQueuedRequest,
} from './edge';

// ============================================================================
// Real-time Voice (Phase 3.1)
// ============================================================================

export {
  VoiceSession as RealtimeVoiceSession,
  AudioRecorder,
  AudioPlayer,
  VoiceActivityDetector,
  WebRTCManager,
  createVoiceSession as createRealtimeVoiceSession,
  createAudioRecorder,
  createAudioPlayer,
  createVAD,
  createWebRTCManager,
  getGlobalVoiceSession,
  startVoiceChat,
} from './realtime';
export type {
  VoiceProvider as RealtimeVoiceProvider,
  Voice as RealtimeVoice,
  AudioFormat as RealtimeAudioFormat,
  ConnectionState,
  TurnDetectionMode,
  VoiceSessionConfig,
  RTCConfigurationLite,
  TranscriptEvent,
  ResponseEvent,
  FunctionCall as VoiceFunctionCall,
  ConversationItem,
  VoiceMetrics,
  Tool as VoiceTool,
  VADConfig,
  WebRTCConfig,
} from './realtime';

// ============================================================================
// Advanced RAG (Phase 3.1)
// ============================================================================

export {
  AdvancedRAG,
  SelfCorrectingRAG,
  QueryOptimizer,
  createAdvancedRAG,
  createSelfCorrectingRAG,
  createQueryOptimizer,
  createMultiModalRetriever,
  getGlobalAdvancedRAG,
} from './rag-advanced';
export type {
  Modality,
  VerificationStrategy,
  CorrectionStrategy,
  MultiModalDocument,
  MultiModalChunk,
  MultiModalQuery,
  MultiModalResult,
  MultiModalCitation,
  EmbedderConfig,
  AdvancedRAGConfig,
  SelfCorrectingConfig,
  SelfCorrectingQuery,
  VerificationResult as RAGVerificationResult,
  VerificationIssue,
  CorrectionAttempt,
  SelfCorrectingResult,
  QueryOptimizerConfig,
} from './rag-advanced';
