// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-validator-registry - Main entry point
// ---------------------------------------------------------------------------

// Core
export { ValidatorRegistry } from './validator-registry.js';

// Built-in validators
export { BUILTIN_VALIDATORS } from './builtins.js';

// Types
export type {
  Severity,
  ValidatorCategory,
  ValidatorType,
  ValidatorMatch,
  ValidatorResult,
  PipelineResult,
  PatternValidatorDef,
  FunctionValidatorDef,
  ValidatorDetection,
  Validator,
  CombinatorType,
  CombinedValidator,
  ValidatorFilter,
  ValidatorStats,
  SerializableValidator,
  RegistryExport,
  RegistryConfig,
} from './types.js';
