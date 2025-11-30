/**
 * Logger Examples
 * Demonstrates how to use the RANA logging system
 */

import {
  createLogger,
  createConsoleTransport,
  createFileTransport,
  createCustomTransport,
  createLoggingMiddleware,
  type LogEntry,
} from './index.js';
import type { RanaChatRequest, RanaChatResponse } from '../types.js';

// ============================================================================
// Example 1: Basic Logging
// ============================================================================

export function basicLoggingExample() {
  console.log('\n=== Example 1: Basic Logging ===\n');

  const logger = createLogger({
    level: 'info',
    enabled: true,
  });

  logger.debug('This will not be shown (level is info)');
  logger.info('Information message');
  logger.warn('Warning message');
  logger.error('Error message', new Error('Something went wrong'));
}

// ============================================================================
// Example 2: Structured Logging with Metadata
// ============================================================================

export function structuredLoggingExample() {
  console.log('\n=== Example 2: Structured Logging ===\n');

  const logger = createLogger({
    level: 'debug',
    category: 'api',
  });

  logger.info('Processing request', {
    userId: 'user-123',
    requestId: 'req-456',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  logger.debug('Cache lookup', {
    key: 'cache-key-789',
    hit: true,
    ttl: 3600,
  });
}

// ============================================================================
// Example 3: Context Management
// ============================================================================

export function contextManagementExample() {
  console.log('\n=== Example 3: Context Management ===\n');

  const logger = createLogger();

  // Set global context
  logger.setContext({
    userId: 'user-123',
    sessionId: 'session-abc',
  });

  logger.info('User action'); // Will include userId and sessionId

  // Create child logger with additional context
  const requestLogger = logger.withContext({
    requestId: 'req-789',
    provider: 'openai',
  });

  requestLogger.info('Request started'); // Will include all context

  // Clear context
  logger.clearContext();
  logger.info('Context cleared'); // No context metadata
}

// ============================================================================
// Example 4: Multiple Transports
// ============================================================================

export function multipleTransportsExample() {
  console.log('\n=== Example 4: Multiple Transports ===\n');

  const logger = createLogger({
    level: 'debug',
    transports: [
      // Console transport for all levels
      createConsoleTransport({
        level: 'debug',
        colors: true,
        pretty: true,
      }),

      // File transport for errors only
      createFileTransport({
        level: 'error',
        filepath: './logs/errors.log',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
      }),

      // Custom transport
      createCustomTransport({
        level: 'warn',
        handler: (entry: LogEntry) => {
          // Send to external service, database, etc.
          console.log('[Custom Handler]', entry.message);
        },
      }),
    ],
  });

  logger.debug('Debug message - only to console');
  logger.info('Info message - only to console');
  logger.warn('Warning - to console and custom handler');
  logger.error('Error - to all transports', new Error('Critical error'));
}

// ============================================================================
// Example 5: Filtering Logs
// ============================================================================

export function filteringExample() {
  console.log('\n=== Example 5: Filtering Logs ===\n');

  const logger = createLogger({
    level: 'debug',
    filters: [
      {
        // Only log from specific category
        category: 'api',
      },
      {
        // Only log errors and above
        level: 'error',
        condition: (entry) => {
          // Custom filtering logic
          return entry.metadata?.critical === true;
        },
      },
    ],
  });

  logger.info('API request', { category: 'api' }); // Will be logged
  logger.info('Internal process'); // Will not be logged (no category)
  logger.error('Critical error', undefined, { critical: true }); // Will be logged
}

// ============================================================================
// Example 6: Request/Response Logging Middleware
// ============================================================================

export async function requestResponseLoggingExample() {
  console.log('\n=== Example 6: Request/Response Logging ===\n');

  const logger = createLogger({
    level: 'debug',
    category: 'rana',
  });

  const middleware = createLoggingMiddleware(logger, {
    enabled: true,
    logRequests: true,
    logResponses: true,
    logErrors: true,
    includeMessages: true,
    redactMessages: false,
    includeUsage: true,
    includeCost: true,
    includeLatency: true,
    onLog: (log) => {
      console.log('\n[Custom Log Handler]', {
        requestId: log.request.requestId,
        provider: log.request.provider,
        success: log.success,
        duration: log.duration_ms,
      });
    },
  });

  // Simulate a request
  const request: RanaChatRequest = {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    messages: [
      { role: 'user', content: 'Hello, how are you?' },
    ],
  };

  const requestId = 'req-123';
  const startTime = Date.now();

  middleware.onRequest(request, requestId);

  // Simulate processing...
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate a response
  const response: RanaChatResponse = {
    id: 'resp-456',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    content: "I'm doing well, thank you!",
    role: 'assistant',
    usage: {
      prompt_tokens: 10,
      completion_tokens: 8,
      total_tokens: 18,
    },
    cost: {
      prompt_cost: 0.0003,
      completion_cost: 0.0012,
      total_cost: 0.0015,
    },
    latency_ms: 95,
    cached: false,
    raw: {},
    created_at: new Date(),
    finish_reason: 'stop',
  };

  const duration = Date.now() - startTime;
  middleware.onResponse(request, response, duration, requestId);
}

// ============================================================================
// Example 7: Sensitive Data Redaction
// ============================================================================

export function redactionExample() {
  console.log('\n=== Example 7: Sensitive Data Redaction ===\n');

  const logger = createLogger({
    level: 'info',
    redactFields: ['api_key', 'apiKey', 'password', 'secret', 'token'],
  });

  logger.info('API configuration', {
    endpoint: 'https://api.example.com',
    api_key: 'sk-1234567890abcdef', // Will be redacted
    timeout: 5000,
    headers: {
      Authorization: 'Bearer token-xyz', // 'token' will be redacted if nested
    },
  });
}

// ============================================================================
// Example 8: Global Logger
// ============================================================================

export function globalLoggerExample() {
  console.log('\n=== Example 8: Global Logger ===\n');

  // Import the global logger
  import('./logger.js').then(({ logger }) => {
    logger.info('Using global logger');
    logger.setContext({ app: 'rana' });
    logger.info('With context');
  });
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('RANA Logger Examples\n');
  console.log('='.repeat(60));

  basicLoggingExample();
  structuredLoggingExample();
  contextManagementExample();
  multipleTransportsExample();
  filteringExample();
  await requestResponseLoggingExample();
  redactionExample();
  await globalLoggerExample();

  console.log('\n' + '='.repeat(60));
  console.log('\nAll examples completed!\n');
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
