/**
 * @rana/compliance
 * Enterprise compliance enforcement for RANA agents
 *
 * @example
 * ```typescript
 * import { createComplianceEnforcer, PresetRules } from '@rana/compliance';
 *
 * const enforcer = createComplianceEnforcer({
 *   enableAllPresets: true,
 *   strictMode: true,
 * });
 *
 * // Or add specific rules
 * enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());
 * enforcer.addRule(PresetRules.secFinancialDisclaimer());
 *
 * // Enforce compliance
 * const result = await enforcer.enforce(
 *   'Should I buy Bitcoin?',
 *   'Yes, you should definitely invest in Bitcoin!',
 *   { topic: 'finance' }
 * );
 *
 * console.log(result.finalOutput); // Modified with disclaimer
 * console.log(result.violations); // List of violations
 * ```
 */

// Types
export type * from './types';

// Rules
export {
  createComplianceRule,
  PresetRules,
  getAllPresetRules,
  detectPII,
  redactPII,
} from './rules';
export type { CreateRuleOptions } from './rules';

// Enforcer
export { ComplianceEnforcer, createComplianceEnforcer } from './enforcer';
