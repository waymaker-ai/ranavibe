# Vector Memory System

Long-term vector memory with similarity search for RANA agents and applications.

## Overview

The Vector Memory system provides semantic search capabilities for storing and retrieving information based on meaning rather than exact matches. It uses vector embeddings to represent content and supports multiple similarity metrics for efficient retrieval.

## Features

- **Multiple Storage Backends**: In-memory, file-based, and custom adapter support
- **Flexible Similarity Metrics**: Cosine similarity, Euclidean distance, and dot product
- **Auto-embedding Support**: Integrate with any embedding provider or use pre-computed vectors
- **Efficient Search**: Configurable thresholds and top-k retrieval
- **Type-Safe**: Full TypeScript support with comprehensive types
- **Production Ready**: Built-in statistics, error handling, and persistence

## Quick Start

### Basic Usage with Auto-Embedding

```typescript
import { createInMemoryVectorMemory, EmbeddingProvider } from '@rana/core';

// Create a simple embedding provider (mock for demo)
const embeddingProvider: EmbeddingProvider = {
  dimensions: 384,
  async embed(text: string): Promise<number[]> {
    // In production, use OpenAI, Anthropic, or another embedding service
    // This is just a placeholder
    return new Array(384).fill(0).map(() => Math.random());
  },
};

// Create vector memory
const memory = createInMemoryVectorMemory(384, {
  embeddingProvider,
  defaultThreshold: 0.7,
});

await memory.initialize();

// Store memories
await memory.store('The cat sat on the mat', { category: 'animals' });
await memory.store('Machine learning is fascinating', { category: 'tech' });
await memory.store('The kitten chased a ball', { category: 'animals' });

// Search for similar content
const results = await memory.search('cat playing', 2);

results.forEach(result => {
  console.log(`${result.entry.content} (${result.score.toFixed(3)})`);
});
```

### File-Based Persistence

```typescript
import { createFileVectorMemory } from '@rana/core';

const memory = createFileVectorMemory('./memories.json', 384, {
  embeddingProvider,
  metric: 'cosine',
});

await memory.initialize(); // Loads from file if exists

await memory.store('User prefers dark mode', { type: 'preference' });
await memory.store('User speaks English', { type: 'profile' });

// Automatically persisted to file
await memory.close();
```

### Pre-computed Embeddings

```typescript
import { createInMemoryVectorMemory } from '@rana/core';

const memory = createInMemoryVectorMemory(768); // OpenAI ada-002 dimensions
await memory.initialize();

// Store with your own embeddings
const embedding = await yourEmbeddingService.embed('Some text');
await memory.store('Some text', { source: 'document-1' }, embedding);

// Search with vector
const queryEmbedding = await yourEmbeddingService.embed('Search query');
const results = await memory.search(queryEmbedding, 5);
```

## Architecture

### Components

```
VectorMemory (Main Class)
    ├── VectorMemoryBackend (Storage Interface)
    │   ├── InMemoryVectorBackend
    │   ├── FileVectorBackend
    │   └── Custom Backends (Pinecone, Supabase, etc.)
    │
    └── EmbeddingProvider (Optional)
        └── Your embedding service integration
```

### Storage Backends

#### In-Memory Backend

Best for development, testing, and small datasets.

```typescript
import { InMemoryVectorBackend, createVectorMemory } from '@rana/core';

const memory = createVectorMemory({
  dimensions: 384,
  backend: new InMemoryVectorBackend(),
});
```

**Pros:**
- Fast
- No dependencies
- Simple setup

**Cons:**
- Data lost on restart
- Limited by RAM

#### File-Based Backend

Good for persistent storage of small to medium datasets.

```typescript
import { FileVectorBackend, createVectorMemory } from '@rana/core';

const memory = createVectorMemory({
  dimensions: 384,
  backend: new FileVectorBackend('./data/vectors.json', true),
});
```

**Pros:**
- Persistent storage
- No external dependencies
- Auto-save with debouncing

**Cons:**
- Slower than in-memory
- JSON file size limits
- Linear search (no indexing)

#### Custom Backend Adapter

Integrate with external vector databases:

```typescript
import { VectorMemoryBackend } from '@rana/core';

class PineconeBackend implements VectorMemoryBackend {
  async initialize() { /* ... */ }
  async store(entry) { /* ... */ }
  async search(query, k, threshold, metric) { /* ... */ }
  async delete(id) { /* ... */ }
  async clear() { /* ... */ }
  async count() { /* ... */ }
  async close() { /* ... */ }
}

const memory = createVectorMemory({
  dimensions: 1536,
  backend: new PineconeBackend(apiKey, index),
});
```

## Similarity Metrics

### Cosine Similarity (Default)

Measures the cosine of the angle between vectors. Best for normalized vectors.

```typescript
const results = await memory.search(query, 5, 0.7, 'cosine');
```

**Range:** -1 to 1 (1 = identical, 0 = orthogonal, -1 = opposite)

**Use Cases:**
- Text similarity
- Semantic search
- Document comparison

### Euclidean Distance

Measures straight-line distance between vectors.

```typescript
const results = await memory.search(query, 5, 0.8, 'euclidean');
```

**Range:** 0 to ∞ (converted to 0-1 similarity score)

**Use Cases:**
- Spatial data
- Image embeddings
- When magnitude matters

### Dot Product

Raw dot product between vectors.

```typescript
const results = await memory.search(query, 5, 0.5, 'dot');
```

**Range:** -∞ to ∞

**Use Cases:**
- Pre-normalized vectors
- Maximum efficiency
- Custom scoring needs

## API Reference

### VectorMemory Class

#### Constructor

```typescript
new VectorMemory(config: VectorMemoryConfig)
```

#### Methods

##### `initialize(): Promise<void>`
Initialize the vector memory and underlying backend.

```typescript
await memory.initialize();
```

##### `store(content, metadata?, embedding?): Promise<string>`
Store content with optional metadata and embedding.

```typescript
const id = await memory.store(
  'Content to store',
  { category: 'important' },
  embeddingVector // optional
);
```

**Returns:** Entry ID

##### `search(query, k?, threshold?, metric?): Promise<VectorSearchResult[]>`
Search for similar content.

```typescript
// Text search (requires embedding provider)
const results = await memory.search('search query', 5, 0.7);

// Vector search
const results = await memory.search(queryVector, 5, 0.7, 'cosine');
```

**Parameters:**
- `query`: String or number[] - Text query or embedding vector
- `k`: number - Number of results to return (default: 5)
- `threshold`: number - Minimum similarity score (default: config.defaultThreshold)
- `metric`: SimilarityMetric - Similarity metric to use (default: config.metric)

**Returns:** Array of search results with scores

##### `delete(id): Promise<boolean>`
Delete an entry by ID.

```typescript
const deleted = await memory.delete('entry-id');
```

##### `clear(): Promise<void>`
Clear all entries.

```typescript
await memory.clear();
```

##### `count(): Promise<number>`
Get total entry count.

```typescript
const total = await memory.count();
```

##### `getStats(): VectorMemoryStats`
Get statistics.

```typescript
const stats = memory.getStats();
console.log(stats.totalSearches);
console.log(stats.averageSearchTime);
```

##### `close(): Promise<void>`
Close and cleanup (important for file-based backends).

```typescript
await memory.close();
```

### Factory Functions

#### `createInMemoryVectorMemory(dimensions, config?)`

```typescript
const memory = createInMemoryVectorMemory(384, {
  embeddingProvider,
  defaultThreshold: 0.7,
});
```

#### `createFileVectorMemory(filePath, dimensions, config?)`

```typescript
const memory = createFileVectorMemory('./data.json', 384, {
  embeddingProvider,
  metric: 'cosine',
});
```

#### `createVectorMemory(config)`

```typescript
const memory = createVectorMemory({
  dimensions: 384,
  backend: new CustomBackend(),
  embeddingProvider,
});
```

### Utility Functions

#### `cosineSimilarity(a, b): number`
Calculate cosine similarity between vectors.

#### `euclideanDistance(a, b): number`
Calculate Euclidean distance between vectors.

#### `dotProduct(a, b): number`
Calculate dot product between vectors.

#### `normalize(vector): number[]`
Normalize a vector to unit length.

#### `calculateSimilarity(a, b, metric): number`
Calculate similarity using specified metric.

## Integration Examples

### OpenAI Embeddings

```typescript
import OpenAI from 'openai';
import { createVectorMemory, EmbeddingProvider } from '@rana/core';

const openai = new OpenAI();

const embeddingProvider: EmbeddingProvider = {
  dimensions: 1536, // text-embedding-3-small
  async embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  },
};

const memory = createInMemoryVectorMemory(1536, { embeddingProvider });
```

### Anthropic with RANA Client

```typescript
import { createRana, createVectorMemory } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

// Use RANA to generate embeddings (conceptual - requires custom implementation)
const embeddingProvider = {
  dimensions: 384,
  async embed(text: string): Promise<number[]> {
    // Implement using your preferred embedding service
    return await yourEmbeddingService(text);
  },
};
```

### Chatbot with Conversation Memory

```typescript
import { createFileVectorMemory } from '@rana/core';

class ChatbotMemory {
  private vectorMemory;

  constructor(embeddingProvider) {
    this.vectorMemory = createFileVectorMemory(
      './chat-memory.json',
      384,
      { embeddingProvider, defaultThreshold: 0.6 }
    );
  }

  async initialize() {
    await this.vectorMemory.initialize();
  }

  async rememberConversation(user: string, assistant: string, topic: string) {
    const combined = `User: ${user}\nAssistant: ${assistant}`;
    await this.vectorMemory.store(combined, {
      topic,
      userMessage: user,
      assistantMessage: assistant,
      timestamp: new Date().toISOString(),
    });
  }

  async recallSimilar(query: string, k = 3) {
    return await this.vectorMemory.search(query, k);
  }

  async close() {
    await this.vectorMemory.close();
  }
}

// Usage
const memory = new ChatbotMemory(embeddingProvider);
await memory.initialize();

await memory.rememberConversation(
  'What is machine learning?',
  'Machine learning is a subset of AI...',
  'AI'
);

const relevant = await memory.recallSimilar('Tell me about AI', 3);
```

## Best Practices

### 1. Choose the Right Backend

- **Development**: Use `InMemoryVectorBackend`
- **Small apps (<10k entries)**: Use `FileVectorBackend`
- **Production**: Use external vector DB (Pinecone, Supabase, etc.)

### 2. Set Appropriate Thresholds

```typescript
// Strict matching
const strict = await memory.search(query, 5, 0.9);

// Moderate matching (recommended)
const moderate = await memory.search(query, 5, 0.7);

// Loose matching
const loose = await memory.search(query, 5, 0.5);
```

### 3. Normalize Metadata

```typescript
await memory.store(content, {
  source: 'user-input',
  timestamp: new Date().toISOString(),
  category: 'important',
  tags: ['ai', 'ml'],
});
```

### 4. Batch Operations

```typescript
// Store multiple entries
const entries = [/* ... */];
const ids = await Promise.all(
  entries.map(e => memory.store(e.content, e.metadata))
);
```

### 5. Error Handling

```typescript
try {
  await memory.store(content, metadata);
} catch (error) {
  if (error.message.includes('Maximum entries')) {
    // Handle limit exceeded
    await memory.clear(); // or delete old entries
  }
}
```

### 6. Clean Up Resources

```typescript
// Always close file-based backends
process.on('SIGINT', async () => {
  await memory.close();
  process.exit(0);
});
```

## Performance Considerations

### Search Complexity

- **In-Memory & File backends**: O(n) linear search
- **External vector DBs**: O(log n) with indexing

### Memory Usage

```typescript
// Memory per entry ≈ dimensions × 8 bytes + metadata
// Example: 384 dimensions = ~3KB per entry
// 10,000 entries ≈ 30MB
```

### Optimization Tips

1. **Use appropriate dimensions**: Balance between quality and performance
2. **Batch embeddings**: Use `batchEmbed` if available
3. **Set max entries**: Prevent unbounded growth
4. **Use thresholds**: Filter irrelevant results early
5. **Consider indexing**: For large datasets, use specialized vector DBs

## Troubleshooting

### Embedding Dimension Mismatch

```typescript
// Error: Embedding dimensions mismatch
// Fix: Ensure all embeddings have the same dimensions
const memory = createInMemoryVectorMemory(384); // Must match embedding size
```

### No Embedding Provider

```typescript
// Error: Text search requires an embedding provider
// Fix: Provide embedding provider or use vector search
memory.setEmbeddingProvider(embeddingProvider);
```

### File Persistence Issues

```typescript
// Ensure directory exists
import { mkdir } from 'fs/promises';
await mkdir('./data', { recursive: true });

const memory = createFileVectorMemory('./data/vectors.json', 384);
```

## Future Enhancements

- [ ] Built-in HNSW indexing for faster search
- [ ] Automatic dimensionality reduction
- [ ] Built-in embedding providers (OpenAI, Anthropic, etc.)
- [ ] Quantization for reduced memory usage
- [ ] Streaming search for large result sets
- [ ] Multi-modal embeddings (text + images)

## See Also

- [Memory Manager (Context Compression)](./memory-manager.md)
- [RANA Core Documentation](../README.md)
- [Examples](../examples/vector-memory-example.ts)
