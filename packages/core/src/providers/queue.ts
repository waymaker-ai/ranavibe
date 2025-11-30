/**
 * Request Queue for RANA
 * Manages request queuing with priority, concurrency, and timeout support
 */

import type { RanaChatRequest, RanaChatResponse, LLMProvider } from '../types';
import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type QueuePriority = 'high' | 'normal' | 'low';

export interface QueuedRequest {
  id: string;
  request: RanaChatRequest;
  provider: LLMProvider;
  priority: QueuePriority;
  timestamp: number;
  timeout?: number;
  resolve: (value: RanaChatResponse) => void;
  reject: (error: Error) => void;
}

export interface QueueConfig {
  /** Maximum number of concurrent requests per provider */
  maxConcurrency?: number;
  /** Default priority for new requests */
  defaultPriority?: QueuePriority;
  /** Default timeout for queued requests in milliseconds */
  timeout?: number;
  /** Callback when queue status changes */
  onQueueChange?: (stats: QueueStats) => void;
  /** Executor function to process requests */
  executor?: (provider: LLMProvider, request: RanaChatRequest) => Promise<RanaChatResponse>;
  /** Enable debug logging */
  debug?: boolean;
}

export interface QueueStats {
  /** Number of requests waiting in queue */
  pending: number;
  /** Number of requests currently processing */
  processing: number;
  /** Number of requests completed */
  completed: number;
  /** Number of requests that timed out */
  timedOut: number;
  /** Number of requests that failed */
  failed: number;
  /** Average wait time in ms */
  avgWaitTime: number;
  /** Queue stats per provider */
  byProvider: Record<string, {
    pending: number;
    processing: number;
    completed: number;
  }>;
}

export type QueueEventType = 'added' | 'processing' | 'completed' | 'timeout' | 'failed' | 'stats';

export interface QueueEvent {
  type: QueueEventType;
  requestId: string;
  provider?: LLMProvider;
  priority?: QueuePriority;
  waitTime?: number;
  error?: Error;
  stats?: QueueStats;
}

// ============================================================================
// Request Queue Manager
// ============================================================================

export class RequestQueue extends EventEmitter {
  private config: Required<Omit<QueueConfig, 'executor'>> & { executor?: QueueConfig['executor'] };
  private queue: QueuedRequest[] = [];
  private processing: Map<string, QueuedRequest> = new Map();
  private processingByProvider: Map<LLMProvider, Set<string>> = new Map();
  private stats: {
    completed: number;
    timedOut: number;
    failed: number;
    totalWaitTime: number;
  } = {
    completed: 0,
    timedOut: 0,
    failed: 0,
    totalWaitTime: 0,
  };
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 5,
      defaultPriority: config.defaultPriority ?? 'normal',
      timeout: config.timeout ?? 60000, // 60 seconds default
      onQueueChange: config.onQueueChange ?? (() => {}),
      executor: config.executor,
      debug: config.debug ?? false,
    };

    this.log('Queue initialized with config:', this.config);
  }

  /**
   * Enqueue a request with optional priority and timeout
   */
  async enqueue(
    provider: LLMProvider,
    request: RanaChatRequest,
    options?: {
      priority?: QueuePriority;
      timeout?: number;
    }
  ): Promise<RanaChatResponse> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: this.generateId(),
        request,
        provider,
        priority: options?.priority ?? this.config.defaultPriority,
        timestamp: Date.now(),
        timeout: options?.timeout ?? this.config.timeout,
        resolve,
        reject,
      };

      // Add to queue based on priority
      this.addToQueue(queuedRequest);

      // Set timeout if configured
      if (queuedRequest.timeout && queuedRequest.timeout > 0) {
        const timeoutId = setTimeout(() => {
          this.handleTimeout(queuedRequest.id);
        }, queuedRequest.timeout);
        this.timeouts.set(queuedRequest.id, timeoutId);
      }

      // Emit added event
      this.emitEvent({
        type: 'added',
        requestId: queuedRequest.id,
        provider,
        priority: queuedRequest.priority,
      });

      this.log(`Request ${queuedRequest.id} added to queue with priority ${queuedRequest.priority}`);
      this.notifyStatsChange();

      // Try to process immediately
      this.processNext();
    });
  }

  /**
   * Process the next request in queue if concurrency allows
   */
  private async processNext(): Promise<void> {
    // Find next request that can be processed
    for (let i = 0; i < this.queue.length; i++) {
      const queuedRequest = this.queue[i];

      if (this.canProcess(queuedRequest.provider)) {
        // Remove from queue
        this.queue.splice(i, 1);

        // Add to processing
        this.processing.set(queuedRequest.id, queuedRequest);

        // Track processing by provider
        if (!this.processingByProvider.has(queuedRequest.provider)) {
          this.processingByProvider.set(queuedRequest.provider, new Set());
        }
        this.processingByProvider.get(queuedRequest.provider)!.add(queuedRequest.id);

        // Calculate wait time
        const waitTime = Date.now() - queuedRequest.timestamp;
        this.stats.totalWaitTime += waitTime;

        // Emit processing event
        this.emitEvent({
          type: 'processing',
          requestId: queuedRequest.id,
          provider: queuedRequest.provider,
          waitTime,
        });

        this.log(`Processing request ${queuedRequest.id} (waited ${waitTime}ms)`);
        this.notifyStatsChange();

        // Execute the request if executor is provided
        if (typeof this.config.executor === 'function') {
          this.executeRequest(queuedRequest);
        }

        break;
      }
    }
  }

  /**
   * Execute a queued request using the configured executor
   */
  private async executeRequest(queuedRequest: QueuedRequest): Promise<void> {
    if (!this.config.executor) {
      this.log(`Warning: No executor configured for request ${queuedRequest.id}`);
      return;
    }

    try {
      const response = await this.config.executor(queuedRequest.provider, queuedRequest.request);
      this.complete(queuedRequest.id, response);
    } catch (error) {
      this.fail(queuedRequest.id, error as Error);
    }
  }

  /**
   * Mark a request as completed and process next
   */
  complete(requestId: string, response: RanaChatResponse): void {
    const queuedRequest = this.processing.get(requestId);
    if (!queuedRequest) {
      this.log(`Warning: Trying to complete unknown request ${requestId}`);
      return;
    }

    // Clear timeout
    this.clearTimeout(requestId);

    // Remove from processing
    this.processing.delete(requestId);
    this.processingByProvider.get(queuedRequest.provider)?.delete(requestId);

    // Update stats
    this.stats.completed++;

    // Emit completed event
    const waitTime = Date.now() - queuedRequest.timestamp;
    this.emitEvent({
      type: 'completed',
      requestId,
      provider: queuedRequest.provider,
      waitTime,
    });

    this.log(`Request ${requestId} completed (total time: ${waitTime}ms)`);
    this.notifyStatsChange();

    // Resolve the promise
    queuedRequest.resolve(response);

    // Process next request
    this.processNext();
  }

  /**
   * Mark a request as failed and process next
   */
  fail(requestId: string, error: Error): void {
    const queuedRequest = this.processing.get(requestId);
    if (!queuedRequest) {
      // Check if it's still in queue
      const queueIndex = this.queue.findIndex(q => q.id === requestId);
      if (queueIndex >= 0) {
        const queuedReq = this.queue[queueIndex];
        this.queue.splice(queueIndex, 1);
        this.clearTimeout(requestId);
        queuedReq.reject(error);
        this.stats.failed++;
        this.notifyStatsChange();
        return;
      }
      this.log(`Warning: Trying to fail unknown request ${requestId}`);
      return;
    }

    // Clear timeout
    this.clearTimeout(requestId);

    // Remove from processing
    this.processing.delete(requestId);
    this.processingByProvider.get(queuedRequest.provider)?.delete(requestId);

    // Update stats
    this.stats.failed++;

    // Emit failed event
    this.emitEvent({
      type: 'failed',
      requestId,
      provider: queuedRequest.provider,
      error,
    });

    this.log(`Request ${requestId} failed: ${error.message}`);
    this.notifyStatsChange();

    // Reject the promise
    queuedRequest.reject(error);

    // Process next request
    this.processNext();
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    const byProvider: Record<string, { pending: number; processing: number; completed: number }> = {};

    // Count pending by provider
    for (const req of this.queue) {
      if (!byProvider[req.provider]) {
        byProvider[req.provider] = { pending: 0, processing: 0, completed: 0 };
      }
      byProvider[req.provider].pending++;
    }

    // Count processing by provider
    for (const [provider, requestIds] of this.processingByProvider.entries()) {
      if (!byProvider[provider]) {
        byProvider[provider] = { pending: 0, processing: 0, completed: 0 };
      }
      byProvider[provider].processing = requestIds.size;
    }

    const avgWaitTime = this.stats.completed > 0
      ? this.stats.totalWaitTime / this.stats.completed
      : 0;

    return {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: this.stats.completed,
      timedOut: this.stats.timedOut,
      failed: this.stats.failed,
      avgWaitTime,
      byProvider,
    };
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    // Reject all pending requests
    for (const queuedRequest of this.queue) {
      this.clearTimeout(queuedRequest.id);
      queuedRequest.reject(new Error('Queue cleared'));
    }
    this.queue = [];
    this.notifyStatsChange();
    this.log('Queue cleared');
  }

  /**
   * Get the current queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Get the number of processing requests
   */
  get processingCount(): number {
    return this.processing.size;
  }

  /**
   * Check if a provider can accept more requests
   */
  private canProcess(provider: LLMProvider): boolean {
    const providerProcessing = this.processingByProvider.get(provider)?.size ?? 0;
    return providerProcessing < this.config.maxConcurrency;
  }

  /**
   * Add request to queue based on priority
   */
  private addToQueue(queuedRequest: QueuedRequest): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    // Find insertion point based on priority
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const currentPriority = priorityOrder[this.queue[i].priority];
      const newPriority = priorityOrder[queuedRequest.priority];

      if (newPriority < currentPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, queuedRequest);
  }

  /**
   * Handle request timeout
   */
  private handleTimeout(requestId: string): void {
    // Find request in queue or processing
    const queueIndex = this.queue.findIndex(q => q.id === requestId);
    const processingRequest = this.processing.get(requestId);

    if (queueIndex >= 0) {
      // Request was still in queue
      const queuedRequest = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      this.stats.timedOut++;

      const error = new Error(`Request timed out after ${queuedRequest.timeout}ms while waiting in queue`);

      this.emitEvent({
        type: 'timeout',
        requestId,
        provider: queuedRequest.provider,
        error,
      });

      this.log(`Request ${requestId} timed out in queue`);
      queuedRequest.reject(error);
      this.notifyStatsChange();
    } else if (processingRequest) {
      // Request was processing
      this.processing.delete(requestId);
      this.processingByProvider.get(processingRequest.provider)?.delete(requestId);
      this.stats.timedOut++;

      const error = new Error(`Request timed out after ${processingRequest.timeout}ms while processing`);

      this.emitEvent({
        type: 'timeout',
        requestId,
        provider: processingRequest.provider,
        error,
      });

      this.log(`Request ${requestId} timed out while processing`);
      processingRequest.reject(error);
      this.notifyStatsChange();
      this.processNext();
    }
  }

  /**
   * Clear timeout for a request
   */
  private clearTimeout(requestId: string): void {
    const timeoutId = this.timeouts.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(requestId);
    }
  }

  /**
   * Emit a queue event
   */
  private emitEvent(event: QueueEvent): void {
    this.emit('event', event);
    this.emit(event.type, event);
  }

  /**
   * Notify about stats change
   */
  private notifyStatsChange(): void {
    const stats = this.getStats();
    this.config.onQueueChange(stats);
    this.emitEvent({
      type: 'stats',
      requestId: '',
      stats,
    });
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug message
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RequestQueue]', ...args);
    }
  }

  /**
   * Get a request from processing by ID
   */
  getProcessingRequest(requestId: string): QueuedRequest | undefined {
    return this.processing.get(requestId);
  }

  /**
   * Check if queue is idle (no pending or processing requests)
   */
  isIdle(): boolean {
    return this.queue.length === 0 && this.processing.size === 0;
  }

  /**
   * Wait for queue to become idle
   */
  async waitForIdle(timeoutMs?: number): Promise<void> {
    if (this.isIdle()) {
      return;
    }

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const checkIdle = () => {
        if (this.isIdle()) {
          if (timeoutId) clearTimeout(timeoutId);
          this.off('stats', checkIdle);
          resolve();
        }
      };

      this.on('stats', checkIdle);

      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          this.off('stats', checkIdle);
          reject(new Error(`Queue did not become idle within ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }
}

/**
 * Create a request queue instance
 */
export function createRequestQueue(config?: QueueConfig): RequestQueue {
  return new RequestQueue(config);
}
