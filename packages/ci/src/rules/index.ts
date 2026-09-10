import type { RuleDefinition } from '../types.js';
import { noHardcodedKeys } from './no-hardcoded-keys.js';
import { noPiiInPrompts } from './no-pii-in-prompts.js';
import { noInjectionVuln } from './no-injection-vuln.js';
import { approvedModels } from './approved-models.js';
import { costEstimation } from './cost-estimation.js';
import { safeDefaults } from './safe-defaults.js';
import { noExposedAssets } from './no-exposed-assets.js';
import { noMockDataInProd } from './no-mock-data-in-prod.js';
import { noUnsafeEnvFile } from './no-unsafe-env-file.js';

/** All available rules */
export const ALL_RULES: RuleDefinition[] = [
  noHardcodedKeys,
  noPiiInPrompts,
  noInjectionVuln,
  approvedModels,
  costEstimation,
  safeDefaults,
  noExposedAssets,
  noMockDataInProd,
  noUnsafeEnvFile,
];

/** Rules run by `aicofounder-ci precommit` — repo-agnostic Tier-1 checks
 * only (secrets, unsafe env files). Excludes rules scoped to CoFounder's
 * own LLM-usage conventions (approved-models, cost-estimation, etc.),
 * which don't apply to an arbitrary downstream repo's pre-commit hook. */
export const PRECOMMIT_RULES: RuleDefinition[] = [noHardcodedKeys, noUnsafeEnvFile, noMockDataInProd];

/** Map of rule ID to rule definition */
export const RULES_MAP: Map<string, RuleDefinition> = new Map(
  ALL_RULES.map(rule => [rule.id, rule])
);

/** Get rules by ID list or 'all' */
export function getRules(ruleIds: string[] | 'all'): RuleDefinition[] {
  if (ruleIds === 'all') return ALL_RULES;
  return ruleIds
    .map(id => RULES_MAP.get(id))
    .filter((r): r is RuleDefinition => r !== undefined);
}

export {
  noHardcodedKeys,
  noPiiInPrompts,
  noInjectionVuln,
  approvedModels,
  costEstimation,
  safeDefaults,
  noExposedAssets,
  noMockDataInProd,
  noUnsafeEnvFile,
};
