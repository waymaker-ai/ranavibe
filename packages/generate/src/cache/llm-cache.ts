/**
 * LLM Response Cache
 *
 * Caches LLM responses to reduce costs and latency.
 * Uses content-addressable storage with TTL expiration.
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry {
  response: string;
  model: string;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  tokens: {
    prompt: number;
    completion: number;
  };
  cost: number;
}

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  ttlMs: number;
  maxEntries: number;
  maxSizeBytes: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSaved: number;
  entriesCount: number;
  sizeBytes: number;
}

export interface CachedLLMProvider {
  complete(prompt: string): Promise<string>;
  getCacheStats(): Promise<CacheStats>;
  clearCache(): Promise<void>;
}

// ============================================================================
// LLM Cache Implementation
// ============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  directory: '.rana/cache/llm',
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 10000,
  maxSizeBytes: 500 * 1024 * 1024, // 500MB
};

// Cost estimates per 1K tokens (approximate)
const COST_PER_1K_TOKENS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
  'default': { prompt: 0.005, completion: 0.015 },
};

export class LLMCache {
  private config: CacheConfig;
  private stats: CacheStats;
  private memoryCache: Map<string, CacheEntry>;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSaved: 0,
      entriesCount: 0,
      sizeBytes: 0,
    };
    this.memoryCache = new Map();
  }

  /**
   * Generate cache key from prompt
   */
  private generateKey(prompt: string, model?: string): string {
    const content = `${model || 'default'}:${prompt}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cache file path
   */
  private getCachePath(key: string): string {
    const subdir = key.substring(0, 2);
    return path.join(this.config.directory, subdir, `${key}.json`);
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Get cached response
   */
  async get(prompt: string, model?: string): Promise<string | null> {
    if (!this.config.enabled) return null;

    const key = this.generateKey(prompt, model);

    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      this.recordHit(memEntry);
      return memEntry.response;
    }

    // Check disk cache
    try {
      const filePath = this.getCachePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry = JSON.parse(data);

      // Check expiration
      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        this.recordMiss();
        return null;
      }

      // Update hit count and save
      entry.hitCount++;
      this.memoryCache.set(key, entry);
      this.recordHit(entry);

      // Update disk asynchronously
      this.saveEntry(key, entry).catch(() => {});

      return entry.response;
    } catch {
      this.recordMiss();
      return null;
    }
  }

  /**
   * Set cached response
   */
  async set(
    prompt: string,
    response: string,
    model?: string,
    tokens?: { prompt: number; completion: number }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const key = this.generateKey(prompt, model);
    const modelKey = model || 'default';
    const costs = COST_PER_1K_TOKENS[modelKey] || COST_PER_1K_TOKENS.default;

    const estimatedTokens = tokens || {
      prompt: Math.ceil(prompt.length / 4),
      completion: Math.ceil(response.length / 4),
    };

    const cost =
      (estimatedTokens.prompt / 1000) * costs.prompt +
      (estimatedTokens.completion / 1000) * costs.completion;

    const entry: CacheEntry = {
      response,
      model: modelKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.ttlMs,
      hitCount: 0,
      tokens: estimatedTokens,
      cost,
    };

    // Save to memory cache
    this.memoryCache.set(key, entry);

    // Save to disk
    await this.saveEntry(key, entry);

    // Prune if necessary
    await this.pruneIfNecessary();
  }

  /**
   * Save entry to disk
   */
  private async saveEntry(key: string, entry: CacheEntry): Promise<void> {
    const filePath = this.getCachePath(key);
    await this.ensureDirectory(filePath);
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      const filePath = this.getCachePath(key);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(entry: CacheEntry): void {
    this.stats.hits++;
    this.stats.totalSaved += entry.cost;
    this.updateHitRate();
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Prune cache if necessary
   */
  private async pruneIfNecessary(): Promise<void> {
    // Check entry count
    if (this.memoryCache.size > this.config.maxEntries) {
      await this.pruneOldest(this.config.maxEntries / 2);
    }
  }

  /**
   * Prune oldest entries
   */
  private async pruneOldest(count: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .slice(0, count);

    for (const [key] of entries) {
      await this.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    try {
      await fs.rm(this.config.directory, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSaved: 0,
      entriesCount: 0,
      sizeBytes: 0,
    };
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    // Update counts from disk
    try {
      let totalSize = 0;
      let entryCount = 0;

      const subdirs = await fs.readdir(this.config.directory).catch(() => []);
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.config.directory, subdir);
        const files = await fs.readdir(subdirPath).catch(() => []);
        entryCount += files.length;

        for (const file of files) {
          const filePath = path.join(subdirPath, file);
          const stat = await fs.stat(filePath).catch(() => ({ size: 0 }));
          totalSize += stat.size;
        }
      }

      this.stats.entriesCount = entryCount;
      this.stats.sizeBytes = totalSize;
    } catch {
      // Use memory cache counts as fallback
      this.stats.entriesCount = this.memoryCache.size;
    }

    return { ...this.stats };
  }
}

// ============================================================================
// Cached LLM Provider Wrapper
// ============================================================================

export interface LLMProvider {
  complete(prompt: string): Promise<string>;
  model?: string;
}

export function createCachedProvider(
  provider: LLMProvider,
  cacheConfig?: Partial<CacheConfig>
): CachedLLMProvider {
  const cache = new LLMCache(cacheConfig);

  return {
    async complete(prompt: string): Promise<string> {
      // Try cache first
      const cached = await cache.get(prompt, provider.model);
      if (cached !== null) {
        return cached;
      }

      // Call actual provider
      const response = await provider.complete(prompt);

      // Cache the response
      await cache.set(prompt, response, provider.model);

      return response;
    },

    async getCacheStats(): Promise<CacheStats> {
      return cache.getStats();
    },

    async clearCache(): Promise<void> {
      await cache.clear();
    },
  };
}

// ============================================================================
// Semantic Cache (for similar prompts)
// ============================================================================

export interface SemanticCacheConfig extends CacheConfig {
  similarityThreshold: number;
  embeddingProvider?: {
    embed(text: string): Promise<number[]>;
  };
}

export class SemanticLLMCache extends LLMCache {
  private embeddings: Map<string, number[]>;
  private semanticConfig: SemanticCacheConfig;

  constructor(config: Partial<SemanticCacheConfig> = {}) {
    super(config);
    this.semanticConfig = {
      ...DEFAULT_CONFIG,
      similarityThreshold: 0.95,
      ...config,
    };
    this.embeddings = new Map();
  }

  /**
   * Find similar cached prompts
   */
  async findSimilar(prompt: string): Promise<string | null> {
    if (!this.semanticConfig.embeddingProvider) {
      return null;
    }

    const promptEmbedding = await this.semanticConfig.embeddingProvider.embed(prompt);

    let bestMatch: { key: string; similarity: number } | null = null;

    for (const [key, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(promptEmbedding, embedding);
      if (similarity >= this.semanticConfig.similarityThreshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { key, similarity };
        }
      }
    }

    if (bestMatch) {
      return this.getByKey(bestMatch.key);
    }

    return null;
  }

  /**
   * Get cached response by key
   */
  private async getByKey(key: string): Promise<string | null> {
    // Implementation would look up by key
    return null;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}

// Export singleton default cache
export const llmCache = new LLMCache();
