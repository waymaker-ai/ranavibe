/**
 * Security Alert - Alerts on injection attempts and PII exposure
 */

import * as crypto from 'node:crypto';
import type { DashboardEvent, Alert, AlertLevel } from '../types.js';

export interface SecurityAlertOptions {
  alertOnInjection?: boolean;
  alertOnPII?: boolean;
  injectionSeverityThreshold?: string; // 'low' | 'medium' | 'high' | 'critical'
}

const SEVERITY_LEVELS: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export class SecurityAlert {
  private readonly alertOnInjection: boolean;
  private readonly alertOnPII: boolean;
  private readonly injectionSeverityLevel: number;

  constructor(options: SecurityAlertOptions = {}) {
    this.alertOnInjection = options.alertOnInjection ?? true;
    this.alertOnPII = options.alertOnPII ?? true;
    this.injectionSeverityLevel = SEVERITY_LEVELS[options.injectionSeverityThreshold ?? 'medium'] ?? 1;
  }

  /**
   * Check a security event and return an alert if needed
   */
  check(event: DashboardEvent): Alert | null {
    if (event.type !== 'security') return null;

    const data = event.data;
    const category = (data.category as string) ?? (data.type as string);

    // Injection attempt
    if (this.alertOnInjection && (category === 'injection' || category === 'prompt_injection')) {
      const severity = (data.severity as string) ?? 'medium';
      const severityLevel = SEVERITY_LEVELS[severity] ?? 1;

      if (severityLevel >= this.injectionSeverityLevel) {
        const level: AlertLevel = severityLevel >= 2 ? 'critical' : 'warning';
        return {
          id: crypto.randomUUID(),
          type: 'security',
          level,
          message: `Injection attempt detected (severity: ${severity})${data.details ? `: ${data.details}` : ''}`,
          timestamp: Date.now(),
          data: {
            category,
            severity,
            provider: event.provider,
            model: event.model,
            ...((data.details ? { details: data.details } : {})),
          },
          acknowledged: false,
        };
      }
    }

    // PII exposure
    if (this.alertOnPII && (category === 'pii' || category === 'pii_detected')) {
      const piiType = (data.piiType as string) ?? (data.subtype as string) ?? 'unknown';
      const level: AlertLevel = isHighRiskPII(piiType) ? 'critical' : 'warning';

      return {
        id: crypto.randomUUID(),
        type: 'security',
        level,
        message: `PII detected: ${piiType}${data.details ? ` - ${data.details}` : ''}`,
        timestamp: Date.now(),
        data: {
          category,
          piiType,
          provider: event.provider,
          model: event.model,
        },
        acknowledged: false,
      };
    }

    return null;
  }
}

function isHighRiskPII(piiType: string): boolean {
  const highRisk = ['ssn', 'social_security', 'credit_card', 'bank_account', 'password', 'api_key', 'secret'];
  return highRisk.includes(piiType.toLowerCase());
}
