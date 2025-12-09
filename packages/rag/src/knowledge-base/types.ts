/**
 * Knowledge Base Types
 * High-level abstraction for document management in RAG systems
 */

import type { Document, Chunk } from '../types';

/**
 * Knowledge base configuration
 */
export interface KnowledgeBaseConfig {
  /** Unique identifier for the knowledge base */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this knowledge base contains */
  description?: string;
  /** Vector store configuration */
  vectorStore: VectorStoreConfig;
  /** Embedding configuration */
  embedding: EmbeddingConfig;
  /** Chunking configuration */
  chunking?: ChunkingConfig;
  /** Access control settings */
  accessControl?: AccessControlConfig;
  /** Metadata schema validation */
  metadataSchema?: MetadataSchema;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  /** Provider type */
  provider: 'supabase' | 'pinecone' | 'chroma' | 'qdrant' | 'weaviate' | 'memory';
  /** Table/collection/index name */
  collection: string;
  /** Provider-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  /** Embedding provider */
  provider: 'openai' | 'cohere' | 'voyage' | 'google' | 'local';
  /** Model identifier */
  model: string;
  /** Embedding dimensions */
  dimensions?: number;
}

/**
 * Chunking configuration
 */
export interface ChunkingConfig {
  /** Chunking strategy */
  strategy: 'semantic' | 'recursive' | 'markdown' | 'code' | 'adaptive';
  /** Target chunk size in tokens */
  chunkSize: number;
  /** Overlap between chunks */
  overlap: number;
  /** Additional strategy-specific options */
  options?: Record<string, unknown>;
}

/**
 * Access control configuration
 */
export interface AccessControlConfig {
  /** Whether access control is enabled */
  enabled: boolean;
  /** Default access level for new documents */
  defaultAccess: 'public' | 'private' | 'restricted';
  /** Allowed roles for access */
  allowedRoles?: string[];
}

/**
 * Metadata schema for validation
 */
export interface MetadataSchema {
  /** Required fields */
  required?: string[];
  /** Field type definitions */
  properties?: Record<string, MetadataFieldSchema>;
}

export interface MetadataFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: unknown[];
  default?: unknown;
}

/**
 * Knowledge base document
 */
export interface KBDocument extends Document {
  /** Document title */
  title?: string;
  /** Document URL/source */
  url?: string;
  /** Document type */
  type?: 'text' | 'markdown' | 'code' | 'pdf' | 'html' | 'json';
  /** Access level */
  access?: 'public' | 'private' | 'restricted';
  /** Document tags */
  tags?: string[];
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Ingestion source types
 */
export type IngestionSource =
  | { type: 'text'; content: string; metadata?: Record<string, unknown> }
  | { type: 'file'; path: string; metadata?: Record<string, unknown> }
  | { type: 'url'; url: string; metadata?: Record<string, unknown> }
  | { type: 'directory'; path: string; glob?: string; recursive?: boolean; metadata?: Record<string, unknown> }
  | { type: 'github'; repo: string; branch?: string; path?: string; metadata?: Record<string, unknown> }
  | { type: 'notion'; pageId: string; metadata?: Record<string, unknown> }
  | { type: 'confluence'; spaceKey: string; pageId?: string; metadata?: Record<string, unknown> };

/**
 * Ingestion options
 */
export interface IngestionOptions {
  /** Skip documents that already exist */
  skipExisting?: boolean;
  /** Update existing documents */
  updateExisting?: boolean;
  /** Batch size for processing */
  batchSize?: number;
  /** Custom document ID generator */
  idGenerator?: (source: IngestionSource, index: number) => string;
  /** Pre-processing hook */
  preProcess?: (content: string, metadata: Record<string, unknown>) => Promise<{ content: string; metadata: Record<string, unknown> }>;
  /** Post-processing hook */
  postProcess?: (document: KBDocument) => Promise<KBDocument>;
}

/**
 * Ingestion result
 */
export interface IngestionResult {
  /** Total documents processed */
  total: number;
  /** Successfully ingested documents */
  successful: number;
  /** Failed documents */
  failed: number;
  /** Skipped documents */
  skipped: number;
  /** Document IDs that were ingested */
  documentIds: string[];
  /** Errors encountered */
  errors: IngestionError[];
  /** Processing time in milliseconds */
  processingTime: number;
}

export interface IngestionError {
  source: IngestionSource;
  error: string;
  stack?: string;
}

/**
 * Search options for knowledge base
 */
export interface KBSearchOptions {
  /** Maximum results to return */
  limit?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Filter by metadata */
  filters?: Record<string, unknown>;
  /** Filter by tags */
  tags?: string[];
  /** Filter by access level */
  access?: ('public' | 'private' | 'restricted')[];
  /** Include document content */
  includeContent?: boolean;
  /** Include chunk content */
  includeChunks?: boolean;
  /** Search mode */
  mode?: 'vector' | 'keyword' | 'hybrid';
}

/**
 * Search result
 */
export interface KBSearchResult {
  /** Document ID */
  documentId: string;
  /** Document title */
  title?: string;
  /** Chunk ID */
  chunkId: string;
  /** Chunk content */
  content: string;
  /** Similarity score */
  score: number;
  /** Document metadata */
  metadata: Record<string, unknown>;
  /** Chunk index in document */
  chunkIndex: number;
}

/**
 * Knowledge base statistics
 */
export interface KBStats {
  /** Total documents */
  documentCount: number;
  /** Total chunks */
  chunkCount: number;
  /** Total tokens (estimated) */
  tokenCount: number;
  /** Storage size in bytes */
  storageSize: number;
  /** Last ingestion timestamp */
  lastIngestion?: Date;
  /** Vector store stats */
  vectorStore?: {
    dimensions: number;
    indexType?: string;
  };
}

/**
 * Document update options
 */
export interface DocumentUpdateOptions {
  /** Replace entire document */
  replace?: boolean;
  /** Merge with existing metadata */
  mergeMetadata?: boolean;
  /** Re-chunk the document */
  rechunk?: boolean;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  /** Successful operations */
  successful: number;
  /** Failed operations */
  failed: number;
  /** Error details */
  errors: Array<{ id: string; error: string }>;
}
