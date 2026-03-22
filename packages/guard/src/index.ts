// Core
export { createGuard, guard } from './guard.js';

// Types
export type {
  GuardOptions,
  CheckResult,
  Guard,
  GuardReport,
  PIIFinding,
  PIIType,
  InjectionFinding,
  InjectionCategory,
  ToxicityFinding,
  ToxicityCategory,
  Severity,
  Violation,
  BudgetConfig,
  BudgetState,
  RateLimitConfig,
  ModelPricing,
  CostEstimate,
  UsageInfo,
  ReporterType,
} from './types.js';

// Detectors (for standalone use)
export { detectPII, redactPII, hasPII } from './detectors/pii.js';
export { detectInjection, hasInjection } from './detectors/injection.js';
export { detectToxicity, hasToxicity } from './detectors/toxicity.js';

// Enforcers (for standalone use)
export { BudgetEnforcer } from './enforcers/budget.js';
export { RateLimiter } from './enforcers/rate-limit.js';
export { ModelGate } from './enforcers/model-gate.js';

// Reporters
export { reportCheck, reportSummary } from './reporters/console.js';
export { JsonReporter } from './reporters/json.js';
export { WebhookReporter } from './reporters/webhook.js';

// Providers
export { ANTHROPIC_MODELS } from './providers/anthropic.js';
export { OPENAI_MODELS } from './providers/openai.js';
export { GOOGLE_MODELS } from './providers/google.js';
export { detectProvider } from './providers/index.js';
