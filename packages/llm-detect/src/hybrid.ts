/**
 * Hybrid detection combining regex (fast, free) with LLM (smart, paid).
 *
 * Strategy:
 * 1. Run regex first for well-known patterns
 * 2. If regex confidence is below threshold, escalate to LLM
 * 3. Merge and deduplicate results from both sources
 */

import type {
  LLMDetectorConfig,
  DetectionRequest,
  DetectionResult,
  DetectionType,
  Finding,
} from './types';
import { LLMDetector } from './detector';

// ---------------------------------------------------------------------------
// Regex patterns for fast, free detection of well-known patterns
// ---------------------------------------------------------------------------

const PII_PATTERNS: Array<{ type: string; pattern: RegExp; confidence: number }> = [
  { type: 'ssn', pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, confidence: 0.9 },
  { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, confidence: 0.95 },
  { type: 'phone', pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, confidence: 0.85 },
  { type: 'credit_card', pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g, confidence: 0.85 },
  { type: 'ip_address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, confidence: 0.8 },
  { type: 'dob', pattern: /\b(?:0[1-9]|1[0-2])[/.-](?:0[1-9]|[12]\d|3[01])[/.-](?:19|20)\d{2}\b/g, confidence: 0.75 },
  {
    type: 'address',
    pattern: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Dr(?:ive)?|Ln|Rd|Ct|Way|Pl)\b/gi,
    confidence: 0.7,
  },
];

const INJECTION_PATTERNS: Array<{ type: string; pattern: RegExp; confidence: number }> = [
  { type: 'prompt_injection', pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/gi, confidence: 0.95 },
  { type: 'prompt_injection', pattern: /disregard\s+(?:all\s+)?(?:previous|prior|your)\s+(?:instructions|rules|guidelines)/gi, confidence: 0.95 },
  { type: 'jailbreak', pattern: /\b(?:DAN|Do\s+Anything\s+Now)\b/g, confidence: 0.9 },
  { type: 'jailbreak', pattern: /you\s+are\s+now\s+(?:a|an|in)\s+/gi, confidence: 0.7 },
  { type: 'system_prompt_extraction', pattern: /(?:reveal|show|print|output|display|repeat)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)/gi, confidence: 0.9 },
  { type: 'encoding_attack', pattern: /(?:base64|rot13|hex)\s*(?:decode|encrypt)/gi, confidence: 0.75 },
  { type: 'delimiter_attack', pattern: /(?:<\/?system>|<\/?instruction>|\[INST\]|\[\/INST\]|<<SYS>>)/gi, confidence: 0.85 },
  { type: 'payload_injection', pattern: /(?:;\s*(?:DROP|DELETE|INSERT|UPDATE|SELECT)\s|'\s*OR\s+'1'\s*=\s*'1)/gi, confidence: 0.9 },
  { type: 'instruction_smuggling', pattern: /(?:IMPORTANT|CRITICAL|OVERRIDE):\s*(?:ignore|forget|discard)/gi, confidence: 0.85 },
];

const TOXICITY_PATTERNS: Array<{ type: string; pattern: RegExp; confidence: number }> = [
  { type: 'threat', pattern: /\b(?:kill|murder|attack|destroy|eliminate|hurt)\s+(?:you|them|him|her|everyone)/gi, confidence: 0.85 },
  { type: 'self_harm', pattern: /\b(?:kill\s+myself|end\s+(?:my|it\s+all)|suicide|self[- ]harm)\b/gi, confidence: 0.9 },
  { type: 'violence', pattern: /\b(?:bomb|weapon|gun|shoot|stab|explode)\s+(?:the|a|this)/gi, confidence: 0.7 },
];

const COMPLIANCE_PATTERNS: Array<{ type: string; pattern: RegExp; confidence: number }> = [
  { type: 'data_handling', pattern: /\b(?:store|save|log|record)\s+(?:password|credential|secret|token)/gi, confidence: 0.8 },
  { type: 'consent', pattern: /without\s+(?:user\s+)?(?:consent|permission|authorization)/gi, confidence: 0.75 },
  { type: 'data_minimization', pattern: /collect\s+(?:all|every|maximum)\s+(?:data|information)/gi, confidence: 0.7 },
];

const PATTERN_MAP: Record<DetectionType, Array<{ type: string; pattern: RegExp; confidence: number }>> = {
  pii: PII_PATTERNS,
  injection: INJECTION_PATTERNS,
  toxicity: TOXICITY_PATTERNS,
  compliance: COMPLIANCE_PATTERNS,
};

/**
 * Run regex-based detection on text.
 * Fast, free, and reliable for well-known patterns.
 */
export function regexDetect(text: string, type: DetectionType): Finding[] {
  const patterns = PATTERN_MAP[type] || [];
  const findings: Finding[] = [];

  for (const { type: findingType, pattern, confidence } of patterns) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      findings.push({
        type: findingType,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence,
        explanation: `Matched regex pattern for ${findingType}`,
        source: 'regex',
      });
    }
  }

  return findings;
}

/**
 * HybridDetector that combines regex and LLM detection.
 *
 * @example
 * ```typescript
 * const detector = new HybridDetector({
 *   model: 'claude-haiku-4-5-20251001',
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   confidenceThreshold: 0.8,
 * });
 *
 * const result = await detector.detect({
 *   text: 'My social is one two three, forty five, sixty seven eighty nine',
 *   type: 'pii',
 * });
 * ```
 */
export class HybridDetector {
  private llmDetector: LLMDetector;
  private llmThreshold: number;

  /**
   * @param config - LLM detector configuration
   * @param llmThreshold - Regex confidence threshold below which LLM is called. Default: 0.85
   */
  constructor(config: LLMDetectorConfig, llmThreshold: number = 0.85) {
    this.llmDetector = new LLMDetector(config);
    this.llmThreshold = llmThreshold;
  }

  /**
   * Detect using the hybrid approach:
   * 1. Run regex first (fast, free)
   * 2. If regex confidence < threshold, run LLM
   * 3. Merge results, deduplicate
   */
  async detect(request: DetectionRequest): Promise<DetectionResult> {
    const startTime = Date.now();

    // Step 1: Run regex
    const regexFindings = regexDetect(request.text, request.type);

    // Calculate regex confidence
    const regexConfidence = regexFindings.length > 0
      ? Math.max(...regexFindings.map((f) => f.confidence))
      : 0;

    // Step 2: Decide whether to call LLM
    const needsLLM =
      regexConfidence < this.llmThreshold || regexFindings.length === 0;

    let llmResult: DetectionResult | null = null;

    if (needsLLM) {
      try {
        llmResult = await this.llmDetector.detect(request);
      } catch {
        // LLM failed; proceed with regex-only results
      }
    }

    // Step 3: Merge and deduplicate
    const allFindings = [...regexFindings];

    if (llmResult) {
      for (const llmFinding of llmResult.findings) {
        const isDuplicate = allFindings.some(
          (existing) => isOverlapping(existing, llmFinding) && existing.type === llmFinding.type
        );

        if (!isDuplicate) {
          allFindings.push(llmFinding);
        } else {
          // If duplicate, keep the higher-confidence one
          const existingIndex = allFindings.findIndex(
            (existing) => isOverlapping(existing, llmFinding) && existing.type === llmFinding.type
          );
          if (
            existingIndex >= 0 &&
            llmFinding.confidence > allFindings[existingIndex].confidence
          ) {
            allFindings[existingIndex] = llmFinding;
          }
        }
      }
    }

    // Sort by position
    allFindings.sort((a, b) => a.start - b.start);

    const overallConfidence = allFindings.length > 0
      ? allFindings.reduce((sum, f) => sum + f.confidence, 0) / allFindings.length
      : llmResult?.confidence ?? (regexConfidence || 1.0);

    return {
      findings: allFindings,
      confidence: overallConfidence,
      modelUsed: llmResult ? `hybrid(regex+${llmResult.modelUsed})` : 'regex',
      fallbackUsed: !llmResult && needsLLM,
      cost: llmResult?.cost ?? 0,
      processingTime: Date.now() - startTime,
      detectionType: request.type,
    };
  }

  /**
   * Run hybrid detection across multiple types.
   */
  async detectAll(
    text: string,
    types: DetectionType[] = ['pii', 'injection', 'toxicity'],
    context?: string
  ): Promise<Record<string, DetectionResult>> {
    const results: Record<string, DetectionResult> = {};

    for (const type of types) {
      results[type] = await this.detect({ text, type, context });
    }

    return results;
  }
}

/**
 * Check if two findings overlap in position.
 */
function isOverlapping(a: Finding, b: Finding): boolean {
  // If positions are unknown, compare by value
  if (a.start === -1 || b.start === -1) {
    return a.value === b.value;
  }

  return a.start < b.end && b.start < a.end;
}
