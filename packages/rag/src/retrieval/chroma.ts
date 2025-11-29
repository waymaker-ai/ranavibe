/**
 * Chroma Vector Database Retriever
 * Open-source vector database for local and self-hosted deployments
 */

import type { Chunk, Retriever, RetrievalResult, VectorRetrieverOptions } from '../types';

export interface ChromaConfig {
  host?: string;
  port?: number;
  collectionName: string;
  tenant?: string;
  database?: string;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

interface ChromaDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  document: string;
}

interface ChromaQueryResult {
  ids: string[][];
  embeddings?: number[][][];
  documents?: string[][];
  metadatas?: Record<string, unknown>[][];
  distances?: number[][];
}

export class ChromaRetriever implements Retriever {
  private config: ChromaConfig;
  private embedder: EmbeddingProvider;
  private baseUrl: string;
  private collectionId: string | null = null;
  private chunkMap: Map<string, Chunk> = new Map();

  constructor(config: ChromaConfig, embedder: EmbeddingProvider) {
    this.config = {
      host: 'localhost',
      port: 8000,
      ...config,
    };
    this.embedder = embedder;
    this.baseUrl = `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Initialize collection (create if not exists)
   */
  async initialize(): Promise<void> {
    // Get or create collection
    const response = await fetch(`${this.baseUrl}/api/v1/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.config.collectionName,
        get_or_create: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chroma initialization failed: ${response.statusText}`);
    }

    const collection = await response.json() as { id: string };
    this.collectionId = collection.id;
  }

  /**
   * Index chunks into Chroma
   */
  async index(chunks: Chunk[]): Promise<void> {
    if (!this.collectionId) {
      await this.initialize();
    }

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

      // Prepare data for Chroma
      const ids: string[] = [];
      const documents: string[] = [];
      const metadatas: Record<string, unknown>[] = [];
      const embeddingsArray: number[][] = [];

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        ids.push(chunk.id);
        documents.push(chunk.content);
        metadatas.push(this.serializeMetadata(chunk.metadata));
        embeddingsArray.push(embeddings[j]);
        this.chunkMap.set(chunk.id, chunk);
      }

      // Add to Chroma
      await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          embeddings: embeddingsArray,
          documents,
          metadatas,
        }),
      });
    }
  }

  /**
   * Retrieve chunks by query
   */
  async retrieve(query: string, options: VectorRetrieverOptions = {}): Promise<RetrievalResult[]> {
    if (!this.collectionId) {
      await this.initialize();
    }

    const {
      topK = 10,
      similarityThreshold = 0.5,
      filters,
      includeMetadata = true,
    } = options;

    // Generate query embedding
    const queryEmbedding = await this.embedder.embed(query);

    return this.retrieveByEmbedding(queryEmbedding, {
      topK,
      similarityThreshold,
      filters,
      includeMetadata,
    });
  }

  /**
   * Retrieve by embedding directly
   */
  async retrieveByEmbedding(
    embedding: number[],
    options: VectorRetrieverOptions = {}
  ): Promise<RetrievalResult[]> {
    if (!this.collectionId) {
      await this.initialize();
    }

    const {
      topK = 10,
      similarityThreshold = 0.5,
      filters,
      includeMetadata = true,
    } = options;

    // Query Chroma
    const body: Record<string, unknown> = {
      query_embeddings: [embedding],
      n_results: topK * 2,
      include: ['documents', 'metadatas', 'distances'],
    };

    if (filters) {
      body.where = this.convertFilters(filters);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Chroma query failed: ${response.statusText}`);
    }

    const data = await response.json() as ChromaQueryResult;

    // Map to results
    const results: RetrievalResult[] = [];
    const ids = data.ids[0] || [];
    const distances = data.distances?.[0] || [];
    const metadatas = data.metadatas?.[0] || [];

    for (let i = 0; i < ids.length; i++) {
      // Chroma uses L2 distance, convert to similarity score
      const distance = distances[i] || 0;
      const score = 1 / (1 + distance);

      if (score < similarityThreshold) continue;

      const chunk = this.chunkMap.get(ids[i]);
      if (!chunk) continue;

      results.push({
        id: ids[i],
        chunk,
        score,
        metadata: includeMetadata ? { ...chunk.metadata, ...metadatas[i] } : {},
      });
    }

    return results.slice(0, topK);
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    if (!this.collectionId) {
      await this.initialize();
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Chroma delete failed: ${response.statusText}`);
    }

    for (const id of ids) {
      this.chunkMap.delete(id);
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{ totalVectors: number }> {
    if (!this.collectionId) {
      await this.initialize();
    }

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionId}/count`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Chroma count failed: ${response.statusText}`);
    }

    const count = await response.json() as number;
    return { totalVectors: count };
  }

  /**
   * Reset collection (delete all data)
   */
  async reset(): Promise<void> {
    if (!this.collectionId) {
      await this.initialize();
    }

    // Delete and recreate collection
    await fetch(`${this.baseUrl}/api/v1/collections/${this.collectionId}`, {
      method: 'DELETE',
    });

    this.chunkMap.clear();
    await this.initialize();
  }

  /**
   * Serialize metadata for Chroma (only primitive types allowed)
   */
  private serializeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        serialized[key] = value;
      } else if (value === null || value === undefined) {
        // Skip null/undefined
      } else {
        // Stringify complex types
        serialized[key] = JSON.stringify(value);
      }
    }

    return serialized;
  }

  /**
   * Convert simple filters to Chroma filter format
   */
  private convertFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const chromaFilter: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        chromaFilter[key] = { $in: value };
      } else {
        chromaFilter[key] = { $eq: value };
      }
    }

    return chromaFilter;
  }
}

/**
 * Factory function for Chroma retriever
 */
export function chromaRetriever(
  config: ChromaConfig,
  embedder: EmbeddingProvider
): ChromaRetriever {
  return new ChromaRetriever(config, embedder);
}
