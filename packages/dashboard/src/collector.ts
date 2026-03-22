/**
 * EventCollector - Receives events, validates, buffers, and forwards
 */

import * as crypto from 'node:crypto';
import type {
  DashboardEvent,
  EventType,
  StorageInterface,
  Alert,
  AlertConfig,
} from './types.js';

const VALID_EVENT_TYPES: EventType[] = [
  'request',
  'response',
  'error',
  'security',
  'compliance',
  'cost',
  'latency',
];

export interface CollectorOptions {
  storage: StorageInterface;
  bufferSize?: number;
  flushIntervalMs?: number;
  onAlert?: (alert: Alert) => void;
  alertConfigs?: AlertConfig[];
}

export class EventCollector {
  private buffer: DashboardEvent[] = [];
  private readonly maxBufferSize: number;
  private readonly flushIntervalMs: number;
  private readonly storage: StorageInterface;
  private readonly onAlert?: (alert: Alert) => void;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private alertCheckers: Array<(event: DashboardEvent) => Alert | null> = [];

  constructor(options: CollectorOptions) {
    this.storage = options.storage;
    this.maxBufferSize = options.bufferSize ?? 100;
    this.flushIntervalMs = options.flushIntervalMs ?? 5000;
    this.onAlert = options.onAlert;

    if (this.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch(() => {});
      }, this.flushIntervalMs);

      // Allow the process to exit even if the timer is running
      if (this.flushTimer && typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
        this.flushTimer.unref();
      }
    }
  }

  /**
   * Register an alert checker function. Called for each collected event.
   */
  registerAlertChecker(checker: (event: DashboardEvent) => Alert | null): void {
    this.alertCheckers.push(checker);
  }

  /**
   * Collect a single event. Validates schema, buffers it, checks alerts.
   */
  collect(event: Partial<DashboardEvent>): DashboardEvent {
    const validated = this.validate(event);
    this.buffer.push(validated);

    // Check alerts
    for (const checker of this.alertCheckers) {
      const alert = checker(validated);
      if (alert && this.onAlert) {
        this.onAlert(alert);
      }
    }

    // Auto-flush when buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush().catch(() => {});
    }

    return validated;
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0;

    const events = this.buffer.splice(0);
    await this.storage.store(events);
    return events.length;
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Stop the collector (clear flush timer, flush remaining)
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Validate and normalize an event
   */
  private validate(event: Partial<DashboardEvent>): DashboardEvent {
    if (!event.type || !VALID_EVENT_TYPES.includes(event.type)) {
      throw new Error(
        `Invalid event type: ${event.type}. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
      );
    }

    if (!event.data || typeof event.data !== 'object') {
      throw new Error('Event data must be a non-null object');
    }

    return {
      id: event.id || crypto.randomUUID(),
      type: event.type,
      timestamp: event.timestamp || Date.now(),
      provider: event.provider,
      model: event.model,
      data: event.data,
      metadata: event.metadata,
    };
  }
}
