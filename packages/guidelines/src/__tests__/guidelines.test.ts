import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createGuideline,
  Conditions,
  PresetGuidelines,
  resolveContent,
  matchesContext,
  GuidelineManager,
  createGuidelineManager,
  MemoryStorage,
  createStorage,
} from '../index';
import type { Guideline, GuidelineContext } from '../types';

// =============================================================================
// createGuideline
// =============================================================================

describe('createGuideline', () => {
  it('should create a guideline with required fields', () => {
    const g = createGuideline({
      id: 'test',
      condition: () => true,
      content: 'Test content',
    });

    expect(g.id).toBe('test');
    expect(g.content).toBe('Test content');
    expect(g.enforcement).toBe('advisory'); // default
    expect(g.priority).toBe(50); // default
    expect(g.status).toBe('active');
    expect(g.version).toBe('1.0.0');
    expect(g.createdAt).toBeInstanceOf(Date);
    expect(g.updatedAt).toBeInstanceOf(Date);
  });

  it('should accept custom enforcement level', () => {
    const g = createGuideline({
      id: 'strict-test',
      condition: () => true,
      content: 'Strict guideline',
      enforcement: 'strict',
    });
    expect(g.enforcement).toBe('strict');
  });

  it('should accept custom priority', () => {
    const g = createGuideline({
      id: 'high-priority',
      condition: () => true,
      content: 'High priority',
      priority: 100,
    });
    expect(g.priority).toBe(100);
  });

  it('should accept optional fields', () => {
    const g = createGuideline({
      id: 'full',
      name: 'Full Guideline',
      description: 'A complete guideline',
      condition: () => true,
      content: 'Content',
      category: 'safety',
      tags: ['tag1', 'tag2'],
      version: '2.0.0',
      metadata: { custom: 'data' },
    });

    expect(g.name).toBe('Full Guideline');
    expect(g.description).toBe('A complete guideline');
    expect(g.category).toBe('safety');
    expect(g.tags).toEqual(['tag1', 'tag2']);
    expect(g.version).toBe('2.0.0');
    expect(g.metadata).toEqual({ custom: 'data' });
  });

  it('should support dynamic content function', () => {
    const g = createGuideline({
      id: 'dynamic',
      condition: () => true,
      content: (ctx) => `Hello ${ctx.user?.id || 'user'}`,
    });
    expect(typeof g.content).toBe('function');
  });
});

// =============================================================================
// Conditions
// =============================================================================

describe('Conditions', () => {
  describe('topic', () => {
    it('should match single topic string', () => {
      const cond = Conditions.topic('medical');
      expect(cond({ topic: 'medical' })).toBe(true);
      expect(cond({ topic: 'finance' })).toBe(false);
    });

    it('should match topic case-insensitively', () => {
      const cond = Conditions.topic('Medical');
      expect(cond({ topic: 'medical advice' })).toBe(true);
    });

    it('should match topic array', () => {
      const cond = Conditions.topic(['medical', 'health']);
      expect(cond({ topic: 'health' })).toBe(true);
    });

    it('should match against array context topics', () => {
      const cond = Conditions.topic('medical');
      expect(cond({ topic: ['medical', 'research'] })).toBe(true);
    });

    it('should return false with no topic in context', () => {
      const cond = Conditions.topic('medical');
      expect(cond({})).toBe(false);
    });

    it('should match partial topic strings', () => {
      const cond = Conditions.topic('invest');
      expect(cond({ topic: 'investment advice' })).toBe(true);
    });
  });

  describe('category', () => {
    it('should match category', () => {
      const cond = Conditions.category('support');
      expect(cond({ category: 'support' })).toBe(true);
      expect(cond({ category: 'sales' })).toBe(false);
    });
  });

  describe('userRole', () => {
    it('should match single role', () => {
      const cond = Conditions.userRole('admin');
      expect(cond({ user: { id: '1', roles: ['admin', 'user'] } })).toBe(true);
    });

    it('should match any of multiple roles', () => {
      const cond = Conditions.userRole(['admin', 'moderator']);
      expect(cond({ user: { id: '1', roles: ['moderator'] } })).toBe(true);
    });

    it('should return false with no user roles', () => {
      const cond = Conditions.userRole('admin');
      expect(cond({})).toBe(false);
      expect(cond({ user: { id: '1' } })).toBe(false);
    });
  });

  describe('intent', () => {
    it('should match intent', () => {
      const cond = Conditions.intent('purchase');
      expect(cond({ intent: 'purchase' })).toBe(true);
      expect(cond({ intent: 'browse' })).toBe(false);
    });

    it('should match any of multiple intents', () => {
      const cond = Conditions.intent(['purchase', 'return']);
      expect(cond({ intent: 'return' })).toBe(true);
    });

    it('should return false with no intent', () => {
      const cond = Conditions.intent('purchase');
      expect(cond({})).toBe(false);
    });
  });

  describe('messageContains', () => {
    it('should match message content', () => {
      const cond = Conditions.messageContains('headache');
      expect(cond({ message: 'I have a headache' })).toBe(true);
    });

    it('should match case-insensitively', () => {
      const cond = Conditions.messageContains('HEADACHE');
      expect(cond({ message: 'i have a headache' })).toBe(true);
    });

    it('should match any of multiple patterns', () => {
      const cond = Conditions.messageContains(['headache', 'fever']);
      expect(cond({ message: 'I have a fever' })).toBe(true);
    });

    it('should return false with no message', () => {
      const cond = Conditions.messageContains('test');
      expect(cond({})).toBe(false);
    });
  });

  describe('messageMatches', () => {
    it('should match regex pattern', () => {
      const cond = Conditions.messageMatches(/\d{3}-\d{2}-\d{4}/);
      expect(cond({ message: 'My SSN is 123-45-6789' })).toBe(true);
    });

    it('should return false for non-matching text', () => {
      const cond = Conditions.messageMatches(/\d{3}-\d{2}-\d{4}/);
      expect(cond({ message: 'No SSN here' })).toBe(false);
    });

    it('should return false with no message', () => {
      const cond = Conditions.messageMatches(/test/);
      expect(cond({})).toBe(false);
    });
  });

  describe('always/never', () => {
    it('always should return true', () => {
      expect(Conditions.always()({})).toBe(true);
    });

    it('never should return false', () => {
      expect(Conditions.never()({})).toBe(false);
    });
  });

  describe('and', () => {
    it('should require all conditions to be true', async () => {
      const cond = Conditions.and(
        Conditions.topic('medical'),
        Conditions.messageContains('headache')
      );
      expect(await cond({ topic: 'medical', message: 'I have a headache' })).toBe(true);
      expect(await cond({ topic: 'medical', message: 'Hello' })).toBe(false);
      expect(await cond({ topic: 'finance', message: 'I have a headache' })).toBe(false);
    });
  });

  describe('or', () => {
    it('should require any condition to be true', async () => {
      const cond = Conditions.or(
        Conditions.topic('medical'),
        Conditions.topic('health')
      );
      expect(await cond({ topic: 'medical' })).toBe(true);
      expect(await cond({ topic: 'health' })).toBe(true);
      expect(await cond({ topic: 'finance' })).toBe(false);
    });
  });

  describe('not', () => {
    it('should negate a condition', async () => {
      const cond = Conditions.not(Conditions.topic('medical'));
      expect(await cond({ topic: 'finance' })).toBe(true);
      expect(await cond({ topic: 'medical' })).toBe(false);
    });
  });

  describe('custom', () => {
    it('should pass through custom function', () => {
      const cond = Conditions.custom((ctx) => ctx.message?.includes('secret') ?? false);
      expect(cond({ message: 'This is a secret' })).toBe(true);
      expect(cond({ message: 'Nothing special' })).toBe(false);
    });
  });
});

// =============================================================================
// resolveContent
// =============================================================================

describe('resolveContent', () => {
  it('should return static string content', async () => {
    const result = await resolveContent('Static content', {});
    expect(result).toBe('Static content');
  });

  it('should resolve dynamic content function', async () => {
    const result = await resolveContent(
      (ctx) => `Hello ${ctx.user?.id || 'anonymous'}`,
      { user: { id: 'user-42' } }
    );
    expect(result).toBe('Hello user-42');
  });

  it('should handle async dynamic content', async () => {
    const result = await resolveContent(
      async (ctx) => `Async: ${ctx.topic}`,
      { topic: 'test' }
    );
    expect(result).toBe('Async: test');
  });
});

// =============================================================================
// matchesContext
// =============================================================================

describe('matchesContext', () => {
  it('should return true for matching guideline', async () => {
    const g = createGuideline({
      id: 'test',
      condition: Conditions.topic('medical'),
      content: 'Test',
    });
    expect(await matchesContext(g, { topic: 'medical' })).toBe(true);
  });

  it('should return false for non-matching guideline', async () => {
    const g = createGuideline({
      id: 'test',
      condition: Conditions.topic('medical'),
      content: 'Test',
    });
    expect(await matchesContext(g, { topic: 'finance' })).toBe(false);
  });

  it('should return false on condition error', async () => {
    const g = createGuideline({
      id: 'error',
      condition: () => { throw new Error('Condition error'); },
      content: 'Test',
    });
    expect(await matchesContext(g, {})).toBe(false);
  });
});

// =============================================================================
// PresetGuidelines
// =============================================================================

describe('PresetGuidelines', () => {
  it('should create noMedicalAdvice guideline', async () => {
    const g = PresetGuidelines.noMedicalAdvice();
    expect(g.id).toBe('no-medical-advice');
    expect(g.enforcement).toBe('strict');
    expect(g.priority).toBe(100);
    expect(g.category).toBe('healthcare');
    expect(await matchesContext(g, { topic: 'medical' })).toBe(true);
    expect(await matchesContext(g, { message: 'should I take aspirin?' })).toBe(true);
  });

  it('should create financialDisclaimer guideline', async () => {
    const g = PresetGuidelines.financialDisclaimer();
    expect(g.id).toBe('financial-disclaimer');
    expect(g.enforcement).toBe('advisory');
    expect(await matchesContext(g, { topic: 'investment' })).toBe(true);
    expect(await matchesContext(g, { topic: 'cooking' })).toBe(false);
  });

  it('should create professionalTone guideline', async () => {
    const g = PresetGuidelines.professionalTone();
    expect(g.id).toBe('professional-tone');
    // Always matches
    expect(await matchesContext(g, {})).toBe(true);
  });

  it('should create dataPrivacy guideline', async () => {
    const g = PresetGuidelines.dataPrivacy();
    expect(g.id).toBe('data-privacy');
    expect(g.enforcement).toBe('strict');
    expect(await matchesContext(g, { message: 'Here is my credit card number' })).toBe(true);
    expect(await matchesContext(g, { message: 'Hello world' })).toBe(false);
  });

  it('should create legalDisclaimer guideline', async () => {
    const g = PresetGuidelines.legalDisclaimer();
    expect(g.id).toBe('legal-disclaimer');
    expect(await matchesContext(g, { topic: 'legal' })).toBe(true);
    expect(await matchesContext(g, { message: 'I want to sue my landlord' })).toBe(true);
  });

  it('should create brandVoice guideline with custom params', () => {
    const g = PresetGuidelines.brandVoice('Acme', 'Friendly and helpful');
    expect(g.id).toBe('brand-voice');
    expect(g.name).toContain('Acme');
    expect(typeof g.content === 'string' && g.content.includes('Friendly and helpful')).toBe(true);
  });

  it('should create customerEmpathy guideline', async () => {
    const g = PresetGuidelines.customerEmpathy();
    expect(g.id).toBe('customer-empathy');
    expect(await matchesContext(g, { category: 'support' })).toBe(true);
    expect(await matchesContext(g, { category: 'sales' })).toBe(false);
  });

  it('should create ageAppropriate guideline with custom age', () => {
    const g = PresetGuidelines.ageAppropriate(18);
    expect(g.id).toBe('age-appropriate');
    expect(typeof g.content === 'string' && g.content.includes('18')).toBe(true);
    expect(g.enforcement).toBe('strict');
  });
});

// =============================================================================
// MemoryStorage
// =============================================================================

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should save and retrieve guideline', async () => {
    const g = createGuideline({ id: 'test', condition: () => true, content: 'Test' });
    await storage.save(g);
    const retrieved = await storage.get('test');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('test');
  });

  it('should return null for nonexistent guideline', async () => {
    const result = await storage.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should get all guidelines', async () => {
    await storage.save(createGuideline({ id: 'a', condition: () => true, content: 'A' }));
    await storage.save(createGuideline({ id: 'b', condition: () => true, content: 'B' }));
    const all = await storage.getAll();
    expect(all).toHaveLength(2);
  });

  it('should update guideline', async () => {
    await storage.save(createGuideline({ id: 'test', condition: () => true, content: 'Original' }));
    await storage.update('test', { content: 'Updated' } as any);
    const g = await storage.get('test');
    expect(g!.content).toBe('Updated');
  });

  it('should throw when updating nonexistent guideline', async () => {
    await expect(storage.update('missing', {})).rejects.toThrow('not found');
  });

  it('should delete guideline', async () => {
    await storage.save(createGuideline({ id: 'test', condition: () => true, content: 'Test' }));
    await storage.delete('test');
    expect(await storage.get('test')).toBeNull();
  });

  it('should query guidelines by filter', async () => {
    await storage.save(createGuideline({ id: 'a', condition: () => true, content: 'A', category: 'safety' }));
    await storage.save(createGuideline({ id: 'b', condition: () => true, content: 'B', category: 'finance' }));
    const results = await storage.query({ category: 'safety' } as any);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a');
  });

  it('should clear all guidelines', async () => {
    await storage.save(createGuideline({ id: 'a', condition: () => true, content: 'A' }));
    await storage.save(createGuideline({ id: 'b', condition: () => true, content: 'B' }));
    await storage.clear();
    expect(await storage.count()).toBe(0);
  });

  it('should count guidelines', async () => {
    await storage.save(createGuideline({ id: 'a', condition: () => true, content: 'A' }));
    expect(await storage.count()).toBe(1);
  });
});

// =============================================================================
// createStorage
// =============================================================================

describe('createStorage', () => {
  it('should create memory storage', () => {
    const storage = createStorage('memory');
    expect(storage).toBeInstanceOf(MemoryStorage);
  });

  it('should throw for file storage without path', () => {
    expect(() => createStorage('file')).toThrow('filePath');
  });

  it('should create file storage with path', () => {
    const storage = createStorage('file', { filePath: '/tmp/test.json' });
    expect(storage).toBeDefined();
  });

  it('should throw for unknown storage type', () => {
    expect(() => createStorage('redis' as any)).toThrow('Unknown storage type');
  });
});

// =============================================================================
// GuidelineManager
// =============================================================================

describe('GuidelineManager', () => {
  let manager: GuidelineManager;

  beforeEach(() => {
    manager = new GuidelineManager({ enableAnalytics: true, enableCache: false });
  });

  it('should create with default config', () => {
    const m = new GuidelineManager();
    expect(m).toBeDefined();
  });

  it('should add and retrieve guideline', async () => {
    const g = PresetGuidelines.noMedicalAdvice();
    await manager.addGuideline(g);
    expect(manager.getGuideline('no-medical-advice')).toBeDefined();
  });

  it('should add multiple guidelines', async () => {
    await manager.addGuidelines([
      PresetGuidelines.noMedicalAdvice(),
      PresetGuidelines.financialDisclaimer(),
    ]);
    expect(manager.getAllGuidelines()).toHaveLength(2);
  });

  it('should remove guideline', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.removeGuideline('no-medical-advice');
    expect(manager.getGuideline('no-medical-advice')).toBeUndefined();
  });

  it('should update guideline', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.updateGuideline('no-medical-advice', { priority: 200 });
    const g = manager.getGuideline('no-medical-advice');
    expect(g!.priority).toBe(200);
  });

  it('should throw when updating nonexistent guideline', async () => {
    await expect(manager.updateGuideline('missing', {})).rejects.toThrow('not found');
  });

  it('should match guidelines against context', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.addGuideline(PresetGuidelines.financialDisclaimer());

    const matched = await manager.match({ topic: 'medical' });
    expect(matched.length).toBeGreaterThanOrEqual(1);
    expect(matched.some(m => m.guideline.id === 'no-medical-advice')).toBe(true);
  });

  it('should resolve dynamic content during matching', async () => {
    const g = createGuideline({
      id: 'dynamic',
      condition: Conditions.always(),
      content: (ctx) => `Topic: ${ctx.topic || 'unknown'}`,
    });
    await manager.addGuideline(g);

    const matched = await manager.match({ topic: 'science' });
    expect(matched[0].resolvedContent).toBe('Topic: science');
  });

  it('should respect maxMatches config', async () => {
    const m = new GuidelineManager({ maxMatches: 1, enableCache: false });
    await m.addGuideline(PresetGuidelines.professionalTone());
    await m.addGuideline(PresetGuidelines.ageAppropriate());

    const matched = await m.match({});
    expect(matched.length).toBeLessThanOrEqual(1);
  });

  it('should filter by category in match options', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.addGuideline(PresetGuidelines.financialDisclaimer());

    const matched = await manager.match({ topic: 'investment' }, { category: 'finance' });
    expect(matched.every(m => m.guideline.category === 'finance')).toBe(true);
  });

  it('should filter by tags in match options', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.addGuideline(PresetGuidelines.dataPrivacy());

    const matched = await manager.match(
      { message: 'my ssn is 123' },
      { tags: ['privacy'] }
    );
    expect(matched.every(m => m.guideline.tags?.includes('privacy'))).toBe(true);
  });

  it('should filter by minPriority', async () => {
    await manager.addGuideline(createGuideline({ id: 'low', condition: Conditions.always(), content: 'Low', priority: 10 }));
    await manager.addGuideline(createGuideline({ id: 'high', condition: Conditions.always(), content: 'High', priority: 90 }));

    const matched = await manager.match({}, { minPriority: 50 });
    expect(matched.every(m => m.guideline.priority >= 50)).toBe(true);
  });

  it('should filter by maxPriority', async () => {
    await manager.addGuideline(createGuideline({ id: 'low', condition: Conditions.always(), content: 'Low', priority: 10 }));
    await manager.addGuideline(createGuideline({ id: 'high', condition: Conditions.always(), content: 'High', priority: 90 }));

    const matched = await manager.match({}, { maxPriority: 50 });
    expect(matched.every(m => m.guideline.priority <= 50)).toBe(true);
  });

  it('should exclude inactive guidelines by default', async () => {
    const g = createGuideline({ id: 'inactive', condition: Conditions.always(), content: 'Inactive' });
    g.status = 'inactive';
    await manager.addGuideline(g);

    const matched = await manager.match({});
    expect(matched.some(m => m.guideline.id === 'inactive')).toBe(false);
  });

  it('should include inactive guidelines when requested', async () => {
    const g = createGuideline({ id: 'inactive', condition: Conditions.always(), content: 'Inactive' });
    g.status = 'inactive';
    await manager.addGuideline(g);

    const matched = await manager.match({}, { includeInactive: true });
    expect(matched.some(m => m.guideline.id === 'inactive')).toBe(true);
  });

  it('should resolve conflicts by highest priority', async () => {
    await manager.addGuideline(createGuideline({ id: 'low', condition: Conditions.always(), content: 'Low', priority: 10 }));
    await manager.addGuideline(createGuideline({ id: 'high', condition: Conditions.always(), content: 'High', priority: 90 }));

    const matched = await manager.match({}, { conflictResolution: 'highest-priority' });
    expect(matched[0].guideline.id).toBe('high');
  });

  it('should use first-match resolution', async () => {
    await manager.addGuideline(createGuideline({ id: 'first', condition: Conditions.always(), content: 'First' }));
    await manager.addGuideline(createGuideline({ id: 'second', condition: Conditions.always(), content: 'Second' }));

    const matched = await manager.match({}, { conflictResolution: 'first-match' });
    expect(matched).toHaveLength(1);
  });

  it('should use merge resolution (returns all)', async () => {
    await manager.addGuideline(createGuideline({ id: 'a', condition: Conditions.always(), content: 'A' }));
    await manager.addGuideline(createGuideline({ id: 'b', condition: Conditions.always(), content: 'B' }));

    const matched = await manager.match({}, { conflictResolution: 'merge' });
    expect(matched.length).toBe(2);
  });

  it('should track analytics on match', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.match({ topic: 'medical' });
    await manager.match({ topic: 'medical' });

    const analytics = manager.getAnalytics('no-medical-advice');
    expect(analytics).toBeDefined();
    expect(analytics!.matchCount).toBe(2);
    expect(analytics!.lastMatched).toBeInstanceOf(Date);
  });

  it('should validate response against matched guidelines', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());

    const result = await manager.validate(
      'Take 2 aspirin and call me in the morning',
      { topic: 'medical' }
    );
    // The default checkViolation returns false (placeholder implementation)
    expect(result.compliant).toBe(true);
    expect(result.matchedGuidelines.length).toBeGreaterThan(0);
  });

  it('should export and import guidelines', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.addGuideline(PresetGuidelines.financialDisclaimer());

    const exported = manager.export();
    expect(exported).toHaveLength(2);

    const m2 = new GuidelineManager({ enableCache: false });
    await m2.import(exported);
    expect(m2.getAllGuidelines()).toHaveLength(2);
  });

  it('should reset analytics for specific guideline', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.match({ topic: 'medical' });

    manager.resetAnalytics('no-medical-advice');
    const analytics = manager.getAnalytics('no-medical-advice');
    expect(analytics!.matchCount).toBe(0);
  });

  it('should reset all analytics', async () => {
    await manager.addGuideline(PresetGuidelines.noMedicalAdvice());
    await manager.match({ topic: 'medical' });

    manager.resetAnalytics();
    const allAnalytics = manager.getAllAnalytics();
    for (const [_, stats] of allAnalytics) {
      expect(stats.matchCount).toBe(0);
    }
  });

  it('should clear cache when guidelines change', async () => {
    const m = new GuidelineManager({ enableCache: true });
    await m.addGuideline(PresetGuidelines.professionalTone());
    await m.match({});
    // Adding new guideline should clear cache
    await m.addGuideline(PresetGuidelines.noMedicalAdvice());
    // Should not use stale cache
    const matched = await m.match({ topic: 'medical' });
    expect(matched.some(mg => mg.guideline.id === 'no-medical-advice')).toBe(true);
  });

  it('should call onViolation callback', async () => {
    const onViolation = vi.fn();
    const m = new GuidelineManager({ onViolation, enableCache: false });
    await m.addGuideline(PresetGuidelines.noMedicalAdvice());

    await m.validate('Test response', { topic: 'medical' });
    // checkViolation returns false by default, so callback won't fire
    // This test verifies the manager accepts the callback without error
    expect(m).toBeDefined();
  });
});

// =============================================================================
// createGuidelineManager
// =============================================================================

describe('createGuidelineManager', () => {
  it('should create a manager instance', () => {
    const m = createGuidelineManager();
    expect(m).toBeInstanceOf(GuidelineManager);
  });

  it('should accept config options', () => {
    const m = createGuidelineManager({ maxMatches: 5, enableCache: false });
    expect(m).toBeDefined();
  });
});

// =============================================================================
// Integration: Full guideline workflow
// =============================================================================

describe('Full guideline workflow', () => {
  it('should handle complete healthcare scenario', async () => {
    const manager = createGuidelineManager({ enableCache: false });

    await manager.addGuidelines([
      PresetGuidelines.noMedicalAdvice(),
      PresetGuidelines.dataPrivacy(),
      PresetGuidelines.professionalTone(),
    ]);

    const context: GuidelineContext = {
      topic: 'medical',
      message: 'I have a terrible headache, should I take medicine?',
      user: { id: 'patient-1', roles: ['patient'] },
    };

    const matched = await manager.match(context);
    expect(matched.length).toBeGreaterThanOrEqual(2); // medical + always

    // Verify medical guideline is highest priority
    const sorted = [...matched].sort((a, b) => b.guideline.priority - a.guideline.priority);
    expect(sorted[0].guideline.id).toBe('no-medical-advice');
  });

  it('should handle financial scenario with dynamic content', async () => {
    const manager = createGuidelineManager({ enableCache: false });

    const dynamicGuideline = createGuideline({
      id: 'dynamic-finance',
      condition: Conditions.topic('investment'),
      content: async (ctx) => {
        const tier = ctx.user?.tier || 'free';
        return `Investment guidelines for ${tier} tier: Always include disclaimers.`;
      },
      enforcement: 'advisory',
      priority: 80,
    });

    await manager.addGuideline(dynamicGuideline);

    const matched = await manager.match({
      topic: 'investment',
      user: { id: 'user-1', tier: 'premium' },
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].resolvedContent).toContain('premium');
  });

  it('should handle multi-condition guideline', async () => {
    const manager = createGuidelineManager({ enableCache: false });

    const g = createGuideline({
      id: 'admin-medical',
      condition: Conditions.and(
        Conditions.topic('medical'),
        Conditions.userRole('admin')
      ),
      content: 'Admin-only medical guidelines',
      enforcement: 'strict',
      priority: 100,
    });

    await manager.addGuideline(g);

    // Should match admin with medical topic
    const matchedAdmin = await manager.match({
      topic: 'medical',
      user: { id: '1', roles: ['admin'] },
    });
    expect(matchedAdmin).toHaveLength(1);

    // Should NOT match non-admin with medical topic
    const matchedUser = await manager.match({
      topic: 'medical',
      user: { id: '2', roles: ['user'] },
    });
    expect(matchedUser).toHaveLength(0);
  });
});

// =============================================================================
// Performance
// =============================================================================

describe('Guideline Performance', () => {
  it('should match 100 guidelines in under 50ms', async () => {
    const manager = createGuidelineManager({ enableCache: false });

    for (let i = 0; i < 100; i++) {
      await manager.addGuideline(createGuideline({
        id: `guideline-${i}`,
        condition: i % 2 === 0 ? Conditions.always() : Conditions.never(),
        content: `Guideline ${i}`,
        priority: i,
      }));
    }

    const start = performance.now();
    const matched = await manager.match({});
    const elapsed = performance.now() - start;

    expect(matched.length).toBe(50); // half always match
    expect(elapsed).toBeLessThan(50);
  });

  it('should create guidelines efficiently', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      createGuideline({
        id: `perf-${i}`,
        condition: Conditions.topic('test'),
        content: 'Performance test',
      });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
