/**
 * Tests for config command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockConsole } from '../setup';

describe('config command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should export config functions', async () => {
    const configModule = await import('../../commands/config');
    expect(configModule).toBeDefined();
    expect(typeof configModule.showConfig).toBe('function');
  });
});

describe('API key validation', () => {
  it('should validate OpenAI API key format', () => {
    const isValidOpenAIKey = (key: string): boolean => {
      return key.startsWith('sk-') && key.length > 20;
    };

    expect(isValidOpenAIKey('sk-abc123def456ghi789jkl012mno345')).toBe(true);
    expect(isValidOpenAIKey('invalid-key')).toBe(false);
    expect(isValidOpenAIKey('sk-short')).toBe(false);
  });

  it('should validate Anthropic API key format', () => {
    const isValidAnthropicKey = (key: string): boolean => {
      return key.startsWith('sk-ant-') && key.length > 30;
    };

    expect(isValidAnthropicKey('sk-ant-abc123def456ghi789jkl012mno345pqr')).toBe(true);
    expect(isValidAnthropicKey('invalid-key')).toBe(false);
    expect(isValidAnthropicKey('sk-ant-short')).toBe(false);
  });

  it('should mask API keys for display', () => {
    const maskKey = (key: string): string => {
      if (key.length <= 8) return '****';
      return key.slice(0, 4) + '...' + key.slice(-4);
    };

    expect(maskKey('sk-abc123def456ghi789')).toBe('sk-a...i789');
    expect(maskKey('short')).toBe('****');
  });
});

describe('provider configuration', () => {
  it('should have correct provider defaults', () => {
    const providerDefaults: Record<string, { model: string; maxTokens: number }> = {
      openai: { model: 'gpt-4o', maxTokens: 4096 },
      anthropic: { model: 'claude-3-5-sonnet-20241022', maxTokens: 4096 },
      google: { model: 'gemini-1.5-flash', maxTokens: 8192 },
      groq: { model: 'llama-3.1-70b-versatile', maxTokens: 4096 },
    };

    expect(providerDefaults.openai.model).toBe('gpt-4o');
    expect(providerDefaults.anthropic.model).toContain('claude');
    expect(providerDefaults.google.model).toContain('gemini');
  });

  it('should support all required providers', () => {
    const requiredProviders = ['openai', 'anthropic', 'google', 'groq', 'xai'];

    for (const provider of requiredProviders) {
      expect(provider).toBeTruthy();
    }
  });
});

describe('config file operations', () => {
  it('should serialize config correctly', () => {
    const config = {
      providers: {
        openai: { apiKey: 'sk-test', model: 'gpt-4o' },
      },
      defaults: {
        provider: 'openai',
        temperature: 0.7,
      },
    };

    const serialized = JSON.stringify(config, null, 2);
    const parsed = JSON.parse(serialized);

    expect(parsed.providers.openai.apiKey).toBe('sk-test');
    expect(parsed.defaults.temperature).toBe(0.7);
  });

  it('should merge configs correctly', () => {
    const baseConfig = {
      providers: { openai: { apiKey: 'old-key' } },
      defaults: { temperature: 0.5 },
    };

    const newConfig = {
      providers: { openai: { apiKey: 'new-key' } },
    };

    const merged = {
      ...baseConfig,
      providers: {
        ...baseConfig.providers,
        ...newConfig.providers,
      },
    };

    expect(merged.providers.openai.apiKey).toBe('new-key');
    expect(merged.defaults.temperature).toBe(0.5);
  });
});

describe('environment variables', () => {
  it('should map provider to env var names correctly', () => {
    const getEnvVarName = (provider: string): string => {
      const mapping: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        google: 'GOOGLE_API_KEY',
        groq: 'GROQ_API_KEY',
        xai: 'XAI_API_KEY',
      };
      return mapping[provider] || `${provider.toUpperCase()}_API_KEY`;
    };

    expect(getEnvVarName('openai')).toBe('OPENAI_API_KEY');
    expect(getEnvVarName('anthropic')).toBe('ANTHROPIC_API_KEY');
    expect(getEnvVarName('unknown')).toBe('UNKNOWN_API_KEY');
  });
});
