// ---------------------------------------------------------------------------
// @cofounder/policies - Main entry point
// ---------------------------------------------------------------------------

// Core types
export type {
  Severity,
  PIIAction,
  CompositionStrategy,
  ConflictResolution,
  PolicyMetadata,
  PIIPattern,
  PIIRules,
  ContentPattern,
  ContentRules,
  ModelRules,
  CostRules,
  DataRetention,
  DataRules,
  ResponseRules,
  AccessRules,
  PolicyRules,
  Policy,
  EvaluationContext,
  EvaluationResult,
  Violation,
} from './types.js';

// Engine
export { PolicyEngine } from './engine.js';

// Evaluator
export { evaluatePolicy, evaluatePolicies } from './evaluator.js';

// Loader
export { parsePolicy, deepMerge } from './loader.js';

// Validator
export { validatePolicy } from './validator.js';
export type { ValidationResult, ValidationError } from './validator.js';

// Composer
export { compose } from './composer.js';

// Presets
export {
  list as listPresets,
  get as getPreset,
  hipaaPolicy,
  gdprPolicy,
  ccpaPolicy,
  secPolicy,
  pciPolicy,
  ferpaPolicy,
  soxPolicy,
  safetyPolicy,
  enterprisePolicy,
} from './presets/index.js';

// Rules
export {
  // PII patterns
  CORE_PII_PATTERNS,
  EXTENDED_PII_PATTERNS,
  ALL_PII_PATTERNS,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  SSN_PATTERN,
  CREDIT_CARD_PATTERN,
  CREDIT_CARD_FORMATTED_PATTERN,
  IPV4_PATTERN,
  IPV6_PATTERN,
  DOB_PATTERN,
  ADDRESS_PATTERN,
  MEDICAL_RECORD_PATTERN,
  PASSPORT_PATTERN,
  DRIVERS_LICENSE_PATTERN,
  BANK_ACCOUNT_PATTERN,
  ZIP_CODE_PATTERN,
  FULL_NAME_PATTERN,
  AGE_PATTERN,
  VIN_PATTERN,
  DEA_PATTERN,
  NPI_PATTERN,
  // Content patterns
  SAFETY_PROHIBITED_PATTERNS,
  FINANCIAL_REQUIRED_PATTERNS,
  MEDICAL_REQUIRED_PATTERNS,
  LEGAL_REQUIRED_PATTERNS,
  HARMFUL_INSTRUCTIONS,
  SUICIDE_SELF_HARM,
  CHILD_EXPLOITATION,
  VIOLENCE_THREATS,
  JAILBREAK_ATTEMPT,
  PROMPT_INJECTION,
  INVESTMENT_DISCLAIMER,
  MEDICAL_DISCLAIMER,
  LEGAL_DISCLAIMER,
  AI_DISCLOSURE,
  // Cost rules
  FREE_TIER_COST_RULES,
  STANDARD_COST_RULES,
  ENTERPRISE_COST_RULES,
  UNLIMITED_COST_RULES,
  createCostRules,
  // Model rules
  globToRegex,
  matchesAny,
  isModelAllowed,
  OPENAI_ONLY,
  ANTHROPIC_ONLY,
  MAJOR_PROVIDERS_ONLY,
  NO_DEPRECATED,
  createModelRules,
  // Data rules
  GDPR_DATA_RULES,
  HIPAA_DATA_RULES,
  PCI_DATA_RULES,
  SOX_DATA_RULES,
  NO_RETENTION_DATA_RULES,
  createDataRules,
  // Custom rule builder
  PolicyBuilder,
  piiPattern,
  contentPattern,
} from './rules/index.js';
