/**
 * Model Router Types
 * Smart routing based on cost, quality, and latency
 */

import type { LLMProvider, LLMModel, RanaChatRequest, RanaChatResponse } from '../types';

// ============================================================================
// Routing Strategy Types
// ============================================================================

export type RoutingStrategy =
  | 'cost-optimized'      // Cheapest model that meets quality threshold
  | 'quality-optimized'   // Best quality within budget
  | 'latency-optimized'   // Fastest response time
  | 'balanced'            // Balance of all factors
  | 'adaptive'            // Learn from past requests
  | 'round-robin'         // Distribute load evenly
  | 'weighted'            // Custom weight distribution
  | 'capability-match';   // Match model to task requirements

export type TaskType =
  | 'chat'
  | 'code'
  | 'analysis'
  | 'creative'
  | 'summarization'
  | 'translation'
  | 'extraction'
  | 'classification'
  | 'reasoning'
  | 'math'
  | 'vision'
  | 'function-calling';

export type QualityTier = 'economy' | 'standard' | 'premium' | 'enterprise';

// ============================================================================
// Model Capability Types
// ============================================================================

export interface ModelCapabilities {
  /** Maximum context window in tokens */
  contextWindow: number;
  /** Maximum output tokens */
  maxOutput: number;
  /** Supports vision/image input */
  vision: boolean;
  /** Supports function/tool calling */
  functionCalling: boolean;
  /** Supports JSON mode */
  jsonMode: boolean;
  /** Supports streaming */
  streaming: boolean;
  /** Supports system messages */
  systemMessage: boolean;
  /** Languages supported */
  languages: string[];
  /** Task specializations */
  specializations: TaskType[];
  /** Quality tier */
  qualityTier: QualityTier;
}

export interface ModelMetrics {
  /** Average latency in ms */
  avgLatency: number;
  /** P95 latency in ms */
  p95Latency: number;
  /** P99 latency in ms */
  p99Latency: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average quality score (0-1) */
  avgQuality: number;
  /** Tokens per second */
  tokensPerSecond: number;
  /** Time to first token in ms */
  timeToFirstToken: number;
  /** Total requests made */
  totalRequests: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

export interface ModelPricing {
  /** Cost per 1K input tokens in USD */
  inputPer1k: number;
  /** Cost per 1K output tokens in USD */
  outputPer1k: number;
  /** Cost per image (if vision) */
  perImage?: number;
  /** Batch discount percentage */
  batchDiscount?: number;
  /** Cached input discount */
  cachedInputDiscount?: number;
}

export interface ModelDefinition {
  /** Provider ID */
  provider: LLMProvider;
  /** Model ID */
  model: LLMModel;
  /** Display name */
  displayName: string;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Pricing information */
  pricing: ModelPricing;
  /** Live metrics (updated at runtime) */
  metrics?: ModelMetrics;
  /** Whether model is currently available */
  available: boolean;
  /** Deprecation date if any */
  deprecationDate?: Date;
  /** Replacement model if deprecated */
  replacementModel?: string;
}

// ============================================================================
// Routing Configuration Types
// ============================================================================

export interface RoutingConstraints {
  /** Maximum cost per request */
  maxCostPerRequest?: number;
  /** Maximum latency in ms */
  maxLatency?: number;
  /** Minimum quality score (0-1) */
  minQuality?: number;
  /** Required capabilities */
  requiredCapabilities?: Partial<ModelCapabilities>;
  /** Preferred providers (in order) */
  preferredProviders?: LLMProvider[];
  /** Excluded providers */
  excludedProviders?: LLMProvider[];
  /** Preferred models (in order) */
  preferredModels?: string[];
  /** Excluded models */
  excludedModels?: string[];
  /** Task type for capability matching */
  taskType?: TaskType;
  /** Minimum context window needed */
  minContextWindow?: number;
  /** Required features */
  requiredFeatures?: ('vision' | 'functionCalling' | 'jsonMode' | 'streaming')[];
}

export interface RoutingWeights {
  /** Weight for cost optimization (0-1) */
  cost: number;
  /** Weight for quality optimization (0-1) */
  quality: number;
  /** Weight for latency optimization (0-1) */
  latency: number;
  /** Weight for reliability (0-1) */
  reliability: number;
}

export interface RoutingRule {
  /** Rule name */
  name: string;
  /** Condition to match */
  condition: (request: RanaChatRequest) => boolean;
  /** Target model or routing strategy */
  target: {
    provider?: LLMProvider;
    model?: LLMModel;
    strategy?: RoutingStrategy;
    constraints?: RoutingConstraints;
  };
  /** Rule priority (higher = checked first) */
  priority: number;
  /** Whether rule is enabled */
  enabled: boolean;
}

export interface LoadBalancerConfig {
  /** Load balancing algorithm */
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  /** Health check interval in ms */
  healthCheckInterval: number;
  /** Weights for weighted algorithm */
  weights?: Record<string, number>;
  /** Sticky sessions based on user ID */
  stickySession?: boolean;
  /** Session TTL in seconds */
  sessionTTL?: number;
}

// ============================================================================
// Router Configuration
// ============================================================================

export interface ModelRouterConfig {
  /** Default routing strategy */
  defaultStrategy: RoutingStrategy;
  /** Default weights for balanced routing */
  defaultWeights?: RoutingWeights;
  /** Default constraints */
  defaultConstraints?: RoutingConstraints;
  /** Custom routing rules */
  rules?: RoutingRule[];
  /** Model registry (custom models) */
  customModels?: ModelDefinition[];
  /** Load balancer configuration */
  loadBalancer?: LoadBalancerConfig;
  /** Enable adaptive learning */
  adaptiveLearning?: boolean;
  /** Minimum sample size for adaptive routing */
  adaptiveMinSamples?: number;
  /** Enable prompt optimization per model */
  promptOptimization?: boolean;
  /** Enable automatic fallback on failure */
  autoFallback?: boolean;
  /** Fallback chain */
  fallbackChain?: string[];
  /** Cache routing decisions */
  cacheDecisions?: boolean;
  /** Decision cache TTL in seconds */
  decisionCacheTTL?: number;
  /** Enable metrics collection */
  collectMetrics?: boolean;
  /** Metrics export interval in ms */
  metricsExportInterval?: number;
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// Routing Result Types
// ============================================================================

export interface RoutingDecision {
  /** Selected provider */
  provider: LLMProvider;
  /** Selected model */
  model: LLMModel;
  /** Model definition */
  modelDefinition: ModelDefinition;
  /** Routing strategy used */
  strategy: RoutingStrategy;
  /** Rule that matched (if any) */
  matchedRule?: string;
  /** Estimated cost */
  estimatedCost: number;
  /** Estimated latency */
  estimatedLatency: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative options considered */
  alternatives: Array<{
    provider: LLMProvider;
    model: LLMModel;
    score: number;
    reason: string;
  }>;
  /** Reasoning for decision */
  reasoning: string;
  /** Timestamp */
  timestamp: Date;
}

export interface RoutingFeedback {
  /** Decision ID */
  decisionId: string;
  /** Actual cost */
  actualCost: number;
  /** Actual latency */
  actualLatency: number;
  /** Quality score (optional, from user feedback or auto-eval) */
  qualityScore?: number;
  /** Success or failure */
  success: boolean;
  /** Error if failed */
  error?: string;
  /** Timestamp */
  timestamp: Date;
}

// ============================================================================
// Model Registry Types
// ============================================================================

export interface ModelRegistry {
  /** Get all available models */
  getModels(): ModelDefinition[];
  /** Get model by provider and ID */
  getModel(provider: LLMProvider, model: LLMModel): ModelDefinition | undefined;
  /** Get models by provider */
  getModelsByProvider(provider: LLMProvider): ModelDefinition[];
  /** Get models by capability */
  getModelsByCapability(capability: keyof ModelCapabilities): ModelDefinition[];
  /** Get models by task type */
  getModelsByTask(task: TaskType): ModelDefinition[];
  /** Get models by quality tier */
  getModelsByTier(tier: QualityTier): ModelDefinition[];
  /** Register custom model */
  registerModel(model: ModelDefinition): void;
  /** Update model metrics */
  updateMetrics(provider: LLMProvider, model: LLMModel, metrics: Partial<ModelMetrics>): void;
  /** Check model availability */
  isAvailable(provider: LLMProvider, model: LLMModel): boolean;
  /** Get cheapest model for task */
  getCheapest(constraints?: RoutingConstraints): ModelDefinition | undefined;
  /** Get fastest model for task */
  getFastest(constraints?: RoutingConstraints): ModelDefinition | undefined;
  /** Get highest quality model for task */
  getBestQuality(constraints?: RoutingConstraints): ModelDefinition | undefined;
}

// ============================================================================
// Adaptive Learning Types
// ============================================================================

export interface AdaptiveMetrics {
  /** Request fingerprint (hashed) */
  fingerprint: string;
  /** Model used */
  model: string;
  /** Success rate for this pattern */
  successRate: number;
  /** Average quality for this pattern */
  avgQuality: number;
  /** Average cost for this pattern */
  avgCost: number;
  /** Average latency for this pattern */
  avgLatency: number;
  /** Sample count */
  sampleCount: number;
  /** Last updated */
  lastUpdated: Date;
}

export interface AdaptiveLearner {
  /** Record request outcome */
  recordOutcome(
    request: RanaChatRequest,
    response: RanaChatResponse,
    feedback?: RoutingFeedback
  ): void;
  /** Get best model for request pattern */
  getBestModel(request: RanaChatRequest): string | undefined;
  /** Get metrics for request pattern */
  getMetrics(request: RanaChatRequest): AdaptiveMetrics | undefined;
  /** Clear learning data */
  reset(): void;
  /** Export learning data */
  export(): AdaptiveMetrics[];
  /** Import learning data */
  import(data: AdaptiveMetrics[]): void;
}
