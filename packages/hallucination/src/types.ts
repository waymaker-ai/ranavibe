/**
 * @waymakerai/aicofounder-hallucination - Type definitions
 */

/**
 * A source document used for grounding verification
 */
export interface Source {
  /** Unique identifier for the source */
  id: string;

  /** The text content of the source */
  content: string;

  /** Optional title/name of the source */
  title?: string;

  /** Optional URL or path to the source */
  url?: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A factual claim extracted from a response
 */
export interface Claim {
  /** The text of the claim */
  text: string;

  /** Position (sentence index) in the original response */
  sentenceIndex: number;

  /** Start character offset in the original response */
  startOffset: number;

  /** End character offset in the original response */
  endOffset: number;

  /** Whether this appears to be a factual claim (vs opinion, question, etc.) */
  isFactual: boolean;

  /** Claim type classification */
  type: ClaimType;
}

/**
 * Classification of a claim
 */
export type ClaimType =
  | 'factual'       // A verifiable statement of fact
  | 'quantitative'  // A claim involving numbers, dates, measurements
  | 'attribution'   // A claim attributing something to someone
  | 'causal'        // A claim about cause and effect
  | 'comparative'   // A comparison between things
  | 'procedural'    // A claim about how something works or is done
  | 'definitional'  // A definition or classification
  | 'opinion'       // An opinion or subjective statement
  | 'meta';         // A meta-statement about the response itself

/**
 * Result of verifying a single claim against sources
 */
export interface ClaimVerification {
  /** The claim that was verified */
  claim: Claim;

  /** Whether the claim is supported by sources */
  supported: boolean;

  /** Confidence score (0-1) of the verification */
  confidence: number;

  /** Best matching source, if any */
  bestSource?: SourceMatch;

  /** All source matches above threshold */
  sourceMatches: SourceMatch[];

  /** Reason for the verdict */
  reason: string;
}

/**
 * A match between a claim and a source passage
 */
export interface SourceMatch {
  /** The source document */
  source: Source;

  /** The matching passage from the source */
  passage: string;

  /** Overlap score (0-1) based on TF-IDF-like scoring */
  overlapScore: number;

  /** Token-level similarity score (0-1) */
  tokenSimilarity: number;

  /** Combined score */
  combinedScore: number;
}

/**
 * Overall result of hallucination detection
 */
export interface HallucinationResult {
  /** Grounding score (0-1): what fraction of factual claims are supported */
  groundingScore: number;

  /** Whether the response passes the grounding threshold */
  grounded: boolean;

  /** Total number of claims extracted */
  totalClaims: number;

  /** Number of factual claims */
  factualClaims: number;

  /** Number of supported claims */
  supportedClaims: number;

  /** Number of unsupported claims */
  unsupportedClaims: number;

  /** Number of partially supported claims */
  partiallySupportedClaims: number;

  /** All claims with their verification results */
  claims: ClaimVerification[];

  /** Claims that were not supported by any source */
  ungroundedClaims: ClaimVerification[];

  /** Summary of the analysis */
  summary: string;
}

/**
 * Configuration for the hallucination detector
 */
export interface HallucinationConfig {
  /** Minimum grounding score to consider response as grounded (default: 0.7) */
  groundingThreshold?: number;

  /** Minimum score for a source match to count as supporting (default: 0.3) */
  supportThreshold?: number;

  /** Score above which a match is considered strong support (default: 0.6) */
  strongSupportThreshold?: number;

  /** Whether to skip non-factual claims in scoring (default: true) */
  skipNonFactual?: boolean;

  /** Maximum number of source chunks to compare per claim (default: 50) */
  maxChunksPerClaim?: number;

  /** Chunk size in characters for splitting sources (default: 500) */
  chunkSize?: number;

  /** Overlap between chunks in characters (default: 100) */
  chunkOverlap?: number;

  /** Weight for token overlap vs semantic similarity (default: 0.6) */
  overlapWeight?: number;

  /** Weight for token similarity (default: 0.4) */
  similarityWeight?: number;

  /** Minimum claim length to consider (default: 10) */
  minClaimLength?: number;

  /** IDF corpus: if provided, used for TF-IDF weighting. Maps token -> document frequency */
  idfCorpus?: Map<string, number>;
}
