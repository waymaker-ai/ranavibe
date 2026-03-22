import { describe, it, expect } from 'vitest';
import { noHardcodedKeys } from './no-hardcoded-keys.js';
import type { ScanConfig } from '../types.js';

const config: ScanConfig = {
  scanPath: '.',
  rules: 'all',
  failOn: 'high',
  format: 'console',
  commentOnPr: false,
  ignorePatterns: [],
};

describe('noHardcodedKeys', () => {
  describe('Anthropic API keys', () => {
    it('should detect sk-ant- prefixed keys', () => {
      const content = 'const key = "sk-ant-abcdefghijklmnopqrstuvwxyz";';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
      expect(result.findings[0].message).toContain('Anthropic');
    });
  });

  describe('AWS access keys', () => {
    it('should detect AKIA prefixed keys', () => {
      const content = 'aws_key = "AKIAIOSFODNN7EXAMPLE"';
      const result = noHardcodedKeys.run('config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('AWS'))).toBe(true);
    });
  });

  describe('OpenAI keys', () => {
    it('should detect sk-proj- prefixed keys', () => {
      const content = 'const key = "sk-proj-abcdefghijklmnopqrstuvwxyz";';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('OpenAI'))).toBe(true);
    });

    it('should detect generic sk- keys', () => {
      const content = 'OPENAI_KEY = "sk-abcdefghijklmnopqrstuvwxyz"';
      const result = noHardcodedKeys.run('env.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generic patterns', () => {
    it('should detect api_key assignments', () => {
      const content = 'api_key = "mysecretapikey123"';
      const result = noHardcodedKeys.run('config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('api_key'))).toBe(true);
    });

    it('should detect secret assignments', () => {
      const content = 'secret = "verysecretvalue12345"';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect password assignments', () => {
      const content = 'password = "hunter2abcd"';
      const result = noHardcodedKeys.run('db.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect token assignments', () => {
      const content = 'token = "mytoken123456789abc"';
      const result = noHardcodedKeys.run('auth.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Bearer tokens', () => {
    it('should detect hardcoded Bearer tokens', () => {
      const content = 'headers = { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }';
      const result = noHardcodedKeys.run('api.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('Bearer'))).toBe(true);
    });
  });

  describe('private keys', () => {
    it('should detect private key headers', () => {
      const content = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...';
      const result = noHardcodedKeys.run('cert.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings.some((f) => f.message.includes('Private key'))).toBe(true);
    });

    it('should detect RSA private key headers', () => {
      const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIEvgIBADANBg...';
      const result = noHardcodedKeys.run('key.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('exclusions', () => {
    it('should skip .env.example files', () => {
      const content = 'api_key = "placeholder-key-123"';
      const result = noHardcodedKeys.run('.env.example', content, config);
      expect(result.findings).toHaveLength(0);
    });

    it('should skip .env.template files', () => {
      const content = 'secret = "your-secret-here"';
      const result = noHardcodedKeys.run('.env.template', content, config);
      expect(result.findings).toHaveLength(0);
    });

    it('should skip comment lines with "example"', () => {
      const content = '// example: api_key = "sk-ant-abcdefghijklmnopqrstuvwxyz"';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings).toHaveLength(0);
    });
  });

  describe('clean files', () => {
    it('should return no findings for clean code', () => {
      const content = `const apiKey = process.env.API_KEY;\nconst secret = process.env.SECRET;`;
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings).toHaveLength(0);
    });
  });

  describe('finding properties', () => {
    it('should include correct line and column numbers', () => {
      const content = 'line1\nconst key = "sk-ant-abcdefghijklmnopqrstuvwxyz";';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].line).toBe(2);
      expect(result.findings[0].column).toBeGreaterThan(0);
    });

    it('should include suggestion', () => {
      const content = 'password = "mysecretpw1234"';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].suggestion).toContain('environment variables');
    });

    it('should mask the detected key value', () => {
      const content = 'const key = "sk-ant-abcdefghijklmnopqrstuvwxyz";';
      const result = noHardcodedKeys.run('app.ts', content, config);
      expect(result.findings[0].message).toContain('***');
    });
  });
});
