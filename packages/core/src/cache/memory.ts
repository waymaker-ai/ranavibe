/**
 * Memory Cache
 * In-memory LRU cache implementation
 */

import { CacheProvider, CacheConfig, CacheStats, CacheEntry } from './types.js';

export class MemoryCache implements CacheProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: 3600, // 1 hour default
      maxSize: 1000,
      prefix: 'rana:',
      ...config,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // Move to end (LRU)
    this.cache.delete(fullKey);
    this.cache.set(fullKey, entry);

    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const actualTtl = ttl ?? this.config.ttl;

    // Enforce max size (LRU eviction)
    if (this.cache.size >= (this.config.maxSize || 1000)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry = {
      data: value,
      createdAt: Date.now(),
      expiresAt: actualTtl ? Date.now() + actualTtl * 1000 : undefined,
    };

    this.cache.set(fullKey, entry);
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return this.cache.delete(fullKey);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  async close(): Promise<void> {
    // No-op for memory cache
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  private getFullKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }
}
