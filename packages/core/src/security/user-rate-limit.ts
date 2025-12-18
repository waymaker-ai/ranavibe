/**
 * User-based Rate Limiter for RANA Security
 * Implements per-user rate limiting with sliding window algorithm
 * Complements the provider-based rate limiter in providers/rate-limiter.ts
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Interface for Redis client operations needed by the rate limiter
 * This allows any Redis client implementation (ioredis, node-redis, etc.)
 */
export interface RedisClientLike {
  /** Get members of a sorted set by score range */
  zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]>;
  /** Add member to sorted set with score */
  zadd(key: string, score: number, member: string): Promise<number>;
  /** Set key expiration in seconds */
  expire(key: string, seconds: number): Promise<number>;
  /** Remove members of sorted set by score range */
  zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
  /** Delete one or more keys */
  del(...keys: string[]): Promise<number>;
  /** Find keys matching pattern */
  keys(pattern: string): Promise<string[]>;
}

/**
 * Type for limit status used in getStatus response
 */
interface LimitStatus {
  minute?: { used: number; limit: number; remaining: number };
  hour?: { used: number; limit: number; remaining: number };
  day?: { used: number; limit: number; remaining: number };
  burst?: { used: number; limit: number; remaining: number };
}

/**
 * Rate limit tier configuration
 */
export interface RateLimitTier {
  /** Tier name (e.g., 'free', 'pro', 'enterprise') */
  name: string;
  /** Maximum requests per minute */
  requestsPerMinute?: number;
  /** Maximum requests per hour */
  requestsPerHour?: number;
  /** Maximum requests per day */
  requestsPerDay?: number;
  /** Maximum burst of requests allowed in a short time */
  burstLimit?: number;
}

/**
 * User identifier options
 */
export interface UserIdentifier {
  /** User ID */
  userId?: string;
  /** API key */
  apiKey?: string;
  /** IP address */
  ipAddress?: string;
  /** Custom identifier */
  customId?: string;
}

/**
 * Rate limit configuration
 */
export interface UserRateLimitConfig {
  /** Default tier for users without explicit tier assignment */
  defaultTier: string;
  /** Available rate limit tiers */
  tiers: Record<string, RateLimitTier>;
  /** Storage backend ('memory' or 'redis') */
  storage?: 'memory' | 'redis';
  /** Redis connection options (if storage is 'redis') */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  /** Cleanup interval for in-memory storage (ms, default: 60000) */
  cleanupInterval?: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** Timestamp when rate limit resets */
  resetAt: Date;
  /** User's tier */
  tier: string;
  /** Standard rate limit headers */
  headers: Record<string, string>;
  /** Optional reason for rejection */
  reason?: string;
}

/**
 * Request record for sliding window tracking
 */
interface RequestRecord {
  timestamp: number;
  identifier: string;
}

/**
 * User tier assignment
 */
interface UserTierAssignment {
  identifier: string;
  tier: string;
}

/**
 * Window state for rate limiting
 */
interface WindowState {
  requests: RequestRecord[];
  lastCleanup: number;
}

// ============================================================================
// Storage Backends
// ============================================================================

/**
 * Abstract storage backend interface
 */
interface StorageBackend {
  getRequests(identifier: string, windowMs: number): Promise<RequestRecord[]>;
  addRequest(identifier: string, timestamp: number): Promise<void>;
  cleanup(identifier: string, windowMs: number): Promise<void>;
  reset(identifier?: string): Promise<void>;
}

/**
 * In-memory storage backend with automatic cleanup
 */
class MemoryStorageBackend implements StorageBackend {
  private windows: Map<string, WindowState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cleanupMs: number;

  constructor(cleanupMs: number = 60000) {
    this.cleanupMs = cleanupMs;
    this.startCleanup();
  }

  private startCleanup(): void {
    // Periodic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.performGlobalCleanup();
    }, this.cleanupMs);

    // Ensure cleanup runs on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        this.stopCleanup();
      });
    }
  }

  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private performGlobalCleanup(): void {
    const now = Date.now();
    const maxWindowMs = 24 * 60 * 60 * 1000; // 24 hours

    const identifiers = Array.from(this.windows.keys());
    for (const identifier of identifiers) {
      const state = this.windows.get(identifier);
      if (!state) continue;

      // Remove requests older than 24 hours
      state.requests = state.requests.filter(r => now - r.timestamp < maxWindowMs);

      // Remove empty windows
      if (state.requests.length === 0) {
        this.windows.delete(identifier);
      } else {
        state.lastCleanup = now;
      }
    }
  }

  async getRequests(identifier: string, windowMs: number): Promise<RequestRecord[]> {
    const state = this.windows.get(identifier);
    if (!state) {
      return [];
    }

    const now = Date.now();
    const cutoff = now - windowMs;

    // Filter requests within the window
    return state.requests.filter(r => r.timestamp > cutoff);
  }

  async addRequest(identifier: string, timestamp: number): Promise<void> {
    let state = this.windows.get(identifier);

    if (!state) {
      state = {
        requests: [],
        lastCleanup: timestamp,
      };
      this.windows.set(identifier, state);
    }

    state.requests.push({
      timestamp,
      identifier,
    });
  }

  async cleanup(identifier: string, windowMs: number): Promise<void> {
    const state = this.windows.get(identifier);
    if (!state) {
      return;
    }

    const now = Date.now();
    const cutoff = now - windowMs;

    state.requests = state.requests.filter(r => r.timestamp > cutoff);
    state.lastCleanup = now;

    if (state.requests.length === 0) {
      this.windows.delete(identifier);
    }
  }

  async reset(identifier?: string): Promise<void> {
    if (identifier) {
      this.windows.delete(identifier);
    } else {
      this.windows.clear();
    }
  }

  /**
   * Get statistics about memory usage
   */
  getStats(): {
    totalIdentifiers: number;
    totalRequests: number;
    oldestRequest: Date | null;
  } {
    let totalRequests = 0;
    let oldestTimestamp: number | null = null;

    const states = Array.from(this.windows.values());
    for (const state of states) {
      totalRequests += state.requests.length;

      if (state.requests.length > 0) {
        const oldest = state.requests[0].timestamp;
        if (oldestTimestamp === null || oldest < oldestTimestamp) {
          oldestTimestamp = oldest;
        }
      }
    }

    return {
      totalIdentifiers: this.windows.size,
      totalRequests,
      oldestRequest: oldestTimestamp ? new Date(oldestTimestamp) : null,
    };
  }
}

/**
 * Redis storage backend (for distributed rate limiting)
 * Note: Requires redis client to be provided externally
 */
class RedisStorageBackend implements StorageBackend {
  private redisClient: RedisClientLike;
  private keyPrefix: string;

  constructor(redisClient: RedisClientLike, keyPrefix: string = 'rana:ratelimit:') {
    this.redisClient = redisClient;
    this.keyPrefix = keyPrefix;
  }

  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }

  async getRequests(identifier: string, windowMs: number): Promise<RequestRecord[]> {
    const key = this.getKey(identifier);
    const now = Date.now();
    const cutoff = now - windowMs;

    try {
      // Use Redis sorted set to store timestamps
      const timestamps = await this.redisClient.zrangebyscore(
        key,
        cutoff,
        '+inf'
      );

      return timestamps.map((ts: string) => ({
        timestamp: parseInt(ts, 10),
        identifier,
      }));
    } catch (error) {
      console.error('Redis getRequests error:', error);
      return [];
    }
  }

  async addRequest(identifier: string, timestamp: number): Promise<void> {
    const key = this.getKey(identifier);

    try {
      // Add to sorted set with timestamp as both score and value
      await this.redisClient.zadd(key, timestamp, timestamp.toString());

      // Set expiration to 24 hours to prevent unbounded growth
      await this.redisClient.expire(key, 24 * 60 * 60);
    } catch (error) {
      console.error('Redis addRequest error:', error);
    }
  }

  async cleanup(identifier: string, windowMs: number): Promise<void> {
    const key = this.getKey(identifier);
    const now = Date.now();
    const cutoff = now - windowMs;

    try {
      // Remove old entries from sorted set
      await this.redisClient.zremrangebyscore(key, '-inf', cutoff);
    } catch (error) {
      console.error('Redis cleanup error:', error);
    }
  }

  async reset(identifier?: string): Promise<void> {
    try {
      if (identifier) {
        const key = this.getKey(identifier);
        await this.redisClient.del(key);
      } else {
        // Delete all keys with the prefix
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
}

// ============================================================================
// User Rate Limiter Implementation
// ============================================================================

/**
 * User-based rate limiter with sliding window algorithm
 *
 * @example
 * ```typescript
 * const limiter = new UserRateLimiter({
 *   defaultTier: 'free',
 *   tiers: {
 *     free: {
 *       name: 'free',
 *       requestsPerMinute: 10,
 *       requestsPerHour: 100,
 *       requestsPerDay: 1000,
 *       burstLimit: 5,
 *     },
 *     pro: {
 *       name: 'pro',
 *       requestsPerMinute: 100,
 *       requestsPerHour: 1000,
 *       requestsPerDay: 10000,
 *       burstLimit: 50,
 *     },
 *   },
 * });
 *
 * // Check rate limit
 * const result = await limiter.checkLimit({
 *   userId: 'user123',
 *   apiKey: 'key_abc',
 * });
 *
 * if (!result.allowed) {
 *   // Return 429 with headers
 *   return {
 *     status: 429,
 *     headers: result.headers,
 *     body: { error: 'Rate limit exceeded' },
 *   };
 * }
 * ```
 */
export class UserRateLimiter {
  private config: UserRateLimitConfig;
  private storage: StorageBackend;
  private tierAssignments: Map<string, string> = new Map();

  constructor(config: UserRateLimitConfig, redisClient?: RedisClientLike) {
    this.config = config;

    // Initialize storage backend
    if (config.storage === 'redis') {
      if (!redisClient) {
        throw new Error('Redis client required when storage is set to "redis"');
      }
      this.storage = new RedisStorageBackend(redisClient);
    } else {
      this.storage = new MemoryStorageBackend(config.cleanupInterval);
    }

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate the configuration
   */
  private validateConfig(): void {
    if (!this.config.defaultTier) {
      throw new Error('defaultTier is required');
    }

    if (!this.config.tiers || Object.keys(this.config.tiers).length === 0) {
      throw new Error('At least one tier must be defined');
    }

    if (!this.config.tiers[this.config.defaultTier]) {
      throw new Error(`Default tier "${this.config.defaultTier}" not found in tiers`);
    }

    // Validate each tier has at least one limit
    for (const [name, tier] of Object.entries(this.config.tiers)) {
      if (
        !tier.requestsPerMinute &&
        !tier.requestsPerHour &&
        !tier.requestsPerDay
      ) {
        throw new Error(`Tier "${name}" must have at least one rate limit defined`);
      }
    }
  }

  /**
   * Get a unique identifier string from user identifier object
   */
  private getIdentifierString(identifier: UserIdentifier): string {
    // Priority: userId > apiKey > ipAddress > customId
    if (identifier.userId) {
      return `user:${identifier.userId}`;
    }
    if (identifier.apiKey) {
      return `key:${identifier.apiKey}`;
    }
    if (identifier.ipAddress) {
      return `ip:${identifier.ipAddress}`;
    }
    if (identifier.customId) {
      return `custom:${identifier.customId}`;
    }
    throw new Error('At least one identifier must be provided');
  }

  /**
   * Get the tier for a user
   */
  private getTier(identifierString: string): RateLimitTier {
    const tierName = this.tierAssignments.get(identifierString) || this.config.defaultTier;
    const tier = this.config.tiers[tierName];

    if (!tier) {
      // Fallback to default tier if assigned tier doesn't exist
      return this.config.tiers[this.config.defaultTier];
    }

    return tier;
  }

  /**
   * Assign a tier to a user
   */
  assignTier(identifier: UserIdentifier, tierName: string): void {
    if (!this.config.tiers[tierName]) {
      throw new Error(`Tier "${tierName}" not found`);
    }

    const identifierString = this.getIdentifierString(identifier);
    this.tierAssignments.set(identifierString, tierName);
  }

  /**
   * Get the current tier for a user
   */
  getUserTier(identifier: UserIdentifier): string {
    const identifierString = this.getIdentifierString(identifier);
    return this.tierAssignments.get(identifierString) || this.config.defaultTier;
  }

  /**
   * Check if a request is allowed under rate limits
   * Uses sliding window algorithm for accurate rate limiting
   */
  async checkLimit(identifier: UserIdentifier): Promise<RateLimitResult> {
    const identifierString = this.getIdentifierString(identifier);
    const tier = this.getTier(identifierString);
    const now = Date.now();

    // Check all configured limits
    const limits = [
      {
        value: tier.requestsPerMinute,
        windowMs: 60 * 1000,
        name: 'minute'
      },
      {
        value: tier.requestsPerHour,
        windowMs: 60 * 60 * 1000,
        name: 'hour'
      },
      {
        value: tier.requestsPerDay,
        windowMs: 24 * 60 * 60 * 1000,
        name: 'day'
      },
    ];

    // Check burst limit (last 1 second)
    if (tier.burstLimit) {
      limits.unshift({
        value: tier.burstLimit,
        windowMs: 1000,
        name: 'burst',
      });
    }

    // Check each limit
    for (const limit of limits) {
      if (!limit.value) continue;

      const requests = await this.storage.getRequests(identifierString, limit.windowMs);
      const count = requests.length;

      if (count >= limit.value) {
        // Rate limit exceeded
        const oldestRequest = requests[0];
        const resetAt = new Date(oldestRequest.timestamp + limit.windowMs);

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          tier: tier.name,
          reason: `Rate limit exceeded for ${limit.name}`,
          headers: this.generateHeaders({
            limit: limit.value,
            remaining: 0,
            resetAt,
            tier: tier.name,
          }),
        };
      }
    }

    // All limits passed, record the request
    await this.storage.addRequest(identifierString, now);

    // Calculate remaining based on most restrictive limit
    let minRemaining = Infinity;
    let resetAt = new Date(now + 60 * 1000); // Default to 1 minute

    for (const limit of limits) {
      if (!limit.value) continue;

      const requests = await this.storage.getRequests(identifierString, limit.windowMs);
      const remaining = limit.value - requests.length;

      if (remaining < minRemaining) {
        minRemaining = remaining;
        if (requests.length > 0) {
          resetAt = new Date(requests[0].timestamp + limit.windowMs);
        } else {
          resetAt = new Date(now + limit.windowMs);
        }
      }
    }

    // Cleanup old requests periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
      await this.storage.cleanup(identifierString, 24 * 60 * 60 * 1000);
    }

    return {
      allowed: true,
      remaining: Math.max(0, minRemaining),
      resetAt,
      tier: tier.name,
      headers: this.generateHeaders({
        limit: tier.requestsPerMinute || tier.requestsPerHour || tier.requestsPerDay || 0,
        remaining: Math.max(0, minRemaining),
        resetAt,
        tier: tier.name,
      }),
    };
  }

  /**
   * Generate standard rate limit headers
   */
  private generateHeaders(params: {
    limit: number;
    remaining: number;
    resetAt: Date;
    tier: string;
  }): Record<string, string> {
    return {
      'X-RateLimit-Limit': params.limit.toString(),
      'X-RateLimit-Remaining': params.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(params.resetAt.getTime() / 1000).toString(),
      'X-RateLimit-Tier': params.tier,
      'Retry-After': Math.max(
        0,
        Math.ceil((params.resetAt.getTime() - Date.now()) / 1000)
      ).toString(),
    };
  }

  /**
   * Get current status for a user (without recording a request)
   */
  async getStatus(identifier: UserIdentifier): Promise<{
    tier: string;
    limits: {
      minute?: { used: number; limit: number; remaining: number };
      hour?: { used: number; limit: number; remaining: number };
      day?: { used: number; limit: number; remaining: number };
      burst?: { used: number; limit: number; remaining: number };
    };
  }> {
    const identifierString = this.getIdentifierString(identifier);
    const tier = this.getTier(identifierString);

    const limits: LimitStatus = {};

    // Check minute limit
    if (tier.requestsPerMinute) {
      const requests = await this.storage.getRequests(identifierString, 60 * 1000);
      limits.minute = {
        used: requests.length,
        limit: tier.requestsPerMinute,
        remaining: Math.max(0, tier.requestsPerMinute - requests.length),
      };
    }

    // Check hour limit
    if (tier.requestsPerHour) {
      const requests = await this.storage.getRequests(identifierString, 60 * 60 * 1000);
      limits.hour = {
        used: requests.length,
        limit: tier.requestsPerHour,
        remaining: Math.max(0, tier.requestsPerHour - requests.length),
      };
    }

    // Check day limit
    if (tier.requestsPerDay) {
      const requests = await this.storage.getRequests(identifierString, 24 * 60 * 60 * 1000);
      limits.day = {
        used: requests.length,
        limit: tier.requestsPerDay,
        remaining: Math.max(0, tier.requestsPerDay - requests.length),
      };
    }

    // Check burst limit
    if (tier.burstLimit) {
      const requests = await this.storage.getRequests(identifierString, 1000);
      limits.burst = {
        used: requests.length,
        limit: tier.burstLimit,
        remaining: Math.max(0, tier.burstLimit - requests.length),
      };
    }

    return {
      tier: tier.name,
      limits,
    };
  }

  /**
   * Reset rate limits for a user
   */
  async reset(identifier?: UserIdentifier): Promise<void> {
    if (identifier) {
      const identifierString = this.getIdentifierString(identifier);
      await this.storage.reset(identifierString);
    } else {
      // Reset all users
      await this.storage.reset();
      this.tierAssignments.clear();
    }
  }

  /**
   * Get memory statistics (only for in-memory storage)
   */
  getMemoryStats(): {
    totalIdentifiers: number;
    totalRequests: number;
    oldestRequest: Date | null;
  } | null {
    if (this.storage instanceof MemoryStorageBackend) {
      return this.storage.getStats();
    }
    return null;
  }

  /**
   * Define or update a tier
   */
  defineTier(tierName: string, tier: RateLimitTier): void {
    if (
      !tier.requestsPerMinute &&
      !tier.requestsPerHour &&
      !tier.requestsPerDay
    ) {
      throw new Error(`Tier "${tierName}" must have at least one rate limit defined`);
    }

    this.config.tiers[tierName] = { ...tier, name: tierName };
  }

  /**
   * Remove a tier (cannot remove default tier)
   */
  removeTier(tierName: string): void {
    if (tierName === this.config.defaultTier) {
      throw new Error('Cannot remove default tier');
    }

    delete this.config.tiers[tierName];

    // Reset any users assigned to this tier
    const identifiers = Array.from(this.tierAssignments.keys());
    for (const identifier of identifiers) {
      const assignedTier = this.tierAssignments.get(identifier);
      if (assignedTier === tierName) {
        this.tierAssignments.delete(identifier);
      }
    }
  }

  /**
   * Get all available tiers
   */
  getTiers(): Record<string, RateLimitTier> {
    return { ...this.config.tiers };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a user rate limiter instance
 *
 * @example
 * ```typescript
 * // Basic usage with in-memory storage
 * const limiter = createUserRateLimiter({
 *   defaultTier: 'free',
 *   tiers: {
 *     free: {
 *       name: 'free',
 *       requestsPerMinute: 10,
 *       requestsPerHour: 100,
 *       requestsPerDay: 1000,
 *     },
 *     pro: {
 *       name: 'pro',
 *       requestsPerMinute: 100,
 *       requestsPerHour: 1000,
 *       requestsPerDay: 10000,
 *       burstLimit: 50,
 *     },
 *   },
 * });
 *
 * // With Redis storage
 * const limiter = createUserRateLimiter({
 *   defaultTier: 'free',
 *   tiers: { ... },
 *   storage: 'redis',
 *   redis: {
 *     host: 'localhost',
 *     port: 6379,
 *   },
 * }, redisClient);
 * ```
 */
export function createUserRateLimiter(
  config: UserRateLimitConfig,
  redisClient?: RedisClientLike
): UserRateLimiter {
  return new UserRateLimiter(config, redisClient);
}
