import { describe, it, expect } from 'vitest';
import { noMockDataInProd } from './no-mock-data-in-prod.js';
import type { ScanConfig } from '../types.js';

const config: ScanConfig = {
  scanPath: '.',
  rules: 'all',
  failOn: 'high',
  format: 'console',
  commentOnPr: false,
  ignorePatterns: [],
};

describe('noMockDataInProd', () => {
  it('flags a mock-data identifier in a production path', () => {
    const content = 'export const mockUsers = [{ id: 1 }];';
    const result = noMockDataInProd.run('src/api/users.ts', content, config);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].severity).toBe('medium');
  });

  it('does not flag the same identifier in a test path', () => {
    const content = 'export const mockUsers = [{ id: 1 }];';
    const result = noMockDataInProd.run('src/api/__tests__/users.test.ts', content, config);
    expect(result.findings.length).toBe(0);
  });

  it('does not flag a fixtures path', () => {
    const content = 'export const fakeUsers = [];';
    const result = noMockDataInProd.run('src/fixtures/users.ts', content, config);
    expect(result.findings.length).toBe(0);
  });

  it('does not flag clean production code', () => {
    const content = 'export const users = await db.query("select * from users");';
    const result = noMockDataInProd.run('src/api/users.ts', content, config);
    expect(result.findings.length).toBe(0);
  });
});
