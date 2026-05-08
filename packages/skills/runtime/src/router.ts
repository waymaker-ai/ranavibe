/**
 * Architectural move 6: Per-skill model routing.
 *
 * Skills declare `modelClass: light | mid | heavy`. The router maps that
 * to a concrete model based on the project's `aicofounder.config.ts` —
 * or falls back to sensible defaults from the current Claude family.
 *
 * Routing also takes into account input size and budget hints, since a
 * "light" task with 200K tokens of context should bump up a tier.
 */

import type { ModelClass } from "./types.js";

export interface ModelRegistry {
  light?: string;
  mid?: string;
  heavy?: string;
}

export const DEFAULT_MODELS: Required<ModelRegistry> = {
  light: "claude-haiku-4-5-20251001",
  mid: "claude-sonnet-4-6",
  heavy: "claude-opus-4-7",
};

export interface RoutingHint {
  inputTokensEstimate?: number;
  latencyTargetMs?: number;
  costCapPerCall?: number;
  /** User explicitly requested this model — overrides everything else. */
  forceModel?: string;
}

export interface RoutingDecision {
  model: string;
  reason: string;
  bumped: boolean;
}

/**
 * Decide the concrete model for a skill invocation.
 *
 * Logic:
 * 1. Honor `forceModel` if set.
 * 2. Map modelClass → registry entry (or DEFAULT_MODELS).
 * 3. Bump up one tier if context > 50K tokens (small models degrade).
 * 4. Bump down one tier if `costCapPerCall` is tight and the skill class allows it.
 * 5. Never bump down for skills that explicitly need heavy reasoning (compliance, security review).
 */
export function route(
  modelClass: ModelClass,
  hint: RoutingHint = {},
  registry: ModelRegistry = {},
  options: { skillId?: string; forbidDowngrade?: boolean } = {},
): RoutingDecision {
  if (hint.forceModel) {
    return { model: hint.forceModel, reason: "user override (forceModel)", bumped: false };
  }

  const order: ModelClass[] = ["light", "mid", "heavy"];
  let idx = order.indexOf(modelClass);
  if (idx < 0) idx = 1;

  let bumped = false;
  let reason = `modelClass ${modelClass}`;

  // Big context bump
  if ((hint.inputTokensEstimate ?? 0) > 50_000 && idx < order.length - 1) {
    idx += 1;
    bumped = true;
    reason += "; bumped up for large context (>50K tokens)";
  }

  // Tight budget downgrade — but never for heavy-needs skills
  const heavyNeeds = options.forbidDowngrade ?? false;
  if (
    !heavyNeeds &&
    hint.costCapPerCall != null &&
    hint.costCapPerCall < 0.01 &&
    idx > 0
  ) {
    idx -= 1;
    bumped = true;
    reason += `; bumped down for tight cost cap ($${hint.costCapPerCall})`;
  }

  const cls = order[idx];
  const model = registry[cls] ?? DEFAULT_MODELS[cls];
  return { model, reason, bumped };
}

/**
 * Skill IDs that should never be downgraded for cost reasons.
 * These skills' value comes from quality, not throughput.
 */
export const HEAVY_NEEDS_SKILLS = new Set([
  "cofounder-spec-review",
  "cofounder-compliance-frame",
  "cofounder-second-opinion",
  "cofounder-vibespec-author",
  "cofounder-reviewer",
]);
