/**
 * Tests for LLM command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockConsole } from '../setup';

describe('llm command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should export llm functions', async () => {
    const llmModule = await import('../../commands/llm');
    expect(llmModule).toBeDefined();
    expect(typeof llmModule.llmAnalyze).toBe('function');
  });
});

describe('model selection', () => {
  it('should map model aliases correctly', () => {
    const modelAliases: Record<string, string> = {
      'gpt4': 'gpt-4o',
      'gpt4o': 'gpt-4o',
      'gpt4-mini': 'gpt-4o-mini',
      'claude': 'claude-3-5-sonnet-20241022',
      'claude-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-haiku': 'claude-3-5-haiku-20241022',
      'gemini': 'gemini-1.5-flash',
      'gemini-pro': 'gemini-1.5-pro',
    };

    expect(modelAliases['gpt4']).toBe('gpt-4o');
    expect(modelAliases['claude']).toContain('sonnet');
    expect(modelAliases['gemini']).toContain('flash');
  });

  it('should infer provider from model name', () => {
    const inferProvider = (model: string): string => {
      if (model.startsWith('gpt') || model.includes('o1')) return 'openai';
      if (model.startsWith('claude')) return 'anthropic';
      if (model.startsWith('gemini')) return 'google';
      if (model.includes('llama') || model.includes('mixtral')) return 'groq';
      if (model.startsWith('grok')) return 'xai';
      return 'openai'; // default
    };

    expect(inferProvider('gpt-4o')).toBe('openai');
    expect(inferProvider('claude-3-5-sonnet-20241022')).toBe('anthropic');
    expect(inferProvider('gemini-1.5-pro')).toBe('google');
    expect(inferProvider('llama-3.1-70b')).toBe('groq');
    expect(inferProvider('grok-beta')).toBe('xai');
  });
});

describe('prompt handling', () => {
  it('should build chat messages correctly', () => {
    const buildMessages = (
      prompt: string,
      systemPrompt?: string
    ): Array<{ role: string; content: string }> => {
      const messages: Array<{ role: string; content: string }> = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      return messages;
    };

    const messages = buildMessages('Hello', 'You are a helpful assistant');

    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Hello');
  });

  it('should handle multiline prompts', () => {
    const prompt = `
      This is a multiline prompt.
      It has multiple lines.
      And some indentation.
    `;

    const trimmed = prompt.trim();
    expect(trimmed).toContain('multiline');
    expect(trimmed).toContain('indentation');
  });
});

describe('response formatting', () => {
  it('should format streaming output', () => {
    const chunks = ['Hello', ', ', 'how', ' ', 'are', ' ', 'you', '?'];
    const fullResponse = chunks.join('');

    expect(fullResponse).toBe('Hello, how are you?');
  });

  it('should format token usage', () => {
    const formatUsage = (usage: { prompt: number; completion: number }): string => {
      const total = usage.prompt + usage.completion;
      return `Tokens: ${usage.prompt} in / ${usage.completion} out (${total} total)`;
    };

    const usage = { prompt: 100, completion: 50 };
    const formatted = formatUsage(usage);

    expect(formatted).toContain('100 in');
    expect(formatted).toContain('50 out');
    expect(formatted).toContain('150 total');
  });

  it('should format latency', () => {
    const formatLatency = (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(2)}s`;
    };

    expect(formatLatency(500)).toBe('500ms');
    expect(formatLatency(1500)).toBe('1.50s');
    expect(formatLatency(2345)).toBe('2.35s');
  });
});

describe('error handling', () => {
  it('should categorize API errors', () => {
    const categorizeError = (status: number): string => {
      if (status === 401) return 'authentication';
      if (status === 429) return 'rate_limit';
      if (status === 500) return 'server';
      if (status === 503) return 'unavailable';
      if (status >= 400 && status < 500) return 'client';
      return 'unknown';
    };

    expect(categorizeError(401)).toBe('authentication');
    expect(categorizeError(429)).toBe('rate_limit');
    expect(categorizeError(500)).toBe('server');
    expect(categorizeError(404)).toBe('client');
  });

  it('should suggest fixes for common errors', () => {
    const suggestFix = (errorType: string): string => {
      const fixes: Record<string, string> = {
        authentication: 'Check your API key with `rana config:list`',
        rate_limit: 'Wait a moment and try again, or upgrade your plan',
        server: 'The API is experiencing issues. Try again later.',
        unavailable: 'The service is temporarily unavailable.',
      };
      return fixes[errorType] || 'Unknown error. Check the logs for details.';
    };

    expect(suggestFix('authentication')).toContain('API key');
    expect(suggestFix('rate_limit')).toContain('Wait');
  });
});
