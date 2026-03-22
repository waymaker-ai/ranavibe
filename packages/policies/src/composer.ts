// ---------------------------------------------------------------------------
// Policy composition
// ---------------------------------------------------------------------------

import type {
  Policy,
  PolicyRules,
  PIIRules,
  ContentRules,
  ModelRules,
  CostRules,
  DataRules,
  ResponseRules,
  AccessRules,
  CompositionStrategy,
  PIIAction,
} from './types.js';
import { deepMerge } from './loader.js';

// ---------------------------------------------------------------------------
// Action ordering for "strictest" strategy
// ---------------------------------------------------------------------------

const PII_ACTION_ORDER: Record<PIIAction, number> = {
  block: 3,
  redact: 2,
  detect: 1,
  allow: 0,
};

function stricterAction(a: PIIAction, b: PIIAction): PIIAction {
  return PII_ACTION_ORDER[a] >= PII_ACTION_ORDER[b] ? a : b;
}

// ---------------------------------------------------------------------------
// Per-rule-category composition for "strictest"
// ---------------------------------------------------------------------------

function composePIIStrictest(rules: (PIIRules | undefined)[]): PIIRules | undefined {
  const defined = rules.filter(Boolean) as PIIRules[];
  if (defined.length === 0) return undefined;

  let action: PIIAction = 'allow';
  const patternsMap = new Map<string, (typeof defined)[0]['patterns'][0]>();

  for (const r of defined) {
    if (r.enabled) {
      action = stricterAction(action, r.action);
    }
    for (const p of [...r.patterns, ...(r.customPatterns ?? [])]) {
      const existing = patternsMap.get(p.name);
      if (!existing || PII_ACTION_ORDER[p.action] > PII_ACTION_ORDER[existing.action]) {
        patternsMap.set(p.name, p);
      }
    }
  }

  return {
    enabled: defined.some((r) => r.enabled),
    action,
    patterns: Array.from(patternsMap.values()),
  };
}

function composeContentStrictest(rules: (ContentRules | undefined)[]): ContentRules | undefined {
  const defined = rules.filter(Boolean) as ContentRules[];
  if (defined.length === 0) return undefined;

  // Union of prohibited, union of required
  const prohibitedMap = new Map<string, ContentRules['prohibited'] extends (infer T)[] | undefined ? T : never>();
  const requiredMap = new Map<string, ContentRules['required'] extends (infer T)[] | undefined ? T : never>();

  for (const r of defined) {
    for (const p of r.prohibited ?? []) prohibitedMap.set(p.name, p);
    for (const p of r.required ?? []) requiredMap.set(p.name, p);
  }

  const toxicities = defined.map((r) => r.maxToxicity).filter((v) => v != null) as number[];

  return {
    enabled: defined.some((r) => r.enabled),
    prohibited: Array.from(prohibitedMap.values()),
    required: Array.from(requiredMap.values()),
    maxToxicity: toxicities.length > 0 ? Math.min(...toxicities) : undefined,
  };
}

function composeModelStrictest(rules: (ModelRules | undefined)[]): ModelRules | undefined {
  const defined = rules.filter(Boolean) as ModelRules[];
  if (defined.length === 0) return undefined;

  // Intersection of allow lists, union of deny lists
  let allow: string[] | undefined;
  const deny = new Set<string>();

  for (const r of defined) {
    if (r.deny) for (const d of r.deny) deny.add(d);

    if (r.allow && r.allow.length > 0) {
      if (allow === undefined) {
        allow = [...r.allow];
      } else {
        // Intersection: keep only patterns that appear in both
        const rSet = new Set(r.allow);
        allow = allow.filter((a) => rSet.has(a));
      }
    }
  }

  const contexts = defined.map((r) => r.maxContextTokens).filter((v) => v != null) as number[];

  return {
    enabled: defined.some((r) => r.enabled),
    allow: allow ?? [],
    deny: Array.from(deny),
    maxContextTokens: contexts.length > 0 ? Math.min(...contexts) : undefined,
  };
}

function composeCostStrictest(rules: (CostRules | undefined)[]): CostRules | undefined {
  const defined = rules.filter(Boolean) as CostRules[];
  if (defined.length === 0) return undefined;

  const min = (field: keyof CostRules): number | undefined => {
    const vals = defined.map((r) => r[field]).filter((v) => v != null) as number[];
    return vals.length > 0 ? Math.min(...vals) : undefined;
  };

  return {
    enabled: defined.some((r) => r.enabled),
    maxCostPerRequest: min('maxCostPerRequest'),
    maxCostPerDay: min('maxCostPerDay'),
    maxCostPerMonth: min('maxCostPerMonth'),
    maxTokensPerRequest: min('maxTokensPerRequest'),
    maxCompletionTokens: min('maxCompletionTokens'),
  };
}

function composeDataStrictest(rules: (DataRules | undefined)[]): DataRules | undefined {
  const defined = rules.filter(Boolean) as DataRules[];
  if (defined.length === 0) return undefined;

  // Intersection of allowed, union of prohibited
  let allowed: string[] | undefined;
  const prohibited = new Set<string>();

  for (const r of defined) {
    if (r.prohibitedCategories) for (const c of r.prohibitedCategories) prohibited.add(c);
    if (r.allowedCategories && r.allowedCategories.length > 0) {
      if (allowed === undefined) {
        allowed = [...r.allowedCategories];
      } else {
        const rSet = new Set(r.allowedCategories);
        allowed = allowed.filter((a) => rSet.has(a));
      }
    }
  }

  const retentionDays = defined
    .map((r) => r.retention?.maxDays)
    .filter((v) => v != null) as number[];

  return {
    enabled: defined.some((r) => r.enabled),
    allowedCategories: allowed,
    prohibitedCategories: Array.from(prohibited),
    retention: {
      maxDays: retentionDays.length > 0 ? Math.min(...retentionDays) : undefined,
      encryptAtRest: defined.some((r) => r.retention?.encryptAtRest),
      encryptInTransit: defined.some((r) => r.retention?.encryptInTransit),
    },
    requireAuditLog: defined.some((r) => r.requireAuditLog),
    requireConsent: defined.some((r) => r.requireConsent),
    allowExport: defined.every((r) => r.allowExport !== false),
    allowDeletion: defined.every((r) => r.allowDeletion !== false),
    purposes: [...new Set(defined.flatMap((r) => r.purposes ?? []))],
  };
}

function composeResponseStrictest(rules: (ResponseRules | undefined)[]): ResponseRules | undefined {
  const defined = rules.filter(Boolean) as ResponseRules[];
  if (defined.length === 0) return undefined;

  const maxLens = defined.map((r) => r.maxLength).filter((v) => v != null) as number[];
  const minLens = defined.map((r) => r.minLength).filter((v) => v != null) as number[];

  const prohibited = new Map<string, NonNullable<ResponseRules['prohibitedPatterns']>[number]>();
  const required = new Map<string, NonNullable<ResponseRules['requiredPatterns']>[number]>();

  for (const r of defined) {
    for (const p of r.prohibitedPatterns ?? []) prohibited.set(p.name, p);
    for (const p of r.requiredPatterns ?? []) required.set(p.name, p);
  }

  return {
    enabled: defined.some((r) => r.enabled),
    maxLength: maxLens.length > 0 ? Math.min(...maxLens) : undefined,
    minLength: minLens.length > 0 ? Math.max(...minLens) : undefined,
    prohibitedPatterns: Array.from(prohibited.values()),
    requiredPatterns: Array.from(required.values()),
    requireJson: defined.some((r) => r.requireJson),
    requiredJsonFields: [...new Set(defined.flatMap((r) => r.requiredJsonFields ?? []))],
  };
}

function composeAccessStrictest(rules: (AccessRules | undefined)[]): AccessRules | undefined {
  const defined = rules.filter(Boolean) as AccessRules[];
  if (defined.length === 0) return undefined;

  // Intersection of allowed roles, union of denied roles
  let allowedRoles: string[] | undefined;
  const deniedRoles = new Set<string>();
  let allowedIPs: string[] | undefined;

  for (const r of defined) {
    if (r.deniedRoles) for (const role of r.deniedRoles) deniedRoles.add(role);
    if (r.allowedRoles && r.allowedRoles.length > 0) {
      if (allowedRoles === undefined) {
        allowedRoles = [...r.allowedRoles];
      } else {
        const rSet = new Set(r.allowedRoles);
        allowedRoles = allowedRoles.filter((a) => rSet.has(a));
      }
    }
    if (r.allowedIPs && r.allowedIPs.length > 0) {
      if (allowedIPs === undefined) {
        allowedIPs = [...r.allowedIPs];
      } else {
        const rSet = new Set(r.allowedIPs);
        allowedIPs = allowedIPs.filter((a) => rSet.has(a));
      }
    }
  }

  const rateLimits = defined.map((r) => r.rateLimit).filter((v) => v != null) as number[];

  return {
    enabled: defined.some((r) => r.enabled),
    allowedRoles,
    deniedRoles: Array.from(deniedRoles),
    requireAuth: defined.some((r) => r.requireAuth),
    requireMFA: defined.some((r) => r.requireMFA),
    allowedIPs,
    rateLimit: rateLimits.length > 0 ? Math.min(...rateLimits) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Strictest composition
// ---------------------------------------------------------------------------

function composeStrictest(policies: Policy[]): PolicyRules {
  return {
    pii: composePIIStrictest(policies.map((p) => p.rules.pii)),
    content: composeContentStrictest(policies.map((p) => p.rules.content)),
    model: composeModelStrictest(policies.map((p) => p.rules.model)),
    cost: composeCostStrictest(policies.map((p) => p.rules.cost)),
    data: composeDataStrictest(policies.map((p) => p.rules.data)),
    response: composeResponseStrictest(policies.map((p) => p.rules.response)),
    access: composeAccessStrictest(policies.map((p) => p.rules.access)),
  };
}

// ---------------------------------------------------------------------------
// First / Last wins (simple deep merge in order)
// ---------------------------------------------------------------------------

function composeOrdered(policies: Policy[], reverse: boolean): PolicyRules {
  const ordered = reverse ? [...policies].reverse() : policies;
  let result: Record<string, unknown> = {};
  for (const p of ordered) {
    result = deepMerge(result, p.rules as unknown as Record<string, unknown>);
  }
  return result as PolicyRules;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compose multiple policies into a single policy.
 *
 * Strategies:
 * - `strictest` (default): most restrictive rules win. block > redact > detect,
 *   lower cost limits, intersection of allowed models, union of denied.
 * - `first`: first policy's rules win on conflict (deep merge, first value kept).
 * - `last`: last policy's rules win on conflict (deep merge, last value kept).
 */
export function compose(
  policies: Policy[],
  strategy: CompositionStrategy = 'strictest',
): Policy {
  if (policies.length === 0) {
    throw new Error('compose: at least one policy is required');
  }
  if (policies.length === 1) {
    return JSON.parse(JSON.stringify(policies[0]));
  }

  let rules: PolicyRules;

  switch (strategy) {
    case 'strictest':
      rules = composeStrictest(policies);
      break;
    case 'first':
      rules = composeOrdered(policies, false);
      break;
    case 'last':
      rules = composeOrdered(policies, true);
      break;
    default:
      throw new Error(`compose: unknown strategy "${strategy}"`);
  }

  const ids = policies.map((p) => p.metadata.id);

  return {
    metadata: {
      id: `composed:${ids.join('+')}`,
      name: `Composed Policy (${strategy})`,
      version: '1.0.0',
      description: `Composed from: ${ids.join(', ')} using ${strategy} strategy`,
      tags: [...new Set(policies.flatMap((p) => p.metadata.tags ?? []))],
    },
    rules,
  };
}
