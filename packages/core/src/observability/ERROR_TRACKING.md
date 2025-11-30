# Error Tracking Integration for RANA

Complete error tracking and monitoring system for RANA SDK operations.

## Features

- **Automatic Error Classification**: Categorizes errors into auth, rate_limit, network, provider, budget, validation, and unknown types
- **Error Grouping**: Groups similar errors using fingerprinting to identify patterns
- **Context Tracking**: Captures breadcrumbs, request context, and custom data
- **External Integrations**: Supports Sentry, custom webhooks, and console output
- **Statistics & Analytics**: Track error rates, frequencies, and trends
- **Multiple Severity Levels**: debug, info, warning, error, critical

## Quick Start

```typescript
import { createErrorTracker, RanaAuthError } from '@rana/core';

// Create an error tracker
const tracker = createErrorTracker({
  consoleOutput: true,
  sentryDsn: 'https://xxx@sentry.io/xxx', // Optional
  webhookUrl: 'https://api.example.com/errors', // Optional
  environment: 'production',
  maxStoredErrors: 100,
});

// Capture errors
try {
  await rana.chat({ messages: [...] });
} catch (error) {
  tracker.captureError(error, {
    provider: 'anthropic',
    userId: 'user-123',
    requestId: 'req-456',
    extra: { endpoint: '/api/chat' }
  });
}
```

## Error Classification

The tracker automatically classifies RANA errors:

### Auth Errors
```typescript
const error = new RanaAuthError('anthropic');
tracker.captureError(error); // Category: 'auth', Level: 'critical'
```

### Rate Limit Errors
```typescript
const error = new RanaRateLimitError('openai');
tracker.captureError(error); // Category: 'rate_limit', Level: 'warning'
```

### Network Errors
```typescript
const error = new RanaNetworkError('google');
tracker.captureError(error); // Category: 'network', Level: 'error'
```

### Budget Errors
```typescript
const error = new RanaBudgetExceededError(5.50, 5.00, 'daily');
tracker.captureError(error); // Category: 'budget', Level: 'critical'

const warning = new RanaBudgetWarningError(4.50, 5.00, 90);
tracker.captureError(warning); // Category: 'budget', Level: 'warning'
```

## Breadcrumbs

Add breadcrumbs to track the sequence of events leading to an error:

```typescript
// Add breadcrumbs before operations
tracker.addBreadcrumb({
  category: 'request',
  message: 'Starting chat request',
  level: 'info',
  data: { model: 'claude-3-5-sonnet-20241022' }
});

tracker.addBreadcrumb({
  category: 'provider',
  message: 'Selected Anthropic provider',
  level: 'debug'
});

// These breadcrumbs will be included with any errors captured
try {
  await rana.chat({ ... });
} catch (error) {
  tracker.captureError(error); // Includes all breadcrumbs
}
```

## Error Statistics

Get comprehensive error statistics:

```typescript
const stats = tracker.getErrorStats();

console.log('Total errors:', stats.totalErrors);
console.log('By category:', stats.byCategory);
// { auth: 5, rate_limit: 12, network: 3, ... }

console.log('By provider:', stats.byProvider);
// { anthropic: 8, openai: 10, google: 2, ... }

console.log('By level:', stats.byLevel);
// { critical: 3, error: 15, warning: 12, ... }

console.log('Top errors:', stats.topErrors);
// [{ fingerprint: '...', message: '...', count: 25 }, ...]

console.log('Error rate:', stats.errorRate); // errors per minute
```

## Recent Errors

Get recently captured errors:

```typescript
// Get last 10 errors
const recent = tracker.getRecentErrors(10);

recent.forEach(error => {
  console.log(`${error.category}: ${error.message}`);
  console.log(`  Count: ${error.count}`);
  console.log(`  First seen: ${error.firstSeen}`);
  console.log(`  Last seen: ${error.lastSeen}`);
  console.log(`  Provider: ${error.provider}`);
});
```

## Query by Category or Provider

```typescript
// Get all auth errors
const authErrors = tracker.getErrorsByCategory('auth');

// Get all errors from a specific provider
const anthropicErrors = tracker.getErrorsByProvider('anthropic');
```

## Configuration Options

```typescript
const tracker = createErrorTracker({
  // Enable/disable tracking
  enabled: true,

  // Sentry integration
  sentryDsn: 'https://xxx@sentry.io/xxx',

  // Custom webhook endpoint
  webhookUrl: 'https://api.example.com/errors',

  // Console logging
  consoleOutput: true,

  // Max errors to store in memory
  maxStoredErrors: 100,

  // Minimum level to track
  minLevel: 'error', // 'debug' | 'info' | 'warning' | 'error' | 'critical'

  // Custom error handler
  onError: (error) => {
    console.log('Error captured:', error.message);
  },

  // Filter function to ignore specific errors
  shouldIgnore: (error) => {
    return error.message.includes('IGNORE_THIS');
  },

  // Environment name
  environment: 'production',

  // Release version
  release: 'v1.2.3',

  // Global tags
  tags: {
    region: 'us-east-1',
    service: 'api',
  },
});
```

## Integration with Sentry

```typescript
import { createErrorTracker } from '@rana/core';

const tracker = createErrorTracker({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  tags: {
    service: 'rana-api',
  },
});

// Errors are automatically sent to Sentry
// with proper categorization, context, and breadcrumbs
```

## Custom Webhooks

Send errors to your own monitoring service:

```typescript
const tracker = createErrorTracker({
  webhookUrl: 'https://monitoring.example.com/webhooks/errors',
  onError: async (error) => {
    // Custom processing before webhook
    console.log('Processing error:', error.id);
  },
});

// Payload sent to webhook:
// {
//   id: 'err_123...',
//   category: 'auth',
//   level: 'critical',
//   message: 'Authentication failed...',
//   provider: 'anthropic',
//   count: 1,
//   timestamp: '2024-11-30T...',
//   context: { ... },
//   environment: 'production',
// }
```

## Global Error Tracker

For simple setups, use the global error tracker:

```typescript
import {
  configureErrorTracker,
  captureError,
  getErrorStats,
  getRecentErrors,
} from '@rana/core';

// Configure once
configureErrorTracker({
  sentryDsn: process.env.SENTRY_DSN,
  environment: 'production',
});

// Use anywhere
try {
  await rana.chat({ ... });
} catch (error) {
  captureError(error, { provider: 'anthropic' });
}

// Get stats
const stats = getErrorStats();
const recent = getRecentErrors(5);
```

## Events

The error tracker emits events you can listen to:

```typescript
tracker.on('error-captured', (error) => {
  console.log('New error captured:', error.message);
});

tracker.on('error-updated', (error) => {
  console.log('Error occurred again:', error.message, 'count:', error.count);
});

tracker.on('errors-cleared', () => {
  console.log('Error history cleared');
});
```

## Error Fingerprinting

Similar errors are automatically grouped using a fingerprint:

```typescript
// These errors will be grouped together:
for (let i = 0; i < 10; i++) {
  const error = new RanaRateLimitError('openai');
  tracker.captureError(error);
}

const recent = tracker.getRecentErrors();
// Only one error entry with count: 10
console.log(recent[0].count); // 10
```

## Best Practices

1. **Add Breadcrumbs**: Track the sequence of events leading to errors
2. **Include Context**: Always provide relevant context (user, request ID, etc.)
3. **Use Tags**: Tag errors for easier filtering and grouping
4. **Set Environment**: Distinguish between production, staging, development
5. **Monitor Stats**: Regularly check error rates and top errors
6. **Configure Filters**: Ignore expected or non-critical errors

## Example: Full Integration

```typescript
import { createRana, createErrorTracker } from '@rana/core';

const tracker = createErrorTracker({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  tags: { service: 'chat-api' },
});

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
});

async function handleChatRequest(userId: string, message: string) {
  tracker.addBreadcrumb({
    category: 'request',
    message: `Chat request from user ${userId}`,
    level: 'info',
  });

  try {
    const response = await rana.chat({
      messages: [{ role: 'user', content: message }],
      provider: 'anthropic',
    });

    tracker.addBreadcrumb({
      category: 'response',
      message: 'Chat completed successfully',
      level: 'info',
    });

    return response;
  } catch (error) {
    tracker.captureError(error as Error, {
      userId,
      extra: {
        message: message.substring(0, 100),
        timestamp: new Date().toISOString(),
      },
    });

    throw error;
  }
}

// Monitor error rates
setInterval(() => {
  const stats = tracker.getErrorStats();
  if (stats.errorRate > 10) {
    console.warn('High error rate detected:', stats.errorRate, 'errors/min');
  }
}, 60000);
```

## API Reference

### ErrorTracker

#### Methods

- `captureError(error, context?)` - Capture an error with context
- `addBreadcrumb(breadcrumb)` - Add a breadcrumb
- `clearBreadcrumbs()` - Clear all breadcrumbs
- `getErrorStats()` - Get error statistics
- `getRecentErrors(limit?)` - Get recent errors
- `getErrorsByCategory(category)` - Get errors by category
- `getErrorsByProvider(provider)` - Get errors by provider
- `getErrorById(id)` - Get specific error by ID
- `clearErrors()` - Clear all errors
- `configure(config)` - Update configuration
- `destroy()` - Clean up resources

### Types

```typescript
type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

type ErrorCategory =
  | 'auth'
  | 'rate_limit'
  | 'network'
  | 'provider'
  | 'budget'
  | 'validation'
  | 'unknown';

interface TrackedError {
  id: string;
  category: ErrorCategory;
  level: ErrorLevel;
  message: string;
  code?: string;
  stack?: string;
  provider?: LLMProvider;
  statusCode?: number;
  timestamp: Date;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  context: ErrorContext;
  originalError: Error;
  fingerprint: string;
}
```
