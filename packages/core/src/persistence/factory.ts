/**
 * Cost Store Factory
 * Create cost stores with different backends
 */

import { CostStore } from './cost-store.js';
import { FileCostStore } from './file-store.js';
import { SQLiteCostStore } from './sqlite-store.js';
import { PostgresCostStore, PostgresConfig } from './postgres-store.js';

export interface CostStoreConfig {
  type: 'file' | 'sqlite' | 'postgres' | 'memory';
  path?: string; // For file and sqlite
  postgres?: PostgresConfig;
}

class MemoryCostStore implements CostStore {
  private records: Array<{
    id: string;
    timestamp: Date;
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    input_cost: number;
    output_cost: number;
    total_cost: number;
    cached: boolean;
    latency_ms: number;
    request_id?: string;
    session_id?: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async initialize(): Promise<void> {}

  async save(record: Omit<Parameters<CostStore['save']>[0], 'id'>): ReturnType<CostStore['save']> {
    const newRecord = {
      ...record,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.records.push(newRecord as any);
    return newRecord as any;
  }

  async query(query: Parameters<CostStore['query']>[0]): ReturnType<CostStore['query']> {
    let results = [...this.records];

    if (query.startDate) results = results.filter(r => r.timestamp >= query.startDate!);
    if (query.endDate) results = results.filter(r => r.timestamp <= query.endDate!);
    if (query.provider) results = results.filter(r => r.provider === query.provider);
    if (query.model) results = results.filter(r => r.model === query.model);
    if (query.sessionId) results = results.filter(r => r.session_id === query.sessionId);
    if (query.cached !== undefined) results = results.filter(r => r.cached === query.cached);

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (query.offset) results = results.slice(query.offset);
    if (query.limit) results = results.slice(0, query.limit);

    return results as any;
  }

  async getSummary(query?: Parameters<CostStore['getSummary']>[0]): ReturnType<CostStore['getSummary']> {
    const records = await this.query(query || {});

    const byProvider: Record<string, { cost: number; tokens: number; requests: number }> = {};
    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};

    let totalCost = 0, totalTokens = 0, cacheHits = 0, totalLatency = 0;

    for (const r of records) {
      totalCost += r.total_cost;
      totalTokens += r.total_tokens;
      totalLatency += r.latency_ms;
      if (r.cached) cacheHits++;

      if (!byProvider[r.provider]) byProvider[r.provider] = { cost: 0, tokens: 0, requests: 0 };
      byProvider[r.provider].cost += r.total_cost;
      byProvider[r.provider].tokens += r.total_tokens;
      byProvider[r.provider].requests++;

      if (!byModel[r.model]) byModel[r.model] = { cost: 0, tokens: 0, requests: 0 };
      byModel[r.model].cost += r.total_cost;
      byModel[r.model].tokens += r.total_tokens;
      byModel[r.model].requests++;
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
    const before = this.records.length;
    this.records = this.records.filter(r => r.timestamp >= olderThan);
    return before - this.records.length;
  }

  async close(): Promise<void> {}
}

/**
 * Create a cost store based on configuration
 */
export function createCostStore(config: CostStoreConfig): CostStore {
  switch (config.type) {
    case 'sqlite':
      return new SQLiteCostStore(config.path);

    case 'postgres':
      if (!config.postgres) {
        throw new Error('PostgreSQL config required for postgres store type');
      }
      return new PostgresCostStore(config.postgres);

    case 'file':
      return new FileCostStore(config.path);

    case 'memory':
    default:
      return new MemoryCostStore();
  }
}

// Singleton for global cost store
let globalCostStore: CostStore | null = null;

/**
 * Get or create the global cost store
 */
export function getGlobalCostStore(): CostStore {
  if (!globalCostStore) {
    // Default to file store
    globalCostStore = new FileCostStore();
  }
  return globalCostStore;
}

/**
 * Set the global cost store
 */
export function setGlobalCostStore(store: CostStore): void {
  globalCostStore = store;
}
