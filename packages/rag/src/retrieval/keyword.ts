/**
 * Keyword Retriever
 * BM25 keyword search
 */

import type { Chunk, Retriever, RetrievalResult, KeywordRetrieverOptions } from '../types';

export class KeywordRetriever implements Retriever {
  private chunks: Chunk[] = [];
  private documentFrequencies: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private stopWords: Set<string>;

  constructor(options?: { stopWords?: string[] }) {
    this.stopWords = new Set(options?.stopWords || this.defaultStopWords());
  }

  /**
   * Index chunks for retrieval
   */
  async index(chunks: Chunk[]): Promise<void> {
    this.chunks = chunks;
    this.documentFrequencies.clear();

    // Calculate document frequencies
    let totalLength = 0;

    for (const chunk of chunks) {
      const terms = this.tokenize(chunk.content);
      const uniqueTerms = new Set(terms);

      for (const term of uniqueTerms) {
        this.documentFrequencies.set(
          term,
          (this.documentFrequencies.get(term) || 0) + 1
        );
      }

      totalLength += terms.length;
    }

    this.avgDocLength = chunks.length > 0 ? totalLength / chunks.length : 0;
  }

  /**
   * Retrieve chunks using BM25
   */
  async retrieve(query: string, options: KeywordRetrieverOptions = {}): Promise<RetrievalResult[]> {
    const {
      topK = 10,
      algorithm = 'bm25',
      similarityThreshold = 0,
      filters,
      includeMetadata = true,
    } = options;

    const queryTerms = this.tokenize(query);
    const results: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      // Apply filters
      if (filters && !this.matchesFilters(chunk, filters)) {
        continue;
      }

      const score = algorithm === 'bm25'
        ? this.calculateBM25Score(queryTerms, chunk)
        : this.calculateTFIDFScore(queryTerms, chunk);

      if (score > similarityThreshold) {
        results.push({
          id: chunk.id,
          chunk,
          score,
          metadata: includeMetadata ? chunk.metadata : {},
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Calculate BM25 score
   */
  private calculateBM25Score(queryTerms: string[], chunk: Chunk): number {
    const k1 = 1.5;  // Term frequency saturation
    const b = 0.75;  // Length normalization

    const docTerms = this.tokenize(chunk.content);
    const docLength = docTerms.length;

    let score = 0;

    for (const term of queryTerms) {
      const tf = this.termFrequency(term, docTerms);
      const idf = this.inverseDocumentFrequency(term);

      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / this.avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Calculate TF-IDF score
   */
  private calculateTFIDFScore(queryTerms: string[], chunk: Chunk): number {
    const docTerms = this.tokenize(chunk.content);
    let score = 0;

    for (const term of queryTerms) {
      const tf = this.termFrequency(term, docTerms) / docTerms.length;
      const idf = this.inverseDocumentFrequency(term);
      score += tf * idf;
    }

    return score;
  }

  /**
   * Calculate term frequency in document
   */
  private termFrequency(term: string, docTerms: string[]): number {
    return docTerms.filter(t => t === term).length;
  }

  /**
   * Calculate inverse document frequency
   */
  private inverseDocumentFrequency(term: string): number {
    const df = this.documentFrequencies.get(term) || 0;
    const N = this.chunks.length;

    if (df === 0) return 0;

    // BM25 IDF formula
    return Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !this.stopWords.has(t));
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
   * Default stop words
   */
  private defaultStopWords(): string[] {
    return [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
      'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
      'that', 'the', 'to', 'was', 'were', 'will', 'with',
      'this', 'but', 'they', 'have', 'had', 'what', 'when',
      'where', 'who', 'which', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'can', 'just', 'should', 'now',
    ];
  }
}

/**
 * Factory function
 */
export function keywordRetriever(options?: { stopWords?: string[] }): KeywordRetriever {
  return new KeywordRetriever(options);
}
