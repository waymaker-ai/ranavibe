# API Key Rotation for RANA

Secure API key management with automatic rotation, health monitoring, and graceful transitions.

## Features

- **Multiple Keys per Provider**: Manage multiple API keys for each LLM provider
- **Automatic Rotation**: Schedule-based key rotation with configurable intervals
- **Graceful Transitions**: Old keys remain valid during overlap period
- **Health Monitoring**: Track key usage, errors, and overall health
- **Secure Storage**: In-memory, encrypted file, or custom storage adapters
- **ProviderManager Integration**: Seamless integration with existing RANA infrastructure

## Quick Start

### Basic Usage

```typescript
import { KeyRotationManager, MemoryStorage } from '@rana/core/security';

// Create a rotation manager
const rotationManager = new KeyRotationManager({
  rotation_interval: 90, // Rotate every 90 days
  overlap_period: 24, // Keep old key valid for 24 hours
  auto_rotate: false, // Manual rotation
  storage: new MemoryStorage(),
});

// Add initial API key
await rotationManager.addKey('anthropic', 'sk-ant-api-key-12345');

// Get active key
const activeKey = rotationManager.getActiveKey('anthropic');

// Rotate to new key
await rotationManager.rotateKey('anthropic', 'sk-ant-api-key-67890');
```

### Integration with ProviderManager

```typescript
import { KeyRotationManager, createRotatedProviderConfig } from '@rana/core/security';
import { ProviderManager } from '@rana/core';

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

// ProviderManager automatically uses active keys
const manager = new ProviderManager({
  providers: providerConfig,
});

// Rotate a key - ProviderManager automatically picks up the new key
await rotationManager.rotateKey('anthropic', 'sk-ant-api-new-key');
```

## Configuration

### KeyRotationConfig

```typescript
interface KeyRotationConfig {
  // Rotation interval in days (default: 90)
  rotation_interval: number;

  // Overlap period in hours where old key remains valid (default: 24)
  overlap_period: number;

  // Enable automatic rotation checking (default: false)
  auto_rotate: boolean;

  // Callback when key is rotated
  onRotate?: (provider: LLMProvider, oldKeyId: string, newKeyId: string) => void;

  // Callback when key rotation fails
  onRotateError?: (provider: LLMProvider, error: Error) => void;

  // Callback when key is about to expire
  onExpiring?: (provider: LLMProvider, keyId: string, expiresIn: number) => void;

  // Callback when key health degrades
  onHealthDegraded?: (provider: LLMProvider, keyId: string, health: KeyHealth) => void;

  // Storage adapter (defaults to memory)
  storage?: KeyStorageAdapter;
}
```

## Key Lifecycle

Keys transition through the following states:

1. **active**: Currently in use
2. **rotating**: Being replaced (future state)
3. **deprecated**: Soon to expire (during overlap period)
4. **revoked**: No longer valid

```
┌─────────┐
│  active │ ──────┐
└─────────┘       │ rotateKey()
                  ▼
           ┌────────────┐
           │ deprecated │ (overlap period)
           └────────────┘
                  │
                  ▼ (after overlap_period)
           ┌─────────┐
           │ revoked │
           └─────────┘
```

## Operations

### addKey

Add a new API key for a provider:

```typescript
const keyId = await rotationManager.addKey(
  'anthropic',
  'sk-ant-api-key-123',
  { env: 'production', created_by: 'admin' }
);
```

### rotateKey

Rotate to a new key with graceful transition:

```typescript
const { oldKeyId, newKeyId } = await rotationManager.rotateKey(
  'anthropic',
  'sk-ant-api-key-new'
);
```

During the overlap period:
- New key becomes active immediately
- Old key marked as deprecated but still valid
- Old key automatically revoked after overlap period

### revokeKey

Manually revoke a specific key:

```typescript
await rotationManager.revokeKey('anthropic', keyId);
```

### getActiveKey

Get the currently active key:

```typescript
const key = rotationManager.getActiveKey('anthropic');
```

### recordError

Record an error for health monitoring:

```typescript
try {
  // API call...
} catch (error) {
  await rotationManager.recordError('anthropic', error);
}
```

### getKeyHealth

Monitor key health:

```typescript
const health = rotationManager.getKeyHealth('anthropic');
console.log(health);
// [{
//   keyId: '...',
//   provider: 'anthropic',
//   status: 'active',
//   usageCount: 1000,
//   errorCount: 5,
//   errorRate: 0.005,
//   lastUsed: 1234567890,
//   age: 86400000,
//   daysUntilRotation: 85,
//   healthy: true
// }]
```

A key is considered unhealthy if:
- Error rate > 10%
- Key is expired
- Key is revoked
- Past rotation interval

## Storage Adapters

### MemoryStorage (Development)

```typescript
import { MemoryStorage } from '@rana/core/security';

const storage = new MemoryStorage();
```

Keys are stored in memory and lost on restart. Use for development/testing.

### EncryptedFileStorage (Production)

```typescript
import { EncryptedFileStorage } from '@rana/core/security';

const storage = new EncryptedFileStorage({
  filePath: '/secure/path/keys.enc',
  encryptionKey: process.env.KEY_ENCRYPTION_SECRET,
});
```

Keys are encrypted using AES-256-GCM and stored on disk. Survives restarts.

### Custom Storage Adapter

```typescript
class DatabaseStorage implements KeyStorageAdapter {
  async load(): Promise<KeyMetadata[]> {
    // Load from your database
    return await db.query('SELECT * FROM api_keys WHERE active = true');
  }

  async save(keys: KeyMetadata[]): Promise<void> {
    // Save to your database
    await db.upsert('api_keys', keys);
  }

  async close(): Promise<void> {
    // Close database connection
    await db.close();
  }
}

const rotationManager = new KeyRotationManager({
  storage: new DatabaseStorage(),
});
```

## Automatic Rotation

Enable automatic rotation monitoring:

```typescript
const rotationManager = new KeyRotationManager({
  rotation_interval: 30, // 30 days
  overlap_period: 24,
  auto_rotate: true, // Enable automatic checking

  onExpiring: (provider, keyId, daysRemaining) => {
    console.log(`⚠️  Key for ${provider} expires in ${daysRemaining} days`);
    // Send notification to admins
    // Generate new key and call rotateKey()
  },

  onRotate: (provider, oldKeyId, newKeyId) => {
    console.log(`✅ Rotated ${provider} from ${oldKeyId} to ${newKeyId}`);
    // Log rotation event
  },

  onHealthDegraded: (provider, keyId, health) => {
    console.warn(`❌ Key health degraded for ${provider}`);
    console.warn(`   Error Rate: ${(health.errorRate * 100).toFixed(2)}%`);
    // Alert ops team
  },
});
```

The rotation manager checks every hour for keys that need rotation and sends notifications.

## Security Best Practices

1. **Use Encrypted Storage**: Always use `EncryptedFileStorage` in production
2. **Rotate Regularly**: Set rotation_interval to 30-90 days
3. **Monitor Health**: Set up `onHealthDegraded` callbacks to detect issues
4. **Secure Encryption Keys**: Store encryption keys in environment variables or secrets manager
5. **Overlap Period**: Use at least 24 hours to handle in-flight requests
6. **Test Rotations**: Test key rotation in staging before production
7. **Audit Logs**: Log all rotation events for compliance

## Examples

See `key-rotation.example.ts` for comprehensive examples:

- Basic in-memory rotation
- ProviderManager integration
- Encrypted file storage
- Key health monitoring
- Automatic rotation notifications
- Multiple provider management
- Graceful key deprecation
- Custom storage adapters

## API Reference

### KeyRotationManager

Main class for managing API key rotation.

**Constructor**
```typescript
new KeyRotationManager(config?: Partial<KeyRotationConfig>)
```

**Methods**
- `addKey(provider, key, metadata?)`: Add new API key
- `rotateKey(provider, newKey)`: Rotate to new key
- `revokeKey(provider, keyId)`: Revoke a key
- `getActiveKey(provider)`: Get active key
- `getAllKeys(provider)`: Get all keys for provider
- `recordError(provider, error)`: Record error for health tracking
- `getKeyHealth(provider?)`: Get health status
- `stopAutoRotation()`: Stop automatic rotation
- `close()`: Clean up and close

### Helper Functions

**createRotatedProviderConfig**
```typescript
function createRotatedProviderConfig(
  rotationManager: KeyRotationManager,
  initialKeys: Record<string, string>
): Record<string, string>
```

Creates a proxy configuration that always returns the active key for ProviderManager.

## TypeScript Types

```typescript
type KeyStatus = 'active' | 'rotating' | 'deprecated' | 'revoked';

interface KeyMetadata {
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

interface KeyHealth {
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
```

## Testing

Run the test suite:

```bash
npm test packages/core/src/security/__tests__/key-rotation.test.ts
```

All 36 tests cover:
- Key addition and management
- Key rotation with overlap period
- Key revocation
- Health monitoring
- Storage adapters (memory, encrypted file)
- ProviderManager integration
- Error handling
- Auto-rotation features

## Troubleshooting

### Keys not rotating automatically

Ensure `auto_rotate: true` is set in config and that the manager is not closed prematurely.

### Encrypted file won't decrypt

Ensure you're using the same `encryptionKey` that was used to encrypt the file.

### Old key still in use after rotation

Check that you're using `createRotatedProviderConfig` or manually fetching the active key. The overlap period keeps old keys valid for graceful transitions.

### High error rate

Check `getKeyHealth()` to see if keys are being rate-limited or have authentication issues. Consider rotating to fresh keys.

## License

MIT - See main RANA license
