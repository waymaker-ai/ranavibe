// ---------------------------------------------------------------------------
// Cost enforcement helpers
// ---------------------------------------------------------------------------

import type { CostRules } from '../types.js';

/** Default cost limits for a free-tier user. */
export const FREE_TIER_COST_RULES: CostRules = {
  enabled: true,
  maxCostPerRequest: 0.05,
  maxCostPerDay: 1.0,
  maxCostPerMonth: 10.0,
  maxTokensPerRequest: 4_096,
  maxCompletionTokens: 2_048,
};

/** Standard cost limits for a paid user. */
export const STANDARD_COST_RULES: CostRules = {
  enabled: true,
  maxCostPerRequest: 1.0,
  maxCostPerDay: 50.0,
  maxCostPerMonth: 500.0,
  maxTokensPerRequest: 32_768,
  maxCompletionTokens: 16_384,
};

/** Enterprise cost limits (higher but still bounded). */
export const ENTERPRISE_COST_RULES: CostRules = {
  enabled: true,
  maxCostPerRequest: 10.0,
  maxCostPerDay: 500.0,
  maxCostPerMonth: 10_000.0,
  maxTokensPerRequest: 128_000,
  maxCompletionTokens: 32_768,
};

/** No cost limits (disabled). */
export const UNLIMITED_COST_RULES: CostRules = {
  enabled: false,
};

/**
 * Create cost rules from a simple budget.
 */
export function createCostRules(opts: {
  perRequest?: number;
  perDay?: number;
  perMonth?: number;
  maxTokens?: number;
  maxCompletion?: number;
}): CostRules {
  return {
    enabled: true,
    maxCostPerRequest: opts.perRequest,
    maxCostPerDay: opts.perDay,
    maxCostPerMonth: opts.perMonth,
    maxTokensPerRequest: opts.maxTokens,
    maxCompletionTokens: opts.maxCompletion,
  };
}
