/**
 * Response Quality Scoring
 *
 * Evaluates the quality of LLM outputs based on:
 * - Relevance to the query
 * - Completeness of the answer
 * - Clarity and readability
 * - Accuracy indicators
 * - Helpfulness
 */

// ============================================================================
// Types
// ============================================================================

export type QualityDimension =
  | 'relevance' // How well the response addresses the query
  | 'completeness' // Whether all aspects are covered
  | 'clarity' // Readability and structure
  | 'accuracy' // Factual correctness indicators
  | 'helpfulness' // Actionable and useful
  | 'conciseness' // Not too verbose
  | 'coherence'; // Logical flow

export type QualityLevel = 'poor' | 'fair' | 'good' | 'excellent';

export interface QualityScore {
  overall: number; // 0-1
  level: QualityLevel;
  dimensions: Record<QualityDimension, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  metadata: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readabilityScore: number;
  };
}

export interface QualityEvaluation {
  dimension: QualityDimension;
  score: number;
  rationale: string;
  indicators: string[];
}

export interface QualityScorerConfig {
  weights?: Partial<Record<QualityDimension, number>>;
  minWordCount?: number;
  maxWordCount?: number;
  targetReadability?: number; // Flesch-Kincaid grade level
  customCriteria?: Array<{
    name: string;
    check: (text: string, query?: string) => number;
  }>;
}

// ============================================================================
// Quality Patterns
// ============================================================================

// Clarity indicators
const CLARITY_POSITIVE = [
  /^(?:first|second|third|finally|in summary|to summarize|in conclusion)/gim,
  /\b(?:specifically|namely|for example|for instance|such as)\b/gi,
  /\b(?:because|therefore|thus|hence|consequently|as a result)\b/gi,
  /\b(?:however|although|nevertheless|on the other hand|in contrast)\b/gi,
];

const CLARITY_NEGATIVE = [
  /\b(?:basically|actually|literally|honestly|frankly)\b/gi, // Filler words
  /(?:etc\.?|and so on|and more|you know|I mean)\b/gi, // Vague endings
  /\b(?:kind of|sort of|type of thing)\b/gi, // Imprecise language
  /!{2,}/g, // Multiple exclamation marks
];

// Completeness indicators
const COMPLETENESS_PATTERNS = [
  /\b(?:step \d|first|second|third|finally)\b/gi, // Steps/sequence
  /\b(?:pros?|cons?|advantages?|disadvantages?|benefits?|drawbacks?)\b/gi, // Both sides
  /\b(?:example|illustration|case|instance)\b/gi, // Examples
  /\b(?:note|important|remember|keep in mind|caveat|warning)\b/gi, // Additional considerations
];

// Helpfulness indicators
const HELPFULNESS_PATTERNS = [
  /\b(?:you can|you should|try|consider|recommend|suggest)\b/gi, // Actionable advice
  /\b(?:here's how|to do this|follow these steps)\b/gi, // Instructions
  /\b(?:tip|hint|trick|shortcut|best practice)\b/gi, // Helpful tips
  /```[\s\S]*?```/g, // Code blocks
  /\b(?:link|url|resource|documentation|reference)\b/gi, // Resources
];

// Coherence patterns
const TRANSITION_WORDS = [
  'additionally',
  'furthermore',
  'moreover',
  'however',
  'therefore',
  'consequently',
  'nevertheless',
  'meanwhile',
  'similarly',
  'likewise',
  'in contrast',
  'on the other hand',
  'as a result',
  'for this reason',
  'in other words',
  'to illustrate',
  'for example',
  'in conclusion',
  'to summarize',
  'finally',
];

// ============================================================================
// Quality Scorer Class
// ============================================================================

export class QualityScorer {
  private config: Required<QualityScorerConfig>;
  private weights: Record<QualityDimension, number>;

  constructor(config: QualityScorerConfig = {}) {
    this.config = {
      weights: config.weights ?? {},
      minWordCount: config.minWordCount ?? 10,
      maxWordCount: config.maxWordCount ?? 2000,
      targetReadability: config.targetReadability ?? 10, // 10th grade level
      customCriteria: config.customCriteria ?? [],
    };

    // Default weights
    this.weights = {
      relevance: config.weights?.relevance ?? 0.25,
      completeness: config.weights?.completeness ?? 0.15,
      clarity: config.weights?.clarity ?? 0.2,
      accuracy: config.weights?.accuracy ?? 0.15,
      helpfulness: config.weights?.helpfulness ?? 0.15,
      conciseness: config.weights?.conciseness ?? 0.05,
      coherence: config.weights?.coherence ?? 0.05,
    };

    // Normalize weights
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key of Object.keys(this.weights) as QualityDimension[]) {
      this.weights[key] /= total;
    }
  }

  // --------------------------------------------------------------------------
  // Main Scoring Method
  // --------------------------------------------------------------------------

  score(response: string, query?: string): QualityScore {
    const evaluations: QualityEvaluation[] = [];

    // Evaluate each dimension
    evaluations.push(this.evaluateRelevance(response, query));
    evaluations.push(this.evaluateCompleteness(response, query));
    evaluations.push(this.evaluateClarity(response));
    evaluations.push(this.evaluateAccuracy(response));
    evaluations.push(this.evaluateHelpfulness(response, query));
    evaluations.push(this.evaluateConciseness(response));
    evaluations.push(this.evaluateCoherence(response));

    // Apply custom criteria
    for (const criterion of this.config.customCriteria) {
      const score = criterion.check(response, query);
      evaluations.push({
        dimension: 'relevance', // Map to closest dimension
        score,
        rationale: `Custom criterion: ${criterion.name}`,
        indicators: [],
      });
    }

    // Build dimensions object
    const dimensions: Record<QualityDimension, number> = {
      relevance: 0,
      completeness: 0,
      clarity: 0,
      accuracy: 0,
      helpfulness: 0,
      conciseness: 0,
      coherence: 0,
    };

    for (const evaluation of evaluations) {
      if (evaluation.dimension in dimensions) {
        dimensions[evaluation.dimension] = evaluation.score;
      }
    }

    // Calculate overall score
    let overall = 0;
    for (const [dim, score] of Object.entries(dimensions)) {
      overall += score * this.weights[dim as QualityDimension];
    }

    // Generate strengths, weaknesses, suggestions
    const { strengths, weaknesses, suggestions } = this.analyzeEvaluations(
      evaluations
    );

    // Calculate metadata
    const metadata = this.calculateMetadata(response);

    return {
      overall,
      level: this.getQualityLevel(overall),
      dimensions,
      strengths,
      weaknesses,
      suggestions,
      metadata,
    };
  }

  // --------------------------------------------------------------------------
  // Dimension Evaluations
  // --------------------------------------------------------------------------

  private evaluateRelevance(
    response: string,
    query?: string
  ): QualityEvaluation {
    if (!query) {
      return {
        dimension: 'relevance',
        score: 0.7, // Default moderate score without query
        rationale: 'No query provided for relevance evaluation',
        indicators: [],
      };
    }

    const indicators: string[] = [];
    let score = 0.5;

    // Extract key terms from query
    const queryTerms = this.extractKeyTerms(query);
    const responseTerms = this.extractKeyTerms(response);

    // Check term overlap
    const overlap = [...queryTerms].filter((t) => responseTerms.has(t)).length;
    const overlapRatio = overlap / Math.max(queryTerms.size, 1);

    if (overlapRatio > 0.5) {
      score += 0.3;
      indicators.push(`High term overlap (${Math.round(overlapRatio * 100)}%)`);
    } else if (overlapRatio > 0.25) {
      score += 0.15;
      indicators.push(`Moderate term overlap (${Math.round(overlapRatio * 100)}%)`);
    } else {
      indicators.push(`Low term overlap (${Math.round(overlapRatio * 100)}%)`);
    }

    // Check for direct address of question
    if (
      query.includes('?') &&
      (response.toLowerCase().startsWith('yes') ||
        response.toLowerCase().startsWith('no') ||
        response.toLowerCase().includes('the answer is'))
    ) {
      score += 0.1;
      indicators.push('Directly addresses the question');
    }

    // Check for topic relevance
    const queryNouns = this.extractNouns(query);
    const responseNouns = this.extractNouns(response);
    const nounOverlap = [...queryNouns].filter((n) => responseNouns.has(n)).length;

    if (nounOverlap > 0) {
      score += 0.1;
      indicators.push(`Discusses ${nounOverlap} topic(s) from query`);
    }

    return {
      dimension: 'relevance',
      score: Math.min(1, score),
      rationale:
        indicators.length > 0
          ? indicators.join('; ')
          : 'Limited relevance to query',
      indicators,
    };
  }

  private evaluateCompleteness(
    response: string,
    query?: string
  ): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.5;

    // Check for structure
    for (const pattern of COMPLETENESS_PATTERNS) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        score += 0.05;
        indicators.push(`Contains ${matches[0].toLowerCase()}`);
      }
    }

    // Check for multiple points
    const bulletPoints = (response.match(/^[-•*]\s/gm) || []).length;
    const numberedPoints = (response.match(/^\d+\.\s/gm) || []).length;

    if (bulletPoints > 2 || numberedPoints > 2) {
      score += 0.15;
      indicators.push('Multiple points covered');
    }

    // Check for code examples (if technical)
    if (response.includes('```') || response.includes('    ')) {
      score += 0.1;
      indicators.push('Includes code examples');
    }

    // Check for examples
    if (/\b(?:for example|e\.g\.|such as|like)\b/i.test(response)) {
      score += 0.1;
      indicators.push('Provides examples');
    }

    // Check minimum length
    const wordCount = response.split(/\s+/).length;
    if (wordCount < this.config.minWordCount) {
      score -= 0.2;
      indicators.push('Response may be too brief');
    }

    return {
      dimension: 'completeness',
      score: Math.max(0, Math.min(1, score)),
      rationale:
        indicators.length > 0
          ? `Completeness indicators: ${indicators.join(', ')}`
          : 'Limited completeness indicators',
      indicators,
    };
  }

  private evaluateClarity(response: string): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.6;

    // Check for positive clarity patterns
    for (const pattern of CLARITY_POSITIVE) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        score += 0.05;
        indicators.push(`Uses clear language: "${matches[0]}"`);
      }
    }

    // Check for negative clarity patterns
    for (const pattern of CLARITY_NEGATIVE) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        score -= 0.05;
        indicators.push(`Contains unclear language: "${matches[0]}"`);
      }
    }

    // Check sentence length
    const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) /
      Math.max(sentences.length, 1);

    if (avgSentenceLength > 30) {
      score -= 0.1;
      indicators.push('Sentences may be too long');
    } else if (avgSentenceLength < 8) {
      score -= 0.05;
      indicators.push('Sentences may be too short');
    } else {
      score += 0.1;
      indicators.push('Good sentence length');
    }

    // Check paragraph structure
    const paragraphs = response.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (response.length > 500 && paragraphs.length > 1) {
      score += 0.1;
      indicators.push('Well-structured paragraphs');
    }

    // Check readability
    const readability = this.calculateReadability(response);
    if (readability >= 60) {
      score += 0.1;
      indicators.push('Good readability');
    } else if (readability < 30) {
      score -= 0.1;
      indicators.push('May be difficult to read');
    }

    return {
      dimension: 'clarity',
      score: Math.max(0, Math.min(1, score)),
      rationale: `Clarity score based on: ${indicators.join(', ')}`,
      indicators,
    };
  }

  private evaluateAccuracy(response: string): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.6;

    // Check for hedging (reduces accuracy confidence)
    const hedgingPatterns = [
      /\b(?:may|might|could|possibly|perhaps|probably)\b/gi,
      /\b(?:I think|I believe|I'm not sure)\b/gi,
    ];

    let hedgingCount = 0;
    for (const pattern of hedgingPatterns) {
      const matches = response.match(pattern);
      if (matches) hedgingCount += matches.length;
    }

    if (hedgingCount > 3) {
      score -= 0.15;
      indicators.push('High hedging language');
    } else if (hedgingCount > 0) {
      indicators.push('Some hedging language (appropriate uncertainty)');
    }

    // Check for citations/sources
    if (
      /\[\d+\]|https?:\/\/|\bsource\b|\breference\b/i.test(response)
    ) {
      score += 0.15;
      indicators.push('Includes citations or references');
    }

    // Check for specific details
    const hasNumbers = /\d+(?:\.\d+)?(?:%|\s*(?:million|billion|thousand))?/.test(
      response
    );
    const hasProperNouns = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(response);

    if (hasNumbers) {
      score += 0.1;
      indicators.push('Contains specific numbers');
    }
    if (hasProperNouns) {
      score += 0.05;
      indicators.push('References specific entities');
    }

    // Check for overconfidence (negative)
    if (/\b(?:always|never|definitely|certainly|100%|guaranteed)\b/i.test(response)) {
      score -= 0.05;
      indicators.push('May be overconfident');
    }

    return {
      dimension: 'accuracy',
      score: Math.max(0, Math.min(1, score)),
      rationale: `Accuracy indicators: ${indicators.join(', ')}`,
      indicators,
    };
  }

  private evaluateHelpfulness(
    response: string,
    query?: string
  ): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.5;

    // Check for helpfulness patterns
    for (const pattern of HELPFULNESS_PATTERNS) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        score += 0.08;
        indicators.push(`Helpful element: ${matches[0].slice(0, 30)}`);
      }
    }

    // Check for actionable content
    if (/\b(?:you can|you should|try|consider|to do this)\b/i.test(response)) {
      score += 0.1;
      indicators.push('Provides actionable advice');
    }

    // Check for warnings/caveats
    if (/\b(?:note|warning|caution|important|be aware)\b/i.test(response)) {
      score += 0.05;
      indicators.push('Includes important caveats');
    }

    // Check for follow-up guidance
    if (/\b(?:if you need|for more|let me know|feel free)\b/i.test(response)) {
      score += 0.05;
      indicators.push('Offers follow-up assistance');
    }

    // Penalty for unhelpful responses
    if (
      /\b(?:I cannot|I'm unable|I don't have|not possible)\b/i.test(response) &&
      !/\b(?:however|but|instead|alternatively)\b/i.test(response)
    ) {
      score -= 0.2;
      indicators.push('Declines without alternatives');
    }

    return {
      dimension: 'helpfulness',
      score: Math.max(0, Math.min(1, score)),
      rationale: `Helpfulness based on: ${indicators.join(', ')}`,
      indicators,
    };
  }

  private evaluateConciseness(response: string): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.7;

    const wordCount = response.split(/\s+/).length;

    // Check length
    if (wordCount > this.config.maxWordCount) {
      score -= 0.3;
      indicators.push('Response may be too long');
    } else if (wordCount > this.config.maxWordCount * 0.8) {
      score -= 0.1;
      indicators.push('Response is lengthy');
    }

    // Check for repetition
    const sentences = response.split(/[.!?]+/).map((s) => s.trim().toLowerCase());
    const uniqueSentences = new Set(sentences);
    const repetitionRatio = uniqueSentences.size / Math.max(sentences.length, 1);

    if (repetitionRatio < 0.8) {
      score -= 0.2;
      indicators.push('Contains repetitive content');
    }

    // Check for filler content
    const fillerPatterns = [
      /\b(?:basically|actually|literally|really|very)\b/gi,
      /\b(?:in order to|due to the fact that|at this point in time)\b/gi,
    ];

    let fillerCount = 0;
    for (const pattern of fillerPatterns) {
      const matches = response.match(pattern);
      if (matches) fillerCount += matches.length;
    }

    if (fillerCount > 5) {
      score -= 0.15;
      indicators.push('Contains filler words/phrases');
    }

    // Bonus for appropriate length
    if (wordCount >= this.config.minWordCount && wordCount <= this.config.maxWordCount * 0.5) {
      score += 0.1;
      indicators.push('Appropriately concise');
    }

    return {
      dimension: 'conciseness',
      score: Math.max(0, Math.min(1, score)),
      rationale: `Conciseness: ${indicators.join(', ')}`,
      indicators,
    };
  }

  private evaluateCoherence(response: string): QualityEvaluation {
    const indicators: string[] = [];
    let score = 0.6;

    // Check for transition words
    let transitionCount = 0;
    for (const word of TRANSITION_WORDS) {
      if (response.toLowerCase().includes(word)) {
        transitionCount++;
      }
    }

    if (transitionCount > 5) {
      score += 0.2;
      indicators.push('Excellent use of transitions');
    } else if (transitionCount > 2) {
      score += 0.1;
      indicators.push('Good use of transitions');
    } else if (response.split(/[.!?]+/).length > 3) {
      score -= 0.1;
      indicators.push('Could use more transitions');
    }

    // Check for logical structure
    const hasIntro = /^(?:to|in|the|this|when|if|as)/i.test(response.trim());
    const hasConclusion = /(?:in conclusion|to summarize|finally|overall|in summary)/i.test(
      response
    );

    if (hasIntro) {
      score += 0.05;
      indicators.push('Has clear introduction');
    }
    if (hasConclusion && response.length > 300) {
      score += 0.1;
      indicators.push('Has conclusion');
    }

    // Check for topic consistency
    const paragraphs = response.split(/\n\n+/);
    if (paragraphs.length > 1) {
      // Simple check: first paragraph topic should relate to others
      const firstTerms = this.extractKeyTerms(paragraphs[0]);
      let topicConsistency = 0;

      for (let i = 1; i < paragraphs.length; i++) {
        const terms = this.extractKeyTerms(paragraphs[i]);
        const overlap = [...firstTerms].filter((t) => terms.has(t)).length;
        if (overlap > 0) topicConsistency++;
      }

      if (topicConsistency > paragraphs.length * 0.5) {
        score += 0.1;
        indicators.push('Consistent topic throughout');
      }
    }

    return {
      dimension: 'coherence',
      score: Math.max(0, Math.min(1, score)),
      rationale: `Coherence: ${indicators.join(', ')}`,
      indicators,
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private extractKeyTerms(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'to', 'of', 'in', 'for', 'on', 'with',
      'at', 'by', 'from', 'as', 'that', 'this', 'it', 'its', 'and', 'or', 'but',
      'if', 'then', 'else', 'when', 'where', 'what', 'which', 'who', 'how', 'why',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return new Set(words.filter((w) => !stopWords.has(w)));
  }

  private extractNouns(text: string): Set<string> {
    // Simple noun extraction (words that appear capitalized mid-sentence or are common noun patterns)
    const nouns = new Set<string>();

    // Proper nouns (capitalized)
    const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    properNouns.forEach((n) => nouns.add(n.toLowerCase()));

    // Common nouns after articles
    const afterArticles = text.match(/\b(?:the|a|an)\s+([a-z]+)\b/gi) || [];
    afterArticles.forEach((phrase) => {
      const noun = phrase.split(/\s+/)[1];
      if (noun) nouns.add(noun.toLowerCase());
    });

    return nouns;
  }

  private calculateReadability(text: string): number {
    // Flesch Reading Ease score (simplified)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 50;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Remove common endings
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    // Count vowel groups
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private analyzeEvaluations(evaluations: QualityEvaluation[]): {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    for (const evaluation of evaluations) {
      if (evaluation.score >= 0.7) {
        strengths.push(`Good ${evaluation.dimension}`);
      } else if (evaluation.score < 0.5) {
        weaknesses.push(`Weak ${evaluation.dimension}`);

        // Generate suggestions
        switch (evaluation.dimension) {
          case 'relevance':
            suggestions.push('Focus more directly on the query topic');
            break;
          case 'completeness':
            suggestions.push('Add more detail or examples');
            break;
          case 'clarity':
            suggestions.push('Simplify language and improve structure');
            break;
          case 'accuracy':
            suggestions.push('Add citations or hedging language where uncertain');
            break;
          case 'helpfulness':
            suggestions.push('Include actionable advice or next steps');
            break;
          case 'conciseness':
            suggestions.push('Remove redundant content');
            break;
          case 'coherence':
            suggestions.push('Add transitions between ideas');
            break;
        }
      }
    }

    return { strengths, weaknesses, suggestions };
  }

  private getQualityLevel(score: number): QualityLevel {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  private calculateMetadata(response: string): QualityScore['metadata'] {
    const words = response.split(/\s+/).filter((w) => w.length > 0);
    const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: words.length / Math.max(sentences.length, 1),
      readabilityScore: this.calculateReadability(response),
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createQualityScorer(config?: QualityScorerConfig): QualityScorer {
  return new QualityScorer(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

let globalScorer: QualityScorer | null = null;

export function getGlobalQualityScorer(): QualityScorer {
  if (!globalScorer) {
    globalScorer = createQualityScorer();
  }
  return globalScorer;
}

export function scoreQuality(response: string, query?: string): QualityScore {
  return getGlobalQualityScorer().score(response, query);
}

export function getQualityLevel(response: string, query?: string): QualityLevel {
  return getGlobalQualityScorer().score(response, query).level;
}
