/**
 * Recursive Character Text Splitter
 * Split text recursively using multiple separators
 */

import type { Chunk, Chunker, ChunkerOptions } from '../types';

export class RecursiveChunker implements Chunker {
  private separators: string[];

  constructor(separators?: string[]) {
    // Default separators ordered by priority
    this.separators = separators || [
      '\n\n',    // Paragraph
      '\n',      // Line
      '. ',      // Sentence
      ', ',      // Clause
      ' ',       // Word
      '',        // Character
    ];
  }

  /**
   * Chunk text recursively using separators
   */
  async chunk(text: string, options: ChunkerOptions = {}): Promise<Chunk[]> {
    const {
      chunkSize = 512,
      overlap = 50,
      minChunkSize = 50,
      maxChunkSize = 2000,
    } = options;

    const chunks = this.splitText(text, {
      chunkSize,
      overlap,
      minChunkSize,
      maxChunkSize,
    });

    return chunks.map((content, i) => ({
      id: `chunk_${Date.now()}_${i}`,
      content,
      metadata: {
        source: '',
        chunkIndex: i,
        startChar: 0,
        endChar: content.length,
        type: 'recursive',
        wordCount: content.split(/\s+/).length,
        totalChunks: chunks.length,
      },
    }));
  }

  /**
   * Split text recursively
   */
  private splitText(
    text: string,
    options: { chunkSize: number; overlap: number; minChunkSize: number; maxChunkSize: number }
  ): string[] {
    const { chunkSize, overlap, minChunkSize, maxChunkSize } = options;

    // If text is small enough, return as is
    if (text.length <= chunkSize) {
      return text.length >= minChunkSize ? [text] : [];
    }

    // Find the best separator
    const separator = this.findSeparator(text);

    // Split by separator
    const splits = text.split(separator).filter(s => s.trim().length > 0);

    // Merge splits back into chunks
    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const testChunk = currentChunk
        ? currentChunk + separator + split
        : split;

      if (testChunk.length <= maxChunkSize) {
        currentChunk = testChunk;
      } else {
        // Current chunk is full
        if (currentChunk.length >= minChunkSize) {
          chunks.push(currentChunk);
        }

        // Check if split itself is too large
        if (split.length > maxChunkSize) {
          // Recursively split the large piece
          const subChunks = this.splitText(split, options);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length >= minChunkSize) {
      chunks.push(currentChunk);
    }

    // Add overlap
    if (overlap > 0 && chunks.length > 1) {
      return this.addOverlap(chunks, overlap, separator);
    }

    return chunks;
  }

  /**
   * Find the best separator that exists in text
   */
  private findSeparator(text: string): string {
    for (const separator of this.separators) {
      if (separator === '' || text.includes(separator)) {
        return separator;
      }
    }
    return '';
  }

  /**
   * Add overlap between chunks
   */
  private addOverlap(chunks: string[], overlap: number, separator: string): string[] {
    const result: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];

      // Add overlap from previous chunk
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const overlapText = this.getOverlapText(prevChunk, overlap, separator);
        if (overlapText) {
          chunk = overlapText + separator + chunk;
        }
      }

      result.push(chunk);
    }

    return result;
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private getOverlapText(chunk: string, overlap: number, separator: string): string {
    if (chunk.length <= overlap) {
      return chunk;
    }

    // Try to break at separator
    const endPortion = chunk.slice(-overlap * 2);
    const lastSepIndex = endPortion.lastIndexOf(separator);

    if (lastSepIndex > 0) {
      return endPortion.slice(lastSepIndex + separator.length);
    }

    // Fall back to character-based overlap
    return chunk.slice(-overlap);
  }
}

/**
 * Factory function for recursive chunker
 */
export function recursiveChunker(options?: ChunkerOptions): RecursiveChunker {
  return new RecursiveChunker();
}
