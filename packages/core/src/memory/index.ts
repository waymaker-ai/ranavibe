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
