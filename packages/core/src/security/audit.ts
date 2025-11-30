/**
 * Audit Logger for RANA Security
 * Comprehensive audit logging system with GDPR compliance and tamper detection
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { LLMProvider } from '../types.js';

// ============================================================================
// Audit Event Types
// ============================================================================

export type AuditEventType =
  | 'api_key_usage'
  | 'request'
  | 'response'
  | 'config_change'
  | 'security_event'
  | 'access_pattern'
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'rate_limit'
  | 'error';

export type AuditOutcome = 'success' | 'failure' | 'denied' | 'warning';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Audit Entry Types
// ============================================================================

export interface AuditEntry {
  // Core fields
  id: string;
  timestamp: Date;
  event_type: AuditEventType;
  outcome: AuditOutcome;

  // Actor information
  user_id?: string;
  api_key_hash?: string;
  session_id?: string;
  ip_address?: string;

  // Action details
  action: string;
  resource?: string;
  provider?: LLMProvider;
  model?: string;

  // Metadata
  metadata?: Record<string, any>;
  error_message?: string;

  // Security-specific
  severity?: SecurityEventSeverity;
  threat_type?: string;
  detected_patterns?: string[];

  // Integrity
  hash?: string;
  previous_hash?: string;
}

export interface SecurityEvent {
  type: 'injection_attempt' | 'pii_detection' | 'rate_limit_exceeded' | 'unauthorized_access' | 'suspicious_pattern';
  severity: SecurityEventSeverity;
  description: string;
  detected_patterns?: string[];
  user_id?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export interface AccessPattern {
  user_id?: string;
  api_key_hash?: string;
  timestamp: Date;
  resource: string;
  action: string;
  frequency?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AuditLoggerConfig {
  // Destinations
  destinations?: AuditDestination[];

  // Event filtering
  events?: AuditEventType[];
  excludeEvents?: AuditEventType[];
  minSeverity?: SecurityEventSeverity;

  // Data handling
  hashSensitiveData?: boolean;
  redactFields?: string[];
  includeMetadata?: boolean;
  includeStackTraces?: boolean;

  // GDPR compliance
  gdprMode?: boolean;
  allowUserData?: boolean;
  anonymizeUsers?: boolean;
  retentionDays?: number;

  // Integrity
  enableTamperDetection?: boolean;
  signEntries?: boolean;
  signingKey?: string;

  // File rotation (for file destinations)
  maxFileSize?: number; // bytes
  maxFiles?: number;
  rotateDaily?: boolean;

  // Performance
  bufferSize?: number;
  flushInterval?: number; // milliseconds
}

export interface AuditDestination {
  type: 'file' | 'console' | 'custom';
  filepath?: string;
  handler?: (entry: AuditEntry) => void | Promise<void>;
  enabled?: boolean;
  filter?: (entry: AuditEntry) => boolean;
}

// ============================================================================
// Audit Store Interface
// ============================================================================

export interface AuditStore {
  write(entry: AuditEntry): Promise<void>;
  query(filter: AuditQueryFilter): Promise<AuditEntry[]>;
  flush(): Promise<void>;
  close(): Promise<void>;
  rotate?(): Promise<void>;
}

export interface AuditQueryFilter {
  startDate?: Date;
  endDate?: Date;
  event_type?: AuditEventType;
  outcome?: AuditOutcome;
  user_id?: string;
  api_key_hash?: string;
  action?: string;
  resource?: string;
  severity?: SecurityEventSeverity;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Audit Logger Class
// ============================================================================

export class AuditLogger {
  private config: Required<AuditLoggerConfig>;
  private stores: Map<string, AuditStore> = new Map();
  private buffer: AuditEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private previousHash: string = '';
  private initialized: boolean = false;

  // Severity levels for comparison
  private static readonly SEVERITY_LEVELS: Record<SecurityEventSeverity, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };

  constructor(config: AuditLoggerConfig = {}) {
    this.config = {
      destinations: config.destinations || [{ type: 'file', enabled: true }],
      events: config.events || [],
      excludeEvents: config.excludeEvents || [],
      minSeverity: config.minSeverity || 'low',
      hashSensitiveData: config.hashSensitiveData ?? true,
      redactFields: config.redactFields || ['api_key', 'apiKey', 'password', 'token', 'secret', 'authorization'],
      includeMetadata: config.includeMetadata ?? true,
      includeStackTraces: config.includeStackTraces ?? false,
      gdprMode: config.gdprMode ?? false,
      allowUserData: config.allowUserData ?? true,
      anonymizeUsers: config.anonymizeUsers ?? false,
      retentionDays: config.retentionDays || 90,
      enableTamperDetection: config.enableTamperDetection ?? true,
      signEntries: config.signEntries ?? false,
      signingKey: config.signingKey || this.generateSigningKey(),
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      maxFiles: config.maxFiles || 10,
      rotateDaily: config.rotateDaily ?? false,
      bufferSize: config.bufferSize || 100,
      flushInterval: config.flushInterval || 5000, // 5 seconds
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize stores based on destinations
    for (const dest of this.config.destinations) {
      if (!dest.enabled) continue;

      let store: AuditStore;

      switch (dest.type) {
        case 'file':
          store = new FileAuditStore(dest.filepath || this.getDefaultFilePath(), {
            maxSize: this.config.maxFileSize,
            maxFiles: this.config.maxFiles,
            rotateDaily: this.config.rotateDaily,
          });
          break;

        case 'console':
          store = new ConsoleAuditStore();
          break;

        case 'custom':
          if (!dest.handler) {
            throw new Error('Custom destination requires a handler function');
          }
          store = new CustomAuditStore(dest.handler);
          break;

        default:
          throw new Error(`Unknown destination type: ${dest.type}`);
      }

      this.stores.set(`${dest.type}-${this.stores.size}`, store);
    }

    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flush().catch(err => console.error('Failed to flush audit logs:', err));
    }, this.config.flushInterval);

    this.initialized = true;
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  async logApiKeyUsage(
    api_key_hash: string,
    provider: LLMProvider,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'api_key_usage',
      action,
      api_key_hash,
      provider,
      outcome: 'success',
      metadata,
    });
  }

  async logRequest(
    provider: LLMProvider,
    model: string,
    user_id?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'request',
      action: 'llm_request',
      provider,
      model,
      user_id: this.sanitizeUserId(user_id),
      outcome: 'success',
      metadata: this.config.includeMetadata ? metadata : undefined,
    });
  }

  async logResponse(
    provider: LLMProvider,
    model: string,
    outcome: AuditOutcome,
    latency_ms?: number,
    user_id?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'response',
      action: 'llm_response',
      provider,
      model,
      user_id: this.sanitizeUserId(user_id),
      outcome,
      metadata: {
        ...metadata,
        latency_ms,
      },
    });
  }

  async logConfigChange(
    action: string,
    resource: string,
    user_id?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'config_change',
      action,
      resource,
      user_id: this.sanitizeUserId(user_id),
      outcome: 'success',
      metadata,
      severity: 'medium',
    });
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.log({
      event_type: 'security_event',
      action: event.type,
      outcome: 'warning',
      severity: event.severity,
      threat_type: event.type,
      detected_patterns: event.detected_patterns,
      user_id: this.sanitizeUserId(event.user_id),
      metadata: {
        description: event.description,
        ip_address: event.ip_address,
        ...event.metadata,
      },
    });
  }

  async logAccessPattern(pattern: AccessPattern): Promise<void> {
    await this.log({
      event_type: 'access_pattern',
      action: pattern.action,
      resource: pattern.resource,
      user_id: this.sanitizeUserId(pattern.user_id),
      api_key_hash: pattern.api_key_hash,
      outcome: 'success',
      metadata: {
        frequency: pattern.frequency,
        ...pattern.metadata,
      },
    });
  }

  async logAuthentication(
    outcome: AuditOutcome,
    user_id?: string,
    method?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'authentication',
      action: `auth_${method || 'unknown'}`,
      user_id: this.sanitizeUserId(user_id),
      outcome,
      metadata,
      severity: outcome === 'failure' ? 'high' : 'low',
    });
  }

  async logAuthorization(
    outcome: AuditOutcome,
    resource: string,
    action: string,
    user_id?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'authorization',
      action,
      resource,
      user_id: this.sanitizeUserId(user_id),
      outcome,
      metadata,
      severity: outcome === 'denied' ? 'medium' : 'low',
    });
  }

  async logError(
    error: Error,
    action: string,
    user_id?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: 'error',
      action,
      user_id: this.sanitizeUserId(user_id),
      outcome: 'failure',
      error_message: error.message,
      metadata: {
        ...metadata,
        ...(this.config.includeStackTraces && { stack: error.stack }),
      },
    });
  }

  // ============================================================================
  // Core Logging Method
  // ============================================================================

  private async log(entry: Partial<AuditEntry>): Promise<void> {
    await this.initialize();

    // Check if event should be logged
    if (!this.shouldLog(entry as AuditEntry)) {
      return;
    }

    // Create full audit entry
    const auditEntry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      event_type: entry.event_type!,
      action: entry.action!,
      outcome: entry.outcome || 'success',
      ...entry,
    };

    // Sanitize and redact
    if (this.config.hashSensitiveData) {
      auditEntry.metadata = this.redactSensitiveData(auditEntry.metadata);
    }

    // Add tamper detection
    if (this.config.enableTamperDetection) {
      auditEntry.previous_hash = this.previousHash;
      auditEntry.hash = this.computeHash(auditEntry);
      this.previousHash = auditEntry.hash;
    }

    // Add to buffer
    this.buffer.push(auditEntry);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  async query(filter: AuditQueryFilter): Promise<AuditEntry[]> {
    await this.initialize();

    // Query from first available store (usually file store)
    const store = this.stores.values().next().value;
    if (!store) {
      return [];
    }

    return store.query(filter);
  }

  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    if (!this.config.enableTamperDetection) {
      return { valid: true, errors: ['Tamper detection is disabled'] };
    }

    const entries = await this.query({ limit: 10000 });
    const errors: string[] = [];
    let previousHash = '';

    for (const entry of entries) {
      // Check hash chain
      if (entry.previous_hash !== previousHash) {
        errors.push(`Hash chain broken at entry ${entry.id}: expected ${previousHash}, got ${entry.previous_hash}`);
      }

      // Verify entry hash
      const computedHash = this.computeHash({ ...entry, hash: undefined });
      if (entry.hash !== computedHash) {
        errors.push(`Entry ${entry.id} has been tampered with`);
      }

      previousHash = entry.hash || '';
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    // Write to all stores in parallel
    await Promise.all(
      Array.from(this.stores.values()).map(store =>
        Promise.all(entries.map(entry => store.write(entry)))
      )
    );
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flush();

    await Promise.all(
      Array.from(this.stores.values()).map(store => store.close())
    );
  }

  async cleanup(olderThanDays?: number): Promise<number> {
    const days = olderThanDays || this.config.retentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allEntries = await this.query({});
    const toDelete = allEntries.filter(e => e.timestamp < cutoffDate);

    // For now, we don't actually delete from stores
    // This is a placeholder for future implementation
    return toDelete.length;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private shouldLog(entry: AuditEntry): boolean {
    // Check if event type is excluded
    if (this.config.excludeEvents.includes(entry.event_type)) {
      return false;
    }

    // Check if event type is in whitelist (if whitelist is set)
    if (this.config.events.length > 0 && !this.config.events.includes(entry.event_type)) {
      return false;
    }

    // Check severity threshold
    if (entry.severity) {
      const entrySeverity = AuditLogger.SEVERITY_LEVELS[entry.severity];
      const minSeverity = AuditLogger.SEVERITY_LEVELS[this.config.minSeverity];
      if (entrySeverity < minSeverity) {
        return false;
      }
    }

    return true;
  }

  private sanitizeUserId(user_id?: string): string | undefined {
    if (!user_id) return undefined;

    // GDPR mode - don't log user IDs
    if (this.config.gdprMode && !this.config.allowUserData) {
      return undefined;
    }

    // Anonymize user IDs
    if (this.config.anonymizeUsers) {
      return this.hashValue(user_id);
    }

    return user_id;
  }

  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();

      if (this.config.redactFields.some(field => keyLower.includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  private computeHash(entry: Partial<AuditEntry>): string {
    const { hash, previous_hash, ...dataToHash } = entry as any;
    const data = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());

    if (this.config.signEntries && this.config.signingKey) {
      return crypto
        .createHmac('sha256', this.config.signingKey)
        .update(data)
        .digest('hex');
    }

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSigningKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getDefaultFilePath(): string {
    return path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.rana',
      'audit.log'
    );
  }
}

// ============================================================================
// File Audit Store
// ============================================================================

class FileAuditStore implements AuditStore {
  private filepath: string;
  private maxSize: number;
  private maxFiles: number;
  private rotateDaily: boolean;
  private currentDate: string;

  constructor(
    filepath: string,
    config: { maxSize: number; maxFiles: number; rotateDaily: boolean }
  ) {
    this.filepath = filepath;
    this.maxSize = config.maxSize;
    this.maxFiles = config.maxFiles;
    this.rotateDaily = config.rotateDaily;
    this.currentDate = this.getDateString();

    // Ensure directory exists
    const dir = path.dirname(this.filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async write(entry: AuditEntry): Promise<void> {
    // Check for daily rotation
    if (this.rotateDaily && this.getDateString() !== this.currentDate) {
      await this.rotate();
      this.currentDate = this.getDateString();
    }

    // Check for size-based rotation
    if (fs.existsSync(this.filepath)) {
      const stats = fs.statSync(this.filepath);
      if (stats.size >= this.maxSize) {
        await this.rotate();
      }
    }

    const line = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    }) + '\n';

    fs.appendFileSync(this.filepath, line, 'utf8');
  }

  async query(filter: AuditQueryFilter): Promise<AuditEntry[]> {
    if (!fs.existsSync(this.filepath)) {
      return [];
    }

    const content = fs.readFileSync(this.filepath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    let entries: AuditEntry[] = lines.map(line => {
      const parsed = JSON.parse(line);
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      };
    });

    // Apply filters
    if (filter.startDate) {
      entries = entries.filter(e => e.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      entries = entries.filter(e => e.timestamp <= filter.endDate!);
    }
    if (filter.event_type) {
      entries = entries.filter(e => e.event_type === filter.event_type);
    }
    if (filter.outcome) {
      entries = entries.filter(e => e.outcome === filter.outcome);
    }
    if (filter.user_id) {
      entries = entries.filter(e => e.user_id === filter.user_id);
    }
    if (filter.api_key_hash) {
      entries = entries.filter(e => e.api_key_hash === filter.api_key_hash);
    }
    if (filter.action) {
      entries = entries.filter(e => e.action === filter.action);
    }
    if (filter.resource) {
      entries = entries.filter(e => e.resource === filter.resource);
    }
    if (filter.severity) {
      entries = entries.filter(e => e.severity === filter.severity);
    }

    // Sort by timestamp descending
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (filter.offset) {
      entries = entries.slice(filter.offset);
    }
    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  async flush(): Promise<void> {
    // File writes are synchronous, no buffering needed
  }

  async close(): Promise<void> {
    // Nothing to close for file store
  }

  async rotate(): Promise<void> {
    if (!fs.existsSync(this.filepath)) return;

    // Rotate existing files
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldPath = `${this.filepath}.${i}`;
      const newPath = `${this.filepath}.${i + 1}`;

      if (fs.existsSync(oldPath)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldPath); // Delete oldest
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rename current file
    fs.renameSync(this.filepath, `${this.filepath}.1`);
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// ============================================================================
// Console Audit Store
// ============================================================================

class ConsoleAuditStore implements AuditStore {
  async write(entry: AuditEntry): Promise<void> {
    const color = this.getColor(entry);
    const reset = '\x1b[0m';

    console.log(
      `${color}[AUDIT]${reset} ${entry.timestamp.toISOString()} ${entry.event_type} ${entry.action} ${entry.outcome}`
    );

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', JSON.stringify(entry.metadata, null, 2));
    }
  }

  async query(filter: AuditQueryFilter): Promise<AuditEntry[]> {
    // Console store doesn't support querying
    return [];
  }

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }

  async close(): Promise<void> {
    // Console doesn't need closing
  }

  private getColor(entry: AuditEntry): string {
    if (entry.severity === 'critical') return '\x1b[31m'; // Red
    if (entry.severity === 'high') return '\x1b[33m'; // Yellow
    if (entry.outcome === 'failure') return '\x1b[31m'; // Red
    if (entry.outcome === 'warning') return '\x1b[33m'; // Yellow
    return '\x1b[32m'; // Green
  }
}

// ============================================================================
// Custom Audit Store
// ============================================================================

class CustomAuditStore implements AuditStore {
  private handler: (entry: AuditEntry) => void | Promise<void>;

  constructor(handler: (entry: AuditEntry) => void | Promise<void>) {
    this.handler = handler;
  }

  async write(entry: AuditEntry): Promise<void> {
    await this.handler(entry);
  }

  async query(filter: AuditQueryFilter): Promise<AuditEntry[]> {
    // Custom store doesn't support querying by default
    return [];
  }

  async flush(): Promise<void> {
    // Custom handler is responsible for flushing if needed
  }

  async close(): Promise<void> {
    // Custom handler is responsible for cleanup if needed
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createAuditLogger(config?: AuditLoggerConfig): AuditLogger {
  return new AuditLogger(config);
}

let globalAuditLogger: AuditLogger | null = null;

export function getGlobalAuditLogger(): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger();
  }
  return globalAuditLogger;
}

export function setGlobalAuditLogger(logger: AuditLogger): void {
  globalAuditLogger = logger;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
}

export function detectPII(text: string): { detected: boolean; patterns: string[] } {
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  };

  const detected: string[] = [];

  for (const [type, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      detected.push(type);
    }
  }

  return {
    detected: detected.length > 0,
    patterns: detected,
  };
}

export function detectInjectionAttempt(text: string): { detected: boolean; patterns: string[] } {
  const patterns = {
    sqlInjection: /(\bOR\b|\bAND\b).+?=.+?|;\s*DROP\s+TABLE|UNION\s+SELECT/gi,
    commandInjection: /[;&|`$(){}[\]<>]/g,
    promptInjection: /ignore\s+(previous|all)\s+instructions?|system\s+prompt|you\s+are\s+now/gi,
  };

  const detected: string[] = [];

  for (const [type, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      detected.push(type);
    }
  }

  return {
    detected: detected.length > 0,
    patterns: detected,
  };
}
