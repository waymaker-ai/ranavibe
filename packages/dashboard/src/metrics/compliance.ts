/**
 * Compliance Metrics - Violations, scores, and audit trail
 */

import type { StorageInterface, ComplianceMetrics, MetricQuery } from '../types.js';
import { getTimeRange } from './cost.js';

export class ComplianceMetricsCalculator {
  private readonly storage: StorageInterface;

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  async calculate(query: MetricQuery = {}): Promise<ComplianceMetrics> {
    const period = query.period ?? 'day';
    const { from, to } = getTimeRange(period, query.from, query.to);

    const events = await this.storage.query({
      type: 'compliance',
      from,
      to,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const violationsByFramework: Record<string, number> = {};
    const auditEvents: ComplianceMetrics['auditEvents'] = [];
    let totalViolations = 0;
    let passCount = 0;
    let totalChecks = 0;

    for (const event of events) {
      const data = event.data;
      const framework = (data.framework as string) ?? 'unknown';
      const rule = (data.rule as string) ?? (data.ruleId as string) ?? 'unknown';
      const result = normalizeResult(data.result as string);

      totalChecks++;

      if (result === 'fail') {
        totalViolations++;
        violationsByFramework[framework] = (violationsByFramework[framework] ?? 0) + 1;
      } else if (result === 'pass') {
        passCount++;
      }

      auditEvents.push({
        timestamp: event.timestamp,
        framework,
        rule,
        result,
        details: (data.details as string) ?? (data.message as string),
      });
    }

    // Compliance score: percentage of passed checks
    const complianceScore = totalChecks > 0
      ? Math.round((passCount / totalChecks) * 100 * 100) / 100
      : 100;

    // Sort audit events by timestamp descending
    auditEvents.sort((a, b) => b.timestamp - a.timestamp);

    return {
      violationsByFramework,
      complianceScore,
      auditEvents,
      totalViolations,
    };
  }
}

function normalizeResult(result: string | undefined): 'pass' | 'fail' | 'warning' {
  if (!result) return 'fail';
  const lower = result.toLowerCase();
  if (lower === 'pass' || lower === 'passed' || lower === 'ok') return 'pass';
  if (lower === 'warning' || lower === 'warn') return 'warning';
  return 'fail';
}
