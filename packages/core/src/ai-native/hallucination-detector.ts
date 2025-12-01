/**
 * Hallucination Detection
 *
 * Detects potential hallucinations in LLM outputs by:
 * - Checking for factual inconsistencies
 * - Verifying claims against provided context
 * - Detecting confident statements about uncertain topics
 * - Identifying fabricated citations or references
 */

// ============================================================================
// Types
// ============================================================================

export type HallucinationType =
  | 'factual_error' // Statement contradicts known facts
  | 'fabricated_citation' // Made-up reference or source
  | 'context_contradiction' // Contradicts provided context
  | 'overconfident_claim' // Too certain about uncertain topics
  | 'temporal_error' // Incorrect timeline or dates
  | 'entity_confusion' // Mixing up names, places, etc.
  | 'statistical_fabrication' // Made-up numbers or statistics
  | 'logical_inconsistency'; // Self-contradicting statements

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HallucinationInstance {
  type: HallucinationType;
  severity: SeverityLevel;
  text: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
  explanation: string;
  suggestion?: string;
}

export interface HallucinationResult {
  hasHallucinations: boolean;
  overallScore: number; // 0-1, higher = more likely hallucinated
  instances: HallucinationInstance[];
  summary: {
    totalInstances: number;
    byType: Record<HallucinationType, number>;
    bySeverity: Record<SeverityLevel, number>;
    mostCommonType: HallucinationType | null;
  };
  metadata: {
    processingTime: number;
    textLength: number;
    checksPerformed: string[];
  };
}

export interface GroundingContext {
  documents?: string[];
  facts?: string[];
  entities?: EntityInfo[];
  dateRange?: { start: Date; end: Date };
  domain?: string;
}

export interface EntityInfo {
  name: string;
  type: 'person' | 'organization' | 'location' | 'product' | 'event' | 'other';
  attributes?: Record<string, string>;
}

export interface HallucinationDetectorConfig {
  sensitivityLevel?: 'low' | 'medium' | 'high';
  enableFactChecking?: boolean;
  enableCitationVerification?: boolean;
  enableStatisticalValidation?: boolean;
  enableLogicalConsistency?: boolean;
  customPatterns?: RegExp[];
  trustedDomains?: string[];
}

// ============================================================================
// Patterns for Detection
// ============================================================================

const OVERCONFIDENCE_PATTERNS = [
  /\b(definitely|certainly|absolutely|undoubtedly|without question|unquestionably|indisputably)\b/gi,
  /\b(it is (a )?fact that|everyone knows|it's well known|obviously|clearly)\b/gi,
  /\b(100%|guaranteed|proven fact|scientifically proven)\b/gi,
];

const FABRICATED_CITATION_PATTERNS = [
  /according to (a |the )?(?:recent |latest |new )?study/gi,
  /research (shows|indicates|proves|suggests) that/gi,
  /(?:Dr\.|Professor|Prof\.) [A-Z][a-z]+ (?:[A-Z][a-z]+ )?(?:said|stated|found|discovered)/gi,
  /published in (?:the )?(?:journal|magazine|newspaper) (?:of )?[A-Z]/gi,
  /\b\d{4} study (?:by|from|at)\b/gi,
];

const STATISTICAL_PATTERNS = [
  /\b(\d+(?:\.\d+)?%)\s+(?:of|more|less|increase|decrease)/gi,
  /\b(statistics show|data indicates|numbers suggest|figures reveal)\b/gi,
  /\b(on average|typically|generally|usually)\s+(\d+)/gi,
  /\b(\d+(?:,\d{3})*)\s+(people|users|customers|studies|experts)/gi,
];

const TEMPORAL_PATTERNS = [
  /\b(in (?:19|20)\d{2})\b/gi,
  /\b(last (?:year|month|week|decade)|(?:this|next) year)\b/gi,
  /\b(recently|currently|nowadays|today|now)\b/gi,
];

const HEDGING_INDICATORS = [
  'may',
  'might',
  'could',
  'possibly',
  'perhaps',
  'potentially',
  'likely',
  'unlikely',
  'probably',
  'appears',
  'seems',
  'suggests',
  'indicates',
];

// ============================================================================
// Hallucination Detector Class
// ============================================================================

export class HallucinationDetector {
  private config: Required<HallucinationDetectorConfig>;
  private knowledgeCutoff: Date;

  constructor(config: HallucinationDetectorConfig = {}) {
    this.config = {
      sensitivityLevel: config.sensitivityLevel ?? 'medium',
      enableFactChecking: config.enableFactChecking ?? true,
      enableCitationVerification: config.enableCitationVerification ?? true,
      enableStatisticalValidation: config.enableStatisticalValidation ?? true,
      enableLogicalConsistency: config.enableLogicalConsistency ?? true,
      customPatterns: config.customPatterns ?? [],
      trustedDomains: config.trustedDomains ?? [],
    };

    // Knowledge cutoff (for temporal checks)
    this.knowledgeCutoff = new Date('2024-01-01');
  }

  // --------------------------------------------------------------------------
  // Main Detection Method
  // --------------------------------------------------------------------------

  detect(
    text: string,
    context?: GroundingContext
  ): HallucinationResult {
    const startTime = Date.now();
    const instances: HallucinationInstance[] = [];
    const checksPerformed: string[] = [];

    // Check 1: Overconfidence detection
    const overconfidenceInstances = this.detectOverconfidence(text);
    instances.push(...overconfidenceInstances);
    checksPerformed.push('overconfidence_detection');

    // Check 2: Citation verification
    if (this.config.enableCitationVerification) {
      const citationInstances = this.detectFabricatedCitations(text);
      instances.push(...citationInstances);
      checksPerformed.push('citation_verification');
    }

    // Check 3: Statistical validation
    if (this.config.enableStatisticalValidation) {
      const statisticalInstances = this.detectStatisticalFabrication(text);
      instances.push(...statisticalInstances);
      checksPerformed.push('statistical_validation');
    }

    // Check 4: Temporal consistency
    const temporalInstances = this.detectTemporalErrors(text);
    instances.push(...temporalInstances);
    checksPerformed.push('temporal_consistency');

    // Check 5: Context contradiction (if context provided)
    if (context) {
      const contextInstances = this.detectContextContradictions(text, context);
      instances.push(...contextInstances);
      checksPerformed.push('context_verification');
    }

    // Check 6: Logical consistency
    if (this.config.enableLogicalConsistency) {
      const logicalInstances = this.detectLogicalInconsistencies(text);
      instances.push(...logicalInstances);
      checksPerformed.push('logical_consistency');
    }

    // Check 7: Custom patterns
    if (this.config.customPatterns.length > 0) {
      const customInstances = this.detectCustomPatterns(text);
      instances.push(...customInstances);
      checksPerformed.push('custom_patterns');
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(instances, text.length);

    // Build summary
    const summary = this.buildSummary(instances);

    return {
      hasHallucinations: instances.length > 0,
      overallScore,
      instances,
      summary,
      metadata: {
        processingTime: Date.now() - startTime,
        textLength: text.length,
        checksPerformed,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Detection Methods
  // --------------------------------------------------------------------------

  private detectOverconfidence(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    for (const pattern of OVERCONFIDENCE_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Check if hedging language is nearby (reduces false positives)
        const surroundingText = text.slice(
          Math.max(0, match.index - 50),
          Math.min(text.length, match.index + match[0].length + 50)
        );

        const hasHedging = HEDGING_INDICATORS.some((h) =>
          surroundingText.toLowerCase().includes(h)
        );

        if (!hasHedging) {
          instances.push({
            type: 'overconfident_claim',
            severity: this.getSeverityForOverconfidence(match[0]),
            text: match[0],
            position: { start: match.index, end: match.index + match[0].length },
            confidence: 0.7,
            explanation: `Overconfident language "${match[0]}" may indicate unsupported claims`,
            suggestion: 'Consider adding hedging language or providing sources',
          });
        }
      }
    }

    return instances;
  }

  private detectFabricatedCitations(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    for (const pattern of FABRICATED_CITATION_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Check if there's an actual citation or URL nearby
        const surroundingText = text.slice(
          match.index,
          Math.min(text.length, match.index + 200)
        );

        const hasActualCitation =
          /\[\d+\]|\(\d{4}\)|https?:\/\/|doi\.org/.test(surroundingText);

        if (!hasActualCitation) {
          instances.push({
            type: 'fabricated_citation',
            severity: 'high',
            text: match[0],
            position: { start: match.index, end: match.index + match[0].length },
            confidence: 0.6,
            explanation:
              'Reference to study/research without verifiable citation',
            suggestion: 'Add specific citation with DOI, URL, or publication details',
          });
        }
      }
    }

    return instances;
  }

  private detectStatisticalFabrication(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    for (const pattern of STATISTICAL_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Check for suspicious round numbers
        const numberMatch = match[0].match(/\d+(?:\.\d+)?/);
        if (numberMatch) {
          const num = parseFloat(numberMatch[0]);

          // Very round numbers (10%, 50%, 90%, etc.) might be fabricated
          const isRoundNumber = num % 10 === 0 && num !== 100;
          // Extremely precise numbers might also be suspicious
          const isTooPercise = numberMatch[0].includes('.') && numberMatch[0].split('.')[1].length > 2;

          if (isRoundNumber || isTooPercise) {
            instances.push({
              type: 'statistical_fabrication',
              severity: 'medium',
              text: match[0],
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
              confidence: 0.5,
              explanation: isRoundNumber
                ? 'Round number statistics may be estimates or fabrications'
                : 'Overly precise statistics may be fabricated',
              suggestion: 'Verify statistics with credible sources',
            });
          }
        }
      }
    }

    return instances;
  }

  private detectTemporalErrors(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    for (const pattern of TEMPORAL_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Check for future dates beyond knowledge cutoff
        const yearMatch = match[0].match(/\b(20\d{2})\b/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const currentYear = new Date().getFullYear();

          if (year > currentYear) {
            instances.push({
              type: 'temporal_error',
              severity: 'high',
              text: match[0],
              position: {
                start: match.index,
                end: match.index + match[0].length,
              },
              confidence: 0.9,
              explanation: `Future date ${year} referenced - cannot have factual information about future events`,
              suggestion: 'Remove or clarify references to future events',
            });
          }
        }
      }
    }

    return instances;
  }

  private detectContextContradictions(
    text: string,
    context: GroundingContext
  ): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    // Check against provided facts
    if (context.facts) {
      for (const fact of context.facts) {
        const contradiction = this.findContradiction(text, fact);
        if (contradiction) {
          instances.push({
            type: 'context_contradiction',
            severity: 'critical',
            text: contradiction.text,
            position: contradiction.position,
            confidence: 0.8,
            explanation: `Statement contradicts provided fact: "${fact}"`,
            suggestion: 'Align response with provided context',
          });
        }
      }
    }

    // Check against provided entities
    if (context.entities) {
      for (const entity of context.entities) {
        const confusion = this.findEntityConfusion(text, entity, context.entities);
        if (confusion) {
          instances.push({
            type: 'entity_confusion',
            severity: 'high',
            text: confusion.text,
            position: confusion.position,
            confidence: 0.7,
            explanation: `Possible confusion with entity "${entity.name}"`,
            suggestion: 'Verify entity references',
          });
        }
      }
    }

    return instances;
  }

  private detectLogicalInconsistencies(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Look for contradictory statements
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const contradiction = this.detectContradiction(sentences[i], sentences[j]);
        if (contradiction) {
          instances.push({
            type: 'logical_inconsistency',
            severity: 'high',
            text: `"${sentences[i].trim()}" vs "${sentences[j].trim()}"`,
            position: { start: 0, end: text.length },
            confidence: 0.6,
            explanation: 'Potentially contradictory statements detected',
            suggestion: 'Review for logical consistency',
          });
        }
      }
    }

    return instances;
  }

  private detectCustomPatterns(text: string): HallucinationInstance[] {
    const instances: HallucinationInstance[] = [];

    for (const pattern of this.config.customPatterns) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        instances.push({
          type: 'factual_error',
          severity: 'medium',
          text: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.7,
          explanation: 'Matched custom hallucination pattern',
        });
      }
    }

    return instances;
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private findContradiction(
    text: string,
    fact: string
  ): { text: string; position: { start: number; end: number } } | null {
    // Simple negation detection
    const factWords = fact.toLowerCase().split(/\s+/);
    const negations = ['not', "n't", 'never', 'no', 'none', 'neither', 'without'];

    for (const negation of negations) {
      for (const word of factWords) {
        const pattern = new RegExp(`${negation}\\s+\\w*\\s*${word}`, 'gi');
        const match = pattern.exec(text);
        if (match) {
          return {
            text: match[0],
            position: { start: match.index, end: match.index + match[0].length },
          };
        }
      }
    }

    return null;
  }

  private findEntityConfusion(
    text: string,
    entity: EntityInfo,
    allEntities: EntityInfo[]
  ): { text: string; position: { start: number; end: number } } | null {
    // Check if entity attributes are mixed with other entities
    if (!entity.attributes) return null;

    const otherEntities = allEntities.filter((e) => e.name !== entity.name);

    for (const other of otherEntities) {
      if (!other.attributes) continue;

      // Check if text mentions entity.name with other's attributes
      const entityMention = text.indexOf(entity.name);
      if (entityMention === -1) continue;

      for (const [, attrValue] of Object.entries(other.attributes)) {
        const attrMention = text.indexOf(attrValue);
        if (attrMention !== -1 && Math.abs(attrMention - entityMention) < 100) {
          return {
            text: text.slice(
              Math.min(entityMention, attrMention),
              Math.max(entityMention + entity.name.length, attrMention + attrValue.length)
            ),
            position: {
              start: Math.min(entityMention, attrMention),
              end: Math.max(entityMention + entity.name.length, attrMention + attrValue.length),
            },
          };
        }
      }
    }

    return null;
  }

  private detectContradiction(sentence1: string, sentence2: string): boolean {
    const s1 = sentence1.toLowerCase();
    const s2 = sentence2.toLowerCase();

    // Simple contradiction detection based on negation
    const negations = ['not', "n't", 'never', 'no'];

    for (const neg of negations) {
      // If one has negation and other doesn't for similar content
      const s1HasNeg = s1.includes(neg);
      const s2HasNeg = s2.includes(neg);

      if (s1HasNeg !== s2HasNeg) {
        // Check for word overlap
        const words1 = new Set(s1.match(/\b\w{4,}\b/g) || []);
        const words2 = new Set(s2.match(/\b\w{4,}\b/g) || []);
        const overlap = [...words1].filter((w) => words2.has(w)).length;

        if (overlap >= 2) {
          return true;
        }
      }
    }

    return false;
  }

  private getSeverityForOverconfidence(text: string): SeverityLevel {
    const lower = text.toLowerCase();

    if (
      lower.includes('100%') ||
      lower.includes('guaranteed') ||
      lower.includes('proven fact')
    ) {
      return 'high';
    }

    if (
      lower.includes('definitely') ||
      lower.includes('certainly') ||
      lower.includes('absolutely')
    ) {
      return 'medium';
    }

    return 'low';
  }

  private calculateOverallScore(
    instances: HallucinationInstance[],
    textLength: number
  ): number {
    if (instances.length === 0) return 0;

    // Weight by severity
    const severityWeights: Record<SeverityLevel, number> = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0,
    };

    let totalWeight = 0;
    for (const instance of instances) {
      totalWeight += severityWeights[instance.severity] * instance.confidence;
    }

    // Normalize by text length (longer texts may have more false positives)
    const lengthFactor = Math.min(1, 500 / textLength);

    return Math.min(1, totalWeight * lengthFactor);
  }

  private buildSummary(instances: HallucinationInstance[]): HallucinationResult['summary'] {
    const byType: Record<HallucinationType, number> = {
      factual_error: 0,
      fabricated_citation: 0,
      context_contradiction: 0,
      overconfident_claim: 0,
      temporal_error: 0,
      entity_confusion: 0,
      statistical_fabrication: 0,
      logical_inconsistency: 0,
    };

    const bySeverity: Record<SeverityLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const instance of instances) {
      byType[instance.type]++;
      bySeverity[instance.severity]++;
    }

    // Find most common type
    let mostCommonType: HallucinationType | null = null;
    let maxCount = 0;
    for (const [type, count] of Object.entries(byType)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type as HallucinationType;
      }
    }

    return {
      totalInstances: instances.length,
      byType,
      bySeverity,
      mostCommonType,
    };
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  setSensitivity(level: 'low' | 'medium' | 'high'): void {
    this.config.sensitivityLevel = level;
  }

  addCustomPattern(pattern: RegExp): void {
    this.config.customPatterns.push(pattern);
  }

  addTrustedDomain(domain: string): void {
    this.config.trustedDomains.push(domain);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createHallucinationDetector(
  config?: HallucinationDetectorConfig
): HallucinationDetector {
  return new HallucinationDetector(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

let globalDetector: HallucinationDetector | null = null;

export function getGlobalHallucinationDetector(): HallucinationDetector {
  if (!globalDetector) {
    globalDetector = createHallucinationDetector();
  }
  return globalDetector;
}

export function detectHallucinations(
  text: string,
  context?: GroundingContext
): HallucinationResult {
  return getGlobalHallucinationDetector().detect(text, context);
}

export function hasHallucinations(
  text: string,
  context?: GroundingContext
): boolean {
  return getGlobalHallucinationDetector().detect(text, context).hasHallucinations;
}
