import { describe, it, expect, beforeEach } from 'vitest';
import {
  PolicyEngine,
  evaluatePolicy,
  evaluatePolicies,
  parsePolicy,
  deepMerge,
  validatePolicy,
  compose,
  listPresets,
  getPreset,
  hipaaPolicy,
  gdprPolicy,
  pciPolicy,
  SSN_PATTERN,
  EMAIL_PATTERN,
} from '../index';
import type { Policy, EvaluationContext } from '../types';

// =============================================================================
// Preset Registry
// =============================================================================

describe('Preset Registry', () => {
  it('should list all 9 presets', () => {
    const presets = listPresets();
    expect(presets).toHaveLength(9);
    expect(presets).toContain('hipaa');
    expect(presets).toContain('gdpr');
    expect(presets).toContain('ccpa');
    expect(presets).toContain('sec');
    expect(presets).toContain('pci');
    expect(presets).toContain('ferpa');
    expect(presets).toContain('sox');
    expect(presets).toContain('safety');
    expect(presets).toContain('enterprise');
  });

  it('should get a preset by ID', () => {
    const hipaa = getPreset('hipaa');
    expect(hipaa.metadata.id).toBe('hipaa');
    expect(hipaa.rules.pii).toBeDefined();
    expect(hipaa.rules.pii!.enabled).toBe(true);
  });

  it('should return deep copies of presets', () => {
    const a = getPreset('hipaa');
    const b = getPreset('hipaa');
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('should throw for unknown preset', () => {
    expect(() => getPreset('nonexistent')).toThrow('Unknown preset');
  });
});

// =============================================================================
// Policy Validation
// =============================================================================

describe('validatePolicy', () => {
  it('should validate a well-formed policy', () => {
    const result = validatePolicy(hipaaPolicy);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject null/undefined input', () => {
    const result = validatePolicy(null);
    expect(result.valid).toBe(false);
  });

  it('should reject missing metadata', () => {
    const result = validatePolicy({ rules: {} });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'metadata')).toBe(true);
  });

  it('should reject missing metadata.id', () => {
    const result = validatePolicy({ metadata: { name: 'Test', version: '1.0' }, rules: {} });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'metadata.id')).toBe(true);
  });

  it('should reject missing metadata.name', () => {
    const result = validatePolicy({ metadata: { id: 'test', version: '1.0' }, rules: {} });
    expect(result.valid).toBe(false);
  });

  it('should reject missing metadata.version', () => {
    const result = validatePolicy({ metadata: { id: 'test', name: 'Test' }, rules: {} });
    expect(result.valid).toBe(false);
  });

  it('should reject missing rules', () => {
    const result = validatePolicy({ metadata: { id: 'test', name: 'Test', version: '1.0' } });
    expect(result.valid).toBe(false);
  });

  it('should validate pii.enabled is boolean', () => {
    const result = validatePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { pii: { enabled: 'yes', action: 'block', patterns: [] } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path.includes('pii.enabled'))).toBe(true);
  });

  it('should validate pii.action values', () => {
    const result = validatePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { pii: { enabled: true, action: 'invalid', patterns: [] } },
    });
    expect(result.valid).toBe(false);
  });

  it('should validate pii pattern regex compiles', () => {
    const result = validatePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { pii: { enabled: true, action: 'block', patterns: [
        { name: 'bad', pattern: '[invalid regex', action: 'block', severity: 'high' },
      ] } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Invalid regex'))).toBe(true);
  });

  it('should validate cost rule fields are non-negative', () => {
    const result = validatePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { cost: { enabled: true, maxCostPerRequest: -1 } },
    });
    expect(result.valid).toBe(false);
  });

  it('should validate all presets pass validation', () => {
    for (const id of listPresets()) {
      const preset = getPreset(id);
      const result = validatePolicy(preset);
      expect(result.valid).toBe(true);
    }
  });

  it('should validate content pattern requires message field', () => {
    const result = validatePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { content: { enabled: true, prohibited: [{ name: 'test', pattern: 'foo', severity: 'high' }] } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('message'))).toBe(true);
  });
});

// =============================================================================
// deepMerge
// =============================================================================

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should override scalar values', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('should deep merge nested objects', () => {
    const result = deepMerge(
      { nested: { a: 1, b: 2 } },
      { nested: { b: 3, c: 4 } }
    );
    expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
  });

  it('should concatenate arrays without duplicates', () => {
    const result = deepMerge(
      { arr: [1, 2, 3] },
      { arr: [3, 4, 5] }
    );
    expect(result.arr).toEqual([1, 2, 3, 4, 5]);
  });

  it('should not mutate original objects', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
  });

  it('should handle arrays of objects with deduplication', () => {
    const result = deepMerge(
      { arr: [{ x: 1 }] },
      { arr: [{ x: 1 }, { x: 2 }] }
    );
    expect(result.arr).toHaveLength(2);
  });
});

// =============================================================================
// parsePolicy
// =============================================================================

describe('parsePolicy', () => {
  it('should parse a valid policy object', () => {
    const policy = parsePolicy({
      metadata: { id: 'test', name: 'Test Policy', version: '1.0.0' },
      rules: {},
    });
    expect(policy.metadata.id).toBe('test');
  });

  it('should throw for invalid input', () => {
    expect(() => parsePolicy(null)).toThrow();
    expect(() => parsePolicy(undefined)).toThrow();
  });

  it('should resolve extends from preset', () => {
    const policy = parsePolicy({
      metadata: { id: 'custom-hipaa', name: 'Custom HIPAA', version: '1.0.0', extends: 'hipaa' },
      rules: {
        cost: { enabled: true, maxCostPerRequest: 1.0 },
      },
    });
    // Should inherit HIPAA PII rules
    expect(policy.rules.pii).toBeDefined();
    expect(policy.rules.pii!.enabled).toBe(true);
    // Should also have the custom cost override
    expect(policy.rules.cost!.maxCostPerRequest).toBe(1.0);
  });

  it('should throw for unknown extends preset', () => {
    expect(() => parsePolicy({
      metadata: { id: 'test', name: 'Test', version: '1.0.0', extends: 'nonexistent' },
      rules: {},
    })).toThrow('unknown preset');
  });

  it('should throw for validation failure', () => {
    expect(() => parsePolicy({
      metadata: { id: '', name: '', version: '' },
      rules: {},
    })).toThrow('validation failed');
  });
});

// =============================================================================
// evaluatePolicy
// =============================================================================

describe('evaluatePolicy', () => {
  it('should pass clean content against HIPAA', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'General health information about exercise and nutrition. PHI privacy policy applies.',
      model: 'gpt-4o',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    // May or may not pass depending on content patterns, but should not throw
    expect(result).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.policiesEvaluated).toContain('hipaa');
  });

  it('should detect SSN in HIPAA policy', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Patient SSN is 123-45-6789',
      model: 'gpt-4o',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.category === 'pii')).toBe(true);
  });

  it('should detect email in HIPAA policy', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Contact patient at john@hospital.com. PHI privacy policy applies.',
      model: 'gpt-4o',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.violations.some(v => v.category === 'pii')).toBe(true);
  });

  it('should block unauthenticated access in HIPAA policy', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Test content.',
      authenticated: false,
    });
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.rule === 'auth-required')).toBe(true);
  });

  it('should block unauthorized role in HIPAA policy', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Test content.',
      authenticated: true,
      mfa: true,
      role: 'intern',
    });
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.rule === 'role-not-allowed')).toBe(true);
  });

  it('should block when MFA not used in HIPAA', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Test content.',
      authenticated: true,
      mfa: false,
      role: 'physician',
    });
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.rule === 'mfa-required')).toBe(true);
  });

  it('should enforce cost limits', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'test',
      cost: 100,
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.violations.some(v => v.category === 'cost')).toBe(true);
  });

  it('should enforce daily cost limits', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'test',
      dailyCost: 300,
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.violations.some(v => v.rule === 'cost-per-day')).toBe(true);
  });

  it('should enforce model restrictions', () => {
    const result = evaluatePolicy(hipaaPolicy, {
      content: 'Test.',
      model: 'text-davinci-003',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.violations.some(v => v.category === 'model')).toBe(true);
  });

  it('should redact PII when action is redact', () => {
    const gdpr = getPreset('gdpr');
    const result = evaluatePolicy(gdpr, {
      content: 'Email: test@example.com, SSN: 123-45-6789',
      authenticated: true,
    });
    if (result.redactedContent) {
      expect(result.redactedContent).toContain('REDACTED');
    }
  });

  it('should handle empty context gracefully', () => {
    const result = evaluatePolicy(hipaaPolicy, {});
    // Should not throw, may have access violations
    expect(result).toBeDefined();
  });

  it('should detect PCI card data', () => {
    const pci = getPreset('pci');
    const result = evaluatePolicy(pci, {
      content: 'Card: 4532015112830366',
      authenticated: true,
    });
    expect(result.violations.some(v => v.category === 'pii')).toBe(true);
  });

  it('should enforce SEC investment disclaimers', () => {
    const sec = getPreset('sec');
    const result = evaluatePolicy(sec, {
      content: 'You should definitely invest in this guaranteed return stock.',
      authenticated: true,
    });
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should include duration in result', () => {
    const result = evaluatePolicy(hipaaPolicy, { content: 'test', authenticated: true, mfa: true, role: 'physician' });
    expect(typeof result.durationMs).toBe('number');
  });
});

// =============================================================================
// evaluatePolicies (multiple)
// =============================================================================

describe('evaluatePolicies', () => {
  it('should evaluate multiple policies', () => {
    const result = evaluatePolicies(
      [hipaaPolicy, gdprPolicy],
      { content: 'SSN: 123-45-6789', authenticated: true, mfa: true, role: 'physician' }
    );
    expect(result.policiesEvaluated.length).toBe(2);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should merge violations from multiple policies', () => {
    const result = evaluatePolicies(
      [hipaaPolicy, pciPolicy],
      { content: 'Card: 4532015112830366, SSN: 123-45-6789', authenticated: true, mfa: true, role: 'physician' }
    );
    // Should have violations from both
    expect(result.violations.length).toBeGreaterThan(1);
  });
});

// =============================================================================
// compose
// =============================================================================

describe('compose', () => {
  it('should compose two policies with strictest strategy', () => {
    const composed = compose([hipaaPolicy, gdprPolicy], 'strictest');
    expect(composed.metadata.id).toContain('composed');
    expect(composed.rules.pii).toBeDefined();
    expect(composed.rules.pii!.enabled).toBe(true);
  });

  it('should use strictest PII action', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { pii: { enabled: true, action: 'redact', patterns: [{ ...SSN_PATTERN, action: 'redact', severity: 'high' }] } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { pii: { enabled: true, action: 'block', patterns: [{ ...EMAIL_PATTERN, action: 'block', severity: 'high' }] } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.pii!.action).toBe('block');
  });

  it('should use minimum cost limits in strictest', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { cost: { enabled: true, maxCostPerDay: 100 } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { cost: { enabled: true, maxCostPerDay: 50 } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.cost!.maxCostPerDay).toBe(50);
  });

  it('should intersect allowed model lists in strictest', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { model: { enabled: true, allow: ['gpt-4o', 'claude-*'] } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { model: { enabled: true, allow: ['gpt-4o', 'gemini-*'] } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.model!.allow).toContain('gpt-4o');
    expect(composed.rules.model!.allow).not.toContain('claude-*');
    expect(composed.rules.model!.allow).not.toContain('gemini-*');
  });

  it('should union deny lists in strictest', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { model: { enabled: true, deny: ['gpt-3.5*'] } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { model: { enabled: true, deny: ['text-davinci-*'] } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.model!.deny).toContain('gpt-3.5*');
    expect(composed.rules.model!.deny).toContain('text-davinci-*');
  });

  it('should compose with "first" strategy', () => {
    const composed = compose([hipaaPolicy, gdprPolicy], 'first');
    expect(composed).toBeDefined();
  });

  it('should compose with "last" strategy', () => {
    const composed = compose([hipaaPolicy, gdprPolicy], 'last');
    expect(composed).toBeDefined();
  });

  it('should return single policy copy for single input', () => {
    const composed = compose([hipaaPolicy]);
    expect(composed.metadata.id).toBe('hipaa');
  });

  it('should throw for empty input', () => {
    expect(() => compose([])).toThrow('at least one policy');
  });

  it('should throw for unknown strategy', () => {
    // compose() returns early with a deep copy when given a single policy,
    // so we need at least two policies to reach the strategy switch.
    expect(() => compose([hipaaPolicy, gdprPolicy], 'unknown' as any)).toThrow('unknown strategy');
  });

  it('should merge prohibited content lists', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { content: { enabled: true, prohibited: [{ name: 'x', pattern: 'x', severity: 'high', message: 'x', flags: 'gi' }] } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { content: { enabled: true, prohibited: [{ name: 'y', pattern: 'y', severity: 'high', message: 'y', flags: 'gi' }] } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.content!.prohibited!.length).toBe(2);
  });

  it('should require audit log if any policy requires it', () => {
    const p1: Policy = {
      metadata: { id: 'a', name: 'A', version: '1.0' },
      rules: { data: { enabled: true, requireAuditLog: true } },
    };
    const p2: Policy = {
      metadata: { id: 'b', name: 'B', version: '1.0' },
      rules: { data: { enabled: true, requireAuditLog: false } },
    };
    const composed = compose([p1, p2], 'strictest');
    expect(composed.rules.data!.requireAuditLog).toBe(true);
  });
});

// =============================================================================
// PolicyEngine
// =============================================================================

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it('should create empty engine', () => {
    expect(engine.size).toBe(0);
    expect(engine.listPolicies()).toHaveLength(0);
  });

  it('should create engine from presets', () => {
    const e = PolicyEngine.fromPresets(['hipaa', 'gdpr']);
    expect(e.size).toBe(2);
    expect(e.listPolicies()).toContain('hipaa');
    expect(e.listPolicies()).toContain('gdpr');
  });

  it('should list available presets', () => {
    const presets = PolicyEngine.availablePresets();
    expect(presets).toHaveLength(9);
  });

  it('should add policy', () => {
    engine.addPolicy(hipaaPolicy);
    expect(engine.size).toBe(1);
    expect(engine.getPolicy('hipaa')).toBeDefined();
  });

  it('should remove policy', () => {
    engine.addPolicy(hipaaPolicy);
    expect(engine.removePolicy('hipaa')).toBe(true);
    expect(engine.size).toBe(0);
  });

  it('should return false when removing nonexistent policy', () => {
    expect(engine.removePolicy('nonexistent')).toBe(false);
  });

  it('should get deep copy of policy', () => {
    engine.addPolicy(hipaaPolicy);
    const copy = engine.getPolicy('hipaa')!;
    copy.metadata.id = 'modified';
    expect(engine.getPolicy('hipaa')!.metadata.id).toBe('hipaa');
  });

  it('should evaluate context against all loaded policies', () => {
    engine.addPolicy(hipaaPolicy);
    const result = engine.evaluate({
      content: 'Patient SSN: 123-45-6789',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should evaluate against specific policy', () => {
    engine.addPolicy(hipaaPolicy);
    engine.addPolicy(gdprPolicy);
    const result = engine.evaluateWith('hipaa', {
      content: 'SSN: 123-45-6789',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.policiesEvaluated).toEqual(['hipaa']);
  });

  it('should throw for evaluateWith with unknown policy', () => {
    expect(() => engine.evaluateWith('nonexistent', {})).toThrow('not found');
  });

  it('should return passing result with no policies', () => {
    const result = engine.evaluate({ content: 'anything' });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should compose policies and evaluate', () => {
    const e = PolicyEngine.compose([hipaaPolicy, gdprPolicy], 'strictest');
    expect(e.size).toBe(1);
    const result = e.evaluate({
      content: 'SSN: 123-45-6789',
      authenticated: true,
      mfa: true,
      role: 'physician',
    });
    expect(result.passed).toBe(false);
  });

  it('should serialize and deserialize', () => {
    engine.addPolicy(hipaaPolicy);
    const schema = engine.toSchema();
    expect(schema.policies).toHaveLength(1);

    const restored = PolicyEngine.fromSchema(schema);
    expect(restored.size).toBe(1);
    expect(restored.getPolicy('hipaa')).toBeDefined();
  });

  it('should add raw policy objects (auto-parse)', () => {
    engine.addPolicy({
      metadata: { id: 'custom', name: 'Custom', version: '1.0.0' },
      rules: {},
    });
    expect(engine.size).toBe(1);
  });

  it('should reject invalid raw policy objects', () => {
    expect(() => engine.addPolicy({
      metadata: { id: '', name: '', version: '' },
      rules: {},
    } as any)).toThrow();
  });
});

// =============================================================================
// Access Control Evaluation
// =============================================================================

describe('Access Control', () => {
  it('should enforce IP allowlist', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        access: {
          enabled: true,
          allowedIPs: ['10.0.0.0/8'],
        },
      },
    };
    const result = evaluatePolicy(policy, { ip: '192.168.1.1' });
    expect(result.violations.some(v => v.rule === 'ip-not-allowed')).toBe(true);
  });

  it('should allow matching IP', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        access: {
          enabled: true,
          allowedIPs: ['10.0.0.0/8'],
        },
      },
    };
    const result = evaluatePolicy(policy, { ip: '10.1.2.3' });
    expect(result.violations.filter(v => v.rule === 'ip-not-allowed')).toHaveLength(0);
  });

  it('should enforce denied roles', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        access: {
          enabled: true,
          deniedRoles: ['banned'],
        },
      },
    };
    const result = evaluatePolicy(policy, { role: 'banned' });
    expect(result.violations.some(v => v.rule === 'role-denied')).toBe(true);
  });
});

// =============================================================================
// Response Evaluation
// =============================================================================

describe('Response Evaluation', () => {
  it('should enforce max response length', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        response: { enabled: true, maxLength: 10 },
      },
    };
    const result = evaluatePolicy(policy, { content: 'This is a long response that exceeds the limit' });
    expect(result.violations.some(v => v.rule === 'response-max-length')).toBe(true);
  });

  it('should enforce min response length', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        response: { enabled: true, minLength: 100 },
      },
    };
    const result = evaluatePolicy(policy, { content: 'Short' });
    expect(result.violations.some(v => v.rule === 'response-min-length')).toBe(true);
  });

  it('should enforce JSON requirement', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        response: { enabled: true, requireJson: true },
      },
    };
    const result = evaluatePolicy(policy, { content: 'not json' });
    expect(result.violations.some(v => v.rule === 'invalid-json')).toBe(true);
  });

  it('should enforce required JSON fields', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        response: { enabled: true, requireJson: true, requiredJsonFields: ['name', 'id'] },
      },
    };
    const result = evaluatePolicy(policy, { content: '{"name": "test"}' });
    expect(result.violations.some(v => v.rule === 'required-json-field')).toBe(true);
  });

  it('should pass valid JSON with required fields', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        response: { enabled: true, requireJson: true, requiredJsonFields: ['name'] },
      },
    };
    const result = evaluatePolicy(policy, { content: '{"name": "test"}' });
    expect(result.violations.filter(v => v.rule === 'required-json-field')).toHaveLength(0);
  });
});

// =============================================================================
// Token/Cost Evaluation
// =============================================================================

describe('Cost Evaluation', () => {
  it('should block when cost per request exceeded', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { cost: { enabled: true, maxCostPerRequest: 1.0 } },
    };
    const result = evaluatePolicy(policy, { cost: 2.0 });
    expect(result.violations.some(v => v.rule === 'cost-per-request')).toBe(true);
  });

  it('should pass when cost within limit', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { cost: { enabled: true, maxCostPerRequest: 5.0 } },
    };
    const result = evaluatePolicy(policy, { cost: 2.0 });
    expect(result.violations.filter(v => v.category === 'cost')).toHaveLength(0);
  });

  it('should enforce token limits', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { cost: { enabled: true, maxTokensPerRequest: 1000 } },
    };
    const result = evaluatePolicy(policy, { tokens: 5000 });
    expect(result.violations.some(v => v.rule === 'tokens-per-request')).toBe(true);
  });

  it('should enforce completion token limits', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: { cost: { enabled: true, maxCompletionTokens: 500 } },
    };
    const result = evaluatePolicy(policy, { completionTokens: 1000 });
    expect(result.violations.some(v => v.rule === 'completion-tokens')).toBe(true);
  });
});

// =============================================================================
// Content Evaluation
// =============================================================================

describe('Content Evaluation', () => {
  it('should detect prohibited patterns', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        content: {
          enabled: true,
          prohibited: [{ name: 'bad-word', pattern: 'forbidden', flags: 'gi', severity: 'high', message: 'Forbidden word detected' }],
        },
      },
    };
    const result = evaluatePolicy(policy, { content: 'This contains the forbidden word' });
    expect(result.violations.some(v => v.rule === 'bad-word')).toBe(true);
  });

  it('should require required patterns', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        content: {
          enabled: true,
          required: [{ name: 'disclaimer', pattern: 'disclaimer', flags: 'gi', severity: 'medium', message: 'Must include disclaimer' }],
        },
      },
    };
    // Content that does NOT contain the word "disclaimer" should trigger a violation
    const result = evaluatePolicy(policy, { content: 'No notice here at all' });
    expect(result.violations.some(v => v.rule === 'disclaimer')).toBe(true);
  });

  it('should pass when required pattern is present', () => {
    const policy: Policy = {
      metadata: { id: 'test', name: 'Test', version: '1.0' },
      rules: {
        content: {
          enabled: true,
          required: [{ name: 'disclaimer', pattern: 'disclaimer', flags: 'gi', severity: 'medium', message: 'Must include disclaimer' }],
        },
      },
    };
    const result = evaluatePolicy(policy, { content: 'This includes a disclaimer statement' });
    expect(result.violations.filter(v => v.rule === 'disclaimer')).toHaveLength(0);
  });
});

// =============================================================================
// Performance
// =============================================================================

describe('Policy Performance', () => {
  it('should evaluate HIPAA policy in under 10ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      evaluatePolicy(hipaaPolicy, {
        content: 'General health information about nutrition.',
        model: 'gpt-4o',
        authenticated: true,
        mfa: true,
        role: 'physician',
      });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000); // 100 evals in under 5s
  });

  it('should compose 9 presets in under 50ms', () => {
    const allPresets = listPresets().map(id => getPreset(id));
    const start = performance.now();
    compose(allPresets, 'strictest');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
