/**
 * Chunking module exports
 */

export { SemanticChunker, semanticChunker } from './semantic';
export { MarkdownChunker, markdownChunker } from './markdown';
export { CodeChunker, codeChunker } from './code';
export { RecursiveChunker, recursiveChunker } from './recursive';

// Re-export chunker types
import type { ChunkerOptions, SemanticChunkerOptions, MarkdownChunkerOptions, CodeChunkerOptions } from '../types';
import { SemanticChunker } from './semantic';
import { MarkdownChunker } from './markdown';
import { CodeChunker } from './code';
import { RecursiveChunker } from './recursive';

/**
 * Chunker factory - create chunkers with shorthand syntax
 */
export const chunkers = {
  semantic: (options?: SemanticChunkerOptions) => new SemanticChunker(),
  markdown: (options?: MarkdownChunkerOptions) => new MarkdownChunker(),
  code: (options: CodeChunkerOptions) => new CodeChunker(),
  recursive: (options?: ChunkerOptions) => new RecursiveChunker(),
};
