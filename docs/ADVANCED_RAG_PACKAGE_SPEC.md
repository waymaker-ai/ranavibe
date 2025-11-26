# Advanced RAG Package Specification

## Executive Summary

**Feature**: Advanced RAG (Retrieval Augmented Generation) Package for RANA Framework
**Priority**: P0 (Competitive Parity)
**Impact**: AI Application Quality, Production Readiness
**Timeline**: Q1 2025 (8-10 weeks)

This specification defines RANA's advanced RAG capabilities to compete with LangChain, LlamaIndex, and enterprise RAG solutions. The package provides production-ready patterns for semantic search, hybrid retrieval, intelligent chunking, re-ranking, and multi-document synthesis.

---

## Problem Statement

### Current State

RANA has basic RAG support:
- ✓ Vector database integration (pgvector, Pinecone, Weaviate)
- ✓ Embedding generation
- ✓ Simple semantic search
- ✗ Advanced chunking strategies
- ✗ Hybrid search (vector + keyword)
- ✗ Query transformation
- ✗ Re-ranking mechanisms
- ✗ Multi-hop reasoning
- ✗ Citation tracking
- ✗ RAG evaluation metrics

### Competitive Landscape

| Framework | Capability | RANA Status |
|-----------|-----------|-------------|
| **LangChain** | Advanced chunking, multi-query | ✗ Missing |
| **LlamaIndex** | Graph RAG, sub-question decomposition | ✗ Missing |
| **Haystack** | Hybrid search, re-ranking | ✗ Missing |
| **Verba** | Multi-document synthesis | ✗ Missing |
| **Dust.tt** | Semantic caching, citations | ✗ Partial |

### Target State

```typescript
import { createRAGPipeline, chunkers, retrievers, rerankers } from '@rana/rag-advanced';

// Create production RAG pipeline
const pipeline = createRAGPipeline({
  // Step 1: Intelligent chunking
  chunker: chunkers.semantic({
    model: 'text-embedding-3-large',
    chunkSize: 512,
    overlap: 50,
    splitOn: 'sentences',
    preserveContext: true,
  }),

  // Step 2: Hybrid retrieval (vector + keyword)
  retriever: retrievers.hybrid({
    vector: {
      index: 'docs',
      topK: 20,
      similarityThreshold: 0.7,
    },
    keyword: {
      algorithm: 'bm25',
      topK: 10,
    },
    fusion: 'reciprocal-rank-fusion',
  }),

  // Step 3: Re-ranking
  reranker: rerankers.crossEncoder({
    model: 'ms-marco-MiniLM-L-12-v2',
    topK: 5,
  }),

  // Step 4: Query transformation
  queryTransformer: {
    multiQuery: true,          // Generate multiple search queries
    hypotheticalAnswer: true,  // HyDE (Hypothetical Document Embeddings)
    decompose: true,           // Break complex queries into sub-questions
  },

  // Step 5: Response synthesis
  synthesizer: {
    type: 'refine',            // tree-summarize, refine, compact
    citations: true,
    streaming: true,
  },

  // Configuration
  config: {
    caching: true,
    metrics: true,
    logging: 'verbose',
  },
});

// Use the pipeline
const result = await pipeline.query({
  query: "How does RANA handle multi-agent orchestration?",
  filters: {
    category: 'documentation',
    version: '2.0',
  },
  options: {
    includeMetadata: true,
    minRelevanceScore: 0.75,
  },
});

console.log(result.answer);
console.log(result.citations);    // [{ text, source, score }]
console.log(result.metrics);      // { latency, cost, chunks, sources }
```

---

## Technical Architecture

### 1. Package Structure

```
@rana/rag-advanced
├── chunking/
│   ├── semantic.ts           # Semantic chunking
│   ├── recursive.ts          # Recursive character splitting
│   ├── markdown.ts           # Markdown-aware chunking
│   ├── code.ts               # Code-aware chunking
│   ├── html.ts               # HTML parsing & chunking
│   └── adaptive.ts           # Adaptive chunking
├── retrieval/
│   ├── vector.ts             # Vector similarity search
│   ├── keyword.ts            # BM25 keyword search
│   ├── hybrid.ts             # Hybrid retrieval
│   ├── multi-vector.ts       # Multi-vector retrieval
│   └── graph.ts              # Graph-based retrieval
├── reranking/
│   ├── cross-encoder.ts      # Cross-encoder reranking
│   ├── llm-reranker.ts       # LLM-based reranking
│   ├── diversity.ts          # Diversity-based reranking
│   └── custom.ts             # Custom reranking logic
├── query/
│   ├── multi-query.ts        # Multi-query generation
│   ├── hyde.ts               # Hypothetical Document Embeddings
│   ├── decomposition.ts      # Sub-question decomposition
│   ├── expansion.ts          # Query expansion
│   └── transformation.ts     # Query transformation
├── synthesis/
│   ├── refine.ts             # Iterative refinement
│   ├── tree-summarize.ts     # Tree summarization
│   ├── compact.ts            # Compact synthesis
│   ├── citations.ts          # Citation management
│   └── streaming.ts          # Streaming synthesis
├── evaluation/
│   ├── metrics.ts            # RAG evaluation metrics
│   ├── datasets.ts           # Test dataset management
│   ├── benchmarks.ts         # Benchmarking utilities
│   └── reports.ts            # Evaluation reports
├── caching/
│   ├── semantic-cache.ts     # Semantic similarity caching
│   ├── embedding-cache.ts    # Embedding caching
│   └── result-cache.ts       # Result caching
└── pipeline/
    ├── builder.ts            # Pipeline builder
    ├── executor.ts           # Pipeline executor
    ├── optimizer.ts          # Pipeline optimizer
    └── presets.ts            # Pre-configured pipelines
```

### 2. Core Types

```typescript
// packages/rag-advanced/src/types.ts

export interface RAGPipelineConfig {
  chunker: ChunkerConfig;
  retriever: RetrieverConfig;
  reranker?: RerankerConfig;
  queryTransformer?: QueryTransformerConfig;
  synthesizer: SynthesizerConfig;
  config?: PipelineOptions;
}

export interface ChunkerConfig {
  type: 'semantic' | 'recursive' | 'markdown' | 'code' | 'adaptive';
  chunkSize: number;
  overlap: number;
  options?: ChunkerOptions;
}

export interface RetrieverConfig {
  type: 'vector' | 'keyword' | 'hybrid' | 'multi-vector' | 'graph';
  topK: number;
  options?: RetrieverOptions;
}

export interface RerankerConfig {
  type: 'cross-encoder' | 'llm' | 'diversity' | 'custom';
  topK: number;
  options?: RerankerOptions;
}

export interface QueryTransformerConfig {
  multiQuery?: boolean;
  hypotheticalAnswer?: boolean;
  decompose?: boolean;
  expand?: boolean;
}

export interface SynthesizerConfig {
  type: 'refine' | 'tree-summarize' | 'compact';
  citations?: boolean;
  streaming?: boolean;
  model?: string;
  options?: SynthesizerOptions;
}

export interface RAGResult {
  answer: string;
  citations: Citation[];
  sources: Source[];
  metrics: RAGMetrics;
  metadata?: Record<string, any>;
}

export interface Citation {
  text: string;              // Cited text chunk
  source: string;            // Source document
  score: number;             // Relevance score
  chunkId: string;           // Chunk identifier
  metadata?: Record<string, any>;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  type: 'document' | 'webpage' | 'api' | 'database';
  metadata?: Record<string, any>;
}

export interface RAGMetrics {
  latency: number;           // Total latency (ms)
  cost: number;              // Total cost (USD)
  chunks: {
    total: number;           // Total chunks considered
    retrieved: number;       // Chunks retrieved
    used: number;            // Chunks used in answer
  };
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  quality?: {
    relevance: number;       // 0-1, avg relevance score
    coherence: number;       // 0-1, answer coherence
    completeness: number;    // 0-1, answer completeness
  };
}

export interface Chunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    type: string;
    [key: string]: any;
  };
}
```

---

## Intelligent Chunking

### 1. Semantic Chunking

```typescript
// packages/rag-advanced/src/chunking/semantic.ts

export class SemanticChunker implements Chunker {
  /**
   * Chunk text based on semantic boundaries
   * Uses embedding similarity to find natural breakpoints
   */
  async chunk(text: string, options: SemanticChunkerOptions): Promise<Chunk[]> {
    // 1. Split into sentences
    const sentences = this.splitIntoSentences(text);

    // 2. Generate embeddings for each sentence
    const embeddings = await this.generateEmbeddings(sentences);

    // 3. Calculate similarity between adjacent sentences
    const similarities = this.calculateSimilarities(embeddings);

    // 4. Find breakpoints where similarity drops
    const breakpoints = this.findBreakpoints(similarities, options.threshold);

    // 5. Create chunks
    const chunks = this.createChunks(sentences, breakpoints, options);

    // 6. Add metadata
    return this.enrichChunks(chunks, text);
  }

  private findBreakpoints(similarities: number[], threshold: number): number[] {
    const breakpoints: number[] = [];

    for (let i = 0; i < similarities.length; i++) {
      // Large drop in similarity indicates topic change
      if (similarities[i] < threshold) {
        breakpoints.push(i);
      }
    }

    return breakpoints;
  }

  private createChunks(
    sentences: string[],
    breakpoints: number[],
    options: SemanticChunkerOptions
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let chunkStartIdx = 0;

    for (let i = 0; i < sentences.length; i++) {
      currentChunk.push(sentences[i]);

      // Check if we hit a breakpoint or max chunk size
      const isBreakpoint = breakpoints.includes(i);
      const isMaxSize = currentChunk.join(' ').length >= options.maxChunkSize;

      if (isBreakpoint || isMaxSize || i === sentences.length - 1) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk.join(' '),
          metadata: {
            source: '',
            chunkIndex: chunks.length,
            startChar: chunkStartIdx,
            endChar: chunkStartIdx + currentChunk.join(' ').length,
            type: 'semantic',
            sentenceCount: currentChunk.length,
          },
        });

        // Keep overlap
        const overlapSentences = Math.floor(options.overlap / 20); // ~20 chars per sentence
        currentChunk = currentChunk.slice(-overlapSentences);
        chunkStartIdx = i;
      }
    }

    return chunks;
  }
}
```

### 2. Markdown-Aware Chunking

```typescript
// packages/rag-advanced/src/chunking/markdown.ts

export class MarkdownChunker implements Chunker {
  /**
   * Chunk markdown while preserving structure
   * Keeps headers with their content
   */
  async chunk(markdown: string, options: MarkdownChunkerOptions): Promise<Chunk[]> {
    // 1. Parse markdown into AST
    const ast = this.parseMarkdown(markdown);

    // 2. Extract sections based on headers
    const sections = this.extractSections(ast);

    // 3. Chunk each section
    const chunks: Chunk[] = [];

    for (const section of sections) {
      const sectionChunks = await this.chunkSection(section, options);
      chunks.push(...sectionChunks);
    }

    return chunks;
  }

  private extractSections(ast: MarkdownAST): Section[] {
    const sections: Section[] = [];
    let currentSection: Section | null = null;

    for (const node of ast.children) {
      if (node.type === 'heading') {
        // Start new section
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          header: node.text,
          level: node.depth,
          content: [],
          metadata: {},
        };
      } else if (currentSection) {
        currentSection.content.push(node);
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private async chunkSection(
    section: Section,
    options: MarkdownChunkerOptions
  ): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const header = `${'#'.repeat(section.level)} ${section.header}\n\n`;
    let currentChunk = header;

    for (const node of section.content) {
      const nodeText = this.nodeToText(node);

      // Check if adding this node exceeds chunk size
      if (currentChunk.length + nodeText.length > options.maxChunkSize && currentChunk !== header) {
        // Save current chunk
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: currentChunk.trim(),
          metadata: {
            source: '',
            chunkIndex: chunks.length,
            type: 'markdown',
            header: section.header,
            level: section.level,
          },
        });

        // Start new chunk with header
        currentChunk = header;
      }

      currentChunk += nodeText + '\n\n';
    }

    // Save last chunk
    if (currentChunk !== header) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: currentChunk.trim(),
        metadata: {
          source: '',
          chunkIndex: chunks.length,
          type: 'markdown',
          header: section.header,
          level: section.level,
        },
      });
    }

    return chunks;
  }
}
```

### 3. Code-Aware Chunking

```typescript
// packages/rag-advanced/src/chunking/code.ts

export class CodeChunker implements Chunker {
  /**
   * Chunk code while preserving function/class boundaries
   */
  async chunk(code: string, options: CodeChunkerOptions): Promise<Chunk[]> {
    const language = options.language || this.detectLanguage(code);
    const parser = this.getParser(language);

    // Parse code into AST
    const ast = parser.parse(code);

    // Extract top-level declarations
    const declarations = this.extractDeclarations(ast);

    const chunks: Chunk[] = [];

    for (const decl of declarations) {
      // Each function/class is a chunk
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: decl.text,
        metadata: {
          source: '',
          chunkIndex: chunks.length,
          type: 'code',
          language,
          declarationType: decl.type,
          name: decl.name,
          startLine: decl.startLine,
          endLine: decl.endLine,
        },
      });

      // If declaration is too large, split it
      if (decl.text.length > options.maxChunkSize) {
        const subChunks = await this.splitLargeDeclaration(decl, options);
        chunks.push(...subChunks);
      }
    }

    return chunks;
  }

  private extractDeclarations(ast: CodeAST): Declaration[] {
    const declarations: Declaration[] = [];

    this.traverseAST(ast, (node) => {
      if (this.isDeclaration(node)) {
        declarations.push({
          type: node.type,
          name: this.getDeclarationName(node),
          text: node.text,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
          node,
        });
      }
    });

    return declarations;
  }

  private isDeclaration(node: ASTNode): boolean {
    return [
      'function_declaration',
      'class_declaration',
      'method_definition',
      'arrow_function',
      'interface_declaration',
      'type_alias_declaration',
    ].includes(node.type);
  }
}
```

---

## Hybrid Retrieval

### 1. Hybrid Search Implementation

```typescript
// packages/rag-advanced/src/retrieval/hybrid.ts

export class HybridRetriever implements Retriever {
  private vectorRetriever: VectorRetriever;
  private keywordRetriever: KeywordRetriever;

  /**
   * Combine vector and keyword search with fusion
   */
  async retrieve(
    query: string,
    options: HybridRetrieverOptions
  ): Promise<RetrievalResult[]> {
    // 1. Run vector search
    const vectorResults = await this.vectorRetriever.retrieve(query, {
      topK: options.vector.topK,
      threshold: options.vector.similarityThreshold,
    });

    // 2. Run keyword search (BM25)
    const keywordResults = await this.keywordRetriever.retrieve(query, {
      topK: options.keyword.topK,
      algorithm: options.keyword.algorithm,
    });

    // 3. Fuse results
    const fusedResults = this.fuseResults(
      vectorResults,
      keywordResults,
      options.fusion
    );

    return fusedResults;
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   * Combines rankings from multiple retrieval methods
   */
  private fuseResults(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[],
    method: 'reciprocal-rank-fusion' | 'weighted' | 'max'
  ): RetrievalResult[] {
    if (method === 'reciprocal-rank-fusion') {
      return this.reciprocalRankFusion(vectorResults, keywordResults);
    } else if (method === 'weighted') {
      return this.weightedFusion(vectorResults, keywordResults);
    } else {
      return this.maxFusion(vectorResults, keywordResults);
    }
  }

  private reciprocalRankFusion(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const k = 60; // RRF constant
    const scores = new Map<string, number>();
    const documents = new Map<string, RetrievalResult>();

    // Add vector results
    vectorResults.forEach((result, index) => {
      const score = 1 / (k + index + 1);
      scores.set(result.id, (scores.get(result.id) || 0) + score);
      documents.set(result.id, result);
    });

    // Add keyword results
    keywordResults.forEach((result, index) => {
      const score = 1 / (k + index + 1);
      scores.set(result.id, (scores.get(result.id) || 0) + score);
      if (!documents.has(result.id)) {
        documents.set(result.id, result);
      }
    });

    // Sort by fused score
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds.map(id => ({
      ...documents.get(id)!,
      score: scores.get(id)!,
    }));
  }
}
```

### 2. BM25 Keyword Search

```typescript
// packages/rag-advanced/src/retrieval/keyword.ts

export class KeywordRetriever implements Retriever {
  /**
   * BM25 (Best Match 25) ranking function
   */
  async retrieve(query: string, options: KeywordRetrieverOptions): Promise<RetrievalResult[]> {
    const queryTerms = this.tokenize(query);
    const scores = new Map<string, number>();

    for (const doc of this.documents) {
      const score = this.calculateBM25Score(queryTerms, doc);
      if (score > 0) {
        scores.set(doc.id, score);
      }
    }

    // Sort by score
    const sortedDocs = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.topK)
      .map(([id, score]) => ({
        id,
        chunk: this.documents.find(d => d.id === id)!,
        score,
        metadata: {},
      }));

    return sortedDocs;
  }

  private calculateBM25Score(queryTerms: string[], document: Chunk): number {
    const k1 = 1.5;  // Term frequency saturation parameter
    const b = 0.75;  // Length normalization parameter

    const docLength = document.content.split(/\s+/).length;
    const avgDocLength = this.calculateAvgDocLength();

    let score = 0;

    for (const term of queryTerms) {
      const tf = this.termFrequency(term, document);
      const idf = this.inverseDocumentFrequency(term);

      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  private inverseDocumentFrequency(term: string): number {
    const docsWithTerm = this.documents.filter(doc =>
      doc.content.toLowerCase().includes(term.toLowerCase())
    ).length;

    const totalDocs = this.documents.length;

    return Math.log((totalDocs - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
  }

  private termFrequency(term: string, document: Chunk): number {
    const terms = document.content.toLowerCase().split(/\s+/);
    return terms.filter(t => t === term.toLowerCase()).length;
  }
}
```

---

## Re-ranking

### 1. Cross-Encoder Reranking

```typescript
// packages/rag-advanced/src/reranking/cross-encoder.ts

export class CrossEncoderReranker implements Reranker {
  private model: CrossEncoderModel;

  /**
   * Re-rank documents using cross-encoder model
   * More accurate than bi-encoder but slower
   */
  async rerank(
    query: string,
    documents: RetrievalResult[],
    options: CrossEncoderRerankerOptions
  ): Promise<RetrievalResult[]> {
    // 1. Score each document with cross-encoder
    const scoredDocs = await Promise.all(
      documents.map(async (doc) => {
        const score = await this.model.score(query, doc.chunk.content);
        return { ...doc, rerankScore: score };
      })
    );

    // 2. Sort by rerank score
    const sorted = scoredDocs
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, options.topK);

    // 3. Normalize scores
    const maxScore = sorted[0]?.rerankScore || 1;
    return sorted.map(doc => ({
      ...doc,
      score: doc.rerankScore / maxScore,
    }));
  }
}

/**
 * Cross-encoder model wrapper
 */
class CrossEncoderModel {
  private tokenizer: Tokenizer;
  private model: Model;

  async score(query: string, document: string): Promise<number> {
    // Encode query-document pair
    const inputs = this.tokenizer.encode(`${query} [SEP] ${document}`);

    // Run model
    const outputs = await this.model.forward(inputs);

    // Get relevance score
    return outputs.logits[0];
  }
}
```

### 2. LLM-based Reranking

```typescript
// packages/rag-advanced/src/reranking/llm-reranker.ts

export class LLMReranker implements Reranker {
  /**
   * Use LLM to re-rank documents for relevance
   */
  async rerank(
    query: string,
    documents: RetrievalResult[],
    options: LLMRerankerOptions
  ): Promise<RetrievalResult[]> {
    const prompt = `
Rate the relevance of each document to the query on a scale of 0-10.

Query: ${query}

Documents:
${documents.map((doc, i) => `
[${i}] ${doc.chunk.content.slice(0, 500)}
`).join('\n')}

Output JSON array of scores: [score0, score1, score2, ...]
`;

    const response = await this.llm.complete(prompt, {
      model: options.model || 'claude-haiku',
      temperature: 0,
      responseFormat: { type: 'json_object' },
    });

    const scores = JSON.parse(response);

    // Combine with original scores
    const reranked = documents.map((doc, i) => ({
      ...doc,
      score: scores[i] / 10,
    }));

    return reranked
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK);
  }
}
```

---

## Query Transformation

### 1. Multi-Query Generation

```typescript
// packages/rag-advanced/src/query/multi-query.ts

export class MultiQueryGenerator {
  /**
   * Generate multiple variations of a query
   * to improve recall
   */
  async generate(query: string, options: MultiQueryOptions): Promise<string[]> {
    const prompt = `
Generate ${options.count || 3} different variations of this search query.
Each variation should capture the same intent but use different wording.

Original query: ${query}

Output JSON array of query variations.
`;

    const response = await this.llm.complete(prompt, {
      model: 'claude-haiku',
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    });

    const queries = JSON.parse(response);
    return [query, ...queries]; // Include original
  }

  /**
   * Execute multi-query retrieval and fuse results
   */
  async retrieve(
    query: string,
    retriever: Retriever,
    options: MultiQueryOptions
  ): Promise<RetrievalResult[]> {
    // 1. Generate query variations
    const queries = await this.generate(query, options);

    // 2. Retrieve for each query
    const allResults = await Promise.all(
      queries.map(q => retriever.retrieve(q, options.retrieverOptions))
    );

    // 3. Deduplicate and fuse
    const fused = this.fuseResults(allResults);

    return fused;
  }

  private fuseResults(results: RetrievalResult[][]): RetrievalResult[] {
    const scoreMap = new Map<string, number>();
    const docMap = new Map<string, RetrievalResult>();

    // Aggregate scores
    results.forEach(queryResults => {
      queryResults.forEach(result => {
        const currentScore = scoreMap.get(result.id) || 0;
        scoreMap.set(result.id, currentScore + result.score);
        docMap.set(result.id, result);
      });
    });

    // Sort by aggregated score
    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({
        ...docMap.get(id)!,
        score: score / results.length, // Average
      }));
  }
}
```

### 2. HyDE (Hypothetical Document Embeddings)

```typescript
// packages/rag-advanced/src/query/hyde.ts

export class HyDERetriever {
  /**
   * Generate hypothetical answer, embed it, and search
   * Often more effective than embedding the query directly
   */
  async retrieve(
    query: string,
    retriever: VectorRetriever,
    options: HyDEOptions
  ): Promise<RetrievalResult[]> {
    // 1. Generate hypothetical answer
    const hypotheticalDoc = await this.generateHypotheticalDocument(query);

    // 2. Embed the hypothetical document
    const embedding = await this.embedder.embed(hypotheticalDoc);

    // 3. Search using hypothetical embedding
    const results = await retriever.retrieveByEmbedding(embedding, options);

    return results;
  }

  private async generateHypotheticalDocument(query: string): Promise<string> {
    const prompt = `
Write a detailed, well-informed answer to this question.
The answer should be factual and comprehensive.

Question: ${query}

Answer:
`;

    const response = await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0.3,
      maxTokens: 500,
    });

    return response;
  }
}
```

### 3. Sub-Question Decomposition

```typescript
// packages/rag-advanced/src/query/decomposition.ts

export class QueryDecomposer {
  /**
   * Break complex query into simpler sub-questions
   * Answer each independently, then synthesize
   */
  async decompose(query: string): Promise<SubQuestion[]> {
    const prompt = `
Break this complex question into 2-4 simpler sub-questions.
Each sub-question should be independently answerable.

Question: ${query}

Output JSON array of sub-questions with this format:
[
  { "question": "...", "dependency": null },
  { "question": "...", "dependency": 0 }  // depends on answer to question 0
]
`;

    const response = await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0,
      responseFormat: { type: 'json_object' },
    });

    return JSON.parse(response);
  }

  /**
   * Execute decomposed query with dependency resolution
   */
  async query(
    query: string,
    pipeline: RAGPipeline
  ): Promise<RAGResult> {
    // 1. Decompose query
    const subQuestions = await this.decompose(query);

    // 2. Answer each sub-question in order
    const answers: string[] = [];

    for (const subQ of subQuestions) {
      // Build context from previous answers
      let context = '';
      if (subQ.dependency !== null) {
        context = `Context: ${answers[subQ.dependency]}\n\n`;
      }

      const subQuery = context + subQ.question;
      const result = await pipeline.query({ query: subQuery });
      answers.push(result.answer);
    }

    // 3. Synthesize final answer
    const finalAnswer = await this.synthesize(query, subQuestions, answers);

    return {
      answer: finalAnswer,
      citations: [],
      sources: [],
      metrics: {} as RAGMetrics,
    };
  }

  private async synthesize(
    originalQuery: string,
    subQuestions: SubQuestion[],
    answers: string[]
  ): Promise<string> {
    const prompt = `
Synthesize a comprehensive answer to the original question using the sub-question answers.

Original Question: ${originalQuery}

Sub-Questions and Answers:
${subQuestions.map((q, i) => `
Q${i + 1}: ${q.question}
A${i + 1}: ${answers[i]}
`).join('\n')}

Synthesized Answer:
`;

    return await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0.3,
    });
  }
}
```

---

## Response Synthesis

### 1. Refine Synthesis

```typescript
// packages/rag-advanced/src/synthesis/refine.ts

export class RefineSynthesizer implements Synthesizer {
  /**
   * Iteratively refine answer by processing chunks sequentially
   * Good for detailed, comprehensive answers
   */
  async synthesize(
    query: string,
    chunks: Chunk[],
    options: SynthesizerOptions
  ): Promise<SynthesisResult> {
    let currentAnswer = '';
    const citations: Citation[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const prompt = this.buildRefinePrompt(
        query,
        currentAnswer,
        chunk.content,
        i === 0
      );

      const refined = await this.llm.complete(prompt, {
        model: options.model || 'claude-sonnet-4',
        temperature: 0.3,
      });

      currentAnswer = refined;

      // Track citation
      if (this.chunkWasUsed(refined, chunk.content)) {
        citations.push({
          text: chunk.content.slice(0, 200),
          source: chunk.metadata.source,
          score: chunk.metadata.score || 0,
          chunkId: chunk.id,
        });
      }
    }

    return {
      answer: currentAnswer,
      citations,
    };
  }

  private buildRefinePrompt(
    query: string,
    currentAnswer: string,
    newContext: string,
    isFirst: boolean
  ): string {
    if (isFirst) {
      return `
Answer this question using the provided context.

Question: ${query}

Context:
${newContext}

Answer:
`;
    } else {
      return `
You previously answered this question. Refine your answer using new context.

Question: ${query}

Current Answer:
${currentAnswer}

New Context:
${newContext}

Refined Answer (improve if new context adds value, otherwise keep current answer):
`;
    }
  }

  private chunkWasUsed(answer: string, chunkContent: string): boolean {
    // Simple heuristic: check if any significant phrases from chunk appear in answer
    const chunkPhrases = this.extractPhrases(chunkContent, 4); // 4-word phrases
    const answerLower = answer.toLowerCase();

    return chunkPhrases.some(phrase =>
      answerLower.includes(phrase.toLowerCase())
    );
  }
}
```

### 2. Tree Summarize

```typescript
// packages/rag-advanced/src/synthesis/tree-summarize.ts

export class TreeSummarizeSynthesizer implements Synthesizer {
  /**
   * Hierarchically summarize chunks in a tree structure
   * Good for handling many chunks efficiently
   */
  async synthesize(
    query: string,
    chunks: Chunk[],
    options: SynthesizerOptions
  ): Promise<SynthesisResult> {
    // 1. Group chunks into batches
    const batchSize = 4;
    const batches = this.batchChunks(chunks, batchSize);

    // 2. Summarize each batch
    let currentLevel = await Promise.all(
      batches.map(batch => this.summarizeBatch(query, batch))
    );

    // 3. Recursively summarize until we have one answer
    while (currentLevel.length > 1) {
      const nextBatches = this.batchChunks(
        currentLevel.map(text => ({ content: text } as Chunk)),
        batchSize
      );

      currentLevel = await Promise.all(
        nextBatches.map(batch => this.summarizeBatch(query, batch))
      );
    }

    const finalAnswer = currentLevel[0];

    // Extract citations from original chunks
    const citations = this.extractCitations(finalAnswer, chunks);

    return {
      answer: finalAnswer,
      citations,
    };
  }

  private async summarizeBatch(query: string, chunks: Chunk[]): Promise<string> {
    const combinedContext = chunks.map(c => c.content).join('\n\n---\n\n');

    const prompt = `
Answer this question using the provided context chunks.

Question: ${query}

Context:
${combinedContext}

Answer:
`;

    return await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0.3,
    });
  }

  private batchChunks(chunks: Chunk[], batchSize: number): Chunk[][] {
    const batches: Chunk[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize));
    }

    return batches;
  }
}
```

### 3. Streaming Synthesis

```typescript
// packages/rag-advanced/src/synthesis/streaming.ts

export class StreamingSynthesizer implements Synthesizer {
  /**
   * Stream answer generation for real-time UX
   */
  async *synthesizeStream(
    query: string,
    chunks: Chunk[],
    options: SynthesizerOptions
  ): AsyncGenerator<string, void, unknown> {
    const context = chunks.map(c => c.content).join('\n\n---\n\n');

    const prompt = `
Answer this question using the provided context.

Question: ${query}

Context:
${context}

Answer:
`;

    const stream = await this.llm.stream(prompt, {
      model: options.model || 'claude-sonnet-4',
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
```

---

## Citation Management

```typescript
// packages/rag-advanced/src/synthesis/citations.ts

export class CitationManager {
  /**
   * Add inline citations to answer
   */
  addInlineCitations(answer: string, citations: Citation[]): string {
    let annotated = answer;
    const citationMap = new Map<string, number>();

    // Track unique sources
    citations.forEach(citation => {
      if (!citationMap.has(citation.source)) {
        citationMap.set(citation.source, citationMap.size + 1);
      }
    });

    // Add citation numbers inline
    citations.forEach(citation => {
      const citationNum = citationMap.get(citation.source)!;
      const snippet = citation.text.slice(0, 50);

      // Find where this content appears in answer
      const regex = new RegExp(this.escapeRegex(snippet), 'i');
      annotated = annotated.replace(regex, `$& [${citationNum}]`);
    });

    return annotated;
  }

  /**
   * Generate references section
   */
  generateReferences(citations: Citation[]): string {
    const uniqueSources = this.getUniqueSources(citations);

    const references = uniqueSources.map((source, i) => {
      return `[${i + 1}] ${source.title || source.url || source.id}`;
    });

    return `\n\n## References\n\n${references.join('\n')}`;
  }

  /**
   * Validate citations match sources
   */
  validateCitations(answer: string, chunks: Chunk[]): ValidationResult {
    const claims = this.extractClaims(answer);
    const validated: ClaimValidation[] = [];

    for (const claim of claims) {
      const supportingChunks = chunks.filter(chunk =>
        this.claimSupportedByChunk(claim, chunk)
      );

      validated.push({
        claim,
        supported: supportingChunks.length > 0,
        sources: supportingChunks.map(c => c.metadata.source),
        confidence: supportingChunks.length > 0 ? 0.9 : 0.1,
      });
    }

    return {
      claims: validated,
      overallSupport: validated.filter(v => v.supported).length / validated.length,
    };
  }

  private claimSupportedByChunk(claim: string, chunk: Chunk): boolean {
    // Use semantic similarity to check if chunk supports claim
    const similarity = this.calculateSimilarity(claim, chunk.content);
    return similarity > 0.75;
  }
}
```

---

## RAG Evaluation

```typescript
// packages/rag-advanced/src/evaluation/metrics.ts

export class RAGEvaluator {
  /**
   * Evaluate RAG system performance
   */
  async evaluate(
    pipeline: RAGPipeline,
    dataset: EvaluationDataset
  ): Promise<EvaluationResult> {
    const results: QuestionResult[] = [];

    for (const item of dataset.questions) {
      const result = await pipeline.query({ query: item.question });

      const metrics = await this.evaluateAnswer(
        item.question,
        result.answer,
        item.groundTruth,
        result.citations
      );

      results.push({
        question: item.question,
        answer: result.answer,
        groundTruth: item.groundTruth,
        metrics,
      });
    }

    return this.aggregateResults(results);
  }

  /**
   * Evaluate single answer
   */
  private async evaluateAnswer(
    question: string,
    answer: string,
    groundTruth: string,
    citations: Citation[]
  ): Promise<AnswerMetrics> {
    return {
      relevance: await this.calculateRelevance(question, answer),
      correctness: await this.calculateCorrectness(answer, groundTruth),
      completeness: await this.calculateCompleteness(answer, groundTruth),
      coherence: await this.calculateCoherence(answer),
      citationPrecision: this.calculateCitationPrecision(citations),
      citationRecall: this.calculateCitationRecall(citations, groundTruth),
    };
  }

  /**
   * Answer Relevance: Does the answer address the question?
   */
  private async calculateRelevance(question: string, answer: string): Promise<number> {
    const prompt = `
Rate how well this answer addresses the question on a scale of 0-10.

Question: ${question}

Answer: ${answer}

Score (0-10):
`;

    const response = await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0,
    });

    return parseInt(response) / 10;
  }

  /**
   * Answer Correctness: Is the answer factually correct?
   */
  private async calculateCorrectness(answer: string, groundTruth: string): Promise<number> {
    const prompt = `
Compare the answer to the ground truth. Rate correctness on a scale of 0-10.

Answer: ${answer}

Ground Truth: ${groundTruth}

Score (0-10):
`;

    const response = await this.llm.complete(prompt, {
      model: 'claude-sonnet-4',
      temperature: 0,
    });

    return parseInt(response) / 10;
  }

  /**
   * Context Precision: Are retrieved chunks relevant?
   */
  calculateCitationPrecision(citations: Citation[]): number {
    const relevantCitations = citations.filter(c => c.score > 0.7);
    return relevantCitations.length / citations.length;
  }

  /**
   * Context Recall: Did we retrieve all relevant chunks?
   */
  calculateCitationRecall(citations: Citation[], groundTruth: string): number {
    // Count how many facts from ground truth are covered by citations
    const facts = this.extractFacts(groundTruth);
    const coveredFacts = facts.filter(fact =>
      citations.some(c => c.text.includes(fact))
    );

    return coveredFacts.length / facts.length;
  }
}
```

---

## Pipeline Builder & Presets

```typescript
// packages/rag-advanced/src/pipeline/presets.ts

/**
 * Pre-configured RAG pipelines for common use cases
 */
export const RAGPresets = {
  /**
   * Fast: Optimized for speed
   */
  fast: createRAGPipeline({
    chunker: chunkers.recursive({
      chunkSize: 512,
      overlap: 50,
    }),
    retriever: retrievers.vector({
      topK: 5,
    }),
    synthesizer: {
      type: 'compact',
      model: 'claude-haiku',
    },
  }),

  /**
   * Accurate: Optimized for quality
   */
  accurate: createRAGPipeline({
    chunker: chunkers.semantic({
      chunkSize: 512,
      overlap: 50,
    }),
    retriever: retrievers.hybrid({
      vector: { topK: 20 },
      keyword: { topK: 10 },
      fusion: 'reciprocal-rank-fusion',
    }),
    reranker: rerankers.crossEncoder({
      topK: 5,
    }),
    queryTransformer: {
      multiQuery: true,
      hypotheticalAnswer: true,
    },
    synthesizer: {
      type: 'refine',
      model: 'claude-sonnet-4',
      citations: true,
    },
  }),

  /**
   * Balanced: Good speed and quality
   */
  balanced: createRAGPipeline({
    chunker: chunkers.markdown({
      chunkSize: 512,
      overlap: 50,
    }),
    retriever: retrievers.hybrid({
      vector: { topK: 10 },
      keyword: { topK: 5 },
    }),
    reranker: rerankers.llm({
      topK: 5,
      model: 'claude-haiku',
    }),
    synthesizer: {
      type: 'tree-summarize',
      model: 'claude-sonnet-4',
      citations: true,
    },
  }),

  /**
   * Code: Optimized for code search
   */
  code: createRAGPipeline({
    chunker: chunkers.code({
      language: 'typescript',
      chunkSize: 1024,
    }),
    retriever: retrievers.hybrid({
      vector: { topK: 15 },
      keyword: { topK: 10 },
    }),
    reranker: rerankers.crossEncoder({
      model: 'code-search-net',
      topK: 5,
    }),
    synthesizer: {
      type: 'refine',
      model: 'claude-sonnet-4',
      citations: true,
    },
  }),
};
```

---

## React Hooks

```typescript
// packages/rag-advanced/src/react/hooks.ts

/**
 * Hook for RAG queries
 */
export function useRAG(pipeline: RAGPipeline) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const query = useCallback(
    async (q: string, options?: QueryOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await pipeline.query({ query: q, ...options });
        setResult(result);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [pipeline]
  );

  return { query, result, isLoading, error };
}

/**
 * Hook for streaming RAG
 */
export function useRAGStream(pipeline: RAGPipeline) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  const queryStream = useCallback(
    async (q: string, options?: QueryOptions) => {
      setIsStreaming(true);
      setChunks([]);

      try {
        const stream = await pipeline.queryStream({ query: q, ...options });

        for await (const chunk of stream) {
          if (chunk.type === 'content') {
            setChunks(prev => [...prev, chunk.data]);
          } else if (chunk.type === 'citation') {
            setCitations(prev => [...prev, chunk.data]);
          }
        }
      } catch (err) {
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    [pipeline]
  );

  return {
    queryStream,
    answer: chunks.join(''),
    citations,
    isStreaming,
  };
}
```

---

## CLI Commands

```bash
# Initialize RAG
rana rag init --index docs --source ./docs

# Index documents
rana rag index ./docs --chunker semantic --chunk-size 512

# Query
rana rag query "How does RANA handle authentication?"

# Evaluate
rana rag eval --dataset ./test-questions.json --output report.html

# Optimize
rana rag optimize --metric latency --target 1000ms

# Analytics
rana rag analytics --last 30d
```

---

## Implementation Plan

### Phase 1: Core Chunking & Retrieval (Weeks 1-3)
- Semantic chunking
- Markdown chunking
- Code chunking
- Hybrid retrieval (vector + BM25)
- CLI basics

### Phase 2: Re-ranking & Query Transform (Weeks 4-6)
- Cross-encoder reranking
- Multi-query generation
- HyDE retrieval
- Query decomposition

### Phase 3: Synthesis & Citations (Weeks 7-8)
- Refine synthesis
- Tree summarize
- Streaming synthesis
- Citation tracking

### Phase 4: Evaluation & Optimization (Weeks 9-10)
- RAG evaluation metrics
- Benchmark datasets
- Auto-optimization
- Analytics dashboard

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Answer relevance | > 0.85 |
| Answer correctness | > 0.90 |
| Citation precision | > 0.80 |
| Avg query latency | < 2s |
| Cost per query | < $0.05 |
| User satisfaction | > 4.5/5 |

---

**Status**: Draft Specification
**Version**: 1.0
**Last Updated**: 2025-11-25
