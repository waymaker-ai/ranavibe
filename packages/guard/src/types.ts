// ---- Configuration Types ----

export type PIIMode = 'detect' | 'redact' | 'block';
export type InjectionAction = 'block' | 'warn' | 'sanitize';
export type ToxicityAction = 'block' | 'warn';
export type BudgetAction = 'block' | 'warn' | 'downgrade';
export type RateLimitAction = 'block' | 'queue' | 'warn';
export type ReporterType = 'console' | 'json' | { webhook: string };

export interface GuardOptions {
  pii?: PIIMode | false;
  injection?: InjectionAction | false;
  toxicity?: ToxicityAction | false;
  budget?: BudgetConfig | false;
  rateLimit?: RateLimitConfig | false;
  models?: string[] | false;
  reporter?: ReporterType | false;
}

export interface BudgetConfig {
  limit: number;
  period: 'request' | 'hour' | 'day' | 'month';
  warningThreshold?: number;
  onExceeded?: BudgetAction;
}

export interface RateLimitConfig {
  max: number;
  window: string; // '1m', '1h', '1d'
}

// ---- Detection Result Types ----

export interface CheckResult {
  safe: boolean;
  blocked: boolean;
  reason?: string;
  warnings: string[];
  piiFindings: PIIFinding[];
  injectionFindings: InjectionFinding[];
  toxicityFindings: ToxicityFinding[];
  redacted?: string;
  cost?: number;
  model?: string;
  violations: Violation[];
}

export interface PIIFinding {
  type: PIIType;
  value: string;
  redacted: string;
  start: number;
  end: number;
  confidence: number;
}

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

export interface InjectionFinding {
  pattern: string;
  category: InjectionCategory;
  score: number;
  severity: Severity;
  matched: string;
}

export type InjectionCategory =
  | 'direct'
  | 'system_leak'
  | 'jailbreak'
  | 'role_manipulation'
  | 'delimiter'
  | 'encoding'
  | 'context_manipulation'
  | 'multi_language';

export interface ToxicityFinding {
  category: ToxicityCategory;
  severity: Severity;
  matched: string;
  context: string;
}

export type ToxicityCategory =
  | 'profanity'
  | 'hate_speech'
  | 'violence'
  | 'self_harm'
  | 'sexual'
  | 'harassment'
  | 'spam';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Violation {
  rule: string;
  type: string;
  severity: Severity;
  message: string;
  action: string;
}

// ---- Budget & Cost Types ----

export interface BudgetState {
  spent: number;
  limit: number;
  period: string;
  remaining: number;
  warning: boolean;
  periodStart: number;
}

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
}

export interface CostEstimate {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

// ---- Report Types ----

export interface GuardReport {
  totalChecks: number;
  blocked: number;
  warned: number;
  passed: number;
  piiRedacted: number;
  piiByType: Record<string, number>;
  injectionAttempts: number;
  injectionByCategory: Record<string, number>;
  toxicityFound: number;
  toxicityByCategory: Record<string, number>;
  totalCost: number;
  budgetRemaining: number;
  rateLimitHits: number;
  modelDenials: number;
  startedAt: number;
  lastCheckAt: number;
}

// ---- Guard Interface ----

export interface Guard {
  check(text: string, options?: { model?: string; direction?: 'input' | 'output' }): CheckResult;
  wrap<T extends object>(client: T): T;
  middleware(): (req: any, res: any, next: () => void) => void;
  report(): GuardReport;
  resetBudget(): void;
}

// ---- Provider Types ----

export interface ProviderInfo {
  name: string;
  models: Record<string, ModelPricing>;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  model: string;
}
