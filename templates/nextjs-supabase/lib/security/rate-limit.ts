import { Redis } from '@upstash/redis';

/**
 * Redis client for rate limiting
 * If not configured, rate limiting is disabled
 */
const redis = process.env.UPSTASH_REDIS_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    })
  : null;

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxRequests: 100, // requests per window
  windowMs: 60000, // 1 minute
};

/**
 * Rate limit a request based on identifier (typically IP address)
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @returns Object with success status and rate limit info
 *
 * @example
 * ```ts
 * const { success, limit, remaining, reset } = await rateLimit(request.ip);
 * if (!success) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export async function rateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If Redis not configured, allow all requests
  if (!redis) {
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      reset: Date.now() + RATE_LIMIT_CONFIG.windowMs,
    };
  }

  try {
    const key = `rate-limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    // Check if over limit
    if (requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, {
        withScores: true,
      });
      const resetTime =
        oldestRequest.length > 0
          ? Number(oldestRequest[1]) + RATE_LIMIT_CONFIG.windowMs
          : now + RATE_LIMIT_CONFIG.windowMs;

      return {
        success: false,
        limit: RATE_LIMIT_CONFIG.maxRequests,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add new request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiry on the key
    await redis.expire(key, Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000));

    return {
      success: true,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests - requestCount - 1,
      reset: now + RATE_LIMIT_CONFIG.windowMs,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow request (fail open)
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      reset: Date.now() + RATE_LIMIT_CONFIG.windowMs,
    };
  }
}

/**
 * Custom rate limit for specific routes
 *
 * @example
 * ```ts
 * // API route with custom limit
 * export async function POST(request: Request) {
 *   const { success } = await customRateLimit(request.ip, 10, 60000); // 10 req/min
 *   if (!success) {
 *     return new Response('Too Many Requests', { status: 429 });
 *   }
 * }
 * ```
 */
export async function customRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!redis) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: Date.now() + windowMs,
    };
  }

  try {
    const key = `rate-limit:custom:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    await redis.zremrangebyscore(key, 0, windowStart);
    const requestCount = await redis.zcard(key);

    if (requestCount >= maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, {
        withScores: true,
      });
      const resetTime =
        oldestRequest.length > 0
          ? Number(oldestRequest[1]) + windowMs
          : now + windowMs;

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: resetTime,
      };
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - requestCount - 1,
      reset: now + windowMs,
    };
  } catch (error) {
    console.error('Custom rate limit error:', error);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: Date.now() + windowMs,
    };
  }
}
