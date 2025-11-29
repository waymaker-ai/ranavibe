/**
 * Cost Store Interface
 * Base interface for all cost persistence implementations
 */

import type { LLMProvider } from '../types.js';

export interface CostRecord {
  id: string;
  timestamp: Date;
  provider: LLMProvider;
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
}

export interface CostQuery {
  startDate?: Date;
  endDate?: Date;
  provider?: LLMProvider;
  model?: string;
  sessionId?: string;
  cached?: boolean;
  limit?: number;
  offset?: number;
}

export interface CostSummary {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  cacheHits: number;
  avgLatency: number;
  byProvider: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
  byModel: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
}

export interface CostStore {
  /**
   * Initialize the store (create tables, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Save a cost record
   */
  save(record: Omit<CostRecord, 'id'>): Promise<CostRecord>;

  /**
   * Get records matching query
   */
  query(query: CostQuery): Promise<CostRecord[]>;

  /**
   * Get a summary of costs
   */
  getSummary(query?: CostQuery): Promise<CostSummary>;

  /**
   * Get total cost in a period
   */
  getTotalCost(startDate?: Date, endDate?: Date): Promise<number>;

  /**
   * Delete old records
   */
  cleanup(olderThan: Date): Promise<number>;

  /**
   * Close the connection
   */
  close(): Promise<void>;
}
