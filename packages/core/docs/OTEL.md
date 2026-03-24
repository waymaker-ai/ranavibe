# OpenTelemetry Export for CoFounder

CoFounder provides built-in OpenTelemetry export capabilities to help you monitor and trace your LLM operations in production environments.

## Overview

The OpenTelemetry exporter converts CoFounder traces into the OTLP (OpenTelemetry Protocol) format and sends them to any compatible collector (Jaeger, Zipkin, Honeycomb, Datadog, New Relic, etc.).

## Installation

### Optional Peer Dependencies

The OpenTelemetry integration uses an optional peer dependency pattern. Install the following packages to enable OTel export:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http
```

If these packages are not installed, CoFounder will still work normally but OTel export will be disabled.

## Quick Start

### Basic Usage

```typescript
import { createCoFounder, createOTelPlugin } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  plugins: [
    createOTelPlugin({
      serviceName: 'my-cofounder-service',
      endpoint: 'http://localhost:4318/v1/traces',
    }),
  ],
});

// All requests are now traced
await cofounder.chat('Hello!');
```

### Advanced Configuration

```typescript
import { createOTelExporter } from '@waymakerai/aicofounder-core';

const exporter = createOTelExporter({
  serviceName: 'production-app',
  endpoint: 'https://otel-collector.example.com/v1/traces',

  // Authentication
  headers: {
    'x-api-key': process.env.OTEL_API_KEY,
  },

  // Batching configuration
  batchSize: 100,
  batchInterval: 5000,

  // Resource attributes
  resourceAttributes: {
    'service.version': '1.0.0',
    'deployment.environment': 'production',
  },

  // Callbacks
  onExportSuccess: (spanCount) => {
    console.log(`Exported ${spanCount} spans`);
  },
  onExportError: (error) => {
    console.error('Export failed:', error);
  },

  // Debug mode
  debug: true,
});

const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [exporter.asPlugin()],
});
```

## Configuration Options

### OTelConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | `string` | **required** | Service name in traces |
| `endpoint` | `string` | **required** | OTLP endpoint URL |
| `headers` | `Record<string, string>` | `{}` | Authentication headers |
| `batchSize` | `number` | `100` | Spans per batch |
| `batchInterval` | `number` | `5000` | Batch interval (ms) |
| `protocol` | `'http' \| 'grpc'` | `'http'` | Export protocol |
| `enabled` | `boolean` | `true` | Enable/disable export |
| `resourceAttributes` | `Record<string, any>` | `{}` | Custom resource labels |
| `onExportSuccess` | `(count: number) => void` | - | Success callback |
| `onExportError` | `(error: Error) => void` | - | Error callback |
| `debug` | `boolean` | `false` | Enable debug logs |

## Span Attributes

Each CoFounder request generates a span with the following attributes:

### Core Attributes
- `cofounder.provider` - LLM provider (anthropic, openai, etc.)
- `cofounder.model` - Model name
- `cofounder.request_id` - Unique request ID
- `cofounder.cached` - Whether response was cached
- `cofounder.finish_reason` - Completion reason

### Cost Attributes
- `cofounder.cost.total` - Total cost in USD
- `cofounder.cost.prompt` - Prompt cost
- `cofounder.cost.completion` - Completion cost

### Usage Attributes
- `cofounder.usage.prompt_tokens` - Input tokens
- `cofounder.usage.completion_tokens` - Output tokens
- `cofounder.usage.total_tokens` - Total tokens

### Performance Attributes
- `cofounder.latency_ms` - Request latency

### Request Metadata
- `cofounder.temperature` - Temperature setting
- `cofounder.max_tokens` - Max tokens setting
- `cofounder.optimize` - Optimization strategy
- `cofounder.user` - User ID

### Retry Attributes (if applicable)
- `cofounder.retry_count` - Number of retries
- `cofounder.retry_time_ms` - Total retry time

## Use Cases

### 1. Local Development with Jaeger

```bash
# Start Jaeger
docker run -d --name jaeger \
  -p 4318:4318 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

```typescript
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [
    createOTelPlugin({
      serviceName: 'dev-cofounder',
      endpoint: 'http://localhost:4318/v1/traces',
      debug: true,
    }),
  ],
});

await cofounder.chat('Test trace');
// View traces at http://localhost:16686
```

### 2. Production with Honeycomb

```typescript
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [
    createOTelPlugin({
      serviceName: 'prod-app',
      endpoint: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': process.env.HONEYCOMB_API_KEY,
        'x-honeycomb-dataset': 'cofounder-traces',
      },
    }),
  ],
});
```

### 3. Datadog

```typescript
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [
    createOTelPlugin({
      serviceName: 'my-service',
      endpoint: 'https://trace.agent.datadoghq.com/v1/traces',
      headers: {
        'DD-API-KEY': process.env.DATADOG_API_KEY,
      },
    }),
  ],
});
```

### 4. New Relic

```typescript
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [
    createOTelPlugin({
      serviceName: 'my-service',
      endpoint: 'https://otlp.nr-data.net/v1/traces',
      headers: {
        'api-key': process.env.NEW_RELIC_LICENSE_KEY,
      },
    }),
  ],
});
```

### 5. Trace Grouping

Group related requests in a single trace:

```typescript
const exporter = createOTelExporter({
  serviceName: 'chat-app',
  endpoint: 'http://localhost:4318/v1/traces',
});

const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [exporter.asPlugin()],
});

// Start a conversation trace
const traceId = exporter.startTrace();

try {
  await cofounder.chat('What is AI?');
  await cofounder.chat('Tell me more');
  await cofounder.chat('Give an example');
} finally {
  exporter.endTrace();
}

await exporter.shutdown();
```

### 6. Multiple Exporters

Send traces to multiple collectors:

```typescript
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: [
    // Local development
    createOTelPlugin({
      serviceName: 'dev',
      endpoint: 'http://localhost:4318/v1/traces',
    }),
    // Production monitoring
    createOTelPlugin({
      serviceName: 'prod',
      endpoint: 'https://prod-otel.example.com/v1/traces',
      headers: { 'x-api-key': process.env.PROD_KEY },
    }),
  ],
});
```

## Environment-Based Configuration

```typescript
function createOTelConfig(): OTelConfig | null {
  if (process.env.NODE_ENV === 'development') {
    return {
      serviceName: 'dev-cofounder',
      endpoint: 'http://localhost:4318/v1/traces',
      debug: true,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      serviceName: 'prod-cofounder',
      endpoint: process.env.OTEL_ENDPOINT!,
      headers: {
        'x-api-key': process.env.OTEL_API_KEY!,
      },
      batchSize: 200,
      batchInterval: 10000,
    };
  }

  return null; // Disable in test
}

const otelConfig = createOTelConfig();
const cofounder = createCoFounder({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  plugins: otelConfig ? [createOTelPlugin(otelConfig)] : [],
});
```

## Best Practices

### 1. Batching

Configure batching based on your traffic:

- **Low traffic** (< 10 req/min): `batchSize: 10, batchInterval: 5000`
- **Medium traffic** (10-100 req/min): `batchSize: 50, batchInterval: 5000`
- **High traffic** (> 100 req/min): `batchSize: 200, batchInterval: 2000`

### 2. Error Handling

Always add error callbacks in production:

```typescript
createOTelExporter({
  serviceName: 'prod',
  endpoint: process.env.OTEL_ENDPOINT!,
  onExportError: (error) => {
    console.error('[OTel] Export failed:', error);
    // Send to error tracking (e.g., Sentry)
  },
});
```

### 3. Resource Attributes

Add meaningful resource attributes:

```typescript
createOTelExporter({
  serviceName: 'my-service',
  endpoint: '...',
  resourceAttributes: {
    'service.version': process.env.APP_VERSION,
    'deployment.environment': process.env.ENV,
    'service.namespace': 'ai-services',
    'cloud.provider': 'aws',
    'cloud.region': process.env.AWS_REGION,
  },
});
```

### 4. Graceful Shutdown

Flush spans before exiting:

```typescript
const exporter = createOTelExporter({ ... });

process.on('SIGTERM', async () => {
  await exporter.shutdown();
  process.exit(0);
});
```

### 5. Sampling

For high-volume applications, consider sampling:

```typescript
createOTelExporter({
  serviceName: 'high-traffic-app',
  endpoint: '...',
  // Sample 10% of requests
  enabled: Math.random() < 0.1,
});
```

## Troubleshooting

### Traces not appearing?

1. **Check endpoint**: Ensure the endpoint is correct and accessible
2. **Check authentication**: Verify headers are set correctly
3. **Enable debug**: Set `debug: true` to see export logs
4. **Check batching**: Try reducing `batchInterval` for faster export
5. **Flush manually**: Call `exporter.flush()` to force export

### High memory usage?

1. **Reduce batch size**: Lower `batchSize` to export more frequently
2. **Reduce interval**: Lower `batchInterval` to flush faster
3. **Check for leaks**: Ensure `shutdown()` is called when done

### Export failures?

```typescript
createOTelExporter({
  serviceName: 'my-service',
  endpoint: '...',
  onExportError: (error) => {
    // Log detailed error
    console.error('Export failed:', {
      message: error.message,
      stack: error.stack,
    });
  },
  onExportSuccess: (count) => {
    console.log(`✓ Exported ${count} spans`);
  },
});
```

## API Reference

### `createOTelExporter(config: OTelConfig): OTelExporter`

Creates a new OpenTelemetry exporter.

### `createOTelPlugin(config: OTelConfig): RanaPlugin`

Creates a CoFounder plugin for easier integration.

### `isOTelAvailable(): boolean`

Checks if OpenTelemetry dependencies are installed.

### `OTelExporter` Methods

- `recordChatSpan(request, response, error?)` - Record a span
- `startTrace()` - Start a new trace
- `endTrace()` - End current trace
- `flush()` - Flush pending spans
- `shutdown()` - Shutdown and flush
- `asPlugin()` - Convert to CoFounder plugin

## Examples

See `/examples/otel-export.ts` for complete examples.

## Related

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [CoFounder Observability Guide](./OBSERVABILITY.md)
