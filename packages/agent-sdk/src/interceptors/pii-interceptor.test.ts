import { describe, it, expect } from 'vitest';
import { PIIInterceptor } from './pii-interceptor.js';
import type { InterceptorContext } from '../types.js';

const ctx: InterceptorContext = {
  requestId: 'test-1',
  timestamp: Date.now(),
  direction: 'input',
};

describe('PIIInterceptor', () => {
  describe('detect mode', () => {
    it('should detect PII and add violations without blocking', () => {
      const interceptor = new PIIInterceptor({ mode: 'detect', onDetection: 'warn' });
      const result = interceptor.processInput('My email is user@example.com', ctx);
      expect(result.blocked).toBe(false);
      expect(result.allowed).toBe(true);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations[0].rule).toBe('pii_detected');
    });

    it('should not modify text in detect mode', () => {
      const interceptor = new PIIInterceptor({ mode: 'detect', onDetection: 'warn' });
      const result = interceptor.processInput('SSN: 123-45-6789', ctx);
      expect(result.transformed).toBeUndefined();
    });
  });

  describe('redact mode', () => {
    it('should redact email addresses', () => {
      const interceptor = new PIIInterceptor({ mode: 'redact', onDetection: 'redact' });
      const result = interceptor.processInput('Contact john@test.com for info', ctx);
      expect(result.transformed).toBeDefined();
      expect(result.transformed).toContain('[REDACTED_EMAIL]');
      expect(result.transformed).not.toContain('john@test.com');
      expect(result.blocked).toBe(false);
    });

    it('should redact SSNs', () => {
      const interceptor = new PIIInterceptor({ mode: 'redact', onDetection: 'redact' });
      const result = interceptor.processInput('SSN is 234-56-7890', ctx);
      expect(result.transformed).toBeDefined();
      expect(result.transformed).toContain('[REDACTED_SSN]');
    });

    it('should redact multiple PII items in one text', () => {
      const interceptor = new PIIInterceptor({ mode: 'redact', onDetection: 'redact' });
      const result = interceptor.processInput('Email: a@b.com, SSN: 123-45-6789', ctx);
      expect(result.transformed).toBeDefined();
      expect(result.transformed).toContain('[REDACTED_EMAIL]');
      expect(result.transformed).toContain('[REDACTED_SSN]');
    });

    it('should report metadata about redaction count', () => {
      const interceptor = new PIIInterceptor({ mode: 'redact', onDetection: 'redact' });
      const result = interceptor.processInput('Email: test@test.com', ctx);
      expect(result.metadata.redacted).toBeGreaterThanOrEqual(1);
    });
  });

  describe('block mode', () => {
    it('should block input with PII', () => {
      const interceptor = new PIIInterceptor({ mode: 'block', onDetection: 'block' });
      const result = interceptor.processInput('My SSN is 234-56-7890', ctx);
      expect(result.blocked).toBe(true);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow input without PII', () => {
      const interceptor = new PIIInterceptor({ mode: 'block', onDetection: 'block' });
      const result = interceptor.processInput('Just a normal message', ctx);
      expect(result.blocked).toBe(false);
      expect(result.allowed).toBe(true);
    });
  });

  describe('output processing', () => {
    it('should process output the same as input', () => {
      const interceptor = new PIIInterceptor({ mode: 'redact', onDetection: 'redact' });
      const result = interceptor.processOutput('Response with email user@example.com', ctx);
      expect(result.transformed).toContain('[REDACTED_EMAIL]');
    });
  });

  describe('type filtering', () => {
    it('should only detect specified PII types', () => {
      const interceptor = new PIIInterceptor({ mode: 'block', onDetection: 'block', types: ['email'] });
      // SSN should not be caught when only email is specified
      const result = interceptor.processInput('SSN: 234-56-7890', ctx);
      expect(result.blocked).toBe(false);
    });

    it('should detect only the specified type', () => {
      const interceptor = new PIIInterceptor({ mode: 'block', onDetection: 'block', types: ['email'] });
      const result = interceptor.processInput('Contact user@example.com', ctx);
      expect(result.blocked).toBe(true);
    });
  });

  describe('allow list', () => {
    it('should skip values in the allow list', () => {
      const interceptor = new PIIInterceptor({
        mode: 'block',
        onDetection: 'block',
        allowList: ['noreply@company.com'],
      });
      const result = interceptor.processInput('Email noreply@company.com for support', ctx);
      expect(result.blocked).toBe(false);
    });
  });

  describe('constructor with true', () => {
    it('should default to redact mode when given true', () => {
      const interceptor = new PIIInterceptor(true);
      const result = interceptor.processInput('Email: test@test.com', ctx);
      expect(result.transformed).toContain('[REDACTED_EMAIL]');
      expect(result.blocked).toBe(false);
    });
  });
});
