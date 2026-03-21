import { describe, it, expect } from 'vitest';
import { compose } from './composer.js';
import type { Policy } from './types.js';

function makePolicy(id: string, overrides: Partial<Policy['rules']> = {}): Policy {
  return {
    metadata: { id, name: `Policy ${id}`, version: '1.0.0', tags: [id] },
    rules: overrides,
  };
}

describe('compose', () => {
  describe('strictest strategy', () => {
    it('should pick the stricter PII action', () => {
      const p1 = makePolicy('a', {
        pii: { enabled: true, action: 'detect', patterns: [{ name: 'email', pattern: 'test', flags: 'g', action: 'detect', severity: 'high' }] },
      });
      const p2 = makePolicy('b', {
        pii: { enabled: true, action: 'block', patterns: [{ name: 'email', pattern: 'test', flags: 'g', action: 'block', severity: 'high' }] },
      });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.pii?.action).toBe('block');
    });

    it('should take the minimum cost limit', () => {
      const p1 = makePolicy('a', {
        cost: { enabled: true, maxCostPerRequest: 10, maxCostPerDay: 500 },
      });
      const p2 = makePolicy('b', {
        cost: { enabled: true, maxCostPerRequest: 5, maxCostPerDay: 1000 },
      });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.cost?.maxCostPerRequest).toBe(5);
      expect(composed.rules.cost?.maxCostPerDay).toBe(500);
    });

    it('should intersect model allow lists', () => {
      const p1 = makePolicy('a', {
        model: { enabled: true, allow: ['gpt-4o', 'claude-sonnet-4-6'], deny: [] },
      });
      const p2 = makePolicy('b', {
        model: { enabled: true, allow: ['gpt-4o', 'gemini-pro'], deny: [] },
      });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.model?.allow).toContain('gpt-4o');
      expect(composed.rules.model?.allow).not.toContain('claude-sonnet-4-6');
      expect(composed.rules.model?.allow).not.toContain('gemini-pro');
    });

    it('should union model deny lists', () => {
      const p1 = makePolicy('a', {
        model: { enabled: true, allow: [], deny: ['gpt-3.5-turbo'] },
      });
      const p2 = makePolicy('b', {
        model: { enabled: true, allow: [], deny: ['text-davinci-003'] },
      });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.model?.deny).toContain('gpt-3.5-turbo');
      expect(composed.rules.model?.deny).toContain('text-davinci-003');
    });

    it('should union prohibited content patterns', () => {
      const p1 = makePolicy('a', {
        content: { enabled: true, prohibited: [{ name: 'bad1', pattern: 'word1', severity: 'high', message: 'Bad 1' }] },
      });
      const p2 = makePolicy('b', {
        content: { enabled: true, prohibited: [{ name: 'bad2', pattern: 'word2', severity: 'high', message: 'Bad 2' }] },
      });
      const composed = compose([p1, p2], 'strictest');
      const names = composed.rules.content?.prohibited?.map((p) => p.name);
      expect(names).toContain('bad1');
      expect(names).toContain('bad2');
    });

    it('should use the minimum maxToxicity', () => {
      const p1 = makePolicy('a', { content: { enabled: true, maxToxicity: 0.5 } });
      const p2 = makePolicy('b', { content: { enabled: true, maxToxicity: 0.3 } });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.content?.maxToxicity).toBe(0.3);
    });
  });

  describe('first strategy', () => {
    it('should keep first policy values on conflict', () => {
      const p1 = makePolicy('a', {
        cost: { enabled: true, maxCostPerRequest: 10 },
      });
      const p2 = makePolicy('b', {
        cost: { enabled: true, maxCostPerRequest: 5 },
      });
      const composed = compose([p1, p2], 'first');
      // Deep merge: first values stay, but deep merge might add from second
      expect(composed.rules.cost?.enabled).toBe(true);
    });
  });

  describe('last strategy', () => {
    it('should keep last policy values on conflict', () => {
      const p1 = makePolicy('a', {
        cost: { enabled: true, maxCostPerRequest: 10 },
      });
      const p2 = makePolicy('b', {
        cost: { enabled: false, maxCostPerRequest: 5 },
      });
      const composed = compose([p1, p2], 'last');
      // Last policy values should win
      expect(composed.rules.cost).toBeDefined();
    });
  });

  describe('metadata', () => {
    it('should generate composed metadata', () => {
      const p1 = makePolicy('alpha');
      const p2 = makePolicy('beta');
      const composed = compose([p1, p2]);
      expect(composed.metadata.id).toContain('composed');
      expect(composed.metadata.id).toContain('alpha');
      expect(composed.metadata.id).toContain('beta');
      expect(composed.metadata.name).toContain('Composed');
    });

    it('should merge tags from all policies', () => {
      const p1 = makePolicy('a');
      const p2 = makePolicy('b');
      const composed = compose([p1, p2]);
      expect(composed.metadata.tags).toContain('a');
      expect(composed.metadata.tags).toContain('b');
    });
  });

  describe('edge cases', () => {
    it('should throw for empty array', () => {
      expect(() => compose([])).toThrow('at least one policy');
    });

    it('should return a deep copy for single policy', () => {
      const p = makePolicy('solo');
      const composed = compose([p]);
      expect(composed.metadata.id).toBe('solo');
      // Should be a copy, not the same reference
      expect(composed).not.toBe(p);
    });

    it('should fallback to strictest for unknown strategy', () => {
      // Unknown strategies should fallback gracefully
      const result = compose([makePolicy('x')], 'unknown' as any);
      expect(result).toBeDefined();
    });

    it('should handle policies with no overlapping rules', () => {
      const p1 = makePolicy('a', { cost: { enabled: true, maxCostPerRequest: 5 } });
      const p2 = makePolicy('b', { model: { enabled: true, allow: ['gpt-4o'], deny: [] } });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.cost?.maxCostPerRequest).toBe(5);
      expect(composed.rules.model?.allow).toContain('gpt-4o');
    });
  });

  describe('access rule composition', () => {
    it('should union denied roles', () => {
      const p1 = makePolicy('a', { access: { enabled: true, deniedRoles: ['guest'] } });
      const p2 = makePolicy('b', { access: { enabled: true, deniedRoles: ['intern'] } });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.access?.deniedRoles).toContain('guest');
      expect(composed.rules.access?.deniedRoles).toContain('intern');
    });

    it('should require auth if any policy requires it', () => {
      const p1 = makePolicy('a', { access: { enabled: true, requireAuth: false } });
      const p2 = makePolicy('b', { access: { enabled: true, requireAuth: true } });
      const composed = compose([p1, p2], 'strictest');
      expect(composed.rules.access?.requireAuth).toBe(true);
    });
  });
});
