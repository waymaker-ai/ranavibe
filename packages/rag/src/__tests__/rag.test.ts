import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Chunk,
  ChunkMetadata,
  ChunkerConfig,
  RetrieverConfig,
  RerankerConfig,
  SynthesizerConfig,
  RAGPipelineConfig,
  QueryOptions,
  RAGResult,
  RAGMetrics,
  RetrievalResult,
  Citation,
  Document,
  SynthesisResult,
  EvaluationDataset,
  EvaluationQuestion,
  CacheConfig,
  CacheEntry,
  Chunker,
  Retriever,
  Reranker,
  Synthesizer,
  StreamChunk,
} from '../types';

// =============================================================================
// Type Validation Tests
// =============================================================================

describe('RAG Type Definitions', () => {
  it('should create valid Chunk objects', () => {
    const chunk: Chunk = {
      id: 'chunk-001',
      content: 'This is a test chunk about authentication flows.',
      metadata: {
        source: 'auth.ts',
        chunkIndex: 0,
        startChar: 0,
        endChar: 50,
        type: 'semantic',
      },
    };
    expect(chunk.id).toBe('chunk-001');
    expect(chunk.metadata.type).toBe('semantic');
    expect(chunk.embedding).toBeUndefined();
  });

  it('should create Chunk with embedding', () => {
    const chunk: Chunk = {
      id: 'chunk-embed',
      content: 'Embedded content',
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      metadata: { source: 'test.ts', chunkIndex: 0, startChar: 0, endChar: 20, type: 'recursive' },
    };
    expect(chunk.embedding).toHaveLength(5);
  });

  it('should create valid Document objects', () => {
    const doc: Document = {
      id: 'doc-001',
      content: 'Full document content about authentication and authorization.',
      metadata: { author: 'dev-team', category: 'security' },
    };
    expect(doc.id).toBe('doc-001');
    expect(doc.metadata?.author).toBe('dev-team');
  });

  it('should create valid Citation objects', () => {
    const citation: Citation = {
      text: 'Users must authenticate before accessing resources.',
      source: 'security-policy.md',
      score: 0.95,
      chunkId: 'chunk-042',
      metadata: { section: 'Authentication' },
    };
    expect(citation.score).toBeGreaterThan(0.9);
    expect(citation.chunkId).toBe('chunk-042');
  });

  it('should create valid RAGResult', () => {
    const result: RAGResult = {
      answer: 'Authentication is handled via JWT tokens.',
      citations: [
        { text: 'JWT tokens are used for auth', source: 'auth.md', score: 0.9, chunkId: 'c1' },
      ],
      sources: [{ id: 'src1', title: 'Auth Docs', type: 'document' }],
      metrics: {
        latency: 450,
        cost: 0.001,
        chunks: { total: 100, retrieved: 20, used: 5 },
        tokens: { input: 500, output: 150, total: 650 },
      },
    };
    expect(result.citations).toHaveLength(1);
    expect(result.metrics.latency).toBe(450);
    expect(result.metrics.chunks.used).toBeLessThan(result.metrics.chunks.retrieved);
  });

  it('should create RAGResult with quality metrics', () => {
    const result: RAGResult = {
      answer: 'test',
      citations: [],
      sources: [],
      metrics: {
        latency: 100,
        cost: 0.0005,
        chunks: { total: 50, retrieved: 10, used: 3 },
        tokens: { input: 200, output: 50, total: 250 },
        quality: { relevance: 0.85, coherence: 0.92, completeness: 0.78 },
      },
    };
    expect(result.metrics.quality?.relevance).toBe(0.85);
  });

  it('should create valid RAGMetrics', () => {
    const metrics: RAGMetrics = {
      latency: 230,
      cost: 0.002,
      chunks: { total: 500, retrieved: 50, used: 10 },
      tokens: { input: 2000, output: 300, total: 2300 },
    };
    expect(metrics.tokens.total).toBe(metrics.tokens.input + metrics.tokens.output);
  });
});

// =============================================================================
// Chunker Configuration Tests
// =============================================================================

describe('Chunker Configuration', () => {
  it('should define semantic chunker config', () => {
    const config: ChunkerConfig = {
      type: 'semantic',
      chunkSize: 512,
      overlap: 50,
      options: { similarityThreshold: 0.8, sentenceModel: 'all-MiniLM-L6-v2' },
    };
    expect(config.type).toBe('semantic');
    expect(config.chunkSize).toBe(512);
    expect(config.overlap).toBeLessThan(config.chunkSize);
  });

  it('should define markdown chunker config', () => {
    const config: ChunkerConfig = {
      type: 'markdown',
      chunkSize: 1024,
      overlap: 100,
      options: { preserveHeaders: true, preserveCodeBlocks: true, preserveLists: true },
    };
    expect(config.options?.preserveHeaders).toBe(true);
  });

  it('should define code chunker config', () => {
    const config: ChunkerConfig = {
      type: 'code',
      chunkSize: 2048,
      overlap: 200,
      options: { language: 'typescript', preserveFunctions: true, preserveClasses: true, includeComments: false },
    };
    expect(config.options?.language).toBe('typescript');
  });

  it('should define recursive chunker config', () => {
    const config: ChunkerConfig = {
      type: 'recursive',
      chunkSize: 500,
      overlap: 50,
    };
    expect(config.type).toBe('recursive');
  });

  it('should define adaptive chunker config', () => {
    const config: ChunkerConfig = {
      type: 'adaptive',
      chunkSize: 768,
      overlap: 75,
      options: { minChunkSize: 100, maxChunkSize: 2000 },
    };
    expect(config.options?.minChunkSize).toBeLessThan(config.options?.maxChunkSize!);
  });
});

// =============================================================================
// Retriever Configuration Tests
// =============================================================================

describe('Retriever Configuration', () => {
  it('should define vector retriever config', () => {
    const config: RetrieverConfig = {
      type: 'vector',
      topK: 10,
      options: { similarityThreshold: 0.7 },
    };
    expect(config.type).toBe('vector');
    expect(config.topK).toBe(10);
  });

  it('should define keyword retriever config', () => {
    const config: RetrieverConfig = {
      type: 'keyword',
      topK: 20,
    };
    expect(config.type).toBe('keyword');
  });

  it('should define hybrid retriever config', () => {
    const config: RetrieverConfig = {
      type: 'hybrid',
      topK: 15,
    };
    expect(config.type).toBe('hybrid');
  });
});

// =============================================================================
// Reranker Configuration Tests
// =============================================================================

describe('Reranker Configuration', () => {
  it('should define cross-encoder reranker', () => {
    const config: RerankerConfig = {
      type: 'cross-encoder',
      topK: 5,
      options: { model: 'cross-encoder/ms-marco-MiniLM-L-6-v2', normalize: true },
    };
    expect(config.type).toBe('cross-encoder');
    expect(config.options?.normalize).toBe(true);
  });

  it('should define LLM reranker', () => {
    const config: RerankerConfig = {
      type: 'llm',
      topK: 3,
      options: { model: 'gpt-4o-mini', temperature: 0.1 },
    };
    expect(config.options?.temperature).toBe(0.1);
  });

  it('should define diversity reranker', () => {
    const config: RerankerConfig = {
      type: 'diversity',
      topK: 5,
      options: { lambda: 0.5, similarityMetric: 'cosine' },
    };
    expect(config.options?.lambda).toBe(0.5);
  });
});

// =============================================================================
// Pipeline Configuration Tests
// =============================================================================

describe('RAG Pipeline Configuration', () => {
  it('should compose a full pipeline config', () => {
    const config: RAGPipelineConfig = {
      chunker: { type: 'semantic', chunkSize: 512, overlap: 50 },
      retriever: { type: 'hybrid', topK: 20 },
      reranker: { type: 'cross-encoder', topK: 5 },
      synthesizer: { type: 'refine', citations: true, streaming: false },
    };
    expect(config.chunker.type).toBe('semantic');
    expect(config.reranker?.type).toBe('cross-encoder');
    expect(config.synthesizer.citations).toBe(true);
  });

  it('should create pipeline without optional reranker', () => {
    const config: RAGPipelineConfig = {
      chunker: { type: 'recursive', chunkSize: 500, overlap: 50 },
      retriever: { type: 'vector', topK: 10 },
      synthesizer: { type: 'compact' },
    };
    expect(config.reranker).toBeUndefined();
  });

  it('should create pipeline with query transformer', () => {
    const config: RAGPipelineConfig = {
      chunker: { type: 'semantic', chunkSize: 512, overlap: 50 },
      retriever: { type: 'hybrid', topK: 20 },
      synthesizer: { type: 'tree-summarize', model: 'claude-3-5-sonnet' },
      queryTransformer: { multiQuery: true, hypotheticalAnswer: true },
    };
    expect(config.queryTransformer?.multiQuery).toBe(true);
    expect(config.queryTransformer?.hypotheticalAnswer).toBe(true);
  });

  it('should include pipeline-level options', () => {
    const config: RAGPipelineConfig = {
      chunker: { type: 'semantic', chunkSize: 512, overlap: 50 },
      retriever: { type: 'vector', topK: 10 },
      synthesizer: { type: 'refine' },
      config: { caching: true, cacheTTL: 3600, metrics: true, logging: 'verbose', timeout: 30000 },
    };
    expect(config.config?.caching).toBe(true);
    expect(config.config?.logging).toBe('verbose');
  });
});

// =============================================================================
// Interface Contract Tests (Mock Implementations)
// =============================================================================

describe('Chunker Interface', () => {
  it('should implement chunk method returning Chunk[]', async () => {
    const chunker: Chunker = {
      async chunk(text: string): Promise<Chunk[]> {
        const sentences = text.split('. ');
        return sentences.map((s, i) => ({
          id: `chunk-${i}`,
          content: s,
          metadata: { source: 'test', chunkIndex: i, startChar: 0, endChar: s.length, type: 'semantic' as const },
        }));
      },
    };
    const chunks = await chunker.chunk('First sentence. Second sentence. Third sentence.');
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content).toBe('First sentence');
    expect(chunks[2].metadata.chunkIndex).toBe(2);
  });
});

describe('Retriever Interface', () => {
  it('should implement retrieve method returning RetrievalResult[]', async () => {
    const retriever: Retriever = {
      async retrieve(query: string): Promise<RetrievalResult[]> {
        return [
          {
            id: 'r1',
            chunk: { id: 'c1', content: 'Relevant content about ' + query, metadata: { source: 'doc.md', chunkIndex: 0, startChar: 0, endChar: 30, type: 'semantic' } },
            score: 0.92,
            metadata: {},
          },
        ];
      },
    };
    const results = await retriever.retrieve('authentication');
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeGreaterThan(0.9);
    expect(results[0].chunk.content).toContain('authentication');
  });
});

describe('Reranker Interface', () => {
  it('should rerank and reorder results by relevance', async () => {
    const reranker: Reranker = {
      async rerank(query: string, documents: RetrievalResult[]): Promise<RetrievalResult[]> {
        return documents
          .map(d => ({
            ...d,
            score: d.chunk.content.toLowerCase().includes(query.toLowerCase()) ? 0.95 : 0.3,
          }))
          .sort((a, b) => b.score - a.score);
      },
    };

    const docs: RetrievalResult[] = [
      { id: 'r1', chunk: { id: 'c1', content: 'Unrelated stuff', metadata: { source: 'a', chunkIndex: 0, startChar: 0, endChar: 10, type: 'semantic' } }, score: 0.8, metadata: {} },
      { id: 'r2', chunk: { id: 'c2', content: 'Authentication with JWT tokens', metadata: { source: 'b', chunkIndex: 0, startChar: 0, endChar: 30, type: 'semantic' } }, score: 0.7, metadata: {} },
    ];

    const reranked = await reranker.rerank('authentication', docs);
    expect(reranked[0].id).toBe('r2');
    expect(reranked[0].score).toBe(0.95);
  });
});

describe('Synthesizer Interface', () => {
  it('should synthesize answer from chunks', async () => {
    const synthesizer: Synthesizer = {
      async synthesize(query: string, chunks: Chunk[]): Promise<SynthesisResult> {
        const context = chunks.map(c => c.content).join(' ');
        return {
          answer: `Based on the context: ${context.substring(0, 50)}...`,
          citations: chunks.map(c => ({
            text: c.content.substring(0, 30),
            source: c.metadata.source,
            score: 0.9,
            chunkId: c.id,
          })),
        };
      },
    };

    const chunks: Chunk[] = [
      { id: 'c1', content: 'JWT tokens provide stateless authentication.', metadata: { source: 'auth.md', chunkIndex: 0, startChar: 0, endChar: 45, type: 'semantic' } },
      { id: 'c2', content: 'OAuth2 is used for third-party authorization.', metadata: { source: 'oauth.md', chunkIndex: 0, startChar: 0, endChar: 46, type: 'semantic' } },
    ];

    const result = await synthesizer.synthesize('How does auth work?', chunks);
    expect(result.answer).toContain('Based on the context');
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0].source).toBe('auth.md');
  });
});

// =============================================================================
// QueryOptions Tests
// =============================================================================

describe('QueryOptions', () => {
  it('should define basic query', () => {
    const opts: QueryOptions = { query: 'How does authentication work?' };
    expect(opts.query).toBeDefined();
  });

  it('should support filters', () => {
    const opts: QueryOptions = {
      query: 'rate limiting',
      filters: { category: 'security', language: 'en' },
    };
    expect(opts.filters?.category).toBe('security');
  });

  it('should support advanced options', () => {
    const opts: QueryOptions = {
      query: 'database migrations',
      options: { includeMetadata: true, minRelevanceScore: 0.7, maxChunks: 10 },
    };
    expect(opts.options?.minRelevanceScore).toBe(0.7);
    expect(opts.options?.maxChunks).toBe(10);
  });
});

// =============================================================================
// Evaluation Dataset Tests
// =============================================================================

describe('Evaluation Types', () => {
  it('should create valid evaluation dataset', () => {
    const dataset: EvaluationDataset = {
      name: 'auth-qa-benchmark',
      questions: [
        { id: 'q1', question: 'What authentication methods are supported?', groundTruth: 'JWT, OAuth2, and API keys are supported.' },
        { id: 'q2', question: 'How are sessions managed?', groundTruth: 'Sessions use encrypted cookies with 24h TTL.', context: ['session.md'] },
      ],
    };
    expect(dataset.questions).toHaveLength(2);
    expect(dataset.questions[1].context).toContain('session.md');
  });
});

// =============================================================================
// Cache Configuration Tests
// =============================================================================

describe('Cache Configuration', () => {
  it('should define memory cache config', () => {
    const config: CacheConfig = { enabled: true, ttl: 3600, maxSize: 1000, storage: 'memory' };
    expect(config.storage).toBe('memory');
  });

  it('should define redis cache config', () => {
    const config: CacheConfig = { enabled: true, ttl: 7200, storage: 'redis' };
    expect(config.storage).toBe('redis');
  });

  it('should define disabled cache', () => {
    const config: CacheConfig = { enabled: false };
    expect(config.enabled).toBe(false);
  });

  it('should create cache entry with expiry', () => {
    const entry: CacheEntry<string> = {
      key: 'query:auth',
      value: 'cached answer',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };
    expect(entry.expiresAt.getTime()).toBeGreaterThan(entry.createdAt.getTime());
  });
});

// =============================================================================
// StreamChunk Tests
// =============================================================================

describe('StreamChunk Types', () => {
  it('should create content stream chunk', () => {
    const chunk: StreamChunk = { type: 'content', data: 'partial answer text' };
    expect(chunk.type).toBe('content');
    expect(chunk.data).toBe('partial answer text');
  });

  it('should create citation stream chunk', () => {
    const citation: Citation = { text: 'source text', source: 'doc.md', score: 0.9, chunkId: 'c1' };
    const chunk: StreamChunk = { type: 'citation', data: citation };
    expect(chunk.type).toBe('citation');
  });

  it('should create metadata stream chunk', () => {
    const chunk: StreamChunk = { type: 'metadata', data: { tokensUsed: 150 } };
    expect(chunk.type).toBe('metadata');
  });

  it('should create done stream chunk', () => {
    const chunk: StreamChunk = { type: 'done', data: 'complete' };
    expect(chunk.type).toBe('done');
  });
});
