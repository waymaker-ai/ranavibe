/**
 * Assertions Index
 * Export all AI-native assertions
 */

// Semantic assertions
export {
  cosineSimilarity,
  getEmbedding,
  semanticSimilarity,
  assertSemanticMatch,
  assertSemanticSnapshot,
  clearEmbeddingCache,
  getEmbeddingCacheStats,
} from './semantic';

// Cost assertions
export {
  MODEL_PRICING,
  startCostTracking,
  recordUsage,
  getCurrentCost,
  endCostTracking,
  calculateCost,
  predictCost,
  assertCostLessThan,
  assertTokensLessThan,
  formatCost,
  formatTokens,
  suggestCheaperModel,
} from './cost';

// Regression assertions
export {
  evaluateQuality,
  loadBaseline,
  saveBaseline,
  assertPassesRegression,
  compareVersions,
  listBaselines,
  deleteBaseline,
} from './regression';
export type { QualityMetrics, Baseline } from './regression';

// Statistical assertions
export {
  runTimes,
  runTimesParallel,
  mode,
  mean,
  standardDeviation,
  matchPercentage,
  assertMostlyBe,
  assertLowVariance,
  assertConsistent,
  chiSquaredTest,
  assertDistribution,
} from './statistical';
