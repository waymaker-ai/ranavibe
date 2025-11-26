/**
 * Semantic Chunker
 * Chunk text based on semantic boundaries using embedding similarity
 */

import type { Chunk, Chunker, SemanticChunkerOptions } from '../types';

export class SemanticChunker implements Chunker {
  private embedder: { embed: (text: string) => Promise<number[]> };

  constructor(embedder?: { embed: (text: string) => Promise<number[]> }) {
    this.embedder = embedder || this.defaultEmbedder();
  }

  /**
   * Chunk text based on semantic boundaries
   */
  async chunk(text: string, options: SemanticChunkerOptions = {}): Promise<Chunk[]> {
    const {
      chunkSize = 512,
      overlap = 50,
      similarityThreshold = 0.5,
      minChunkSize = 100,
      maxChunkSize = 2000,
    } = options;

    // 1. Split into sentences
    const sentences = this.splitIntoSentences(text);

    if (sentences.length === 0) {
      return [];
    }

    if (sentences.length === 1) {
      return [this.createChunk(sentences[0], 0, 'semantic', 0)];
    }

    // 2. Generate embeddings for each sentence
    const embeddings = await this.generateEmbeddings(sentences);

    // 3. Calculate similarity between adjacent sentences
    const similarities = this.calculateSimilarities(embeddings);

    // 4. Find breakpoints where similarity drops
    const breakpoints = this.findBreakpoints(similarities, similarityThreshold);

    // 5. Create chunks
    const chunks = this.createChunks(
      sentences,
      breakpoints,
      { chunkSize, overlap, minChunkSize, maxChunkSize }
    );

    // 6. Add metadata
    return this.enrichChunks(chunks, text);
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Handle common sentence endings while preserving abbreviations
    const sentenceEndings = /(?<=[.!?])\s+(?=[A-Z])/g;
    const sentences = text.split(sentenceEndings).filter(s => s.trim().length > 0);

    return sentences.map(s => s.trim());
  }

  /**
   * Generate embeddings for sentences
   */
  private async generateEmbeddings(sentences: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const sentence of sentences) {
      const embedding = await this.embedder.embed(sentence);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between adjacent sentence embeddings
   */
  private calculateSimilarities(embeddings: number[][]): number[] {
    const similarities: number[] = [];

    for (let i = 0; i < embeddings.length - 1; i++) {
      const similarity = this.cosineSimilarity(embeddings[i], embeddings[i + 1]);
      similarities.push(similarity);
    }

    return similarities;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

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
   * Find breakpoints where similarity drops below threshold
   */
  private findBreakpoints(similarities: number[], threshold: number): number[] {
    const breakpoints: number[] = [];

    // Calculate mean and standard deviation
    const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    const variance = similarities.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / similarities.length;
    const stdDev = Math.sqrt(variance);

    // Use adaptive threshold based on distribution
    const adaptiveThreshold = Math.min(threshold, mean - stdDev);

    for (let i = 0; i < similarities.length; i++) {
      if (similarities[i] < adaptiveThreshold) {
        breakpoints.push(i);
      }
    }

    return breakpoints;
  }

  /**
   * Create chunks from sentences and breakpoints
   */
  private createChunks(
    sentences: string[],
    breakpoints: number[],
    options: { chunkSize: number; overlap: number; minChunkSize: number; maxChunkSize: number }
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let chunkStartIdx = 0;
    let charOffset = 0;

    for (let i = 0; i < sentences.length; i++) {
      currentChunk.push(sentences[i]);
      const currentContent = currentChunk.join(' ');

      // Check if we hit a breakpoint or max chunk size
      const isBreakpoint = breakpoints.includes(i);
      const isMaxSize = currentContent.length >= options.maxChunkSize;
      const isEnd = i === sentences.length - 1;

      if ((isBreakpoint || isMaxSize || isEnd) && currentContent.length >= options.minChunkSize) {
        chunks.push(this.createChunk(
          currentContent,
          chunks.length,
          'semantic',
          charOffset
        ));

        // Keep overlap sentences
        const overlapSentences = Math.max(1, Math.floor(options.overlap / 50));
        currentChunk = currentChunk.slice(-overlapSentences);
        chunkStartIdx = i - overlapSentences + 1;
        charOffset += currentContent.length;
      }
    }

    // Handle remaining content
    if (currentChunk.length > 0 && chunks.length === 0) {
      const content = currentChunk.join(' ');
      chunks.push(this.createChunk(content, 0, 'semantic', 0));
    }

    return chunks;
  }

  /**
   * Create a chunk with metadata
   */
  private createChunk(
    content: string,
    index: number,
    type: 'semantic',
    startChar: number
  ): Chunk {
    return {
      id: `chunk_${Date.now()}_${index}`,
      content,
      metadata: {
        source: '',
        chunkIndex: index,
        startChar,
        endChar: startChar + content.length,
        type,
        wordCount: content.split(/\s+/).length,
        sentenceCount: content.split(/[.!?]+/).filter(s => s.trim()).length,
      },
    };
  }

  /**
   * Enrich chunks with additional metadata
   */
  private enrichChunks(chunks: Chunk[], originalText: string): Chunk[] {
    return chunks.map((chunk, i) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        totalChunks: chunks.length,
        originalTextLength: originalText.length,
        position: i === 0 ? 'start' : i === chunks.length - 1 ? 'end' : 'middle',
      },
    }));
  }

  /**
   * Default embedder using simple hashing (for testing)
   * In production, use a real embedding model
   */
  private defaultEmbedder(): { embed: (text: string) => Promise<number[]> } {
    return {
      embed: async (text: string): Promise<number[]> => {
        // Simple hash-based pseudo-embedding for testing
        const embedding = new Array(384).fill(0);
        const words = text.toLowerCase().split(/\s+/);

        for (const word of words) {
          for (let i = 0; i < word.length; i++) {
            const idx = (word.charCodeAt(i) * (i + 1)) % 384;
            embedding[idx] += 1 / words.length;
          }
        }

        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
      },
    };
  }
}

/**
 * Factory function for semantic chunker
 */
export function semanticChunker(options?: SemanticChunkerOptions): SemanticChunker {
  return new SemanticChunker();
}
