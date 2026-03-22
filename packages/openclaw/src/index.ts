// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-openclaw - CoFounder guardrails for OpenClaw agents
// ---------------------------------------------------------------------------
// Zero-dependency integration providing PII detection, prompt injection
// blocking, toxicity detection, compliance enforcement, and cost tracking
// as an OpenClaw skill or standalone bridge.
// ---------------------------------------------------------------------------

// Skill (primary integration)
export { createCoFounderSkill } from './skill.js';

// Bridge (standalone usage)
export { OpenClawBridge } from './bridge.js';

// Guards (standalone detectors)
export {
  detectPII,
  redactPII,
  hasPII,
  detectInjection,
  hasInjection,
  detectToxicity,
  hasToxicity,
  BudgetTracker,
} from './guards.js';

// Compliance
export {
  checkCompliance,
  isCompliant,
  getAvailableFrameworks,
  getFrameworkRules,
} from './compliance.js';

// Reporter
export {
  formatGuardResult,
  formatGuardReport,
  formatCostReport,
  formatComplianceReport,
  formatScanResult,
} from './reporter.js';

// Types
export type {
  // Config
  OpenClawSkillConfig,
  BridgeConfig,
  BudgetConfig,
  AuditConfig,

  // OpenClaw primitives
  OpenClawMessage,
  OpenClawContext,
  OpenClawChannel,
  OpenClawSkill,
  OpenClawHooks,
  HookResult,

  // Skill
  SkillManifest,
  SkillSetting,

  // Guard results
  GuardResult,
  Violation,

  // PII
  PIIFinding,
  PIIType,
  PIIMode,

  // Injection
  InjectionFinding,
  InjectionCategory,
  InjectionAction,

  // Toxicity
  ToxicityFinding,
  ToxicityCategory,
  ToxicityAction,

  // Compliance
  ComplianceFramework,
  ComplianceViolation,
  ComplianceResult,

  // Cost
  CostInfo,
  ModelPricing,

  // Reports
  GuardReport,
  CostReport,
  ComplianceReport,
  AuditEntry,

  // General
  Severity,
} from './types.js';
