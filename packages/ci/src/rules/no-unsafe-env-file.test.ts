import { describe, it, expect } from 'vitest';
import { noUnsafeEnvFile } from './no-unsafe-env-file.js';
import type { ScanConfig } from '../types.js';

const config: ScanConfig = {
  scanPath: '.',
  rules: 'all',
  failOn: 'high',
  format: 'console',
  commentOnPr: false,
  ignorePatterns: [],
};

describe('noUnsafeEnvFile', () => {
  it('blocks a staged .env', () => {
    const result = noUnsafeEnvFile.run('.env', 'FOO=bar', config);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].severity).toBe('critical');
  });

  it('blocks a staged .env.production', () => {
    const result = noUnsafeEnvFile.run('.env.production', 'FOO=bar', config);
    expect(result.findings.length).toBe(1);
  });

  it('allows .env.local', () => {
    const result = noUnsafeEnvFile.run('.env.local', 'FOO=bar', config);
    expect(result.findings.length).toBe(0);
  });

  it('allows .env.example', () => {
    const result = noUnsafeEnvFile.run('.env.example', 'FOO=', config);
    expect(result.findings.length).toBe(0);
  });

  it('allows .env.test.local', () => {
    const result = noUnsafeEnvFile.run('.env.test.local', 'FOO=bar', config);
    expect(result.findings.length).toBe(0);
  });

  it('ignores non-env files', () => {
    const result = noUnsafeEnvFile.run('src/app.ts', 'export const x = 1;', config);
    expect(result.findings.length).toBe(0);
  });
});
