/**
 * Cache Types
 * Interface definitions for cache providers
 */

export interface CacheEntry<T = unknown> {
  data: T;
  createdAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Max entries (for memory cache)
  prefix?: string; // Key prefix
  serialize?: (data: unknown) => string;
  deserialize?: (str: string) => unknown;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface CacheProvider {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all entries
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Close connection (for Redis, etc.)
   */
  close(): Promise<void>;
}
