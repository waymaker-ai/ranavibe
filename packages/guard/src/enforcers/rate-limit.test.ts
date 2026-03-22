import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limit.js';

describe('RateLimiter', () => {
  describe('basic rate limiting', () => {
    it('should allow requests within the limit', () => {
      const limiter = new RateLimiter({ max: 5, window: '1m' });
      for (let i = 0; i < 5; i++) {
        const result = limiter.check();
        expect(result.allowed).toBe(true);
        limiter.record();
      }
    });

    it('should block when limit is exceeded', () => {
      const limiter = new RateLimiter({ max: 3, window: '1m' });
      for (let i = 0; i < 3; i++) {
        limiter.record();
      }
      const result = limiter.check();
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should report remaining requests correctly', () => {
      const limiter = new RateLimiter({ max: 10, window: '1m' });
      limiter.record();
      limiter.record();
      const result = limiter.check();
      expect(result.remaining).toBe(8);
      expect(result.allowed).toBe(true);
    });

    it('should report zero remaining when full', () => {
      const limiter = new RateLimiter({ max: 2, window: '1m' });
      limiter.record();
      limiter.record();
      const result = limiter.check();
      expect(result.remaining).toBe(0);
    });
  });

  describe('window parsing', () => {
    it('should parse seconds window', () => {
      const limiter = new RateLimiter({ max: 5, window: '30s' });
      const result = limiter.check();
      expect(result.allowed).toBe(true);
    });

    it('should parse minutes window', () => {
      const limiter = new RateLimiter({ max: 100, window: '5m' });
      const result = limiter.check();
      expect(result.allowed).toBe(true);
    });

    it('should parse hours window', () => {
      const limiter = new RateLimiter({ max: 1000, window: '1h' });
      const result = limiter.check();
      expect(result.allowed).toBe(true);
    });

    it('should parse days window', () => {
      const limiter = new RateLimiter({ max: 10000, window: '1d' });
      const result = limiter.check();
      expect(result.allowed).toBe(true);
    });
  });

  describe('reset behavior', () => {
    it('should allow requests again after reset', () => {
      const limiter = new RateLimiter({ max: 1, window: '1m' });
      limiter.record();
      expect(limiter.check().allowed).toBe(false);
      limiter.reset();
      expect(limiter.check().allowed).toBe(true);
    });
  });

  describe('resetMs reporting', () => {
    it('should report resetMs as 0 when no requests have been made', () => {
      const limiter = new RateLimiter({ max: 5, window: '1m' });
      const result = limiter.check();
      expect(result.resetMs).toBe(0);
    });

    it('should report positive resetMs after requests', () => {
      const limiter = new RateLimiter({ max: 5, window: '1m' });
      limiter.record();
      const result = limiter.check();
      expect(result.resetMs).toBeGreaterThan(0);
      expect(result.resetMs).toBeLessThanOrEqual(60000);
    });
  });

  describe('edge cases', () => {
    it('should handle max of 0 (always blocked)', () => {
      const limiter = new RateLimiter({ max: 0, window: '1m' });
      const result = limiter.check();
      expect(result.allowed).toBe(false);
    });

    it('should handle max of 1', () => {
      const limiter = new RateLimiter({ max: 1, window: '1m' });
      expect(limiter.check().allowed).toBe(true);
      limiter.record();
      expect(limiter.check().allowed).toBe(false);
    });
  });
});
