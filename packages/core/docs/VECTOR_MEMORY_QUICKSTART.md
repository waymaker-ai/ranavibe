# Vector Memory Quick Start

Get started with RANA Vector Memory in 5 minutes.

## Installation

Vector Memory is included in `@rana/core`:

```bash
npm install @rana/core
```

## Basic Usage (3 Steps)

### 1. Create Memory Instance

```typescript
import { createInMemoryVectorMemory, EmbeddingProvider } from '@rana/core';

// Define your embedding provider (or use OpenAI, Anthropic, etc.)
const embeddingProvider: EmbeddingProvider = {
  dimensions: 384,
  async embed(text: string): Promise<number[]> {
    // Call your embedding service here
    return await yourEmbeddingService(text);
  },
};

const memory = createInMemoryVectorMemory(384, {
  embeddingProvider,
  defaultThreshold: 0.7,
});

await memory.initialize();
```

### 2. Store Information

```typescript
// Store with auto-embedding
await memory.store('The cat sat on the mat', { category: 'animals' });
await memory.store('Machine learning is fascinating', { category: 'tech' });
await memory.store('The kitten played with yarn', { category: 'animals' });
```

### 3. Search by Similarity

```typescript
// Search for similar content
const results = await memory.search('playful cat', 2);

results.forEach(result => {
  console.log(`${result.entry.content} (${result.score.toFixed(3)})`);
});
```

That's it! You now have semantic search working.

## Common Use Cases

### Chatbot Memory

```typescript
class ChatbotWithMemory {
  private memory;

  constructor(embeddingProvider) {
    this.memory = createFileVectorMemory('./chat-memory.json', 384, {
      embeddingProvider,
      defaultThreshold: 0.6,
    });
  }

  async initialize() {
    await this.memory.initialize();
  }

  async remember(userMessage: string, botResponse: string) {
    const context = `User: ${userMessage}\nBot: ${botResponse}`;
    await this.memory.store(context, {
      userMessage,
      botResponse,
      timestamp: new Date().toISOString(),
    });
  }

  async recall(query: string, k = 3) {
    return await this.memory.search(query, k);
  }
}

// Usage
const chatbot = new ChatbotWithMemory(embeddingProvider);
await chatbot.initialize();

await chatbot.remember(
  'What is AI?',
  'AI is artificial intelligence...'
);

const relevant = await chatbot.recall('tell me about AI');
```

### Document Search

```typescript
// Store documents
const documents = [
  { title: 'AI Basics', content: 'Introduction to AI...' },
  { title: 'ML Guide', content: 'Machine learning fundamentals...' },
  { title: 'Deep Learning', content: 'Neural networks and...' },
];

for (const doc of documents) {
  await memory.store(doc.content, { title: doc.title });
}

// Search
const results = await memory.search('neural networks', 5);
```

### Pre-computed Embeddings

```typescript
// If you already have embeddings
const memory = createInMemoryVectorMemory(1536); // OpenAI dimensions
await memory.initialize();

// Store with pre-computed embedding
const embedding = [0.1, 0.2, 0.3, ...]; // Your embedding vector
await memory.store('Document text', { id: 'doc-1' }, embedding);

// Search with vector
const queryEmbedding = [0.15, 0.22, 0.31, ...];
const results = await memory.search(queryEmbedding, 5);
```

## Integration with OpenAI

```typescript
import OpenAI from 'openai';
import { createInMemoryVectorMemory, EmbeddingProvider } from '@rana/core';

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

## File Persistence

```typescript
import { createFileVectorMemory } from '@rana/core';

// Auto-saves to file
const memory = createFileVectorMemory('./memories.json', 384, {
  embeddingProvider,
});

await memory.initialize(); // Loads existing data if file exists

// All operations automatically persist
await memory.store('Important information', { priority: 'high' });

// Manual flush (optional)
await memory.close(); // Ensures all data is saved
```

## Similarity Metrics

```typescript
// Cosine similarity (default, best for text)
const cosineResults = await memory.search(query, 5, 0.7, 'cosine');

// Euclidean distance (good for spatial data)
const euclideanResults = await memory.search(query, 5, 0.8, 'euclidean');

// Dot product (fastest)
const dotResults = await memory.search(query, 5, 0.5, 'dot');
```

## Error Handling

```typescript
try {
  await memory.store(content, metadata);
} catch (error) {
  if (error.message.includes('Maximum entries')) {
    // Handle limit exceeded
    await memory.clear(); // or implement LRU eviction
  } else if (error.message.includes('dimensions mismatch')) {
    // Check embedding dimensions
    console.error('Embedding size mismatch');
  } else {
    throw error;
  }
}
```

## Best Practices

1. **Choose the right backend**:
   - Development: `InMemoryVectorBackend`
   - Small apps: `FileVectorBackend`
   - Production: External vector DB (Pinecone, Supabase)

2. **Set appropriate thresholds**:
   - Strict: 0.85-1.0
   - Moderate: 0.65-0.85
   - Loose: 0.4-0.65

3. **Normalize metadata**:
   ```typescript
   await memory.store(content, {
     source: 'user-input',
     timestamp: new Date().toISOString(),
     category: 'important',
     tags: ['ai', 'ml'],
   });
   ```

4. **Clean up resources**:
   ```typescript
   // Always close file-based backends
   process.on('SIGINT', async () => {
     await memory.close();
     process.exit(0);
   });
   ```

## Next Steps

- Read the [full documentation](./vector-memory.md)
- Check out [complete examples](../examples/vector-memory-example.ts)
- See [hybrid memory system](../examples/hybrid-memory-example.ts)
- Integrate with your [embedding provider](./vector-memory.md#integration-examples)

## Need Help?

- Full API reference: [vector-memory.md](./vector-memory.md)
- Implementation details: [VECTOR_MEMORY_IMPLEMENTATION.md](../VECTOR_MEMORY_IMPLEMENTATION.md)
- Examples: [examples/](../examples/)
