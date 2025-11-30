/**
 * Observability Types
 * Type definitions for logging and observability
 */

import type { LLMProvider, RanaChatRequest, RanaChatResponse } from '../types.js';

// ============================================================================
// Log Level Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Log Entry Types
// ============================================================================

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  metadata?: Record<string, any>;
  error?: Error;
  requestId?: string;
}

export interface StructuredLogEntry extends LogEntry {
  provider?: LLMProvider;
  model?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
}

// ============================================================================
// Request/Response Logging Types
// ============================================================================

export interface RequestLogEntry {
  requestId: string;
  timestamp: Date;
  provider: LLMProvider;
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface ResponseLogEntry {
  requestId: string;
  timestamp: Date;
  provider: LLMProvider;
  model: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
  };
  latency_ms: number;
  cached: boolean;
  finish_reason: string | null;
  error?: Error;
}

export interface RequestResponseLog {
  request: RequestLogEntry;
  response?: ResponseLogEntry;
  duration_ms: number;
  success: boolean;
}

// ============================================================================
// Logger Configuration
// ============================================================================

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  category?: string;
  transports?: LogTransport[];
  filters?: LogFilter[];
  redactFields?: string[];
  includeTimestamp?: boolean;
  includeCategory?: boolean;
  pretty?: boolean;
}

export interface LogFilter {
  level?: LogLevel;
  category?: string;
  provider?: LLMProvider;
  condition?: (entry: LogEntry) => boolean;
}

// ============================================================================
// Transport Types
// ============================================================================

export interface LogTransport {
  name: string;
  write: (entry: LogEntry) => void | Promise<void>;
  flush?: () => void | Promise<void>;
  close?: () => void | Promise<void>;
}

export interface ConsoleTransportConfig {
  level?: LogLevel;
  colors?: boolean;
  pretty?: boolean;
  timestamp?: boolean;
}

export interface FileTransportConfig {
  level?: LogLevel;
  filepath: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  rotate?: boolean;
}

export interface CustomTransportConfig {
  level?: LogLevel;
  handler: (entry: LogEntry) => void | Promise<void>;
}

// ============================================================================
// Middleware Types
// ============================================================================

export interface LoggingMiddlewareConfig {
  enabled?: boolean;
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  includeMessages?: boolean;
  redactMessages?: boolean;
  redactFields?: string[];
  includeUsage?: boolean;
  includeCost?: boolean;
  includeLatency?: boolean;
  onLog?: (log: RequestResponseLog) => void | Promise<void>;
}

// ============================================================================
// Log Context Types
// ============================================================================

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  provider?: LLMProvider;
  model?: string;
  metadata?: Record<string, any>;
}
