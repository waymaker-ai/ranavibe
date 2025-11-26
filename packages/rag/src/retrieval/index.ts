/**
 * Retrieval module exports
 */

export { VectorRetriever, vectorRetriever } from './vector';
export { KeywordRetriever, keywordRetriever } from './keyword';
export { HybridRetriever, hybridRetriever } from './hybrid';

import type { VectorRetrieverOptions, KeywordRetrieverOptions, HybridRetrieverOptions } from '../types';
import { VectorRetriever } from './vector';
import { KeywordRetriever } from './keyword';
import { HybridRetriever } from './hybrid';

/**
 * Retriever factory
 */
export const retrievers = {
  vector: (options?: VectorRetrieverOptions) => new VectorRetriever(),
  keyword: (options?: KeywordRetrieverOptions) => new KeywordRetriever(),
  hybrid: (options?: HybridRetrieverOptions) => new HybridRetriever(),
};
