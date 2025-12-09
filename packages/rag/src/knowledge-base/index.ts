/**
 * Knowledge Base Module
 * High-level document management for RAG systems
 */

// Main knowledge base
export { KnowledgeBase, createKnowledgeBase } from './knowledge-base';
export type { VectorStore, EmbeddingProvider } from './knowledge-base';

// Types
export type {
  KnowledgeBaseConfig,
  VectorStoreConfig,
  EmbeddingConfig,
  ChunkingConfig,
  AccessControlConfig,
  MetadataSchema,
  MetadataFieldSchema,
  KBDocument,
  IngestionSource,
  IngestionOptions,
  IngestionResult,
  IngestionError,
  KBSearchOptions,
  KBSearchResult,
  KBStats,
  DocumentUpdateOptions,
  BulkOperationResult,
} from './types';

// Loaders
export {
  FileLoader,
  URLLoader,
  GitHubLoader,
  DirectoryLoader,
  JSONLoader,
  PDFLoader,
  createLoader,
  expandDirectorySource,
} from './loaders';
export type { Loader } from './loaders';

// Vector stores
export {
  SupabaseVectorStore,
  createSupabaseVectorStore,
  SUPABASE_SETUP_SQL,
} from './supabase-store';
export type { SupabaseVectorStoreConfig } from './supabase-store';

// Document persistence
export {
  MemoryDocumentStore,
  SupabaseDocumentStore,
  createDocumentStore,
  DOCUMENT_STORE_SQL,
} from './persistence';
export type { DocumentStore, ListOptions } from './persistence';
