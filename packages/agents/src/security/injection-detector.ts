/**
 * Prompt Injection Detection
 * Detect and prevent prompt injection attacks
 */

export interface InjectionMatch {
  type: InjectionType;
  pattern: string;
  text: string;
  start: number;
  end: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export type InjectionType =
  | 'instruction_override'
  | 'role_hijacking'
  | 'context_manipulation'
  | 'delimiter_attack'
  | 'encoding_attack'
  | 'indirect_injection'
  | 'jailbreak_attempt'
  | 'data_exfiltration';

export interface InjectionDetectorConfig {
  /** Types of injections to detect */
  types?: InjectionType[];
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Minimum severity to report */
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
  /** Custom patterns */
  customPatterns?: Array<{
    name: string;
    pattern: RegExp;
    type: InjectionType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
  /** Block on detection (vs. warn only) */
  blockOnDetection?: boolean;
}

interface PatternDef {
  pattern: RegExp;
  type: InjectionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
}

/**
 * Injection detection patterns
 */
const INJECTION_PATTERNS: PatternDef[] = [
  // Instruction Override
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|guidelines?)/gi,
    type: 'instruction_override',
    severity: 'critical',
    confidence: 0.95,
    description: 'Direct instruction override attempt',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier|your)\s+(instructions?|prompts?|rules?|programming)/gi,
    type: 'instruction_override',
    severity: 'critical',
    confidence: 0.95,
    description: 'Disregard instructions attempt',
  },
  {
    pattern: /forget\s+(everything|all|what)\s+(you\s+)?(know|learned|were\s+told)/gi,
    type: 'instruction_override',
    severity: 'critical',
    confidence: 0.9,
    description: 'Memory wipe attempt',
  },
  {
    pattern: /override\s+(your\s+)?(system|safety|instructions?|programming)/gi,
    type: 'instruction_override',
    severity: 'critical',
    confidence: 0.95,
    description: 'System override attempt',
  },
  {
    pattern: /new\s+(instructions?|rules?|guidelines?)(\s*:|are)/gi,
    type: 'instruction_override',
    severity: 'high',
    confidence: 0.8,
    description: 'New instructions injection',
  },

  // Role Hijacking
  {
    pattern: /you\s+are\s+(now|actually|really)\s+(a|an|the)/gi,
    type: 'role_hijacking',
    severity: 'high',
    confidence: 0.85,
    description: 'Role reassignment attempt',
  },
  {
    pattern: /pretend\s+(you\s+)?(are|to\s+be|you're)/gi,
    type: 'role_hijacking',
    severity: 'high',
    confidence: 0.85,
    description: 'Pretend role attempt',
  },
  {
    pattern: /act\s+(like|as\s+if)\s+(you\s+)?(are|were)/gi,
    type: 'role_hijacking',
    severity: 'high',
    confidence: 0.8,
    description: 'Acting role attempt',
  },
  {
    pattern: /roleplay\s+as/gi,
    type: 'role_hijacking',
    severity: 'medium',
    confidence: 0.75,
    description: 'Roleplay attempt',
  },
  {
    pattern: /from\s+now\s+on,?\s+(you|your)/gi,
    type: 'role_hijacking',
    severity: 'high',
    confidence: 0.8,
    description: 'Persistent role change attempt',
  },
  {
    pattern: /for\s+the\s+rest\s+of\s+(this|our)\s+(conversation|chat)/gi,
    type: 'role_hijacking',
    severity: 'high',
    confidence: 0.8,
    description: 'Session-wide role change attempt',
  },

  // Context Manipulation
  {
    pattern: /\[system\]|\[assistant\]|\[user\]/gi,
    type: 'context_manipulation',
    severity: 'high',
    confidence: 0.9,
    description: 'Role tag injection',
  },
  {
    pattern: /<\/?system>|<\/?assistant>|<\/?user>/gi,
    type: 'context_manipulation',
    severity: 'high',
    confidence: 0.9,
    description: 'XML role tag injection',
  },
  {
    pattern: /```system|```assistant|```user/gi,
    type: 'context_manipulation',
    severity: 'medium',
    confidence: 0.8,
    description: 'Code block role injection',
  },
  {
    pattern: /human:|assistant:|system:/gi,
    type: 'context_manipulation',
    severity: 'high',
    confidence: 0.85,
    description: 'Role prefix injection',
  },

  // Delimiter Attacks
  {
    pattern: /---+\s*(system|instructions?|new\s+context)/gi,
    type: 'delimiter_attack',
    severity: 'high',
    confidence: 0.85,
    description: 'Delimiter-based context break',
  },
  {
    pattern: /###\s*(system|instructions?|new\s+rules?)/gi,
    type: 'delimiter_attack',
    severity: 'high',
    confidence: 0.85,
    description: 'Markdown header context break',
  },
  {
    pattern: /\*{3,}\s*(system|new|override)/gi,
    type: 'delimiter_attack',
    severity: 'medium',
    confidence: 0.75,
    description: 'Asterisk delimiter attack',
  },

  // Encoding Attacks
  {
    pattern: /&#\d+;|&#x[0-9a-f]+;/gi,
    type: 'encoding_attack',
    severity: 'medium',
    confidence: 0.7,
    description: 'HTML entity encoding',
  },
  {
    pattern: /%[0-9a-f]{2}/gi,
    type: 'encoding_attack',
    severity: 'low',
    confidence: 0.5,
    description: 'URL encoding detected',
  },
  {
    pattern: /\\u[0-9a-f]{4}/gi,
    type: 'encoding_attack',
    severity: 'medium',
    confidence: 0.6,
    description: 'Unicode escape sequence',
  },
  {
    pattern: /base64[:\s]+[A-Za-z0-9+/=]{20,}/gi,
    type: 'encoding_attack',
    severity: 'medium',
    confidence: 0.7,
    description: 'Base64 encoded content',
  },

  // Indirect Injection
  {
    pattern: /when\s+(you\s+)?(read|see|encounter|process)\s+(this|the\s+following)/gi,
    type: 'indirect_injection',
    severity: 'high',
    confidence: 0.8,
    description: 'Conditional instruction injection',
  },
  {
    pattern: /if\s+(you\s+)?(are|were)\s+(an?\s+)?(ai|assistant|llm|model)/gi,
    type: 'indirect_injection',
    severity: 'high',
    confidence: 0.85,
    description: 'AI-targeted conditional',
  },
  {
    pattern: /instructions?\s+for\s+(the\s+)?(ai|assistant|model|llm)/gi,
    type: 'indirect_injection',
    severity: 'high',
    confidence: 0.9,
    description: 'Embedded AI instructions',
  },

  // Jailbreak Attempts
  {
    pattern: /dan\s+(mode|prompt)|do\s+anything\s+now/gi,
    type: 'jailbreak_attempt',
    severity: 'critical',
    confidence: 0.95,
    description: 'DAN jailbreak attempt',
  },
  {
    pattern: /developer\s+mode|god\s+mode|admin\s+mode/gi,
    type: 'jailbreak_attempt',
    severity: 'critical',
    confidence: 0.9,
    description: 'Privilege escalation attempt',
  },
  {
    pattern: /unlock\s+(your\s+)?(full\s+)?(potential|capabilities|features)/gi,
    type: 'jailbreak_attempt',
    severity: 'high',
    confidence: 0.85,
    description: 'Capability unlock attempt',
  },
  {
    pattern: /bypass\s+(your\s+)?(safety|content|ethical)\s+(filters?|guidelines?)/gi,
    type: 'jailbreak_attempt',
    severity: 'critical',
    confidence: 0.95,
    description: 'Safety bypass attempt',
  },
  {
    pattern: /remove\s+(your\s+)?(restrictions?|limitations?|filters?)/gi,
    type: 'jailbreak_attempt',
    severity: 'critical',
    confidence: 0.9,
    description: 'Restriction removal attempt',
  },
  {
    pattern: /without\s+(any\s+)?(restrictions?|limitations?|filters?|censorship)/gi,
    type: 'jailbreak_attempt',
    severity: 'high',
    confidence: 0.85,
    description: 'Unrestricted mode request',
  },

  // Data Exfiltration
  {
    pattern: /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?|programming)/gi,
    type: 'data_exfiltration',
    severity: 'high',
    confidence: 0.9,
    description: 'System prompt extraction attempt',
  },
  {
    pattern: /show\s+(me\s+)?(your\s+)?(original|initial|system)\s+(prompt|instructions?)/gi,
    type: 'data_exfiltration',
    severity: 'high',
    confidence: 0.9,
    description: 'Prompt disclosure attempt',
  },
  {
    pattern: /what\s+(are|were)\s+(your\s+)?(original|initial|system)\s+(instructions?|rules?)/gi,
    type: 'data_exfiltration',
    severity: 'medium',
    confidence: 0.8,
    description: 'Instruction query attempt',
  },
  {
    pattern: /repeat\s+(your\s+)?(system\s+)?(prompt|instructions?)\s+(back|verbatim)/gi,
    type: 'data_exfiltration',
    severity: 'high',
    confidence: 0.9,
    description: 'Prompt repetition request',
  },
  {
    pattern: /output\s+(your|the)\s+(system\s+)?prompt/gi,
    type: 'data_exfiltration',
    severity: 'high',
    confidence: 0.9,
    description: 'Prompt output request',
  },
];

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Injection Detector class
 */
export class InjectionDetector {
  private config: Required<InjectionDetectorConfig>;
  private patterns: PatternDef[];

  constructor(config: InjectionDetectorConfig = {}) {
    this.config = {
      types: config.types || (Object.keys(INJECTION_PATTERNS) as InjectionType[]),
      minConfidence: config.minConfidence ?? 0.7,
      minSeverity: config.minSeverity ?? 'low',
      customPatterns: config.customPatterns || [],
      blockOnDetection: config.blockOnDetection ?? true,
    };

    // Filter patterns by type and severity
    const minSeverityIndex = SEVERITY_LEVELS.indexOf(this.config.minSeverity);
    this.patterns = INJECTION_PATTERNS.filter(
      (p) =>
        this.config.types.includes(p.type) &&
        SEVERITY_LEVELS.indexOf(p.severity) >= minSeverityIndex
    );

    // Add custom patterns
    for (const custom of this.config.customPatterns) {
      this.patterns.push({
        pattern: custom.pattern,
        type: custom.type,
        severity: custom.severity,
        confidence: custom.confidence,
        description: custom.name,
      });
    }
  }

  /**
   * Detect injection attempts
   */
  detect(text: string): InjectionMatch[] {
    const matches: InjectionMatch[] = [];
    const normalizedText = this.normalizeText(text);

    for (const patternDef of this.patterns) {
      if (patternDef.confidence < this.config.minConfidence) continue;

      // Reset regex state
      patternDef.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = patternDef.pattern.exec(normalizedText)) !== null) {
        matches.push({
          type: patternDef.type,
          pattern: patternDef.description,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          severity: patternDef.severity,
          confidence: patternDef.confidence,
        });
      }
    }

    // Sort by severity (critical first) then by position
    return matches.sort((a, b) => {
      const severityDiff =
        SEVERITY_LEVELS.indexOf(b.severity) - SEVERITY_LEVELS.indexOf(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return a.start - b.start;
    });
  }

  /**
   * Check if text contains injection attempts
   */
  containsInjection(text: string): boolean {
    return this.detect(text).length > 0;
  }

  /**
   * Check text and return result
   */
  check(text: string): {
    safe: boolean;
    blocked: boolean;
    matches: InjectionMatch[];
    highestSeverity?: 'low' | 'medium' | 'high' | 'critical';
  } {
    const matches = this.detect(text);
    const safe = matches.length === 0;
    const blocked = !safe && this.config.blockOnDetection;

    return {
      safe,
      blocked,
      matches,
      highestSeverity: matches.length > 0 ? matches[0].severity : undefined,
    };
  }

  /**
   * Get summary of injection attempts
   */
  getSummary(text: string): {
    total: number;
    byType: Record<InjectionType, number>;
    bySeverity: Record<string, number>;
    blocked: boolean;
  } {
    const matches = this.detect(text);
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const match of matches) {
      byType[match.type] = (byType[match.type] || 0) + 1;
      bySeverity[match.severity] = (bySeverity[match.severity] || 0) + 1;
    }

    return {
      total: matches.length,
      byType: byType as Record<InjectionType, number>,
      bySeverity,
      blocked: matches.length > 0 && this.config.blockOnDetection,
    };
  }

  /**
   * Normalize text for detection (handle common evasion techniques)
   */
  private normalizeText(text: string): string {
    let normalized = text;

    // Decode common HTML entities
    normalized = normalized
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    // Decode numeric HTML entities
    normalized = normalized.replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );
    normalized = normalized.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );

    // Normalize whitespace (collapse multiple spaces, but preserve for pattern matching)
    normalized = normalized.replace(/\s+/g, ' ');

    // Remove zero-width characters (evasion technique)
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Normalize homoglyphs (common substitutions)
    const homoglyphs: Record<string, string> = {
      '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
      '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
      'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E',
      'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e',
      'і': 'i', 'о': 'o', 'е': 'e', 'а': 'a', // Cyrillic lookalikes
    };
    for (const [glyph, replacement] of Object.entries(homoglyphs)) {
      normalized = normalized.replace(new RegExp(glyph, 'g'), replacement);
    }

    return normalized;
  }
}

/**
 * Create an injection detector
 */
export function createInjectionDetector(config?: InjectionDetectorConfig): InjectionDetector {
  return new InjectionDetector(config);
}

/**
 * Quick injection detection
 */
export function detectInjection(
  text: string,
  config?: InjectionDetectorConfig
): InjectionMatch[] {
  return new InjectionDetector(config).detect(text);
}

/**
 * Quick injection check
 */
export function checkForInjection(
  text: string,
  config?: InjectionDetectorConfig
): {
  safe: boolean;
  blocked: boolean;
  matches: InjectionMatch[];
} {
  return new InjectionDetector(config).check(text);
}
