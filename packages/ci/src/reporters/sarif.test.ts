import { describe, it, expect } from 'vitest';
import { formatSarif } from './sarif.js';
import type { ScanResult, Severity } from '../types.js';

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    findings: [],
    filesScanned: 5,
    rulesApplied: 3,
    durationMs: 150,
    passed: true,
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    ...overrides,
  };
}

describe('formatSarif', () => {
  describe('valid SARIF schema', () => {
    it('should produce valid JSON', () => {
      const result = makeScanResult();
      const sarif = formatSarif(result);
      expect(() => JSON.parse(sarif)).not.toThrow();
    });

    it('should include SARIF schema reference', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      expect(sarif.$schema).toContain('sarif-schema-2.1.0');
    });

    it('should have version 2.1.0', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      expect(sarif.version).toBe('2.1.0');
    });

    it('should have exactly one run', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      expect(sarif.runs).toHaveLength(1);
    });

    it('should include tool driver info', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      const driver = sarif.runs[0].tool.driver;
      expect(driver.name).toBe('rana-ci');
      expect(driver.semanticVersion).toBe('1.0.0');
      expect(driver.informationUri).toBeDefined();
    });
  });

  describe('findings mapping', () => {
    it('should map findings to SARIF results', () => {
      const result = makeScanResult({
        findings: [
          { file: 'src/app.ts', line: 10, column: 5, rule: 'no-hardcoded-keys', severity: 'critical', message: 'API key detected' },
        ],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results).toHaveLength(1);
      expect(sarif.runs[0].results[0].ruleId).toBe('no-hardcoded-keys');
    });

    it('should include location information', () => {
      const result = makeScanResult({
        findings: [
          { file: 'src/config.ts', line: 42, column: 8, rule: 'test-rule', severity: 'high', message: 'Issue found' },
        ],
      });
      const sarif = JSON.parse(formatSarif(result));
      const location = sarif.runs[0].results[0].locations[0].physicalLocation;
      expect(location.artifactLocation.uri).toBe('src/config.ts');
      expect(location.region.startLine).toBe(42);
      expect(location.region.startColumn).toBe(8);
    });

    it('should include fixes when suggestion is provided', () => {
      const result = makeScanResult({
        findings: [
          { file: 'app.ts', line: 1, column: 1, rule: 'test', severity: 'high', message: 'Issue', suggestion: 'Use env vars' },
        ],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].fixes).toHaveLength(1);
      expect(sarif.runs[0].results[0].fixes[0].description.text).toBe('Use env vars');
    });

    it('should not include fixes when no suggestion', () => {
      const result = makeScanResult({
        findings: [
          { file: 'app.ts', line: 1, column: 1, rule: 'test', severity: 'high', message: 'Issue' },
        ],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].fixes).toBeUndefined();
    });
  });

  describe('severity mapping', () => {
    it('should map critical to error level', () => {
      const result = makeScanResult({
        findings: [{ file: 'a.ts', line: 1, column: 1, rule: 'r', severity: 'critical', message: 'm' }],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].level).toBe('error');
    });

    it('should map high to error level', () => {
      const result = makeScanResult({
        findings: [{ file: 'a.ts', line: 1, column: 1, rule: 'r', severity: 'high', message: 'm' }],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].level).toBe('error');
    });

    it('should map medium to warning level', () => {
      const result = makeScanResult({
        findings: [{ file: 'a.ts', line: 1, column: 1, rule: 'r', severity: 'medium', message: 'm' }],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].level).toBe('warning');
    });

    it('should map low to note level', () => {
      const result = makeScanResult({
        findings: [{ file: 'a.ts', line: 1, column: 1, rule: 'r', severity: 'low', message: 'm' }],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].level).toBe('note');
    });

    it('should map info to note level', () => {
      const result = makeScanResult({
        findings: [{ file: 'a.ts', line: 1, column: 1, rule: 'r', severity: 'info', message: 'm' }],
      });
      const sarif = JSON.parse(formatSarif(result));
      expect(sarif.runs[0].results[0].level).toBe('note');
    });
  });

  describe('rule deduplication', () => {
    it('should include unique rules in the driver', () => {
      const result = makeScanResult({
        findings: [
          { file: 'a.ts', line: 1, column: 1, rule: 'no-hardcoded-keys', severity: 'critical', message: 'Key found' },
          { file: 'b.ts', line: 2, column: 1, rule: 'no-hardcoded-keys', severity: 'critical', message: 'Another key' },
          { file: 'c.ts', line: 3, column: 1, rule: 'no-pii-in-prompts', severity: 'high', message: 'PII found' },
        ],
      });
      const sarif = JSON.parse(formatSarif(result));
      const rules = sarif.runs[0].tool.driver.rules;
      expect(rules).toHaveLength(2);
      expect(rules.map((r: any) => r.id)).toContain('no-hardcoded-keys');
      expect(rules.map((r: any) => r.id)).toContain('no-pii-in-prompts');
    });
  });

  describe('invocation status', () => {
    it('should reflect passed scan as successful', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult({ passed: true })));
      expect(sarif.runs[0].invocations[0].executionSuccessful).toBe(true);
    });

    it('should reflect failed scan as unsuccessful', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult({ passed: false })));
      expect(sarif.runs[0].invocations[0].executionSuccessful).toBe(false);
    });

    it('should include endTimeUtc', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      expect(sarif.runs[0].invocations[0].endTimeUtc).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('should produce valid SARIF for zero findings', () => {
      const sarif = JSON.parse(formatSarif(makeScanResult()));
      expect(sarif.runs[0].results).toHaveLength(0);
      expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
    });
  });
});
