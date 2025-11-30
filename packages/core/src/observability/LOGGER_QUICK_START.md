# RANA Logger - Quick Start Guide

## Installation

The logger is already included in `@rana/core`:

```bash
npm install @rana/core
```

## Quick Examples

### 1. Basic Usage

```typescript
import { createLogger } from '@rana/core';

const logger = createLogger({ level: 'info' });

logger.info('Application started');
logger.warn('Warning message');
logger.error('Error occurred', new Error('Details'));
```

### 2. With Request Context

```typescript
import { createLogger } from '@rana/core';

const logger = createLogger();

// Set context once
logger.setContext({
  userId: 'user-123',
  sessionId: 'session-abc'
});

// All subsequent logs include context
logger.info('User action');
logger.info('Another action');
```

### 3. Request/Response Logging

```typescript
import { createLoggingMiddleware } from '@rana/core';

const middleware = createLoggingMiddleware(logger, {
  includeMessages: true,
  includeUsage: true,
  includeCost: true,
  includeLatency: true
});

// Log request
middleware.onRequest(request, requestId);

// Log response
middleware.onResponse(request, response, duration, requestId);

// Log errors
middleware.onError(request, error, duration, requestId);
```

### 4. Multiple Destinations

```typescript
import { 
  createLogger,
  createConsoleTransport,
  createFileTransport 
} from '@rana/core';

const logger = createLogger({
  transports: [
    createConsoleTransport({ pretty: true }),
    createFileTransport({ filepath: './logs/app.log' })
  ]
});
```

### 5. Custom Handler

```typescript
import { createLogger, createCustomTransport } from '@rana/core';

const logger = createLogger({
  transports: [
    createCustomTransport({
      handler: async (entry) => {
        // Send to DataDog, Sentry, etc.
        await myService.log(entry);
      }
    })
  ]
});
```

### 6. Privacy-Aware Logging

```typescript
import { createLoggingMiddleware } from '@rana/core';

const middleware = createLoggingMiddleware(logger, {
  redactMessages: true,  // Hide message content
  includeUsage: true,    // Still log metrics
  includeCost: true
});
```

## All Features

- ✅ 4 log levels (debug, info, warn, error)
- ✅ Structured logging with JSON output
- ✅ Request/Response tracking
- ✅ Token usage & cost logging
- ✅ Latency measurement
- ✅ Multiple transports (console, file, custom)
- ✅ Log filtering by level and category
- ✅ Automatic sensitive data redaction
- ✅ Context management
- ✅ Global logger instance
- ✅ File rotation
- ✅ TypeScript types

## API Reference

### Logger

```typescript
const logger = createLogger(config?: LoggerConfig)

logger.debug(message, metadata?)
logger.info(message, metadata?)
logger.warn(message, metadata?)
logger.error(message, error?, metadata?)

logger.setContext(context)
logger.withContext(context) // Returns child logger
logger.clearContext()

logger.setLevel(level)
logger.setEnabled(enabled)
logger.addTransport(transport)
logger.flush()
logger.close()
```

### Transports

```typescript
createConsoleTransport({
  level?: LogLevel,
  colors?: boolean,
  pretty?: boolean,
  timestamp?: boolean
})

createFileTransport({
  filepath: string,
  level?: LogLevel,
  maxSize?: number,    // bytes
  maxFiles?: number,
  rotate?: boolean
})

createCustomTransport({
  level?: LogLevel,
  handler: (entry: LogEntry) => void | Promise<void>
})
```

### Middleware

```typescript
createLoggingMiddleware(logger?, config?: {
  enabled?: boolean,
  logRequests?: boolean,
  logResponses?: boolean,
  logErrors?: boolean,
  includeMessages?: boolean,
  redactMessages?: boolean,
  includeUsage?: boolean,
  includeCost?: boolean,
  includeLatency?: boolean,
  onLog?: (log: RequestResponseLog) => void
})
```

## TypeScript Types

```typescript
import type {
  Logger,
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogTransport,
  LoggingMiddleware
} from '@rana/core';
```

## Examples

See `/packages/core/src/observability/logger.example.ts` for comprehensive examples.

## Documentation

See `/packages/core/src/observability/LOGGER_SUMMARY.md` for complete documentation.
