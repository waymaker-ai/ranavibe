/**
 * Rate Limiter for RANA Core
 * Handles rate limiting per provider with auto-throttling
 */

import type { LLMProvider } from '../types';
import { RanaRateLimitError } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /** Requests per minute limit */
  requestsPerMinute?: number;
  /** Requests per second limit */
  requestsPerSecond?: number;
  /** Enable auto-throttling based on provider feedback */
  autoThrottle?: boolean;
  /** Maximum queue size (default: 100) */
  maxQueueSize?: number;
}

export interface ProviderRateLimitConfig {
  [provider: string]: RateLimitConfig;
}

export interface RateLimiterOptions {
  /** Per-provider rate limit configurations */
  providers?: ProviderRateLimitConfig;
  /** Enable auto-throttling globally (default: true) */
  autoThrottle?: boolean;
  /** Default requests per minute if not specified per provider */
  defaultRequestsPerMinute?: number;
  /** Default requests per second if not specified per provider */
  defaultRequestsPerSecond?: number;
  /** Maximum queue size (default: 100) */
  maxQueueSize?: number;
}

export interface RateLimitHeaders {
  /** Remaining requests in current window */
  remaining?: number;
  /** Total requests allowed in window */
  limit?: number;
  /** Timestamp when rate limit resets (Unix timestamp in seconds) */
  reset?: number;
  /** Time until reset in seconds */
  retryAfter?: number;
}

export interface RequestRecord {
  timestamp: number;
  provider: LLMProvider;
}

interface QueuedRequest {
  provider: LLMProvider;
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

export class RateLimiter {
  private requests: Map<LLMProvider, RequestRecord[]> = new Map();
  private providerLimits: Map<LLMProvider, RateLimitConfig> = new Map();
  private rateLimitInfo: Map<LLMProvider, RateLimitHeaders> = new Map();
  private queue: QueuedRequest[] = [];
  private processing = false;
  private autoThrottle: boolean;
  private maxQueueSize: number;

  constructor(options: RateLimiterOptions = {}) {
    this.autoThrottle = options.autoThrottle ?? true;
    this.maxQueueSize = options.maxQueueSize ?? 100;

    // Set up provider-specific limits
    if (options.providers) {
      Object.entries(options.providers).forEach(([provider, config]) => {
        this.providerLimits.set(provider as LLMProvider, config);
      });
    }

    // Store defaults for providers not explicitly configured
    if (options.defaultRequestsPerMinute || options.defaultRequestsPerSecond) {
      this.providerLimits.set('default' as any, {
        requestsPerMinute: options.defaultRequestsPerMinute,
        requestsPerSecond: options.defaultRequestsPerSecond,
        autoThrottle: this.autoThrottle,
      });
    }
  }

  /**
   * Acquire permission to make a request
   * Will queue the request if rate limit would be exceeded
   */
  async acquire(provider: LLMProvider): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we can proceed immediately
      if (this.canProceed(provider)) {
        this.recordRequest(provider);
        resolve();
        return;
      }

      // Queue the request
      if (this.queue.length >= this.maxQueueSize) {
        reject(new RanaRateLimitError(provider, {
          message: `Rate limit queue full (max: ${this.maxQueueSize})`,
          queueSize: this.queue.length,
        }));
        return;
      }

      this.queue.push({
        provider,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Start processing queue if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      // Check if this request has been waiting too long (60 seconds timeout)
      if (Date.now() - request.timestamp > 60000) {
        this.queue.shift();
        request.reject(new RanaRateLimitError(request.provider, {
          message: 'Request timeout in rate limit queue',
        }));
        continue;
      }

      // Check if we can process this request
      if (this.canProceed(request.provider)) {
        this.queue.shift();
        this.recordRequest(request.provider);
        request.resolve();
      } else {
        // Wait before checking again
        const waitTime = this.getWaitTime(request.provider);
        await this.sleep(waitTime);
      }
    }

    this.processing = false;
  }

  /**
   * Check if a request can proceed without exceeding rate limits
   */
  private canProceed(provider: LLMProvider): boolean {
    const config = this.getProviderConfig(provider);
    const now = Date.now();

    // Check provider rate limit info from headers
    if (this.autoThrottle) {
      const rateLimitInfo = this.rateLimitInfo.get(provider);
      if (rateLimitInfo) {
        // If we have remaining count from headers, use it
        if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining === 0) {
          // Check if rate limit has reset
          if (rateLimitInfo.reset && rateLimitInfo.reset * 1000 > now) {
            return false;
          }
        }
      }
    }

    // Get request history for this provider
    const providerRequests = this.requests.get(provider) || [];

    // Check requests per second limit
    if (config.requestsPerSecond) {
      const secondAgo = now - 1000;
      const recentRequests = providerRequests.filter(r => r.timestamp > secondAgo);
      if (recentRequests.length >= config.requestsPerSecond) {
        return false;
      }
    }

    // Check requests per minute limit
    if (config.requestsPerMinute) {
      const minuteAgo = now - 60000;
      const recentRequests = providerRequests.filter(r => r.timestamp > minuteAgo);
      if (recentRequests.length >= config.requestsPerMinute) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record a request
   */
  private recordRequest(provider: LLMProvider): void {
    const record: RequestRecord = {
      timestamp: Date.now(),
      provider,
    };

    const providerRequests = this.requests.get(provider) || [];
    providerRequests.push(record);
    this.requests.set(provider, providerRequests);

    // Clean up old requests (older than 1 minute)
    this.cleanupOldRequests(provider);
  }

  /**
   * Clean up old request records to prevent memory leaks
   */
  private cleanupOldRequests(provider: LLMProvider): void {
    const now = Date.now();
    const minuteAgo = now - 60000;

    const providerRequests = this.requests.get(provider) || [];
    const recentRequests = providerRequests.filter(r => r.timestamp > minuteAgo);
    this.requests.set(provider, recentRequests);
  }

  /**
   * Parse rate limit headers from provider response
   */
  parseRateLimitHeaders(
    provider: LLMProvider,
    headers: Record<string, string | string[] | undefined>
  ): void {
    if (!this.autoThrottle) return;

    const info: RateLimitHeaders = {};

    // Parse common rate limit headers
    const remaining = this.getHeader(headers, [
      'x-ratelimit-remaining',
      'ratelimit-remaining',
      'x-rate-limit-remaining',
    ]);
    if (remaining) {
      info.remaining = parseInt(remaining, 10);
    }

    const limit = this.getHeader(headers, [
      'x-ratelimit-limit',
      'ratelimit-limit',
      'x-rate-limit-limit',
    ]);
    if (limit) {
      info.limit = parseInt(limit, 10);
    }

    const reset = this.getHeader(headers, [
      'x-ratelimit-reset',
      'ratelimit-reset',
      'x-rate-limit-reset',
    ]);
    if (reset) {
      info.reset = parseInt(reset, 10);
    }

    const retryAfter = this.getHeader(headers, [
      'retry-after',
      'x-retry-after',
    ]);
    if (retryAfter) {
      info.retryAfter = parseInt(retryAfter, 10);
    }

    if (Object.keys(info).length > 0) {
      this.rateLimitInfo.set(provider, info);
    }
  }

  /**
   * Get header value (case-insensitive)
   */
  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    possibleKeys: string[]
  ): string | undefined {
    for (const key of possibleKeys) {
      // Try exact match first
      if (headers[key]) {
        const value = headers[key];
        return Array.isArray(value) ? value[0] : value;
      }

      // Try case-insensitive match
      const lowerKey = key.toLowerCase();
      const foundKey = Object.keys(headers).find(
        k => k.toLowerCase() === lowerKey
      );
      if (foundKey && headers[foundKey]) {
        const value = headers[foundKey];
        return Array.isArray(value) ? value[0] : value;
      }
    }
    return undefined;
  }

  /**
   * Get wait time before next request can be made
   */
  private getWaitTime(provider: LLMProvider): number {
    const config = this.getProviderConfig(provider);
    const now = Date.now();

    // Check if we have retry-after from headers
    if (this.autoThrottle) {
      const rateLimitInfo = this.rateLimitInfo.get(provider);
      if (rateLimitInfo?.retryAfter) {
        return rateLimitInfo.retryAfter * 1000;
      }
      if (rateLimitInfo?.reset) {
        const resetTime = rateLimitInfo.reset * 1000;
        if (resetTime > now) {
          return resetTime - now;
        }
      }
    }

    const providerRequests = this.requests.get(provider) || [];

    // Calculate wait time based on configured limits
    if (config.requestsPerSecond) {
      const secondAgo = now - 1000;
      const recentRequests = providerRequests.filter(r => r.timestamp > secondAgo);
      if (recentRequests.length >= config.requestsPerSecond) {
        const oldestRequest = recentRequests[0];
        return Math.max(100, oldestRequest.timestamp + 1000 - now);
      }
    }

    if (config.requestsPerMinute) {
      const minuteAgo = now - 60000;
      const recentRequests = providerRequests.filter(r => r.timestamp > minuteAgo);
      if (recentRequests.length >= config.requestsPerMinute) {
        const oldestRequest = recentRequests[0];
        return Math.max(100, oldestRequest.timestamp + 60000 - now);
      }
    }

    // Default wait time if no limits configured
    return 100;
  }

  /**
   * Get rate limit configuration for a provider
   */
  private getProviderConfig(provider: LLMProvider): RateLimitConfig {
    // Check for provider-specific config
    const config = this.providerLimits.get(provider);
    if (config) {
      return config;
    }

    // Fall back to default config
    const defaultConfig = this.providerLimits.get('default' as any);
    if (defaultConfig) {
      return defaultConfig;
    }

    // Return permissive defaults if nothing configured
    return {
      autoThrottle: this.autoThrottle,
    };
  }

  /**
   * Get current rate limit status for a provider
   */
  getStatus(provider: LLMProvider): {
    requestsInLastSecond: number;
    requestsInLastMinute: number;
    queuedRequests: number;
    rateLimitInfo?: RateLimitHeaders;
  } {
    const now = Date.now();
    const providerRequests = this.requests.get(provider) || [];

    const secondAgo = now - 1000;
    const minuteAgo = now - 60000;

    return {
      requestsInLastSecond: providerRequests.filter(r => r.timestamp > secondAgo).length,
      requestsInLastMinute: providerRequests.filter(r => r.timestamp > minuteAgo).length,
      queuedRequests: this.queue.filter(r => r.provider === provider).length,
      rateLimitInfo: this.rateLimitInfo.get(provider),
    };
  }

  /**
   * Reset rate limiter for a specific provider
   */
  reset(provider?: LLMProvider): void {
    if (provider) {
      this.requests.delete(provider);
      this.rateLimitInfo.delete(provider);
      // Remove queued requests for this provider
      this.queue = this.queue.filter(r => {
        if (r.provider === provider) {
          r.reject(new Error('Rate limiter reset'));
          return false;
        }
        return true;
      });
    } else {
      // Reset all providers
      this.requests.clear();
      this.rateLimitInfo.clear();
      // Reject all queued requests
      this.queue.forEach(r => r.reject(new Error('Rate limiter reset')));
      this.queue = [];
      this.processing = false;
    }
  }

  /**
   * Update rate limit configuration for a provider
   */
  setProviderLimit(provider: LLMProvider, config: RateLimitConfig): void {
    this.providerLimits.set(provider, config);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if rate limiter has any pending requests
   */
  hasPendingRequests(): boolean {
    return this.queue.length > 0;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a rate limiter instance
 *
 * @example
 * const rateLimiter = createRateLimiter({
 *   providers: {
 *     openai: { requestsPerMinute: 60 },
 *     anthropic: { requestsPerMinute: 100 },
 *   },
 *   autoThrottle: true,
 * });
 *
 * // Use in your request flow
 * await rateLimiter.acquire('openai');
 * // Make your API request...
 * rateLimiter.parseRateLimitHeaders('openai', response.headers);
 */
export function createRateLimiter(options?: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}
