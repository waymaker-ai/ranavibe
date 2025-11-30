/**
 * API Key Rotation Manager
 * Manages API key rotation for enhanced security
 */

import { LLMProvider } from '../types.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export type KeyStatus = 'active' | 'rotating' | 'deprecated' | 'revoked';

export interface KeyMetadata {
  id: string;
  provider: LLMProvider;
  key: string;
  status: KeyStatus;
  createdAt: number;
  lastUsedAt?: number;
  rotatedAt?: number;
  expiresAt?: number;
  usageCount: number;
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: number;
  };
  metadata?: Record<string, any>;
}

export interface KeyRotationConfig {
  /** Rotation interval in days */
  rotation_interval: number;
  /** Overlap period in hours where old key remains valid after rotation */
  overlap_period: number;
  /** Enable automatic rotation */
  auto_rotate: boolean;
  /** Notification callback when key is rotated */
  onRotate?: (provider: LLMProvider, oldKeyId: string, newKeyId: string) => void;
  /** Notification callback when key rotation fails */
  onRotateError?: (provider: LLMProvider, error: Error) => void;
  /** Notification callback when key is about to expire */
  onExpiring?: (provider: LLMProvider, keyId: string, expiresIn: number) => void;
  /** Notification callback when key health degrades */
  onHealthDegraded?: (provider: LLMProvider, keyId: string, health: KeyHealth) => void;
  /** Storage adapter (defaults to memory) */
  storage?: KeyStorageAdapter;
}

export interface KeyHealth {
  keyId: string;
  provider: LLMProvider;
  status: KeyStatus;
  usageCount: number;
  errorCount: number;
  errorRate: number;
  lastUsed?: number;
  age: number;
  daysUntilRotation: number;
  healthy: boolean;
}

export interface KeyStorageAdapter {
  load(): Promise<KeyMetadata[]>;
  save(keys: KeyMetadata[]): Promise<void>;
  close(): Promise<void>;
}

// ============================================================================
// Storage Adapters
// ============================================================================

/**
 * In-memory storage (for development)
 */
export class MemoryStorage implements KeyStorageAdapter {
  private keys: KeyMetadata[] = [];

  async load(): Promise<KeyMetadata[]> {
    return [...this.keys];
  }

  async save(keys: KeyMetadata[]): Promise<void> {
    this.keys = [...keys];
  }

  async close(): Promise<void> {
    // No-op
  }
}

/**
 * File-based storage with encryption
 */
export class EncryptedFileStorage implements KeyStorageAdapter {
  private filePath: string;
  private encryptionKey: string;
  private algorithm = 'aes-256-gcm';

  constructor(options: {
    filePath?: string;
    encryptionKey?: string;
  } = {}) {
    this.filePath = options.filePath || path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.rana',
      'keys.enc'
    );

    // Use provided key or generate from machine-specific data
    this.encryptionKey = options.encryptionKey || this.generateEncryptionKey();

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async load(): Promise<KeyMetadata[]> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    try {
      const encrypted = fs.readFileSync(this.filePath, 'utf-8');
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[KeyRotation] Failed to load keys:', error);
      return [];
    }
  }

  async save(keys: KeyMetadata[]): Promise<void> {
    try {
      const data = JSON.stringify(keys);
      const encrypted = this.encrypt(data);
      fs.writeFileSync(this.filePath, encrypted, 'utf-8');
    } catch (error) {
      console.error('[KeyRotation] Failed to save keys:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // No-op
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  private decrypt(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    ) as crypto.DecipherGCM;

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private generateEncryptionKey(): string {
    // Generate a deterministic key based on machine info
    const machineId = process.env.HOSTNAME || process.env.COMPUTERNAME || 'default';
    return crypto.createHash('sha256').update(machineId).digest('hex');
  }
}

// ============================================================================
// Key Rotation Manager
// ============================================================================

export class KeyRotationManager {
  private keys: Map<string, KeyMetadata[]> = new Map();
  private config: KeyRotationConfig;
  private storage: KeyStorageAdapter;
  private rotationTimer?: NodeJS.Timeout;

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.config = {
      rotation_interval: config.rotation_interval ?? 90, // 90 days default
      overlap_period: config.overlap_period ?? 24, // 24 hours default
      auto_rotate: config.auto_rotate ?? false,
      onRotate: config.onRotate,
      onRotateError: config.onRotateError,
      onExpiring: config.onExpiring,
      onHealthDegraded: config.onHealthDegraded,
      storage: config.storage || new MemoryStorage(),
    };

    this.storage = this.config.storage!;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load keys from storage
    const savedKeys = await this.storage.load();

    for (const key of savedKeys) {
      const providerKeys = this.keys.get(key.provider) || [];
      providerKeys.push(key);
      this.keys.set(key.provider, providerKeys);
    }

    // Start auto-rotation if enabled
    if (this.config.auto_rotate) {
      this.startAutoRotation();
    }
  }

  /**
   * Add a new API key for a provider
   */
  async addKey(
    provider: LLMProvider,
    key: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const keyId = this.generateKeyId();
    const providerKeys = this.keys.get(provider) || [];

    // If this is the first key, make it active
    // Otherwise, make it rotating (will become active after overlap period)
    const status: KeyStatus = providerKeys.length === 0 ? 'active' : 'rotating';

    const keyMetadata: KeyMetadata = {
      id: keyId,
      provider,
      key,
      status,
      createdAt: Date.now(),
      usageCount: 0,
      errorCount: 0,
      metadata,
    };

    providerKeys.push(keyMetadata);
    this.keys.set(provider, providerKeys);

    await this.persist();
    return keyId;
  }

  /**
   * Rotate the API key for a provider
   */
  async rotateKey(
    provider: LLMProvider,
    newKey?: string
  ): Promise<{ oldKeyId: string; newKeyId: string }> {
    try {
      const providerKeys = this.keys.get(provider);
      if (!providerKeys || providerKeys.length === 0) {
        throw new Error(`No keys found for provider: ${provider}`);
      }

      // Get current active key
      const activeKey = providerKeys.find(k => k.status === 'active');
      if (!activeKey) {
        throw new Error(`No active key found for provider: ${provider}`);
      }

      // If no new key provided, require it
      if (!newKey) {
        throw new Error('New key must be provided for rotation');
      }
      // Add new key as rotating
      const newKeyId = await this.addKey(provider, newKey, {
        rotatedFrom: activeKey.id,
      });

      // Mark old key as deprecated with expiration
      const overlapMs = this.config.overlap_period * 60 * 60 * 1000;
      activeKey.status = 'deprecated';
      activeKey.rotatedAt = Date.now();
      activeKey.expiresAt = Date.now() + overlapMs;

      // Find and activate the new key
      const updatedKeys = this.keys.get(provider)!;
      const newKeyMetadata = updatedKeys.find(k => k.id === newKeyId);
      if (newKeyMetadata) {
        newKeyMetadata.status = 'active';
      }

      await this.persist();

      // Notify
      if (this.config.onRotate) {
        this.config.onRotate(provider, activeKey.id, newKeyId);
      }

      // Schedule old key revocation after overlap period
      setTimeout(() => {
        this.revokeKey(provider, activeKey.id).catch(console.error);
      }, overlapMs);

      return { oldKeyId: activeKey.id, newKeyId };
    } catch (error) {
      if (this.config.onRotateError) {
        this.config.onRotateError(provider, error as Error);
      }
      throw error;
    }
  }

  /**
   * Revoke a specific key
   */
  async revokeKey(provider: LLMProvider, keyId: string): Promise<boolean> {
    const providerKeys = this.keys.get(provider);
    if (!providerKeys) {
      return false;
    }

    const key = providerKeys.find(k => k.id === keyId);
    if (!key) {
      return false;
    }

    // Don't revoke if it's the only active key
    const activeKeys = providerKeys.filter(k => k.status === 'active');
    if (key.status === 'active' && activeKeys.length === 1) {
      throw new Error('Cannot revoke the only active key');
    }

    key.status = 'revoked';
    await this.persist();
    return true;
  }

  /**
   * Get the currently active key for a provider
   */
  getActiveKey(provider: LLMProvider): string | null {
    const providerKeys = this.keys.get(provider);
    if (!providerKeys) {
      return null;
    }

    // Try to find active key
    let activeKey = providerKeys.find(k => k.status === 'active');

    // If no active key, try deprecated (during overlap period)
    if (!activeKey) {
      activeKey = providerKeys.find(
        k => k.status === 'deprecated' &&
        (!k.expiresAt || k.expiresAt > Date.now())
      );
    }

    if (activeKey) {
      // Update usage stats
      activeKey.lastUsedAt = Date.now();
      activeKey.usageCount++;
      this.persist().catch(console.error);
    }

    return activeKey?.key || null;
  }

  /**
   * Record a key usage error
   */
  async recordError(provider: LLMProvider, error: Error): Promise<void> {
    const providerKeys = this.keys.get(provider);
    if (!providerKeys) {
      return;
    }

    const activeKey = providerKeys.find(k => k.status === 'active');
    if (!activeKey) {
      return;
    }

    activeKey.errorCount++;
    activeKey.lastError = {
      message: error.message,
      timestamp: Date.now(),
    };

    // Check if health is degraded
    const health = this.calculateKeyHealth(activeKey);
    if (!health.healthy && this.config.onHealthDegraded) {
      this.config.onHealthDegraded(provider, activeKey.id, health);
    }

    await this.persist();
  }

  /**
   * Get health status for all keys or a specific provider
   */
  getKeyHealth(provider?: LLMProvider): KeyHealth[] {
    const healthData: KeyHealth[] = [];

    const providers = provider
      ? [provider]
      : Array.from(this.keys.keys());

    for (const prov of providers) {
      const providerKeys = this.keys.get(prov);
      if (!providerKeys) continue;

      for (const key of providerKeys) {
        healthData.push(this.calculateKeyHealth(key));
      }
    }

    return healthData;
  }

  /**
   * Get all keys for a provider (useful for inspection)
   */
  getAllKeys(provider: LLMProvider): KeyMetadata[] {
    return [...(this.keys.get(provider) || [])];
  }

  /**
   * Start automatic rotation checker
   */
  private startAutoRotation(): void {
    // Check every hour
    const checkInterval = 60 * 60 * 1000;

    this.rotationTimer = setInterval(() => {
      this.checkRotationNeeded();
    }, checkInterval);
  }

  /**
   * Stop automatic rotation
   */
  stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
  }

  /**
   * Check if any keys need rotation
   */
  private checkRotationNeeded(): void {
    const now = Date.now();
    const rotationIntervalMs = this.config.rotation_interval * 24 * 60 * 60 * 1000;
    const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [provider, providerKeys] of this.keys.entries()) {
      for (const key of providerKeys) {
        if (key.status !== 'active') continue;

        const age = now - key.createdAt;
        const timeUntilRotation = rotationIntervalMs - age;

        // Notify if expiring soon
        if (timeUntilRotation < warningThreshold && this.config.onExpiring) {
          this.config.onExpiring(
            provider as LLMProvider,
            key.id,
            Math.floor(timeUntilRotation / (24 * 60 * 60 * 1000))
          );
        }

        // Note: We don't automatically rotate because we need a new key from the user
        // This just sends notifications
      }
    }
  }

  /**
   * Calculate health metrics for a key
   */
  private calculateKeyHealth(key: KeyMetadata): KeyHealth {
    const now = Date.now();
    const age = now - key.createdAt;
    const rotationIntervalMs = this.config.rotation_interval * 24 * 60 * 60 * 1000;
    const daysUntilRotation = Math.floor(
      (rotationIntervalMs - age) / (24 * 60 * 60 * 1000)
    );

    const errorRate = key.usageCount > 0
      ? key.errorCount / key.usageCount
      : 0;

    // Consider unhealthy if:
    // - Error rate > 10%
    // - Key is expired
    // - Key is revoked
    // - Key is past rotation interval
    const healthy =
      errorRate < 0.1 &&
      key.status !== 'revoked' &&
      (!key.expiresAt || key.expiresAt > now) &&
      daysUntilRotation > 0;

    return {
      keyId: key.id,
      provider: key.provider,
      status: key.status,
      usageCount: key.usageCount,
      errorCount: key.errorCount,
      errorRate,
      lastUsed: key.lastUsedAt,
      age,
      daysUntilRotation,
      healthy,
    };
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Persist keys to storage
   */
  private async persist(): Promise<void> {
    const allKeys: KeyMetadata[] = [];

    for (const providerKeys of this.keys.values()) {
      allKeys.push(...providerKeys);
    }

    await this.storage.save(allKeys);
  }

  /**
   * Clean up and close
   */
  async close(): Promise<void> {
    this.stopAutoRotation();
    await this.storage.close();
  }
}

// ============================================================================
// Provider Manager Integration Helper
// ============================================================================

/**
 * Helper to integrate KeyRotationManager with ProviderManager
 *
 * Usage:
 * ```typescript
 * const rotationManager = new KeyRotationManager({ ... });
 * const providerConfig = createRotatedProviderConfig(rotationManager, {
 *   anthropic: 'initial-key',
 *   openai: 'initial-key',
 * });
 *
 * const manager = new ProviderManager({ providers: providerConfig });
 * ```
 */
export function createRotatedProviderConfig(
  rotationManager: KeyRotationManager,
  initialKeys: Record<string, string>
): Record<string, string> {
  const config: Record<string, string> = {};

  // Add all initial keys to rotation manager
  for (const [provider, key] of Object.entries(initialKeys)) {
    rotationManager.addKey(provider as LLMProvider, key).catch(console.error);
  }

  // Create proxy to always return active keys
  return new Proxy(config, {
    get(target, prop: string) {
      const activeKey = rotationManager.getActiveKey(prop as LLMProvider);
      return activeKey || initialKeys[prop];
    },
    has(target, prop: string) {
      return prop in initialKeys;
    },
    ownKeys(target) {
      return Object.keys(initialKeys);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop in initialKeys) {
        return {
          enumerable: true,
          configurable: true,
        };
      }
      return undefined;
    },
  });
}
