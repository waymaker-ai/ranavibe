/**
 * RANA Core Client
 * Main SDK client with fluent API
 */

import type {
  RanaConfig,
  RanaChatRequest,
  RanaChatResponse,
  RanaStreamChunk,
  LLMProvider,
  LLMModel,
  Message,
  CostStats,
  RanaPlugin,
  RanaError,
} from './types';
import { CostTracker } from './cost-tracker';
import { CacheManager } from './cache-legacy';
import { ProviderManager } from './providers/manager';

export class RanaClient {
  private config: RanaConfig;
  private costTracker: CostTracker;
  private cache: CacheManager;
  private providers: ProviderManager;
  private plugins: RanaPlugin[] = [];

  constructor(config: RanaConfig) {
    this.config = this.normalizeConfig(config);
    this.costTracker = new CostTracker(config.cost_tracking);
    this.cache = new CacheManager(config.cache);
    this.providers = new ProviderManager(config.providers);
    this.log('info', 'RANA client initialized');
  }

  // ============================================================================
  // Fluent API - Chat Methods
  // ============================================================================

  /**
   * Main chat method - supports both simple and advanced usage
   *
   * @example
   * // Simple usage
   * const response = await rana.chat('Hello!');
   *
   * @example
   * // Advanced usage
   * const response = await rana.chat({
   *   provider: 'anthropic',
   *   model: 'claude-3-5-sonnet-20241022',
   *   messages: [{ role: 'user', content: 'Hello!' }],
   *   optimize: 'cost'
   * });
   */
  async chat(
    input: string | RanaChatRequest
  ): Promise<RanaChatResponse> {
    const request = this.normalizeRequest(input);

    // Run before request hooks
    const processedRequest = await this.runBeforeRequestHooks(request);

    try {
      // Check cache first
      if (processedRequest.cache !== false && this.config.cache?.enabled) {
        const cached = await this.cache.get(processedRequest);
        if (cached) {
          this.log('info', 'Cache hit');
          return cached;
        }
      }

      // Select provider and model based on optimization strategy
      const { provider, model } = this.selectOptimalProvider(processedRequest);

      // Make the LLM call
      const response = await this.providers.chat(provider, {
        ...processedRequest,
        provider,
        model,
      });

      // Track cost
      await this.costTracker.track(response);

      // Cache response
      if (processedRequest.cache !== false && this.config.cache?.enabled) {
        await this.cache.set(processedRequest, response);
      }

      // Run after response hooks
      const processedResponse = await this.runAfterResponseHooks(response);

      this.log('info', `Chat completed - Cost: $${response.cost.total_cost.toFixed(4)}`);

      return processedResponse;
    } catch (error) {
      await this.runErrorHooks(error as RanaError);
      throw error;
    }
  }

  /**
   * Streaming chat method
   *
   * @example
   * for await (const chunk of rana.stream('Tell me a story')) {
   *   process.stdout.write(chunk.delta);
   * }
   */
  async *stream(
    input: string | RanaChatRequest
  ): AsyncGenerator<RanaStreamChunk> {
    const request = this.normalizeRequest(input);
    request.stream = true;

    const processedRequest = await this.runBeforeRequestHooks(request);
    const { provider, model } = this.selectOptimalProvider(processedRequest);

    yield* this.providers.stream(provider, {
      ...processedRequest,
      provider,
      model,
    });
  }

  // ============================================================================
  // Fluent API - Builder Pattern
  // ============================================================================

  /**
   * Create a fluent builder for chat requests
   *
   * @example
   * const response = await rana
   *   .provider('anthropic')
   *   .model('claude-3-5-sonnet-20241022')
   *   .optimize('cost')
   *   .cache(true)
   *   .chat({ messages: [...] });
   */
  provider(provider: LLMProvider): RanaChatBuilder {
    return new RanaChatBuilder(this).provider(provider);
  }

  /**
   * Shorthand for specific providers
   */
  anthropic(): RanaChatBuilder {
    return this.provider('anthropic');
  }

  openai(): RanaChatBuilder {
    return this.provider('openai');
  }

  google(): RanaChatBuilder {
    return this.provider('google');
  }

  // ============================================================================
  // Cost Tracking
  // ============================================================================

  /**
   * Get cost statistics
   *
   * @example
   * const stats = await rana.cost.stats();
   * console.log(`Spent: $${stats.total_spent}`);
   * console.log(`Saved: $${stats.total_saved} (${stats.savings_percentage}%)`);
   */
  get cost() {
    return {
      stats: () => this.costTracker.getStats(),
      reset: () => this.costTracker.reset(),
      total: this.costTracker.getTotalCost(),
      saved: this.costTracker.getTotalSaved(),
    };
  }

  // ============================================================================
  // Plugin System
  // ============================================================================

  /**
   * Register a plugin
   *
   * @example
   * rana.use(myPlugin);
   */
  async use(plugin: RanaPlugin): Promise<void> {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      await plugin.onInit(this.config);
    }
    this.log('info', `Plugin registered: ${plugin.name}`);
  }

  /**
   * Remove a plugin
   */
  async unuse(pluginName: string): Promise<void> {
    const plugin = this.plugins.find((p) => p.name === pluginName);
    if (plugin?.onDestroy) {
      await plugin.onDestroy();
    }
    this.plugins = this.plugins.filter((p) => p.name !== pluginName);
    this.log('info', `Plugin removed: ${pluginName}`);
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update configuration
   */
  configure(config: Partial<RanaConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('info', 'Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): RanaConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Test connection to a provider
   *
   * @example
   * const isWorking = await rana.test('anthropic');
   */
  async test(provider: LLMProvider): Promise<boolean> {
    try {
      await this.providers.chat(provider, {
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.log('info', 'Cache cleared');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private normalizeConfig(config: RanaConfig): RanaConfig {
    return {
      providers: config.providers || {},
      defaults: {
        provider: config.defaults?.provider || 'anthropic',
        temperature: config.defaults?.temperature ?? 0.7,
        max_tokens: config.defaults?.max_tokens ?? 1024,
        optimize: config.defaults?.optimize || 'balanced',
        ...config.defaults,
      },
      cache: {
        enabled: config.cache?.enabled ?? true,
        ttl: config.cache?.ttl ?? 3600,
        provider: config.cache?.provider || 'memory',
        ...config.cache,
      },
      cost_tracking: {
        enabled: config.cost_tracking?.enabled ?? true,
        log_to_console: config.cost_tracking?.log_to_console ?? false,
        save_to_db: config.cost_tracking?.save_to_db ?? false,
        ...config.cost_tracking,
      },
      rate_limit: config.rate_limit,
      logging: {
        level: config.logging?.level || 'info',
        enabled: config.logging?.enabled ?? true,
        ...config.logging,
      },
    };
  }

  private normalizeRequest(
    input: string | RanaChatRequest
  ): RanaChatRequest {
    if (typeof input === 'string') {
      return {
        messages: [{ role: 'user', content: input }],
        provider: this.config.defaults?.provider,
        temperature: this.config.defaults?.temperature,
        max_tokens: this.config.defaults?.max_tokens,
        optimize: this.config.defaults?.optimize,
        cache: this.config.cache?.enabled,
      };
    }
    return {
      ...input,
      provider: input.provider || this.config.defaults?.provider,
      temperature: input.temperature ?? this.config.defaults?.temperature,
      max_tokens: input.max_tokens ?? this.config.defaults?.max_tokens,
      optimize: input.optimize || this.config.defaults?.optimize,
      cache: input.cache ?? this.config.cache?.enabled,
    };
  }

  private selectOptimalProvider(request: RanaChatRequest): {
    provider: LLMProvider;
    model: LLMModel;
  } {
    // If provider/model explicitly set, use them
    if (request.provider && request.model) {
      return { provider: request.provider, model: request.model };
    }

    // Otherwise, select based on optimization strategy
    const optimize = request.optimize || 'balanced';

    switch (optimize) {
      case 'cost':
        return { provider: 'google', model: 'gemini-2.0-flash-exp' };
      case 'speed':
        return { provider: 'groq', model: 'llama-3.1-70b-versatile' };
      case 'quality':
        return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' };
      case 'balanced':
      default:
        return { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' };
    }
  }

  private async runBeforeRequestHooks(
    request: RanaChatRequest
  ): Promise<RanaChatRequest> {
    let processedRequest = request;
    for (const plugin of this.plugins) {
      if (plugin.onBeforeRequest) {
        processedRequest = await plugin.onBeforeRequest(processedRequest);
      }
    }
    return processedRequest;
  }

  private async runAfterResponseHooks(
    response: RanaChatResponse
  ): Promise<RanaChatResponse> {
    let processedResponse = response;
    for (const plugin of this.plugins) {
      if (plugin.onAfterResponse) {
        processedResponse = await plugin.onAfterResponse(processedResponse);
      }
    }
    return processedResponse;
  }

  private async runErrorHooks(error: RanaError): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onError) {
        await plugin.onError(error);
      }
    }
  }

  private log(level: string, message: string): void {
    if (this.config.logging?.enabled) {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      const configLevel = levels[this.config.logging.level || 'info'];
      const messageLevel = levels[level as keyof typeof levels];

      if (messageLevel >= configLevel) {
        console.log(`[RANA ${level.toUpperCase()}] ${message}`);
      }
    }
  }
}

// ============================================================================
// Fluent Builder Class
// ============================================================================

class RanaChatBuilder {
  private request: Partial<RanaChatRequest> = {};

  constructor(private client: RanaClient) {}

  provider(provider: LLMProvider): this {
    this.request.provider = provider;
    return this;
  }

  model(model: LLMModel): this {
    this.request.model = model;
    return this;
  }

  temperature(temp: number): this {
    this.request.temperature = temp;
    return this;
  }

  maxTokens(tokens: number): this {
    this.request.max_tokens = tokens;
    return this;
  }

  optimize(strategy: 'cost' | 'speed' | 'quality' | 'balanced'): this {
    this.request.optimize = strategy;
    return this;
  }

  cache(enabled: boolean): this {
    this.request.cache = enabled;
    return this;
  }

  tools(tools: any[]): this {
    this.request.tools = tools;
    return this;
  }

  async chat(messages: Message[] | { messages: Message[] }): Promise<RanaChatResponse> {
    const msgs = Array.isArray(messages) ? messages : messages.messages;
    return this.client.chat({
      ...this.request,
      messages: msgs,
    } as RanaChatRequest);
  }

  async *stream(messages: Message[] | { messages: Message[] }): AsyncGenerator<RanaStreamChunk> {
    const msgs = Array.isArray(messages) ? messages : messages.messages;
    yield* this.client.stream({
      ...this.request,
      messages: msgs,
    } as RanaChatRequest);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a RANA client instance
 *
 * @example
 * import { createRana } from '@rana/core';
 *
 * const rana = createRana({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY,
 *     openai: process.env.OPENAI_API_KEY,
 *   }
 * });
 *
 * const response = await rana.chat('Hello!');
 */
export function createRana(config: RanaConfig): RanaClient {
  return new RanaClient(config);
}

/**
 * Default export for convenience
 */
export { RanaClient as Rana };
