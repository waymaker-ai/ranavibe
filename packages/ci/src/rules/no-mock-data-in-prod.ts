import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/** Identifiers that strongly suggest mock/fake data, mirrored from the
 * Claude Code plugin's pre-edit-guardrails.sh so the two never disagree. */
const MOCK_DATA_PATTERN = /\b(mockUsers|fakeUsers|mockData|fakeData|MOCK_USERS|fakeCustomer)\b/g;

const TEST_PATH_SEGMENTS = ['__tests__', '/test/', '/tests/', '/fixtures/', '/mocks/'];
const TEST_SUFFIXES = ['.test.', '.spec.'];

function isTestPath(filePath: string): boolean {
  const normalized = `/${filePath}`;
  if (TEST_PATH_SEGMENTS.some((seg) => normalized.includes(seg))) return true;
  return TEST_SUFFIXES.some((suf) => filePath.includes(suf));
}

export const noMockDataInProd: RuleDefinition = {
  id: 'no-mock-data-in-prod',
  name: 'No Mock Data in Production Paths',
  description: 'Warn when a mock/fake-data identifier appears outside a test/fixture path.',
  severity: 'medium',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py'],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    if (isTestPath(filePath)) {
      return { findings: [] };
    }

    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      MOCK_DATA_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MOCK_DATA_PATTERN.exec(line)) !== null) {
        findings.push({
          file: filePath,
          line: lineIdx + 1,
          column: match.index + 1,
          rule: 'no-mock-data-in-prod',
          severity: 'medium',
          message: `Mock-data identifier "${match[0]}" found outside a test/fixture path.`,
          suggestion: 'Verify this is not shipping mock data to production.',
          source: line.trim(),
        });
      }
    }

    return { findings };
  },
};

export default noMockDataInProd;
