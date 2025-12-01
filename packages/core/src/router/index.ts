/**
 * Model Router Module
 * Intelligent routing based on cost, quality, latency, and capabilities
 *
 * @example
 * ```typescript
 * import { createModelRouter, route } from '@rana/core';
 *
 * // Create router with custom config
 * const router = createModelRouter({
 *   defaultStrategy: 'balanced',
 *   adaptiveLearning: true,
 *   rules: [{
 *     name: 'code-tasks',
 *     condition: (req) => req.messages.some(m => m.content.includes('code')),
 *     target: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
 *     priority: 10,
 *     enabled: true,
 *   }],
 * });
 *
 * // Route a request
 * const decision = await router.route({
 *   messages: [{ role: 'user', content: 'Write Python code' }],
 * });
 *
 * console.log(decision.provider, decision.model); // anthropic claude-3-5-sonnet-20241022
 *
 * // Quick route using global router
 * const quick = await route({ messages: [...] });
 * ```
 */

// Router
export {
  ModelRouter,
  createModelRouter,
  getGlobalRouter,
  setGlobalRouter,
  route,
} from './router';

// Registry
export {
  DefaultModelRegistry,
  createModelRegistry,
  getBuiltInModels,
  getProviderModels,
} from './registry';

// Types
export type {
  // Strategy types
  RoutingStrategy,
  TaskType,
  QualityTier,

  // Model types
  ModelCapabilities,
  ModelMetrics,
  ModelPricing,
  ModelDefinition,
  ModelRegistry,

  // Configuration types
  RoutingConstraints,
  RoutingWeights,
  RoutingRule,
  LoadBalancerConfig,
  ModelRouterConfig,

  // Result types
  RoutingDecision,
  RoutingFeedback,

  // Adaptive learning types
  AdaptiveMetrics,
  AdaptiveLearner,
} from './types';
