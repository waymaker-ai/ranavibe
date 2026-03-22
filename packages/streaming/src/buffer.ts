/**
 * @aicofounder/streaming - TokenBuffer
 *
 * Accumulates streaming tokens into a sliding buffer for pattern matching.
 * Provides efficient append, slide, and sentence-boundary flushing.
 */

/** Sentence-ending punctuation followed by whitespace or end-of-string. */
const SENTENCE_BOUNDARY = /[.!?]\s+|[.!?]$/;

export class TokenBuffer {
  /** The internal character buffer. */
  private buffer: string = '';
  /** Maximum window size in characters. */
  private readonly windowSize: number;
  /** Content that has been flushed and is ready for output. */
  private flushed: string = '';

  constructor(windowSize: number = 200) {
    this.windowSize = windowSize;
  }

  /**
   * Append new text to the buffer.
   * If the buffer exceeds the window size, the oldest characters are dropped.
   */
  append(text: string): void {
    this.buffer += text;
    this.slide();
  }

  /**
   * Slide the buffer to maintain the window size.
   * Excess characters from the front are moved to flushed output.
   */
  private slide(): void {
    if (this.buffer.length > this.windowSize) {
      const overflow = this.buffer.length - this.windowSize;
      this.flushed += this.buffer.slice(0, overflow);
      this.buffer = this.buffer.slice(overflow);
    }
  }

  /**
   * Get the current buffer contents for pattern matching.
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Get the full accumulated text (flushed + buffer).
   */
  getAccumulated(): string {
    return this.flushed + this.buffer;
  }

  /**
   * Get and clear flushed content that has left the buffer window.
   */
  drainFlushed(): string {
    const result = this.flushed;
    this.flushed = '';
    return result;
  }

  /**
   * Check whether the buffer currently ends at a sentence boundary.
   * Used to trigger toxicity checks at natural breakpoints.
   */
  isAtSentenceBoundary(): boolean {
    return SENTENCE_BOUNDARY.test(this.buffer);
  }

  /**
   * Flush content up to the last sentence boundary in the buffer.
   * Returns the flushed text. If no boundary is found, returns empty string.
   */
  flushToSentenceBoundary(): string {
    const match = this.findLastSentenceBoundary();
    if (match === -1) {
      return '';
    }
    const flushedText = this.buffer.slice(0, match + 1);
    this.buffer = this.buffer.slice(match + 1);
    return flushedText;
  }

  /**
   * Force flush the entire buffer. Used on stream end.
   */
  flushAll(): string {
    const result = this.buffer;
    this.buffer = '';
    return result;
  }

  /**
   * Find the index of the last sentence boundary in the buffer.
   * Returns -1 if no boundary is found.
   */
  private findLastSentenceBoundary(): number {
    let lastIndex = -1;
    const regex = /[.!?](?:\s|$)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(this.buffer)) !== null) {
      lastIndex = match.index;
    }
    return lastIndex;
  }

  /**
   * Test whether a pattern matches anywhere in the current buffer.
   */
  matchPattern(pattern: RegExp): RegExpMatchArray | null {
    return this.buffer.match(pattern);
  }

  /**
   * Test whether a pattern matches in the current buffer, returning all matches.
   */
  matchAllPatterns(pattern: RegExp): RegExpMatchArray[] {
    const results: RegExpMatchArray[] = [];
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let match: RegExpExecArray | null;
    while ((match = globalPattern.exec(this.buffer)) !== null) {
      results.push(match);
    }
    return results;
  }

  /**
   * Replace occurrences of a pattern in the buffer.
   * Returns the number of replacements made.
   */
  replaceInBuffer(pattern: RegExp, replacement: string): number {
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let count = 0;
    this.buffer = this.buffer.replace(globalPattern, () => {
      count++;
      return replacement;
    });
    return count;
  }

  /** Current buffer length. */
  get length(): number {
    return this.buffer.length;
  }

  /** Total accumulated length (flushed + buffer). */
  get totalLength(): number {
    return this.flushed.length + this.buffer.length;
  }

  /** Reset the buffer to empty. */
  reset(): void {
    this.buffer = '';
    this.flushed = '';
  }
}
