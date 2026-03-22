import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventCollector } from './collector.js';
import { MemoryStorage } from './storage/memory.js';
import type { DashboardEvent, Alert } from './types.js';

function makeStorage() {
  return new MemoryStorage({ maxEvents: 1000 });
}

describe('EventCollector', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('event collection', () => {
    it('should collect a valid event', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const event = collector.collect({ type: 'request', data: { model: 'gpt-4o' } });
      expect(event.id).toBeDefined();
      expect(event.type).toBe('request');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should auto-generate id if not provided', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const event = collector.collect({ type: 'request', data: { query: 'test' } });
      expect(event.id).toBeTruthy();
      expect(typeof event.id).toBe('string');
    });

    it('should auto-generate timestamp if not provided', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const event = collector.collect({ type: 'cost', data: { amount: 0.5 } });
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should preserve provided id and timestamp', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const event = collector.collect({ id: 'custom-id', type: 'request', timestamp: 12345, data: { test: true } });
      expect(event.id).toBe('custom-id');
      expect(event.timestamp).toBe(12345);
    });

    it('should include optional fields', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const event = collector.collect({
        type: 'request',
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        data: { test: true },
        metadata: { userId: '123' },
      });
      expect(event.provider).toBe('anthropic');
      expect(event.model).toBe('claude-sonnet-4-6');
      expect(event.metadata?.userId).toBe('123');
    });
  });

  describe('validation', () => {
    it('should throw for invalid event type', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      expect(() => collector.collect({ type: 'invalid' as any, data: {} })).toThrow('Invalid event type');
    });

    it('should throw for missing data', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      expect(() => collector.collect({ type: 'request' } as any)).toThrow('data must be a non-null object');
    });

    it('should throw for null data', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      expect(() => collector.collect({ type: 'request', data: null as any })).toThrow();
    });

    it('should accept all valid event types', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const types = ['request', 'response', 'error', 'security', 'compliance', 'cost', 'latency'] as const;
      for (const type of types) {
        expect(() => collector.collect({ type, data: { test: true } })).not.toThrow();
      }
    });
  });

  describe('buffering', () => {
    it('should buffer events before flush', () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, bufferSize: 100, flushIntervalMs: 0 });
      collector.collect({ type: 'request', data: { a: 1 } });
      collector.collect({ type: 'request', data: { a: 2 } });
      expect(collector.getBufferSize()).toBe(2);
    });

    it('should auto-flush when buffer is full', async () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, bufferSize: 3, flushIntervalMs: 0 });
      collector.collect({ type: 'request', data: { a: 1 } });
      collector.collect({ type: 'request', data: { a: 2 } });
      collector.collect({ type: 'request', data: { a: 3 } });
      // Auto-flush triggered, buffer may be flushing
      // Wait a tick for the async flush
      await new Promise((r) => setTimeout(r, 10));
      expect(collector.getBufferSize()).toBe(0);
    });

    it('should flush events to storage', async () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      collector.collect({ type: 'request', data: { a: 1 } });
      collector.collect({ type: 'response', data: { b: 2 } });
      const count = await collector.flush();
      expect(count).toBe(2);
      expect(collector.getBufferSize()).toBe(0);
      expect(storage.size()).toBe(2);
    });

    it('should return 0 when flushing empty buffer', async () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      const count = await collector.flush();
      expect(count).toBe(0);
    });
  });

  describe('alert checking', () => {
    it('should call alert checker for each event', () => {
      const storage = makeStorage();
      const alerts: Alert[] = [];
      const collector = new EventCollector({
        storage,
        flushIntervalMs: 0,
        onAlert: (alert) => alerts.push(alert),
      });
      collector.registerAlertChecker((event) => {
        if (event.type === 'security') {
          return {
            id: 'alert-1',
            type: 'security',
            level: 'critical',
            message: 'Security event detected',
            timestamp: Date.now(),
            acknowledged: false,
          };
        }
        return null;
      });
      collector.collect({ type: 'request', data: {} });
      expect(alerts).toHaveLength(0);
      collector.collect({ type: 'security', data: { threat: true } });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('security');
    });
  });

  describe('stop', () => {
    it('should flush remaining events on stop', async () => {
      const storage = makeStorage();
      const collector = new EventCollector({ storage, flushIntervalMs: 0 });
      collector.collect({ type: 'request', data: { final: true } });
      await collector.stop();
      expect(collector.getBufferSize()).toBe(0);
      expect(storage.size()).toBe(1);
    });
  });
});
