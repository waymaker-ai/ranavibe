/**
 * Retrieval module exports
 */

// Basic retrievers
export { VectorRetriever, vectorRetriever } from './vector';
export { KeywordRetriever, keywordRetriever } from './keyword';
export { HybridRetriever, hybridRetriever } from './hybrid';

// Vector database integrations
export { PineconeRetriever, pineconeRetriever } from './pinecone';
export type { PineconeConfig } from './pinecone';

export { ChromaRetriever, chromaRetriever } from './chroma';
export type { ChromaConfig } from './chroma';

export { QdrantRetriever, qdrantRetriever } from './qdrant';
export type { QdrantConfig } from './qdrant';

import type { VectorRetrieverOptions, KeywordRetrieverOptions, HybridRetrieverOptions } from '../types';
import { VectorRetriever } from './vector';
import { KeywordRetriever } from './keyword';
import { HybridRetriever } from './hybrid';
import { PineconeRetriever, PineconeConfig } from './pinecone';
import { ChromaRetriever, ChromaConfig } from './chroma';
import { QdrantRetriever, QdrantConfig } from './qdrant';
import type { EmbeddingProvider } from './pinecone';

/**
 * Retriever factory
 */
export const retrievers = {
  vector: (options?: VectorRetrieverOptions) => new VectorRetriever(),
  keyword: (options?: KeywordRetrieverOptions) => new KeywordRetriever(),
  hybrid: (options?: HybridRetrieverOptions) => new HybridRetriever(),
  pinecone: (config: PineconeConfig, embedder: EmbeddingProvider) => new PineconeRetriever(config, embedder),
  chroma: (config: ChromaConfig, embedder: EmbeddingProvider) => new ChromaRetriever(config, embedder),
  qdrant: (config: QdrantConfig, embedder: EmbeddingProvider) => new QdrantRetriever(config, embedder),
};
