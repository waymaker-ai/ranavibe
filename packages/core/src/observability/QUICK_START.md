# RANA Tracer - Quick Start Guide

## Installation

The tracer is built into `@rana/core` - no additional installation needed!

```typescript
import { createTracer } from '@rana/core';
```

## 30-Second Start

```typescript
import { createTracer } from '@rana/core';

// 1. Create a tracer
const tracer = createTracer();

// 2. Start a trace
const span = tracer.startTrace('my_operation', {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022'
});

// 3. Do your work
// ... your code here ...

// 4. Add data
tracer.setAttributes(span, {
  input_tokens: 100,
  output_tokens: 200,
  cost: 0.003
});

// 5. End the trace
tracer.endSpan(span, 'success');

// 6. View the results
const exported = tracer.exportTrace(span.context.traceId);
console.log(exported);
```

## Common Patterns

### Pattern 1: Simple Request Tracing

```typescript
const span = tracer.startTrace('chat_request');

try {
  const response = await rana.chat('Hello!');

  tracer.setAttributes(span, {
    tokens: response.usage.total_tokens,
    cost: response.cost.total_cost
  });

  tracer.endSpan(span, 'success');
} catch (error) {
  tracer.endSpan(span, 'error', error);
}
```

### Pattern 2: Nested Operations

```typescript
const parent = tracer.startTrace('complex_task');

// Step 1
const step1 = tracer.startSpan('process_input', parent);
// ... do work ...
tracer.endSpan(step1, 'success');

// Step 2
const step2 = tracer.startSpan('call_llm', parent);
// ... do work ...
tracer.endSpan(step2, 'success');

tracer.endSpan(parent, 'success');
```

### Pattern 3: Global Tracer (Recommended)

```typescript
// In your app initialization
import { createTracer, setGlobalTracer } from '@rana/core';

const tracer = createTracer({ maxTraces: 1000 });
setGlobalTracer(tracer);

// Anywhere in your app
import { getGlobalTracer } from '@rana/core';

const tracer = getGlobalTracer();
const span = tracer.startTrace('operation');
```

### Pattern 4: Auto-Export to Monitoring

```typescript
const tracer = createTracer({
  autoExport: true,
  onExport: async (trace) => {
    // Send to your monitoring service
    await fetch('https://my-monitoring.com/api/traces', {
      method: 'POST',
      body: JSON.stringify(trace)
    });
  }
});
```

### Pattern 5: Function Wrapping

```typescript
import { traced } from '@rana/core';

// Define your function
async function processData(data: string) {
  // ... processing logic ...
  return result;
}

// Wrap it with automatic tracing
const tracedProcess = traced('process_data', processData);

// Call it - tracing happens automatically
await tracedProcess('my data');
```

## What Gets Captured?

Every span captures:

```typescript
{
  context: {
    traceId: "unique-trace-id",
    spanId: "unique-span-id",
    parentSpanId: "parent-id" // if nested
  },
  name: "operation_name",
  startTime: 1234567890,
  endTime: 1234567900,
  duration: 10, // ms
  status: "success", // or "error", "pending"
  attributes: {
    // Your custom data
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    input_tokens: 100,
    output_tokens: 200,
    cost: 0.003,
    // ... any other data
  },
  children: [] // nested spans
}
```

## Configuration Options

```typescript
createTracer({
  // Max traces to keep in memory (default: 1000)
  maxTraces: 1000,

  // Auto-export completed traces (default: false)
  autoExport: true,

  // Export callback
  onExport: (trace) => {
    console.log(trace);
  },

  // Debug mode - logs to console (default: false)
  debug: true
});
```

## Statistics

```typescript
const stats = tracer.getStats();

console.log(`
  Total Traces: ${stats.totalTraces}
  Total Spans: ${stats.totalSpans}
  Active Spans: ${stats.activeSpans}
  Avg Duration: ${stats.avgDuration}ms
  Success Rate: ${stats.successRate}%
`);
```

## Common Use Cases

### 1. Debugging Slow Requests

```typescript
const span = tracer.startTrace('slow_request');
// ... your code ...
tracer.endSpan(span, 'success');

const trace = tracer.exportTrace(span.context.traceId);
console.log(`Request took ${trace.duration}ms`);

// Find the slowest child span
const slowest = findSlowestSpan(trace.spans[0].children);
console.log(`Bottleneck: ${slowest.name} (${slowest.duration}ms)`);
```

### 2. Cost Attribution

```typescript
const span = tracer.startTrace('user_request', {
  user_id: 'user-123'
});

// ... process request ...

tracer.setAttribute(span, 'cost', totalCost);
tracer.endSpan(span, 'success');

// Later: aggregate costs by user
const userCosts = aggregateCostsByUser(tracer.getAllTraces());
```

### 3. Error Tracking

```typescript
try {
  // ... risky operation ...
} catch (error) {
  tracer.endSpan(span, 'error', error);

  // Error is now tracked with full context
  const trace = tracer.exportTrace(span.context.traceId);
  console.log(trace.spans[0].error); // error message
  console.log(trace.spans[0].errorStack); // stack trace
}
```

### 4. Performance Monitoring

```typescript
const tracer = createTracer({
  autoExport: true,
  onExport: (trace) => {
    if (trace.duration > 5000) {
      console.warn(`Slow request detected: ${trace.duration}ms`);
      alertOps(trace);
    }
  }
});
```

## Best Practices

1. **Name spans descriptively**: Use clear names like `cache_lookup`, `api_call`, `process_input`

2. **Track important metrics**: Always include provider, model, tokens, and cost

3. **Use the global tracer**: Set it up once, use everywhere

4. **Handle errors properly**: Always pass errors to `endSpan()`

5. **Export for persistence**: Use `autoExport` to send traces to monitoring

6. **Set reasonable limits**: Configure `maxTraces` based on your memory

## Real-World Example

```typescript
import { createTracer, setGlobalTracer } from '@rana/core';

// App setup
const tracer = createTracer({
  maxTraces: 1000,
  autoExport: true,
  onExport: async (trace) => {
    // Send to DataDog, New Relic, etc.
    await monitoringService.sendTrace(trace);
  }
});
setGlobalTracer(tracer);

// In your request handler
async function handleUserRequest(userMessage: string) {
  const tracer = getGlobalTracer();
  const span = tracer.startTrace('user_request', {
    endpoint: '/chat',
    user_id: getCurrentUserId()
  });

  try {
    // Check budget
    const budgetSpan = tracer.startSpan('budget_check', span);
    await checkBudget();
    tracer.endSpan(budgetSpan, 'success');

    // Call LLM
    const llmSpan = tracer.startSpan('llm_call', span, {
      provider: 'anthropic'
    });

    const response = await rana.chat(userMessage);

    tracer.setAttributes(llmSpan, {
      tokens: response.usage.total_tokens,
      cost: response.cost.total_cost
    });
    tracer.endSpan(llmSpan, 'success');

    // Complete request
    tracer.setAttributes(span, {
      total_cost: response.cost.total_cost,
      cached: response.cached
    });
    tracer.endSpan(span, 'success');

    return response;
  } catch (error) {
    tracer.endSpan(span, 'error', error);
    throw error;
  }
}
```

## Next Steps

- Read the [full README](./README.md) for complete documentation
- Check out [examples](./example.ts) for more use cases
- See [implementation summary](./IMPLEMENTATION_SUMMARY.md) for technical details

## Help

If you need help:
1. Check the [README](./README.md)
2. Look at [examples](./example.ts)
3. Review [tests](./tracer.test.ts) for usage patterns
