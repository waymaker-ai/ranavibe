import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/**
 * Patterns for detecting hardcoded API keys and secrets.
 * Each entry has a regex pattern, a human-readable label, and severity.
 */
const KEY_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  severity: 'critical' | 'high' | 'medium';
}> = [
  // Anthropic keys
  { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g, label: 'Anthropic API key (sk-ant-*)', severity: 'critical' },
  { pattern: /sk-proj-[a-zA-Z0-9_-]{20,}/g, label: 'OpenAI project key (sk-proj-*)', severity: 'critical' },
  // Generic OpenAI key (sk- followed by 20+ chars, but not sk-ant or sk-proj)
  { pattern: /(?<![\w-])sk-(?!ant-)(?!proj-)[a-zA-Z0-9]{20,}/g, label: 'OpenAI API key (sk-*)', severity: 'critical' },
  // AWS access keys
  { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS access key (AKIA*)', severity: 'critical' },
  // Groq keys
  { pattern: /gsk_[a-zA-Z0-9]{20,}/g, label: 'Groq API key (gsk_*)', severity: 'critical' },
  // xAI keys
  { pattern: /xai-[a-zA-Z0-9]{20,}/g, label: 'xAI API key (xai-*)', severity: 'critical' },
  // Generic patterns in assignments
  { pattern: /api[_-]?key\s*[=:]\s*["'][^"']{8,}["']/gi, label: 'Hardcoded api_key assignment', severity: 'high' },
  { pattern: /secret\s*[=:]\s*["'][^"']{8,}["']/gi, label: 'Hardcoded secret assignment', severity: 'high' },
  { pattern: /password\s*[=:]\s*["'][^"']{4,}["']/gi, label: 'Hardcoded password assignment', severity: 'high' },
  { pattern: /token\s*[=:]\s*["'][^"']{8,}["']/gi, label: 'Hardcoded token assignment', severity: 'high' },
  // Bearer tokens in code
  { pattern: /["']Bearer\s+[a-zA-Z0-9_.-]{20,}["']/g, label: 'Hardcoded Bearer token', severity: 'critical' },
  // Private keys
  { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, label: 'Private key in source', severity: 'critical' },
];

/** Files to exclude from this rule */
const EXCLUDED_FILES = [
  '.env.example',
  '.env.template',
  '.env.sample',
];

function isExcluded(filePath: string): boolean {
  const basename = filePath.split('/').pop() || '';
  return EXCLUDED_FILES.some(exc => basename === exc);
}

export const noHardcodedKeys: RuleDefinition = {
  id: 'no-hardcoded-keys',
  name: 'No Hardcoded Keys',
  description: 'Detect hardcoded API keys, secrets, and credentials in source code.',
  severity: 'critical',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.yml', '.yaml', '.json', '.env', '.cfg', '.conf', '.toml'],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    if (isExcluded(filePath)) {
      return { findings: [] };
    }

    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // Skip comment-only lines that look like documentation
      const trimmed = line.trim();
      if (trimmed.startsWith('//') && trimmed.includes('example')) continue;
      if (trimmed.startsWith('#') && trimmed.includes('example')) continue;

      for (const { pattern, label, severity } of KEY_PATTERNS) {
        // Reset regex lastIndex since we reuse them
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          const matchedText = match[0];
          // Mask the key for display
          const masked = matchedText.length > 12
            ? matchedText.slice(0, 6) + '***' + matchedText.slice(-4)
            : '***';

          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: match.index + 1,
            rule: 'no-hardcoded-keys',
            severity,
            message: `${label} detected: ${masked}`,
            suggestion: 'Use environment variables or a secret manager instead of hardcoding credentials.',
            source: line.trim(),
          });
        }
      }
    }

    return { findings };
  },
};

export default noHardcodedKeys;
