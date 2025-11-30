/**
 * Shared Memory System
 * Enables memory sharing between multiple agents with namespace isolation,
 * permission management, and event-driven synchronization.
 */

import { EventEmitter } from 'events';

/**
 * Permission levels for memory access
 */
export type PermissionLevel = 'read' | 'write' | 'admin';

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy =
  | 'latest-wins'      // Last write wins
  | 'first-wins'       // First write wins (reject later writes)
  | 'merge'            // Attempt to merge values (for objects/arrays)
  | 'version'          // Track versions and require version match
  | 'custom';          // Use custom resolver function

/**
 * Memory entry with metadata
 */
export interface MemoryEntry<T = any> {
  /** Entry value */
  value: T;
  /** Agent ID that wrote this entry */
  ownerId: string;
  /** Timestamp of write */
  timestamp: Date;
  /** Version number for conflict resolution */
  version: number;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Namespace configuration
 */
export interface NamespaceConfig {
  /** Namespace name */
  name: string;
  /** Default permissions for agents not explicitly listed */
  defaultPermission: PermissionLevel | null;
  /** Agent-specific permissions */
  permissions: Map<string, PermissionLevel>;
  /** Conflict resolution strategy */
  conflictStrategy: ConflictStrategy;
  /** Custom conflict resolver */
  conflictResolver?: (
    existing: MemoryEntry,
    incoming: MemoryEntry,
    key: string
  ) => MemoryEntry;
  /** Maximum entries in namespace (0 = unlimited) */
  maxEntries?: number;
  /** Time-to-live in milliseconds (0 = no expiry) */
  ttl?: number;
}

/**
 * Access log entry
 */
export interface AccessLogEntry {
  /** Agent ID */
  agentId: string;
  /** Action type */
  action: 'read' | 'write' | 'delete' | 'subscribe' | 'broadcast';
  /** Namespace */
  namespace: string;
  /** Key (if applicable) */
  key?: string;
  /** Timestamp */
  timestamp: Date;
  /** Success status */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Subscription callback
 */
export type SubscriptionCallback = (data: {
  namespace: string;
  key: string;
  value: any;
  agentId: string;
  action: 'write' | 'delete';
}) => void;

/**
 * Broadcast message
 */
export interface BroadcastMessage {
  /** Sender agent ID */
  from: string;
  /** Message payload */
  message: any;
  /** Timestamp */
  timestamp: Date;
  /** Namespace */
  namespace: string;
}

/**
 * SharedMemory class
 * Manages shared memory space across multiple agents with namespace isolation,
 * permissions, and event-driven synchronization.
 */
export class SharedMemory extends EventEmitter {
  /** Namespaces storage */
  private namespaces: Map<string, Map<string, MemoryEntry>>;
  /** Namespace configurations */
  private configs: Map<string, NamespaceConfig>;
  /** Access log */
  private accessLog: AccessLogEntry[];
  /** Subscriptions */
  private subscriptions: Map<string, Set<SubscriptionCallback>>;
  /** Maximum access log size */
  private maxLogSize: number;
  /** Cleanup interval for expired entries */
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options?: { maxLogSize?: number; cleanupIntervalMs?: number }) {
    super();
    this.namespaces = new Map();
    this.configs = new Map();
    this.accessLog = [];
    this.subscriptions = new Map();
    this.maxLogSize = options?.maxLogSize ?? 1000;

    // Start cleanup interval if specified
    if (options?.cleanupIntervalMs) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpiredEntries(),
        options.cleanupIntervalMs
      );
    }
  }

  /**
   * Create or update a namespace
   */
  createNamespace(
    name: string,
    config?: Partial<Omit<NamespaceConfig, 'name' | 'permissions'>> & {
      permissions?: Record<string, PermissionLevel>;
    }
  ): void {
    const permissions = new Map<string, PermissionLevel>();
    if (config?.permissions) {
      Object.entries(config.permissions).forEach(([agentId, level]) => {
        permissions.set(agentId, level);
      });
    }

    const namespaceConfig: NamespaceConfig = {
      name,
      defaultPermission: config?.defaultPermission ?? 'read',
      permissions,
      conflictStrategy: config?.conflictStrategy ?? 'latest-wins',
      conflictResolver: config?.conflictResolver,
      maxEntries: config?.maxEntries ?? 0,
      ttl: config?.ttl ?? 0,
    };

    this.configs.set(name, namespaceConfig);

    if (!this.namespaces.has(name)) {
      this.namespaces.set(name, new Map());
    }

    this.emit('namespace:created', { namespace: name, config: namespaceConfig });
  }

  /**
   * Check if agent has permission for namespace
   */
  private hasPermission(
    namespace: string,
    agentId: string,
    requiredLevel: PermissionLevel
  ): boolean {
    const config = this.configs.get(namespace);
    if (!config) {
      return false;
    }

    const agentPermission = config.permissions.get(agentId) ?? config.defaultPermission;

    if (!agentPermission) {
      return false;
    }

    // Permission hierarchy: admin > write > read
    const levels: PermissionLevel[] = ['read', 'write', 'admin'];
    const agentLevel = levels.indexOf(agentPermission);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    return agentLevel >= requiredLevelIndex;
  }

  /**
   * Write a value to memory
   */
  write<T = any>(
    namespace: string,
    key: string,
    value: T,
    agentId: string,
    metadata?: Record<string, unknown>
  ): boolean {
    // Check namespace exists
    if (!this.configs.has(namespace)) {
      this.logAccess({
        agentId,
        action: 'write',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: `Namespace "${namespace}" does not exist`,
      });
      return false;
    }

    // Check permission
    if (!this.hasPermission(namespace, agentId, 'write')) {
      this.logAccess({
        agentId,
        action: 'write',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: 'Insufficient permissions',
      });
      this.emit('memory:conflict', {
        namespace,
        key,
        agentId,
        reason: 'permission_denied',
      });
      return false;
    }

    const storage = this.namespaces.get(namespace)!;
    const existing = storage.get(key);
    const config = this.configs.get(namespace)!;

    // Create new entry
    const newEntry: MemoryEntry<T> = {
      value,
      ownerId: agentId,
      timestamp: new Date(),
      version: existing ? existing.version + 1 : 1,
      metadata,
    };

    // Handle conflicts if entry exists
    if (existing) {
      const resolved = this.resolveConflict(config, existing, newEntry, key);

      if (!resolved) {
        this.logAccess({
          agentId,
          action: 'write',
          namespace,
          key,
          timestamp: new Date(),
          success: false,
          error: 'Conflict resolution rejected write',
        });
        this.emit('memory:conflict', {
          namespace,
          key,
          agentId,
          existing,
          incoming: newEntry,
          reason: 'conflict_rejected',
        });
        return false;
      }

      storage.set(key, resolved);
    } else {
      // Check max entries limit
      if (config.maxEntries && config.maxEntries > 0 && storage.size >= config.maxEntries) {
        this.logAccess({
          agentId,
          action: 'write',
          namespace,
          key,
          timestamp: new Date(),
          success: false,
          error: 'Namespace full',
        });
        return false;
      }

      storage.set(key, newEntry);
    }

    // Log successful write
    this.logAccess({
      agentId,
      action: 'write',
      namespace,
      key,
      timestamp: new Date(),
      success: true,
    });

    // Emit events
    this.emit('memory:write', {
      namespace,
      key,
      value,
      agentId,
      version: newEntry.version,
    });

    // Notify subscribers
    this.notifySubscribers(namespace, key, value, agentId, 'write');

    return true;
  }

  /**
   * Read a value from memory
   */
  read<T = any>(namespace: string, key: string, agentId: string): T | null {
    // Check namespace exists
    if (!this.configs.has(namespace)) {
      this.logAccess({
        agentId,
        action: 'read',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: `Namespace "${namespace}" does not exist`,
      });
      return null;
    }

    // Check permission
    if (!this.hasPermission(namespace, agentId, 'read')) {
      this.logAccess({
        agentId,
        action: 'read',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: 'Insufficient permissions',
      });
      return null;
    }

    const storage = this.namespaces.get(namespace)!;
    const entry = storage.get(key);

    if (!entry) {
      this.logAccess({
        agentId,
        action: 'read',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: 'Key not found',
      });
      return null;
    }

    // Check TTL
    const config = this.configs.get(namespace)!;
    if (config.ttl && config.ttl > 0) {
      const age = Date.now() - entry.timestamp.getTime();
      if (age > config.ttl) {
        storage.delete(key);
        this.logAccess({
          agentId,
          action: 'read',
          namespace,
          key,
          timestamp: new Date(),
          success: false,
          error: 'Entry expired',
        });
        return null;
      }
    }

    this.logAccess({
      agentId,
      action: 'read',
      namespace,
      key,
      timestamp: new Date(),
      success: true,
    });

    this.emit('memory:read', {
      namespace,
      key,
      value: entry.value,
      agentId,
    });

    return entry.value as T;
  }

  /**
   * Delete a value from memory
   */
  delete(namespace: string, key: string, agentId: string): boolean {
    if (!this.configs.has(namespace)) {
      return false;
    }

    if (!this.hasPermission(namespace, agentId, 'write')) {
      this.logAccess({
        agentId,
        action: 'delete',
        namespace,
        key,
        timestamp: new Date(),
        success: false,
        error: 'Insufficient permissions',
      });
      return false;
    }

    const storage = this.namespaces.get(namespace)!;
    const deleted = storage.delete(key);

    if (deleted) {
      this.logAccess({
        agentId,
        action: 'delete',
        namespace,
        key,
        timestamp: new Date(),
        success: true,
      });

      this.notifySubscribers(namespace, key, null, agentId, 'delete');
    }

    return deleted;
  }

  /**
   * Subscribe to changes in a namespace
   */
  subscribe(namespace: string, agentId: string, callback: SubscriptionCallback): () => void {
    if (!this.configs.has(namespace)) {
      throw new Error(`Namespace "${namespace}" does not exist`);
    }

    if (!this.hasPermission(namespace, agentId, 'read')) {
      throw new Error('Insufficient permissions to subscribe');
    }

    const key = `${namespace}:${agentId}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    this.subscriptions.get(key)!.add(callback);

    this.logAccess({
      agentId,
      action: 'subscribe',
      namespace,
      timestamp: new Date(),
      success: true,
    });

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * Broadcast a message to all agents with access to a namespace
   */
  broadcast(namespace: string, message: any, agentId: string): void {
    if (!this.configs.has(namespace)) {
      throw new Error(`Namespace "${namespace}" does not exist`);
    }

    if (!this.hasPermission(namespace, agentId, 'read')) {
      throw new Error('Insufficient permissions to broadcast');
    }

    const broadcastMsg: BroadcastMessage = {
      from: agentId,
      message,
      timestamp: new Date(),
      namespace,
    };

    this.emit('memory:broadcast', broadcastMsg);

    this.logAccess({
      agentId,
      action: 'broadcast',
      namespace,
      timestamp: new Date(),
      success: true,
    });

    // Notify all subscribers in this namespace
    this.subscriptions.forEach((callbacks, key) => {
      if (key.startsWith(`${namespace}:`)) {
        callbacks.forEach(callback => {
          try {
            callback({
              namespace,
              key: '__broadcast__',
              value: message,
              agentId,
              action: 'write',
            });
          } catch (error) {
            // Silently handle callback errors
          }
        });
      }
    });
  }

  /**
   * Get access log
   */
  getAccessLog(filter?: {
    agentId?: string;
    namespace?: string;
    action?: AccessLogEntry['action'];
    limit?: number;
  }): AccessLogEntry[] {
    let logs = [...this.accessLog];

    if (filter?.agentId) {
      logs = logs.filter(log => log.agentId === filter.agentId);
    }
    if (filter?.namespace) {
      logs = logs.filter(log => log.namespace === filter.namespace);
    }
    if (filter?.action) {
      logs = logs.filter(log => log.action === filter.action);
    }

    if (filter?.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  /**
   * Get all keys in a namespace
   */
  getKeys(namespace: string, agentId: string): string[] | null {
    if (!this.configs.has(namespace)) {
      return null;
    }

    if (!this.hasPermission(namespace, agentId, 'read')) {
      return null;
    }

    const storage = this.namespaces.get(namespace)!;
    return Array.from(storage.keys());
  }

  /**
   * Get all entries in a namespace
   */
  getAll<T = any>(namespace: string, agentId: string): Record<string, T> | null {
    if (!this.configs.has(namespace)) {
      return null;
    }

    if (!this.hasPermission(namespace, agentId, 'read')) {
      return null;
    }

    const storage = this.namespaces.get(namespace)!;
    const result: Record<string, T> = {};
    const config = this.configs.get(namespace)!;

    storage.forEach((entry, key) => {
      // Check TTL
      if (config.ttl && config.ttl > 0) {
        const age = Date.now() - entry.timestamp.getTime();
        if (age > config.ttl) {
          storage.delete(key);
          return;
        }
      }
      result[key] = entry.value;
    });

    return result;
  }

  /**
   * Clear a namespace
   */
  clearNamespace(namespace: string, agentId: string): boolean {
    if (!this.configs.has(namespace)) {
      return false;
    }

    if (!this.hasPermission(namespace, agentId, 'admin')) {
      return false;
    }

    const storage = this.namespaces.get(namespace)!;
    storage.clear();

    this.emit('namespace:cleared', { namespace, agentId });

    return true;
  }

  /**
   * Delete a namespace
   */
  deleteNamespace(namespace: string, agentId: string): boolean {
    if (!this.configs.has(namespace)) {
      return false;
    }

    if (!this.hasPermission(namespace, agentId, 'admin')) {
      return false;
    }

    this.namespaces.delete(namespace);
    this.configs.delete(namespace);

    // Clean up subscriptions
    const toDelete: string[] = [];
    this.subscriptions.forEach((_, key) => {
      if (key.startsWith(`${namespace}:`)) {
        toDelete.push(key);
      }
    });
    toDelete.forEach(key => this.subscriptions.delete(key));

    this.emit('namespace:deleted', { namespace, agentId });

    return true;
  }

  /**
   * Get namespace configuration
   */
  getNamespaceConfig(namespace: string): NamespaceConfig | null {
    const config = this.configs.get(namespace);
    if (!config) {
      return null;
    }

    // Return a copy with permissions as a plain object
    return {
      ...config,
      permissions: new Map(config.permissions),
    };
  }

  /**
   * Update namespace permissions
   */
  updatePermissions(
    namespace: string,
    agentId: string,
    permissions: Record<string, PermissionLevel>,
    requestingAgentId: string
  ): boolean {
    if (!this.configs.has(namespace)) {
      return false;
    }

    if (!this.hasPermission(namespace, requestingAgentId, 'admin')) {
      return false;
    }

    const config = this.configs.get(namespace)!;
    Object.entries(permissions).forEach(([id, level]) => {
      config.permissions.set(id, level);
    });

    this.emit('namespace:permissions_updated', {
      namespace,
      permissions,
      updatedBy: requestingAgentId,
    });

    return true;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    namespaces: number;
    totalEntries: number;
    totalAccessLogs: number;
    subscriptions: number;
    namespaceDetails: Array<{
      name: string;
      entries: number;
      permissions: Record<string, PermissionLevel>;
    }>;
  } {
    const namespaceDetails = Array.from(this.namespaces.entries()).map(([name, storage]) => {
      const config = this.configs.get(name)!;
      const permissions: Record<string, PermissionLevel> = {};
      config.permissions.forEach((level, agentId) => {
        permissions[agentId] = level;
      });

      return {
        name,
        entries: storage.size,
        permissions,
      };
    });

    return {
      namespaces: this.namespaces.size,
      totalEntries: Array.from(this.namespaces.values()).reduce(
        (sum, storage) => sum + storage.size,
        0
      ),
      totalAccessLogs: this.accessLog.length,
      subscriptions: this.subscriptions.size,
      namespaceDetails,
    };
  }

  /**
   * Resolve write conflicts
   */
  private resolveConflict<T>(
    config: NamespaceConfig,
    existing: MemoryEntry<T>,
    incoming: MemoryEntry<T>,
    key: string
  ): MemoryEntry<T> | null {
    switch (config.conflictStrategy) {
      case 'latest-wins':
        return incoming;

      case 'first-wins':
        return null; // Reject incoming write

      case 'merge':
        return this.mergeEntries(existing, incoming);

      case 'version':
        // Only allow write if version matches
        if (incoming.version === existing.version + 1) {
          return incoming;
        }
        return null;

      case 'custom':
        if (config.conflictResolver) {
          return config.conflictResolver(existing, incoming, key);
        }
        return incoming; // Fallback to latest-wins

      default:
        return incoming;
    }
  }

  /**
   * Merge two memory entries
   */
  private mergeEntries<T>(existing: MemoryEntry<T>, incoming: MemoryEntry<T>): MemoryEntry<T> {
    const existingValue = existing.value;
    const incomingValue = incoming.value;

    // If both are objects, merge them
    if (
      typeof existingValue === 'object' &&
      existingValue !== null &&
      !Array.isArray(existingValue) &&
      typeof incomingValue === 'object' &&
      incomingValue !== null &&
      !Array.isArray(incomingValue)
    ) {
      return {
        ...incoming,
        value: { ...existingValue, ...incomingValue } as T,
      };
    }

    // If both are arrays, concatenate them
    if (Array.isArray(existingValue) && Array.isArray(incomingValue)) {
      return {
        ...incoming,
        value: [...existingValue, ...incomingValue] as T,
      };
    }

    // Otherwise, use incoming value
    return incoming;
  }

  /**
   * Notify subscribers of changes
   */
  private notifySubscribers(
    namespace: string,
    key: string,
    value: any,
    agentId: string,
    action: 'write' | 'delete'
  ): void {
    this.subscriptions.forEach((callbacks, subKey) => {
      if (subKey.startsWith(`${namespace}:`)) {
        callbacks.forEach(callback => {
          try {
            callback({ namespace, key, value, agentId, action });
          } catch (error) {
            // Silently handle callback errors
          }
        });
      }
    });
  }

  /**
   * Log access
   */
  private logAccess(entry: AccessLogEntry): void {
    this.accessLog.push(entry);

    // Trim log if it exceeds max size
    if (this.accessLog.length > this.maxLogSize) {
      this.accessLog = this.accessLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    this.configs.forEach((config, namespace) => {
      if (config.ttl && config.ttl > 0) {
        const storage = this.namespaces.get(namespace)!;
        const now = Date.now();
        const toDelete: string[] = [];

        storage.forEach((entry, key) => {
          const age = now - entry.timestamp.getTime();
          if (age > config.ttl!) {
            toDelete.push(key);
          }
        });

        toDelete.forEach(key => storage.delete(key));

        if (toDelete.length > 0) {
          this.emit('memory:cleanup', {
            namespace,
            deletedKeys: toDelete,
            count: toDelete.length,
          });
        }
      }
    });
  }

  /**
   * Destroy the shared memory instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
    this.namespaces.clear();
    this.configs.clear();
    this.subscriptions.clear();
    this.accessLog = [];
  }
}

/**
 * Create a shared memory instance
 */
export function createSharedMemory(options?: {
  maxLogSize?: number;
  cleanupIntervalMs?: number;
}): SharedMemory {
  return new SharedMemory(options);
}
