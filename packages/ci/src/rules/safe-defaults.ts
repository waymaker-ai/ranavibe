import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/** Patterns for temperature settings */
const TEMPERATURE_PATTERN = /(?:temperature)\s*[:=]\s*([0-9.]+)/gi;

/** Patterns for max_tokens settings */
const MAX_TOKENS_PATTERN = /(?:max_tokens|maxTokens|max_output_tokens)\s*[:=]\s*(\d+)/gi;

/** Patterns for LLM API calls */
const LLM_CALL_PATTERNS = [
  /\.create\s*\(\s*\{/g,
  /\.chat\.completions/g,
  /\.messages\.create/g,
  /openai\./g,
  /anthropic\./g,
  /\.generate\s*\(/g,
  /\.invoke\s*\(/g,
];

/** Patterns for system prompts */
const SYSTEM_PROMPT_PATTERNS = [
  /system\s*[:=]/gi,
  /role\s*[:=]\s*["']system["']/gi,
  /SystemMessage/g,
  /system_prompt/gi,
  /systemPrompt/g,
];

export const safeDefaults: RuleDefinition = {
  id: 'safe-defaults',
  name: 'Safe Defaults',
  description: 'Check for unsafe LLM configurations: high temperature, missing max_tokens, missing system prompts.',
  severity: 'medium',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py'],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Track findings across the file
    let hasLlmCall = false;
    let hasMaxTokens = false;
    let hasSystemPrompt = false;
    const llmCallLines: number[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

      // Check for LLM calls
      for (const pattern of LLM_CALL_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          hasLlmCall = true;
          llmCallLines.push(lineIdx);
        }
      }

      // Check for max_tokens
      MAX_TOKENS_PATTERN.lastIndex = 0;
      if (MAX_TOKENS_PATTERN.test(line)) {
        hasMaxTokens = true;
      }

      // Check for system prompts
      for (const pattern of SYSTEM_PROMPT_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          hasSystemPrompt = true;
        }
      }

      // Check temperature > 2
      TEMPERATURE_PATTERN.lastIndex = 0;
      let tempMatch: RegExpExecArray | null;
      while ((tempMatch = TEMPERATURE_PATTERN.exec(line)) !== null) {
        const temp = parseFloat(tempMatch[1]);
        if (temp > 2) {
          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: tempMatch.index + 1,
            rule: 'safe-defaults',
            severity: 'high',
            message: `Temperature ${temp} exceeds safe maximum (2.0). This can produce incoherent or harmful output.`,
            suggestion: 'Set temperature to 2.0 or below. Most use cases work best with 0.0-1.0.',
            source: trimmed,
          });
        } else if (temp > 1.5) {
          findings.push({
            file: filePath,
            line: lineIdx + 1,
            column: tempMatch.index + 1,
            rule: 'safe-defaults',
            severity: 'low',
            message: `Temperature ${temp} is high. Consider if this is intentional.`,
            suggestion: 'Most use cases work best with temperature 0.0-1.0.',
            source: trimmed,
          });
        }
      }
    }

    // File-level checks (only if the file contains LLM calls)
    if (hasLlmCall && !hasMaxTokens) {
      const firstCallLine = llmCallLines[0] ?? 0;
      findings.push({
        file: filePath,
        line: firstCallLine + 1,
        column: 1,
        rule: 'safe-defaults',
        severity: 'medium',
        message: 'LLM API call without max_tokens limit. This can lead to unexpectedly long and expensive responses.',
        suggestion: 'Set max_tokens to a reasonable limit for your use case (e.g., 1024, 4096).',
        source: lines[firstCallLine]?.trim() || '',
      });
    }

    if (hasLlmCall && !hasSystemPrompt) {
      const firstCallLine = llmCallLines[0] ?? 0;
      findings.push({
        file: filePath,
        line: firstCallLine + 1,
        column: 1,
        rule: 'safe-defaults',
        severity: 'medium',
        message: 'LLM API call without a system prompt. System prompts help constrain model behavior.',
        suggestion: 'Add a system prompt that defines the assistant\'s role, boundaries, and expected behavior.',
        source: lines[firstCallLine]?.trim() || '',
      });
    }

    return { findings };
  },
};

export default safeDefaults;
