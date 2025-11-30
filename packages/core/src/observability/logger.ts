/**
 * Logger
 * Main logging system for RANA observability
 */

import { randomUUID } from 'crypto';
import type {
  LogLevel,
  LogEntry,
  StructuredLogEntry,
  LoggerConfig,
  LogTransport,
  LogFilter,
  LogContext,
  LOG_LEVELS,
} from './types.js';
import { ConsoleTransport } from './transports.js';

// Import LOG_LEVELS constant
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Logger Class
// ============================================================================

export class Logger {
  private level: LogLevel;
  private enabled: boolean;
  private category?: string;
  private transports: LogTransport[] = [];
  private filters: LogFilter[] = [];
  private redactFields: Set<string>;
  private includeTimestamp: boolean;
  private includeCategory: boolean;
  private context: LogContext = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.level = config.level || 'info';
    this.enabled = config.enabled ?? true;
    this.category = config.category;
    this.redactFields = new Set(config.redactFields || ['api_key', 'apiKey', 'password', 'token', 'secret']);
    this.includeTimestamp = config.includeTimestamp ?? true;
    this.includeCategory = config.includeCategory ?? true;

    // Set up default transports if none provided
    if (config.transports && config.transports.length > 0) {
      this.transports = config.transports;
    } else {
      this.transports = [
        new ConsoleTransport({
          level: this.level,
          pretty: config.pretty ?? true,
        }),
      ];
    }

    // Set up filters
    if (config.filters) {
      this.filters = config.filters;
    }
  }

  // ============================================================================
  // Context Management
  // ============================================================================

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  clearContext(): void {
    this.context = {};
  }

  withContext(context: Partial<LogContext>): Logger {
    const childLogger = new Logger({
      level: this.level,
      enabled: this.enabled,
      category: this.category,
      transports: this.transports,
      filters: this.filters,
      redactFields: Array.from(this.redactFields),
      includeTimestamp: this.includeTimestamp,
      includeCategory: this.includeCategory,
    });
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const meta = error instanceof Error ? metadata : { ...error, ...metadata };
    this.log('error', message, meta, errorObj);
  }

  log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.enabled) return;
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.level]) return;

    const entry: StructuredLogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(this.category && this.includeCategory && { category: this.category }),
      ...(this.context.requestId && { requestId: this.context.requestId }),
      ...(this.context.provider && { provider: this.context.provider }),
      ...(this.context.model && { model: this.context.model }),
      ...(this.context.userId && { userId: this.context.userId }),
      ...(this.context.sessionId && { sessionId: this.context.sessionId }),
      ...(this.context.traceId && { traceId: this.context.traceId }),
      ...(this.context.spanId && { spanId: this.context.spanId }),
      ...(metadata && { metadata: this.redactSensitiveData(metadata) }),
      ...(error && { error }),
    };

    // Apply filters
    if (!this.shouldLog(entry)) return;

    // Write to all transports
    for (const transport of this.transports) {
      try {
        transport.write(entry);
      } catch (err) {
        console.error(`Transport ${transport.name} failed:`, err);
      }
    }
  }

  // ============================================================================
  // Structured Logging
  // ============================================================================

  logStructured(entry: Partial<StructuredLogEntry>): void {
    const fullEntry: StructuredLogEntry = {
      timestamp: entry.timestamp || new Date(),
      level: entry.level || 'info',
      message: entry.message || '',
      ...entry,
    };

    if (!this.enabled) return;
    if (LOG_LEVEL_VALUES[fullEntry.level] < LOG_LEVEL_VALUES[this.level]) return;
    if (!this.shouldLog(fullEntry)) return;

    for (const transport of this.transports) {
      try {
        transport.write(fullEntry);
      } catch (err) {
        console.error(`Transport ${transport.name} failed:`, err);
      }
    }
  }

  // ============================================================================
  // Request Tracing
  // ============================================================================

  startRequest(requestId?: string): string {
    const id = requestId || randomUUID();
    this.setContext({ requestId: id });
    return id;
  }

  endRequest(): void {
    const { requestId, ...rest } = this.context;
    this.context = rest;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  getTransports(): LogTransport[] {
    return [...this.transports];
  }

  addFilter(filter: LogFilter): void {
    this.filters.push(filter);
  }

  removeFilter(filter: LogFilter): void {
    const index = this.filters.indexOf(filter);
    if (index > -1) {
      this.filters.splice(index, 1);
    }
  }

  clearFilters(): void {
    this.filters = [];
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(async (transport) => {
        if (transport.flush) {
          await transport.flush();
        }
      })
    );
  }

  async close(): Promise<void> {
    await this.flush();
    await Promise.all(
      this.transports.map(async (transport) => {
        if (transport.close) {
          await transport.close();
        }
      })
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private shouldLog(entry: LogEntry): boolean {
    if (this.filters.length === 0) return true;

    return this.filters.every((filter) => {
      // Check level filter
      if (filter.level && LOG_LEVEL_VALUES[entry.level] < LOG_LEVEL_VALUES[filter.level]) {
        return false;
      }

      // Check category filter
      if (filter.category && entry.category !== filter.category) {
        return false;
      }

      // Check provider filter
      if (filter.provider && 'provider' in entry && entry.provider !== filter.provider) {
        return false;
      }

      // Check custom condition
      if (filter.condition && !filter.condition(entry)) {
        return false;
      }

      return true;
    });
  }

  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.redactFields.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
}

// ============================================================================
// Global Logger Instance
// ============================================================================

let globalLogger: Logger | null = null;

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

export function getGlobalLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger({
      level: 'info',
      enabled: true,
    });
  }
  return globalLogger;
}

export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger;
}

// ============================================================================
// Convenience Exports
// ============================================================================

export const logger = getGlobalLogger();
