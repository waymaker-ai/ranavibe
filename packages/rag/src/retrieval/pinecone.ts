/**
 * Pinecone Vector Database Retriever
 * Production-ready vector search using Pinecone
 */

import type { Chunk, Retriever, RetrievalResult, VectorRetrieverOptions } from '../types';

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  namespace?: string;
  dimension?: number;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

interface PineconeQueryResponse {
  matches: PineconeMatch[];
  namespace: string;
}

export class PineconeRetriever implements Retriever {
  private config: PineconeConfig;
  private embedder: EmbeddingProvider;
  private baseUrl: string;
  private chunkMap: Map<string, Chunk> = new Map();

  constructor(config: PineconeConfig, embedder: EmbeddingProvider) {
    this.config = config;
    this.embedder = embedder;
    this.baseUrl = `https://${config.indexName}-${config.environment}.svc.pinecone.io`;
  }

  /**
   * Index chunks into Pinecone
   */
  async index(chunks: Chunk[]): Promise<void> {
    const vectors: PineconeVector[] = [];
    const batchSize = 100;

    // Generate embeddings
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      let embeddings: number[][];
      if (this.embedder.embedBatch) {
        embeddings = await this.embedder.embedBatch(batch.map(c => c.content));
      } else {
        embeddings = await Promise.all(batch.map(c => this.embedder.embed(c.content)));
      }

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        vectors.push({
          id: chunk.id,
          values: embeddings[j],
          metadata: {
            ...chunk.metadata,
            content: chunk.content.slice(0, 1000), // Pinecone metadata limit
          },
        });
        this.chunkMap.set(chunk.id, chunk);
      }
    }

    // Upsert to Pinecone in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.upsertVectors(batch);
    }
  }

  /**
   * Retrieve chunks by query
   */
  async retrieve(query: string, options: VectorRetrieverOptions = {}): Promise<RetrievalResult[]> {
    const {
      topK = 10,
      similarityThreshold = 0.5,
      filters,
      includeMetadata = true,
    } = options;

    // Generate query embedding
    const queryEmbedding = await this.embedder.embed(query);

    // Query Pinecone
    const response = await this.queryVectors(queryEmbedding, topK * 2, filters);

    // Map to results
    const results: RetrievalResult[] = [];
    for (const match of response.matches) {
      if (match.score < similarityThreshold) continue;

      const chunk = this.chunkMap.get(match.id);
      if (!chunk) continue;

      results.push({
        id: match.id,
        chunk,
        score: match.score,
        metadata: includeMetadata ? { ...chunk.metadata, ...match.metadata } : {},
      });
    }

    return results.slice(0, topK);
  }

  /**
   * Retrieve by embedding directly
   */
  async retrieveByEmbedding(
    embedding: number[],
    options: VectorRetrieverOptions = {}
  ): Promise<RetrievalResult[]> {
    const {
      topK = 10,
      similarityThreshold = 0.5,
      filters,
      includeMetadata = true,
    } = options;

    const response = await this.queryVectors(embedding, topK * 2, filters);

    const results: RetrievalResult[] = [];
    for (const match of response.matches) {
      if (match.score < similarityThreshold) continue;

      const chunk = this.chunkMap.get(match.id);
      if (!chunk) continue;

      results.push({
        id: match.id,
        chunk,
        score: match.score,
        metadata: includeMetadata ? { ...chunk.metadata, ...match.metadata } : {},
      });
    }

    return results.slice(0, topK);
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/vectors/delete`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        namespace: this.config.namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone delete failed: ${response.statusText}`);
    }

    for (const id of ids) {
      this.chunkMap.delete(id);
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{ totalVectors: number; dimensions: number }> {
    const response = await fetch(`${this.baseUrl}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Pinecone stats failed: ${response.statusText}`);
    }

    const data = await response.json() as { totalVectorCount: number; dimension: number };
    return {
      totalVectors: data.totalVectorCount || 0,
      dimensions: data.dimension || this.config.dimension || 1536,
    };
  }

  private async upsertVectors(vectors: PineconeVector[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors,
        namespace: this.config.namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert failed: ${response.statusText}`);
    }
  }

  private async queryVectors(
    vector: number[],
    topK: number,
    filters?: Record<string, unknown>
  ): Promise<PineconeQueryResponse> {
    const body: Record<string, unknown> = {
      vector,
      topK,
      includeMetadata: true,
      namespace: this.config.namespace,
    };

    if (filters) {
      body.filter = this.convertFilters(filters);
    }

    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.statusText}`);
    }

    return response.json() as Promise<PineconeQueryResponse>;
  }

  /**
   * Convert simple filters to Pinecone filter format
   */
  private convertFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const pineconeFilter: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        pineconeFilter[key] = { $in: value };
      } else {
        pineconeFilter[key] = { $eq: value };
      }
    }

    return pineconeFilter;
  }
}

/**
 * Factory function for Pinecone retriever
 */
export function pineconeRetriever(
  config: PineconeConfig,
  embedder: EmbeddingProvider
): PineconeRetriever {
  return new PineconeRetriever(config, embedder);
}
