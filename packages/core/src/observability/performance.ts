/**
 * Performance Monitoring for RANA Observability
 * Tracks request latency, provider health, cache metrics, and more
 */

import type { LLMProvider } from '../types';
import type { CircuitState } from '../providers/circuit-breaker';
import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type TimeWindow = '1min' | '5min' | '1hour';

export interface LatencyMetrics {
  /** 50th percentile (median) latency in ms */
  p50: number;
  /** 95th percentile latency in ms */
  p95: number;
  /** 99th percentile latency in ms */
  p99: number;
  /** Average latency in ms */
  avg: number;
  /** Minimum latency in ms */
  min: number;
  /** Maximum latency in ms */
  max: number;
  /** Total number of requests */
  count: number;
}

export interface StreamingMetrics {
  /** Time to first token in ms */
  timeToFirstToken: number;
  /** Total stream duration in ms */
  totalDuration: number;
  /** Number of tokens received */
  tokensReceived: number;
  /** Average time between tokens in ms */
  avgTimeBetweenTokens: number;
}

export interface CacheMetrics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Cache hit rate percentage (0-100) */
  hitRate: number;
  /** Total requests that attempted cache */
  total: number;
}

export interface QueueMetrics {
  /** Average queue wait time in ms */
  avgWaitTime: number;
  /** Maximum queue wait time in ms */
  maxWaitTime: number;
  /** Current queue size */
  currentQueueSize: number;
  /** Total requests queued */
  totalQueued: number;
  /** Total requests timed out */
  totalTimedOut: number;
}

export interface CircuitBreakerMetrics {
  /** Current circuit state */
  state: CircuitState;
  /** Number of times circuit opened */
  openCount: number;
  /** Number of consecutive failures */
  failureCount: number;
  /** Current failure rate percentage */
  failureRate: number;
  /** Timestamp of last state change */
  lastStateChange: number | null;
}

export interface ProviderMetrics {
  /** Provider name */
  provider: LLMProvider;
  /** Latency metrics for this provider */
  latency: LatencyMetrics;
  /** Error rate percentage (0-100) */
  errorRate: number;
  /** Total successful requests */
  successCount: number;
  /** Total failed requests */
  failureCount: number;
  /** Total requests */
  totalRequests: number;
  /** Average cost per request */
  avgCost: number;
  /** Total cost */
  totalCost: number;
  /** Circuit breaker metrics */
  circuitBreaker: CircuitBreakerMetrics;
  /** Queue metrics (if queue is enabled) */
  queue?: QueueMetrics;
}

export interface PerformanceSnapshot {
  /** Timestamp of snapshot */
  timestamp: number;
  /** Time window for aggregation */
  window: TimeWindow;
  /** Overall latency metrics */
  latency: LatencyMetrics;
  /** Cache metrics */
  cache: CacheMetrics;
  /** Metrics per provider */
  providers: Record<LLMProvider, ProviderMetrics>;
  /** Overall error rate */
  errorRate: number;
  /** Total cost across all providers */
  totalCost: number;
  /** Total requests across all providers */
  totalRequests: number;
}

export interface AlertThreshold {
  /** Alert type */
  type: 'latency' | 'error_rate' | 'cost';
  /** Threshold value */
  threshold: number;
  /** Time window to evaluate */
  window: TimeWindow;
  /** Whether alert is enabled */
  enabled: boolean;
  /** Callback when threshold is exceeded */
  onAlert?: (value: number, threshold: number, window: TimeWindow) => void;
}

export interface PerformanceMonitorConfig {
  /** Time windows to track (default: all) */
  windows?: TimeWindow[];
  /** Alert thresholds */
  alerts?: AlertThreshold[];
  /** Enable automatic cleanup of old data */
  autoCleanup?: boolean;
  /** How long to keep data in ms (default: 1 hour) */
  retentionPeriod?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface RequestRecord {
  /** Timestamp of request */
  timestamp: number;
  /** Provider used */
  provider: LLMProvider;
  /** Model used */
  model: string;
  /** Latency in ms */
  latency: number;
  /** Whether request succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Cost of request */
  cost: number;
  /** Whether response was cached */
  cached: boolean;
  /** Queue wait time in ms */
  queueWaitTime?: number;
  /** Time to first token for streaming */
  timeToFirstToken?: number;
  /** Retry count if retries occurred */
  retryCount?: number;
}

// ============================================================================
// Performance Monitor
// ============================================================================

export class PerformanceMonitor extends EventEmitter {
  private config: Required<PerformanceMonitorConfig>;
  private requestHistory: RequestRecord[] = [];
  private cacheStats = { hits: 0, misses: 0 };
  private circuitBreakerEvents = new Map<
    LLMProvider,
    Array<{ timestamp: number; state: CircuitState }>
  >();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: PerformanceMonitorConfig = {}) {
    super();

    this.config = {
      windows: config.windows ?? ['1min', '5min', '1hour'],
      alerts: config.alerts ?? [],
      autoCleanup: config.autoCleanup ?? true,
      retentionPeriod: config.retentionPeriod ?? 3600000, // 1 hour
      debug: config.debug ?? false,
    };

    // Start automatic cleanup
    if (this.config.autoCleanup) {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        60000 // Cleanup every minute
      );
    }

    this.log('Performance monitor initialized');
  }

  // ============================================================================
  // Recording Methods
  // ============================================================================

  /**
   * Record a request completion
   */
  recordRequest(record: RequestRecord): void {
    this.requestHistory.push(record);

    // Update cache stats
    if (record.cached) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }

    // Emit event
    this.emit('request', record);

    // Check alerts
    this.checkAlerts();

    this.log('Recorded request:', {
      provider: record.provider,
      latency: record.latency,
      success: record.success,
    });
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheStats.hits++;
    this.emit('cache-hit');
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheStats.misses++;
    this.emit('cache-miss');
  }

  /**
   * Record a circuit breaker state change
   */
  recordCircuitBreakerStateChange(
    provider: LLMProvider,
    from: CircuitState,
    to: CircuitState
  ): void {
    if (!this.circuitBreakerEvents.has(provider)) {
      this.circuitBreakerEvents.set(provider, []);
    }

    this.circuitBreakerEvents.get(provider)!.push({
      timestamp: Date.now(),
      state: to,
    });

    this.emit('circuit-breaker-change', { provider, from, to });

    this.log(`Circuit breaker state change for ${provider}: ${from} -> ${to}`);
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get latency statistics for a time window
   */
  getLatencyStats(
    window: TimeWindow = '5min',
    provider?: LLMProvider
  ): LatencyMetrics {
    const records = this.getRecordsInWindow(window, provider);

    if (records.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const latencies = records.map((r) => r.latency).sort((a, b) => a - b);

    return {
      p50: this.percentile(latencies, 50),
      p95: this.percentile(latencies, 95),
      p99: this.percentile(latencies, 99),
      avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      min: latencies[0],
      max: latencies[latencies.length - 1],
      count: latencies.length,
    };
  }

  /**
   * Get provider health metrics
   */
  getProviderHealth(
    provider: LLMProvider,
    window: TimeWindow = '5min'
  ): ProviderMetrics {
    const records = this.getRecordsInWindow(window, provider);
    const successRecords = records.filter((r) => r.success);
    const failureRecords = records.filter((r) => !r.success);

    const totalRequests = records.length;
    const successCount = successRecords.length;
    const failureCount = failureRecords.length;
    const errorRate =
      totalRequests > 0 ? (failureCount / totalRequests) * 100 : 0;

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const avgCost = totalRequests > 0 ? totalCost / totalRequests : 0;

    // Get circuit breaker state
    const cbEvents = this.circuitBreakerEvents.get(provider) || [];
    const recentCbEvents = this.filterByWindow(cbEvents, window);
    const currentState = cbEvents[cbEvents.length - 1]?.state || 'CLOSED';
    const openCount = recentCbEvents.filter((e) => e.state === 'OPEN').length;

    // Calculate failure rate for circuit breaker
    const windowMs = this.getWindowMs(window);
    const recentRecords = records.filter(
      (r) => Date.now() - r.timestamp < windowMs
    );
    const recentFailures = recentRecords.filter((r) => !r.success).length;
    const failureRate =
      recentRecords.length > 0
        ? (recentFailures / recentRecords.length) * 100
        : 0;

    // Calculate queue metrics
    const queuedRecords = records.filter((r) => r.queueWaitTime !== undefined);
    const queueMetrics: QueueMetrics | undefined =
      queuedRecords.length > 0
        ? {
            avgWaitTime:
              queuedRecords.reduce((sum, r) => sum + (r.queueWaitTime || 0), 0) /
              queuedRecords.length,
            maxWaitTime: Math.max(
              ...queuedRecords.map((r) => r.queueWaitTime || 0)
            ),
            currentQueueSize: 0, // This should be updated from queue itself
            totalQueued: queuedRecords.length,
            totalTimedOut: 0, // This should be tracked separately
          }
        : undefined;

    return {
      provider,
      latency: this.getLatencyStats(window, provider),
      errorRate,
      successCount,
      failureCount,
      totalRequests,
      avgCost,
      totalCost,
      circuitBreaker: {
        state: currentState,
        openCount,
        failureCount: recentFailures,
        failureRate,
        lastStateChange: cbEvents[cbEvents.length - 1]?.timestamp || null,
      },
      queue: queueMetrics,
    };
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(window: TimeWindow = '5min'): PerformanceSnapshot {
    const records = this.getRecordsInWindow(window);
    const providers = new Set(records.map((r) => r.provider));

    const providerMetrics: Record<LLMProvider, ProviderMetrics> = {} as any;
    for (const provider of Array.from(providers)) {
      providerMetrics[provider] = this.getProviderHealth(provider, window);
    }

    const totalRequests = records.length;
    const failures = records.filter((r) => !r.success).length;
    const errorRate = totalRequests > 0 ? (failures / totalRequests) * 100 : 0;
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    // Calculate cache metrics
    const windowMs = this.getWindowMs(window);
    const cutoff = Date.now() - windowMs;
    const recentRecords = records.filter((r) => r.timestamp > cutoff);
    const cachedRequests = recentRecords.filter((r) => r.cached).length;
    const cacheAttempts = recentRecords.length;
    const hitRate =
      cacheAttempts > 0 ? (cachedRequests / cacheAttempts) * 100 : 0;

    return {
      timestamp: Date.now(),
      window,
      latency: this.getLatencyStats(window),
      cache: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate,
        total: this.cacheStats.hits + this.cacheStats.misses,
      },
      providers: providerMetrics,
      errorRate,
      totalCost,
      totalRequests,
    };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;

    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate,
      total,
    };
  }

  /**
   * Get metrics by provider
   */
  getMetricsByProvider(
    window: TimeWindow = '5min'
  ): Record<LLMProvider, ProviderMetrics> {
    const records = this.getRecordsInWindow(window);
    const providers = new Set(records.map((r) => r.provider));

    const metrics: Record<LLMProvider, ProviderMetrics> = {} as any;
    for (const provider of Array.from(providers)) {
      metrics[provider] = this.getProviderHealth(provider, window);
    }

    return metrics;
  }

  /**
   * Get metrics by model
   */
  getMetricsByModel(window: TimeWindow = '5min'): Record<string, LatencyMetrics> {
    const records = this.getRecordsInWindow(window);
    const models = new Set(records.map((r) => r.model));

    const metrics: Record<string, LatencyMetrics> = {};
    for (const model of Array.from(models)) {
      const modelRecords = records.filter((r) => r.model === model);
      const latencies = modelRecords.map((r) => r.latency).sort((a, b) => a - b);

      if (latencies.length === 0) {
        continue;
      }

      metrics[model] = {
        p50: this.percentile(latencies, 50),
        p95: this.percentile(latencies, 95),
        p99: this.percentile(latencies, 99),
        avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        min: latencies[0],
        max: latencies[latencies.length - 1],
        count: latencies.length,
      };
    }

    return metrics;
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  /**
   * Add an alert threshold
   */
  addAlert(alert: AlertThreshold): void {
    this.config.alerts.push(alert);
    this.log('Alert added:', alert);
  }

  /**
   * Remove an alert threshold
   */
  removeAlert(type: AlertThreshold['type']): void {
    this.config.alerts = this.config.alerts.filter((a) => a.type !== type);
    this.log('Alert removed:', type);
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(): void {
    for (const alert of this.config.alerts) {
      if (!alert.enabled) continue;

      const value = this.getAlertValue(alert.type, alert.window);
      if (value > alert.threshold) {
        this.emit('alert', {
          type: alert.type,
          value,
          threshold: alert.threshold,
          window: alert.window,
        });

        if (alert.onAlert) {
          alert.onAlert(value, alert.threshold, alert.window);
        }

        this.log(`Alert triggered: ${alert.type} = ${value} (threshold: ${alert.threshold})`);
      }
    }
  }

  /**
   * Get the current value for an alert type
   */
  private getAlertValue(type: AlertThreshold['type'], window: TimeWindow): number {
    switch (type) {
      case 'latency': {
        const stats = this.getLatencyStats(window);
        return stats.p95;
      }
      case 'error_rate': {
        const records = this.getRecordsInWindow(window);
        const failures = records.filter((r) => !r.success).length;
        return records.length > 0 ? (failures / records.length) * 100 : 0;
      }
      case 'cost': {
        const records = this.getRecordsInWindow(window);
        return records.reduce((sum, r) => sum + r.cost, 0);
      }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get records within a time window
   */
  private getRecordsInWindow(
    window: TimeWindow,
    provider?: LLMProvider
  ): RequestRecord[] {
    const windowMs = this.getWindowMs(window);
    const cutoff = Date.now() - windowMs;

    return this.requestHistory.filter(
      (r) =>
        r.timestamp > cutoff &&
        (provider === undefined || r.provider === provider)
    );
  }

  /**
   * Filter events by time window
   */
  private filterByWindow<T extends { timestamp: number }>(
    events: T[],
    window: TimeWindow
  ): T[] {
    const windowMs = this.getWindowMs(window);
    const cutoff = Date.now() - windowMs;
    return events.filter((e) => e.timestamp > cutoff);
  }

  /**
   * Convert time window to milliseconds
   */
  private getWindowMs(window: TimeWindow): number {
    switch (window) {
      case '1min':
        return 60000;
      case '5min':
        return 300000;
      case '1hour':
        return 3600000;
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Clean up old data beyond retention period
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;

    const beforeCount = this.requestHistory.length;
    this.requestHistory = this.requestHistory.filter(
      (r) => r.timestamp > cutoff
    );
    const afterCount = this.requestHistory.length;

    // Clean up circuit breaker events
    for (const [provider, events] of Array.from(this.circuitBreakerEvents.entries())) {
      const filtered = events.filter((e) => e.timestamp > cutoff);
      if (filtered.length === 0) {
        this.circuitBreakerEvents.delete(provider);
      } else {
        this.circuitBreakerEvents.set(provider, filtered);
      }
    }

    if (beforeCount !== afterCount) {
      this.log(`Cleaned up ${beforeCount - afterCount} old records`);
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requestHistory = [];
    this.cacheStats = { hits: 0, misses: 0 };
    this.circuitBreakerEvents.clear();
    this.emit('reset');
    this.log('Metrics reset');
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<PerformanceMonitorConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      alerts: config.alerts ?? this.config.alerts,
    };
    this.log('Configuration updated');
  }

  /**
   * Get total number of records
   */
  get recordCount(): number {
    return this.requestHistory.length;
  }

  /**
   * Log debug message
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[PerformanceMonitor]', ...args);
    }
  }

  /**
   * Clean up and stop monitoring
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
    this.log('Performance monitor destroyed');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a performance monitor instance
 *
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor({
 *   windows: ['1min', '5min', '1hour'],
 *   alerts: [
 *     {
 *       type: 'latency',
 *       threshold: 5000, // 5 seconds
 *       window: '5min',
 *       enabled: true,
 *       onAlert: (value, threshold) => {
 *         console.log(`Latency exceeded: ${value}ms > ${threshold}ms`);
 *       }
 *     },
 *     {
 *       type: 'error_rate',
 *       threshold: 10, // 10%
 *       window: '5min',
 *       enabled: true,
 *     },
 *     {
 *       type: 'cost',
 *       threshold: 1.0, // $1.00
 *       window: '1hour',
 *       enabled: true,
 *     }
 *   ]
 * });
 *
 * // Record a request
 * monitor.recordRequest({
 *   timestamp: Date.now(),
 *   provider: 'anthropic',
 *   model: 'claude-3-5-sonnet-20241022',
 *   latency: 1234,
 *   success: true,
 *   cost: 0.01,
 *   cached: false,
 * });
 *
 * // Get performance report
 * const report = monitor.getPerformanceReport('5min');
 * console.log('P95 Latency:', report.latency.p95);
 * console.log('Cache Hit Rate:', report.cache.hitRate);
 * console.log('Error Rate:', report.errorRate);
 *
 * // Get provider health
 * const health = monitor.getProviderHealth('anthropic', '5min');
 * console.log('Anthropic Health:', health);
 * ```
 */
export function createPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  return new PerformanceMonitor(config);
}
