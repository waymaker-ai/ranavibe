import { describe, it, expect } from 'vitest';
import { PolicyEngine } from './engine.js';
import type { Policy } from './types.js';

function makeTestPolicy(id: string, overrides?: Partial<Policy['rules']>): Policy {
  return {
    metadata: { id, name: `Test ${id}`, version: '1.0.0' },
    rules: {
      pii: {
        enabled: true,
        action: 'block',
        patterns: [
          { name: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', action: 'block', severity: 'high' },
        ],
      },
      ...overrides,
    },
  };
}

describe('PolicyEngine', () => {
  describe('constructor', () => {
    it('should create an empty engine', () => {
      const engine = new PolicyEngine();
      expect(engine.size).toBe(0);
      expect(engine.listPolicies()).toHaveLength(0);
    });

    it('should create an engine with initial policies', () => {
      const engine = new PolicyEngine([makeTestPolicy('test-1')]);
      expect(engine.size).toBe(1);
    });
  });

  describe('fromPresets', () => {
    it('should load hipaa preset', () => {
      const engine = PolicyEngine.fromPresets(['hipaa']);
      expect(engine.size).toBe(1);
      expect(engine.listPolicies()).toContain('hipaa');
    });

    it('should load multiple presets', () => {
      const engine = PolicyEngine.fromPresets(['hipaa', 'safety']);
      expect(engine.size).toBe(2);
    });

    it('should throw for unknown presets', () => {
      expect(() => PolicyEngine.fromPresets(['nonexistent'])).toThrow();
    });
  });

  describe('addPolicy', () => {
    it('should add a valid policy', () => {
      const engine = new PolicyEngine();
      engine.addPolicy(makeTestPolicy('custom'));
      expect(engine.size).toBe(1);
      expect(engine.listPolicies()).toContain('custom');
    });

    it('should return this for chaining', () => {
      const engine = new PolicyEngine();
      const result = engine.addPolicy(makeTestPolicy('a'));
      expect(result).toBe(engine);
    });

    it('should replace a policy with the same id', () => {
      const engine = new PolicyEngine();
      engine.addPolicy(makeTestPolicy('dup'));
      engine.addPolicy(makeTestPolicy('dup'));
      expect(engine.size).toBe(1);
    });
  });

  describe('removePolicy', () => {
    it('should remove an existing policy', () => {
      const engine = new PolicyEngine([makeTestPolicy('rm')]);
      expect(engine.removePolicy('rm')).toBe(true);
      expect(engine.size).toBe(0);
    });

    it('should return false for non-existent policy', () => {
      const engine = new PolicyEngine();
      expect(engine.removePolicy('nope')).toBe(false);
    });
  });

  describe('getPolicy', () => {
    it('should return a deep copy of the policy', () => {
      const engine = new PolicyEngine([makeTestPolicy('get')]);
      const policy = engine.getPolicy('get');
      expect(policy).toBeDefined();
      expect(policy!.metadata.id).toBe('get');
    });

    it('should return undefined for missing policy', () => {
      const engine = new PolicyEngine();
      expect(engine.getPolicy('missing')).toBeUndefined();
    });
  });

  describe('evaluate', () => {
    it('should return passed for empty engine', () => {
      const engine = new PolicyEngine();
      const result = engine.evaluate({ content: 'anything' });
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect PII violations', () => {
      const engine = new PolicyEngine([makeTestPolicy('pii-test')]);
      const result = engine.evaluate({ content: 'Email: user@example.com' });
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations.some((v) => v.category === 'pii')).toBe(true);
    });

    it('should pass clean content', () => {
      const engine = new PolicyEngine([makeTestPolicy('clean-test')]);
      const result = engine.evaluate({ content: 'No PII here at all' });
      // Email pattern should not match
      const piiViolations = result.violations.filter((v) => v.category === 'pii');
      expect(piiViolations).toHaveLength(0);
    });

    it('should evaluate cost rules', () => {
      const policy = makeTestPolicy('cost-test', {
        cost: { enabled: true, maxCostPerRequest: 1.0 },
      });
      const engine = new PolicyEngine([policy]);
      const result = engine.evaluate({ content: 'test', cost: 5.0 });
      expect(result.violations.some((v) => v.rule === 'cost-per-request')).toBe(true);
    });

    it('should evaluate model rules', () => {
      const policy = makeTestPolicy('model-test', {
        model: { enabled: true, allow: ['gpt-4o'], deny: [] },
      });
      const engine = new PolicyEngine([policy]);
      const result = engine.evaluate({ content: 'test', model: 'gpt-3.5-turbo' });
      expect(result.violations.some((v) => v.rule === 'model-not-allowed')).toBe(true);
    });

    it('should record duration', () => {
      const engine = PolicyEngine.fromPresets(['hipaa']);
      const result = engine.evaluate({ content: 'test' });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compose (static)', () => {
    it('should compose policies into a new engine', () => {
      const p1 = makeTestPolicy('a');
      const p2 = makeTestPolicy('b');
      const engine = PolicyEngine.compose([p1, p2]);
      expect(engine.size).toBe(1);
      expect(engine.listPolicies()[0]).toContain('composed');
    });
  });

  describe('toSchema / fromSchema', () => {
    it('should round-trip through schema', () => {
      const engine = new PolicyEngine([makeTestPolicy('rt')]);
      const schema = engine.toSchema();
      expect(schema.policies).toHaveLength(1);

      const restored = PolicyEngine.fromSchema(schema);
      expect(restored.size).toBe(1);
      expect(restored.listPolicies()).toContain('rt');
    });
  });

  describe('availablePresets', () => {
    it('should list available presets', () => {
      const presets = PolicyEngine.availablePresets();
      expect(presets).toContain('hipaa');
      expect(presets).toContain('gdpr');
      expect(presets).toContain('safety');
      expect(presets.length).toBeGreaterThanOrEqual(5);
    });
  });
});
