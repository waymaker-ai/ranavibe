/**
 * Output Validation
 * Validate and sanitize agent outputs before returning to users
 */

import { PIIDetector, PIIMatch, PIIDetectorConfig } from './pii-detector';

export interface OutputValidationResult {
  valid: boolean;
  sanitized: string;
  violations: OutputViolation[];
  piiDetected: PIIMatch[];
  warnings: string[];
}

export interface OutputViolation {
  type: ViolationType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: { start: number; end: number };
}

export type ViolationType =
  | 'pii_leak'
  | 'code_execution'
  | 'harmful_content'
  | 'prompt_leak'
  | 'data_leak'
  | 'format_violation'
  | 'length_exceeded'
  | 'blocked_content';

export interface OutputValidatorConfig {
  /** Maximum output length */
  maxLength?: number;
  /** Check for PII in output */
  checkPII?: boolean;
  /** PII detection config */
  piiConfig?: PIIDetectorConfig;
  /** Redact PII instead of blocking */
  redactPII?: boolean;
  /** Check for code that could be executed */
  checkCodeExecution?: boolean;
  /** Check for prompt/system message leaks */
  checkPromptLeak?: boolean;
  /** Blocked phrases/patterns */
  blockedPatterns?: RegExp[];
  /** Required format (e.g., JSON, markdown) */
  requiredFormat?: 'json' | 'markdown' | 'plain' | 'code';
  /** Custom validators */
  customValidators?: Array<(output: string) => OutputViolation | null>;
}

/**
 * Patterns that might indicate code execution risks
 */
const CODE_EXECUTION_PATTERNS = [
  // Shell commands
  /\b(rm\s+-rf|sudo|chmod\s+[0-7]{3,4}|chown|mkfs|dd\s+if=|>\s*\/dev\/)/gi,
  // Dangerous eval patterns
  /\beval\s*\(/gi,
  /\bexec\s*\(/gi,
  /\bFunction\s*\(/gi,
  /new\s+Function\s*\(/gi,
  // SQL injection patterns in output
  /;\s*(DROP|DELETE|TRUNCATE|UPDATE|INSERT)\s+(TABLE|FROM|INTO)/gi,
  // System commands
  /\b(system|shell_exec|passthru|popen)\s*\(/gi,
];

/**
 * Patterns that might indicate prompt/system message leaks
 */
const PROMPT_LEAK_PATTERNS = [
  /you\s+are\s+(a|an)\s+(helpful|ai|assistant|language\s+model)/gi,
  /your\s+(system\s+)?prompt\s+(is|says|reads|contains)/gi,
  /my\s+(initial|original|system)\s+(instructions?|prompt)/gi,
  /i\s+(was|am)\s+(programmed|instructed|told)\s+to/gi,
  /\[system\s*message\]/gi,
  /\[initial\s*prompt\]/gi,
  /openai|anthropic|claude|gpt-[34]/gi, // Model name leaks (might be intentional, low severity)
];

/**
 * Output Validator class
 */
export class OutputValidator {
  private config: Required<OutputValidatorConfig>;
  private piiDetector?: PIIDetector;

  constructor(config: OutputValidatorConfig = {}) {
    this.config = {
      maxLength: config.maxLength ?? 100000,
      checkPII: config.checkPII ?? true,
      piiConfig: config.piiConfig ?? {},
      redactPII: config.redactPII ?? true,
      checkCodeExecution: config.checkCodeExecution ?? true,
      checkPromptLeak: config.checkPromptLeak ?? true,
      blockedPatterns: config.blockedPatterns ?? [],
      requiredFormat: config.requiredFormat ?? 'plain',
      customValidators: config.customValidators ?? [],
    };

    if (this.config.checkPII) {
      this.piiDetector = new PIIDetector(this.config.piiConfig);
    }
  }

  /**
   * Validate output
   */
  validate(output: string): OutputValidationResult {
    const violations: OutputViolation[] = [];
    const warnings: string[] = [];
    let sanitized = output;
    let piiDetected: PIIMatch[] = [];

    // Length check
    if (output.length > this.config.maxLength) {
      violations.push({
        type: 'length_exceeded',
        description: `Output exceeds maximum length (${output.length} > ${this.config.maxLength})`,
        severity: 'medium',
      });
      sanitized = sanitized.slice(0, this.config.maxLength);
    }

    // PII check
    if (this.piiDetector) {
      const piiResult = this.piiDetector.redact(sanitized);
      piiDetected = piiResult.matches;

      if (piiDetected.length > 0) {
        if (this.config.redactPII) {
          sanitized = piiResult.redacted;
          warnings.push(`PII detected and redacted: ${piiDetected.length} instance(s)`);
        } else {
          violations.push({
            type: 'pii_leak',
            description: `PII detected in output: ${piiDetected.map((p) => p.type).join(', ')}`,
            severity: 'high',
          });
        }
      }
    }

    // Code execution check
    if (this.config.checkCodeExecution) {
      for (const pattern of CODE_EXECUTION_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(output);
        if (match) {
          violations.push({
            type: 'code_execution',
            description: `Potentially dangerous code pattern: ${match[0]}`,
            severity: 'high',
            location: { start: match.index, end: match.index + match[0].length },
          });
        }
      }
    }

    // Prompt leak check
    if (this.config.checkPromptLeak) {
      for (const pattern of PROMPT_LEAK_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(output);
        if (match) {
          // Model names are low severity (might be legitimate)
          const severity = /openai|anthropic|claude|gpt/i.test(match[0]) ? 'low' : 'medium';
          violations.push({
            type: 'prompt_leak',
            description: `Potential prompt/system leak: ${match[0]}`,
            severity,
            location: { start: match.index, end: match.index + match[0].length },
          });
        }
      }
    }

    // Blocked patterns check
    for (const pattern of this.config.blockedPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(output);
      if (match) {
        violations.push({
          type: 'blocked_content',
          description: `Blocked pattern matched: ${match[0]}`,
          severity: 'high',
          location: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    // Format validation
    const formatViolation = this.validateFormat(output);
    if (formatViolation) {
      violations.push(formatViolation);
    }

    // Custom validators
    for (const validator of this.config.customValidators) {
      const violation = validator(output);
      if (violation) {
        violations.push(violation);
      }
    }

    // Determine overall validity
    const hasCritical = violations.some((v) => v.severity === 'critical');
    const hasHigh = violations.some((v) => v.severity === 'high');

    return {
      valid: !hasCritical && !hasHigh,
      sanitized,
      violations,
      piiDetected,
      warnings,
    };
  }

  /**
   * Validate output format
   */
  private validateFormat(output: string): OutputViolation | null {
    if (this.config.requiredFormat === 'plain') return null;

    switch (this.config.requiredFormat) {
      case 'json':
        try {
          JSON.parse(output);
        } catch {
          return {
            type: 'format_violation',
            description: 'Output is not valid JSON',
            severity: 'medium',
          };
        }
        break;

      case 'markdown':
        // Basic markdown validation (check for unbalanced code blocks)
        const codeBlockCount = (output.match(/```/g) || []).length;
        if (codeBlockCount % 2 !== 0) {
          return {
            type: 'format_violation',
            description: 'Unbalanced code blocks in markdown',
            severity: 'low',
          };
        }
        break;

      case 'code':
        // Check for common syntax errors (basic)
        const openBraces = (output.match(/\{/g) || []).length;
        const closeBraces = (output.match(/\}/g) || []).length;
        const openParens = (output.match(/\(/g) || []).length;
        const closeParens = (output.match(/\)/g) || []).length;

        if (openBraces !== closeBraces || openParens !== closeParens) {
          return {
            type: 'format_violation',
            description: 'Unbalanced brackets in code output',
            severity: 'low',
          };
        }
        break;
    }

    return null;
  }

  /**
   * Quick check if output is safe
   */
  isSafe(output: string): boolean {
    return this.validate(output).valid;
  }

  /**
   * Sanitize output (remove/redact problematic content)
   */
  sanitize(output: string): string {
    return this.validate(output).sanitized;
  }
}

/**
 * Create an output validator
 */
export function createOutputValidator(config?: OutputValidatorConfig): OutputValidator {
  return new OutputValidator(config);
}

/**
 * Quick output validation
 */
export function validateOutput(
  output: string,
  config?: OutputValidatorConfig
): OutputValidationResult {
  return new OutputValidator(config).validate(output);
}

/**
 * Quick output sanitization
 */
export function sanitizeOutput(output: string, config?: OutputValidatorConfig): string {
  return new OutputValidator(config).sanitize(output);
}
