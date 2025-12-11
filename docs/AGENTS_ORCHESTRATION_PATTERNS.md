# Agent Orchestration Patterns Guide

RANA provides 7 built-in orchestration patterns for coordinating multi-agent workflows. This guide covers each pattern with real-world examples and best practices.

## Overview

| Pattern | Use Case | Agents | Complexity |
|---------|----------|--------|------------|
| Sequential | Step-by-step processing | 2-10 | Low |
| Parallel | Independent concurrent work | 2-50 | Low |
| Hierarchical | Delegated subtasks | 3-20 | Medium |
| Consensus | Group decisions | 3-11 | Medium |
| Pipeline | Stream processing | 3-10 | Medium |
| Scatter-Gather | Distributed aggregation | 3-100 | High |
| Saga | Distributed transactions | 3-20 | High |

## Quick Start

```typescript
import { createOrchestrator, createLLMAgent } from '@rana/agents';

// Create orchestrator
const orchestrator = createOrchestrator();

// Register agents
orchestrator.registerAgent(createLLMAgent({
  id: 'researcher',
  capabilities: ['web-search', 'summarization']
}));

orchestrator.registerAgent(createLLMAgent({
  id: 'writer',
  capabilities: ['content-generation', 'editing']
}));

// Execute with a pattern
const result = await orchestrator.execute('create-article', {
  pattern: 'sequential',
  agents: ['researcher', 'writer'],
  input: { topic: 'AI in Healthcare' }
});
```

## Pattern 1: Sequential

Agents execute one after another, each receiving the output of the previous.

```
[Agent A] → [Agent B] → [Agent C] → Result
```

### When to Use
- Multi-step workflows with dependencies
- Document processing pipelines
- Approval chains

### Configuration

```typescript
await orchestrator.execute('review-process', {
  pattern: 'sequential',
  agents: ['drafting', 'review', 'approval'],
  options: {
    stopOnError: true,      // Stop chain on any failure
    passOutputToNext: true  // Each agent gets previous output
  }
});
```

### Example: Content Pipeline

```typescript
// Define agents
const researcher = createLLMAgent({
  id: 'researcher',
  systemPrompt: 'Research and gather facts on the given topic.'
});

const writer = createLLMAgent({
  id: 'writer',
  systemPrompt: 'Write engaging content based on research.'
});

const editor = createLLMAgent({
  id: 'editor',
  systemPrompt: 'Review and polish the content for publication.'
});

// Register all
[researcher, writer, editor].forEach(a => orchestrator.registerAgent(a));

// Execute pipeline
const article = await orchestrator.execute('content-pipeline', {
  pattern: 'sequential',
  agents: ['researcher', 'writer', 'editor'],
  input: { topic: 'Sustainable Energy Trends 2025' }
});
```

### Real-World Use Cases
- **Code Review**: Linter → Reviewer → Security Scanner
- **Document Processing**: OCR → Parser → Validator → Storage
- **Customer Support**: Classifier → Router → Specialist → Follow-up

---

## Pattern 2: Parallel

Multiple agents work simultaneously on the same or different inputs.

```
          ┌─[Agent A]─┐
Input ────┼─[Agent B]─┼──── Aggregated Result
          └─[Agent C]─┘
```

### When to Use
- Independent tasks that can run concurrently
- Reducing latency on multi-part requests
- A/B testing different approaches

### Configuration

```typescript
await orchestrator.execute('multi-analysis', {
  pattern: 'parallel',
  agents: ['sentiment-analyzer', 'entity-extractor', 'summarizer'],
  options: {
    waitForAll: true,    // Wait for all agents (default)
    minSuccess: 2,       // Or: proceed with at least 2 results
    timeout: 30000       // Max wait time
  }
});
```

### Example: Multi-Modal Analysis

```typescript
const sentimentAgent = createLLMAgent({
  id: 'sentiment',
  systemPrompt: 'Analyze the sentiment of the text.'
});

const entityAgent = createLLMAgent({
  id: 'entities',
  systemPrompt: 'Extract named entities from the text.'
});

const summaryAgent = createLLMAgent({
  id: 'summary',
  systemPrompt: 'Provide a concise summary.'
});

const result = await orchestrator.execute('analyze-document', {
  pattern: 'parallel',
  agents: ['sentiment', 'entities', 'summary'],
  input: { document: longText }
});

// Result contains all outputs
console.log(result.outputs);
// {
//   sentiment: { score: 0.8, label: 'positive' },
//   entities: [{ name: 'Apple', type: 'ORG' }, ...],
//   summary: 'The document discusses...'
// }
```

### Real-World Use Cases
- **Search**: Query multiple sources simultaneously
- **Analysis**: Run different analyzers on same data
- **Translation**: Translate to multiple languages at once

---

## Pattern 3: Hierarchical

A coordinator agent delegates subtasks to worker agents.

```
         [Coordinator]
        /      |      \
  [Worker A] [Worker B] [Worker C]
```

### When to Use
- Complex tasks that need decomposition
- Dynamic task allocation
- Skill-based routing

### Configuration

```typescript
await orchestrator.execute('complex-research', {
  pattern: 'hierarchical',
  agents: ['coordinator', 'researcher-1', 'researcher-2', 'analyst'],
  options: {
    maxDepth: 3,                              // Max delegation depth
    delegationStrategy: 'capability-match'   // Or: 'round-robin', 'least-busy'
  }
});
```

### Example: Research Coordinator

```typescript
const coordinator = createLLMAgent({
  id: 'coordinator',
  type: 'coordinator',
  systemPrompt: `You are a research coordinator. Break down research
    requests into subtasks and delegate to appropriate specialists.`,
  capabilities: ['task-decomposition', 'delegation']
});

const webResearcher = createLLMAgent({
  id: 'web-researcher',
  type: 'worker',
  capabilities: ['web-search']
});

const dataAnalyst = createLLMAgent({
  id: 'data-analyst',
  type: 'worker',
  capabilities: ['data-analysis', 'statistics']
});

const reportWriter = createLLMAgent({
  id: 'report-writer',
  type: 'worker',
  capabilities: ['report-generation']
});

// Execute hierarchical workflow
const result = await orchestrator.execute('market-research', {
  pattern: 'hierarchical',
  agents: ['coordinator', 'web-researcher', 'data-analyst', 'report-writer'],
  options: {
    delegationStrategy: 'capability-match'
  },
  input: {
    task: 'Research the EV market in Europe and provide a report'
  }
});
```

### Real-World Use Cases
- **Project Management**: PM → Developers, Designers, Testers
- **Customer Service**: Triage → Specialists
- **Content Creation**: Editor → Writers, Fact-checkers, Designers

---

## Pattern 4: Consensus

Multiple agents vote or discuss to reach a collective decision.

```
  [Agent A]──┐
  [Agent B]──┼── Vote/Discuss ── [Decision]
  [Agent C]──┘
```

### When to Use
- Critical decisions requiring multiple perspectives
- Reducing bias in outputs
- Quality assurance through redundancy

### Configuration

```typescript
await orchestrator.execute('content-moderation', {
  pattern: 'consensus',
  agents: ['moderator-1', 'moderator-2', 'moderator-3'],
  options: {
    quorum: 3,                   // All must vote
    votingStrategy: 'majority',  // Or: 'unanimous', 'weighted'
  }
});
```

### Example: Content Moderation

```typescript
// Create multiple moderator agents with different prompts
const moderators = [
  createLLMAgent({
    id: 'mod-safety',
    systemPrompt: 'Focus on user safety and harmful content.'
  }),
  createLLMAgent({
    id: 'mod-accuracy',
    systemPrompt: 'Focus on factual accuracy and misinformation.'
  }),
  createLLMAgent({
    id: 'mod-policy',
    systemPrompt: 'Focus on policy compliance and terms of service.'
  })
];

moderators.forEach(m => orchestrator.registerAgent(m));

const decision = await orchestrator.execute('moderate-content', {
  pattern: 'consensus',
  agents: ['mod-safety', 'mod-accuracy', 'mod-policy'],
  options: {
    votingStrategy: 'majority',
    quorum: 3
  },
  input: { content: userSubmittedContent }
});

// decision.consensus = true/false
// decision.votes = { 'mod-safety': 'approve', ... }
// decision.confidence = 0.67 (2/3 agreed)
```

### Voting Strategies

| Strategy | Description |
|----------|-------------|
| `majority` | >50% must agree |
| `unanimous` | All must agree |
| `weighted` | Votes have different weights |

### Real-World Use Cases
- **Hiring**: Multiple interviewers vote
- **Medical Diagnosis**: Multiple AI models cross-check
- **Code Review**: Multiple reviewers must approve

---

## Pattern 5: Pipeline

Stream-based processing where each stage transforms data.

```
Input → [Stage 1] → [Stage 2] → [Stage 3] → Output
          ↓           ↓           ↓
       (buffer)    (buffer)    (buffer)
```

### When to Use
- High-throughput data processing
- ETL workflows
- Real-time stream processing

### Configuration

```typescript
await orchestrator.execute('data-pipeline', {
  pattern: 'pipeline',
  agents: ['ingester', 'transformer', 'enricher', 'loader'],
  options: {
    batchSize: 100,     // Process in batches
    bufferSize: 1000    // Buffer between stages
  }
});
```

### Example: Data Processing Pipeline

```typescript
const stages = [
  createLLMAgent({
    id: 'parser',
    systemPrompt: 'Parse raw data into structured format.'
  }),
  createLLMAgent({
    id: 'validator',
    systemPrompt: 'Validate data against schema.'
  }),
  createLLMAgent({
    id: 'enricher',
    systemPrompt: 'Enrich data with additional context.'
  }),
  createLLMAgent({
    id: 'transformer',
    systemPrompt: 'Transform data to final format.'
  })
];

stages.forEach(s => orchestrator.registerAgent(s));

// Process stream of records
const pipeline = await orchestrator.createPipeline({
  pattern: 'pipeline',
  agents: ['parser', 'validator', 'enricher', 'transformer'],
  options: { batchSize: 50 }
});

// Feed data
for (const record of dataStream) {
  pipeline.push(record);
}

// Get results
const results = await pipeline.flush();
```

### Real-World Use Cases
- **Log Processing**: Parse → Classify → Alert → Store
- **Image Processing**: Resize → Compress → Tag → Upload
- **NLP Pipeline**: Tokenize → POS Tag → NER → Sentiment

---

## Pattern 6: Scatter-Gather

Distribute work to many agents and aggregate results.

```
           ┌─[Agent 1]─┐
           │  [Agent 2] │
Scatter ───┼─   ...    ─┼── Gather → Aggregated Result
           │ [Agent N-1]│
           └─[Agent N]─┘
```

### When to Use
- Large-scale parallel processing
- MapReduce-style workloads
- Distributed search/aggregation

### Configuration

```typescript
await orchestrator.execute('distributed-search', {
  pattern: 'scatter-gather',
  agents: ['searcher-1', 'searcher-2', 'searcher-3', 'aggregator'],
  options: {
    aggregationStrategy: 'merge'  // Or: 'first', 'best'
  }
});
```

### Example: Distributed Search

```typescript
// Create multiple search agents
const searchAgents = Array.from({ length: 5 }, (_, i) =>
  createLLMAgent({
    id: `searcher-${i}`,
    systemPrompt: `Search database shard ${i} for relevant results.`
  })
);

const aggregator = createLLMAgent({
  id: 'aggregator',
  systemPrompt: 'Merge and rank search results by relevance.'
});

[...searchAgents, aggregator].forEach(a => orchestrator.registerAgent(a));

const results = await orchestrator.execute('federated-search', {
  pattern: 'scatter-gather',
  agents: [...searchAgents.map(a => a.id), 'aggregator'],
  options: {
    aggregationStrategy: 'merge'
  },
  input: { query: 'machine learning best practices' }
});
```

### Aggregation Strategies

| Strategy | Description |
|----------|-------------|
| `merge` | Combine all results |
| `first` | Use first completed result |
| `best` | Select highest-scoring result |

### Real-World Use Cases
- **Web Scraping**: Parallel fetch → Merge results
- **Price Comparison**: Query multiple sources → Best price
- **Ensemble ML**: Multiple models → Vote/average

---

## Pattern 7: Saga

Distributed transactions with compensation for failures.

```
[Step 1] → [Step 2] → [Step 3]
   ↓          ↓          ↓
[Comp 1] ← [Comp 2] ← [Comp 3]  (on failure)
```

### When to Use
- Multi-service transactions
- Operations requiring rollback capability
- Long-running workflows

### Configuration

```typescript
await orchestrator.execute('order-saga', {
  pattern: 'saga',
  agents: ['order-service', 'payment-service', 'inventory-service'],
  options: {
    compensationEnabled: true
  }
});
```

### Example: Order Processing Saga

```typescript
const orderService = createLLMAgent({
  id: 'order-service',
  capabilities: ['create-order', 'cancel-order']
});

const paymentService = createLLMAgent({
  id: 'payment-service',
  capabilities: ['charge-payment', 'refund-payment']
});

const inventoryService = createLLMAgent({
  id: 'inventory-service',
  capabilities: ['reserve-stock', 'release-stock']
});

const shippingService = createLLMAgent({
  id: 'shipping-service',
  capabilities: ['create-shipment', 'cancel-shipment']
});

// Define saga with compensation handlers
const saga = orchestrator.defineSaga('order-process', {
  steps: [
    {
      agent: 'order-service',
      action: 'create-order',
      compensation: 'cancel-order'
    },
    {
      agent: 'payment-service',
      action: 'charge-payment',
      compensation: 'refund-payment'
    },
    {
      agent: 'inventory-service',
      action: 'reserve-stock',
      compensation: 'release-stock'
    },
    {
      agent: 'shipping-service',
      action: 'create-shipment',
      compensation: 'cancel-shipment'
    }
  ]
});

// Execute - automatically handles compensation on failure
try {
  await orchestrator.executeSaga(saga, { orderId: '12345' });
} catch (error) {
  // Compensation already executed
  console.log('Order failed, all steps compensated');
}
```

### Real-World Use Cases
- **E-commerce**: Order → Payment → Inventory → Shipping
- **Travel Booking**: Flight → Hotel → Car
- **Banking**: Debit → Credit → Update ledger

---

## Agent Handoff

Transfer control between agents mid-workflow:

```typescript
// Automatic handoff based on capabilities
orchestrator.on('handoff', (event) => {
  console.log(`${event.from} → ${event.to}: ${event.reason}`);
});

// Explicit handoff
const agent = orchestrator.getAgent('support-tier1');
await agent.handoff('support-tier2', {
  reason: 'Complex technical issue',
  context: conversationHistory
});
```

## State Management

Share state across agents:

```typescript
// Set shared state
await orchestrator.setState('order-123', {
  status: 'processing',
  items: [...],
  customer: {...}
});

// Access from any agent
const state = await orchestrator.getState('order-123');

// Atomic updates
await orchestrator.updateState('order-123', (current) => ({
  ...current,
  status: 'shipped'
}));
```

## Pattern Selection Guide

```
Start
  │
  ├─ Tasks independent? ─────────→ Parallel
  │
  ├─ Tasks have dependencies? ───→ Sequential
  │
  ├─ Need task decomposition? ───→ Hierarchical
  │
  ├─ Need consensus? ────────────→ Consensus
  │
  ├─ Processing data stream? ────→ Pipeline
  │
  ├─ Large-scale distribution? ──→ Scatter-Gather
  │
  └─ Need transaction rollback? ─→ Saga
```

## Best Practices

1. **Start Simple**: Use sequential or parallel before complex patterns
2. **Monitor Agents**: Enable observability for all orchestrations
3. **Handle Failures**: Define compensation for critical workflows
4. **Set Timeouts**: Prevent hanging on unresponsive agents
5. **Test Patterns**: Unit test each pattern configuration

## Related Documentation

- [Agent Messaging Protocol](./AGENTS_MESSAGING_PROTOCOL.md)
- [Agent Development Kit Guide](./AGENT_DEVELOPMENT_KIT_GUIDE.md)
- [LLM Optimization Guide](./LLM_OPTIMIZATION_GUIDE.md)
