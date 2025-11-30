/**
 * Token Usage Analytics for RANA Observability
 *
 * Provides comprehensive token usage tracking and analytics capabilities:
 * - Real-time token usage tracking (input/output/total)
 * - Usage aggregation by provider, model, and time
 * - Cost calculations and breakdowns
 * - Flexible persistence (in-memory, file-based)
 * - Integration with existing CostTracker
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import type { LLMProvider, RanaChatResponse } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface TokenUsageRecord {
  id: string;
  timestamp: Date;
  provider: LLMProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  cached: boolean;
  latencyMs: number;
  metadata?: Record<string, any>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface UsageByProvider {
  provider: LLMProvider;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
  avgTokensPerRequest: number;
  avgCostPerRequest: number;
}

export interface UsageByModel {
  provider: LLMProvider;
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
  avgTokensPerRequest: number;
  avgCostPerRequest: number;
}

export interface HourlyUsage {
  hour: Date;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
  providers: Record<LLMProvider, number>; // tokens by provider
}

export interface TopModel {
  provider: LLMProvider;
  model: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  percentage: number; // percentage of total usage
}

export interface CostBreakdownItem {
  provider: LLMProvider;
  model: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  costPerToken: number;
  percentage: number; // percentage of total cost
}

export interface AnalyticsSummary {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  totalRequests: number;
  avgTokensPerRequest: number;
  avgCostPerRequest: number;
  cacheHitRate: number;
  timeRange: TimeRange;
  topProvider: LLMProvider | null;
  topModel: string | null;
}

export interface PersistenceOptions {
  type: 'memory' | 'file';
  filePath?: string; // for file-based persistence
  autoSave?: boolean; // auto-save on each track()
  saveInterval?: number; // auto-save interval in ms
}

export interface TokenAnalyticsConfig {
  persistence?: PersistenceOptions;
  maxRecords?: number; // max records to keep in memory (0 = unlimited)
  enableAutoCleanup?: boolean; // auto-cleanup old records
  cleanupAfterDays?: number; // days to keep records (default: 30)
}

// ============================================================================
// TokenAnalytics Class
// ============================================================================

export class TokenAnalytics {
  private records: TokenUsageRecord[] = [];
  private config: Required<TokenAnalyticsConfig>;
  private saveIntervalId?: NodeJS.Timeout;

  constructor(config: TokenAnalyticsConfig = {}) {
    this.config = {
      persistence: config.persistence || { type: 'memory' },
      maxRecords: config.maxRecords || 0,
      enableAutoCleanup: config.enableAutoCleanup ?? false,
      cleanupAfterDays: config.cleanupAfterDays || 30,
    };

    // Start auto-save interval if configured
    if (this.config.persistence.type === 'file' && this.config.persistence.saveInterval) {
      this.startAutoSave();
    }
  }

  // ============================================================================
  // Core Tracking
  // ============================================================================

  /**
   * Track a response from RANA
   */
  async track(response: RanaChatResponse): Promise<void> {
    const record: TokenUsageRecord = {
      id: response.id,
      timestamp: response.created_at,
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      inputCost: response.cost.prompt_cost,
      outputCost: response.cost.completion_cost,
      totalCost: response.cost.total_cost,
      cached: response.cached,
      latencyMs: response.latency_ms,
      metadata: {},
    };

    this.records.push(record);

    // Enforce max records limit
    if (this.config.maxRecords > 0 && this.records.length > this.config.maxRecords) {
      this.records = this.records.slice(-this.config.maxRecords);
    }

    // Auto-cleanup if enabled
    if (this.config.enableAutoCleanup) {
      this.cleanupOldRecords();
    }

    // Auto-save if enabled
    if (this.config.persistence.type === 'file' && this.config.persistence.autoSave) {
      await this.save();
    }
  }

  /**
   * Track multiple responses
   */
  async trackBatch(responses: RanaChatResponse[]): Promise<void> {
    for (const response of responses) {
      await this.track(response);
    }
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get usage by provider for a time range
   */
  getUsageByProvider(timeRange?: TimeRange): UsageByProvider[] {
    const filtered = this.filterByTimeRange(timeRange);
    const byProvider = new Map<LLMProvider, TokenUsageRecord[]>();

    // Group by provider
    for (const record of filtered) {
      if (!byProvider.has(record.provider)) {
        byProvider.set(record.provider, []);
      }
      byProvider.get(record.provider)!.push(record);
    }

    // Calculate stats for each provider
    return Array.from(byProvider.entries()).map(([provider, records]) => {
      const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      const promptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
      const completionTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
      const requestCount = records.length;

      return {
        provider,
        totalTokens,
        promptTokens,
        completionTokens,
        totalCost,
        requestCount,
        avgTokensPerRequest: requestCount > 0 ? totalTokens / requestCount : 0,
        avgCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
      };
    }).sort((a, b) => b.totalTokens - a.totalTokens);
  }

  /**
   * Get usage by model for a time range
   */
  getUsageByModel(timeRange?: TimeRange): UsageByModel[] {
    const filtered = this.filterByTimeRange(timeRange);
    const byModel = new Map<string, TokenUsageRecord[]>();

    // Group by provider:model
    for (const record of filtered) {
      const key = `${record.provider}:${record.model}`;
      if (!byModel.has(key)) {
        byModel.set(key, []);
      }
      byModel.get(key)!.push(record);
    }

    // Calculate stats for each model
    return Array.from(byModel.entries()).map(([key, records]) => {
      const [provider, model] = key.split(':') as [LLMProvider, string];
      const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      const promptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
      const completionTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
      const requestCount = records.length;

      return {
        provider,
        model,
        totalTokens,
        promptTokens,
        completionTokens,
        totalCost,
        requestCount,
        avgTokensPerRequest: requestCount > 0 ? totalTokens / requestCount : 0,
        avgCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
      };
    }).sort((a, b) => b.totalTokens - a.totalTokens);
  }

  /**
   * Get daily usage for the last N days
   */
  getDailyUsage(days: number = 7): DailyUsage[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const filtered = this.records.filter(r => r.timestamp >= startDate);
    const byDate = new Map<string, TokenUsageRecord[]>();

    // Group by date
    for (const record of filtered) {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(record);
    }

    // Calculate stats for each day
    const dailyUsage: DailyUsage[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const records = byDate.get(dateKey) || [];

      const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      const promptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
      const completionTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
      const requestCount = records.length;

      // Calculate tokens by provider
      const providers: Record<string, number> = {};
      for (const record of records) {
        providers[record.provider] = (providers[record.provider] || 0) + record.totalTokens;
      }

      dailyUsage.push({
        date: dateKey,
        totalTokens,
        promptTokens,
        completionTokens,
        totalCost,
        requestCount,
        providers: providers as Record<LLMProvider, number>,
      });
    }

    return dailyUsage;
  }

  /**
   * Get hourly usage aggregation
   */
  getHourlyUsage(hours: number = 24): HourlyUsage[] {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(startDate.getHours() - hours);

    const filtered = this.records.filter(r => r.timestamp >= startDate);
    const byHour = new Map<string, TokenUsageRecord[]>();

    // Group by hour
    for (const record of filtered) {
      const hourKey = new Date(record.timestamp);
      hourKey.setMinutes(0, 0, 0);
      const key = hourKey.toISOString();
      if (!byHour.has(key)) {
        byHour.set(key, []);
      }
      byHour.get(key)!.push(record);
    }

    // Calculate stats for each hour
    return Array.from(byHour.entries()).map(([hourStr, records]) => {
      const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      const promptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
      const completionTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
      const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
      const requestCount = records.length;

      return {
        hour: new Date(hourStr),
        totalTokens,
        promptTokens,
        completionTokens,
        totalCost,
        requestCount,
      };
    }).sort((a, b) => a.hour.getTime() - b.hour.getTime());
  }

  /**
   * Get top N models by usage
   */
  getTopModels(limit: number = 5, timeRange?: TimeRange): TopModel[] {
    const filtered = this.filterByTimeRange(timeRange);
    const totalTokens = filtered.reduce((sum, r) => sum + r.totalTokens, 0);

    const byModel = this.getUsageByModel(timeRange);

    return byModel.slice(0, limit).map(model => ({
      provider: model.provider,
      model: model.model,
      totalTokens: model.totalTokens,
      totalCost: model.totalCost,
      requestCount: model.requestCount,
      percentage: totalTokens > 0 ? (model.totalTokens / totalTokens) * 100 : 0,
    }));
  }

  /**
   * Get cost breakdown by provider and model
   */
  getCostBreakdown(timeRange?: TimeRange): CostBreakdownItem[] {
    const filtered = this.filterByTimeRange(timeRange);
    const totalCost = filtered.reduce((sum, r) => sum + r.totalCost, 0);

    const byModel = new Map<string, TokenUsageRecord[]>();

    // Group by provider:model
    for (const record of filtered) {
      const key = `${record.provider}:${record.model}`;
      if (!byModel.has(key)) {
        byModel.set(key, []);
      }
      byModel.get(key)!.push(record);
    }

    // Calculate breakdown for each model
    return Array.from(byModel.entries()).map(([key, records]) => {
      const [provider, model] = key.split(':') as [LLMProvider, string];
      const inputCost = records.reduce((sum, r) => sum + r.inputCost, 0);
      const outputCost = records.reduce((sum, r) => sum + r.outputCost, 0);
      const modelTotalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
      const inputTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
      const outputTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
      const totalTokens = inputTokens + outputTokens;

      return {
        provider,
        model,
        inputCost,
        outputCost,
        totalCost: modelTotalCost,
        inputTokens,
        outputTokens,
        costPerToken: totalTokens > 0 ? modelTotalCost / totalTokens : 0,
        percentage: totalCost > 0 ? (modelTotalCost / totalCost) * 100 : 0,
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Get comprehensive analytics summary
   */
  getSummary(timeRange?: TimeRange): AnalyticsSummary {
    const filtered = this.filterByTimeRange(timeRange);

    if (filtered.length === 0) {
      const defaultRange = timeRange || {
        start: new Date(),
        end: new Date(),
      };
      return {
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCost: 0,
        totalRequests: 0,
        avgTokensPerRequest: 0,
        avgCostPerRequest: 0,
        cacheHitRate: 0,
        timeRange: defaultRange,
        topProvider: null,
        topModel: null,
      };
    }

    const totalTokens = filtered.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalPromptTokens = filtered.reduce((sum, r) => sum + r.promptTokens, 0);
    const totalCompletionTokens = filtered.reduce((sum, r) => sum + r.completionTokens, 0);
    const totalCost = filtered.reduce((sum, r) => sum + r.totalCost, 0);
    const totalRequests = filtered.length;
    const cacheHits = filtered.filter(r => r.cached).length;

    const byProvider = this.getUsageByProvider(timeRange);
    const byModel = this.getUsageByModel(timeRange);

    const actualRange = timeRange || {
      start: filtered[0].timestamp,
      end: filtered[filtered.length - 1].timestamp,
    };

    return {
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      totalCost,
      totalRequests,
      avgTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      timeRange: actualRange,
      topProvider: byProvider.length > 0 ? byProvider[0].provider : null,
      topModel: byModel.length > 0 ? byModel[0].model : null,
    };
  }

  /**
   * Get average tokens per request
   */
  getAverageTokensPerRequest(timeRange?: TimeRange): number {
    const filtered = this.filterByTimeRange(timeRange);
    if (filtered.length === 0) return 0;

    const totalTokens = filtered.reduce((sum, r) => sum + r.totalTokens, 0);
    return totalTokens / filtered.length;
  }

  /**
   * Get total tokens used
   */
  getTotalTokens(timeRange?: TimeRange): {
    total: number;
    input: number;
    output: number;
  } {
    const filtered = this.filterByTimeRange(timeRange);

    return {
      total: filtered.reduce((sum, r) => sum + r.totalTokens, 0),
      input: filtered.reduce((sum, r) => sum + r.promptTokens, 0),
      output: filtered.reduce((sum, r) => sum + r.completionTokens, 0),
    };
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  /**
   * Save analytics data to file
   */
  async save(): Promise<void> {
    if (this.config.persistence.type !== 'file' || !this.config.persistence.filePath) {
      return;
    }

    const filePath = this.config.persistence.filePath;
    const dir = dirname(filePath);

    // Create directory if it doesn't exist
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      records: this.records.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString(),
      })),
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load analytics data from file
   */
  async load(): Promise<void> {
    if (this.config.persistence.type !== 'file' || !this.config.persistence.filePath) {
      return;
    }

    const filePath = this.config.persistence.filePath;

    if (!existsSync(filePath)) {
      return; // File doesn't exist yet
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.records = data.records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    } catch (error) {
      console.warn(`Failed to load analytics data from ${filePath}:`, error);
    }
  }

  /**
   * Export data as JSON
   */
  export(): string {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      records: this.records,
      summary: this.getSummary(),
    }, null, 2);
  }

  /**
   * Import data from JSON
   */
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.records && Array.isArray(data.records)) {
        this.records = data.records.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
    } catch (error) {
      throw new Error(`Failed to import analytics data: ${error}`);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.records = [];
  }

  /**
   * Get record count
   */
  getRecordCount(): number {
    return this.records.length;
  }

  /**
   * Get all records (filtered by time range if provided)
   */
  getRecords(timeRange?: TimeRange): TokenUsageRecord[] {
    return this.filterByTimeRange(timeRange);
  }

  /**
   * Cleanup old records
   */
  cleanupOldRecords(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupAfterDays);

    const initialCount = this.records.length;
    this.records = this.records.filter(r => r.timestamp >= cutoffDate);

    return initialCount - this.records.length;
  }

  /**
   * Stop auto-save interval
   */
  destroy(): void {
    if (this.saveIntervalId) {
      clearInterval(this.saveIntervalId);
      this.saveIntervalId = undefined;
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private filterByTimeRange(timeRange?: TimeRange): TokenUsageRecord[] {
    if (!timeRange) {
      return this.records;
    }

    return this.records.filter(
      r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
    );
  }

  private startAutoSave(): void {
    const interval = this.config.persistence.saveInterval;
    if (!interval || interval <= 0) return;

    this.saveIntervalId = setInterval(async () => {
      await this.save();
    }, interval);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a TokenAnalytics instance with in-memory storage
 */
export function createMemoryAnalytics(config?: Omit<TokenAnalyticsConfig, 'persistence'>): TokenAnalytics {
  return new TokenAnalytics({
    ...config,
    persistence: { type: 'memory' },
  });
}

/**
 * Create a TokenAnalytics instance with file-based storage
 */
export function createFileAnalytics(
  filePath: string,
  config?: Omit<TokenAnalyticsConfig, 'persistence'>
): TokenAnalytics {
  return new TokenAnalytics({
    ...config,
    persistence: {
      type: 'file',
      filePath,
      autoSave: true,
    },
  });
}

/**
 * Create a TokenAnalytics instance with auto-save enabled
 */
export function createAutoSaveAnalytics(
  filePath: string,
  saveInterval: number = 60000, // 1 minute default
  config?: Omit<TokenAnalyticsConfig, 'persistence'>
): TokenAnalytics {
  return new TokenAnalytics({
    ...config,
    persistence: {
      type: 'file',
      filePath,
      autoSave: false, // Don't save on every track
      saveInterval, // Save on interval instead
    },
  });
}
