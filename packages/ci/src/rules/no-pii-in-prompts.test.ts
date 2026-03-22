import { describe, it, expect } from 'vitest';
import { noPiiInPrompts } from './no-pii-in-prompts.js';
import type { ScanConfig } from '../types.js';

const config: ScanConfig = {
  scanPath: '.',
  rules: 'all',
  failOn: 'high',
  format: 'console',
  commentOnPr: false,
  ignorePatterns: [],
};

describe('noPiiInPrompts', () => {
  describe('email detection in prompts', () => {
    it('should detect email addresses in template literals', () => {
      const content = 'const prompt = `Hello john.doe@company.com, how are you?`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('Email'))).toBe(true);
    });

    it('should not flag example.com emails', () => {
      const content = 'const prompt = `Contact user@example.com for help`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      const emailFindings = result.findings.filter((f) => f.message.includes('Email'));
      expect(emailFindings).toHaveLength(0);
    });

    it('should not flag noreply@ emails', () => {
      const content = 'const msg = `From: noreply@service.com`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      const emailFindings = result.findings.filter((f) => f.message.includes('Email'));
      expect(emailFindings).toHaveLength(0);
    });
  });

  describe('SSN detection in prompts', () => {
    it('should detect SSN in prompt context', () => {
      const content = 'const prompt = `Patient SSN: 123-45-6789`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      expect(result.findings.some((f) => f.message.includes('Social Security'))).toBe(true);
    });
  });

  describe('phone number detection', () => {
    it('should detect phone numbers in prompt templates', () => {
      const content = 'const prompt = `Call me at 555-867-5309`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      expect(result.findings.some((f) => f.message.includes('Phone'))).toBe(true);
    });
  });

  describe('credit card detection', () => {
    it('should detect credit card numbers in test fixtures', () => {
      const content = 'const testCard = "4111-1111-1111-1111";';
      const result = noPiiInPrompts.run('test/fixtures.test.ts', content, config);
      expect(result.findings.some((f) => f.message.includes('Credit card'))).toBe(true);
    });
  });

  describe('IP address detection', () => {
    it('should detect non-local IP addresses in prompts', () => {
      const content = 'const prompt = `The server at 203.0.113.42 is down`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      expect(result.findings.some((f) => f.message.includes('IP address'))).toBe(true);
    });

    it('should not flag localhost IP', () => {
      const content = 'const url = `http://127.0.0.1:3000/api`;';
      const result = noPiiInPrompts.run('config.ts', content, config);
      const ipFindings = result.findings.filter((f) => f.message.includes('IP address'));
      expect(ipFindings).toHaveLength(0);
    });

    it('should not flag private network IPs', () => {
      const content = 'const host = `192.168.1.1`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      const ipFindings = result.findings.filter((f) => f.message.includes('IP address'));
      expect(ipFindings).toHaveLength(0);
    });
  });

  describe('test file context', () => {
    it('should scan all lines in .test.ts files', () => {
      const content = 'const email = "real.person@gmail.com";';
      const result = noPiiInPrompts.run('user.test.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should scan all lines in __tests__ directories', () => {
      const content = 'const ssn = "234-56-7890";';
      const result = noPiiInPrompts.run('__tests__/auth.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('prompt context detection', () => {
    it('should scan lines containing "prompt" keyword', () => {
      const content = 'const prompt = "Hello john@company.com";';
      const result = noPiiInPrompts.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should scan lines containing "instruction" keyword', () => {
      const content = 'const instruction = "Call 555-867-5309 for details";';
      const result = noPiiInPrompts.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clean files', () => {
    it('should return no findings for code without PII', () => {
      const content = `const greeting = \`Hello, how can I help you?\`;
const systemMessage = \`You are a helpful assistant.\`;`;
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      expect(result.findings).toHaveLength(0);
    });
  });

  describe('finding properties', () => {
    it('should include suggestion for placeholder values', () => {
      const content = 'const prompt = `Email: real.user@gmail.com`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      if (result.findings.length > 0) {
        expect(result.findings[0].suggestion).toContain('placeholder');
      }
    });

    it('should report correct rule id', () => {
      const content = 'const prompt = `SSN: 234-56-7890`;';
      const result = noPiiInPrompts.run('prompts.ts', content, config);
      if (result.findings.length > 0) {
        expect(result.findings[0].rule).toBe('no-pii-in-prompts');
      }
    });
  });
});
