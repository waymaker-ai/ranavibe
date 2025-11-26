/**
 * Reranking module exports
 */

export { CrossEncoderReranker, crossEncoderReranker } from './cross-encoder';
export { LLMReranker, llmReranker } from './llm-reranker';
export { DiversityReranker, diversityReranker } from './diversity';

import type { CrossEncoderRerankerOptions, LLMRerankerOptions, DiversityRerankerOptions } from '../types';
import { CrossEncoderReranker } from './cross-encoder';
import { LLMReranker } from './llm-reranker';
import { DiversityReranker } from './diversity';

/**
 * Reranker factory
 */
export const rerankers = {
  crossEncoder: (options?: CrossEncoderRerankerOptions) => new CrossEncoderReranker(),
  llm: (options?: LLMRerankerOptions) => new LLMReranker(),
  diversity: (options?: DiversityRerankerOptions) => new DiversityReranker(),
};
