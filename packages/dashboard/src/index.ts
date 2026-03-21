/**
 * @ranavibe/dashboard
 * AI observability dashboard - cost tracking, security monitoring, compliance reporting
 *
 * Zero runtime dependencies. Built on Node.js built-ins only.
 *
 * @example
 * ```ts
 * const dashboard = new RanaDashboard({ storage: 'memory' });
 * dashboard.collect({ type: 'cost', data: { cost: 0.05, model: 'gpt-4o' } });
 * const summary = await dashboard.summary();
 * await dashboard.serve({ port: 3456 });
 * const csv = await dashboard.export('csv', { period: 'month' });
 * ```
 */

// Types
export type {
  DashboardEvent,
  DashboardConfig,
  MetricQuery,
  CostMetrics,
  SecurityMetrics,
  ComplianceMetrics,
  PerformanceMetrics,
  UsageMetrics,
  AlertConfig,
  Alert,
  AlertLevel,
  AlertType,
  StorageInterface,
  AggregateResult,
  ExportFormat,
  ExportOptions,
  DashboardSummary,
  EventType,
  EventSeverity,
  TimePeriod,
  TrendDirection,
  StorageType,
  RunningStats,
} from './types.js';

// Core classes
export { EventCollector } from './collector.js';
export type { CollectorOptions } from './collector.js';
export { MetricsAggregator, linearRegressionSlope, createStats, addValue } from './aggregator.js';

// Storage
export { MemoryStorage, FileStorage } from './storage/index.js';
export type { MemoryStorageOptions, FileStorageOptions } from './storage/index.js';

// Metrics
export {
  CostMetricsCalculator,
  SecurityMetricsCalculator,
  ComplianceMetricsCalculator,
  PerformanceMetricsCalculator,
  UsageMetricsCalculator,
} from './metrics/index.js';

// Alerts
export {
  BudgetAlert,
  SecurityAlert,
  ComplianceAlert,
  AnomalyAlert,
} from './alerts/index.js';
export type {
  BudgetAlertOptions,
  SecurityAlertOptions,
  ComplianceAlertOptions,
  AnomalyAlertOptions,
} from './alerts/index.js';

// API
export { DashboardServer, createRoutes, corsMiddleware, authMiddleware, rateLimitMiddleware } from './api/index.js';
export type { ServerOptions, RouteDeps, Middleware } from './api/index.js';

// Exporters
export { exportCsv, exportMetricsCsv, exportJson, exportSummaryJson, exportPrometheus } from './exporters/index.js';

// ============================================================================
// RanaDashboard - High-level facade
// ============================================================================

import type {
  DashboardConfig,
  DashboardEvent,
  MetricQuery,
  ExportFormat,
  Alert,
  DashboardSummary,
  StorageInterface,
  TimePeriod,
} from './types.js';

import { EventCollector } from './collector.js';
import { MemoryStorage } from './storage/memory.js';
import { FileStorage } from './storage/file.js';
import { CostMetricsCalculator } from './metrics/cost.js';
import { SecurityMetricsCalculator } from './metrics/security.js';
import { ComplianceMetricsCalculator } from './metrics/compliance.js';
import { PerformanceMetricsCalculator } from './metrics/performance.js';
import { UsageMetricsCalculator } from './metrics/usage.js';
import { BudgetAlert } from './alerts/budget-alert.js';
import { SecurityAlert } from './alerts/security-alert.js';
import { ComplianceAlert } from './alerts/compliance-alert.js';
import { AnomalyAlert } from './alerts/anomaly-alert.js';
import { DashboardServer } from './api/server.js';
import { createRoutes } from './api/routes.js';
import { corsMiddleware, authMiddleware, rateLimitMiddleware } from './api/middleware.js';
import { exportCsv } from './exporters/csv.js';
import { exportJson } from './exporters/json.js';
import { exportPrometheus } from './exporters/prometheus.js';

export interface RanaDashboardOptions {
  storage?: 'memory' | 'file' | StorageInterface;
  storagePath?: string;
  maxEvents?: number;
  flushIntervalMs?: number;
  alerts?: DashboardConfig['alerts'];
  apiKey?: string;
  corsOrigins?: string[];
  rateLimitPerMinute?: number;
  budgetMonthly?: number;
}

export class RanaDashboard {
  private readonly storage: StorageInterface;
  private readonly collector: EventCollector;
  private readonly alertLog: Alert[] = [];
  private server: DashboardServer | null = null;

  // Metric calculators exposed as a namespace
  readonly metrics: {
    cost: (query?: MetricQuery) => ReturnType<CostMetricsCalculator['calculate']>;
    security: (query?: MetricQuery) => ReturnType<SecurityMetricsCalculator['calculate']>;
    compliance: (query?: MetricQuery) => ReturnType<ComplianceMetricsCalculator['calculate']>;
    performance: (query?: MetricQuery) => ReturnType<PerformanceMetricsCalculator['calculate']>;
    usage: (query?: MetricQuery) => ReturnType<UsageMetricsCalculator['calculate']>;
  };

  constructor(options: RanaDashboardOptions = {}) {
    // Initialize storage
    if (typeof options.storage === 'object' && options.storage !== null && 'store' in options.storage) {
      this.storage = options.storage;
    } else if (options.storage === 'file') {
      this.storage = new FileStorage({ dataDir: options.storagePath });
    } else {
      this.storage = new MemoryStorage({ maxEvents: options.maxEvents });
    }

    // Initialize collector
    this.collector = new EventCollector({
      storage: this.storage,
      bufferSize: options.maxEvents ?? 100,
      flushIntervalMs: options.flushIntervalMs ?? 5000,
      onAlert: (alert) => {
        this.alertLog.push(alert);
      },
    });

    // Register alert checkers
    this.setupAlerts(options);

    // Initialize metric calculators
    const costCalc = new CostMetricsCalculator(this.storage);
    const securityCalc = new SecurityMetricsCalculator(this.storage);
    const complianceCalc = new ComplianceMetricsCalculator(this.storage);
    const performanceCalc = new PerformanceMetricsCalculator(this.storage);
    const usageCalc = new UsageMetricsCalculator(this.storage);

    this.metrics = {
      cost: (q?) => costCalc.calculate(q),
      security: (q?) => securityCalc.calculate(q),
      compliance: (q?) => complianceCalc.calculate(q),
      performance: (q?) => performanceCalc.calculate(q),
      usage: (q?) => usageCalc.calculate(q),
    };
  }

  /**
   * Collect a dashboard event
   */
  collect(event: Partial<DashboardEvent>): DashboardEvent {
    return this.collector.collect(event);
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<number> {
    return this.collector.flush();
  }

  /**
   * Get full dashboard summary
   */
  async summary(query?: MetricQuery): Promise<DashboardSummary> {
    // Flush pending events first
    await this.collector.flush();

    const [cost, security, compliance, performance, usage] = await Promise.all([
      this.metrics.cost(query),
      this.metrics.security(query),
      this.metrics.compliance(query),
      this.metrics.performance(query),
      this.metrics.usage(query),
    ]);

    return {
      cost,
      security,
      compliance,
      performance,
      usage,
      activeAlerts: this.alertLog.filter((a) => !a.acknowledged),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get all alerts (or filter by acknowledged status)
   */
  getAlerts(options?: { acknowledged?: boolean }): Alert[] {
    if (options?.acknowledged !== undefined) {
      return this.alertLog.filter((a) => a.acknowledged === options.acknowledged);
    }
    return [...this.alertLog];
  }

  /**
   * Acknowledge an alert by ID
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertLog.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Export data in the specified format
   */
  async export(
    format: ExportFormat,
    options?: { period?: TimePeriod; from?: number; to?: number }
  ): Promise<string> {
    await this.collector.flush();

    const from = options?.from;
    const to = options?.to;

    if (format === 'prometheus') {
      const query: MetricQuery = { period: options?.period, from, to };
      const [cost, security, compliance, performance, usage] = await Promise.all([
        this.metrics.cost(query),
        this.metrics.security(query),
        this.metrics.compliance(query),
        this.metrics.performance(query),
        this.metrics.usage(query),
      ]);
      return exportPrometheus({ cost, security, compliance, performance, usage });
    }

    const events = await this.storage.query({ from, to, limit: Number.MAX_SAFE_INTEGER });

    if (format === 'csv') {
      return exportCsv(events);
    }

    return exportJson(events, { from, to });
  }

  /**
   * Start the HTTP API server
   */
  async serve(options?: { port?: number; host?: string }): Promise<{ port: number; host: string }> {
    await this.collector.flush();

    const middlewares = [];

    // CORS
    middlewares.push(corsMiddleware());

    // Auth (if configured)
    // Rate limiting is always on at 120 req/min by default

    const routes = createRoutes({
      collectEvent: (event) => this.collect(event),
      getCostMetrics: (q) => this.metrics.cost(q),
      getSecurityMetrics: (q) => this.metrics.security(q),
      getComplianceMetrics: (q) => this.metrics.compliance(q),
      getPerformanceMetrics: (q) => this.metrics.performance(q),
      getUsageMetrics: (q) => this.metrics.usage(q),
      getAlerts: () => this.getAlerts(),
      getSummary: () => this.summary(),
      exportData: (format, opts) => this.export(format, opts),
    });

    this.server = new DashboardServer({
      port: options?.port ?? 3456,
      host: options?.host ?? '0.0.0.0',
      routes,
      middlewares,
    });

    return this.server.start();
  }

  /**
   * Stop the dashboard (server + collector)
   */
  async stop(): Promise<void> {
    await this.collector.stop();
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }
  }

  /**
   * Get underlying storage for advanced usage
   */
  getStorage(): StorageInterface {
    return this.storage;
  }

  // ============================================================================
  // Private
  // ============================================================================

  private setupAlerts(options: RanaDashboardOptions): void {
    // Budget alert
    if (options.budgetMonthly && options.budgetMonthly > 0) {
      const budgetAlert = new BudgetAlert({ monthlyBudget: options.budgetMonthly });
      this.collector.registerAlertChecker((event) => budgetAlert.check(event));
    }

    // Security alert (always on by default)
    const securityAlert = new SecurityAlert();
    this.collector.registerAlertChecker((event) => securityAlert.check(event));

    // Compliance alert (always on by default)
    const complianceAlert = new ComplianceAlert();
    this.collector.registerAlertChecker((event) => complianceAlert.check(event));

    // Anomaly alert (always on by default)
    const anomalyAlert = new AnomalyAlert();
    this.collector.registerAlertChecker((event) => anomalyAlert.check(event));

    // Process any explicit alert configs
    if (options.alerts) {
      for (const config of options.alerts) {
        if (!config.enabled) continue;
        if (config.type === 'budget' && config.thresholds?.monthlyBudget) {
          const alert = new BudgetAlert({
            monthlyBudget: config.thresholds.monthlyBudget,
            warningThreshold: config.thresholds.warning,
            criticalThreshold: config.thresholds.critical,
          });
          this.collector.registerAlertChecker((event) => alert.check(event));
        }
      }
    }
  }
}
