/**
 * Vector Memory System
 * Long-term vector memory with similarity search for RANA
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Similarity metric for vector search
 */
export type SimilarityMetric = 'cosine' | 'euclidean' | 'dot';

/**
 * Vector memory entry
 */
export interface VectorMemoryEntry {
  /** Unique identifier */
  id: string;
  /** Original content */
  content: string;
  /** Associated metadata */
  metadata: Record<string, any>;
  /** Embedding vector */
  embedding: number[];
  /** Timestamp when created */
  timestamp: Date;
}

/**
 * Search result with similarity score
 */
export interface VectorSearchResult {
  /** The matching entry */
  entry: VectorMemoryEntry;
  /** Similarity score (0-1, higher is more similar) */
  score: number;
}

/**
 * Vector memory backend adapter interface
 */
export interface VectorMemoryBackend {
  /** Initialize the backend */
  initialize(): Promise<void>;
  /** Store a vector entry */
  store(entry: VectorMemoryEntry): Promise<void>;
  /** Search for similar vectors */
  search(
    query: number[],
    k: number,
    threshold?: number,
    metric?: SimilarityMetric
  ): Promise<VectorSearchResult[]>;
  /** Delete an entry by ID */
  delete(id: string): Promise<boolean>;
  /** Clear all entries */
  clear(): Promise<void>;
  /** Get total entry count */
  count(): Promise<number>;
  /** Close/cleanup backend */
  close(): Promise<void>;
}

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  /** Generate embeddings for text */
  embed(text: string): Promise<number[]>;
  /** Batch embed multiple texts */
  batchEmbed?(texts: string[]): Promise<number[][]>;
  /** Embedding dimensions */
  dimensions: number;
}

/**
 * Vector memory configuration
 */
export interface VectorMemoryConfig {
  /** Embedding dimensions */
  dimensions: number;
  /** Default similarity metric */
  metric?: SimilarityMetric;
  /** Storage backend */
  backend?: VectorMemoryBackend;
  /** Embedding provider (optional for auto-embedding) */
  embeddingProvider?: EmbeddingProvider;
  /** Default search threshold */
  defaultThreshold?: number;
  /** Maximum entries to store (0 = unlimited) */
  maxEntries?: number;
}

/**
 * Vector memory statistics
 */
export interface VectorMemoryStats {
  /** Total entries stored */
  totalEntries: number;
  /** Total searches performed */
  totalSearches: number;
  /** Average search time (ms) */
  averageSearchTime: number;
  /** Storage backend type */
  backendType: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to similarity score (0-1)
 */
export function euclideanToSimilarity(distance: number, maxDistance?: number): number {
  // Normalize using max distance if provided, otherwise use exponential decay
  if (maxDistance && maxDistance > 0) {
    return 1 - Math.min(distance / maxDistance, 1);
  }
  // Exponential decay: e^(-distance)
  return Math.exp(-distance);
}

/**
 * Calculate dot product between two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}

/**
 * Normalize a vector to unit length
 */
export function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
}

/**
 * Calculate similarity based on metric
 */
export function calculateSimilarity(
  a: number[],
  b: number[],
  metric: SimilarityMetric = 'cosine'
): number {
  switch (metric) {
    case 'cosine':
      return cosineSimilarity(a, b);
    case 'euclidean':
      return euclideanToSimilarity(euclideanDistance(a, b));
    case 'dot':
      return dotProduct(a, b);
    default:
      return cosineSimilarity(a, b);
  }
}

// ============================================================================
// In-Memory Backend
// ============================================================================

/**
 * Simple in-memory vector storage
 * Good for development and small datasets
 */
export class InMemoryVectorBackend implements VectorMemoryBackend {
  private entries: Map<string, VectorMemoryEntry> = new Map();

  async initialize(): Promise<void> {
    // No initialization needed for in-memory
  }

  async store(entry: VectorMemoryEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async search(
    query: number[],
    k: number,
    threshold: number = 0,
    metric: SimilarityMetric = 'cosine'
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    // Calculate similarity for all entries
    for (const entry of this.entries.values()) {
      const score = calculateSimilarity(query, entry.embedding, metric);

      if (score >= threshold) {
        results.push({ entry, score });
      }
    }

    // Sort by score descending and take top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  async count(): Promise<number> {
    return this.entries.size;
  }

  async close(): Promise<void> {
    // No cleanup needed
  }
}

// ============================================================================
// File-Based Backend
// ============================================================================

/**
 * File-based vector storage with JSON persistence
 * Good for small to medium datasets that need persistence
 */
export class FileVectorBackend implements VectorMemoryBackend {
  private entries: Map<string, VectorMemoryEntry> = new Map();
  private filePath: string;
  private autoSave: boolean;
  private saveTimeout?: NodeJS.Timeout;

  constructor(filePath: string, autoSave: boolean = true) {
    this.filePath = filePath;
    this.autoSave = autoSave;
  }

  async initialize(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Restore entries with Date objects
      for (const [id, entry] of Object.entries(parsed)) {
        this.entries.set(id, {
          ...(entry as VectorMemoryEntry),
          timestamp: new Date((entry as VectorMemoryEntry).timestamp),
        });
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load vector memory from file:', error);
      }
    }
  }

  async store(entry: VectorMemoryEntry): Promise<void> {
    this.entries.set(entry.id, entry);

    if (this.autoSave) {
      this.scheduleSave();
    }
  }

  async search(
    query: number[],
    k: number,
    threshold: number = 0,
    metric: SimilarityMetric = 'cosine'
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    // Calculate similarity for all entries
    for (const entry of this.entries.values()) {
      const score = calculateSimilarity(query, entry.embedding, metric);

      if (score >= threshold) {
        results.push({ entry, score });
      }
    }

    // Sort by score descending and take top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.entries.delete(id);

    if (result && this.autoSave) {
      this.scheduleSave();
    }

    return result;
  }

  async clear(): Promise<void> {
    this.entries.clear();

    if (this.autoSave) {
      await this.save();
    }
  }

  async count(): Promise<number> {
    return this.entries.size;
  }

  async close(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.save();
  }

  /**
   * Schedule a debounced save operation
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save().catch((error) => {
        console.error('Failed to save vector memory:', error);
      });
    }, 1000); // Debounce for 1 second
  }

  /**
   * Save entries to file
   */
  async save(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = Object.fromEntries(this.entries);
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save vector memory to file:', error);
      throw error;
    }
  }

  /**
   * Manually trigger save
   */
  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.save();
  }
}

// ============================================================================
// Vector Memory Manager
// ============================================================================

/**
 * Main Vector Memory class for long-term retrieval
 */
export class VectorMemory {
  private config: VectorMemoryConfig;
  private backend: VectorMemoryBackend;
  private stats: VectorMemoryStats;
  private initialized: boolean = false;

  constructor(config: VectorMemoryConfig) {
    this.config = {
      metric: 'cosine',
      defaultThreshold: 0.7,
      maxEntries: 0,
      ...config,
    };

    // Use provided backend or default to in-memory
    this.backend = config.backend || new InMemoryVectorBackend();

    // Initialize stats
    this.stats = {
      totalEntries: 0,
      totalSearches: 0,
      averageSearchTime: 0,
      backendType: this.backend.constructor.name,
    };
  }

  /**
   * Initialize the vector memory
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.backend.initialize();
    this.stats.totalEntries = await this.backend.count();
    this.initialized = true;
  }

  /**
   * Ensure initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Store content with optional pre-computed embedding
   */
  async store(
    content: string,
    metadata: Record<string, any> = {},
    embedding?: number[]
  ): Promise<string> {
    await this.ensureInitialized();

    let finalEmbedding: number[];

    if (embedding) {
      // Use provided embedding
      if (embedding.length !== this.config.dimensions) {
        throw new Error(
          `Embedding dimensions mismatch: expected ${this.config.dimensions}, got ${embedding.length}`
        );
      }
      finalEmbedding = embedding;
    } else if (this.config.embeddingProvider) {
      // Auto-generate embedding
      finalEmbedding = await this.config.embeddingProvider.embed(content);
    } else {
      throw new Error(
        'No embedding provided and no embedding provider configured'
      );
    }

    // Check max entries limit
    if (this.config.maxEntries && this.config.maxEntries > 0) {
      const count = await this.backend.count();
      if (count >= this.config.maxEntries) {
        throw new Error(
          `Maximum entries limit reached (${this.config.maxEntries})`
        );
      }
    }

    // Create entry
    const entry: VectorMemoryEntry = {
      id: this.generateId(),
      content,
      metadata,
      embedding: finalEmbedding,
      timestamp: new Date(),
    };

    await this.backend.store(entry);
    this.stats.totalEntries++;

    return entry.id;
  }

  /**
   * Search for similar content
   */
  async search(
    query: string | number[],
    k: number = 5,
    threshold?: number,
    metric?: SimilarityMetric
  ): Promise<VectorSearchResult[]> {
    await this.ensureInitialized();

    const startTime = Date.now();

    let queryEmbedding: number[];

    if (typeof query === 'string') {
      // Text query - need embedding provider
      if (!this.config.embeddingProvider) {
        throw new Error(
          'Text search requires an embedding provider'
        );
      }
      queryEmbedding = await this.config.embeddingProvider.embed(query);
    } else {
      // Vector query
      if (query.length !== this.config.dimensions) {
        throw new Error(
          `Query embedding dimensions mismatch: expected ${this.config.dimensions}, got ${query.length}`
        );
      }
      queryEmbedding = query;
    }

    const results = await this.backend.search(
      queryEmbedding,
      k,
      threshold ?? this.config.defaultThreshold,
      metric ?? this.config.metric
    );

    // Update stats
    const searchTime = Date.now() - startTime;
    this.stats.totalSearches++;
    this.stats.averageSearchTime =
      (this.stats.averageSearchTime * (this.stats.totalSearches - 1) + searchTime) /
      this.stats.totalSearches;

    return results;
  }

  /**
   * Delete an entry by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const result = await this.backend.delete(id);
    if (result) {
      this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
    }
    return result;
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    await this.backend.clear();
    this.stats.totalEntries = 0;
  }

  /**
   * Get total entry count
   */
  async count(): Promise<number> {
    await this.ensureInitialized();
    return await this.backend.count();
  }

  /**
   * Get statistics
   */
  getStats(): VectorMemoryStats {
    return { ...this.stats };
  }

  /**
   * Set embedding provider
   */
  setEmbeddingProvider(provider: EmbeddingProvider): void {
    this.config.embeddingProvider = provider;
    this.config.dimensions = provider.dimensions;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<VectorMemoryConfig>): void {
    // Don't allow changing dimensions or backend after initialization
    if (this.initialized) {
      if (config.dimensions && config.dimensions !== this.config.dimensions) {
        throw new Error('Cannot change dimensions after initialization');
      }
      if (config.backend) {
        throw new Error('Cannot change backend after initialization');
      }
    }

    this.config = { ...this.config, ...config };
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    if (!this.initialized) return;

    await this.backend.close();
    this.initialized = false;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `vm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an in-memory vector memory instance
 */
export function createInMemoryVectorMemory(
  dimensions: number,
  config?: Partial<VectorMemoryConfig>
): VectorMemory {
  return new VectorMemory({
    dimensions,
    backend: new InMemoryVectorBackend(),
    ...config,
  });
}

/**
 * Create a file-based vector memory instance
 */
export function createFileVectorMemory(
  filePath: string,
  dimensions: number,
  config?: Partial<VectorMemoryConfig>
): VectorMemory {
  return new VectorMemory({
    dimensions,
    backend: new FileVectorBackend(filePath),
    ...config,
  });
}

/**
 * Create a vector memory instance with custom backend
 */
export function createVectorMemory(
  config: VectorMemoryConfig
): VectorMemory {
  return new VectorMemory(config);
}
