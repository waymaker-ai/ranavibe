/**
 * Observability Module
 * Logging, tracing, error tracking, and performance monitoring for RANA
 */

// Performance Monitoring
export {
  PerformanceMonitor,
  createPerformanceMonitor,
} from './performance';
export type {
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
} from './performance';

// Tracing
export {
  Tracer,
  createTracer,
  getGlobalTracer,
  setGlobalTracer,
  traced,
  tracedSync,
  createTraceContext,
} from './tracer';
export type {
  Span,
  SpanContext,
  SpanAttributes,
  SpanStatus,
  TraceExport,
  TracerConfig,
} from './tracer';

// Error Tracking
export {
  ErrorTracker,
  createErrorTracker,
  captureError,
  getErrorStats,
  getRecentErrors,
  configureErrorTracker,
  getErrorTracker,
} from './errors';
export type {
  ErrorTrackerConfig,
  ErrorLevel,
  ErrorCategory,
  ErrorContext,
  Breadcrumb,
  TrackedError,
  ErrorStats,
} from './errors';

// OpenTelemetry Integration
export {
  OTelExporter,
  createOTelExporter,
  createOTelPlugin,
  isOTelAvailable,
} from './otel';
export type {
  OTelConfig,
  OTelSpan,
  OTelResource,
  OTelBatch,
} from './otel';

// Token Analytics
export {
  TokenAnalytics,
  createMemoryAnalytics,
  createFileAnalytics,
  createAutoSaveAnalytics,
} from './analytics';
export type {
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
} from './analytics';

// Logging Types
export type {
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
  LogContext,
} from './types';

export { LOG_LEVELS } from './types';

// Logger
export {
  Logger,
  createLogger,
  getGlobalLogger,
  setGlobalLogger,
  logger,
} from './logger';

// Transports
export {
  ConsoleTransport,
  FileTransport,
  CustomTransport,
  createConsoleTransport,
  createFileTransport,
  createCustomTransport,
} from './transports';

// Middleware
export {
  RequestResponseLogger,
  createLoggingMiddleware,
} from './middleware';
export type { LoggingMiddleware } from './middleware';
