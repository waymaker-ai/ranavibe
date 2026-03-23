// ---------------------------------------------------------------------------
// @waymakerai/aicofounder-validator-registry - ValidatorRegistry implementation
// ---------------------------------------------------------------------------

import type {
  CombinedValidator,
  PipelineResult,
  RegistryConfig,
  RegistryExport,
  Severity,
  SerializableValidator,
  Validator,
  ValidatorDetection,
  ValidatorFilter,
  ValidatorMatch,
  ValidatorResult,
  ValidatorStats,
} from './types.js';
import { BUILTIN_VALIDATORS } from './builtins.js';

// ---------------------------------------------------------------------------
// Severity ordering
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function highestSeverity(a: Severity | null, b: Severity): Severity {
  if (!a) return b;
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

// ---------------------------------------------------------------------------
// ValidatorRegistry
// ---------------------------------------------------------------------------

export class ValidatorRegistry {
  private validators: Map<string, Validator> = new Map();
  private combinedValidators: Map<string, CombinedValidator> = new Map();
  private stats: Map<string, ValidatorStats> = new Map();
  private trackStats: boolean;

  constructor(config?: RegistryConfig) {
    this.trackStats = config?.trackStats !== false;

    if (config?.loadBuiltins !== false) {
      for (const v of BUILTIN_VALIDATORS) {
        this.validators.set(v.id, v);
        if (this.trackStats) this.initStats(v.id);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Register a custom validator. */
  register(validator: Validator): void {
    this.validators.set(validator.id, { ...validator });
    if (this.trackStats) this.initStats(validator.id);
  }

  /** Get a validator by ID. */
  get(id: string): Validator | undefined {
    return this.validators.get(id);
  }

  /** List all validators, optionally filtered. */
  list(filter?: ValidatorFilter): Validator[] {
    let result = Array.from(this.validators.values());

    if (filter) {
      if (filter.category) {
        result = result.filter((v) => v.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        result = result.filter(
          (v) => v.tags && filter.tags!.some((t) => v.tags!.includes(t))
        );
      }
      if (filter.author) {
        result = result.filter(
          (v) => v.author.toLowerCase() === filter.author!.toLowerCase()
        );
      }
      if (filter.enabled !== undefined) {
        result = result.filter((v) => (v.enabled !== false) === filter.enabled);
      }
      if (filter.search) {
        const term = filter.search.toLowerCase();
        result = result.filter(
          (v) =>
            v.name.toLowerCase().includes(term) ||
            v.description.toLowerCase().includes(term)
        );
      }
    }

    return result;
  }

  /** Run a validator against input. */
  run(validatorId: string, input: string, context?: Record<string, unknown>): ValidatorResult {
    const validator = this.validators.get(validatorId);
    if (!validator) {
      return {
        detected: false,
        severity: 'info',
        message: `Validator "${validatorId}" not found`,
        matches: [],
        durationMs: 0,
        validatorId,
      };
    }

    // Check if combined validator
    const combined = this.combinedValidators.get(validatorId);
    if (combined) {
      return this.runCombined(combined, input, context);
    }

    const start = Date.now();
    let detected = false;
    let matches: ValidatorMatch[] = [];
    let message = '';

    if (validator.definition.type === 'pattern') {
      const flags = validator.definition.flags ?? 'gi';
      const regex = new RegExp(validator.definition.pattern, flags);
      let match: RegExpExecArray | null;
      // Reset lastIndex for global regexes
      regex.lastIndex = 0;
      while ((match = regex.exec(input)) !== null) {
        detected = true;
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) regex.lastIndex++;
      }
      message = detected
        ? `${validator.name}: ${matches.length} match(es) found`
        : `${validator.name}: no matches`;
    } else {
      // Function-based validator
      try {
        const detection: ValidatorDetection = validator.definition.detect(input, context);
        detected = detection.detected;
        matches = detection.matches;
        message = detection.message ?? (detected ? `${validator.name}: detected` : `${validator.name}: clean`);
      } catch (err) {
        message = `${validator.name}: error during detection`;
      }
    }

    const durationMs = Date.now() - start;

    if (this.trackStats) {
      this.updateStats(validatorId, detected, durationMs);
    }

    return {
      detected,
      severity: validator.severity,
      message,
      matches,
      durationMs,
      validatorId,
    };
  }

  /** Run multiple validators as a pipeline. */
  pipeline(
    validatorIds: string[],
    input: string,
    context?: Record<string, unknown>
  ): PipelineResult {
    const start = Date.now();
    const results: ValidatorResult[] = [];
    let detectCount = 0;
    let highest: Severity | null = null;

    // Sort by priority
    const sorted = validatorIds
      .map((id) => ({ id, validator: this.validators.get(id) }))
      .sort((a, b) => {
        const pa = a.validator?.priority ?? 100;
        const pb = b.validator?.priority ?? 100;
        return pa - pb;
      });

    for (const { id } of sorted) {
      const result = this.run(id, input, context);
      results.push(result);
      if (result.detected) {
        detectCount++;
        highest = highestSeverity(highest, result.severity);
      }
    }

    return {
      detected: detectCount > 0,
      results,
      durationMs: Date.now() - start,
      detectCount,
      highestSeverity: highest,
    };
  }

  /** Import validators from JSON object or JSON string. */
  import(source: string | object): void {
    let data: RegistryExport;
    if (typeof source === 'string') {
      data = JSON.parse(source) as RegistryExport;
    } else {
      data = source as RegistryExport;
    }

    if (!data.validators || !Array.isArray(data.validators)) {
      throw new Error('Invalid import format: missing validators array');
    }

    for (const sv of data.validators) {
      const validator: Validator = {
        id: sv.id,
        name: sv.name,
        description: sv.description,
        category: sv.category,
        version: sv.version,
        author: sv.author,
        tags: sv.tags,
        severity: sv.severity,
        priority: sv.priority,
        enabled: sv.enabled,
        definition: {
          type: 'pattern',
          pattern: sv.pattern,
          flags: sv.flags,
        },
      };
      this.register(validator);
    }
  }

  /** Export registry as a serializable object. */
  export(): RegistryExport {
    const validators: SerializableValidator[] = [];

    for (const v of this.validators.values()) {
      if (v.definition.type === 'pattern') {
        validators.push({
          id: v.id,
          name: v.name,
          description: v.description,
          category: v.category,
          version: v.version,
          author: v.author,
          tags: v.tags,
          severity: v.severity,
          pattern: v.definition.pattern,
          flags: v.definition.flags,
          priority: v.priority,
          enabled: v.enabled,
        });
      }
      // Function-based validators cannot be serialized
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      validators,
    };
  }

  /** Register a combined (AND/OR/NOT) validator. */
  registerCombined(combined: CombinedValidator): void {
    // Create a synthetic validator entry
    const validator: Validator = {
      id: combined.id,
      name: combined.name,
      description: `Combined validator (${combined.combinator}) of: ${combined.validatorIds.join(', ')}`,
      category: 'custom',
      version: '1.0.0',
      author: 'system',
      severity: combined.severity ?? 'medium',
      definition: {
        type: 'function',
        detect: (_input: string) => ({
          detected: false,
          matches: [],
        }),
      },
    };
    this.validators.set(combined.id, validator);
    this.combinedValidators.set(combined.id, combined);
    if (this.trackStats) this.initStats(combined.id);
  }

  /** Get statistics for a validator. */
  getStats(validatorId: string): ValidatorStats | undefined {
    return this.stats.get(validatorId);
  }

  /** Report a false positive for a validator. */
  reportFalsePositive(validatorId: string): void {
    const stats = this.stats.get(validatorId);
    if (stats) {
      stats.falsePositivesReported += 1;
    }
  }

  /** Remove a validator by ID. */
  remove(id: string): boolean {
    this.combinedValidators.delete(id);
    this.stats.delete(id);
    return this.validators.delete(id);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private initStats(id: string): void {
    if (!this.stats.has(id)) {
      this.stats.set(id, {
        calls: 0,
        matches: 0,
        falsePositivesReported: 0,
        lastRunAt: null,
        avgDurationMs: 0,
      });
    }
  }

  private updateStats(id: string, detected: boolean, durationMs: number): void {
    const stats = this.stats.get(id);
    if (!stats) return;
    stats.calls += 1;
    if (detected) stats.matches += 1;
    stats.lastRunAt = Date.now();
    // Running average
    stats.avgDurationMs =
      (stats.avgDurationMs * (stats.calls - 1) + durationMs) / stats.calls;
  }

  private runCombined(
    combined: CombinedValidator,
    input: string,
    context?: Record<string, unknown>
  ): ValidatorResult {
    const start = Date.now();
    const subResults: ValidatorResult[] = [];

    for (const id of combined.validatorIds) {
      if (id !== combined.id) {
        subResults.push(this.run(id, input, context));
      }
    }

    let detected = false;
    let allMatches: ValidatorMatch[] = [];

    switch (combined.combinator) {
      case 'and':
        detected = subResults.length > 0 && subResults.every((r) => r.detected);
        if (detected) {
          allMatches = subResults.flatMap((r) => r.matches);
        }
        break;
      case 'or':
        detected = subResults.some((r) => r.detected);
        allMatches = subResults.filter((r) => r.detected).flatMap((r) => r.matches);
        break;
      case 'not':
        detected = subResults.length > 0 && !subResults.some((r) => r.detected);
        break;
    }

    const severity = combined.severity ?? 'medium';
    const durationMs = Date.now() - start;

    if (this.trackStats) {
      this.updateStats(combined.id, detected, durationMs);
    }

    return {
      detected,
      severity,
      message: `${combined.name}: ${detected ? 'detected' : 'clean'} (${combined.combinator})`,
      matches: allMatches,
      durationMs,
      validatorId: combined.id,
    };
  }
}
