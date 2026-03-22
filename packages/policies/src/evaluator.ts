// ---------------------------------------------------------------------------
// Core evaluation engine
// ---------------------------------------------------------------------------

import type {
  Policy,
  EvaluationContext,
  EvaluationResult,
  Violation,
  PIIRules,
  ContentRules,
  ModelRules,
  CostRules,
  ResponseRules,
  AccessRules,
  PIIAction,
} from './types.js';
import { isModelAllowed } from './rules/model-rules.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ACTION_SEVERITY_ORDER: Record<PIIAction, number> = {
  block: 3,
  redact: 2,
  detect: 1,
  allow: 0,
};

function shouldBlock(violations: Violation[]): boolean {
  return violations.some(
    (v) =>
      v.action === 'block' ||
      (v.severity === 'critical' && v.action !== 'allow'),
  );
}

function applyRedactions(content: string, violations: Violation[]): string {
  // Sort violations by start position descending so we can splice from the end.
  const redactable = violations
    .filter((v) => v.action === 'redact' && v.start != null && v.end != null)
    .sort((a, b) => (b.start ?? 0) - (a.start ?? 0));

  let result = content;
  for (const v of redactable) {
    const before = result.slice(0, v.start!);
    const after = result.slice(v.end!);
    const placeholder = `[${v.rule.toUpperCase()}_REDACTED]`;
    result = before + placeholder + after;
  }
  return result;
}

// ---------------------------------------------------------------------------
// PII evaluation
// ---------------------------------------------------------------------------

function evaluatePII(
  content: string,
  rules: PIIRules,
): Violation[] {
  if (!rules.enabled) return [];

  const violations: Violation[] = [];
  const allPatterns = [...rules.patterns, ...(rules.customPatterns ?? [])];
  const allowSet = new Set((rules.allowlist ?? []).map((v) => v.toLowerCase()));

  for (const pat of allPatterns) {
    const re = new RegExp(pat.pattern, pat.flags ?? 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const value = match[0];
      if (allowSet.has(value.toLowerCase())) continue;

      const action: PIIAction =
        ACTION_SEVERITY_ORDER[pat.action] >= ACTION_SEVERITY_ORDER[rules.action]
          ? pat.action
          : rules.action;

      violations.push({
        rule: pat.name,
        category: 'pii',
        severity: pat.severity,
        message: pat.description ?? `PII detected: ${pat.name}`,
        match: value,
        start: match.index,
        end: match.index + value.length,
        action,
      });

      // Prevent infinite loops on zero-length matches.
      if (match[0].length === 0) re.lastIndex++;
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Content evaluation
// ---------------------------------------------------------------------------

function evaluateContent(
  content: string,
  rules: ContentRules,
): Violation[] {
  if (!rules.enabled) return [];

  const violations: Violation[] = [];

  // Prohibited patterns
  for (const pat of rules.prohibited ?? []) {
    const re = new RegExp(pat.pattern, pat.flags ?? 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      violations.push({
        rule: pat.name,
        category: 'content',
        severity: pat.severity,
        message: pat.message,
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
        action: 'block',
      });
      if (match[0].length === 0) re.lastIndex++;
    }
  }

  // Required patterns (must be present)
  for (const pat of rules.required ?? []) {
    const re = new RegExp(pat.pattern, pat.flags ?? 'gi');
    if (!re.test(content)) {
      violations.push({
        rule: pat.name,
        category: 'content',
        severity: pat.severity,
        message: pat.message,
        action: 'warn',
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Model evaluation
// ---------------------------------------------------------------------------

function evaluateModel(
  model: string | undefined,
  rules: ModelRules,
): Violation[] {
  if (!rules.enabled || model == null) return [];

  const violations: Violation[] = [];

  if (!isModelAllowed(model, rules)) {
    violations.push({
      rule: 'model-not-allowed',
      category: 'model',
      severity: 'high',
      message: `Model "${model}" is not permitted by policy`,
      match: model,
      action: 'block',
    });
  }

  if (rules.maxContextTokens != null) {
    // We can't check token count here without the value being provided;
    // this is validated via the cost context below if tokens are supplied.
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Cost evaluation
// ---------------------------------------------------------------------------

function evaluateCost(
  ctx: EvaluationContext,
  rules: CostRules,
): Violation[] {
  if (!rules.enabled) return [];

  const violations: Violation[] = [];

  if (rules.maxCostPerRequest != null && ctx.cost != null && ctx.cost > rules.maxCostPerRequest) {
    violations.push({
      rule: 'cost-per-request',
      category: 'cost',
      severity: 'high',
      message: `Request cost $${ctx.cost.toFixed(4)} exceeds limit of $${rules.maxCostPerRequest.toFixed(4)}`,
      match: String(ctx.cost),
      action: 'block',
    });
  }

  if (rules.maxCostPerDay != null && ctx.dailyCost != null && ctx.dailyCost > rules.maxCostPerDay) {
    violations.push({
      rule: 'cost-per-day',
      category: 'cost',
      severity: 'high',
      message: `Daily cost $${ctx.dailyCost.toFixed(2)} exceeds limit of $${rules.maxCostPerDay.toFixed(2)}`,
      match: String(ctx.dailyCost),
      action: 'block',
    });
  }

  if (rules.maxCostPerMonth != null && ctx.monthlyCost != null && ctx.monthlyCost > rules.maxCostPerMonth) {
    violations.push({
      rule: 'cost-per-month',
      category: 'cost',
      severity: 'high',
      message: `Monthly cost $${ctx.monthlyCost.toFixed(2)} exceeds limit of $${rules.maxCostPerMonth.toFixed(2)}`,
      match: String(ctx.monthlyCost),
      action: 'block',
    });
  }

  if (rules.maxTokensPerRequest != null && ctx.tokens != null && ctx.tokens > rules.maxTokensPerRequest) {
    violations.push({
      rule: 'tokens-per-request',
      category: 'cost',
      severity: 'medium',
      message: `Token count ${ctx.tokens} exceeds limit of ${rules.maxTokensPerRequest}`,
      match: String(ctx.tokens),
      action: 'block',
    });
  }

  if (rules.maxCompletionTokens != null && ctx.completionTokens != null && ctx.completionTokens > rules.maxCompletionTokens) {
    violations.push({
      rule: 'completion-tokens',
      category: 'cost',
      severity: 'medium',
      message: `Completion tokens ${ctx.completionTokens} exceeds limit of ${rules.maxCompletionTokens}`,
      match: String(ctx.completionTokens),
      action: 'block',
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Response evaluation
// ---------------------------------------------------------------------------

function evaluateResponse(
  content: string | undefined,
  rules: ResponseRules,
): Violation[] {
  if (!rules.enabled || content == null) return [];

  const violations: Violation[] = [];

  if (rules.maxLength != null && content.length > rules.maxLength) {
    violations.push({
      rule: 'response-max-length',
      category: 'response',
      severity: 'medium',
      message: `Response length ${content.length} exceeds maximum of ${rules.maxLength}`,
      action: 'block',
    });
  }

  if (rules.minLength != null && content.length < rules.minLength) {
    violations.push({
      rule: 'response-min-length',
      category: 'response',
      severity: 'low',
      message: `Response length ${content.length} is below minimum of ${rules.minLength}`,
      action: 'warn',
    });
  }

  // Prohibited patterns
  for (const pat of rules.prohibitedPatterns ?? []) {
    const re = new RegExp(pat.pattern, pat.flags ?? 'gi');
    if (re.test(content)) {
      violations.push({
        rule: pat.name,
        category: 'response',
        severity: pat.severity,
        message: pat.message,
        action: 'block',
      });
    }
  }

  // Required patterns
  for (const pat of rules.requiredPatterns ?? []) {
    const re = new RegExp(pat.pattern, pat.flags ?? 'gi');
    if (!re.test(content)) {
      violations.push({
        rule: pat.name,
        category: 'response',
        severity: pat.severity,
        message: pat.message,
        action: 'warn',
      });
    }
  }

  // JSON validation
  if (rules.requireJson) {
    try {
      const parsed = JSON.parse(content);
      if (rules.requiredJsonFields) {
        for (const field of rules.requiredJsonFields) {
          if (!(field in parsed)) {
            violations.push({
              rule: 'required-json-field',
              category: 'response',
              severity: 'medium',
              message: `Required JSON field "${field}" is missing`,
              match: field,
              action: 'block',
            });
          }
        }
      }
    } catch {
      violations.push({
        rule: 'invalid-json',
        category: 'response',
        severity: 'high',
        message: 'Response is not valid JSON but policy requires JSON output',
        action: 'block',
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Access control evaluation
// ---------------------------------------------------------------------------

function evaluateAccess(
  ctx: EvaluationContext,
  rules: AccessRules,
): Violation[] {
  if (!rules.enabled) return [];

  const violations: Violation[] = [];

  if (rules.requireAuth && !ctx.authenticated) {
    violations.push({
      rule: 'auth-required',
      category: 'access',
      severity: 'critical',
      message: 'Authentication is required',
      action: 'block',
    });
  }

  if (rules.requireMFA && !ctx.mfa) {
    violations.push({
      rule: 'mfa-required',
      category: 'access',
      severity: 'critical',
      message: 'Multi-factor authentication is required',
      action: 'block',
    });
  }

  if (rules.allowedRoles && rules.allowedRoles.length > 0 && ctx.role) {
    if (!rules.allowedRoles.includes(ctx.role)) {
      violations.push({
        rule: 'role-not-allowed',
        category: 'access',
        severity: 'high',
        message: `Role "${ctx.role}" is not permitted`,
        match: ctx.role,
        action: 'block',
      });
    }
  }

  if (rules.deniedRoles && rules.deniedRoles.length > 0 && ctx.role) {
    if (rules.deniedRoles.includes(ctx.role)) {
      violations.push({
        rule: 'role-denied',
        category: 'access',
        severity: 'high',
        message: `Role "${ctx.role}" is explicitly denied`,
        match: ctx.role,
        action: 'block',
      });
    }
  }

  if (rules.allowedIPs && rules.allowedIPs.length > 0 && ctx.ip) {
    const allowed = rules.allowedIPs.some((cidr) => ipMatchesCIDR(ctx.ip!, cidr));
    if (!allowed) {
      violations.push({
        rule: 'ip-not-allowed',
        category: 'access',
        severity: 'high',
        message: `IP "${ctx.ip}" is not in the allowlist`,
        match: ctx.ip,
        action: 'block',
      });
    }
  }

  return violations;
}

/**
 * Simple CIDR / exact-match check for IPv4. For production use a proper IP
 * library; this handles common cases with zero dependencies.
 */
function ipMatchesCIDR(ip: string, cidr: string): boolean {
  if (cidr === ip) return true;
  const parts = cidr.split('/');
  if (parts.length !== 2) return ip === cidr;

  const cidrIp = parts[0];
  const prefixLen = parseInt(parts[1], 10);
  if (isNaN(prefixLen)) return false;

  const ipNum = ipToNumber(ip);
  const cidrNum = ipToNumber(cidrIp);
  if (ipNum === null || cidrNum === null) return false;

  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipNum & mask) === (cidrNum & mask);
}

function ipToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    num = (num << 8) | n;
  }
  return num >>> 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a single policy against a context. Returns all violations found.
 */
export function evaluatePolicy(
  policy: Policy,
  ctx: EvaluationContext,
): EvaluationResult {
  const start = Date.now();
  const violations: Violation[] = [];

  const { rules } = policy;

  // Access (check first - if blocked, no point evaluating content)
  if (rules.access) {
    violations.push(...evaluateAccess(ctx, rules.access));
  }

  // PII
  if (rules.pii && ctx.content) {
    violations.push(...evaluatePII(ctx.content, rules.pii));
  }

  // Content
  if (rules.content && ctx.content) {
    violations.push(...evaluateContent(ctx.content, rules.content));
  }

  // Model
  if (rules.model) {
    violations.push(...evaluateModel(ctx.model, rules.model));
  }

  // Cost
  if (rules.cost) {
    violations.push(...evaluateCost(ctx, rules.cost));
  }

  // Response
  if (rules.response && ctx.content) {
    violations.push(...evaluateResponse(ctx.content, rules.response));
  }

  const blocked = shouldBlock(violations);
  const needsRedaction = violations.some((v) => v.action === 'redact');

  const result: EvaluationResult = {
    passed: !blocked,
    violations,
    durationMs: Date.now() - start,
    policiesEvaluated: [policy.metadata.id],
  };

  if (needsRedaction && ctx.content && !blocked) {
    result.redactedContent = applyRedactions(ctx.content, violations);
  }

  return result;
}

/**
 * Evaluate multiple policies against a context. Merges all violations.
 */
export function evaluatePolicies(
  policies: Policy[],
  ctx: EvaluationContext,
): EvaluationResult {
  const start = Date.now();
  const allViolations: Violation[] = [];
  const ids: string[] = [];

  for (const policy of policies) {
    const r = evaluatePolicy(policy, ctx);
    allViolations.push(...r.violations);
    ids.push(...r.policiesEvaluated);
  }

  const blocked = shouldBlock(allViolations);
  const needsRedaction = allViolations.some((v) => v.action === 'redact');

  const result: EvaluationResult = {
    passed: !blocked,
    violations: allViolations,
    durationMs: Date.now() - start,
    policiesEvaluated: ids,
  };

  if (needsRedaction && ctx.content && !blocked) {
    result.redactedContent = applyRedactions(ctx.content, allViolations);
  }

  return result;
}
