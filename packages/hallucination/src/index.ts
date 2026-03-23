/**
 * @waymakerai/aicofounder-hallucination - Hallucination Detection
 *
 * Checks LLM outputs against source documents for factual grounding.
 * Uses claim extraction, TF-IDF-like text overlap scoring, and token similarity
 * to determine whether a response is grounded in provided sources.
 */

import type {
  Source,
  Claim,
  ClaimType,
  ClaimVerification,
  SourceMatch,
  HallucinationResult,
  HallucinationConfig,
} from './types';

// Re-export types
export type {
  Source,
  Claim,
  ClaimType,
  ClaimVerification,
  SourceMatch,
  HallucinationResult,
  HallucinationConfig,
} from './types';

// ---------------------------------------------------------------------------
// Stopwords for TF-IDF
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'because', 'but', 'and', 'or', 'if', 'while', 'although', 'this',
  'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'about', 'also',
]);

// ---------------------------------------------------------------------------
// Sentence / claim classification patterns
// ---------------------------------------------------------------------------

const OPINION_INDICATORS = [
  /\bi\s+(?:think|believe|feel|guess|suppose|imagine|reckon)\b/i,
  /\bin\s+my\s+(?:opinion|view|experience)\b/i,
  /\bit\s+seems?\s+(?:like|that|to)\b/i,
  /\bpersonally\b/i,
  /\bprobably\b/i,
  /\bperhaps\b/i,
  /\bmight\s+be\b/i,
  /\bcould\s+be\b/i,
  /\bsubjectively\b/i,
];

const META_INDICATORS = [
  /\bbased\s+on\s+(?:the|my)\s+(?:information|knowledge|sources?)\b/i,
  /\baccording\s+to\s+(?:the|my)\b/i,
  /\bas\s+(?:mentioned|stated|described)\b/i,
  /\bI(?:'m|\s+am)\s+(?:sorry|unable|not\s+(?:able|sure))\b/i,
  /\bI\s+(?:can't|cannot|don't)\b/i,
  /\blet\s+me\s+(?:know|explain|clarify)\b/i,
  /\bhere(?:'s|\s+is)\s+(?:a|the|my)\b/i,
];

const QUANTITATIVE_INDICATORS = [
  /\b\d+(?:\.\d+)?%/,
  /\b\d{4}\b/,  // years
  /\$\d+/,
  /\b\d+(?:\.\d+)?\s+(?:million|billion|trillion|thousand|hundred)\b/i,
  /\b(?:approximately|about|roughly|nearly|over|under)\s+\d+/i,
];

const ATTRIBUTION_INDICATORS = [
  /\baccording\s+to\b/i,
  /\b\w+\s+(?:said|stated|claimed|argued|wrote|reported|found|discovered|showed)\b/i,
  /\bresearch(?:ers)?\s+(?:at|from|by)\b/i,
  /\bstudy\s+(?:by|from|published)\b/i,
];

const CAUSAL_INDICATORS = [
  /\bbecause\b/i,
  /\b(?:caused|leads?\s+to|results?\s+in|due\s+to)\b/i,
  /\bas\s+a\s+result\b/i,
  /\btherefore\b/i,
  /\bconsequently\b/i,
];

const COMPARATIVE_INDICATORS = [
  /\bmore\s+\w+\s+than\b/i,
  /\bless\s+\w+\s+than\b/i,
  /\b(?:better|worse|larger|smaller|faster|slower)\s+than\b/i,
  /\bcompared\s+to\b/i,
  /\bunlike\b/i,
  /\bsimilar\s+to\b/i,
];

const PROCEDURAL_INDICATORS = [
  /\bfirst(?:ly)?,?\s+/i,
  /\bstep\s+\d+/i,
  /\bto\s+do\s+this\b/i,
  /\bthe\s+process\s+(?:of|involves)\b/i,
  /\byou\s+(?:need|should|must|can)\s+/i,
];

const DEFINITIONAL_INDICATORS = [
  /\bis\s+(?:defined\s+as|a\s+type\s+of|a\s+kind\s+of|known\s+as)\b/i,
  /\brefers?\s+to\b/i,
  /\bmeans?\s+(?:that|the)\b/i,
  /\bis\s+(?:an?|the)\s+\w+\s+(?:that|which|where)\b/i,
];

// ---------------------------------------------------------------------------
// Tokenization utilities
// ---------------------------------------------------------------------------

/**
 * Tokenize text into lowercase words, removing punctuation and stopwords
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Compute term frequency map
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  // Normalize by max frequency
  const maxFreq = Math.max(...tf.values(), 1);
  for (const [token, count] of tf) {
    tf.set(token, count / maxFreq);
  }
  return tf;
}

/**
 * Build IDF from a set of documents (each document is a string)
 */
function buildIDF(documents: string[]): Map<string, number> {
  const docCount = documents.length;
  const df = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTokens = new Set(tokenize(doc));
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, count] of df) {
    idf.set(token, Math.log((docCount + 1) / (count + 1)) + 1);
  }

  return idf;
}

/**
 * Split text into overlapping chunks
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  if (text.length <= chunkSize) {
    chunks.push(text);
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Compute TF-IDF weighted overlap score between claim tokens and source tokens
 */
function tfidfOverlap(
  claimTokens: string[],
  sourceTokens: string[],
  idf: Map<string, number>
): number {
  if (claimTokens.length === 0 || sourceTokens.length === 0) return 0;

  const sourceSet = new Set(sourceTokens);
  const claimTF = termFrequency(claimTokens);

  let weightedOverlap = 0;
  let totalWeight = 0;

  for (const [token, tf] of claimTF) {
    const tokenIdf = idf.get(token) ?? 1;
    const weight = tf * tokenIdf;
    totalWeight += weight;

    if (sourceSet.has(token)) {
      weightedOverlap += weight;
    }
  }

  return totalWeight > 0 ? weightedOverlap / totalWeight : 0;
}

/**
 * Compute token-level similarity using bigrams (Dice coefficient)
 */
function tokenSimilarity(text1: string, text2: string): number {
  const bigrams1 = getBigrams(text1.toLowerCase());
  const bigrams2 = getBigrams(text2.toLowerCase());

  if (bigrams1.size === 0 || bigrams2.size === 0) return 0;

  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  }

  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}

function getBigrams(text: string): Set<string> {
  const tokens = tokenize(text);
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

// ---------------------------------------------------------------------------
// Sentence splitting
// ---------------------------------------------------------------------------

/**
 * Split text into sentences using boundary detection
 */
function splitSentences(text: string): string[] {
  // Handle common abbreviations to avoid false splits
  const protected_ = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g)\./gi, '$1\u0000')
    .replace(/(\d)\./g, '$1\u0001');

  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z"])/);

  return raw
    .map(s => s.replace(/\u0000/g, '.').replace(/\u0001/g, '.').trim())
    .filter(s => s.length > 0);
}

// ---------------------------------------------------------------------------
// Claim classification
// ---------------------------------------------------------------------------

function classifyClaim(sentence: string): { type: ClaimType; isFactual: boolean } {
  // Check question
  if (/\?\s*$/.test(sentence)) {
    return { type: 'meta', isFactual: false };
  }

  // Check meta statements
  for (const pattern of META_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'meta', isFactual: false };
    }
  }

  // Check opinion
  for (const pattern of OPINION_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'opinion', isFactual: false };
    }
  }

  // Check factual subtypes
  for (const pattern of ATTRIBUTION_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'attribution', isFactual: true };
    }
  }

  for (const pattern of QUANTITATIVE_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'quantitative', isFactual: true };
    }
  }

  for (const pattern of CAUSAL_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'causal', isFactual: true };
    }
  }

  for (const pattern of COMPARATIVE_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'comparative', isFactual: true };
    }
  }

  for (const pattern of PROCEDURAL_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'procedural', isFactual: true };
    }
  }

  for (const pattern of DEFINITIONAL_INDICATORS) {
    if (pattern.test(sentence)) {
      return { type: 'definitional', isFactual: true };
    }
  }

  // Default: factual statement
  return { type: 'factual', isFactual: true };
}

// ---------------------------------------------------------------------------
// HallucinationDetector
// ---------------------------------------------------------------------------

export class HallucinationDetector {
  private config: Required<Omit<HallucinationConfig, 'idfCorpus'>> & {
    idfCorpus?: Map<string, number>;
  };

  constructor(config?: HallucinationConfig) {
    this.config = {
      groundingThreshold: config?.groundingThreshold ?? 0.7,
      supportThreshold: config?.supportThreshold ?? 0.3,
      strongSupportThreshold: config?.strongSupportThreshold ?? 0.6,
      skipNonFactual: config?.skipNonFactual ?? true,
      maxChunksPerClaim: config?.maxChunksPerClaim ?? 50,
      chunkSize: config?.chunkSize ?? 500,
      chunkOverlap: config?.chunkOverlap ?? 100,
      overlapWeight: config?.overlapWeight ?? 0.6,
      similarityWeight: config?.similarityWeight ?? 0.4,
      minClaimLength: config?.minClaimLength ?? 10,
      idfCorpus: config?.idfCorpus,
    };
  }

  /**
   * Check if a response is grounded in the provided sources
   */
  check(response: string, sources: Source[]): HallucinationResult {
    if (!response || response.trim().length === 0) {
      return {
        groundingScore: 1,
        grounded: true,
        totalClaims: 0,
        factualClaims: 0,
        supportedClaims: 0,
        unsupportedClaims: 0,
        partiallySupportedClaims: 0,
        claims: [],
        ungroundedClaims: [],
        summary: 'Empty response — no claims to verify.',
      };
    }

    if (sources.length === 0) {
      const claims = this.extractClaims(response);
      const factualClaims = claims.filter(c => c.isFactual);
      const verifications: ClaimVerification[] = factualClaims.map(claim => ({
        claim,
        supported: false,
        confidence: 0,
        sourceMatches: [],
        reason: 'No sources provided for verification.',
      }));

      return {
        groundingScore: 0,
        grounded: false,
        totalClaims: claims.length,
        factualClaims: factualClaims.length,
        supportedClaims: 0,
        unsupportedClaims: factualClaims.length,
        partiallySupportedClaims: 0,
        claims: verifications,
        ungroundedClaims: verifications,
        summary: `No sources provided. ${factualClaims.length} factual claims cannot be verified.`,
      };
    }

    // Extract and verify claims
    const claims = this.extractClaims(response);
    const factualClaims = this.config.skipNonFactual
      ? claims.filter(c => c.isFactual)
      : claims;

    // Build IDF from source corpus
    const allSourceTexts = sources.map(s => s.content);
    const idf = this.config.idfCorpus ?? buildIDF(allSourceTexts);

    // Chunk sources
    const sourceChunks: Array<{ source: Source; chunk: string }> = [];
    for (const source of sources) {
      const chunks = chunkText(
        source.content,
        this.config.chunkSize,
        this.config.chunkOverlap
      );
      for (const chunk of chunks) {
        sourceChunks.push({ source, chunk });
        if (sourceChunks.length >= this.config.maxChunksPerClaim * sources.length) {
          break;
        }
      }
    }

    // Verify each claim
    const verifications: ClaimVerification[] = factualClaims.map(claim =>
      this.verifyClaim(claim, sources, sourceChunks, idf)
    );

    // Compute grounding score
    let supportedCount = 0;
    let partialCount = 0;
    let unsupportedCount = 0;

    for (const v of verifications) {
      if (v.supported && v.confidence >= this.config.strongSupportThreshold) {
        supportedCount++;
      } else if (v.supported) {
        partialCount++;
      } else {
        unsupportedCount++;
      }
    }

    const totalFactual = verifications.length;
    const groundingScore = totalFactual > 0
      ? (supportedCount + partialCount * 0.5) / totalFactual
      : 1;  // No factual claims means nothing to ground

    const ungroundedClaims = verifications.filter(v => !v.supported);

    const grounded = groundingScore >= this.config.groundingThreshold;

    // Build summary
    const summaryParts: string[] = [];
    summaryParts.push(`${claims.length} claims extracted (${factualClaims.length} factual).`);
    summaryParts.push(`${supportedCount} fully supported, ${partialCount} partially supported, ${unsupportedCount} unsupported.`);
    summaryParts.push(`Grounding score: ${(groundingScore * 100).toFixed(1)}% (threshold: ${(this.config.groundingThreshold * 100).toFixed(1)}%).`);
    if (!grounded && ungroundedClaims.length > 0) {
      summaryParts.push(`Ungrounded claims: ${ungroundedClaims.map(c => `"${c.claim.text.slice(0, 60)}..."`).join('; ')}`);
    }

    return {
      groundingScore,
      grounded,
      totalClaims: claims.length,
      factualClaims: factualClaims.length,
      supportedClaims: supportedCount,
      unsupportedClaims: unsupportedCount,
      partiallySupportedClaims: partialCount,
      claims: verifications,
      ungroundedClaims,
      summary: summaryParts.join(' '),
    };
  }

  /**
   * Extract claims from a response text
   */
  extractClaims(text: string): Claim[] {
    const sentences = splitSentences(text);
    const claims: Claim[] = [];
    let currentOffset = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length < this.config.minClaimLength) {
        currentOffset = text.indexOf(sentence, currentOffset);
        if (currentOffset === -1) currentOffset = 0;
        currentOffset += sentence.length;
        continue;
      }

      const startOffset = text.indexOf(sentence, currentOffset);
      const endOffset = startOffset !== -1 ? startOffset + sentence.length : currentOffset + sentence.length;

      const { type, isFactual } = classifyClaim(sentence);

      claims.push({
        text: sentence,
        sentenceIndex: i,
        startOffset: startOffset !== -1 ? startOffset : currentOffset,
        endOffset,
        isFactual,
        type,
      });

      currentOffset = endOffset;
    }

    return claims;
  }

  /**
   * Verify a single claim against sources
   */
  verifyClaim(
    claim: Claim,
    sources: Source[],
    precomputedChunks?: Array<{ source: Source; chunk: string }>,
    precomputedIdf?: Map<string, number>
  ): ClaimVerification {
    const claimTokens = tokenize(claim.text);

    if (claimTokens.length === 0) {
      return {
        claim,
        supported: false,
        confidence: 0,
        sourceMatches: [],
        reason: 'Claim has no meaningful tokens after stopword removal.',
      };
    }

    // Build chunks if not provided
    const chunks = precomputedChunks ?? this.buildChunks(sources);
    const idf = precomputedIdf ?? buildIDF(sources.map(s => s.content));

    // Score each chunk
    const matches: SourceMatch[] = [];

    const chunksToCheck = chunks.slice(0, this.config.maxChunksPerClaim);

    for (const { source, chunk } of chunksToCheck) {
      const chunkTokens = tokenize(chunk);
      const overlap = tfidfOverlap(claimTokens, chunkTokens, idf);
      const similarity = tokenSimilarity(claim.text, chunk);

      const combined =
        this.config.overlapWeight * overlap +
        this.config.similarityWeight * similarity;

      if (combined > 0.05) {  // minimum threshold to be considered
        matches.push({
          source,
          passage: chunk,
          overlapScore: overlap,
          tokenSimilarity: similarity,
          combinedScore: combined,
        });
      }
    }

    // Sort by combined score
    matches.sort((a, b) => b.combinedScore - a.combinedScore);

    const topMatches = matches.slice(0, 5);
    const bestMatch = topMatches[0];

    if (!bestMatch || bestMatch.combinedScore < this.config.supportThreshold) {
      return {
        claim,
        supported: false,
        confidence: bestMatch ? bestMatch.combinedScore : 0,
        bestSource: bestMatch,
        sourceMatches: topMatches,
        reason: bestMatch
          ? `Best match score ${(bestMatch.combinedScore * 100).toFixed(1)}% is below support threshold ${(this.config.supportThreshold * 100).toFixed(1)}%.`
          : 'No relevant source passages found.',
      };
    }

    const supported = true;
    const isStrong = bestMatch.combinedScore >= this.config.strongSupportThreshold;

    return {
      claim,
      supported,
      confidence: bestMatch.combinedScore,
      bestSource: bestMatch,
      sourceMatches: topMatches,
      reason: isStrong
        ? `Strongly supported by source "${bestMatch.source.title ?? bestMatch.source.id}" (score: ${(bestMatch.combinedScore * 100).toFixed(1)}%).`
        : `Partially supported by source "${bestMatch.source.title ?? bestMatch.source.id}" (score: ${(bestMatch.combinedScore * 100).toFixed(1)}%).`,
    };
  }

  private buildChunks(sources: Source[]): Array<{ source: Source; chunk: string }> {
    const chunks: Array<{ source: Source; chunk: string }> = [];
    for (const source of sources) {
      const textChunks = chunkText(
        source.content,
        this.config.chunkSize,
        this.config.chunkOverlap
      );
      for (const chunk of textChunks) {
        chunks.push({ source, chunk });
      }
    }
    return chunks;
  }
}

/**
 * Create a hallucination detector instance
 */
export function createHallucinationDetector(config?: HallucinationConfig): HallucinationDetector {
  return new HallucinationDetector(config);
}

// Utility exports
export { tokenize, splitSentences, buildIDF, tfidfOverlap, tokenSimilarity, chunkText };
