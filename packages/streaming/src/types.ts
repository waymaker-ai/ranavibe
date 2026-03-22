/**
 * @cofounder/streaming - Types
 *
 * Core type definitions for streaming guard configuration,
 * events, violations, and reports.
 */

/** Configuration for PII detection in streaming mode. */
export interface PiiStreamConfig {
  /** Enable PII detection. Default: true */
  enabled: boolean;
  /** Redact detected PII in output. Default: true */
  redact: boolean;
  /** Replacement string for redacted PII. Default: '[REDACTED]' */
  replacement: string;
  /** PII categories to detect. Default: all */
  categories: PiiCategory[];
}

export type PiiCategory =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'name'
  | 'address';

/** Configuration for injection detection in streaming mode. */
export interface InjectionStreamConfig {
  /** Enable injection detection. Default: true */
  enabled: boolean;
  /** Block the stream on injection detection. Default: true */
  blockOnDetection: boolean;
  /** How often to check accumulated text (in chunks). Default: 5 */
  checkInterval: number;
}

/** Configuration for toxicity detection in streaming mode. */
export interface ToxicityStreamConfig {
  /** Enable toxicity detection. Default: true */
  enabled: boolean;
  /** Block the stream on high-severity toxicity. Default: false */
  blockOnDetection: boolean;
  /** Minimum severity to trigger a violation: 'low' | 'medium' | 'high'. Default: 'medium' */
  minSeverity: ViolationSeverity;
}

/** Configuration for compliance detection in streaming mode. */
export interface ComplianceStreamConfig {
  /** Enable compliance detection. Default: false */
  enabled: boolean;
  /** Compliance frameworks to check against. */
  frameworks: string[];
}

/** Severity levels for violations. */
export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Violation type categories. */
export type ViolationType = 'pii' | 'injection' | 'toxicity' | 'compliance';

/** Full configuration for StreamGuard. */
export interface StreamGuardConfig {
  /** PII detection settings. */
  pii: Partial<PiiStreamConfig>;
  /** Injection detection settings. */
  injection: Partial<InjectionStreamConfig>;
  /** Toxicity detection settings. */
  toxicity: Partial<ToxicityStreamConfig>;
  /** Compliance detection settings. */
  compliance: Partial<ComplianceStreamConfig>;
  /** Size of the sliding buffer window in characters. Default: 200 */
  bufferSize: number;
  /** Interval in ms to flush buffered content even without sentence boundary. Default: 500 */
  flushInterval: number;
}

/** Represents a single chunk in the stream. */
export interface StreamChunk {
  /** The text content of this chunk. */
  text: string;
  /** The sequential index of this chunk in the stream. */
  index: number;
  /** Timestamp when this chunk was received. */
  timestamp: number;
  /** All text accumulated so far in the stream. */
  accumulated: string;
}

/** Event types emitted by the stream guard. */
export type StreamGuardEventType =
  | 'chunk'
  | 'violation'
  | 'redacted'
  | 'blocked'
  | 'complete';

/** An event emitted by the StreamGuard during processing. */
export interface StreamGuardEvent {
  /** The type of event. */
  type: StreamGuardEventType;
  /** The data payload for this event. */
  data: StreamGuardEventData;
}

/** Data payload for StreamGuardEvent. */
export interface StreamGuardEventData {
  /** The processed text (may be redacted). */
  text?: string;
  /** The original text before redaction. */
  originalText?: string;
  /** The chunk that triggered this event. */
  chunk?: StreamChunk;
  /** Violation details, if type is 'violation' or 'blocked'. */
  violation?: StreamViolation;
  /** Final report, if type is 'complete'. */
  report?: StreamReport;
  /** Reason the stream was blocked. */
  reason?: string;
}

/** Details about a violation detected in the stream. */
export interface StreamViolation {
  /** The category of violation. */
  type: ViolationType;
  /** How severe the violation is. */
  severity: ViolationSeverity;
  /** The chunk in which the violation was detected. */
  chunk: StreamChunk;
  /** Character position within the accumulated text. */
  position: number;
  /** The action taken: 'redact', 'block', or 'flag'. */
  action: 'redact' | 'block' | 'flag';
  /** Description of what was detected. */
  detail: string;
  /** The matched text (or redacted placeholder). */
  matched: string;
}

/** Final report after a stream completes or is terminated. */
export interface StreamReport {
  /** Total number of chunks processed. */
  totalChunks: number;
  /** Total number of tokens (approximated as whitespace-separated words). */
  totalTokens: number;
  /** All violations detected during the stream. */
  violations: StreamViolation[];
  /** Number of redactions performed. */
  redactions: number;
  /** Whether the stream was blocked. */
  blocked: boolean;
  /** Total duration from first chunk to finalization in milliseconds. */
  duration: number;
}
