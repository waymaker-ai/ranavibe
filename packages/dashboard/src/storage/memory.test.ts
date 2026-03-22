import { describe, it, expect } from 'vitest';
import { MemoryStorage } from './memory.js';
import type { DashboardEvent } from '../types.js';

function makeEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2)}`,
    type: 'request',
    timestamp: Date.now(),
    data: {},
    ...overrides,
  };
}

describe('MemoryStorage', () => {
  describe('store', () => {
    it('should store events', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent(), makeEvent()]);
      expect(storage.size()).toBe(2);
    });

    it('should append events on subsequent stores', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent()]);
      await storage.store([makeEvent(), makeEvent()]);
      expect(storage.size()).toBe(3);
    });

    it('should enforce maxEvents as circular buffer', async () => {
      const storage = new MemoryStorage({ maxEvents: 3 });
      await storage.store([makeEvent({ id: 'a' }), makeEvent({ id: 'b' }), makeEvent({ id: 'c' })]);
      await storage.store([makeEvent({ id: 'd' })]);
      expect(storage.size()).toBe(3);
      // Oldest should be trimmed
      const results = await storage.query({});
      const ids = results.map((e) => e.id);
      expect(ids).not.toContain('a');
      expect(ids).toContain('d');
    });
  });

  describe('query', () => {
    it('should return all events when no filters', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent(), makeEvent(), makeEvent()]);
      const results = await storage.query({});
      expect(results).toHaveLength(3);
    });

    it('should filter by type', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ type: 'request' }),
        makeEvent({ type: 'error' }),
        makeEvent({ type: 'request' }),
      ]);
      const results = await storage.query({ type: 'request' });
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.type === 'request')).toBe(true);
    });

    it('should filter by provider', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ provider: 'anthropic' }),
        makeEvent({ provider: 'openai' }),
        makeEvent({ provider: 'anthropic' }),
      ]);
      const results = await storage.query({ provider: 'anthropic' });
      expect(results).toHaveLength(2);
    });

    it('should filter by model', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ model: 'gpt-4o' }),
        makeEvent({ model: 'claude-sonnet-4-6' }),
      ]);
      const results = await storage.query({ model: 'gpt-4o' });
      expect(results).toHaveLength(1);
    });

    it('should filter by time range (from)', async () => {
      const storage = new MemoryStorage();
      const now = Date.now();
      await storage.store([
        makeEvent({ timestamp: now - 10000 }),
        makeEvent({ timestamp: now - 5000 }),
        makeEvent({ timestamp: now }),
      ]);
      const results = await storage.query({ from: now - 6000 });
      expect(results).toHaveLength(2);
    });

    it('should filter by time range (to)', async () => {
      const storage = new MemoryStorage();
      const now = Date.now();
      await storage.store([
        makeEvent({ timestamp: now - 10000 }),
        makeEvent({ timestamp: now - 5000 }),
        makeEvent({ timestamp: now }),
      ]);
      const results = await storage.query({ to: now - 4000 });
      expect(results).toHaveLength(2);
    });

    it('should apply limit', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent(), makeEvent(), makeEvent(), makeEvent(), makeEvent()]);
      const results = await storage.query({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ id: 'a', timestamp: 100 }),
        makeEvent({ id: 'b', timestamp: 200 }),
        makeEvent({ id: 'c', timestamp: 300 }),
      ]);
      const results = await storage.query({ offset: 1, limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should sort results by timestamp descending', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ timestamp: 100 }),
        makeEvent({ timestamp: 300 }),
        makeEvent({ timestamp: 200 }),
      ]);
      const results = await storage.query({});
      expect(results[0].timestamp).toBe(300);
      expect(results[1].timestamp).toBe(200);
      expect(results[2].timestamp).toBe(100);
    });
  });

  describe('aggregate', () => {
    it('should aggregate numeric fields', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ data: { cost: 1.5 } }),
        makeEvent({ data: { cost: 2.5 } }),
        makeEvent({ data: { cost: 3.0 } }),
      ]);
      const result = await storage.aggregate({ field: 'data.cost' });
      expect(result.count).toBe(3);
      expect(result.sum).toBe(7.0);
      expect(result.avg).toBeCloseTo(7.0 / 3);
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(3.0);
    });

    it('should return zeros for no matching data', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent({ data: { text: 'hello' } })]);
      const result = await storage.aggregate({ field: 'data.cost' });
      expect(result.count).toBe(0);
      expect(result.sum).toBe(0);
      expect(result.avg).toBe(0);
    });

    it('should filter by type before aggregating', async () => {
      const storage = new MemoryStorage();
      await storage.store([
        makeEvent({ type: 'cost', data: { amount: 10 } }),
        makeEvent({ type: 'request', data: { amount: 5 } }),
        makeEvent({ type: 'cost', data: { amount: 20 } }),
      ]);
      const result = await storage.aggregate({ field: 'data.amount', type: 'cost' });
      expect(result.count).toBe(2);
      expect(result.sum).toBe(30);
    });

    it('should filter by time range', async () => {
      const storage = new MemoryStorage();
      const now = Date.now();
      await storage.store([
        makeEvent({ timestamp: now - 10000, data: { val: 1 } }),
        makeEvent({ timestamp: now - 5000, data: { val: 2 } }),
        makeEvent({ timestamp: now, data: { val: 3 } }),
      ]);
      const result = await storage.aggregate({ field: 'data.val', from: now - 6000 });
      expect(result.count).toBe(2);
      expect(result.sum).toBe(5);
    });

    it('should handle nested field paths', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent({ data: { nested: { value: 42 } } })]);
      const result = await storage.aggregate({ field: 'data.nested.value' });
      expect(result.count).toBe(1);
      expect(result.sum).toBe(42);
    });
  });

  describe('cleanup', () => {
    it('should remove events older than specified duration', async () => {
      const storage = new MemoryStorage();
      const now = Date.now();
      await storage.store([
        makeEvent({ timestamp: now - 100000 }),
        makeEvent({ timestamp: now - 50000 }),
        makeEvent({ timestamp: now }),
      ]);
      const removed = await storage.cleanup(60000);
      expect(removed).toBe(1); // Only the oldest (100s ago) is older than 60s
      expect(storage.size()).toBe(2);
    });

    it('should return 0 when no events are old enough', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent({ timestamp: Date.now() })]);
      const removed = await storage.cleanup(60000);
      expect(removed).toBe(0);
    });

    it('should handle empty storage', async () => {
      const storage = new MemoryStorage();
      const removed = await storage.cleanup(60000);
      expect(removed).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all events', async () => {
      const storage = new MemoryStorage();
      await storage.store([makeEvent(), makeEvent(), makeEvent()]);
      storage.clear();
      expect(storage.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return current event count', async () => {
      const storage = new MemoryStorage();
      expect(storage.size()).toBe(0);
      await storage.store([makeEvent()]);
      expect(storage.size()).toBe(1);
    });
  });
});
