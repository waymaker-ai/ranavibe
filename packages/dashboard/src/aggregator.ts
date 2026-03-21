/**
 * MetricsAggregator - Time-bucketed aggregation with trend detection
 */

import type {
  DashboardEvent,
  TimePeriod,
  TrendDirection,
  RunningStats,
} from './types.js';

// ============================================================================
// Bucket Key Helpers
// ============================================================================

function getBucketKey(timestamp: number, period: TimePeriod): string {
  const d = new Date(timestamp);
  switch (period) {
    case 'minute':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    case 'hour':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
    case 'day':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    case 'week': {
      // ISO week start (Monday)
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
      return `${weekStart.getUTCFullYear()}-W${pad(getISOWeek(weekStart))}`;
    }
    case 'month':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  }
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function getPeriodMs(period: TimePeriod): number {
  switch (period) {
    case 'minute': return 60_000;
    case 'hour': return 3_600_000;
    case 'day': return 86_400_000;
    case 'week': return 604_800_000;
    case 'month': return 2_592_000_000; // ~30 days
  }
}

// ============================================================================
// Running Stats (Welford's algorithm)
// ============================================================================

function createStats(): RunningStats {
  return { count: 0, sum: 0, min: Infinity, max: -Infinity, mean: 0, m2: 0 };
}

function addValue(stats: RunningStats, value: number): void {
  stats.count++;
  stats.sum += value;
  if (value < stats.min) stats.min = value;
  if (value > stats.max) stats.max = value;

  // Welford's online algorithm for mean + variance
  const delta = value - stats.mean;
  stats.mean += delta / stats.count;
  const delta2 = value - stats.mean;
  stats.m2 += delta * delta2;
}

function getVariance(stats: RunningStats): number {
  if (stats.count < 2) return 0;
  return stats.m2 / (stats.count - 1);
}

function getStdDev(stats: RunningStats): number {
  return Math.sqrt(getVariance(stats));
}

// ============================================================================
// Bucket
// ============================================================================

interface Bucket {
  key: string;
  stats: RunningStats;
  startTime: number;
}

// ============================================================================
// MetricsAggregator
// ============================================================================

export class MetricsAggregator {
  private buckets: Map<string, Map<string, Bucket>> = new Map(); // field -> key -> bucket

  /**
   * Add an event value to the aggregation
   */
  add(field: string, value: number, timestamp: number, period: TimePeriod): void {
    const key = getBucketKey(timestamp, period);
    const fieldBuckets = this.getFieldBuckets(field);

    let bucket = fieldBuckets.get(key);
    if (!bucket) {
      bucket = { key, stats: createStats(), startTime: timestamp };
      fieldBuckets.set(key, bucket);
    }

    addValue(bucket.stats, value);
  }

  /**
   * Add multiple event values from dashboard events
   */
  addEvent(event: DashboardEvent, period: TimePeriod): void {
    const ts = event.timestamp;
    const data = event.data;

    if (event.type === 'cost' && typeof data.cost === 'number') {
      this.add('cost', data.cost, ts, period);
    }
    if (event.type === 'latency' && typeof data.latencyMs === 'number') {
      this.add('latency', data.latencyMs, ts, period);
    }
    if ((event.type === 'request' || event.type === 'response') && typeof data.tokens === 'number') {
      this.add('tokens', data.tokens, ts, period);
    }
    if (event.type === 'request') {
      this.add('requests', 1, ts, period);
    }
    if (event.type === 'error') {
      this.add('errors', 1, ts, period);
    }
    if (event.type === 'security') {
      this.add('security_events', 1, ts, period);
    }
    if (event.type === 'compliance') {
      this.add('compliance_events', 1, ts, period);
    }
  }

  /**
   * Get aggregated stats for a field
   */
  getStats(field: string): RunningStats {
    const fieldBuckets = this.buckets.get(field);
    if (!fieldBuckets) return createStats();

    const combined = createStats();
    for (const bucket of fieldBuckets.values()) {
      // Merge bucket stats into combined
      for (let i = 0; i < bucket.stats.count; i++) {
        // Approximate: use mean for merged stats
      }
      combined.count += bucket.stats.count;
      combined.sum += bucket.stats.sum;
      if (bucket.stats.min < combined.min) combined.min = bucket.stats.min;
      if (bucket.stats.max > combined.max) combined.max = bucket.stats.max;
    }
    if (combined.count > 0) {
      combined.mean = combined.sum / combined.count;
    }
    return combined;
  }

  /**
   * Get time series data for a field
   */
  getTimeSeries(field: string): Array<{ key: string; stats: RunningStats }> {
    const fieldBuckets = this.buckets.get(field);
    if (!fieldBuckets) return [];

    return Array.from(fieldBuckets.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({ key: b.key, stats: { ...b.stats } }));
  }

  /**
   * Detect trend using simple linear regression on bucket sums
   */
  detectTrend(field: string): TrendDirection {
    const series = this.getTimeSeries(field);
    if (series.length < 3) return 'stable';

    const values = series.map((s) => s.stats.sum);
    const slope = linearRegressionSlope(values);

    // Normalize slope by the mean value to detect relative change
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 'stable';

    const normalizedSlope = slope / mean;

    if (normalizedSlope > 0.05) return 'increasing';
    if (normalizedSlope < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Project monthly total based on current data
   */
  projectMonthly(field: string, period: TimePeriod): number {
    const series = this.getTimeSeries(field);
    if (series.length === 0) return 0;

    const totalSum = series.reduce((acc, s) => acc + s.stats.sum, 0);
    const periodMs = getPeriodMs(period);
    const spanBuckets = series.length;
    const spanMs = spanBuckets * periodMs;

    if (spanMs === 0) return totalSum;

    const monthMs = 30 * 86_400_000;
    return (totalSum / spanMs) * monthMs;
  }

  /**
   * Get bucket count for a field
   */
  getBucketCount(field: string): number {
    return this.buckets.get(field)?.size ?? 0;
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * Clear buckets older than a given timestamp
   */
  clearBefore(field: string, beforeTimestamp: number): number {
    const fieldBuckets = this.buckets.get(field);
    if (!fieldBuckets) return 0;

    let removed = 0;
    for (const [key, bucket] of fieldBuckets) {
      if (bucket.startTime < beforeTimestamp) {
        fieldBuckets.delete(key);
        removed++;
      }
    }
    return removed;
  }

  private getFieldBuckets(field: string): Map<string, Bucket> {
    let fieldBuckets = this.buckets.get(field);
    if (!fieldBuckets) {
      fieldBuckets = new Map();
      this.buckets.set(field, fieldBuckets);
    }
    return fieldBuckets;
  }
}

// ============================================================================
// Linear Regression
// ============================================================================

/**
 * Simple linear regression returning the slope.
 * X values are indices 0..n-1, Y values are the input array.
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

export { createStats, addValue, getVariance, getStdDev, linearRegressionSlope };
