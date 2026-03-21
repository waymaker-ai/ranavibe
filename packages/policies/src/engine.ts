// ---------------------------------------------------------------------------
// PolicyEngine - main class for loading, evaluating, and composing policies
// ---------------------------------------------------------------------------

import type {
  Policy,
  EvaluationContext,
  EvaluationResult,
  CompositionStrategy,
} from './types.js';
import { evaluatePolicy, evaluatePolicies } from './evaluator.js';
import { parsePolicy } from './loader.js';
import { validatePolicy } from './validator.js';
import { compose } from './composer.js';
import { get as getPreset, list as listPresets } from './presets/index.js';

/**
 * Main entry point for the policy engine. Manages a set of policies,
 * evaluates content against them, and supports composition.
 *
 * ```ts
 * const engine = PolicyEngine.fromPresets(['hipaa', 'safety']);
 * const result = engine.evaluate({ content: 'Patient SSN is 123-45-6789' });
 * ```
 */
export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();

  constructor(policies?: Policy[]) {
    if (policies) {
      for (const p of policies) {
        this.policies.set(p.metadata.id, p);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Static constructors
  // -----------------------------------------------------------------------

  /**
   * Create an engine pre-loaded with the given preset IDs.
   */
  static fromPresets(presetIds: string[]): PolicyEngine {
    const policies = presetIds.map((id) => getPreset(id));
    return new PolicyEngine(policies);
  }

  /**
   * Compose multiple policies into one using the given strategy, then
   * return a new engine with that single composed policy.
   */
  static compose(
    policies: Policy[],
    strategy: CompositionStrategy = 'strictest',
  ): PolicyEngine {
    const composed = compose(policies, strategy);
    return new PolicyEngine([composed]);
  }

  // -----------------------------------------------------------------------
  // Policy management
  // -----------------------------------------------------------------------

  /**
   * Add a policy. If a raw object is provided it will be parsed and validated.
   */
  addPolicy(policyOrRaw: Policy | Record<string, unknown>): this {
    const policy =
      'metadata' in policyOrRaw && 'rules' in policyOrRaw
        ? (policyOrRaw as Policy)
        : parsePolicy(policyOrRaw);

    const validation = validatePolicy(policy);
    if (!validation.valid) {
      const msgs = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
      throw new Error(`Invalid policy: ${msgs}`);
    }

    this.policies.set(policy.metadata.id, policy);
    return this;
  }

  /**
   * Remove a policy by ID.
   */
  removePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  /**
   * Get a loaded policy by ID.
   */
  getPolicy(id: string): Policy | undefined {
    const p = this.policies.get(id);
    return p ? (JSON.parse(JSON.stringify(p)) as Policy) : undefined;
  }

  /**
   * List IDs of all loaded policies.
   */
  listPolicies(): string[] {
    return Array.from(this.policies.keys());
  }

  /**
   * Number of loaded policies.
   */
  get size(): number {
    return this.policies.size;
  }

  // -----------------------------------------------------------------------
  // Evaluation
  // -----------------------------------------------------------------------

  /**
   * Evaluate the given context against all loaded policies.
   */
  evaluate(ctx: EvaluationContext): EvaluationResult {
    const all = Array.from(this.policies.values());
    if (all.length === 0) {
      return {
        passed: true,
        violations: [],
        durationMs: 0,
        policiesEvaluated: [],
      };
    }
    return evaluatePolicies(all, ctx);
  }

  /**
   * Evaluate against a single loaded policy by ID.
   */
  evaluateWith(policyId: string, ctx: EvaluationContext): EvaluationResult {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy "${policyId}" not found in engine`);
    }
    return evaluatePolicy(policy, ctx);
  }

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  /**
   * Export all loaded policies as a JSON-serializable schema object.
   */
  toSchema(): { policies: Policy[] } {
    return {
      policies: Array.from(this.policies.values()).map(
        (p) => JSON.parse(JSON.stringify(p)) as Policy,
      ),
    };
  }

  /**
   * Import policies from a schema object (reverse of toSchema).
   */
  static fromSchema(schema: { policies: unknown[] }): PolicyEngine {
    const engine = new PolicyEngine();
    for (const raw of schema.policies) {
      engine.addPolicy(parsePolicy(raw));
    }
    return engine;
  }

  // -----------------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------------

  /**
   * List available preset IDs that can be used with fromPresets().
   */
  static availablePresets(): string[] {
    return listPresets();
  }
}
