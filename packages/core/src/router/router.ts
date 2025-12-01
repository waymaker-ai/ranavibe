/**
 * Model Router
 * Intelligent routing based on cost, quality, latency, and capabilities
 */

import { EventEmitter } from 'events';
import type { LLMProvider, LLMModel, RanaChatRequest, RanaChatResponse } from '../types';
import type {
  ModelRouterConfig,
  RoutingStrategy,
  RoutingDecision,
  RoutingConstraints,
  RoutingWeights,
  RoutingRule,
  RoutingFeedback,
  ModelDefinition,
  ModelRegistry,
  AdaptiveLearner,
  AdaptiveMetrics,
  TaskType,
  LoadBalancerConfig,
} from './types';
import { DefaultModelRegistry, createModelRegistry } from './registry';

// ============================================================================
// Adaptive Learner Implementation
// ============================================================================

class DefaultAdaptiveLearner implements AdaptiveLearner {
  private metrics: Map<string, AdaptiveMetrics> = new Map();
  private minSamples: number;

  constructor(minSamples: number = 10) {
    this.minSamples = minSamples;
  }

  private getFingerprint(request: RanaChatRequest): string {
    // Create a fingerprint based on request characteristics
    const characteristics = {
      messageCount: request.messages.length,
      hasTools: !!request.tools?.length,
      hasImages: request.messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || c.type === 'image')
      ),
      avgMessageLength: request.messages.reduce((acc, m) => {
        const len = typeof m.content === 'string' ? m.content.length : 100;
        return acc + len;
      }, 0) / request.messages.length,
      optimize: request.optimize,
    };

    // Simple hash
    return Buffer.from(JSON.stringify(characteristics)).toString('base64').slice(0, 16);
  }

  recordOutcome(
    request: RanaChatRequest,
    response: RanaChatResponse,
    feedback?: RoutingFeedback
  ): void {
    const fingerprint = this.getFingerprint(request);
    const modelKey = `${response.provider}:${response.model}`;
    const key = `${fingerprint}:${modelKey}`;

    const existing = this.metrics.get(key);
    const quality = feedback?.qualityScore ?? 0.8;
    const success = feedback?.success ?? true;

    if (existing) {
      // Update running averages
      const n = existing.sampleCount;
      existing.successRate = (existing.successRate * n + (success ? 1 : 0)) / (n + 1);
      existing.avgQuality = (existing.avgQuality * n + quality) / (n + 1);
      existing.avgCost = (existing.avgCost * n + response.cost.total_cost) / (n + 1);
      existing.avgLatency = (existing.avgLatency * n + response.latency_ms) / (n + 1);
      existing.sampleCount = n + 1;
      existing.lastUpdated = new Date();
    } else {
      this.metrics.set(key, {
        fingerprint,
        model: modelKey,
        successRate: success ? 1 : 0,
        avgQuality: quality,
        avgCost: response.cost.total_cost,
        avgLatency: response.latency_ms,
        sampleCount: 1,
        lastUpdated: new Date(),
      });
    }
  }

  getBestModel(request: RanaChatRequest): string | undefined {
    const fingerprint = this.getFingerprint(request);

    // Find all metrics for this fingerprint pattern
    const candidates: AdaptiveMetrics[] = [];
    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(fingerprint) && metrics.sampleCount >= this.minSamples) {
        candidates.push(metrics);
      }
    }

    if (candidates.length === 0) return undefined;

    // Score each candidate (higher is better)
    const scored = candidates.map(m => ({
      model: m.model,
      score: m.successRate * 0.4 + m.avgQuality * 0.3 + (1 - m.avgCost) * 0.2 + (1 - m.avgLatency / 10000) * 0.1,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.model;
  }

  getMetrics(request: RanaChatRequest): AdaptiveMetrics | undefined {
    const fingerprint = this.getFingerprint(request);

    // Get metrics for the best model
    const bestModel = this.getBestModel(request);
    if (!bestModel) return undefined;

    return this.metrics.get(`${fingerprint}:${bestModel}`);
  }

  reset(): void {
    this.metrics.clear();
  }

  export(): AdaptiveMetrics[] {
    return Array.from(this.metrics.values());
  }

  import(data: AdaptiveMetrics[]): void {
    for (const metrics of data) {
      this.metrics.set(`${metrics.fingerprint}:${metrics.model}`, metrics);
    }
  }
}

// ============================================================================
// Load Balancer Implementation
// ============================================================================

class LoadBalancer {
  private config: LoadBalancerConfig;
  private roundRobinIndex: number = 0;
  private connections: Map<string, number> = new Map();
  private sessions: Map<string, { model: string; expires: number }> = new Map();

  constructor(config: LoadBalancerConfig) {
    this.config = config;
  }

  getNext(models: ModelDefinition[], userId?: string): ModelDefinition | undefined {
    if (models.length === 0) return undefined;

    // Sticky session
    if (this.config.stickySession && userId) {
      const session = this.sessions.get(userId);
      if (session && session.expires > Date.now()) {
        const model = models.find(m => `${m.provider}:${m.model}` === session.model);
        if (model) return model;
      }
    }

    let selected: ModelDefinition | undefined;

    switch (this.config.algorithm) {
      case 'round-robin':
        selected = models[this.roundRobinIndex % models.length];
        this.roundRobinIndex++;
        break;

      case 'least-connections':
        selected = models.reduce((min, m) => {
          const key = `${m.provider}:${m.model}`;
          const connections = this.connections.get(key) || 0;
          const minConnections = this.connections.get(`${min.provider}:${min.model}`) || 0;
          return connections < minConnections ? m : min;
        }, models[0]);
        break;

      case 'weighted':
        if (this.config.weights) {
          const totalWeight = models.reduce((sum, m) => {
            const key = `${m.provider}:${m.model}`;
            return sum + (this.config.weights?.[key] || 1);
          }, 0);
          let random = Math.random() * totalWeight;
          for (const model of models) {
            const key = `${model.provider}:${model.model}`;
            random -= this.config.weights[key] || 1;
            if (random <= 0) {
              selected = model;
              break;
            }
          }
        }
        selected = selected || models[0];
        break;

      case 'random':
      default:
        selected = models[Math.floor(Math.random() * models.length)];
    }

    // Update sticky session
    if (this.config.stickySession && userId && selected) {
      this.sessions.set(userId, {
        model: `${selected.provider}:${selected.model}`,
        expires: Date.now() + (this.config.sessionTTL || 3600) * 1000,
      });
    }

    return selected;
  }

  incrementConnections(provider: LLMProvider, model: LLMModel): void {
    const key = `${provider}:${model}`;
    this.connections.set(key, (this.connections.get(key) || 0) + 1);
  }

  decrementConnections(provider: LLMProvider, model: LLMModel): void {
    const key = `${provider}:${model}`;
    this.connections.set(key, Math.max(0, (this.connections.get(key) || 0) - 1));
  }
}

// ============================================================================
// Model Router Implementation
// ============================================================================

export class ModelRouter extends EventEmitter {
  private config: ModelRouterConfig;
  private registry: ModelRegistry;
  private learner: AdaptiveLearner;
  private loadBalancer: LoadBalancer;
  private decisionCache: Map<string, { decision: RoutingDecision; expires: number }> = new Map();
  private decisionCounter: number = 0;

  constructor(config: ModelRouterConfig, registry?: ModelRegistry) {
    super();
    this.config = this.normalizeConfig(config);
    this.registry = registry || createModelRegistry(config.customModels);
    this.learner = new DefaultAdaptiveLearner(config.adaptiveMinSamples);
    this.loadBalancer = new LoadBalancer(config.loadBalancer || {
      algorithm: 'round-robin',
      healthCheckInterval: 30000,
    });
  }

  private normalizeConfig(config: ModelRouterConfig): ModelRouterConfig {
    return {
      defaultStrategy: config.defaultStrategy || 'balanced',
      defaultWeights: config.defaultWeights || {
        cost: 0.25,
        quality: 0.35,
        latency: 0.25,
        reliability: 0.15,
      },
      defaultConstraints: config.defaultConstraints || {},
      rules: config.rules || [],
      adaptiveLearning: config.adaptiveLearning ?? true,
      adaptiveMinSamples: config.adaptiveMinSamples ?? 10,
      promptOptimization: config.promptOptimization ?? false,
      autoFallback: config.autoFallback ?? true,
      cacheDecisions: config.cacheDecisions ?? true,
      decisionCacheTTL: config.decisionCacheTTL ?? 300,
      collectMetrics: config.collectMetrics ?? true,
      debug: config.debug ?? false,
    };
  }

  /**
   * Map the optimize parameter from RanaChatRequest to RoutingStrategy
   */
  private mapOptimizeToStrategy(optimize?: string): RoutingStrategy {
    if (!optimize) {
      return this.config.defaultStrategy || 'balanced';
    }

    const strategyMap: Record<string, RoutingStrategy> = {
      'cost': 'cost-optimized',
      'speed': 'latency-optimized',
      'quality': 'quality-optimized',
      'cost-optimized': 'cost-optimized',
      'quality-optimized': 'quality-optimized',
      'latency-optimized': 'latency-optimized',
      'balanced': 'balanced',
      'adaptive': 'adaptive',
      'round-robin': 'round-robin',
      'weighted': 'weighted',
      'capability-match': 'capability-match',
    };

    return strategyMap[optimize] || this.config.defaultStrategy || 'balanced';
  }

  /**
   * Route a request to the optimal model
   */
  async route(
    request: RanaChatRequest,
    constraints?: RoutingConstraints
  ): Promise<RoutingDecision> {
    const startTime = Date.now();
    const decisionId = `route-${++this.decisionCounter}-${Date.now()}`;

    // Check cache
    if (this.config.cacheDecisions) {
      const cacheKey = this.getCacheKey(request, constraints);
      const cached = this.decisionCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        this.emit('cache-hit', { decisionId, cacheKey });
        return { ...cached.decision, timestamp: new Date() };
      }
    }

    // Merge constraints
    const mergedConstraints: RoutingConstraints = {
      ...this.config.defaultConstraints,
      ...constraints,
    };

    // Check rules first
    const matchedRule = this.findMatchingRule(request);
    if (matchedRule) {
      const decision = await this.applyRule(request, matchedRule, mergedConstraints);
      this.cacheDecision(request, constraints, decision);
      this.emit('routed', { decisionId, decision, rule: matchedRule.name });
      return decision;
    }

    // Check adaptive learning
    if (this.config.adaptiveLearning) {
      const adaptiveModel = this.learner.getBestModel(request);
      if (adaptiveModel) {
        const [provider, model] = adaptiveModel.split(':') as [LLMProvider, LLMModel];
        const modelDef = this.registry.getModel(provider, model);
        if (modelDef && this.matchesConstraints(modelDef, mergedConstraints)) {
          const strategyToUse = this.mapOptimizeToStrategy(request.optimize);
          const decision = this.createDecision(
            modelDef,
            strategyToUse,
            'adaptive-learning',
            mergedConstraints
          );
          this.cacheDecision(request, constraints, decision);
          this.emit('routed', { decisionId, decision, source: 'adaptive' });
          return decision;
        }
      }
    }

    // Apply routing strategy
    const strategy = this.mapOptimizeToStrategy(request.optimize);
    const decision = await this.applyStrategy(request, strategy, mergedConstraints);

    this.cacheDecision(request, constraints, decision);
    this.emit('routed', {
      decisionId,
      decision,
      duration: Date.now() - startTime,
    });

    return decision;
  }

  /**
   * Record feedback for adaptive learning
   */
  recordFeedback(
    request: RanaChatRequest,
    response: RanaChatResponse,
    feedback?: Partial<RoutingFeedback>
  ): void {
    if (this.config.adaptiveLearning) {
      this.learner.recordOutcome(request, response, {
        decisionId: `feedback-${Date.now()}`,
        actualCost: response.cost.total_cost,
        actualLatency: response.latency_ms,
        qualityScore: feedback?.qualityScore,
        success: feedback?.success ?? true,
        error: feedback?.error,
        timestamp: new Date(),
      });

      // Update registry metrics
      this.registry.updateMetrics(response.provider, response.model, {
        avgLatency: response.latency_ms,
        avgQuality: feedback?.qualityScore,
        totalRequests: 1, // Will be aggregated
      });
    }

    this.emit('feedback', { request, response, feedback });
  }

  /**
   * Get model recommendations for a task
   */
  recommend(
    taskType: TaskType,
    constraints?: RoutingConstraints
  ): ModelDefinition[] {
    const mergedConstraints: RoutingConstraints = {
      ...this.config.defaultConstraints,
      ...constraints,
      taskType,
    };

    const models = this.registry.getModelsByTask(taskType)
      .filter(m => m.available && this.matchesConstraints(m, mergedConstraints));

    // Sort by weighted score
    return this.scoreAndSort(models, this.config.defaultWeights!);
  }

  /**
   * Estimate cost for a request with specific model
   */
  estimateCost(
    request: RanaChatRequest,
    provider: LLMProvider,
    model: LLMModel
  ): number {
    const modelDef = this.registry.getModel(provider, model);
    if (!modelDef) return 0;

    // Estimate tokens
    const inputTokens = request.messages.reduce((acc, m) => {
      const len = typeof m.content === 'string' ? m.content.length : 100;
      return acc + Math.ceil(len / 4); // Rough estimate: 4 chars per token
    }, 0);
    const outputTokens = request.max_tokens || 1000;

    return (
      (inputTokens / 1000) * modelDef.pricing.inputPer1k +
      (outputTokens / 1000) * modelDef.pricing.outputPer1k
    );
  }

  /**
   * Get all available models
   */
  getModels(): ModelDefinition[] {
    return this.registry.getModels();
  }

  /**
   * Get registry
   */
  getRegistry(): ModelRegistry {
    return this.registry;
  }

  /**
   * Add custom routing rule
   */
  addRule(rule: RoutingRule): void {
    this.config.rules = this.config.rules || [];
    this.config.rules.push(rule);
    this.config.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove routing rule
   */
  removeRule(name: string): boolean {
    const index = this.config.rules?.findIndex(r => r.name === name) ?? -1;
    if (index >= 0) {
      this.config.rules!.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Export adaptive learning data
   */
  exportLearningData(): AdaptiveMetrics[] {
    return this.learner.export();
  }

  /**
   * Import adaptive learning data
   */
  importLearningData(data: AdaptiveMetrics[]): void {
    this.learner.import(data);
  }

  /**
   * Reset adaptive learning
   */
  resetLearning(): void {
    this.learner.reset();
  }

  /**
   * Clear decision cache
   */
  clearCache(): void {
    this.decisionCache.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private findMatchingRule(request: RanaChatRequest): RoutingRule | undefined {
    if (!this.config.rules) return undefined;

    for (const rule of this.config.rules) {
      if (rule.enabled && rule.condition(request)) {
        return rule;
      }
    }

    return undefined;
  }

  private async applyRule(
    request: RanaChatRequest,
    rule: RoutingRule,
    constraints: RoutingConstraints
  ): Promise<RoutingDecision> {
    if (rule.target.provider && rule.target.model) {
      const modelDef = this.registry.getModel(rule.target.provider, rule.target.model);
      if (modelDef) {
        return this.createDecision(modelDef, 'balanced', rule.name, constraints);
      }
    }

    if (rule.target.strategy) {
      return this.applyStrategy(request, rule.target.strategy, {
        ...constraints,
        ...rule.target.constraints,
      });
    }

    // Fallback to default strategy
    return this.applyStrategy(request, this.config.defaultStrategy, constraints);
  }

  private async applyStrategy(
    request: RanaChatRequest,
    strategy: RoutingStrategy,
    constraints: RoutingConstraints
  ): Promise<RoutingDecision> {
    let modelDef: ModelDefinition | undefined;
    let alternatives: ModelDefinition[] = [];

    switch (strategy) {
      case 'cost-optimized':
        modelDef = this.registry.getCheapest(constraints);
        alternatives = this.registry.getModels()
          .filter(m => m.available && this.matchesConstraints(m, constraints))
          .sort((a, b) => {
            const aCost = a.pricing.inputPer1k + a.pricing.outputPer1k;
            const bCost = b.pricing.inputPer1k + b.pricing.outputPer1k;
            return aCost - bCost;
          })
          .slice(1, 4);
        break;

      case 'quality-optimized':
        modelDef = this.registry.getBestQuality(constraints);
        alternatives = this.registry.getModelsByTier('premium')
          .filter(m => m.available && this.matchesConstraints(m, constraints))
          .slice(1, 4);
        break;

      case 'latency-optimized':
        modelDef = this.registry.getFastest(constraints);
        alternatives = this.registry.getModels()
          .filter(m => m.available && this.matchesConstraints(m, constraints))
          .sort((a, b) => (a.metrics?.avgLatency ?? 1000) - (b.metrics?.avgLatency ?? 1000))
          .slice(1, 4);
        break;

      case 'capability-match':
        const taskModels = constraints.taskType
          ? this.registry.getModelsByTask(constraints.taskType)
          : this.registry.getModels();
        const filtered = taskModels.filter(m =>
          m.available && this.matchesConstraints(m, constraints)
        );
        modelDef = filtered[0];
        alternatives = filtered.slice(1, 4);
        break;

      case 'round-robin':
        const availableModels = this.registry.getModels()
          .filter(m => m.available && this.matchesConstraints(m, constraints));
        modelDef = this.loadBalancer.getNext(availableModels, request.user);
        alternatives = availableModels.filter(m => m !== modelDef).slice(0, 3);
        break;

      case 'adaptive':
        // Already handled in main route method, fallback to balanced
        strategy = 'balanced';
        // Fall through

      case 'balanced':
      case 'weighted':
      default:
        const models = this.registry.getModels()
          .filter(m => m.available && this.matchesConstraints(m, constraints));
        const sorted = this.scoreAndSort(models, this.config.defaultWeights!);
        modelDef = sorted[0];
        alternatives = sorted.slice(1, 4);
    }

    if (!modelDef) {
      // Fallback to default
      modelDef = this.registry.getModel('anthropic', 'claude-3-5-sonnet-20241022');
      if (!modelDef) {
        throw new Error('No suitable model found for routing constraints');
      }
    }

    return this.createDecision(modelDef, strategy, undefined, constraints, alternatives);
  }

  private scoreAndSort(
    models: ModelDefinition[],
    weights: RoutingWeights
  ): ModelDefinition[] {
    const scored = models.map(m => {
      // Normalize metrics (0-1 scale)
      const maxCost = 0.1; // $0.10 per 1K tokens as max
      const costScore = 1 - Math.min((m.pricing.inputPer1k + m.pricing.outputPer1k) / maxCost, 1);

      const qualityMap = { enterprise: 1, premium: 0.8, standard: 0.6, economy: 0.4 };
      const qualityScore = qualityMap[m.capabilities.qualityTier] || 0.5;

      const maxLatency = 5000; // 5s as max
      const latencyScore = 1 - Math.min((m.metrics?.avgLatency ?? 1000) / maxLatency, 1);

      const reliabilityScore = m.metrics?.successRate ?? 0.95;

      // Weighted score
      const score =
        costScore * weights.cost +
        qualityScore * weights.quality +
        latencyScore * weights.latency +
        reliabilityScore * weights.reliability;

      return { model: m, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.model);
  }

  private matchesConstraints(
    model: ModelDefinition,
    constraints: RoutingConstraints
  ): boolean {
    // Delegate to registry's matching logic
    const registry = this.registry as DefaultModelRegistry;
    return (registry as any).matchesConstraints?.(model, constraints) ?? true;
  }

  private createDecision(
    model: ModelDefinition,
    strategy: RoutingStrategy,
    matchedRule: string | undefined,
    constraints: RoutingConstraints,
    alternativeModels?: ModelDefinition[]
  ): RoutingDecision {
    const alternatives = (alternativeModels || []).map(m => ({
      provider: m.provider,
      model: m.model,
      score: 0.8, // Simplified
      reason: 'Alternative option',
    }));

    const estimatedCost = (model.pricing.inputPer1k + model.pricing.outputPer1k) * 2;
    const estimatedLatency = model.metrics?.avgLatency ?? 500;

    return {
      provider: model.provider,
      model: model.model,
      modelDefinition: model,
      strategy,
      matchedRule,
      estimatedCost,
      estimatedLatency,
      confidence: model.metrics ? 0.9 : 0.7,
      alternatives,
      reasoning: this.generateReasoning(model, strategy, constraints),
      timestamp: new Date(),
    };
  }

  private generateReasoning(
    model: ModelDefinition,
    strategy: RoutingStrategy,
    constraints: RoutingConstraints
  ): string {
    const parts: string[] = [];

    parts.push(`Selected ${model.displayName} using ${strategy} strategy.`);

    if (strategy === 'cost-optimized') {
      parts.push(`Cost: $${(model.pricing.inputPer1k + model.pricing.outputPer1k).toFixed(4)}/1K tokens.`);
    }

    if (strategy === 'quality-optimized') {
      parts.push(`Quality tier: ${model.capabilities.qualityTier}.`);
    }

    if (strategy === 'latency-optimized' && model.metrics) {
      parts.push(`Avg latency: ${model.metrics.avgLatency.toFixed(0)}ms.`);
    }

    if (constraints.taskType) {
      parts.push(`Optimized for ${constraints.taskType} tasks.`);
    }

    return parts.join(' ');
  }

  private getCacheKey(request: RanaChatRequest, constraints?: RoutingConstraints): string {
    const key = {
      optimize: request.optimize,
      hasTools: !!request.tools?.length,
      hasImages: request.messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || c.type === 'image')
      ),
      constraints: constraints ? JSON.stringify(constraints) : '',
    };
    return Buffer.from(JSON.stringify(key)).toString('base64').slice(0, 32);
  }

  private cacheDecision(
    request: RanaChatRequest,
    constraints: RoutingConstraints | undefined,
    decision: RoutingDecision
  ): void {
    if (this.config.cacheDecisions) {
      const cacheKey = this.getCacheKey(request, constraints);
      this.decisionCache.set(cacheKey, {
        decision,
        expires: Date.now() + (this.config.decisionCacheTTL || 300) * 1000,
      });
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalRouter: ModelRouter | null = null;

/**
 * Create a new model router
 */
export function createModelRouter(
  config?: Partial<ModelRouterConfig>,
  registry?: ModelRegistry
): ModelRouter {
  return new ModelRouter(
    {
      defaultStrategy: 'balanced',
      ...config,
    },
    registry
  );
}

/**
 * Get the global model router instance
 */
export function getGlobalRouter(): ModelRouter {
  if (!globalRouter) {
    globalRouter = createModelRouter();
  }
  return globalRouter;
}

/**
 * Set the global model router instance
 */
export function setGlobalRouter(router: ModelRouter): void {
  globalRouter = router;
}

/**
 * Quick route function using global router
 */
export async function route(
  request: RanaChatRequest,
  constraints?: RoutingConstraints
): Promise<RoutingDecision> {
  return getGlobalRouter().route(request, constraints);
}
