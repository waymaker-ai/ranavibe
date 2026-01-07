/**
 * @rana/compliance - Type definitions
 */

/**
 * Compliance check context
 */
export interface ComplianceContext {
  /** User input/message */
  input: string;

  /** AI-generated output/response */
  output: string;

  /** User information */
  user?: {
    id: string;
    roles?: string[];
    metadata?: Record<string, unknown>;
  };

  /** Conversation metadata */
  metadata?: Record<string, unknown>;

  /** Topic/category */
  topic?: string;

  /** Intent */
  intent?: string;

  /** Additional context */
  [key: string]: unknown;
}

/**
 * Enforcement action types
 */
export type EnforcementAction =
  | 'allow'     // Allow response as-is
  | 'block'     // Block response entirely
  | 'redact'    // Remove sensitive information
  | 'append'    // Add disclaimers/notices
  | 'replace'   // Replace with safe alternative
  | 'warn'      // Log warning but allow
  | 'escalate'; // Route to human review

/**
 * Compliance severity levels
 */
export type ComplianceSeverity =
  | 'critical'  // Must be enforced, major legal/safety risk
  | 'high'      // Should be enforced, significant risk
  | 'medium'    // Important but some flexibility
  | 'low';      // Advisory, minimal risk

/**
 * Compliance category
 */
export type ComplianceCategory =
  | 'healthcare'      // HIPAA, medical advice
  | 'finance'         // SEC, FINRA, financial advice
  | 'legal'           // Legal advice, attorney disclaimers
  | 'privacy'         // GDPR, CCPA, PII protection
  | 'safety'          // Content safety, age-appropriate
  | 'security'        // Security best practices
  | 'custom';         // Custom compliance rules

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  /** Is response compliant */
  compliant: boolean;

  /** Recommended action */
  action: EnforcementAction;

  /** Explanation/reason */
  message?: string;

  /** Modified output (if action requires modification) */
  replacement?: string;

  /** Detected issues */
  issues?: string[];

  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Compliance rule check function
 */
export type ComplianceCheckFn = (
  input: string,
  output: string,
  context: ComplianceContext
) => ComplianceCheckResult | Promise<ComplianceCheckResult>;

/**
 * Compliance rule definition
 */
export interface ComplianceRule {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this rule enforces */
  description: string;

  /** Compliance category */
  category: ComplianceCategory;

  /** Severity level */
  severity: ComplianceSeverity;

  /** The check function */
  check: ComplianceCheckFn;

  /** Tags for filtering */
  tags?: string[];

  /** Whether rule is active */
  enabled?: boolean;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Compliance violation record
 */
export interface ComplianceViolation {
  /** Rule that was violated */
  rule: ComplianceRule;

  /** Context during violation */
  context: ComplianceContext;

  /** Check result */
  checkResult: ComplianceCheckResult;

  /** Action taken */
  actionTaken: EnforcementAction;

  /** Timestamp */
  timestamp: Date;

  /** User ID (if available) */
  userId?: string;

  /** Conversation ID (if available) */
  conversationId?: string;
}

/**
 * Compliance enforcement result
 */
export interface ComplianceEnforcementResult {
  /** Overall compliance status */
  compliant: boolean;

  /** Original output */
  originalOutput: string;

  /** Modified output (if any) */
  modifiedOutput?: string;

  /** Final output to use */
  finalOutput: string;

  /** Rules that were checked */
  rulesChecked: ComplianceRule[];

  /** Violations detected */
  violations: ComplianceViolation[];

  /** Overall action taken */
  action: EnforcementAction;

  /** Warnings/messages */
  warnings?: string[];

  /** Whether output was modified */
  wasModified: boolean;
}

/**
 * Compliance enforcer configuration
 */
export interface ComplianceEnforcerConfig {
  /** Rules to enforce */
  rules?: ComplianceRule[];

  /** Enable all presets by default */
  enableAllPresets?: boolean;

  /** Callback when violation occurs */
  onViolation?: (violation: ComplianceViolation) => void | Promise<void>;

  /** Callback when enforcement action is taken */
  onEnforcement?: (result: ComplianceEnforcementResult) => void | Promise<void>;

  /** Strict mode: block on any violation */
  strictMode?: boolean;

  /** Log violations to console */
  logViolations?: boolean;

  /** Store violations for analytics */
  storeViolations?: boolean;
}

/**
 * PII (Personally Identifiable Information) types
 */
export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'address'
  | 'name'
  | 'date_of_birth'
  | 'medical_record'
  | 'ip_address'
  | 'passport';

/**
 * PII detection result
 */
export interface PIIMatch {
  /** Type of PII detected */
  type: PIIType;

  /** Matched text */
  text: string;

  /** Position in string */
  start: number;
  end: number;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Content moderation result
 */
export interface ModerationResult {
  /** Is content safe */
  safe: boolean;

  /** Categories flagged */
  flagged: string[];

  /** Confidence scores by category */
  scores: Record<string, number>;

  /** Recommended action */
  action: 'allow' | 'block' | 'review';
}
