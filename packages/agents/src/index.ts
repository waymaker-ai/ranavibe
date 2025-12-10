/**
 * @rana/agents
 * Agent Development Kit (ADK) for RANA Framework
 *
 * @example
 * ```typescript
 * import { createAgent, createRana } from '@rana/agents';
 *
 * const rana = createRana({
 *   providers: { anthropic: process.env.ANTHROPIC_API_KEY }
 * });
 *
 * const agent = createAgent({
 *   rana,
 *   tools: [],
 *   user: { id: 'u1', orgId: 'o1', roles: [] },
 * }, {
 *   id: 'my_agent',
 *   name: 'My Agent',
 *   description: 'A helpful assistant',
 * });
 *
 * const result = await agent.handle({
 *   user: { id: 'u1', orgId: 'o1', roles: [] },
 *   message: 'Hello!',
 * });
 * ```
 */

// Core types
export * from './types';

// Base agent
export { BaseAgent } from './base-agent';

// LLM Agent
export { LLMAgent, createAgent, createSimpleAgent } from './llm-agent';

// Vibe Spec
export {
  compileVibe,
  loadVibeSpec,
  validateVibeSpec,
  specToConfig,
  mergeVibes,
} from './vibe-spec';
export type { VibeSpec, CompiledVibe } from './vibe-spec';

// Preset agents
export {
  RagQAAgent,
  createRagQAAgent,
  ChatAgent,
  createChatAgent,
  TaskAgent,
  createTaskAgent,
} from './presets';

// Tools
export {
  createTool,
  simpleTool,
  calculatorTool,
  dateTimeTool,
  httpFetchTool,
  jsonTool,
  getDefaultTools,
  createToolRegistry,
} from './tools';

// Security
export {
  wrapToolWithSafety,
  checkInput,
  checkOutput,
  securityPresets,
  PIIDetector,
  createPIIDetector,
  detectPII,
  redactPII,
  InjectionDetector,
  createInjectionDetector,
  detectInjection,
  checkForInjection,
  OutputValidator,
  createOutputValidator,
  validateOutput,
  sanitizeOutput,
  RateLimiter,
  createRateLimiter,
  rateLimitPresets,
} from './security';
export type {
  ToolSafetyConfig,
  SecurityPipelineConfig,
  SecurityCheckResult,
  PIIMatch,
  PIIType,
  PIIDetectorConfig,
  InjectionMatch,
  InjectionType,
  InjectionDetectorConfig,
  OutputValidationResult,
  OutputViolation,
  OutputValidatorConfig,
  RateLimitConfig,
  RateLimitResult,
} from './security';

// Middleware
export {
  VibeEnforcer,
  VibeViolationError,
  createVibeEnforcer,
  enforceVibe,
} from './middleware';
export type { EnforcerContext, EnforcementResult, EnforcerConfig } from './middleware';

// Observability
export {
  Tracer,
  ConsoleExporter,
  JSONExporter,
  createTracer,
  initTracer,
  getTracer,
  AIAttributes,
  MetricsCollector,
  ConsoleMetricsExporter,
  createMetrics,
  initMetrics,
  getMetrics,
  AIMetrics,
} from './observability';
export type {
  Span,
  SpanBuilder,
  TracerConfig,
  SpanExporter,
  Metric,
  MetricsConfig,
} from './observability';

// Audit Logging
export {
  AuditLogger,
  MemoryAuditStorage,
  createAuditLogger,
  initAuditLogger,
  getAuditLogger,
} from './audit';
export type {
  AuditEvent,
  AuditEventType,
  AuditCategory,
  AuditActor,
  AuditLoggerConfig,
  AuditStorage,
  AuditQueryOptions,
} from './audit';

// Multi-Agent Orchestration
export {
  AgentOrchestrator,
  createOrchestrator,
  SharedStateManager,
  createStateManager,
  createPipeline,
  createWorkerPool,
  createTeam,
  createConsensusGroup,
  // Messaging
  MessageBroker,
  createChannel,
  createMessageBroker,
  createRequestChannel,
  MessageBuilders,
} from './orchestration';
export type {
  AgentIdentity,
  AgentType,
  AgentStatus,
  AgentMessage,
  MessageType,
  MessagePriority,
  TaskRequest,
  TaskResponse,
  TaskContext,
  TaskConstraints,
  TaskMetrics,
  OrchestrationPattern,
  OrchestrationConfig,
  PatternOptions,
  RetryPolicy,
  SharedState,
  StateLock,
  StateOperation,
  StateChange,
  HandoffRequest,
  HandoffReason,
  HandoffResult,
  OrchestratorEvent,
  EventHandler,
  IOrchestrator,
  IOrchestratableAgent,
  StateSnapshot,
  StateSubscriber,
  TransactionContext,
  LockInfo,
  // Messaging types
  TypedMessage,
  MessageHeaders,
  MessageMetadata,
  MessageEnvelope,
  DeliveryStatus,
  Acknowledgment,
  Channel,
  ChannelType,
  ChannelSchema,
  ChannelOptions,
  RetryOptions,
  Subscription,
  MessageHandler,
  HandlerContext,
  MessageFilter,
  SubscriptionOptions,
  Route,
  MessageTransform,
  RoutingTable,
  MessageBrokerOptions,
  SendOptions,
  MessageBrokerStats,
  ChannelStats,
} from './orchestration';
