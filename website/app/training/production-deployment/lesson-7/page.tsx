import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'OpenTelemetry Integration | Production Deployment',
  description: 'Set up OpenTelemetry for tracing LLM calls, adding AI-specific span attributes, distributed tracing across agents, and exporter configuration.',
};

export default function Lesson7Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 7 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>OpenTelemetry Integration</h1>
          <p className="lead">
            OpenTelemetry (OTel) provides vendor-neutral distributed tracing, metrics, and logging.
            For AI agent applications, OTel lets you trace a request from the initial user message
            through every LLM call, tool invocation, and database query -- giving you full
            visibility into agent behavior in production.
          </p>

          <h2>Setting Up OpenTelemetry in Next.js</h2>
          <p>
            Next.js supports OTel through the instrumentation hook. Install the required packages
            and create an instrumentation file that initializes the SDK at application startup:
          </p>
          <div className="code-block"><pre><code>{`npm install @opentelemetry/sdk-node @opentelemetry/api \\
  @opentelemetry/exporter-trace-otlp-http \\
  @opentelemetry/resources @opentelemetry/semantic-conventions \\
  @opentelemetry/instrumentation-http @opentelemetry/instrumentation-fetch`}</code></pre></div>
          <div className="code-block"><pre><code>{`// instrumentation.ts (project root)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-http'
    );
    const { Resource } = await import('@opentelemetry/resources');
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
      '@opentelemetry/semantic-conventions'
    );
    const { HttpInstrumentation } = await import(
      '@opentelemetry/instrumentation-http'
    );

    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'cofounder-app',
        [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
        'deployment.environment': process.env.NODE_ENV ?? 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [new HttpInstrumentation()],
    });

    sdk.start();
  }
}`}</code></pre></div>

          <h2>Tracing LLM Calls</h2>
          <p>
            Each LLM call should be wrapped in a span with AI-specific attributes. This lets you
            see exactly which model was called, how many tokens were consumed, and how long the
            call took, all within the context of the parent request trace:
          </p>
          <div className="code-block"><pre><code>{`// lib/llm-traced.ts
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('cofounder-llm');

export async function tracedLLMCall(
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  callFn: () => Promise<any>
) {
  return tracer.startActiveSpan(\`llm.\${provider}.\${model}\`, async (span) => {
    span.setAttributes({
      'llm.provider': provider,
      'llm.model': model,
      'llm.request.messages_count': messages.length,
      'llm.request.max_tokens': 4096,
    });

    try {
      const result = await callFn();

      // Record response attributes
      span.setAttributes({
        'llm.response.prompt_tokens': result.usage?.prompt_tokens ?? 0,
        'llm.response.completion_tokens': result.usage?.completion_tokens ?? 0,
        'llm.response.total_tokens': result.usage?.total_tokens ?? 0,
        'llm.response.finish_reason': result.choices?.[0]?.finish_reason ?? 'unknown',
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}`}</code></pre></div>

          <h2>Distributed Tracing Across Agents</h2>
          <p>
            When one agent delegates to another or triggers a background job, you need to propagate
            the trace context so the entire chain appears as a single trace. Pass the trace context
            through headers or message metadata:
          </p>
          <div className="code-block"><pre><code>{`// lib/agent-context.ts
import { context, propagation, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('cofounder-agent');

export async function executeAgentWithContext(
  agentId: string,
  input: string,
  parentContext?: Record<string, string>
) {
  // Restore parent context if provided (e.g., from a queue message)
  let activeContext = context.active();
  if (parentContext) {
    activeContext = propagation.extract(context.active(), parentContext);
  }

  return context.with(activeContext, async () => {
    return tracer.startActiveSpan(\`agent.execute.\${agentId}\`, async (span) => {
      span.setAttributes({
        'agent.id': agentId,
        'agent.input_length': input.length,
      });

      let stepCount = 0;

      // Agent loop
      while (stepCount < 15) {
        stepCount++;
        const stepSpan = tracer.startSpan(\`agent.step.\${stepCount}\`, {}, context.active());
        stepSpan.setAttribute('agent.step_number', stepCount);

        // ... execute step (LLM call + tool use)

        stepSpan.end();
      }

      span.setAttribute('agent.total_steps', stepCount);
      span.end();
    });
  });
}

// Extract context to pass to a background job or another service
export function extractTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
}`}</code></pre></div>

          <h2>Exporter Configuration</h2>
          <p>
            OTel supports multiple backends. Configure the exporter based on your monitoring stack.
            Popular options include Jaeger for self-hosted tracing, Datadog for full-stack
            observability, and Grafana Tempo for integration with Prometheus and Grafana:
          </p>
          <div className="code-block"><pre><code>{`# Environment variables for common OTel exporters

# Jaeger (self-hosted)
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318

# Datadog
OTEL_EXPORTER_OTLP_ENDPOINT=https://trace.agent.datadoghq.com
DD_API_KEY=your-datadog-api-key

# Grafana Tempo
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318

# Honeycomb
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=your-api-key

# Common settings
OTEL_SERVICE_NAME=cofounder-app
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-6" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Setting Up Monitoring
          </Link>
          <Link href="/training/production-deployment/lesson-8" className="btn-primary px-6 py-3 group">
            Next: Cost Monitoring &amp; Alerts
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
