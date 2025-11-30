/**
 * Vector Memory Example
 * Demonstrates long-term vector memory with similarity search
 */

import {
  createInMemoryVectorMemory,
  createFileVectorMemory,
  VectorMemory,
  VectorMemoryBackend,
  EmbeddingProvider,
  createVectorMemory,
} from '../src/memory/vector';

// ============================================================================
// Example 1: Basic In-Memory Vector Storage
// ============================================================================

async function example1_basicInMemory() {
  console.log('\n=== Example 1: Basic In-Memory Vector Storage ===\n');

  // Create a simple embedding provider (using random vectors for demo)
  const mockEmbeddingProvider: EmbeddingProvider = {
    dimensions: 384, // Common embedding size
    async embed(text: string): Promise<number[]> {
      // In production, this would call OpenAI, Anthropic, or another embedding API
      // For demo purposes, we'll create a deterministic "hash-like" vector
      const vector = new Array(384).fill(0);
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        vector[i % 384] += charCode / 1000;
      }
      // Normalize
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map((val) => val / norm);
    },
  };

  // Create vector memory
  const memory = createInMemoryVectorMemory(384, {
    embeddingProvider: mockEmbeddingProvider,
    defaultThreshold: 0.5,
  });

  await memory.initialize();

  // Store some memories
  const id1 = await memory.store('The cat sat on the mat', {
    category: 'animals',
    timestamp: new Date().toISOString(),
  });
  console.log('Stored memory 1:', id1);

  const id2 = await memory.store('The dog played in the park', {
    category: 'animals',
    timestamp: new Date().toISOString(),
  });
  console.log('Stored memory 2:', id2);

  const id3 = await memory.store('Machine learning is fascinating', {
    category: 'technology',
    timestamp: new Date().toISOString(),
  });
  console.log('Stored memory 3:', id3);

  const id4 = await memory.store('The kitten chased a ball', {
    category: 'animals',
    timestamp: new Date().toISOString(),
  });
  console.log('Stored memory 4:', id4);

  // Search for similar content
  console.log('\nSearching for: "cat playing"');
  const results = await memory.search('cat playing', 3);

  console.log(`\nFound ${results.length} similar memories:`);
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. Score: ${result.score.toFixed(3)}`);
    console.log(`   Content: ${result.entry.content}`);
    console.log(`   Metadata:`, result.entry.metadata);
  });

  // Get statistics
  console.log('\nMemory Statistics:');
  console.log(memory.getStats());

  await memory.close();
}

// ============================================================================
// Example 2: File-Based Persistence
// ============================================================================

async function example2_fileBased() {
  console.log('\n=== Example 2: File-Based Persistence ===\n');

  const mockEmbeddingProvider: EmbeddingProvider = {
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

  // Create file-based vector memory
  const memory = createFileVectorMemory('./vector-memory.json', 128, {
    embeddingProvider: mockEmbeddingProvider,
    metric: 'cosine',
  });

  await memory.initialize();

  // Store memories
  await memory.store('User prefers dark mode', { type: 'preference' });
  await memory.store('User speaks English and Spanish', { type: 'profile' });
  await memory.store('Last conversation was about AI ethics', { type: 'context' });

  console.log(`Stored ${await memory.count()} memories`);

  // Search
  const results = await memory.search('user language preferences', 2);
  console.log('\nSearch results:');
  results.forEach((r) => {
    console.log(`- ${r.entry.content} (score: ${r.score.toFixed(3)})`);
  });

  await memory.close();
  console.log('\nMemory persisted to file: ./vector-memory.json');
}

// ============================================================================
// Example 3: Pre-computed Embeddings
// ============================================================================

async function example3_precomputedEmbeddings() {
  console.log('\n=== Example 3: Pre-computed Embeddings ===\n');

  const memory = createInMemoryVectorMemory(3); // Simple 3D vectors for demo
  await memory.initialize();

  // Store with pre-computed embeddings
  await memory.store('Document A', { type: 'doc' }, [0.9, 0.1, 0.0]);
  await memory.store('Document B', { type: 'doc' }, [0.8, 0.2, 0.1]);
  await memory.store('Document C', { type: 'doc' }, [0.1, 0.0, 0.9]);

  // Search with vector
  const results = await memory.search([0.85, 0.15, 0.05], 2);

  console.log('Results for vector [0.85, 0.15, 0.05]:');
  results.forEach((r) => {
    console.log(`- ${r.entry.content}: ${r.score.toFixed(3)}`);
  });

  await memory.close();
}

// ============================================================================
// Example 4: Different Similarity Metrics
// ============================================================================

async function example4_similarityMetrics() {
  console.log('\n=== Example 4: Different Similarity Metrics ===\n');

  const memory = createInMemoryVectorMemory(3);
  await memory.initialize();

  // Store vectors
  await memory.store('Point A', {}, [1.0, 0.0, 0.0]);
  await memory.store('Point B', {}, [0.0, 1.0, 0.0]);
  await memory.store('Point C', {}, [0.7, 0.7, 0.0]);

  const query = [0.6, 0.6, 0.0];

  // Try different metrics
  console.log('Query vector:', query);

  console.log('\nCosine similarity:');
  const cosineResults = await memory.search(query, 3, 0, 'cosine');
  cosineResults.forEach((r) => {
    console.log(`  ${r.entry.content}: ${r.score.toFixed(3)}`);
  });

  console.log('\nEuclidean distance (converted to similarity):');
  const euclideanResults = await memory.search(query, 3, 0, 'euclidean');
  euclideanResults.forEach((r) => {
    console.log(`  ${r.entry.content}: ${r.score.toFixed(3)}`);
  });

  console.log('\nDot product:');
  const dotResults = await memory.search(query, 3, 0, 'dot');
  dotResults.forEach((r) => {
    console.log(`  ${r.entry.content}: ${r.score.toFixed(3)}`);
  });

  await memory.close();
}

// ============================================================================
// Example 5: Custom Backend Adapter
// ============================================================================

class LoggingBackend implements VectorMemoryBackend {
  private delegate: VectorMemoryBackend;
  private logPrefix: string;

  constructor(delegate: VectorMemoryBackend, logPrefix: string = 'LoggingBackend') {
    this.delegate = delegate;
    this.logPrefix = logPrefix;
  }

  async initialize(): Promise<void> {
    console.log(`[${this.logPrefix}] Initializing...`);
    await this.delegate.initialize();
  }

  async store(entry: any): Promise<void> {
    console.log(`[${this.logPrefix}] Storing entry: ${entry.id}`);
    await this.delegate.store(entry);
  }

  async search(query: number[], k: number, threshold?: number, metric?: any): Promise<any[]> {
    console.log(`[${this.logPrefix}] Searching for ${k} results (threshold: ${threshold})`);
    const results = await this.delegate.search(query, k, threshold, metric);
    console.log(`[${this.logPrefix}] Found ${results.length} results`);
    return results;
  }

  async delete(id: string): Promise<boolean> {
    console.log(`[${this.logPrefix}] Deleting entry: ${id}`);
    return await this.delegate.delete(id);
  }

  async clear(): Promise<void> {
    console.log(`[${this.logPrefix}] Clearing all entries`);
    await this.delegate.clear();
  }

  async count(): Promise<number> {
    const count = await this.delegate.count();
    console.log(`[${this.logPrefix}] Current count: ${count}`);
    return count;
  }

  async close(): Promise<void> {
    console.log(`[${this.logPrefix}] Closing...`);
    await this.delegate.close();
  }
}

async function example5_customBackend() {
  console.log('\n=== Example 5: Custom Backend (Logging Wrapper) ===\n');

  const { InMemoryVectorBackend } = await import('../src/memory/vector');

  const loggingBackend = new LoggingBackend(
    new InMemoryVectorBackend(),
    'VectorMemory'
  );

  const memory = createVectorMemory({
    dimensions: 3,
    backend: loggingBackend,
  });

  await memory.initialize();
  await memory.store('Test entry', {}, [1, 0, 0]);
  await memory.search([1, 0, 0], 1);
  await memory.count();
  await memory.close();
}

// ============================================================================
// Example 6: Real-World Chatbot Memory
// ============================================================================

async function example6_chatbotMemory() {
  console.log('\n=== Example 6: Real-World Chatbot Memory ===\n');

  const mockEmbeddingProvider: EmbeddingProvider = {
    dimensions: 256,
    async embed(text: string): Promise<number[]> {
      const vector = new Array(256).fill(0);
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        vector[i % 256] += charCode / 1000;
      }
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map((val) => val / norm);
    },
  };

  const memory = createInMemoryVectorMemory(256, {
    embeddingProvider: mockEmbeddingProvider,
    defaultThreshold: 0.6,
    maxEntries: 1000,
  });

  await memory.initialize();

  // Simulate storing conversation history
  const conversations = [
    { user: 'What is machine learning?', assistant: 'Machine learning is...', topic: 'AI' },
    { user: 'How do neural networks work?', assistant: 'Neural networks...', topic: 'AI' },
    { user: 'What is your favorite color?', assistant: 'I like blue', topic: 'personal' },
    { user: 'Can you help with Python?', assistant: 'Yes, I can help...', topic: 'coding' },
    { user: 'Explain transformers', assistant: 'Transformers are...', topic: 'AI' },
  ];

  for (const conv of conversations) {
    const combined = `User: ${conv.user}\nAssistant: ${conv.assistant}`;
    await memory.store(combined, {
      topic: conv.topic,
      userMessage: conv.user,
      assistantMessage: conv.assistant,
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`Stored ${await memory.count()} conversation turns\n`);

  // User asks a new question - retrieve relevant context
  const newQuestion = 'Tell me about deep learning';
  console.log(`New question: "${newQuestion}"\n`);
  console.log('Retrieving relevant context from memory...\n');

  const relevantMemories = await memory.search(newQuestion, 3, 0.5);

  console.log('Relevant past conversations:');
  relevantMemories.forEach((result, i) => {
    console.log(`\n${i + 1}. Similarity: ${result.score.toFixed(3)}`);
    console.log(`   Topic: ${result.entry.metadata.topic}`);
    console.log(`   User: ${result.entry.metadata.userMessage}`);
    console.log(`   Assistant: ${result.entry.metadata.assistantMessage.substring(0, 50)}...`);
  });

  console.log('\n\nMemory Stats:');
  console.log(memory.getStats());

  await memory.close();
}

// ============================================================================
// Run All Examples
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   RANA Vector Memory Examples              ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await example1_basicInMemory();
    await example2_fileBased();
    await example3_precomputedEmbeddings();
    await example4_similarityMetrics();
    await example5_customBackend();
    await example6_chatbotMemory();

    console.log('\n\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
