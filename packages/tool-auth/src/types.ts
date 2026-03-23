/**
 * @waymakerai/aicofounder-tool-auth - Type definitions
 */

/**
 * A tool call request from an AI agent
 */
export interface ToolCall {
  /** Name of the tool being called (e.g., "file.read", "http.get") */
  tool: string;

  /** Arguments passed to the tool */
  arguments: Record<string, unknown>;

  /** Optional: the agent or user making the call */
  caller?: string;

  /** Optional: timestamp of the call */
  timestamp?: Date;
}

/**
 * Authorization context for evaluating tool calls
 */
export interface AuthContext {
  /** User or agent ID */
  userId?: string;

  /** Roles assigned to the user/agent */
  roles?: string[];

  /** Session ID */
  sessionId?: string;

  /** IP address or origin */
  origin?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of an authorization check
 */
export interface AuthorizationResult {
  /** Whether the tool call is authorized */
  authorized: boolean;

  /** Reason for the decision */
  reason: string;

  /** Which rule caused the decision */
  matchedRule?: string;

  /** Whether rate limiting was applied */
  rateLimited: boolean;

  /** Whether the tool is classified as dangerous */
  dangerous: boolean;

  /** Argument validation results */
  argumentErrors?: ArgumentError[];

  /** Remaining rate limit quota */
  remainingQuota?: number;
}

/**
 * Error from argument validation
 */
export interface ArgumentError {
  /** Argument name */
  argument: string;

  /** Error message */
  message: string;

  /** The invalid value (sanitized) */
  value?: unknown;
}

/**
 * Rate limit configuration for a tool
 */
export interface RateLimitRule {
  /** Tool name or glob pattern */
  tool: string;

  /** Maximum calls allowed */
  maxCalls: number;

  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Argument validation rule for a tool
 */
export interface ArgumentRule {
  /** Tool name or glob pattern */
  tool: string;

  /** Argument name */
  argument: string;

  /** Validation type */
  validation: ArgumentValidation;
}

/**
 * Argument validation types
 */
export type ArgumentValidation =
  | { type: 'pattern'; regex: string; message?: string }
  | { type: 'allowedValues'; values: unknown[]; message?: string }
  | { type: 'pathPrefix'; prefixes: string[]; message?: string }
  | { type: 'maxLength'; max: number; message?: string }
  | { type: 'range'; min?: number; max?: number; message?: string }
  | { type: 'custom'; validate: (value: unknown) => boolean; message?: string };

/**
 * Role-based access control definition
 */
export interface RoleDefinition {
  /** Role name */
  name: string;

  /** Allowed tool patterns */
  allowedTools: string[];

  /** Denied tool patterns (overrides allowed) */
  deniedTools?: string[];

  /** Per-tool rate limits */
  rateLimits?: RateLimitRule[];

  /** Argument restrictions */
  argumentRules?: ArgumentRule[];
}

/**
 * Audit log entry for a tool call
 */
export interface ToolAuditEntry {
  /** Timestamp of the call */
  timestamp: Date;

  /** The tool call that was made */
  toolCall: ToolCall;

  /** The authorization context */
  context?: AuthContext;

  /** The authorization result */
  result: AuthorizationResult;

  /** Duration of the auth check in ms */
  durationMs: number;
}

/**
 * Built-in dangerous tool categories
 */
export type DangerousCategory =
  | 'filesystem_write'   // Tools that write/delete files
  | 'filesystem_read'    // Tools that read files
  | 'network'            // Tools that make network requests
  | 'code_execution'     // Tools that execute code
  | 'system'             // Tools that interact with the OS
  | 'database_write'     // Tools that modify database
  | 'database_read'      // Tools that read database
  | 'credentials';       // Tools that access secrets/credentials

/**
 * Configuration for the tool authorizer
 */
export interface ToolAuthConfig {
  /** Default policy: allow or deny when no rules match */
  defaultPolicy?: 'allow' | 'deny';

  /** Allowed tool patterns */
  allowedTools?: string[];

  /** Denied tool patterns */
  deniedTools?: string[];

  /** Role definitions */
  roles?: RoleDefinition[];

  /** Global rate limits */
  rateLimits?: RateLimitRule[];

  /** Argument validation rules */
  argumentRules?: ArgumentRule[];

  /** Whether to enable audit logging (default: true) */
  enableAudit?: boolean;

  /** Maximum audit log size (default: 10000) */
  maxAuditSize?: number;

  /** Whether to detect dangerous tools automatically (default: true) */
  detectDangerous?: boolean;

  /** Custom dangerous tool patterns */
  dangerousPatterns?: string[];

  /** Callback on authorization failure */
  onDenied?: (entry: ToolAuditEntry) => void;

  /** Callback on rate limit hit */
  onRateLimited?: (entry: ToolAuditEntry) => void;
}
