import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
} from '../cache';
import {
  configure,
  getConfig,
  mergeConfig,
  recommendedModels,
  modelCosts,
} from '../config';
import { parseJSON } from '../helpers/base';

// ---------------------------------------------------------------------------
// Mock the callLLM function for all helpers
// ---------------------------------------------------------------------------

vi.mock('../helpers/base', async (importOriginal) => {
  const original = await importOriginal<typeof import('../helpers/base')>();
  return {
    ...original,
    callLLM: vi.fn(),
    parseJSON: original.parseJSON,
  };
});

import { callLLM } from '../helpers/base';
import { summarize, summarizeBatch } from '../helpers/summarize';
import { translate, detectLanguage } from '../helpers/translate';
import { classify, classifyBinary } from '../helpers/classify';
import { extract, extractEntities } from '../helpers/extract';
import { sentiment, isPositive, isNegative } from '../helpers/sentiment';
import { answer, answerYesNo } from '../helpers/answer';
import { rewrite, fixGrammar } from '../helpers/rewrite';
import { generate, generateTweet, generateEmail } from '../helpers/generate';
import { compare, isSimilar } from '../helpers/compare';
import { moderate, isSafe, isSpam } from '../helpers/moderate';

const mockedCallLLM = vi.mocked(callLLM);

function mockResult(result: unknown) {
  mockedCallLLM.mockResolvedValueOnce({
    result,
    metadata: {
      cached: false,
      cost: 0.001,
      latencyMs: 150,
      provider: 'openai',
      model: 'gpt-4o-mini',
      requestId: 'test-req-001',
    },
  });
}

// ===========================================================================
// Cache
// ===========================================================================

describe('Cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should generate deterministic cache keys', () => {
    const key1 = generateCacheKey('summarize', 'hello world', { model: 'gpt-4o' });
    const key2 = generateCacheKey('summarize', 'hello world', { model: 'gpt-4o' });
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different inputs', () => {
    const key1 = generateCacheKey('summarize', 'hello', {});
    const key2 = generateCacheKey('summarize', 'goodbye', {});
    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different operations', () => {
    const key1 = generateCacheKey('summarize', 'text', {});
    const key2 = generateCacheKey('translate', 'text', {});
    expect(key1).not.toBe(key2);
  });

  it('should normalize input (trim and lowercase)', () => {
    const key1 = generateCacheKey('op', 'Hello World ', {});
    const key2 = generateCacheKey('op', '  hello world', {});
    expect(key1).toBe(key2);
  });

  it('should set and get from cache', async () => {
    const key = 'test-key-1';
    await setInCache(key, { answer: 42 }, 3600);
    const result = await getFromCache<{ answer: number }>(key);
    expect(result).toEqual({ answer: 42 });
  });

  it('should return null for missing keys', async () => {
    const result = await getFromCache('nonexistent-key');
    expect(result).toBeNull();
  });

  it('should expire entries based on TTL', async () => {
    const key = 'short-ttl-key';
    await setInCache(key, 'data', 0); // 0 second TTL -> immediately expired
    // Fast-forward: TTL is in seconds, timestamp uses Date.now()
    // With 0 TTL, the next check should find it expired
    const result = await getFromCache(key);
    // Since TTL=0, now - timestamp will be >= 0 * 1000 = 0, so it's expired
    expect(result).toBeNull();
  });

  it('should clear all cache entries', async () => {
    await setInCache('key1', 'val1', 3600);
    await setInCache('key2', 'val2', 3600);
    clearCache();
    expect(await getFromCache('key1')).toBeNull();
    expect(await getFromCache('key2')).toBeNull();
  });

  it('should return cache stats', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('entries');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('memoryUsage');
    expect(typeof stats.entries).toBe('number');
  });

  it('should sort object keys for consistent hashing', () => {
    const key1 = generateCacheKey('op', 'text', { b: 2, a: 1 });
    const key2 = generateCacheKey('op', 'text', { a: 1, b: 2 });
    expect(key1).toBe(key2);
  });
});

// ===========================================================================
// Config
// ===========================================================================

describe('Config', () => {
  afterEach(() => {
    // Reset config to defaults
    configure({ provider: 'openai', model: 'gpt-4o-mini', cache: true, cacheTTL: 3600 });
  });

  it('should return default configuration', () => {
    const config = getConfig();
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-4o-mini');
    expect(config.cache).toBe(true);
  });

  it('should update configuration with configure()', () => {
    configure({ provider: 'anthropic', model: 'claude-3-haiku-20240307' });
    const config = getConfig();
    expect(config.provider).toBe('anthropic');
    expect(config.model).toBe('claude-3-haiku-20240307');
  });

  it('should merge config with per-call options', () => {
    configure({ provider: 'openai', model: 'gpt-4o-mini' });
    const merged = mergeConfig({ model: 'gpt-4o', timeout: 5000 });
    expect(merged.model).toBe('gpt-4o');
    expect(merged.timeout).toBe(5000);
    expect(merged.provider).toBe('openai'); // Inherited
  });

  it('should have recommended models for all tasks', () => {
    const tasks = ['summarize', 'translate', 'classify', 'extract', 'sentiment', 'answer', 'rewrite', 'generate', 'compare', 'moderate'];
    for (const task of tasks) {
      expect(recommendedModels[task]).toBeDefined();
      expect(recommendedModels[task].openai).toBeDefined();
      expect(recommendedModels[task].anthropic).toBeDefined();
    }
  });

  it('should have cost data for common models', () => {
    expect(modelCosts['gpt-4o']).toBeDefined();
    expect(modelCosts['gpt-4o'].input).toBeGreaterThan(0);
    expect(modelCosts['gpt-4o'].output).toBeGreaterThan(0);
    expect(modelCosts['claude-3-5-sonnet-20241022']).toBeDefined();
  });
});

// ===========================================================================
// parseJSON
// ===========================================================================

describe('parseJSON', () => {
  it('should parse raw JSON strings', () => {
    const result = parseJSON('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should extract JSON from markdown code blocks', () => {
    const result = parseJSON('```json\n{"key": "value"}\n```');
    expect(result).toEqual({ key: 'value' });
  });

  it('should extract JSON from plain code blocks', () => {
    const result = parseJSON('```\n{"key": "value"}\n```');
    expect(result).toEqual({ key: 'value' });
  });

  it('should throw on invalid JSON', () => {
    expect(() => parseJSON('not json at all')).toThrow('Failed to parse JSON');
  });
});

// ===========================================================================
// Summarize
// ===========================================================================

describe('summarize', () => {
  it('should call LLM and return summary result', async () => {
    mockResult('This is a brief summary of the article covering main points.');

    const result = await summarize('A long article about machine learning and its applications in modern healthcare systems.');
    expect(result.summary).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeDefined();
    expect(result.cost).toBe(0.001);
    expect(result.latencyMs).toBe(150);
  });

  it('should calculate compression ratio', async () => {
    mockResult('Short summary.');
    const result = await summarize('This is a longer text with many many words that need summarizing into something shorter.');
    expect(result.compressionRatio).toBeLessThan(1);
    expect(result.compressionRatio).toBeGreaterThan(0);
  });

  it('should handle empty input text', async () => {
    mockResult('');
    const result = await summarize('');
    expect(result.wordCount).toBe(0);
    expect(result.compressionRatio).toBe(0);
  });
});

// ===========================================================================
// Translate
// ===========================================================================

describe('translate', () => {
  it('should return translation result', async () => {
    mockResult({ translation: 'Hola mundo', sourceLanguage: 'en', confidence: 0.95 });

    const result = await translate('Hello world', { to: 'es' });
    expect(result.translation).toBe('Hola mundo');
    expect(result.targetLanguage).toBe('es');
    expect(result.sourceLanguage).toBe('en');
    expect(result.confidence).toBe(0.95);
  });

  it('should use default confidence when not provided', async () => {
    mockResult({ translation: 'Bonjour', sourceLanguage: 'en' });

    const result = await translate('Hello', { to: 'fr' });
    expect(result.confidence).toBe(0.9);
  });

  it('should pass formal flag', async () => {
    mockResult({ translation: 'Wie geht es Ihnen?', sourceLanguage: 'en', confidence: 0.9 });

    const result = await translate('How are you?', { to: 'de', formal: true });
    expect(result.translation).toBeDefined();
    expect(mockedCallLLM).toHaveBeenCalled();
  });
});

// ===========================================================================
// Classify
// ===========================================================================

describe('classify', () => {
  it('should return classification result', async () => {
    mockResult({
      label: 'spam',
      confidence: 0.95,
      confidences: { spam: 0.95, ham: 0.03, urgent: 0.02 },
    });

    const result = await classify('Buy cheap watches now!!!', ['spam', 'ham', 'urgent']);
    expect(result.label).toBe('spam');
    expect(result.confidence).toBe(0.95);
    expect(result.confidences).toBeDefined();
  });

  it('should support multi-label classification', async () => {
    mockResult({
      label: 'news',
      labels: ['news', 'sports'],
      confidence: 0.9,
      confidences: { news: 0.9, sports: 0.85, entertainment: 0.1 },
    });

    const result = await classify('Breaking sports news today', ['news', 'sports', 'entertainment'], {
      multiLabel: true,
      threshold: 0.5,
    });
    expect(result.labels).toBeDefined();
    expect(result.labels!.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter multi-label results by threshold', async () => {
    mockResult({
      label: 'tech',
      confidence: 0.9,
      confidences: { tech: 0.9, science: 0.6, politics: 0.2 },
    });

    const result = await classify('AI breakthrough in labs', ['tech', 'science', 'politics'], {
      multiLabel: true,
      threshold: 0.5,
    });
    expect(result.labels).toContain('tech');
    expect(result.labels).toContain('science');
    expect(result.labels).not.toContain('politics');
  });
});

// ===========================================================================
// Extract
// ===========================================================================

describe('extract', () => {
  it('should extract structured data from text', async () => {
    mockResult({ name: 'John Doe', email: 'john@example.com', phone: '555-1234' });

    const result = await extract(
      'Contact John Doe at john@example.com or call 555-1234',
      { name: 'string', email: 'string', phone: 'string' },
    );
    expect(result.data.name).toBe('John Doe');
    expect(result.data.email).toBe('john@example.com');
    expect(result.completeness).toBe(1);
  });

  it('should calculate partial completeness', async () => {
    mockResult({ name: 'Jane', email: null, phone: null });

    const result = await extract(
      'Jane mentioned something',
      { name: 'string', email: 'string', phone: 'string' },
    );
    expect(result.completeness).toBeCloseTo(1 / 3, 1);
  });

  it('should handle empty extraction result', async () => {
    mockResult({ name: null, email: null });

    const result = await extract('No useful data here', { name: 'string', email: 'string' });
    expect(result.completeness).toBe(0);
  });
});

// ===========================================================================
// Sentiment
// ===========================================================================

describe('sentiment', () => {
  it('should analyze positive sentiment', async () => {
    mockResult({ sentiment: 'positive', score: 0.85, confidence: 0.92 });

    const result = await sentiment('This product is absolutely wonderful and I love it!');
    expect(result.sentiment).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should analyze negative sentiment', async () => {
    mockResult({ sentiment: 'negative', score: -0.7, confidence: 0.88 });

    const result = await sentiment('This is the worst experience I have ever had.');
    expect(result.sentiment).toBe('negative');
    expect(result.score).toBeLessThan(0);
  });

  it('should support granular emotions', async () => {
    mockResult({
      sentiment: 'positive',
      score: 0.9,
      confidence: 0.95,
      emotions: { joy: 0.9, love: 0.7, surprise: 0.3, anger: 0.0 },
    });

    const result = await sentiment('I am so happy and excited!', { granular: true });
    expect(result.emotions).toBeDefined();
    expect(result.emotions!.joy).toBeGreaterThan(0.5);
  });

  it('should support aspect-based sentiment', async () => {
    mockResult({
      sentiment: 'mixed',
      score: 0.1,
      confidence: 0.85,
      aspects: {
        food: { sentiment: 'positive', score: 0.8 },
        service: { sentiment: 'negative', score: -0.6 },
      },
    });

    const result = await sentiment('Great food but terrible service', {
      aspects: ['food', 'service'],
    });
    expect(result.aspects).toBeDefined();
    expect(result.aspects!.food.sentiment).toBe('positive');
    expect(result.aspects!.service.sentiment).toBe('negative');
  });
});

describe('isPositive / isNegative', () => {
  it('should return true for positive text', async () => {
    mockResult({ sentiment: 'positive', score: 0.8, confidence: 0.9 });
    const result = await isPositive('Great product!');
    expect(result).toBe(true);
  });

  it('should return true for negative text', async () => {
    mockResult({ sentiment: 'negative', score: -0.8, confidence: 0.9 });
    const result = await isNegative('Terrible experience!');
    expect(result).toBe(true);
  });
});

// ===========================================================================
// Answer
// ===========================================================================

describe('answer', () => {
  it('should answer a simple question', async () => {
    mockResult({ answer: 'Paris', confidence: 0.99 });

    const result = await answer('What is the capital of France?');
    expect(result.answer).toBe('Paris');
    expect(result.confidence).toBe(0.99);
  });

  it('should use provided context', async () => {
    mockResult({ answer: 'SuperWidget 3000', confidence: 0.95 });

    const result = await answer('What is the main product?', {
      context: 'Acme Corp sells widgets. Their flagship is the SuperWidget 3000.',
    });
    expect(result.answer).toContain('SuperWidget');
  });

  it('should include source citations when requested', async () => {
    mockResult({
      answer: 'AI improves diagnosis accuracy [1].',
      confidence: 0.9,
      citations: [{ text: 'AI improves diagnosis', source: '[1]' }],
    });

    const result = await answer('What are the benefits of AI?', {
      sources: ['AI improves diagnosis accuracy in radiology.'],
      citeSources: true,
    });
    expect(result.citations).toBeDefined();
    expect(result.citations!.length).toBeGreaterThan(0);
  });
});

describe('answerYesNo', () => {
  it('should return boolean answer', async () => {
    mockResult({ answer: true, confidence: 0.92, explanation: 'Paris is indeed the capital.' });

    const result = await answerYesNo('Is Paris the capital of France?');
    expect(result.answer).toBe(true);
    expect(result.explanation).toBeDefined();
  });
});

// ===========================================================================
// Rewrite
// ===========================================================================

describe('rewrite', () => {
  it('should rewrite text in formal style', async () => {
    mockResult({
      rewritten: 'Good day, how are you?',
      changes: ['Changed greeting to formal'],
      readabilityScore: 85,
    });

    const result = await rewrite('hey whats up', { style: 'formal' });
    expect(result.rewritten).toBeDefined();
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.readabilityScore).toBeGreaterThan(0);
  });
});

describe('fixGrammar', () => {
  it('should fix grammar without changing style', async () => {
    mockResult({
      rewritten: 'She goes to the store every day.',
      changes: ['Fixed subject-verb agreement'],
      readabilityScore: 90,
    });

    const result = await fixGrammar('She go to the store everyday.');
    expect(result.rewritten).toBeDefined();
    expect(result.changes.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Generate
// ===========================================================================

describe('generate', () => {
  it('should generate text content', async () => {
    mockResult('Artificial intelligence is transforming industries worldwide, enabling new capabilities in healthcare, finance, and transportation.');

    const result = await generate('AI impact on industries');
    expect(result.content).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.type).toBe('text');
  });

  it('should generate tweet content', async () => {
    mockResult('Exciting new product launch today! Check it out now. #innovation');

    const result = await generateTweet('new product launch');
    expect(result.type).toBe('tweet');
    expect(result.content.length).toBeLessThanOrEqual(500); // generous for test
  });

  it('should generate email with subject extraction', async () => {
    mockResult('Subject: Follow-up from our meeting\n\nDear John,\n\nThank you for your time today.');

    const result = await generateEmail('follow up after meeting');
    expect(result.type).toBe('email');
    expect((result as any).subject).toBe('Follow-up from our meeting');
  });

  it('should apply template variables', async () => {
    mockResult('Welcome John to the platform!');

    const result = await generate('welcome message', {
      template: 'Welcome {{name}} to the {{platform}}!',
      variables: { name: 'John', platform: 'platform' },
    });
    expect(result.content).toBeDefined();
    // Verify callLLM was called (template is processed before sending)
    expect(mockedCallLLM).toHaveBeenCalled();
  });
});

// ===========================================================================
// Compare
// ===========================================================================

describe('compare', () => {
  it('should compare two texts', async () => {
    mockResult({
      similarity: 0.75,
      differences: ['Text 1 focuses on pros', 'Text 2 focuses on cons'],
      similarities: ['Both discuss the product'],
    });

    const result = await compare(
      'The product is great with excellent features.',
      'The product has some issues but is generally okay.',
    );
    expect(result.similarity).toBe(0.75);
    expect(result.differences.length).toBeGreaterThan(0);
    expect(result.similarities.length).toBeGreaterThan(0);
  });

  it('should determine similarity threshold', async () => {
    mockResult({
      similarity: 0.85,
      differences: [],
      similarities: ['Very similar content'],
    });

    const result = await isSimilar('text one', 'text two', 0.7);
    expect(result).toBe(true);
  });

  it('should return false when below threshold', async () => {
    mockResult({
      similarity: 0.3,
      differences: ['Completely different topics'],
      similarities: [],
    });

    const result = await isSimilar('apples', 'quantum physics', 0.7);
    expect(result).toBe(false);
  });
});

// ===========================================================================
// Moderate
// ===========================================================================

describe('moderate', () => {
  it('should flag harmful content', async () => {
    mockResult({
      flagged: true,
      categories: { hate: true, harassment: false, violence: false, sexual: false, self_harm: false, spam: false, misinformation: false, pii: false },
      scores: { hate: 0.9, harassment: 0.1, violence: 0.0, sexual: 0.0, self_harm: 0.0, spam: 0.0, misinformation: 0.0, pii: 0.0 },
      suggestedAction: 'block',
    });

    const result = await moderate('Hateful content targeting a group');
    expect(result.flagged).toBe(true);
    expect(result.suggestedAction).toBe('block');
    expect(result.categories.hate).toBe(true);
  });

  it('should allow safe content', async () => {
    mockResult({
      flagged: false,
      categories: { hate: false, harassment: false, violence: false, sexual: false, self_harm: false, spam: false, misinformation: false, pii: false },
      scores: { hate: 0.01, harassment: 0.01, violence: 0.0, sexual: 0.0, self_harm: 0.0, spam: 0.0, misinformation: 0.0, pii: 0.0 },
      suggestedAction: 'allow',
    });

    const result = await moderate('The weather is sunny and pleasant today.');
    expect(result.flagged).toBe(false);
    expect(result.suggestedAction).toBe('allow');
  });
});

describe('isSafe', () => {
  it('should return true for clean text', async () => {
    mockResult({
      flagged: false,
      categories: {},
      scores: {},
      suggestedAction: 'allow',
    });

    const result = await isSafe('Normal business communication.');
    expect(result).toBe(true);
  });
});

describe('isSpam', () => {
  it('should detect spam content', async () => {
    mockResult({
      flagged: true,
      categories: { spam: true },
      scores: { spam: 0.95 },
      suggestedAction: 'block',
    });

    const result = await isSpam('BUY NOW!!! CHEAP DISCOUNT LIMITED TIME OFFER!!!');
    expect(result.isSpam).toBe(true);
    expect(result.score).toBe(0.95);
  });
});
