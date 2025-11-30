/**
 * Key Rotation Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KeyRotationManager,
  MemoryStorage,
  EncryptedFileStorage,
  createRotatedProviderConfig,
  type KeyRotationConfig,
} from '../key-rotation';
import { LLMProvider } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

describe('KeyRotationManager', () => {
  let manager: KeyRotationManager;
  let config: Partial<KeyRotationConfig>;

  beforeEach(() => {
    config = {
      rotation_interval: 90,
      overlap_period: 24,
      auto_rotate: false,
      storage: new MemoryStorage(),
    };
    manager = new KeyRotationManager(config);
  });

  afterEach(async () => {
    await manager.close();
  });

  describe('addKey', () => {
    it('should add a new key for a provider', async () => {
      const keyId = await manager.addKey('anthropic', 'test-key-123');

      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('string');

      const activeKey = manager.getActiveKey('anthropic');
      expect(activeKey).toBe('test-key-123');
    });

    it('should mark first key as active', async () => {
      await manager.addKey('anthropic', 'key-1');
      const keys = manager.getAllKeys('anthropic');

      expect(keys).toHaveLength(1);
      expect(keys[0].status).toBe('active');
    });

    it('should mark subsequent keys as rotating', async () => {
      await manager.addKey('anthropic', 'key-1');
      await manager.addKey('anthropic', 'key-2');

      const keys = manager.getAllKeys('anthropic');
      expect(keys).toHaveLength(2);
      expect(keys[0].status).toBe('active');
      expect(keys[1].status).toBe('rotating');
    });

    it('should store custom metadata', async () => {
      const metadata = { env: 'production', created_by: 'admin' };
      await manager.addKey('openai', 'key-1', metadata);

      const keys = manager.getAllKeys('openai');
      expect(keys[0].metadata).toEqual(metadata);
    });
  });

  describe('getActiveKey', () => {
    it('should return null for unknown provider', () => {
      const key = manager.getActiveKey('anthropic');
      expect(key).toBeNull();
    });

    it('should return active key', async () => {
      await manager.addKey('anthropic', 'my-secret-key');
      const key = manager.getActiveKey('anthropic');

      expect(key).toBe('my-secret-key');
    });

    it('should update usage stats', async () => {
      await manager.addKey('anthropic', 'key-1');

      manager.getActiveKey('anthropic');
      manager.getActiveKey('anthropic');

      const keys = manager.getAllKeys('anthropic');
      expect(keys[0].usageCount).toBe(2);
      expect(keys[0].lastUsedAt).toBeDefined();
    });

    it('should return deprecated key during overlap period', async () => {
      const keyId1 = await manager.addKey('anthropic', 'key-1');

      // Manually set key as deprecated with valid expiration
      const keys = manager.getAllKeys('anthropic');
      keys[0].status = 'deprecated';
      keys[0].expiresAt = Date.now() + 60000; // 1 minute from now

      const activeKey = manager.getActiveKey('anthropic');
      expect(activeKey).toBe('key-1');
    });

    it('should not return expired deprecated key', async () => {
      await manager.addKey('anthropic', 'key-1');

      const keys = manager.getAllKeys('anthropic');
      keys[0].status = 'deprecated';
      keys[0].expiresAt = Date.now() - 1000; // Expired

      const activeKey = manager.getActiveKey('anthropic');
      expect(activeKey).toBeNull();
    });
  });

  describe('rotateKey', () => {
    it('should rotate to a new key', async () => {
      await manager.addKey('anthropic', 'old-key');
      // Wait for async initialize
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await manager.rotateKey('anthropic', 'new-key');

      expect(result.oldKeyId).toBeDefined();
      expect(result.newKeyId).toBeDefined();
      expect(result.oldKeyId).not.toBe(result.newKeyId);

      const activeKey = manager.getActiveKey('anthropic');
      expect(activeKey).toBe('new-key');
    });

    it('should mark old key as deprecated', async () => {
      const oldKeyId = await manager.addKey('anthropic', 'old-key');
      await manager.rotateKey('anthropic', 'new-key');

      const keys = manager.getAllKeys('anthropic');
      const oldKey = keys.find(k => k.id === oldKeyId);

      expect(oldKey?.status).toBe('deprecated');
      expect(oldKey?.expiresAt).toBeDefined();
      expect(oldKey?.rotatedAt).toBeDefined();
    });

    it('should set expiration based on overlap period', async () => {
      const overlapHours = 24;
      manager = new KeyRotationManager({
        ...config,
        overlap_period: overlapHours,
      });

      const oldKeyId = await manager.addKey('anthropic', 'old-key');
      const beforeRotate = Date.now();

      await manager.rotateKey('anthropic', 'new-key');

      const keys = manager.getAllKeys('anthropic');
      const oldKey = keys.find(k => k.id === oldKeyId);

      const expectedExpiration = beforeRotate + overlapHours * 60 * 60 * 1000;
      const actualExpiration = oldKey!.expiresAt!;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });

    it('should throw error if no keys exist', async () => {
      await expect(
        manager.rotateKey('anthropic', 'new-key')
      ).rejects.toThrow('No keys found');
    });

    it('should throw error if no new key provided', async () => {
      await manager.addKey('anthropic', 'old-key');

      await expect(
        manager.rotateKey('anthropic')
      ).rejects.toThrow('New key must be provided');
    });

    it('should call onRotate callback', async () => {
      const onRotate = vi.fn();
      manager = new KeyRotationManager({
        ...config,
        onRotate,
      });

      const oldKeyId = await manager.addKey('anthropic', 'old-key');
      const { newKeyId } = await manager.rotateKey('anthropic', 'new-key');

      expect(onRotate).toHaveBeenCalledWith('anthropic', oldKeyId, newKeyId);
    });

    it('should call onRotateError callback on failure', async () => {
      const onRotateError = vi.fn();
      manager = new KeyRotationManager({
        ...config,
        onRotateError,
      });
      // Wait for async initialize
      await new Promise(resolve => setTimeout(resolve, 10));

      try {
        await manager.rotateKey('anthropic', 'new-key');
      } catch {
        // Expected to fail
      }

      expect(onRotateError).toHaveBeenCalled();
    });
  });

  describe('revokeKey', () => {
    it('should revoke a key', async () => {
      await manager.addKey('anthropic', 'key-1');
      const keyId = await manager.addKey('anthropic', 'key-2');

      // Make key-2 active
      const keys = manager.getAllKeys('anthropic');
      keys[1].status = 'active';

      const revoked = await manager.revokeKey('anthropic', keyId);
      expect(revoked).toBe(true);

      const revokedKey = keys.find(k => k.id === keyId);
      expect(revokedKey?.status).toBe('revoked');
    });

    it('should return false for unknown key', async () => {
      const revoked = await manager.revokeKey('anthropic', 'unknown-id');
      expect(revoked).toBe(false);
    });

    it('should not revoke the only active key', async () => {
      const keyId = await manager.addKey('anthropic', 'only-key');

      await expect(
        manager.revokeKey('anthropic', keyId)
      ).rejects.toThrow('Cannot revoke the only active key');
    });
  });

  describe('recordError', () => {
    it('should record error for active key', async () => {
      await manager.addKey('anthropic', 'key-1');

      const error = new Error('API rate limit exceeded');
      await manager.recordError('anthropic', error);

      const keys = manager.getAllKeys('anthropic');
      expect(keys[0].errorCount).toBe(1);
      expect(keys[0].lastError?.message).toBe('API rate limit exceeded');
      expect(keys[0].lastError?.timestamp).toBeDefined();
    });

    it('should call onHealthDegraded when error rate is high', async () => {
      const onHealthDegraded = vi.fn();
      manager = new KeyRotationManager({
        ...config,
        onHealthDegraded,
      });

      await manager.addKey('anthropic', 'key-1');

      // Record many errors to degrade health (>10% error rate)
      const keys = manager.getAllKeys('anthropic');
      keys[0].usageCount = 10;
      keys[0].errorCount = 0;

      // Record 2 errors (20% error rate)
      await manager.recordError('anthropic', new Error('Error 1'));
      await manager.recordError('anthropic', new Error('Error 2'));

      expect(onHealthDegraded).toHaveBeenCalled();
    });
  });

  describe('getKeyHealth', () => {
    it('should return health for all providers', async () => {
      await manager.addKey('anthropic', 'key-1');
      await manager.addKey('openai', 'key-2');

      const health = manager.getKeyHealth();

      expect(health).toHaveLength(2);
      expect(health[0].provider).toBe('anthropic');
      expect(health[1].provider).toBe('openai');
    });

    it('should return health for specific provider', async () => {
      await manager.addKey('anthropic', 'key-1');
      await manager.addKey('openai', 'key-2');

      const health = manager.getKeyHealth('anthropic');

      expect(health).toHaveLength(1);
      expect(health[0].provider).toBe('anthropic');
    });

    it('should calculate error rate correctly', async () => {
      await manager.addKey('anthropic', 'key-1');

      const keys = manager.getAllKeys('anthropic');
      keys[0].usageCount = 100;
      keys[0].errorCount = 5;

      const health = manager.getKeyHealth('anthropic');
      expect(health[0].errorRate).toBe(0.05);
    });

    it('should mark key as unhealthy if error rate > 10%', async () => {
      await manager.addKey('anthropic', 'key-1');

      const keys = manager.getAllKeys('anthropic');
      keys[0].usageCount = 100;
      keys[0].errorCount = 15;

      const health = manager.getKeyHealth('anthropic');
      expect(health[0].healthy).toBe(false);
    });

    it('should mark revoked key as unhealthy', async () => {
      const keyId = await manager.addKey('anthropic', 'key-1');
      await manager.addKey('anthropic', 'key-2');

      const keys = manager.getAllKeys('anthropic');
      keys[1].status = 'active';
      await manager.revokeKey('anthropic', keyId);

      const health = manager.getKeyHealth('anthropic');
      const revokedHealth = health.find(h => h.keyId === keyId);
      expect(revokedHealth?.healthy).toBe(false);
    });
  });

  describe('Storage - MemoryStorage', () => {
    it('should persist and load keys', async () => {
      const storage = new MemoryStorage();
      const manager1 = new KeyRotationManager({ ...config, storage });

      await manager1.addKey('anthropic', 'key-1');
      await manager1.close();

      // Create new manager with same storage
      const manager2 = new KeyRotationManager({ ...config, storage });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const key = manager2.getActiveKey('anthropic');
      expect(key).toBe('key-1');

      await manager2.close();
    });
  });

  describe('Storage - EncryptedFileStorage', () => {
    const testDir = path.join(__dirname, '.test-keys');
    const testFile = path.join(testDir, 'test-keys.enc');

    beforeEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should create encrypted file', async () => {
      const storage = new EncryptedFileStorage({
        filePath: testFile,
        encryptionKey: 'test-key',
      });

      const manager = new KeyRotationManager({ ...config, storage });
      await manager.addKey('anthropic', 'secret-key');
      // Wait for async persist
      await new Promise(resolve => setTimeout(resolve, 100));
      await manager.close();

      expect(fs.existsSync(testFile)).toBe(true);

      // Verify file is encrypted (wrapper object with encrypted data)
      const content = fs.readFileSync(testFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('encrypted');
      expect(parsed).toHaveProperty('authTag');
    });

    it('should decrypt and load keys', async () => {
      const encryptionKey = 'my-secret-key';
      const storage1 = new EncryptedFileStorage({
        filePath: testFile,
        encryptionKey,
      });

      const manager1 = new KeyRotationManager({ ...config, storage: storage1 });
      await manager1.addKey('anthropic', 'api-key-123');
      await manager1.close();

      // Load with new manager using same encryption key
      const storage2 = new EncryptedFileStorage({
        filePath: testFile,
        encryptionKey,
      });

      const manager2 = new KeyRotationManager({ ...config, storage: storage2 });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const key = manager2.getActiveKey('anthropic');
      expect(key).toBe('api-key-123');

      await manager2.close();
    });

    it('should not decrypt with wrong key', async () => {
      const storage1 = new EncryptedFileStorage({
        filePath: testFile,
        encryptionKey: 'correct-key',
      });

      const manager1 = new KeyRotationManager({ ...config, storage: storage1 });
      await manager1.addKey('anthropic', 'secret');
      await manager1.close();

      // Try to load with wrong key
      const storage2 = new EncryptedFileStorage({
        filePath: testFile,
        encryptionKey: 'wrong-key',
      });

      const manager2 = new KeyRotationManager({ ...config, storage: storage2 });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const key = manager2.getActiveKey('anthropic');
      expect(key).toBeNull(); // Failed to decrypt

      await manager2.close();
    });
  });

  describe('createRotatedProviderConfig', () => {
    it('should create proxy config that returns active keys', async () => {
      const rotationManager = new KeyRotationManager(config);
      const providerConfig = createRotatedProviderConfig(rotationManager, {
        anthropic: 'initial-key',
        openai: 'openai-key',
      });

      // Wait for keys to be added
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(providerConfig.anthropic).toBe('initial-key');
      expect(providerConfig.openai).toBe('openai-key');

      await rotationManager.close();
    });

    it('should return updated key after rotation', async () => {
      const rotationManager = new KeyRotationManager(config);
      await rotationManager.addKey('anthropic', 'key-1');

      const providerConfig = createRotatedProviderConfig(rotationManager, {
        anthropic: 'key-1',
      });

      expect(providerConfig.anthropic).toBe('key-1');

      // Rotate key
      await rotationManager.rotateKey('anthropic', 'key-2');

      // Proxy should return new key
      expect(providerConfig.anthropic).toBe('key-2');

      await rotationManager.close();
    });

    it('should support iteration', async () => {
      const rotationManager = new KeyRotationManager(config);
      const providerConfig = createRotatedProviderConfig(rotationManager, {
        anthropic: 'key-1',
        openai: 'key-2',
      });

      const keys = Object.keys(providerConfig);
      expect(keys).toContain('anthropic');
      expect(keys).toContain('openai');

      await rotationManager.close();
    });
  });

  describe('Auto-rotation', () => {
    it('should start rotation timer when enabled', async () => {
      const manager = new KeyRotationManager({
        ...config,
        auto_rotate: true,
      });

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));

      // Timer should be set
      expect((manager as any).rotationTimer).toBeDefined();

      await manager.close();
    });

    it('should stop rotation timer', () => {
      const manager = new KeyRotationManager({
        ...config,
        auto_rotate: true,
      });

      manager.stopAutoRotation();
      expect((manager as any).rotationTimer).toBeUndefined();

      manager.close();
    });

    it('should call onExpiring for keys nearing expiration', async () => {
      const onExpiring = vi.fn();
      const manager = new KeyRotationManager({
        rotation_interval: 10, // 10 days
        overlap_period: 24,
        auto_rotate: false, // Don't auto-start timer
        onExpiring,
        storage: new MemoryStorage(),
      });

      const keyId = await manager.addKey('anthropic', 'key-1');

      // Set key age to 4 days (within 7-day warning threshold)
      const keys = manager.getAllKeys('anthropic');
      keys[0].createdAt = Date.now() - 4 * 24 * 60 * 60 * 1000;

      // Manually trigger the check
      (manager as any).checkRotationNeeded();

      expect(onExpiring).toHaveBeenCalledWith(
        'anthropic',
        keyId,
        expect.any(Number)
      );

      await manager.close();
    });
  });
});
