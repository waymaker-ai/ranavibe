/**
 * Logging Middleware
 * Request/Response logging for RANA chat requests
 */

import { randomUUID } from 'crypto';
import type {
  RanaChatRequest,
  RanaChatResponse,
  LLMProvider,
} from '../types.js';
import type {
  RequestLogEntry,
  ResponseLogEntry,
  RequestResponseLog,
  LoggingMiddlewareConfig,
} from './types.js';
import { Logger, getGlobalLogger } from './logger.js';

// ============================================================================
// Request/Response Logger
// ============================================================================

export class RequestResponseLogger {
  private logger: Logger;
  private config: LoggingMiddlewareConfig;

  constructor(logger?: Logger, config: LoggingMiddlewareConfig = {}) {
    this.logger = logger || getGlobalLogger();
    this.config = {
      enabled: true,
      logRequests: true,
      logResponses: true,
      logErrors: true,
      includeMessages: true,
      redactMessages: false,
      redactFields: ['api_key', 'apiKey', 'password', 'token', 'secret'],
      includeUsage: true,
      includeCost: true,
      includeLatency: true,
      ...config,
    };
  }

  /**
   * Log a complete request/response cycle
   */
  logRequestResponse(
    request: RanaChatRequest,
    response: RanaChatResponse,
    duration_ms: number,
    requestId?: string
  ): void {
    if (!this.config.enabled) return;

    const id = requestId || randomUUID();

    const requestLog = this.createRequestLog(request, id);
    const responseLog = this.createResponseLog(response, id);

    const log: RequestResponseLog = {
      request: requestLog,
      response: responseLog,
      duration_ms,
      success: true,
    };

    if (this.config.logRequests) {
      this.logger.info('Request initiated', {
        requestId: id,
        provider: request.provider,
        model: request.model,
        messageCount: request.messages.length,
        stream: request.stream,
      });
    }

    if (this.config.logResponses) {
      this.logger.info('Response received', {
        requestId: id,
        provider: response.provider,
        model: response.model,
        tokens: this.config.includeUsage ? response.usage.total_tokens : undefined,
        cost: this.config.includeCost ? response.cost.total_cost : undefined,
        latency_ms: this.config.includeLatency ? response.latency_ms : undefined,
        duration_ms: this.config.includeLatency ? duration_ms : undefined,
        cached: response.cached,
      });
    }

    // Call custom log handler if provided
    if (this.config.onLog) {
      this.config.onLog(log);
    }
  }

  /**
   * Log a failed request
   */
  logRequestError(
    request: RanaChatRequest,
    error: Error,
    duration_ms: number,
    requestId?: string
  ): void {
    if (!this.config.enabled || !this.config.logErrors) return;

    const id = requestId || randomUUID();

    const requestLog = this.createRequestLog(request, id);

    const log: RequestResponseLog = {
      request: requestLog,
      duration_ms,
      success: false,
    };

    this.logger.error(
      'Request failed',
      error,
      {
        requestId: id,
        provider: request.provider,
        model: request.model,
        duration_ms: this.config.includeLatency ? duration_ms : undefined,
      }
    );

    // Call custom log handler if provided
    if (this.config.onLog) {
      this.config.onLog(log);
    }
  }

  /**
   * Create detailed request log
   */
  logDetailedRequest(request: RanaChatRequest, requestId: string): void {
    if (!this.config.enabled) return;

    const messages = this.config.includeMessages
      ? this.config.redactMessages
        ? this.redactMessages(request.messages)
        : request.messages
      : undefined;

    this.logger.debug('Detailed request', {
      requestId,
      provider: request.provider,
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stream: request.stream,
      optimize: request.optimize,
      cache: request.cache,
      tools: request.tools?.map((t) => t.function.name),
      metadata: request.metadata,
    });
  }

  /**
   * Create detailed response log
   */
  logDetailedResponse(response: RanaChatResponse, requestId: string): void {
    if (!this.config.enabled) return;

    const content = this.config.redactMessages
      ? '[REDACTED]'
      : response.content;

    this.logger.debug('Detailed response', {
      requestId,
      provider: response.provider,
      model: response.model,
      content,
      usage: this.config.includeUsage ? response.usage : undefined,
      cost: this.config.includeCost ? response.cost : undefined,
      latency_ms: this.config.includeLatency ? response.latency_ms : undefined,
      cached: response.cached,
      finish_reason: response.finish_reason,
      tool_calls: response.tool_calls?.map((t) => t.function.name),
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createRequestLog(request: RanaChatRequest, requestId: string): RequestLogEntry {
    return {
      requestId,
      timestamp: new Date(),
      provider: request.provider || ('unknown' as LLMProvider),
      model: request.model || 'unknown',
      messages: this.config.includeMessages
        ? this.config.redactMessages
          ? this.redactMessages(request.messages)
          : request.messages
        : [],
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      stream: request.stream,
      metadata: request.metadata,
    };
  }

  private createResponseLog(response: RanaChatResponse, requestId: string): ResponseLogEntry {
    return {
      requestId,
      timestamp: new Date(),
      provider: response.provider,
      model: response.model,
      content: this.config.redactMessages ? '[REDACTED]' : response.content,
      usage: response.usage,
      cost: response.cost,
      latency_ms: response.latency_ms,
      cached: response.cached,
      finish_reason: response.finish_reason,
    };
  }

  private redactMessages(messages: any[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: '[REDACTED]',
      ...(msg.name && { name: msg.name }),
      ...(msg.tool_calls && { tool_calls: '[REDACTED]' }),
    }));
  }

  private redactData(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.redactData(item, fields));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (fields.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        redacted[key] = this.redactData(value, fields);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
}

// ============================================================================
// Middleware Function
// ============================================================================

export interface LoggingMiddleware {
  onRequest: (request: RanaChatRequest, requestId: string) => void;
  onResponse: (
    request: RanaChatRequest,
    response: RanaChatResponse,
    duration_ms: number,
    requestId: string
  ) => void;
  onError: (request: RanaChatRequest, error: Error, duration_ms: number, requestId: string) => void;
}

export function createLoggingMiddleware(
  logger?: Logger,
  config?: LoggingMiddlewareConfig
): LoggingMiddleware {
  const requestResponseLogger = new RequestResponseLogger(logger, config);

  return {
    onRequest: (request: RanaChatRequest, requestId: string) => {
      requestResponseLogger.logDetailedRequest(request, requestId);
    },

    onResponse: (
      request: RanaChatRequest,
      response: RanaChatResponse,
      duration_ms: number,
      requestId: string
    ) => {
      requestResponseLogger.logRequestResponse(request, response, duration_ms, requestId);
      requestResponseLogger.logDetailedResponse(response, requestId);
    },

    onError: (request: RanaChatRequest, error: Error, duration_ms: number, requestId: string) => {
      requestResponseLogger.logRequestError(request, error, duration_ms, requestId);
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

// RequestResponseLogger is already exported as a class above
