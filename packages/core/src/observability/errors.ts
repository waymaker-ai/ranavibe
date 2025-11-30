/**
 * Error Tracking Integration for RANA Observability
 *
 * Captures, classifies, and reports errors from RANA SDK operations.
 * Supports integration with external error tracking services like Sentry
 * and custom webhook endpoints.
 */

import type { LLMProvider, BudgetPeriod } from '../types';
import {
  RanaError,
  RanaAuthError,
  RanaRateLimitError,
  RanaNetworkError,
  RanaBudgetExceededError,
  RanaBudgetWarningError,
} from '../types';
import { EventEmitter } from 'events';

// ============================================================================
// Configuration Types
// ============================================================================

export interface ErrorTrackerConfig {
  /**
   * Enable error tracking
   * @default true
   */
  enabled?: boolean;

  /**
   * Sentry DSN for error reporting
   */
  sentryDsn?: string;

  /**
   * Custom webhook endpoint for error notifications
   */
  webhookUrl?: string;

  /**
   * Log errors to console
   * @default true
   */
  consoleOutput?: boolean;

  /**
   * Maximum number of errors to store in memory
   * @default 100
   */
  maxStoredErrors?: number;

  /**
   * Minimum error level to track
   * @default 'error'
   */
  minLevel?: ErrorLevel;

  /**
   * Custom error handlers
   */
  onError?: (error: TrackedError) => void;

  /**
   * Filter function to ignore specific errors
   */
  shouldIgnore?: (error: Error) => boolean;

  /**
   * Environment name (e.g., 'production', 'development')
   */
  environment?: string;

  /**
   * Release version
   */
  release?: string;

  /**
   * Additional tags to attach to all errors
   */
  tags?: Record<string, string>;
}

// ============================================================================
// Error Types & Classification
// ============================================================================

export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type ErrorCategory =
  | 'auth'
  | 'rate_limit'
  | 'network'
  | 'provider'
  | 'budget'
  | 'validation'
  | 'unknown';

export interface ErrorContext {
  /**
   * Provider associated with the error
   */
  provider?: LLMProvider;

  /**
   * Model being used
   */
  model?: string;

  /**
   * User ID or identifier
   */
  userId?: string;

  /**
   * Request ID for tracing
   */
  requestId?: string;

  /**
   * Additional context data
   */
  extra?: Record<string, any>;

  /**
   * Breadcrumbs leading to the error
   */
  breadcrumbs?: Breadcrumb[];

  /**
   * Tags for categorization
   */
  tags?: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: ErrorLevel;
  data?: Record<string, any>;
}

export interface TrackedError {
  /**
   * Unique error ID
   */
  id: string;

  /**
   * Error classification
   */
  category: ErrorCategory;

  /**
   * Severity level
   */
  level: ErrorLevel;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code (if available)
   */
  code?: string;

  /**
   * Stack trace
   */
  stack?: string;

  /**
   * Provider associated with error
   */
  provider?: LLMProvider;

  /**
   * HTTP status code (if applicable)
   */
  statusCode?: number;

  /**
   * When the error occurred
   */
  timestamp: Date;

  /**
   * Number of times this error has occurred
   */
  count: number;

  /**
   * First occurrence timestamp
   */
  firstSeen: Date;

  /**
   * Last occurrence timestamp
   */
  lastSeen: Date;

  /**
   * Contextual information
   */
  context: ErrorContext;

  /**
   * Raw error object
   */
  originalError: Error;

  /**
   * Fingerprint for grouping similar errors
   */
  fingerprint: string;
}

export interface ErrorStats {
  /**
   * Total number of errors tracked
   */
  totalErrors: number;

  /**
   * Errors by category
   */
  byCategory: Record<ErrorCategory, number>;

  /**
   * Errors by provider
   */
  byProvider: Record<LLMProvider, number>;

  /**
   * Errors by level
   */
  byLevel: Record<ErrorLevel, number>;

  /**
   * Most common errors
   */
  topErrors: Array<{
    fingerprint: string;
    message: string;
    count: number;
    category: ErrorCategory;
  }>;

  /**
   * Error rate (errors per minute)
   */
  errorRate: number;

  /**
   * Time period for stats
   */
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Error Tracker Class
// ============================================================================

export class ErrorTracker extends EventEmitter {
  private config: Required<ErrorTrackerConfig>;
  private errors: Map<string, TrackedError> = new Map();
  private errorList: TrackedError[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;

  constructor(config: ErrorTrackerConfig = {}) {
    super();

    this.config = {
      enabled: config.enabled ?? true,
      sentryDsn: config.sentryDsn ?? '',
      webhookUrl: config.webhookUrl ?? '',
      consoleOutput: config.consoleOutput ?? true,
      maxStoredErrors: config.maxStoredErrors ?? 100,
      minLevel: config.minLevel ?? 'error',
      onError: config.onError ?? (() => {}),
      shouldIgnore: config.shouldIgnore ?? (() => false),
      environment: config.environment ?? 'production',
      release: config.release ?? '',
      tags: config.tags ?? {},
    };
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context: ErrorContext = {}): string | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check if error should be ignored
    if (this.config.shouldIgnore(error)) {
      return null;
    }

    const category = this.classifyError(error);
    const level = this.getErrorLevel(error, category);
    const fingerprint = this.generateFingerprint(error, category);

    // Check minimum level
    if (!this.shouldTrackLevel(level)) {
      return null;
    }

    // Check if we've seen this error before
    const existingError = this.errors.get(fingerprint);

    if (existingError) {
      // Update existing error
      existingError.count++;
      existingError.lastSeen = new Date();
      existingError.context = { ...existingError.context, ...context };

      this.emit('error-updated', existingError);

      return existingError.id;
    }

    // Create new tracked error
    const trackedError: TrackedError = {
      id: this.generateErrorId(),
      category,
      level,
      message: error.message,
      code: (error as RanaError).code,
      stack: error.stack,
      provider: (error as RanaError).provider || context.provider,
      statusCode: (error as RanaError).statusCode,
      timestamp: new Date(),
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      context: {
        ...context,
        breadcrumbs: [...this.breadcrumbs],
        tags: { ...this.config.tags, ...context.tags },
      },
      originalError: error,
      fingerprint,
    };

    // Store error
    this.errors.set(fingerprint, trackedError);
    this.errorList.unshift(trackedError);

    // Maintain max storage limit
    if (this.errorList.length > this.config.maxStoredErrors) {
      const removed = this.errorList.pop();
      if (removed) {
        this.errors.delete(removed.fingerprint);
      }
    }

    // Trigger handlers
    this.handleError(trackedError);

    return trackedError.id;
  }

  /**
   * Add a breadcrumb for context
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date(),
    });

    // Maintain max breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorList.filter(
      e => e.lastSeen >= oneHourAgo
    );

    const byCategory: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    recentErrors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + error.count;
      if (error.provider) {
        byProvider[error.provider] = (byProvider[error.provider] || 0) + error.count;
      }
      byLevel[error.level] = (byLevel[error.level] || 0) + error.count;
    });

    // Get top errors by count
    const topErrors = [...this.errorList]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(e => ({
        fingerprint: e.fingerprint,
        message: e.message,
        count: e.count,
        category: e.category,
      }));

    const totalErrors = recentErrors.reduce((sum, e) => sum + e.count, 0);
    const errorRate = totalErrors / 60; // errors per minute

    return {
      totalErrors,
      byCategory: byCategory as Record<ErrorCategory, number>,
      byProvider: byProvider as Record<LLMProvider, number>,
      byLevel: byLevel as Record<ErrorLevel, number>,
      topErrors,
      errorRate,
      period: {
        start: oneHourAgo,
        end: now,
      },
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): TrackedError[] {
    return this.errorList.slice(0, limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): TrackedError[] {
    return this.errorList.filter(e => e.category === category);
  }

  /**
   * Get errors by provider
   */
  getErrorsByProvider(provider: LLMProvider): TrackedError[] {
    return this.errorList.filter(e => e.provider === provider);
  }

  /**
   * Get error by ID
   */
  getErrorById(id: string): TrackedError | undefined {
    return this.errorList.find(e => e.id === id);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear();
    this.errorList = [];
    this.emit('errors-cleared');
  }

  /**
   * Update configuration
   */
  configure(config: Partial<ErrorTrackerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      onError: config.onError ?? this.config.onError,
      shouldIgnore: config.shouldIgnore ?? this.config.shouldIgnore,
      tags: { ...this.config.tags, ...config.tags },
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Classify error into a category
   */
  private classifyError(error: Error): ErrorCategory {
    if (error instanceof RanaAuthError) {
      return 'auth';
    }
    if (error instanceof RanaRateLimitError) {
      return 'rate_limit';
    }
    if (error instanceof RanaNetworkError) {
      return 'network';
    }
    if (error instanceof RanaBudgetExceededError || error instanceof RanaBudgetWarningError) {
      return 'budget';
    }
    if (error instanceof RanaError) {
      return 'provider';
    }
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'validation';
    }
    return 'unknown';
  }

  /**
   * Determine error level
   */
  private getErrorLevel(error: Error, category: ErrorCategory): ErrorLevel {
    // Budget warnings are just warnings
    if (error instanceof RanaBudgetWarningError) {
      return 'warning';
    }

    // Budget exceeded is critical
    if (error instanceof RanaBudgetExceededError) {
      return 'critical';
    }

    // Auth errors are critical
    if (category === 'auth') {
      return 'critical';
    }

    // Rate limit errors are warnings
    if (category === 'rate_limit') {
      return 'warning';
    }

    // Network errors are errors
    if (category === 'network') {
      return 'error';
    }

    // Provider errors are errors
    if (category === 'provider') {
      return 'error';
    }

    // Default to error
    return 'error';
  }

  /**
   * Generate fingerprint for grouping similar errors
   */
  private generateFingerprint(error: Error, category: ErrorCategory): string {
    const parts: string[] = [
      category,
      error.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers for grouping
    ];

    if (error instanceof RanaError && error.provider) {
      parts.push(error.provider);
    }

    if (error instanceof RanaError && error.code) {
      parts.push(error.code);
    }

    // Use first line of stack trace if available
    if (error.stack) {
      const stackLine = error.stack.split('\n')[1]?.trim();
      if (stackLine) {
        parts.push(stackLine);
      }
    }

    return parts.join(':');
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error level should be tracked
   */
  private shouldTrackLevel(level: ErrorLevel): boolean {
    const levels: ErrorLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];
    const minIndex = levels.indexOf(this.config.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  /**
   * Handle error reporting to configured services
   */
  private handleError(error: TrackedError): void {
    // Console output
    if (this.config.consoleOutput) {
      this.logToConsole(error);
    }

    // Custom handler
    try {
      this.config.onError(error);
    } catch (err) {
      console.error('[ErrorTracker] Error in custom handler:', err);
    }

    // Sentry
    if (this.config.sentryDsn) {
      this.sendToSentry(error);
    }

    // Webhook
    if (this.config.webhookUrl) {
      this.sendToWebhook(error);
    }

    // Emit event
    this.emit('error-captured', error);
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(error: TrackedError): void {
    const prefix = `[RANA Error ${error.level.toUpperCase()}]`;
    const details = [
      error.message,
      error.provider ? `Provider: ${error.provider}` : null,
      error.code ? `Code: ${error.code}` : null,
      error.statusCode ? `Status: ${error.statusCode}` : null,
      `Category: ${error.category}`,
      `Count: ${error.count}`,
    ].filter(Boolean).join(' | ');

    switch (error.level) {
      case 'critical':
      case 'error':
        console.error(`${prefix} ${details}`);
        if (error.stack) {
          console.error(error.stack);
        }
        break;
      case 'warning':
        console.warn(`${prefix} ${details}`);
        break;
      case 'info':
      case 'debug':
        console.log(`${prefix} ${details}`);
        break;
    }
  }

  /**
   * Send error to Sentry
   */
  private async sendToSentry(error: TrackedError): Promise<void> {
    try {
      // In a real implementation, this would use @sentry/node
      // For now, we'll just prepare the payload
      const payload = {
        message: error.message,
        level: error.level,
        tags: {
          category: error.category,
          provider: error.provider || 'unknown',
          ...error.context.tags,
        },
        extra: {
          code: error.code,
          statusCode: error.statusCode,
          count: error.count,
          fingerprint: error.fingerprint,
          ...error.context.extra,
        },
        breadcrumbs: error.context.breadcrumbs,
        timestamp: error.timestamp,
        environment: this.config.environment,
        release: this.config.release,
      };

      // Log that we would send to Sentry
      if (this.config.consoleOutput) {
        console.log('[ErrorTracker] Would send to Sentry:', payload);
      }

      // TODO: Implement actual Sentry integration
      // import * as Sentry from '@sentry/node';
      // Sentry.captureException(error.originalError, { ...payload });
    } catch (err) {
      console.error('[ErrorTracker] Failed to send to Sentry:', err);
    }
  }

  /**
   * Send error to webhook
   */
  private async sendToWebhook(error: TrackedError): Promise<void> {
    try {
      const payload = {
        id: error.id,
        category: error.category,
        level: error.level,
        message: error.message,
        code: error.code,
        provider: error.provider,
        statusCode: error.statusCode,
        count: error.count,
        timestamp: error.timestamp.toISOString(),
        firstSeen: error.firstSeen.toISOString(),
        lastSeen: error.lastSeen.toISOString(),
        context: {
          ...error.context,
          breadcrumbs: error.context.breadcrumbs?.slice(-5), // Only send last 5
        },
        environment: this.config.environment,
        release: this.config.release,
      };

      // Use fetch if available (Node 18+)
      if (typeof fetch !== 'undefined') {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Fallback for older Node versions
        console.warn('[ErrorTracker] fetch not available, cannot send to webhook');
      }
    } catch (err) {
      console.error('[ErrorTracker] Failed to send to webhook:', err);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearErrors();
    this.clearBreadcrumbs();
    this.removeAllListeners();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create an error tracker instance
 *
 * @example
 * ```typescript
 * const tracker = createErrorTracker({
 *   sentryDsn: 'https://xxx@sentry.io/xxx',
 *   environment: 'production',
 *   onError: (error) => {
 *     console.log('Error captured:', error.message);
 *   }
 * });
 *
 * // Capture an error
 * try {
 *   await rana.chat({ ... });
 * } catch (error) {
 *   tracker.captureError(error, {
 *     provider: 'anthropic',
 *     userId: 'user123',
 *     extra: { endpoint: '/api/chat' }
 *   });
 * }
 * ```
 */
export function createErrorTracker(config?: ErrorTrackerConfig): ErrorTracker {
  return new ErrorTracker(config);
}

/**
 * Capture an error with a global tracker
 * Useful for simple setups without managing tracker instances
 */
let globalTracker: ErrorTracker | null = null;

export function captureError(error: Error, context?: ErrorContext): string | null {
  if (!globalTracker) {
    globalTracker = new ErrorTracker();
  }
  return globalTracker.captureError(error, context);
}

export function getErrorStats(): ErrorStats | null {
  return globalTracker?.getErrorStats() || null;
}

export function getRecentErrors(limit?: number): TrackedError[] {
  return globalTracker?.getRecentErrors(limit) || [];
}

export function configureErrorTracker(config: ErrorTrackerConfig): void {
  if (!globalTracker) {
    globalTracker = new ErrorTracker(config);
  } else {
    globalTracker.configure(config);
  }
}

export function getErrorTracker(): ErrorTracker | null {
  return globalTracker;
}
