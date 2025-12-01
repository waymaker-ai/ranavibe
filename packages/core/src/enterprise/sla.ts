/**
 * SLA Support
 *
 * Enterprise SLA monitoring and enforcement:
 * - Uptime tracking
 * - Response time SLOs
 * - Error rate monitoring
 * - SLA reporting
 * - Alerting
 */

// ============================================================================
// Types
// ============================================================================

export type SLOType = 'availability' | 'latency' | 'error_rate' | 'throughput' | 'quality';
export type TimeWindow = '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SLODefinition {
  id: string;
  name: string;
  description?: string;
  type: SLOType;
  target: number; // Target value (e.g., 99.9 for availability)
  window: TimeWindow;
  service?: string;
  endpoint?: string;
  tags?: Record<string, string>;
}

export interface SLOStatus {
  sloId: string;
  current: number;
  target: number;
  status: 'met' | 'at_risk' | 'breached';
  errorBudgetRemaining: number; // Percentage
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
}

export interface SLADefinition {
  id: string;
  name: string;
  description?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  slos: SLODefinition[];
  penalties?: SLAPenalty[];
  effectiveDate: Date;
  expirationDate?: Date;
  customerId?: string;
}

export interface SLAPenalty {
  threshold: number; // Percentage below target
  type: 'credit' | 'refund' | 'service_extension';
  value: number; // Percentage or days
}

export interface SLAReport {
  slaId: string;
  period: {
    start: Date;
    end: Date;
  };
  sloStatuses: SLOStatus[];
  overallCompliance: number;
  breaches: SLABreach[];
  penalties: AppliedPenalty[];
  summary: string;
}

export interface SLABreach {
  id: string;
  sloId: string;
  occurredAt: Date;
  duration: number; // seconds
  actualValue: number;
  targetValue: number;
  impact: string;
  rootCause?: string;
  resolution?: string;
}

export interface AppliedPenalty {
  penaltyType: 'credit' | 'refund' | 'service_extension';
  value: number;
  reason: string;
  appliedAt: Date;
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  sloId: string;
  condition: 'below_target' | 'error_budget_low' | 'trending_down';
  threshold?: number;
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown?: number; // seconds
  enabled: boolean;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  sloId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SLAManagerConfig {
  slas: SLADefinition[];
  alertRules?: AlertRule[];
  metricsRetention?: number; // days
  checkInterval?: number; // seconds
  storageAdapter?: SLAStorageAdapter;
  alertHandler?: (alert: Alert) => Promise<void>;
}

export interface SLAStorageAdapter {
  recordMetric(sloId: string, dataPoint: MetricDataPoint): Promise<void>;
  getMetrics(sloId: string, window: TimeWindow): Promise<MetricDataPoint[]>;
  recordBreach(breach: SLABreach): Promise<void>;
  getBreaches(slaId: string, period: { start: Date; end: Date }): Promise<SLABreach[]>;
  recordAlert(alert: Alert): Promise<void>;
  getAlerts(query: { sloId?: string; status?: 'active' | 'acknowledged' | 'resolved' }): Promise<Alert[]>;
}

// ============================================================================
// SLA Manager Class
// ============================================================================

export class SLAManager {
  private config: Required<SLAManagerConfig>;
  private storage: SLAStorageAdapter;
  private slas: Map<string, SLADefinition> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: SLAManagerConfig) {
    this.config = {
      slas: config.slas,
      alertRules: config.alertRules ?? [],
      metricsRetention: config.metricsRetention ?? 90,
      checkInterval: config.checkInterval ?? 60,
      storageAdapter: config.storageAdapter ?? new MemorySLAStorage(),
      alertHandler: config.alertHandler ?? (async () => {}),
    };

    this.storage = this.config.storageAdapter;

    // Index SLAs
    for (const sla of config.slas) {
      this.slas.set(sla.id, sla);
    }

    // Index alert rules
    for (const rule of this.config.alertRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  // --------------------------------------------------------------------------
  // Metric Recording
  // --------------------------------------------------------------------------

  /**
   * Record a metric for an SLO
   */
  async recordMetric(
    sloId: string,
    value: number,
    tags?: Record<string, string>
  ): Promise<void> {
    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      value,
      tags,
    };

    await this.storage.recordMetric(sloId, dataPoint);

    // Check for breaches
    await this.checkSLOStatus(sloId);
  }

  /**
   * Record request latency
   */
  async recordLatency(
    sloId: string,
    latencyMs: number,
    tags?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric(sloId, latencyMs, tags);
  }

  /**
   * Record availability (1 = up, 0 = down)
   */
  async recordAvailability(
    sloId: string,
    available: boolean,
    tags?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric(sloId, available ? 1 : 0, tags);
  }

  /**
   * Record error occurrence
   */
  async recordError(
    sloId: string,
    tags?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric(sloId, 1, { ...tags, type: 'error' });
  }

  /**
   * Record success
   */
  async recordSuccess(
    sloId: string,
    tags?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric(sloId, 0, { ...tags, type: 'success' });
  }

  // --------------------------------------------------------------------------
  // SLO Status
  // --------------------------------------------------------------------------

  /**
   * Get current status of an SLO
   */
  async getSLOStatus(sloId: string): Promise<SLOStatus> {
    const slo = this.findSLO(sloId);

    if (!slo) {
      throw new Error(`SLO '${sloId}' not found`);
    }

    const metrics = await this.storage.getMetrics(sloId, slo.window);
    const current = this.calculateSLOValue(slo, metrics);
    const target = slo.target;

    // Calculate error budget
    const errorBudgetTotal = 100 - target;
    const errorBudgetUsed = Math.max(0, target - current);
    const errorBudgetRemaining = ((errorBudgetTotal - errorBudgetUsed) / errorBudgetTotal) * 100;

    // Determine status
    let status: SLOStatus['status'] = 'met';
    if (current < target) {
      status = 'breached';
    } else if (errorBudgetRemaining < 20) {
      status = 'at_risk';
    }

    // Calculate trend
    const trend = this.calculateTrend(metrics);

    return {
      sloId,
      current,
      target,
      status,
      errorBudgetRemaining,
      trend,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get status of all SLOs in an SLA
   */
  async getSLAStatus(slaId: string): Promise<{
    sla: SLADefinition;
    sloStatuses: SLOStatus[];
    overallCompliance: number;
  }> {
    const sla = this.slas.get(slaId);

    if (!sla) {
      throw new Error(`SLA '${slaId}' not found`);
    }

    const sloStatuses = await Promise.all(
      sla.slos.map((slo) => this.getSLOStatus(slo.id))
    );

    const metCount = sloStatuses.filter((s) => s.status === 'met').length;
    const overallCompliance = (metCount / sloStatuses.length) * 100;

    return {
      sla,
      sloStatuses,
      overallCompliance,
    };
  }

  // --------------------------------------------------------------------------
  // SLA Reporting
  // --------------------------------------------------------------------------

  /**
   * Generate SLA report
   */
  async generateReport(
    slaId: string,
    period: { start: Date; end: Date }
  ): Promise<SLAReport> {
    const sla = this.slas.get(slaId);

    if (!sla) {
      throw new Error(`SLA '${slaId}' not found`);
    }

    // Get SLO statuses
    const sloStatuses = await Promise.all(
      sla.slos.map((slo) => this.getSLOStatus(slo.id))
    );

    // Get breaches
    const breaches = await this.storage.getBreaches(slaId, period);

    // Calculate compliance
    const metCount = sloStatuses.filter((s) => s.status === 'met').length;
    const overallCompliance = (metCount / sloStatuses.length) * 100;

    // Calculate penalties
    const penalties = this.calculatePenalties(sla, sloStatuses, breaches);

    // Generate summary
    const summary = this.generateReportSummary(sla, sloStatuses, breaches, overallCompliance);

    return {
      slaId,
      period,
      sloStatuses,
      overallCompliance,
      breaches,
      penalties,
      summary,
    };
  }

  /**
   * Export report to various formats
   */
  async exportReport(
    report: SLAReport,
    format: 'json' | 'csv' | 'pdf' | 'html'
  ): Promise<string | Buffer> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);

      case 'csv':
        return this.reportToCSV(report);

      case 'html':
        return this.reportToHTML(report);

      case 'pdf':
        // Would generate PDF
        return Buffer.from('PDF placeholder');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // --------------------------------------------------------------------------
  // Alerting
  // --------------------------------------------------------------------------

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(
      () => this.runChecks(),
      this.config.checkInterval * 1000
    );
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return this.storage.getAlerts({ status: 'active' });
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alerts = await this.storage.getAlerts({});
    const alert = alerts.find((a) => a.id === alertId);

    if (alert) {
      await this.storage.recordAlert({
        ...alert,
        acknowledgedAt: new Date(),
      });
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alerts = await this.storage.getAlerts({});
    const alert = alerts.find((a) => a.id === alertId);

    if (alert) {
      await this.storage.recordAlert({
        ...alert,
        resolvedAt: new Date(),
      });
    }
  }

  // --------------------------------------------------------------------------
  // SLA Management
  // --------------------------------------------------------------------------

  /**
   * Add or update SLA
   */
  addSLA(sla: SLADefinition): void {
    this.slas.set(sla.id, sla);
  }

  /**
   * Remove SLA
   */
  removeSLA(slaId: string): void {
    this.slas.delete(slaId);
  }

  /**
   * Get all SLAs
   */
  getSLAs(): SLADefinition[] {
    return Array.from(this.slas.values());
  }

  /**
   * Get SLA by ID
   */
  getSLA(slaId: string): SLADefinition | undefined {
    return this.slas.get(slaId);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private findSLO(sloId: string): SLODefinition | undefined {
    for (const sla of this.slas.values()) {
      const slo = sla.slos.find((s) => s.id === sloId);
      if (slo) return slo;
    }
    return undefined;
  }

  private calculateSLOValue(
    slo: SLODefinition,
    metrics: MetricDataPoint[]
  ): number {
    if (metrics.length === 0) {
      return slo.target; // Assume meeting target if no data
    }

    switch (slo.type) {
      case 'availability': {
        const upCount = metrics.filter((m) => m.value === 1).length;
        return (upCount / metrics.length) * 100;
      }

      case 'latency': {
        // Calculate p99 or average based on target interpretation
        const sorted = metrics.map((m) => m.value).sort((a, b) => a - b);
        const p99Index = Math.floor(sorted.length * 0.99);
        return sorted[p99Index];
      }

      case 'error_rate': {
        const errorCount = metrics.filter((m) => m.tags?.type === 'error').length;
        return (1 - errorCount / metrics.length) * 100;
      }

      case 'throughput': {
        // Sum of all requests
        return metrics.length;
      }

      case 'quality': {
        const avg = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        return avg;
      }

      default:
        return 0;
    }
  }

  private calculateTrend(
    metrics: MetricDataPoint[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 10) {
      return 'stable';
    }

    const recent = metrics.slice(-5);
    const earlier = metrics.slice(-10, -5);

    const recentAvg = recent.reduce((s, m) => s + m.value, 0) / recent.length;
    const earlierAvg = earlier.reduce((s, m) => s + m.value, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'degrading';
    return 'stable';
  }

  private calculatePenalties(
    sla: SLADefinition,
    sloStatuses: SLOStatus[],
    _breaches: SLABreach[]
  ): AppliedPenalty[] {
    const penalties: AppliedPenalty[] = [];

    if (!sla.penalties?.length) {
      return penalties;
    }

    for (const status of sloStatuses) {
      if (status.status === 'breached') {
        const shortfall = status.target - status.current;

        for (const penalty of sla.penalties) {
          if (shortfall >= penalty.threshold) {
            penalties.push({
              penaltyType: penalty.type,
              value: penalty.value,
              reason: `SLO ${status.sloId} below target by ${shortfall.toFixed(2)}%`,
              appliedAt: new Date(),
            });
            break; // Apply only highest applicable penalty
          }
        }
      }
    }

    return penalties;
  }

  private generateReportSummary(
    sla: SLADefinition,
    sloStatuses: SLOStatus[],
    breaches: SLABreach[],
    compliance: number
  ): string {
    const parts: string[] = [];

    parts.push(`SLA Report for ${sla.name} (${sla.tier} tier)`);
    parts.push(`Overall Compliance: ${compliance.toFixed(1)}%`);

    const metCount = sloStatuses.filter((s) => s.status === 'met').length;
    parts.push(`SLOs Met: ${metCount}/${sloStatuses.length}`);

    if (breaches.length > 0) {
      parts.push(`Breaches: ${breaches.length}`);
    }

    const atRisk = sloStatuses.filter((s) => s.status === 'at_risk');
    if (atRisk.length > 0) {
      parts.push(`At Risk: ${atRisk.length} SLOs`);
    }

    return parts.join('\n');
  }

  private async checkSLOStatus(sloId: string): Promise<void> {
    try {
      const status = await this.getSLOStatus(sloId);

      // Check alert rules
      for (const rule of this.alertRules.values()) {
        if (rule.sloId !== sloId || !rule.enabled) continue;

        const shouldAlert = this.evaluateAlertRule(rule, status);

        if (shouldAlert) {
          await this.triggerAlert(rule, status);
        }
      }

      // Record breach if applicable
      if (status.status === 'breached') {
        const slo = this.findSLO(sloId);
        if (slo) {
          const breach: SLABreach = {
            id: `breach-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            sloId,
            occurredAt: new Date(),
            duration: 0,
            actualValue: status.current,
            targetValue: status.target,
            impact: `SLO ${sloId} breached: ${status.current}% vs ${status.target}%`,
          };

          await this.storage.recordBreach(breach);
        }
      }
    } catch (error) {
      console.error(`Error checking SLO ${sloId}:`, error);
    }
  }

  private evaluateAlertRule(rule: AlertRule, status: SLOStatus): boolean {
    switch (rule.condition) {
      case 'below_target':
        return status.status === 'breached';

      case 'error_budget_low':
        return status.errorBudgetRemaining < (rule.threshold ?? 20);

      case 'trending_down':
        return status.trend === 'degrading';

      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, status: SLOStatus): Promise<void> {
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(rule.id);
    if (lastAlert && Date.now() - lastAlert.getTime() < (rule.cooldown ?? 300) * 1000) {
      return;
    }

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      ruleId: rule.id,
      sloId: rule.sloId,
      severity: rule.severity,
      title: `SLO Alert: ${rule.name}`,
      message: `SLO ${status.sloId} - Current: ${status.current.toFixed(2)}%, Target: ${status.target}%, Status: ${status.status}`,
      triggeredAt: new Date(),
      metadata: {
        status,
      },
    };

    await this.storage.recordAlert(alert);
    await this.config.alertHandler(alert);

    this.lastAlertTime.set(rule.id, new Date());
  }

  private async runChecks(): Promise<void> {
    for (const sla of this.slas.values()) {
      for (const slo of sla.slos) {
        await this.checkSLOStatus(slo.id);
      }
    }
  }

  private reportToCSV(report: SLAReport): string {
    const lines: string[] = [];

    lines.push('SLO ID,Current,Target,Status,Error Budget Remaining');

    for (const status of report.sloStatuses) {
      lines.push(
        `${status.sloId},${status.current},${status.target},${status.status},${status.errorBudgetRemaining}`
      );
    }

    return lines.join('\n');
  }

  private reportToHTML(report: SLAReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>SLA Report - ${report.slaId}</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
    .met { color: green; }
    .at_risk { color: orange; }
    .breached { color: red; }
  </style>
</head>
<body>
  <h1>SLA Report</h1>
  <p>Period: ${report.period.start.toISOString()} - ${report.period.end.toISOString()}</p>
  <p>Overall Compliance: ${report.overallCompliance.toFixed(1)}%</p>

  <h2>SLO Status</h2>
  <table>
    <tr>
      <th>SLO ID</th>
      <th>Current</th>
      <th>Target</th>
      <th>Status</th>
      <th>Error Budget</th>
    </tr>
    ${report.sloStatuses
      .map(
        (s) => `
    <tr>
      <td>${s.sloId}</td>
      <td>${s.current.toFixed(2)}%</td>
      <td>${s.target}%</td>
      <td class="${s.status}">${s.status}</td>
      <td>${s.errorBudgetRemaining.toFixed(1)}%</td>
    </tr>
    `
      )
      .join('')}
  </table>

  <h2>Breaches</h2>
  <p>Total: ${report.breaches.length}</p>

  <pre>${report.summary}</pre>
</body>
</html>
    `.trim();
  }
}

// ============================================================================
// Memory Storage Adapter (for development)
// ============================================================================

class MemorySLAStorage implements SLAStorageAdapter {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private breaches: SLABreach[] = [];
  private alerts: Alert[] = [];

  async recordMetric(sloId: string, dataPoint: MetricDataPoint): Promise<void> {
    const existing = this.metrics.get(sloId) ?? [];
    existing.push(dataPoint);

    // Keep last 1000 data points
    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(sloId, existing);
  }

  async getMetrics(sloId: string, window: TimeWindow): Promise<MetricDataPoint[]> {
    const all = this.metrics.get(sloId) ?? [];
    const windowMs = this.windowToMs(window);
    const cutoff = new Date(Date.now() - windowMs);

    return all.filter((m) => m.timestamp >= cutoff);
  }

  async recordBreach(breach: SLABreach): Promise<void> {
    this.breaches.push(breach);
  }

  async getBreaches(
    _slaId: string,
    period: { start: Date; end: Date }
  ): Promise<SLABreach[]> {
    return this.breaches.filter(
      (b) => b.occurredAt >= period.start && b.occurredAt <= period.end
    );
  }

  async recordAlert(alert: Alert): Promise<void> {
    const index = this.alerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      this.alerts[index] = alert;
    } else {
      this.alerts.push(alert);
    }
  }

  async getAlerts(query: {
    sloId?: string;
    status?: 'active' | 'acknowledged' | 'resolved';
  }): Promise<Alert[]> {
    return this.alerts.filter((a) => {
      if (query.sloId && a.sloId !== query.sloId) return false;

      if (query.status) {
        if (query.status === 'resolved' && !a.resolvedAt) return false;
        if (query.status === 'acknowledged' && (!a.acknowledgedAt || a.resolvedAt)) return false;
        if (query.status === 'active' && (a.acknowledgedAt || a.resolvedAt)) return false;
      }

      return true;
    });
  }

  private windowToMs(window: TimeWindow): number {
    const map: Record<TimeWindow, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return map[window];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSLAManager(config: SLAManagerConfig): SLAManager {
  return new SLAManager(config);
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { MemorySLAStorage };

// ============================================================================
// Pre-defined SLA Templates
// ============================================================================

export const SLA_TEMPLATES: Record<string, Omit<SLADefinition, 'id' | 'effectiveDate'>> = {
  platinum: {
    name: 'Platinum SLA',
    tier: 'platinum',
    slos: [
      { id: 'availability', name: 'Availability', type: 'availability', target: 99.99, window: '30d' },
      { id: 'latency-p99', name: 'P99 Latency', type: 'latency', target: 100, window: '24h' },
      { id: 'error-rate', name: 'Error Rate', type: 'error_rate', target: 99.9, window: '24h' },
    ],
    penalties: [
      { threshold: 0.1, type: 'credit', value: 10 },
      { threshold: 1, type: 'credit', value: 25 },
      { threshold: 5, type: 'credit', value: 50 },
    ],
  },
  gold: {
    name: 'Gold SLA',
    tier: 'gold',
    slos: [
      { id: 'availability', name: 'Availability', type: 'availability', target: 99.9, window: '30d' },
      { id: 'latency-p99', name: 'P99 Latency', type: 'latency', target: 200, window: '24h' },
      { id: 'error-rate', name: 'Error Rate', type: 'error_rate', target: 99, window: '24h' },
    ],
    penalties: [
      { threshold: 0.5, type: 'credit', value: 10 },
      { threshold: 2, type: 'credit', value: 25 },
    ],
  },
  silver: {
    name: 'Silver SLA',
    tier: 'silver',
    slos: [
      { id: 'availability', name: 'Availability', type: 'availability', target: 99.5, window: '30d' },
      { id: 'latency-p99', name: 'P99 Latency', type: 'latency', target: 500, window: '24h' },
    ],
    penalties: [
      { threshold: 1, type: 'credit', value: 10 },
    ],
  },
  bronze: {
    name: 'Bronze SLA',
    tier: 'bronze',
    slos: [
      { id: 'availability', name: 'Availability', type: 'availability', target: 99, window: '30d' },
    ],
  },
};
