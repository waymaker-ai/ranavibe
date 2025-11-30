/**
 * User Rate Limiter Examples
 * Demonstrates how to use the UserRateLimiter for per-user rate limiting
 */

import { UserRateLimiter, createUserRateLimiter, type UserIdentifier } from './user-rate-limit';

// ============================================================================
// Example 1: Basic Usage with In-Memory Storage
// ============================================================================

async function basicExample() {
  // Create a rate limiter with default tiers
  const limiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
        burstLimit: 5, // Max 5 requests per second
      },
      pro: {
        name: 'pro',
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 50,
      },
      enterprise: {
        name: 'enterprise',
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        burstLimit: 500,
      },
    },
  });

  // Check rate limit for a user
  const result = await limiter.checkLimit({
    userId: 'user_123',
  });

  if (result.allowed) {
    console.log('Request allowed!');
    console.log(`Remaining: ${result.remaining}`);
    console.log(`Reset at: ${result.resetAt}`);
    console.log(`Tier: ${result.tier}`);
    console.log('Headers:', result.headers);
  } else {
    console.log('Rate limit exceeded!');
    console.log(`Reason: ${result.reason}`);
    console.log(`Reset at: ${result.resetAt}`);
  }
}

// ============================================================================
// Example 2: Express.js Middleware
// ============================================================================

function createRateLimitMiddleware(limiter: UserRateLimiter) {
  return async (req: any, res: any, next: any) => {
    try {
      // Build identifier from request
      const identifier: UserIdentifier = {
        userId: req.user?.id,
        apiKey: req.headers['x-api-key'] as string,
        ipAddress: req.ip || req.connection.remoteAddress,
      };

      // Check rate limit
      const result = await limiter.checkLimit(identifier);

      // Add rate limit headers to response
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          reason: result.reason,
          resetAt: result.resetAt.toISOString(),
          tier: result.tier,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next(); // Fail open - allow request on error
    }
  };
}

// Usage in Express
// app.use(createRateLimitMiddleware(limiter));

// ============================================================================
// Example 3: Tier Management
// ============================================================================

async function tierManagementExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerHour: 100,
        requestsPerDay: 1000,
      },
    },
  });

  // Assign a user to a specific tier
  limiter.assignTier({ userId: 'user_pro_123' }, 'pro');

  // Get user's current tier
  const tier = limiter.getUserTier({ userId: 'user_pro_123' });
  console.log(`User tier: ${tier}`);

  // Add a new tier dynamically
  limiter.defineTier('premium', {
    name: 'premium',
    requestsPerMinute: 500,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 100,
  });

  // Remove a tier (cannot remove default tier)
  limiter.removeTier('premium');

  // Get all available tiers
  const tiers = limiter.getTiers();
  console.log('Available tiers:', Object.keys(tiers));
}

// ============================================================================
// Example 4: Multiple Identifier Types
// ============================================================================

async function multipleIdentifiersExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'default',
    tiers: {
      default: {
        name: 'default',
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
    },
  });

  // Rate limit by user ID
  await limiter.checkLimit({ userId: 'user_123' });

  // Rate limit by API key
  await limiter.checkLimit({ apiKey: 'sk_live_abc123' });

  // Rate limit by IP address
  await limiter.checkLimit({ ipAddress: '192.168.1.1' });

  // Rate limit by custom identifier
  await limiter.checkLimit({ customId: 'session_xyz789' });

  // Priority order: userId > apiKey > ipAddress > customId
  // This will use userId as the identifier
  await limiter.checkLimit({
    userId: 'user_123',
    apiKey: 'sk_live_abc123',
    ipAddress: '192.168.1.1',
  });
}

// ============================================================================
// Example 5: Status Monitoring
// ============================================================================

async function statusMonitoringExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 10,
      },
    },
  });

  // Make some requests
  for (let i = 0; i < 5; i++) {
    await limiter.checkLimit({ userId: 'user_123' });
  }

  // Get detailed status for a user (without recording a request)
  const status = await limiter.getStatus({ userId: 'user_123' });
  console.log('User status:', status);
  // Output:
  // {
  //   tier: 'free',
  //   limits: {
  //     minute: { used: 5, limit: 60, remaining: 55 },
  //     hour: { used: 5, limit: 1000, remaining: 995 },
  //     day: { used: 5, limit: 10000, remaining: 9995 },
  //     burst: { used: 0, limit: 10, remaining: 10 }
  //   }
  // }

  // Get memory statistics (in-memory storage only)
  const stats = limiter.getMemoryStats();
  if (stats) {
    console.log('Memory stats:', stats);
    // Output:
    // {
    //   totalIdentifiers: 1,
    //   totalRequests: 5,
    //   oldestRequest: 2024-01-01T00:00:00.000Z
    // }
  }
}

// ============================================================================
// Example 6: Reset Rate Limits
// ============================================================================

async function resetExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerMinute: 10,
        requestsPerHour: 100,
      },
    },
  });

  // Make some requests
  await limiter.checkLimit({ userId: 'user_123' });

  // Reset rate limits for a specific user
  await limiter.reset({ userId: 'user_123' });

  // Reset all rate limits (use with caution)
  await limiter.reset();
}

// ============================================================================
// Example 7: Redis Storage (Distributed Systems)
// ============================================================================

async function redisExample() {
  // Note: Requires a Redis client (e.g., ioredis)
  // import Redis from 'ioredis';
  // const redisClient = new Redis({
  //   host: 'localhost',
  //   port: 6379,
  // });

  const redisClient: any = null; // Replace with actual Redis client

  const limiter = createUserRateLimiter(
    {
      defaultTier: 'free',
      tiers: {
        free: {
          name: 'free',
          requestsPerMinute: 60,
          requestsPerHour: 1000,
        },
      },
      storage: 'redis',
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'optional_password',
        db: 0,
      },
    },
    redisClient
  );

  // Now works across multiple server instances
  await limiter.checkLimit({ userId: 'user_123' });
}

// ============================================================================
// Example 8: Custom Configuration Per Route
// ============================================================================

function perRouteExample() {
  // Create different limiters for different API endpoints
  const authLimiter = createUserRateLimiter({
    defaultTier: 'default',
    tiers: {
      default: {
        name: 'default',
        requestsPerMinute: 5, // Strict limit for auth endpoints
        requestsPerHour: 20,
        burstLimit: 2,
      },
    },
  });

  const apiLimiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
      pro: {
        name: 'pro',
        requestsPerMinute: 600,
        requestsPerHour: 10000,
      },
    },
  });

  // Use different limiters for different routes
  // app.post('/auth/login', createRateLimitMiddleware(authLimiter), loginHandler);
  // app.get('/api/data', createRateLimitMiddleware(apiLimiter), dataHandler);
}

// ============================================================================
// Example 9: Sliding Window vs Fixed Window
// ============================================================================

async function slidingWindowExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'demo',
    tiers: {
      demo: {
        name: 'demo',
        requestsPerMinute: 10,
      },
    },
  });

  // The sliding window algorithm means:
  // - At time 0s: make 10 requests (allowed)
  // - At time 30s: make 1 request (rejected - 10 requests in last 60s)
  // - At time 61s: make 1 request (allowed - oldest requests expired)

  const start = Date.now();

  // Burst of 10 requests
  for (let i = 0; i < 10; i++) {
    const result = await limiter.checkLimit({ userId: 'demo_user' });
    console.log(`Request ${i + 1}: ${result.allowed ? 'allowed' : 'denied'}`);
  }

  // This will be denied (11th request within 1 minute)
  const result = await limiter.checkLimit({ userId: 'demo_user' });
  console.log(`Request 11: ${result.allowed ? 'allowed' : 'denied'}`);
  console.log(`Reset at: ${result.resetAt}`);
}

// ============================================================================
// Example 10: Integration with RANA Client
// ============================================================================

async function ranaIntegrationExample() {
  const limiter = createUserRateLimiter({
    defaultTier: 'free',
    tiers: {
      free: {
        name: 'free',
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      },
      pro: {
        name: 'pro',
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
    },
  });

  // In your API handler
  async function handleRanaRequest(userId: string, request: any) {
    // Check rate limit before processing
    const rateLimitResult = await limiter.checkLimit({ userId });

    if (!rateLimitResult.allowed) {
      return {
        error: 'Rate limit exceeded',
        headers: rateLimitResult.headers,
        resetAt: rateLimitResult.resetAt,
      };
    }

    // Process the RANA request
    // const response = await ranaClient.chat.create(request);

    // Return response with rate limit headers
    return {
      // response,
      headers: rateLimitResult.headers,
    };
  }
}

// ============================================================================
// Run Examples
// ============================================================================

// Uncomment to run examples
// basicExample();
// tierManagementExample();
// multipleIdentifiersExample();
// statusMonitoringExample();
// resetExample();
// slidingWindowExample();
