/**
 * Observability and Tracing
 * Lightweight tracing for agent operations (OpenTelemetry-compatible)
 */

export interface Span {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, SpanAttributeValue>;
  events: SpanEvent[];
  links: SpanLink[];
}

export type SpanAttributeValue = string | number | boolean | string[] | number[] | boolean[];

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Record<string, SpanAttributeValue>;
}

export interface TracerConfig {
  /** Service name */
  serviceName: string;
  /** Enable tracing */
  enabled?: boolean;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Export spans */
  exporter?: SpanExporter;
  /** Maximum spans to buffer */
  maxBufferSize?: number;
  /** Auto-flush interval (ms) */
  flushInterval?: number;
}

export interface SpanExporter {
  export(spans: Span[]): Promise<void>;
}

/**
 * Console exporter (for development)
 */
export class ConsoleExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    for (const span of spans) {
      const duration = span.endTime ? span.endTime - span.startTime : 0;
      console.log(
        `[Trace] ${span.name} (${duration}ms) - ${span.status}`,
        span.attributes
      );
    }
  }
}

/**
 * JSON exporter (writes to file or sends to endpoint)
 */
export class JSONExporter implements SpanExporter {
  constructor(
    private options: {
      endpoint?: string;
      filePath?: string;
      onExport?: (spans: Span[]) => void;
    } = {}
  ) {}

  async export(spans: Span[]): Promise<void> {
    const data = spans.map((span) => ({
      ...span,
      timestamp: new Date(span.startTime).toISOString(),
    }));

    if (this.options.onExport) {
      this.options.onExport(spans);
    }

    if (this.options.endpoint) {
      await fetch(this.options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    if (this.options.filePath) {
      const fs = await import('fs');
      const existing = fs.existsSync(this.options.filePath)
        ? JSON.parse(fs.readFileSync(this.options.filePath, 'utf-8'))
        : [];
      fs.writeFileSync(
        this.options.filePath,
        JSON.stringify([...existing, ...data], null, 2)
      );
    }
  }
}

/**
 * Generate trace ID
 */
function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate span ID
 */
function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Active span context
 */
interface SpanContext {
  traceId: string;
  spanId: string;
}

/**
 * Tracer class
 */
export class Tracer {
  private config: Required<TracerConfig>;
  private buffer: Span[] = [];
  private currentContext: SpanContext | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: TracerConfig) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      exporter: new ConsoleExporter(),
      maxBufferSize: 100,
      flushInterval: 5000,
      ...config,
    };

    // Start auto-flush timer
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Start a new span
   */
  startSpan(
    name: string,
    options?: {
      attributes?: Record<string, SpanAttributeValue>;
      parent?: SpanContext;
    }
  ): SpanBuilder {
    if (!this.config.enabled) {
      return new NoopSpanBuilder();
    }

    // Sampling
    if (Math.random() > this.config.sampleRate) {
      return new NoopSpanBuilder();
    }

    const parentContext = options?.parent || this.currentContext;

    const span: Span = {
      name,
      traceId: parentContext?.traceId || generateTraceId(),
      spanId: generateSpanId(),
      parentSpanId: parentContext?.spanId,
      startTime: Date.now(),
      status: 'unset',
      attributes: {
        'service.name': this.config.serviceName,
        ...options?.attributes,
      },
      events: [],
      links: [],
    };

    const builder = new SpanBuilderImpl(span, this);

    // Set as current context
    this.currentContext = { traceId: span.traceId, spanId: span.spanId };

    return builder;
  }

  /**
   * Wrap an async function with tracing
   */
  trace<T>(
    name: string,
    fn: (span: SpanBuilder) => Promise<T>,
    options?: { attributes?: Record<string, SpanAttributeValue> }
  ): Promise<T> {
    const span = this.startSpan(name, options);
    return fn(span)
      .then((result) => {
        span.setStatus('ok');
        span.end();
        return result;
      })
      .catch((error) => {
        span.setStatus('error');
        span.recordException(error);
        span.end();
        throw error;
      });
  }

  /**
   * Record a span
   */
  recordSpan(span: Span): void {
    this.buffer.push(span);

    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffered spans
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const spans = [...this.buffer];
    this.buffer = [];

    try {
      await this.config.exporter.export(spans);
    } catch (error) {
      console.error('[Tracer] Failed to export spans:', error);
      // Re-add spans to buffer (up to max size)
      this.buffer.unshift(...spans.slice(0, this.config.maxBufferSize - this.buffer.length));
    }
  }

  /**
   * Shutdown tracer
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Get current context
   */
  getCurrentContext(): SpanContext | null {
    return this.currentContext;
  }

  /**
   * Set current context
   */
  setCurrentContext(context: SpanContext | null): void {
    this.currentContext = context;
  }
}

/**
 * Span builder interface
 */
export interface SpanBuilder {
  setAttribute(key: string, value: SpanAttributeValue): SpanBuilder;
  setAttributes(attributes: Record<string, SpanAttributeValue>): SpanBuilder;
  addEvent(name: string, attributes?: Record<string, SpanAttributeValue>): SpanBuilder;
  addLink(context: SpanContext, attributes?: Record<string, SpanAttributeValue>): SpanBuilder;
  setStatus(status: 'ok' | 'error'): SpanBuilder;
  recordException(error: Error | unknown): SpanBuilder;
  end(): void;
  getContext(): SpanContext;
}

/**
 * Span builder implementation
 */
class SpanBuilderImpl implements SpanBuilder {
  constructor(
    private span: Span,
    private tracer: Tracer
  ) {}

  setAttribute(key: string, value: SpanAttributeValue): SpanBuilder {
    this.span.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, SpanAttributeValue>): SpanBuilder {
    Object.assign(this.span.attributes, attributes);
    return this;
  }

  addEvent(name: string, attributes?: Record<string, SpanAttributeValue>): SpanBuilder {
    this.span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
    return this;
  }

  addLink(context: SpanContext, attributes?: Record<string, SpanAttributeValue>): SpanBuilder {
    this.span.links.push({
      traceId: context.traceId,
      spanId: context.spanId,
      attributes,
    });
    return this;
  }

  setStatus(status: 'ok' | 'error'): SpanBuilder {
    this.span.status = status;
    return this;
  }

  recordException(error: Error | unknown): SpanBuilder {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.addEvent('exception', {
      'exception.type': errorObj.name,
      'exception.message': errorObj.message,
      'exception.stacktrace': errorObj.stack || '',
    });
    return this;
  }

  end(): void {
    this.span.endTime = Date.now();
    this.tracer.recordSpan(this.span);
  }

  getContext(): SpanContext {
    return {
      traceId: this.span.traceId,
      spanId: this.span.spanId,
    };
  }
}

/**
 * No-op span builder (when tracing is disabled)
 */
class NoopSpanBuilder implements SpanBuilder {
  setAttribute(): SpanBuilder {
    return this;
  }
  setAttributes(): SpanBuilder {
    return this;
  }
  addEvent(): SpanBuilder {
    return this;
  }
  addLink(): SpanBuilder {
    return this;
  }
  setStatus(): SpanBuilder {
    return this;
  }
  recordException(): SpanBuilder {
    return this;
  }
  end(): void {}
  getContext(): SpanContext {
    return { traceId: '', spanId: '' };
  }
}

/**
 * Create a tracer
 */
export function createTracer(config: TracerConfig): Tracer {
  return new Tracer(config);
}

/**
 * Global tracer instance
 */
let globalTracer: Tracer | null = null;

/**
 * Initialize global tracer
 */
export function initTracer(config: TracerConfig): Tracer {
  globalTracer = new Tracer(config);
  return globalTracer;
}

/**
 * Get global tracer
 */
export function getTracer(): Tracer {
  if (!globalTracer) {
    throw new Error('Tracer not initialized. Call initTracer() first.');
  }
  return globalTracer;
}

/**
 * Common span attributes for AI operations
 */
export const AIAttributes = {
  MODEL: 'ai.model',
  PROVIDER: 'ai.provider',
  PROMPT_TOKENS: 'ai.prompt_tokens',
  COMPLETION_TOKENS: 'ai.completion_tokens',
  TOTAL_TOKENS: 'ai.total_tokens',
  TEMPERATURE: 'ai.temperature',
  MAX_TOKENS: 'ai.max_tokens',
  FINISH_REASON: 'ai.finish_reason',
  TOOL_NAME: 'ai.tool.name',
  TOOL_DURATION_MS: 'ai.tool.duration_ms',
  RAG_CHUNKS_RETRIEVED: 'ai.rag.chunks_retrieved',
  RAG_CHUNKS_USED: 'ai.rag.chunks_used',
  AGENT_NAME: 'ai.agent.name',
  AGENT_STEP: 'ai.agent.step',
};
