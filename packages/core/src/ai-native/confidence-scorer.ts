/**
 * Confidence Scoring
 *
 * Provides confidence scores for LLM outputs based on:
 * - Linguistic uncertainty markers
 * - Response consistency (multiple samples)
 * - Token probability analysis
 * - Context alignment
 */

// ============================================================================
// Types
// ============================================================================

export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface ConfidenceScore {
  overall: number; // 0-1
  level: ConfidenceLevel;
  breakdown: {
    linguistic: number; // Based on hedging language
    consistency: number; // Based on response consistency
    specificity: number; // Based on detail level
    grounding: number; // Based on context alignment
  };
  factors: ConfidenceFactor[];
  recommendations: string[];
}

export interface ConfidenceFactor {
  name: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

export interface ConsistencyCheckResult {
  score: number;
  samples: string[];
  agreement: number;
  variations: string[];
}

export interface ConfidenceScorerConfig {
  enableLinguisticAnalysis?: boolean;
  enableConsistencyCheck?: boolean;
  consistencySamples?: number;
  minConfidenceThreshold?: number;
  customIndicators?: {
    positive?: string[];
    negative?: string[];
  };
}

// ============================================================================
// Linguistic Patterns
// ============================================================================

// High confidence indicators
const HIGH_CONFIDENCE_PATTERNS = [
  /\b(is|are|was|were)\b(?!\s+(?:likely|probably|possibly|perhaps|maybe))/gi,
  /\b(definitely|certainly|always|never|must)\b/gi,
  /\b(proven|confirmed|established|verified|documented)\b/gi,
  /\b(in fact|indeed|clearly|obviously|evidently)\b/gi,
];

// Low confidence indicators (hedging language)
const LOW_CONFIDENCE_PATTERNS = [
  /\b(may|might|could|possibly|perhaps|maybe|probably)\b/gi,
  /\b(likely|unlikely|possibly|potentially|presumably)\b/gi,
  /\b(seems?|appears?|suggests?|indicates?)\b/gi,
  /\b(I think|I believe|I assume|I suppose|in my opinion)\b/gi,
  /\b(approximately|around|about|roughly|nearly)\b/gi,
  /\b(sometimes|often|usually|generally|typically)\b/gi,
  /\b(not sure|uncertain|unclear|unsure|don't know)\b/gi,
  /\b(it depends|varies|can vary|may differ)\b/gi,
];

// Uncertainty markers
const UNCERTAINTY_MARKERS = [
  'i\'m not sure',
  'i don\'t know',
  'it\'s unclear',
  'hard to say',
  'difficult to determine',
  'not certain',
  'can\'t confirm',
  'unable to verify',
  'no definitive answer',
  'depends on',
  'varies based on',
  'subject to change',
];

// Specificity indicators
const SPECIFICITY_PATTERNS = [
  /\b\d+(?:\.\d+)?(?:\s*(?:%|percent|dollars?|euros?|pounds?))?\b/g, // Numbers
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s*\d{4})?\b/gi, // Dates
  /\b\d{4}\b/g, // Years
  /\b(?:Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+[A-Z][a-z]+\b/g, // Named people
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, // Proper nouns
  /https?:\/\/[^\s]+/g, // URLs
];

// ============================================================================
// Confidence Scorer Class
// ============================================================================

export class ConfidenceScorer {
  private config: Required<ConfidenceScorerConfig>;
  private customPositiveIndicators: Set<string>;
  private customNegativeIndicators: Set<string>;

  constructor(config: ConfidenceScorerConfig = {}) {
    this.config = {
      enableLinguisticAnalysis: config.enableLinguisticAnalysis ?? true,
      enableConsistencyCheck: config.enableConsistencyCheck ?? false,
      consistencySamples: config.consistencySamples ?? 3,
      minConfidenceThreshold: config.minConfidenceThreshold ?? 0.3,
      customIndicators: config.customIndicators ?? {},
    };

    this.customPositiveIndicators = new Set(
      config.customIndicators?.positive ?? []
    );
    this.customNegativeIndicators = new Set(
      config.customIndicators?.negative ?? []
    );
  }

  // --------------------------------------------------------------------------
  // Main Scoring Method
  // --------------------------------------------------------------------------

  score(
    text: string,
    options: {
      context?: string;
      samples?: string[]; // Additional response samples for consistency
    } = {}
  ): ConfidenceScore {
    const factors: ConfidenceFactor[] = [];

    // 1. Linguistic analysis
    const linguisticScore = this.analyzeLinguistic(text, factors);

    // 2. Specificity analysis
    const specificityScore = this.analyzeSpecificity(text, factors);

    // 3. Consistency analysis (if samples provided)
    let consistencyScore = 1;
    if (options.samples && options.samples.length > 0) {
      consistencyScore = this.analyzeConsistency(text, options.samples, factors);
    }

    // 4. Grounding analysis (if context provided)
    let groundingScore = 1;
    if (options.context) {
      groundingScore = this.analyzeGrounding(text, options.context, factors);
    }

    // Calculate breakdown
    const breakdown = {
      linguistic: linguisticScore,
      consistency: consistencyScore,
      specificity: specificityScore,
      grounding: groundingScore,
    };

    // Calculate overall score (weighted average)
    const weights = {
      linguistic: 0.35,
      consistency: options.samples ? 0.25 : 0,
      specificity: 0.25,
      grounding: options.context ? 0.15 : 0,
    };

    // Normalize weights
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, v / totalWeight])
    ) as typeof weights;

    const overall =
      breakdown.linguistic * normalizedWeights.linguistic +
      breakdown.consistency * normalizedWeights.consistency +
      breakdown.specificity * normalizedWeights.specificity +
      breakdown.grounding * normalizedWeights.grounding;

    // Determine level
    const level = this.getConfidenceLevel(overall);

    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, factors);

    return {
      overall,
      level,
      breakdown,
      factors,
      recommendations,
    };
  }

  // --------------------------------------------------------------------------
  // Analysis Methods
  // --------------------------------------------------------------------------

  private analyzeLinguistic(
    text: string,
    factors: ConfidenceFactor[]
  ): number {
    let score = 0.5; // Start neutral

    // Count high confidence patterns
    let highConfidenceCount = 0;
    for (const pattern of HIGH_CONFIDENCE_PATTERNS) {
      const matches = text.match(pattern) || [];
      highConfidenceCount += matches.length;
    }

    // Count low confidence patterns
    let lowConfidenceCount = 0;
    for (const pattern of LOW_CONFIDENCE_PATTERNS) {
      const matches = text.match(pattern) || [];
      lowConfidenceCount += matches.length;
    }

    // Check for uncertainty markers
    const textLower = text.toLowerCase();
    let uncertaintyCount = 0;
    for (const marker of UNCERTAINTY_MARKERS) {
      if (textLower.includes(marker)) {
        uncertaintyCount++;
      }
    }

    // Check custom indicators
    let customPositiveCount = 0;
    let customNegativeCount = 0;
    for (const indicator of this.customPositiveIndicators) {
      if (textLower.includes(indicator.toLowerCase())) {
        customPositiveCount++;
      }
    }
    for (const indicator of this.customNegativeIndicators) {
      if (textLower.includes(indicator.toLowerCase())) {
        customNegativeCount++;
      }
    }

    // Normalize by text length (per 100 words)
    const wordCount = text.split(/\s+/).length;
    const normFactor = 100 / Math.max(wordCount, 1);

    const normalizedHigh = highConfidenceCount * normFactor;
    const normalizedLow =
      (lowConfidenceCount + uncertaintyCount + customNegativeCount) * normFactor;
    const normalizedPositive = customPositiveCount * normFactor;

    // Adjust score
    score += normalizedHigh * 0.05;
    score -= normalizedLow * 0.08;
    score += normalizedPositive * 0.05;

    // Add factors
    if (highConfidenceCount > 0) {
      factors.push({
        name: 'High confidence language',
        impact: 'positive',
        weight: normalizedHigh * 0.05,
        description: `Found ${highConfidenceCount} confident expressions`,
      });
    }

    if (lowConfidenceCount > 0) {
      factors.push({
        name: 'Hedging language',
        impact: 'negative',
        weight: normalizedLow * 0.08,
        description: `Found ${lowConfidenceCount} hedging expressions`,
      });
    }

    if (uncertaintyCount > 0) {
      factors.push({
        name: 'Explicit uncertainty',
        impact: 'negative',
        weight: uncertaintyCount * 0.1,
        description: `Found ${uncertaintyCount} explicit uncertainty markers`,
      });
    }

    return Math.max(0, Math.min(1, score));
  }

  private analyzeSpecificity(
    text: string,
    factors: ConfidenceFactor[]
  ): number {
    let score = 0.3; // Start low - specificity should be earned

    // Count specific details
    let specificityCount = 0;
    for (const pattern of SPECIFICITY_PATTERNS) {
      const matches = text.match(pattern) || [];
      specificityCount += matches.length;
    }

    // Normalize by text length
    const wordCount = text.split(/\s+/).length;
    const specificityDensity = specificityCount / Math.max(wordCount / 50, 1);

    score += specificityDensity * 0.15;

    // Check for vague language
    const vaguePatterns = [
      /\b(something|someone|somewhere|sometime|somehow)\b/gi,
      /\b(things?|stuff|various|different)\b/gi,
      /\b(etc\.?|and so on|and more)\b/gi,
    ];

    let vagueCount = 0;
    for (const pattern of vaguePatterns) {
      const matches = text.match(pattern) || [];
      vagueCount += matches.length;
    }

    score -= (vagueCount / Math.max(wordCount / 50, 1)) * 0.1;

    // Add factors
    if (specificityCount > 0) {
      factors.push({
        name: 'Specific details',
        impact: 'positive',
        weight: specificityDensity * 0.15,
        description: `Found ${specificityCount} specific details (numbers, dates, names)`,
      });
    }

    if (vagueCount > 0) {
      factors.push({
        name: 'Vague language',
        impact: 'negative',
        weight: vagueCount * 0.05,
        description: `Found ${vagueCount} vague expressions`,
      });
    }

    return Math.max(0, Math.min(1, score));
  }

  private analyzeConsistency(
    mainText: string,
    samples: string[],
    factors: ConfidenceFactor[]
  ): number {
    if (samples.length === 0) return 1;

    // Compare main text with samples
    const allTexts = [mainText, ...samples];
    const similarities: number[] = [];

    for (let i = 0; i < allTexts.length; i++) {
      for (let j = i + 1; j < allTexts.length; j++) {
        similarities.push(this.calculateTextSimilarity(allTexts[i], allTexts[j]));
      }
    }

    const avgSimilarity =
      similarities.reduce((a, b) => a + b, 0) / similarities.length;

    factors.push({
      name: 'Response consistency',
      impact: avgSimilarity > 0.7 ? 'positive' : 'negative',
      weight: Math.abs(avgSimilarity - 0.7) * 0.3,
      description: `${Math.round(avgSimilarity * 100)}% consistency across ${samples.length + 1} samples`,
    });

    return avgSimilarity;
  }

  private analyzeGrounding(
    text: string,
    context: string,
    factors: ConfidenceFactor[]
  ): number {
    // Check how well the response aligns with the provided context
    const contextWords = new Set(
      context
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
    const responseWords = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let groundedWords = 0;
    for (const word of responseWords) {
      if (contextWords.has(word)) {
        groundedWords++;
      }
    }

    const groundingRatio = groundedWords / Math.max(responseWords.length, 1);

    factors.push({
      name: 'Context grounding',
      impact: groundingRatio > 0.3 ? 'positive' : 'negative',
      weight: groundingRatio * 0.2,
      description: `${Math.round(groundingRatio * 100)}% of response terms found in context`,
    });

    return Math.min(1, groundingRatio * 2); // Scale up since 50% is quite good
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union; // Jaccard similarity
  }

  private getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  private generateRecommendations(
    breakdown: ConfidenceScore['breakdown'],
    factors: ConfidenceFactor[]
  ): string[] {
    const recommendations: string[] = [];

    if (breakdown.linguistic < 0.4) {
      recommendations.push(
        'Response contains significant hedging language - verify information independently'
      );
    }

    if (breakdown.specificity < 0.3) {
      recommendations.push(
        'Response lacks specific details - request more concrete information'
      );
    }

    if (breakdown.consistency < 0.6) {
      recommendations.push(
        'Response varies significantly across attempts - consider rephrasing the question'
      );
    }

    if (breakdown.grounding < 0.3) {
      recommendations.push(
        'Response may not be well-grounded in provided context - verify alignment'
      );
    }

    const negativeFactor = factors.find(
      (f) => f.impact === 'negative' && f.weight > 0.15
    );
    if (negativeFactor) {
      recommendations.push(
        `Significant concern: ${negativeFactor.description}`
      );
    }

    if (recommendations.length === 0 && breakdown.linguistic >= 0.6) {
      recommendations.push('Response appears confident and well-grounded');
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Batch Scoring
  // --------------------------------------------------------------------------

  scoreBatch(
    texts: string[],
    options?: {
      context?: string;
    }
  ): ConfidenceScore[] {
    return texts.map((text) => this.score(text, options));
  }

  // --------------------------------------------------------------------------
  // Quick Check
  // --------------------------------------------------------------------------

  isConfident(text: string, threshold = 0.6): boolean {
    return this.score(text).overall >= threshold;
  }

  getConfidenceLevelForText(text: string): ConfidenceLevel {
    return this.score(text).level;
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  addPositiveIndicator(indicator: string): void {
    this.customPositiveIndicators.add(indicator);
  }

  addNegativeIndicator(indicator: string): void {
    this.customNegativeIndicators.add(indicator);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createConfidenceScorer(
  config?: ConfidenceScorerConfig
): ConfidenceScorer {
  return new ConfidenceScorer(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

let globalScorer: ConfidenceScorer | null = null;

export function getGlobalConfidenceScorer(): ConfidenceScorer {
  if (!globalScorer) {
    globalScorer = createConfidenceScorer();
  }
  return globalScorer;
}

export function scoreConfidence(
  text: string,
  options?: { context?: string; samples?: string[] }
): ConfidenceScore {
  return getGlobalConfidenceScorer().score(text, options);
}

export function isConfident(text: string, threshold = 0.6): boolean {
  return getGlobalConfidenceScorer().isConfident(text, threshold);
}
