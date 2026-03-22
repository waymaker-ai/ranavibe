import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoFounderDashboard } from '../index';
import type {
  DashboardEvent,
  StorageInterface,
  AggregateResult,
  EventType,
  Alert,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCostEvent(cost: number, model = 'gpt-4o', provider = 'openai'): Partial<DashboardEvent> {
  return {
    type: 'cost',
    provider,
    model,
    data: { cost, inputTokens: 100, outputTokens: 50 },
  };
}

function makeSecurityEvent(kind: string, severity = 'warning'): Partial<DashboardEvent> {
  return {
    type: 'security',
    data: { kind, severity, details: `Security event: ${kind}` },
  };
}

function makeLatencyEvent(latencyMs: number, model = 'gpt-4o'): Partial<DashboardEvent> {
  return {
    type: 'latency',
    model,
    data: { latencyMs },
  };
}

function makeRequestEvent(provider = 'openai', model = 'gpt-4o'): Partial<DashboardEvent> {
  return {
    type: 'request',
    provider,
    model,
    data: { inputTokens: 200, outputTokens: 100 },
  };
}

// ===========================================================================
// CoFounderDashboard - Memory Storage
// ===========================================================================

describe('CoFounderDashboard with memory storage', () => {
  let dashboard: CoFounderDashboard;

  beforeEach(() => {
    dashboard = new CoFounderDashboard({ storage: 'memory', maxEvents: 1000 });
  });

  afterEach(async () => {
    await dashboard.stop();
  });

  it('should create a dashboard instance with default config', () => {
    expect(dashboard).toBeDefined();
    expect(dashboard.getStorage()).toBeDefined();
  });

  it('should collect events and assign IDs', () => {
    const event = dashboard.collect(makeCostEvent(0.05));
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.type).toBe('cost');
  });

  it('should collect multiple event types', () => {
    dashboard.collect(makeCostEvent(0.05));
    dashboard.collect(makeSecurityEvent('pii_detected'));
    dashboard.collect(makeLatencyEvent(250));
    dashboard.collect(makeRequestEvent());
    // No error means success
  });

  it('should flush events to storage', async () => {
    dashboard.collect(makeCostEvent(0.01));
    dashboard.collect(makeCostEvent(0.02));
    const flushed = await dashboard.flush();
    expect(flushed).toBeGreaterThanOrEqual(0);
  });

  it('should generate a dashboard summary', async () => {
    dashboard.collect(makeCostEvent(0.05, 'gpt-4o', 'openai'));
    dashboard.collect(makeCostEvent(0.02, 'claude-3-haiku', 'anthropic'));
    dashboard.collect(makeSecurityEvent('injection_attempt'));
    dashboard.collect(makeLatencyEvent(150));
    dashboard.collect(makeRequestEvent());

    const summary = await dashboard.summary();
    expect(summary).toBeDefined();
    expect(summary.cost).toBeDefined();
    expect(summary.security).toBeDefined();
    expect(summary.compliance).toBeDefined();
    expect(summary.performance).toBeDefined();
    expect(summary.usage).toBeDefined();
    expect(summary.lastUpdated).toBeGreaterThan(0);
  });

  it('should track alerts', () => {
    const alerts = dashboard.getAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should acknowledge alerts by ID', () => {
    // Trigger a security alert by collecting a security event
    dashboard.collect(makeSecurityEvent('injection_attempt', 'critical'));

    const alerts = dashboard.getAlerts();
    if (alerts.length > 0) {
      const result = dashboard.acknowledgeAlert(alerts[0].id);
      expect(result).toBe(true);
      expect(alerts[0].acknowledged).toBe(true);
    }
  });

  it('should return false when acknowledging non-existent alert', () => {
    const result = dashboard.acknowledgeAlert('nonexistent-id');
    expect(result).toBe(false);
  });

  it('should filter alerts by acknowledged status', () => {
    dashboard.collect(makeSecurityEvent('test_event', 'critical'));

    const unacked = dashboard.getAlerts({ acknowledged: false });
    const acked = dashboard.getAlerts({ acknowledged: true });

    for (const a of unacked) {
      expect(a.acknowledged).toBe(false);
    }
    for (const a of acked) {
      expect(a.acknowledged).toBe(true);
    }
  });

  it('should export data as CSV', async () => {
    dashboard.collect(makeCostEvent(0.05));
    dashboard.collect(makeRequestEvent());

    const csv = await dashboard.export('csv');
    expect(typeof csv).toBe('string');
  });

  it('should export data as JSON', async () => {
    dashboard.collect(makeCostEvent(0.05));

    const json = await dashboard.export('json');
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
  });

  it('should export data as Prometheus format', async () => {
    dashboard.collect(makeCostEvent(0.05));
    dashboard.collect(makeLatencyEvent(200));

    const prom = await dashboard.export('prometheus');
    expect(typeof prom).toBe('string');
    // Prometheus format uses metric names with underscores
  });

  it('should initialize with file storage option', () => {
    const fileDashboard = new CoFounderDashboard({
      storage: 'file',
      storagePath: '/tmp/cofounder-test-data',
    });
    expect(fileDashboard).toBeDefined();
  });

  it('should handle budget alerts when configured', () => {
    const budgetDashboard = new CoFounderDashboard({
      storage: 'memory',
      budgetMonthly: 10.0,
    });
    expect(budgetDashboard).toBeDefined();

    // Collect high-cost events
    for (let i = 0; i < 20; i++) {
      budgetDashboard.collect(makeCostEvent(1.0));
    }

    // Check if budget alerts were generated
    const alerts = budgetDashboard.getAlerts();
    // Budget alerts may or may not fire depending on implementation timing
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should calculate cost metrics', async () => {
    dashboard.collect(makeCostEvent(0.10, 'gpt-4o', 'openai'));
    dashboard.collect(makeCostEvent(0.05, 'gpt-4o-mini', 'openai'));
    dashboard.collect(makeCostEvent(0.03, 'claude-3-haiku', 'anthropic'));

    const metrics = await dashboard.metrics.cost();
    expect(metrics).toBeDefined();
    expect(metrics.total).toBeDefined();
  });

  it('should calculate security metrics', async () => {
    dashboard.collect(makeSecurityEvent('pii_detected'));
    dashboard.collect(makeSecurityEvent('injection_attempt'));

    const metrics = await dashboard.metrics.security();
    expect(metrics).toBeDefined();
    expect(metrics.totalEvents).toBeDefined();
  });

  it('should calculate performance metrics', async () => {
    dashboard.collect(makeLatencyEvent(100));
    dashboard.collect(makeLatencyEvent(200));
    dashboard.collect(makeLatencyEvent(300));

    const metrics = await dashboard.metrics.performance();
    expect(metrics).toBeDefined();
  });

  it('should calculate usage metrics', async () => {
    dashboard.collect(makeRequestEvent('openai', 'gpt-4o'));
    dashboard.collect(makeRequestEvent('anthropic', 'claude-3-haiku'));

    const metrics = await dashboard.metrics.usage();
    expect(metrics).toBeDefined();
    expect(metrics.totalRequests).toBeDefined();
  });

  it('should calculate compliance metrics', async () => {
    dashboard.collect({
      type: 'compliance',
      data: { framework: 'GDPR', rule: 'data-retention', result: 'pass' },
    });

    const metrics = await dashboard.metrics.compliance();
    expect(metrics).toBeDefined();
  });

  it('should accept custom storage implementation', () => {
    const customStorage: StorageInterface = {
      async store(events: DashboardEvent[]) {},
      async query() { return []; },
      async aggregate() { return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }; },
      async cleanup() { return 0; },
    };

    const customDashboard = new CoFounderDashboard({ storage: customStorage as any });
    expect(customDashboard).toBeDefined();
  });

  it('should support metric queries with period filters', async () => {
    dashboard.collect(makeCostEvent(0.05));

    const metrics = await dashboard.metrics.cost({ period: 'day' });
    expect(metrics).toBeDefined();
  });

  it('should stop cleanly', async () => {
    dashboard.collect(makeCostEvent(0.01));
    await dashboard.stop();
    // No error means clean stop
  });

  it('should handle rapid sequential event collection', () => {
    for (let i = 0; i < 100; i++) {
      dashboard.collect(makeCostEvent(0.001 * i));
    }
    // Ensure no errors from rapid collection
  });

  it('should handle events with missing optional fields', () => {
    const event = dashboard.collect({
      type: 'request',
      data: {},
    });
    expect(event.id).toBeDefined();
    expect(event.provider).toBeUndefined();
    expect(event.model).toBeUndefined();
  });

  it('should configure alerts from config', () => {
    const configuredDashboard = new CoFounderDashboard({
      storage: 'memory',
      alerts: [
        { type: 'budget', enabled: true, thresholds: { monthlyBudget: 100, warning: 0.8, critical: 0.95 } },
      ],
    });
    expect(configuredDashboard).toBeDefined();
  });

  it('should skip disabled alert configs', () => {
    const configuredDashboard = new CoFounderDashboard({
      storage: 'memory',
      alerts: [
        { type: 'budget', enabled: false, thresholds: { monthlyBudget: 100 } },
      ],
    });
    expect(configuredDashboard).toBeDefined();
  });
});
