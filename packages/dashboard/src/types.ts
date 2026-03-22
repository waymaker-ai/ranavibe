/**
 * @aicofounder/dashboard - Type Definitions
 * AI observability dashboard types
 */

// ============================================================================
// Core Event Types
// ============================================================================

export type EventType =
  | 'request'
  | 'response'
  | 'error'
  | 'security'
  | 'compliance'
  | 'cost'
  | 'latency';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface DashboardEvent {
  id: string;
  type: EventType;
  timestamp: number;
  provider?: string;
  model?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

export type StorageType = 'memory' | 'file';

export interface DashboardConfig {
  storage: StorageType | StorageInterface;
  storagePath?: string;
  maxEvents?: number;
  flushIntervalMs?: number;
  alerts?: AlertConfig[];
  apiKey?: string;
  corsOrigins?: string[];
  rateLimitPerMinute?: number;
}

// ============================================================================
// Metric Query
// ============================================================================

export type TimePeriod = 'minute' | 'hour' | 'day' | 'week' | 'month';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface MetricQuery {
  period?: TimePeriod;
  from?: number;
  to?: number;
  provider?: string;
  model?: string;
  groupBy?: string;
}

// ============================================================================
// Metric Results
// ============================================================================

export interface CostMetrics {
  total: number;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
  byPeriod: Array<{ period: string; cost: number }>;
  trend: TrendDirection;
  projectedMonthly: number;
}

export interface SecurityMetrics {
  piiDetections: Record<string, number>;
  injectionAttempts: Record<string, number>;
  contentFiltered: number;
  totalEvents: number;
}

export interface ComplianceMetrics {
  violationsByFramework: Record<string, number>;
  complianceScore: number;
  auditEvents: Array<{
    timestamp: number;
    framework: string;
    rule: string;
    result: 'pass' | 'fail' | 'warning';
    details?: string;
  }>;
  totalViolations: number;
}

export interface PerformanceMetrics {
  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  throughput: number;
  errorRate: number;
  totalRequests: number;
  totalErrors: number;
}

export interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  uniqueModels: string[];
  uniqueProviders: string[];
  byPeriod: Array<{ period: string; requests: number; tokens: number }>;
}

// ============================================================================
// Alerts
// ============================================================================

export type AlertLevel = 'warning' | 'critical';

export type AlertType = 'budget' | 'security' | 'compliance' | 'anomaly';

export interface AlertConfig {
  type: AlertType;
  enabled: boolean;
  thresholds?: Record<string, number>;
  options?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
  acknowledged: boolean;
}

// ============================================================================
// Storage
// ============================================================================

export interface AggregateResult {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export interface StorageInterface {
  store(events: DashboardEvent[]): Promise<void>;
  query(options: {
    from?: number;
    to?: number;
    type?: EventType;
    provider?: string;
    model?: string;
    limit?: number;
    offset?: number;
  }): Promise<DashboardEvent[]>;
  aggregate(options: {
    field: string;
    from?: number;
    to?: number;
    type?: EventType;
  }): Promise<AggregateResult>;
  cleanup(olderThanMs: number): Promise<number>;
}

// ============================================================================
// Export
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'prometheus';

export interface ExportOptions {
  format: ExportFormat;
  from?: number;
  to?: number;
  type?: EventType;
}

// ============================================================================
// Dashboard Summary
// ============================================================================

export interface DashboardSummary {
  cost: CostMetrics;
  security: SecurityMetrics;
  compliance: ComplianceMetrics;
  performance: PerformanceMetrics;
  usage: UsageMetrics;
  activeAlerts: Alert[];
  lastUpdated: number;
}

// ============================================================================
// Running Stats (internal)
// ============================================================================

export interface RunningStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  m2: number; // for Welford's online variance
}
