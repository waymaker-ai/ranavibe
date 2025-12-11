# Agent-to-Agent Messaging Protocol

RANA's messaging protocol enables sophisticated agent-to-agent communication with typed channels, delivery guarantees, and flexible routing patterns.

## Overview

The messaging system provides:
- **Typed Channels** - Type-safe message passing between agents
- **Multiple Patterns** - Direct, pub/sub, fanout, request/response, streaming
- **Delivery Guarantees** - Acknowledgments, retries, dead letter queues
- **Message Routing** - Filter, transform, and route messages dynamically
- **Priority Queuing** - Process urgent messages first

## Quick Start

```typescript
import {
  MessageBroker,
  createChannel,
  createRequestChannel
} from '@rana/agents';

// Create a message broker
const broker = new MessageBroker();

// Create a typed channel for task messages
interface TaskPayload {
  action: string;
  data: Record<string, unknown>;
}

const taskChannel = createChannel<TaskPayload>('tasks', {
  type: 'direct',
  options: {
    durable: true,
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    }
  }
});

// Subscribe an agent to the channel
broker.subscribe('worker-agent', 'tasks', async (message, context) => {
  console.log('Received task:', message.payload);

  // Process the task
  const result = await processTask(message.payload);

  // Acknowledge successful processing
  await context.acknowledge();

  return result;
});

// Send a message
const ack = await broker.send('worker-agent', 'tasks', {
  type: 'request',
  payload: { action: 'analyze', data: { file: 'report.pdf' } },
  priority: 'high'
});

console.log('Message delivered:', ack.status);
```

## Channel Types

### Direct Channel
Point-to-point messaging between two agents.

```typescript
const directChannel = createChannel('orders', {
  type: 'direct'
});

// Only the targeted agent receives the message
await broker.send('order-processor', 'orders', {
  type: 'request',
  payload: { orderId: '12345' }
});
```

### Topic Channel
Pub/sub with pattern matching on topics.

```typescript
const topicChannel = createChannel('events', {
  type: 'topic'
});

// Subscribe to specific patterns
broker.subscribe('logger', 'events', handler, {
  pattern: 'order.*'  // Matches order.created, order.updated, etc.
});

broker.subscribe('analytics', 'events', handler, {
  pattern: 'user.#'   // Matches user.login, user.profile.updated, etc.
});

// Publish to a topic
await broker.publish('events', 'order.created', {
  orderId: '12345',
  total: 99.99
});
```

### Fanout Channel
Broadcast to all subscribers.

```typescript
const broadcastChannel = createChannel('announcements', {
  type: 'fanout'
});

// All subscribed agents receive the message
await broker.broadcast('announcements', {
  type: 'notification',
  payload: { message: 'System maintenance in 5 minutes' }
});
```

### Request Channel
Request/response pattern with correlation.

```typescript
const requestChannel = createRequestChannel<
  { query: string },
  { answer: string; confidence: number }
>('questions');

// Responder
broker.subscribe('qa-agent', 'questions', async (msg, ctx) => {
  const answer = await generateAnswer(msg.payload.query);
  await ctx.reply(answer);
});

// Requester - await response
const response = await broker.request('qa-agent', 'questions', {
  query: 'What is the capital of France?'
}, { timeout: 5000 });

console.log(response.answer); // "Paris"
```

### Stream Channel
Continuous message streaming.

```typescript
const streamChannel = createChannel('telemetry', {
  type: 'stream',
  options: {
    bufferSize: 1000
  }
});

// Stream consumer
broker.subscribe('monitor', 'telemetry', async (msg) => {
  updateDashboard(msg.payload);
});

// Stream producer
for (const metric of metrics) {
  await broker.send('monitor', 'telemetry', {
    type: 'notification',
    payload: metric
  });
}
```

## Message Structure

### TypedMessage

```typescript
interface TypedMessage<T> {
  id: string;                      // Unique message ID
  channel: string;                 // Channel name
  type: MessageType;               // request, response, broadcast, etc.
  from: string;                    // Sender agent ID
  to: string | string[] | '*';     // Recipient(s)
  payload: T;                      // Message data
  timestamp: Date;                 // When sent
  correlationId?: string;          // For request/response linking
  replyTo?: string;                // Reply channel
  priority: MessagePriority;       // low, normal, high, urgent
  ttl?: number;                    // Time to live in ms
  headers?: MessageHeaders;        // Custom headers
  metadata?: MessageMetadata;      // Tracking metadata
}
```

### Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `request` | Request requiring response | Task delegation |
| `response` | Reply to a request | Task results |
| `broadcast` | One-to-many notification | System announcements |
| `notification` | One-way message | Status updates |
| `heartbeat` | Health check | Agent monitoring |
| `error` | Error notification | Failure reporting |
| `handoff` | Task delegation | Agent handoff |
| `complete` | Task completion | Workflow signals |

### Message Priorities

```typescript
// Process order: urgent > high > normal > low
const priorities: MessagePriority[] = ['low', 'normal', 'high', 'urgent'];

// Urgent message - processed immediately
await broker.send('agent', 'tasks', {
  type: 'request',
  payload: { action: 'emergency-stop' },
  priority: 'urgent'
});
```

## Delivery Guarantees

### Acknowledgment

```typescript
broker.subscribe('worker', 'tasks', async (msg, context) => {
  try {
    await processMessage(msg);
    await context.acknowledge(); // Mark as processed
  } catch (error) {
    if (isRetryable(error)) {
      await context.requeue();   // Put back in queue
    } else {
      await context.reject('Permanent failure'); // Send to DLQ
    }
  }
});
```

### Retry Policy

```typescript
const channel = createChannel('important-tasks', {
  type: 'direct',
  options: {
    retryPolicy: {
      maxRetries: 5,
      initialDelay: 1000,      // Start with 1s
      maxDelay: 60000,         // Max 1 minute
      backoffMultiplier: 2     // Exponential backoff
    },
    deadLetterChannel: 'failed-tasks'
  }
});
```

### Dead Letter Queue

Messages that fail after all retries go to the dead letter channel:

```typescript
// Monitor failed messages
broker.subscribe('dlq-handler', 'failed-tasks', async (msg) => {
  console.error('Message failed:', msg);
  await alertOps(msg);
  await storeForManualReview(msg);
});
```

## Message Routing

### Basic Routing

```typescript
// Route based on message properties
broker.addRoute({
  id: 'priority-route',
  source: 'incoming',
  destination: (msg) => {
    if (msg.priority === 'urgent') return 'fast-lane';
    return 'standard-queue';
  }
});
```

### Filter-Based Routing

```typescript
broker.addRoute({
  id: 'type-router',
  source: 'events',
  destination: 'analytics',
  filter: {
    types: ['notification'],
    fromAgents: ['payment-service', 'order-service']
  }
});
```

### Transform Messages

```typescript
broker.addRoute({
  id: 'enrichment-route',
  source: 'raw-events',
  destination: 'enriched-events',
  transform: async (msg) => ({
    ...msg,
    payload: {
      ...msg.payload,
      enrichedAt: new Date(),
      source: 'transformer'
    }
  })
});
```

## Message Filtering

### Subscription Filters

```typescript
// Only receive high-priority requests from specific agents
broker.subscribe('vip-handler', 'tasks', handler, {
  filter: {
    types: ['request'],
    priorities: ['high', 'urgent'],
    fromAgents: ['premium-client-1', 'premium-client-2']
  }
});
```

### Custom Predicates

```typescript
broker.subscribe('large-order-handler', 'orders', handler, {
  filter: {
    predicate: (msg) => msg.payload.total > 1000
  }
});
```

## MessageBroker API

### Creating a Broker

```typescript
const broker = new MessageBroker({
  maxQueueSize: 10000,
  defaultTTL: 300000,  // 5 minutes
  enableMetrics: true,
  onDeadLetter: async (msg) => {
    console.error('Dead letter:', msg);
  }
});
```

### Core Methods

```typescript
// Subscribe to a channel
broker.subscribe(agentId, channel, handler, options?);

// Unsubscribe
broker.unsubscribe(subscriptionId);

// Send direct message
broker.send(toAgent, channel, message, options?);

// Broadcast to all subscribers
broker.broadcast(channel, message, options?);

// Publish to topic
broker.publish(channel, topic, payload, options?);

// Request/response
broker.request(toAgent, channel, payload, options?);

// Add routing rule
broker.addRoute(route);

// Remove routing rule
broker.removeRoute(routeId);
```

### Statistics

```typescript
const stats = broker.getStats();
console.log({
  totalMessages: stats.totalSent,
  delivered: stats.totalDelivered,
  failed: stats.totalFailed,
  avgLatency: stats.avgDeliveryTime,
  queueDepth: stats.currentQueueSize
});

// Per-channel stats
const channelStats = broker.getChannelStats('tasks');
console.log({
  subscribers: channelStats.subscriberCount,
  pending: channelStats.pendingMessages,
  throughput: channelStats.messagesPerSecond
});
```

## Patterns & Best Practices

### Request/Response with Timeout

```typescript
try {
  const response = await broker.request('agent', 'channel', payload, {
    timeout: 5000
  });
  handleResponse(response);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    handleTimeout();
  }
}
```

### Fan-Out/Fan-In

```typescript
// Scatter: Send to multiple workers
const workers = ['worker-1', 'worker-2', 'worker-3'];
const tasks = workers.map(w =>
  broker.request(w, 'tasks', { chunk: data.shift() })
);

// Gather: Collect all results
const results = await Promise.all(tasks);
const combined = aggregateResults(results);
```

### Circuit Breaker Pattern

```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
});

broker.subscribe('protected-agent', 'tasks', async (msg, ctx) => {
  if (circuitBreaker.isOpen()) {
    await ctx.requeue();
    return;
  }

  try {
    await circuitBreaker.execute(() => processMessage(msg));
    await ctx.acknowledge();
  } catch (error) {
    circuitBreaker.recordFailure();
    await ctx.reject();
  }
});
```

### Message Correlation

```typescript
// Track related messages
const correlationId = generateId();

await broker.send('step-1', 'workflow', {
  type: 'request',
  payload: { action: 'validate' },
  correlationId
});

// Later messages reference the same correlation ID
broker.subscribe('step-2', 'workflow', async (msg) => {
  if (msg.correlationId === correlationId) {
    // This is part of the same workflow
  }
});
```

## Integration with Orchestrator

The messaging system integrates seamlessly with RANA's orchestrator:

```typescript
import { createOrchestrator, MessageBroker } from '@rana/agents';

const broker = new MessageBroker();
const orchestrator = createOrchestrator({
  messageBroker: broker
});

// Agents automatically use the broker for communication
orchestrator.registerAgent({
  id: 'analyzer',
  type: 'worker',
  capabilities: ['data-analysis']
});

// Orchestrator patterns use messaging internally
await orchestrator.execute('analyze-data', {
  pattern: 'scatter-gather',
  agents: ['analyzer-1', 'analyzer-2', 'analyzer-3']
});
```

## TypeScript Types

All messaging types are fully exported:

```typescript
import type {
  TypedMessage,
  MessageHeaders,
  MessageMetadata,
  MessageEnvelope,
  DeliveryStatus,
  Acknowledgment,
  Channel,
  ChannelType,
  ChannelSchema,
  ChannelOptions,
  RetryOptions,
  Subscription,
  MessageHandler,
  HandlerContext,
  MessageFilter,
  SubscriptionOptions,
  Route,
  MessageTransform,
  RoutingTable,
  MessageBrokerOptions,
  SendOptions,
  MessageBrokerStats,
  ChannelStats,
} from '@rana/agents';
```

## Related Documentation

- [Orchestration Patterns Guide](./AGENTS_ORCHESTRATION_PATTERNS.md)
- [Agent Development Kit Guide](./AGENT_DEVELOPMENT_KIT_GUIDE.md)
- [Multi-Agent System Design](./SPECIFICATION.md)
