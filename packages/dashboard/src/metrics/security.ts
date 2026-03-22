/**
 * Security Metrics - PII detections, injection attempts, content filtering
 */

import type { StorageInterface, SecurityMetrics, MetricQuery } from '../types.js';
import { getTimeRange } from './cost.js';

export class SecurityMetricsCalculator {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async calculate(query: MetricQuery = {}): Promise<SecurityMetrics> {
    const period = query.period ?? 'day';
    const { from, to } = getTimeRange(period, query.from, query.to);

    const events = await this.storage.query({
      type: 'security',
      from,
      to,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const piiDetections: Record<string, number> = {};
    const injectionAttempts: Record<string, number> = {};
    let contentFiltered = 0;

    for (const event of events) {
      const data = event.data;

      // PII detections
      if (data.category === 'pii' || data.type === 'pii') {
        const piiType = (data.piiType as string) ?? (data.subtype as string) ?? 'unknown';
        piiDetections[piiType] = (piiDetections[piiType] ?? 0) + 1;
      }

      // Injection attempts
      if (data.category === 'injection' || data.type === 'injection') {
        const severity = (data.severity as string) ?? 'medium';
        injectionAttempts[severity] = (injectionAttempts[severity] ?? 0) + 1;
      }

      // Content filtering
      if (data.category === 'content_filter' || data.type === 'content_filter' || data.filtered === true) {
        contentFiltered++;
      }
    }

    return {
      piiDetections,
      injectionAttempts,
      contentFiltered,
      totalEvents: events.length,
    };
  }
}
