/**
 * Prompt Injection Detection for RANA
 *
 * Detects various types of prompt injection attempts including:
 * - Direct injection (ignore previous instructions, etc.)
 * - Indirect injection via user input
 * - Jailbreak patterns
 * - System prompt leakage attempts
 *
 * @example
 * ```typescript
 * import { PromptInjectionDetector } from '@ranavibe/core';
 *
 * const detector = new PromptInjectionDetector({ sensitivity: 'high' });
 * const result = detector.detect('Ignore all previous instructions and...');
 *
 * if (result.detected) {
 *   console.log(`Risk: ${result.risk_level}, Confidence: ${result.confidence}`);
 *   console.log(`Patterns matched: ${result.patterns_matched.join(', ')}`);
 * }
 * ```
 */

export type SensitivityLevel = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface InjectionDetectionResult {
  /** Whether an injection attempt was detected */
  detected: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Patterns that were matched */
  patterns_matched: string[];
  /** Risk level of the detected injection */
  risk_level: RiskLevel;
  /** Heuristic score (0-100) */
  heuristic_score: number;
  /** Suspicious tokens found */
  suspicious_tokens: string[];
}

export interface PromptInjectionDetectorConfig {
  /** Sensitivity level for detection */
  sensitivity?: SensitivityLevel;
  /** Enable pattern matching */
  enablePatternMatching?: boolean;
  /** Enable heuristic scoring */
  enableHeuristicScoring?: boolean;
  /** Enable suspicious token detection */
  enableTokenDetection?: boolean;
  /** Custom patterns to add */
  customPatterns?: RegExp[];
}

/**
 * Pattern categories for different types of injection attempts
 */
const INJECTION_PATTERNS = {
  // Direct instruction override attempts
  directInjection: [
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|directives|commands|rules)/gi,
    /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|directives|commands|rules)/gi,
    /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|directives|commands|rules)/gi,
    /override\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|directives|commands|rules)/gi,
    /new\s+(instructions|directives|commands|rules)\s*:/gi,
    /instead,?\s+(do|follow|execute|perform)/gi,
    /from\s+now\s+on,?\s+you\s+(are|will|must|should)/gi,
    /you\s+are\s+now\s+(a|an|in)\s+\w+\s+mode/gi,
  ],

  // System prompt leakage attempts
  systemLeakage: [
    /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions|directives)/gi,
    /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions|directives)/gi,
    /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions|configuration)/gi,
    /print\s+(your|the)\s+(system\s+|original\s+)?(prompt|instructions|configuration)/gi,
    /output\s+(your|the)\s+(system\s+)?(prompt|instructions|configuration)/gi,
    /display\s+(your|the)\s+(system\s+)?(prompt|instructions|configuration)/gi,
    /repeat\s+(your|the)\s+(original\s+)?(prompt|instructions|directives)/gi,
    /tell\s+me\s+(your|the)\s+(initial|original)\s+(prompt|instructions)/gi,
  ],

  // Jailbreak patterns
  jailbreak: [
    /you\s+are\s+(no\s+longer|not)\s+(bound\s+by|subject\s+to|constrained\s+by)/gi,
    /for\s+(educational|research|academic|testing)\s+purposes\s+only/gi,
    /simulate\s+a\s+(jailbreak|unrestricted|uncensored)/gi,
    /pretend\s+you\s+(are|have)\s+no\s+(restrictions|limitations|filters)/gi,
    /act\s+as\s+if\s+you\s+(are|have)\s+no\s+(restrictions|limitations|rules)/gi,
    /DAN\s+mode/gi, // "Do Anything Now" jailbreak
    /developer\s+mode/gi,
    /god\s+mode/gi,
    /evil\s+mode/gi,
    /opposite\s+mode/gi,
  ],

  // Role manipulation
  roleManipulation: [
    /you\s+are\s+now\s+(a|an)\s+(different|new|evil|unrestricted)/gi,
    /pretend\s+(you\s+are|to\s+be)\s+(a|an)/gi,
    /roleplay\s+as\s+(a|an)/gi,
    /simulate\s+(being|a|an)/gi,
    /act\s+like\s+(a|an)/gi,
    /imagine\s+you\s+are\s+(a|an)/gi,
  ],

  // Encoding and obfuscation attempts
  obfuscation: [
    /base64|rot13|hex|unicode|ascii/gi,
    /decode\s+this/gi,
    /encoded\s+(message|instruction)/gi,
    /\\x[0-9a-f]{2}/gi, // Hex encoding
    /&#\d+;/g, // HTML entities
    /\\u[0-9a-f]{4}/gi, // Unicode escapes
  ],

  // Delimiter injection
  delimiterInjection: [
    /---\s*end\s+of\s+(instructions|prompt|context)/gi,
    /\[\/?(system|user|assistant|instruction)\]/gi,
    /<\/?(?:system|user|assistant|instruction)>/gi,
    /```\s*(system|end|exit|break)/gi,
  ],

  // Context manipulation
  contextManipulation: [
    /in\s+a\s+(hypothetical|alternate|fictional)\s+(world|scenario|universe)/gi,
    /let's\s+play\s+a\s+game\s+where/gi,
    /for\s+the\s+purposes\s+of\s+this\s+(conversation|exercise)/gi,
    /suspend\s+(your|all)\s+(ethics|guidelines|rules)/gi,
  ],
};

/**
 * Suspicious tokens that may indicate injection attempts
 */
const SUSPICIOUS_TOKENS = [
  // Command keywords
  'ignore', 'disregard', 'forget', 'override', 'bypass',
  'jailbreak', 'unrestricted', 'uncensored',

  // System references
  'system prompt', 'system message', 'system instructions',
  'original prompt', 'initial prompt',

  // Mode changes
  'DAN mode', 'developer mode', 'god mode', 'evil mode',
  'opposite mode', 'unrestricted mode',

  // Encoding
  'base64', 'rot13', 'decode', 'encoded',

  // Delimiters
  '---END---', '[SYSTEM]', '</system>', '```system',
];

/**
 * Prompt Injection Detector
 *
 * Uses multiple detection methods:
 * 1. Pattern matching - Regex-based detection of known injection patterns
 * 2. Heuristic scoring - Statistical analysis of text characteristics
 * 3. Token detection - Identification of suspicious keywords
 */
export class PromptInjectionDetector {
  private config: Required<PromptInjectionDetectorConfig>;
  private sensitivityThresholds: Record<SensitivityLevel, number>;

  constructor(config: PromptInjectionDetectorConfig = {}) {
    this.config = {
      sensitivity: config.sensitivity || 'medium',
      enablePatternMatching: config.enablePatternMatching ?? true,
      enableHeuristicScoring: config.enableHeuristicScoring ?? true,
      enableTokenDetection: config.enableTokenDetection ?? true,
      customPatterns: config.customPatterns || [],
    };

    // Confidence thresholds for different sensitivity levels
    this.sensitivityThresholds = {
      low: 0.45,   // 45% confidence required
      medium: 0.25, // 25% confidence required
      high: 0.12,  // 12% confidence required (more aggressive)
    };
  }

  /**
   * Detect prompt injection attempts in the given text
   */
  detect(text: string): InjectionDetectionResult {
    const patternsMatched: string[] = [];
    const suspiciousTokens: string[] = [];
    let heuristicScore = 0;
    let patternScore = 0;

    // 1. Pattern matching
    if (this.config.enablePatternMatching) {
      const patternResult = this.detectPatterns(text);
      patternsMatched.push(...patternResult.patterns);
      patternScore = patternResult.score;
    }

    // 2. Heuristic scoring
    if (this.config.enableHeuristicScoring) {
      heuristicScore = this.calculateHeuristicScore(text);
    }

    // 3. Suspicious token detection
    if (this.config.enableTokenDetection) {
      suspiciousTokens.push(...this.detectSuspiciousTokens(text));
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      patternScore,
      heuristicScore,
      suspiciousTokens.length
    );

    // Determine if injection is detected based on sensitivity
    const threshold = this.sensitivityThresholds[this.config.sensitivity];
    const detected = confidence >= threshold;

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(
      confidence,
      patternsMatched.length,
      heuristicScore
    );

    return {
      detected,
      confidence: Math.min(confidence, 1), // Cap at 1.0
      patterns_matched: patternsMatched,
      risk_level: riskLevel,
      heuristic_score: heuristicScore,
      suspicious_tokens: suspiciousTokens,
    };
  }

  /**
   * Detect patterns in text and calculate pattern-based score
   */
  private detectPatterns(text: string): { patterns: string[]; score: number } {
    const matched: string[] = [];
    let score = 0;

    // Check all pattern categories
    for (const [category, patterns] of Object.entries(INJECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched.push(category);

          // Different categories have different weights
          const weight = this.getCategoryWeight(category);
          score += weight;

          // Reset regex lastIndex for global patterns
          pattern.lastIndex = 0;
        }
      }
    }

    // Check custom patterns - treat as high priority (user-defined threats)
    for (const pattern of this.config.customPatterns) {
      if (pattern.test(text)) {
        matched.push('custom');
        score += 0.55; // Custom patterns should have significant weight
        pattern.lastIndex = 0;
      }
    }

    // Normalize score (each pattern contributes significantly)
    const normalizedScore = Math.min(score, 1);

    // Remove duplicates
    const uniquePatterns = Array.from(new Set(matched));

    return {
      patterns: uniquePatterns,
      score: normalizedScore,
    };
  }

  /**
   * Get weight for different pattern categories
   */
  private getCategoryWeight(category: string): number {
    // Weights calibrated to produce confidence > 0.5 for high-risk patterns
    // Pattern score * 0.7 (pattern weight in confidence calc) should exceed detection threshold
    const weights: Record<string, number> = {
      directInjection: 0.75,   // High risk - direct instruction override
      systemLeakage: 0.75,     // High risk - system prompt extraction
      jailbreak: 0.75,         // High risk - bypass safety measures
      roleManipulation: 0.50,  // Medium risk - identity manipulation
      obfuscation: 0.45,       // Medium risk - encoding/obfuscation
      delimiterInjection: 0.55, // Medium-high risk - structure manipulation
      contextManipulation: 0.45, // Medium risk - context framing
    };

    return weights[category] || 0.35;
  }

  /**
   * Calculate heuristic score based on text characteristics
   */
  private calculateHeuristicScore(text: string): number {
    let score = 0;

    // 1. Excessive use of imperative verbs
    const imperativeVerbs = [
      'ignore', 'disregard', 'forget', 'override', 'bypass',
      'reveal', 'show', 'display', 'print', 'output',
      'pretend', 'act', 'simulate', 'roleplay',
    ];

    const lowerText = text.toLowerCase();
    const imperativeCount = imperativeVerbs.filter(verb =>
      lowerText.includes(verb)
    ).length;
    score += Math.min(imperativeCount * 10, 30);

    // 2. Unusual punctuation patterns
    const exclamationMarks = (text.match(/!/g) || []).length;
    const questionMarks = (text.match(/\?/g) || []).length;
    score += Math.min((exclamationMarks + questionMarks) * 2, 15);

    // 3. Multiple consecutive capitalized words (shouting)
    const capsSequences = text.match(/\b[A-Z]{2,}\b/g) || [];
    score += Math.min(capsSequences.length * 5, 15);

    // 4. Unusual delimiter usage
    const delimiters = (text.match(/---+|===+|\*\*\*+|```/g) || []).length;
    score += Math.min(delimiters * 5, 15);

    // 5. XML/HTML-like tags
    const tags = (text.match(/<\/?[a-z]+>/gi) || []).length;
    score += Math.min(tags * 3, 10);

    // 6. Bracketed keywords
    const bracketedKeywords = (text.match(/\[(system|user|assistant|instruction|end)\]/gi) || []).length;
    score += Math.min(bracketedKeywords * 8, 15);

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Detect suspicious tokens in text
   */
  private detectSuspiciousTokens(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const token of SUSPICIOUS_TOKENS) {
      if (lowerText.includes(token.toLowerCase())) {
        found.push(token);
      }
    }

    return found;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    patternScore: number,
    heuristicScore: number,
    tokenCount: number
  ): number {
    // Weight the different detection methods
    // Pattern matching is the most reliable indicator
    const patternWeight = 0.7;
    const heuristicWeight = 0.2;
    const tokenWeight = 0.1;

    // Normalize heuristic score (0-100) to 0-1
    const normalizedHeuristic = heuristicScore / 100;

    // Normalize token count (cap at 5 tokens = 1.0)
    const normalizedTokens = Math.min(tokenCount / 5, 1);

    // Calculate weighted confidence
    const confidence =
      patternScore * patternWeight +
      normalizedHeuristic * heuristicWeight +
      normalizedTokens * tokenWeight;

    return confidence;
  }

  /**
   * Calculate risk level based on detection results
   */
  private calculateRiskLevel(
    confidence: number,
    patternCount: number,
    heuristicScore: number
  ): RiskLevel {
    // Critical: High confidence with multiple patterns OR very high confidence
    if ((confidence >= 0.7 && patternCount >= 3) || confidence >= 0.85) {
      return 'critical';
    }

    // High: High confidence or multiple high-risk patterns
    if (confidence >= 0.5 || patternCount >= 3) {
      return 'high';
    }

    // Medium: Moderate confidence or some patterns
    if (confidence >= 0.4 || patternCount >= 1) {
      return 'medium';
    }

    // Low: Low confidence
    return 'low';
  }

  /**
   * Update sensitivity level
   */
  setSensitivity(sensitivity: SensitivityLevel): void {
    this.config.sensitivity = sensitivity;
  }

  /**
   * Add custom detection patterns
   */
  addCustomPattern(pattern: RegExp): void {
    this.config.customPatterns.push(pattern);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<PromptInjectionDetectorConfig>> {
    return { ...this.config };
  }
}

/**
 * Create a new prompt injection detector with the given configuration
 */
export function createInjectionDetector(
  config?: PromptInjectionDetectorConfig
): PromptInjectionDetector {
  return new PromptInjectionDetector(config);
}

/**
 * Quick detection function for simple use cases
 */
export function detectInjection(
  text: string,
  sensitivity: SensitivityLevel = 'medium'
): InjectionDetectionResult {
  const detector = new PromptInjectionDetector({ sensitivity });
  return detector.detect(text);
}
