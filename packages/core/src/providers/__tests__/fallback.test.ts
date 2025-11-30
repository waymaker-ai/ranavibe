/**
 * Unit Tests for Provider Fallback System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackManager } from '../fallback';
import { ProviderManager } from '../manager';
import type { RanaChatRequest, LLMProvider } from '../../types';

describe('FallbackManager', () => {
  let providerManager: ProviderManager;
  let fallbackManager: FallbackManager;

  beforeEach(() => {
    // Create a provider manager with mock keys
    providerManager = new ProviderManager({
      openai: 'test-key-1',
      anthropic: 'test-key-2',
      google: 'test-key-3',
    });
  });

  describe('Basic Fallback', () => {
    it('should use the first provider when it succeeds', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic', 'google'],
      });

      // Mock the provider manager to succeed on first try
      const mockChat = vi.spyOn(providerManager, 'chat').mockResolvedValueOnce({
        id: 'test-1',
        provider: 'openai',
        model: 'gpt-4o',
        content: 'Hello!',
        role: 'assistant',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        cost: { prompt_cost: 0.0001, completion_cost: 0.0001, total_cost: 0.0002 },
        latency_ms: 100,
        cached: false,
        created_at: new Date(),
        finish_reason: 'stop',
        raw: {},
      });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await fallbackManager.chat(request);

      expect(response.provider).toBe('openai');
      expect(response.fallbackMetadata.usedFallback).toBe(false);
      expect(response.fallbackMetadata.totalAttempts).toBe(1);
      expect(response.fallbackMetadata.attemptedProviders).toEqual(['openai']);
      expect(mockChat).toHaveBeenCalledTimes(1);
    });

    it('should fall back to second provider when first fails', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic', 'google'],
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockResolvedValueOnce({
          id: 'test-2',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          content: 'Hello from Anthropic!',
          role: 'assistant',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          cost: { prompt_cost: 0.0001, completion_cost: 0.0001, total_cost: 0.0002 },
          latency_ms: 150,
          cached: false,
          created_at: new Date(),
          finish_reason: 'stop',
          raw: {},
        });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await fallbackManager.chat(request);

      expect(response.provider).toBe('anthropic');
      expect(response.fallbackMetadata.usedFallback).toBe(true);
      expect(response.fallbackMetadata.totalAttempts).toBe(2);
      expect(response.fallbackMetadata.attemptedProviders).toEqual(['openai', 'anthropic']);
      expect(response.fallbackMetadata.failures).toHaveLength(1);
      expect(response.fallbackMetadata.failures[0].provider).toBe('openai');
      expect(mockChat).toHaveBeenCalledTimes(2);
    });

    it('should try all providers before failing', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic', 'google'],
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockRejectedValueOnce(new Error('Anthropic error'))
        .mockRejectedValueOnce(new Error('Google error'));

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(fallbackManager.chat(request)).rejects.toThrow(/All providers failed/);
      expect(mockChat).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retry Configuration', () => {
    it('should retry failed provider before moving to next', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic'],
        maxRetries: 2,
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI error 1'))
        .mockRejectedValueOnce(new Error('OpenAI error 2'))
        .mockRejectedValueOnce(new Error('OpenAI error 3'))
        .mockResolvedValueOnce({
          id: 'test-3',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          content: 'Success!',
          role: 'assistant',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          cost: { prompt_cost: 0.0001, completion_cost: 0.0001, total_cost: 0.0002 },
          latency_ms: 150,
          cached: false,
          created_at: new Date(),
          finish_reason: 'stop',
          raw: {},
        });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await fallbackManager.chat(request);

      expect(response.provider).toBe('anthropic');
      expect(response.fallbackMetadata.totalAttempts).toBe(4); // 3 OpenAI attempts + 1 Anthropic
      expect(mockChat).toHaveBeenCalledTimes(4);
    });

    it('should respect per-provider retry configuration', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic'],
        maxRetries: 1, // Default 1 retry
      });

      // Configure OpenAI with more retries
      fallbackManager.configureProviderRetry({
        provider: 'openai',
        maxRetries: 3,
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI error 1'))
        .mockRejectedValueOnce(new Error('OpenAI error 2'))
        .mockRejectedValueOnce(new Error('OpenAI error 3'))
        .mockRejectedValueOnce(new Error('OpenAI error 4'))
        .mockResolvedValueOnce({
          id: 'test-4',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          content: 'Success!',
          role: 'assistant',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          cost: { prompt_cost: 0.0001, completion_cost: 0.0001, total_cost: 0.0002 },
          latency_ms: 150,
          cached: false,
          created_at: new Date(),
          finish_reason: 'stop',
          raw: {},
        });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await fallbackManager.chat(request);

      expect(response.provider).toBe('anthropic');
      expect(response.fallbackMetadata.totalAttempts).toBe(5); // 4 OpenAI + 1 Anthropic
      expect(mockChat).toHaveBeenCalledTimes(5);
    });
  });

  describe('Callbacks', () => {
    it('should call onFallback when switching providers', async () => {
      const onFallback = vi.fn();

      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic', 'google'],
        onFallback,
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockRejectedValueOnce(new Error('Anthropic error'))
        .mockResolvedValueOnce({
          id: 'test-5',
          provider: 'google',
          model: 'gemini-2.0-flash-exp',
          content: 'Success!',
          role: 'assistant',
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          cost: { prompt_cost: 0, completion_cost: 0, total_cost: 0 },
          latency_ms: 100,
          cached: false,
          created_at: new Date(),
          finish_reason: 'stop',
          raw: {},
        });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await fallbackManager.chat(request);

      expect(onFallback).toHaveBeenCalledTimes(2);
      expect(onFallback).toHaveBeenNthCalledWith(
        1,
        'openai',
        'anthropic',
        expect.any(Error)
      );
      expect(onFallback).toHaveBeenNthCalledWith(
        2,
        'anthropic',
        'google',
        expect.any(Error)
      );
    });
  });

  describe('Configuration Management', () => {
    it('should allow updating configuration', () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai'],
      });

      fallbackManager.updateConfig({
        order: ['anthropic', 'google'],
        maxRetries: 3,
      });

      const config = fallbackManager.getConfig();
      expect(config.order).toEqual(['anthropic', 'google']);
      expect(config.maxRetries).toBe(3);
    });

    it('should allow clearing provider retry configs', () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic'],
      });

      fallbackManager.configureProviderRetry({
        provider: 'openai',
        maxRetries: 5,
      });

      fallbackManager.clearProviderRetryConfigs();

      // After clearing, should use default retry config
      expect(() => fallbackManager.clearProviderRetryConfigs()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no providers are configured', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: [],
      });

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(fallbackManager.chat(request)).rejects.toThrow(
        'No providers configured for fallback'
      );
    });

    it('should include detailed failure information in error', async () => {
      fallbackManager = new FallbackManager(providerManager, {
        order: ['openai', 'anthropic'],
        trackAttempts: true,
      });

      const mockChat = vi.spyOn(providerManager, 'chat')
        .mockRejectedValueOnce(new Error('OpenAI: Rate limit exceeded'))
        .mockRejectedValueOnce(new Error('Anthropic: Auth failed'));

      const request: RanaChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      try {
        await fallbackManager.chat(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toContain('All providers failed');
        expect(message).toContain('openai, anthropic');
        expect(message).toContain('OpenAI: Rate limit exceeded');
        expect(message).toContain('Anthropic: Auth failed');
      }
    });
  });
});
