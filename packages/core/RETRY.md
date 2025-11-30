# Retry with Exponential Backoff

RANA Core includes a robust retry system with exponential backoff, jitter, and intelligent error classification to handle transient failures gracefully.

## Features

- **Exponential Backoff**: Delays increase exponentially between retry attempts
- **Jitter**: Adds randomness to prevent thundering herd problems
- **Intelligent Error Classification**: Automatically detects which errors are retryable
- **Provider-Specific Defaults**: Optimized retry configurations for each LLM provider
- **Configurable**: Full control over retry behavior
- **Metadata Tracking**: Detailed information about retry attempts
- **Integration**: Works seamlessly with existing RANA features (caching, fallback, etc.)

## Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryOn: ['rate_limit', 'timeout', 'server_error'],
  },
});

const response = await rana.chat('Hello!');

// Check if retries were needed
if (response.retry) {
  console.log(`Request succeeded after ${response.retry.retryCount} retries`);
  console.log(`Total retry time: ${response.retry.totalRetryTime}ms`);
}
```

## Configuration

### Basic Configuration

```typescript
const rana = createRana({
  providers: { /* ... */ },
  retry: {
    enabled: true,              // Enable/disable retry (default: true)
    maxRetries: 3,              // Maximum retry attempts (default: 3)
    baseDelay: 1000,            // Base delay in ms (default: 1000)
    maxDelay: 30000,            // Maximum delay in ms (default: 30000)
    jitter: true,               // Add jitter (default: true)
    backoffMultiplier: 2,       // Backoff multiplier (default: 2)
    retryOn: [                  // Which errors to retry (default)
      'rate_limit',
      'timeout',
      'server_error',
      'network_error',
    ],
  },
});
```

### Retryable Error Types

The following error types can be retried:

- **`rate_limit`**: Rate limit errors (429 status code)
- **`timeout`**: Request timeout errors
- **`server_error`**: Server errors (5xx status codes)
- **`network_error`**: Network connectivity issues
- **`service_unavailable`**: Service temporarily unavailable (503)

### Provider-Specific Configurations

Each provider has optimized default retry settings:

```typescript
// Anthropic defaults
{
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 60000,
  retryOn: ['rate_limit', 'timeout', 'server_error', 'service_unavailable']
}

// OpenAI defaults
{
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 60000,
  retryOn: ['rate_limit', 'timeout', 'server_error']
}

// Google defaults
{
  maxRetries: 3,
  baseDelay: 500,
  maxDelay: 30000,
  retryOn: ['rate_limit', 'timeout', 'server_error']
}

// Ollama defaults (local models)
{
  maxRetries: 2,
  baseDelay: 2000,
  maxDelay: 10000,
  retryOn: ['network_error', 'timeout', 'service_unavailable']
}
```

These defaults are automatically applied and can be overridden with your custom configuration.

## Advanced Usage

### Custom Retry Logic

```typescript
const rana = createRana({
  providers: { /* ... */ },
  retry: {
    maxRetries: 5,
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      if (error.code === 'RATE_LIMIT' && attempt < 3) {
        return true;
      }
      if (error.message.includes('temporary')) {
        return true;
      }
      return false;
    },
    onRetry: (error, attempt, delay) => {
      // Custom callback before each retry
      console.log(`Retry ${attempt} after ${delay}ms`);
      console.log(`Error: ${error.message}`);
    },
  },
});
```

### Disable Retry for Specific Requests

Retry is enabled globally but you can control it:

```typescript
// Disable retry system-wide
const rana = createRana({
  retry: {
    enabled: false,
  },
});

// Or use maxRetries: 0 to disable for this config
const rana = createRana({
  retry: {
    maxRetries: 0,
  },
});
```

### Inspect Retry Metadata

```typescript
const response = await rana.chat('Hello!');

if (response.retry) {
  console.log('Retry Information:');
  console.log('  Attempts:', response.retry.retryCount);
  console.log('  Total Time:', response.retry.totalRetryTime, 'ms');
  console.log('  Delays:', response.retry.retryDelays);
  console.log('  Last Error:', response.retry.lastRetryError);
}
```

### Exponential Backoff Calculation

The delay between retries is calculated as:

```
delay = baseDelay * (backoffMultiplier ^ attempt)
delay = min(delay, maxDelay)

// With jitter (default):
delay = delay * (0.5 + random(0, 1))
```

Example with `baseDelay=1000`, `backoffMultiplier=2`, `maxDelay=30000`:
- Attempt 0: 1000ms (1s)
- Attempt 1: 2000ms (2s)
- Attempt 2: 4000ms (4s)
- Attempt 3: 8000ms (8s)
- Attempt 4: 16000ms (16s)
- Attempt 5+: 30000ms (30s max)

With jitter, each delay is randomized between 50% and 150% of the calculated value.

## Error Classification

The retry system automatically classifies errors:

```typescript
import { classifyError } from '@rana/core';

const error = new Error('Rate limit exceeded');
error.status = 429;

const errorType = classifyError(error);
// Returns: 'rate_limit'
```

### Classification Rules

1. **RANA Error Types**: `RanaRateLimitError`, `RanaNetworkError`, etc.
2. **HTTP Status Codes**: 429 (rate limit), 5xx (server errors), 408 (timeout)
3. **Error Messages**: Pattern matching on error messages
4. **Custom Classification**: Via `shouldRetry` callback

## Combining with Other Features

### Retry + Fallback

```typescript
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  retry: {
    maxRetries: 2,
    retryOn: ['rate_limit', 'timeout'],
  },
  fallback: {
    enabled: true,
    providers: ['anthropic', 'openai'],
  },
});

// Will retry with exponential backoff on rate limits/timeouts
// If all retries fail, will fallback to OpenAI
```

### Retry + Caching

```typescript
const rana = createRana({
  retry: {
    enabled: true,
    maxRetries: 3,
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
});

// Retries only happen on cache miss
// Successful responses are cached
```

### Retry + Budget

```typescript
const rana = createRana({
  retry: {
    enabled: true,
    maxRetries: 3,
  },
  cost_tracking: {
    enabled: true,
    budget: {
      limit: 10.0,
      period: 'daily',
      action: 'block',
    },
  },
});

// Budget is checked before each request (including retries)
// Retries won't cause budget overruns
```

## Utility Functions

### Standalone Retry Wrapper

Use the retry system independently:

```typescript
import { withRetry } from '@rana/core';

async function myApiCall() {
  // Your API call here
}

const { result, metadata } = await withRetry(myApiCall, {
  maxRetries: 3,
  baseDelay: 1000,
  retryOn: ['rate_limit', 'timeout'],
});

console.log('Result:', result);
console.log('Retries:', metadata.retryCount);
```

### Create Retry Wrapper

```typescript
import { createRetryWrapper } from '@rana/core';

const retryFn = createRetryWrapper({
  maxRetries: 5,
  baseDelay: 2000,
});

const result1 = await retryFn(() => apiCall1());
const result2 = await retryFn(() => apiCall2());
```

### Error Classification

```typescript
import { classifyError, shouldRetryError } from '@rana/core';

const error = new Error('Service unavailable');
const errorType = classifyError(error);

const config = {
  maxRetries: 3,
  retryOn: ['rate_limit', 'server_error'],
};

if (shouldRetryError(error, config, 0)) {
  // Error should be retried
}
```

## Best Practices

1. **Use Provider Defaults**: Start with provider-specific defaults and adjust as needed
2. **Enable Jitter**: Prevents thundering herd when multiple requests retry simultaneously
3. **Set Reasonable Limits**: Balance between resilience and user experience
4. **Monitor Retry Rates**: Track `response.retry` metadata to identify problematic endpoints
5. **Combine with Fallback**: Use retry for transient failures, fallback for persistent ones
6. **Budget-Aware**: Retries count against your budget, configure accordingly
7. **Custom Conditions**: Use `shouldRetry` for application-specific retry logic

## Examples

See [examples/retry-example.ts](./examples/retry-example.ts) for complete examples:

- Basic retry usage
- Custom retry configuration
- Provider-specific settings
- Disabling retry
- Combining with fallback

## API Reference

### Types

```typescript
export type RetryableErrorType =
  | 'rate_limit'
  | 'timeout'
  | 'server_error'
  | 'network_error'
  | 'service_unavailable';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryOn: RetryableErrorType[];
  jitter: boolean;
  backoffMultiplier: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

export interface RetryMetadata {
  retryCount: number;
  totalRetryTime: number;
  succeeded: boolean;
  retryDelays: number[];
  lastRetryError?: string;
}

export interface RetryResult<T> {
  result: T;
  metadata: RetryMetadata;
}
```

### Functions

- `withRetry<T>(fn, config)`: Execute function with retry logic
- `createRetryWrapper(config)`: Create reusable retry wrapper
- `classifyError(error)`: Classify error type
- `shouldRetryError(error, config, attempt)`: Check if error should be retried
- `calculateDelay(attempt, config)`: Calculate retry delay
- `getProviderRetryConfig(provider)`: Get provider-specific defaults

## Performance Considerations

- **Latency Impact**: Retries add latency. Monitor `response.latency_ms` and `response.retry.totalRetryTime`
- **Cost Impact**: Failed attempts may still incur costs (provider-dependent)
- **Throughput**: Excessive retries can reduce overall throughput
- **Rate Limits**: Aggressive retry can trigger rate limits. Use jitter and reasonable delays

## Troubleshooting

### Requests failing without retry

Check:
1. `retry.enabled` is `true`
2. Error type is in `retry.retryOn` list
3. `maxRetries` > 0
4. Error is retryable (not auth errors, 4xx client errors)

### Too many retries

Adjust:
1. Reduce `maxRetries`
2. Increase `baseDelay` and `maxDelay`
3. Narrow `retryOn` to specific error types
4. Use custom `shouldRetry` logic

### Retries not showing in metadata

`response.retry` is only populated when `retryCount > 0`. First-attempt successes won't have retry metadata.

## Related Documentation

- [Fallback System](./FALLBACK.md) - Automatic provider fallback
- [Circuit Breaker](./CIRCUIT_BREAKER.md) - Prevent cascading failures
- [Rate Limiting](./RATE_LIMITING.md) - Request throttling
- [Cost Tracking](./COST_TRACKING.md) - Budget management
