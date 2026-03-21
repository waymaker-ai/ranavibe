import { describe, it, expect } from 'vitest';
import { ModelGate } from './model-gate.js';

describe('ModelGate', () => {
  describe('allowed models pass', () => {
    it('should allow a model that is in the approved list', () => {
      const gate = new ModelGate(['gpt-4o', 'claude-sonnet-4-6']);
      const result = gate.check('gpt-4o');
      expect(result.allowed).toBe(true);
    });

    it('should allow any model when the list is empty', () => {
      const gate = new ModelGate([]);
      expect(gate.check('any-model').allowed).toBe(true);
      expect(gate.check('another-model').allowed).toBe(true);
    });

    it('should allow exact name matches', () => {
      const gate = new ModelGate(['claude-3-opus-20240229']);
      expect(gate.check('claude-3-opus-20240229').allowed).toBe(true);
    });
  });

  describe('denied models fail', () => {
    it('should deny a model not in the approved list', () => {
      const gate = new ModelGate(['gpt-4o']);
      const result = gate.check('gpt-3.5-turbo');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('gpt-3.5-turbo');
    });

    it('should provide suggestions of allowed models', () => {
      const gate = new ModelGate(['gpt-4o', 'claude-sonnet-4-6']);
      const result = gate.check('unknown-model');
      expect(result.allowed).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('gpt-4o');
      expect(result.suggestions).toContain('claude-sonnet-4-6');
    });
  });

  describe('glob patterns', () => {
    it('should support wildcard patterns with *', () => {
      const gate = new ModelGate(['claude-*']);
      expect(gate.check('claude-sonnet-4-6').allowed).toBe(true);
      expect(gate.check('claude-3-opus-20240229').allowed).toBe(true);
      expect(gate.check('gpt-4o').allowed).toBe(false);
    });

    it('should support prefix wildcards', () => {
      const gate = new ModelGate(['gpt-4*']);
      expect(gate.check('gpt-4o').allowed).toBe(true);
      expect(gate.check('gpt-4-turbo').allowed).toBe(true);
      expect(gate.check('gpt-3.5-turbo').allowed).toBe(false);
    });

    it('should support middle wildcards', () => {
      const gate = new ModelGate(['claude-*-20240229']);
      expect(gate.check('claude-3-opus-20240229').allowed).toBe(true);
      expect(gate.check('claude-3-sonnet-20240229').allowed).toBe(true);
    });

    it('should not include glob patterns in suggestions', () => {
      const gate = new ModelGate(['claude-*', 'gpt-4o']);
      const result = gate.check('unknown');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('gpt-4o');
      expect(result.suggestions).not.toContain('claude-*');
    });
  });

  describe('partial matching', () => {
    it('should match when model name contains allowed pattern', () => {
      const gate = new ModelGate(['gpt-4o']);
      // model.includes(pattern) or pattern.includes(model)
      const result = gate.check('gpt-4o-mini');
      // 'gpt-4o-mini'.includes('gpt-4o') should be true
      expect(result.allowed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle single model in list', () => {
      const gate = new ModelGate(['claude-sonnet-4-6']);
      expect(gate.check('claude-sonnet-4-6').allowed).toBe(true);
      expect(gate.check('gpt-4o').allowed).toBe(false);
    });

    it('should handle many models in list', () => {
      const models = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gemini-2.0-flash'];
      const gate = new ModelGate(models);
      for (const m of models) {
        expect(gate.check(m).allowed).toBe(true);
      }
    });
  });
});
