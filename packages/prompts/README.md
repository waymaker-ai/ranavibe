# @rana/prompts

Enterprise-grade prompt management with versioning, A/B testing, and analytics.

## Features

- **Prompt Registry** - Store, version, and manage prompts
- **A/B Testing** - Run experiments to optimize prompts
- **Analytics** - Track execution metrics and costs
- **React Hooks** - Easy integration with React apps
- **Optimization** - Get suggestions to improve prompts

## Installation

```bash
npm install @rana/prompts
```

## Quick Start

```typescript
import { PromptManager } from '@rana/prompts';

// Initialize
const pm = new PromptManager({
  workspace: 'my-app',
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
});

// Register a prompt
await pm.register('greeting', {
  template: 'Hello {{name}}, how can I help you today?',
  variables: ['name'],
  description: 'Greet users by name',
});

// Execute
const result = await pm.execute('greeting', {
  variables: { name: 'John' },
});

console.log(result.response);
// "Hello John, how can I help you today?"
```

## Prompt Management

### Register Prompts

```typescript
await pm.register('summarize', {
  name: 'Article Summarizer',
  template: `Summarize the following article in {{style}} style:

{{content}}

Key points to cover:
- Main argument
- Supporting evidence
- Conclusion`,
  variables: ['style', 'content'],
  tags: ['summarization', 'content'],
  model: 'gpt-4o',
  maxTokens: 500,
  temperature: 0.3,
});
```

### Update Prompts (Creates New Version)

```typescript
await pm.update('summarize', {
  template: `You are an expert summarizer. Create a {{style}} summary:

Content: {{content}}

Include:
1. Main thesis
2. Key evidence
3. Conclusion`,
  changelog: 'Improved structure and instructions',
});
```

### Version History

```typescript
// Get all versions
const versions = await pm.getVersions('summarize');
// [{ version: '1.0.0', ... }, { version: '1.0.1', ... }]

// Use specific version
const result = await pm.execute('summarize', {
  variables: { style: 'brief', content: article },
  version: '1.0.0', // Use old version
});

// Rollback to previous version
await pm.rollback('summarize', '1.0.0');
```

## A/B Testing

Test prompt variants to find the best performer:

```typescript
// Create A/B test
const testId = await pm.createABTest('greeting', {
  name: 'Greeting Style Test',
  variants: [
    {
      name: 'formal',
      template: 'Good day, {{name}}. How may I assist you?',
      traffic: 50,
    },
    {
      name: 'casual',
      template: 'Hey {{name}}! What can I help with?',
      traffic: 50,
    },
  ],
  metric: 'user_satisfaction',
  minSampleSize: 100,
  maxDuration: 14, // days
});

// Start test
await pm.startABTest(testId);

// Execute with A/B test
const result = await pm.execute('greeting', {
  variables: { name: 'John' },
  abTestId: testId,
  userId: 'user-123', // For consistent assignment
});

// Record conversions
if (userWasSatisfied) {
  await pm.recordConversion(testId, result.abTest!.variant);
}

// Get results
const results = await pm.getABTestResults(testId);
console.log(results);
// {
//   testId: 'test_123',
//   status: 'running',
//   confidence: 0.87,
//   variants: [
//     { name: 'casual', metrics: { conversionRate: 0.68 }, improvement: 15 },
//     { name: 'formal', metrics: { conversionRate: 0.59 }, improvement: 0 },
//   ],
//   recommendation: 'Collect more data...'
// }
```

## Analytics

Track prompt performance and costs:

```typescript
// Get prompt analytics
const analytics = await pm.getAnalytics('greeting', 'week');
console.log(analytics);
// {
//   promptId: 'greeting',
//   period: 'week',
//   executions: 1523,
//   uniqueUsers: 892,
//   avgLatency: 234,
//   p95Latency: 512,
//   avgCost: 0.0012,
//   totalCost: 1.83,
//   successRate: 99.2,
//   errorRate: 0.8,
//   errorsByType: { 'rate_limit': 12 },
//   topVariables: [{ variable: 'name', count: 1523 }],
//   hourlyDistribution: [23, 12, 8, ...],
// }

// Get usage report
const report = await pm.getUsageReport();
console.log(report);
// {
//   totalPrompts: 15,
//   totalExecutions: 45000,
//   totalCost: 127.50,
//   avgLatency: 189,
//   topPrompts: [...],
//   costByProvider: { 'openai': 95.00, 'anthropic': 32.50 },
//   executionsByDay: [...],
// }
```

## Prompt Optimization

Get suggestions to improve your prompts:

```typescript
import { PromptOptimizer } from '@rana/prompts';

const optimizer = new PromptOptimizer({
  costThreshold: 0.01,
  latencyThreshold: 2000,
});

const prompt = await pm.get('summarize');
const analytics = await pm.getAnalytics('summarize', 'week');

const suggestions = await optimizer.analyze(prompt, analytics);
// [
//   {
//     type: 'cost',
//     severity: 'high',
//     message: 'Average cost exceeds threshold. Consider smaller model.',
//     currentValue: 'gpt-4o',
//     suggestedValue: 'gpt-4o-mini',
//     estimatedImprovement: '50-80% cost reduction',
//   },
//   {
//     type: 'quality',
//     severity: 'medium',
//     message: 'No role definition found. Adding a clear role can improve quality.',
//     suggestedValue: 'Add "You are a [role]..." at the start',
//   },
// ]
```

## React Integration

### Setup Provider

```tsx
import { PromptProvider } from '@rana/prompts';

function App() {
  return (
    <PromptProvider
      config={{
        workspace: 'my-app',
        defaultProvider: 'openai',
        defaultModel: 'gpt-4o-mini',
      }}
    >
      <MyComponent />
    </PromptProvider>
  );
}
```

### usePrompt Hook

```tsx
import { usePrompt } from '@rana/prompts';

function ChatInput() {
  const { execute, loading, error, response } = usePrompt('chat');

  const handleSubmit = async (message: string) => {
    await execute({ message });
  };

  return (
    <div>
      <input onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e.target.value)} />
      {loading && <Spinner />}
      {error && <Error message={error.message} />}
      {response && <Message content={response} />}
    </div>
  );
}
```

### usePromptStream Hook

```tsx
import { usePromptStream } from '@rana/prompts';

function StreamingChat() {
  const { execute, content, isStreaming, stop } = usePromptStream('chat');

  return (
    <div>
      <button onClick={() => execute({ message: 'Tell me a story' })}>
        Generate
      </button>
      {isStreaming && <button onClick={stop}>Stop</button>}
      <div>{content}</div>
    </div>
  );
}
```

### usePromptABTest Hook

```tsx
import { usePromptABTest } from '@rana/prompts';

function ABTestChat() {
  const { execute, recordConversion, results, currentVariant } = usePromptABTest('test-123');

  const handleSend = async (message: string) => {
    await execute('chat', { message }, 'user-id');
  };

  const handleFeedback = (positive: boolean) => {
    if (positive && currentVariant) {
      recordConversion(currentVariant);
    }
  };

  return (
    <div>
      <Chat onSend={handleSend} />
      <FeedbackButtons onFeedback={handleFeedback} />
      {results && <ABTestResults data={results} />}
    </div>
  );
}
```

## Export/Import

```typescript
// Export all prompts and analytics
const data = await pm.export();
await fs.writeFile('prompts-backup.json', JSON.stringify(data));

// Import prompts
const imported = JSON.parse(await fs.readFile('prompts-backup.json'));
await pm.import(imported);
```

## API Reference

### PromptManager

| Method | Description |
|--------|-------------|
| `register(id, config)` | Register a new prompt |
| `get(id, version?)` | Get a prompt by ID |
| `update(id, updates)` | Update a prompt (creates new version) |
| `execute(id, options)` | Execute a prompt |
| `list(filters?)` | List all prompts |
| `delete(id)` | Delete a prompt |
| `getVersions(id)` | Get version history |
| `rollback(id, version)` | Rollback to a version |
| `createABTest(id, config)` | Create A/B test |
| `startABTest(testId)` | Start A/B test |
| `getABTestResults(testId)` | Get test results |
| `recordConversion(testId, variantId, value?)` | Record conversion |
| `getAnalytics(id, period)` | Get analytics |
| `getUsageReport()` | Get usage report |
| `export()` | Export all data |
| `import(data)` | Import data |

### React Hooks

| Hook | Description |
|------|-------------|
| `usePrompt(promptId)` | Execute prompts with states |
| `usePromptStream(promptId)` | Streaming execution |
| `usePromptABTest(testId)` | A/B test execution |
| `usePromptAnalytics(promptId, period)` | Analytics data |
| `usePromptVersions(promptId)` | Version history |

## Best Practices

1. **Use descriptive IDs**: `user-greeting`, `article-summarize`, `code-review`
2. **Add tags**: Makes filtering and organization easier
3. **Document variables**: Include descriptions in metadata
4. **Version thoughtfully**: Use changelog for significant changes
5. **A/B test carefully**: Ensure statistical significance before deciding
6. **Monitor costs**: Set up alerts for high-cost prompts
7. **Cache when possible**: Reduce costs with response caching

## License

MIT
