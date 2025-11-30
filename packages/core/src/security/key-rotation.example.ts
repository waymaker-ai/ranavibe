/**
 * Key Rotation Manager Examples
 * Demonstrates how to use the API key rotation system
 */

import {
  KeyRotationManager,
  MemoryStorage,
  EncryptedFileStorage,
  createRotatedProviderConfig,
} from './key-rotation.js';
import { ProviderManager } from '../providers/manager.js';
import type { LLMProvider } from '../types.js';

// ============================================================================
// Example 1: Basic In-Memory Key Rotation
// ============================================================================

async function basicRotationExample() {
  console.log('=== Example 1: Basic Key Rotation ===\n');

  // Create a key rotation manager with in-memory storage
  const rotationManager = new KeyRotationManager({
    rotation_interval: 90, // Rotate every 90 days
    overlap_period: 24, // Keep old key valid for 24 hours
    auto_rotate: false, // Manual rotation
    storage: new MemoryStorage(),
  });

  // Add initial API key
  const keyId = await rotationManager.addKey(
    'anthropic',
    'sk-ant-api-key-12345',
    { env: 'production' }
  );
  console.log(`Added key: ${keyId}`);

  // Get active key
  const activeKey = rotationManager.getActiveKey('anthropic');
  console.log(`Active key: ${activeKey}\n`);

  // Rotate to new key
  const { oldKeyId, newKeyId } = await rotationManager.rotateKey(
    'anthropic',
    'sk-ant-api-key-67890'
  );
  console.log(`Rotated from ${oldKeyId} to ${newKeyId}`);

  // New key is now active
  const newActiveKey = rotationManager.getActiveKey('anthropic');
  console.log(`New active key: ${newActiveKey}\n`);

  await rotationManager.close();
}

// ============================================================================
// Example 2: Integration with ProviderManager
// ============================================================================

async function providerIntegrationExample() {
  console.log('=== Example 2: ProviderManager Integration ===\n');

  // Create rotation manager
  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
  });

  // Create provider config with rotation support
  const providerConfig = createRotatedProviderConfig(rotationManager, {
    anthropic: 'sk-ant-api-initial',
    openai: 'sk-openai-initial',
    google: 'google-api-key-initial',
  });

  // Create ProviderManager - it will always use the active key
  const manager = new ProviderManager({
    providers: providerConfig,
  });

  console.log('Initial keys configured');

  // Later, rotate a key
  await rotationManager.rotateKey('anthropic', 'sk-ant-api-new-key');
  console.log('Rotated Anthropic key');

  // ProviderManager automatically uses the new key
  // No need to update the configuration manually!

  await rotationManager.close();
}

// ============================================================================
// Example 3: Encrypted File Storage
// ============================================================================

async function encryptedStorageExample() {
  console.log('=== Example 3: Encrypted File Storage ===\n');

  // Create manager with encrypted file storage
  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
    storage: new EncryptedFileStorage({
      filePath: '/Users/you/.rana/production-keys.enc',
      encryptionKey: process.env.KEY_ENCRYPTION_SECRET,
    }),
  });

  // Add keys - they will be encrypted on disk
  await rotationManager.addKey('anthropic', 'sk-ant-production-key');
  console.log('Key stored with encryption');

  // Keys persist across restarts
  await rotationManager.close();

  // Load keys from encrypted file
  const rotationManager2 = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
    storage: new EncryptedFileStorage({
      filePath: '/Users/you/.rana/production-keys.enc',
      encryptionKey: process.env.KEY_ENCRYPTION_SECRET,
    }),
  });

  // Wait for initialization to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  const key = rotationManager2.getActiveKey('anthropic');
  console.log(`Loaded encrypted key: ${key}\n`);

  await rotationManager2.close();
}

// ============================================================================
// Example 4: Monitoring Key Health
// ============================================================================

async function keyHealthExample() {
  console.log('=== Example 4: Key Health Monitoring ===\n');

  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
    onHealthDegraded: (provider, keyId, health) => {
      console.warn(`⚠️  Key health degraded for ${provider}:`);
      console.warn(`   - Key ID: ${keyId}`);
      console.warn(`   - Error Rate: ${(health.errorRate * 100).toFixed(2)}%`);
      console.warn(`   - Status: ${health.status}`);
    },
  });

  await rotationManager.addKey('anthropic', 'test-key');

  // Simulate API errors
  await rotationManager.recordError(
    'anthropic',
    new Error('Rate limit exceeded')
  );

  // Check health
  const health = rotationManager.getKeyHealth('anthropic');
  console.log('Key Health:', JSON.stringify(health, null, 2));
  console.log();

  await rotationManager.close();
}

// ============================================================================
// Example 5: Automatic Rotation Notifications
// ============================================================================

async function autoRotationExample() {
  console.log('=== Example 5: Auto-Rotation Notifications ===\n');

  const rotationManager = new KeyRotationManager({
    rotation_interval: 30, // 30 days
    overlap_period: 24,
    auto_rotate: true, // Enable automatic checking
    onExpiring: (provider, keyId, daysRemaining) => {
      console.log(`📅 Key expiring soon for ${provider}:`);
      console.log(`   - Key ID: ${keyId}`);
      console.log(`   - Days until rotation: ${daysRemaining}`);
      console.log(`   - Action: Generate new key and call rotateKey()\n`);
    },
    onRotate: (provider, oldKeyId, newKeyId) => {
      console.log(`✅ Key rotated for ${provider}:`);
      console.log(`   - Old: ${oldKeyId}`);
      console.log(`   - New: ${newKeyId}\n`);
    },
  });

  await rotationManager.addKey('anthropic', 'key-1');

  // Simulate old key (25 days old, will trigger warning)
  const keys = rotationManager.getAllKeys('anthropic');
  keys[0].createdAt = Date.now() - 25 * 24 * 60 * 60 * 1000;

  console.log('Waiting for auto-rotation checks...');
  // Auto-rotation checks run every hour

  // Clean up
  setTimeout(async () => {
    await rotationManager.close();
  }, 5000);
}

// ============================================================================
// Example 6: Multiple Providers
// ============================================================================

async function multiProviderExample() {
  console.log('=== Example 6: Multiple Provider Management ===\n');

  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
  });

  // Add keys for multiple providers
  const providers: LLMProvider[] = ['anthropic', 'openai', 'google'];

  for (const provider of providers) {
    await rotationManager.addKey(provider, `${provider}-key-initial`);
    console.log(`Added key for ${provider}`);
  }

  // Get health for all providers
  const allHealth = rotationManager.getKeyHealth();
  console.log('\nHealth Summary:');
  allHealth.forEach(h => {
    console.log(`  ${h.provider}: ${h.healthy ? '✅' : '❌'} (${h.usageCount} uses, ${h.errorCount} errors)`);
  });

  await rotationManager.close();
}

// ============================================================================
// Example 7: Graceful Key Deprecation
// ============================================================================

async function gracefulDeprecationExample() {
  console.log('=== Example 7: Graceful Deprecation ===\n');

  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 48, // 48 hour overlap
    auto_rotate: false,
  });

  // Add initial key
  await rotationManager.addKey('anthropic', 'old-key');
  console.log('Active key: old-key');

  // Rotate to new key
  await rotationManager.rotateKey('anthropic', 'new-key');
  console.log('Rotated to: new-key\n');

  // During overlap period, both keys exist
  const allKeys = rotationManager.getAllKeys('anthropic');
  console.log('Keys during overlap period:');
  allKeys.forEach(k => {
    console.log(`  - ${k.key}: ${k.status} (expires: ${k.expiresAt ? new Date(k.expiresAt).toISOString() : 'never'})`);
  });

  // After overlap period, old key is automatically revoked
  console.log('\nOld key will be auto-revoked after 48 hours\n');

  await rotationManager.close();
}

// ============================================================================
// Example 8: Custom Storage Adapter
// ============================================================================

class DatabaseStorage {
  async load() {
    // Load from database
    // const keys = await db.select('api_keys').where({ active: true });
    // return keys;
    return [];
  }

  async save(keys: any[]) {
    // Save to database
    // await db.upsert('api_keys', keys);
  }

  async close() {
    // Close database connection
  }
}

async function customStorageExample() {
  console.log('=== Example 8: Custom Storage Adapter ===\n');

  const rotationManager = new KeyRotationManager({
    rotation_interval: 90,
    overlap_period: 24,
    auto_rotate: false,
    storage: new DatabaseStorage(),
  });

  // Keys are now stored in your custom database
  await rotationManager.addKey('anthropic', 'key-1');
  console.log('Key stored in custom database');

  await rotationManager.close();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  try {
    await basicRotationExample();
    await providerIntegrationExample();
    await keyHealthExample();
    await multiProviderExample();
    await gracefulDeprecationExample();

    // These require more setup:
    // await encryptedStorageExample();
    // await autoRotationExample();
    // await customStorageExample();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Uncomment to run examples
// main();

export {
  basicRotationExample,
  providerIntegrationExample,
  encryptedStorageExample,
  keyHealthExample,
  autoRotationExample,
  multiProviderExample,
  gracefulDeprecationExample,
  customStorageExample,
};
