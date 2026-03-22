import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/**
 * Patterns that indicate prompt injection vulnerabilities.
 */
const INJECTION_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  severity: 'critical' | 'high' | 'medium';
  suggestion: string;
}> = [
  // String concatenation in prompts (JS/TS)
  {
    pattern: /(?:prompt|message|instruction|system)\s*(?:=|\+=)\s*.*\+\s*(?:user|input|req|request|query|body|params)/gi,
    label: 'String concatenation with user input in prompt',
    severity: 'critical',
    suggestion: 'Use parameterized prompt templates with input validation instead of string concatenation.',
  },
  // Template literal with user input in prompt context
  {
    pattern: /(?:prompt|message|instruction|system)\s*=\s*`[^`]*\$\{(?:user|input|req|request|query|body|params)\b[^}]*\}/gi,
    label: 'Template literal with unvalidated user input in prompt',
    severity: 'critical',
    suggestion: 'Sanitize and validate user input before interpolating into prompt templates.',
  },
  // Python f-string with user input in prompt
  {
    pattern: /(?:prompt|message|instruction|system)\s*=\s*f["'][^"']*\{(?:user|input|request|query)\b[^}]*\}/gi,
    label: 'Python f-string with user input in prompt',
    severity: 'critical',
    suggestion: 'Use parameterized templates or sanitize user input before including in prompts.',
  },
  // Python .format() with user input
  {
    pattern: /(?:prompt|message|instruction)\s*=\s*["'][^"']*\{[^}]*\}[^"']*["']\.format\s*\(/gi,
    label: 'Python .format() in prompt construction',
    severity: 'high',
    suggestion: 'Ensure all format arguments are validated and sanitized.',
  },
  // Direct user input passed to LLM without sanitization
  {
    pattern: /(?:messages|content)\s*[:=]\s*\[?\s*\{[^}]*(?:user_input|user_message|req\.body|request\.body)/gi,
    label: 'User input passed directly to LLM message content',
    severity: 'high',
    suggestion: 'Validate and sanitize user input before passing to the LLM API.',
  },
  // eval() with user input near prompt handling
  {
    pattern: /eval\s*\(\s*(?:user|input|req|request|query|body|params)/gi,
    label: 'eval() with user input',
    severity: 'critical',
    suggestion: 'Never use eval() with user input. Use structured parsing instead.',
  },
  // SQL-like injection in prompts (role: "system" override attempts)
  {
    pattern: /(?:role|system)\s*[:=]\s*(?:user|input|req|request|query|body|params)/gi,
    label: 'Dynamic role assignment from user input',
    severity: 'critical',
    suggestion: 'Hardcode role assignments. Never let user input control the message role.',
  },
  // Unescaped JSON.parse of user input into prompts
  {
    pattern: /JSON\.parse\s*\(\s*(?:user|input|req|request|query|body|params)[^)]*\).*(?:prompt|message|content)/gi,
    label: 'Unsanitized JSON.parse of user input used in prompt',
    severity: 'high',
    suggestion: 'Validate parsed JSON structure against a schema before using in prompts.',
  },
];

export const noInjectionVuln: RuleDefinition = {
  id: 'no-injection-vuln',
  name: 'No Injection Vulnerabilities',
  description: 'Detect prompt injection vulnerabilities: string concatenation, f-strings with user input, unsanitized template literals.',
  severity: 'critical',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py'],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Skip pure comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
        continue;
      }

      for (const { pattern, label, severity, suggestion } of INJECTION_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: match.index + 1,
            rule: 'no-injection-vuln',
            severity,
            message: label,
            suggestion,
            source: trimmed,
          });
        }
      }
    }

    return { findings };
  },
};

export default noInjectionVuln;
