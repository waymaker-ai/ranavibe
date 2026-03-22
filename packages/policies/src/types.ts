// ---------------------------------------------------------------------------
// @aicofounder/policies - Core type definitions
// ---------------------------------------------------------------------------

/** Severity level for a violation. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** What to do when PII is found. */
export type PIIAction = 'block' | 'redact' | 'detect' | 'allow';

/** Strategy when composing multiple policies. */
export type CompositionStrategy = 'strictest' | 'first' | 'last';

/** How to resolve rule conflicts during composition. */
export interface ConflictResolution {
  strategy: CompositionStrategy;
  /** Optional per-rule overrides keyed by rule category. */
  overrides?: Record<string, CompositionStrategy>;
}

// ---------------------------------------------------------------------------
// Policy metadata
// ---------------------------------------------------------------------------

export interface PolicyMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  /** ISO date string for when the policy was created or last updated. */
  updatedAt?: string;
  /** Regulatory framework this policy targets. */
  framework?: string;
  /** If set, the policy inherits from a named preset before applying its own rules. */
  extends?: string;
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

export interface PIIPattern {
  name: string;
  pattern: string;
  /** Flags for RegExp constructor (default 'gi'). */
  flags?: string;
  action: PIIAction;
  severity: Severity;
  description?: string;
}

export interface PIIRules {
  enabled: boolean;
  action: PIIAction;
  patterns: PIIPattern[];
  /** Additional custom patterns supplied by the user. */
  customPatterns?: PIIPattern[];
  /** Allowlisted values that should not trigger a violation. */
  allowlist?: string[];
}

export interface ContentPattern {
  name: string;
  pattern: string;
  flags?: string;
  severity: Severity;
  message: string;
}

export interface ContentRules {
  enabled: boolean;
  /** Patterns that must NOT appear in the output. */
  prohibited?: ContentPattern[];
  /** Patterns that MUST appear in the output (e.g. disclaimers). */
  required?: ContentPattern[];
  /** Maximum allowed toxicity score (0-1) if an external scorer is wired. */
  maxToxicity?: number;
}

export interface ModelRules {
  enabled: boolean;
  /** Glob patterns for models that are allowed. Empty means all allowed. */
  allow?: string[];
  /** Glob patterns for models that are denied. Takes precedence over allow. */
  deny?: string[];
  /** Maximum context window the model may use. */
  maxContextTokens?: number;
}

export interface CostRules {
  enabled: boolean;
  /** Maximum cost in USD per single request. */
  maxCostPerRequest?: number;
  /** Maximum cost in USD per day. */
  maxCostPerDay?: number;
  /** Maximum cost in USD per month. */
  maxCostPerMonth?: number;
  /** Maximum tokens per request (prompt + completion). */
  maxTokensPerRequest?: number;
  /** Maximum completion tokens per request. */
  maxCompletionTokens?: number;
}

export interface DataRetention {
  /** Maximum days to retain data. */
  maxDays?: number;
  /** Whether data must be encrypted at rest. */
  encryptAtRest?: boolean;
  /** Whether data must be encrypted in transit. */
  encryptInTransit?: boolean;
}

export interface DataRules {
  enabled: boolean;
  /** What categories of data may be stored. */
  allowedCategories?: string[];
  /** What categories of data must NOT be stored. */
  prohibitedCategories?: string[];
  retention?: DataRetention;
  /** Require audit logging for data access. */
  requireAuditLog?: boolean;
  /** Require explicit user consent before processing. */
  requireConsent?: boolean;
  /** Allow data to be exported upon request (right to portability). */
  allowExport?: boolean;
  /** Allow data to be deleted upon request (right to erasure). */
  allowDeletion?: boolean;
  /** Purpose limitation strings. */
  purposes?: string[];
}

export interface ResponseRules {
  enabled: boolean;
  /** Maximum length in characters. */
  maxLength?: number;
  /** Minimum length in characters. */
  minLength?: number;
  /** Patterns that must appear in the response. */
  requiredPatterns?: ContentPattern[];
  /** Patterns that must NOT appear in the response. */
  prohibitedPatterns?: ContentPattern[];
  /** Require structured JSON output. */
  requireJson?: boolean;
  /** Required fields in JSON output. */
  requiredJsonFields?: string[];
}

export interface AccessRules {
  enabled: boolean;
  /** Roles that are allowed to invoke this policy context. */
  allowedRoles?: string[];
  /** Roles that are denied. */
  deniedRoles?: string[];
  /** Require authentication. */
  requireAuth?: boolean;
  /** Require multi-factor authentication. */
  requireMFA?: boolean;
  /** IP allowlist (CIDR or exact). */
  allowedIPs?: string[];
  /** Rate limit (requests per minute). */
  rateLimit?: number;
}

export interface PolicyRules {
  pii?: PIIRules;
  content?: ContentRules;
  model?: ModelRules;
  cost?: CostRules;
  data?: DataRules;
  response?: ResponseRules;
  access?: AccessRules;
}

// ---------------------------------------------------------------------------
// Full policy object
// ---------------------------------------------------------------------------

export interface Policy {
  metadata: PolicyMetadata;
  rules: PolicyRules;
}

// ---------------------------------------------------------------------------
// Evaluation types
// ---------------------------------------------------------------------------

export interface EvaluationContext {
  /** The text content to evaluate. */
  content?: string;
  /** Model identifier being used. */
  model?: string;
  /** Estimated cost of the request in USD. */
  cost?: number;
  /** Token count for the request. */
  tokens?: number;
  /** Completion token count. */
  completionTokens?: number;
  /** Role of the caller. */
  role?: string;
  /** Whether the caller is authenticated. */
  authenticated?: boolean;
  /** Whether MFA was used. */
  mfa?: boolean;
  /** IP address of the caller. */
  ip?: string;
  /** Accumulated cost for the current day in USD. */
  dailyCost?: number;
  /** Accumulated cost for the current month in USD. */
  monthlyCost?: number;
  /** Arbitrary metadata the caller wants to pass through. */
  meta?: Record<string, unknown>;
}

export interface Violation {
  rule: string;
  category: string;
  severity: Severity;
  message: string;
  /** The matched value or pattern that caused the violation. */
  match?: string;
  /** Start index in the content string. */
  start?: number;
  /** End index in the content string. */
  end?: number;
  /** Suggested action. */
  action?: PIIAction | 'block' | 'warn';
}

export interface EvaluationResult {
  /** True when no critical / high violations that require blocking. */
  passed: boolean;
  violations: Violation[];
  /** Content after redaction (if PII action is 'redact'). */
  redactedContent?: string;
  /** How long the evaluation took in ms. */
  durationMs: number;
  /** Which policies were evaluated. */
  policiesEvaluated: string[];
}
