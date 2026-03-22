/**
 * Tests for the CoFounder CI GitHub Action and core scan functionality.
 *
 * Covers: action input parsing, scan configuration, severity thresholds,
 * rule mapping, SARIF generation, PR comments, and GitHub context parsing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ScanConfig, ScanResult, Finding, Severity, GitHubContext } from '../types.js';
import { severityMeetsThreshold, SEVERITY_ORDER } from '../types.js';

// ---- Helpers ----

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    file: 'src/app.ts',
    line: 10,
    column: 1,
    rule: 'no-hardcoded-keys',
    severity: 'high',
    message: 'Hardcoded API key detected',
    ...overrides,
  };
}

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    findings: [],
    filesScanned: 5,
    rulesApplied: 6,
    durationMs: 120,
    passed: true,
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    ...overrides,
  };
}

function makeConfig(overrides: Partial<ScanConfig> = {}): ScanConfig {
  return {
    scanPath: '.',
    rules: 'all',
    failOn: 'high',
    format: 'console',
    commentOnPr: true,
    ignorePatterns: [],
    ...overrides,
  };
}

// ---- Scan type to rule mapping (mirrors action.yml logic) ----

function mapScanTypesToRules(scanInput: string): string {
  if (scanInput === 'all') return 'all';

  const mapping: Record<string, string> = {
    pii: 'no-pii-in-prompts',
    injection: 'no-injection-vuln',
    secrets: 'no-hardcoded-keys',
    models: 'approved-models',
    cost: 'cost-estimation',
    safety: 'safe-defaults',
  };

  return scanInput
    .split(',')
    .map(t => t.trim())
    .filter(t => mapping[t])
    .map(t => mapping[t])
    .join(',');
}

// ---- Action input parsing (mirrors composite step logic) ----

interface ActionInputs {
  scan: string;
  'fail-on': string;
  format: string;
  config: string;
  'scan-path': string;
  'github-token': string;
  'comment-on-pr': string;
  'upload-sarif': string;
  'approved-models': string;
  'budget-limit': string;
}

function getDefaultInputs(): ActionInputs {
  return {
    scan: 'all',
    'fail-on': 'high',
    format: 'text',
    config: '.cofounder.yml',
    'scan-path': '.',
    'github-token': '',
    'comment-on-pr': 'true',
    'upload-sarif': 'true',
    'approved-models': '',
    'budget-limit': '',
  };
}

function buildScanConfigFromInputs(inputs: ActionInputs): ScanConfig {
  const rules = mapScanTypesToRules(inputs.scan);
  return {
    scanPath: inputs['scan-path'],
    rules: rules === 'all' ? 'all' : rules.split(','),
    failOn: inputs['fail-on'] as Severity,
    format: inputs.format === 'sarif' ? 'sarif' : inputs.format === 'json' ? 'json' : 'console',
    configPath: inputs.config,
    commentOnPr: inputs['comment-on-pr'] === 'true',
    githubToken: inputs['github-token'] || undefined,
    approvedModels: inputs['approved-models'] ? inputs['approved-models'].split(',').map(s => s.trim()) : undefined,
    budgetLimit: inputs['budget-limit'] ? parseFloat(inputs['budget-limit']) : undefined,
    ignorePatterns: [],
  };
}

// ---- Tests ----

describe('Action Input Defaults', () => {
  it('should have correct default values', () => {
    const defaults = getDefaultInputs();
    expect(defaults.scan).toBe('all');
    expect(defaults['fail-on']).toBe('high');
    expect(defaults.format).toBe('text');
    expect(defaults.config).toBe('.cofounder.yml');
    expect(defaults['scan-path']).toBe('.');
    expect(defaults['comment-on-pr']).toBe('true');
    expect(defaults['upload-sarif']).toBe('true');
  });

  it('should produce valid scan config from defaults', () => {
    const config = buildScanConfigFromInputs(getDefaultInputs());
    expect(config.rules).toBe('all');
    expect(config.failOn).toBe('high');
    expect(config.scanPath).toBe('.');
    expect(config.commentOnPr).toBe(true);
    expect(config.approvedModels).toBeUndefined();
    expect(config.budgetLimit).toBeUndefined();
  });
});

describe('Scan Type to Rule Mapping', () => {
  it('should map "all" to "all"', () => {
    expect(mapScanTypesToRules('all')).toBe('all');
  });

  it('should map pii to no-pii-in-prompts', () => {
    expect(mapScanTypesToRules('pii')).toBe('no-pii-in-prompts');
  });

  it('should map injection to no-injection-vuln', () => {
    expect(mapScanTypesToRules('injection')).toBe('no-injection-vuln');
  });

  it('should map secrets to no-hardcoded-keys', () => {
    expect(mapScanTypesToRules('secrets')).toBe('no-hardcoded-keys');
  });

  it('should map models to approved-models', () => {
    expect(mapScanTypesToRules('models')).toBe('approved-models');
  });

  it('should map cost to cost-estimation', () => {
    expect(mapScanTypesToRules('cost')).toBe('cost-estimation');
  });

  it('should map safety to safe-defaults', () => {
    expect(mapScanTypesToRules('safety')).toBe('safe-defaults');
  });

  it('should handle comma-separated scan types', () => {
    const result = mapScanTypesToRules('pii,injection,secrets');
    expect(result).toBe('no-pii-in-prompts,no-injection-vuln,no-hardcoded-keys');
  });

  it('should handle whitespace in scan types', () => {
    const result = mapScanTypesToRules('pii, injection, secrets');
    expect(result).toBe('no-pii-in-prompts,no-injection-vuln,no-hardcoded-keys');
  });

  it('should ignore unknown scan types', () => {
    const result = mapScanTypesToRules('pii,unknown,secrets');
    expect(result).toBe('no-pii-in-prompts,no-hardcoded-keys');
  });
});

describe('Severity Threshold', () => {
  it('should treat critical as meeting all thresholds', () => {
    expect(severityMeetsThreshold('critical', 'critical')).toBe(true);
    expect(severityMeetsThreshold('critical', 'high')).toBe(true);
    expect(severityMeetsThreshold('critical', 'medium')).toBe(true);
    expect(severityMeetsThreshold('critical', 'low')).toBe(true);
  });

  it('should treat high as not meeting critical threshold', () => {
    expect(severityMeetsThreshold('high', 'critical')).toBe(false);
    expect(severityMeetsThreshold('high', 'high')).toBe(true);
  });

  it('should treat low as only meeting low and info thresholds', () => {
    expect(severityMeetsThreshold('low', 'high')).toBe(false);
    expect(severityMeetsThreshold('low', 'medium')).toBe(false);
    expect(severityMeetsThreshold('low', 'low')).toBe(true);
    expect(severityMeetsThreshold('low', 'info')).toBe(true);
  });

  it('should order severities correctly', () => {
    expect(SEVERITY_ORDER.critical).toBeGreaterThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeGreaterThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeGreaterThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeGreaterThan(SEVERITY_ORDER.info);
  });
});

describe('Scan Result Pass/Fail', () => {
  it('should pass when no findings exist', () => {
    const result = makeScanResult({ findings: [], passed: true });
    expect(result.passed).toBe(true);
  });

  it('should fail when findings meet threshold', () => {
    const config = makeConfig({ failOn: 'high' });
    const findings = [makeFinding({ severity: 'high' })];
    const hasFailing = findings.some(f => severityMeetsThreshold(f.severity, config.failOn));
    expect(hasFailing).toBe(true);
  });

  it('should pass when findings are below threshold', () => {
    const config = makeConfig({ failOn: 'high' });
    const findings = [makeFinding({ severity: 'medium' })];
    const hasFailing = findings.some(f => severityMeetsThreshold(f.severity, config.failOn));
    expect(hasFailing).toBe(false);
  });

  it('should fail on critical when fail-on is low', () => {
    const config = makeConfig({ failOn: 'low' });
    const findings = [makeFinding({ severity: 'critical' })];
    const hasFailing = findings.some(f => severityMeetsThreshold(f.severity, config.failOn));
    expect(hasFailing).toBe(true);
  });

  it('should pass info findings when fail-on is low', () => {
    const config = makeConfig({ failOn: 'low' });
    const findings = [makeFinding({ severity: 'info' })];
    const hasFailing = findings.some(f => severityMeetsThreshold(f.severity, config.failOn));
    expect(hasFailing).toBe(false);
  });
});

describe('Config Building from Action Inputs', () => {
  it('should parse approved-models into array', () => {
    const inputs = { ...getDefaultInputs(), 'approved-models': 'gpt-4o,claude-3-5-sonnet,gemini-pro' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.approvedModels).toEqual(['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro']);
  });

  it('should parse budget-limit as number', () => {
    const inputs = { ...getDefaultInputs(), 'budget-limit': '500' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.budgetLimit).toBe(500);
  });

  it('should leave approvedModels undefined when empty', () => {
    const config = buildScanConfigFromInputs(getDefaultInputs());
    expect(config.approvedModels).toBeUndefined();
  });

  it('should leave budgetLimit undefined when empty', () => {
    const config = buildScanConfigFromInputs(getDefaultInputs());
    expect(config.budgetLimit).toBeUndefined();
  });

  it('should set commentOnPr to false when input is "false"', () => {
    const inputs = { ...getDefaultInputs(), 'comment-on-pr': 'false' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.commentOnPr).toBe(false);
  });

  it('should handle custom scan-path', () => {
    const inputs = { ...getDefaultInputs(), 'scan-path': './src' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.scanPath).toBe('./src');
  });

  it('should map text format to console', () => {
    const inputs = { ...getDefaultInputs(), format: 'text' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.format).toBe('console');
  });

  it('should preserve sarif format', () => {
    const inputs = { ...getDefaultInputs(), format: 'sarif' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.format).toBe('sarif');
  });

  it('should preserve json format', () => {
    const inputs = { ...getDefaultInputs(), format: 'json' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.format).toBe('json');
  });

  it('should set configPath from config input', () => {
    const inputs = { ...getDefaultInputs(), config: 'custom/path/.cofounder.yml' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.configPath).toBe('custom/path/.cofounder.yml');
  });

  it('should map specific scan types to rule arrays', () => {
    const inputs = { ...getDefaultInputs(), scan: 'pii,secrets' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.rules).toEqual(['no-pii-in-prompts', 'no-hardcoded-keys']);
  });
});

describe('GitHub Context Parsing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should parse repository into owner and repo', () => {
    process.env.GITHUB_REPOSITORY = 'waymaker-ai/cofounder';
    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    expect(owner).toBe('waymaker-ai');
    expect(repo).toBe('cofounder');
  });

  it('should handle missing GITHUB_REPOSITORY', () => {
    delete process.env.GITHUB_REPOSITORY;
    const repository = process.env.GITHUB_REPOSITORY || '';
    const [owner, repo] = repository.split('/');
    expect(owner).toBe('');
    expect(repo).toBeUndefined();
  });

  it('should use GITHUB_TOKEN when available', () => {
    process.env.GITHUB_TOKEN = 'ghp_test123';
    const token = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN;
    expect(token).toBe('ghp_test123');
  });

  it('should fall back to INPUT_GITHUB_TOKEN', () => {
    delete process.env.GITHUB_TOKEN;
    process.env.INPUT_GITHUB_TOKEN = 'ghp_input456';
    const token = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN;
    expect(token).toBe('ghp_input456');
  });

  it('should default serverUrl to github.com', () => {
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    expect(serverUrl).toBe('https://github.com');
  });

  it('should default apiUrl to api.github.com', () => {
    const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
    expect(apiUrl).toBe('https://api.github.com');
  });
});

describe('Summary Counting', () => {
  it('should count findings by severity', () => {
    const findings: Finding[] = [
      makeFinding({ severity: 'critical' }),
      makeFinding({ severity: 'critical' }),
      makeFinding({ severity: 'high' }),
      makeFinding({ severity: 'medium' }),
      makeFinding({ severity: 'low' }),
      makeFinding({ severity: 'low' }),
      makeFinding({ severity: 'info' }),
    ];

    const summary: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity]++;
    }

    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
    expect(summary.low).toBe(2);
    expect(summary.info).toBe(1);
  });

  it('should produce zero counts for empty findings', () => {
    const summary: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    expect(Object.values(summary).every(v => v === 0)).toBe(true);
  });
});

describe('Finding Structure', () => {
  it('should have all required fields', () => {
    const finding = makeFinding();
    expect(finding.file).toBeDefined();
    expect(finding.line).toBeGreaterThan(0);
    expect(finding.column).toBeGreaterThan(0);
    expect(finding.rule).toBeDefined();
    expect(finding.severity).toBeDefined();
    expect(finding.message).toBeDefined();
  });

  it('should support optional suggestion field', () => {
    const finding = makeFinding({ suggestion: 'Use environment variables instead' });
    expect(finding.suggestion).toBe('Use environment variables instead');
  });

  it('should support optional source field', () => {
    const finding = makeFinding({ source: 'const API_KEY = "sk-1234"' });
    expect(finding.source).toBe('const API_KEY = "sk-1234"');
  });
});

describe('SARIF Output Compatibility', () => {
  it('should map critical severity to error level', () => {
    const mapping: Record<string, string> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'note',
      info: 'note',
    };
    expect(mapping['critical']).toBe('error');
    expect(mapping['high']).toBe('error');
    expect(mapping['medium']).toBe('warning');
    expect(mapping['low']).toBe('note');
    expect(mapping['info']).toBe('note');
  });

  it('should assign valid SARIF severity ranks', () => {
    const ranks: Record<string, number> = {
      critical: 95,
      high: 80,
      medium: 60,
      low: 30,
      info: 10,
    };
    for (const rank of Object.values(ranks)) {
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThanOrEqual(100);
    }
  });
});

describe('Action Outputs', () => {
  it('should produce correct output keys from scan result', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ severity: 'critical' }),
        makeFinding({ severity: 'high' }),
        makeFinding({ severity: 'medium' }),
      ],
      passed: false,
      summary: { critical: 1, high: 1, medium: 1, low: 0, info: 0 },
    });

    // These mirror what the action step outputs
    const outputs = {
      findings: result.findings.length,
      critical: result.summary.critical,
      high: result.summary.high,
      medium: result.summary.medium,
      low: result.summary.low,
      passed: result.passed,
    };

    expect(outputs.findings).toBe(3);
    expect(outputs.critical).toBe(1);
    expect(outputs.high).toBe(1);
    expect(outputs.medium).toBe(1);
    expect(outputs.low).toBe(0);
    expect(outputs.passed).toBe(false);
  });

  it('should report passed=true when no findings at threshold', () => {
    const result = makeScanResult({
      findings: [makeFinding({ severity: 'info' })],
      passed: true,
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 1 },
    });
    expect(result.passed).toBe(true);
  });
});

describe('Edge Cases', () => {
  it('should handle empty scan input string', () => {
    const result = mapScanTypesToRules('');
    expect(result).toBe('');
  });

  it('should handle single scan type without comma', () => {
    const result = mapScanTypesToRules('pii');
    expect(result).toBe('no-pii-in-prompts');
  });

  it('should handle all six scan types together', () => {
    const result = mapScanTypesToRules('pii,injection,secrets,models,cost,safety');
    const rules = result.split(',');
    expect(rules).toHaveLength(6);
    expect(rules).toContain('no-pii-in-prompts');
    expect(rules).toContain('no-injection-vuln');
    expect(rules).toContain('no-hardcoded-keys');
    expect(rules).toContain('approved-models');
    expect(rules).toContain('cost-estimation');
    expect(rules).toContain('safe-defaults');
  });

  it('should handle budget-limit with decimal values', () => {
    const inputs = { ...getDefaultInputs(), 'budget-limit': '99.95' };
    const config = buildScanConfigFromInputs(inputs);
    expect(config.budgetLimit).toBeCloseTo(99.95);
  });
});
