/**
 * Provider Fallback System
 * Automatically falls back to alternative providers when one fails
 */

import type {
  RanaChatRequest,
  RanaChatResponse,
  LLMProvider,
  RanaError,
} from '../types';
import { ProviderManager } from './manager';

/**
 * Configuration for fallback behavior
 */
export interface FallbackConfig {
  /** Ordered list of providers to try (in priority order) */
  order: LLMProvider[];
  /** Callback when falling back from one provider to another */
  onFallback?: (from: LLMProvider, to: LLMProvider, error: Error) => void;
  /** Maximum number of retry attempts per provider (default: 1) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 0) */
  retryDelay?: number;
  /** Whether to track fallback attempts (default: true) */
  trackAttempts?: boolean;
}

/**
 * Per-provider retry configuration
 */
export interface ProviderRetryConfig {
  /** Provider name */
  provider: LLMProvider;
  /** Maximum retries for this specific provider */
  maxRetries?: number;
  /** Delay between retries for this provider */
  retryDelay?: number;
}

/**
 * Metadata about which provider was used and fallback attempts
 */
export interface FallbackMetadata {
  /** The provider that successfully responded */
  successfulProvider: LLMProvider;
  /** Total number of attempts made */
  totalAttempts: number;
  /** List of providers that were tried */
  attemptedProviders: LLMProvider[];
  /** Details of failed attempts */
  failures: Array<{
    provider: LLMProvider;
    error: string;
    timestamp: Date;
  }>;
  /** Whether fallback was used */
  usedFallback: boolean;
}

/**
 * Response with fallback metadata
 */
export interface FallbackResponse extends RanaChatResponse {
  /** Metadata about fallback attempts */
  fallbackMetadata: FallbackMetadata;
}

/**
 * Provider Fallback Manager
 * Handles automatic fallback between providers with retry logic
 */
export class FallbackManager {
  private providerManager: ProviderManager;
  private config: FallbackConfig;
  private providerRetryConfigs: Map<LLMProvider, ProviderRetryConfig> = new Map();

  constructor(providerManager: ProviderManager, config: FallbackConfig) {
    this.providerManager = providerManager;
    this.config = {
      maxRetries: 1,
      retryDelay: 0,
      trackAttempts: true,
      ...config,
    };
  }

  /**
   * Configure retry behavior for a specific provider
   */
  configureProviderRetry(config: ProviderRetryConfig): void {
    this.providerRetryConfigs.set(config.provider, config);
  }

  /**
   * Make a chat request with automatic fallback
   */
  async chat(request: RanaChatRequest): Promise<FallbackResponse> {
    const providers = this.config.order;

    if (providers.length === 0) {
      throw new Error('No providers configured for fallback');
    }

    const metadata: FallbackMetadata = {
      successfulProvider: providers[0],
      totalAttempts: 0,
      attemptedProviders: [],
      failures: [],
      usedFallback: false,
    };

    let lastError: Error | null = null;

    // Try each provider in order
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isFirstProvider = i === 0;
      const hasNextProvider = i < providers.length - 1;

      // Get retry config for this provider
      const providerConfig = this.providerRetryConfigs.get(provider);
      const maxRetries = providerConfig?.maxRetries ?? this.config.maxRetries ?? 1;
      const retryDelay = providerConfig?.retryDelay ?? this.config.retryDelay ?? 0;

      // Try this provider with retries
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          metadata.totalAttempts++;

          // Add provider to attempted list if not already there
          if (!metadata.attemptedProviders.includes(provider)) {
            metadata.attemptedProviders.push(provider);
          }

          // Make the request
          const response = await this.providerManager.chat(provider, {
            ...request,
            provider,
          });

          // Success!
          metadata.successfulProvider = provider;
          metadata.usedFallback = !isFirstProvider;

          return {
            ...response,
            fallbackMetadata: metadata,
          };
        } catch (error) {
          lastError = error as Error;

          // Track the failure
          if (this.config.trackAttempts) {
            metadata.failures.push({
              provider,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date(),
            });
          }

          // If this is not the last retry for this provider, wait and retry
          if (attempt < maxRetries) {
            if (retryDelay > 0) {
              await this.sleep(retryDelay);
            }
            continue;
          }

          // If we have more providers to try, trigger fallback callback
          if (hasNextProvider && this.config.onFallback) {
            const nextProvider = providers[i + 1];
            this.config.onFallback(provider, nextProvider, lastError);
          }

          // Move to next provider
          break;
        }
      }
    }

    // All providers failed
    const errorMessage = this.buildErrorMessage(metadata);
    throw new Error(errorMessage);
  }

  /**
   * Build a comprehensive error message when all providers fail
   */
  private buildErrorMessage(metadata: FallbackMetadata): string {
    const providerList = metadata.attemptedProviders.join(', ');
    const failureDetails = metadata.failures
      .map((f) => `  - ${f.provider}: ${f.error}`)
      .join('\n');

    return `All providers failed after ${metadata.totalAttempts} attempts.\n` +
      `Attempted providers: ${providerList}\n` +
      `Failures:\n${failureDetails}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update fallback configuration
   */
  updateConfig(config: Partial<FallbackConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current fallback configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * Clear all provider-specific retry configurations
   */
  clearProviderRetryConfigs(): void {
    this.providerRetryConfigs.clear();
  }
}

/**
 * Factory function to create a FallbackManager
 */
export function createFallbackManager(
  providerManager: ProviderManager,
  config: FallbackConfig
): FallbackManager {
  return new FallbackManager(providerManager, config);
}
