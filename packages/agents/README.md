# @rana/agents

Multi-agent orchestration, messaging, and lifecycle management for RANA applications.

## Installation

```bash
npm install @rana/agents
```

## Quick Start

```typescript
import { createAgent, createRana, createTool } from '@rana/agents';

// Initialize RANA
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  }
});

// Create a tool
const searchTool = createTool({
  name: 'search',
  description: 'Search the web for information',
  parameters: {
    query: { type: 'string', required: true }
  },
  handler: async ({ query }) => {
    // Implementation
    return `Results for: ${query}`;
  }
});

// Create an agent
const agent = createAgent({
  rana,
  tools: [searchTool],
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] }
}, {
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Helps with research tasks'
});

// Handle messages
const response = await agent.handle({
  user: { id: 'user-1', orgId: 'org-1', roles: ['user'] },
  message: 'What are the latest AI trends?'
});

console.log(response.content);
```

## Features

### Agent Types

```typescript
import { createLLMAgent, createBaseAgent } from '@rana/agents';

// LLM-powered agent
const llmAgent = createLLMAgent({
  id: 'assistant',
  systemPrompt: 'You are a helpful assistant.',
  model: 'claude-3-5-sonnet-20241022'
});

// Custom base agent
const customAgent = createBaseAgent({
  id: 'custom',
  onMessage: async (msg) => {
    // Custom logic
    return { content: 'Processed' };
  }
});
```

### Multi-Agent Orchestration

```typescript
import { createOrchestrator } from '@rana/agents';

const orchestrator = createOrchestrator();

// Register agents
orchestrator.registerAgent(researchAgent);
orchestrator.registerAgent(writerAgent);
orchestrator.registerAgent(reviewerAgent);

// Execute with patterns
const result = await orchestrator.execute('create-article', {
  pattern: 'sequential',
  agents: ['research', 'writer', 'reviewer'],
  input: { topic: 'AI in Healthcare' }
});
```

Supported patterns:
- `sequential` - Agents run one after another
- `parallel` - Agents run concurrently
- `hierarchical` - Coordinator delegates to workers
- `consensus` - Agents vote on decisions
- `pipeline` - Stream-based processing
- `scatter-gather` - Distribute and aggregate
- `saga` - Transactions with compensation

### Agent Messaging

```typescript
import { MessageBroker, createChannel } from '@rana/agents';

const broker = new MessageBroker();

// Create typed channel
interface TaskPayload {
  action: string;
  data: unknown;
}

const taskChannel = createChannel<TaskPayload>('tasks', {
  type: 'direct',
  options: { durable: true }
});

// Subscribe
broker.subscribe('worker', 'tasks', async (msg, ctx) => {
  console.log('Received:', msg.payload);
  await ctx.acknowledge();
});

// Send
await broker.send('worker', 'tasks', {
  type: 'request',
  payload: { action: 'process', data: {} },
  priority: 'high'
});
```

Channel types:
- `direct` - Point-to-point
- `topic` - Pub/sub with pattern matching
- `fanout` - Broadcast to all
- `request` - Request/response
- `stream` - Continuous streaming

### Security

```typescript
import { PiiDetector, InjectionDetector, RateLimiter } from '@rana/agents';

// PII detection
const piiDetector = new PiiDetector();
const findings = await piiDetector.detect(text);

// Injection detection
const injectionDetector = new InjectionDetector();
const isSafe = await injectionDetector.check(input);

// Rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000
});
await rateLimiter.check(userId);
```

### Observability

```typescript
import { Tracer, Metrics, AuditLogger } from '@rana/agents';

// Distributed tracing
const tracer = new Tracer();
const span = tracer.startSpan('agent.process');
// ... work
span.end();

// Metrics
const metrics = new Metrics();
metrics.increment('agent.requests');
metrics.timing('agent.latency', 150);

// Audit logging
const audit = new AuditLogger();
audit.log({
  action: 'agent.message',
  actor: 'user-1',
  resource: 'agent-1',
  details: { message: 'Hello' }
});
```

### Presets

```typescript
import { presets } from '@rana/agents';

// Chat agent
const chatAgent = presets.chatAgent({
  name: 'Support Bot',
  systemPrompt: 'You are a customer support agent.'
});

// RAG QA agent
const ragAgent = presets.ragQAAgent({
  name: 'Knowledge Bot',
  vectorStore: myVectorStore
});

// Task agent
const taskAgent = presets.taskAgent({
  name: 'Task Executor',
  tools: [myTool1, myTool2]
});
```

## API Reference

### Core

| Export | Description |
|--------|-------------|
| `createAgent` | Create a new agent |
| `createLLMAgent` | Create LLM-powered agent |
| `createBaseAgent` | Create custom agent |
| `createTool` | Define agent tool |
| `createRana` | Initialize RANA runtime |

### Orchestration

| Export | Description |
|--------|-------------|
| `createOrchestrator` | Create orchestrator |
| `MessageBroker` | Message broker |
| `createChannel` | Create message channel |
| `createRequestChannel` | Request/response channel |
| `MessageBuilders` | Message construction helpers |

### Security

| Export | Description |
|--------|-------------|
| `PiiDetector` | Detect PII in text |
| `InjectionDetector` | Detect prompt injection |
| `RateLimiter` | Rate limit requests |
| `OutputValidator` | Validate agent output |

### Observability

| Export | Description |
|--------|-------------|
| `Tracer` | Distributed tracing |
| `Metrics` | Metrics collection |
| `AuditLogger` | Audit logging |

## Documentation

- [Agent Messaging Protocol](../../docs/AGENTS_MESSAGING_PROTOCOL.md)
- [Orchestration Patterns Guide](../../docs/AGENTS_ORCHESTRATION_PATTERNS.md)
- [Agent Development Kit Guide](../../docs/AGENT_DEVELOPMENT_KIT_GUIDE.md)
- [Security Framework](../../docs/SECURITY_FRAMEWORK_GUIDE.md)

## License

MIT
