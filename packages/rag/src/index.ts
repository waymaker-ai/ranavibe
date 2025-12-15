/**
 * @ranavibe/rag - Advanced RAG (Retrieval Augmented Generation)
 * Intelligent chunking, hybrid retrieval, re-ranking, and synthesis
 *
 * @example
 * ```typescript
 * import { createRAGPipeline, RAGPresets, chunkers, retrievers, rerankers } from '@ranavibe/rag';
 *
 * // Use a preset
 * const pipeline = RAGPresets.balanced();
 *
 * // Or create custom pipeline
 * const custom = createRAGPipeline({
 *   chunker: { type: 'semantic', chunkSize: 512, overlap: 50 },
 *   retriever: { type: 'hybrid', topK: 20 },
 *   reranker: { type: 'cross-encoder', topK: 5 },
 *   synthesizer: { type: 'refine', citations: true },
 * });
 *
 * // Index documents
 * await pipeline.index([
 *   { id: 'doc1', content: 'Your document content...' }
 * ]);
 *
 * // Query
 * const result = await pipeline.query({
 *   query: 'How does this work?'
 * });
 *
 * console.log(result.answer);
 * console.log(result.citations);
 * ```
 */

// Core pipeline
export { createRAGPipeline, RAGPipelineImpl } from './pipeline/builder';
export { RAGPresets, createCustomPipeline } from './pipeline/presets';

// Chunking
export { chunkers } from './chunking/index';
export { SemanticChunker, semanticChunker } from './chunking/semantic';
export { MarkdownChunker, markdownChunker } from './chunking/markdown';
export { CodeChunker, codeChunker } from './chunking/code';
export { RecursiveChunker, recursiveChunker } from './chunking/recursive';

// Retrieval
export { retrievers } from './retrieval/index';
export { VectorRetriever, vectorRetriever } from './retrieval/vector';
export { KeywordRetriever, keywordRetriever } from './retrieval/keyword';
export { HybridRetriever, hybridRetriever } from './retrieval/hybrid';

// Vector Database Integrations
export { PineconeRetriever, pineconeRetriever } from './retrieval/pinecone';
export type { PineconeConfig } from './retrieval/pinecone';
export { ChromaRetriever, chromaRetriever } from './retrieval/chroma';
export type { ChromaConfig } from './retrieval/chroma';
export { QdrantRetriever, qdrantRetriever } from './retrieval/qdrant';
export type { QdrantConfig } from './retrieval/qdrant';

// Embeddings
export {
  createEmbeddings,
  OpenAIEmbeddings,
  CohereEmbeddings,
  VoyageEmbeddings,
  GoogleEmbeddings,
  MockEmbeddings,
} from './embeddings/index';

// Reranking
export { rerankers } from './reranking/index';
export { CrossEncoderReranker, crossEncoderReranker } from './reranking/cross-encoder';
export { LLMReranker, llmReranker } from './reranking/llm-reranker';
export { DiversityReranker, diversityReranker } from './reranking/diversity';

// Synthesis
export { synthesizers } from './synthesis/index';
export { RefineSynthesizer, refineSynthesizer } from './synthesis/refine';
export { TreeSummarizeSynthesizer, treeSummarizeSynthesizer } from './synthesis/tree-summarize';
export { CompactSynthesizer, compactSynthesizer } from './synthesis/compact';

// React hooks
export {
  useRAG,
  useRAGStream,
  useRAGIndex,
  RAGProvider,
  initRAGPipeline,
  getRAGPipeline,
} from './react/hooks';

// Knowledge Base
export {
  KnowledgeBase,
  createKnowledgeBase,
  FileLoader,
  URLLoader,
  GitHubLoader,
  DirectoryLoader,
  JSONLoader,
  createLoader,
  expandDirectorySource,
  SupabaseVectorStore,
  createSupabaseVectorStore,
  SUPABASE_SETUP_SQL,
} from './knowledge-base/index';
export type {
  VectorStore,
  EmbeddingProvider,
  Loader,
  KnowledgeBaseConfig,
  VectorStoreConfig,
  EmbeddingConfig,
  ChunkingConfig as KBChunkingConfig,
  AccessControlConfig,
  MetadataSchema,
  KBDocument,
  IngestionSource,
  IngestionOptions,
  IngestionResult,
  KBSearchOptions,
  KBSearchResult,
  KBStats,
  SupabaseVectorStoreConfig,
} from './knowledge-base/index';

// Types
export * from './types';
