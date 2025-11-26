/**
 * Caching layer for @rana/helpers
 * Provides in-memory and Redis caching for LLM responses
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Generate cache key from input parameters
 */
export function generateCacheKey(
  operation: string,
  input: string,
  options: Record<string, unknown>
): string {
  const normalized = JSON.stringify({
    operation,
    input: input.trim().toLowerCase(),
    options: sortObject(options),
  });

  return createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

/**
 * Sort object keys for consistent hashing
 */
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sorted[key] = sortObject(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}

/**
 * Get value from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // Check memory cache first
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (entry) {
    const now = Date.now();
    if (now - entry.timestamp < entry.ttl * 1000) {
      return entry.value;
    }
    // Expired, remove from cache
    memoryCache.delete(key);
  }

  // TODO: Add Redis support when @rana/core is available
  // const redis = getRedisClient();
  // if (redis) {
  //   const cached = await redis.get(key);
  //   if (cached) return JSON.parse(cached);
  // }

  return null;
}

/**
 * Set value in cache
 */
export async function setInCache<T>(key: string, value: T, ttl: number): Promise<void> {
  // Set in memory cache
  memoryCache.set(key, {
    value,
    timestamp: Date.now(),
    ttl,
  });

  // TODO: Add Redis support when @rana/core is available
  // const redis = getRedisClient();
  // if (redis) {
  //   await redis.setex(key, ttl, JSON.stringify(value));
  // }

  // Clean up old entries periodically
  cleanupCache();
}

/**
 * Remove expired entries from memory cache
 */
function cleanupCache(): void {
  const now = Date.now();
  const maxSize = 10000; // Max entries in memory

  // Remove expired entries
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp >= entry.ttl * 1000) {
      memoryCache.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (memoryCache.size > maxSize) {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, memoryCache.size - maxSize);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  hitRate: number;
  memoryUsage: number;
} {
  return {
    entries: memoryCache.size,
    hitRate: 0, // TODO: Implement hit rate tracking
    memoryUsage: process.memoryUsage().heapUsed,
  };
}
