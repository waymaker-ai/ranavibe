/**
 * Tracing Module for RANA Observability
 * Captures detailed traces of LLM operations with parent-child span relationships
 */

import type { LLMProvider, LLMModel } from '../types.js';

// ============================================================================
// Core Types
// ============================================================================

export interface SpanContext {
  /** Unique trace identifier - shared across all spans in a trace */
  traceId: string;
  /** Unique span identifier */
  spanId: string;
  /** Parent span ID for nested operations */
  parentSpanId?: string;
}

export interface SpanAttributes {
  /** Provider used (anthropic, openai, etc) */
  provider?: LLMProvider;
  /** Model used */
  model?: LLMModel;
  /** Input token count */
  input_tokens?: number;
  /** Output token count */
  output_tokens?: number;
  /** Total token count */
  total_tokens?: number;
  /** Cost in USD */
  cost?: number;
  /** Whether the response was cached */
  cached?: boolean;
  /** Custom attributes */
  [key: string]: any;
}

export type SpanStatus = 'pending' | 'success' | 'error';

export interface Span {
  /** Span context (trace ID, span ID, parent) */
  context: SpanContext;
  /** Span name (e.g., "chat", "embedding", "tool_call") */
  name: string;
  /** Start timestamp in milliseconds */
  startTime: number;
  /** End timestamp in milliseconds */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Span attributes */
  attributes: SpanAttributes;
  /** Span status */
  status: SpanStatus;
  /** Error message if status is 'error' */
  error?: string;
  /** Error stack trace if available */
  errorStack?: string;
  /** Child spans */
  children: Span[];
}

export interface TraceExport {
  /** Trace ID */
  traceId: string;
  /** Root spans in this trace */
  spans: Span[];
  /** Total duration of the trace */
  duration: number;
  /** Overall status */
  status: SpanStatus;
  /** Timestamp when trace was created */
  createdAt: Date;
}

export interface TracerConfig {
  /** Maximum number of traces to keep in memory */
  maxTraces?: number;
  /** Whether to enable automatic trace export */
  autoExport?: boolean;
  /** Export callback function */
  onExport?: (trace: TraceExport) => void | Promise<void>;
  /** Whether to log traces to console */
  debug?: boolean;
}

// ============================================================================
// Tracer Implementation
// ============================================================================

export class Tracer {
  private traces: Map<string, Span[]> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private config: Required<TracerConfig>;

  constructor(config: TracerConfig = {}) {
    this.config = {
      maxTraces: config.maxTraces ?? 1000,
      autoExport: config.autoExport ?? false,
      onExport: config.onExport ?? (() => {}),
      debug: config.debug ?? false,
    };
  }

  /**
   * Start a new trace with a root span
   */
  startTrace(name: string, attributes: SpanAttributes = {}): Span {
    const traceId = this.generateId();
    const spanId = this.generateId();

    const span: Span = {
      context: {
        traceId,
        spanId,
      },
      name,
      startTime: Date.now(),
      attributes,
      status: 'pending',
      children: [],
    };

    // Store root span
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, []);
    }
    this.traces.get(traceId)!.push(span);

    // Track as active
    this.activeSpans.set(spanId, span);

    this.debug(`Started trace ${traceId} with span ${name}`);

    // Cleanup old traces if needed
    this.cleanupOldTraces();

    return span;
  }

  /**
   * Start a child span within an existing trace
   */
  startSpan(name: string, parentSpan: Span, attributes: SpanAttributes = {}): Span {
    const spanId = this.generateId();

    const span: Span = {
      context: {
        traceId: parentSpan.context.traceId,
        spanId,
        parentSpanId: parentSpan.context.spanId,
      },
      name,
      startTime: Date.now(),
      attributes,
      status: 'pending',
      children: [],
    };

    // Add to parent's children
    parentSpan.children.push(span);

    // Track as active
    this.activeSpans.set(spanId, span);

    this.debug(`Started span ${name} (parent: ${parentSpan.name})`);

    return span;
  }

  /**
   * End a span and calculate duration
   */
  endSpan(span: Span, status: SpanStatus = 'success', error?: Error): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.error = error.message;
      span.errorStack = error.stack;
    }

    // Remove from active spans
    this.activeSpans.delete(span.context.spanId);

    this.debug(`Ended span ${span.name} (${span.duration}ms, status: ${status})`);

    // Check if this was a root span and if trace is complete
    if (!span.context.parentSpanId) {
      this.maybeExportTrace(span.context.traceId);
    }
  }

  /**
   * Set attributes on a span
   */
  setAttributes(span: Span, attributes: SpanAttributes): void {
    span.attributes = {
      ...span.attributes,
      ...attributes,
    };
  }

  /**
   * Add a single attribute to a span
   */
  setAttribute(span: Span, key: string, value: any): void {
    span.attributes[key] = value;
  }

  /**
   * Get a trace by ID
   */
  getTrace(traceId: string): Span[] | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get all traces
   */
  getAllTraces(): Map<string, Span[]> {
    return new Map(this.traces);
  }

  /**
   * Export a trace
   */
  exportTrace(traceId: string): TraceExport | null {
    const spans = this.traces.get(traceId);
    if (!spans || spans.length === 0) return null;

    // Calculate overall duration and status
    const rootSpan = spans[0];
    const duration = rootSpan.duration ?? Date.now() - rootSpan.startTime;

    // Determine overall status (error if any span errored)
    let status: SpanStatus = 'success';
    const checkStatus = (span: Span): void => {
      if (span.status === 'error') status = 'error';
      span.children.forEach(checkStatus);
    };
    spans.forEach(checkStatus);

    return {
      traceId,
      spans,
      duration,
      status,
      createdAt: new Date(rootSpan.startTime),
    };
  }

  /**
   * Clear all traces
   */
  clearTraces(): void {
    this.traces.clear();
    this.activeSpans.clear();
    this.debug('Cleared all traces');
  }

  /**
   * Get statistics about traces
   */
  getStats(): {
    totalTraces: number;
    totalSpans: number;
    activeSpans: number;
    avgDuration: number;
    successRate: number;
  } {
    let totalSpans = 0;
    let totalDuration = 0;
    let successCount = 0;

    const countSpans = (span: Span): void => {
      totalSpans++;
      if (span.duration) totalDuration += span.duration;
      if (span.status === 'success') successCount++;
      span.children.forEach(countSpans);
    };

    this.traces.forEach(spans => {
      spans.forEach(countSpans);
    });

    return {
      totalTraces: this.traces.size,
      totalSpans,
      activeSpans: this.activeSpans.size,
      avgDuration: totalSpans > 0 ? totalDuration / totalSpans : 0,
      successRate: totalSpans > 0 ? (successCount / totalSpans) * 100 : 0,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupOldTraces(): void {
    if (this.traces.size <= this.config.maxTraces) return;

    // Sort traces by creation time and remove oldest
    const sortedTraces = Array.from(this.traces.entries()).sort((a, b) => {
      const aTime = a[1][0]?.startTime ?? 0;
      const bTime = b[1][0]?.startTime ?? 0;
      return aTime - bTime;
    });

    const toRemove = sortedTraces.slice(0, sortedTraces.length - this.config.maxTraces);
    toRemove.forEach(([traceId]) => {
      this.traces.delete(traceId);
      this.debug(`Removed old trace ${traceId}`);
    });
  }

  private maybeExportTrace(traceId: string): void {
    if (!this.config.autoExport) return;

    // Check if all spans in trace are complete
    const spans = this.traces.get(traceId);
    if (!spans) return;

    const allComplete = (span: Span): boolean => {
      if (!span.endTime) return false;
      return span.children.every(allComplete);
    };

    if (spans.every(allComplete)) {
      const exported = this.exportTrace(traceId);
      if (exported) {
        this.config.onExport(exported);
        this.debug(`Auto-exported trace ${traceId}`);
      }
    }
  }

  private debug(message: string): void {
    if (this.config.debug) {
      console.log(`[RANA Tracer] ${message}`);
    }
  }
}

// ============================================================================
// Global Tracer
// ============================================================================

let globalTracer: Tracer | null = null;

/**
 * Create a new tracer instance
 */
export function createTracer(config?: TracerConfig): Tracer {
  return new Tracer(config);
}

/**
 * Get the global tracer instance (creates one if it doesn't exist)
 */
export function getGlobalTracer(): Tracer {
  if (!globalTracer) {
    globalTracer = new Tracer();
  }
  return globalTracer;
}

/**
 * Set the global tracer instance
 */
export function setGlobalTracer(tracer: Tracer): void {
  globalTracer = tracer;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap an async function with automatic tracing
 */
export function traced<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  tracer?: Tracer
): T {
  const tracerInstance = tracer ?? getGlobalTracer();

  return (async (...args: any[]) => {
    const span = tracerInstance.startTrace(name);
    try {
      const result = await fn(...args);
      tracerInstance.endSpan(span, 'success');
      return result;
    } catch (error) {
      tracerInstance.endSpan(span, 'error', error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Wrap a synchronous function with automatic tracing
 */
export function tracedSync<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  tracer?: Tracer
): T {
  const tracerInstance = tracer ?? getGlobalTracer();

  return ((...args: any[]) => {
    const span = tracerInstance.startTrace(name);
    try {
      const result = fn(...args);
      tracerInstance.endSpan(span, 'success');
      return result;
    } catch (error) {
      tracerInstance.endSpan(span, 'error', error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Create a trace context manually (for advanced use cases)
 */
export function createTraceContext(parentSpan?: Span): SpanContext {
  if (parentSpan) {
    return {
      traceId: parentSpan.context.traceId,
      spanId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      parentSpanId: parentSpan.context.spanId,
    };
  }

  const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return {
    traceId,
    spanId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}
