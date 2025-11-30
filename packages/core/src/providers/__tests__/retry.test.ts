/**
 * Tests for Retry System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  classifyError,
  shouldRetryError,
  calculateDelay,
  getProviderRetryConfig,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '../retry';
import { RanaRateLimitError, RanaNetworkError, RanaAuthError } from '../../types';

describe('Retry System', () => {
  describe('classifyError', () => {
    it('should classify RanaRateLimitError as rate_limit', () => {
      const error = new RanaRateLimitError('anthropic', {});
      expect(classifyError(error)).toBe('rate_limit');
    });

    it('should classify RanaNetworkError as network_error', () => {
      const error = new RanaNetworkError('openai', {});
      expect(classifyError(error)).toBe('network_error');
    });

    it('should not retry RanaAuthError', () => {
      const error = new RanaAuthError('google', {});
      expect(classifyError(error)).toBeNull();
    });

    it('should classify 429 status as rate_limit', () => {
      const error = new Error('Too many requests');
      (error as any).status = 429;
      expect(classifyError(error)).toBe('rate_limit');
    });

    it('should classify 503 status as service_unavailable', () => {
      const error = new Error('Service unavailable');
      (error as any).statusCode = 503;
      expect(classifyError(error)).toBe('service_unavailable');
    });

    it('should classify 500 status as server_error', () => {
      const error = new Error('Internal server error');
      (error as any).status = 500;
      expect(classifyError(error)).toBe('server_error');
    });

    it('should classify timeout messages as timeout', () => {
      const error = new Error('Request timeout');
      expect(classifyError(error)).toBe('timeout');
    });

    it('should not retry 4xx client errors', () => {
      const error = new Error('Bad request');
      (error as any).status = 400;
      expect(classifyError(error)).toBeNull();
    });
  });

  describe('shouldRetryError', () => {
    const config: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 3,
      retryOn: ['rate_limit', 'timeout'],
    };

    it('should retry rate limit errors', () => {
      const error = new RanaRateLimitError('anthropic', {});
      expect(shouldRetryError(error, config, 0)).toBe(true);
    });

    it('should not retry if max retries exceeded', () => {
      const error = new RanaRateLimitError('anthropic', {});
      expect(shouldRetryError(error, config, 3)).toBe(false);
    });

    it('should not retry errors not in retryOn list', () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      expect(shouldRetryError(error, config, 0)).toBe(false);
    });

    it('should use custom shouldRetry function if provided', () => {
      const customConfig = {
        ...config,
        shouldRetry: (error: any, attempt: number) => attempt < 2,
      };
      const error = new Error('Any error');
      expect(shouldRetryError(error, customConfig, 0)).toBe(true);
      expect(shouldRetryError(error, customConfig, 2)).toBe(false);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
      };

      expect(calculateDelay(0, config)).toBe(1000);
      expect(calculateDelay(1, config)).toBe(2000);
      expect(calculateDelay(2, config)).toBe(4000);
    });

    it('should respect maxDelay', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        jitter: false,
      };

      expect(calculateDelay(10, config)).toBe(5000);
    });

    it('should add jitter when enabled', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitter: true,
      };

      const delay = calculateDelay(1, config);
      // With jitter, delay should be between 1000 (0.5 * 2000) and 3000 (1.5 * 2000)
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(3000);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn, { maxRetries: 3 });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result.result).toBe('success');
      expect(result.metadata.retryCount).toBe(0);
      expect(result.metadata.succeeded).toBe(true);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RanaRateLimitError('anthropic', {}))
        .mockRejectedValueOnce(new RanaRateLimitError('anthropic', {}))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        baseDelay: 10,
        retryOn: ['rate_limit'],
      });

      expect(fn).toHaveBeenCalledTimes(3);
      expect(result.result).toBe('success');
      expect(result.metadata.retryCount).toBe(2);
      expect(result.metadata.succeeded).toBe(true);
    });

    it('should throw after max retries', async () => {
      const error = new RanaRateLimitError('anthropic', {});
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          baseDelay: 10,
          retryOn: ['rate_limit'],
        })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const error = new RanaAuthError('anthropic', {});
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          baseDelay: 10,
        })
      ).rejects.toThrow(error);

      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const error = new RanaRateLimitError('anthropic', {});
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      await withRetry(fn, {
        maxRetries: 2,
        baseDelay: 10,
        retryOn: ['rate_limit'],
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(error, 1, expect.any(Number));
    });

    it('should track retry metadata', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new RanaRateLimitError('anthropic', {}))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 2,
        baseDelay: 10,
        retryOn: ['rate_limit'],
      });

      expect(result.metadata.retryCount).toBe(1);
      expect(result.metadata.retryDelays).toHaveLength(1);
      expect(result.metadata.retryDelays[0]).toBeGreaterThan(0);
      expect(result.metadata.totalRetryTime).toBeGreaterThan(0);
    });
  });

  describe('getProviderRetryConfig', () => {
    it('should return provider-specific config for anthropic', () => {
      const config = getProviderRetryConfig('anthropic');
      expect(config.maxRetries).toBe(3);
      expect(config.baseDelay).toBe(1000);
    });

    it('should return provider-specific config for ollama', () => {
      const config = getProviderRetryConfig('ollama');
      expect(config.maxRetries).toBe(2);
      expect(config.retryOn).toContain('network_error');
    });

    it('should return default config for unknown providers', () => {
      const config = getProviderRetryConfig('xai');
      expect(config).toBeDefined();
    });
  });
});
