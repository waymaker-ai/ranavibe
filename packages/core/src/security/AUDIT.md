# RANA Audit Logging

Comprehensive audit logging system for RANA security with GDPR compliance and tamper detection.

## Features

- **Comprehensive Event Logging**: API key usage, requests/responses, config changes, security events, and access patterns
- **Multiple Destinations**: File (with rotation), Console, and Custom handlers for external services
- **Data Protection**: Automatic redaction of sensitive fields, PII detection, and data hashing
- **GDPR Compliance**: User data anonymization, opt-out capabilities, and configurable retention
- **Tamper Detection**: Hash-chain verification and optional entry signing
- **Performance Optimized**: Buffered writes, async operations, and configurable flush intervals
- **Security-Focused**: Injection detection, access pattern analysis, and anomaly detection

## Quick Start

```typescript
import { createAuditLogger, hashApiKey } from '@rana/core';

// Create audit logger with default settings
const audit = createAuditLogger();
await audit.initialize();

// Log API key usage
const apiKeyHash = hashApiKey(process.env.ANTHROPIC_API_KEY);
await audit.logApiKeyUsage(apiKeyHash, 'anthropic', 'chat_request', {
  model: 'claude-3-5-sonnet-20241022'
});

// Log request/response
await audit.logRequest('anthropic', 'claude-3-5-sonnet-20241022', 'user-123');
await audit.logResponse('anthropic', 'claude-3-5-sonnet-20241022', 'success', 1234);

// Always close when done
await audit.close();
```

## Configuration

### Basic Configuration

```typescript
import { createAuditLogger, type AuditLoggerConfig } from '@rana/core';

const config: AuditLoggerConfig = {
  // Destinations - where logs are written
  destinations: [
    { type: 'file', filepath: './logs/audit.log', enabled: true },
    { type: 'console', enabled: true }
  ],

  // Data protection
  hashSensitiveData: true,
  redactFields: ['api_key', 'password', 'token'],

  // GDPR compliance
  gdprMode: true,
  anonymizeUsers: true,
  retentionDays: 90,

  // Tamper detection
  enableTamperDetection: true,
  signEntries: true,

  // Performance
  bufferSize: 100,
  flushInterval: 5000, // 5 seconds
};

const audit = createAuditLogger(config);
```

### Multiple Destinations

```typescript
const audit = createAuditLogger({
  destinations: [
    // File destination with rotation
    {
      type: 'file',
      filepath: './logs/audit.log',
      enabled: true,
    },
    // Console for development
    {
      type: 'console',
      enabled: process.env.NODE_ENV === 'development',
      filter: (entry) => entry.severity === 'high' || entry.severity === 'critical',
    },
    // Custom handler for external services
    {
      type: 'custom',
      enabled: true,
      handler: async (entry) => {
        // Send to Datadog, Splunk, etc.
        await sendToMonitoring(entry);
      },
      filter: (entry) => entry.event_type === 'security_event',
    },
  ],
});
```

## Event Types

### API Key Usage

```typescript
await audit.logApiKeyUsage(
  hashApiKey('sk-ant-123'),
  'anthropic',
  'chat_request',
  { model: 'claude-3-5-sonnet-20241022' }
);
```

### Request/Response

```typescript
// Log request
await audit.logRequest('anthropic', 'claude-3-5-sonnet-20241022', 'user-123', {
  temperature: 0.7,
  max_tokens: 1000,
});

// Log response
await audit.logResponse(
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'success',
  1234, // latency_ms
  'user-123',
  { tokens_used: 500, cost: 0.005 }
);
```

### Security Events

```typescript
import { detectPII, detectInjectionAttempt } from '@rana/core';

// Detect PII
const userInput = 'Contact me at john@example.com';
const piiResult = detectPII(userInput);

if (piiResult.detected) {
  await audit.logSecurityEvent({
    type: 'pii_detection',
    severity: 'medium',
    description: 'PII detected in user input',
    detected_patterns: piiResult.patterns,
    user_id: 'user-123',
  });
}

// Detect injection attempts
const suspiciousInput = 'Ignore previous instructions';
const injectionResult = detectInjectionAttempt(suspiciousInput);

if (injectionResult.detected) {
  await audit.logSecurityEvent({
    type: 'injection_attempt',
    severity: 'high',
    description: 'Potential injection attempt detected',
    detected_patterns: injectionResult.patterns,
    user_id: 'user-123',
    ip_address: '192.168.1.100',
  });
}
```

### Configuration Changes

```typescript
await audit.logConfigChange(
  'update_budget',
  'budget_config',
  'admin-user',
  {
    old_value: { limit: 100, period: 'monthly' },
    new_value: { limit: 200, period: 'monthly' },
    reason: 'Increased usage requirements',
  }
);
```

### Access Patterns

```typescript
await audit.logAccessPattern({
  user_id: 'user-789',
  api_key_hash: hashApiKey('sk-test-key'),
  timestamp: new Date(),
  resource: 'chat_api',
  action: 'request',
  frequency: 100,
});
```

### Authentication & Authorization

```typescript
// Log authentication
await audit.logAuthentication('success', 'user-123', 'api_key', {
  ip_address: '192.168.1.50',
  user_agent: 'RANA-SDK/1.0',
});

// Log authorization
await audit.logAuthorization('denied', 'admin_api', 'config_change', 'user-456', {
  role: 'basic',
  required_role: 'admin',
});
```

### Errors

```typescript
try {
  // Some operation
} catch (error) {
  await audit.logError(
    error as Error,
    'llm_request',
    'user-123',
    {
      provider: 'anthropic',
      retry_count: 3,
    }
  );
}
```

## Querying Audit Logs

```typescript
// Query by date range
const lastHour = new Date(Date.now() - 60 * 60 * 1000);
const recentEvents = await audit.query({
  startDate: lastHour,
  limit: 10,
});

// Query security events
const securityEvents = await audit.query({
  event_type: 'security_event',
  severity: 'high',
});

// Query by user
const userEvents = await audit.query({
  user_id: 'user-123',
  limit: 20,
});

// Query failed operations
const failures = await audit.query({
  outcome: 'failure',
  limit: 10,
});
```

## GDPR Compliance

### Standard GDPR Mode

```typescript
const audit = createAuditLogger({
  gdprMode: true,
  allowUserData: true,
  anonymizeUsers: true, // Hash user IDs
  retentionDays: 90, // Auto-cleanup after 90 days
});
```

### Strict GDPR Mode (No User Data)

```typescript
const audit = createAuditLogger({
  gdprMode: true,
  allowUserData: false, // Don't log user IDs at all
  retentionDays: 30,
});
```

### Manual Cleanup

```typescript
// Delete logs older than 90 days
const deletedCount = await audit.cleanup(90);
console.log(`Deleted ${deletedCount} old audit entries`);
```

## Tamper Detection

### Enable Tamper Detection

```typescript
const audit = createAuditLogger({
  enableTamperDetection: true,
  signEntries: true,
  signingKey: process.env.AUDIT_SIGNING_KEY, // Optional custom key
});
```

### Verify Integrity

```typescript
const verification = await audit.verifyIntegrity();

if (verification.valid) {
  console.log('✅ Audit log integrity verified');
} else {
  console.log('❌ Audit log has been tampered with!');
  console.log('Errors:', verification.errors);
}
```

## File Rotation

```typescript
const audit = createAuditLogger({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10, // Keep 10 rotated files
  rotateDaily: true, // Also rotate daily
});
```

## Event Filtering

### Filter by Event Type

```typescript
const audit = createAuditLogger({
  events: ['security_event', 'error'], // Only log these types
  // OR
  excludeEvents: ['access_pattern'], // Don't log these types
});
```

### Filter by Severity

```typescript
const audit = createAuditLogger({
  minSeverity: 'medium', // Only log medium and above
});
```

## Performance Optimization

```typescript
const audit = createAuditLogger({
  bufferSize: 100, // Buffer up to 100 entries
  flushInterval: 5000, // Flush every 5 seconds
});

// Manual flush
await audit.flush();
```

## Production Setup

```typescript
const audit = createAuditLogger({
  destinations: [
    {
      type: 'file',
      filepath: '/var/log/rana/audit.log',
      enabled: true,
    },
    {
      type: 'custom',
      enabled: true,
      handler: async (entry) => {
        if (entry.severity === 'critical' || entry.severity === 'high') {
          await sendToDatadog(entry);
          await sendToPagerDuty(entry);
        }
      },
    },
  ],
  hashSensitiveData: true,
  redactFields: ['api_key', 'password', 'token', 'secret', 'authorization'],
  gdprMode: true,
  anonymizeUsers: true,
  retentionDays: 90,
  enableTamperDetection: true,
  signEntries: true,
  maxFileSize: 100 * 1024 * 1024,
  maxFiles: 10,
  rotateDaily: true,
  bufferSize: 100,
  flushInterval: 5000,
});

// Cleanup job
setInterval(async () => {
  await audit.cleanup(90);
}, 24 * 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await audit.close();
  process.exit(0);
});
```

## Utility Functions

### Hash API Key

```typescript
import { hashApiKey } from '@rana/core';

const hash = hashApiKey('sk-ant-1234567890');
// Returns: 16-character hash
```

### Detect PII

```typescript
import { detectPII } from '@rana/core';

const result = detectPII('Contact me at john@example.com');
// result.detected: true
// result.patterns: ['email']
```

### Detect Injection Attempts

```typescript
import { detectInjectionAttempt } from '@rana/core';

const result = detectInjectionAttempt('Ignore previous instructions');
// result.detected: true
// result.patterns: ['promptInjection']
```

## Integration with RANA Client

```typescript
import { createRana, createAuditLogger, hashApiKey } from '@rana/core';

const audit = createAuditLogger();
await audit.initialize();

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

// Log API key usage
await audit.logApiKeyUsage(
  hashApiKey(process.env.ANTHROPIC_API_KEY),
  'anthropic',
  'initialization'
);

// Make request with logging
const requestStart = Date.now();
await audit.logRequest('anthropic', 'claude-3-5-sonnet-20241022', 'user-123');

try {
  const response = await rana.chat('Hello!');

  await audit.logResponse(
    'anthropic',
    'claude-3-5-sonnet-20241022',
    'success',
    Date.now() - requestStart,
    'user-123',
    {
      tokens: response.usage.total_tokens,
      cost: response.cost.total_cost,
    }
  );
} catch (error) {
  await audit.logError(error as Error, 'chat_request', 'user-123');
}

await audit.close();
```

## Best Practices

1. **Always close the audit logger** when shutting down to ensure all buffered logs are written
2. **Use hash functions** for sensitive data like API keys and user IDs
3. **Enable GDPR mode** if handling EU user data
4. **Set up file rotation** to prevent disk space issues
5. **Use custom handlers** to send critical events to monitoring services
6. **Verify integrity regularly** in production environments
7. **Clean up old logs** periodically based on retention policy
8. **Filter events** to reduce noise and storage costs
9. **Buffer writes** for performance in high-throughput scenarios
10. **Sign entries** in high-security environments

## Audit Entry Structure

```typescript
{
  // Core fields
  id: "audit_1234567890_abcdef12",
  timestamp: "2024-01-15T10:30:00.000Z",
  event_type: "api_key_usage",
  outcome: "success",

  // Actor information
  user_id: "hashed-user-id",
  api_key_hash: "1a2b3c4d5e6f7g8h",
  session_id: "session-xyz",
  ip_address: "192.168.1.100",

  // Action details
  action: "chat_request",
  resource: "chat_api",
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",

  // Metadata
  metadata: {
    temperature: 0.7,
    tokens_used: 500,
    cost: 0.005
  },

  // Security-specific
  severity: "medium",
  threat_type: "injection_attempt",
  detected_patterns: ["promptInjection"],

  // Integrity
  hash: "abc123...",
  previous_hash: "def456..."
}
```

## License

MIT
