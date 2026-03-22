/**
 * Lightweight inline detectors for PII, API keys, and prompt injection patterns.
 * These mirror the detection logic in @waymakerai/aicofounder-guard but are self-contained
 * for use in the VS Code extension without requiring external dependencies.
 */

export interface Detection {
  type: 'pii' | 'api-key' | 'injection' | 'model-usage';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  startCol: number;
  endCol: number;
  category?: string;
}

// ---------------------------------------------------------------------------
// PII patterns
// ---------------------------------------------------------------------------

interface PiiPattern {
  name: string;
  regex: RegExp;
  severity: 'error' | 'warning';
}

const PII_PATTERNS: PiiPattern[] = [
  {
    name: 'SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'error',
  },
  {
    name: 'Email address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'warning',
  },
  {
    name: 'Phone number',
    regex: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'warning',
  },
  {
    name: 'Credit card number',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    severity: 'error',
  },
  {
    name: 'IP address',
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    severity: 'info' as 'warning', // cast because we only keep warning/error
  },
  {
    name: 'Date of birth pattern',
    regex: /\b(?:DOB|date.?of.?birth|birthday)\s*[:=]\s*\S+/gi,
    severity: 'warning',
  },
];

// ---------------------------------------------------------------------------
// API key / secret patterns
// ---------------------------------------------------------------------------

interface KeyPattern {
  name: string;
  regex: RegExp;
}

const KEY_PATTERNS: KeyPattern[] = [
  { name: 'OpenAI API key', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: 'Anthropic API key', regex: /\bsk-ant-[A-Za-z0-9-]{20,}\b/g },
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'AWS secret key', regex: /\b[A-Za-z0-9/+=]{40}\b/g },
  { name: 'GitHub token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g },
  { name: 'Generic API key assignment', regex: /(?:api[_-]?key|apikey|secret|token|password|credential)\s*[:=]\s*["'][^"']{8,}["']/gi },
  { name: 'Bearer token', regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g },
  { name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
];

// ---------------------------------------------------------------------------
// Prompt injection patterns
// ---------------------------------------------------------------------------

interface InjectionPattern {
  name: string;
  regex: RegExp;
  sensitivity: 'low' | 'medium' | 'high';
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  {
    name: 'System prompt override',
    regex: /(?:ignore|forget|disregard)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/gi,
    sensitivity: 'low',
  },
  {
    name: 'Role hijacking',
    regex: /(?:you\s+are\s+now|act\s+as|pretend\s+(?:to\s+be|you\s+are)|new\s+instructions?\s*:)/gi,
    sensitivity: 'low',
  },
  {
    name: 'Prompt leak attempt',
    regex: /(?:show|reveal|display|print|output|repeat)\s+(?:your|the|system)\s+(?:system\s+)?(?:prompt|instructions|rules)/gi,
    sensitivity: 'medium',
  },
  {
    name: 'Delimiter injection',
    regex: /(?:```|<\/?system>|<\/?user>|<\/?assistant>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>)/gi,
    sensitivity: 'medium',
  },
  {
    name: 'Encoding-based bypass',
    regex: /(?:base64|rot13|hex|unicode)\s*(?:decode|encode|translate)/gi,
    sensitivity: 'high',
  },
  {
    name: 'Unsafe template interpolation',
    regex: /(?:\$\{.*user.*\}|f["'].*\{.*input.*\}|%s.*user|\.format\(.*user)/gi,
    sensitivity: 'high',
  },
];

// ---------------------------------------------------------------------------
// Model usage patterns
// ---------------------------------------------------------------------------

interface ModelPattern {
  name: string;
  regex: RegExp;
}

const MODEL_PATTERNS: ModelPattern[] = [
  { name: 'OpenAI model', regex: /\b(?:gpt-4o?|gpt-3\.5-turbo|o1-preview|o1-mini|davinci|curie|babbage|ada)(?:-\w+)?\b/g },
  { name: 'Anthropic model', regex: /\b(?:claude-(?:3|2|instant)|claude-opus|claude-sonnet|claude-haiku)(?:-\w+)?\b/g },
  { name: 'Google model', regex: /\b(?:gemini-(?:pro|ultra|nano)|palm2?)(?:-\w+)?\b/g },
  { name: 'Meta model', regex: /\b(?:llama-?[23]|codellama|mistral|mixtral)(?:-\w+)?\b/gi },
];

// ---------------------------------------------------------------------------
// Detection functions
// ---------------------------------------------------------------------------

/**
 * Scan a single line for PII patterns.
 */
export function detectPii(line: string, lineNumber: number): Detection[] {
  const results: Detection[] = [];

  for (const pattern of PII_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(line)) !== null) {
      // Skip matches inside comments that look like example documentation
      results.push({
        type: 'pii',
        severity: pattern.severity,
        message: `Possible ${pattern.name} detected`,
        line: lineNumber,
        startCol: match.index,
        endCol: match.index + match[0].length,
        category: pattern.name,
      });
    }
  }

  return results;
}

/**
 * Scan a single line for hardcoded API keys and secrets.
 */
export function detectApiKeys(line: string, lineNumber: number): Detection[] {
  const results: Detection[] = [];

  for (const pattern of KEY_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(line)) !== null) {
      results.push({
        type: 'api-key',
        severity: 'error',
        message: `Possible ${pattern.name} detected - do not commit secrets`,
        line: lineNumber,
        startCol: match.index,
        endCol: match.index + match[0].length,
        category: pattern.name,
      });
    }
  }

  return results;
}

/**
 * Scan a single line for prompt injection patterns.
 */
export function detectInjection(
  line: string,
  lineNumber: number,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
): Detection[] {
  const results: Detection[] = [];
  const sensitivityLevel = { low: 0, medium: 1, high: 2 };
  const currentLevel = sensitivityLevel[sensitivity];

  for (const pattern of INJECTION_PATTERNS) {
    const patternLevel = sensitivityLevel[pattern.sensitivity];
    // Include patterns at or below the chosen sensitivity threshold
    if (patternLevel > currentLevel) {
      continue;
    }

    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(line)) !== null) {
      results.push({
        type: 'injection',
        severity: 'warning',
        message: `Prompt injection risk: ${pattern.name}`,
        line: lineNumber,
        startCol: match.index,
        endCol: match.index + match[0].length,
        category: pattern.name,
      });
    }
  }

  return results;
}

/**
 * Scan a single line for model usage references.
 */
export function detectModels(line: string, lineNumber: number): Detection[] {
  const results: Detection[] = [];

  for (const pattern of MODEL_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(line)) !== null) {
      results.push({
        type: 'model-usage',
        severity: 'info',
        message: `${pattern.name} reference: ${match[0]}`,
        line: lineNumber,
        startCol: match.index,
        endCol: match.index + match[0].length,
        category: match[0],
      });
    }
  }

  return results;
}

/**
 * Run all detectors on a full document text.
 * Returns all detections sorted by line number.
 */
export function scanDocument(
  text: string,
  options: {
    sensitivity?: 'low' | 'medium' | 'high';
    skipPii?: boolean;
    skipKeys?: boolean;
    skipInjection?: boolean;
    skipModels?: boolean;
  } = {}
): Detection[] {
  const lines = text.split('\n');
  const allDetections: Detection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i; // zero-based for VS Code

    if (!options.skipPii) {
      allDetections.push(...detectPii(line, lineNumber));
    }
    if (!options.skipKeys) {
      allDetections.push(...detectApiKeys(line, lineNumber));
    }
    if (!options.skipInjection) {
      allDetections.push(...detectInjection(line, lineNumber, options.sensitivity));
    }
    if (!options.skipModels) {
      allDetections.push(...detectModels(line, lineNumber));
    }
  }

  return allDetections.sort((a, b) => a.line - b.line || a.startCol - b.startCol);
}

// ---------------------------------------------------------------------------
// Cost estimation helpers
// ---------------------------------------------------------------------------

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1-preview': { input: 15.0, output: 60.0 },
  'o1-mini': { input: 3.0, output: 12.0 },
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'claude-3-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-ultra': { input: 5.0, output: 15.0 },
};

/**
 * Estimate approximate token count from text (rough: ~4 chars per token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get cost per million tokens for a model.
 */
export function getModelCost(modelName: string): { input: number; output: number } | undefined {
  const normalised = modelName.toLowerCase();
  for (const [key, cost] of Object.entries(MODEL_COSTS)) {
    if (normalised.includes(key)) {
      return cost;
    }
  }
  return undefined;
}

/**
 * Estimate the cost for a given number of tokens with a given model.
 * Returns cost in USD.
 */
export function estimateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number = 0
): number | undefined {
  const cost = getModelCost(modelName);
  if (!cost) {
    return undefined;
  }
  return (inputTokens / 1_000_000) * cost.input + (outputTokens / 1_000_000) * cost.output;
}
