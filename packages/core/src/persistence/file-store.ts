/**
 * File-based Cost Store
 * Simple JSON file storage for cost tracking (no external dependencies)
 */

import { CostStore, CostRecord, CostQuery, CostSummary } from './cost-store.js';
import type { LLMProvider } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class FileCostStore implements CostStore {
  private filePath: string;
  private records: CostRecord[] = [];
  private initialized = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.rana',
      'cost-history.json'
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing data
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data) as Array<CostRecord & { timestamp: string }>;
        this.records = parsed.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      } catch {
        this.records = [];
      }
    }

    this.initialized = true;
  }

  async save(record: Omit<CostRecord, 'id'>): Promise<CostRecord> {
    await this.initialize();

    const newRecord: CostRecord = {
      ...record,
      id: this.generateId(),
    };

    this.records.push(newRecord);
    await this.persist();

    return newRecord;
  }

  async query(query: CostQuery): Promise<CostRecord[]> {
    await this.initialize();

    let results = [...this.records];

    // Apply filters
    if (query.startDate) {
      results = results.filter(r => r.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      results = results.filter(r => r.timestamp <= query.endDate!);
    }
    if (query.provider) {
      results = results.filter(r => r.provider === query.provider);
    }
    if (query.model) {
      results = results.filter(r => r.model === query.model);
    }
    if (query.sessionId) {
      results = results.filter(r => r.session_id === query.sessionId);
    }
    if (query.cached !== undefined) {
      results = results.filter(r => r.cached === query.cached);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async getSummary(query?: CostQuery): Promise<CostSummary> {
    const records = await this.query(query || {});

    const byProvider: Record<string, { cost: number; tokens: number; requests: number }> = {};
    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};

    let totalCost = 0;
    let totalTokens = 0;
    let cacheHits = 0;
    let totalLatency = 0;

    for (const record of records) {
      totalCost += record.total_cost;
      totalTokens += record.total_tokens;
      totalLatency += record.latency_ms;
      if (record.cached) cacheHits++;

      // By provider
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      byProvider[record.provider].cost += record.total_cost;
      byProvider[record.provider].tokens += record.total_tokens;
      byProvider[record.provider].requests++;

      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { cost: 0, tokens: 0, requests: 0 };
      }
      byModel[record.model].cost += record.total_cost;
      byModel[record.model].tokens += record.total_tokens;
      byModel[record.model].requests++;
    }

    return {
      totalCost,
      totalTokens,
      totalRequests: records.length,
      cacheHits,
      avgLatency: records.length > 0 ? totalLatency / records.length : 0,
      byProvider,
      byModel,
    };
  }

  async getTotalCost(startDate?: Date, endDate?: Date): Promise<number> {
    const records = await this.query({ startDate, endDate });
    return records.reduce((sum, r) => sum + r.total_cost, 0);
  }

  async cleanup(olderThan: Date): Promise<number> {
    await this.initialize();

    const originalLength = this.records.length;
    this.records = this.records.filter(r => r.timestamp >= olderThan);
    const deleted = originalLength - this.records.length;

    if (deleted > 0) {
      await this.persist();
    }

    return deleted;
  }

  async close(): Promise<void> {
    await this.persist();
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persist(): Promise<void> {
    const data = JSON.stringify(this.records, null, 2);
    fs.writeFileSync(this.filePath, data, 'utf-8');
  }
}
