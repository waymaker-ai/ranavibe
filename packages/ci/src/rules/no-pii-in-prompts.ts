import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/**
 * PII patterns to detect in prompt templates and test fixtures.
 */
const PII_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  severity: 'high' | 'medium';
}> = [
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    label: 'Email address',
    severity: 'high',
  },
  // US Social Security Numbers
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: 'Social Security Number (SSN)',
    severity: 'high',
  },
  // US Phone numbers
  {
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    label: 'Phone number',
    severity: 'medium',
  },
  // Credit card numbers (basic Luhn-eligible 16-digit patterns)
  {
    pattern: /\b(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    label: 'Credit card number',
    severity: 'high',
  },
  // IP addresses (not in import statements or URLs like localhost)
  {
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    label: 'IP address',
    severity: 'medium',
  },
];

/** Patterns that indicate we're inside a prompt template or test fixture */
const PROMPT_CONTEXT_PATTERNS = [
  // Template literals (JS/TS)
  /`[^`]*$/,
  /^[^`]*`/,
  // Python f-strings / triple-quoted strings
  /f["']{1,3}/,
  /["']{3}/,
  // Common prompt variable names
  /prompt/i,
  /system_message/i,
  /user_message/i,
  /instruction/i,
  // Test fixture patterns
  /test/i,
  /fixture/i,
  /mock/i,
  /example/i,
  /sample/i,
];

function isPromptOrTestContext(line: string, filePath: string): boolean {
  // Test files are always in scope
  if (/\.(test|spec|fixture)\./i.test(filePath)) return true;
  if (/__(tests?|fixtures?|mocks?)__/i.test(filePath)) return true;

  return PROMPT_CONTEXT_PATTERNS.some(p => p.test(line));
}

/** Exclude common false positives */
function isFalsePositive(match: string, label: string, line: string): boolean {
  // Exclude emails in package.json, import statements, URLs
  if (label === 'Email address') {
    if (line.includes('noreply@') || line.includes('@types/') || line.includes('example.com')) {
      return true;
    }
  }
  // Exclude common localhost/loopback IPs
  if (label === 'IP address') {
    if (match === '127.0.0.1' || match === '0.0.0.0' || match.startsWith('192.168.') || match.startsWith('10.')) {
      return true;
    }
  }
  return false;
}

export const noPiiInPrompts: RuleDefinition = {
  id: 'no-pii-in-prompts',
  name: 'No PII in Prompts',
  description: 'Detect personally identifiable information (PII) in prompt templates and test fixtures.',
  severity: 'high',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.yml', '.yaml', '.json'],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Track whether we're inside a multi-line template literal
    let inTemplateLiteral = false;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // Track template literal state (backtick counting)
      const backtickCount = (line.match(/(?<!\\)`/g) || []).length;
      if (backtickCount % 2 !== 0) {
        inTemplateLiteral = !inTemplateLiteral;
      }

      // Only scan lines in prompt/test context
      if (!inTemplateLiteral && !isPromptOrTestContext(line, filePath)) {
        continue;
      }

      for (const { pattern, label, severity } of PII_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          if (isFalsePositive(match[0], label, line)) continue;

          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: match.index + 1,
            rule: 'no-pii-in-prompts',
            severity,
            message: `${label} found in prompt/test context.`,
            suggestion: 'Use placeholder values (e.g., "user@example.com", "555-0100") instead of real PII.',
            source: line.trim(),
          });
        }
      }
    }

    return { findings };
  },
};

export default noPiiInPrompts;
