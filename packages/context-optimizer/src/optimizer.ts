/**
 * @rana/context-optimizer - Context Optimizer
 */

import type {
  ContextOptimizerConfig,
  OptimizeOptions,
  OptimizationResult,
  FileMetadata,
  FilePriority,
  OptimizationStrategy,
  ContextChunk,
} from './types';

/**
 * Simple token counter (approximation)
 * In production, use tiktoken or similar
 */
function defaultTokenCounter(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Default summarization (simple truncation)
 * In production, use LLM-based summarization
 */
async function defaultSummarize(text: string, targetTokens: number): Promise<string> {
  const currentTokens = defaultTokenCounter(text);

  if (currentTokens <= targetTokens) {
    return text;
  }

  // Simple truncation with ellipsis
  const targetChars = targetTokens * 4;
  return text.substring(0, targetChars) + '\n\n[Content truncated...]';
}

/**
 * ContextOptimizer - Efficiently handle extended context windows
 */
export class ContextOptimizer {
  private config: Required<ContextOptimizerConfig>;
  private cache: Map<string, OptimizationResult> = new Map();

  constructor(config: ContextOptimizerConfig = {}) {
    this.config = {
      maxTokens: config.maxTokens ?? 400000,
      strategy: config.strategy ?? 'hybrid',
      costTarget: config.costTarget ?? 'balanced',
      preserveCritical: config.preserveCritical ?? true,
      summarizeOld: config.summarizeOld ?? true,
      enableCache: config.enableCache ?? true,
      prioritize: config.prioritize ?? this.defaultPrioritize.bind(this),
      scoreRelevance: config.scoreRelevance ?? this.defaultScoreRelevance.bind(this),
      countTokens: config.countTokens ?? defaultTokenCounter,
      summarize: config.summarize ?? defaultSummarize,
    };
  }

  /**
   * Optimize context for extended windows
   */
  async optimize(options: OptimizeOptions): Promise<OptimizationResult> {
    const {
      query = '',
      codebase,
      includeFiles = [],
      excludeFiles = [],
      preserveFiles = [],
      additionalContext = '',
      targetTokens,
    } = options;

    // Check cache
    const cacheKey = this.getCacheKey(options);
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Load and analyze files
    const files = await this.loadFiles(codebase, includeFiles, excludeFiles);

    // Prioritize files
    const prioritized = await this.prioritizeFiles(files, query, preserveFiles);

    // Calculate token budget
    const budget = targetTokens ?? this.config.maxTokens;

    // Optimize based on strategy
    let result: OptimizationResult;

    switch (this.config.strategy) {
      case 'full':
        result = await this.optimizeFull(prioritized, budget, query);
        break;

      case 'rag':
        result = await this.optimizeRAG(prioritized, budget, query);
        break;

      case 'summarize':
        result = await this.optimizeSummarize(prioritized, budget, query);
        break;

      case 'prioritize':
        result = await this.optimizePrioritize(prioritized, budget, query);
        break;

      case 'hybrid':
      default:
        result = await this.optimizeHybrid(prioritized, budget, query, additionalContext);
        break;
    }

    // Add additional context if provided
    if (additional Context) {
      const contextTokens = this.config.countTokens(additionalContext);
      if (result.tokensUsed + contextTokens <= budget) {
        result.messages.unshift({
          role: 'system',
          content: additionalContext,
        });
        result.tokensUsed += contextTokens;
      }
    }

    // Cache result
    if (this.config.enableCache) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Hybrid optimization: Smart mix of strategies
   */
  private async optimizeHybrid(
    files: FileMetadata[],
    budget: number,
    query: string,
    additionalContext: string
  ): Promise<OptimizationResult> {
    const chunks: ContextChunk[] = [];
    let tokensUsed = 0;
    const originalTokens = files.reduce((sum, f) => sum + f.tokens, 0);

    const fullFiles: string[] = [];
    const summarizedFiles: string[] = [];
    const excludedFiles: string[] = [];

    // Phase 1: Include critical files in full
    const critical = files.filter(f => f.priority === 'critical');
    for (const file of critical) {
      if (tokensUsed + file.tokens <= budget * 0.6) { // Reserve 60% for critical
        chunks.push({
          content: file.content,
          tokens: file.tokens,
          source: file.path,
          type: 'full',
          relevance: file.relevance ?? 1.0,
        });
        tokensUsed += file.tokens;
        fullFiles.push(file.path);
      } else {
        // Summarize if too large
        const summary = await this.config.summarize(file.content, Math.floor(file.tokens * 0.3));
        const summaryTokens = this.config.countTokens(summary);
        chunks.push({
          content: summary,
          tokens: summaryTokens,
          source: file.path,
          type: 'summary',
          relevance: file.relevance ?? 1.0,
        });
        tokensUsed += summaryTokens;
        summarizedFiles.push(file.path);
      }
    }

    // Phase 2: Add important files (full or summarized)
    const important = files.filter(f => f.priority === 'important');
    for (const file of important) {
      const remaining = budget - tokensUsed;

      if (remaining <= 0) break;

      if (file.tokens <= remaining) {
        // Include in full
        chunks.push({
          content: file.content,
          tokens: file.tokens,
          source: file.path,
          type: 'full',
          relevance: file.relevance ?? 0.8,
        });
        tokensUsed += file.tokens;
        fullFiles.push(file.path);
      } else if (remaining > 100) {
        // Summarize
        const summary = await this.config.summarize(file.content, Math.floor(remaining * 0.5));
        const summaryTokens = this.config.countTokens(summary);
        chunks.push({
          content: summary,
          tokens: summaryTokens,
          source: file.path,
          type: 'summary',
          relevance: file.relevance ?? 0.8,
        });
        tokensUsed += summaryTokens;
        summarizedFiles.push(file.path);
      } else {
        excludedFiles.push(file.path);
      }
    }

    // Phase 3: Add supplementary files (metadata only or brief summary)
    const supplementary = files.filter(f => f.priority === 'supplementary');
    for (const file of supplementary) {
      const remaining = budget - tokensUsed;

      if (remaining <= 50) break;

      // Add metadata or brief summary
      const metadata = `File: ${file.path}\nType: ${file.type ?? 'unknown'}\nTokens: ${file.tokens}`;
      const metadataTokens = this.config.countTokens(metadata);

      if (metadataTokens <= remaining) {
        chunks.push({
          content: metadata,
          tokens: metadataTokens,
          source: file.path,
          type: 'metadata',
          relevance: file.relevance ?? 0.5,
        });
        tokensUsed += metadataTokens;
        summarizedFiles.push(file.path);
      } else {
        excludedFiles.push(file.path);
      }
    }

    // Build messages
    const systemMessage = this.buildSystemMessage(chunks, query);
    const messages = [{ role: 'system', content: systemMessage }];

    // Calculate metrics
    const costSaved = ((originalTokens - tokensUsed) / originalTokens) * 100;
    const qualityScore = this.calculateQualityScore(chunks, files);

    return {
      messages,
      context: {
        fullFiles,
        summarizedFiles,
        excludedFiles,
        totalFiles: files.length,
      },
      tokensUsed,
      originalTokens,
      costSaved: Math.max(0, costSaved),
      qualityScore,
      strategy: 'hybrid',
    };
  }

  /**
   * Full context optimization
   */
  private async optimizeFull(
    files: FileMetadata[],
    budget: number,
    query: string
  ): Promise<OptimizationResult> {
    const chunks: ContextChunk[] = [];
    let tokensUsed = 0;
    const originalTokens = files.reduce((sum, f) => sum + f.tokens, 0);

    const fullFiles: string[] = [];
    const excludedFiles: string[] = [];

    for (const file of files) {
      if (tokensUsed + file.tokens <= budget) {
        chunks.push({
          content: file.content,
          tokens: file.tokens,
          source: file.path,
          type: 'full',
          relevance: file.relevance ?? 1.0,
        });
        tokensUsed += file.tokens;
        fullFiles.push(file.path);
      } else {
        excludedFiles.push(file.path);
      }
    }

    const systemMessage = this.buildSystemMessage(chunks, query);

    return {
      messages: [{ role: 'system', content: systemMessage }],
      context: {
        fullFiles,
        summarizedFiles: [],
        excludedFiles,
        totalFiles: files.length,
      },
      tokensUsed,
      originalTokens,
      costSaved: ((originalTokens - tokensUsed) / originalTokens) * 100,
      qualityScore: fullFiles.length / files.length,
      strategy: 'full',
    };
  }

  /**
   * RAG-based optimization
   */
  private async optimizeRAG(
    files: FileMetadata[],
    budget: number,
    query: string
  ): Promise<OptimizationResult> {
    // Sort by relevance
    const sorted = [...files].sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

    const chunks: ContextChunk[] = [];
    let tokensUsed = 0;
    const originalTokens = files.reduce((sum, f) => sum + f.tokens, 0);

    const fullFiles: string[] = [];
    const excludedFiles: string[] = [];

    // Take top-k most relevant
    for (const file of sorted) {
      if (tokensUsed + file.tokens <= budget) {
        chunks.push({
          content: file.content,
          tokens: file.tokens,
          source: file.path,
          type: 'full',
          relevance: file.relevance ?? 0,
        });
        tokensUsed += file.tokens;
        fullFiles.push(file.path);
      } else {
        excludedFiles.push(file.path);
      }
    }

    const systemMessage = this.buildSystemMessage(chunks, query);

    return {
      messages: [{ role: 'system', content: systemMessage }],
      context: {
        fullFiles,
        summarizedFiles: [],
        excludedFiles,
        totalFiles: files.length,
      },
      tokensUsed,
      originalTokens,
      costSaved: ((originalTokens - tokensUsed) / originalTokens) * 100,
      qualityScore: this.calculateQualityScore(chunks, files),
      strategy: 'rag',
    };
  }

  /**
   * Summarization-based optimization
   */
  private async optimizeSummarize(
    files: FileMetadata[],
    budget: number,
    query: string
  ): Promise<OptimizationResult> {
    const chunks: ContextChunk[] = [];
    let tokensUsed = 0;
    const originalTokens = files.reduce((sum, f) => sum + f.tokens, 0);

    const summarizedFiles: string[] = [];

    // Distribute budget proportionally
    const totalOriginal = files.reduce((sum, f) => sum + f.tokens, 0);

    for (const file of files) {
      const targetTokens = Math.floor((file.tokens / totalOriginal) * budget);
      const summary = await this.config.summarize(file.content, targetTokens);
      const summaryTokens = this.config.countTokens(summary);

      chunks.push({
        content: summary,
        tokens: summaryTokens,
        source: file.path,
        type: 'summary',
        relevance: file.relevance ?? 0.5,
      });

      tokensUsed += summaryTokens;
      summarizedFiles.push(file.path);
    }

    const systemMessage = this.buildSystemMessage(chunks, query);

    return {
      messages: [{ role: 'system', content: systemMessage }],
      context: {
        fullFiles: [],
        summarizedFiles,
        excludedFiles: [],
        totalFiles: files.length,
      },
      tokensUsed,
      originalTokens,
      costSaved: ((originalTokens - tokensUsed) / originalTokens) * 100,
      qualityScore: 0.6, // Summaries reduce quality
      strategy: 'summarize',
    };
  }

  /**
   * Prioritization-based optimization
   */
  private async optimizePrioritize(
    files: FileMetadata[],
    budget: number,
    query: string
  ): Promise<OptimizationResult> {
    // Similar to hybrid but stricter about priority
    return this.optimizeHybrid(files, budget, query, '');
  }

  /**
   * Build system message from chunks
   */
  private buildSystemMessage(chunks: ContextChunk[], query: string): string {
    const parts: string[] = [];

    if (query) {
      parts.push(`Task: ${query}\n`);
    }

    parts.push('Context:\n');

    // Group by type
    const fullChunks = chunks.filter(c => c.type === 'full');
    const summaryChunks = chunks.filter(c => c.type === 'summary');
    const metadataChunks = chunks.filter(c => c.type === 'metadata');

    if (fullChunks.length > 0) {
      parts.push('\nFull Files:\n');
      fullChunks.forEach(chunk => {
        parts.push(`\n--- ${chunk.source} ---\n${chunk.content}\n`);
      });
    }

    if (summaryChunks.length > 0) {
      parts.push('\nSummarized Files:\n');
      summaryChunks.forEach(chunk => {
        parts.push(`\n--- ${chunk.source} (summarized) ---\n${chunk.content}\n`);
      });
    }

    if (metadataChunks.length > 0) {
      parts.push('\nFile Metadata:\n');
      metadataChunks.forEach(chunk => {
        parts.push(`${chunk.content}\n`);
      });
    }

    return parts.join('');
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(chunks: ContextChunk[], allFiles: FileMetadata[]): number {
    if (allFiles.length === 0) return 1.0;

    // Weight by type and relevance
    const weights = { full: 1.0, summary: 0.6, metadata: 0.3 };

    const totalPossible = allFiles.reduce((sum, f) => sum + (f.relevance ?? 0.5), 0);
    const achieved = chunks.reduce((sum, c) => {
      const weight = weights[c.type];
      return sum + c.relevance * weight;
    }, 0);

    return Math.min(1.0, achieved / totalPossible);
  }

  /**
   * Default prioritization
   */
  private defaultPrioritize(file: FileMetadata, query: string): FilePriority {
    // Simple heuristic - in production, use more sophisticated logic
    const queryLower = query.toLowerCase();
    const pathLower = file.path.toLowerCase();

    // Entry points are critical
    if (pathLower.includes('index.') || pathLower.includes('main.')) {
      return 'critical';
    }

    // Test files are supplementary
    if (pathLower.includes('.test.') || pathLower.includes('.spec.')) {
      return 'supplementary';
    }

    // Config files are supplementary
    if (pathLower.includes('config') || pathLower.includes('.json')) {
      return 'supplementary';
    }

    // Files matching query are important
    if (query && pathLower.includes(queryLower)) {
      return 'important';
    }

    return 'important';
  }

  /**
   * Default relevance scoring
   */
  private defaultScoreRelevance(file: FileMetadata, query: string): number {
    if (!query) return 0.5;

    const queryLower = query.toLowerCase();
    const pathLower = file.path.toLowerCase();
    const contentLower = file.content.toLowerCase();

    let score = 0;

    // Path match
    if (pathLower.includes(queryLower)) {
      score += 0.4;
    }

    // Content match
    const matches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    score += Math.min(0.6, matches * 0.1);

    return Math.min(1.0, score);
  }

  /**
   * Load files from codebase or array
   */
  private async loadFiles(
    codebase: string | FileMetadata[] | undefined,
    includeFiles: string[],
    excludeFiles: string[]
  ): Promise<FileMetadata[]> {
    // If array provided, use it
    if (Array.isArray(codebase)) {
      return codebase.filter(f => !excludeFiles.includes(f.path));
    }

    // Otherwise, would scan directory (not implemented in this example)
    // In production, use fs to scan codebase directory
    return [];
  }

  /**
   * Prioritize files
   */
  private async prioritizeFiles(
    files: FileMetadata[],
    query: string,
    preserveFiles: string[]
  ): Promise<FileMetadata[]> {
    return files.map(file => {
      // Override priority for preserved files
      if (preserveFiles.includes(file.path)) {
        file.priority = 'critical';
      } else if (!file.priority) {
        file.priority = this.config.prioritize(file, query);
      }

      // Score relevance if not set
      if (file.relevance === undefined) {
        file.relevance = this.config.scoreRelevance(file, query);
      }

      return file;
    });
  }

  /**
   * Get cache key
   */
  private getCacheKey(options: OptimizeOptions): string {
    return JSON.stringify({
      query: options.query,
      codebase: Array.isArray(options.codebase)
        ? options.codebase.map(f => f.path).sort()
        : options.codebase,
      includeFiles: options.includeFiles?.sort(),
      excludeFiles: options.excludeFiles?.sort(),
      targetTokens: options.targetTokens,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a context optimizer instance
 */
export function createContextOptimizer(config?: ContextOptimizerConfig): ContextOptimizer {
  return new ContextOptimizer(config);
}
