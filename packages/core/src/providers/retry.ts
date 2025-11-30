/**
 * RANA Retry System with Exponential Backoff
 * Advanced retry logic with jitter, configurable strategies, and error classification
 */

import type { LLMProvider } from '../types';
import {
  RanaError,
  RanaRateLimitError,
  RanaNetworkError,
  RanaAuthError,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export type RetryableErrorType =
  | 'rate_limit'
  | 'timeout'
  | 'server_error'
  | 'network_error'
  | 'service_unavailable';

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries */
  baseDelay: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay: number;
  /** Which error types should trigger a retry */
  retryOn: RetryableErrorType[];
  /** Whether to add jitter to prevent thundering herd */
  jitter: boolean;
  /** Backoff multiplier (2 = exponential doubling) */
  backoffMultiplier: number;
  /** Custom retry condition function */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** Callback invoked before each retry attempt */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

export interface RetryMetadata {
  /** Number of retry attempts made */
  retryCount: number;
  /** Total time spent on retries in milliseconds */
  totalRetryTime: number;
  /** Whether the request succeeded after retries */
  succeeded: boolean;
  /** Delays used for each retry attempt */
  retryDelays: number[];
  /** Error that triggered the last retry (if any) */
  lastRetryError?: string;
}

export interface RetryResult<T> {
  /** The result of the operation */
  result: T;
  /** Metadata about the retry attempts */
  metadata: RetryMetadata;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryOn: ['rate_limit', 'timeout', 'server_error', 'network_error'],
  jitter: true,
  backoffMultiplier: 2,
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classify an error to determine if it's retryable
 */
export function classifyError(error: any): RetryableErrorType | null {
  // Handle RANA-specific errors
  if (error instanceof RanaRateLimitError) {
    return 'rate_limit';
  }

  if (error instanceof RanaNetworkError) {
    return 'network_error';
  }

  // Don't retry auth errors - they won't succeed on retry
  if (error instanceof RanaAuthError) {
    return null;
  }

  // Check HTTP status codes
  const statusCode = error.statusCode || error.status || error.response?.status;

  if (statusCode) {
    // 429 - Rate limit
    if (statusCode === 429) {
      return 'rate_limit';
    }

    // 5xx - Server errors (retryable)
    if (statusCode >= 500 && statusCode < 600) {
      if (statusCode === 503) {
        return 'service_unavailable';
      }
      return 'server_error';
    }

    // 408 - Request timeout
    if (statusCode === 408) {
      return 'timeout';
    }

    // 4xx - Client errors (not retryable, except 429)
    if (statusCode >= 400 && statusCode < 500) {
      return null;
    }
  }

  // Check error messages for common patterns
  const message = error.message?.toLowerCase() || '';

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('deadline')
  ) {
    return 'timeout';
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('quota')
  ) {
    return 'rate_limit';
  }

  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset') ||
    message.includes('fetch failed')
  ) {
    return 'network_error';
  }

  if (
    message.includes('service unavailable') ||
    message.includes('temporarily unavailable')
  ) {
    return 'service_unavailable';
  }

  if (
    message.includes('internal server error') ||
    message.includes('server error')
  ) {
    return 'server_error';
  }

  // Unknown error - default to not retryable
  return null;
}

/**
 * Determine if an error should be retried based on configuration
 */
export function shouldRetryError(
  error: any,
  config: RetryConfig,
  attempt: number
): boolean {
  // Check if max retries exceeded
  if (attempt >= config.maxRetries) {
    return false;
  }

  // Custom retry logic takes precedence
  if (config.shouldRetry) {
    return config.shouldRetry(error, attempt);
  }

  // Classify the error
  const errorType = classifyError(error);

  // If we can't classify it, don't retry
  if (!errorType) {
    return false;
  }

  // Check if this error type is in the retry list
  return config.retryOn.includes(errorType);
}

// ============================================================================
// Delay Calculation
// ============================================================================

/**
 * Calculate the delay before the next retry attempt with exponential backoff
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Base exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

  // Cap at maxDelay
  let delay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter to prevent thundering herd
  // Jitter adds randomness: delay * (0.5 to 1.5)
  if (config.jitter) {
    const jitterFactor = 0.5 + Math.random(); // Random value between 0.5 and 1.5
    delay = delay * jitterFactor;
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @example
 * const result = await withRetry(
 *   () => apiCall(),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     maxDelay: 30000,
 *     retryOn: ['rate_limit', 'timeout', 'server_error']
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  const metadata: RetryMetadata = {
    retryCount: 0,
    totalRetryTime: 0,
    succeeded: false,
    retryDelays: [],
  };

  let lastError: any;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const result = await fn();
      metadata.succeeded = true;
      metadata.totalRetryTime = Date.now() - startTime;
      return { result, metadata };
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = shouldRetryError(error, fullConfig, attempt);

      if (!shouldRetry) {
        // Don't retry, throw immediately
        metadata.totalRetryTime = Date.now() - startTime;
        throw error;
      }

      // This was a retry attempt (not the initial try)
      if (attempt > 0) {
        metadata.retryCount++;
      }

      metadata.lastRetryError = error.message || String(error);

      // Calculate delay before next retry
      const delay = calculateDelay(attempt, fullConfig);
      metadata.retryDelays.push(delay);

      // Call onRetry callback if provided
      if (fullConfig.onRetry) {
        fullConfig.onRetry(error, attempt + 1, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  metadata.totalRetryTime = Date.now() - startTime;
  throw lastError;
}

/**
 * Create a retry wrapper function with preset configuration
 *
 * @example
 * const retryFn = createRetryWrapper({
 *   maxRetries: 5,
 *   baseDelay: 2000,
 *   retryOn: ['rate_limit', 'timeout']
 * });
 *
 * const result = await retryFn(() => apiCall());
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: () => Promise<T>): Promise<RetryResult<T>> => {
    return withRetry(fn, config);
  };
}

// ============================================================================
// Provider-Specific Retry Configs
// ============================================================================

/**
 * Get recommended retry configuration for a specific provider
 */
export function getProviderRetryConfig(
  provider: LLMProvider
): Partial<RetryConfig> {
  const configs: Record<LLMProvider, Partial<RetryConfig>> = {
    anthropic: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 60000,
      retryOn: ['rate_limit', 'timeout', 'server_error', 'service_unavailable'],
    },
    openai: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 60000,
      retryOn: ['rate_limit', 'timeout', 'server_error'],
    },
    google: {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 30000,
      retryOn: ['rate_limit', 'timeout', 'server_error'],
    },
    ollama: {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 10000,
      retryOn: ['network_error', 'timeout', 'service_unavailable'],
    },
    // Default for other providers
    xai: DEFAULT_RETRY_CONFIG,
    mistral: DEFAULT_RETRY_CONFIG,
    cohere: DEFAULT_RETRY_CONFIG,
    together: DEFAULT_RETRY_CONFIG,
    groq: DEFAULT_RETRY_CONFIG,
  };

  return configs[provider] || DEFAULT_RETRY_CONFIG;
}
