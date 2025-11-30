/**
 * Shared Memory Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SharedMemory, createSharedMemory } from '../shared';

describe('SharedMemory', () => {
  let memory: SharedMemory;

  beforeEach(() => {
    memory = createSharedMemory();
  });

  afterEach(() => {
    memory.destroy();
  });

  describe('Namespace Management', () => {
    it('should create a namespace', () => {
      memory.createNamespace('test', {
        defaultPermission: 'write',
      });

      const stats = memory.getStats();
      expect(stats.namespaces).toBe(1);
    });

    it('should get namespace config', () => {
      memory.createNamespace('test', {
        defaultPermission: 'read',
        conflictStrategy: 'latest-wins',
      });

      const config = memory.getNamespaceConfig('test');
      expect(config).toBeDefined();
      expect(config?.defaultPermission).toBe('read');
      expect(config?.conflictStrategy).toBe('latest-wins');
    });

    it('should delete namespace', () => {
      memory.createNamespace('test', {
        defaultPermission: 'write',
        permissions: { 'admin': 'admin' },
      });

      const deleted = memory.deleteNamespace('test', 'admin');
      expect(deleted).toBe(true);

      const stats = memory.getStats();
      expect(stats.namespaces).toBe(0);
    });
  });

  describe('Read/Write Operations', () => {
    beforeEach(() => {
      memory.createNamespace('test', {
        defaultPermission: 'write',
      });
    });

    it('should write and read data', () => {
      const success = memory.write('test', 'key1', 'value1', 'agent-1');
      expect(success).toBe(true);

      const value = memory.read('test', 'key1', 'agent-2');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      const value = memory.read('test', 'non-existent', 'agent-1');
      expect(value).toBeNull();
    });

    it('should delete data', () => {
      memory.write('test', 'key1', 'value1', 'agent-1');
      const deleted = memory.delete('test', 'key1', 'agent-1');
      expect(deleted).toBe(true);

      const value = memory.read('test', 'key1', 'agent-1');
      expect(value).toBeNull();
    });

    it('should get all keys', () => {
      memory.write('test', 'key1', 'value1', 'agent-1');
      memory.write('test', 'key2', 'value2', 'agent-1');
      memory.write('test', 'key3', 'value3', 'agent-1');

      const keys = memory.getKeys('test', 'agent-1');
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should get all entries', () => {
      memory.write('test', 'key1', 'value1', 'agent-1');
      memory.write('test', 'key2', 'value2', 'agent-1');

      const all = memory.getAll('test', 'agent-1');
      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });

  describe('Permissions', () => {
    beforeEach(() => {
      memory.createNamespace('secure', {
        defaultPermission: null,
        permissions: {
          'admin': 'admin',
          'writer': 'write',
          'reader': 'read',
        },
      });
    });

    it('should allow admin to write', () => {
      const success = memory.write('secure', 'key1', 'value1', 'admin');
      expect(success).toBe(true);
    });

    it('should allow writer to write', () => {
      const success = memory.write('secure', 'key1', 'value1', 'writer');
      expect(success).toBe(true);
    });

    it('should allow reader to read', () => {
      memory.write('secure', 'key1', 'value1', 'admin');
      const value = memory.read('secure', 'key1', 'reader');
      expect(value).toBe('value1');
    });

    it('should deny reader from writing', () => {
      const success = memory.write('secure', 'key1', 'value1', 'reader');
      expect(success).toBe(false);
    });

    it('should deny unauthorized access', () => {
      const value = memory.read('secure', 'key1', 'unknown');
      expect(value).toBeNull();
    });

    it('should update permissions', () => {
      const updated = memory.updatePermissions(
        'secure',
        'new-agent',
        { 'new-agent': 'write' },
        'admin'
      );
      expect(updated).toBe(true);

      const success = memory.write('secure', 'key1', 'value1', 'new-agent');
      expect(success).toBe(true);
    });
  });

  describe('Conflict Resolution', () => {
    it('should use latest-wins strategy', () => {
      memory.createNamespace('latest', {
        defaultPermission: 'write',
        conflictStrategy: 'latest-wins',
      });

      memory.write('latest', 'key', 1, 'agent-1');
      memory.write('latest', 'key', 2, 'agent-2');

      const value = memory.read('latest', 'key', 'agent-1');
      expect(value).toBe(2);
    });

    it('should use first-wins strategy', () => {
      memory.createNamespace('first', {
        defaultPermission: 'write',
        conflictStrategy: 'first-wins',
      });

      memory.write('first', 'key', 1, 'agent-1');
      memory.write('first', 'key', 2, 'agent-2');

      const value = memory.read('first', 'key', 'agent-1');
      expect(value).toBe(1);
    });

    it('should merge objects', () => {
      memory.createNamespace('merge', {
        defaultPermission: 'write',
        conflictStrategy: 'merge',
      });

      memory.write('merge', 'obj', { a: 1 }, 'agent-1');
      memory.write('merge', 'obj', { b: 2 }, 'agent-2');

      const value = memory.read('merge', 'obj', 'agent-1');
      expect(value).toEqual({ a: 1, b: 2 });
    });

    it('should merge arrays', () => {
      memory.createNamespace('merge', {
        defaultPermission: 'write',
        conflictStrategy: 'merge',
      });

      memory.write('merge', 'arr', [1, 2], 'agent-1');
      memory.write('merge', 'arr', [3, 4], 'agent-2');

      const value = memory.read('merge', 'arr', 'agent-1');
      expect(value).toEqual([1, 2, 3, 4]);
    });

    it('should use custom resolver', () => {
      memory.createNamespace('custom', {
        defaultPermission: 'write',
        conflictStrategy: 'custom',
        conflictResolver: (existing, incoming) => {
          // Keep higher value
          if (existing.value > incoming.value) {
            return existing;
          }
          return incoming;
        },
      });

      memory.write('custom', 'score', 100, 'agent-1');
      memory.write('custom', 'score', 50, 'agent-2');

      const value = memory.read('custom', 'score', 'agent-1');
      expect(value).toBe(100);

      memory.write('custom', 'score', 150, 'agent-3');
      const newValue = memory.read('custom', 'score', 'agent-1');
      expect(newValue).toBe(150);
    });
  });

  describe('Subscriptions', () => {
    beforeEach(() => {
      memory.createNamespace('events', {
        defaultPermission: 'write',
      });
    });

    it('should notify subscribers on write', () => {
      const callback = vi.fn();
      memory.subscribe('events', 'agent-1', callback);

      memory.write('events', 'key1', 'value1', 'agent-2');

      expect(callback).toHaveBeenCalledWith({
        namespace: 'events',
        key: 'key1',
        value: 'value1',
        agentId: 'agent-2',
        action: 'write',
      });
    });

    it('should notify subscribers on delete', () => {
      const callback = vi.fn();
      memory.write('events', 'key1', 'value1', 'agent-1');
      memory.subscribe('events', 'agent-1', callback);

      memory.delete('events', 'key1', 'agent-2');

      expect(callback).toHaveBeenCalledWith({
        namespace: 'events',
        key: 'key1',
        value: null,
        agentId: 'agent-2',
        action: 'delete',
      });
    });

    it('should unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = memory.subscribe('events', 'agent-1', callback);

      memory.write('events', 'key1', 'value1', 'agent-2');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      memory.write('events', 'key2', 'value2', 'agent-2');
      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('Broadcasting', () => {
    beforeEach(() => {
      memory.createNamespace('broadcast', {
        defaultPermission: 'read',
      });
    });

    it('should broadcast messages', () => {
      const callback = vi.fn();
      memory.on('memory:broadcast', callback);

      memory.broadcast('broadcast', { text: 'Hello' }, 'agent-1');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'agent-1',
          namespace: 'broadcast',
          message: { text: 'Hello' },
        })
      );
    });

    it('should notify subscribers on broadcast', () => {
      const callback = vi.fn();
      memory.subscribe('broadcast', 'agent-1', callback);

      memory.broadcast('broadcast', { text: 'Hello' }, 'agent-2');

      expect(callback).toHaveBeenCalledWith({
        namespace: 'broadcast',
        key: '__broadcast__',
        value: { text: 'Hello' },
        agentId: 'agent-2',
        action: 'write',
      });
    });
  });

  describe('Access Logging', () => {
    beforeEach(() => {
      memory.createNamespace('logged', {
        defaultPermission: 'write',
      });
    });

    it('should log write operations', () => {
      memory.write('logged', 'key1', 'value1', 'agent-1');

      const logs = memory.getAccessLog({ action: 'write' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]).toMatchObject({
        agentId: 'agent-1',
        action: 'write',
        namespace: 'logged',
        key: 'key1',
        success: true,
      });
    });

    it('should log read operations', () => {
      memory.write('logged', 'key1', 'value1', 'agent-1');
      memory.read('logged', 'key1', 'agent-2');

      const logs = memory.getAccessLog({ action: 'read' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1]).toMatchObject({
        agentId: 'agent-2',
        action: 'read',
        namespace: 'logged',
        key: 'key1',
        success: true,
      });
    });

    it('should log failed operations', () => {
      memory.read('logged', 'non-existent', 'agent-1');

      const logs = memory.getAccessLog({
        agentId: 'agent-1',
        action: 'read',
      });

      const failedLog = logs.find(log => !log.success);
      expect(failedLog).toBeDefined();
      expect(failedLog?.error).toBe('Key not found');
    });

    it('should filter logs by agent', () => {
      memory.write('logged', 'key1', 'value1', 'agent-1');
      memory.write('logged', 'key2', 'value2', 'agent-2');

      const logs = memory.getAccessLog({ agentId: 'agent-1' });
      expect(logs.every(log => log.agentId === 'agent-1')).toBe(true);
    });
  });

  describe('TTL', () => {
    it('should expire entries after TTL', async () => {
      memory.createNamespace('temp', {
        defaultPermission: 'write',
        ttl: 100, // 100ms
      });

      memory.write('temp', 'key1', 'value1', 'agent-1');
      const immediate = memory.read('temp', 'key1', 'agent-1');
      expect(immediate).toBe('value1');

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      const expired = memory.read('temp', 'key1', 'agent-1');
      expect(expired).toBeNull();
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      memory.createNamespace('events', {
        defaultPermission: 'write',
      });
    });

    it('should emit memory:write event', () => {
      const callback = vi.fn();
      memory.on('memory:write', callback);

      memory.write('events', 'key1', 'value1', 'agent-1');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'events',
          key: 'key1',
          value: 'value1',
          agentId: 'agent-1',
        })
      );
    });

    it('should emit memory:read event', () => {
      const callback = vi.fn();
      memory.write('events', 'key1', 'value1', 'agent-1');
      memory.on('memory:read', callback);

      memory.read('events', 'key1', 'agent-2');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'events',
          key: 'key1',
          value: 'value1',
          agentId: 'agent-2',
        })
      );
    });

    it('should emit memory:conflict event', () => {
      memory.createNamespace('conflict', {
        defaultPermission: 'write',
        conflictStrategy: 'first-wins',
      });

      const callback = vi.fn();
      memory.on('memory:conflict', callback);

      memory.write('conflict', 'key1', 'value1', 'agent-1');
      memory.write('conflict', 'key1', 'value2', 'agent-2');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'conflict',
          key: 'key1',
          agentId: 'agent-2',
          reason: 'conflict_rejected',
        })
      );
    });
  });

  describe('Statistics', () => {
    it('should track memory statistics', () => {
      memory.createNamespace('ns1', { defaultPermission: 'write' });
      memory.createNamespace('ns2', { defaultPermission: 'write' });

      memory.write('ns1', 'key1', 'value1', 'agent-1');
      memory.write('ns1', 'key2', 'value2', 'agent-1');
      memory.write('ns2', 'key3', 'value3', 'agent-1');

      const stats = memory.getStats();
      expect(stats.namespaces).toBe(2);
      expect(stats.totalEntries).toBe(3);
      expect(stats.namespaceDetails).toHaveLength(2);
    });
  });
});
