/**
 * Model Registry
 * Central registry of all available models with capabilities and pricing
 */

import type { LLMProvider, LLMModel } from '../types';
import type {
  ModelDefinition,
  ModelCapabilities,
  ModelPricing,
  ModelMetrics,
  ModelRegistry,
  RoutingConstraints,
  TaskType,
  QualityTier,
} from './types';

// ============================================================================
// Built-in Model Definitions
// ============================================================================

const ANTHROPIC_MODELS: ModelDefinition[] = [
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    capabilities: {
      contextWindow: 200000,
      maxOutput: 8192,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru'],
      specializations: ['code', 'analysis', 'reasoning', 'creative', 'function-calling'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.003,
      outputPer1k: 0.015,
      cachedInputDiscount: 0.9,
    },
    available: true,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    capabilities: {
      contextWindow: 200000,
      maxOutput: 8192,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'],
      specializations: ['chat', 'summarization', 'extraction', 'classification'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.001,
      outputPer1k: 0.005,
      cachedInputDiscount: 0.9,
    },
    available: true,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    capabilities: {
      contextWindow: 200000,
      maxOutput: 4096,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru'],
      specializations: ['reasoning', 'analysis', 'creative', 'math', 'code'],
      qualityTier: 'enterprise',
    },
    pricing: {
      inputPer1k: 0.015,
      outputPer1k: 0.075,
      cachedInputDiscount: 0.9,
    },
    available: true,
  },
];

const OPENAI_MODELS: ModelDefinition[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 16384,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru'],
      specializations: ['chat', 'code', 'analysis', 'vision', 'function-calling'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.005,
      outputPer1k: 0.015,
      perImage: 0.00765,
    },
    available: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 16384,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'],
      specializations: ['chat', 'summarization', 'extraction'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.00015,
      outputPer1k: 0.0006,
      perImage: 0.001913,
    },
    available: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 4096,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru'],
      specializations: ['reasoning', 'code', 'analysis'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.01,
      outputPer1k: 0.03,
      perImage: 0.00765,
    },
    available: true,
  },
  {
    provider: 'openai',
    model: 'o1-preview',
    displayName: 'o1 Preview',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 32768,
      vision: false,
      functionCalling: false,
      jsonMode: false,
      streaming: false,
      systemMessage: false,
      languages: ['en'],
      specializations: ['reasoning', 'math', 'code', 'analysis'],
      qualityTier: 'enterprise',
    },
    pricing: {
      inputPer1k: 0.015,
      outputPer1k: 0.06,
    },
    available: true,
  },
  {
    provider: 'openai',
    model: 'o1-mini',
    displayName: 'o1 Mini',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 65536,
      vision: false,
      functionCalling: false,
      jsonMode: false,
      streaming: false,
      systemMessage: false,
      languages: ['en'],
      specializations: ['reasoning', 'math', 'code'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.003,
      outputPer1k: 0.012,
    },
    available: true,
  },
];

const GOOGLE_MODELS: ModelDefinition[] = [
  {
    provider: 'google',
    model: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    capabilities: {
      contextWindow: 1000000,
      maxOutput: 8192,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru', 'hi'],
      specializations: ['chat', 'code', 'vision', 'analysis'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.0,  // Free during preview
      outputPer1k: 0.0,
    },
    available: true,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    capabilities: {
      contextWindow: 2000000,
      maxOutput: 8192,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru', 'hi'],
      specializations: ['analysis', 'reasoning', 'vision', 'code'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.00125,
      outputPer1k: 0.005,
    },
    available: true,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    capabilities: {
      contextWindow: 1000000,
      maxOutput: 8192,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'],
      specializations: ['chat', 'summarization', 'extraction'],
      qualityTier: 'economy',
    },
    pricing: {
      inputPer1k: 0.000075,
      outputPer1k: 0.0003,
    },
    available: true,
  },
];

const GROQ_MODELS: ModelDefinition[] = [
  {
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    displayName: 'Llama 3.1 70B',
    capabilities: {
      contextWindow: 131072,
      maxOutput: 8000,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh'],
      specializations: ['chat', 'code', 'reasoning'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.00059,
      outputPer1k: 0.00079,
    },
    available: true,
  },
  {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    displayName: 'Llama 3.1 8B',
    capabilities: {
      contextWindow: 131072,
      maxOutput: 8000,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de'],
      specializations: ['chat', 'summarization'],
      qualityTier: 'economy',
    },
    pricing: {
      inputPer1k: 0.00005,
      outputPer1k: 0.00008,
    },
    available: true,
  },
  {
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
    displayName: 'Mixtral 8x7B',
    capabilities: {
      contextWindow: 32768,
      maxOutput: 8000,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it'],
      specializations: ['chat', 'code', 'analysis'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.00024,
      outputPer1k: 0.00024,
    },
    available: true,
  },
];

const MISTRAL_MODELS: ModelDefinition[] = [
  {
    provider: 'mistral',
    model: 'mistral-large-latest',
    displayName: 'Mistral Large',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 8192,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'],
      specializations: ['code', 'reasoning', 'analysis'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.002,
      outputPer1k: 0.006,
    },
    available: true,
  },
  {
    provider: 'mistral',
    model: 'mistral-small-latest',
    displayName: 'Mistral Small',
    capabilities: {
      contextWindow: 128000,
      maxOutput: 8192,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it'],
      specializations: ['chat', 'summarization', 'extraction'],
      qualityTier: 'standard',
    },
    pricing: {
      inputPer1k: 0.0002,
      outputPer1k: 0.0006,
    },
    available: true,
  },
  {
    provider: 'mistral',
    model: 'codestral-latest',
    displayName: 'Codestral',
    capabilities: {
      contextWindow: 32000,
      maxOutput: 8192,
      vision: false,
      functionCalling: false,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en'],
      specializations: ['code'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.0002,
      outputPer1k: 0.0006,
    },
    available: true,
  },
];

const TOGETHER_MODELS: ModelDefinition[] = [
  {
    provider: 'together',
    model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    displayName: 'Llama 3.2 90B Vision',
    capabilities: {
      contextWindow: 131072,
      maxOutput: 4096,
      vision: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh'],
      specializations: ['vision', 'analysis', 'reasoning'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.00088,
      outputPer1k: 0.00088,
    },
    available: true,
  },
  {
    provider: 'together',
    model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    displayName: 'Qwen 2.5 72B',
    capabilities: {
      contextWindow: 32768,
      maxOutput: 4096,
      vision: false,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemMessage: true,
      languages: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'],
      specializations: ['code', 'math', 'reasoning'],
      qualityTier: 'premium',
    },
    pricing: {
      inputPer1k: 0.0006,
      outputPer1k: 0.0006,
    },
    available: true,
  },
];

// All built-in models
const BUILT_IN_MODELS: ModelDefinition[] = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  ...GROQ_MODELS,
  ...MISTRAL_MODELS,
  ...TOGETHER_MODELS,
];

// ============================================================================
// Model Registry Implementation
// ============================================================================

export class DefaultModelRegistry implements ModelRegistry {
  private models: Map<string, ModelDefinition>;
  private metricsCache: Map<string, ModelMetrics>;

  constructor(customModels?: ModelDefinition[]) {
    this.models = new Map();
    this.metricsCache = new Map();

    // Register built-in models
    for (const model of BUILT_IN_MODELS) {
      this.registerModel(model);
    }

    // Register custom models
    if (customModels) {
      for (const model of customModels) {
        this.registerModel(model);
      }
    }
  }

  private getKey(provider: LLMProvider, model: LLMModel): string {
    return `${provider}:${model}`;
  }

  getModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  getModel(provider: LLMProvider, model: LLMModel): ModelDefinition | undefined {
    return this.models.get(this.getKey(provider, model));
  }

  getModelsByProvider(provider: LLMProvider): ModelDefinition[] {
    return this.getModels().filter(m => m.provider === provider);
  }

  getModelsByCapability(capability: keyof ModelCapabilities): ModelDefinition[] {
    return this.getModels().filter(m => {
      const value = m.capabilities[capability];
      return value === true || (Array.isArray(value) && value.length > 0);
    });
  }

  getModelsByTask(task: TaskType): ModelDefinition[] {
    return this.getModels().filter(m =>
      m.capabilities.specializations.includes(task)
    );
  }

  getModelsByTier(tier: QualityTier): ModelDefinition[] {
    return this.getModels().filter(m => m.capabilities.qualityTier === tier);
  }

  registerModel(model: ModelDefinition): void {
    this.models.set(this.getKey(model.provider, model.model), model);
  }

  updateMetrics(
    provider: LLMProvider,
    model: LLMModel,
    metrics: Partial<ModelMetrics>
  ): void {
    const key = this.getKey(provider, model);
    const existing = this.metricsCache.get(key) || {
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      successRate: 1,
      avgQuality: 0.8,
      tokensPerSecond: 50,
      timeToFirstToken: 200,
      totalRequests: 0,
      lastUpdated: new Date(),
    };

    const updated = { ...existing, ...metrics, lastUpdated: new Date() };
    this.metricsCache.set(key, updated);

    // Update model definition
    const modelDef = this.models.get(key);
    if (modelDef) {
      modelDef.metrics = updated;
    }
  }

  isAvailable(provider: LLMProvider, model: LLMModel): boolean {
    const modelDef = this.getModel(provider, model);
    return modelDef?.available ?? false;
  }

  getCheapest(constraints?: RoutingConstraints): ModelDefinition | undefined {
    return this.filterAndSort(constraints, (a, b) => {
      const aCost = a.pricing.inputPer1k + a.pricing.outputPer1k;
      const bCost = b.pricing.inputPer1k + b.pricing.outputPer1k;
      return aCost - bCost;
    })[0];
  }

  getFastest(constraints?: RoutingConstraints): ModelDefinition | undefined {
    return this.filterAndSort(constraints, (a, b) => {
      const aLatency = a.metrics?.avgLatency ?? 1000;
      const bLatency = b.metrics?.avgLatency ?? 1000;
      return aLatency - bLatency;
    })[0];
  }

  getBestQuality(constraints?: RoutingConstraints): ModelDefinition | undefined {
    const tierOrder: Record<QualityTier, number> = {
      enterprise: 4,
      premium: 3,
      standard: 2,
      economy: 1,
    };

    return this.filterAndSort(constraints, (a, b) => {
      const aTier = tierOrder[a.capabilities.qualityTier];
      const bTier = tierOrder[b.capabilities.qualityTier];
      if (aTier !== bTier) return bTier - aTier;

      // Within same tier, use quality score from metrics
      const aQuality = a.metrics?.avgQuality ?? 0.8;
      const bQuality = b.metrics?.avgQuality ?? 0.8;
      return bQuality - aQuality;
    })[0];
  }

  private filterAndSort(
    constraints: RoutingConstraints | undefined,
    compareFn: (a: ModelDefinition, b: ModelDefinition) => number
  ): ModelDefinition[] {
    let models = this.getModels().filter(m => m.available);

    if (constraints) {
      models = models.filter(m => this.matchesConstraints(m, constraints));
    }

    return models.sort(compareFn);
  }

  private matchesConstraints(
    model: ModelDefinition,
    constraints: RoutingConstraints
  ): boolean {
    // Check max cost
    if (constraints.maxCostPerRequest !== undefined) {
      const estimatedCost = (model.pricing.inputPer1k + model.pricing.outputPer1k) * 2; // rough estimate
      if (estimatedCost > constraints.maxCostPerRequest) return false;
    }

    // Check max latency
    if (constraints.maxLatency !== undefined && model.metrics) {
      if (model.metrics.avgLatency > constraints.maxLatency) return false;
    }

    // Check min quality
    if (constraints.minQuality !== undefined && model.metrics) {
      if (model.metrics.avgQuality < constraints.minQuality) return false;
    }

    // Check excluded providers
    if (constraints.excludedProviders?.includes(model.provider)) return false;

    // Check preferred providers
    if (constraints.preferredProviders?.length) {
      if (!constraints.preferredProviders.includes(model.provider)) return false;
    }

    // Check excluded models
    if (constraints.excludedModels?.includes(model.model)) return false;

    // Check preferred models
    if (constraints.preferredModels?.length) {
      if (!constraints.preferredModels.includes(model.model)) return false;
    }

    // Check task type
    if (constraints.taskType) {
      if (!model.capabilities.specializations.includes(constraints.taskType)) return false;
    }

    // Check min context window
    if (constraints.minContextWindow !== undefined) {
      if (model.capabilities.contextWindow < constraints.minContextWindow) return false;
    }

    // Check required features
    if (constraints.requiredFeatures) {
      for (const feature of constraints.requiredFeatures) {
        if (!model.capabilities[feature]) return false;
      }
    }

    // Check required capabilities
    if (constraints.requiredCapabilities) {
      for (const [key, value] of Object.entries(constraints.requiredCapabilities)) {
        const modelValue = model.capabilities[key as keyof ModelCapabilities];
        if (typeof value === 'boolean' && modelValue !== value) return false;
        if (typeof value === 'number' && (modelValue as number) < value) return false;
      }
    }

    return true;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new model registry
 */
export function createModelRegistry(
  customModels?: ModelDefinition[]
): ModelRegistry {
  return new DefaultModelRegistry(customModels);
}

/**
 * Get built-in models list
 */
export function getBuiltInModels(): ModelDefinition[] {
  return [...BUILT_IN_MODELS];
}

/**
 * Get models for a specific provider
 */
export function getProviderModels(provider: LLMProvider): ModelDefinition[] {
  return BUILT_IN_MODELS.filter(m => m.provider === provider);
}
