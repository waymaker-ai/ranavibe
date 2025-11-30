/**
 * @rana/integrations/sentry
 * Sentry error reporting integration
 *
 * Features:
 * - Automatic error capture and reporting
 * - LLM-specific context and breadcrumbs
 * - Cost and performance monitoring
 * - User feedback collection
 * - Release tracking
 *
 * @example
 * ```typescript
 * import { createSentryIntegration } from '@rana/core';
 *
 * const sentry = createSentryIntegration({
 *   dsn: process.env.SENTRY_DSN,
 *   environment: 'production',
 *   release: '1.0.0',
 * });
 *
 * // Capture errors automatically
 * rana.use(sentry.middleware);
 *
 * // Manual capture
 * sentry.captureException(error, {
 *   tags: { model: 'gpt-4' },
 *   extra: { prompt: 'Hello' },
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface SentryConfig {
  /** Sentry DSN */
  dsn: string;
  /** Environment name */
  environment?: string;
  /** Release version */
  release?: string;
  /** Server name */
  serverName?: string;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Traces sample rate (0-1) */
  tracesSampleRate?: number;
  /** Profiles sample rate (0-1) */
  profilesSampleRate?: number;
  /** Default tags */
  defaultTags?: Record<string, string>;
  /** Capture LLM prompts/responses */
  captureLLMData?: boolean;
  /** PII redaction */
  redactPII?: boolean;
  /** Max breadcrumbs */
  maxBreadcrumbs?: number;
  /** Before send hook */
  beforeSend?: (event: SentryEvent) => SentryEvent | null;
}

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface SentryEvent {
  event_id?: string;
  timestamp?: string;
  level?: SentryLevel;
  platform?: string;
  logger?: string;
  transaction?: string;
  server_name?: string;
  release?: string;
  environment?: string;
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
          in_app?: boolean;
        }>;
      };
    }>;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: SentryUser;
  breadcrumbs?: Breadcrumb[];
  contexts?: Record<string, unknown>;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

export interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  segment?: string;
}

export interface Breadcrumb {
  type?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: SentryLevel;
  timestamp?: number;
}

export interface CaptureOptions {
  /** Error level */
  level?: SentryLevel;
  /** Tags */
  tags?: Record<string, string>;
  /** Extra context */
  extra?: Record<string, unknown>;
  /** User info */
  user?: SentryUser;
  /** Fingerprint for grouping */
  fingerprint?: string[];
  /** Transaction name */
  transaction?: string;
}

export interface Transaction {
  /** Transaction name */
  name: string;
  /** Transaction ID */
  traceId: string;
  /** Span ID */
  spanId: string;
  /** Start timestamp */
  startTimestamp: number;
  /** Set transaction status */
  setStatus: (status: 'ok' | 'error' | 'cancelled' | 'unknown') => void;
  /** Set transaction data */
  setData: (key: string, value: unknown) => void;
  /** Set transaction tag */
  setTag: (key: string, value: string) => void;
  /** Start a child span */
  startChild: (options: { op: string; description?: string }) => Span;
  /** Finish the transaction */
  finish: () => Promise<void>;
}

export interface Span {
  /** Span ID */
  spanId: string;
  /** Operation name */
  op: string;
  /** Description */
  description?: string;
  /** Start timestamp */
  startTimestamp: number;
  /** Set span data */
  setData: (key: string, value: unknown) => void;
  /** Set span status */
  setStatus: (status: 'ok' | 'error' | 'cancelled' | 'unknown') => void;
  /** Finish the span */
  finish: () => void;
}

export interface LLMContext {
  model: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latencyMs?: number;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

// ============================================================================
// Sentry Integration
// ============================================================================

export class SentryIntegration {
  private config: Required<SentryConfig>;
  private breadcrumbs: Breadcrumb[] = [];
  private user?: SentryUser;
  private globalTags: Record<string, string> = {};
  private activeTransactions: Map<string, Transaction> = new Map();

  constructor(config: SentryConfig) {
    this.config = {
      dsn: config.dsn,
      environment: config.environment || 'development',
      release: config.release || 'unknown',
      serverName: config.serverName || this.getServerName(),
      sampleRate: config.sampleRate ?? 1.0,
      tracesSampleRate: config.tracesSampleRate ?? 0.1,
      profilesSampleRate: config.profilesSampleRate ?? 0,
      defaultTags: config.defaultTags || {},
      captureLLMData: config.captureLLMData ?? false,
      redactPII: config.redactPII ?? true,
      maxBreadcrumbs: config.maxBreadcrumbs ?? 100,
      beforeSend: config.beforeSend || ((e) => e),
    };

    this.globalTags = { ...this.config.defaultTags };
  }

  // --------------------------------------------------------------------------
  // Error Capture
  // --------------------------------------------------------------------------

  /**
   * Capture an exception
   */
  async captureException(error: Error, options: CaptureOptions = {}): Promise<string> {
    const eventId = this.generateEventId();

    const event: SentryEvent = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      level: options.level || 'error',
      platform: 'node',
      server_name: this.config.serverName,
      release: this.config.release,
      environment: this.config.environment,
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            stacktrace: this.parseStackTrace(error),
          },
        ],
      },
      tags: { ...this.globalTags, ...options.tags },
      extra: options.extra,
      user: options.user || this.user,
      breadcrumbs: [...this.breadcrumbs],
      transaction: options.transaction,
    };

    // Apply fingerprint
    if (options.fingerprint) {
      (event as Record<string, unknown>).fingerprint = options.fingerprint;
    }

    // Apply beforeSend hook
    const processedEvent = this.config.beforeSend(event);
    if (!processedEvent) {
      return eventId; // Dropped by beforeSend
    }

    // Check sample rate
    if (Math.random() > this.config.sampleRate) {
      return eventId;
    }

    await this.sendEvent(processedEvent);

    return eventId;
  }

  /**
   * Capture a message
   */
  async captureMessage(
    message: string,
    level: SentryLevel = 'info',
    options: CaptureOptions = {}
  ): Promise<string> {
    const eventId = this.generateEventId();

    const event: SentryEvent = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      level,
      platform: 'node',
      server_name: this.config.serverName,
      release: this.config.release,
      environment: this.config.environment,
      message,
      tags: { ...this.globalTags, ...options.tags },
      extra: options.extra,
      user: options.user || this.user,
      breadcrumbs: [...this.breadcrumbs],
      transaction: options.transaction,
    };

    const processedEvent = this.config.beforeSend(event);
    if (!processedEvent) {
      return eventId;
    }

    if (Math.random() > this.config.sampleRate) {
      return eventId;
    }

    await this.sendEvent(processedEvent);

    return eventId;
  }

  /**
   * Capture LLM error with context
   */
  async captureLLMError(
    error: Error,
    context: LLMContext,
    options: CaptureOptions = {}
  ): Promise<string> {
    const llmTags: Record<string, string> = {
      'llm.model': context.model,
      'llm.provider': context.provider || 'unknown',
    };

    const llmExtra: Record<string, unknown> = {
      llm_context: {
        tokens: {
          prompt: context.promptTokens,
          completion: context.completionTokens,
          total: context.totalTokens,
        },
        cost: context.cost,
        latency_ms: context.latencyMs,
        config: {
          temperature: context.temperature,
          max_tokens: context.maxTokens,
          streaming: context.streaming,
        },
      },
    };

    return this.captureException(error, {
      ...options,
      tags: { ...llmTags, ...options.tags },
      extra: { ...llmExtra, ...options.extra },
      fingerprint: options.fingerprint || ['{{ default }}', context.model, error.name],
    });
  }

  // --------------------------------------------------------------------------
  // Breadcrumbs
  // --------------------------------------------------------------------------

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now() / 1000,
    });

    // Trim breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * Add LLM request breadcrumb
   */
  addLLMBreadcrumb(data: {
    type: 'request' | 'response' | 'error';
    model: string;
    provider?: string;
    tokens?: number;
    latencyMs?: number;
    error?: string;
  }): void {
    this.addBreadcrumb({
      type: 'http',
      category: `llm.${data.type}`,
      message: `LLM ${data.type}: ${data.model}`,
      data: {
        model: data.model,
        provider: data.provider,
        tokens: data.tokens,
        latency_ms: data.latencyMs,
        error: data.error,
      },
      level: data.type === 'error' ? 'error' : 'info',
    });
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // --------------------------------------------------------------------------
  // User & Context
  // --------------------------------------------------------------------------

  /**
   * Set user context
   */
  setUser(user: SentryUser | null): void {
    this.user = user || undefined;
  }

  /**
   * Set global tag
   */
  setTag(key: string, value: string): void {
    this.globalTags[key] = value;
  }

  /**
   * Set multiple tags
   */
  setTags(tags: Record<string, string>): void {
    Object.assign(this.globalTags, tags);
  }

  /**
   * Get all tags
   */
  getTags(): Record<string, string> {
    return { ...this.globalTags };
  }

  // --------------------------------------------------------------------------
  // Transactions & Performance
  // --------------------------------------------------------------------------

  /**
   * Start a transaction
   */
  startTransaction(options: { name: string; op?: string }): Transaction {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const transaction: Transaction = {
      name: options.name,
      traceId,
      spanId,
      startTimestamp: Date.now(),
      setStatus: () => {},
      setData: () => {},
      setTag: () => {},
      startChild: (childOptions) => this.createSpan(childOptions),
      finish: async () => {
        this.activeTransactions.delete(traceId);
        // Send transaction to Sentry
        if (Math.random() <= this.config.tracesSampleRate) {
          await this.sendTransaction(transaction);
        }
      },
    };

    this.activeTransactions.set(traceId, transaction);

    return transaction;
  }

  /**
   * Start LLM transaction
   */
  startLLMTransaction(options: {
    model: string;
    provider?: string;
    operation?: string;
  }): Transaction {
    const transaction = this.startTransaction({
      name: `llm.${options.operation || 'request'}`,
      op: 'llm',
    });

    transaction.setTag('llm.model', options.model);
    if (options.provider) {
      transaction.setTag('llm.provider', options.provider);
    }

    return transaction;
  }

  private createSpan(options: { op: string; description?: string }): Span {
    const spanId = this.generateSpanId();
    const span: Span = {
      spanId,
      op: options.op,
      description: options.description,
      startTimestamp: Date.now(),
      setData: () => {},
      setStatus: () => {},
      finish: () => {},
    };

    return span;
  }

  // --------------------------------------------------------------------------
  // Middleware
  // --------------------------------------------------------------------------

  /**
   * Create RANA middleware for automatic error tracking
   */
  get middleware() {
    return {
      beforeRequest: async (request: {
        model: string;
        provider?: string;
        messages?: unknown[];
      }) => {
        this.addLLMBreadcrumb({
          type: 'request',
          model: request.model,
          provider: request.provider,
        });
      },

      afterResponse: async (response: {
        model: string;
        provider?: string;
        tokens?: number;
        latencyMs?: number;
      }) => {
        this.addLLMBreadcrumb({
          type: 'response',
          model: response.model,
          provider: response.provider,
          tokens: response.tokens,
          latencyMs: response.latencyMs,
        });
      },

      onError: async (
        error: Error,
        context: {
          model?: string;
          provider?: string;
        }
      ) => {
        this.addLLMBreadcrumb({
          type: 'error',
          model: context.model || 'unknown',
          provider: context.provider,
          error: error.message,
        });

        await this.captureLLMError(error, {
          model: context.model || 'unknown',
          provider: context.provider,
        });
      },
    };
  }

  // --------------------------------------------------------------------------
  // User Feedback
  // --------------------------------------------------------------------------

  /**
   * Capture user feedback for an event
   */
  async captureUserFeedback(feedback: {
    eventId: string;
    name?: string;
    email?: string;
    comments: string;
  }): Promise<void> {
    await this.sendFeedback(feedback);
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private async sendEvent(event: SentryEvent): Promise<void> {
    const dsn = this.parseDSN(this.config.dsn);
    if (!dsn) return;

    const url = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/store/`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': this.buildAuthHeader(dsn),
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('[Sentry] Failed to send event:', error);
    }
  }

  private async sendTransaction(transaction: Transaction): Promise<void> {
    // Transaction envelope format
    const envelope = {
      type: 'transaction',
      ...transaction,
      timestamp: Date.now() / 1000,
    };

    const dsn = this.parseDSN(this.config.dsn);
    if (!dsn) return;

    const url = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/envelope/`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': this.buildAuthHeader(dsn),
        },
        body: JSON.stringify(envelope),
      });
    } catch (error) {
      console.error('[Sentry] Failed to send transaction:', error);
    }
  }

  private async sendFeedback(feedback: {
    eventId: string;
    name?: string;
    email?: string;
    comments: string;
  }): Promise<void> {
    const dsn = this.parseDSN(this.config.dsn);
    if (!dsn) return;

    const url = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/user-feedback/`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': this.buildAuthHeader(dsn),
        },
        body: JSON.stringify({
          event_id: feedback.eventId,
          name: feedback.name || 'Anonymous',
          email: feedback.email || '',
          comments: feedback.comments,
        }),
      });
    } catch (error) {
      console.error('[Sentry] Failed to send feedback:', error);
    }
  }

  private parseDSN(dsn: string): {
    protocol: string;
    publicKey: string;
    host: string;
    projectId: string;
  } | null {
    try {
      const url = new URL(dsn);
      const pathParts = url.pathname.split('/').filter(Boolean);

      return {
        protocol: url.protocol.replace(':', ''),
        publicKey: url.username,
        host: url.host,
        projectId: pathParts[pathParts.length - 1],
      };
    } catch {
      console.error('[Sentry] Invalid DSN');
      return null;
    }
  }

  private buildAuthHeader(dsn: {
    publicKey: string;
    protocol: string;
    host: string;
    projectId: string;
  }): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `Sentry sentry_version=7,sentry_key=${dsn.publicKey},sentry_timestamp=${timestamp}`;
  }

  private parseStackTrace(error: Error): {
    frames: Array<{
      filename?: string;
      function?: string;
      lineno?: number;
      colno?: number;
      in_app?: boolean;
    }>;
  } {
    const frames: Array<{
      filename?: string;
      function?: string;
      lineno?: number;
      colno?: number;
      in_app?: boolean;
    }> = [];

    if (!error.stack) return { frames };

    const lines = error.stack.split('\n').slice(1);

    for (const line of lines) {
      const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.+):(\d+):(\d+)/);

      if (match) {
        const hasFunction = match.length === 5;
        frames.push({
          function: hasFunction ? match[1] : undefined,
          filename: hasFunction ? match[2] : match[1],
          lineno: parseInt(hasFunction ? match[3] : match[2], 10),
          colno: parseInt(hasFunction ? match[4] : match[3], 10),
          in_app: !line.includes('node_modules'),
        });
      }
    }

    return { frames: frames.reverse() };
  }

  private generateEventId(): string {
    return [...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  }

  private generateTraceId(): string {
    return [...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  }

  private generateSpanId(): string {
    return [...Array(16)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  }

  private getServerName(): string {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.HOSTNAME || process.env.HOST || 'unknown';
    }
    return 'unknown';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create Sentry integration
 */
export function createSentryIntegration(config: SentryConfig): SentryIntegration {
  return new SentryIntegration(config);
}

/**
 * Create Sentry integration and initialize
 */
export function initSentry(config: SentryConfig): SentryIntegration {
  const sentry = new SentryIntegration(config);

  // Set up global error handlers
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', async (error) => {
      await sentry.captureException(error, { level: 'fatal' });
    });

    process.on('unhandledRejection', async (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await sentry.captureException(error, { level: 'error' });
    });
  }

  return sentry;
}

/**
 * Wrap async function with Sentry error tracking
 */
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(
  sentry: SentryIntegration,
  fn: T,
  options?: CaptureOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await sentry.captureException(error as Error, options);
      throw error;
    }
  }) as T;
}
