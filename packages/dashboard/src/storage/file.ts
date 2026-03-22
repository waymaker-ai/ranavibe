/**
 * FileStorage - JSON file per day with automatic rotation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { StorageInterface, AggregateResult, DashboardEvent, EventType } from '../types.js';

export interface FileStorageOptions {
  dataDir?: string;
  maxDaysRetention?: number;
}

export class FileStorage implements StorageInterface {
  private readonly dataDir: string;
  private readonly maxDaysRetention: number;

  constructor(options: FileStorageOptions = {}) {
    this.dataDir = options.dataDir ?? path.join(process.cwd(), 'aicofounder-data');
    this.maxDaysRetention = options.maxDaysRetention ?? 90;
    this.ensureDir(this.dataDir);
  }

  async store(events: DashboardEvent[]): Promise<void> {
    // Group events by day
    const byDay = new Map<string, DashboardEvent[]>();
    for (const event of events) {
      const dateKey = this.getDateKey(event.timestamp);
      const existing = byDay.get(dateKey) ?? [];
      existing.push(event);
      byDay.set(dateKey, existing);
    }

    // Write each day file
    for (const [dateKey, dayEvents] of byDay) {
      const filePath = this.getFilePath(dateKey);
      const existing = await this.readFile(filePath);
      existing.push(...dayEvents);
      await this.atomicWrite(filePath, existing);
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
    const dateFiles = this.getRelevantFiles(options.from, options.to);
    let allEvents: DashboardEvent[] = [];

    for (const filePath of dateFiles) {
      const events = await this.readFile(filePath);
      allEvents.push(...events);
    }

    // Apply filters
    if (options.from !== undefined) {
      allEvents = allEvents.filter((e) => e.timestamp >= options.from!);
    }
    if (options.to !== undefined) {
      allEvents = allEvents.filter((e) => e.timestamp <= options.to!);
    }
    if (options.type) {
      allEvents = allEvents.filter((e) => e.type === options.type);
    }
    if (options.provider) {
      allEvents = allEvents.filter((e) => e.provider === options.provider);
    }
    if (options.model) {
      allEvents = allEvents.filter((e) => e.model === options.model);
    }

    // Sort descending
    allEvents.sort((a, b) => b.timestamp - a.timestamp);

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 1000;
    return allEvents.slice(offset, offset + limit);
  }

  async aggregate(options: {
    field: string;
    from?: number;
    to?: number;
    type?: EventType;
  }): Promise<AggregateResult> {
    const events = await this.query({
      from: options.from,
      to: options.to,
      type: options.type,
      limit: Number.MAX_SAFE_INTEGER,
    });

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
    const cutoffDate = new Date(Date.now() - olderThanMs);
    const cutoffKey = this.getDateKey(cutoffDate.getTime());
    let removed = 0;

    try {
      const files = fs.readdirSync(this.dataDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const dateKey = file.replace('.json', '');
        if (dateKey < cutoffKey) {
          fs.unlinkSync(path.join(this.dataDir, file));
          removed++;
        }
      }
    } catch {
      // Directory may not exist
    }

    return removed;
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private getDateKey(timestamp: number): string {
    const d = new Date(timestamp);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getFilePath(dateKey: string): string {
    return path.join(this.dataDir, `${dateKey}.json`);
  }

  private getRelevantFiles(from?: number, to?: number): string[] {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter((f) => f.endsWith('.json'))
        .sort();

      if (!from && !to) {
        return files.map((f) => path.join(this.dataDir, f));
      }

      const fromKey = from ? this.getDateKey(from) : '0000-00-00';
      const toKey = to ? this.getDateKey(to) : '9999-99-99';

      return files
        .filter((f) => {
          const dateKey = f.replace('.json', '');
          return dateKey >= fromKey && dateKey <= toKey;
        })
        .map((f) => path.join(this.dataDir, f));
    } catch {
      return [];
    }
  }

  private async readFile(filePath: string): Promise<DashboardEvent[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as DashboardEvent[];
    } catch {
      return [];
    }
  }

  /**
   * Atomic write: write to temp file, then rename
   */
  private async atomicWrite(filePath: string, data: DashboardEvent[]): Promise<void> {
    const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
