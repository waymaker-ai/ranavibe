/**
 * Performance Metrics - Latency percentiles, throughput, error rate
 */

import type { StorageInterface, PerformanceMetrics, MetricQuery } from '../types.js';
import { getTimeRange } from './cost.js';

export class PerformanceMetricsCalculator {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async calculate(query: MetricQuery = {}): Promise<PerformanceMetrics> {
    const period = query.period ?? 'day';
    const { from, to } = getTimeRange(period, query.from, query.to);

    // Fetch latency events
    const latencyEvents = await this.storage.query({
      type: 'latency',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    // Fetch request events for throughput
    const requestEvents = await this.storage.query({
      type: 'request',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    // Fetch error events
    const errorEvents = await this.storage.query({
      type: 'error',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    // Calculate latency percentiles
    const latencies: number[] = [];
    for (const event of latencyEvents) {
      const val = typeof event.data.latencyMs === 'number'
        ? event.data.latencyMs
        : typeof event.data.duration === 'number'
          ? event.data.duration
          : null;
      if (val !== null) {
        latencies.push(val);
      }
    }

    latencies.sort((a, b) => a - b);

    const totalRequests = requestEvents.length;
    const totalErrors = errorEvents.length;

    // Throughput: requests per second over the time window
    const windowMs = to - from;
    const throughput = windowMs > 0 ? (totalRequests / windowMs) * 1000 : 0;

    const errorRate = totalRequests > 0
      ? Math.round((totalErrors / totalRequests) * 100 * 100) / 100
      : 0;

    return {
      latency: {
        avg: average(latencies),
        p50: percentile(latencies, 50),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        min: latencies.length > 0 ? latencies[0] : 0,
        max: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
      },
      throughput: Math.round(throughput * 1000) / 1000,
      errorRate,
      totalRequests,
      totalErrors,
    };
  }
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sortedValues[lower];

  const fraction = index - lower;
  return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower]);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}
