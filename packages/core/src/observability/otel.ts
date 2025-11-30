/**
 * OpenTelemetry Export for RANA Observability
 * Converts RANA traces and metrics to OpenTelemetry format
 *
 * This module provides optional integration with OpenTelemetry using peer dependencies.
 * Install @opentelemetry/api, @opentelemetry/sdk-trace-base, and @opentelemetry/exporter-trace-otlp-http
 * to enable OpenTelemetry export.
 *
 * @example
 * ```typescript
 * import { createOTelExporter } from '@rana/core';
 *
 * const exporter = createOTelExporter({
 *   serviceName: 'my-rana-service',
 *   endpoint: 'https://otel-collector.example.com/v1/traces',
 *   headers: {
 *     'x-api-key': process.env.OTEL_API_KEY
 *   },
 *   batchSize: 100,
 *   batchInterval: 5000
 * });
 *
 * // Use with RANA client
 * const rana = createRana({
 *   providers: { ... },
 *   plugins: [exporter.asPlugin()]
 * });
 * ```
 */

import type {
  RanaChatRequest,
  RanaChatResponse,
  RanaPlugin,
  RanaError,
  LLMProvider,
} from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for OpenTelemetry exporter
 */
export interface OTelConfig {
  /** Service name to identify the RANA instance in traces */
  serviceName: string;

  /** OTLP endpoint URL (HTTP or gRPC) */
  endpoint: string;

  /** Optional headers for authentication */
  headers?: Record<string, string>;

  /** Batch size before forcing export (default: 100) */
  batchSize?: number;

  /** Batch interval in milliseconds (default: 5000) */
  batchInterval?: number;

  /** Export protocol (default: 'http') */
  protocol?: 'http' | 'grpc';

  /** Enable/disable exporter (default: true) */
  enabled?: boolean;

  /** Custom resource attributes */
  resourceAttributes?: Record<string, string | number | boolean>;

  /** Callback when export succeeds */
  onExportSuccess?: (spanCount: number) => void;

  /** Callback when export fails */
  onExportError?: (error: Error) => void;

  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Span data structure for OpenTelemetry
 */
export interface OTelSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'CLIENT' | 'SERVER' | 'INTERNAL';
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Record<string, string | number | boolean>;
  status: {
    code: 'OK' | 'ERROR';
    message?: string;
  };
  events?: Array<{
    timeUnixNano: string;
    name: string;
    attributes?: Record<string, string | number | boolean>;
  }>;
}

/**
 * Resource labels for OpenTelemetry
 */
export interface OTelResource {
  attributes: Record<string, string | number | boolean>;
}

/**
 * Batch of spans ready for export
 */
export interface OTelBatch {
  resourceSpans: Array<{
    resource: OTelResource;
    scopeSpans: Array<{
      scope: {
        name: string;
        version: string;
      };
      spans: OTelSpan[];
    }>;
  }>;
}

// ============================================================================
// OpenTelemetry API Detection
// ============================================================================

/**
 * Check if OpenTelemetry dependencies are available
 */
function isOTelAvailable(): boolean {
  try {
    // Check if @opentelemetry/api is available
    require.resolve('@opentelemetry/api');
    return true;
  } catch {
    return false;
  }
}

/**
 * Lazy-load OpenTelemetry API
 */
function loadOTelAPI(): any {
  try {
    return require('@opentelemetry/api');
  } catch (error) {
    throw new Error(
      'OpenTelemetry API not found. Install @opentelemetry/api to use OTel export.\n' +
      'npm install @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http'
    );
  }
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a random trace ID (32 hex characters)
 */
function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate a random span ID (16 hex characters)
 */
function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Convert timestamp to nanoseconds
 */
function toNano(date: Date): string {
  return (date.getTime() * 1_000_000).toString();
}

// ============================================================================
// OpenTelemetry Exporter
// ============================================================================

export class OTelExporter {
  private config: Required<Omit<OTelConfig, 'headers' | 'resourceAttributes' | 'onExportSuccess' | 'onExportError'>> & Pick<OTelConfig, 'headers' | 'resourceAttributes' | 'onExportSuccess' | 'onExportError'>;
  private spanBatch: OTelSpan[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private otelAvailable: boolean;
  private currentTraceId: string | null = null;

  constructor(config: OTelConfig) {
    // Set defaults
    this.config = {
      serviceName: config.serviceName,
      endpoint: config.endpoint,
      headers: config.headers,
      batchSize: config.batchSize ?? 100,
      batchInterval: config.batchInterval ?? 5000,
      protocol: config.protocol ?? 'http',
      enabled: config.enabled ?? true,
      resourceAttributes: config.resourceAttributes,
      onExportSuccess: config.onExportSuccess,
      onExportError: config.onExportError,
      debug: config.debug ?? false,
    };

    // Check if OpenTelemetry is available
    this.otelAvailable = isOTelAvailable();

    if (!this.otelAvailable && this.config.enabled) {
      console.warn(
        '[RANA OTel] OpenTelemetry dependencies not found. Install @opentelemetry/api to enable export.'
      );
    }

    if (this.config.enabled && this.otelAvailable) {
      this.startBatchTimer();
      this.debug('OTel exporter initialized');
    }
  }

  /**
   * Record a RANA request/response as an OpenTelemetry span
   */
  recordChatSpan(request: RanaChatRequest, response: RanaChatResponse, error?: RanaError): void {
    if (!this.config.enabled || !this.otelAvailable) {
      return;
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - response.latency_ms);

    // Generate or reuse trace ID
    const traceId = this.currentTraceId || generateTraceId();
    const spanId = generateSpanId();

    const span: OTelSpan = {
      traceId,
      spanId,
      name: `rana.chat.${response.provider}`,
      kind: 'CLIENT',
      startTimeUnixNano: toNano(startTime),
      endTimeUnixNano: toNano(endTime),
      attributes: {
        // RANA-specific attributes
        'rana.provider': response.provider,
        'rana.model': response.model,
        'rana.request_id': response.id,
        'rana.cached': response.cached,
        'rana.finish_reason': response.finish_reason || 'unknown',

        // Cost attributes
        'rana.cost.total': response.cost.total_cost,
        'rana.cost.prompt': response.cost.prompt_cost,
        'rana.cost.completion': response.cost.completion_cost,

        // Usage attributes
        'rana.usage.prompt_tokens': response.usage.prompt_tokens,
        'rana.usage.completion_tokens': response.usage.completion_tokens,
        'rana.usage.total_tokens': response.usage.total_tokens,

        // Performance
        'rana.latency_ms': response.latency_ms,

        // Request metadata
        ...(request.temperature && { 'rana.temperature': request.temperature }),
        ...(request.max_tokens && { 'rana.max_tokens': request.max_tokens }),
        ...(request.optimize && { 'rana.optimize': request.optimize }),
        ...(request.user && { 'rana.user': request.user }),

        // Retry metadata (if available)
        ...(response.retry && {
          'rana.retry_count': response.retry.retryCount,
          'rana.retry_time_ms': response.retry.totalRetryTime,
        }),
      },
      status: {
        code: error ? 'ERROR' : 'OK',
        message: error?.message,
      },
    };

    // Add events for retries if they occurred
    if (response.retry && response.retry.retryCount > 0) {
      span.events = response.retry.retryDelays.map((delay, index) => ({
        timeUnixNano: toNano(new Date(startTime.getTime() + delay)),
        name: 'retry_attempt',
        attributes: {
          'retry.attempt': index + 1,
          'retry.delay_ms': delay,
        },
      }));
    }

    // Add error event if present
    if (error) {
      span.events = span.events || [];
      span.events.push({
        timeUnixNano: toNano(endTime),
        name: 'exception',
        attributes: {
          'exception.type': error.name,
          'exception.message': error.message,
          'exception.code': error.code,
          ...(error.provider && { 'exception.provider': error.provider }),
          ...(error.statusCode && { 'exception.status_code': error.statusCode }),
        },
      });
    }

    this.addSpan(span);
    this.debug(`Recorded span: ${span.name} (${span.spanId})`);
  }

  /**
   * Start a new trace (useful for grouping multiple requests)
   */
  startTrace(): string {
    this.currentTraceId = generateTraceId();
    return this.currentTraceId;
  }

  /**
   * End current trace
   */
  endTrace(): void {
    this.currentTraceId = null;
  }

  /**
   * Add a span to the batch
   */
  private addSpan(span: OTelSpan): void {
    this.spanBatch.push(span);

    // Export if batch is full
    if (this.spanBatch.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush spans to the OpenTelemetry collector
   */
  async flush(): Promise<void> {
    if (this.spanBatch.length === 0) {
      return;
    }

    const batch = this.createBatch();
    const spanCount = this.spanBatch.length;
    this.spanBatch = [];

    try {
      await this.exportBatch(batch);
      this.config.onExportSuccess?.(spanCount);
      this.debug(`Exported ${spanCount} spans`);
    } catch (error) {
      this.config.onExportError?.(error as Error);
      console.error('[RANA OTel] Export failed:', error);
    }
  }

  /**
   * Create an OpenTelemetry batch from current spans
   */
  private createBatch(): OTelBatch {
    const resource: OTelResource = {
      attributes: {
        'service.name': this.config.serviceName,
        'telemetry.sdk.name': 'rana',
        'telemetry.sdk.language': 'nodejs',
        'telemetry.sdk.version': '2.0.0',
        ...this.config.resourceAttributes,
      },
    };

    return {
      resourceSpans: [
        {
          resource,
          scopeSpans: [
            {
              scope: {
                name: '@rana/core',
                version: '2.0.0',
              },
              spans: this.spanBatch,
            },
          ],
        },
      ],
    };
  }

  /**
   * Export batch to OpenTelemetry collector
   */
  private async exportBatch(batch: OTelBatch): Promise<void> {
    const endpoint = this.config.endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OTel export failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }
  }

  /**
   * Start the batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.config.batchInterval);

    // Don't keep the process alive
    if (this.batchTimer.unref) {
      this.batchTimer.unref();
    }
  }

  /**
   * Stop the batch timer
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Debug logging
   */
  private debug(message: string): void {
    if (this.config.debug) {
      console.log(`[RANA OTel] ${message}`);
    }
  }

  /**
   * Convert to a RANA plugin
   */
  asPlugin(): RanaPlugin {
    return {
      name: 'otel-exporter',
      version: '1.0.0',

      onInit: async () => {
        this.debug('OTel plugin initialized');
      },

      onAfterResponse: async (response: RanaChatResponse) => {
        // Extract request from metadata if available
        const request = (response as any)._request as RanaChatRequest | undefined;
        if (request) {
          this.recordChatSpan(request, response);
        }
        return response;
      },

      onError: async (error: RanaError) => {
        // Record error span if we have context
        const context = (error as any)._context;
        if (context?.request && context?.response) {
          this.recordChatSpan(context.request, context.response, error);
        }
      },

      onDestroy: async () => {
        this.stopBatchTimer();
        await this.flush();
        this.debug('OTel plugin destroyed');
      },
    };
  }

  /**
   * Shutdown and flush remaining spans
   */
  async shutdown(): Promise<void> {
    this.stopBatchTimer();
    await this.flush();
    this.debug('OTel exporter shut down');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an OpenTelemetry exporter
 *
 * @example
 * ```typescript
 * const exporter = createOTelExporter({
 *   serviceName: 'my-service',
 *   endpoint: 'http://localhost:4318/v1/traces',
 *   headers: {
 *     'x-api-key': process.env.OTEL_API_KEY
 *   }
 * });
 * ```
 */
export function createOTelExporter(config: OTelConfig): OTelExporter {
  return new OTelExporter(config);
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Check if OpenTelemetry is available
 */
export { isOTelAvailable };

/**
 * Create a plugin for easy RANA integration
 */
export function createOTelPlugin(config: OTelConfig): RanaPlugin {
  const exporter = createOTelExporter(config);
  return exporter.asPlugin();
}
