/**
 * Memory Management Module
 * Smart context compression and conversation history management
 */

export { MemoryManager, createMemoryManager } from './manager';
export type {
  CompressionStrategy,
  MessageImportance,
  CompressedMessage,
  MemoryWindowConfig,
  CompressionResult,
  MemoryStats,
  MemoryState,
} from './types';

// Vector Memory
export {
  VectorMemory,
  InMemoryVectorBackend,
  FileVectorBackend,
  createVectorMemory,
  createInMemoryVectorMemory,
  createFileVectorMemory,
  cosineSimilarity,
  euclideanDistance,
  euclideanToSimilarity,
  dotProduct,
  normalize,
  calculateSimilarity,
} from './vector';

export type {
  VectorMemoryEntry,
  VectorSearchResult,
  VectorMemoryBackend,
  EmbeddingProvider,
  VectorMemoryConfig,
  VectorMemoryStats,
  SimilarityMetric,
} from './vector';

// Entity Extraction
export { EntityExtractor, createEntityExtractor } from './entities';
export type {
  EntityType,
  ConfidenceScore,
  Entity,
  EntityContext,
  EntityRelationship,
  EntityGraph,
  ExtractionResult,
  EntityTimelineEvent,
  EntityExtractorConfig,
} from './entities';

// Shared Memory
export { SharedMemory, createSharedMemory } from './shared';
export type {
  PermissionLevel,
  ConflictStrategy,
  MemoryEntry,
  NamespaceConfig,
  AccessLogEntry,
  SubscriptionCallback,
  BroadcastMessage,
} from './shared';
