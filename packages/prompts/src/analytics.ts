/**
 * Prompt Analytics - Track and analyze prompt performance
 */

import type {
  PromptAnalyticsData,
  PromptUsageReport,
  PromptExecutionResult,
} from './types';

interface AnalyticsConfig {
  enabled: boolean;
  sampleRate?: number;
}

interface ExecutionRecord {
  promptId: string;
  version: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  success: boolean;
  errorType?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  variables: string[];
}

/**
 * Prompt Analytics
 * Tracks execution metrics, costs, and performance
 */
export class PromptAnalytics {
  private config: AnalyticsConfig;
  private records: ExecutionRecord[] = [];
  private uniqueUsers: Set<string> = new Set();

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Record a prompt execution
   */
  async record(result: PromptExecutionResult): Promise<void> {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > (this.config.sampleRate ?? 1.0)) return;

    const record: ExecutionRecord = {
      promptId: result.promptId,
      version: result.version,
      latencyMs: result.metrics.latencyMs,
      inputTokens: result.metrics.inputTokens,
      outputTokens: result.metrics.outputTokens,
      cost: result.metrics.cost,
      success: true,
      timestamp: result.timestamp,
      variables: Object.keys(result.variables),
    };

    this.records.push(record);

    // Track unique users if available
    if (result.abTest) {
      // User tracking would go here
    }
  }

  /**
   * Record an error
   */
  async recordError(
    promptId: string,
    version: string,
    errorType: string,
    latencyMs: number
  ): Promise<void> {
    if (!this.config.enabled) return;

    const record: ExecutionRecord = {
      promptId,
      version,
      latencyMs,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      success: false,
      errorType,
      timestamp: new Date(),
      variables: [],
    };

    this.records.push(record);
  }

  /**
   * Get analytics for a specific prompt
   */
  async getPromptAnalytics(
    promptId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<PromptAnalyticsData> {
    const now = new Date();
    const periodMs = this.getPeriodMs(period);
    const cutoff = new Date(now.getTime() - periodMs);

    const records = this.records.filter(
      r => r.promptId === promptId && r.timestamp >= cutoff
    );

    const successRecords = records.filter(r => r.success);
    const errorRecords = records.filter(r => !r.success);

    // Calculate metrics
    const executions = records.length;
    const uniqueUsers = new Set(records.filter(r => r.userId).map(r => r.userId!)).size;

    const latencies = successRecords.map(r => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || 0;

    const costs = successRecords.map(r => r.cost);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const avgCost = costs.length > 0 ? totalCost / costs.length : 0;

    const successRate = executions > 0 ? (successRecords.length / executions) * 100 : 100;
    const errorRate = executions > 0 ? (errorRecords.length / executions) * 100 : 0;

    // Error breakdown
    const errorsByType: Record<string, number> = {};
    for (const error of errorRecords) {
      const type = error.errorType || 'unknown';
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    }

    // Top variables
    const variableCounts: Record<string, number> = {};
    for (const record of records) {
      for (const variable of record.variables) {
        variableCounts[variable] = (variableCounts[variable] || 0) + 1;
      }
    }
    const topVariables = Object.entries(variableCounts)
      .map(([variable, count]) => ({ variable, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution
    const hourlyDistribution = new Array(24).fill(0);
    for (const record of records) {
      const hour = record.timestamp.getHours();
      hourlyDistribution[hour]++;
    }

    return {
      promptId,
      period,
      executions,
      uniqueUsers,
      avgLatency,
      p95Latency,
      avgCost,
      totalCost,
      successRate,
      errorRate,
      errorsByType,
      topVariables,
      hourlyDistribution,
    };
  }

  /**
   * Get overall usage report
   */
  async getUsageReport(): Promise<PromptUsageReport> {
    const promptStats = new Map<string, {
      id: string;
      name: string;
      executions: number;
      cost: number;
    }>();

    let totalCost = 0;
    let totalLatency = 0;
    const costByProvider: Record<string, number> = {};
    const executionsByDate: Record<string, number> = {};

    for (const record of this.records) {
      // Prompt stats
      if (!promptStats.has(record.promptId)) {
        promptStats.set(record.promptId, {
          id: record.promptId,
          name: record.promptId, // Would be fetched from registry in production
          executions: 0,
          cost: 0,
        });
      }
      const stats = promptStats.get(record.promptId)!;
      stats.executions++;
      stats.cost += record.cost;

      // Totals
      totalCost += record.cost;
      totalLatency += record.latencyMs;

      // By date
      const dateKey = record.timestamp.toISOString().split('T')[0];
      executionsByDate[dateKey] = (executionsByDate[dateKey] || 0) + 1;
    }

    const topPrompts = Array.from(promptStats.values())
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);

    const executionsByDay = Object.entries(executionsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalPrompts: promptStats.size,
      totalExecutions: this.records.length,
      totalCost,
      avgLatency: this.records.length > 0 ? totalLatency / this.records.length : 0,
      topPrompts,
      costByProvider,
      executionsByDay,
    };
  }

  /**
   * Export analytics data
   */
  async export(): Promise<{
    records: ExecutionRecord[];
    summary: PromptUsageReport;
  }> {
    return {
      records: this.records,
      summary: await this.getUsageReport(),
    };
  }

  /**
   * Clear analytics data
   */
  async clear(): Promise<void> {
    this.records = [];
    this.uniqueUsers.clear();
  }

  /**
   * Get period in milliseconds
   */
  private getPeriodMs(period: 'hour' | 'day' | 'week' | 'month'): number {
    switch (period) {
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
    }
  }
}
