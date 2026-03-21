/**
 * Cost Metrics - Track spending by model, provider, and period
 */

import type {
  StorageInterface,
  CostMetrics,
  MetricQuery,
  DashboardEvent,
  TrendDirection,
  TimePeriod,
} from '../types.js';
import { MetricsAggregator } from '../aggregator.js';

export class CostMetricsCalculator {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async calculate(query: MetricQuery = {}): Promise<CostMetrics> {
    const period = query.period ?? 'day';
    const { from, to } = getTimeRange(period, query.from, query.to);

    const events = await this.storage.query({
      type: 'cost',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    let total = 0;
    const byModel: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const aggregator = new MetricsAggregator();

    for (const event of events) {
      const cost = typeof event.data.cost === 'number' ? event.data.cost : 0;
      total += cost;

      if (event.model) {
        byModel[event.model] = (byModel[event.model] ?? 0) + cost;
      }
      if (event.provider) {
        byProvider[event.provider] = (byProvider[event.provider] ?? 0) + cost;
      }

      aggregator.add('cost', cost, event.timestamp, period);
    }

    const timeSeries = aggregator.getTimeSeries('cost');
    const byPeriod = timeSeries.map((ts) => ({
      period: ts.key,
      cost: ts.stats.sum,
    }));

    const trend = aggregator.detectTrend('cost');
    const projectedMonthly = aggregator.projectMonthly('cost', period);

    return {
      total,
      byModel,
      byProvider,
      byPeriod,
      trend,
      projectedMonthly,
    };
  }
}

function getTimeRange(
  period: TimePeriod,
  from?: number,
  to?: number
): { from: number; to: number } {
  const now = Date.now();
  const toTime = to ?? now;
  if (from) return { from, to: toTime };

  const periodMs: Record<TimePeriod, number> = {
    minute: 3_600_000,       // look back 1 hour
    hour: 86_400_000,        // look back 1 day
    day: 30 * 86_400_000,    // look back 30 days
    week: 90 * 86_400_000,   // look back 90 days
    month: 365 * 86_400_000, // look back 1 year
  };

  return { from: toTime - periodMs[period], to: toTime };
}

export { getTimeRange };
