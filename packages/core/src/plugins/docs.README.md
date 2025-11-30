# DocsPlugin - Documentation Chatbot

AI-powered documentation Q&A with semantic search and source citations.

## Features

- **Multi-source ingestion**: Markdown, HTML, PDF, GitHub repos, Notion pages
- **Semantic search**: Vector similarity search over documentation chunks
- **Source citations**: All answers include relevant source citations with similarity scores
- **Context-aware**: Maintains conversation history for follow-up questions
- **Follow-up questions**: Automatically generates relevant follow-up questions
- **Chunking strategies**: Smart text chunking with paragraph boundaries and overlap
- **Persistence**: Optional file-based persistence for faster subsequent loads

## Installation

```bash
npm install @rana/core
```

## Quick Start

```typescript
import { createRana, DocsPlugin } from '@rana/core';

// Create RANA client
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Create docs plugin
const docs = new DocsPlugin({
  rana,
  sources: [
    { type: 'markdown', location: './docs' },
    { type: 'github', location: 'owner/repo' },
  ],
  chunkSize: 1000,
  maxSources: 3,
});

// Initialize and ingest
await docs.initialize();

// Ask questions
const answer = await docs.ask('How do I install this?');
console.log(answer.answer);
console.log('Sources:', answer.sources);
```

## Configuration

```typescript
interface DocsPluginConfig {
  // Required: RANA client instance
  rana: RanaClient;

  // Documentation sources
  sources?: DocumentSource[];

  // Chunking configuration
  chunkSize?: number;          // Default: 1000 characters
  chunkOverlap?: number;       // Default: 200 characters

  // AI models
  embeddingModel?: string;     // Default: 'text-embedding-3-small'
  chatModel?: string;          // Default: 'gpt-4o-mini'

  // Search configuration
  maxSources?: number;         // Default: 3 citations per response
  similarityThreshold?: number; // Default: 0.7 (0-1)

  // Features
  enableFollowUps?: boolean;   // Default: true
  enableContext?: boolean;     // Default: true
  maxHistory?: number;         // Default: 5 conversation turns

  // Persistence
  persistencePath?: string;    // Optional file path for index

  // Advanced
  vectorConfig?: Partial<VectorMemoryConfig>;
  embeddingProvider?: EmbeddingProvider;
}
```

## Source Types

### Markdown Files

```typescript
// Single file
{ type: 'markdown', location: './README.md' }

// Directory (all .md files)
{ type: 'markdown', location: './docs' }
```

### GitHub Repository

```typescript
// Fetches README.md from main/master branch
{ type: 'github', location: 'owner/repo' }
```

### HTML Pages

```typescript
// Fetches and extracts text content
{ type: 'html', location: 'https://example.com/docs' }
```

### Text Files

```typescript
{ type: 'text', location: './notes.txt' }
```

### PDF (Coming Soon)

```typescript
{ type: 'pdf', location: './manual.pdf' }
```

### Notion (Coming Soon)

```typescript
{ type: 'notion', location: 'page-id' }
```

## API Reference

### `initialize()`

Initialize the plugin and ingest configured sources.

```typescript
await docs.initialize();

// With progress tracking
await docs.initialize((progress) => {
  console.log(`${progress.processed}/${progress.total} sources`);
  console.log(`${progress.totalChunks} chunks created`);
});
```

### `ask(question, options?)`

Ask a question about the documentation.

```typescript
const answer = await docs.ask('How do I get started?');

// With options
const answer = await docs.ask('What is the pricing?', {
  maxSources: 5,
  includeFollowUps: true,
  useContext: true,
});

// Response structure
{
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  followUpQuestions?: string[];
}
```

### `search(query, limit?)`

Search documentation without generating an answer.

```typescript
const results = await docs.search('installation', 10);

// Returns VectorSearchResult[]
results.forEach(result => {
  console.log(result.entry.content);
  console.log('Score:', result.score);
});
```

### `ingest(source)`

Ingest a single documentation source.

```typescript
const chunks = await docs.ingest({
  type: 'markdown',
  location: './new-docs.md',
});

console.log(`Indexed ${chunks} chunks`);
```

### `ingestAll(sources, onProgress?)`

Ingest multiple sources.

```typescript
await docs.ingestAll([
  { type: 'markdown', location: './docs' },
  { type: 'github', location: 'owner/repo' },
]);
```

### `refresh()`

Re-index all documentation (clears and re-ingests).

```typescript
await docs.refresh();
```

### `clearHistory()`

Clear conversation history.

```typescript
docs.clearHistory();
```

### `getStats()`

Get plugin statistics.

```typescript
const stats = await docs.getStats();
console.log(stats.totalChunks);
console.log(stats.totalSources);
console.log(stats.conversationTurns);
```

### `close()`

Close and cleanup resources.

```typescript
await docs.close();
```

## Examples

### Basic Q&A

```typescript
const docs = new DocsPlugin({
  rana,
  sources: [{ type: 'markdown', location: './docs' }],
});

await docs.initialize();

const answer = await docs.ask('How do I install this?');
console.log(answer.answer);

// Show sources
answer.sources.forEach((source, i) => {
  console.log(`[${i + 1}] ${source.source.location}`);
  console.log(`    Score: ${source.score.toFixed(2)}`);
  console.log(`    Snippet: ${source.snippet}`);
});
```

### With File Persistence

```typescript
const docs = new DocsPlugin({
  rana,
  sources: [{ type: 'markdown', location: './docs' }],
  persistencePath: './docs-index.json',
});

// First run: ingests and saves to file
await docs.initialize();

// Subsequent runs: loads from file (much faster!)
await docs.initialize();
```

### Custom Embedding Provider

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

const embeddingProvider = {
  dimensions: 1536,
  async embed(text: string) {
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-3-small',
    });
    return response.data[0].embedding;
  },
};

const docs = new DocsPlugin({
  rana,
  embeddingProvider,
  sources: [{ type: 'markdown', location: './docs' }],
});
```

### Conversational Context

```typescript
await docs.ask('What is RANA?');
// Uses context from previous question
const answer = await docs.ask('How much does it cost?', {
  useContext: true,
});
```

### Progress Tracking

```typescript
await docs.initialize((progress) => {
  const percent = (progress.processed / progress.total) * 100;
  console.log(`Progress: ${percent.toFixed(0)}%`);
  console.log(`Current: ${progress.current.location}`);
  console.log(`Total chunks: ${progress.totalChunks}`);
});
```

### Advanced Search

```typescript
// Search with custom limit
const results = await docs.search('configuration', 10);

// Filter results
const highConfidence = results.filter(r => r.score > 0.8);

// Extract specific metadata
results.forEach(result => {
  const metadata = result.entry.metadata;
  console.log(`Title: ${metadata.title}`);
  console.log(`Section: ${metadata.section}`);
  console.log(`Page: ${metadata.page}`);
});
```

## Best Practices

### Chunking

- **Default chunk size (1000)** works well for most documentation
- **Increase chunk size** for dense technical content
- **Decrease chunk size** for more precise citations
- **Chunk overlap (200)** ensures context isn't lost at boundaries

### Source Selection

- **Combine multiple sources** for comprehensive coverage
- **Use GitHub integration** for open-source projects
- **Markdown is preferred** over HTML (better structure)
- **Organize docs hierarchically** for better section detection

### Performance

- **Use persistence** to avoid re-indexing on every run
- **Limit sources to relevant docs** (don't index everything)
- **Batch ingestion** is faster than individual ingests
- **Custom embedding provider** for production workloads

### Search Quality

- **Increase maxSources** for more comprehensive answers
- **Adjust similarityThreshold** based on your docs:
  - Higher (0.8-0.9): More precise, fewer results
  - Lower (0.5-0.7): More comprehensive, more results
- **Enable context** for follow-up questions
- **Review citations** to validate answer accuracy

## Architecture

```
DocsPlugin
├── Document Ingestion
│   ├── Fetch content (file, URL, API)
│   ├── Chunk text (smart splitting)
│   └── Extract metadata (title, section, etc.)
├── Vector Indexing
│   ├── Generate embeddings
│   ├── Store in VectorMemory
│   └── Persist to file (optional)
├── Semantic Search
│   ├── Query embedding
│   ├── Similarity search
│   └── Result ranking
└── Answer Generation
    ├── Build context from sources
    ├── Generate answer with LLM
    ├── Extract citations
    └── Generate follow-ups (optional)
```

## Limitations

- **PDF support**: Requires external library (pdf-parse)
- **Notion support**: Requires official Notion SDK
- **Embedding provider**: Default uses simple hash-based embeddings (for demo only)
- **Large documents**: Memory usage scales with document size
- **Real-time updates**: Requires manual refresh to index new content

## Roadmap

- [ ] PDF document support
- [ ] Notion API integration
- [ ] OpenAI embeddings integration
- [ ] Confluence support
- [ ] Auto-refresh on file changes
- [ ] Multi-language support
- [ ] Custom chunking strategies
- [ ] Answer quality scoring
- [ ] Hybrid search (vector + keyword)

## License

MIT
