/**
 * Provider Manager
 * Manages connections to different LLM providers
 */

import type {
  RanaChatRequest,
  RanaChatResponse,
  RanaStreamChunk,
  LLMProvider,
} from '../types';
import { RanaAuthError, RanaError, RanaRateLimitError } from '../types';
import { RequestQueue, QueueConfig, QueuePriority } from './queue';
import { RateLimiter, type RateLimiterOptions } from './rate-limiter';
import {
  withRetry,
  getProviderRetryConfig,
  type RetryConfig,
} from './retry';
import { CircuitBreaker } from './circuit-breaker';

export interface ProviderManagerConfig {
  providers: Record<string, string>;
  queue?: QueueConfig & {
    enabled?: boolean;
  };
  rateLimit?: RateLimiterOptions & {
    enabled?: boolean;
  };
  retry?: Partial<RetryConfig> & {
    enabled?: boolean;
  };
  circuitBreaker?: any; // Circuit breaker config - using any for now to avoid circular dependency
}

export class ProviderManager {
  private apiKeys: Record<string, string>;
  private clients: Map<LLMProvider, any> = new Map();
  private queue?: RequestQueue;
  private queueEnabled: boolean = false;
  private rateLimiter?: RateLimiter;
  private rateLimitEnabled: boolean = false;
  private retryConfig?: Partial<RetryConfig>;
  private retryEnabled: boolean = true; // Enabled by default
  private circuitBreaker: CircuitBreaker;

  constructor(config: Record<string, string> | ProviderManagerConfig) {
    // Support both old API (just providers) and new API (with queue/rate limit config)
    if ('providers' in config) {
      // New API with full config
      const fullConfig = config as ProviderManagerConfig;
      this.apiKeys = fullConfig.providers;

      if (fullConfig.queue?.enabled) {
        this.queueEnabled = true;
        this.queue = new RequestQueue({
          ...fullConfig.queue,
          executor: (provider, request) => this.executeChat(provider, request),
        });
      }

      if (fullConfig.rateLimit?.enabled) {
        this.rateLimitEnabled = true;
        this.rateLimiter = new RateLimiter(fullConfig.rateLimit);
      }

      if (fullConfig.retry) {
        this.retryEnabled = fullConfig.retry.enabled !== false; // Default to true
        this.retryConfig = fullConfig.retry;
      }

      // Initialize circuit breaker
      this.circuitBreaker = new CircuitBreaker(fullConfig.circuitBreaker);
    } else {
      // Old API - just providers
      this.apiKeys = config as Record<string, string>;
      this.circuitBreaker = new CircuitBreaker();
    }
  }

  /**
   * Make a chat request to the specified provider
   */
  async chat(
    provider: LLMProvider,
    request: RanaChatRequest,
    options?: {
      priority?: QueuePriority;
      timeout?: number;
      bypassQueue?: boolean;
    }
  ): Promise<RanaChatResponse> {
    // If queue is enabled and not bypassed, enqueue the request
    if (this.queueEnabled && this.queue && !options?.bypassQueue) {
      // Enqueue returns a promise that will be resolved when the request is processed
      // The executor callback we passed in the constructor will handle the actual execution
      return this.queue.enqueue(provider, request, {
        priority: options?.priority,
        timeout: options?.timeout,
      });
    }

    // Direct execution (no queue or bypassed)
    return this.executeChat(provider, request);
  }

  /**
   * Execute a chat request directly (internal method)
   */
  private async executeChat(
    provider: LLMProvider,
    request: RanaChatRequest
  ): Promise<RanaChatResponse> {
    // Wrap the entire execution in circuit breaker for resilience
    return this.circuitBreaker.execute(provider, async () => {
      // Acquire rate limit permission before making the request
      if (this.rateLimitEnabled && this.rateLimiter) {
        await this.rateLimiter.acquire(provider);
      }

      const startTime = Date.now();

    // Prepare retry configuration for this provider
    const providerRetryDefaults = getProviderRetryConfig(provider);
    const retryConfig: Partial<RetryConfig> = {
      ...providerRetryDefaults,
      ...this.retryConfig,
      onRetry: (error, attempt, delay) => {
        // Log retry attempts if configured
        console.log(
          `[RANA Retry] ${provider} - Attempt ${attempt} failed, retrying in ${delay}ms. Error: ${error.message}`
        );
        // Call user-provided callback if exists
        if (this.retryConfig?.onRetry) {
          this.retryConfig.onRetry(error, attempt, delay);
        }
      },
    };

    // Execute with or without retry based on configuration
    const executeRequest = async () => {
      const client = await this.getClient(provider);

      try {
        let response: any;
        let rawResponse: any;

        switch (provider) {
          case 'anthropic':
            response = await this.chatAnthropic(client, request);
            rawResponse = response.raw;
            break;
          case 'openai':
            response = await this.chatOpenAI(client, request);
            rawResponse = response.raw;
            break;
          case 'google':
            response = await this.chatGoogle(client, request);
            rawResponse = response.raw;
            break;
          case 'ollama':
            response = await this.chatOllama(client, request);
            rawResponse = response.raw;
            break;
          default:
            throw new RanaError(
              `Provider ${provider} not yet implemented`,
              'PROVIDER_NOT_IMPLEMENTED',
              provider
            );
        }

        // Parse rate limit headers if rate limiting is enabled
        if (this.rateLimitEnabled && this.rateLimiter && rawResponse) {
          this.parseRateLimitHeaders(provider, rawResponse);
        }

        return response;
      } catch (error: any) {
        // Handle rate limit errors
        if (error.status === 429 || error.code === 'rate_limit_exceeded') {
          // Parse rate limit info from error response
          if (this.rateLimitEnabled && this.rateLimiter && error.headers) {
            this.parseRateLimitHeaders(provider, error.headers);
          }
          throw new RanaRateLimitError(provider, error);
        }
        if (error.status === 401 || error.message?.includes('API key')) {
          throw new RanaAuthError(provider, error);
        }
        throw error;
      }
    };

    // Execute with retry if enabled
    if (this.retryEnabled) {
      const { result: response, metadata } = await withRetry(
        executeRequest,
        retryConfig
      );

      const latency_ms = Date.now() - startTime;

      return {
        ...response,
        latency_ms,
        created_at: new Date(),
        cached: false,
        // Include retry metadata if retries were attempted
        ...(metadata.retryCount > 0 && {
          retry: {
            retryCount: metadata.retryCount,
            totalRetryTime: metadata.totalRetryTime,
            retryDelays: metadata.retryDelays,
            lastRetryError: metadata.lastRetryError,
          },
        }),
      };
    } else {
      // Execute without retry
      const response = await executeRequest();
      const latency_ms = Date.now() - startTime;

      return {
        ...response,
        latency_ms,
        created_at: new Date(),
        cached: false,
      };
    }
    }); // End circuit breaker execution
  }

  /**
   * Stream chat responses
   */
  async *stream(
    provider: LLMProvider,
    request: RanaChatRequest
  ): AsyncGenerator<RanaStreamChunk> {
    const client = await this.getClient(provider);

    // Implementation for streaming
    // This would use the provider's streaming API
    yield {
      id: 'stream-1',
      provider,
      model: request.model || 'unknown',
      delta: '',
      done: true,
    };
  }

  /**
   * Get or create client for provider
   */
  private async getClient(provider: LLMProvider): Promise<any> {
    if (this.clients.has(provider)) {
      return this.clients.get(provider);
    }

    const apiKey = this.apiKeys[provider];

    // Ollama doesn't require an API key
    if (!apiKey && provider !== 'ollama') {
      throw new RanaAuthError(provider, { message: 'API key not configured' });
    }

    let client: any;

    switch (provider) {
      case 'anthropic': {
        const Anthropic = await import('@anthropic-ai/sdk');
        client = new Anthropic.default({ apiKey });
        break;
      }
      case 'openai': {
        const OpenAI = await import('openai');
        client = new OpenAI.default({ apiKey });
        break;
      }
      case 'google': {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        client = new GoogleGenerativeAI(apiKey);
        break;
      }
      case 'ollama': {
        // Ollama uses the API key field as the base URL (default: http://localhost:11434)
        const baseUrl = apiKey || 'http://localhost:11434';
        client = { baseUrl };
        break;
      }
      default:
        throw new RanaError(
          `Provider ${provider} not supported`,
          'PROVIDER_NOT_SUPPORTED',
          provider
        );
    }

    this.clients.set(provider, client);
    return client;
  }

  /**
   * Anthropic-specific chat implementation
   */
  private async chatAnthropic(
    client: any,
    request: RanaChatRequest
  ): Promise<Partial<RanaChatResponse>> {
    const response = await client.messages.create({
      model: request.model || 'claude-3-5-sonnet-20241022',
      messages: request.messages,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature ?? 0.7,
      tools: request.tools,
    });

    return {
      id: response.id,
      provider: 'anthropic',
      model: response.model,
      content: response.content[0].text,
      role: 'assistant',
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      cost: this.calculateCost('anthropic', response.model, response.usage),
      finish_reason: response.stop_reason,
      raw: response,
    };
  }

  /**
   * OpenAI-specific chat implementation
   */
  private async chatOpenAI(
    client: any,
    request: RanaChatRequest
  ): Promise<Partial<RanaChatResponse>> {
    const response = await client.chat.completions.create({
      model: request.model || 'gpt-4o',
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
      tools: request.tools,
    });

    const choice = response.choices[0];

    return {
      id: response.id,
      provider: 'openai',
      model: response.model,
      content: choice.message.content || '',
      role: 'assistant',
      tool_calls: choice.message.tool_calls,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
      cost: this.calculateCost('openai', response.model, response.usage),
      finish_reason: choice.finish_reason,
      raw: response,
    };
  }

  /**
   * Google-specific chat implementation
   */
  private async chatGoogle(
    client: any,
    request: RanaChatRequest
  ): Promise<Partial<RanaChatResponse>> {
    const model = client.getGenerativeModel({
      model: request.model || 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent({
      contents: request.messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const response = result.response;

    return {
      id: crypto.randomUUID(),
      provider: 'google',
      model: request.model || 'gemini-2.0-flash-exp',
      content: response.text(),
      role: 'assistant',
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
      cost: this.calculateCost('google', request.model || 'gemini-2.0-flash-exp', {
        promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
      }),
      finish_reason: 'stop',
      raw: response,
    };
  }

  /**
   * Ollama-specific chat implementation (local models)
   */
  private async chatOllama(
    client: { baseUrl: string },
    request: RanaChatRequest
  ): Promise<Partial<RanaChatResponse>> {
    const model = request.model || 'llama3.2';

    const response = await fetch(`${client.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: request.messages.map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.max_tokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new RanaError(
        `Ollama error: ${error}`,
        'OLLAMA_ERROR',
        'ollama'
      );
    }

    const data = await response.json() as {
      message?: { content: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    // Estimate tokens (Ollama provides eval_count)
    const promptTokens = data.prompt_eval_count || 0;
    const completionTokens = data.eval_count || 0;

    return {
      id: crypto.randomUUID(),
      provider: 'ollama',
      model,
      content: data.message?.content || '',
      role: 'assistant',
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      cost: { prompt_cost: 0, completion_cost: 0, total_cost: 0 }, // Local = free!
      finish_reason: 'stop',
      raw: data,
    };
  }

  /**
   * Calculate cost based on provider and usage
   */
  private calculateCost(
    provider: LLMProvider,
    model: string,
    usage: any
  ): { prompt_cost: number; completion_cost: number; total_cost: number } {
    // Pricing per 1M tokens (as of 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      // Anthropic
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
      'claude-3-opus-20240229': { input: 15.0, output: 75.0 },

      // OpenAI
      'gpt-4o': { input: 2.5, output: 10.0 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10.0, output: 30.0 },

      // Google
      'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 }, // Free during preview
      'gemini-1.5-pro': { input: 1.25, output: 5.0 },
      'gemini-1.5-flash': { input: 0.075, output: 0.3 },
    };

    const modelPricing = pricing[model] || { input: 0, output: 0 };

    const promptTokens = usage.input_tokens || usage.prompt_tokens || usage.promptTokenCount || 0;
    const completionTokens = usage.output_tokens || usage.completion_tokens || usage.candidatesTokenCount || 0;

    const prompt_cost = (promptTokens / 1_000_000) * modelPricing.input;
    const completion_cost = (completionTokens / 1_000_000) * modelPricing.output;

    return {
      prompt_cost,
      completion_cost,
      total_cost: prompt_cost + completion_cost,
    };
  }

  /**
   * Get the request queue instance
   */
  getQueue(): RequestQueue | undefined {
    return this.queue;
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue?.getStats();
  }

  /**
   * Check if queue is enabled
   */
  isQueueEnabled(): boolean {
    return this.queueEnabled;
  }

  /**
   * Get circuit breaker instance for direct access
   */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  /**
   * Parse rate limit headers from provider responses
   */
  private parseRateLimitHeaders(provider: LLMProvider, response: any): void {
    if (!this.rateLimiter) return;

    // Try to extract headers from different response formats
    let headers: Record<string, string | string[] | undefined> = {};

    // Handle different response structures
    if (response.headers) {
      headers = response.headers;
    } else if (response._headers) {
      headers = response._headers;
    } else if (response.response?.headers) {
      headers = response.response.headers;
    }

    this.rateLimiter.parseRateLimitHeaders(provider, headers);
  }

  /**
   * Get rate limit status for a provider
   */
  getRateLimitStatus(provider: LLMProvider) {
    return this.rateLimiter?.getStatus(provider);
  }

  /**
   * Check if rate limiting is enabled
   */
  isRateLimitEnabled(): boolean {
    return this.rateLimitEnabled;
  }

  /**
   * Get the rate limiter instance
   */
  getRateLimiter(): RateLimiter | undefined {
    return this.rateLimiter;
  }
}
