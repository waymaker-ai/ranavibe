/**
 * Content Filter Tests
 * Basic tests for the content filtering functionality
 */

import { describe, it, expect } from 'vitest';
import {
  ContentFilter,
  createContentFilter,
  isContentSafe,
  assertContentSafe,
  ContentBlockedError,
  type FilterResult,
} from './filter';

describe('ContentFilter', () => {
  describe('Basic Filtering', () => {
    it('should filter profanity', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        defaultAction: 'warn',
      });

      const result = filter.filter('This is damn annoying');
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].category).toBe('profanity');
    });

    it('should pass clean content', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        defaultAction: 'warn',
      });

      const result = filter.filter('This is perfectly clean content');
      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('Redaction', () => {
    it('should redact filtered content', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        defaultAction: 'redact',
        redactionText: '***',
      });

      const result = filter.filter('This damn thing is crap');
      expect(result.filtered_content).toContain('***');
      expect(result.filtered_content).not.toContain('damn');
      expect(result.filtered_content).not.toContain('crap');
    });
  });

  describe('Custom Blocklist', () => {
    it('should filter custom patterns', () => {
      const filter = createContentFilter({
        blocklist: [
          {
            pattern: /\b(confidential|secret)\b/i,
            category: 'custom',
            severity: 'high',
          },
        ],
        defaultAction: 'warn',
      });

      const result = filter.filter('This is confidential information');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].category).toBe('custom');
      expect(result.violations[0].severity).toBe('high');
    });

    it('should support string patterns', () => {
      const filter = createContentFilter({
        blocklist: [
          {
            pattern: 'forbidden',
            category: 'custom',
            severity: 'medium',
          },
        ],
        defaultAction: 'warn',
      });

      const result = filter.filter('This is forbidden content');
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Allowlist', () => {
    it('should not filter allowlisted words', () => {
      const filter = createContentFilter({
        allowlist: ['damn'],
        enableProfanityFilter: true,
        defaultAction: 'warn',
      });

      const result = filter.filter('This is damn good');
      expect(result.violations.length).toBe(0);
      expect(result.passed).toBe(true);
    });
  });

  describe('Severity Threshold', () => {
    it('should only act on violations above threshold', () => {
      const filter = createContentFilter({
        severityThreshold: 'high',
        enableProfanityFilter: true,
        enableHarmfulContentFilter: true,
        defaultAction: 'warn',
      });

      // Low severity - should pass
      const lowResult = filter.filter('damn');
      expect(lowResult.passed).toBe(true);

      // High severity - should fail
      const highResult = filter.filter('how to kill someone');
      expect(highResult.passed).toBe(false);
    });
  });

  describe('Category-Specific Actions', () => {
    it('should apply different actions per category', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        enableSpamFilter: true,
        defaultAction: 'warn',
        categoryActions: {
          profanity: 'redact',
          spam: 'warn',
        },
      });

      const profanityResult = filter.filter('This is complete shit');
      expect(profanityResult.action_taken).toBe('redact');

      const spamResult = filter.filter('Click here now!');
      expect(spamResult.action_taken).toBe('warn');
    });
  });

  describe('Utility Functions', () => {
    it('isContentSafe should return boolean', () => {
      expect(isContentSafe('Clean content')).toBe(true);
      expect(isContentSafe('how to kill')).toBe(false);
    });

    it('assertContentSafe should throw on unsafe content', () => {
      expect(() => assertContentSafe('Clean content')).not.toThrow();
      expect(() => assertContentSafe('how to kill')).toThrow(ContentBlockedError);
    });
  });

  describe('Dynamic Management', () => {
    it('should add patterns dynamically', () => {
      const filter = createContentFilter({
        enableProfanityFilter: false,
      });

      filter.addPattern({
        pattern: 'restricted',
        category: 'custom',
        severity: 'high',
      });

      const result = filter.filter('This is restricted content');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should add to allowlist dynamically', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
      });

      filter.addToAllowlist('damn');
      const result = filter.filter('damn it');
      expect(result.violations.length).toBe(0);
    });

    it('should remove patterns by category', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
      });

      filter.removePatternsByCategory('profanity');
      const result = filter.filter('damn it');
      expect(result.violations.length).toBe(0);
    });
  });

  describe('Metadata', () => {
    it('should include metadata in results', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        enableHarmfulContentFilter: true,
      });

      const result = filter.filter('damn violent content');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.total_violations).toBeGreaterThan(0);
      expect(result.metadata?.highest_severity).toBeDefined();
      expect(result.metadata?.categories_triggered).toBeInstanceOf(Array);
    });
  });

  describe('Callbacks', () => {
    it('should trigger onViolation callback', () => {
      let callbackTriggered = false;

      const filter = createContentFilter({
        enableProfanityFilter: true,
        onViolation: (violation) => {
          callbackTriggered = true;
        },
      });

      filter.filter('damn it');
      expect(callbackTriggered).toBe(true);
    });

    it('should trigger onBlock callback', () => {
      let blockCallbackTriggered = false;

      const filter = createContentFilter({
        enableHarmfulContentFilter: true,
        defaultAction: 'block',
        onBlock: (result) => {
          blockCallbackTriggered = true;
        },
      });

      filter.filter('how to kill');
      expect(blockCallbackTriggered).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide filter statistics', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
        enableHarmfulContentFilter: true,
      });

      const stats = filter.getStats();
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.patternsByCategory).toBeDefined();
      expect(stats.allowlistSize).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const filter = createContentFilter({
        enableProfanityFilter: false,
      });

      filter.updateConfig({
        enableProfanityFilter: true,
      });

      const result = filter.filter('damn it');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should get current configuration', () => {
      const filter = createContentFilter({
        defaultAction: 'redact',
        redactionText: '***',
      });

      const config = filter.getConfig();
      expect(config.defaultAction).toBe('redact');
      expect(config.redactionText).toBe('***');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const filter = createContentFilter();
      const result = filter.filter('');
      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should handle very long content within limit', () => {
      const filter = createContentFilter({
        maxContentLength: 1000,
      });

      const longContent = 'a'.repeat(500);
      const result = filter.filter(longContent);
      expect(result.passed).toBe(true);
    });

    it('should throw on content exceeding max length', () => {
      const filter = createContentFilter({
        maxContentLength: 100,
      });

      const tooLong = 'a'.repeat(200);
      expect(() => filter.filter(tooLong)).toThrow();
    });
  });

  describe('Context Extraction', () => {
    it('should include context for violations', () => {
      const filter = createContentFilter({
        enableProfanityFilter: true,
      });

      const result = filter.filter('This is a damn test of context extraction');
      expect(result.violations[0].context).toBeDefined();
      expect(result.violations[0].context).toContain('damn');
    });
  });

  describe('Critical Severity Auto-Block', () => {
    it('should automatically block critical severity violations', () => {
      const filter = createContentFilter({
        enableHarmfulContentFilter: true,
        defaultAction: 'warn', // Default is warn, but critical should block
      });

      const result = filter.filter('how to commit suicide');
      expect(result.action_taken).toBe('block');
    });
  });
});
