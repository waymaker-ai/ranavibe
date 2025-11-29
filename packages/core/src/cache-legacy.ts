/**
 * Cache Manager
 * Handles response caching to reduce costs
 */

import type { RanaChatRequest, RanaChatResponse } from './types';
import crypto from 'crypto';

export class CacheManager {
  private memoryCache: Map<string, { response: RanaChatResponse; expires: number }> = new Map();
  private config: any;
  private redis: any = null;

  constructor(config: any) {
    this.config = config;

    // Initialize Redis if configured
    if (config?.provider === 'redis' && config?.redis) {
      this.initRedis();
    }
  }

  /**
   * Get cached response
   */
  async get(request: RanaChatRequest): Promise<RanaChatResponse | null> {
    const key = this.generateKey(request);

    // Try memory cache first
    if (this.config?.provider === 'memory' || !this.redis) {
      const cached = this.memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return { ...cached.response, cached: true };
      }
      return null;
    }

    // Try Redis
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const response = JSON.parse(cached);
        return { ...response, cached: true };
      }
    } catch (error) {
      console.error('[RANA Cache] Redis get error:', error);
    }

    return null;
  }

  /**
   * Set cache
   */
  async set(request: RanaChatRequest, response: RanaChatResponse): Promise<void> {
    const key = this.generateKey(request);
    const ttl = this.config?.ttl || 3600;

    // Memory cache
    if (this.config?.provider === 'memory' || !this.redis) {
      this.memoryCache.set(key, {
        response,
        expires: Date.now() + ttl * 1000,
      });
      return;
    }

    // Redis cache
    try {
      await this.redis.setex(key, ttl, JSON.stringify(response));
    } catch (error) {
      console.error('[RANA Cache] Redis set error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.redis) {
      try {
        const keys = await this.redis.keys('rana:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('[RANA Cache] Redis clear error:', error);
      }
    }
  }

  /**
   * Generate cache key from request
   */
  private generateKey(request: RanaChatRequest): string {
    const normalized = {
      provider: request.provider,
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');

    return `rana:cache:${hash}`;
  }

  /**
   * Initialize Redis connection
   */
  private async initRedis(): Promise<void> {
    try {
      const Redis = await import('ioredis');
      this.redis = new Redis.default(this.config.redis);
      console.log('[RANA Cache] Redis connected');
    } catch (error) {
      console.error('[RANA Cache] Redis initialization failed:', error);
      console.log('[RANA Cache] Falling back to memory cache');
    }
  }
}
