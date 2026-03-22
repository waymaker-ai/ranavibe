// ---------------------------------------------------------------------------
// Custom rule builder - lets users define ad-hoc rules fluently
// ---------------------------------------------------------------------------

import type {
  PIIPattern,
  PIIAction,
  ContentPattern,
  Severity,
  Policy,
  PolicyRules,
  PolicyMetadata,
  CostRules,
  ModelRules,
  DataRules,
  ResponseRules,
  AccessRules,
} from '../types.js';

/**
 * Fluent builder for constructing a Policy programmatically.
 *
 * ```ts
 * const policy = new PolicyBuilder('my-policy', 'My Policy')
 *   .piiPattern({ name: 'custom', pattern: '...', action: 'redact', severity: 'high' })
 *   .prohibitContent({ name: 'no-swear', pattern: '...', severity: 'medium', message: '...' })
 *   .maxCostPerRequest(0.5)
 *   .allowModels(['gpt-4*', 'claude-*'])
 *   .build();
 * ```
 */
export class PolicyBuilder {
  private meta: PolicyMetadata;
  private rules: PolicyRules = {};

  constructor(id: string, name: string, version = '1.0.0') {
    this.meta = { id, name, version };
  }

  // -- Metadata -------------------------------------------------------------

  description(d: string): this {
    this.meta.description = d;
    return this;
  }

  author(a: string): this {
    this.meta.author = a;
    return this;
  }

  tags(...t: string[]): this {
    this.meta.tags = t;
    return this;
  }

  extendsPreset(preset: string): this {
    this.meta.extends = preset;
    return this;
  }

  framework(f: string): this {
    this.meta.framework = f;
    return this;
  }

  // -- PII ------------------------------------------------------------------

  private ensurePII(): void {
    if (!this.rules.pii) {
      this.rules.pii = { enabled: true, action: 'redact', patterns: [] };
    }
  }

  piiAction(action: PIIAction): this {
    this.ensurePII();
    this.rules.pii!.action = action;
    return this;
  }

  piiPattern(p: Omit<PIIPattern, 'flags'> & { flags?: string }): this {
    this.ensurePII();
    this.rules.pii!.patterns.push({ flags: 'gi', ...p });
    return this;
  }

  piiPatterns(patterns: PIIPattern[]): this {
    this.ensurePII();
    this.rules.pii!.patterns.push(...patterns);
    return this;
  }

  piiAllowlist(values: string[]): this {
    this.ensurePII();
    this.rules.pii!.allowlist = values;
    return this;
  }

  // -- Content --------------------------------------------------------------

  private ensureContent(): void {
    if (!this.rules.content) {
      this.rules.content = { enabled: true };
    }
  }

  prohibitContent(p: ContentPattern): this {
    this.ensureContent();
    if (!this.rules.content!.prohibited) this.rules.content!.prohibited = [];
    this.rules.content!.prohibited.push(p);
    return this;
  }

  requireContent(p: ContentPattern): this {
    this.ensureContent();
    if (!this.rules.content!.required) this.rules.content!.required = [];
    this.rules.content!.required.push(p);
    return this;
  }

  maxToxicity(score: number): this {
    this.ensureContent();
    this.rules.content!.maxToxicity = score;
    return this;
  }

  // -- Model ----------------------------------------------------------------

  allowModels(patterns: string[]): this {
    if (!this.rules.model) this.rules.model = { enabled: true };
    this.rules.model.allow = patterns;
    return this;
  }

  denyModels(patterns: string[]): this {
    if (!this.rules.model) this.rules.model = { enabled: true };
    this.rules.model.deny = patterns;
    return this;
  }

  modelRules(r: ModelRules): this {
    this.rules.model = r;
    return this;
  }

  // -- Cost -----------------------------------------------------------------

  maxCostPerRequest(n: number): this {
    if (!this.rules.cost) this.rules.cost = { enabled: true };
    this.rules.cost.maxCostPerRequest = n;
    return this;
  }

  maxCostPerDay(n: number): this {
    if (!this.rules.cost) this.rules.cost = { enabled: true };
    this.rules.cost.maxCostPerDay = n;
    return this;
  }

  maxCostPerMonth(n: number): this {
    if (!this.rules.cost) this.rules.cost = { enabled: true };
    this.rules.cost.maxCostPerMonth = n;
    return this;
  }

  maxTokens(n: number): this {
    if (!this.rules.cost) this.rules.cost = { enabled: true };
    this.rules.cost.maxTokensPerRequest = n;
    return this;
  }

  costRules(r: CostRules): this {
    this.rules.cost = r;
    return this;
  }

  // -- Data -----------------------------------------------------------------

  dataRules(r: DataRules): this {
    this.rules.data = r;
    return this;
  }

  // -- Response -------------------------------------------------------------

  responseRules(r: ResponseRules): this {
    this.rules.response = r;
    return this;
  }

  maxResponseLength(n: number): this {
    if (!this.rules.response) this.rules.response = { enabled: true };
    this.rules.response.maxLength = n;
    return this;
  }

  // -- Access ---------------------------------------------------------------

  accessRules(r: AccessRules): this {
    this.rules.access = r;
    return this;
  }

  allowRoles(roles: string[]): this {
    if (!this.rules.access) this.rules.access = { enabled: true };
    this.rules.access.allowedRoles = roles;
    return this;
  }

  requireAuth(mfa = false): this {
    if (!this.rules.access) this.rules.access = { enabled: true };
    this.rules.access.requireAuth = true;
    this.rules.access.requireMFA = mfa;
    return this;
  }

  rateLimit(rpm: number): this {
    if (!this.rules.access) this.rules.access = { enabled: true };
    this.rules.access.rateLimit = rpm;
    return this;
  }

  // -- Build ----------------------------------------------------------------

  build(): Policy {
    return {
      metadata: { ...this.meta },
      rules: JSON.parse(JSON.stringify(this.rules)),
    };
  }
}

/**
 * Shorthand to create a custom PII pattern.
 */
export function piiPattern(
  name: string,
  pattern: string,
  action: PIIAction = 'redact',
  severity: Severity = 'high',
): PIIPattern {
  return { name, pattern, flags: 'gi', action, severity };
}

/**
 * Shorthand to create a custom content pattern.
 */
export function contentPattern(
  name: string,
  pattern: string,
  message: string,
  severity: Severity = 'medium',
): ContentPattern {
  return { name, pattern, flags: 'gi', severity, message };
}
