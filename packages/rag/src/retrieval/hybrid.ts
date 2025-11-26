/**
 * Hybrid Retriever
 * Combines vector and keyword search with fusion
 */

import type { Chunk, Retriever, RetrievalResult, HybridRetrieverOptions } from '../types';
import { VectorRetriever } from './vector';
import { KeywordRetriever } from './keyword';

export class HybridRetriever implements Retriever {
  private vectorRetriever: VectorRetriever;
  private keywordRetriever: KeywordRetriever;

  constructor(
    embedder?: { embed: (text: string) => Promise<number[]> },
    keywordOptions?: { stopWords?: string[] }
  ) {
    this.vectorRetriever = new VectorRetriever(embedder);
    this.keywordRetriever = new KeywordRetriever(keywordOptions);
  }

  /**
   * Index chunks for both retrievers
   */
  async index(chunks: Chunk[]): Promise<void> {
    await Promise.all([
      this.vectorRetriever.index(chunks),
      this.keywordRetriever.index(chunks),
    ]);
  }

  /**
   * Retrieve using hybrid search
   */
  async retrieve(query: string, options: HybridRetrieverOptions = {}): Promise<RetrievalResult[]> {
    const {
      vector = { topK: 20, similarityThreshold: 0.5 },
      keyword = { topK: 10, algorithm: 'bm25' },
      fusion = 'reciprocal-rank-fusion',
      weights = { vector: 0.5, keyword: 0.5 },
      topK = 10,
      filters,
      includeMetadata = true,
    } = options;

    // Run both retrievers in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorRetriever.retrieve(query, {
        topK: vector.topK,
        similarityThreshold: vector.similarityThreshold,
        filters,
        includeMetadata,
      }),
      this.keywordRetriever.retrieve(query, {
        topK: keyword.topK,
        algorithm: keyword.algorithm || 'bm25',
        filters,
        includeMetadata,
      }),
    ]);

    // Fuse results
    let fusedResults: RetrievalResult[];

    switch (fusion) {
      case 'reciprocal-rank-fusion':
        fusedResults = this.reciprocalRankFusion(vectorResults, keywordResults);
        break;
      case 'weighted':
        fusedResults = this.weightedFusion(vectorResults, keywordResults, weights);
        break;
      case 'max':
        fusedResults = this.maxFusion(vectorResults, keywordResults);
        break;
      default:
        fusedResults = this.reciprocalRankFusion(vectorResults, keywordResults);
    }

    return fusedResults.slice(0, topK);
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   * Combines rankings from multiple retrieval methods
   */
  private reciprocalRankFusion(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const k = 60; // RRF constant
    const scores = new Map<string, number>();
    const documents = new Map<string, RetrievalResult>();

    // Add vector results
    vectorResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
      documents.set(result.id, result);
    });

    // Add keyword results
    keywordResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
      if (!documents.has(result.id)) {
        documents.set(result.id, result);
      }
    });

    // Sort by fused score
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds.map(id => ({
      ...documents.get(id)!,
      score: scores.get(id)!,
      metadata: {
        ...documents.get(id)!.metadata,
        fusionMethod: 'rrf',
      },
    }));
  }

  /**
   * Weighted fusion
   * Combines scores with configurable weights
   */
  private weightedFusion(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[],
    weights: { vector: number; keyword: number }
  ): RetrievalResult[] {
    const scores = new Map<string, number>();
    const documents = new Map<string, RetrievalResult>();

    // Normalize vector scores to 0-1
    const maxVectorScore = Math.max(...vectorResults.map(r => r.score), 1);
    vectorResults.forEach(result => {
      const normalizedScore = result.score / maxVectorScore;
      scores.set(result.id, weights.vector * normalizedScore);
      documents.set(result.id, result);
    });

    // Normalize keyword scores to 0-1
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1);
    keywordResults.forEach(result => {
      const normalizedScore = result.score / maxKeywordScore;
      const currentScore = scores.get(result.id) || 0;
      scores.set(result.id, currentScore + weights.keyword * normalizedScore);
      if (!documents.has(result.id)) {
        documents.set(result.id, result);
      }
    });

    // Sort by combined score
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds.map(id => ({
      ...documents.get(id)!,
      score: scores.get(id)!,
      metadata: {
        ...documents.get(id)!.metadata,
        fusionMethod: 'weighted',
        weights,
      },
    }));
  }

  /**
   * Max fusion
   * Takes maximum score from either method
   */
  private maxFusion(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const scores = new Map<string, number>();
    const documents = new Map<string, RetrievalResult>();

    // Normalize and add vector scores
    const maxVectorScore = Math.max(...vectorResults.map(r => r.score), 1);
    vectorResults.forEach(result => {
      const normalizedScore = result.score / maxVectorScore;
      scores.set(result.id, normalizedScore);
      documents.set(result.id, result);
    });

    // Normalize and compare keyword scores
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1);
    keywordResults.forEach(result => {
      const normalizedScore = result.score / maxKeywordScore;
      const currentScore = scores.get(result.id) || 0;
      scores.set(result.id, Math.max(currentScore, normalizedScore));
      if (!documents.has(result.id)) {
        documents.set(result.id, result);
      }
    });

    // Sort by max score
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds.map(id => ({
      ...documents.get(id)!,
      score: scores.get(id)!,
      metadata: {
        ...documents.get(id)!.metadata,
        fusionMethod: 'max',
      },
    }));
  }
}

/**
 * Factory function
 */
export function hybridRetriever(
  embedder?: { embed: (text: string) => Promise<number[]> },
  keywordOptions?: { stopWords?: string[] }
): HybridRetriever {
  return new HybridRetriever(embedder, keywordOptions);
}
