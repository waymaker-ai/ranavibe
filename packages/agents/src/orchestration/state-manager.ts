/**
 * Shared State Manager for Multi-Agent Orchestration
 *
 * Provides thread-safe shared state with transactions, versioning, and subscriptions.
 *
 * @example
 * ```typescript
 * const stateManager = new SharedStateManager();
 *
 * // Set state
 * await stateManager.set('users', [{ id: 1, name: 'Alice' }]);
 *
 * // Update with transaction
 * await stateManager.transaction(async (state) => {
 *   const users = state.get('users') || [];
 *   users.push({ id: 2, name: 'Bob' });
 *   state.set('users', users);
 * });
 *
 * // Subscribe to changes
 * stateManager.subscribe('users', (value, change) => {
 *   console.log('Users changed:', value);
 * });
 * ```
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface StateSnapshot {
  id: string;
  version: number;
  data: Map<string, unknown>;
  timestamp: Date;
  modifiedBy: string;
}

export interface StateChange {
  key: string;
  previousValue: unknown;
  newValue: unknown;
  operation: 'set' | 'update' | 'delete';
  version: number;
  timestamp: Date;
  agentId: string;
}

export type StateSubscriber = (value: unknown, change: StateChange) => void;

export interface TransactionContext {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  update<T>(key: string, updater: (current: T | undefined) => T): void;
  delete(key: string): void;
  has(key: string): boolean;
}

export interface LockInfo {
  key: string;
  holder: string;
  acquiredAt: Date;
  timeout: number;
}

// ============================================================================
// Shared State Manager
// ============================================================================

export class SharedStateManager {
  private data: Map<string, unknown> = new Map();
  private version = 0;
  private subscribers: Map<string, Set<StateSubscriber>> = new Map();
  private globalSubscribers: Set<(change: StateChange) => void> = new Set();
  private locks: Map<string, LockInfo> = new Map();
  private history: StateChange[] = [];
  private maxHistorySize = 100;
  private transactionLock = false;

  constructor(initialData?: Record<string, unknown>) {
    if (initialData) {
      for (const [key, value] of Object.entries(initialData)) {
        this.data.set(key, structuredClone(value));
      }
    }
  }

  // ============================================================================
  // Basic Operations
  // ============================================================================

  /**
   * Get a value from state
   */
  get<T>(key: string): T | undefined {
    const value = this.data.get(key);
    return value !== undefined ? structuredClone(value) as T : undefined;
  }

  /**
   * Set a value in state
   */
  async set<T>(key: string, value: T, agentId = 'system'): Promise<void> {
    await this.checkLock(key, agentId);

    const previousValue = this.data.get(key);
    const newValue = structuredClone(value);

    this.data.set(key, newValue);
    this.version++;

    const change: StateChange = {
      key,
      previousValue: previousValue !== undefined ? structuredClone(previousValue) : undefined,
      newValue,
      operation: 'set',
      version: this.version,
      timestamp: new Date(),
      agentId,
    };

    this.recordChange(change);
    this.notifySubscribers(key, newValue, change);
  }

  /**
   * Update a value using an updater function
   */
  async update<T>(
    key: string,
    updater: (current: T | undefined) => T,
    agentId = 'system'
  ): Promise<void> {
    await this.checkLock(key, agentId);

    const current = this.get<T>(key);
    const newValue = updater(current);

    await this.set(key, newValue, agentId);
  }

  /**
   * Delete a key from state
   */
  async delete(key: string, agentId = 'system'): Promise<boolean> {
    await this.checkLock(key, agentId);

    if (!this.data.has(key)) {
      return false;
    }

    const previousValue = this.data.get(key);
    this.data.delete(key);
    this.version++;

    const change: StateChange = {
      key,
      previousValue: previousValue !== undefined ? structuredClone(previousValue) : undefined,
      newValue: undefined,
      operation: 'delete',
      version: this.version,
      timestamp: new Date(),
      agentId,
    };

    this.recordChange(change);
    this.notifySubscribers(key, undefined, change);

    return true;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Get all entries
   */
  entries(): [string, unknown][] {
    return Array.from(this.data.entries()).map(([k, v]) => [k, structuredClone(v)]);
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get a snapshot of current state
   */
  getSnapshot(): StateSnapshot {
    return {
      id: randomUUID(),
      version: this.version,
      data: new Map(
        Array.from(this.data.entries()).map(([k, v]) => [k, structuredClone(v)])
      ),
      timestamp: new Date(),
      modifiedBy: 'snapshot',
    };
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * Execute a transaction with atomic operations
   */
  async transaction(
    fn: (ctx: TransactionContext) => Promise<void> | void,
    agentId = 'system'
  ): Promise<void> {
    // Simple locking mechanism
    while (this.transactionLock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.transactionLock = true;

    // Create snapshot for rollback
    const snapshot = new Map(this.data);
    const startVersion = this.version;
    const pendingChanges: StateChange[] = [];

    const ctx: TransactionContext = {
      get: <T>(key: string) => this.get<T>(key),
      set: <T>(key: string, value: T) => {
        const previousValue = this.data.get(key);
        this.data.set(key, structuredClone(value));
        this.version++;

        pendingChanges.push({
          key,
          previousValue: previousValue !== undefined ? structuredClone(previousValue) : undefined,
          newValue: structuredClone(value),
          operation: 'set',
          version: this.version,
          timestamp: new Date(),
          agentId,
        });
      },
      update: <T>(key: string, updater: (current: T | undefined) => T) => {
        const current = this.get<T>(key);
        ctx.set(key, updater(current));
      },
      delete: (key: string) => {
        const previousValue = this.data.get(key);
        this.data.delete(key);
        this.version++;

        pendingChanges.push({
          key,
          previousValue: previousValue !== undefined ? structuredClone(previousValue) : undefined,
          newValue: undefined,
          operation: 'delete',
          version: this.version,
          timestamp: new Date(),
          agentId,
        });
      },
      has: (key: string) => this.has(key),
    };

    try {
      await fn(ctx);

      // Commit changes
      for (const change of pendingChanges) {
        this.recordChange(change);
        this.notifySubscribers(change.key, change.newValue, change);
      }
    } catch (error) {
      // Rollback on error
      this.data = snapshot;
      this.version = startVersion;
      throw error;
    } finally {
      this.transactionLock = false;
    }
  }

  // ============================================================================
  // Locking
  // ============================================================================

  /**
   * Acquire a lock on a key
   */
  async acquireLock(
    key: string,
    holder: string,
    timeout = 30000
  ): Promise<boolean> {
    // Clean up expired locks
    this.cleanupExpiredLocks();

    const existingLock = this.locks.get(key);
    if (existingLock && existingLock.holder !== holder) {
      return false;
    }

    this.locks.set(key, {
      key,
      holder,
      acquiredAt: new Date(),
      timeout,
    });

    return true;
  }

  /**
   * Release a lock
   */
  releaseLock(key: string, holder: string): boolean {
    const lock = this.locks.get(key);
    if (!lock || lock.holder !== holder) {
      return false;
    }

    this.locks.delete(key);
    return true;
  }

  /**
   * Check if a key is locked
   */
  isLocked(key: string): boolean {
    this.cleanupExpiredLocks();
    return this.locks.has(key);
  }

  private async checkLock(key: string, agentId: string): Promise<void> {
    this.cleanupExpiredLocks();

    const lock = this.locks.get(key);
    if (lock && lock.holder !== agentId) {
      throw new Error(`Key "${key}" is locked by ${lock.holder}`);
    }
  }

  private cleanupExpiredLocks(): void {
    const now = Date.now();

    for (const [key, lock] of this.locks) {
      const expiresAt = lock.acquiredAt.getTime() + lock.timeout;
      if (now > expiresAt) {
        this.locks.delete(key);
      }
    }
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  /**
   * Subscribe to changes on a specific key
   */
  subscribe(key: string, subscriber: StateSubscriber): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(subscriber);
    };
  }

  /**
   * Subscribe to all changes
   */
  subscribeAll(subscriber: (change: StateChange) => void): () => void {
    this.globalSubscribers.add(subscriber);
    return () => this.globalSubscribers.delete(subscriber);
  }

  private notifySubscribers(key: string, value: unknown, change: StateChange): void {
    // Notify key-specific subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      for (const subscriber of keySubscribers) {
        try {
          subscriber(value, change);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      }
    }

    // Notify global subscribers
    for (const subscriber of this.globalSubscribers) {
      try {
        subscriber(change);
      } catch (error) {
        console.error('Global subscriber error:', error);
      }
    }
  }

  // ============================================================================
  // History
  // ============================================================================

  /**
   * Get change history
   */
  getHistory(limit?: number): StateChange[] {
    const result = [...this.history];
    if (limit) {
      return result.slice(-limit);
    }
    return result;
  }

  /**
   * Get history for a specific key
   */
  getKeyHistory(key: string, limit?: number): StateChange[] {
    const keyHistory = this.history.filter(c => c.key === key);
    if (limit) {
      return keyHistory.slice(-limit);
    }
    return keyHistory;
  }

  /**
   * Get value at a specific version
   */
  getAtVersion<T>(key: string, version: number): T | undefined {
    // Find the last change to this key before or at the version
    for (let i = this.history.length - 1; i >= 0; i--) {
      const change = this.history[i];
      if (change.key === key && change.version <= version) {
        return change.newValue as T;
      }
    }
    return undefined;
  }

  private recordChange(change: StateChange): void {
    this.history.push(change);

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Clear all state
   */
  clear(): void {
    this.data.clear();
    this.version++;
    this.history = [];
    this.locks.clear();
  }

  /**
   * Get state size (number of keys)
   */
  get size(): number {
    return this.data.size;
  }

  /**
   * Export state as plain object
   */
  toObject(): Record<string, unknown> {
    return Object.fromEntries(
      Array.from(this.data.entries()).map(([k, v]) => [k, structuredClone(v)])
    );
  }

  /**
   * Import state from plain object
   */
  fromObject(obj: Record<string, unknown>, agentId = 'import'): void {
    for (const [key, value] of Object.entries(obj)) {
      this.data.set(key, structuredClone(value));
    }
    this.version++;

    const change: StateChange = {
      key: '*',
      previousValue: undefined,
      newValue: obj,
      operation: 'set',
      version: this.version,
      timestamp: new Date(),
      agentId,
    };

    this.recordChange(change);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createStateManager(
  initialData?: Record<string, unknown>
): SharedStateManager {
  return new SharedStateManager(initialData);
}
