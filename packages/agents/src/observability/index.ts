/**
 * Observability module exports
 */

// Tracing
export {
  Tracer,
  ConsoleExporter,
  JSONExporter,
  createTracer,
  initTracer,
  getTracer,
  AIAttributes,
} from './tracer';

export type {
  Span,
  SpanAttributeValue,
  SpanEvent,
  SpanLink,
  TracerConfig,
  SpanExporter,
  SpanBuilder,
} from './tracer';

// Metrics
export {
  MetricsCollector,
  ConsoleMetricsExporter,
  createMetrics,
  initMetrics,
  getMetrics,
  AIMetrics,
} from './metrics';

export type {
  Metric,
  MetricsConfig,
  MetricsExporter,
} from './metrics';
