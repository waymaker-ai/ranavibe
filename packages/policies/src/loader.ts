// ---------------------------------------------------------------------------
// Policy loader - parse & resolve `extends` keyword via deep merge
// ---------------------------------------------------------------------------

import type { Policy, PolicyRules } from './types.js';
import { validatePolicy } from './validator.js';

// We import the presets lazily (by name) to avoid circular deps at init time.
// The preset registry is populated by presets/index.ts.
let presetRegistry: Map<string, Policy> | null = null;

/**
 * Register the preset map so the loader can resolve `extends`.
 * Called automatically by the presets barrel.
 */
export function registerPresets(presets: Map<string, Policy>): void {
  presetRegistry = presets;
}

// ---------------------------------------------------------------------------
// Deep merge utility
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `source` into `target`. Arrays are concatenated, objects are
 * recursively merged, scalars from source overwrite target.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const tVal = result[key];
    const sVal = source[key];

    if (Array.isArray(sVal) && Array.isArray(tVal)) {
      // Deduplicate by serialising each element.
      const seen = new Set(tVal.map((v) => JSON.stringify(v)));
      const merged = [...tVal];
      for (const item of sVal) {
        const s = JSON.stringify(item);
        if (!seen.has(s)) {
          merged.push(item);
          seen.add(s);
        }
      }
      result[key] = merged;
    } else if (isPlainObject(sVal) && isPlainObject(tVal)) {
      result[key] = deepMerge(tVal as Record<string, unknown>, sVal);
    } else {
      result[key] = sVal;
    }
  }

  return result as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a raw object (e.g. from JSON / YAML) into a validated Policy.
 * If `metadata.extends` is set, the policy inherits from the named preset
 * and the user-supplied rules are deep-merged on top.
 *
 * Throws if validation fails.
 */
export function parsePolicy(obj: unknown): Policy {
  if (obj == null || typeof obj !== 'object') {
    throw new Error('parsePolicy: input must be a non-null object');
  }

  const raw = obj as Record<string, unknown>;

  // Resolve extends
  let base: Policy | undefined;
  const meta = raw.metadata as Record<string, unknown> | undefined;
  if (meta?.extends && typeof meta.extends === 'string') {
    base = resolvePreset(meta.extends);
  }

  let policy: Policy;
  if (base) {
    // Deep merge: base rules + override rules
    const mergedRules = deepMerge(
      JSON.parse(JSON.stringify(base.rules)) as Record<string, unknown>,
      (raw.rules ?? {}) as Record<string, unknown>,
    ) as PolicyRules;

    policy = {
      metadata: {
        ...base.metadata,
        ...(meta as Record<string, unknown>),
        id: (meta?.id as string) ?? base.metadata.id,
        name: (meta?.name as string) ?? base.metadata.name,
        version: (meta?.version as string) ?? base.metadata.version,
      } as Policy['metadata'],
      rules: mergedRules,
    };
  } else {
    policy = obj as Policy;
  }

  const result = validatePolicy(policy);
  if (!result.valid) {
    const messages = result.errors.map((e) => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`parsePolicy: validation failed:\n${messages}`);
  }

  return policy;
}

function resolvePreset(name: string): Policy {
  if (!presetRegistry) {
    throw new Error(
      `parsePolicy: cannot resolve extends "${name}" - preset registry not initialised. ` +
      'Import from @cofounder/policies/presets first.',
    );
  }
  const preset = presetRegistry.get(name);
  if (!preset) {
    const available = Array.from(presetRegistry.keys()).join(', ');
    throw new Error(
      `parsePolicy: unknown preset "${name}". Available: ${available}`,
    );
  }
  return JSON.parse(JSON.stringify(preset)) as Policy;
}
