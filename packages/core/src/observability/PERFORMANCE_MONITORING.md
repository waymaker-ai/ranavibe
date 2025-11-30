# RANA Performance Monitoring

Comprehensive performance monitoring system for tracking request latency, provider health, cache metrics, and system performance.

## Overview

The PerformanceMonitor class provides real-time performance tracking and analytics for RANA, including:

- **Request Latency Tracking** - P50, P95, P99 percentiles
- **Provider Health Monitoring** - Success rates, error rates, costs
- **Cache Performance** - Hit rates, cache efficiency metrics
- **Circuit Breaker Status** - State changes, failure tracking
- **Queue Metrics** - Wait times, queue depth
- **Alert System** - Configurable thresholds with callbacks

## Installation

The performance monitoring is included in `@rana/core`:

```typescript
import { createPerformanceMonitor } from '@rana/core';
```

## Quick Start

```typescript
import { createPerformanceMonitor } from '@rana/core';

// Create a performance monitor
const monitor = createPerformanceMonitor({
  windows: ['1min', '5min', '1hour'],
  alerts: [
    {
      type: 'latency',
      threshold: 5000, // 5 seconds
      window: '5min',
      enabled: true,
      onAlert: (value, threshold, window) => {
        console.log(`Latency ${value}ms exceeds ${threshold}ms`);
      },
    },
  ],
});

// Record a request
monitor.recordRequest({
  timestamp: Date.now(),
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  latency: 1234,
  success: true,
  cost: 0.01,
  cached: false,
});

// Get performance report
const report = monitor.getPerformanceReport('5min');
console.log('P95 Latency:', report.latency.p95);
console.log('Cache Hit Rate:', report.cache.hitRate);
console.log('Error Rate:', report.errorRate);
```

## Features

### 1. Latency Tracking

Track request latency with percentile metrics:

```typescript
const stats = monitor.getLatencyStats('5min');
console.log({
  p50: stats.p50,   // Median latency
  p95: stats.p95,   // 95th percentile
  p99: stats.p99,   // 99th percentile
  avg: stats.avg,   // Average latency
  min: stats.min,   // Minimum latency
  max: stats.max,   // Maximum latency
  count: stats.count, // Request count
});
```

### 2. Provider Health

Monitor individual provider health:

```typescript
const health = monitor.getProviderHealth('anthropic', '5min');
console.log({
  successRate: (health.successCount / health.totalRequests) * 100,
  errorRate: health.errorRate,
  avgCost: health.avgCost,
  latency: health.latency,
  circuitBreaker: health.circuitBreaker.state,
});
```

### 3. Cache Metrics

Track cache performance:

```typescript
const cacheMetrics = monitor.getCacheMetrics();
console.log({
  hits: cacheMetrics.hits,
  misses: cacheMetrics.misses,
  hitRate: cacheMetrics.hitRate,
  total: cacheMetrics.total,
});
```

### 4. Alert System

Configure alerts for critical thresholds:

```typescript
// Latency alert
monitor.addAlert({
  type: 'latency',
  threshold: 5000,
  window: '5min',
  enabled: true,
  onAlert: (value, threshold) => {
    console.log(`⚠️  High latency: ${value}ms`);
  },
});

// Error rate alert
monitor.addAlert({
  type: 'error_rate',
  threshold: 10, // 10%
  window: '5min',
  enabled: true,
  onAlert: (value) => {
    console.log(`⚠️  High error rate: ${value}%`);
  },
});

// Cost alert
monitor.addAlert({
  type: 'cost',
  threshold: 1.0, // $1.00
  window: '1hour',
  enabled: true,
  onAlert: (value) => {
    console.log(`⚠️  High cost: $${value}`);
  },
});
```

### 5. Time Windows

Aggregate metrics across different time windows:

```typescript
// 1 minute window
const oneMinReport = monitor.getPerformanceReport('1min');

// 5 minute window
const fiveMinReport = monitor.getPerformanceReport('5min');

// 1 hour window
const oneHourReport = monitor.getPerformanceReport('1hour');
```

### 6. Circuit Breaker Monitoring

Track circuit breaker state changes:

```typescript
// Record state change
monitor.recordCircuitBreakerStateChange('anthropic', 'CLOSED', 'OPEN');

// Get circuit breaker metrics
const health = monitor.getProviderHealth('anthropic');
console.log({
  state: health.circuitBreaker.state,
  openCount: health.circuitBreaker.openCount,
  failureRate: health.circuitBreaker.failureRate,
});
```

### 7. Event-Driven Monitoring

Listen to real-time events:

```typescript
// Request events
monitor.on('request', (record) => {
  console.log(`Request: ${record.provider} - ${record.latency}ms`);
});

// Alert events
monitor.on('alert', (alert) => {
  console.log(`Alert: ${alert.type} = ${alert.value}`);
});

// Circuit breaker events
monitor.on('circuit-breaker-change', ({ provider, from, to }) => {
  console.log(`Circuit: ${provider} ${from} → ${to}`);
});

// Cache events
monitor.on('cache-hit', () => console.log('Cache hit'));
monitor.on('cache-miss', () => console.log('Cache miss'));
```

## API Reference

### PerformanceMonitor

#### Constructor

```typescript
createPerformanceMonitor(config?: PerformanceMonitorConfig): PerformanceMonitor
```

#### Methods

##### Recording Methods

- `recordRequest(record: RequestRecord): void` - Record a request completion
- `recordCacheHit(): void` - Record a cache hit
- `recordCacheMiss(): void` - Record a cache miss
- `recordCircuitBreakerStateChange(provider, from, to): void` - Record circuit breaker state change

##### Query Methods

- `getLatencyStats(window?, provider?): LatencyMetrics` - Get latency statistics
- `getProviderHealth(provider, window?): ProviderMetrics` - Get provider health metrics
- `getPerformanceReport(window?): PerformanceSnapshot` - Get comprehensive performance report
- `getCacheMetrics(): CacheMetrics` - Get cache metrics
- `getMetricsByProvider(window?): Record<Provider, Metrics>` - Get metrics grouped by provider
- `getMetricsByModel(window?): Record<Model, Metrics>` - Get metrics grouped by model

##### Alert Management

- `addAlert(alert: AlertThreshold): void` - Add an alert threshold
- `removeAlert(type: AlertType): void` - Remove an alert threshold

##### Utility Methods

- `reset(): void` - Reset all metrics
- `destroy(): void` - Clean up and stop monitoring
- `getConfig(): PerformanceMonitorConfig` - Get current configuration
- `updateConfig(config): void` - Update configuration

## Integration with RANA Client

Example of integrating performance monitoring with the RANA client:

```typescript
import { createRana, createPerformanceMonitor } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
});

const monitor = createPerformanceMonitor({
  windows: ['1min', '5min', '1hour'],
});

// Wrap chat method
async function monitoredChat(provider, message) {
  const startTime = Date.now();
  try {
    const response = await rana.provider(provider).chat(message);
    
    monitor.recordRequest({
      timestamp: startTime,
      provider,
      model: response.model,
      latency: response.latency_ms,
      success: true,
      cost: response.cost.total_cost,
      cached: response.cached,
      retryCount: response.retry?.retryCount,
    });
    
    return response;
  } catch (error) {
    monitor.recordRequest({
      timestamp: startTime,
      provider,
      model: 'unknown',
      latency: Date.now() - startTime,
      success: false,
      error: error.message,
      cost: 0,
      cached: false,
    });
    throw error;
  }
}
```

## Types

### TimeWindow

```typescript
type TimeWindow = '1min' | '5min' | '1hour';
```

### LatencyMetrics

```typescript
interface LatencyMetrics {
  p50: number;    // 50th percentile
  p95: number;    // 95th percentile
  p99: number;    // 99th percentile
  avg: number;    // Average
  min: number;    // Minimum
  max: number;    // Maximum
  count: number;  // Request count
}
```

### ProviderMetrics

```typescript
interface ProviderMetrics {
  provider: LLMProvider;
  latency: LatencyMetrics;
  errorRate: number;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  avgCost: number;
  totalCost: number;
  circuitBreaker: CircuitBreakerMetrics;
  queue?: QueueMetrics;
}
```

### PerformanceSnapshot

```typescript
interface PerformanceSnapshot {
  timestamp: number;
  window: TimeWindow;
  latency: LatencyMetrics;
  cache: CacheMetrics;
  providers: Record<LLMProvider, ProviderMetrics>;
  errorRate: number;
  totalCost: number;
  totalRequests: number;
}
```

### AlertThreshold

```typescript
interface AlertThreshold {
  type: 'latency' | 'error_rate' | 'cost';
  threshold: number;
  window: TimeWindow;
  enabled: boolean;
  onAlert?: (value: number, threshold: number, window: TimeWindow) => void;
}
```

## Best Practices

1. **Choose appropriate time windows** - Use shorter windows (1min) for real-time monitoring, longer windows (1hour) for trends
2. **Set realistic alert thresholds** - Base thresholds on historical data and SLAs
3. **Monitor multiple providers** - Track health across all providers to identify issues
4. **Use events for real-time monitoring** - Listen to events for immediate feedback
5. **Clean up when done** - Call `destroy()` to stop cleanup intervals and free resources

## Examples

See `performance.example.ts` for comprehensive usage examples.
