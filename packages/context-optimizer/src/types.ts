/**
 * @rana/context-optimizer - Type definitions
 */

/**
 * Optimization strategy
 */
export type OptimizationStrategy =
  | 'hybrid'       // Smart mix of full context + RAG + summarization
  | 'full'         // Use entire context (up to limit)
  | 'rag'          // RAG-only retrieval
  | 'summarize'    // Summarize and compress
  | 'prioritize';  // Keep only most relevant

/**
 * Cost target for optimization
 */
export type CostTarget =
  | 'cost'      // Minimize cost (may reduce quality)
  | 'balanced'  // Balance cost and quality
  | 'quality';  // Maximize quality (higher cost)

/**
 * File priority level
 */
export type FilePriority =
  | 'critical'      // Must include in full
  | 'important'     // Include if space allows
  | 'supplementary' // Summarize or exclude
  | 'exclude';      // Never include

/**
 * File metadata for prioritization
 */
export interface FileMetadata {
  /** File path */
  path: string;

  /** File content */
  content: string;

  /** Token count */
  tokens: number;

  /** Priority level */
  priority: FilePriority;

  /** Relevance score (0-1) */
  relevance?: number;

  /** Last modified */
  lastModified?: Date;

  /** File type */
  type?: string;

  /** Dependencies */
  dependencies?: string[];
}

/**
 * Context chunk
 */
export interface ContextChunk {
  /** Chunk content */
  content: string;

  /** Token count */
  tokens: number;

  /** Source file */
  source: string;

  /** Chunk type */
  type: 'full' | 'summary' | 'metadata';

  /** Relevance score */
  relevance: number;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Optimized messages */
  messages: Array<{ role: string; content: string }>;

  /** Structured context */
  context: {
    /** Files included in full */
    fullFiles: string[];

    /** Files summarized */
    summarizedFiles: string[];

    /** Files excluded */
    excludedFiles: string[];

    /** Total files processed */
    totalFiles: number;
  };

  /** Token usage */
  tokensUsed: number;

  /** Original token count (before optimization) */
  originalTokens: number;

  /** Cost saved (percentage) */
  costSaved: number;

  /** Quality score (0-1) */
  qualityScore: number;

  /** Strategy used */
  strategy: OptimizationStrategy;

  /** Warnings/notes */
  warnings?: string[];
}

/**
 * Codebase analysis result
 */
export interface CodebaseAnalysis {
  /** Total files */
  totalFiles: number;

  /** Total tokens */
  totalTokens: number;

  /** Files by priority */
  filesByPriority: {
    critical: FileMetadata[];
    important: FileMetadata[];
    supplementary: FileMetadata[];
    exclude: FileMetadata[];
  };

  /** Dependencies graph */
  dependencies: Record<string, string[]>;

  /** Entry points */
  entryPoints: string[];
}

/**
 * Context optimizer configuration
 */
export interface ContextOptimizerConfig {
  /** Maximum tokens allowed */
  maxTokens?: number;

  /** Optimization strategy */
  strategy?: OptimizationStrategy;

  /** Cost target */
  costTarget?: CostTarget;

  /** Preserve critical files in full */
  preserveCritical?: boolean;

  /** Summarize old/less relevant content */
  summarizeOld?: boolean;

  /** Enable caching */
  enableCache?: boolean;

  /** Custom prioritization function */
  prioritize?: (file: FileMetadata, query: string) => FilePriority;

  /** Custom relevance scoring */
  scoreRelevance?: (file: FileMetadata, query: string) => number;

  /** Token counting function */
  countTokens?: (text: string) => number;

  /** Summarization function */
  summarize?: (text: string, targetTokens: number) => Promise<string>;
}

/**
 * Optimization options
 */
export interface OptimizeOptions {
  /** Query/task description */
  query?: string;

  /** Codebase path or files */
  codebase?: string | FileMetadata[];

  /** Specific files to include */
  includeFiles?: string[];

  /** Files to exclude */
  excludeFiles?: string[];

  /** Preserve specific files in full */
  preserveFiles?: string[];

  /** Additional context */
  additionalContext?: string;

  /** Target token count */
  targetTokens?: number;
}

/**
 * Summarization options
 */
export interface SummarizationOptions {
  /** Target token count */
  targetTokens: number;

  /** Preserve structure (headings, etc.) */
  preserveStructure?: boolean;

  /** Keep code examples */
  keepExamples?: boolean;

  /** Focus areas */
  focus?: string[];
}
