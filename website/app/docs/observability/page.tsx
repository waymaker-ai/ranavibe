'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Eye, BarChart3, AlertTriangle, Gauge, FileSearch } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Request Tracing',
    description: 'Distributed tracing for all AI requests with full context',
    code: `import { createTracer, withTracing } from '@rana/observability';

const tracer = createTracer({
  serviceName: 'my-ai-app',
  exporters: ['console', 'otlp'],
  otlpEndpoint: 'http://localhost:4318'
});

// Automatic tracing
const result = await withTracing(
  'summarize-document',
  async (span) => {
    span.setAttribute('document.length', doc.length);
    return await summarize(doc);
  }
);

// Or use decorators
class MyService {
  @traced('processRequest')
  async process(input: string) {
    return await this.ai.chat(input);
  }
}`,
  },
  {
    icon: BarChart3,
    title: 'Token Analytics',
    description: 'Track token usage, costs, and efficiency across all requests',
    code: `import { TokenAnalytics } from '@rana/observability';

const analytics = new TokenAnalytics();

// Automatic tracking
analytics.track({
  model: 'gpt-4',
  inputTokens: 1500,
  outputTokens: 500,
  cost: 0.045,
  latency: 2300,
  metadata: { userId: '123', feature: 'chat' }
});

// Get insights
const daily = await analytics.getDailyUsage();
const byModel = await analytics.getUsageByModel();
const byFeature = await analytics.getUsageByMetadata('feature');

// Cost breakdown
const costs = await analytics.getCostBreakdown({
  period: 'month',
  groupBy: 'model'
});`,
  },
  {
    icon: Gauge,
    title: 'Performance Monitoring',
    description: 'Track latency percentiles, throughput, and error rates',
    code: `import { PerformanceMonitor } from '@rana/observability';

const monitor = new PerformanceMonitor({
  sloLatencyP99: 3000,  // 3s P99 target
  sloErrorRate: 0.01,   // 1% error rate target
  alertOnBreach: true
});

// Automatic metrics collection
monitor.recordRequest({
  name: 'chat',
  duration: 1234,
  success: true
});

// Get performance stats
const stats = await monitor.getStats('1h');
console.log(stats.latency.p50);    // 800ms
console.log(stats.latency.p99);    // 2100ms
console.log(stats.throughput);      // 150 req/min
console.log(stats.errorRate);       // 0.005`,
  },
  {
    icon: FileSearch,
    title: 'Request/Response Logging',
    description: 'Structured logging with PII redaction and search',
    code: `import { AILogger } from '@rana/observability';

const logger = new AILogger({
  redactPII: true,        // Auto-redact emails, phones, etc.
  redactPatterns: [/api_key=\\w+/],  // Custom patterns
  storage: 'elasticsearch',
  retention: '30d'
});

// Automatic logging
const result = await logger.wrap('chat', async () => {
  return await chat(userMessage);
});

// Search logs
const logs = await logger.search({
  query: 'error',
  timeRange: { from: '1h ago' },
  filters: { model: 'gpt-4' }
});`,
  },
  {
    icon: AlertTriangle,
    title: 'Error Tracking',
    description: 'AI-specific error tracking with context and grouping',
    code: `import { ErrorTracker } from '@rana/observability';

const errorTracker = new ErrorTracker({
  sentry: { dsn: process.env.SENTRY_DSN },
  groupSimilarErrors: true,
  captureContext: true
});

// Automatic error capture
try {
  await chat(message);
} catch (error) {
  errorTracker.capture(error, {
    model: 'gpt-4',
    prompt: message,
    userId: user.id
  });
}

// Get error insights
const insights = await errorTracker.getInsights('24h');
console.log(insights.topErrors);
console.log(insights.errorsByModel);
console.log(insights.errorTrend);`,
  },
  {
    icon: Activity,
    title: 'OpenTelemetry Export',
    description: 'Export to any OTel-compatible backend',
    code: `import { setupOTel } from '@rana/observability';

setupOTel({
  serviceName: 'my-ai-app',
  exporters: {
    traces: {
      type: 'otlp',
      endpoint: 'http://jaeger:4318'
    },
    metrics: {
      type: 'prometheus',
      port: 9090
    },
    logs: {
      type: 'otlp',
      endpoint: 'http://loki:3100'
    }
  }
});

// All RANA operations are now traced
const result = await chat('Hello');
// Automatically creates spans, records metrics, logs`,
  },
];

export default function ObservabilityPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Activity className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Observability</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Full visibility into your AI applications. Tracing, metrics, logging,
            and error tracking with OpenTelemetry support.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/observability
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Backends</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Datadog', 'New Relic', 'Grafana', 'Jaeger', 'Prometheus', 'Sentry', 'Elasticsearch', 'CloudWatch'].map((backend) => (
              <div
                key={backend}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium"
              >
                {backend}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
