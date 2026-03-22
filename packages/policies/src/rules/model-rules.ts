// ---------------------------------------------------------------------------
// Model allow/deny list helpers with glob matching
// ---------------------------------------------------------------------------

import type { ModelRules } from '../types.js';

/**
 * Convert a simple glob pattern to a RegExp.
 * Supports `*` (any chars) and `?` (single char).
 */
export function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Check whether a model identifier matches any pattern in a list.
 */
export function matchesAny(model: string, patterns: string[]): boolean {
  return patterns.some((p) => globToRegex(p).test(model));
}

/**
 * Returns true if the model is allowed by the given rules.
 * Deny takes precedence over allow.
 */
export function isModelAllowed(model: string, rules: ModelRules): boolean {
  if (!rules.enabled) return true;
  if (rules.deny && rules.deny.length > 0 && matchesAny(model, rules.deny)) {
    return false;
  }
  if (rules.allow && rules.allow.length > 0) {
    return matchesAny(model, rules.allow);
  }
  return true;
}

// ----- Preset model rules --------------------------------------------------

/** Only allow OpenAI models. */
export const OPENAI_ONLY: ModelRules = {
  enabled: true,
  allow: ['gpt-*', 'o1-*', 'o3-*', 'o4-*'],
  deny: [],
};

/** Only allow Anthropic models. */
export const ANTHROPIC_ONLY: ModelRules = {
  enabled: true,
  allow: ['claude-*'],
  deny: [],
};

/** Allow major providers, deny open-weight models. */
export const MAJOR_PROVIDERS_ONLY: ModelRules = {
  enabled: true,
  allow: ['gpt-*', 'o1-*', 'o3-*', 'o4-*', 'claude-*', 'gemini-*', 'command-*'],
  deny: ['llama-*', 'mistral-*', 'mixtral-*', 'falcon-*'],
};

/** Deny deprecated models. */
export const NO_DEPRECATED: ModelRules = {
  enabled: true,
  allow: [],
  deny: ['gpt-3.5-turbo-0301', 'gpt-4-0314', 'text-davinci-*'],
};

/** Create model rules from simple allow/deny lists. */
export function createModelRules(opts: {
  allow?: string[];
  deny?: string[];
  maxContextTokens?: number;
}): ModelRules {
  return {
    enabled: true,
    allow: opts.allow ?? [],
    deny: opts.deny ?? [],
    maxContextTokens: opts.maxContextTokens,
  };
}
