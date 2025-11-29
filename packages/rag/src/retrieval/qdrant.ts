/**
 * Qdrant Vector Database Retriever
 * High-performance vector similarity search
 */

import type { Chunk, Retriever, RetrievalResult, VectorRetrieverOptions } from '../types';

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  dimension?: number;
  distance?: 'Cosine' | 'Euclid' | 'Dot';
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantScoredPoint {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
  vector?: number[];
}

interface QdrantSearchResponse {
  result: QdrantScoredPoint[];
  status: string;
  time: number;
}

export class QdrantRetriever implements Retriever {
  private config: QdrantConfig;
  private embedder: EmbeddingProvider;
  private chunkMap: Map<string, Chunk> = new Map();
  private initialized = false;

  constructor(config: QdrantConfig, embedder: EmbeddingProvider) {
    this.config = {
      distance: 'Cosine',
      dimension: 1536,
      ...config,
    };
    this.embedder = embedder;
  }

  /**
   * Initialize collection (create if not exists)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if collection exists
    const checkResponse = await this.request('GET', `/collections/${this.config.collectionName}`);

    if (checkResponse.status === 404) {
      // Create collection
      await this.request('PUT', `/collections/${this.config.collectionName}`, {
        vectors: {
          size: this.config.dimension,
          distance: this.config.distance,
        },
      });
    }

    this.initialized = true;
  }

  /**
   * Index chunks into Qdrant
   */
  async index(chunks: Chunk[]): Promise<void> {
    await this.initialize();

    const batchSize = 100;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Generate embeddings
      let embeddings: number[][];
      if (this.embedder.embedBatch) {
        embeddings = await this.embedder.embedBatch(batch.map(c => c.content));
      } else {
        embeddings = await Promise.all(batch.map(c => this.embedder.embed(c.content)));
      }

      // Prepare points
      const points: QdrantPoint[] = [];
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        points.push({
          id: this.hashId(chunk.id),
          vector: embeddings[j],
          payload: {
            original_id: chunk.id,
            content: chunk.content,
            ...chunk.metadata,
          },
        });
        this.chunkMap.set(chunk.id, chunk);
      }

      // Upsert to Qdrant
      await this.request('PUT', `/collections/${this.config.collectionName}/points`, {
        points,
      });
    }
  }

  /**
   * Retrieve chunks by query
   */
  async retrieve(query: string, options: VectorRetrieverOptions = {}): Promise<RetrievalResult[]> {
    await this.initialize();

    const queryEmbedding = await this.embedder.embed(query);
    return this.retrieveByEmbedding(queryEmbedding, options);
  }

  /**
   * Retrieve by embedding directly
   */
  async retrieveByEmbedding(
    embedding: number[],
    options: VectorRetrieverOptions = {}
  ): Promise<RetrievalResult[]> {
    await this.initialize();

    const {
      topK = 10,
      similarityThreshold = 0.5,
      filters,
      includeMetadata = true,
    } = options;

    // Build query
    const body: Record<string, unknown> = {
      vector: embedding,
      limit: topK * 2,
      with_payload: true,
      score_threshold: similarityThreshold,
    };

    if (filters) {
      body.filter = this.convertFilters(filters);
    }

    const response = await this.request(
      'POST',
      `/collections/${this.config.collectionName}/points/search`,
      body
    );

    if (!response.ok) {
      throw new Error(`Qdrant search failed: ${response.statusText}`);
    }

    const data = await response.json() as QdrantSearchResponse;

    // Map to results
    const results: RetrievalResult[] = [];
    for (const point of data.result) {
      const originalId = (point.payload?.original_id as string) || String(point.id);
      const chunk = this.chunkMap.get(originalId);

      if (!chunk) continue;

      results.push({
        id: originalId,
        chunk,
        score: point.score,
        metadata: includeMetadata ? { ...chunk.metadata, ...point.payload } : {},
      });
    }

    return results.slice(0, topK);
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    await this.initialize();

    const hashedIds = ids.map(id => this.hashId(id));

    await this.request('POST', `/collections/${this.config.collectionName}/points/delete`, {
      points: hashedIds,
    });

    for (const id of ids) {
      this.chunkMap.delete(id);
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{ totalVectors: number; status: string }> {
    await this.initialize();

    const response = await this.request('GET', `/collections/${this.config.collectionName}`);
    const data = await response.json() as {
      result: {
        vectors_count: number;
        status: string;
      };
    };

    return {
      totalVectors: data.result.vectors_count || 0,
      status: data.result.status || 'unknown',
    };
  }

  /**
   * Delete entire collection
   */
  async deleteCollection(): Promise<void> {
    await this.request('DELETE', `/collections/${this.config.collectionName}`);
    this.chunkMap.clear();
    this.initialized = false;
  }

  /**
   * Make request to Qdrant
   */
  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['api-key'] = this.config.apiKey;
    }

    return fetch(`${this.config.url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Hash string ID to numeric ID for Qdrant
   */
  private hashId(id: string): string {
    // Qdrant accepts string UUIDs or numeric IDs
    // For simplicity, we'll use the string as-is if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      return id;
    }

    // Otherwise, create a deterministic UUID-like string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex.padEnd(12, '0').slice(0, 12)}`;
  }

  /**
   * Convert simple filters to Qdrant filter format
   */
  private convertFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        must.push({
          key,
          match: { any: value },
        });
      } else {
        must.push({
          key,
          match: { value },
        });
      }
    }

    return { must };
  }
}

/**
 * Factory function for Qdrant retriever
 */
export function qdrantRetriever(
  config: QdrantConfig,
  embedder: EmbeddingProvider
): QdrantRetriever {
  return new QdrantRetriever(config, embedder);
}
