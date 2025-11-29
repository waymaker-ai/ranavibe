/**
 * File Cache
 * Persistent file-based cache for local development
 */

import { CacheProvider, CacheConfig, CacheStats, CacheEntry } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileCache implements CacheProvider {
  private config: CacheConfig & { cacheDir: string };
  private stats = { hits: 0, misses: 0 };

  constructor(config: CacheConfig & { cacheDir?: string } = {}) {
    this.config = {
      ttl: 3600,
      prefix: 'rana_',
      cacheDir: config.cacheDir || path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        '.rana',
        'cache'
      ),
      ...config,
    };

    // Ensure cache directory exists
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      this.stats.misses++;
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // Check expiration
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        fs.unlinkSync(filePath);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const filePath = this.getFilePath(key);
    const actualTtl = ttl ?? this.config.ttl;

    const entry: CacheEntry<T> = {
      data: value,
      createdAt: Date.now(),
      expiresAt: actualTtl ? Date.now() + actualTtl * 1000 : undefined,
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      console.error('[File Cache] Write error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.cacheDir);
      const prefix = this.config.prefix || '';

      for (const file of files) {
        if (file.startsWith(prefix)) {
          fs.unlinkSync(path.join(this.config.cacheDir, file));
        }
      }

      this.stats = { hits: 0, misses: 0 };
    } catch (error) {
      console.error('[File Cache] Clear error:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    let size = 0;

    try {
      const files = fs.readdirSync(this.config.cacheDir);
      const prefix = this.config.prefix || '';
      size = files.filter(f => f.startsWith(prefix)).length;
    } catch {
      // Ignore
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  async close(): Promise<void> {
    // No-op for file cache
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    let deleted = 0;

    try {
      const files = fs.readdirSync(this.config.cacheDir);
      const prefix = this.config.prefix || '';
      const now = Date.now();

      for (const file of files) {
        if (!file.startsWith(prefix)) continue;

        const filePath = path.join(this.config.cacheDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const entry: CacheEntry = JSON.parse(content);

          if (entry.expiresAt && entry.expiresAt < now) {
            fs.unlinkSync(filePath);
            deleted++;
          }
        } catch {
          // Invalid file, delete it
          fs.unlinkSync(filePath);
          deleted++;
        }
      }
    } catch (error) {
      console.error('[File Cache] Cleanup error:', error);
    }

    return deleted;
  }

  private getFilePath(key: string): string {
    // Hash the key to create a valid filename
    const hash = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, 32);

    return path.join(this.config.cacheDir, `${this.config.prefix}${hash}.json`);
  }
}
