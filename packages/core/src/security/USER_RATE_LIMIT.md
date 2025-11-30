# User Rate Limiter

Per-user rate limiting for RANA security with sliding window algorithm.

## Features

- **Per-User Tracking**: Rate limit by user ID, API key, IP address, or custom identifier
- **Multiple Tiers**: Support for different rate limit tiers (free, pro, enterprise, etc.)
- **Sliding Window**: Accurate rate limiting using sliding window algorithm
- **Multiple Time Windows**: Support for per-minute, per-hour, per-day, and burst limits
- **Standard Headers**: Returns standard `X-RateLimit-*` headers
- **Storage Options**: In-memory (with cleanup) or Redis for distributed systems
- **Status Monitoring**: Query current usage without recording a request
- **TypeScript**: Full type safety with TypeScript

## Installation

The user rate limiter is part of the `@rana/core` security module:

```typescript
import { UserRateLimiter, createUserRateLimiter } from '@rana/core/security';
```

## Quick Start

```typescript
import { createUserRateLimiter } from '@rana/core/security';

// Create a rate limiter
const limiter = createUserRateLimiter({
  defaultTier: 'free',
  tiers: {
    free: {
      name: 'free',
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      burstLimit: 5,
    },
    pro: {
      name: 'pro',
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 50,
    },
  },
});

// Check rate limit
const result = await limiter.checkLimit({
  userId: 'user_123',
});

if (!result.allowed) {
  // Rate limit exceeded
  console.log(`Rate limit exceeded. Reset at: ${result.resetAt}`);
  // Return 429 with headers
}
```

## Configuration

### Tier Configuration

```typescript
interface RateLimitTier {
  name: string;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number; // Max requests per second
}
```

### User Identifiers

```typescript
interface UserIdentifier {
  userId?: string;
  apiKey?: string;
  ipAddress?: string;
  customId?: string;
}
```

Priority order: `userId > apiKey > ipAddress > customId`

### Storage Options

#### In-Memory Storage (Default)

```typescript
const limiter = createUserRateLimiter({
  defaultTier: 'free',
  tiers: { /* ... */ },
  cleanupInterval: 60000, // Cleanup every 60 seconds
});
```

#### Redis Storage (Distributed)

```typescript
import Redis from 'ioredis';

const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
});

const limiter = createUserRateLimiter(
  {
    defaultTier: 'free',
    tiers: { /* ... */ },
    storage: 'redis',
  },
  redisClient
);
```

## Usage

### Basic Rate Limiting

```typescript
const result = await limiter.checkLimit({ userId: 'user_123' });

if (result.allowed) {
  console.log(`Remaining: ${result.remaining}`);
  console.log(`Reset at: ${result.resetAt}`);
  console.log(`Tier: ${result.tier}`);
  console.log('Headers:', result.headers);
} else {
  console.log(`Reason: ${result.reason}`);
}
```

### Express.js Middleware

```typescript
function rateLimitMiddleware(limiter: UserRateLimiter) {
  return async (req, res, next) => {
    const result = await limiter.checkLimit({
      userId: req.user?.id,
      apiKey: req.headers['x-api-key'],
      ipAddress: req.ip,
    });

    // Add rate limit headers
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        resetAt: result.resetAt,
      });
    }

    next();
  };
}

app.use(rateLimitMiddleware(limiter));
```

### Tier Management

```typescript
// Assign user to a tier
limiter.assignTier({ userId: 'user_123' }, 'pro');

// Get user's current tier
const tier = limiter.getUserTier({ userId: 'user_123' });

// Add a new tier
limiter.defineTier('premium', {
  name: 'premium',
  requestsPerMinute: 500,
  requestsPerHour: 5000,
  requestsPerDay: 50000,
});

// Remove a tier
limiter.removeTier('premium');

// Get all tiers
const tiers = limiter.getTiers();
```

### Status Monitoring

```typescript
// Get detailed status without recording a request
const status = await limiter.getStatus({ userId: 'user_123' });

console.log(status);
// Output:
// {
//   tier: 'free',
//   limits: {
//     minute: { used: 5, limit: 10, remaining: 5 },
//     hour: { used: 50, limit: 100, remaining: 50 },
//     day: { used: 500, limit: 1000, remaining: 500 },
//     burst: { used: 0, limit: 5, remaining: 5 }
//   }
// }

// Get memory statistics (in-memory storage only)
const stats = limiter.getMemoryStats();
if (stats) {
  console.log(`Total users tracked: ${stats.totalIdentifiers}`);
  console.log(`Total requests tracked: ${stats.totalRequests}`);
  console.log(`Oldest request: ${stats.oldestRequest}`);
}
```

### Reset Rate Limits

```typescript
// Reset specific user
await limiter.reset({ userId: 'user_123' });

// Reset all users
await limiter.reset();
```

## Rate Limit Headers

The following headers are returned in the `result.headers` object:

- `X-RateLimit-Limit`: Total requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `X-RateLimit-Tier`: User's current tier
- `Retry-After`: Seconds until the rate limit resets

## Sliding Window Algorithm

The limiter uses a sliding window algorithm for accurate rate limiting:

- **Fixed Window Problem**: Traditional fixed windows can allow bursts at window boundaries
- **Sliding Window Solution**: Tracks exact timestamps and calculates limits over rolling windows

Example:
```
Fixed Window (per minute):
00:00 - 10 requests ✓
00:59 - 10 requests ✓
Total: 20 requests in 1 second (boundary burst)

Sliding Window (per minute):
00:00 - 10 requests ✓
00:59 - 1 request ✗ (11 requests in last 60s)
```

## Advanced Examples

### Different Limits per Route

```typescript
const authLimiter = createUserRateLimiter({
  defaultTier: 'default',
  tiers: {
    default: {
      name: 'default',
      requestsPerMinute: 5,
      burstLimit: 2,
    },
  },
});

const apiLimiter = createUserRateLimiter({
  defaultTier: 'free',
  tiers: {
    free: { requestsPerMinute: 60 },
    pro: { requestsPerMinute: 600 },
  },
});

app.post('/auth/login', rateLimitMiddleware(authLimiter), loginHandler);
app.get('/api/data', rateLimitMiddleware(apiLimiter), dataHandler);
```

### Custom Identifier

```typescript
// Rate limit by session ID
await limiter.checkLimit({
  customId: `session_${req.session.id}`,
});

// Rate limit by organization ID
await limiter.checkLimit({
  customId: `org_${user.organizationId}`,
});
```

### Dynamic Tier Assignment

```typescript
async function upgradeUserTier(userId: string) {
  // When user upgrades subscription
  limiter.assignTier({ userId }, 'pro');

  // Reset their current limits
  await limiter.reset({ userId });
}

async function downgradeUserTier(userId: string) {
  // When subscription expires
  limiter.assignTier({ userId }, 'free');
}
```

## Comparison with Provider Rate Limiter

RANA has two rate limiting systems:

| Feature | User Rate Limiter | Provider Rate Limiter |
|---------|------------------|---------------------|
| **Purpose** | Per-user limits | Per-provider API limits |
| **Location** | `security/user-rate-limit.ts` | `providers/rate-limiter.ts` |
| **Use Case** | Protect your API | Respect provider limits |
| **Identifier** | User/API key/IP | LLM provider |
| **Tiers** | Yes | No |
| **Storage** | Memory/Redis | Memory only |
| **Algorithm** | Sliding window | Sliding window + queue |

**Use both together:**

```typescript
import { createUserRateLimiter } from '@rana/core/security';
import { createRateLimiter } from '@rana/core/providers';

// User-level rate limiting
const userLimiter = createUserRateLimiter({
  defaultTier: 'free',
  tiers: { /* ... */ },
});

// Provider-level rate limiting
const providerLimiter = createRateLimiter({
  providers: {
    openai: { requestsPerMinute: 60 },
    anthropic: { requestsPerMinute: 100 },
  },
});

// In your request handler
async function handleRequest(userId: string, provider: string) {
  // Check user rate limit
  const userLimit = await userLimiter.checkLimit({ userId });
  if (!userLimit.allowed) {
    return { error: 'User rate limit exceeded' };
  }

  // Check provider rate limit
  await providerLimiter.acquire(provider);

  // Make the request...
}
```

## Best Practices

1. **Choose Appropriate Limits**: Balance user experience with resource protection
2. **Use Multiple Windows**: Combine minute, hour, and day limits for flexibility
3. **Set Burst Limits**: Prevent abuse while allowing normal traffic spikes
4. **Monitor Usage**: Use `getStatus()` to track user behavior
5. **Graceful Degradation**: Fail open on errors rather than blocking legitimate users
6. **Clear Headers**: Always return rate limit headers to clients
7. **Redis for Scale**: Use Redis storage for multi-server deployments
8. **Clean Up**: In-memory storage auto-cleans, but monitor with `getMemoryStats()`

## Troubleshooting

### High Memory Usage

```typescript
// Check memory statistics
const stats = limiter.getMemoryStats();
console.log(`Tracking ${stats.totalIdentifiers} users`);
console.log(`Total requests: ${stats.totalRequests}`);

// Reduce cleanup interval
const limiter = createUserRateLimiter({
  defaultTier: 'free',
  tiers: { /* ... */ },
  cleanupInterval: 30000, // More frequent cleanup
});

// Or switch to Redis
```

### Rate Limits Not Working

```typescript
// Verify tier configuration
const tiers = limiter.getTiers();
console.log('Available tiers:', tiers);

// Check user's assigned tier
const userTier = limiter.getUserTier({ userId: 'user_123' });
console.log('User tier:', userTier);

// Check current status
const status = await limiter.getStatus({ userId: 'user_123' });
console.log('Status:', status);
```

### Redis Connection Issues

```typescript
// Add error handling to Redis client
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

// Ensure Redis client is connected before creating limiter
await redisClient.ping();
const limiter = createUserRateLimiter(config, redisClient);
```

## API Reference

See the TypeScript definitions for complete API documentation:

- [`UserRateLimiter`](./user-rate-limit.ts)
- [`RateLimitTier`](./user-rate-limit.ts)
- [`UserIdentifier`](./user-rate-limit.ts)
- [`RateLimitResult`](./user-rate-limit.ts)

## Examples

See [user-rate-limit.example.ts](./user-rate-limit.example.ts) for comprehensive examples.

## License

Part of the RANA SDK - see main LICENSE file.
