// ---------------------------------------------------------------------------
// Policy validator - structural & semantic checks
// ---------------------------------------------------------------------------

import type { Policy, Severity, PIIAction } from './types.js';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const VALID_PII_ACTIONS: PIIAction[] = ['block', 'redact', 'detect', 'allow'];

function err(path: string, message: string): ValidationError {
  return { path, message };
}

/**
 * Validate a policy object for structural correctness and required fields.
 */
export function validatePolicy(policy: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (policy == null || typeof policy !== 'object') {
    return { valid: false, errors: [err('', 'Policy must be a non-null object')] };
  }

  const p = policy as Record<string, unknown>;

  // -- metadata -----------------------------------------------------------
  if (!p.metadata || typeof p.metadata !== 'object') {
    errors.push(err('metadata', 'metadata is required and must be an object'));
  } else {
    const m = p.metadata as Record<string, unknown>;
    if (typeof m.id !== 'string' || m.id.length === 0) {
      errors.push(err('metadata.id', 'metadata.id is required and must be a non-empty string'));
    }
    if (typeof m.name !== 'string' || m.name.length === 0) {
      errors.push(err('metadata.name', 'metadata.name is required and must be a non-empty string'));
    }
    if (typeof m.version !== 'string' || m.version.length === 0) {
      errors.push(err('metadata.version', 'metadata.version is required and must be a non-empty string'));
    }
    if (m.extends != null && typeof m.extends !== 'string') {
      errors.push(err('metadata.extends', 'metadata.extends must be a string'));
    }
  }

  // -- rules --------------------------------------------------------------
  if (!p.rules || typeof p.rules !== 'object') {
    errors.push(err('rules', 'rules is required and must be an object'));
  } else {
    const r = p.rules as Record<string, unknown>;

    // PII rules
    if (r.pii != null) {
      if (typeof r.pii !== 'object') {
        errors.push(err('rules.pii', 'rules.pii must be an object'));
      } else {
        const pii = r.pii as Record<string, unknown>;
        if (typeof pii.enabled !== 'boolean') {
          errors.push(err('rules.pii.enabled', 'rules.pii.enabled must be a boolean'));
        }
        if (pii.action != null && !VALID_PII_ACTIONS.includes(pii.action as PIIAction)) {
          errors.push(err('rules.pii.action', `rules.pii.action must be one of: ${VALID_PII_ACTIONS.join(', ')}`));
        }
        if (pii.patterns != null) {
          if (!Array.isArray(pii.patterns)) {
            errors.push(err('rules.pii.patterns', 'rules.pii.patterns must be an array'));
          } else {
            for (let i = 0; i < pii.patterns.length; i++) {
              const pat = pii.patterns[i] as Record<string, unknown>;
              const base = `rules.pii.patterns[${i}]`;
              if (typeof pat.name !== 'string') errors.push(err(`${base}.name`, 'name is required'));
              if (typeof pat.pattern !== 'string') errors.push(err(`${base}.pattern`, 'pattern is required'));
              if (!VALID_PII_ACTIONS.includes(pat.action as PIIAction)) {
                errors.push(err(`${base}.action`, `action must be one of: ${VALID_PII_ACTIONS.join(', ')}`));
              }
              if (!VALID_SEVERITIES.includes(pat.severity as Severity)) {
                errors.push(err(`${base}.severity`, `severity must be one of: ${VALID_SEVERITIES.join(', ')}`));
              }
              // Validate regex compiles
              if (typeof pat.pattern === 'string') {
                try {
                  new RegExp(pat.pattern, (pat.flags as string) ?? 'gi');
                } catch (e) {
                  errors.push(err(`${base}.pattern`, `Invalid regex: ${(e as Error).message}`));
                }
              }
            }
          }
        }
      }
    }

    // Content rules
    if (r.content != null) {
      if (typeof r.content !== 'object') {
        errors.push(err('rules.content', 'rules.content must be an object'));
      } else {
        const c = r.content as Record<string, unknown>;
        if (typeof c.enabled !== 'boolean') {
          errors.push(err('rules.content.enabled', 'rules.content.enabled must be a boolean'));
        }
        validateContentPatterns(c.prohibited, 'rules.content.prohibited', errors);
        validateContentPatterns(c.required, 'rules.content.required', errors);
        if (c.maxToxicity != null && (typeof c.maxToxicity !== 'number' || c.maxToxicity < 0 || c.maxToxicity > 1)) {
          errors.push(err('rules.content.maxToxicity', 'maxToxicity must be a number between 0 and 1'));
        }
      }
    }

    // Model rules
    if (r.model != null) {
      if (typeof r.model !== 'object') {
        errors.push(err('rules.model', 'rules.model must be an object'));
      } else {
        const m = r.model as Record<string, unknown>;
        if (typeof m.enabled !== 'boolean') {
          errors.push(err('rules.model.enabled', 'rules.model.enabled must be a boolean'));
        }
        if (m.allow != null && !Array.isArray(m.allow)) {
          errors.push(err('rules.model.allow', 'allow must be an array of strings'));
        }
        if (m.deny != null && !Array.isArray(m.deny)) {
          errors.push(err('rules.model.deny', 'deny must be an array of strings'));
        }
      }
    }

    // Cost rules
    if (r.cost != null) {
      if (typeof r.cost !== 'object') {
        errors.push(err('rules.cost', 'rules.cost must be an object'));
      } else {
        const c = r.cost as Record<string, unknown>;
        if (typeof c.enabled !== 'boolean') {
          errors.push(err('rules.cost.enabled', 'rules.cost.enabled must be a boolean'));
        }
        for (const field of ['maxCostPerRequest', 'maxCostPerDay', 'maxCostPerMonth', 'maxTokensPerRequest', 'maxCompletionTokens']) {
          if (c[field] != null && (typeof c[field] !== 'number' || (c[field] as number) < 0)) {
            errors.push(err(`rules.cost.${field}`, `${field} must be a non-negative number`));
          }
        }
      }
    }

    // Data rules
    if (r.data != null) {
      if (typeof r.data !== 'object') {
        errors.push(err('rules.data', 'rules.data must be an object'));
      } else {
        const d = r.data as Record<string, unknown>;
        if (typeof d.enabled !== 'boolean') {
          errors.push(err('rules.data.enabled', 'rules.data.enabled must be a boolean'));
        }
      }
    }

    // Response rules
    if (r.response != null) {
      if (typeof r.response !== 'object') {
        errors.push(err('rules.response', 'rules.response must be an object'));
      } else {
        const rr = r.response as Record<string, unknown>;
        if (typeof rr.enabled !== 'boolean') {
          errors.push(err('rules.response.enabled', 'rules.response.enabled must be a boolean'));
        }
        if (rr.maxLength != null && (typeof rr.maxLength !== 'number' || (rr.maxLength as number) < 0)) {
          errors.push(err('rules.response.maxLength', 'maxLength must be a non-negative number'));
        }
        if (rr.minLength != null && (typeof rr.minLength !== 'number' || (rr.minLength as number) < 0)) {
          errors.push(err('rules.response.minLength', 'minLength must be a non-negative number'));
        }
      }
    }

    // Access rules
    if (r.access != null) {
      if (typeof r.access !== 'object') {
        errors.push(err('rules.access', 'rules.access must be an object'));
      } else {
        const a = r.access as Record<string, unknown>;
        if (typeof a.enabled !== 'boolean') {
          errors.push(err('rules.access.enabled', 'rules.access.enabled must be a boolean'));
        }
        if (a.rateLimit != null && (typeof a.rateLimit !== 'number' || (a.rateLimit as number) <= 0)) {
          errors.push(err('rules.access.rateLimit', 'rateLimit must be a positive number'));
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateContentPatterns(
  patterns: unknown,
  path: string,
  errors: ValidationError[],
): void {
  if (patterns == null) return;
  if (!Array.isArray(patterns)) {
    errors.push(err(path, `${path} must be an array`));
    return;
  }
  for (let i = 0; i < patterns.length; i++) {
    const pat = patterns[i] as Record<string, unknown>;
    const base = `${path}[${i}]`;
    if (typeof pat.name !== 'string') errors.push(err(`${base}.name`, 'name is required'));
    if (typeof pat.pattern !== 'string') errors.push(err(`${base}.pattern`, 'pattern is required'));
    if (typeof pat.message !== 'string') errors.push(err(`${base}.message`, 'message is required'));
    if (!VALID_SEVERITIES.includes(pat.severity as Severity)) {
      errors.push(err(`${base}.severity`, `severity must be one of: ${VALID_SEVERITIES.join(', ')}`));
    }
    if (typeof pat.pattern === 'string') {
      try {
        new RegExp(pat.pattern, (pat.flags as string) ?? 'gi');
      } catch (e) {
        errors.push(err(`${base}.pattern`, `Invalid regex: ${(e as Error).message}`));
      }
    }
  }
}
