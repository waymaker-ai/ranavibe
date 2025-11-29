/**
 * SQLite Cost Store
 * Persistent storage using SQLite (requires better-sqlite3)
 */

import { CostStore, CostRecord, CostQuery, CostSummary } from './cost-store.js';
import type { LLMProvider } from '../types.js';

// Type definitions for better-sqlite3 (optional dependency)
interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  close(): void;
}

interface Statement {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

interface RunResult {
  lastInsertRowid: number | bigint;
  changes: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseConstructor = new (path: string) => Database;

export class SQLiteCostStore implements CostStore {
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || (process.env.HOME || process.env.USERPROFILE || '.') + '/.rana/costs.db';
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      // Dynamic import to make better-sqlite3 optional
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BetterSqlite3Module = await (Function('return import("better-sqlite3")')() as Promise<any>);
      const Database: DatabaseConstructor = BetterSqlite3Module.default || BetterSqlite3Module;

      this.db = new Database(this.dbPath) as Database;

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cost_records (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          prompt_tokens INTEGER NOT NULL,
          completion_tokens INTEGER NOT NULL,
          total_tokens INTEGER NOT NULL,
          input_cost REAL NOT NULL,
          output_cost REAL NOT NULL,
          total_cost REAL NOT NULL,
          cached INTEGER NOT NULL DEFAULT 0,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          request_id TEXT,
          session_id TEXT,
          metadata TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON cost_records(timestamp);
        CREATE INDEX IF NOT EXISTS idx_provider ON cost_records(provider);
        CREATE INDEX IF NOT EXISTS idx_session ON cost_records(session_id);
      `);
    } catch (error) {
      throw new Error(
        'SQLite support requires better-sqlite3. Install it with: npm install better-sqlite3'
      );
    }
  }

  async save(record: Omit<CostRecord, 'id'>): Promise<CostRecord> {
    if (!this.db) await this.initialize();

    const id = this.generateId();
    const stmt = this.db!.prepare(`
      INSERT INTO cost_records (
        id, timestamp, provider, model, prompt_tokens, completion_tokens,
        total_tokens, input_cost, output_cost, total_cost, cached,
        latency_ms, request_id, session_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      record.timestamp.toISOString(),
      record.provider,
      record.model,
      record.prompt_tokens,
      record.completion_tokens,
      record.total_tokens,
      record.input_cost,
      record.output_cost,
      record.total_cost,
      record.cached ? 1 : 0,
      record.latency_ms,
      record.request_id || null,
      record.session_id || null,
      record.metadata ? JSON.stringify(record.metadata) : null
    );

    return { ...record, id };
  }

  async query(query: CostQuery): Promise<CostRecord[]> {
    if (!this.db) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (query.startDate) {
      conditions.push('timestamp >= ?');
      params.push(query.startDate.toISOString());
    }
    if (query.endDate) {
      conditions.push('timestamp <= ?');
      params.push(query.endDate.toISOString());
    }
    if (query.provider) {
      conditions.push('provider = ?');
      params.push(query.provider);
    }
    if (query.model) {
      conditions.push('model = ?');
      params.push(query.model);
    }
    if (query.sessionId) {
      conditions.push('session_id = ?');
      params.push(query.sessionId);
    }
    if (query.cached !== undefined) {
      conditions.push('cached = ?');
      params.push(query.cached ? 1 : 0);
    }

    let sql = `SELECT * FROM cost_records WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`;

    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }
    if (query.offset) {
      sql += ` OFFSET ${query.offset}`;
    }

    const stmt = this.db!.prepare(sql);
    const rows = stmt.all(...params) as Array<{
      id: string;
      timestamp: string;
      provider: string;
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      input_cost: number;
      output_cost: number;
      total_cost: number;
      cached: number;
      latency_ms: number;
      request_id: string | null;
      session_id: string | null;
      metadata: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      provider: row.provider as LLMProvider,
      model: row.model,
      prompt_tokens: row.prompt_tokens,
      completion_tokens: row.completion_tokens,
      total_tokens: row.total_tokens,
      input_cost: row.input_cost,
      output_cost: row.output_cost,
      total_cost: row.total_cost,
      cached: row.cached === 1,
      latency_ms: row.latency_ms,
      request_id: row.request_id || undefined,
      session_id: row.session_id || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async getSummary(query?: CostQuery): Promise<CostSummary> {
    if (!this.db) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (query?.startDate) {
      conditions.push('timestamp >= ?');
      params.push(query.startDate.toISOString());
    }
    if (query?.endDate) {
      conditions.push('timestamp <= ?');
      params.push(query.endDate.toISOString());
    }
    if (query?.provider) {
      conditions.push('provider = ?');
      params.push(query.provider);
    }
    if (query?.sessionId) {
      conditions.push('session_id = ?');
      params.push(query.sessionId);
    }

    const whereClause = conditions.join(' AND ');

    // Get totals
    const totalsStmt = this.db!.prepare(`
      SELECT
        SUM(total_cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as total_requests,
        SUM(cached) as cache_hits,
        AVG(latency_ms) as avg_latency
      FROM cost_records WHERE ${whereClause}
    `);
    const totals = totalsStmt.get(...params) as {
      total_cost: number;
      total_tokens: number;
      total_requests: number;
      cache_hits: number;
      avg_latency: number;
    };

    // Get by provider
    const byProviderStmt = this.db!.prepare(`
      SELECT
        provider,
        SUM(total_cost) as cost,
        SUM(total_tokens) as tokens,
        COUNT(*) as requests
      FROM cost_records WHERE ${whereClause}
      GROUP BY provider
    `);
    const providerRows = byProviderStmt.all(...params) as Array<{
      provider: string;
      cost: number;
      tokens: number;
      requests: number;
    }>;

    // Get by model
    const byModelStmt = this.db!.prepare(`
      SELECT
        model,
        SUM(total_cost) as cost,
        SUM(total_tokens) as tokens,
        COUNT(*) as requests
      FROM cost_records WHERE ${whereClause}
      GROUP BY model
    `);
    const modelRows = byModelStmt.all(...params) as Array<{
      model: string;
      cost: number;
      tokens: number;
      requests: number;
    }>;

    const byProvider: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const row of providerRows) {
      byProvider[row.provider] = { cost: row.cost, tokens: row.tokens, requests: row.requests };
    }

    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const row of modelRows) {
      byModel[row.model] = { cost: row.cost, tokens: row.tokens, requests: row.requests };
    }

    return {
      totalCost: totals.total_cost || 0,
      totalTokens: totals.total_tokens || 0,
      totalRequests: totals.total_requests || 0,
      cacheHits: totals.cache_hits || 0,
      avgLatency: totals.avg_latency || 0,
      byProvider,
      byModel,
    };
  }

  async getTotalCost(startDate?: Date, endDate?: Date): Promise<number> {
    if (!this.db) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate.toISOString());
    }
    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate.toISOString());
    }

    const stmt = this.db!.prepare(`
      SELECT SUM(total_cost) as total FROM cost_records WHERE ${conditions.join(' AND ')}
    `);
    const result = stmt.get(...params) as { total: number | null };
    return result.total || 0;
  }

  async cleanup(olderThan: Date): Promise<number> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare('DELETE FROM cost_records WHERE timestamp < ?');
    const result = stmt.run(olderThan.toISOString());
    return result.changes;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
