# Provider Reliability System

The RANA Provider Reliability System includes multiple features to ensure your application stays resilient and performant when working with LLM providers.

## Features

### Fallback System
- **Automatic Provider Switching**: Seamlessly fall back to alternative providers when one fails
- **Configurable Retry Logic**: Set retry attempts and delays per provider
- **Detailed Tracking**: Monitor which providers were attempted and why they failed
- **Cost Optimization**: Order providers by cost to minimize expenses
- **Flexible Configuration**: Configure fallback behavior globally or per-request
- **Integration with Cost Tracking**: Fallback responses still track costs accurately

### Circuit Breaker Pattern
- **Prevent Cascading Failures**: Automatically stop sending requests to failing providers
- **Automatic Recovery**: Test provider health and automatically recover when they're back online
- **Three States**: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
- **Configurable Thresholds**: Set failure counts and rates that trigger the circuit
- **Real-time Monitoring**: Track circuit state and failure rates per provider
- **Event Callbacks**: Get notified when circuits open, close, or change state

## Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  },
  fallback: {
    order: ['openai', 'anthropic', 'google'],
    onFallback: (from, to, error) => {
      console.log(`Falling back from ${from} to ${to}: ${error.message}`);
    },
  },
});

// Automatically tries providers in order until one succeeds
const response = await rana.chat('Hello, world!');
```

## Configuration Options

### Basic Configuration

```typescript
{
  fallback: {
    // Required: Provider priority order
    order: ['openai', 'anthropic', 'google'],

    // Optional: Callback when fallback occurs
    onFallback: (from, to, error) => {
      console.log(`${from} failed, trying ${to}`);
    },

    // Optional: Max retries per provider (default: 1)
    maxRetries: 2,

    // Optional: Delay between retries in ms (default: 0)
    retryDelay: 1000,

    // Optional: Track detailed attempt metadata (default: true)
    trackAttempts: true,
  }
}
```

### Per-Provider Retry Configuration

You can configure different retry behaviors for specific providers:

```typescript
import { createRana, createFallbackManager, ProviderManager } from '@rana/core';

const providerManager = new ProviderManager({
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
});

const fallbackManager = createFallbackManager(providerManager, {
  order: ['openai', 'anthropic'],
});

// Configure OpenAI with aggressive retries
fallbackManager.configureProviderRetry({
  provider: 'openai',
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
});

// Configure Anthropic with minimal retries
fallbackManager.configureProviderRetry({
  provider: 'anthropic',
  maxRetries: 1,
  retryDelay: 500, // 0.5 seconds
});
```

## Use Cases

### 1. High Availability

Ensure your application keeps working even during provider outages:

```typescript
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  },
  fallback: {
    order: ['openai', 'anthropic', 'google'],
    maxRetries: 2,
    retryDelay: 1000,
  },
});
```

### 2. Cost Optimization

Try cheaper providers first, fall back to premium ones only if needed:

```typescript
const rana = createRana({
  providers: {
    google: process.env.GOOGLE_API_KEY,      // Free during preview
    anthropic: process.env.ANTHROPIC_API_KEY, // Mid-tier pricing
    openai: process.env.OPENAI_API_KEY,       // Premium pricing
  },
  fallback: {
    order: ['google', 'anthropic', 'openai'], // Cheapest to most expensive
    onFallback: (from, to) => {
      console.log(`⚠️  Using more expensive provider: ${to}`);
    },
  },
});
```

### 3. Rate Limit Handling

Automatically switch providers when hitting rate limits:

```typescript
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fallback: {
    order: ['openai', 'anthropic'],
    onFallback: (from, to, error) => {
      if (error.message.includes('rate limit')) {
        console.log(`Rate limit hit on ${from}, switching to ${to}`);
      }
    },
  },
});
```

### 4. Monitoring and Alerting

Track fallback usage to identify provider reliability issues:

```typescript
let fallbackCount = 0;

const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fallback: {
    order: ['openai', 'anthropic'],
    onFallback: (from, to, error) => {
      fallbackCount++;

      // Send alert if fallback happens too frequently
      if (fallbackCount > 10) {
        sendAlert(`High fallback rate detected: ${from} -> ${to}`);
      }
    },
  },
});
```

## Accessing Fallback Metadata

Fallback responses include detailed metadata about the attempt:

```typescript
const response = await rana.chat('Hello!');

if ('fallbackMetadata' in response) {
  const metadata = response.fallbackMetadata;

  console.log('Provider:', metadata.successfulProvider);
  console.log('Total Attempts:', metadata.totalAttempts);
  console.log('Attempted Providers:', metadata.attemptedProviders);
  console.log('Used Fallback:', metadata.usedFallback);

  // View failures
  metadata.failures.forEach(failure => {
    console.log(`${failure.provider} failed: ${failure.error}`);
    console.log(`  at ${failure.timestamp}`);
  });
}
```

## Integration with Other Features

### Works with Cost Tracking

Fallback responses automatically integrate with RANA's cost tracking:

```typescript
const rana = createRana({
  providers: { /* ... */ },
  fallback: {
    order: ['google', 'anthropic', 'openai'],
  },
  cost_tracking: {
    enabled: true,
    log_to_console: true,
  },
});

const response = await rana.chat('Hello!');

// Cost is tracked regardless of which provider was used
console.log('Cost:', response.cost.total_cost);

// View overall cost stats
const stats = await rana.cost.stats();
console.log('Total spent:', stats.total_spent);
```

### Works with Caching

Fallback works seamlessly with RANA's caching system:

```typescript
const rana = createRana({
  providers: { /* ... */ },
  fallback: {
    order: ['openai', 'anthropic'],
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
});

// First request tries providers
const response1 = await rana.chat('What is AI?');

// Second request returns from cache (no providers called)
const response2 = await rana.chat('What is AI?');
```

### Works with Budget Enforcement

Fallback respects budget limits:

```typescript
const rana = createRana({
  providers: { /* ... */ },
  fallback: {
    order: ['openai', 'anthropic', 'google'],
  },
  cost_tracking: {
    enabled: true,
    budget: {
      limit: 10.0, // $10 limit
      period: 'daily',
      action: 'block',
    },
  },
});

// Budget is checked BEFORE attempting any provider
try {
  const response = await rana.chat('Hello!');
} catch (error) {
  if (error.name === 'RanaBudgetExceededError') {
    console.log('Budget exceeded - no providers were called');
  }
}
```

## Error Handling

When all providers fail, a comprehensive error is thrown:

```typescript
try {
  const response = await rana.chat('Hello!');
} catch (error) {
  // Error message includes all attempted providers and their failures
  console.error(error.message);
  /*
  All providers failed after 6 attempts.
  Attempted providers: openai, anthropic, google
  Failures:
    - openai: Authentication failed
    - anthropic: Rate limit exceeded
    - google: Network error
  */
}
```

## Best Practices

1. **Order by Reliability**: Put your most reliable provider first
2. **Consider Costs**: Balance reliability with cost efficiency
3. **Set Appropriate Retries**: Too many retries can increase latency
4. **Monitor Fallback Usage**: Track when fallbacks occur to identify issues
5. **Use Callbacks**: Log fallback events for debugging and monitoring
6. **Test Your Configuration**: Verify fallback works as expected

## API Reference

### FallbackConfig

```typescript
interface FallbackConfig {
  order: LLMProvider[];
  onFallback?: (from: LLMProvider, to: LLMProvider, error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  trackAttempts?: boolean;
}
```

### FallbackMetadata

```typescript
interface FallbackMetadata {
  successfulProvider: LLMProvider;
  totalAttempts: number;
  attemptedProviders: LLMProvider[];
  failures: Array<{
    provider: LLMProvider;
    error: string;
    timestamp: Date;
  }>;
  usedFallback: boolean;
}
```

### FallbackManager

```typescript
class FallbackManager {
  constructor(providerManager: ProviderManager, config: FallbackConfig);

  chat(request: RanaChatRequest): Promise<FallbackResponse>;
  configureProviderRetry(config: ProviderRetryConfig): void;
  updateConfig(config: Partial<FallbackConfig>): void;
  getConfig(): FallbackConfig;
  clearProviderRetryConfigs(): void;
}
```

## Examples

See [fallback-example.ts](../../examples/fallback-example.ts) and [circuit-breaker-example.ts](../../examples/circuit-breaker-example.ts) for complete working examples.

---

# Circuit Breaker Pattern

The Circuit Breaker prevents cascading failures by automatically stopping requests to failing providers and allowing them time to recover.

## How It Works

The circuit breaker has three states:

1. **CLOSED** (Normal Operation)
   - All requests pass through normally
   - Failures are tracked
   - If failure threshold is exceeded, circuit opens

2. **OPEN** (Failing)
   - Requests are immediately rejected with `CircuitBreakerError`
   - No requests reach the provider
   - After `resetTimeout`, circuit transitions to HALF_OPEN

3. **HALF_OPEN** (Testing)
   - Limited requests are allowed through to test if provider recovered
   - If `successThreshold` successes occur, circuit closes
   - If any failure occurs, circuit opens again

## Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 consecutive failures
    resetTimeout: 30000,       // Try recovery after 30 seconds
    onStateChange: (provider, from, to) => {
      console.log(`${provider}: ${from} -> ${to}`);
    },
  },
});

// Make requests as normal - circuit breaker handles failures automatically
try {
  const response = await rana.chat('Hello!');
} catch (error) {
  if (error.name === 'CircuitBreakerError') {
    console.log('Provider circuit is open - using fallback or waiting');
  }
}
```

## Configuration

### CircuitBreakerConfig

```typescript
interface CircuitBreakerConfig {
  // Enable/disable circuit breaker (default: true)
  enabled?: boolean;

  // Number of consecutive failures before opening circuit (default: 5)
  failureThreshold?: number;

  // Failure rate percentage (0-100) to open circuit (default: 50)
  // Example: if 50% of requests fail in the time window, open circuit
  failureRateThreshold?: number;

  // Time window in ms to calculate failure rate (default: 60000 = 1 minute)
  failureRateWindow?: number;

  // Time in ms before attempting to recover (default: 30000 = 30 seconds)
  resetTimeout?: number;

  // Number of successful requests in HALF_OPEN before closing (default: 2)
  successThreshold?: number;

  // Callback when circuit state changes
  onStateChange?: (provider: LLMProvider, from: CircuitState, to: CircuitState) => void;

  // Callback when circuit opens
  onOpen?: (provider: LLMProvider, failures: number) => void;

  // Callback when circuit closes
  onClose?: (provider: LLMProvider) => void;
}
```

## Monitoring Circuit State

### Check Individual Provider

```typescript
const state = rana.circuitBreaker.getState('anthropic');
console.log(state); // 'CLOSED' | 'OPEN' | 'HALF_OPEN'

const stats = rana.circuitBreaker.getStats('anthropic');
console.log(stats);
// {
//   state: 'CLOSED',
//   failureCount: 2,
//   successCount: 0,
//   failureRate: 15.5,
//   totalRequests: 20
// }
```

### Check All Providers

```typescript
const allStats = rana.circuitBreaker.getAllStats();
for (const [provider, stats] of Object.entries(allStats)) {
  console.log(`${provider}: ${stats.state} (${stats.failureRate}% failure rate)`);
}
```

## Manual Control

### Reset Circuit

```typescript
// Reset a specific provider's circuit (force close)
rana.circuitBreaker.reset('anthropic');

// Reset all circuits
rana.circuitBreaker.resetAll();
```

### Update Configuration

```typescript
// Change circuit breaker settings at runtime
rana.circuitBreaker.configure({
  failureThreshold: 10,
  resetTimeout: 60000,
});
```

## Integration with Fallback

Circuit breaker works seamlessly with the fallback system:

```typescript
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  },
  // Circuit breaker opens circuit when provider fails
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeout: 60000,
  },
  // Fallback tries alternative providers
  fallback: {
    order: ['anthropic', 'openai', 'google'],
  },
});

// If anthropic's circuit is open, fallback will try openai, then google
const response = await rana.chat('Hello!');
```

## Advanced: Direct Access

```typescript
// Get circuit breaker instance for advanced control
const breaker = rana.circuitBreaker.instance();

// Listen to events
breaker.on('open', (provider, failureCount) => {
  console.log(`Circuit opened for ${provider} after ${failureCount} failures`);
  // Send alert, update metrics, etc.
});

breaker.on('close', (provider) => {
  console.log(`Circuit closed for ${provider} - provider recovered`);
});

breaker.on('half-open', (provider) => {
  console.log(`Circuit testing recovery for ${provider}`);
});

// Execute custom function with circuit breaker protection
try {
  const result = await breaker.execute('anthropic', async () => {
    // Your custom API call
    return await callAnthropicAPI();
  });
} catch (error) {
  // Handle circuit breaker errors
}
```

## Best Practices

1. **Set Appropriate Thresholds**
   - Too low: Circuit opens too easily, reducing availability
   - Too high: Takes too long to detect failures
   - Recommended: 5-10 consecutive failures OR 50% failure rate

2. **Balance Reset Timeout**
   - Too short: May overwhelm recovering provider
   - Too long: Delays recovery
   - Recommended: 30-60 seconds

3. **Use with Fallback**
   - Circuit breaker detects failures
   - Fallback provides alternatives
   - Together they provide maximum resilience

4. **Monitor Circuit State**
   - Track when circuits open/close
   - Alert on repeated circuit opens
   - Use metrics to identify provider issues

5. **Test Recovery**
   - Success threshold of 2-3 requests
   - Ensures provider is truly recovered
   - Prevents premature circuit closing

## API Reference

### CircuitBreaker

```typescript
class CircuitBreaker extends EventEmitter {
  execute<T>(provider: LLMProvider, fn: () => Promise<T>): Promise<T>;

  getState(provider: LLMProvider): CircuitState;

  getStats(provider: LLMProvider): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    failureRate: number;
    totalRequests: number;
  };

  getAllStats(): Record<LLMProvider, Stats>;

  reset(provider: LLMProvider): void;
  resetAll(): void;

  configure(config: Partial<CircuitBreakerConfig>): void;
  destroy(): void;

  // Events
  on('open', (provider: LLMProvider, failureCount: number) => void): this;
  on('close', (provider: LLMProvider) => void): this;
  on('half-open', (provider: LLMProvider) => void): this;
  on('state-change', (provider: LLMProvider, from: CircuitState, to: CircuitState) => void): this;
  on('failure', (provider: LLMProvider, error: Error, failureCount: number) => void): this;
}
```

### CircuitBreakerError

```typescript
class CircuitBreakerError extends RanaError {
  constructor(provider: LLMProvider, state: CircuitState, details?: any);
}
```

## Examples

See [circuit-breaker-example.ts](../../examples/circuit-breaker-example.ts) for complete working examples.
