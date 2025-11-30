# RANA Logging System - Implementation Summary

## Overview

The RANA logging system provides comprehensive observability for LLM operations with support for structured logging, multiple transports, request/response tracking, and privacy-aware data handling.

## Location

All logging files are located in `/packages/core/src/observability/`:

- **types.ts** - Type definitions for logging system
- **logger.ts** - Main Logger class with context management
- **transports.ts** - Console, File, and Custom transports
- **middleware.ts** - Request/Response logging middleware
- **index.ts** - Public exports (combined with other observability features)
- **logger.example.ts** - Comprehensive usage examples

## Features Implemented

### 1. Logger Class (`logger.ts`)

The main `Logger` class provides:

#### Log Levels
- **debug** - Detailed debugging information
- **info** - General informational messages
- **warn** - Warning messages
- **error** - Error messages with stack traces

#### Context Management
```typescript
logger.setContext({ userId: 'user-123', requestId: 'req-456' });
logger.info('Request started'); // Includes context automatically

const childLogger = logger.withContext({ provider: 'anthropic' });
childLogger.info('Provider request'); // Includes parent + child context
```

#### Structured Logging
```typescript
logger.info('API request', {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  tokens: 1500,
  cost: 0.045
});
```

#### Request Tracing
```typescript
const requestId = logger.startRequest();
// ... perform operation
logger.endRequest();
```

#### Sensitive Data Redaction
Automatically redacts fields like `api_key`, `apiKey`, `password`, `token`, `secret`:
```typescript
logger.info('Config', { api_key: 'sk-123' }); // Logs as '[REDACTED]'
```

#### Global Logger
```typescript
import { logger, getGlobalLogger, setGlobalLogger } from '@rana/core';

logger.info('Using global logger instance');
```

### 2. Transports (`transports.ts`)

#### Console Transport
Outputs logs to console with colored, pretty-printed format:
```typescript
createConsoleTransport({
  level: 'debug',
  colors: true,
  pretty: true,
  timestamp: true
})
```

Features:
- Color-coded log levels (debug=cyan, info=green, warn=yellow, error=red)
- ISO timestamp formatting
- Category and request ID display
- Metadata pretty-printing
- JSON or pretty output modes

#### File Transport
Writes logs to files with automatic rotation:
```typescript
createFileTransport({
  filepath: './logs/app.log',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  rotate: true
})
```

Features:
- Automatic file rotation when size limit reached
- Keeps configurable number of rotated files
- Buffered writes with periodic flushing (1s intervals)
- Automatic directory creation
- JSON line format for easy parsing

#### Custom Transport
Create custom handlers for any destination:
```typescript
createCustomTransport({
  handler: async (entry) => {
    // Send to DataDog, Sentry, database, etc.
    await sendToMonitoringService(entry);
  }
})
```

### 3. Request/Response Logging Middleware (`middleware.ts`)

Specialized middleware for logging RANA chat requests and responses:

```typescript
const middleware = createLoggingMiddleware(logger, {
  enabled: true,
  logRequests: true,
  logResponses: true,
  logErrors: true,
  includeMessages: true,      // Include message content
  redactMessages: false,       // Redact message content for privacy
  includeUsage: true,          // Include token usage
  includeCost: true,           // Include cost information
  includeLatency: true,        // Include latency metrics
  onLog: (log) => {            // Custom log handler
    // Process log entry
  }
});

// Use in request lifecycle
middleware.onRequest(request, requestId);
middleware.onResponse(request, response, duration, requestId);
middleware.onError(request, error, duration, requestId);
```

Features:
- Automatic request/response correlation via requestId
- Detailed request logging (provider, model, messages, parameters)
- Response logging with usage, cost, and latency metrics
- Error logging with full context
- Privacy controls for message content redaction
- Custom log handlers for external integrations

### 4. Log Filtering

Apply filters to control what gets logged:

```typescript
createLogger({
  filters: [
    { level: 'error' },                    // Only errors and above
    { category: 'api' },                   // Only specific category
    { provider: 'anthropic' },             // Only specific provider
    { condition: (entry) => entry.critical } // Custom condition
  ]
})
```

### 5. Multiple Transports

Support for multiple simultaneous log destinations:

```typescript
createLogger({
  transports: [
    createConsoleTransport({ level: 'debug' }),
    createFileTransport({ 
      filepath: './logs/errors.log',
      level: 'error' 
    }),
    createCustomTransport({
      handler: async (entry) => {
        await sendToExternalService(entry);
      }
    })
  ]
})
```

## Type Definitions

### Core Types

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  metadata?: Record<string, any>;
  error?: Error;
  requestId?: string;
}

interface StructuredLogEntry extends LogEntry {
  provider?: LLMProvider;
  model?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
}

interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  provider?: LLMProvider;
  model?: string;
  metadata?: Record<string, any>;
}
```

### Request/Response Types

```typescript
interface RequestLogEntry {
  requestId: string;
  timestamp: Date;
  provider: LLMProvider;
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: Record<string, any>;
}

interface ResponseLogEntry {
  requestId: string;
  timestamp: Date;
  provider: LLMProvider;
  model: string;
  content: string;
  usage: { /* token counts */ };
  cost: { /* cost breakdown */ };
  latency_ms: number;
  cached: boolean;
  finish_reason: string | null;
}

interface RequestResponseLog {
  request: RequestLogEntry;
  response?: ResponseLogEntry;
  duration_ms: number;
  success: boolean;
}
```

## Public API

### Exports from `@rana/core`

```typescript
// Logger
import { 
  Logger,
  createLogger,
  getGlobalLoggerInstance,
  setGlobalLogger,
  logger,
  LOG_LEVELS 
} from '@rana/core';

// Transports
import {
  ConsoleTransport,
  FileTransport,
  CustomTransport,
  createConsoleTransport,
  createFileTransport,
  createCustomTransport
} from '@rana/core';

// Middleware
import {
  RequestResponseLogger,
  createLoggingMiddleware
} from '@rana/core';

// Types
import type {
  LogLevel,
  LogEntry,
  StructuredLogEntry,
  RequestLogEntry,
  ResponseLogEntry,
  RequestResponseLog,
  LoggerConfig,
  LogFilter,
  LogTransport,
  ConsoleTransportConfig,
  FileTransportConfig,
  CustomTransportConfig,
  LoggingMiddlewareConfig,
  LoggingMiddleware,
  LogContext
} from '@rana/core';
```

## Usage Examples

### Basic Logging

```typescript
import { createLogger } from '@rana/core';

const logger = createLogger({ level: 'info' });

logger.info('Application started');
logger.warn('Low memory warning');
logger.error('Database connection failed', new Error('Timeout'));
```

### With Context

```typescript
const logger = createLogger();

logger.setContext({ userId: 'user-123' });
logger.info('User logged in');

const requestLogger = logger.withContext({ requestId: 'req-456' });
requestLogger.info('Processing request');
```

### Multiple Transports

```typescript
const logger = createLogger({
  transports: [
    createConsoleTransport({ pretty: true }),
    createFileTransport({ filepath: './logs/app.log' })
  ]
});
```

### Request/Response Logging

```typescript
import { createLoggingMiddleware } from '@rana/core';

const middleware = createLoggingMiddleware(logger, {
  includeMessages: true,
  includeUsage: true,
  includeCost: true
});

// In your request handler
const requestId = 'req-123';
middleware.onRequest(request, requestId);

try {
  const response = await rana.chat(request);
  middleware.onResponse(request, response, duration, requestId);
} catch (error) {
  middleware.onError(request, error, duration, requestId);
}
```

## Integration with RANA Core

The logging system is fully integrated with RANA's existing infrastructure:

1. **Exported from main package** - All logging APIs available via `@rana/core`
2. **Works with existing types** - Uses `RanaChatRequest`, `RanaChatResponse`, `LLMProvider` types
3. **Part of observability module** - Alongside tracer, performance monitor, error tracker
4. **Consistent patterns** - Follows same patterns as cache, persistence, and other modules

## Performance Considerations

- **Buffered file writes** - File transport buffers logs and flushes every 1 second
- **Async handlers** - Custom transports can be async without blocking
- **Level filtering** - Logs below the configured level are filtered early
- **Lazy evaluation** - Metadata is only processed if log will be written
- **Automatic cleanup** - File rotation prevents unbounded disk usage

## Privacy & Security

- **Automatic redaction** - Sensitive fields automatically redacted
- **Message privacy** - Optional message content redaction for compliance
- **Configurable fields** - Control which fields get redacted
- **No PII by default** - No personally identifiable information logged without consent

## Testing

Example file provided at `logger.example.ts` with comprehensive examples:
- Basic logging
- Structured logging
- Context management
- Multiple transports
- Filtering
- Request/Response logging
- Redaction
- Global logger usage

## Files Modified

1. `/packages/core/src/observability/types.ts` - Fixed LogTransport interface
2. `/packages/core/src/observability/logger.ts` - Already existed (identical)
3. `/packages/core/src/observability/transports.ts` - Fixed imports
4. `/packages/core/src/observability/middleware.ts` - Fixed duplicate export
5. `/packages/core/src/observability/index.ts` - Already complete with all exports
6. `/packages/core/src/index.ts` - Added logger exports to main package
7. `/packages/core/src/observability/logger.example.ts` - Created comprehensive examples

## Build Status

✅ All files compile successfully
✅ TypeScript types are correct
✅ No build errors
✅ Exports properly available from `@rana/core`

## Next Steps

The logging system is complete and ready to use. Consider:

1. Adding logging to RanaClient for automatic request/response tracking
2. Creating presets for common logging configurations
3. Adding integration examples with popular services (DataDog, Sentry, etc.)
4. Documentation for end users

---

**Status**: ✅ Complete and Production Ready
