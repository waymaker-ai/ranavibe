/**
 * Compliance Alert - Alerts on compliance violations with severity
 */

import * as crypto from 'node:crypto';
import type { DashboardEvent, Alert, AlertLevel } from '../types.js';

export interface ComplianceAlertOptions {
  /** Frameworks to monitor (all if empty) */
  frameworks?: string[];
  /** Alert on warnings too, not just failures */
  alertOnWarnings?: boolean;
}

export class ComplianceAlert {
  private readonly frameworks: Set<string> | null;
  private readonly alertOnWarnings: boolean;

  constructor(options: ComplianceAlertOptions = {}) {
    this.frameworks = options.frameworks?.length
      ? new Set(options.frameworks)
      : null;
    this.alertOnWarnings = options.alertOnWarnings ?? false;
  }

  /**
   * Check a compliance event and return an alert if it's a violation
   */
  check(event: DashboardEvent): Alert | null {
    if (event.type !== 'compliance') return null;

    const data = event.data;
    const framework = (data.framework as string) ?? 'unknown';
    const result = ((data.result as string) ?? '').toLowerCase();
    const rule = (data.rule as string) ?? (data.ruleId as string) ?? 'unknown';
    const severity = (data.severity as string) ?? 'medium';

    // Filter by framework if configured
    if (this.frameworks && !this.frameworks.has(framework)) {
      return null;
    }

    // Only alert on failures (and optionally warnings)
    const isFailure = result === 'fail' || result === 'failed' || result === 'violation';
    const isWarning = result === 'warning' || result === 'warn';

    if (!isFailure && !(isWarning && this.alertOnWarnings)) {
      return null;
    }

    const level: AlertLevel = isFailure && (severity === 'high' || severity === 'critical')
      ? 'critical'
      : 'warning';

    return {
      id: crypto.randomUUID(),
      type: 'compliance',
      level,
      message: `Compliance violation: ${framework} rule "${rule}" ${result}${data.details ? ` - ${data.details}` : ''}`,
      timestamp: Date.now(),
      data: {
        framework,
        rule,
        result,
        severity,
        details: data.details,
      },
      acknowledged: false,
    };
  }
}
