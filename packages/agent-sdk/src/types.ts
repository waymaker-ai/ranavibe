// ---- Guard Configuration ----

export interface GuardConfig {
  pii?: PIIConfig | boolean;
  injection?: InjectionConfig | boolean;
  cost?: CostConfig | boolean;
  compliance?: ComplianceConfig | boolean;
  contentFilter?: ContentFilterConfig | boolean;
  audit?: AuditConfig | boolean;
  rateLimit?: RateLimitConfig | boolean;
}

export interface PIIConfig {
  mode: 'detect' | 'redact' | 'block';
  types?: PIIType[];
  regions?: PIIRegion[];
  onDetection?: 'redact' | 'block' | 'warn' | 'log';
  allowList?: string[];
}

export type PIIType = 'email' | 'phone' | 'ssn' | 'creditCard' | 'ip' | 'name' | 'address' | 'dob' | 'medical_record';
export type PIIRegion = 'us' | 'eu' | 'uk' | 'ca' | 'au' | 'global';

export interface InjectionConfig {
  sensitivity?: 'low' | 'medium' | 'high';
  onDetection?: 'block' | 'warn' | 'sanitize';
  customPatterns?: RegExp[];
}

export interface CostConfig {
  budgetLimit?: number;
  budgetPeriod?: 'request' | 'hour' | 'day' | 'month';
  warningThreshold?: number;
  onExceeded?: 'block' | 'warn' | 'downgrade';
  preferredModels?: string[];
  fallbackModel?: string;
}

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  onViolation?: 'block' | 'warn' | 'redact' | 'escalate';
  customRules?: ComplianceRule[];
}

export type ComplianceFramework = 'hipaa' | 'gdpr' | 'ccpa' | 'sec' | 'sox' | 'pci' | 'ferpa';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  framework: string;
  severity: Severity;
  check: (text: string) => ComplianceViolation | null;
}

export interface ComplianceViolation {
  ruleId: string;
  framework: string;
  severity: Severity;
  message: string;
  suggestion?: string;
}

export interface ContentFilterConfig {
  categories?: ContentCategory[];
  action?: 'block' | 'redact' | 'warn';
  severity?: Severity;
}

export type ContentCategory = 'profanity' | 'violence' | 'hate' | 'adult' | 'spam' | 'selfHarm';

export interface AuditConfig {
  destination?: 'console' | 'file' | 'custom';
  filePath?: string;
  events?: AuditEventType[];
  includePayload?: boolean;
  tamperProof?: boolean;
  customHandler?: (event: AuditEvent) => void | Promise<void>;
}

export type AuditEventType = 'request' | 'response' | 'tool_call' | 'violation' | 'cost' | 'error';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  onExceeded?: 'block' | 'queue' | 'warn';
}

// ---- Interceptor Types ----

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface InterceptorResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  transformed?: string;
  violations: Violation[];
  metadata: Record<string, unknown>;
}

export interface Violation {
  interceptor: string;
  rule: string;
  severity: Severity;
  message: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface Interceptor {
  name: string;
  processInput(text: string, context: InterceptorContext): InterceptorResult;
  processOutput(text: string, context: InterceptorContext): InterceptorResult;
  processToolCall?(name: string, input: unknown, context: InterceptorContext): InterceptorResult;
}

export interface InterceptorContext {
  model?: string;
  provider?: string;
  requestId: string;
  timestamp: number;
  direction: 'input' | 'output' | 'tool';
  metadata?: Record<string, unknown>;
}

// ---- Audit Event ----

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  direction: 'input' | 'output' | 'tool';
  model?: string;
  interceptor?: string;
  result: 'allowed' | 'blocked' | 'warned';
  violations: Violation[];
  payload?: string;
  cost?: number;
  hash?: string;
  previousHash?: string;
}

// ---- Cost Entry ----

export interface CostEntry {
  timestamp: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// ---- Guard Report ----

export interface GuardReport {
  totalRequests: number;
  totalCost: number;
  ppiDetections: number;
  ppiByType: Record<string, number>;
  injectionAttempts: number;
  complianceViolations: number;
  complianceByFramework: Record<string, number>;
  contentFiltered: number;
  rateLimitHits: number;
  auditEvents: number;
  startedAt: number;
  lastActivityAt: number;
}

// ---- Agent Config ----

export interface GuardedAgentConfig {
  model: string;
  instructions?: string;
  tools?: unknown[];
  guards: GuardConfig | boolean;
  maxTurns?: number;
  name?: string;
}

export interface GuardedAgent {
  run(input: string, context?: Record<string, unknown>): Promise<GuardedAgentResult>;
  getGuardReport(): GuardReport;
  resetGuards(): void;
}

export interface GuardedAgentResult {
  output: string;
  blocked: boolean;
  violations: Violation[];
  cost: number;
  tokensUsed: { input: number; output: number };
  guardsApplied: string[];
}
