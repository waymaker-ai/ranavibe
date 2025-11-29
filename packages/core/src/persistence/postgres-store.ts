/**
 * PostgreSQL Cost Store
 * Production-ready storage using PostgreSQL (requires pg)
 */

import { CostStore, CostRecord, CostQuery, CostSummary } from './cost-store.js';
import type { LLMProvider } from '../types.js';

// Type definitions for pg (optional dependency)
interface Pool {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
}

interface PoolConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface PostgresConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  tableName?: string;
}

export class PostgresCostStore implements CostStore {
  private pool: Pool | null = null;
  private config: PostgresConfig;
  private tableName: string;

  constructor(config: PostgresConfig) {
    this.config = config;
    this.tableName = config.tableName || 'rana_cost_records';
  }

  async initialize(): Promise<void> {
    if (this.pool) return;

    try {
      // Dynamic import to make pg optional
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgModule = await (Function('return import("pg")')() as Promise<any>);
      const Pool = pgModule.Pool || (pgModule.default as { Pool: new (config: PoolConfig) => Pool }).Pool;

      const poolConfig: PoolConfig = {
        connectionString: this.config.connectionString,
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
      };

      if (this.config.ssl) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }

      const pool = new Pool(poolConfig);
      this.pool = pool;

      // Create table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          prompt_tokens INTEGER NOT NULL,
          completion_tokens INTEGER NOT NULL,
          total_tokens INTEGER NOT NULL,
          input_cost DECIMAL(10, 8) NOT NULL,
          output_cost DECIMAL(10, 8) NOT NULL,
          total_cost DECIMAL(10, 8) NOT NULL,
          cached BOOLEAN NOT NULL DEFAULT FALSE,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          request_id TEXT,
          session_id TEXT,
          metadata JSONB
        );

        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_timestamp ON ${this.tableName}(timestamp);
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_provider ON ${this.tableName}(provider);
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_session ON ${this.tableName}(session_id);
      `);
    } catch (error) {
      throw new Error(
        'PostgreSQL support requires pg. Install it with: npm install pg'
      );
    }
  }

  async save(record: Omit<CostRecord, 'id'>): Promise<CostRecord> {
    if (!this.pool) await this.initialize();

    const id = this.generateId();

    await this.pool!.query(`
      INSERT INTO ${this.tableName} (
        id, timestamp, provider, model, prompt_tokens, completion_tokens,
        total_tokens, input_cost, output_cost, total_cost, cached,
        latency_ms, request_id, session_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
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
      record.cached,
      record.latency_ms,
      record.request_id || null,
      record.session_id || null,
      record.metadata ? JSON.stringify(record.metadata) : null,
    ]);

    return { ...record, id };
  }

  async query(query: CostQuery): Promise<CostRecord[]> {
    if (!this.pool) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(query.startDate.toISOString());
    }
    if (query.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(query.endDate.toISOString());
    }
    if (query.provider) {
      conditions.push(`provider = $${paramIndex++}`);
      params.push(query.provider);
    }
    if (query.model) {
      conditions.push(`model = $${paramIndex++}`);
      params.push(query.model);
    }
    if (query.sessionId) {
      conditions.push(`session_id = $${paramIndex++}`);
      params.push(query.sessionId);
    }
    if (query.cached !== undefined) {
      conditions.push(`cached = $${paramIndex++}`);
      params.push(query.cached);
    }

    let sql = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`;

    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(query.limit);
    }
    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(query.offset);
    }

    const result = await this.pool!.query(sql, params);
    const rows = result.rows as Array<{
      id: string;
      timestamp: Date;
      provider: string;
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      input_cost: string;
      output_cost: string;
      total_cost: string;
      cached: boolean;
      latency_ms: number;
      request_id: string | null;
      session_id: string | null;
      metadata: Record<string, unknown> | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      provider: row.provider as LLMProvider,
      model: row.model,
      prompt_tokens: row.prompt_tokens,
      completion_tokens: row.completion_tokens,
      total_tokens: row.total_tokens,
      input_cost: parseFloat(row.input_cost),
      output_cost: parseFloat(row.output_cost),
      total_cost: parseFloat(row.total_cost),
      cached: row.cached,
      latency_ms: row.latency_ms,
      request_id: row.request_id || undefined,
      session_id: row.session_id || undefined,
      metadata: row.metadata || undefined,
    }));
  }

  async getSummary(query?: CostQuery): Promise<CostSummary> {
    if (!this.pool) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (query?.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(query.startDate.toISOString());
    }
    if (query?.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(query.endDate.toISOString());
    }
    if (query?.provider) {
      conditions.push(`provider = $${paramIndex++}`);
      params.push(query.provider);
    }
    if (query?.sessionId) {
      conditions.push(`session_id = $${paramIndex++}`);
      params.push(query.sessionId);
    }

    const whereClause = conditions.join(' AND ');

    // Get totals
    const totalsResult = await this.pool!.query(`
      SELECT
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COUNT(*) as total_requests,
        COALESCE(SUM(CASE WHEN cached THEN 1 ELSE 0 END), 0) as cache_hits,
        COALESCE(AVG(latency_ms), 0) as avg_latency
      FROM ${this.tableName} WHERE ${whereClause}
    `, params);
    const totals = totalsResult.rows[0] as {
      total_cost: string;
      total_tokens: string;
      total_requests: string;
      cache_hits: string;
      avg_latency: string;
    };

    // Get by provider
    const byProviderResult = await this.pool!.query(`
      SELECT
        provider,
        SUM(total_cost) as cost,
        SUM(total_tokens) as tokens,
        COUNT(*) as requests
      FROM ${this.tableName} WHERE ${whereClause}
      GROUP BY provider
    `, params);
    const providerRows = byProviderResult.rows as Array<{
      provider: string;
      cost: string;
      tokens: string;
      requests: string;
    }>;

    // Get by model
    const byModelResult = await this.pool!.query(`
      SELECT
        model,
        SUM(total_cost) as cost,
        SUM(total_tokens) as tokens,
        COUNT(*) as requests
      FROM ${this.tableName} WHERE ${whereClause}
      GROUP BY model
    `, params);
    const modelRows = byModelResult.rows as Array<{
      model: string;
      cost: string;
      tokens: string;
      requests: string;
    }>;

    const byProvider: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const row of providerRows) {
      byProvider[row.provider] = {
        cost: parseFloat(row.cost),
        tokens: parseInt(row.tokens),
        requests: parseInt(row.requests),
      };
    }

    const byModel: Record<string, { cost: number; tokens: number; requests: number }> = {};
    for (const row of modelRows) {
      byModel[row.model] = {
        cost: parseFloat(row.cost),
        tokens: parseInt(row.tokens),
        requests: parseInt(row.requests),
      };
    }

    return {
      totalCost: parseFloat(totals.total_cost),
      totalTokens: parseInt(totals.total_tokens),
      totalRequests: parseInt(totals.total_requests),
      cacheHits: parseInt(totals.cache_hits),
      avgLatency: parseFloat(totals.avg_latency),
      byProvider,
      byModel,
    };
  }

  async getTotalCost(startDate?: Date, endDate?: Date): Promise<number> {
    if (!this.pool) await this.initialize();

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startDate.toISOString());
    }
    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endDate.toISOString());
    }

    const result = await this.pool!.query(`
      SELECT COALESCE(SUM(total_cost), 0) as total FROM ${this.tableName} WHERE ${conditions.join(' AND ')}
    `, params);
    return parseFloat((result.rows[0] as { total: string }).total);
  }

  async cleanup(olderThan: Date): Promise<number> {
    if (!this.pool) await this.initialize();

    const result = await this.pool!.query(
      `DELETE FROM ${this.tableName} WHERE timestamp < $1`,
      [olderThan.toISOString()]
    );
    // pg returns rowCount on DELETE
    return (result as unknown as { rowCount: number }).rowCount || 0;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
