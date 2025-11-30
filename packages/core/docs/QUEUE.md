# Request Queue

The RANA Request Queue provides intelligent request management with priority-based queuing, concurrency control, and timeout handling.

## Features

- **Priority-based Queuing**: High, normal, and low priority levels
- **Concurrency Control**: Configurable max concurrent requests per provider
- **Timeout Support**: Automatic timeout for queued requests
- **Event Emission**: Real-time queue status updates
- **Queue Statistics**: Detailed metrics on pending, processing, and completed requests
- **Per-Provider Management**: Independent queues for each LLM provider

## Configuration

Add queue configuration when creating your RANA client:

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  queue: {
    enabled: true,
    maxConcurrency: 5, // Max 5 concurrent requests per provider
    defaultPriority: 'normal', // Default priority for requests
    timeout: 60000, // 60 second timeout for queued requests
    debug: false, // Enable debug logging
    onQueueChange: (stats) => {
      console.log(`Queue: ${stats.pending} pending, ${stats.processing} processing`);
    },
  },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable/disable queue |
| `maxConcurrency` | number | 5 | Maximum concurrent requests per provider |
| `defaultPriority` | 'high' \| 'normal' \| 'low' | 'normal' | Default priority for new requests |
| `timeout` | number | 60000 | Timeout in milliseconds for queued requests |
| `debug` | boolean | false | Enable debug logging |
| `onQueueChange` | function | - | Callback when queue stats change |

## Usage

### Basic Usage with Priority

```typescript
// High priority request - processed first
const urgentResponse = await rana.chat({
  messages: [{ role: 'user', content: 'Urgent question!' }],
  priority: 'high',
});

// Normal priority request
const normalResponse = await rana.chat({
  messages: [{ role: 'user', content: 'Regular question' }],
  priority: 'normal',
});

// Low priority request - processed last
const backgroundResponse = await rana.chat({
  messages: [{ role: 'user', content: 'Background task' }],
  priority: 'low',
});
```

### Queue Statistics

```typescript
// Get current queue statistics
const stats = rana.queue.stats();

console.log(`Pending: ${stats.pending}`);
console.log(`Processing: ${stats.processing}`);
console.log(`Completed: ${stats.completed}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Timed Out: ${stats.timedOut}`);
console.log(`Average Wait Time: ${stats.avgWaitTime}ms`);

// Per-provider statistics
Object.entries(stats.byProvider).forEach(([provider, providerStats]) => {
  console.log(`${provider}:`);
  console.log(`  Pending: ${providerStats.pending}`);
  console.log(`  Processing: ${providerStats.processing}`);
  console.log(`  Completed: ${providerStats.completed}`);
});
```

### Queue Events

Listen to queue events for real-time updates:

```typescript
const queue = rana.queue.instance();

if (queue) {
  // Request added to queue
  queue.on('added', (event) => {
    console.log(`Request ${event.requestId} added`);
    console.log(`Priority: ${event.priority}`);
    console.log(`Provider: ${event.provider}`);
  });

  // Request now processing
  queue.on('processing', (event) => {
    console.log(`Request ${event.requestId} processing`);
    console.log(`Wait time: ${event.waitTime}ms`);
  });

  // Request completed
  queue.on('completed', (event) => {
    console.log(`Request ${event.requestId} completed`);
    console.log(`Total time: ${event.waitTime}ms`);
  });

  // Request timed out
  queue.on('timeout', (event) => {
    console.log(`Request ${event.requestId} timed out`);
    console.log(`Error: ${event.error?.message}`);
  });

  // Request failed
  queue.on('failed', (event) => {
    console.log(`Request ${event.requestId} failed`);
    console.log(`Error: ${event.error?.message}`);
  });

  // Queue stats changed
  queue.on('stats', (event) => {
    console.log('Queue stats updated:', event.stats);
  });
}
```

### Advanced Usage

#### Custom Timeout per Request

```typescript
// This request will timeout after 10 seconds if not processed
const response = await rana.chat({
  messages: [{ role: 'user', content: 'Quick question' }],
  priority: 'high',
  // Note: timeout is passed through queue config, not directly in request
});
```

#### Check if Queue is Enabled

```typescript
if (rana.queue.enabled()) {
  console.log('Queue is enabled');
  const stats = rana.queue.stats();
  console.log('Current queue size:', stats.pending);
}
```

#### Wait for Queue to Empty

```typescript
const queue = rana.queue.instance();
if (queue) {
  // Wait for queue to become idle (no pending or processing requests)
  await queue.waitForIdle();
  console.log('Queue is now empty!');

  // With timeout
  try {
    await queue.waitForIdle(5000); // Wait max 5 seconds
    console.log('Queue is empty!');
  } catch (error) {
    console.log('Queue did not become idle within timeout');
  }
}
```

#### Clear Queue

```typescript
const queue = rana.queue.instance();
if (queue) {
  // Clear all pending requests (processing requests continue)
  queue.clear();
  console.log('Queue cleared');
}
```

## How It Works

### Priority Ordering

Requests are processed based on priority:

1. **High Priority**: Processed first
2. **Normal Priority**: Processed after high priority
3. **Low Priority**: Processed last

Within the same priority level, requests are processed in FIFO (First In, First Out) order.

### Concurrency Control

The queue ensures that no more than `maxConcurrency` requests are processed concurrently per provider. When a request completes, the next highest priority request is automatically dequeued and processed.

### Request Flow

1. **Enqueue**: Request is added to queue based on priority
2. **Wait**: Request waits until concurrency allows processing
3. **Process**: Request is executed by the provider
4. **Complete**: Request completes, next request is dequeued

### Timeout Behavior

- Timeout starts when request is added to queue
- If timeout occurs while waiting, request is rejected immediately
- If timeout occurs while processing, request is canceled
- Timeout does NOT affect the actual API call timeout

## Best Practices

1. **Set Appropriate Concurrency**: Match `maxConcurrency` to your provider's rate limits
2. **Use Priorities Wisely**: Reserve 'high' priority for truly urgent requests
3. **Monitor Queue Stats**: Use `onQueueChange` callback or events to monitor queue health
4. **Set Reasonable Timeouts**: Balance between user experience and queue efficiency
5. **Handle Timeouts Gracefully**: Implement retry logic for timed-out requests if needed

## Examples

### Rate Limiting with Queue

```typescript
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  queue: {
    enabled: true,
    maxConcurrency: 3, // Limit to 3 concurrent requests
    timeout: 30000,
  },
});

// Send 100 requests - only 3 will process at a time
const requests = Array.from({ length: 100 }, (_, i) =>
  rana.chat({
    messages: [{ role: 'user', content: `Request ${i}` }],
  })
);

const results = await Promise.all(requests);
console.log(`Processed ${results.length} requests`);
```

### Priority-based Processing

```typescript
// Send multiple requests with different priorities
const highPriority = rana.chat({
  messages: [{ role: 'user', content: 'Urgent!' }],
  priority: 'high',
});

const normalPriority = rana.chat({
  messages: [{ role: 'user', content: 'Normal' }],
  priority: 'normal',
});

const lowPriority = rana.chat({
  messages: [{ role: 'user', content: 'Background' }],
  priority: 'low',
});

// High priority will be processed first, even if added last
await Promise.all([lowPriority, normalPriority, highPriority]);
```

## TypeScript Types

```typescript
import type {
  QueueConfig,
  QueueStats,
  QueueEvent,
  QueuePriority,
  RequestQueue,
} from '@rana/core';

// Queue configuration
const config: QueueConfig = {
  maxConcurrency: 5,
  defaultPriority: 'normal',
  timeout: 60000,
  onQueueChange: (stats: QueueStats) => {
    console.log(stats);
  },
};

// Queue statistics
const stats: QueueStats = {
  pending: 0,
  processing: 0,
  completed: 0,
  timedOut: 0,
  failed: 0,
  avgWaitTime: 0,
  byProvider: {},
};

// Queue events
const event: QueueEvent = {
  type: 'added',
  requestId: 'req_123',
  provider: 'anthropic',
  priority: 'high',
};
```

## Troubleshooting

### Queue Not Processing Requests

- Check if queue is enabled: `rana.queue.enabled()`
- Verify concurrency limit is not 0
- Check queue stats: `rana.queue.stats()`
- Enable debug logging: `queue: { debug: true }`

### Requests Timing Out

- Increase timeout value
- Check if maxConcurrency is too low
- Monitor queue depth with stats
- Consider adding more concurrent slots

### High Queue Depth

- Increase `maxConcurrency`
- Use priorities to process important requests first
- Implement backpressure in your application
- Monitor provider rate limits

## Related Features

- **Rate Limiting**: Control request rate per provider
- **Retry Logic**: Automatic retry on failures
- **Circuit Breaker**: Prevent cascading failures
- **Fallback**: Switch providers on failure

## See Also

- [Examples](/packages/core/examples/queue-example.ts)
- [API Reference](/packages/core/docs/API.md)
- [Configuration Guide](/packages/core/docs/CONFIGURATION.md)
