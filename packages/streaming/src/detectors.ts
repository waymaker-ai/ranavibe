/**
 * @waymakerai/aicofounder-streaming - Streaming-Optimized Detectors
 *
 * Lightweight detectors designed for incremental checking of streaming content.
 * These are optimized for the token-by-token use case rather than full-text analysis.
 */

import type {
  ViolationType,
  ViolationSeverity,
  StreamChunk,
  StreamViolation,
  PiiCategory,
} from './types';

// ---------------------------------------------------------------------------
// PII Patterns
// ---------------------------------------------------------------------------

interface PiiPattern {
  category: PiiCategory;
  pattern: RegExp;
  /** Minimum match length to avoid false positives on partial tokens. */
  minLength: number;
}

const PII_PATTERNS: PiiPattern[] = [
  {
    category: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    minLength: 6,
  },
  {
    category: 'phone',
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    minLength: 10,
  },
  {
    category: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    minLength: 11,
  },
  {
    category: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    minLength: 13,
  },
  {
    category: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    minLength: 7,
  },
  {
    category: 'date_of_birth',
    pattern: /\b(?:0[1-9]|1[0-2])[/\-.](?:0[1-9]|[12]\d|3[01])[/\-.](?:19|20)\d{2}\b/g,
    minLength: 8,
  },
];

export interface DetectionResult {
  found: boolean;
  violations: StreamViolation[];
  /** Text with PII redacted, if applicable. */
  redactedText?: string;
}

// ---------------------------------------------------------------------------
// PII Detector
// ---------------------------------------------------------------------------

export class PiiDetector {
  private readonly categories: Set<PiiCategory>;
  private readonly replacement: string;

  constructor(
    categories: PiiCategory[] = ['email', 'phone', 'ssn', 'credit_card', 'ip_address', 'date_of_birth'],
    replacement: string = '[REDACTED]',
  ) {
    this.categories = new Set(categories);
    this.replacement = replacement;
  }

  /**
   * Scan buffer text for PII. Returns all matches with their positions.
   * Only emits when the match is complete (i.e., not a partial token at the buffer edge).
   */
  detect(bufferText: string, chunk: StreamChunk): DetectionResult {
    const violations: StreamViolation[] = [];
    let redacted = bufferText;

    for (const { category, pattern, minLength } of PII_PATTERNS) {
      if (!this.categories.has(category)) continue;

      const regex = new RegExp(pattern.source, 'g');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(bufferText)) !== null) {
        if (match[0].length < minLength) continue;

        // Skip matches at the very end of the buffer — they might be partial.
        const matchEnd = match.index + match[0].length;
        if (matchEnd === bufferText.length && !isLikelyComplete(category, match[0])) {
          continue;
        }

        violations.push({
          type: 'pii',
          severity: piiSeverity(category),
          chunk,
          position: match.index,
          action: 'redact',
          detail: `Detected ${category}: ${match[0]}`,
          matched: match[0],
        });
      }
    }

    // Apply redactions in reverse order to preserve positions.
    const sorted = [...violations].sort((a, b) => b.position - a.position);
    for (const v of sorted) {
      redacted =
        redacted.slice(0, v.position) +
        this.replacement +
        redacted.slice(v.position + v.matched.length);
    }

    return {
      found: violations.length > 0,
      violations,
      redactedText: redacted,
    };
  }
}

function isLikelyComplete(category: PiiCategory, text: string): boolean {
  switch (category) {
    case 'email':
      return /\.[a-zA-Z]{2,}$/.test(text);
    case 'phone':
      return /\d{4}$/.test(text);
    case 'ssn':
      return /\d{4}$/.test(text);
    case 'credit_card':
      return /\d{4}$/.test(text);
    case 'ip_address':
      return /\d{1,3}$/.test(text);
    case 'date_of_birth':
      return /\d{4}$/.test(text);
    default:
      return true;
  }
}

function piiSeverity(category: PiiCategory): ViolationSeverity {
  switch (category) {
    case 'ssn':
    case 'credit_card':
      return 'critical';
    case 'email':
    case 'phone':
    case 'date_of_birth':
      return 'high';
    case 'ip_address':
    case 'name':
    case 'address':
      return 'medium';
    default:
      return 'medium';
  }
}

// ---------------------------------------------------------------------------
// Injection Detector
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: { pattern: RegExp; severity: ViolationSeverity; detail: string }[] = [
  {
    pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
    severity: 'critical',
    detail: 'Prompt injection: instruction override attempt',
  },
  {
    pattern: /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|guidelines|rules)/i,
    severity: 'critical',
    detail: 'Prompt injection: instruction disregard attempt',
  },
  {
    pattern: /you\s+are\s+now\s+(?:a|an|in)\s+/i,
    severity: 'high',
    detail: 'Prompt injection: persona hijack attempt',
  },
  {
    pattern: /\bsystem\s*:\s*you\s+are\b/i,
    severity: 'critical',
    detail: 'Prompt injection: system prompt injection',
  },
  {
    pattern: /\[system\]|\[INST\]|<\|im_start\|>system/i,
    severity: 'critical',
    detail: 'Prompt injection: control token injection',
  },
  {
    pattern: /do\s+not\s+follow\s+(?:any|your)\s+(?:previous|original)\s+(?:instructions|rules)/i,
    severity: 'critical',
    detail: 'Prompt injection: rule override attempt',
  },
  {
    pattern: /pretend\s+(?:you\s+are|to\s+be|that\s+you)/i,
    severity: 'medium',
    detail: 'Prompt injection: role-play manipulation attempt',
  },
  {
    pattern: /\bDAN\b.*\bjailbreak\b|\bjailbreak\b.*\bDAN\b/i,
    severity: 'critical',
    detail: 'Prompt injection: known jailbreak pattern (DAN)',
  },
];

export class InjectionDetector {
  private checkCounter: number = 0;
  private readonly checkInterval: number;

  constructor(checkInterval: number = 5) {
    this.checkInterval = checkInterval;
  }

  /**
   * Check accumulated text for injection patterns.
   * Only performs the check every `checkInterval` calls to reduce overhead.
   * Returns early if it is not time to check yet.
   */
  detect(accumulatedText: string, chunk: StreamChunk, forceCheck: boolean = false): DetectionResult {
    this.checkCounter++;
    if (!forceCheck && this.checkCounter % this.checkInterval !== 0) {
      return { found: false, violations: [] };
    }

    const violations: StreamViolation[] = [];

    for (const { pattern, severity, detail } of INJECTION_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(accumulatedText);
      if (match) {
        violations.push({
          type: 'injection',
          severity,
          chunk,
          position: match.index,
          action: severity === 'critical' ? 'block' : 'flag',
          detail,
          matched: match[0],
        });
      }
    }

    return { found: violations.length > 0, violations };
  }

  /** Reset the internal counter. */
  reset(): void {
    this.checkCounter = 0;
  }
}

// ---------------------------------------------------------------------------
// Toxicity Detector
// ---------------------------------------------------------------------------

const TOXICITY_PATTERNS: { pattern: RegExp; severity: ViolationSeverity; detail: string }[] = [
  {
    pattern: /\b(?:kill\s+(?:yourself|your\s*self|them\s*all)|murder\s+(?:everyone|them))\b/i,
    severity: 'critical',
    detail: 'Toxicity: violent threat or incitement',
  },
  {
    pattern: /\b(?:how\s+to\s+(?:make\s+a\s+bomb|build\s+(?:an?\s+)?explosive|synthesize\s+(?:drugs|poison)))\b/i,
    severity: 'critical',
    detail: 'Toxicity: dangerous instruction request',
  },
  {
    pattern: /\b(?:hate\s+(?:all|every)\s+\w+|(?:all|every)\s+\w+\s+(?:should\s+die|are\s+(?:stupid|worthless|inferior)))\b/i,
    severity: 'high',
    detail: 'Toxicity: hate speech or group denigration',
  },
  {
    pattern: /\b(?:you\s+(?:are|re)\s+(?:worthless|pathetic|disgusting|stupid|an?\s+idiot))\b/i,
    severity: 'medium',
    detail: 'Toxicity: personal insult or harassment',
  },
  {
    pattern: /\b(?:shut\s+(?:up|the\s+f))|(?:go\s+f\s*\*?\s*ck\s+yourself)\b/i,
    severity: 'medium',
    detail: 'Toxicity: hostile language',
  },
];

export class ToxicityDetector {
  private readonly minSeverity: ViolationSeverity;

  constructor(minSeverity: ViolationSeverity = 'medium') {
    this.minSeverity = minSeverity;
  }

  /**
   * Check a sentence or text segment for toxicity patterns.
   * Designed to be called at sentence boundaries for efficiency.
   */
  detect(sentenceText: string, chunk: StreamChunk): DetectionResult {
    const violations: StreamViolation[] = [];

    for (const { pattern, severity, detail } of TOXICITY_PATTERNS) {
      if (!meetsMinSeverity(severity, this.minSeverity)) continue;

      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(sentenceText);
      if (match) {
        violations.push({
          type: 'toxicity',
          severity,
          chunk,
          position: match.index,
          action: severity === 'critical' ? 'block' : 'flag',
          detail,
          matched: match[0],
        });
      }
    }

    return { found: violations.length > 0, violations };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<ViolationSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function meetsMinSeverity(
  severity: ViolationSeverity,
  minSeverity: ViolationSeverity,
): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity];
}
