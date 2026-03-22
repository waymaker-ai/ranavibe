import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  scan,
  severityMeetsThreshold,
  SEVERITY_ORDER,
  getRules,
  ALL_RULES,
  RULES_MAP,
  noHardcodedKeys,
  noPiiInPrompts,
  formatSarif,
  formatConsole,
  formatJson,
  formatMarkdown,
  postOrUpdateComment,
  parsePrNumber,
} from '../index';
import type { ScanConfig, ScanResult, Finding, Severity, RuleDefinition } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<ScanConfig> = {}): ScanConfig {
  return {
    scanPath: '.',
    rules: 'all',
    failOn: 'high',
    format: 'console',
    commentOnPr: false,
    ignorePatterns: [],
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    file: 'src/app.ts',
    line: 10,
    column: 5,
    rule: 'no-hardcoded-keys',
    severity: 'critical',
    message: 'Anthropic API key detected: sk-ant***key1',
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

// ===========================================================================
// Severity
// ===========================================================================

describe('severityMeetsThreshold', () => {
  it('should return true when severity equals threshold', () => {
    expect(severityMeetsThreshold('high', 'high')).toBe(true);
  });

  it('should return true when severity exceeds threshold', () => {
    expect(severityMeetsThreshold('critical', 'high')).toBe(true);
  });

  it('should return false when severity is below threshold', () => {
    expect(severityMeetsThreshold('low', 'high')).toBe(false);
  });

  it('should handle info severity correctly', () => {
    expect(severityMeetsThreshold('info', 'info')).toBe(true);
    expect(severityMeetsThreshold('info', 'low')).toBe(false);
  });

  it('should handle critical threshold - only critical passes', () => {
    expect(severityMeetsThreshold('critical', 'critical')).toBe(true);
    expect(severityMeetsThreshold('high', 'critical')).toBe(false);
  });
});

describe('SEVERITY_ORDER', () => {
  it('should have correct ordering', () => {
    expect(SEVERITY_ORDER.critical).toBeGreaterThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeGreaterThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeGreaterThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeGreaterThan(SEVERITY_ORDER.info);
  });
});

// ===========================================================================
// Rules Registry
// ===========================================================================

describe('Rules Registry', () => {
  it('should have all expected rules', () => {
    expect(ALL_RULES.length).toBeGreaterThanOrEqual(6);
    const ruleIds = ALL_RULES.map(r => r.id);
    expect(ruleIds).toContain('no-hardcoded-keys');
    expect(ruleIds).toContain('no-pii-in-prompts');
    expect(ruleIds).toContain('no-injection-vuln');
    expect(ruleIds).toContain('approved-models');
    expect(ruleIds).toContain('cost-estimation');
    expect(ruleIds).toContain('safe-defaults');
  });

  it('should map rules by ID', () => {
    expect(RULES_MAP.get('no-hardcoded-keys')).toBeDefined();
    expect(RULES_MAP.get('no-pii-in-prompts')).toBeDefined();
  });

  it('should return all rules when "all" is passed', () => {
    const rules = getRules('all');
    expect(rules.length).toBe(ALL_RULES.length);
  });

  it('should return specific rules by ID', () => {
    const rules = getRules(['no-hardcoded-keys', 'no-pii-in-prompts']);
    expect(rules.length).toBe(2);
    expect(rules[0].id).toBe('no-hardcoded-keys');
  });

  it('should skip unknown rule IDs', () => {
    const rules = getRules(['no-hardcoded-keys', 'nonexistent-rule']);
    expect(rules.length).toBe(1);
  });
});

// ===========================================================================
// no-hardcoded-keys rule
// ===========================================================================

describe('noHardcodedKeys rule', () => {
  const config = makeConfig();

  it('should detect Anthropic API keys', () => {
    const content = 'const key = "sk-ant-abcdefghijklmnopqrstuvwxyz";';
    const result = noHardcodedKeys.run('src/config.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].severity).toBe('critical');
  });

  it('should detect OpenAI API keys', () => {
    const content = 'const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyz";';
    const result = noHardcodedKeys.run('src/config.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should detect AWS access keys', () => {
    const content = 'AWS_KEY = "AKIAIOSFODNN7EXAMPLE"';
    const result = noHardcodedKeys.run('config.yml', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should detect hardcoded api_key assignments', () => {
    const content = 'api_key = "my-super-secret-long-key"';
    const result = noHardcodedKeys.run('src/app.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].severity).toBe('high');
  });

  it('should detect hardcoded password assignments', () => {
    const content = 'password = "hunter2complex"';
    const result = noHardcodedKeys.run('src/db.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should detect Bearer tokens', () => {
    const content = 'headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0" }';
    const result = noHardcodedKeys.run('src/api.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should detect private keys', () => {
    const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAK...\n-----END RSA PRIVATE KEY-----';
    const result = noHardcodedKeys.run('src/cert.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should not flag .env.example files', () => {
    const content = 'OPENAI_API_KEY=sk-your-key-here';
    const result = noHardcodedKeys.run('.env.example', content, config);
    expect(result.findings.length).toBe(0);
  });

  it('should not flag clean code without secrets', () => {
    const content = `
const config = {
  provider: process.env.PROVIDER,
  apiKey: process.env.API_KEY,
  model: 'gpt-4o',
};
`;
    const result = noHardcodedKeys.run('src/config.ts', content, config);
    expect(result.findings.length).toBe(0);
  });

  it('should include suggestion for fix', () => {
    const content = 'const key = "sk-ant-abcdefghijklmnopqrstuvwxyz";';
    const result = noHardcodedKeys.run('src/config.ts', content, config);
    expect(result.findings[0].suggestion).toContain('environment variables');
  });

  it('should report correct line and column numbers', () => {
    const content = 'line 1\nline 2\nconst key = "sk-ant-abcdefghijklmnopqrstuvwxyz";\nline 4';
    const result = noHardcodedKeys.run('src/file.ts', content, config);
    expect(result.findings[0].line).toBe(3);
    expect(result.findings[0].column).toBeGreaterThan(0);
  });

  it('should detect Groq API keys', () => {
    const content = 'const groqKey = "gsk_abcdefghijklmnopqrstuvwxyz"';
    const result = noHardcodedKeys.run('src/groq.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// no-pii-in-prompts rule
// ===========================================================================

describe('noPiiInPrompts rule', () => {
  const config = makeConfig();

  it('should detect email addresses in test files', () => {
    const content = 'const prompt = `Send email to john.smith@realcompany.com`;';
    const result = noPiiInPrompts.run('src/__tests__/test.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].rule).toBe('no-pii-in-prompts');
  });

  it('should detect SSNs in prompt templates', () => {
    const content = 'const prompt = `User SSN: 123-45-6789`;';
    const result = noPiiInPrompts.run('src/prompts/template.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should detect phone numbers in test fixtures', () => {
    const content = 'const fixture = { phone: "555-867-5309" };';
    const result = noPiiInPrompts.run('src/__tests__/data.ts', content, config);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should not flag example.com emails as false positives', () => {
    const content = 'const testEmail = "user@example.com";';
    const result = noPiiInPrompts.run('src/__tests__/test.ts', content, config);
    const emailFindings = result.findings.filter(f => f.message.includes('Email'));
    expect(emailFindings.length).toBe(0);
  });

  it('should not flag localhost/loopback IPs', () => {
    const content = 'const serverUrl = "http://127.0.0.1:3000";';
    const result = noPiiInPrompts.run('src/__tests__/test.ts', content, config);
    const ipFindings = result.findings.filter(f => f.message.includes('IP'));
    expect(ipFindings.length).toBe(0);
  });

  it('should not flag private network IPs', () => {
    const content = 'const internal = "192.168.1.100";';
    const result = noPiiInPrompts.run('src/__tests__/test.ts', content, config);
    const ipFindings = result.findings.filter(f => f.message.includes('IP'));
    expect(ipFindings.length).toBe(0);
  });

  it('should include fix suggestion', () => {
    const content = 'const prompt = `Contact john.smith@realcorp.net`;';
    const result = noPiiInPrompts.run('src/__tests__/test.ts', content, config);
    if (result.findings.length > 0) {
      expect(result.findings[0].suggestion).toContain('placeholder');
    }
  });
});

// ===========================================================================
// SARIF Reporter
// ===========================================================================

describe('formatSarif', () => {
  it('should produce valid SARIF 2.1.0 JSON', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ severity: 'critical', rule: 'no-hardcoded-keys' }),
        makeFinding({ severity: 'high', rule: 'no-pii-in-prompts', line: 20 }),
      ],
    });

    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);

    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.name).toBe('aicofounder-ci');
    expect(parsed.runs[0].results).toHaveLength(2);
  });

  it('should map severity to SARIF levels correctly', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ severity: 'critical' }),
        makeFinding({ severity: 'medium', rule: 'test-rule', line: 15 }),
        makeFinding({ severity: 'low', rule: 'another-rule', line: 25 }),
      ],
    });

    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);
    const results = parsed.runs[0].results;

    expect(results[0].level).toBe('error');
    expect(results[1].level).toBe('warning');
    expect(results[2].level).toBe('note');
  });

  it('should include fixes when suggestions are available', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ suggestion: 'Use environment variables instead.' }),
      ],
    });

    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);
    expect(parsed.runs[0].results[0].fixes).toBeDefined();
    expect(parsed.runs[0].results[0].fixes[0].description.text).toContain('environment');
  });

  it('should include physical location with file, line, column', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ file: 'src/config.ts', line: 42, column: 8 }),
      ],
    });

    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);
    const location = parsed.runs[0].results[0].locations[0].physicalLocation;

    expect(location.artifactLocation.uri).toBe('src/config.ts');
    expect(location.region.startLine).toBe(42);
    expect(location.region.startColumn).toBe(8);
  });

  it('should handle empty findings gracefully', () => {
    const result = makeScanResult({ findings: [] });
    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);
    expect(parsed.runs[0].results).toHaveLength(0);
    expect(parsed.runs[0].invocations[0].executionSuccessful).toBe(true);
  });

  it('should deduplicate rules in the tool driver', () => {
    const result = makeScanResult({
      findings: [
        makeFinding({ rule: 'no-hardcoded-keys', line: 10 }),
        makeFinding({ rule: 'no-hardcoded-keys', line: 20 }),
        makeFinding({ rule: 'no-pii-in-prompts', severity: 'high', line: 30 }),
      ],
    });

    const sarif = formatSarif(result);
    const parsed = JSON.parse(sarif);
    expect(parsed.runs[0].tool.driver.rules).toHaveLength(2);
  });
});

// ===========================================================================
// PR Comment
// ===========================================================================

describe('postOrUpdateComment', () => {
  it('should return error when no token provided', async () => {
    const result = await postOrUpdateComment(
      { serverUrl: 'https://github.com', apiUrl: 'https://api.github.com' },
      1,
      'Test comment',
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('No GitHub token');
  });

  it('should return error when repository info is missing', async () => {
    const result = await postOrUpdateComment(
      { token: 'fake-token', serverUrl: 'https://github.com', apiUrl: 'https://api.github.com' },
      1,
      'Test comment',
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot determine repository');
  });
});

describe('parsePrNumber', () => {
  it('should return null for non-existent file', () => {
    const result = parsePrNumber('/tmp/nonexistent-event-file.json');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// Scan Integration
// ===========================================================================

describe('scan function', () => {
  it('should return a scan result with expected shape', () => {
    const config = makeConfig({
      scanPath: '/tmp/nonexistent-path',
      rules: ['no-hardcoded-keys'],
    });

    const result = scan(config);
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('filesScanned');
    expect(result).toHaveProperty('rulesApplied');
    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('summary');
  });

  it('should count severity levels in summary', () => {
    const config = makeConfig({
      scanPath: '/tmp/nonexistent-path',
      rules: [],
    });

    const result = scan(config);
    expect(result.summary).toHaveProperty('critical');
    expect(result.summary).toHaveProperty('high');
    expect(result.summary).toHaveProperty('medium');
    expect(result.summary).toHaveProperty('low');
    expect(result.summary).toHaveProperty('info');
  });

  it('should pass when no findings at or above fail-on threshold', () => {
    const config = makeConfig({
      scanPath: '/tmp/nonexistent-path',
      rules: [],
      failOn: 'critical',
    });

    const result = scan(config);
    expect(result.passed).toBe(true);
  });
});
