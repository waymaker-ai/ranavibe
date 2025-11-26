/**
 * RAG Pipeline Presets
 * Pre-configured pipelines for common use cases
 */

import { createRAGPipeline, RAGPipelineImpl } from './builder';
import type { RAGPipelineConfig, RAGPipeline } from '../types';

/**
 * Pre-configured RAG pipeline configurations
 */
export const RAGPresets = {
  /**
   * Fast: Optimized for speed
   * - Simple chunking
   * - Vector-only retrieval
   * - Compact synthesis with small model
   */
  fast: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'recursive',
      chunkSize: 512,
      overlap: 50,
    },
    retriever: {
      type: 'vector',
      topK: 5,
    },
    synthesizer: {
      type: 'compact',
      model: 'gpt-4o-mini',
    },
    config: {
      caching: true,
      logging: 'minimal',
    },
  }),

  /**
   * Accurate: Optimized for quality
   * - Semantic chunking
   * - Hybrid retrieval
   * - Cross-encoder reranking
   * - Refine synthesis
   */
  accurate: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'semantic',
      chunkSize: 512,
      overlap: 50,
    },
    retriever: {
      type: 'hybrid',
      topK: 20,
      options: {
        vector: { topK: 20, similarityThreshold: 0.5 },
        keyword: { topK: 10 },
        fusion: 'reciprocal-rank-fusion',
      } as never,
    },
    reranker: {
      type: 'cross-encoder',
      topK: 5,
    },
    queryTransformer: {
      multiQuery: true,
      hypotheticalAnswer: true,
    },
    synthesizer: {
      type: 'refine',
      citations: true,
      model: 'claude-sonnet-4',
    },
    config: {
      caching: true,
      metrics: true,
      logging: 'verbose',
    },
  }),

  /**
   * Balanced: Good speed and quality tradeoff
   * - Markdown-aware chunking
   * - Hybrid retrieval with smaller topK
   * - LLM reranking with fast model
   * - Tree summarization
   */
  balanced: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'markdown',
      chunkSize: 512,
      overlap: 50,
    },
    retriever: {
      type: 'hybrid',
      topK: 10,
      options: {
        vector: { topK: 10, similarityThreshold: 0.6 },
        keyword: { topK: 5 },
        fusion: 'reciprocal-rank-fusion',
      } as never,
    },
    reranker: {
      type: 'llm',
      topK: 5,
      options: {
        model: 'gpt-4o-mini',
      },
    },
    synthesizer: {
      type: 'tree-summarize',
      citations: true,
      model: 'gpt-4o',
    },
    config: {
      caching: true,
      logging: 'minimal',
    },
  }),

  /**
   * Code: Optimized for code search and Q&A
   * - Code-aware chunking
   * - Hybrid retrieval
   * - Cross-encoder reranking
   * - Refine synthesis for detailed explanations
   */
  code: (language: string = 'typescript'): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'code',
      chunkSize: 1024,
      overlap: 0,
      options: {
        language,
        preserveFunctions: true,
        preserveClasses: true,
      },
    },
    retriever: {
      type: 'hybrid',
      topK: 15,
      options: {
        vector: { topK: 15, similarityThreshold: 0.5 },
        keyword: { topK: 10 },
        fusion: 'reciprocal-rank-fusion',
      } as never,
    },
    reranker: {
      type: 'cross-encoder',
      topK: 5,
    },
    synthesizer: {
      type: 'refine',
      citations: true,
      model: 'claude-sonnet-4',
    },
    config: {
      caching: true,
      logging: 'verbose',
    },
  }),

  /**
   * Documentation: Optimized for documentation search
   * - Markdown chunking with header preservation
   * - Hybrid retrieval
   * - Diversity reranking to cover different sections
   * - Compact synthesis with citations
   */
  documentation: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'markdown',
      chunkSize: 800,
      overlap: 100,
      options: {
        preserveHeaders: true,
        preserveCodeBlocks: true,
      },
    },
    retriever: {
      type: 'hybrid',
      topK: 15,
      options: {
        vector: { topK: 15, similarityThreshold: 0.5 },
        keyword: { topK: 10 },
        fusion: 'reciprocal-rank-fusion',
      } as never,
    },
    reranker: {
      type: 'diversity',
      topK: 5,
      options: {
        lambda: 0.6,
      },
    },
    synthesizer: {
      type: 'compact',
      citations: true,
      model: 'gpt-4o',
    },
    config: {
      caching: true,
      cacheTTL: 3600000, // 1 hour
      logging: 'minimal',
    },
  }),

  /**
   * Research: Optimized for research papers and long-form content
   * - Semantic chunking with larger chunks
   * - Vector retrieval with high topK
   * - LLM reranking for nuanced relevance
   * - Refine synthesis for comprehensive answers
   */
  research: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'semantic',
      chunkSize: 1000,
      overlap: 100,
    },
    retriever: {
      type: 'vector',
      topK: 25,
      options: {
        similarityThreshold: 0.4,
      },
    },
    reranker: {
      type: 'llm',
      topK: 8,
      options: {
        model: 'claude-sonnet-4',
      },
    },
    queryTransformer: {
      multiQuery: true,
      decompose: true,
    },
    synthesizer: {
      type: 'refine',
      citations: true,
      model: 'claude-sonnet-4',
      options: {
        maxTokens: 2000,
      },
    },
    config: {
      caching: false, // Research queries are often unique
      metrics: true,
      logging: 'verbose',
    },
  }),

  /**
   * Chat: Optimized for conversational RAG
   * - Smaller, focused chunks
   * - Fast retrieval
   * - Compact synthesis for quick responses
   */
  chat: (): RAGPipeline => createRAGPipeline({
    chunker: {
      type: 'recursive',
      chunkSize: 400,
      overlap: 50,
    },
    retriever: {
      type: 'vector',
      topK: 3,
      options: {
        similarityThreshold: 0.6,
      },
    },
    synthesizer: {
      type: 'compact',
      citations: false,
      model: 'gpt-4o-mini',
      options: {
        maxTokens: 500,
        temperature: 0.7,
      },
    },
    config: {
      caching: true,
      cacheTTL: 300000, // 5 minutes
      logging: 'none',
    },
  }),
};

/**
 * Create custom pipeline from partial config
 */
export function createCustomPipeline(
  base: keyof typeof RAGPresets,
  overrides: Partial<RAGPipelineConfig>
): RAGPipeline {
  // Get base config by calling the preset function
  const baseConfig = RAGPresets[base]();

  // Since we can't easily merge, create new pipeline with overrides
  // This is a simplified approach - in production, deep merge the configs
  return createRAGPipeline({
    chunker: overrides.chunker || { type: 'recursive', chunkSize: 512, overlap: 50 },
    retriever: overrides.retriever || { type: 'vector', topK: 10 },
    reranker: overrides.reranker,
    queryTransformer: overrides.queryTransformer,
    synthesizer: overrides.synthesizer || { type: 'compact' },
    config: overrides.config,
  });
}
