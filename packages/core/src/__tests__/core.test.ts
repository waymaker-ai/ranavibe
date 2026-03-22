import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoFounderClient, createCoFounder } from '../client';
import { defineConfig, loadConfig } from '../config';
import type { CoFounderConfig, RanaChatRequest, RanaChatResponse, RanaPlugin } from '../types';

// ---------------------------------------------------------------------------
// Mock the ProviderManager to avoid real API calls
// ---------------------------------------------------------------------------

vi.mock('../providers/manager', () => {
  class ProviderManager {
    chat = vi.fn().mockResolvedValue({
      content: 'Mock response from provider',
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      cost: { total_cost: 0.001, input_cost: 0.0005, output_cost: 0.0005, input_tokens: 100, output_tokens: 50 },
      usage: { input_tokens: 100, output_tokens: 50 },
      latency_ms: 150,
    });
    stream = vi.fn().mockImplementation(async function* () {
      yield { delta: 'Hello ', done: false };
      yield { delta: 'World', done: true };
    });
    getQueueStats = vi.fn().mockReturnValue({ pending: 0, processing: 0, completed: 10 });
    isQueueEnabled = vi.fn().mockReturnValue(false);
    getQueue = vi.fn().mockReturnValue(null);
    getCircuitBreaker = vi.fn().mockReturnValue({
      getState: vi.fn().mockReturnValue('closed'),
      getStats: vi.fn().mockReturnValue({ failureRate: 0, failures: 0, successes: 10 }),
      getAllStats: vi.fn().mockReturnValue({}),
      reset: vi.fn(),
      resetAll: vi.fn(),
      configure: vi.fn(),
    });
    constructor(_config?: any) {}
  }
  return { ProviderManager };
});

vi.mock('../cost-tracker', () => {
  class CostTracker {
    track = vi.fn().mockResolvedValue(undefined);
    getStats = vi.fn().mockReturnValue({
      total_spent: 0.05,
      total_saved: 0.02,
      total_requests: 10,
      savings_percentage: 28.5,
    });
    getTotalCost = vi.fn().mockReturnValue(0.05);
    getTotalSaved = vi.fn().mockReturnValue(0.02);
    getBudgetStatus = vi.fn().mockReturnValue({ remaining: 9.95, limit: 10, used: 0.05, percentage: 0.5 });
    setBudget = vi.fn();
    clearBudget = vi.fn();
    willExceedBudget = vi.fn().mockReturnValue(false);
    checkBudget = vi.fn();
    reset = vi.fn();
    constructor(_config?: any) {}
  }
  return { CostTracker };
});

vi.mock('../cache-legacy', () => {
  class CacheManager {
    get = vi.fn().mockResolvedValue(null);
    set = vi.fn().mockResolvedValue(undefined);
    clear = vi.fn().mockResolvedValue(undefined);
    constructor(_config?: any) {}
  }
  return { CacheManager };
});

vi.mock('../providers/fallback', () => {
  class FallbackManager {
    chat = vi.fn().mockResolvedValue({
      content: 'Fallback response',
      provider: 'openai',
      model: 'gpt-4o',
      cost: { total_cost: 0.002 },
      usage: { input_tokens: 100, output_tokens: 80 },
      latency_ms: 200,
      fallbackMetadata: {
        usedFallback: false,
        attemptedProviders: ['anthropic'],
        totalAttempts: 1,
      },
    });
    constructor(_providers?: any, _config?: any) {}
  }
  return { FallbackManager };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<CoFounderConfig> = {}): CoFounderConfig {
  return {
    providers: {
      anthropic: 'test-anthropic-key',
      openai: 'test-openai-key',
    },
    defaults: {
      provider: 'anthropic',
      temperature: 0.7,
      max_tokens: 1024,
      optimize: 'balanced',
    },
    cache: {
      enabled: true,
      ttl: 3600,
      provider: 'memory',
    },
    cost_tracking: {
      enabled: true,
    },
    logging: {
      enabled: false,
      level: 'error',
    },
    ...overrides,
  };
}

// ===========================================================================
// createCoFounder factory
// ===========================================================================

describe('createCoFounder', () => {
  it('should create a CoFounderClient instance', () => {
    const client = createCoFounder(makeConfig());
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(CoFounderClient);
  });

  it('should accept minimal configuration', () => {
    const client = createCoFounder({ providers: {} });
    expect(client).toBeDefined();
  });
});

// ===========================================================================
// defineConfig
// ===========================================================================

describe('defineConfig', () => {
  it('should return the config as-is', () => {
    const config: CoFounderConfig = {
      providers: { anthropic: 'key' },
      defaults: { provider: 'anthropic' },
    };
    const result = defineConfig(config);
    expect(result).toBe(config);
  });
});

// ===========================================================================
// CoFounderClient - Chat
// ===========================================================================

describe('CoFounderClient - chat', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should handle simple string input', async () => {
    const response = await client.chat('Hello, how are you?');
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
  });

  it('should handle request object input', async () => {
    const response = await client.chat({
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });
    expect(response).toBeDefined();
  });

  it('should use default provider when not specified', async () => {
    const response = await client.chat('test');
    expect(response).toBeDefined();
  });

  it('should respect optimization strategy', async () => {
    const response = await client.chat({
      messages: [{ role: 'user', content: 'test' }],
      optimize: 'cost',
    });
    expect(response).toBeDefined();
  });

  it('should support quality optimization', async () => {
    const response = await client.chat({
      messages: [{ role: 'user', content: 'test' }],
      optimize: 'quality',
    });
    expect(response).toBeDefined();
  });

  it('should support speed optimization', async () => {
    const response = await client.chat({
      messages: [{ role: 'user', content: 'test' }],
      optimize: 'speed',
    });
    expect(response).toBeDefined();
  });
});

// ===========================================================================
// CoFounderClient - Streaming
// ===========================================================================

describe('CoFounderClient - stream', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should yield stream chunks', async () => {
    const chunks: any[] = [];
    for await (const chunk of client.stream('Tell me a story')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle request object for streaming', async () => {
    const chunks: any[] = [];
    for await (const chunk of client.stream({
      messages: [{ role: 'user', content: 'test' }],
    })) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// CoFounderClient - Cost Tracking
// ===========================================================================

describe('CoFounderClient - Cost', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should return cost stats', () => {
    const stats = client.cost.stats();
    expect(stats).toBeDefined();
    expect(stats.total_spent).toBeDefined();
    expect(stats.total_saved).toBeDefined();
  });

  it('should return total cost', () => {
    const total = client.cost.total;
    expect(typeof total).toBe('number');
  });

  it('should return total saved', () => {
    const saved = client.cost.saved;
    expect(typeof saved).toBe('number');
  });

  it('should return budget status', () => {
    const budget = client.cost.budget();
    expect(budget).toBeDefined();
  });

  it('should check if estimated cost will exceed budget', () => {
    const willExceed = client.cost.willExceed(100);
    expect(typeof willExceed).toBe('boolean');
  });

  it('should reset cost tracking', () => {
    client.cost.reset();
    // No error means success
  });
});

// ===========================================================================
// CoFounderClient - Queue
// ===========================================================================

describe('CoFounderClient - Queue', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should return queue stats', () => {
    const stats = client.queue.stats();
    expect(stats).toBeDefined();
  });

  it('should report queue enabled status', () => {
    const enabled = client.queue.enabled();
    expect(typeof enabled).toBe('boolean');
  });
});

// ===========================================================================
// CoFounderClient - Circuit Breaker
// ===========================================================================

describe('CoFounderClient - Circuit Breaker', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should return circuit breaker state', () => {
    const state = client.circuitBreaker.getState('anthropic');
    expect(state).toBeDefined();
  });

  it('should return circuit breaker stats', () => {
    const stats = client.circuitBreaker.getStats('anthropic');
    expect(stats).toBeDefined();
  });

  it('should return all circuit breaker stats', () => {
    const allStats = client.circuitBreaker.getAllStats();
    expect(allStats).toBeDefined();
  });

  it('should reset circuit breaker for a provider', () => {
    client.circuitBreaker.reset('anthropic');
    // No error means success
  });
});

// ===========================================================================
// CoFounderClient - Plugin System
// ===========================================================================

describe('CoFounderClient - Plugins', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should register a plugin', async () => {
    const plugin: RanaPlugin = {
      name: 'test-plugin',
      onInit: vi.fn(),
    };

    await client.use(plugin);
    expect(plugin.onInit).toHaveBeenCalled();
  });

  it('should remove a plugin', async () => {
    const plugin: RanaPlugin = {
      name: 'removable-plugin',
      onDestroy: vi.fn(),
    };

    await client.use(plugin);
    await client.unuse('removable-plugin');
    expect(plugin.onDestroy).toHaveBeenCalled();
  });

  it('should run onBeforeRequest hooks', async () => {
    const beforeHook = vi.fn((req: RanaChatRequest) => req);
    const plugin: RanaPlugin = {
      name: 'before-hook-plugin',
      onBeforeRequest: beforeHook,
    };

    await client.use(plugin);
    await client.chat('test message');
    expect(beforeHook).toHaveBeenCalled();
  });

  it('should run onAfterResponse hooks', async () => {
    const afterHook = vi.fn((res: RanaChatResponse) => res);
    const plugin: RanaPlugin = {
      name: 'after-hook-plugin',
      onAfterResponse: afterHook,
    };

    await client.use(plugin);
    await client.chat('test message');
    expect(afterHook).toHaveBeenCalled();
  });

  it('should handle plugins without optional hooks', async () => {
    const plugin: RanaPlugin = { name: 'minimal-plugin' };
    await client.use(plugin);
    // No error
  });
});

// ===========================================================================
// CoFounderClient - Configuration
// ===========================================================================

describe('CoFounderClient - Configuration', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should return current configuration', () => {
    const config = client.getConfig();
    expect(config.providers).toBeDefined();
    expect(config.defaults).toBeDefined();
  });

  it('should update configuration', () => {
    client.configure({ defaults: { temperature: 0.9 } });
    const config = client.getConfig();
    expect(config.defaults?.temperature).toBe(0.9);
  });

  it('should clear cache', async () => {
    await client.clearCache();
    // No error means success
  });
});

// ===========================================================================
// CoFounderClient - Fluent Builder
// ===========================================================================

describe('CoFounderClient - Fluent Builder', () => {
  let client: CoFounderClient;

  beforeEach(() => {
    client = new CoFounderClient(makeConfig());
  });

  it('should create builder via provider()', async () => {
    const response = await client
      .provider('anthropic')
      .model('claude-3-5-sonnet-20241022')
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should create builder via anthropic() shorthand', async () => {
    const response = await client
      .anthropic()
      .model('claude-3-5-haiku-20241022')
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should create builder via openai() shorthand', async () => {
    const response = await client
      .openai()
      .model('gpt-4o')
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should create builder via google() shorthand', async () => {
    const response = await client
      .google()
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should chain temperature and maxTokens', async () => {
    const response = await client
      .provider('anthropic')
      .temperature(0.5)
      .maxTokens(500)
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should chain optimize setting', async () => {
    const response = await client
      .provider('anthropic')
      .optimize('cost')
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should chain cache setting', async () => {
    const response = await client
      .provider('anthropic')
      .cache(false)
      .chat([{ role: 'user', content: 'test' }]);
    expect(response).toBeDefined();
  });

  it('should accept messages as object with messages property', async () => {
    const response = await client
      .provider('anthropic')
      .chat({ messages: [{ role: 'user', content: 'test' }] });
    expect(response).toBeDefined();
  });
});

// ===========================================================================
// CoFounderClient - Fallback
// ===========================================================================

describe('CoFounderClient - Fallback', () => {
  it('should use fallback manager when configured', async () => {
    const client = new CoFounderClient(makeConfig({
      fallback: {
        providers: ['anthropic', 'openai'],
        maxRetries: 2,
      },
    }));

    const response = await client.chat('test');
    expect(response).toBeDefined();
  });
});

// ===========================================================================
// Config normalization
// ===========================================================================

describe('CoFounderClient - Config Normalization', () => {
  it('should set default temperature to 0.7', () => {
    const client = new CoFounderClient({ providers: {} });
    const config = client.getConfig();
    expect(config.defaults?.temperature).toBe(0.7);
  });

  it('should set default max_tokens to 1024', () => {
    const client = new CoFounderClient({ providers: {} });
    const config = client.getConfig();
    expect(config.defaults?.max_tokens).toBe(1024);
  });

  it('should enable cache by default', () => {
    const client = new CoFounderClient({ providers: {} });
    const config = client.getConfig();
    expect(config.cache?.enabled).toBe(true);
  });

  it('should enable cost tracking by default', () => {
    const client = new CoFounderClient({ providers: {} });
    const config = client.getConfig();
    expect(config.cost_tracking?.enabled).toBe(true);
  });

  it('should set default retry settings', () => {
    const client = new CoFounderClient({ providers: {} });
    const config = client.getConfig();
    expect(config.retry?.enabled).toBe(true);
    expect(config.retry?.maxRetries).toBe(3);
  });
});
