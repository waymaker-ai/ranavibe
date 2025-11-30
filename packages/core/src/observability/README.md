# RANA Observability

Built-in tracing and observability system for monitoring RANA LLM operations.

## Overview

The RANA Observability module provides comprehensive tracing capabilities to help you understand and debug your LLM operations. It captures detailed information about requests, including:

- Request start/end times and latency
- Provider and model information
- Token usage (input/output)
- Cost tracking
- Success/failure status
- Parent-child relationships for nested operations
- Request ID tracking

## Features

### 1. Distributed Tracing
- **Trace Context**: Each trace has a unique ID shared across all spans
- **Parent-Child Relationships**: Track nested operations with hierarchical spans
- **Automatic Duration Calculation**: Start and end times are captured automatically

### 2. Flexible Storage
- **In-Memory Storage**: Configurable maximum trace count
- **Auto-Cleanup**: Automatically removes oldest traces when limit is reached
- **Export Functionality**: Export traces for analysis or storage

### 3. Observability
- **Statistics**: Get aggregate statistics across all traces
- **Debug Mode**: Optional console logging for development
- **Auto-Export**: Automatically export completed traces

## Quick Start

### Basic Usage

```typescript
import { createTracer } from '@rana/core';

// Create a tracer
const tracer = createTracer({
  maxTraces: 1000,
  debug: true
});

// Start a trace
const span = tracer.startTrace('chat_request', {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022'
});

// ... perform your operation ...

// Add attributes
tracer.setAttributes(span, {
  input_tokens: 150,
  output_tokens: 300,
  cost: 0.0045
});

// End the span
tracer.endSpan(span, 'success');

// Export the trace
const exported = tracer.exportTrace(span.context.traceId);
console.log(exported);
```

### Nested Operations

```typescript
import { createTracer } from '@rana/core';

const tracer = createTracer();

// Start parent trace
const parentSpan = tracer.startTrace('chat_with_tools', {
  provider: 'openai',
  model: 'gpt-4o'
});

// Create child span
const childSpan = tracer.startSpan('tool_execution', parentSpan, {
  tool_name: 'search'
});

// ... perform tool execution ...

tracer.endSpan(childSpan, 'success');
tracer.endSpan(parentSpan, 'success');
```

### Error Handling

```typescript
import { createTracer } from '@rana/core';

const tracer = createTracer();
const span = tracer.startTrace('risky_operation');

try {
  // ... operation that might fail ...
  throw new Error('Rate limit exceeded');
} catch (error) {
  tracer.endSpan(span, 'error', error as Error);
}
```

### Global Tracer

```typescript
import { createTracer, setGlobalTracer, getGlobalTracer } from '@rana/core';

// Set up global tracer once
const tracer = createTracer({ maxTraces: 1000 });
setGlobalTracer(tracer);

// Use it anywhere in your application
const globalTracer = getGlobalTracer();
const span = globalTracer.startTrace('operation');
```

### Function Wrapping

```typescript
import { traced } from '@rana/core';

// Wrap an async function
async function processMessage(msg: string): Promise<string> {
  // ... processing logic ...
  return result;
}

const tracedProcess = traced('process_message', processMessage);

// Call it - tracing happens automatically
const result = await tracedProcess('Hello!');
```

### Auto-Export

```typescript
import { createTracer } from '@rana/core';

const tracer = createTracer({
  autoExport: true,
  onExport: (trace) => {
    // Send to your monitoring system
    console.log(`Trace ${trace.traceId} completed in ${trace.duration}ms`);

    // Could send to: DataDog, New Relic, Honeycomb, etc.
    // myMonitoringService.sendTrace(trace);
  }
});
```

## API Reference

### Tracer

#### Constructor

```typescript
new Tracer(config?: TracerConfig)
```

**Config Options:**
- `maxTraces?: number` - Maximum traces to keep in memory (default: 1000)
- `autoExport?: boolean` - Auto-export completed traces (default: false)
- `onExport?: (trace: TraceExport) => void` - Export callback
- `debug?: boolean` - Enable debug logging (default: false)

#### Methods

**`startTrace(name: string, attributes?: SpanAttributes): Span`**
- Start a new trace with a root span
- Returns the created span

**`startSpan(name: string, parentSpan: Span, attributes?: SpanAttributes): Span`**
- Start a child span within an existing trace
- Returns the created span

**`endSpan(span: Span, status?: SpanStatus, error?: Error): void`**
- End a span and calculate duration
- Status can be 'success', 'error', or 'pending'

**`setAttributes(span: Span, attributes: SpanAttributes): void`**
- Set multiple attributes on a span

**`setAttribute(span: Span, key: string, value: any): void`**
- Set a single attribute on a span

**`getTrace(traceId: string): Span[] | undefined`**
- Retrieve a trace by ID

**`getAllTraces(): Map<string, Span[]>`**
- Get all traces

**`exportTrace(traceId: string): TraceExport | null`**
- Export a trace for analysis or storage

**`clearTraces(): void`**
- Clear all traces from memory

**`getStats(): object`**
- Get aggregate statistics about all traces

### Types

#### Span

```typescript
interface Span {
  context: SpanContext;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: SpanAttributes;
  status: SpanStatus;
  error?: string;
  errorStack?: string;
  children: Span[];
}
```

#### SpanContext

```typescript
interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}
```

#### SpanAttributes

```typescript
interface SpanAttributes {
  provider?: LLMProvider;
  model?: LLMModel;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost?: number;
  cached?: boolean;
  [key: string]: any; // Custom attributes
}
```

#### SpanStatus

```typescript
type SpanStatus = 'pending' | 'success' | 'error';
```

#### TraceExport

```typescript
interface TraceExport {
  traceId: string;
  spans: Span[];
  duration: number;
  status: SpanStatus;
  createdAt: Date;
}
```

## Advanced Usage

### Real-World Example: Complete Chat Request

```typescript
import { createTracer } from '@rana/core';

async function handleChatRequest(tracer: Tracer) {
  // Main request trace
  const requestSpan = tracer.startTrace('rana.chat', {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022'
  });

  try {
    // 1. Budget check
    const budgetSpan = tracer.startSpan('budget_check', requestSpan);
    await checkBudget();
    tracer.setAttributes(budgetSpan, { budget_remaining: 5.0 });
    tracer.endSpan(budgetSpan, 'success');

    // 2. Cache lookup
    const cacheSpan = tracer.startSpan('cache_lookup', requestSpan);
    const cached = await checkCache();
    tracer.setAttributes(cacheSpan, { cache_hit: cached });
    tracer.endSpan(cacheSpan, 'success');

    if (!cached) {
      // 3. Provider request
      const providerSpan = tracer.startSpan('provider_request', requestSpan);

      // 3a. Rate limit check
      const rateLimitSpan = tracer.startSpan('rate_limit_check', providerSpan);
      await checkRateLimit();
      tracer.endSpan(rateLimitSpan, 'success');

      // 3b. API call
      const apiSpan = tracer.startSpan('api_call', providerSpan);
      const response = await callAPI();
      tracer.setAttributes(apiSpan, {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
        latency_ms: response.latency
      });
      tracer.endSpan(apiSpan, 'success');

      tracer.endSpan(providerSpan, 'success');

      // 4. Cache write
      const cacheWriteSpan = tracer.startSpan('cache_write', requestSpan);
      await writeCache(response);
      tracer.endSpan(cacheWriteSpan, 'success');
    }

    // 5. Cost tracking
    const costSpan = tracer.startSpan('cost_tracking', requestSpan);
    await trackCost(response);
    tracer.endSpan(costSpan, 'success');

    // Complete the request
    tracer.setAttributes(requestSpan, {
      total_tokens: response.usage.total_tokens,
      cost: response.cost.total_cost,
      cached
    });
    tracer.endSpan(requestSpan, 'success');

    return response;
  } catch (error) {
    tracer.endSpan(requestSpan, 'error', error as Error);
    throw error;
  }
}
```

### Integration with Monitoring Services

```typescript
import { createTracer } from '@rana/core';

// Example: Send to DataDog
const tracer = createTracer({
  autoExport: true,
  onExport: async (trace) => {
    await fetch('https://api.datadoghq.com/api/v2/traces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DATADOG_API_KEY
      },
      body: JSON.stringify({
        trace_id: trace.traceId,
        spans: convertToDatadogFormat(trace.spans),
        duration: trace.duration,
        status: trace.status
      })
    });
  }
});

// Example: Send to custom backend
const tracer = createTracer({
  autoExport: true,
  onExport: async (trace) => {
    await myBackend.saveTrace({
      id: trace.traceId,
      timestamp: trace.createdAt,
      duration_ms: trace.duration,
      status: trace.status,
      spans: trace.spans
    });
  }
});
```

### Statistics and Monitoring

```typescript
import { getGlobalTracer } from '@rana/core';

const tracer = getGlobalTracer();

// Get statistics
const stats = tracer.getStats();
console.log(`
  Total Traces: ${stats.totalTraces}
  Total Spans: ${stats.totalSpans}
  Active Spans: ${stats.activeSpans}
  Avg Duration: ${stats.avgDuration.toFixed(2)}ms
  Success Rate: ${stats.successRate.toFixed(1)}%
`);
```

## Best Practices

1. **Use Meaningful Span Names**: Name spans descriptively (e.g., 'cache_lookup', 'api_call', 'budget_check')

2. **Track Important Attributes**: Include provider, model, tokens, cost, and latency

3. **Handle Errors Properly**: Always pass errors to `endSpan()` for proper error tracking

4. **Clean Up**: Set `maxTraces` appropriately to avoid memory issues

5. **Use Global Tracer**: For application-wide tracing, use the global tracer pattern

6. **Export for Persistence**: Use `autoExport` to send traces to monitoring services

7. **Debug During Development**: Enable `debug: true` during development to see trace logs

## Performance Considerations

- In-memory storage is fast but limited by `maxTraces`
- Auto-cleanup removes oldest traces when limit is reached
- Spans are lightweight - minimal overhead per operation
- Export callbacks run asynchronously to avoid blocking

## Related Modules

- **Cost Tracker**: Track and enforce budget limits
- **Cache Manager**: Cache responses to reduce costs
- **Rate Limiter**: Prevent rate limit errors
- **Circuit Breaker**: Handle provider failures gracefully

## Examples

See `example.ts` in this directory for complete working examples including:
- Basic tracing
- Nested spans
- Error handling
- Global tracer usage
- Function wrapping
- Real-world chat request simulation
