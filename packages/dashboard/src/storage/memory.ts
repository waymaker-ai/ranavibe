/**
 * MemoryStorage - In-memory circular buffer storage
 */

import type { StorageInterface, AggregateResult, DashboardEvent, EventType } from '../types.js';

export interface MemoryStorageOptions {
  maxEvents?: number;
}

export class MemoryStorage implements StorageInterface {
  private events: DashboardEvent[] = [];
  private readonly maxEvents: number;

  constructor(options: MemoryStorageOptions = {}) {
    this.maxEvents = options.maxEvents ?? 10_000;
  }

  async store(events: DashboardEvent[]): Promise<void> {
    this.events.push(...events);

    // Circular buffer: trim from the front when over capacity
    if (this.events.length > this.maxEvents) {
      const excess = this.events.length - this.maxEvents;
      this.events.splice(0, excess);
    }
  }

  async query(options: {
    from?: number;
    to?: number;
    type?: EventType;
    provider?: string;
    model?: string;
    limit?: number;
    offset?: number;
  }): Promise<DashboardEvent[]> {
    let results = this.events;

    if (options.from !== undefined) {
      results = results.filter((e) => e.timestamp >= options.from!);
    }
    if (options.to !== undefined) {
      results = results.filter((e) => e.timestamp <= options.to!);
    }
    if (options.type) {
      results = results.filter((e) => e.type === options.type);
    }
    if (options.provider) {
      results = results.filter((e) => e.provider === options.provider);
    }
    if (options.model) {
      results = results.filter((e) => e.model === options.model);
    }

    // Sort by timestamp descending (most recent first)
    results = results.slice().sort((a, b) => b.timestamp - a.timestamp);

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 1000;

    return results.slice(offset, offset + limit);
  }

  async aggregate(options: {
    field: string;
    from?: number;
    to?: number;
    type?: EventType;
  }): Promise<AggregateResult> {
    let events = this.events;

    if (options.from !== undefined) {
      events = events.filter((e) => e.timestamp >= options.from!);
    }
    if (options.to !== undefined) {
      events = events.filter((e) => e.timestamp <= options.to!);
    }
    if (options.type) {
      events = events.filter((e) => e.type === options.type);
    }

    const values: number[] = [];
    for (const event of events) {
      const val = getNestedValue(event as unknown as Record<string, unknown>, options.field);
      if (typeof val === 'number') {
        values.push(val);
      }
    }

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  async cleanup(olderThanMs: number): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    const before = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= cutoff);
    return before - this.events.length;
  }

  /**
   * Get total event count (useful for testing/inspection)
   */
  size(): number {
    return this.events.length;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
