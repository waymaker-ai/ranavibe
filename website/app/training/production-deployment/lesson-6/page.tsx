import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Setting Up Monitoring | Production Deployment',
  description: 'Application metrics, LLM-specific metrics for latency, tokens, and cost, Prometheus and Grafana setup, and alerting rules for CoFounder apps.',
};

export default function Lesson6Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 6 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Setting Up Monitoring</h1>
          <p className="lead">
            AI agent applications have unique monitoring needs beyond traditional web apps. You need
            to track LLM latency, token consumption, cost per request, error rates across providers,
            and agent step counts. This lesson shows how to build a comprehensive monitoring stack.
          </p>

          <h2>Application Metrics for AI Agents</h2>
          <p>
            Standard web metrics (request latency, error rate, throughput) remain important, but
            AI agents introduce additional dimensions you must track. Here are the key metrics
            every CoFounder production deployment should capture:
          </p>
          <ul>
            <li><strong>LLM call latency</strong> — p50, p95, p99 per model and provider.</li>
            <li><strong>Token usage</strong> — input tokens, output tokens, and total per request.</li>
            <li><strong>Cost per request</strong> — calculated from token usage and model pricing.</li>
            <li><strong>Agent steps</strong> — how many tool-use iterations before completion.</li>
            <li><strong>Error rate by type</strong> — rate limits, context length exceeded, provider outages.</li>
            <li><strong>Cache hit rate</strong> — for Redis-cached LLM responses.</li>
          </ul>
          <div className="code-block"><pre><code>{`// lib/metrics.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export const registry = new Registry();

export const llmLatency = new Histogram({
  name: 'cofounder_llm_latency_seconds',
  help: 'LLM call latency in seconds',
  labelNames: ['provider', 'model', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

export const tokenUsage = new Counter({
  name: 'cofounder_token_usage_total',
  help: 'Total tokens consumed',
  labelNames: ['provider', 'model', 'direction'], // direction: input | output
  registers: [registry],
});

export const agentSteps = new Histogram({
  name: 'cofounder_agent_steps',
  help: 'Number of steps per agent execution',
  labelNames: ['agent_type'],
  buckets: [1, 2, 3, 5, 8, 10, 15, 20],
  registers: [registry],
});

export const requestCost = new Counter({
  name: 'cofounder_request_cost_usd',
  help: 'Estimated cost in USD per request',
  labelNames: ['provider', 'model', 'user_tier'],
  registers: [registry],
});

export const activeAgents = new Gauge({
  name: 'cofounder_active_agents',
  help: 'Number of currently executing agents',
  registers: [registry],
});`}</code></pre></div>

          <h2>Instrumenting LLM Calls</h2>
          <p>
            Wrap your LLM client calls with metric recording. This middleware pattern works with
            any provider and captures latency, tokens, and cost automatically:
          </p>
          <div className="code-block"><pre><code>{`// lib/llm-instrumented.ts
import { llmLatency, tokenUsage, requestCost } from './metrics';

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },         // per 1K tokens
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

export async function instrumentedLLMCall(
  provider: string,
  model: string,
  callFn: () => Promise<any>
) {
  const timer = llmLatency.startTimer({ provider, model });

  try {
    const result = await callFn();
    timer({ status: 'success' });

    // Record token usage
    const usage = result.usage;
    if (usage) {
      tokenUsage.inc({ provider, model, direction: 'input' }, usage.prompt_tokens);
      tokenUsage.inc({ provider, model, direction: 'output' }, usage.completion_tokens);

      // Calculate cost
      const pricing = MODEL_PRICING[model];
      if (pricing) {
        const cost =
          (usage.prompt_tokens / 1000) * pricing.input +
          (usage.completion_tokens / 1000) * pricing.output;
        requestCost.inc({ provider, model, user_tier: 'standard' }, cost);
      }
    }

    return result;
  } catch (error) {
    timer({ status: 'error' });
    throw error;
  }
}`}</code></pre></div>

          <h2>Prometheus and Grafana Setup</h2>
          <p>
            Expose a <code>/api/metrics</code> endpoint that Prometheus can scrape, then
            visualize everything in Grafana. Add both services to your docker-compose for
            local development:
          </p>
          <div className="code-block"><pre><code>{`// app/api/metrics/route.ts
import { registry } from '@/lib/metrics';
import { NextResponse } from 'next/server';

export async function GET() {
  const metrics = await registry.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': registry.contentType },
  });
}

// --- prometheus.yml ---
// scrape_configs:
//   - job_name: 'cofounder-app'
//     scrape_interval: 15s
//     static_configs:
//       - targets: ['app:3000']
//     metrics_path: '/api/metrics'`}</code></pre></div>

          <h2>Alerting Rules</h2>
          <p>
            Configure alerts for conditions that indicate real problems, not noise. AI-specific
            alerts are critical because a silent provider outage or runaway agent can burn through
            your budget quickly:
          </p>
          <div className="code-block"><pre><code>{`# prometheus-alerts.yml
groups:
  - name: cofounder-alerts
    rules:
      - alert: HighLLMLatency
        expr: histogram_quantile(0.95, rate(cofounder_llm_latency_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "LLM p95 latency above 10s for 5 minutes"

      - alert: HighErrorRate
        expr: rate(cofounder_llm_latency_seconds_count{status="error"}[5m]) / rate(cofounder_llm_latency_seconds_count[5m]) > 0.1
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "LLM error rate above 10%"

      - alert: BudgetThresholdReached
        expr: sum(cofounder_request_cost_usd) > 400
        labels:
          severity: warning
        annotations:
          summary: "Monthly LLM cost approaching $500 budget"

      - alert: AgentStepCountHigh
        expr: histogram_quantile(0.95, rate(cofounder_agent_steps_bucket[15m])) > 12
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Agents are taking too many steps — possible loop detected"`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-5" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Docker Containerization
          </Link>
          <Link href="/training/production-deployment/lesson-7" className="btn-primary px-6 py-3 group">
            Next: OpenTelemetry Integration
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
