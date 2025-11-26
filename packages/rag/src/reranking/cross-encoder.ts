/**
 * Cross-Encoder Reranker
 * Re-rank documents using cross-encoder model
 */

import type { Reranker, RetrievalResult, CrossEncoderRerankerOptions } from '../types';

export class CrossEncoderReranker implements Reranker {
  private scorer: (query: string, doc: string) => Promise<number>;

  constructor(scorer?: (query: string, doc: string) => Promise<number>) {
    this.scorer = scorer || this.defaultScorer();
  }

  /**
   * Re-rank documents using cross-encoder
   */
  async rerank(
    query: string,
    documents: RetrievalResult[],
    options: CrossEncoderRerankerOptions = {}
  ): Promise<RetrievalResult[]> {
    const {
      topK = 5,
      batchSize = 10,
      normalize = true,
    } = options;

    // Score all documents
    const scoredDocs = await this.scoreDocuments(query, documents, batchSize);

    // Sort by rerank score
    const sorted = scoredDocs.sort((a, b) => b.rerankScore - a.rerankScore);

    // Normalize scores if requested
    if (normalize && sorted.length > 0) {
      const maxScore = sorted[0].rerankScore;
      const minScore = sorted[sorted.length - 1].rerankScore;
      const range = maxScore - minScore || 1;

      return sorted.slice(0, topK).map(doc => ({
        ...doc.original,
        score: (doc.rerankScore - minScore) / range,
        metadata: {
          ...doc.original.metadata,
          originalScore: doc.original.score,
          rerankScore: doc.rerankScore,
        },
      }));
    }

    return sorted.slice(0, topK).map(doc => ({
      ...doc.original,
      score: doc.rerankScore,
      metadata: {
        ...doc.original.metadata,
        originalScore: doc.original.score,
      },
    }));
  }

  /**
   * Score all documents with batching
   */
  private async scoreDocuments(
    query: string,
    documents: RetrievalResult[],
    batchSize: number
  ): Promise<Array<{ original: RetrievalResult; rerankScore: number }>> {
    const results: Array<{ original: RetrievalResult; rerankScore: number }> = [];

    // Process in batches
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (doc) => {
          const score = await this.scorer(query, doc.chunk.content);
          return { original: doc, rerankScore: score };
        })
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Default scorer using simple heuristics
   * In production, use a real cross-encoder model
   */
  private defaultScorer(): (query: string, doc: string) => Promise<number> {
    return async (query: string, doc: string): Promise<number> => {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const docLower = doc.toLowerCase();

      // Base score from term matches
      let matchCount = 0;
      let positionScore = 0;

      for (const term of queryTerms) {
        const index = docLower.indexOf(term);
        if (index !== -1) {
          matchCount++;
          // Early matches score higher
          positionScore += 1 - (index / docLower.length);
        }
      }

      // Coverage score
      const coverageScore = queryTerms.length > 0
        ? matchCount / queryTerms.length
        : 0;

      // Length penalty for very short or very long docs
      const idealLength = 500;
      const lengthPenalty = 1 - Math.abs(doc.length - idealLength) / (idealLength * 4);

      // Combine scores
      const score = (
        coverageScore * 0.5 +
        (positionScore / queryTerms.length || 0) * 0.3 +
        Math.max(0, lengthPenalty) * 0.2
      );

      return Math.min(1, Math.max(0, score));
    };
  }
}

/**
 * Factory function
 */
export function crossEncoderReranker(
  scorer?: (query: string, doc: string) => Promise<number>
): CrossEncoderReranker {
  return new CrossEncoderReranker(scorer);
}
