/**
 * Redis Cache
 * Production-ready distributed cache using Redis
 */

import { CacheProvider, CacheConfig, CacheStats } from './types.js';

export interface RedisConfig extends CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
  tls?: boolean;
  keyPrefix?: string;
  connectTimeout?: number;
  retryDelayMs?: number;
  maxRetries?: number;
}

// Redis client interface (compatible with ioredis)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<string>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(...keys: string[]): Promise<number>;
  scan(cursor: string | number, ...args: unknown[]): Promise<[string, string[]]>;
  dbsize(): Promise<number>;
  info(section?: string): Promise<string>;
  quit(): Promise<string>;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

export class RedisCache implements CacheProvider {
  private client: RedisClient | null = null;
  private config: RedisConfig;
  private stats = { hits: 0, misses: 0 };
  private connected = false;

  constructor(config: RedisConfig = {}) {
    this.config = {
      host: 'localhost',
      port: 6379,
      db: 0,
      ttl: 3600,
      prefix: 'rana:cache:',
      connectTimeout: 5000,
      retryDelayMs: 100,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.client && this.connected) return;

    try {
      // Dynamic import to make ioredis optional
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Redis = await (Function('return import("ioredis")')() as Promise<any>);
      const RedisClient = Redis.default || Redis;

      const redisConfig: Record<string, unknown> = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        connectTimeout: this.config.connectTimeout,
        retryStrategy: (times: number) => {
          if (times > (this.config.maxRetries || 3)) {
            return null; // Stop retrying
          }
          return Math.min(times * (this.config.retryDelayMs || 100), 3000);
        },
      };

      if (this.config.tls) {
        redisConfig.tls = {};
      }

      if (this.config.url) {
        this.client = new RedisClient(this.config.url, redisConfig) as RedisClient;
      } else {
        this.client = new RedisClient(redisConfig) as RedisClient;
      }

      // Set up event handlers
      this.client.on('connect', () => {
        this.connected = true;
      });

      this.client.on('error', (err: unknown) => {
        console.error('[Redis Cache] Connection error:', err instanceof Error ? err.message : String(err));
        this.connected = false;
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, this.config.connectTimeout);

        this.client!.on('ready', () => {
          clearTimeout(timeout);
          this.connected = true;
          resolve();
        });

        this.client!.on('error', (err: unknown) => {
          clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error(String(err)));
        });
      });
    } catch (error) {
      throw new Error(
        `Redis connection failed. Make sure ioredis is installed: npm install ioredis\n${error}`
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureConnected();

    const fullKey = this.getFullKey(key);

    try {
      const value = await this.client!.get(fullKey);

      if (!value) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return this.deserialize<T>(value);
    } catch (error) {
      console.error('[Redis Cache] Get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.ensureConnected();

    const fullKey = this.getFullKey(key);
    const actualTtl = ttl ?? this.config.ttl ?? 3600;
    const serialized = this.serialize(value);

    try {
      if (actualTtl > 0) {
        await this.client!.setex(fullKey, actualTtl, serialized);
      } else {
        await this.client!.set(fullKey, serialized);
      }
    } catch (error) {
      console.error('[Redis Cache] Set error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    await this.ensureConnected();

    const fullKey = this.getFullKey(key);

    try {
      const exists = await this.client!.exists(fullKey);
      return exists > 0;
    } catch (error) {
      console.error('[Redis Cache] Exists error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureConnected();

    const fullKey = this.getFullKey(key);

    try {
      const deleted = await this.client!.del(fullKey);
      return deleted > 0;
    } catch (error) {
      console.error('[Redis Cache] Delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    await this.ensureConnected();

    try {
      const pattern = `${this.config.prefix}*`;
      let cursor = '0';
      const keysToDelete: string[] = [];

      // Use SCAN to find all keys with our prefix
      do {
        const [nextCursor, keys] = await this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        if (batch.length > 0) {
          await this.client!.del(...batch);
        }
      }

      this.stats = { hits: 0, misses: 0 };
    } catch (error) {
      console.error('[Redis Cache] Clear error:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.ensureConnected();

    const total = this.stats.hits + this.stats.misses;
    let size = 0;

    try {
      const pattern = `${this.config.prefix}*`;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        size += keys.length;
      } while (cursor !== '0');
    } catch (error) {
      console.error('[Redis Cache] Stats error:', error);
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore errors on close
      }
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Get Redis info
   */
  async getInfo(): Promise<Record<string, string>> {
    await this.ensureConnected();

    try {
      const info = await this.client!.info();
      const result: Record<string, string> = {};

      for (const line of info.split('\n')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key.trim()] = value.trim();
        }
      }

      return result;
    } catch (error) {
      console.error('[Redis Cache] Info error:', error);
      return {};
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected || !this.client) {
      await this.connect();
    }
  }

  private getFullKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private serialize<T>(value: T): string {
    if (this.config.serialize) {
      return this.config.serialize(value);
    }
    return JSON.stringify(value);
  }

  private deserialize<T>(str: string): T {
    if (this.config.deserialize) {
      return this.config.deserialize(str) as T;
    }
    return JSON.parse(str) as T;
  }
}
