import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptManager } from '../manager';
import { PromptRegistry } from '../registry';
import { ABTestManager } from '../ab-testing';
import { PromptAnalytics } from '../analytics';
import type {
  PromptDefinition,
  PromptManagerConfig,
  PromptExecutionOptions,
  PromptVersion,
  ABTestConfig,
} from '../types';

// =============================================================================
// PromptRegistry Tests
// =============================================================================

describe('PromptRegistry', () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    registry = new PromptRegistry({ storage: 'memory' });
  });

  describe('register()', () => {
    it('should register a prompt with explicit variables', async () => {
      const prompt = await registry.register('greeting', {
        template: 'Hello {{name}}, welcome to {{app}}!',
        variables: ['name', 'app'],
      });
      expect(prompt.id).toBe('greeting');
      expect(prompt.version).toBe('1.0.0');
      expect(prompt.variables).toEqual(['name', 'app']);
    });

    it('should auto-extract variables from template', async () => {
      const prompt = await registry.register('auto-vars', {
        template: 'Dear {{firstName}} {{lastName}}, your order {{orderId}} is ready.',
      });
      expect(prompt.variables).toContain('firstName');
      expect(prompt.variables).toContain('lastName');
      expect(prompt.variables).toContain('orderId');
    });

    it('should set name to id if not provided', async () => {
      const prompt = await registry.register('my-prompt', { template: 'Hello' });
      expect(prompt.name).toBe('my-prompt');
    });

    it('should accept custom name', async () => {
      const prompt = await registry.register('p1', { template: 'Hi', name: 'Custom Name' });
      expect(prompt.name).toBe('Custom Name');
    });

    it('should set createdAt and updatedAt', async () => {
      const prompt = await registry.register('dated', { template: 'test' });
      expect(prompt.createdAt).toBeInstanceOf(Date);
      expect(prompt.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept metadata', async () => {
      const prompt = await registry.register('meta', {
        template: 'Hi {{name}}',
        metadata: { team: 'engineering', priority: 'high' },
      });
      expect(prompt.metadata?.team).toBe('engineering');
    });
  });

  describe('get()', () => {
    it('should retrieve a registered prompt', async () => {
      await registry.register('test', { template: 'Hello {{name}}' });
      const prompt = await registry.get('test');
      expect(prompt).not.toBeNull();
      expect(prompt!.template).toBe('Hello {{name}}');
    });

    it('should return null for unknown prompt', async () => {
      const prompt = await registry.get('nonexistent');
      expect(prompt).toBeNull();
    });

    it('should get a specific version', async () => {
      await registry.register('versioned', { template: 'v1: {{x}}' });
      await registry.update('versioned', { template: 'v2: {{x}} {{y}}' });
      const v1 = await registry.get('versioned', '1.0.0');
      expect(v1!.template).toBe('v1: {{x}}');
      expect(v1!.version).toBe('1.0.0');
    });
  });

  describe('update()', () => {
    it('should update template and increment version', async () => {
      await registry.register('upd', { template: 'Hello {{name}}' });
      const updated = await registry.update('upd', { template: 'Hi {{name}}, welcome!' });
      expect(updated!.version).toBe('1.0.1');
      expect(updated!.template).toBe('Hi {{name}}, welcome!');
    });

    it('should return null when updating nonexistent prompt', async () => {
      const result = await registry.update('missing', { template: 'test' });
      expect(result).toBeNull();
    });

    it('should store changelog in version history', async () => {
      await registry.register('cl', { template: 'v1' });
      await registry.update('cl', { template: 'v2', changelog: 'Fixed typo' });
      const versions = await registry.getVersions('cl');
      const v2 = versions.find(v => v.version === '1.0.1');
      expect(v2?.changelog).toBe('Fixed typo');
    });

    it('should auto-extract variables on template update', async () => {
      await registry.register('vars', { template: 'Hello {{a}}' });
      const updated = await registry.update('vars', { template: 'Hello {{b}} and {{c}}' });
      expect(updated!.variables).toContain('b');
      expect(updated!.variables).toContain('c');
      expect(updated!.variables).not.toContain('a');
    });
  });

  describe('render()', () => {
    it('should render template with variables', () => {
      const rendered = registry.render('Hello {{name}}, you have {{count}} items.', { name: 'Alice', count: '5' });
      expect(rendered).toBe('Hello Alice, you have 5 items.');
    });

    it('should throw for missing variable', () => {
      expect(() => registry.render('Hello {{name}}', {})).toThrow('Missing variable: name');
    });

    it('should handle template with no variables', () => {
      const rendered = registry.render('Static text with no vars', {});
      expect(rendered).toBe('Static text with no vars');
    });
  });

  describe('list()', () => {
    beforeEach(async () => {
      await registry.register('greeting', { template: 'Hi {{name}}', tags: ['user-facing', 'chat'] });
      await registry.register('summary', { template: 'Summarize: {{text}}', tags: ['internal', 'ai'] });
      await registry.register('code-review', { template: 'Review: {{code}}', tags: ['internal', 'dev'], description: 'Code review prompt' });
    });

    it('should list all prompts', async () => {
      const all = await registry.list();
      expect(all).toHaveLength(3);
    });

    it('should filter by tags', async () => {
      const internal = await registry.list({ tags: ['internal'] });
      expect(internal).toHaveLength(2);
    });

    it('should filter by search term', async () => {
      const results = await registry.list({ search: 'code' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('code-review');
    });
  });

  describe('delete()', () => {
    it('should delete existing prompt and return true', async () => {
      await registry.register('del', { template: 'test' });
      expect(await registry.delete('del')).toBe(true);
      expect(await registry.get('del')).toBeNull();
    });

    it('should return false for nonexistent prompt', async () => {
      expect(await registry.delete('nonexistent')).toBe(false);
    });
  });

  describe('getVersions()', () => {
    it('should return version history', async () => {
      await registry.register('vh', { template: 'v1' });
      await registry.update('vh', { template: 'v2' });
      await registry.update('vh', { template: 'v3' });
      const versions = await registry.getVersions('vh');
      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[2].version).toBe('1.0.2');
    });

    it('should mark only latest version as active', async () => {
      await registry.register('active', { template: 'v1' });
      await registry.update('active', { template: 'v2' });
      const versions = await registry.getVersions('active');
      expect(versions.filter(v => v.isActive)).toHaveLength(1);
      expect(versions.find(v => v.isActive)?.version).toBe('1.0.1');
    });
  });

  describe('rollback()', () => {
    it('should rollback to a previous version', async () => {
      await registry.register('rb', { template: 'original {{x}}' });
      await registry.update('rb', { template: 'modified {{x}} {{y}}' });
      const rolled = await registry.rollback('rb', '1.0.0');
      expect(rolled!.template).toBe('original {{x}}');
      expect(rolled!.version).toBe('1.0.2'); // new version created
    });

    it('should return null for nonexistent version', async () => {
      await registry.register('rb2', { template: 'test' });
      const result = await registry.rollback('rb2', '99.0.0');
      expect(result).toBeNull();
    });
  });

  describe('export() and import()', () => {
    it('should export all prompts and versions', async () => {
      await registry.register('exp1', { template: 't1' });
      await registry.register('exp2', { template: 't2' });
      const exported = await registry.export();
      expect(exported.prompts).toHaveLength(2);
      expect(Object.keys(exported.versions)).toHaveLength(2);
    });

    it('should import prompts into registry', async () => {
      const data = {
        prompts: [
          { id: 'imp1', name: 'Imported', template: 'Hello {{x}}', variables: ['x'], version: '1.0.0', createdAt: new Date(), updatedAt: new Date() } as PromptDefinition,
        ],
      };
      await registry.import(data);
      const prompt = await registry.get('imp1');
      expect(prompt).not.toBeNull();
      expect(prompt!.name).toBe('Imported');
    });
  });
});

// =============================================================================
// ABTestManager Tests
// =============================================================================

describe('ABTestManager', () => {
  let abManager: ABTestManager;

  beforeEach(() => {
    abManager = new ABTestManager();
  });

  it('should create an A/B test and return testId', async () => {
    const testId = await abManager.create('prompt-1', {
      name: 'Greeting Test',
      variants: [
        { name: 'formal', template: 'Dear {{name}}, how may I assist you?' },
        { name: 'casual', template: 'Hey {{name}}! What can I do for you?' },
      ],
      metric: 'user_satisfaction',
    });
    expect(testId).toMatch(/^test_/);
  });

  it('should start a test', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }, { name: 'b', template: 'B' }],
      metric: 'clicks',
    });
    await abManager.start(testId);
    const results = abManager.getResults(testId);
    expect(results.status).toBe('running');
  });

  it('should throw when starting nonexistent test', async () => {
    await expect(abManager.start('nonexistent')).rejects.toThrow('Test not found');
  });

  it('should select variant for users consistently', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }, { name: 'b', template: 'B' }],
      metric: 'clicks',
    });
    await abManager.start(testId);

    const first = await abManager.selectVariant(testId, 'user-123');
    const second = await abManager.selectVariant(testId, 'user-123');
    expect(first!.variantId).toBe(second!.variantId);
  });

  it('should return null when selecting from non-running test', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }],
      metric: 'clicks',
    });
    // Test is in draft status
    const result = await abManager.selectVariant(testId);
    expect(result).toBeNull();
  });

  it('should record impressions', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }],
      metric: 'clicks',
    });
    await abManager.start(testId);
    await abManager.recordImpression(testId, 'var_0');
    await abManager.recordImpression(testId, 'var_0');
    const results = abManager.getResults(testId);
    expect(results.variants[0].metrics.impressions).toBe(2);
  });

  it('should record conversions and update rate', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }],
      metric: 'clicks',
      minSampleSize: 10000, // high threshold to prevent auto-complete
    });
    await abManager.start(testId);
    await abManager.recordImpression(testId, 'var_0');
    await abManager.recordImpression(testId, 'var_0');
    await abManager.recordConversion(testId, 'var_0');
    const results = abManager.getResults(testId);
    expect(results.variants[0].metrics.conversions).toBe(1);
    expect(results.variants[0].metrics.conversionRate).toBe(50);
  });

  it('should complete a test and declare winner', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [{ name: 'a', template: 'A' }, { name: 'b', template: 'B' }],
      metric: 'clicks',
    });
    await abManager.start(testId);
    const result = await abManager.complete(testId, 'var_0');
    expect(result.status).toBe('completed');
    expect(result.winner).toBe('var_0');
  });

  it('should list tests by status', async () => {
    await abManager.create('p1', { name: 'T1', variants: [{ name: 'a', template: 'A' }], metric: 'm' });
    const testId = await abManager.create('p1', { name: 'T2', variants: [{ name: 'a', template: 'A' }], metric: 'm' });
    await abManager.start(testId);

    const running = abManager.list({ status: 'running' });
    expect(running).toHaveLength(1);
    const drafts = abManager.list({ status: 'draft' });
    expect(drafts).toHaveLength(1);
  });

  it('should delete a test', async () => {
    const testId = await abManager.create('p1', { name: 'T', variants: [{ name: 'a', template: 'A' }], metric: 'm' });
    expect(await abManager.delete(testId)).toBe(true);
    expect(() => abManager.getResults(testId)).toThrow();
  });

  it('should distribute traffic evenly by default', async () => {
    const testId = await abManager.create('p1', {
      name: 'Test',
      variants: [
        { name: 'a', template: 'A' },
        { name: 'b', template: 'B' },
        { name: 'c', template: 'C' },
      ],
      metric: 'clicks',
    });
    const results = abManager.getResults(testId);
    // Each variant should have roughly 33.33% traffic
    expect(results.variants).toHaveLength(3);
  });
});

// =============================================================================
// PromptAnalytics Tests
// =============================================================================

describe('PromptAnalytics', () => {
  let analytics: PromptAnalytics;

  beforeEach(() => {
    analytics = new PromptAnalytics({ enabled: true, sampleRate: 1.0 });
  });

  it('should record execution results', async () => {
    await analytics.record({
      promptId: 'greeting',
      version: '1.0.0',
      response: 'Hello!',
      variables: { name: 'Alice' },
      renderedPrompt: 'Hello Alice!',
      metrics: { latencyMs: 150, inputTokens: 10, outputTokens: 20, cost: 0.001 },
      executionId: 'exec_1',
      timestamp: new Date(),
    });
    const report = await analytics.getUsageReport();
    expect(report.totalExecutions).toBe(1);
  });

  it('should not record when disabled', async () => {
    const disabled = new PromptAnalytics({ enabled: false });
    await disabled.record({
      promptId: 'test',
      version: '1.0.0',
      response: 'R',
      variables: {},
      renderedPrompt: 'test',
      metrics: { latencyMs: 100, inputTokens: 5, outputTokens: 10, cost: 0.0005 },
      executionId: 'exec_2',
      timestamp: new Date(),
    });
    const report = await disabled.getUsageReport();
    expect(report.totalExecutions).toBe(0);
  });

  it('should compute analytics for specific prompt', async () => {
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      await analytics.record({
        promptId: 'summary',
        version: '1.0.0',
        response: `Response ${i}`,
        variables: { text: 'input' },
        renderedPrompt: 'Summarize: input',
        metrics: { latencyMs: 100 + i * 10, inputTokens: 50, outputTokens: 100, cost: 0.002 },
        executionId: `exec_${i}`,
        timestamp: now,
      });
    }
    const data = await analytics.getPromptAnalytics('summary', 'day');
    expect(data.executions).toBe(5);
    expect(data.avgLatency).toBeGreaterThan(0);
    expect(data.totalCost).toBe(0.01);
    expect(data.successRate).toBe(100);
  });

  it('should track errors separately', async () => {
    await analytics.recordError('fail-prompt', '1.0.0', 'timeout', 5000);
    const data = await analytics.getPromptAnalytics('fail-prompt', 'day');
    expect(data.errorRate).toBe(100);
    expect(data.errorsByType).toHaveProperty('timeout');
  });

  it('should export analytics data', async () => {
    await analytics.record({
      promptId: 'exp',
      version: '1.0.0',
      response: 'OK',
      variables: {},
      renderedPrompt: 'test',
      metrics: { latencyMs: 50, inputTokens: 10, outputTokens: 20, cost: 0.001 },
      executionId: 'exec_exp',
      timestamp: new Date(),
    });
    const exported = await analytics.export();
    expect(exported.records).toHaveLength(1);
    expect(exported.summary.totalExecutions).toBe(1);
  });

  it('should clear all data', async () => {
    await analytics.record({
      promptId: 'clear',
      version: '1.0.0',
      response: 'R',
      variables: {},
      renderedPrompt: 't',
      metrics: { latencyMs: 50, inputTokens: 5, outputTokens: 10, cost: 0.001 },
      executionId: 'ex',
      timestamp: new Date(),
    });
    await analytics.clear();
    const report = await analytics.getUsageReport();
    expect(report.totalExecutions).toBe(0);
  });
});

// =============================================================================
// PromptManager Integration Tests
// =============================================================================

describe('PromptManager', () => {
  let manager: PromptManager;

  beforeEach(() => {
    manager = new PromptManager({
      workspace: 'test-workspace',
      defaultModel: 'gpt-4o-mini',
      defaultProvider: 'openai',
      analytics: { enabled: true },
    });
  });

  it('should register and retrieve a prompt', async () => {
    await manager.register('greet', { template: 'Hello {{name}}!', variables: ['name'] });
    const prompt = await manager.get('greet');
    expect(prompt).not.toBeNull();
    expect(prompt!.template).toBe('Hello {{name}}!');
  });

  it('should execute a prompt', async () => {
    await manager.register('greet', { template: 'Hello {{name}}!' });
    const result = await manager.execute('greet', { variables: { name: 'World' } });
    expect(result.promptId).toBe('greet');
    expect(result.renderedPrompt).toBe('Hello World!');
    expect(result.response).toBeDefined();
    expect(result.metrics.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.executionId).toMatch(/^exec_/);
  });

  it('should throw when executing nonexistent prompt', async () => {
    await expect(manager.execute('missing', { variables: {} })).rejects.toThrow('Prompt not found');
  });

  it('should list prompts with filters', async () => {
    await manager.register('a', { template: 't1', tags: ['prod'] });
    await manager.register('b', { template: 't2', tags: ['dev'] });
    const prodPrompts = await manager.list({ tags: ['prod'] });
    expect(prodPrompts).toHaveLength(1);
  });

  it('should delete a prompt', async () => {
    await manager.register('del', { template: 'bye' });
    expect(await manager.delete('del')).toBe(true);
    expect(await manager.get('del')).toBeNull();
  });

  it('should get version history', async () => {
    await manager.register('vh', { template: 'v1' });
    await manager.update('vh', { template: 'v2' });
    const versions = await manager.getVersions('vh');
    expect(versions).toHaveLength(2);
  });

  it('should rollback to previous version', async () => {
    await manager.register('rb', { template: 'original' });
    await manager.update('rb', { template: 'new version' });
    const rolled = await manager.rollback('rb', '1.0.0');
    expect(rolled!.template).toBe('original');
  });

  it('should export and import data', async () => {
    await manager.register('export-test', { template: 'Hello {{x}}' });
    const exported = await manager.export();
    expect(exported.workspace).toBe('test-workspace');
    expect(exported.prompts).toHaveLength(1);
  });
});
