# Token Usage Analytics

Comprehensive token usage tracking and analytics for RANA observability.

## Features

- **Real-time token tracking**: Track input, output, and total tokens for every request
- **Usage aggregation**: Analyze usage by provider, model, and time periods
- **Cost analysis**: Detailed cost breakdowns and per-token calculations
- **Time-based queries**: Hourly, daily, and custom time range analysis
- **Flexible persistence**: In-memory or file-based storage
- **Auto-save**: Optional automatic persistence with configurable intervals
- **Export/Import**: Save and restore analytics data as JSON
- **Integration ready**: Works seamlessly with existing CostTracker

## Installation

The TokenAnalytics module is part of `@rana/core`:

```typescript
import {
  TokenAnalytics,
  createMemoryAnalytics,
  createFileAnalytics,
  createAutoSaveAnalytics
} from '@rana/core';
```

## Quick Start

### Basic Usage (In-Memory)

```typescript
import { createRana, createMemoryAnalytics } from '@rana/core';

// Create analytics tracker
const analytics = createMemoryAnalytics();

// Create RANA client
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

// Make requests
const response = await rana.chat('Hello, world!');

// Track the response
await analytics.track(response);

// Get summary
const summary = analytics.getSummary();
console.log('Total tokens:', summary.totalTokens);
console.log('Total cost:', summary.totalCost);
```

### File-Based Persistence

```typescript
import { createFileAnalytics } from '@rana/core';

const analytics = createFileAnalytics('./analytics.json', {
  maxRecords: 1000,
  enableAutoCleanup: true,
  cleanupAfterDays: 30,
});

// Load previous data
await analytics.load();

// Track responses
await analytics.track(response);

// Data is automatically saved to file
```

### Auto-Save with Intervals

```typescript
import { createAutoSaveAnalytics } from '@rana/core';

// Auto-save every 60 seconds
const analytics = createAutoSaveAnalytics(
  './analytics.json',
  60000, // 60 seconds
  { maxRecords: 500 }
);

// Track responses - they'll be saved automatically
await analytics.track(response);

// Clean up when done
analytics.destroy();
```

## API Reference

### Core Methods

#### `track(response: RanaChatResponse): Promise<void>`

Track a single response from RANA.

```typescript
const response = await rana.chat('Hello!');
await analytics.track(response);
```

#### `trackBatch(responses: RanaChatResponse[]): Promise<void>`

Track multiple responses at once.

```typescript
const responses = await Promise.all([
  rana.chat('Question 1'),
  rana.chat('Question 2'),
  rana.chat('Question 3'),
]);

await analytics.trackBatch(responses);
```

### Query Methods

#### `getSummary(timeRange?: TimeRange): AnalyticsSummary`

Get comprehensive analytics summary.

```typescript
const summary = analytics.getSummary();

console.log({
  totalTokens: summary.totalTokens,
  totalCost: summary.totalCost,
  totalRequests: summary.totalRequests,
  avgTokensPerRequest: summary.avgTokensPerRequest,
  avgCostPerRequest: summary.avgCostPerRequest,
  cacheHitRate: summary.cacheHitRate,
  topProvider: summary.topProvider,
  topModel: summary.topModel,
});
```

#### `getUsageByProvider(timeRange?: TimeRange): UsageByProvider[]`

Get usage statistics grouped by provider.

```typescript
const byProvider = analytics.getUsageByProvider();

byProvider.forEach(provider => {
  console.log(`${provider.provider}:`);
  console.log(`  Tokens: ${provider.totalTokens}`);
  console.log(`  Cost: $${provider.totalCost}`);
  console.log(`  Requests: ${provider.requestCount}`);
  console.log(`  Avg tokens/request: ${provider.avgTokensPerRequest}`);
});
```

#### `getUsageByModel(timeRange?: TimeRange): UsageByModel[]`

Get usage statistics grouped by model.

```typescript
const byModel = analytics.getUsageByModel();

byModel.forEach(model => {
  console.log(`${model.provider}/${model.model}:`);
  console.log(`  Tokens: ${model.totalTokens}`);
  console.log(`  Cost: $${model.totalCost}`);
});
```

#### `getDailyUsage(days: number = 7): DailyUsage[]`

Get daily usage for the last N days.

```typescript
const daily = analytics.getDailyUsage(7);

daily.forEach(day => {
  console.log(`${day.date}:`);
  console.log(`  Tokens: ${day.totalTokens}`);
  console.log(`  Cost: $${day.totalCost}`);
  console.log(`  Requests: ${day.requestCount}`);
  console.log(`  Providers:`, day.providers);
});
```

#### `getHourlyUsage(hours: number = 24): HourlyUsage[]`

Get hourly usage aggregation.

```typescript
const hourly = analytics.getHourlyUsage(24);

hourly.forEach(hour => {
  console.log(`${hour.hour.toISOString()}:`);
  console.log(`  Tokens: ${hour.totalTokens}`);
  console.log(`  Requests: ${hour.requestCount}`);
});
```

#### `getTopModels(limit: number = 5, timeRange?: TimeRange): TopModel[]`

Get top N models by usage.

```typescript
const topModels = analytics.getTopModels(5);

topModels.forEach((model, i) => {
  console.log(`${i + 1}. ${model.provider}/${model.model}`);
  console.log(`   Tokens: ${model.totalTokens} (${model.percentage}%)`);
  console.log(`   Cost: $${model.totalCost}`);
});
```

#### `getCostBreakdown(timeRange?: TimeRange): CostBreakdownItem[]`

Get detailed cost breakdown by provider and model.

```typescript
const breakdown = analytics.getCostBreakdown();

breakdown.forEach(item => {
  console.log(`${item.provider}/${item.model}:`);
  console.log(`  Input:  $${item.inputCost} (${item.inputTokens} tokens)`);
  console.log(`  Output: $${item.outputCost} (${item.outputTokens} tokens)`);
  console.log(`  Total:  $${item.totalCost}`);
  console.log(`  Cost/Token: $${item.costPerToken}`);
  console.log(`  % of Total: ${item.percentage}%`);
});
```

#### `getTotalTokens(timeRange?: TimeRange): { total, input, output }`

Get total tokens used.

```typescript
const tokens = analytics.getTotalTokens();
console.log('Total:', tokens.total);
console.log('Input:', tokens.input);
console.log('Output:', tokens.output);
```

#### `getAverageTokensPerRequest(timeRange?: TimeRange): number`

Get average tokens per request.

```typescript
const avg = analytics.getAverageTokensPerRequest();
console.log(`Average: ${avg} tokens/request`);
```

### Time Range Queries

All query methods accept an optional `TimeRange` parameter:

```typescript
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

const timeRange = {
  start: oneHourAgo,
  end: now,
};

const summary = analytics.getSummary(timeRange);
const byProvider = analytics.getUsageByProvider(timeRange);
const breakdown = analytics.getCostBreakdown(timeRange);
```

### Persistence Methods

#### `save(): Promise<void>`

Manually save analytics data to file (file-based only).

```typescript
await analytics.save();
```

#### `load(): Promise<void>`

Load analytics data from file (file-based only).

```typescript
await analytics.load();
```

#### `export(): string`

Export analytics data as JSON string.

```typescript
const json = analytics.export();
await fs.writeFile('backup.json', json);
```

#### `import(jsonData: string): void`

Import analytics data from JSON string.

```typescript
const json = await fs.readFile('backup.json', 'utf-8');
analytics.import(json);
```

### Utility Methods

#### `getRecordCount(): number`

Get total number of tracked records.

```typescript
console.log(`Tracked ${analytics.getRecordCount()} requests`);
```

#### `getRecords(timeRange?: TimeRange): TokenUsageRecord[]`

Get all records (optionally filtered by time range).

```typescript
const records = analytics.getRecords();
```

#### `clear(): void`

Clear all analytics data.

```typescript
analytics.clear();
```

#### `cleanupOldRecords(): number`

Manually cleanup old records based on `cleanupAfterDays` config.

```typescript
const removed = analytics.cleanupOldRecords();
console.log(`Removed ${removed} old records`);
```

#### `destroy(): void`

Stop auto-save interval and cleanup resources.

```typescript
analytics.destroy();
```

## Configuration

### TokenAnalyticsConfig

```typescript
interface TokenAnalyticsConfig {
  persistence?: PersistenceOptions;
  maxRecords?: number; // max records to keep (0 = unlimited)
  enableAutoCleanup?: boolean; // auto-cleanup old records
  cleanupAfterDays?: number; // days to keep (default: 30)
}
```

### PersistenceOptions

```typescript
interface PersistenceOptions {
  type: 'memory' | 'file';
  filePath?: string; // for file-based persistence
  autoSave?: boolean; // auto-save on each track()
  saveInterval?: number; // auto-save interval in ms
}
```

## Examples

### 1. Track and Analyze Usage

```typescript
import { createRana, createMemoryAnalytics } from '@rana/core';

const rana = createRana({ /* config */ });
const analytics = createMemoryAnalytics();

// Make requests
for (let i = 0; i < 10; i++) {
  const response = await rana.chat(`Question ${i + 1}`);
  await analytics.track(response);
}

// Analyze
const summary = analytics.getSummary();
console.log('Total cost:', summary.totalCost);
console.log('Avg cost/request:', summary.avgCostPerRequest);

const topModels = analytics.getTopModels(3);
console.log('Top 3 models:', topModels);
```

### 2. Monitor Daily Usage

```typescript
const analytics = createFileAnalytics('./analytics.json');
await analytics.load();

// Get last 30 days
const daily = analytics.getDailyUsage(30);

// Find most expensive day
const mostExpensive = daily.reduce((max, day) =>
  day.totalCost > max.totalCost ? day : max
);

console.log('Most expensive day:', mostExpensive.date);
console.log('Cost:', mostExpensive.totalCost);
```

### 3. Cost Analysis

```typescript
const analytics = createMemoryAnalytics();

// Track responses...

// Get detailed breakdown
const breakdown = analytics.getCostBreakdown();

// Calculate total input vs output cost
const totals = breakdown.reduce(
  (acc, item) => ({
    input: acc.input + item.inputCost,
    output: acc.output + item.outputCost,
  }),
  { input: 0, output: 0 }
);

console.log('Input cost:', totals.input);
console.log('Output cost:', totals.output);
console.log('Ratio:', totals.output / totals.input);
```

### 4. Export and Backup

```typescript
// Export current analytics
const json = analytics.export();

// Save to file
await fs.writeFile('analytics-backup.json', json);

// Later, restore from backup
const backup = await fs.readFile('analytics-backup.json', 'utf-8');
const newAnalytics = createMemoryAnalytics();
newAnalytics.import(backup);
```

### 5. Integration with CostTracker

```typescript
import { createRana, createMemoryAnalytics } from '@rana/core';

const rana = createRana({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
  cost_tracking: {
    enabled: true,
    log_to_console: true,
    budget: {
      limit: 10.0,
      period: 'daily',
      action: 'warn',
    },
  },
});

const analytics = createMemoryAnalytics();

// Make requests
const response = await rana.chat('Hello!');

// Track in analytics
await analytics.track(response);

// Both CostTracker (internal) and TokenAnalytics are tracking
// Analytics provides more detailed querying capabilities
const summary = analytics.getSummary();
console.log('Analytics summary:', summary);
```

## Best Practices

1. **Choose the right persistence**:
   - Use in-memory for short-lived processes or testing
   - Use file-based for long-running applications
   - Use auto-save for production environments

2. **Set appropriate limits**:
   - Configure `maxRecords` to prevent unbounded memory growth
   - Enable `enableAutoCleanup` for long-running applications
   - Adjust `cleanupAfterDays` based on your retention needs

3. **Regular backups**:
   - Export analytics data periodically
   - Store backups in a separate location
   - Consider versioning your analytics data

4. **Monitor performance**:
   - Track analytics overhead with time range queries
   - Use `getRecordCount()` to monitor data growth
   - Clean up old records regularly

5. **Analyze trends**:
   - Use `getDailyUsage()` to identify usage patterns
   - Use `getTopModels()` to optimize model selection
   - Use `getCostBreakdown()` to identify cost optimization opportunities

## TypeScript Types

All types are fully typed and exported:

```typescript
import type {
  TokenUsageRecord,
  TimeRange,
  UsageByProvider,
  UsageByModel,
  HourlyUsage,
  DailyUsage,
  TopModel,
  CostBreakdownItem,
  AnalyticsSummary,
  PersistenceOptions,
  TokenAnalyticsConfig,
} from '@rana/core';
```

## Integration with Existing Systems

TokenAnalytics is designed to work alongside the existing RANA cost tracking:

- **CostTracker**: Built-in budget enforcement and basic tracking
- **TokenAnalytics**: Advanced querying, time-based analysis, and persistence

Use both together for comprehensive cost management and analytics.

## License

Part of the RANA project. See main LICENSE file.
