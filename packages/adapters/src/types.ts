/**
 * @waymakerai/aicofounder-adapters - Type definitions for enterprise guardrail adapters
 */

// ---------------------------------------------------------------------------
// Core adapter types
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RanaCategory =
  | 'pii'
  | 'injection'
  | 'toxicity'
  | 'bias'
  | 'hallucination'
  | 'copyright'
  | 'harmful_content'
  | 'sexual_content'
  | 'violence'
  | 'self_harm'
  | 'hate_speech'
  | 'profanity'
  | 'confidential'
  | 'off_topic'
  | 'quality'
  | 'custom';

export type RanaAction = 'block' | 'redact' | 'flag' | 'log' | 'allow';

export interface UnifiedFinding {
  /** Which adapter produced this finding */
  source: 'cofounder' | 'lakera' | 'bedrock' | 'galileo';
  /** Normalised CoFounder category */
  category: RanaCategory;
  /** Severity of the finding */
  severity: Severity;
  /** Recommended action */
  action: RanaAction;
  /** Human-readable description */
  message: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Start offset in original text (if available) */
  start?: number;
  /** End offset in original text (if available) */
  end?: number;
  /** Raw payload from the source adapter */
  raw?: unknown;
}

export interface PolicyMapping {
  /** CoFounder category */
  cofounderCategory: RanaCategory;
  /** Action to take when this category is detected */
  action: RanaAction;
  /** Severity override */
  severity?: Severity;
  /** Confidence threshold (0-1). Findings below this are ignored. */
  threshold?: number;
}

export interface AdapterConfig {
  /** Human-readable name of the adapter */
  name: string;
  /** Whether the adapter is enabled */
  enabled: boolean;
  /** Policy mappings from CoFounder categories to actions */
  policies: PolicyMapping[];
}

export interface AdapterResult {
  /** Adapter that produced the result */
  adapter: string;
  /** Whether the evaluation passed (no blocking findings) */
  passed: boolean;
  /** All findings from this adapter */
  findings: UnifiedFinding[];
  /** Latency in milliseconds */
  latencyMs: number;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Raw response from the adapter */
  raw?: unknown;
}

// ---------------------------------------------------------------------------
// Import / Export
// ---------------------------------------------------------------------------

export interface ImportResult {
  /** Number of items successfully imported */
  imported: number;
  /** Number of items skipped (e.g. duplicates) */
  skipped: number;
  /** Errors encountered during import */
  errors: string[];
  /** The imported findings */
  findings: UnifiedFinding[];
}

export interface ExportResult {
  /** Format the data was exported to */
  format: string;
  /** The exported payload */
  data: unknown;
  /** Number of items exported */
  count: number;
}

// ---------------------------------------------------------------------------
// Lakera-specific config
// ---------------------------------------------------------------------------

export interface LakeraConfig extends AdapterConfig {
  name: 'lakera';
  /** Lakera Guard API key */
  apiKey: string;
  /** Lakera Guard endpoint (defaults to https://api.lakera.ai) */
  endpoint?: string;
  /** Categories to enable in Lakera */
  categories?: string[];
}

// ---------------------------------------------------------------------------
// AWS Bedrock Guardrails config
// ---------------------------------------------------------------------------

export interface BedrockConfig extends AdapterConfig {
  name: 'bedrock';
  /** AWS region */
  region: string;
  /** Bedrock Guardrail identifier */
  guardrailId: string;
  /** Guardrail version (defaults to "DRAFT") */
  guardrailVersion?: string;
  /** AWS access key (optional — uses default credential chain if omitted) */
  accessKeyId?: string;
  /** AWS secret key */
  secretAccessKey?: string;
  /** AWS session token */
  sessionToken?: string;
}

// ---------------------------------------------------------------------------
// Galileo config
// ---------------------------------------------------------------------------

export interface GalileoConfig extends AdapterConfig {
  name: 'galileo';
  /** Galileo API key */
  apiKey: string;
  /** Galileo console URL */
  consoleUrl?: string;
  /** Project name in Galileo */
  projectName?: string;
}

// ---------------------------------------------------------------------------
// Unified adapter config
// ---------------------------------------------------------------------------

export interface CoFounderPolicyConfig {
  pii?: RanaAction;
  injection?: RanaAction;
  toxicity?: RanaAction;
  bias?: RanaAction;
  hallucination?: RanaAction;
  copyright?: RanaAction;
  harmful_content?: RanaAction;
  sexual_content?: RanaAction;
  violence?: RanaAction;
  self_harm?: RanaAction;
  hate_speech?: RanaAction;
  profanity?: RanaAction;
  confidential?: RanaAction;
  off_topic?: RanaAction;
  quality?: RanaAction;
  custom?: RanaAction;
}

export interface UnifiedAdapterConfig {
  /** Base CoFounder policy configuration */
  cofounder?: CoFounderPolicyConfig;
  /** Lakera adapter config (omit to disable) */
  lakera?: Omit<LakeraConfig, 'name' | 'enabled' | 'policies'> & { policies?: PolicyMapping[] };
  /** Bedrock adapter config (omit to disable) */
  bedrock?: Omit<BedrockConfig, 'name' | 'enabled' | 'policies'> & { policies?: PolicyMapping[] };
  /** Galileo adapter config (omit to disable) */
  galileo?: Omit<GalileoConfig, 'name' | 'enabled' | 'policies'> & { policies?: PolicyMapping[] };
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface Adapter {
  readonly name: string;
  evaluate(text: string): Promise<AdapterResult>;
  exportPolicies(): ExportResult;
  importResults(raw: unknown): ImportResult;
}
