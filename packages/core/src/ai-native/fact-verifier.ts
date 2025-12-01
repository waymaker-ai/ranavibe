/**
 * Fact Verification
 *
 * Verifies factual claims in LLM outputs by:
 * - Extracting verifiable claims
 * - Checking against knowledge base
 * - Cross-referencing multiple sources
 * - Providing verification confidence
 */

// ============================================================================
// Types
// ============================================================================

export type ClaimType =
  | 'factual' // Verifiable fact
  | 'numerical' // Statistical or numerical claim
  | 'temporal' // Date or time-based claim
  | 'attribution' // Quote or attribution
  | 'definitional' // Definition or explanation
  | 'causal' // Cause-effect relationship
  | 'comparative'; // Comparison claim

export type VerificationStatus =
  | 'verified' // Confirmed true
  | 'disputed' // Found conflicting information
  | 'unverified' // Could not verify
  | 'false' // Confirmed false
  | 'partially_true'; // Some elements true, some false

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  position: {
    start: number;
    end: number;
  };
  subject?: string;
  predicate?: string;
  object?: string;
  confidence: number;
}

export interface VerificationSource {
  name: string;
  type: 'knowledge_base' | 'web' | 'document' | 'custom';
  url?: string;
  reliability: number; // 0-1
  lastUpdated?: Date;
}

export interface VerificationEvidence {
  source: VerificationSource;
  supports: boolean;
  excerpt?: string;
  confidence: number;
}

export interface ClaimVerification {
  claim: Claim;
  status: VerificationStatus;
  confidence: number;
  evidence: VerificationEvidence[];
  explanation: string;
  suggestedCorrection?: string;
}

export interface VerificationResult {
  totalClaims: number;
  verifiedClaims: number;
  disputedClaims: number;
  unverifiedClaims: number;
  falseClaims: number;
  overallReliability: number;
  claims: ClaimVerification[];
  summary: string;
  metadata: {
    processingTime: number;
    sourcesUsed: number;
  };
}

export interface KnowledgeEntry {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  source?: string;
  lastUpdated?: Date;
}

export interface FactVerifierConfig {
  knowledgeBase?: KnowledgeEntry[];
  enableWebSearch?: boolean;
  webSearchProvider?: (query: string) => Promise<string[]>;
  minClaimConfidence?: number;
  verificationThreshold?: number;
  trustedSources?: string[];
}

// ============================================================================
// Claim Extraction Patterns
// ============================================================================

const CLAIM_PATTERNS = {
  numerical: [
    /(\d+(?:\.\d+)?(?:\s*(?:%|percent|million|billion|thousand))?)(?:\s+(?:of|in|at|per))?/gi,
    /(?:costs?|prices?|values?|amounts?)\s+(?:of\s+)?(?:\$|€|£)?\d+/gi,
    /(?:increase|decrease|grow|shrink|rise|fall)(?:d|s|ed)?\s+(?:by\s+)?\d+/gi,
  ],
  temporal: [
    /(?:in|on|at|during|since|until|by)\s+(?:the\s+)?(?:\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?)/gi,
    /(?:founded|established|created|started|began|ended)\s+(?:in\s+)?\d{4}/gi,
    /(?:was|were|is|are)\s+(?:born|died)\s+(?:in|on)\s+/gi,
  ],
  attribution: [
    /(?:according to|said|stated|claimed|reported|wrote|believes?)\s+(?:by\s+)?(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /"[^"]+"\s*,?\s*(?:said|wrote|stated)\s+[A-Z]/gi,
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:said|stated|claimed|argued|wrote)\s+(?:that\s+)?/gi,
  ],
  definitional: [
    /\b(?:is|are|was|were)\s+(?:a|an|the)\s+(?:type|kind|form|sort)\s+of\b/gi,
    /\bdefined\s+as\b/gi,
    /\bmeans?\s+that\b/gi,
    /\brefers?\s+to\b/gi,
  ],
  causal: [
    /\bbecause\b/gi,
    /\bcauses?\b/gi,
    /\bresults?\s+in\b/gi,
    /\bleads?\s+to\b/gi,
    /\bdue\s+to\b/gi,
    /\bas\s+a\s+result\s+of\b/gi,
  ],
  comparative: [
    /\b(?:more|less|greater|fewer|higher|lower|better|worse)\s+than\b/gi,
    /\blargest|smallest|biggest|fastest|slowest|oldest|newest\b/gi,
    /\bcompared\s+to\b/gi,
  ],
};

// ============================================================================
// Built-in Knowledge Base (Common Facts)
// ============================================================================

const BUILT_IN_KNOWLEDGE: KnowledgeEntry[] = [
  // Basic geography
  { subject: 'Earth', predicate: 'has_continents', object: '7', confidence: 1 },
  { subject: 'Earth', predicate: 'has_oceans', object: '5', confidence: 1 },
  { subject: 'USA', predicate: 'capital', object: 'Washington D.C.', confidence: 1 },
  { subject: 'France', predicate: 'capital', object: 'Paris', confidence: 1 },
  { subject: 'Japan', predicate: 'capital', object: 'Tokyo', confidence: 1 },

  // Basic science
  { subject: 'water', predicate: 'boiling_point', object: '100°C', confidence: 1 },
  { subject: 'water', predicate: 'freezing_point', object: '0°C', confidence: 1 },
  { subject: 'speed_of_light', predicate: 'value', object: '299792458 m/s', confidence: 1 },
  { subject: 'solar_system', predicate: 'has_planets', object: '8', confidence: 1 },

  // Basic math
  { subject: 'pi', predicate: 'approximate_value', object: '3.14159', confidence: 1 },
  { subject: 'year', predicate: 'has_days', object: '365', confidence: 0.9 },
  { subject: 'year', predicate: 'has_months', object: '12', confidence: 1 },

  // Technology
  { subject: 'Internet', predicate: 'invented_year', object: '1969', confidence: 0.9 },
  { subject: 'World Wide Web', predicate: 'invented_year', object: '1989', confidence: 0.9 },
  { subject: 'iPhone', predicate: 'released_year', object: '2007', confidence: 1 },
];

// ============================================================================
// Fact Verifier Class
// ============================================================================

export class FactVerifier {
  private config: Required<FactVerifierConfig>;
  private knowledgeBase: Map<string, KnowledgeEntry[]>;

  constructor(config: FactVerifierConfig = {}) {
    this.config = {
      knowledgeBase: config.knowledgeBase ?? [],
      enableWebSearch: config.enableWebSearch ?? false,
      webSearchProvider: config.webSearchProvider ?? (async () => []),
      minClaimConfidence: config.minClaimConfidence ?? 0.5,
      verificationThreshold: config.verificationThreshold ?? 0.7,
      trustedSources: config.trustedSources ?? [],
    };

    // Build knowledge base index
    this.knowledgeBase = new Map();
    this.indexKnowledge([...BUILT_IN_KNOWLEDGE, ...this.config.knowledgeBase]);
  }

  // --------------------------------------------------------------------------
  // Main Verification Method
  // --------------------------------------------------------------------------

  async verify(text: string): Promise<VerificationResult> {
    const startTime = Date.now();

    // Step 1: Extract claims
    const claims = this.extractClaims(text);

    // Step 2: Verify each claim
    const verifications: ClaimVerification[] = [];
    for (const claim of claims) {
      const verification = await this.verifyClaim(claim, text);
      verifications.push(verification);
    }

    // Step 3: Calculate statistics
    const stats = this.calculateStats(verifications);

    return {
      totalClaims: claims.length,
      verifiedClaims: stats.verified,
      disputedClaims: stats.disputed,
      unverifiedClaims: stats.unverified,
      falseClaims: stats.false,
      overallReliability: stats.reliability,
      claims: verifications,
      summary: this.generateSummary(stats, verifications),
      metadata: {
        processingTime: Date.now() - startTime,
        sourcesUsed: this.knowledgeBase.size,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Claim Extraction
  // --------------------------------------------------------------------------

  extractClaims(text: string): Claim[] {
    const claims: Claim[] = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    let claimId = 0;

    for (const sentence of sentences) {
      // Check for each claim type
      for (const [type, patterns] of Object.entries(CLAIM_PATTERNS)) {
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match: RegExpExecArray | null;

          while ((match = regex.exec(sentence)) !== null) {
            // Find the full sentence containing this match
            const start = text.indexOf(sentence);
            if (start === -1) continue;

            // Extract subject-predicate-object if possible
            const { subject, predicate, object } = this.extractTriple(
              sentence,
              match[0]
            );

            claims.push({
              id: `claim_${claimId++}`,
              text: sentence.trim(),
              type: type as ClaimType,
              position: {
                start,
                end: start + sentence.length,
              },
              subject,
              predicate,
              object,
              confidence: this.estimateClaimConfidence(sentence, type as ClaimType),
            });

            break; // One claim per pattern per sentence
          }
        }
      }
    }

    // Deduplicate claims with same text
    const seen = new Set<string>();
    return claims.filter((claim) => {
      if (seen.has(claim.text)) return false;
      seen.add(claim.text);
      return true;
    });
  }

  private extractTriple(
    sentence: string,
    match: string
  ): { subject?: string; predicate?: string; object?: string } {
    // Simple extraction based on sentence structure
    const words = sentence.split(/\s+/);
    const matchIndex = sentence.indexOf(match);

    // Look for subject (usually before verb)
    const verbs = ['is', 'are', 'was', 'were', 'has', 'have', 'had'];
    let verbIndex = -1;
    for (let i = 0; i < words.length; i++) {
      if (verbs.includes(words[i].toLowerCase())) {
        verbIndex = i;
        break;
      }
    }

    if (verbIndex > 0) {
      const subject = words.slice(0, verbIndex).join(' ');
      const predicate = words[verbIndex];
      const object = words.slice(verbIndex + 1).join(' ');

      return { subject, predicate, object };
    }

    return {};
  }

  private estimateClaimConfidence(sentence: string, type: ClaimType): number {
    let confidence = 0.6;

    // Boost for specific types
    if (type === 'numerical') confidence += 0.1;
    if (type === 'temporal') confidence += 0.1;

    // Reduce for hedging language
    const hedgingWords = ['may', 'might', 'could', 'possibly', 'perhaps', 'probably'];
    for (const word of hedgingWords) {
      if (sentence.toLowerCase().includes(word)) {
        confidence -= 0.15;
      }
    }

    // Boost for confident language
    const confidentWords = ['definitely', 'certainly', 'proven', 'confirmed'];
    for (const word of confidentWords) {
      if (sentence.toLowerCase().includes(word)) {
        confidence += 0.1;
      }
    }

    return Math.max(0.1, Math.min(1, confidence));
  }

  // --------------------------------------------------------------------------
  // Claim Verification
  // --------------------------------------------------------------------------

  private async verifyClaim(
    claim: Claim,
    fullText: string
  ): Promise<ClaimVerification> {
    const evidence: VerificationEvidence[] = [];

    // Check against knowledge base
    const kbEvidence = this.checkKnowledgeBase(claim);
    evidence.push(...kbEvidence);

    // Check for internal consistency
    const consistencyEvidence = this.checkInternalConsistency(claim, fullText);
    if (consistencyEvidence) {
      evidence.push(consistencyEvidence);
    }

    // Web search if enabled and needed
    if (
      this.config.enableWebSearch &&
      evidence.length === 0 &&
      claim.confidence >= this.config.minClaimConfidence
    ) {
      const webEvidence = await this.searchWeb(claim);
      evidence.push(...webEvidence);
    }

    // Determine status based on evidence
    const { status, confidence, explanation } = this.evaluateEvidence(
      claim,
      evidence
    );

    // Generate correction if false
    let suggestedCorrection: string | undefined;
    if (status === 'false' || status === 'disputed') {
      suggestedCorrection = this.generateCorrection(claim, evidence);
    }

    return {
      claim,
      status,
      confidence,
      evidence,
      explanation,
      suggestedCorrection,
    };
  }

  private checkKnowledgeBase(claim: Claim): VerificationEvidence[] {
    const evidence: VerificationEvidence[] = [];

    // Search by subject
    if (claim.subject) {
      const subjectKey = claim.subject.toLowerCase();
      const entries = this.knowledgeBase.get(subjectKey);

      if (entries) {
        for (const entry of entries) {
          // Check if claim matches entry
          const matches = this.claimMatchesEntry(claim, entry);

          if (matches !== null) {
            evidence.push({
              source: {
                name: 'Built-in Knowledge Base',
                type: 'knowledge_base',
                reliability: 0.9,
              },
              supports: matches,
              excerpt: `${entry.subject} ${entry.predicate}: ${entry.object}`,
              confidence: entry.confidence,
            });
          }
        }
      }
    }

    // Search by keywords in claim text
    const keywords = this.extractKeywords(claim.text);
    for (const keyword of keywords) {
      const entries = this.knowledgeBase.get(keyword.toLowerCase());
      if (entries) {
        for (const entry of entries) {
          const matches = this.claimMatchesEntry(claim, entry);
          if (matches !== null) {
            evidence.push({
              source: {
                name: 'Built-in Knowledge Base',
                type: 'knowledge_base',
                reliability: 0.9,
              },
              supports: matches,
              excerpt: `${entry.subject} ${entry.predicate}: ${entry.object}`,
              confidence: entry.confidence * 0.8, // Lower confidence for keyword match
            });
          }
        }
      }
    }

    return evidence;
  }

  private claimMatchesEntry(claim: Claim, entry: KnowledgeEntry): boolean | null {
    const claimLower = claim.text.toLowerCase();
    const entryObjectLower = entry.object.toLowerCase();

    // Check if claim text contains the entry object
    if (claimLower.includes(entryObjectLower)) {
      return true;
    }

    // Check for numerical contradiction
    if (claim.type === 'numerical') {
      const claimNumbers = claimLower.match(/\d+(?:\.\d+)?/g);
      const entryNumbers = entryObjectLower.match(/\d+(?:\.\d+)?/g);

      if (claimNumbers && entryNumbers) {
        for (const claimNum of claimNumbers) {
          for (const entryNum of entryNumbers) {
            // If numbers are about the same subject but different values
            if (
              claimLower.includes(entry.subject.toLowerCase()) &&
              claimNum !== entryNum
            ) {
              return false;
            }
          }
        }
      }
    }

    return null; // No match found
  }

  private checkInternalConsistency(
    claim: Claim,
    fullText: string
  ): VerificationEvidence | null {
    // Look for contradictions within the same text
    const sentences = fullText.split(/[.!?]+/);
    const claimSentence = claim.text.toLowerCase();

    for (const sentence of sentences) {
      if (sentence.toLowerCase() === claimSentence) continue;

      // Check for negation of same claim
      const negatedClaim = this.negateClaim(claim.text);
      if (
        negatedClaim &&
        sentence.toLowerCase().includes(negatedClaim.toLowerCase())
      ) {
        return {
          source: {
            name: 'Internal Consistency Check',
            type: 'document',
            reliability: 0.8,
          },
          supports: false,
          excerpt: sentence.trim(),
          confidence: 0.7,
        };
      }
    }

    return null;
  }

  private negateClaim(claim: string): string | null {
    // Simple negation
    if (claim.includes(' is ')) {
      return claim.replace(' is ', ' is not ');
    }
    if (claim.includes(' are ')) {
      return claim.replace(' are ', ' are not ');
    }
    if (claim.includes(' was ')) {
      return claim.replace(' was ', ' was not ');
    }
    if (claim.includes(' were ')) {
      return claim.replace(' were ', ' were not ');
    }
    return null;
  }

  private async searchWeb(claim: Claim): Promise<VerificationEvidence[]> {
    // Use configured web search provider
    const results = await this.config.webSearchProvider(claim.text);

    return results.slice(0, 3).map((result, i) => ({
      source: {
        name: `Web Source ${i + 1}`,
        type: 'web' as const,
        url: result,
        reliability: 0.6,
      },
      supports: true, // Assume support if found
      excerpt: result.slice(0, 200),
      confidence: 0.5,
    }));
  }

  private evaluateEvidence(
    claim: Claim,
    evidence: VerificationEvidence[]
  ): { status: VerificationStatus; confidence: number; explanation: string } {
    if (evidence.length === 0) {
      return {
        status: 'unverified',
        confidence: 0.3,
        explanation: 'No evidence found to verify or refute this claim',
      };
    }

    const supporting = evidence.filter((e) => e.supports);
    const refuting = evidence.filter((e) => !e.supports);

    const supportWeight = supporting.reduce(
      (sum, e) => sum + e.confidence * e.source.reliability,
      0
    );
    const refuteWeight = refuting.reduce(
      (sum, e) => sum + e.confidence * e.source.reliability,
      0
    );

    if (supportWeight > refuteWeight * 1.5) {
      return {
        status: 'verified',
        confidence: Math.min(0.95, supportWeight / (supportWeight + refuteWeight + 0.1)),
        explanation: `Claim supported by ${supporting.length} source(s)`,
      };
    }

    if (refuteWeight > supportWeight * 1.5) {
      return {
        status: 'false',
        confidence: Math.min(0.95, refuteWeight / (supportWeight + refuteWeight + 0.1)),
        explanation: `Claim refuted by ${refuting.length} source(s)`,
      };
    }

    if (supporting.length > 0 && refuting.length > 0) {
      return {
        status: 'disputed',
        confidence: 0.5,
        explanation: `Conflicting evidence: ${supporting.length} supporting, ${refuting.length} refuting`,
      };
    }

    if (supporting.length > 0) {
      return {
        status: 'partially_true',
        confidence: supportWeight / (supporting.length + 1),
        explanation: 'Partial support found, but verification incomplete',
      };
    }

    return {
      status: 'unverified',
      confidence: 0.3,
      explanation: 'Insufficient evidence for verification',
    };
  }

  private generateCorrection(
    claim: Claim,
    evidence: VerificationEvidence[]
  ): string | undefined {
    const refuting = evidence.filter((e) => !e.supports);

    if (refuting.length === 0) return undefined;

    // Use the most reliable refuting source
    const best = refuting.sort(
      (a, b) => b.source.reliability * b.confidence - a.source.reliability * a.confidence
    )[0];

    if (best.excerpt) {
      return `According to ${best.source.name}: ${best.excerpt}`;
    }

    return undefined;
  }

  // --------------------------------------------------------------------------
  // Knowledge Base Management
  // --------------------------------------------------------------------------

  private indexKnowledge(entries: KnowledgeEntry[]): void {
    for (const entry of entries) {
      const key = entry.subject.toLowerCase();
      if (!this.knowledgeBase.has(key)) {
        this.knowledgeBase.set(key, []);
      }
      this.knowledgeBase.get(key)!.push(entry);
    }
  }

  addKnowledge(entry: KnowledgeEntry): void {
    const key = entry.subject.toLowerCase();
    if (!this.knowledgeBase.has(key)) {
      this.knowledgeBase.set(key, []);
    }
    this.knowledgeBase.get(key)!.push(entry);
  }

  addKnowledgeBatch(entries: KnowledgeEntry[]): void {
    this.indexKnowledge(entries);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'that', 'this',
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  private calculateStats(verifications: ClaimVerification[]): {
    verified: number;
    disputed: number;
    unverified: number;
    false: number;
    reliability: number;
  } {
    const counts = {
      verified: 0,
      disputed: 0,
      unverified: 0,
      false: 0,
      partially_true: 0,
    };

    for (const v of verifications) {
      counts[v.status]++;
    }

    const total = verifications.length || 1;
    const reliability =
      (counts.verified + counts.partially_true * 0.5) / total;

    return {
      verified: counts.verified,
      disputed: counts.disputed,
      unverified: counts.unverified,
      false: counts.false,
      reliability,
    };
  }

  private generateSummary(
    stats: ReturnType<typeof this.calculateStats>,
    verifications: ClaimVerification[]
  ): string {
    const parts: string[] = [];

    parts.push(
      `Found ${verifications.length} verifiable claim(s) with ${Math.round(stats.reliability * 100)}% reliability.`
    );

    if (stats.verified > 0) {
      parts.push(`${stats.verified} claim(s) verified.`);
    }

    if (stats.false > 0) {
      parts.push(`${stats.false} claim(s) found to be false.`);
    }

    if (stats.disputed > 0) {
      parts.push(`${stats.disputed} claim(s) have conflicting evidence.`);
    }

    if (stats.unverified > 0) {
      parts.push(`${stats.unverified} claim(s) could not be verified.`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createFactVerifier(config?: FactVerifierConfig): FactVerifier {
  return new FactVerifier(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

let globalVerifier: FactVerifier | null = null;

export function getGlobalFactVerifier(): FactVerifier {
  if (!globalVerifier) {
    globalVerifier = createFactVerifier();
  }
  return globalVerifier;
}

export async function verifyFacts(text: string): Promise<VerificationResult> {
  return getGlobalFactVerifier().verify(text);
}

export function extractClaims(text: string): Claim[] {
  return getGlobalFactVerifier().extractClaims(text);
}
