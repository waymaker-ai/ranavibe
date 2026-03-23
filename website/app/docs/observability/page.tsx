'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Activity, BarChart3, Shield, Bell, Gauge, Eye, FileText } from 'lucide-react';

export default function ObservabilityPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Observability</h1>
          <p className="text-lg text-foreground-secondary mb-4">
            Full visibility into your AI applications. Real-time cost tracking, security monitoring,
            compliance scoring, performance metrics, and integration with OpenTelemetry and Prometheus.
          </p>
          <div className="code-block font-mono text-sm mb-12">
            <div>npm install @waymakerai/aicofounder-dashboard</div>
          </div>
        </motion.div>

        {/* Dashboard Setup */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Activity className="mr-3 h-6 w-6 text-gradient-from" />
            Dashboard Setup
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-dashboard</code> package
            provides an event-driven observability system. It collects events from all CoFounder operations
            and provides queryable metrics for cost, security, compliance, performance, and usage.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createDashboard } from '@waymakerai/aicofounder-dashboard';

const dashboard = createDashboard({
  // Storage backend: 'memory' for dev, 'file' for persistence
  storage: 'file',
  storagePath: './data/dashboard-events.json',

  // Maximum events to retain
  maxEvents: 100000,

  // How often to flush events to storage (ms)
  flushIntervalMs: 5000,

  // API key for dashboard endpoints
  apiKey: process.env.COFOUNDER_DASHBOARD_API_KEY,

  // CORS configuration
  corsOrigins: ['http://localhost:3000', 'https://your-app.com'],

  // Rate limiting
  rateLimitPerMinute: 120,

  // Alert configuration
  alerts: [
    {
      type: 'budget',
      enabled: true,
      thresholds: { daily: 50, monthly: 1000 },
    },
    {
      type: 'security',
      enabled: true,
      thresholds: { injectionAttempts: 10, piiDetections: 50 },
    },
    {
      type: 'compliance',
      enabled: true,
    },
    {
      type: 'anomaly',
      enabled: true,
      thresholds: { stddev: 3 },  // Alert on 3 standard deviations
    },
  ],
});

// Record events from your application
dashboard.recordEvent({
  type: 'request',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  data: {
    inputTokens: 1500,
    outputTokens: 500,
    cost: 0.045,
    latencyMs: 2300,
    userId: 'user-123',
    feature: 'chat',
  },
});

dashboard.recordEvent({
  type: 'security',
  data: {
    eventType: 'injection_attempt',
    blocked: true,
    severity: 'high',
    pattern: 'system_leak',
    userId: 'user-456',
  },
});`}</pre>
          </div>
        </motion.section>

        {/* Cost Tracking */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-gradient-from" />
            Real-Time Cost Tracking
          </h2>
          <p className="text-foreground-secondary mb-4">
            Query cost metrics across any time period, grouped by model, provider, or custom dimensions.
            The dashboard tracks projected monthly costs and trend direction.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Get cost metrics
const costs = await dashboard.getCostMetrics({
  period: 'day',              // 'minute' | 'hour' | 'day' | 'week' | 'month'
  from: Date.now() - 86400000, // Last 24 hours
  to: Date.now(),
  model: 'claude-sonnet-4-20250514',  // Optional: filter by model
});

console.log(costs.total);              // $234.56
console.log(costs.byModel);
// { 'claude-sonnet-4-20250514': 180.00, 'gpt-4o': 54.56 }

console.log(costs.byProvider);
// { 'anthropic': 180.00, 'openai': 54.56 }

console.log(costs.byPeriod);
// [{ period: '2025-01-15', cost: 120.00 }, { period: '2025-01-16', cost: 114.56 }]

console.log(costs.trend);              // 'decreasing'
console.log(costs.projectedMonthly);   // $3,200.00

// Usage metrics (tokens, requests)
const usage = await dashboard.getUsageMetrics({ period: 'week' });
console.log(usage.totalRequests);      // 45,230
console.log(usage.totalTokens);        // 12,500,000
console.log(usage.inputTokens);        // 9,800,000
console.log(usage.outputTokens);       // 2,700,000
console.log(usage.uniqueModels);       // ['claude-sonnet-4-20250514', 'gpt-4o']
console.log(usage.uniqueProviders);    // ['anthropic', 'openai']`}</pre>
          </div>
        </motion.section>

        {/* Security Monitoring */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            Security Monitoring &amp; Alerts
          </h2>
          <p className="text-foreground-secondary mb-4">
            Monitor security events in real-time. Track PII detections by type, injection attempts
            by category, content filtering events, and overall security event trends.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Security metrics
const security = await dashboard.getSecurityMetrics({ period: 'day' });

console.log(security.totalEvents);        // 1,234
console.log(security.contentFiltered);    // 45

console.log(security.piiDetections);
// { email: 120, phone: 45, ssn: 3, credit_card: 8 }

console.log(security.injectionAttempts);
// { direct: 15, jailbreak: 8, system_leak: 3, delimiter: 2 }

// Get active alerts
const alerts = await dashboard.getActiveAlerts();
for (const alert of alerts) {
  console.log(\`[\${alert.level}] \${alert.type}: \${alert.message}\`);
  // [critical] security: 15 injection attempts detected in last hour
  // [warning] budget: Daily spend at 82% of $50 limit
}

// Acknowledge an alert
await dashboard.acknowledgeAlert(alert.id);

// Configure alert handlers
dashboard.onAlert((alert) => {
  if (alert.level === 'critical') {
    // Send to PagerDuty, Slack, etc.
    sendSlackNotification({
      channel: '#security-alerts',
      text: \`CRITICAL: \${alert.message}\`,
    });
  }
});`}</pre>
          </div>
        </motion.section>

        {/* Compliance Scoring */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Eye className="mr-3 h-6 w-6 text-gradient-from" />
            Compliance Scoring
          </h2>
          <p className="text-foreground-secondary mb-4">
            Track compliance violations by framework, compute an overall compliance score, and maintain
            an audit trail of all compliance-related events.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Compliance metrics
const compliance = await dashboard.getComplianceMetrics({ period: 'month' });

console.log(compliance.complianceScore);   // 97.5 (out of 100)
console.log(compliance.totalViolations);   // 12

console.log(compliance.violationsByFramework);
// { hipaa: 5, gdpr: 4, ccpa: 2, pci: 1 }

// Audit event timeline
console.log(compliance.auditEvents);
// [
//   {
//     timestamp: 1705334400000,
//     framework: 'hipaa',
//     rule: 'phi-in-response',
//     result: 'fail',
//     details: 'Protected health information detected in response',
//   },
//   {
//     timestamp: 1705334500000,
//     framework: 'gdpr',
//     rule: 'consent-required',
//     result: 'warning',
//     details: 'Data processing without explicit consent',
//   },
// ]

// Full dashboard summary (all metrics at once)
const summary = await dashboard.getSummary({ period: 'day' });

console.log(summary.cost);         // CostMetrics
console.log(summary.security);     // SecurityMetrics
console.log(summary.compliance);   // ComplianceMetrics
console.log(summary.performance);  // PerformanceMetrics
console.log(summary.usage);        // UsageMetrics
console.log(summary.activeAlerts); // Alert[]
console.log(summary.lastUpdated);  // Timestamp`}</pre>
          </div>
        </motion.section>

        {/* Prometheus Export */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Gauge className="mr-3 h-6 w-6 text-gradient-from" />
            Prometheus Export
          </h2>
          <p className="text-foreground-secondary mb-4">
            Export metrics in Prometheus format for scraping by Prometheus, Grafana, Datadog, or any
            compatible monitoring system.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Export in Prometheus format
const prometheusMetrics = await dashboard.export({
  format: 'prometheus',
  from: Date.now() - 3600000, // Last hour
});

// Output:
// # HELP cofounder_requests_total Total AI requests
// # TYPE cofounder_requests_total counter
// cofounder_requests_total{model="claude-sonnet-4-20250514",provider="anthropic"} 1523
// cofounder_requests_total{model="gpt-4o",provider="openai"} 892
//
// # HELP cofounder_cost_total Total cost in USD
// # TYPE cofounder_cost_total counter
// cofounder_cost_total{model="claude-sonnet-4-20250514"} 180.45
// cofounder_cost_total{model="gpt-4o"} 54.23
//
// # HELP cofounder_latency_seconds Request latency in seconds
// # TYPE cofounder_latency_seconds histogram
// cofounder_latency_seconds_bucket{le="0.5"} 450
// cofounder_latency_seconds_bucket{le="1.0"} 1200
// cofounder_latency_seconds_bucket{le="2.0"} 2100
// cofounder_latency_seconds_bucket{le="5.0"} 2400
// cofounder_latency_seconds_bucket{le="+Inf"} 2415
//
// # HELP cofounder_security_events_total Security events
// # TYPE cofounder_security_events_total counter
// cofounder_security_events_total{type="pii_detection"} 176
// cofounder_security_events_total{type="injection_attempt"} 28
// cofounder_security_events_total{type="content_filtered"} 45

// Serve as an Express endpoint
import express from 'express';
const app = express();

app.get('/metrics', async (req, res) => {
  const metrics = await dashboard.export({ format: 'prometheus' });
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});`}</pre>
          </div>
        </motion.section>

        {/* OpenTelemetry */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Activity className="mr-3 h-6 w-6 text-gradient-from" />
            OpenTelemetry Integration
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder integrates with OpenTelemetry for distributed tracing, metrics, and structured logging.
            Export to Jaeger, Zipkin, Grafana Tempo, Datadog, New Relic, or any OTel-compatible backend.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { setupOTel } from '@waymakerai/aicofounder-core';

// Initialize OpenTelemetry with CoFounder instrumentation
setupOTel({
  serviceName: 'my-ai-app',
  exporters: {
    traces: {
      type: 'otlp',
      endpoint: 'http://jaeger:4318',
    },
    metrics: {
      type: 'prometheus',
      port: 9090,
    },
    logs: {
      type: 'otlp',
      endpoint: 'http://loki:3100',
    },
  },
});

// All CoFounder operations automatically create spans
// Traces include:
// - Model name, provider, and parameters
// - Input/output token counts
// - Cost per request
// - Latency breakdown (queue, inference, streaming)
// - Guard check results (PII, injection, toxicity)
// - Compliance check results
// - Cache hit/miss

// Manual span creation for custom operations
import { createTracer, withTracing } from '@waymakerai/aicofounder-core';

const tracer = createTracer({ serviceName: 'my-ai-app' });

const result = await withTracing(
  'process-document',
  async (span) => {
    span.setAttribute('document.length', doc.length);
    span.setAttribute('document.type', 'pdf');

    const summary = await summarize(doc);
    span.setAttribute('output.tokens', summary.tokens);

    return summary;
  }
);

// Custom metrics
import { createMetrics } from '@waymakerai/aicofounder-core';

const metrics = createMetrics({ serviceName: 'my-ai-app' });

const requestCounter = metrics.createCounter('ai_requests', {
  description: 'Total AI requests by model',
});

const latencyHistogram = metrics.createHistogram('ai_latency', {
  description: 'AI request latency in milliseconds',
  boundaries: [100, 250, 500, 1000, 2500, 5000, 10000],
});

// Record metrics
requestCounter.add(1, { model: 'claude-sonnet-4-20250514', feature: 'chat' });
latencyHistogram.record(1234, { model: 'claude-sonnet-4-20250514' });`}</pre>
          </div>
        </motion.section>

        {/* Custom Dashboards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-gradient-from" />
            Building Custom Dashboards
          </h2>
          <p className="text-foreground-secondary mb-4">
            Query raw events and build custom visualizations. Export data in JSON or CSV format
            for use with any BI tool.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Query raw events
const events = await dashboard.query({
  type: 'request',
  from: Date.now() - 86400000,
  to: Date.now(),
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  limit: 100,
  offset: 0,
});

// Aggregate data
const avgCost = await dashboard.aggregate({
  field: 'data.cost',
  type: 'request',
  from: Date.now() - 86400000,
});
console.log(avgCost);
// { count: 1523, sum: 180.45, avg: 0.118, min: 0.001, max: 2.34 }

// Performance metrics
const perf = await dashboard.getPerformanceMetrics({ period: 'hour' });
console.log(perf.latency);
// { avg: 1200, p50: 800, p95: 2800, p99: 4500, min: 120, max: 8900 }

console.log(perf.throughput);    // 253 requests/min
console.log(perf.errorRate);     // 0.005 (0.5%)
console.log(perf.totalRequests); // 15,180
console.log(perf.totalErrors);   // 76

// Export data
const csvExport = await dashboard.export({
  format: 'csv',
  from: Date.now() - 2592000000, // Last 30 days
  type: 'request',
});

const jsonExport = await dashboard.export({
  format: 'json',
  from: Date.now() - 2592000000,
});

// Cleanup old events
const cleaned = await dashboard.cleanup(
  90 * 24 * 60 * 60 * 1000 // Older than 90 days
);
console.log(\`Cleaned up \${cleaned} old events\`);`}</pre>
          </div>
        </motion.section>

        {/* Supported Backends */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Observability Backends</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Prometheus', 'Grafana', 'Jaeger', 'Datadog',
              'New Relic', 'Sentry', 'CloudWatch', 'Elasticsearch',
            ].map((backend) => (
              <div
                key={backend}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium"
              >
                {backend}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/testing"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Testing
          </Link>
          <Link
            href="/docs/enterprise"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Enterprise
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
