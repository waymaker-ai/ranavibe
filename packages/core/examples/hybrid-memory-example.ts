/**
 * Hybrid Memory Example
 * Combining MemoryManager (context compression) with VectorMemory (long-term retrieval)
 */

import { createMemoryManager, createInMemoryVectorMemory, EmbeddingProvider } from '../src';
import type { Message } from '../src/types';

/**
 * Hybrid memory system combining:
 * - MemoryManager for short-term context window management
 * - VectorMemory for long-term semantic retrieval
 */
class HybridMemorySystem {
  private contextMemory;
  private vectorMemory;

  constructor(embeddingProvider: EmbeddingProvider) {
    // Short-term: Recent conversation context (compressed)
    this.contextMemory = createMemoryManager({
      maxTokens: 4000,
      preserveRecent: 5,
      strategy: 'hybrid',
    });

    // Long-term: Semantic memory for recall
    this.vectorMemory = createInMemoryVectorMemory(embeddingProvider.dimensions, {
      embeddingProvider,
      defaultThreshold: 0.6,
    });
  }

  async initialize() {
    await this.vectorMemory.initialize();
  }

  /**
   * Add a message to both memory systems
   */
  async addMessage(message: Message) {
    // Add to short-term context
    await this.contextMemory.addMessage(message);

    // Archive to long-term memory (for retrieval)
    const content = message.content as string;
    if (content && content.length > 10) {
      await this.vectorMemory.store(content, {
        role: message.role,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get messages for LLM context
   * Includes: compressed recent context + relevant long-term memories
   */
  async getContextWithMemories(currentQuery: string): Promise<Message[]> {
    const messages: Message[] = [];

    // 1. Retrieve relevant long-term memories
    const relevantMemories = await this.vectorMemory.search(currentQuery, 3, 0.6);

    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .map((m, i) => `${i + 1}. ${m.entry.content} (relevance: ${m.score.toFixed(2)})`)
        .join('\n');

      messages.push({
        role: 'system',
        content: `[Relevant past context retrieved from memory:\n${memoryContext}]`,
      });
    }

    // 2. Add compressed recent context
    const recentMessages = this.contextMemory.getMessages();
    messages.push(...recentMessages);

    return messages;
  }

  /**
   * Get statistics from both systems
   */
  getStats() {
    return {
      context: this.contextMemory.getStats(),
      vector: this.vectorMemory.getStats(),
      tokenCount: this.contextMemory.getTokenCount(),
      messageCount: this.contextMemory.getMessageCount(),
    };
  }

  /**
   * Clear both memory systems
   */
  async clear() {
    this.contextMemory.clear();
    await this.vectorMemory.clear();
  }

  async close() {
    await this.vectorMemory.close();
  }
}

// ============================================================================
// Demo
// ============================================================================

async function demo() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Hybrid Memory System Demo               ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Mock embedding provider
  const embeddingProvider: EmbeddingProvider = {
    dimensions: 128,
    async embed(text: string): Promise<number[]> {
      const vector = new Array(128).fill(0);
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        vector[i % 128] += charCode / 1000;
      }
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map((val) => val / norm);
    },
  };

  const memory = new HybridMemorySystem(embeddingProvider);
  await memory.initialize();

  // Simulate a conversation
  console.log('📝 Simulating conversation...\n');

  const conversation: Message[] = [
    { role: 'user', content: 'What is machine learning?' },
    {
      role: 'assistant',
      content: 'Machine learning is a subset of AI that enables systems to learn from data.',
    },
    { role: 'user', content: 'How do neural networks work?' },
    {
      role: 'assistant',
      content: 'Neural networks consist of layers of interconnected nodes that process information.',
    },
    { role: 'user', content: 'What is my favorite color?' },
    { role: 'assistant', content: 'I don\'t have information about your favorite color.' },
    { role: 'user', content: 'My favorite color is blue' },
    { role: 'assistant', content: 'Got it! I\'ll remember that your favorite color is blue.' },
    { role: 'user', content: 'Can you explain transformers?' },
    {
      role: 'assistant',
      content:
        'Transformers are neural network architectures that use attention mechanisms for processing sequences.',
    },
  ];

  // Add messages to memory
  for (const msg of conversation) {
    await memory.addMessage(msg);
    console.log(`[${msg.role}]: ${(msg.content as string).substring(0, 60)}...`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // New query: retrieve context with relevant memories
  const newQuery = 'Tell me about deep learning and AI';
  console.log(`🔍 New query: "${newQuery}"\n`);
  console.log('Retrieving context with relevant memories...\n');

  const contextMessages = await memory.getContextWithMemories(newQuery);

  console.log('📋 Context for LLM:\n');
  contextMessages.forEach((msg, i) => {
    const content = msg.content as string;
    console.log(`${i + 1}. [${msg.role}]`);
    if (msg.role === 'system') {
      console.log(`   ${content}\n`);
    } else {
      console.log(`   ${content.substring(0, 80)}...\n`);
    }
  });

  // Show stats
  console.log('='.repeat(60) + '\n');
  console.log('📊 Memory Statistics:\n');
  const stats = memory.getStats();
  console.log('Context Memory (Short-term):');
  console.log(`  - Total messages processed: ${stats.context.totalMessages}`);
  console.log(`  - Total tokens processed: ${stats.context.totalTokensProcessed}`);
  console.log(`  - Tokens saved: ${stats.context.totalTokensSaved}`);
  console.log(`  - Average compression ratio: ${stats.context.averageRatio.toFixed(2)}`);
  console.log(`  - Current token count: ${stats.tokenCount}`);
  console.log(`  - Current message count: ${stats.messageCount}`);

  console.log('\nVector Memory (Long-term):');
  console.log(`  - Total entries: ${stats.vector.totalEntries}`);
  console.log(`  - Total searches: ${stats.vector.totalSearches}`);
  console.log(`  - Average search time: ${stats.vector.averageSearchTime.toFixed(2)}ms`);
  console.log(`  - Backend: ${stats.vector.backendType}`);

  await memory.close();

  console.log('\n✅ Demo completed!');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

export { HybridMemorySystem };
