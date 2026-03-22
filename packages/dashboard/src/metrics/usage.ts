/**
 * Usage Metrics - Request counts, tokens, unique models/providers
 */

import type { StorageInterface, UsageMetrics, MetricQuery } from '../types.js';
import { MetricsAggregator } from '../aggregator.js';
import { getTimeRange } from './cost.js';

export class UsageMetricsCalculator {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async calculate(query: MetricQuery = {}): Promise<UsageMetrics> {
    const period = query.period ?? 'day';
    const { from, to } = getTimeRange(period, query.from, query.to);

    // Get request and response events
    const requestEvents = await this.storage.query({
      type: 'request',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const responseEvents = await this.storage.query({
      type: 'response',
      from,
      to,
      provider: query.provider,
      model: query.model,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const allEvents = [...requestEvents, ...responseEvents];

    const models = new Set<string>();
    const providers = new Set<string>();
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    const aggregator = new MetricsAggregator();

    for (const event of allEvents) {
      if (event.model) models.add(event.model);
      if (event.provider) providers.add(event.provider);

      const tokens = typeof event.data.tokens === 'number' ? event.data.tokens : 0;
      const input = typeof event.data.inputTokens === 'number' ? event.data.inputTokens : 0;
      const output = typeof event.data.outputTokens === 'number' ? event.data.outputTokens : 0;

      totalTokens += tokens || (input + output);
      inputTokens += input;
      outputTokens += output;

      if (event.type === 'request') {
        aggregator.add('requests', 1, event.timestamp, period);
      }
      aggregator.add('tokens', tokens || (input + output), event.timestamp, period);
    }

    const requestSeries = aggregator.getTimeSeries('requests');
    const tokenSeries = aggregator.getTimeSeries('tokens');

    // Merge into byPeriod
    const periodMap = new Map<string, { requests: number; tokens: number }>();
    for (const ts of requestSeries) {
      periodMap.set(ts.key, { requests: ts.stats.count, tokens: 0 });
    }
    for (const ts of tokenSeries) {
      const existing = periodMap.get(ts.key) ?? { requests: 0, tokens: 0 };
      existing.tokens = ts.stats.sum;
      periodMap.set(ts.key, existing);
    }

    const byPeriod = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        period: key,
        requests: val.requests,
        tokens: val.tokens,
      }));

    return {
      totalRequests: requestEvents.length,
      totalTokens,
      inputTokens,
      outputTokens,
      uniqueModels: Array.from(models),
      uniqueProviders: Array.from(providers),
      byPeriod,
    };
  }
}
