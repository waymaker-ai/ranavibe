/**
 * Type definitions for @rana/rag
 * Advanced RAG (Retrieval Augmented Generation)
 */

// Chunk types
export interface Chunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  type: 'semantic' | 'recursive' | 'markdown' | 'code' | 'html' | 'adaptive';
  [key: string]: unknown;
}

// Chunker types
export interface ChunkerConfig {
  type: 'semantic' | 'recursive' | 'markdown' | 'code' | 'adaptive';
  chunkSize: number;
  overlap: number;
  options?: ChunkerOptions;
}

export interface ChunkerOptions {
  model?: string;
  threshold?: number;
  splitOn?: 'sentences' | 'paragraphs' | 'tokens';
  preserveContext?: boolean;
  language?: string;
  minChunkSize?: number;
  maxChunkSize?: number;
}

export interface SemanticChunkerOptions extends ChunkerOptions {
  similarityThreshold?: number;
  sentenceModel?: string;
}

export interface MarkdownChunkerOptions extends ChunkerOptions {
  preserveHeaders?: boolean;
  preserveCodeBlocks?: boolean;
  preserveLists?: boolean;
}

export interface CodeChunkerOptions extends ChunkerOptions {
  language: string;
  preserveFunctions?: boolean;
  preserveClasses?: boolean;
  includeComments?: boolean;
}

// Retrieval types
export interface RetrieverConfig {
  type: 'vector' | 'keyword' | 'hybrid' | 'multi-vector' | 'graph';
  topK: number;
  options?: RetrieverOptions;
}

export interface RetrieverOptions {
  similarityThreshold?: number;
  filters?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface VectorRetrieverOptions extends RetrieverOptions {
  index: string;
  model?: string;
  namespace?: string;
}

export interface KeywordRetrieverOptions extends RetrieverOptions {
  algorithm: 'bm25' | 'tfidf';
  stemming?: boolean;
  stopWords?: string[];
}

export interface HybridRetrieverOptions extends RetrieverOptions {
  vector: {
    topK: number;
    similarityThreshold?: number;
  };
  keyword: {
    topK: number;
    algorithm?: 'bm25' | 'tfidf';
  };
  fusion: 'reciprocal-rank-fusion' | 'weighted' | 'max';
  weights?: { vector: number; keyword: number };
}

export interface RetrievalResult {
  id: string;
  chunk: Chunk;
  score: number;
  metadata: Record<string, unknown>;
}

// Reranker types
export interface RerankerConfig {
  type: 'cross-encoder' | 'llm' | 'diversity' | 'custom';
  topK: number;
  options?: RerankerOptions;
}

export interface RerankerOptions {
  model?: string;
  batchSize?: number;
  maxConcurrency?: number;
}

export interface CrossEncoderRerankerOptions extends RerankerOptions {
  model: string;
  normalize?: boolean;
}

export interface LLMRerankerOptions extends RerankerOptions {
  model?: string;
  temperature?: number;
  prompt?: string;
}

export interface DiversityRerankerOptions extends RerankerOptions {
  lambda?: number; // MMR lambda parameter
  similarityMetric?: 'cosine' | 'euclidean';
}

// Query transformation types
export interface QueryTransformerConfig {
  multiQuery?: boolean;
  hypotheticalAnswer?: boolean; // HyDE
  decompose?: boolean;
  expand?: boolean;
}

export interface MultiQueryOptions {
  count?: number;
  model?: string;
  temperature?: number;
}

export interface HyDEOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DecomposeOptions {
  maxSubQuestions?: number;
  model?: string;
}

export interface SubQuestion {
  question: string;
  dependency: number | null;
}

// Synthesis types
export interface SynthesizerConfig {
  type: 'refine' | 'tree-summarize' | 'compact';
  citations?: boolean;
  streaming?: boolean;
  model?: string;
  options?: SynthesizerOptions;
}

export interface SynthesizerOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface SynthesisResult {
  answer: string;
  citations: Citation[];
}

// Citation types
export interface Citation {
  text: string;
  source: string;
  score: number;
  chunkId: string;
  metadata?: Record<string, unknown>;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  type: 'document' | 'webpage' | 'api' | 'database';
  metadata?: Record<string, unknown>;
}

// Pipeline types
export interface RAGPipelineConfig {
  chunker: ChunkerConfig;
  retriever: RetrieverConfig;
  reranker?: RerankerConfig;
  queryTransformer?: QueryTransformerConfig;
  synthesizer: SynthesizerConfig;
  config?: PipelineOptions;
}

export interface PipelineOptions {
  caching?: boolean;
  cacheTTL?: number;
  metrics?: boolean;
  logging?: 'none' | 'minimal' | 'verbose';
  timeout?: number;
}

export interface QueryOptions {
  query: string;
  filters?: Record<string, unknown>;
  options?: {
    includeMetadata?: boolean;
    minRelevanceScore?: number;
    maxChunks?: number;
  };
}

// Result types
export interface RAGResult {
  answer: string;
  citations: Citation[];
  sources: Source[];
  metrics: RAGMetrics;
  metadata?: Record<string, unknown>;
}

export interface RAGMetrics {
  latency: number;
  cost: number;
  chunks: {
    total: number;
    retrieved: number;
    used: number;
  };
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  quality?: {
    relevance: number;
    coherence: number;
    completeness: number;
  };
}

// Evaluation types
export interface EvaluationDataset {
  name: string;
  questions: EvaluationQuestion[];
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  groundTruth: string;
  context?: string[];
  metadata?: Record<string, unknown>;
}

export interface EvaluationResult {
  dataset: string;
  totalQuestions: number;
  metrics: AggregatedMetrics;
  results: QuestionResult[];
}

export interface QuestionResult {
  question: string;
  answer: string;
  groundTruth: string;
  metrics: AnswerMetrics;
}

export interface AnswerMetrics {
  relevance: number;
  correctness: number;
  completeness: number;
  coherence: number;
  citationPrecision: number;
  citationRecall: number;
}

export interface AggregatedMetrics {
  avgRelevance: number;
  avgCorrectness: number;
  avgCompleteness: number;
  avgCoherence: number;
  avgCitationPrecision: number;
  avgCitationRecall: number;
}

// Caching types
export interface CacheConfig {
  enabled: boolean;
  ttl?: number;
  maxSize?: number;
  storage?: 'memory' | 'redis' | 'file';
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
}

// Interfaces for implementations
export interface Chunker {
  chunk(text: string, options?: ChunkerOptions): Promise<Chunk[]>;
}

export interface Retriever {
  retrieve(query: string, options?: RetrieverOptions): Promise<RetrievalResult[]>;
  retrieveByEmbedding?(embedding: number[], options?: RetrieverOptions): Promise<RetrievalResult[]>;
}

export interface Reranker {
  rerank(query: string, documents: RetrievalResult[], options?: RerankerOptions): Promise<RetrievalResult[]>;
}

export interface Synthesizer {
  synthesize(query: string, chunks: Chunk[], options?: SynthesizerOptions): Promise<SynthesisResult>;
}

export interface QueryTransformer {
  transform(query: string, options?: unknown): Promise<string[]>;
}

export interface RAGPipeline {
  query(options: QueryOptions): Promise<RAGResult>;
  queryStream?(options: QueryOptions): AsyncGenerator<StreamChunk, void, unknown>;
  index(documents: Document[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
}

export interface StreamChunk {
  type: 'content' | 'citation' | 'metadata' | 'done';
  data: string | Citation | Record<string, unknown>;
}

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}
