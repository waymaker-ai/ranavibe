/**
 * RANA Security Module
 * Security features for API key management and protection
 */

export {
  KeyRotationManager,
  MemoryStorage,
  EncryptedFileStorage,
  createRotatedProviderConfig,
  type KeyStatus,
  type KeyMetadata,
  type KeyRotationConfig,
  type KeyHealth,
  type KeyStorageAdapter,
} from './key-rotation.js';

export {
  ContentFilter,
  createContentFilter,
  isContentSafe,
  assertContentSafe,
  ContentFilterError,
  ContentBlockedError,
  type FilterAction,
  type FilterCategory,
  type FilterSeverity,
  type FilterViolation,
  type FilterResult,
  type FilterPattern,
  type ContentFilterConfig,
} from './filter.js';

export {
  // Audit Logger
  AuditLogger,
  createAuditLogger,
  getGlobalAuditLogger,
  setGlobalAuditLogger,
  // Utility Functions
  hashApiKey,
  detectPII,
  detectInjectionAttempt,
  // Types
  type AuditEventType,
  type AuditOutcome,
  type SecurityEventSeverity,
  type AuditEntry,
  type SecurityEvent,
  type AccessPattern,
  type AuditLoggerConfig,
  type AuditDestination,
  type AuditStore,
  type AuditQueryFilter,
} from './audit.js';

export {
  UserRateLimiter,
  createUserRateLimiter,
  type RateLimitTier,
  type UserIdentifier,
  type UserRateLimitConfig,
  type RateLimitResult,
} from './user-rate-limit.js';

export {
  PromptInjectionDetector,
  createInjectionDetector,
  detectInjection,
  type SensitivityLevel,
  type RiskLevel,
  type InjectionDetectionResult,
  type PromptInjectionDetectorConfig,
} from './injection.js';

export {
  // PII Detector
  PIIDetector,
  createPIIDetector,
  detectPIIAdvanced,
  redactPII,
  maskPII,
  validateCreditCard,
  detectCreditCardType,
  // Types
  type PIIType,
  type PIIMode,
  type PIIRegion,
  type PIIDetection,
  type PIIResult,
  type CustomPattern,
  type PIIDetectorConfig,
} from './pii.js';
