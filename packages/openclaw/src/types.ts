// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-openclaw - Type definitions
// ---------------------------------------------------------------------------

// ---- PII Types ----

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'address'
  | 'medical_record'
  | 'name'
  | 'passport'
  | 'drivers_license';

export type PIIMode = 'detect' | 'redact' | 'block';

export interface PIIFinding {
  type: PIIType;
  value: string;
  redacted: string;
  start: number;
  end: number;
  confidence: number;
}

// ---- Injection Types ----

export type InjectionCategory =
  | 'direct'
  | 'system_leak'
  | 'jailbreak'
  | 'role_manipulation'
  | 'delimiter'
  | 'encoding'
  | 'context_manipulation'
  | 'multi_language';

export type InjectionAction = 'block' | 'warn' | 'sanitize';

export interface InjectionFinding {
  pattern: string;
  category: InjectionCategory;
  score: number;
  severity: Severity;
  matched: string;
}

// ---- Toxicity Types ----

export type ToxicityCategory =
  | 'profanity'
  | 'hate_speech'
  | 'violence'
  | 'self_harm'
  | 'sexual'
  | 'harassment'
  | 'spam';

export type ToxicityAction = 'block' | 'warn';

export interface ToxicityFinding {
  category: ToxicityCategory;
  severity: Severity;
  matched: string;
  context: string;
}

// ---- General Types ----

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Violation {
  rule: string;
  type: string;
  severity: Severity;
  message: string;
  action: string;
}

// ---- OpenClaw Skill Config ----

export interface OpenClawSkillConfig {
  /** PII detection mode: detect, redact, or block */
  pii?: PIIMode | false;
  /** Injection detection sensitivity */
  injectionSensitivity?: 'low' | 'medium' | 'high';
  /** Injection action */
  injectionAction?: InjectionAction;
  /** Toxicity detection */
  toxicity?: ToxicityAction | false;
  /** Compliance frameworks to enforce */
  compliance?: ComplianceFramework[];
  /** Cost budget per period */
  budget?: BudgetConfig | false;
  /** Model to use for cost tracking */
  model?: string;
  /** Whether to log guard actions */
  audit?: AuditConfig;
  /** Custom blocked message */
  blockedMessage?: string;
  /** Whether to guard tool calls */
  guardToolCalls?: boolean;
  /** Allowed channels */
  allowedChannels?: string[];
}

// ---- OpenClaw Message ----

export interface OpenClawMessage {
  /** Message role: user, assistant, system, tool */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Message text content */
  content: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp */
  timestamp?: number;
  /** Message ID */
  id?: string;
}

// ---- OpenClaw Context ----

export interface OpenClawContext {
  /** Conversation history */
  conversationHistory?: OpenClawMessage[];
  /** User information */
  user?: {
    id: string;
    name?: string;
    role?: string;
    metadata?: Record<string, unknown>;
  };
  /** Channel the message came from */
  channel?: OpenClawChannel;
  /** Agent information */
  agent?: {
    id: string;
    name: string;
    model?: string;
    version?: string;
  };
  /** Session ID */
  sessionId?: string;
  /** Custom context data */
  custom?: Record<string, unknown>;
}

export type OpenClawChannel = 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'web' | 'api' | string;

// ---- Guard Result ----

export interface GuardResult {
  /** Whether the content is allowed */
  allowed: boolean;
  /** Whether the content was blocked */
  blocked: boolean;
  /** Human-readable reason for the decision */
  reason?: string;
  /** Redacted version of the content (if PII was found and mode is 'redact') */
  redactedContent?: string;
  /** All violations found */
  violations: Violation[];
  /** PII findings */
  piiFindings: PIIFinding[];
  /** Injection findings */
  injectionFindings: InjectionFinding[];
  /** Toxicity findings */
  toxicityFindings: ToxicityFinding[];
  /** Estimated cost if applicable */
  cost?: CostInfo;
  /** Compliance violations */
  complianceViolations: ComplianceViolation[];
  /** Processing time in ms */
  processingTimeMs: number;
}

// ---- Skill Manifest ----

export interface SkillManifest {
  /** Skill name (used as identifier) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Semantic version */
  version: string;
  /** Author name */
  author: string;
  /** List of capabilities this skill provides */
  capabilities: string[];
  /** Configurable settings exposed to OpenClaw */
  settings: Record<string, SkillSetting>;
}

export interface SkillSetting {
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  default: unknown;
  options?: string[];
}

// ---- OpenClaw Hooks ----

export interface OpenClawHooks {
  /** Called before a user message is processed by the agent */
  beforeMessage: (message: OpenClawMessage, context: OpenClawContext) => Promise<HookResult>;
  /** Called after the agent generates a response */
  afterMessage: (message: OpenClawMessage, context: OpenClawContext) => Promise<HookResult>;
  /** Called before a tool/function is executed */
  beforeToolCall: (tool: string, args: unknown, context: OpenClawContext) => Promise<HookResult>;
  /** Called after a tool/function returns */
  afterToolCall: (tool: string, result: unknown, context: OpenClawContext) => Promise<HookResult>;
}

export interface HookResult {
  /** Whether to proceed */
  proceed: boolean;
  /** Modified content (if any) */
  modifiedContent?: string;
  /** Modified args (for tool calls) */
  modifiedArgs?: unknown;
  /** Guard result details */
  guardResult: GuardResult;
  /** Message to show to user if blocked */
  userMessage?: string;
}

// ---- OpenClaw Skill (full interface) ----

export interface OpenClawSkill {
  manifest: SkillManifest;
  hooks: OpenClawHooks;
  commands: Record<string, (context: OpenClawContext, ...args: string[]) => Promise<string>>;
}

// ---- Bridge Config ----

export interface BridgeConfig {
  /** Guard options */
  guardOptions?: OpenClawSkillConfig;
  /** Policy presets to apply */
  policyPresets?: ComplianceFramework[];
  /** Whether the dashboard endpoint is enabled */
  dashboardEnabled?: boolean;
  /** Custom webhook URL for reporting */
  webhookUrl?: string;
  /** Whether to store audit logs */
  auditEnabled?: boolean;
}

// ---- Budget & Cost Types ----

export interface BudgetConfig {
  /** Maximum spend */
  limit: number;
  /** Budget period */
  period: 'request' | 'hour' | 'day' | 'month';
  /** Threshold (0-1) at which to warn */
  warningThreshold?: number;
  /** Action when budget is exceeded */
  onExceeded?: 'block' | 'warn' | 'downgrade';
}

export interface CostInfo {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  budgetRemaining?: number;
  budgetWarning?: boolean;
}

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
}

// ---- Compliance Types ----

export type ComplianceFramework = 'hipaa' | 'gdpr' | 'ccpa' | 'sec' | 'pci' | 'ferpa' | 'sox';

export interface ComplianceViolation {
  framework: ComplianceFramework;
  rule: string;
  severity: Severity;
  message: string;
  recommendation: string;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: ComplianceViolation[];
  frameworksChecked: ComplianceFramework[];
}

// ---- Audit Types ----

export interface AuditConfig {
  /** Whether auditing is enabled */
  enabled: boolean;
  /** Log level */
  level?: 'minimal' | 'standard' | 'verbose';
  /** Maximum audit entries to retain in memory */
  maxEntries?: number;
}

export interface AuditEntry {
  timestamp: number;
  action: 'input_guard' | 'output_guard' | 'tool_guard' | 'command' | 'compliance_check';
  channel?: OpenClawChannel;
  userId?: string;
  sessionId?: string;
  result: 'allowed' | 'blocked' | 'warned' | 'redacted';
  violations: number;
  processingTimeMs: number;
  details?: Record<string, unknown>;
}

// ---- Report Types ----

export interface GuardReport {
  totalChecks: number;
  blocked: number;
  warned: number;
  passed: number;
  redacted: number;
  piiByType: Record<string, number>;
  injectionAttempts: number;
  injectionByCategory: Record<string, number>;
  toxicityByCategory: Record<string, number>;
  complianceViolationsByFramework: Record<string, number>;
  totalCost: number;
  budgetRemaining: number;
  auditEntries: number;
  startedAt: number;
  lastCheckAt: number;
}

export interface CostReport {
  totalSpent: number;
  budgetLimit: number;
  budgetRemaining: number;
  period: string;
  periodStart: number;
  entries: Array<{ model: string; cost: number; timestamp: number }>;
  byModel: Record<string, number>;
}

export interface ComplianceReport {
  frameworks: ComplianceFramework[];
  totalChecks: number;
  totalViolations: number;
  violationsByFramework: Record<string, number>;
  recentViolations: ComplianceViolation[];
  compliant: boolean;
}
