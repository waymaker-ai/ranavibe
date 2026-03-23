// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-validator-registry - Core type definitions
// ---------------------------------------------------------------------------

/** Severity level for a validation finding. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Category of a validator. */
export type ValidatorCategory =
  | 'pii'
  | 'injection'
  | 'toxicity'
  | 'compliance'
  | 'quality'
  | 'domain-specific'
  | 'custom';

/** Type of validator implementation. */
export type ValidatorType = 'pattern' | 'function';

// ---------------------------------------------------------------------------
// Validator result
// ---------------------------------------------------------------------------

export interface ValidatorMatch {
  /** The matched text. */
  text: string;
  /** Start index in the input string. */
  start: number;
  /** End index in the input string. */
  end: number;
  /** Additional metadata about the match. */
  metadata?: Record<string, unknown>;
}

export interface ValidatorResult {
  /** Whether a match/violation was found. */
  detected: boolean;
  /** Severity of the finding. */
  severity: Severity;
  /** Human-readable message. */
  message: string;
  /** Individual matches found. */
  matches: ValidatorMatch[];
  /** Duration of detection in ms. */
  durationMs: number;
  /** The validator that produced this result. */
  validatorId: string;
}

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

export interface PipelineResult {
  /** Whether any validator detected a violation. */
  detected: boolean;
  /** Results from each validator in the pipeline, in order. */
  results: ValidatorResult[];
  /** Total duration of the pipeline in ms. */
  durationMs: number;
  /** Number of validators that detected something. */
  detectCount: number;
  /** Highest severity across all results. */
  highestSeverity: Severity | null;
}

// ---------------------------------------------------------------------------
// Validator definition
// ---------------------------------------------------------------------------

export interface PatternValidatorDef {
  type: 'pattern';
  /** Regular expression pattern string. */
  pattern: string;
  /** RegExp flags (default: 'gi'). */
  flags?: string;
}

export interface FunctionValidatorDef {
  type: 'function';
  /** Custom detection function. */
  detect: (input: string, context?: Record<string, unknown>) => ValidatorDetection;
}

export interface ValidatorDetection {
  detected: boolean;
  matches: ValidatorMatch[];
  message?: string;
}

export interface Validator {
  /** Unique identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of what this validator detects. */
  description: string;
  /** Category for grouping. */
  category: ValidatorCategory;
  /** Semantic version. */
  version: string;
  /** Author name. */
  author: string;
  /** Tags for searchability. */
  tags?: string[];
  /** Severity when detected. */
  severity: Severity;
  /** Validator implementation. */
  definition: PatternValidatorDef | FunctionValidatorDef;
  /** Priority for pipeline ordering (lower runs first). */
  priority?: number;
  /** Whether this validator is enabled (default: true). */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Combinator types
// ---------------------------------------------------------------------------

export type CombinatorType = 'and' | 'or' | 'not';

export interface CombinedValidator {
  /** Type of combination. */
  combinator: CombinatorType;
  /** Validator IDs to combine. */
  validatorIds: string[];
  /** Result ID for the combined validator. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Severity override. */
  severity?: Severity;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

export interface ValidatorFilter {
  /** Filter by category. */
  category?: ValidatorCategory;
  /** Filter by tags (any match). */
  tags?: string[];
  /** Filter by author. */
  author?: string;
  /** Filter by enabled status. */
  enabled?: boolean;
  /** Search name/description. */
  search?: string;
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export interface ValidatorStats {
  /** Total number of times run. */
  calls: number;
  /** Total number of detections. */
  matches: number;
  /** Number of false positives reported. */
  falsePositivesReported: number;
  /** Last run timestamp. */
  lastRunAt: number | null;
  /** Average duration in ms. */
  avgDurationMs: number;
}

// ---------------------------------------------------------------------------
// Serializable format (for import/export)
// ---------------------------------------------------------------------------

export interface SerializableValidator {
  id: string;
  name: string;
  description: string;
  category: ValidatorCategory;
  version: string;
  author: string;
  tags?: string[];
  severity: Severity;
  /** Only pattern-based validators can be serialized. */
  pattern: string;
  flags?: string;
  priority?: number;
  enabled?: boolean;
}

export interface RegistryExport {
  version: string;
  exportedAt: string;
  validators: SerializableValidator[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RegistryConfig {
  /** Whether to load built-in validators on construction (default: true). */
  loadBuiltins?: boolean;
  /** Enable statistics tracking (default: true). */
  trackStats?: boolean;
}
