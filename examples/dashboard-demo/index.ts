/**
 * @ranavibe/dashboard Demo
 *
 * Run with: npx tsx index.ts
 *
 * Demonstrates the observability dashboard: collecting events, computing
 * metrics, exporting data, and optionally serving the HTTP API.
 */

import { RanaDashboard } from '@ranavibe/dashboard';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       @ranavibe/dashboard Demo              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ─── 1. Create dashboard ──────────────────────────────────────────────────

  console.log('=== 1. Create Dashboard ===\n');

  const dashboard = new RanaDashboard({
    storage: 'memory',
    maxEvents: 1000,
    budgetMonthly: 100,
  });

  console.log('Dashboard created with in-memory storage and $100/month budget\n');

  // ─── 2. Collect events ────────────────────────────────────────────────────

  console.log('=== 2. Collect Events ===\n');

  // Simulate cost events from different models
  const models = [
    { model: 'claude-sonnet-4-6', cost: 0.003, inputTokens: 500, outputTokens: 200 },
    { model: 'gpt-4o', cost: 0.005, inputTokens: 800, outputTokens: 300 },
    { model: 'claude-sonnet-4-6', cost: 0.002, inputTokens: 300, outputTokens: 150 },
    { model: 'gemini-2.0-flash', cost: 0.0005, inputTokens: 400, outputTokens: 100 },
    { model: 'gpt-4o', cost: 0.008, inputTokens: 1200, outputTokens: 500 },
  ];

  for (const m of models) {
    dashboard.collect({
      type: 'cost',
      data: {
        cost: m.cost,
        model: m.model,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
      },
    });
  }
  console.log(`Collected ${models.length} cost events`);

  // Simulate security events
  dashboard.collect({
    type: 'security',
    severity: 'high',
    data: {
      category: 'injection',
      blocked: true,
      pattern: 'ignore previous instructions',
    },
  });

  dashboard.collect({
    type: 'security',
    severity: 'medium',
    data: {
      category: 'pii',
      blocked: false,
      redacted: true,
      piiType: 'email',
    },
  });

  console.log('Collected 2 security events');

  // Simulate compliance event
  dashboard.collect({
    type: 'compliance',
    severity: 'high',
    data: {
      framework: 'hipaa',
      rule: 'phi_exposure',
      action: 'blocked',
    },
  });

  console.log('Collected 1 compliance event');

  // Simulate performance events
  for (let i = 0; i < 5; i++) {
    dashboard.collect({
      type: 'performance',
      data: {
        latencyMs: 200 + Math.random() * 300,
        model: models[i % models.length].model,
        success: true,
      },
    });
  }
  console.log('Collected 5 performance events\n');

  // ─── 3. Flush and get summary ─────────────────────────────────────────────

  console.log('=== 3. Dashboard Summary ===\n');

  const summary = await dashboard.summary();

  console.log('Cost metrics:');
  console.log('  Total cost: $' + summary.cost.totalCost.toFixed(4));
  console.log('  Average cost/request: $' + summary.cost.averageCostPerRequest.toFixed(4));
  console.log('  Total requests:', summary.cost.totalRequests);

  console.log('\nSecurity metrics:');
  console.log('  Total events:', summary.security.totalEvents);
  console.log('  Blocked:', summary.security.blockedCount);

  console.log('\nCompliance metrics:');
  console.log('  Total checks:', summary.compliance.totalChecks);
  console.log('  Violations:', summary.compliance.violationCount);

  console.log('\nPerformance metrics:');
  console.log('  Total requests:', summary.performance.totalRequests);
  console.log('  Avg latency:', summary.performance.averageLatencyMs?.toFixed(0) + 'ms');

  console.log('\nUsage metrics:');
  console.log('  Total tokens:', summary.usage.totalTokens);

  console.log('\nActive alerts:', summary.activeAlerts.length);

  // ─── 4. Individual metrics ────────────────────────────────────────────────

  console.log('\n=== 4. Individual Metric Queries ===\n');

  const costMetrics = await dashboard.metrics.cost();
  console.log('Cost by model:', costMetrics.costByModel);

  const securityMetrics = await dashboard.metrics.security();
  console.log('Security by category:', securityMetrics.byCategory);

  // ─── 5. Alerts ────────────────────────────────────────────────────────────

  console.log('\n=== 5. Alerts ===\n');

  const alerts = dashboard.getAlerts();
  console.log('Total alerts:', alerts.length);
  for (const alert of alerts.slice(0, 3)) {
    console.log(`  [${alert.level}] ${alert.type}: ${alert.message}`);
  }

  // ─── 6. Export data ───────────────────────────────────────────────────────

  console.log('\n=== 6. Data Export ===\n');

  const csv = await dashboard.export('csv');
  const csvLines = csv.split('\n');
  console.log('CSV export:', csvLines.length, 'lines');
  console.log('  Header:', csvLines[0]);
  if (csvLines[1]) console.log('  First row:', csvLines[1].slice(0, 80) + '...');

  const json = await dashboard.export('json');
  const parsed = JSON.parse(json);
  console.log('\nJSON export:', parsed.events?.length || 0, 'events');

  const prometheus = await dashboard.export('prometheus');
  const promLines = prometheus.split('\n').filter((l: string) => l && !l.startsWith('#'));
  console.log('\nPrometheus export:', promLines.length, 'metric lines');
  for (const line of promLines.slice(0, 3)) {
    console.log(' ', line);
  }

  // ─── 7. Optional: Serve API ──────────────────────────────────────────────

  console.log('\n=== 7. HTTP API (Optional) ===\n');

  const shouldServe = process.argv.includes('--serve');
  if (shouldServe) {
    const { port, host } = await dashboard.serve({ port: 3456 });
    console.log(`Dashboard API running at http://${host}:${port}`);
    console.log('Endpoints:');
    console.log('  GET  /api/summary');
    console.log('  GET  /api/metrics/cost');
    console.log('  GET  /api/metrics/security');
    console.log('  GET  /api/metrics/compliance');
    console.log('  GET  /api/metrics/performance');
    console.log('  GET  /api/metrics/usage');
    console.log('  GET  /api/alerts');
    console.log('  GET  /api/export?format=csv');
    console.log('  POST /api/events');
    console.log('\nPress Ctrl+C to stop.');
  } else {
    console.log('Pass --serve to start the HTTP API server.');
    console.log('Example: npx tsx index.ts --serve\n');

    // Clean up
    await dashboard.stop();
  }

  console.log('Done.');
}

main().catch(console.error);
