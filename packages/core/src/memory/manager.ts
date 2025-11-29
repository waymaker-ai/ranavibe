/**
 * Smart Memory Manager
 * Manages conversation context with intelligent compression
 */

import type { Message } from '../types';
import type {
  CompressionStrategy,
  MessageImportance,
  CompressedMessage,
  MemoryWindowConfig,
  CompressionResult,
  MemoryStats,
  MemoryState,
} from './types';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MemoryWindowConfig = {
  maxTokens: 4000,
  preserveRecent: 3,
  strategy: 'hybrid',
  importanceThreshold: 'medium',
  preserveSystem: true,
};

/**
 * Smart Memory Manager
 * Intelligently compresses conversation history to fit within token limits
 */
export class MemoryManager {
  private state: MemoryState;
  private summarizer?: (messages: Message[]) => Promise<string>;

  constructor(config: Partial<MemoryWindowConfig> = {}) {
    this.state = {
      messages: [],
      tokenCount: 0,
      config: { ...DEFAULT_CONFIG, ...config },
      stats: {
        totalMessages: 0,
        totalTokensProcessed: 0,
        totalTokensSaved: 0,
        averageRatio: 1,
        compressionCount: 0,
      },
    };
  }

  /**
   * Set a custom summarizer function (uses LLM)
   */
  setSummarizer(fn: (messages: Message[]) => Promise<string>): void {
    this.summarizer = fn;
  }

  /**
   * Add a message to memory
   */
  async addMessage(message: Message): Promise<void> {
    const tokens = this.estimateTokens(message.content as string);
    const importance = this.scoreImportance(
      message,
      this.state.messages.length,
      this.state.messages.length + 1
    );

    const compressedMsg: CompressedMessage = {
      role: message.role,
      content: message.content as string,
      originalTokens: tokens,
      compressedTokens: tokens,
      ratio: 1,
      timestamp: new Date(),
      importance,
      wasCompressed: false,
    };

    this.state.messages.push(compressedMsg);
    this.state.tokenCount += tokens;
    this.state.stats.totalMessages++;
    this.state.stats.totalTokensProcessed += tokens;

    // Check if compression is needed
    if (this.state.tokenCount > this.state.config.maxTokens) {
      await this.compress();
    }
  }

  /**
   * Add multiple messages
   */
  async addMessages(messages: Message[]): Promise<void> {
    for (const msg of messages) {
      await this.addMessage(msg);
    }
  }

  /**
   * Get messages for context (ready to send to LLM)
   */
  getMessages(): Message[] {
    const messages: Message[] = [];

    // Add history summary if exists
    if (this.state.historySummary) {
      messages.push({
        role: 'system',
        content: `[Previous conversation summary: ${this.state.historySummary}]`,
      });
    }

    // Add current messages
    for (const msg of this.state.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Compress memory to fit within limits
   */
  async compress(): Promise<CompressionResult> {
    const { maxTokens, preserveRecent, strategy, preserveSystem } = this.state.config;
    const messages = [...this.state.messages];

    // Find messages to preserve
    const preserveIndices = new Set<number>();

    // Preserve recent messages
    for (let i = Math.max(0, messages.length - preserveRecent); i < messages.length; i++) {
      preserveIndices.add(i);
    }

    // Preserve system messages if configured
    if (preserveSystem) {
      messages.forEach((msg, i) => {
        if (msg.role === 'system') {
          preserveIndices.add(i);
        }
      });
    }

    // Preserve high-importance messages
    messages.forEach((msg, i) => {
      if (msg.importance === 'critical' || msg.importance === 'high') {
        preserveIndices.add(i);
      }
    });

    // Get messages to compress
    const toCompress = messages.filter((_, i) => !preserveIndices.has(i));
    const toPreserve = messages.filter((_, i) => preserveIndices.has(i));

    const originalTokens = this.state.tokenCount;
    let compressedMessages: CompressedMessage[] = [];
    let summary: string | undefined;

    // Apply compression strategy
    switch (strategy) {
      case 'none':
        compressedMessages = [...messages];
        break;

      case 'truncate':
        compressedMessages = this.truncateMessages(toCompress, toPreserve, maxTokens);
        break;

      case 'summarize':
        const result = await this.summarizeMessages(toCompress, toPreserve, maxTokens);
        compressedMessages = result.messages;
        summary = result.summary;
        break;

      case 'extract':
        compressedMessages = await this.extractKeyPoints(toCompress, toPreserve, maxTokens);
        break;

      case 'hybrid':
      default:
        const hybridResult = await this.hybridCompress(toCompress, toPreserve, maxTokens);
        compressedMessages = hybridResult.messages;
        summary = hybridResult.summary;
        break;
    }

    // Update state
    this.state.messages = compressedMessages;
    this.state.tokenCount = compressedMessages.reduce((sum, m) => sum + m.compressedTokens, 0);
    if (summary) {
      this.state.historySummary = this.state.historySummary
        ? `${this.state.historySummary}\n\n${summary}`
        : summary;
    }

    // Update stats
    const tokensSaved = originalTokens - this.state.tokenCount;
    this.state.stats.totalTokensSaved += tokensSaved;
    this.state.stats.compressionCount++;
    this.state.stats.averageRatio =
      this.state.stats.totalTokensProcessed > 0
        ? (this.state.stats.totalTokensProcessed - this.state.stats.totalTokensSaved) /
          this.state.stats.totalTokensProcessed
        : 1;

    return {
      messages: compressedMessages,
      originalTokens,
      finalTokens: this.state.tokenCount,
      ratio: originalTokens > 0 ? this.state.tokenCount / originalTokens : 1,
      compressedCount: toCompress.length,
      preservedCount: toPreserve.length,
      summary,
    };
  }

  /**
   * Truncate messages to fit
   */
  private truncateMessages(
    toCompress: CompressedMessage[],
    toPreserve: CompressedMessage[],
    maxTokens: number
  ): CompressedMessage[] {
    const preserveTokens = toPreserve.reduce((sum, m) => sum + m.compressedTokens, 0);
    const availableTokens = maxTokens - preserveTokens;

    if (availableTokens <= 0) {
      return toPreserve;
    }

    // Simple: keep most recent from compressible set
    let currentTokens = 0;
    const kept: CompressedMessage[] = [];

    // Process from most recent to oldest
    for (let i = toCompress.length - 1; i >= 0; i--) {
      const msg = toCompress[i];
      if (currentTokens + msg.compressedTokens <= availableTokens) {
        kept.unshift(msg);
        currentTokens += msg.compressedTokens;
      }
    }

    return [...kept, ...toPreserve];
  }

  /**
   * Summarize messages using LLM
   */
  private async summarizeMessages(
    toCompress: CompressedMessage[],
    toPreserve: CompressedMessage[],
    _maxTokens: number
  ): Promise<{ messages: CompressedMessage[]; summary: string }> {
    if (!this.summarizer || toCompress.length === 0) {
      return { messages: toPreserve, summary: '' };
    }

    // Convert to Message format for summarizer
    const messagesForSummary: Message[] = toCompress.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const summary = await this.summarizer(messagesForSummary);
      return { messages: toPreserve, summary };
    } catch {
      // Fallback to truncation
      return {
        messages: this.truncateMessages(toCompress, toPreserve, _maxTokens),
        summary: '',
      };
    }
  }

  /**
   * Extract key points from messages
   */
  private async extractKeyPoints(
    toCompress: CompressedMessage[],
    toPreserve: CompressedMessage[],
    _maxTokens: number
  ): Promise<CompressedMessage[]> {
    // Extract key information from each message
    const extracted = toCompress.map((msg) => {
      const keyContent = this.extractKeyContent(msg.content);
      return {
        ...msg,
        content: keyContent,
        compressedTokens: this.estimateTokens(keyContent),
        wasCompressed: true,
        ratio: this.estimateTokens(keyContent) / msg.originalTokens,
      };
    });

    return [...extracted, ...toPreserve];
  }

  /**
   * Hybrid compression: extract + summarize + truncate
   */
  private async hybridCompress(
    toCompress: CompressedMessage[],
    toPreserve: CompressedMessage[],
    maxTokens: number
  ): Promise<{ messages: CompressedMessage[]; summary: string }> {
    // Step 1: Extract key points from older messages
    const midpoint = Math.floor(toCompress.length / 2);
    const older = toCompress.slice(0, midpoint);
    const newer = toCompress.slice(midpoint);

    // Step 2: Summarize older messages if we have a summarizer
    let summary = '';
    if (this.summarizer && older.length > 0) {
      try {
        const olderMessages: Message[] = older.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        summary = await this.summarizer(olderMessages);
      } catch {
        // Continue without summary
      }
    }

    // Step 3: Keep newer messages with extraction
    const extractedNewer = await this.extractKeyPoints(newer, [], maxTokens);

    // Step 4: Truncate if still over limit
    const preserveTokens = toPreserve.reduce((sum, m) => sum + m.compressedTokens, 0);
    const extractedTokens = extractedNewer.reduce((sum, m) => sum + m.compressedTokens, 0);
    const summaryTokens = this.estimateTokens(summary);

    if (preserveTokens + extractedTokens + summaryTokens > maxTokens) {
      const availableForExtracted = maxTokens - preserveTokens - summaryTokens;
      let currentTokens = 0;
      const finalExtracted: CompressedMessage[] = [];

      for (let i = extractedNewer.length - 1; i >= 0; i--) {
        const msg = extractedNewer[i];
        if (currentTokens + msg.compressedTokens <= availableForExtracted) {
          finalExtracted.unshift(msg);
          currentTokens += msg.compressedTokens;
        }
      }

      return { messages: [...finalExtracted, ...toPreserve], summary };
    }

    return { messages: [...extractedNewer, ...toPreserve], summary };
  }

  /**
   * Extract key content from a message
   */
  private extractKeyContent(content: string): string {
    // Simple extraction: keep first and last sentences, key phrases
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());

    if (sentences.length <= 2) {
      return content;
    }

    // Keep first, last, and any sentences with key indicators
    const keyIndicators = ['important', 'key', 'must', 'should', 'need', 'critical', 'error', 'success'];
    const keySentences: string[] = [];

    sentences.forEach((sentence, i) => {
      const lower = sentence.toLowerCase();
      const isKey =
        i === 0 ||
        i === sentences.length - 1 ||
        keyIndicators.some((indicator) => lower.includes(indicator));

      if (isKey) {
        keySentences.push(sentence.trim());
      }
    });

    return keySentences.join('. ') + '.';
  }

  /**
   * Score message importance
   */
  private scoreImportance(message: Message, index: number, total: number): MessageImportance {
    // Use custom scorer if provided
    if (this.state.config.importanceScorer) {
      return this.state.config.importanceScorer(message, index, total);
    }

    // Default scoring
    const content = (message.content as string).toLowerCase();

    // System messages are always critical
    if (message.role === 'system') {
      return 'critical';
    }

    // Check for importance indicators
    if (content.includes('important') || content.includes('critical') || content.includes('error')) {
      return 'high';
    }

    // Recent messages are more important
    const recency = index / total;
    if (recency > 0.8) {
      return 'high';
    }
    if (recency > 0.5) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Estimate tokens in text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Get current statistics
   */
  getStats(): MemoryStats {
    return { ...this.state.stats };
  }

  /**
   * Get current state
   */
  getState(): MemoryState {
    return {
      ...this.state,
      messages: [...this.state.messages],
      config: { ...this.state.config },
      stats: { ...this.state.stats },
    };
  }

  /**
   * Clear memory
   */
  clear(): void {
    this.state.messages = [];
    this.state.historySummary = undefined;
    this.state.tokenCount = 0;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.state.stats = {
      totalMessages: 0,
      totalTokensProcessed: 0,
      totalTokensSaved: 0,
      averageRatio: 1,
      compressionCount: 0,
    };
  }

  /**
   * Update configuration
   */
  configure(config: Partial<MemoryWindowConfig>): void {
    this.state.config = { ...this.state.config, ...config };
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    return this.state.tokenCount;
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.state.messages.length;
  }
}

/**
 * Create a memory manager
 */
export function createMemoryManager(config?: Partial<MemoryWindowConfig>): MemoryManager {
  return new MemoryManager(config);
}
