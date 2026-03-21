# @ranavibe/dashboard

AI observability dashboard for the RANA ecosystem. Track costs, monitor security events, enforce compliance, and analyze performance -- all with zero runtime dependencies.

## Features

- **Cost Tracking** - Total spend, per-model, per-provider, trend detection, monthly projections
- **Security Monitoring** - PII detection counts, injection attempt tracking, content filtering stats
- **Compliance Reporting** - Violation tracking by framework, compliance scoring, full audit trail
- **Performance Analytics** - Latency percentiles (p50/p95/p99), throughput, error rates
- **Usage Metrics** - Request counts, token consumption, unique models/providers
- **Alerting** - Budget thresholds, security events, compliance violations, anomaly detection (z-score)
- **HTTP API** - Built-in REST API with CORS, auth, and rate limiting
- **Export** - CSV, JSON, and Prometheus exposition format
- **Zero Dependencies** - Uses only Node.js built-ins (`http`, `fs`, `path`, `crypto`)

## Quick Start

```ts
import { RanaDashboard } from '@ranavibe/dashboard';

const dashboard = new RanaDashboard({
  storage: 'memory',
  budgetMonthly: 500,
});

// Collect events
dashboard.collect({
  type: 'cost',
  provider: 'openai',
  model: 'gpt-4o',
  data: { cost: 0.03 },
});

dashboard.collect({
  type: 'request',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  data: { tokens: 1500, inputTokens: 1000, outputTokens: 500 },
});

// Get metrics
const costMetrics = await dashboard.metrics.cost({ period: 'day' });
console.log(`Total spend: $${costMetrics.total}`);
console.log(`Trend: ${costMetrics.trend}`);
console.log(`Projected monthly: $${costMetrics.projectedMonthly}`);

// Get full summary
const summary = await dashboard.summary();

// Export
const csv = await dashboard.export('csv', { period: 'month' });
const prometheus = await dashboard.export('prometheus');

// Start HTTP API
await dashboard.serve({ port: 3456 });
// GET  /api/summary
// GET  /api/metrics/cost?period=day
// GET  /api/metrics/security
// GET  /api/metrics/compliance
// GET  /api/metrics/performance
// GET  /api/metrics/usage
// GET  /api/alerts
// GET  /api/export/csv
// GET  /api/export/json
// GET  /api/export/prometheus
// POST /api/events
// GET  /api/health
```

## Storage

### Memory (default)

```ts
const dashboard = new RanaDashboard({
  storage: 'memory',
  maxEvents: 10_000,
});
```

### File-based

```ts
const dashboard = new RanaDashboard({
  storage: 'file',
  storagePath: './rana-data',
});
```

Stores events as JSON files organized by date (`rana-data/YYYY-MM-DD.json`) with atomic writes.

### Custom

```ts
import type { StorageInterface } from '@ranavibe/dashboard';

class MyStorage implements StorageInterface {
  async store(events) { /* ... */ }
  async query(options) { /* ... */ }
  async aggregate(options) { /* ... */ }
  async cleanup(olderThanMs) { /* ... */ }
}

const dashboard = new RanaDashboard({ storage: new MyStorage() });
```

## Alerts

Alerts fire automatically when events are collected:

- **Budget** - Warning at 80%, critical at 95% of monthly budget
- **Security** - Injection attempts, PII exposure
- **Compliance** - Framework violations with severity
- **Anomaly** - Cost spikes (z-score > 2.0), violation bursts (5+ in 5 minutes)

```ts
const alerts = dashboard.getAlerts();
const active = dashboard.getAlerts({ acknowledged: false });
dashboard.acknowledgeAlert(alertId);
```

## Metrics API

Each metric calculator can be used standalone:

```ts
import { CostMetricsCalculator, MemoryStorage } from '@ranavibe/dashboard';

const storage = new MemoryStorage();
const costMetrics = new CostMetricsCalculator(storage);

const result = await costMetrics.calculate({
  period: 'day',
  provider: 'openai',
});
```

## Export Formats

### CSV

Standard CSV with proper escaping -- includes id, type, timestamp, datetime, provider, model, data, metadata columns.

### JSON

```json
{
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "dateRange": { "from": null, "to": null },
  "totalEvents": 42,
  "events": [...]
}
```

### Prometheus

```
# HELP rana_cost_total_dollars Total cost in dollars
# TYPE rana_cost_total_dollars gauge
rana_cost_total_dollars 42.50

# HELP rana_latency_milliseconds Latency distribution in milliseconds
# TYPE rana_latency_milliseconds histogram
rana_latency_milliseconds{quantile="0.5"} 150
rana_latency_milliseconds{quantile="0.95"} 450
rana_latency_milliseconds{quantile="0.99"} 820
```

## Event Types

| Type | Description | Key Data Fields |
|------|-------------|-----------------|
| `request` | API request sent | `tokens`, `inputTokens` |
| `response` | API response received | `tokens`, `outputTokens` |
| `error` | Error occurred | `message`, `code` |
| `security` | Security event | `category`, `severity`, `piiType` |
| `compliance` | Compliance check | `framework`, `rule`, `result` |
| `cost` | Cost incurred | `cost` |
| `latency` | Latency measurement | `latencyMs`, `duration` |

## License

MIT
