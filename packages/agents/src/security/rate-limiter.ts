/**
 * Rate Limiter
 * Protect against abuse with configurable rate limiting
 */

export interface RateLimitConfig {
  /** Maximum requests in window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Key generator function */
  keyGenerator?: (ctx: RateLimitContext) => string;
  /** Skip function (return true to skip rate limiting) */
  skip?: (ctx: RateLimitContext) => boolean;
  /** Action when rate limited */
  onRateLimited?: (ctx: RateLimitContext, info: RateLimitInfo) => void;
  /** Store implementation */
  store?: RateLimitStore;
}

export interface RateLimitContext {
  userId?: string;
  orgId?: string;
  ip?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter: number; // seconds
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs = 60000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.resetAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Rate Limiter class
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      keyGenerator: config.keyGenerator ?? defaultKeyGenerator,
      skip: config.skip ?? (() => false),
      onRateLimited: config.onRateLimited ?? (() => {}),
      store: config.store ?? new MemoryRateLimitStore(),
    };
    this.store = this.config.store;
  }

  /**
   * Check if request is allowed
   */
  async check(ctx: RateLimitContext): Promise<RateLimitResult> {
    // Check if should skip
    if (this.config.skip(ctx)) {
      return {
        allowed: true,
        info: {
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          resetAt: new Date(Date.now() + this.config.windowMs),
          retryAfter: 0,
        },
      };
    }

    const key = this.config.keyGenerator(ctx);
    const now = Date.now();

    let entry = await this.store.get(key);

    // Create new entry if none exists or expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const resetAt = new Date(entry.resetAt);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining,
      resetAt,
      retryAfter: remaining === 0 ? retryAfter : 0,
    };

    // Check if rate limited
    if (entry.count >= this.config.maxRequests) {
      this.config.onRateLimited(ctx, info);
      return { allowed: false, info };
    }

    // Increment counter
    entry.count++;
    await this.store.set(key, entry);

    return {
      allowed: true,
      info: {
        ...info,
        remaining: remaining - 1,
      },
    };
  }

  /**
   * Consume a request (check + increment atomically)
   */
  async consume(ctx: RateLimitContext): Promise<RateLimitResult> {
    return this.check(ctx);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(ctx: RateLimitContext): Promise<void> {
    const key = this.config.keyGenerator(ctx);
    await this.store.delete(key);
  }

  /**
   * Get current rate limit info without consuming
   */
  async getInfo(ctx: RateLimitContext): Promise<RateLimitInfo> {
    const key = this.config.keyGenerator(ctx);
    const now = Date.now();
    const entry = await this.store.get(key);

    if (!entry || entry.resetAt < now) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetAt: new Date(now + this.config.windowMs),
        retryAfter: 0,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    return {
      limit: this.config.maxRequests,
      remaining,
      resetAt: new Date(entry.resetAt),
      retryAfter: remaining === 0 ? Math.ceil((entry.resetAt - now) / 1000) : 0,
    };
  }
}

/**
 * Default key generator
 */
function defaultKeyGenerator(ctx: RateLimitContext): string {
  const parts = [ctx.userId || 'anon', ctx.ip || 'unknown', ctx.path || 'default'];
  return parts.join(':');
}

/**
 * Sliding window rate limiter (more accurate but more complex)
 */
export class SlidingWindowRateLimiter {
  private config: Required<RateLimitConfig>;
  private windows = new Map<string, number[]>();

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      keyGenerator: config.keyGenerator ?? defaultKeyGenerator,
      skip: config.skip ?? (() => false),
      onRateLimited: config.onRateLimited ?? (() => {}),
      store: config.store ?? new MemoryRateLimitStore(),
    };
  }

  async check(ctx: RateLimitContext): Promise<RateLimitResult> {
    if (this.config.skip(ctx)) {
      return {
        allowed: true,
        info: {
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          resetAt: new Date(Date.now() + this.config.windowMs),
          retryAfter: 0,
        },
      };
    }

    const key = this.config.keyGenerator(ctx);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create window
    let timestamps = this.windows.get(key) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    const remaining = Math.max(0, this.config.maxRequests - timestamps.length);
    const oldestTimestamp = timestamps[0] || now;
    const resetAt = new Date(oldestTimestamp + this.config.windowMs);

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining,
      resetAt,
      retryAfter: remaining === 0 ? Math.ceil((resetAt.getTime() - now) / 1000) : 0,
    };

    if (timestamps.length >= this.config.maxRequests) {
      this.config.onRateLimited(ctx, info);
      this.windows.set(key, timestamps);
      return { allowed: false, info };
    }

    // Add current timestamp
    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      allowed: true,
      info: {
        ...info,
        remaining: remaining - 1,
      },
    };
  }
}

/**
 * Create a rate limiter
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Common rate limit presets
 */
export const rateLimitPresets = {
  /** Standard API rate limit: 100 requests per minute */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  /** Strict rate limit: 20 requests per minute */
  strict: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },

  /** Relaxed rate limit: 1000 requests per minute */
  relaxed: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },

  /** Per-second limit: 10 requests per second */
  perSecond: {
    maxRequests: 10,
    windowMs: 1000,
  },

  /** Daily limit: 10000 requests per day */
  daily: {
    maxRequests: 10000,
    windowMs: 24 * 60 * 60 * 1000,
  },

  /** LLM API limit: 60 requests per minute (typical LLM rate) */
  llmApi: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
};
