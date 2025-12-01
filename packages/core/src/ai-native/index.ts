/**
 * AI-Native Features
 *
 * Advanced capabilities for production AI applications:
 * - Automatic prompt optimization
 * - Hallucination detection
 * - Confidence scoring
 * - Fact verification
 * - Response quality scoring
 */

// ============================================================================
// Prompt Optimizer
// ============================================================================

export {
  PromptOptimizer,
  createPromptOptimizer,
  getGlobalOptimizer,
  optimizePrompt,
  compressPrompt,
} from './prompt-optimizer';

export type {
  OptimizationStrategy,
  OptimizationGoal,
  OptimizationResult,
  FewShotExample,
  PromptTemplate,
  PromptVersion,
  PromptOptimizerConfig,
} from './prompt-optimizer';

// ============================================================================
// Hallucination Detector
// ============================================================================

export {
  HallucinationDetector,
  createHallucinationDetector,
  getGlobalHallucinationDetector,
  detectHallucinations,
  hasHallucinations,
} from './hallucination-detector';

export type {
  HallucinationType,
  SeverityLevel,
  HallucinationInstance,
  HallucinationResult,
  GroundingContext,
  EntityInfo,
  HallucinationDetectorConfig,
} from './hallucination-detector';

// ============================================================================
// Confidence Scorer
// ============================================================================

export {
  ConfidenceScorer,
  createConfidenceScorer,
  getGlobalConfidenceScorer,
  scoreConfidence,
  isConfident,
} from './confidence-scorer';

export type {
  ConfidenceLevel,
  ConfidenceScore,
  ConfidenceFactor,
  ConsistencyCheckResult,
  ConfidenceScorerConfig,
} from './confidence-scorer';

// ============================================================================
// Fact Verifier
// ============================================================================

export {
  FactVerifier,
  createFactVerifier,
  getGlobalFactVerifier,
  verifyFacts,
  extractClaims,
} from './fact-verifier';

export type {
  ClaimType,
  VerificationStatus,
  Claim,
  VerificationSource,
  VerificationEvidence,
  ClaimVerification,
  VerificationResult,
  KnowledgeEntry,
  FactVerifierConfig,
} from './fact-verifier';

// ============================================================================
// Quality Scorer
// ============================================================================

export {
  QualityScorer,
  createQualityScorer,
  getGlobalQualityScorer,
  scoreQuality,
  getQualityLevel,
} from './quality-scorer';

export type {
  QualityDimension,
  QualityLevel,
  QualityScore,
  QualityEvaluation,
  QualityScorerConfig,
} from './quality-scorer';

// ============================================================================
// Combined Analysis
// ============================================================================

import { HallucinationResult, detectHallucinations, GroundingContext } from './hallucination-detector';
import { ConfidenceScore, scoreConfidence } from './confidence-scorer';
import { VerificationResult, verifyFacts } from './fact-verifier';
import { QualityScore, scoreQuality } from './quality-scorer';

export interface ComprehensiveAnalysis {
  hallucinations: HallucinationResult;
  confidence: ConfidenceScore;
  verification: VerificationResult;
  quality: QualityScore;
  overallScore: number;
  summary: string;
  recommendations: string[];
}

/**
 * Perform comprehensive analysis of an LLM response
 */
export async function analyzeResponse(
  response: string,
  options?: {
    query?: string;
    context?: GroundingContext;
    samples?: string[];
  }
): Promise<ComprehensiveAnalysis> {
  // Run all analyses in parallel
  const [hallucinations, confidence, verification, quality] = await Promise.all([
    Promise.resolve(detectHallucinations(response, options?.context)),
    Promise.resolve(scoreConfidence(response, { context: options?.query, samples: options?.samples })),
    verifyFacts(response),
    Promise.resolve(scoreQuality(response, options?.query)),
  ]);

  // Calculate overall score (weighted combination)
  const weights = {
    hallucinations: 0.25,
    confidence: 0.2,
    verification: 0.25,
    quality: 0.3,
  };

  const hallucinationScore = 1 - hallucinations.overallScore;
  const verificationScore = verification.overallReliability;

  const overallScore =
    hallucinationScore * weights.hallucinations +
    confidence.overall * weights.confidence +
    verificationScore * weights.verification +
    quality.overall * weights.quality;

  // Generate recommendations
  const recommendations: string[] = [];

  if (hallucinations.hasHallucinations) {
    recommendations.push(
      `Address ${hallucinations.summary.totalInstances} potential hallucination(s)`
    );
  }

  if (confidence.overall < 0.5) {
    recommendations.push(...confidence.recommendations);
  }

  if (verification.falseClaims > 0) {
    recommendations.push(`Correct ${verification.falseClaims} false claim(s)`);
  }

  if (quality.overall < 0.6) {
    recommendations.push(...quality.suggestions);
  }

  // Generate summary
  const summary = generateComprehensiveSummary({
    hallucinationScore,
    confidence: confidence.overall,
    verificationScore,
    quality: quality.overall,
    overallScore,
  });

  return {
    hallucinations,
    confidence,
    verification,
    quality,
    overallScore,
    summary,
    recommendations,
  };
}

function generateComprehensiveSummary(scores: {
  hallucinationScore: number;
  confidence: number;
  verificationScore: number;
  quality: number;
  overallScore: number;
}): string {
  const parts: string[] = [];

  // Overall assessment
  if (scores.overallScore >= 0.8) {
    parts.push('Response quality is excellent.');
  } else if (scores.overallScore >= 0.6) {
    parts.push('Response quality is good with minor issues.');
  } else if (scores.overallScore >= 0.4) {
    parts.push('Response quality is fair but has notable issues.');
  } else {
    parts.push('Response quality is poor and needs significant improvement.');
  }

  // Specific assessments
  if (scores.hallucinationScore < 0.7) {
    parts.push('Potential hallucinations detected.');
  }

  if (scores.confidence < 0.5) {
    parts.push('Response shows low confidence.');
  }

  if (scores.verificationScore < 0.5) {
    parts.push('Some claims could not be verified.');
  }

  return parts.join(' ');
}

// ============================================================================
// Quick Checks
// ============================================================================

/**
 * Quick check if response is trustworthy
 */
export function isTrustworthy(
  response: string,
  threshold = 0.6
): boolean {
  const hallucinations = detectHallucinations(response);
  const confidence = scoreConfidence(response);

  return (
    !hallucinations.hasHallucinations &&
    confidence.overall >= threshold
  );
}

/**
 * Quick quality check
 */
export function isQualityResponse(
  response: string,
  query?: string,
  threshold = 0.6
): boolean {
  const quality = scoreQuality(response, query);
  return quality.overall >= threshold;
}
