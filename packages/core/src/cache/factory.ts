/**
 * Cache Factory
 * Create cache instances with different backends
 */

import { CacheProvider, CacheConfig } from './types.js';
import { MemoryCache } from './memory.js';
import { RedisCache, RedisConfig } from './redis.js';
import { FileCache } from './file.js';

export type CacheType = 'memory' | 'redis' | 'file';

export interface CreateCacheOptions extends CacheConfig {
  type: CacheType;
  redis?: Omit<RedisConfig, keyof CacheConfig>;
  cacheDir?: string;
}

/**
 * Create a cache provider based on configuration
 */
export function createCache(options: CreateCacheOptions): CacheProvider {
  const { type, redis, cacheDir, ...baseConfig } = options;

  switch (type) {
    case 'redis':
      return new RedisCache({
        ...baseConfig,
        ...redis,
      });

    case 'file':
      return new FileCache({
        ...baseConfig,
        cacheDir,
      });

    case 'memory':
    default:
      return new MemoryCache(baseConfig);
  }
}

// Global cache instance
let globalCache: CacheProvider | null = null;

/**
 * Get or create the global cache instance
 */
export function getGlobalCache(options?: CreateCacheOptions): CacheProvider {
  if (!globalCache) {
    globalCache = createCache(options || { type: 'memory' });
  }
  return globalCache;
}

/**
 * Set the global cache instance
 */
export function setGlobalCache(cache: CacheProvider): void {
  globalCache = cache;
}

/**
 * Clear the global cache
 */
export async function clearGlobalCache(): Promise<void> {
  if (globalCache) {
    await globalCache.clear();
  }
}
