/**
 * Diversity Reranker
 * Re-rank documents to maximize diversity using MMR (Maximal Marginal Relevance)
 */

import type { Reranker, RetrievalResult, DiversityRerankerOptions } from '../types';

export class DiversityReranker implements Reranker {
  /**
   * Re-rank documents to maximize diversity
   * Uses Maximal Marginal Relevance (MMR)
   */
  async rerank(
    query: string,
    documents: RetrievalResult[],
    options: DiversityRerankerOptions = {}
  ): Promise<RetrievalResult[]> {
    const {
      topK = 5,
      lambda = 0.5, // Balance between relevance and diversity
      similarityMetric = 'cosine',
    } = options;

    if (documents.length <= 1) {
      return documents;
    }

    // MMR algorithm
    const selected: RetrievalResult[] = [];
    const remaining = [...documents];

    // Select documents one by one
    while (selected.length < topK && remaining.length > 0) {
      let bestScore = -Infinity;
      let bestIndex = 0;

      for (let i = 0; i < remaining.length; i++) {
        const doc = remaining[i];

        // Relevance score (original retrieval score)
        const relevance = doc.score;

        // Diversity score (max similarity to already selected docs)
        let maxSimilarity = 0;
        for (const selectedDoc of selected) {
          const similarity = this.calculateSimilarity(
            doc.chunk.content,
            selectedDoc.chunk.content,
            similarityMetric
          );
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        // MMR score
        const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      // Add best document to selected
      const bestDoc = remaining[bestIndex];
      selected.push({
        ...bestDoc,
        score: bestScore,
        metadata: {
          ...bestDoc.metadata,
          originalScore: bestDoc.score,
          mmrScore: bestScore,
          diversityRank: selected.length,
        },
      });

      // Remove from remaining
      remaining.splice(bestIndex, 1);
    }

    return selected;
  }

  /**
   * Calculate similarity between two documents
   */
  private calculateSimilarity(
    doc1: string,
    doc2: string,
    metric: 'cosine' | 'euclidean'
  ): number {
    if (metric === 'cosine') {
      return this.cosineSimilarity(doc1, doc2);
    } else {
      return this.euclideanSimilarity(doc1, doc2);
    }
  }

  /**
   * Cosine similarity using simple word vectors
   */
  private cosineSimilarity(doc1: string, doc2: string): number {
    const words1 = this.tokenize(doc1);
    const words2 = this.tokenize(doc2);

    // Build term frequency vectors
    const allWords = new Set([...words1, ...words2]);
    const vec1: number[] = [];
    const vec2: number[] = [];

    for (const word of allWords) {
      vec1.push(words1.filter(w => w === word).length);
      vec2.push(words2.filter(w => w === word).length);
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Euclidean similarity (1 / (1 + distance))
   */
  private euclideanSimilarity(doc1: string, doc2: string): number {
    const words1 = this.tokenize(doc1);
    const words2 = this.tokenize(doc2);

    const allWords = new Set([...words1, ...words2]);
    let sumSquares = 0;

    for (const word of allWords) {
      const count1 = words1.filter(w => w === word).length;
      const count2 = words2.filter(w => w === word).length;
      sumSquares += Math.pow(count1 - count2, 2);
    }

    const distance = Math.sqrt(sumSquares);
    return 1 / (1 + distance);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }
}

/**
 * Factory function
 */
export function diversityReranker(options?: DiversityRerankerOptions): DiversityReranker {
  return new DiversityReranker();
}
