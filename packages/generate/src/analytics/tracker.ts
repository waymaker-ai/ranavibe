/**
 * Generation Analytics Tracker
 *
 * Tracks code generation metrics for insights and optimization.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface GenerationEvent {
  id: string;
  timestamp: number;
  type: 'intent' | 'plan' | 'generate' | 'validate' | 'fix';
  description: string;
  framework: string;
  entities: string[];
  actions: string[];
  filesGenerated: number;
  linesGenerated: number;
  duration: number;
  success: boolean;
  errors: string[];
  warnings: string[];
  validationScore: number;
  cacheHit: boolean;
  estimatedCost: number;
  actualCost?: number;
  metadata: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalGenerations: number;
  successRate: number;
  averageValidationScore: number;
  averageDuration: number;
  totalFilesGenerated: number;
  totalLinesGenerated: number;
  totalCost: number;
  estimatedSavings: number;
  cacheHitRate: number;
  frameworkBreakdown: Record<string, number>;
  entityBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
  timeSeriesData: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  date: string;
  generations: number;
  successRate: number;
  cost: number;
}

export interface TrackerConfig {
  enabled: boolean;
  storageDir: string;
  retentionDays: number;
  anonymize: boolean;
}

// ============================================================================
// Analytics Tracker
// ============================================================================

const DEFAULT_CONFIG: TrackerConfig = {
  enabled: true,
  storageDir: '.rana/analytics',
  retentionDays: 90,
  anonymize: false,
};

export class GenerationAnalytics {
  private config: TrackerConfig;
  private events: GenerationEvent[];
  private sessionId: string;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Track a generation event
   */
  async track(event: Omit<GenerationEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    const fullEvent: GenerationEvent = {
      ...event,
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    };

    // Anonymize if configured
    if (this.config.anonymize) {
      fullEvent.description = this.anonymizeDescription(fullEvent.description);
    }

    this.events.push(fullEvent);

    // Persist to disk
    await this.persistEvent(fullEvent);
  }

  /**
   * Track intent parsing
   */
  async trackIntent(data: {
    description: string;
    framework: string;
    entities: string[];
    actions: string[];
    duration: number;
    success: boolean;
  }): Promise<void> {
    await this.track({
      type: 'intent',
      description: data.description,
      framework: data.framework,
      entities: data.entities,
      actions: data.actions,
      filesGenerated: 0,
      linesGenerated: 0,
      duration: data.duration,
      success: data.success,
      errors: [],
      warnings: [],
      validationScore: 0,
      cacheHit: false,
      estimatedCost: 0,
      metadata: {},
    });
  }

  /**
   * Track code generation
   */
  async trackGeneration(data: {
    description: string;
    framework: string;
    entities: string[];
    filesGenerated: number;
    linesGenerated: number;
    duration: number;
    success: boolean;
    validationScore: number;
    errors: string[];
    warnings: string[];
    cacheHit: boolean;
    estimatedCost: number;
  }): Promise<void> {
    await this.track({
      type: 'generate',
      description: data.description,
      framework: data.framework,
      entities: data.entities,
      actions: [],
      filesGenerated: data.filesGenerated,
      linesGenerated: data.linesGenerated,
      duration: data.duration,
      success: data.success,
      errors: data.errors,
      warnings: data.warnings,
      validationScore: data.validationScore,
      cacheHit: data.cacheHit,
      estimatedCost: data.estimatedCost,
      metadata: {},
    });
  }

  /**
   * Persist event to disk
   */
  private async persistEvent(event: GenerationEvent): Promise<void> {
    try {
      const date = new Date(event.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const dir = path.join(this.config.storageDir, dateStr.substring(0, 7)); // YYYY-MM
      const filePath = path.join(dir, `${dateStr}.jsonl`);

      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(filePath, JSON.stringify(event) + '\n');
    } catch {
      // Silently fail - analytics should never break main functionality
    }
  }

  /**
   * Anonymize description by removing potential PII
   */
  private anonymizeDescription(description: string): string {
    // Remove email patterns
    let anon = description.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    // Remove potential API keys
    anon = anon.replace(/[a-zA-Z0-9_-]{32,}/g, '[KEY]');
    // Remove URLs
    anon = anon.replace(/https?:\/\/[^\s]+/g, '[URL]');
    return anon;
  }

  /**
   * Load events from disk
   */
  private async loadEvents(days: number = 30): Promise<GenerationEvent[]> {
    const events: GenerationEvent[] = [];
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    try {
      const months = await fs.readdir(this.config.storageDir).catch(() => []);

      for (const month of months) {
        const monthPath = path.join(this.config.storageDir, month);
        const files = await fs.readdir(monthPath).catch(() => []);

        for (const file of files) {
          if (!file.endsWith('.jsonl')) continue;

          const filePath = path.join(monthPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n');

          for (const line of lines) {
            try {
              const event = JSON.parse(line) as GenerationEvent;
              if (event.timestamp >= cutoff) {
                events.push(event);
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch {
      // Return empty if storage doesn't exist
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get analytics summary
   */
  async getSummary(days: number = 30): Promise<AnalyticsSummary> {
    const events = await this.loadEvents(days);

    if (events.length === 0) {
      return this.emptySmummary();
    }

    const generateEvents = events.filter(e => e.type === 'generate');
    const successfulEvents = generateEvents.filter(e => e.success);

    // Calculate metrics
    const totalGenerations = generateEvents.length;
    const successRate = totalGenerations > 0 ? successfulEvents.length / totalGenerations : 0;
    const averageValidationScore = this.average(generateEvents.map(e => e.validationScore));
    const averageDuration = this.average(generateEvents.map(e => e.duration));
    const totalFilesGenerated = this.sum(generateEvents.map(e => e.filesGenerated));
    const totalLinesGenerated = this.sum(generateEvents.map(e => e.linesGenerated));
    const totalCost = this.sum(generateEvents.map(e => e.actualCost || e.estimatedCost));
    const cacheHits = generateEvents.filter(e => e.cacheHit).length;
    const cacheHitRate = totalGenerations > 0 ? cacheHits / totalGenerations : 0;
    const estimatedSavings = totalCost * cacheHitRate * 0.9; // 90% of cost saved on cache hits

    // Framework breakdown
    const frameworkBreakdown: Record<string, number> = {};
    for (const event of generateEvents) {
      frameworkBreakdown[event.framework] = (frameworkBreakdown[event.framework] || 0) + 1;
    }

    // Entity breakdown
    const entityBreakdown: Record<string, number> = {};
    for (const event of generateEvents) {
      for (const entity of event.entities) {
        entityBreakdown[entity] = (entityBreakdown[entity] || 0) + 1;
      }
    }

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    for (const event of generateEvents) {
      for (const error of event.errors) {
        const errorType = this.categorizeError(error);
        errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
      }
    }

    // Time series data
    const timeSeriesData = this.generateTimeSeries(generateEvents, days);

    return {
      totalGenerations,
      successRate,
      averageValidationScore,
      averageDuration,
      totalFilesGenerated,
      totalLinesGenerated,
      totalCost,
      estimatedSavings,
      cacheHitRate,
      frameworkBreakdown,
      entityBreakdown,
      errorBreakdown,
      timeSeriesData,
    };
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return this.sum(numbers) / numbers.length;
  }

  /**
   * Calculate sum of numbers
   */
  private sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  /**
   * Categorize error message
   */
  private categorizeError(error: string): string {
    const lower = error.toLowerCase();

    if (lower.includes('security') || lower.includes('injection') || lower.includes('xss')) {
      return 'security';
    }
    if (lower.includes('type') || lower.includes('typescript')) {
      return 'type-error';
    }
    if (lower.includes('accessibility') || lower.includes('a11y') || lower.includes('aria')) {
      return 'accessibility';
    }
    if (lower.includes('validation')) {
      return 'validation';
    }
    if (lower.includes('syntax') || lower.includes('parse')) {
      return 'syntax';
    }

    return 'other';
  }

  /**
   * Generate time series data
   */
  private generateTimeSeries(events: GenerationEvent[], days: number): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];
    const now = Date.now();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;
      const date = new Date(dayEnd).toISOString().split('T')[0];

      const dayEvents = events.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      const successfulDayEvents = dayEvents.filter(e => e.success);

      points.push({
        date,
        generations: dayEvents.length,
        successRate: dayEvents.length > 0 ? successfulDayEvents.length / dayEvents.length : 0,
        cost: this.sum(dayEvents.map(e => e.actualCost || e.estimatedCost)),
      });
    }

    return points;
  }

  /**
   * Return empty summary
   */
  private emptySmummary(): AnalyticsSummary {
    return {
      totalGenerations: 0,
      successRate: 0,
      averageValidationScore: 0,
      averageDuration: 0,
      totalFilesGenerated: 0,
      totalLinesGenerated: 0,
      totalCost: 0,
      estimatedSavings: 0,
      cacheHitRate: 0,
      frameworkBreakdown: {},
      entityBreakdown: {},
      errorBreakdown: {},
      timeSeriesData: [],
    };
  }

  /**
   * Export analytics data as JSON
   */
  async exportJSON(days: number = 30): Promise<string> {
    const summary = await this.getSummary(days);
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export analytics as markdown report
   */
  async exportMarkdown(days: number = 30): Promise<string> {
    const summary = await this.getSummary(days);

    let md = `# RANA Code Generation Analytics Report\n\n`;
    md += `**Report Period**: Last ${days} days\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;

    md += `## Overview\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Generations | ${summary.totalGenerations} |\n`;
    md += `| Success Rate | ${(summary.successRate * 100).toFixed(1)}% |\n`;
    md += `| Avg Validation Score | ${summary.averageValidationScore.toFixed(1)}/100 |\n`;
    md += `| Avg Duration | ${(summary.averageDuration / 1000).toFixed(2)}s |\n`;
    md += `| Cache Hit Rate | ${(summary.cacheHitRate * 100).toFixed(1)}% |\n`;
    md += `| Total Cost | $${summary.totalCost.toFixed(2)} |\n`;
    md += `| Estimated Savings | $${summary.estimatedSavings.toFixed(2)} |\n\n`;

    md += `## Output Summary\n\n`;
    md += `- **Files Generated**: ${summary.totalFilesGenerated}\n`;
    md += `- **Lines Generated**: ${summary.totalLinesGenerated.toLocaleString()}\n\n`;

    if (Object.keys(summary.frameworkBreakdown).length > 0) {
      md += `## Framework Usage\n\n`;
      md += `| Framework | Count |\n`;
      md += `|-----------|-------|\n`;
      for (const [framework, count] of Object.entries(summary.frameworkBreakdown)) {
        md += `| ${framework} | ${count} |\n`;
      }
      md += '\n';
    }

    if (Object.keys(summary.entityBreakdown).length > 0) {
      md += `## Top Entities\n\n`;
      const sortedEntities = Object.entries(summary.entityBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      md += `| Entity | Count |\n`;
      md += `|--------|-------|\n`;
      for (const [entity, count] of sortedEntities) {
        md += `| ${entity} | ${count} |\n`;
      }
      md += '\n';
    }

    if (Object.keys(summary.errorBreakdown).length > 0) {
      md += `## Error Categories\n\n`;
      md += `| Category | Count |\n`;
      md += `|----------|-------|\n`;
      for (const [category, count] of Object.entries(summary.errorBreakdown)) {
        md += `| ${category} | ${count} |\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Clean up old analytics data
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    let deletedCount = 0;

    try {
      const months = await fs.readdir(this.config.storageDir).catch(() => []);

      for (const month of months) {
        const monthPath = path.join(this.config.storageDir, month);
        const files = await fs.readdir(monthPath).catch(() => []);

        for (const file of files) {
          if (!file.endsWith('.jsonl')) continue;

          const dateStr = file.replace('.jsonl', '');
          const fileDate = new Date(dateStr);

          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(monthPath, file));
            deletedCount++;
          }
        }

        // Remove empty directories
        const remainingFiles = await fs.readdir(monthPath).catch(() => []);
        if (remainingFiles.length === 0) {
          await fs.rmdir(monthPath);
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return deletedCount;
  }
}

// Export singleton instance
export const generationAnalytics = new GenerationAnalytics();
