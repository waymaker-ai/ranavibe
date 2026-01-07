/**
 * @rana/guidelines - Type definitions
 */

/**
 * Context for guideline matching
 */
export interface GuidelineContext {
  /** Current conversation topic */
  topic?: string | string[];

  /** Conversation category */
  category?: string;

  /** User information */
  user?: {
    id: string;
    roles?: string[];
    tier?: string;
    metadata?: Record<string, unknown>;
  };

  /** Conversation metadata */
  metadata?: Record<string, unknown>;

  /** Current message content */
  message?: string;

  /** Previous messages */
  history?: Array<{ role: string; content: string }>;

  /** Intent detected from message */
  intent?: string;

  /** Entities extracted from message */
  entities?: Record<string, unknown>;

  /** Custom context fields */
  [key: string]: unknown;
}

/**
 * Enforcement level for guidelines
 */
export type EnforcementLevel =
  | 'strict'      // Block responses that violate
  | 'advisory'    // Warn but allow
  | 'monitored';  // Log violations for review

/**
 * Guideline status
 */
export type GuidelineStatus =
  | 'active'
  | 'inactive'
  | 'archived';

/**
 * Condition function for dynamic matching
 */
export type GuidelineCondition = (context: GuidelineContext) => boolean | Promise<boolean>;

/**
 * Content can be static string or dynamic function
 */
export type GuidelineContent = string | ((context: GuidelineContext) => string | Promise<string>);

/**
 * Guideline definition
 */
export interface Guideline {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name?: string;

  /** Description of what this guideline enforces */
  description?: string;

  /** Condition for when this guideline applies */
  condition: GuidelineCondition;

  /** The guideline content/instruction */
  content: GuidelineContent;

  /** Enforcement level */
  enforcement: EnforcementLevel;

  /** Priority (higher = more important) */
  priority: number;

  /** Category for organization */
  category?: string;

  /** Tags for filtering */
  tags?: string[];

  /** Status */
  status?: GuidelineStatus;

  /** Version for tracking changes */
  version?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;

  /** Created timestamp */
  createdAt?: Date;

  /** Updated timestamp */
  updatedAt?: Date;
}

/**
 * Matched guideline with context
 */
export interface MatchedGuideline {
  /** The guideline that matched */
  guideline: Guideline;

  /** Context it matched against */
  context: GuidelineContext;

  /** Resolved content (if dynamic) */
  resolvedContent: string;

  /** Match score (0-1) */
  matchScore?: number;

  /** Timestamp of match */
  matchedAt: Date;
}

/**
 * Guideline violation
 */
export interface GuidelineViolation {
  /** The guideline that was violated */
  guideline: Guideline;

  /** Context during violation */
  context: GuidelineContext;

  /** Response that violated the guideline */
  response: string;

  /** Reason for violation */
  reason: string;

  /** Enforcement action taken */
  action: 'blocked' | 'warned' | 'logged';

  /** Timestamp */
  timestamp: Date;
}

/**
 * Guideline analytics
 */
export interface GuidelineAnalytics {
  /** Total number of times guideline matched */
  matchCount: number;

  /** Total number of violations */
  violationCount: number;

  /** Compliance rate (0-1) */
  complianceRate: number;

  /** Last matched */
  lastMatched?: Date;

  /** Last violated */
  lastViolated?: Date;

  /** Average match score */
  avgMatchScore?: number;
}

/**
 * Guideline manager configuration
 */
export interface GuidelineManagerConfig {
  /** Enable analytics tracking */
  enableAnalytics?: boolean;

  /** Storage for guidelines */
  storage?: GuidelineStorage;

  /** Default enforcement level */
  defaultEnforcement?: EnforcementLevel;

  /** Maximum guidelines to match per request */
  maxMatches?: number;

  /** Enable caching of matched guidelines */
  enableCache?: boolean;

  /** Cache TTL in seconds */
  cacheTTL?: number;

  /** Callback on violation */
  onViolation?: (violation: GuidelineViolation) => void | Promise<void>;
}

/**
 * Guideline storage interface
 */
export interface GuidelineStorage {
  /** Save guideline */
  save(guideline: Guideline): Promise<void>;

  /** Get guideline by ID */
  get(id: string): Promise<Guideline | null>;

  /** Get all guidelines */
  getAll(): Promise<Guideline[]>;

  /** Update guideline */
  update(id: string, updates: Partial<Guideline>): Promise<void>;

  /** Delete guideline */
  delete(id: string): Promise<void>;

  /** Query guidelines */
  query(filter: Partial<Guideline>): Promise<Guideline[]>;
}

/**
 * Priority conflict resolution strategy
 */
export type ConflictResolution =
  | 'highest-priority'  // Use guideline with highest priority
  | 'merge'             // Merge all matching guidelines
  | 'first-match';      // Use first matching guideline

/**
 * Match options
 */
export interface MatchOptions {
  /** Conflict resolution strategy */
  conflictResolution?: ConflictResolution;

  /** Include inactive guidelines */
  includeInactive?: boolean;

  /** Minimum priority to consider */
  minPriority?: number;

  /** Maximum priority to consider */
  maxPriority?: number;

  /** Filter by category */
  category?: string;

  /** Filter by tags */
  tags?: string[];
}

/**
 * Guideline validation result
 */
export interface ValidationResult {
  /** Is response compliant */
  compliant: boolean;

  /** Matched guidelines */
  matchedGuidelines: MatchedGuideline[];

  /** Violations detected */
  violations: GuidelineViolation[];

  /** Overall enforcement action */
  action: 'allow' | 'block' | 'warn';

  /** Modified response (if any) */
  modifiedResponse?: string;

  /** Validation metadata */
  metadata?: Record<string, unknown>;
}
