/**
 * Vector Retriever
 * Semantic search using embeddings
 */

import type { Chunk, Retriever, RetrievalResult, VectorRetrieverOptions } from '../types';

export class VectorRetriever implements Retriever {
  private chunks: Chunk[] = [];
  private embedder: { embed: (text: string) => Promise<number[]> };

  constructor(embedder?: { embed: (text: string) => Promise<number[]> }) {
    this.embedder = embedder || this.defaultEmbedder();
  }

  /**
   * Index chunks for retrieval
   */
  async index(chunks: Chunk[]): Promise<void> {
    // Generate embeddings for chunks without them
    for (const chunk of chunks) {
      if (!chunk.embedding) {
        chunk.embedding = await this.embedder.embed(chunk.content);
      }
    }
    this.chunks = chunks;
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

    // Calculate similarities
    const results: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      // Apply filters
      if (filters && !this.matchesFilters(chunk, filters)) {
        continue;
      }

      if (!chunk.embedding) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);

      if (similarity >= similarityThreshold) {
        results.push({
          id: chunk.id,
          chunk,
          score: similarity,
          metadata: includeMetadata ? chunk.metadata : {},
        });
      }
    }

    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
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

    const results: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      if (filters && !this.matchesFilters(chunk, filters)) {
        continue;
      }

      if (!chunk.embedding) continue;

      const similarity = this.cosineSimilarity(embedding, chunk.embedding);

      if (similarity >= similarityThreshold) {
        results.push({
          id: chunk.id,
          chunk,
          score: similarity,
          metadata: includeMetadata ? chunk.metadata : {},
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Calculate cosine similarity between vectors
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

  /**
   * Check if chunk matches filters
   */
  private matchesFilters(chunk: Chunk, filters: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (chunk.metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Default embedder for testing
   */
  private defaultEmbedder(): { embed: (text: string) => Promise<number[]> } {
    return {
      embed: async (text: string): Promise<number[]> => {
        const embedding = new Array(384).fill(0);
        const words = text.toLowerCase().split(/\s+/);

        for (const word of words) {
          for (let i = 0; i < word.length; i++) {
            const idx = (word.charCodeAt(i) * (i + 1)) % 384;
            embedding[idx] += 1 / words.length;
          }
        }

        const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
      },
    };
  }
}

/**
 * Factory function
 */
export function vectorRetriever(
  embedder?: { embed: (text: string) => Promise<number[]> }
): VectorRetriever {
  return new VectorRetriever(embedder);
}
