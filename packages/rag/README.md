# @rana/rag

Advanced RAG (Retrieval Augmented Generation) for the RANA Framework.

## Features

- **Intelligent Chunking** - Semantic, markdown, code-aware, and recursive chunking
- **Hybrid Retrieval** - Vector + keyword search with fusion strategies
- **Re-ranking** - Cross-encoder, LLM, and diversity-based re-ranking
- **Synthesis** - Refine, tree-summarize, and compact synthesis methods
- **Citations** - Automatic citation tracking and source attribution
- **React Hooks** - Easy integration with React applications
- **Pipeline Presets** - Pre-configured pipelines for common use cases

## Installation

```bash
npm install @rana/rag
```

## Quick Start

```typescript
import { createRAGPipeline, RAGPresets } from '@rana/rag';

// Use a preset for quick setup
const pipeline = RAGPresets.balanced();

// Index your documents
await pipeline.index([
  { id: 'doc1', content: 'RANA is an AI development framework...' },
  { id: 'doc2', content: 'RAG enables knowledge-grounded AI...' },
]);

// Query the pipeline
const result = await pipeline.query({
  query: 'What is RANA?',
});

console.log(result.answer);
// "RANA is an AI development framework that..."

console.log(result.citations);
// [{ text: '...', source: 'doc1', score: 0.95 }]
```

## Pipeline Configuration

### Custom Pipeline

```typescript
import { createRAGPipeline } from '@rana/rag';

const pipeline = createRAGPipeline({
  // Chunking strategy
  chunker: {
    type: 'semantic',  // 'semantic' | 'markdown' | 'code' | 'recursive'
    chunkSize: 512,
    overlap: 50,
  },

  // Retrieval strategy
  retriever: {
    type: 'hybrid',  // 'vector' | 'keyword' | 'hybrid'
    topK: 20,
    options: {
      vector: { topK: 20, similarityThreshold: 0.5 },
      keyword: { topK: 10, algorithm: 'bm25' },
      fusion: 'reciprocal-rank-fusion',
    },
  },

  // Re-ranking (optional)
  reranker: {
    type: 'cross-encoder',  // 'cross-encoder' | 'llm' | 'diversity'
    topK: 5,
  },

  // Query transformation (optional)
  queryTransformer: {
    multiQuery: true,
    hypotheticalAnswer: true,  // HyDE
    decompose: true,
  },

  // Synthesis strategy
  synthesizer: {
    type: 'refine',  // 'refine' | 'tree-summarize' | 'compact'
    citations: true,
    streaming: true,
    model: 'claude-sonnet-4',
  },

  // Pipeline options
  config: {
    caching: true,
    metrics: true,
    logging: 'verbose',
  },
});
```

### Presets

```typescript
import { RAGPresets } from '@rana/rag';

// Fast: Optimized for speed
const fast = RAGPresets.fast();

// Accurate: Optimized for quality
const accurate = RAGPresets.accurate();

// Balanced: Good speed/quality tradeoff
const balanced = RAGPresets.balanced();

// Code: For code search and Q&A
const code = RAGPresets.code('typescript');

// Documentation: For documentation search
const docs = RAGPresets.documentation();

// Research: For research papers
const research = RAGPresets.research();

// Chat: For conversational RAG
const chat = RAGPresets.chat();
```

## Chunking Strategies

### Semantic Chunking

Splits text based on semantic boundaries using embedding similarity:

```typescript
import { SemanticChunker } from '@rana/rag';

const chunker = new SemanticChunker();
const chunks = await chunker.chunk(text, {
  chunkSize: 512,
  overlap: 50,
  similarityThreshold: 0.5,
});
```

### Markdown Chunking

Preserves markdown structure (headers, code blocks, lists):

```typescript
import { MarkdownChunker } from '@rana/rag';

const chunker = new MarkdownChunker();
const chunks = await chunker.chunk(markdown, {
  chunkSize: 512,
  preserveHeaders: true,
  preserveCodeBlocks: true,
});
```

### Code Chunking

Preserves function and class boundaries:

```typescript
import { CodeChunker } from '@rana/rag';

const chunker = new CodeChunker();
const chunks = await chunker.chunk(code, {
  language: 'typescript',
  chunkSize: 1024,
  preserveFunctions: true,
  preserveClasses: true,
});
```

## Retrieval Strategies

### Hybrid Retrieval

Combines vector and keyword search:

```typescript
import { HybridRetriever } from '@rana/rag';

const retriever = new HybridRetriever();
await retriever.index(chunks);

const results = await retriever.retrieve(query, {
  vector: { topK: 20 },
  keyword: { topK: 10, algorithm: 'bm25' },
  fusion: 'reciprocal-rank-fusion',  // or 'weighted', 'max'
});
```

### Fusion Strategies

- **Reciprocal Rank Fusion (RRF)**: Combines rankings, good for diverse sources
- **Weighted**: Configurable weights for vector vs keyword
- **Max**: Takes highest score from either method

## Re-ranking

### Cross-Encoder Re-ranking

More accurate than bi-encoder but slower:

```typescript
import { CrossEncoderReranker } from '@rana/rag';

const reranker = new CrossEncoderReranker();
const reranked = await reranker.rerank(query, results, {
  topK: 5,
  normalize: true,
});
```

### Diversity Re-ranking (MMR)

Maximize relevance while maintaining diversity:

```typescript
import { DiversityReranker } from '@rana/rag';

const reranker = new DiversityReranker();
const reranked = await reranker.rerank(query, results, {
  topK: 5,
  lambda: 0.5,  // Balance relevance vs diversity
});
```

## Synthesis Methods

### Refine Synthesis

Iteratively refines answer with each chunk:

```typescript
// Good for comprehensive answers
synthesizer: {
  type: 'refine',
  citations: true,
}
```

### Tree Summarization

Hierarchically summarizes in a tree structure:

```typescript
// Good for many chunks
synthesizer: {
  type: 'tree-summarize',
  citations: true,
}
```

### Compact Synthesis

Single LLM call with all context:

```typescript
// Fastest, good for small contexts
synthesizer: {
  type: 'compact',
  citations: true,
}
```

## React Integration

### Setup

```tsx
import { RAGProvider, RAGPresets } from '@rana/rag';

const pipeline = RAGPresets.balanced();

function App() {
  return (
    <RAGProvider pipeline={pipeline}>
      <SearchComponent />
    </RAGProvider>
  );
}
```

### useRAG Hook

```tsx
import { useRAG } from '@rana/rag';

function SearchComponent() {
  const { query, answer, citations, isLoading, error } = useRAG();

  const handleSearch = async (q: string) => {
    await query(q);
  };

  return (
    <div>
      <input onKeyDown={e => e.key === 'Enter' && handleSearch(e.target.value)} />
      {isLoading && <Spinner />}
      {error && <Error message={error.message} />}
      {answer && (
        <>
          <Answer content={answer} />
          <Citations items={citations} />
        </>
      )}
    </div>
  );
}
```

### useRAGStream Hook

```tsx
import { useRAGStream } from '@rana/rag';

function StreamingSearch() {
  const { queryStream, answer, citations, isStreaming, stop } = useRAGStream();

  return (
    <div>
      <button onClick={() => queryStream('Explain RAG')}>
        Search
      </button>
      {isStreaming && <button onClick={stop}>Stop</button>}
      <div>{answer}</div>
      <Sources items={citations} />
    </div>
  );
}
```

### useRAGIndex Hook

```tsx
import { useRAGIndex } from '@rana/rag';

function DocumentManager() {
  const { index, deleteDocuments, isIndexing, progress, documentCount } = useRAGIndex();

  const handleUpload = async (files: File[]) => {
    const documents = await Promise.all(
      files.map(async f => ({
        id: f.name,
        content: await f.text(),
      }))
    );
    await index(documents);
  };

  return (
    <div>
      <input type="file" multiple onChange={e => handleUpload(e.target.files)} />
      {isIndexing && <Progress value={progress} />}
      <p>Documents indexed: {documentCount}</p>
    </div>
  );
}
```

## API Reference

### RAGPipeline

| Method | Description |
|--------|-------------|
| `query(options)` | Execute RAG query |
| `queryStream(options)` | Streaming RAG query |
| `index(documents)` | Index documents |
| `delete(ids)` | Delete documents |

### RAGResult

| Property | Type | Description |
|----------|------|-------------|
| `answer` | string | Generated answer |
| `citations` | Citation[] | Source citations |
| `sources` | Source[] | Unique sources |
| `metrics` | RAGMetrics | Performance metrics |

### RAGMetrics

| Property | Description |
|----------|-------------|
| `latency` | Total query time (ms) |
| `cost` | Estimated cost ($) |
| `chunks.total` | Total indexed chunks |
| `chunks.retrieved` | Chunks retrieved |
| `chunks.used` | Chunks used in answer |
| `tokens.input` | Input tokens |
| `tokens.output` | Output tokens |

## Best Practices

1. **Choose the right chunker**: Use semantic for general text, markdown for docs, code for source files
2. **Tune topK**: Start with 10-20 for retrieval, 3-5 after reranking
3. **Use hybrid retrieval**: Combines semantic understanding with keyword matching
4. **Enable caching**: Reduces cost and latency for repeated queries
5. **Monitor metrics**: Track latency, cost, and citation quality
6. **Use streaming**: Improves perceived performance for users

## License

MIT
