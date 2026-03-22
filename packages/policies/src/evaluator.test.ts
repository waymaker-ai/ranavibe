import { describe, it, expect } from 'vitest';
import { evaluatePolicy, evaluatePolicies } from './evaluator.js';
import type { Policy, EvaluationContext } from './types.js';

function makePolicy(overrides: Partial<Policy['rules']> = {}): Policy {
  return {
    metadata: { id: 'test', name: 'Test Policy', version: '1.0.0' },
    rules: overrides,
  };
}

describe('evaluatePolicy', () => {
  describe('PII evaluation', () => {
    it('should detect email PII', () => {
      const policy = makePolicy({
        pii: {
          enabled: true,
          action: 'block',
          patterns: [
            { name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'block', severity: 'high' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'Email: user@example.com' });
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations[0].category).toBe('pii');
      expect(result.violations[0].match).toBe('user@example.com');
    });

    it('should not detect PII when disabled', () => {
      const policy = makePolicy({
        pii: {
          enabled: false,
          action: 'block',
          patterns: [
            { name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'block', severity: 'high' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'Email: user@example.com' });
      expect(result.violations).toHaveLength(0);
    });

    it('should respect allowlist', () => {
      const policy = makePolicy({
        pii: {
          enabled: true,
          action: 'block',
          patterns: [
            { name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'block', severity: 'high' },
          ],
          allowlist: ['noreply@example.com'],
        },
      });
      const result = evaluatePolicy(policy, { content: 'Email: noreply@example.com' });
      expect(result.violations).toHaveLength(0);
    });

    it('should use redact action and provide redacted content', () => {
      const policy = makePolicy({
        pii: {
          enabled: true,
          action: 'redact',
          patterns: [
            { name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'redact', severity: 'high' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'Email: user@example.com' });
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.redactedContent).toBeDefined();
      expect(result.redactedContent).toContain('[EMAIL_REDACTED]');
    });

    it('should detect SSN patterns', () => {
      const policy = makePolicy({
        pii: {
          enabled: true,
          action: 'block',
          patterns: [
            { name: 'ssn', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', flags: 'g', action: 'block', severity: 'critical' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'SSN: 123-45-6789' });
      expect(result.passed).toBe(false);
    });
  });

  describe('content evaluation', () => {
    it('should detect prohibited content patterns', () => {
      const policy = makePolicy({
        content: {
          enabled: true,
          prohibited: [
            { name: 'bad-word', pattern: 'forbidden', flags: 'gi', severity: 'high', message: 'Forbidden content detected' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'This contains forbidden content' });
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations[0].message).toContain('Forbidden');
    });

    it('should detect missing required content', () => {
      const policy = makePolicy({
        content: {
          enabled: true,
          required: [
            { name: 'disclaimer', pattern: 'not medical advice', flags: 'gi', severity: 'medium', message: 'Missing disclaimer' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'Some health information' });
      expect(result.violations.some((v) => v.rule === 'disclaimer')).toBe(true);
    });

    it('should pass when required content is present', () => {
      const policy = makePolicy({
        content: {
          enabled: true,
          required: [
            { name: 'disclaimer', pattern: 'not medical advice', flags: 'gi', severity: 'medium', message: 'Missing disclaimer' },
          ],
        },
      });
      const result = evaluatePolicy(policy, { content: 'This is not medical advice.' });
      expect(result.violations.filter((v) => v.rule === 'disclaimer')).toHaveLength(0);
    });
  });

  describe('model validation', () => {
    it('should block disallowed models', () => {
      const policy = makePolicy({
        model: { enabled: true, allow: ['gpt-4o', 'claude-*'], deny: [] },
      });
      const result = evaluatePolicy(policy, { content: 'test', model: 'gpt-3.5-turbo' });
      expect(result.violations.some((v) => v.rule === 'model-not-allowed')).toBe(true);
    });

    it('should allow permitted models', () => {
      const policy = makePolicy({
        model: { enabled: true, allow: ['gpt-4o'], deny: [] },
      });
      const result = evaluatePolicy(policy, { content: 'test', model: 'gpt-4o' });
      expect(result.violations.filter((v) => v.rule === 'model-not-allowed')).toHaveLength(0);
    });

    it('should skip model check when no model provided', () => {
      const policy = makePolicy({
        model: { enabled: true, allow: ['gpt-4o'], deny: [] },
      });
      const result = evaluatePolicy(policy, { content: 'test' });
      expect(result.violations.filter((v) => v.category === 'model')).toHaveLength(0);
    });
  });

  describe('cost checking', () => {
    it('should block when cost exceeds per-request limit', () => {
      const policy = makePolicy({
        cost: { enabled: true, maxCostPerRequest: 1.0 },
      });
      const result = evaluatePolicy(policy, { content: 'test', cost: 5.0 });
      expect(result.violations.some((v) => v.rule === 'cost-per-request')).toBe(true);
      expect(result.passed).toBe(false);
    });

    it('should block when daily cost exceeds limit', () => {
      const policy = makePolicy({
        cost: { enabled: true, maxCostPerDay: 100 },
      });
      const result = evaluatePolicy(policy, { content: 'test', dailyCost: 150 });
      expect(result.violations.some((v) => v.rule === 'cost-per-day')).toBe(true);
    });

    it('should block when monthly cost exceeds limit', () => {
      const policy = makePolicy({
        cost: { enabled: true, maxCostPerMonth: 1000 },
      });
      const result = evaluatePolicy(policy, { content: 'test', monthlyCost: 1500 });
      expect(result.violations.some((v) => v.rule === 'cost-per-month')).toBe(true);
    });

    it('should block when tokens exceed limit', () => {
      const policy = makePolicy({
        cost: { enabled: true, maxTokensPerRequest: 1000 },
      });
      const result = evaluatePolicy(policy, { content: 'test', tokens: 5000 });
      expect(result.violations.some((v) => v.rule === 'tokens-per-request')).toBe(true);
    });

    it('should pass when within limits', () => {
      const policy = makePolicy({
        cost: { enabled: true, maxCostPerRequest: 10, maxCostPerDay: 500 },
      });
      const result = evaluatePolicy(policy, { content: 'test', cost: 1.0, dailyCost: 50 });
      expect(result.violations.filter((v) => v.category === 'cost')).toHaveLength(0);
    });
  });

  describe('access evaluation', () => {
    it('should block unauthenticated users when auth required', () => {
      const policy = makePolicy({
        access: { enabled: true, requireAuth: true },
      });
      const result = evaluatePolicy(policy, { content: 'test', authenticated: false });
      expect(result.violations.some((v) => v.rule === 'auth-required')).toBe(true);
    });

    it('should allow authenticated users', () => {
      const policy = makePolicy({
        access: { enabled: true, requireAuth: true },
      });
      const result = evaluatePolicy(policy, { content: 'test', authenticated: true });
      expect(result.violations.filter((v) => v.rule === 'auth-required')).toHaveLength(0);
    });
  });
});

describe('evaluatePolicies', () => {
  it('should merge violations from multiple policies', () => {
    const p1 = makePolicy({
      pii: { enabled: true, action: 'block', patterns: [{ name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'block', severity: 'high' }] },
    });
    const p2 = makePolicy({
      cost: { enabled: true, maxCostPerRequest: 0.5 },
    });
    p2.metadata.id = 'test-2';

    const result = evaluatePolicies([p1, p2], { content: 'user@test.com', cost: 1.0 });
    expect(result.violations.some((v) => v.category === 'pii')).toBe(true);
    expect(result.violations.some((v) => v.category === 'cost')).toBe(true);
    expect(result.policiesEvaluated).toHaveLength(2);
  });

  it('should record all evaluated policy IDs', () => {
    const policies = [
      { ...makePolicy(), metadata: { id: 'a', name: 'A', version: '1.0.0' } },
      { ...makePolicy(), metadata: { id: 'b', name: 'B', version: '1.0.0' } },
    ];
    const result = evaluatePolicies(policies as Policy[], { content: 'test' });
    expect(result.policiesEvaluated).toContain('a');
    expect(result.policiesEvaluated).toContain('b');
  });
});
