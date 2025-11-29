/**
 * Memory Management Types
 * Smart context compression and conversation history management
 */

import type { Message } from '../types';

/**
 * Compression strategy for messages
 */
export type CompressionStrategy =
  | 'none' // Keep full messages
  | 'truncate' // Simple truncation
  | 'summarize' // LLM-based summarization
  | 'extract' // Extract key points only
  | 'hybrid'; // Combination approach

/**
 * Message importance level
 */
export type MessageImportance = 'critical' | 'high' | 'medium' | 'low';

/**
 * Compressed message entry
 */
export interface CompressedMessage {
  /** Original message role */
  role: Message['role'];
  /** Compressed content */
  content: string;
  /** Original token count */
  originalTokens: number;
  /** Compressed token count */
  compressedTokens: number;
  /** Compression ratio */
  ratio: number;
  /** Timestamp */
  timestamp: Date;
  /** Message importance */
  importance: MessageImportance;
  /** Whether this was compressed */
  wasCompressed: boolean;
  /** Original message ID (if available) */
  originalId?: string;
}

/**
 * Memory window configuration
 */
export interface MemoryWindowConfig {
  /** Maximum tokens to keep in context */
  maxTokens: number;
  /** Number of recent messages to always keep uncompressed */
  preserveRecent: number;
  /** Compression strategy */
  strategy: CompressionStrategy;
  /** Importance threshold for preservation */
  importanceThreshold: MessageImportance;
  /** Whether to preserve system messages */
  preserveSystem: boolean;
  /** Custom importance scorer */
  importanceScorer?: (message: Message, index: number, total: number) => MessageImportance;
}

/**
 * Compression result
 */
export interface CompressionResult {
  /** Compressed messages */
  messages: CompressedMessage[];
  /** Original total tokens */
  originalTokens: number;
  /** Final token count */
  finalTokens: number;
  /** Compression ratio */
  ratio: number;
  /** Number of messages compressed */
  compressedCount: number;
  /** Number of messages preserved */
  preservedCount: number;
  /** Summary of compressed content (if applicable) */
  summary?: string;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total messages seen */
  totalMessages: number;
  /** Total tokens processed */
  totalTokensProcessed: number;
  /** Total tokens saved */
  totalTokensSaved: number;
  /** Average compression ratio */
  averageRatio: number;
  /** Number of compression operations */
  compressionCount: number;
}

/**
 * Conversation memory state
 */
export interface MemoryState {
  /** Current messages in memory */
  messages: CompressedMessage[];
  /** Summary of compressed history */
  historySummary?: string;
  /** Current token count */
  tokenCount: number;
  /** Configuration */
  config: MemoryWindowConfig;
  /** Statistics */
  stats: MemoryStats;
}
