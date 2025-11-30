/**
 * Performance Monitor Usage Examples
 */

import { createPerformanceMonitor } from './performance';
import type { LLMProvider } from '../types';

// ============================================================================
// Basic Usage
// ============================================================================

// Create a performance monitor
const monitor = createPerformanceMonitor({
  windows: ['1min', '5min', '1hour'],
  autoCleanup: true,
  retentionPeriod: 3600000, // 1 hour
  debug: false,
});

// Record a successful request
monitor.recordRequest({
  timestamp: Date.now(),
  provider: 'anthropic' as LLMProvider,
  model: 'claude-3-5-sonnet-20241022',
  latency: 1234,
  success: true,
  cost: 0.01,
  cached: false,
  queueWaitTime: 50,
});

// Record a failed request
monitor.recordRequest({
  timestamp: Date.now(),
  provider: 'openai' as LLMProvider,
  model: 'gpt-4o',
  latency: 500,
  success: false,
  error: 'Rate limit exceeded',
  cost: 0,
  cached: false,
});

// ============================================================================
// Get Performance Metrics
// ============================================================================

// Get latency statistics
const latencyStats = monitor.getLatencyStats('5min');
console.log('Latency Stats:');
console.log(`  P50: ${latencyStats.p50}ms`);
console.log(`  P95: ${latencyStats.p95}ms`);
console.log(`  P99: ${latencyStats.p99}ms`);
console.log(`  Avg: ${latencyStats.avg}ms`);
console.log(`  Min: ${latencyStats.min}ms`);
console.log(`  Max: ${latencyStats.max}ms`);

// Get provider health
const anthropicHealth = monitor.getProviderHealth('anthropic', '5min');
console.log('\nAnthropic Health:');
console.log(`  Success Rate: ${((anthropicHealth.successCount / anthropicHealth.totalRequests) * 100).toFixed(2)}%`);
console.log(`  Error Rate: ${anthropicHealth.errorRate.toFixed(2)}%`);
console.log(`  Avg Cost: $${anthropicHealth.avgCost.toFixed(4)}`);
console.log(`  Circuit Breaker: ${anthropicHealth.circuitBreaker.state}`);
console.log(`  P95 Latency: ${anthropicHealth.latency.p95}ms`);

// Get comprehensive performance report
const report = monitor.getPerformanceReport('5min');
console.log('\nPerformance Report:');
console.log(`  Total Requests: ${report.totalRequests}`);
console.log(`  Error Rate: ${report.errorRate.toFixed(2)}%`);
console.log(`  Total Cost: $${report.totalCost.toFixed(4)}`);
console.log(`  Cache Hit Rate: ${report.cache.hitRate.toFixed(2)}%`);
console.log(`  P95 Latency: ${report.latency.p95}ms`);

// Get cache metrics
const cacheMetrics = monitor.getCacheMetrics();
console.log('\nCache Metrics:');
console.log(`  Hits: ${cacheMetrics.hits}`);
console.log(`  Misses: ${cacheMetrics.misses}`);
console.log(`  Hit Rate: ${cacheMetrics.hitRate.toFixed(2)}%`);

// ============================================================================
// Alert Configuration
// ============================================================================

// Create monitor with alerts
const monitorWithAlerts = createPerformanceMonitor({
  windows: ['1min', '5min', '1hour'],
  alerts: [
    {
      type: 'latency',
      threshold: 5000, // 5 seconds
      window: '5min',
      enabled: true,
      onAlert: (value, threshold, window) => {
        console.log(`⚠️  ALERT: P95 latency ${value}ms exceeds ${threshold}ms over ${window}`);
      },
    },
    {
      type: 'error_rate',
      threshold: 10, // 10%
      window: '5min',
      enabled: true,
      onAlert: (value, threshold, window) => {
        console.log(`⚠️  ALERT: Error rate ${value.toFixed(2)}% exceeds ${threshold}% over ${window}`);
      },
    },
    {
      type: 'cost',
      threshold: 1.0, // $1.00
      window: '1hour',
      enabled: true,
      onAlert: (value, threshold, window) => {
        console.log(`⚠️  ALERT: Cost $${value.toFixed(2)} exceeds $${threshold} over ${window}`);
      },
    },
  ],
});

// Listen to alert events
monitorWithAlerts.on('alert', (alert) => {
  console.log('Alert triggered:', alert);
});

// ============================================================================
// Circuit Breaker Monitoring
// ============================================================================

// Record circuit breaker state changes
monitor.recordCircuitBreakerStateChange('anthropic', 'CLOSED', 'OPEN');
monitor.recordCircuitBreakerStateChange('anthropic', 'OPEN', 'HALF_OPEN');
monitor.recordCircuitBreakerStateChange('anthropic', 'HALF_OPEN', 'CLOSED');

// Get provider metrics with circuit breaker info
const providerMetrics = monitor.getMetricsByProvider('5min');
for (const [provider, metrics] of Object.entries(providerMetrics)) {
  console.log(`\n${provider}:`);
  console.log(`  Circuit State: ${metrics.circuitBreaker.state}`);
  console.log(`  Open Count: ${metrics.circuitBreaker.openCount}`);
  console.log(`  Failure Rate: ${metrics.circuitBreaker.failureRate.toFixed(2)}%`);
}

// ============================================================================
// Metrics by Model
// ============================================================================

const modelMetrics = monitor.getMetricsByModel('5min');
console.log('\nMetrics by Model:');
for (const [model, metrics] of Object.entries(modelMetrics)) {
  console.log(`  ${model}:`);
  console.log(`    P95: ${metrics.p95}ms`);
  console.log(`    Avg: ${metrics.avg}ms`);
  console.log(`    Count: ${metrics.count}`);
}

// ============================================================================
// Integration with RANA Client
// ============================================================================

import { createRana } from '../client';

// Create RANA client
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
});

// Create performance monitor
const clientMonitor = createPerformanceMonitor({
  windows: ['1min', '5min', '1hour'],
  alerts: [
    {
      type: 'latency',
      threshold: 3000,
      window: '5min',
      enabled: true,
    },
  ],
});

// Wrap chat calls to record performance
async function monitoredChat(provider: LLMProvider, message: string) {
  const startTime = Date.now();
  let success = false;
  let cost = 0;
  let error: string | undefined;

  try {
    const response = await rana.provider(provider).chat(message);
    success = true;
    cost = response.cost.total_cost;

    // Record the request
    clientMonitor.recordRequest({
      timestamp: startTime,
      provider,
      model: response.model,
      latency: response.latency_ms,
      success: true,
      cost,
      cached: response.cached,
      retryCount: response.retry?.retryCount,
    });

    return response;
  } catch (err: any) {
    error = err.message;

    // Record the failed request
    clientMonitor.recordRequest({
      timestamp: startTime,
      provider,
      model: 'unknown',
      latency: Date.now() - startTime,
      success: false,
      error,
      cost: 0,
      cached: false,
    });

    throw err;
  }
}

// Example usage
async function example() {
  try {
    const response = await monitoredChat('anthropic', 'Hello!');
    console.log('Response:', response.content);

    // Get performance report
    const report = clientMonitor.getPerformanceReport('5min');
    console.log('\nPerformance Report:');
    console.log(`  P95 Latency: ${report.latency.p95}ms`);
    console.log(`  Success Rate: ${((1 - report.errorRate / 100) * 100).toFixed(2)}%`);
    console.log(`  Total Cost: $${report.totalCost.toFixed(4)}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Real-time Monitoring with Events
// ============================================================================

const realtimeMonitor = createPerformanceMonitor({
  windows: ['1min', '5min'],
});

// Listen to request events
realtimeMonitor.on('request', (record) => {
  if (record.success) {
    console.log(`✓ ${record.provider} - ${record.latency}ms - $${record.cost.toFixed(4)}`);
  } else {
    console.log(`✗ ${record.provider} - ${record.error}`);
  }
});

// Listen to circuit breaker changes
realtimeMonitor.on('circuit-breaker-change', ({ provider, from, to }) => {
  console.log(`Circuit Breaker: ${provider} ${from} → ${to}`);
});

// Listen to cache events
realtimeMonitor.on('cache-hit', () => {
  console.log('Cache hit!');
});

realtimeMonitor.on('cache-miss', () => {
  console.log('Cache miss');
});

// ============================================================================
// Cleanup
// ============================================================================

// Reset metrics
monitor.reset();

// Destroy monitor (stop cleanup interval, remove listeners)
monitor.destroy();
