/**
 * Metrics Collection
 * Collect and report metrics for agent operations
 */

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface MetricsConfig {
  /** Enable metrics collection */
  enabled?: boolean;
  /** Prefix for metric names */
  prefix?: string;
  /** Default labels */
  defaultLabels?: Record<string, string>;
  /** Exporter */
  exporter?: MetricsExporter;
  /** Flush interval (ms) */
  flushInterval?: number;
}

export interface MetricsExporter {
  export(metrics: Metric[]): Promise<void>;
}

/**
 * Console metrics exporter
 */
export class ConsoleMetricsExporter implements MetricsExporter {
  async export(metrics: Metric[]): Promise<void> {
    for (const metric of metrics) {
      const labels = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      console.log(`[Metric] ${metric.name}{${labels}} ${metric.value}`);
    }
  }
}

/**
 * Histogram bucket
 */
interface HistogramBucket {
  le: number;
  count: number;
}

/**
 * Histogram data
 */
interface HistogramData {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

/**
 * Metrics collector class
 */
export class MetricsCollector {
  private config: Required<MetricsConfig>;
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, HistogramData>();
  private buffer: Metric[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      enabled: true,
      prefix: 'rana',
      defaultLabels: {},
      exporter: new ConsoleMetricsExporter(),
      flushInterval: 10000,
      ...config,
    };

    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, labels: Record<string, string> = {}, value = 1): void {
    if (!this.config.enabled) return;

    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.recordMetric({
      name: this.prefixName(name),
      type: 'counter',
      value: current + value,
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    this.recordMetric({
      name: this.prefixName(name),
      type: 'gauge',
      value,
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Record a histogram observation
   */
  histogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    buckets: number[] = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  ): void {
    if (!this.config.enabled) return;

    const key = this.buildKey(name, labels);
    let data = this.histograms.get(key);

    if (!data) {
      data = {
        buckets: buckets.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      this.histograms.set(key, data);
    }

    // Update histogram data
    data.sum += value;
    data.count++;
    for (const bucket of data.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    this.recordMetric({
      name: this.prefixName(name),
      type: 'histogram',
      value,
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Time an operation
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels: Record<string, string> = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.histogram(`${name}_duration_ms`, Date.now() - start, {
        ...labels,
        status: 'success',
      });
      return result;
    } catch (error) {
      this.histogram(`${name}_duration_ms`, Date.now() - start, {
        ...labels,
        status: 'error',
      });
      throw error;
    }
  }

  /**
   * Create a timer that can be manually stopped
   */
  startTimer(name: string, labels: Record<string, string> = {}): () => void {
    const start = Date.now();
    return () => {
      this.histogram(`${name}_duration_ms`, Date.now() - start, labels);
    };
  }

  /**
   * Get current metric values
   */
  getMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, HistogramData>;
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
    };
  }

  /**
   * Flush metrics to exporter
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    try {
      await this.config.exporter.export(metrics);
    } catch (error) {
      console.error('[Metrics] Failed to export:', error);
    }
  }

  /**
   * Shutdown collector
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  private recordMetric(metric: Metric): void {
    this.buffer.push(metric);
  }

  private buildKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private prefixName(name: string): string {
    return this.config.prefix ? `${this.config.prefix}_${name}` : name;
  }
}

/**
 * Create a metrics collector
 */
export function createMetrics(config?: MetricsConfig): MetricsCollector {
  return new MetricsCollector(config);
}

/**
 * Global metrics instance
 */
let globalMetrics: MetricsCollector | null = null;

/**
 * Initialize global metrics
 */
export function initMetrics(config?: MetricsConfig): MetricsCollector {
  globalMetrics = new MetricsCollector(config);
  return globalMetrics;
}

/**
 * Get global metrics
 */
export function getMetrics(): MetricsCollector {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector();
  }
  return globalMetrics;
}

/**
 * Common metric names for AI operations
 */
export const AIMetrics = {
  // LLM metrics
  LLM_REQUESTS: 'llm_requests_total',
  LLM_TOKENS: 'llm_tokens_total',
  LLM_LATENCY: 'llm_request_duration_ms',
  LLM_ERRORS: 'llm_errors_total',
  LLM_COST: 'llm_cost_usd',

  // Agent metrics
  AGENT_RUNS: 'agent_runs_total',
  AGENT_STEPS: 'agent_steps_total',
  AGENT_DURATION: 'agent_duration_ms',
  AGENT_ERRORS: 'agent_errors_total',

  // Tool metrics
  TOOL_CALLS: 'tool_calls_total',
  TOOL_DURATION: 'tool_duration_ms',
  TOOL_ERRORS: 'tool_errors_total',

  // RAG metrics
  RAG_QUERIES: 'rag_queries_total',
  RAG_CHUNKS_RETRIEVED: 'rag_chunks_retrieved',
  RAG_LATENCY: 'rag_query_duration_ms',

  // Security metrics
  SECURITY_BLOCKED: 'security_blocked_total',
  PII_DETECTED: 'pii_detected_total',
  INJECTION_DETECTED: 'injection_detected_total',

  // Rate limiting
  RATE_LIMIT_HIT: 'rate_limit_hit_total',
};
