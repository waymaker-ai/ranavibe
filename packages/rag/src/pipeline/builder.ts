/**
 * RAG Pipeline Builder
 * Create and configure RAG pipelines
 */

import type {
  RAGPipelineConfig,
  RAGPipeline,
  QueryOptions,
  RAGResult,
  RAGMetrics,
  Chunk,
  Document,
  StreamChunk,
  PipelineOptions,
} from '../types';

import { SemanticChunker } from '../chunking/semantic';
import { MarkdownChunker } from '../chunking/markdown';
import { CodeChunker } from '../chunking/code';
import { RecursiveChunker } from '../chunking/recursive';

import { VectorRetriever } from '../retrieval/vector';
import { KeywordRetriever } from '../retrieval/keyword';
import { HybridRetriever } from '../retrieval/hybrid';

import { CrossEncoderReranker } from '../reranking/cross-encoder';
import { LLMReranker } from '../reranking/llm-reranker';
import { DiversityReranker } from '../reranking/diversity';

import { RefineSynthesizer } from '../synthesis/refine';
import { TreeSummarizeSynthesizer } from '../synthesis/tree-summarize';
import { CompactSynthesizer } from '../synthesis/compact';

/**
 * RAG Pipeline implementation
 */
export class RAGPipelineImpl implements RAGPipeline {
  private config: RAGPipelineConfig;
  private chunker: SemanticChunker | MarkdownChunker | CodeChunker | RecursiveChunker;
  private retriever: VectorRetriever | KeywordRetriever | HybridRetriever;
  private reranker?: CrossEncoderReranker | LLMReranker | DiversityReranker;
  private synthesizer: RefineSynthesizer | TreeSummarizeSynthesizer | CompactSynthesizer;
  private chunks: Chunk[] = [];
  private cache: Map<string, RAGResult> = new Map();
  private options: PipelineOptions;

  constructor(config: RAGPipelineConfig) {
    this.config = config;
    this.options = config.config || {};

    // Initialize chunker
    this.chunker = this.createChunker(config.chunker);

    // Initialize retriever
    this.retriever = this.createRetriever(config.retriever);

    // Initialize reranker (optional)
    if (config.reranker) {
      this.reranker = this.createReranker(config.reranker);
    }

    // Initialize synthesizer
    this.synthesizer = this.createSynthesizer(config.synthesizer);
  }

  /**
   * Query the RAG pipeline
   */
  async query(queryOptions: QueryOptions): Promise<RAGResult> {
    const startTime = Date.now();
    const { query, filters, options } = queryOptions;

    // Check cache
    if (this.options.caching) {
      const cacheKey = this.getCacheKey(query, filters);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: { ...cached.metadata, cached: true },
        };
      }
    }

    // Log if verbose
    if (this.options.logging === 'verbose') {
      console.log(`[RAG] Query: ${query}`);
    }

    // 1. Retrieve relevant chunks
    const retrievalStart = Date.now();
    let results = await this.retriever.retrieve(query, {
      topK: options?.maxChunks || 20,
      similarityThreshold: options?.minRelevanceScore || 0.5,
      filters,
      includeMetadata: options?.includeMetadata ?? true,
    });
    const retrievalTime = Date.now() - retrievalStart;

    if (this.options.logging === 'verbose') {
      console.log(`[RAG] Retrieved ${results.length} chunks in ${retrievalTime}ms`);
    }

    // 2. Rerank if configured
    if (this.reranker && results.length > 0) {
      const rerankStart = Date.now();
      results = await this.reranker.rerank(query, results, {
        topK: this.config.reranker?.topK || 5,
      });
      const rerankTime = Date.now() - rerankStart;

      if (this.options.logging === 'verbose') {
        console.log(`[RAG] Reranked to ${results.length} chunks in ${rerankTime}ms`);
      }
    }

    // 3. Extract chunks for synthesis
    const chunks = results.map(r => r.chunk);

    // 4. Synthesize answer
    const synthesisStart = Date.now();
    const synthesis = await this.synthesizer.synthesize(query, chunks, {
      temperature: this.config.synthesizer.options?.temperature || 0.3,
      maxTokens: this.config.synthesizer.options?.maxTokens || 1000,
    });
    const synthesisTime = Date.now() - synthesisStart;

    if (this.options.logging === 'verbose') {
      console.log(`[RAG] Synthesized answer in ${synthesisTime}ms`);
    }

    // 5. Build result
    const totalTime = Date.now() - startTime;

    const result: RAGResult = {
      answer: synthesis.answer,
      citations: synthesis.citations,
      sources: this.extractSources(synthesis.citations),
      metrics: {
        latency: totalTime,
        cost: this.estimateCost(chunks, synthesis.answer),
        chunks: {
          total: this.chunks.length,
          retrieved: results.length,
          used: synthesis.citations.length,
        },
        tokens: {
          input: this.estimateTokens(chunks.map(c => c.content).join('')),
          output: this.estimateTokens(synthesis.answer),
          total: 0,
        },
      },
      metadata: {
        query,
        retrievalTime,
        synthesisTime,
        totalTime,
      },
    };

    result.metrics.tokens.total = result.metrics.tokens.input + result.metrics.tokens.output;

    // Cache result
    if (this.options.caching) {
      const cacheKey = this.getCacheKey(query, filters);
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Streaming query (generator)
   */
  async *queryStream(queryOptions: QueryOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const { query, filters, options } = queryOptions;

    // 1. Retrieve
    yield { type: 'metadata', data: { stage: 'retrieving' } };

    const results = await this.retriever.retrieve(query, {
      topK: options?.maxChunks || 20,
      similarityThreshold: options?.minRelevanceScore || 0.5,
      filters,
    });

    // 2. Rerank
    let rankedResults = results;
    if (this.reranker) {
      yield { type: 'metadata', data: { stage: 'reranking' } };
      rankedResults = await this.reranker.rerank(query, results, {
        topK: this.config.reranker?.topK || 5,
      });
    }

    // 3. Yield citations
    const chunks = rankedResults.map(r => r.chunk);
    for (const chunk of chunks) {
      yield {
        type: 'citation',
        data: {
          text: chunk.content.slice(0, 200),
          source: chunk.metadata.source || chunk.id,
          chunkId: chunk.id,
        },
      };
    }

    // 4. Synthesize and stream
    yield { type: 'metadata', data: { stage: 'synthesizing' } };

    const synthesis = await this.synthesizer.synthesize(query, chunks);

    // Simulate streaming by yielding chunks of the answer
    const words = synthesis.answer.split(' ');
    for (let i = 0; i < words.length; i += 5) {
      yield {
        type: 'content',
        data: words.slice(i, i + 5).join(' ') + ' ',
      };
    }

    yield { type: 'done', data: {} };
  }

  /**
   * Index documents
   */
  async index(documents: Document[]): Promise<void> {
    const allChunks: Chunk[] = [];

    for (const doc of documents) {
      // Chunk document based on type
      let docChunks: Chunk[];

      if (this.config.chunker.type === 'code' && 'language' in this.config.chunker) {
        docChunks = await this.chunker.chunk(doc.content, this.config.chunker.options || {});
      } else {
        docChunks = await this.chunker.chunk(doc.content, this.config.chunker.options || {});
      }

      // Add document metadata to chunks
      for (const chunk of docChunks) {
        chunk.metadata.source = doc.id;
        chunk.metadata.documentId = doc.id;
        if (doc.metadata) {
          Object.assign(chunk.metadata, doc.metadata);
        }
      }

      allChunks.push(...docChunks);
    }

    // Index chunks in retriever
    if ('index' in this.retriever && typeof this.retriever.index === 'function') {
      await (this.retriever as VectorRetriever | KeywordRetriever | HybridRetriever).index(allChunks);
    }

    this.chunks = allChunks;

    if (this.options.logging !== 'none') {
      console.log(`[RAG] Indexed ${documents.length} documents into ${allChunks.length} chunks`);
    }
  }

  /**
   * Delete documents by ID
   */
  async delete(ids: string[]): Promise<void> {
    this.chunks = this.chunks.filter(c => !ids.includes(c.metadata.documentId as string));

    // Re-index
    if ('index' in this.retriever && typeof this.retriever.index === 'function') {
      await (this.retriever as VectorRetriever | KeywordRetriever | HybridRetriever).index(this.chunks);
    }
  }

  // Private helper methods

  private createChunker(config: RAGPipelineConfig['chunker']) {
    switch (config.type) {
      case 'semantic':
        return new SemanticChunker();
      case 'markdown':
        return new MarkdownChunker();
      case 'code':
        return new CodeChunker();
      case 'recursive':
      case 'adaptive':
      default:
        return new RecursiveChunker();
    }
  }

  private createRetriever(config: RAGPipelineConfig['retriever']) {
    switch (config.type) {
      case 'vector':
        return new VectorRetriever();
      case 'keyword':
        return new KeywordRetriever();
      case 'hybrid':
      default:
        return new HybridRetriever();
    }
  }

  private createReranker(config: NonNullable<RAGPipelineConfig['reranker']>) {
    switch (config.type) {
      case 'cross-encoder':
        return new CrossEncoderReranker();
      case 'llm':
        return new LLMReranker();
      case 'diversity':
        return new DiversityReranker();
      default:
        return new CrossEncoderReranker();
    }
  }

  private createSynthesizer(config: RAGPipelineConfig['synthesizer']) {
    switch (config.type) {
      case 'refine':
        return new RefineSynthesizer();
      case 'tree-summarize':
        return new TreeSummarizeSynthesizer();
      case 'compact':
      default:
        return new CompactSynthesizer();
    }
  }

  private getCacheKey(query: string, filters?: Record<string, unknown>): string {
    return `${query}:${JSON.stringify(filters || {})}`;
  }

  private extractSources(citations: RAGResult['citations']) {
    const sourceMap = new Map<string, RAGResult['sources'][0]>();

    for (const citation of citations) {
      if (!sourceMap.has(citation.source)) {
        sourceMap.set(citation.source, {
          id: citation.source,
          title: citation.source,
          type: 'document',
          metadata: citation.metadata,
        });
      }
    }

    return Array.from(sourceMap.values());
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private estimateCost(chunks: Chunk[], answer: string): number {
    const inputTokens = chunks.reduce((sum, c) => sum + this.estimateTokens(c.content), 0);
    const outputTokens = this.estimateTokens(answer);

    // Rough estimate: $0.01 per 1K tokens
    return (inputTokens + outputTokens) * 0.00001;
  }
}

/**
 * Create a RAG pipeline
 */
export function createRAGPipeline(config: RAGPipelineConfig): RAGPipeline {
  return new RAGPipelineImpl(config);
}
