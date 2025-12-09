/**
 * Audit Logging System
 * Immutable record of agent actions for compliance and debugging
 */

export interface AuditEvent {
  /** Unique event ID */
  id: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event type */
  type: AuditEventType;
  /** Event category */
  category: AuditCategory;
  /** Actor who triggered the event */
  actor: AuditActor;
  /** Target of the action */
  target?: AuditTarget;
  /** Event outcome */
  outcome: 'success' | 'failure' | 'blocked' | 'warning';
  /** Event details */
  details: Record<string, unknown>;
  /** Related trace ID */
  traceId?: string;
  /** Related span ID */
  spanId?: string;
  /** Hash of previous event (for immutability) */
  prevHash?: string;
  /** Hash of this event */
  hash?: string;
}

export type AuditEventType =
  | 'agent.run.start'
  | 'agent.run.end'
  | 'agent.step.start'
  | 'agent.step.end'
  | 'llm.request'
  | 'llm.response'
  | 'tool.call'
  | 'tool.result'
  | 'security.input.check'
  | 'security.output.check'
  | 'security.pii.detected'
  | 'security.injection.detected'
  | 'security.blocked'
  | 'rag.query'
  | 'rag.retrieve'
  | 'kb.ingest'
  | 'kb.delete'
  | 'vibe.violation'
  | 'rate.limit.hit'
  | 'auth.success'
  | 'auth.failure'
  | 'config.change'
  | 'system.error';

export type AuditCategory =
  | 'agent'
  | 'llm'
  | 'tool'
  | 'security'
  | 'rag'
  | 'auth'
  | 'config'
  | 'system';

export interface AuditActor {
  type: 'user' | 'agent' | 'system' | 'service';
  id: string;
  name?: string;
  roles?: string[];
  metadata?: Record<string, unknown>;
}

export interface AuditTarget {
  type: string;
  id: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLoggerConfig {
  /** Enable audit logging */
  enabled?: boolean;
  /** Service/application name */
  serviceName: string;
  /** Environment */
  environment?: string;
  /** Storage backend */
  storage: AuditStorage;
  /** Include request/response bodies (may contain sensitive data) */
  includePayloads?: boolean;
  /** Redact sensitive fields */
  redactFields?: string[];
  /** Hash events for immutability */
  hashEvents?: boolean;
  /** Custom event processor */
  processor?: (event: AuditEvent) => AuditEvent | null;
}

export interface AuditStorage {
  /** Write an event */
  write(event: AuditEvent): Promise<void>;
  /** Query events */
  query(options: AuditQueryOptions): Promise<AuditEvent[]>;
  /** Get event by ID */
  get(id: string): Promise<AuditEvent | null>;
  /** Get event count */
  count(filter?: Partial<AuditEvent>): Promise<number>;
}

export interface AuditQueryOptions {
  /** Start time */
  from?: Date;
  /** End time */
  to?: Date;
  /** Event types */
  types?: AuditEventType[];
  /** Categories */
  categories?: AuditCategory[];
  /** Actor ID */
  actorId?: string;
  /** Target ID */
  targetId?: string;
  /** Outcome */
  outcome?: AuditEvent['outcome'];
  /** Trace ID */
  traceId?: string;
  /** Maximum results */
  limit?: number;
  /** Offset */
  offset?: number;
  /** Sort order */
  order?: 'asc' | 'desc';
}

/**
 * Generate event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Hash an event for immutability
 */
async function hashEvent(event: AuditEvent, prevHash?: string): Promise<string> {
  const data = JSON.stringify({
    ...event,
    prevHash,
    hash: undefined, // Don't include hash in hash calculation
  });

  // Use Web Crypto API if available, otherwise simple hash
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Simple hash fallback
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * In-memory audit storage
 */
export class MemoryAuditStorage implements AuditStorage {
  private events: AuditEvent[] = [];
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  async write(event: AuditEvent): Promise<void> {
    this.events.push(event);

    // Trim if exceeds max size
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }
  }

  async query(options: AuditQueryOptions): Promise<AuditEvent[]> {
    let results = [...this.events];

    if (options.from) {
      results = results.filter((e) => e.timestamp >= options.from!);
    }

    if (options.to) {
      results = results.filter((e) => e.timestamp <= options.to!);
    }

    if (options.types?.length) {
      results = results.filter((e) => options.types!.includes(e.type));
    }

    if (options.categories?.length) {
      results = results.filter((e) => options.categories!.includes(e.category));
    }

    if (options.actorId) {
      results = results.filter((e) => e.actor.id === options.actorId);
    }

    if (options.targetId) {
      results = results.filter((e) => e.target?.id === options.targetId);
    }

    if (options.outcome) {
      results = results.filter((e) => e.outcome === options.outcome);
    }

    if (options.traceId) {
      results = results.filter((e) => e.traceId === options.traceId);
    }

    // Sort
    results.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return options.order === 'desc' ? -diff : diff;
    });

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;

    return results.slice(offset, offset + limit);
  }

  async get(id: string): Promise<AuditEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async count(filter?: Partial<AuditEvent>): Promise<number> {
    if (!filter) return this.events.length;

    return this.events.filter((e) => {
      for (const [key, value] of Object.entries(filter)) {
        if ((e as any)[key] !== value) return false;
      }
      return true;
    }).length;
  }

  /** Get all events (for testing) */
  getAll(): AuditEvent[] {
    return [...this.events];
  }

  /** Clear all events */
  clear(): void {
    this.events = [];
  }
}

/**
 * Audit Logger class
 */
export class AuditLogger {
  private config: Required<AuditLoggerConfig>;
  private lastHash: string | undefined;
  private systemActor: AuditActor;

  constructor(config: AuditLoggerConfig) {
    this.config = {
      enabled: true,
      environment: 'development',
      includePayloads: false,
      redactFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
      hashEvents: true,
      processor: (e) => e,
      ...config,
    };

    this.systemActor = {
      type: 'system',
      id: 'system',
      name: this.config.serviceName,
    };
  }

  /**
   * Log an audit event
   */
  async log(
    type: AuditEventType,
    options: {
      actor?: AuditActor;
      target?: AuditTarget;
      outcome?: AuditEvent['outcome'];
      details?: Record<string, unknown>;
      traceId?: string;
      spanId?: string;
    } = {}
  ): Promise<AuditEvent | null> {
    if (!this.config.enabled) return null;

    // Create event
    let event: AuditEvent = {
      id: generateEventId(),
      timestamp: new Date(),
      type,
      category: this.getCategory(type),
      actor: options.actor || this.systemActor,
      target: options.target,
      outcome: options.outcome || 'success',
      details: this.redactDetails(options.details || {}),
      traceId: options.traceId,
      spanId: options.spanId,
    };

    // Hash for immutability
    if (this.config.hashEvents) {
      event.prevHash = this.lastHash;
      event.hash = await hashEvent(event, this.lastHash);
      this.lastHash = event.hash;
    }

    // Process event
    const processed = this.config.processor(event);
    if (!processed) return null;

    // Store event
    await this.config.storage.write(processed);

    return processed;
  }

  /**
   * Log agent run start
   */
  async logAgentStart(
    agentId: string,
    agentName: string,
    input: unknown,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('agent.run.start', {
      actor,
      target: { type: 'agent', id: agentId, name: agentName },
      details: this.config.includePayloads ? { input } : { inputLength: String(input).length },
      traceId,
    });
  }

  /**
   * Log agent run end
   */
  async logAgentEnd(
    agentId: string,
    agentName: string,
    output: unknown,
    success: boolean,
    durationMs: number,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('agent.run.end', {
      actor,
      target: { type: 'agent', id: agentId, name: agentName },
      outcome: success ? 'success' : 'failure',
      details: {
        durationMs,
        ...(this.config.includePayloads ? { output } : { outputLength: String(output).length }),
      },
      traceId,
    });
  }

  /**
   * Log LLM request
   */
  async logLLMRequest(
    provider: string,
    model: string,
    promptTokens: number,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('llm.request', {
      actor,
      target: { type: 'llm', id: `${provider}:${model}`, name: model },
      details: { provider, model, promptTokens },
      traceId,
    });
  }

  /**
   * Log LLM response
   */
  async logLLMResponse(
    provider: string,
    model: string,
    completionTokens: number,
    totalTokens: number,
    durationMs: number,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('llm.response', {
      actor,
      target: { type: 'llm', id: `${provider}:${model}`, name: model },
      details: { provider, model, completionTokens, totalTokens, durationMs },
      traceId,
    });
  }

  /**
   * Log tool call
   */
  async logToolCall(
    toolName: string,
    args: Record<string, unknown>,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('tool.call', {
      actor,
      target: { type: 'tool', id: toolName, name: toolName },
      details: this.config.includePayloads
        ? { args }
        : { argKeys: Object.keys(args) },
      traceId,
    });
  }

  /**
   * Log tool result
   */
  async logToolResult(
    toolName: string,
    success: boolean,
    durationMs: number,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('tool.result', {
      actor,
      target: { type: 'tool', id: toolName, name: toolName },
      outcome: success ? 'success' : 'failure',
      details: { durationMs },
      traceId,
    });
  }

  /**
   * Log security event
   */
  async logSecurity(
    type: 'security.input.check' | 'security.output.check' | 'security.pii.detected' | 'security.injection.detected' | 'security.blocked',
    details: Record<string, unknown>,
    outcome: AuditEvent['outcome'],
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log(type, {
      actor,
      outcome,
      details: this.redactDetails(details),
      traceId,
    });
  }

  /**
   * Log vibe violation
   */
  async logVibeViolation(
    constraint: string,
    reason: string,
    actor?: AuditActor,
    traceId?: string
  ): Promise<AuditEvent | null> {
    return this.log('vibe.violation', {
      actor,
      outcome: 'blocked',
      details: { constraint, reason },
      traceId,
    });
  }

  /**
   * Query audit events
   */
  async query(options: AuditQueryOptions): Promise<AuditEvent[]> {
    return this.config.storage.query(options);
  }

  /**
   * Get event by ID
   */
  async get(id: string): Promise<AuditEvent | null> {
    return this.config.storage.get(id);
  }

  /**
   * Get event count
   */
  async count(filter?: Partial<AuditEvent>): Promise<number> {
    return this.config.storage.count(filter);
  }

  /**
   * Verify event chain integrity
   */
  async verifyIntegrity(events: AuditEvent[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (!event.hash) {
        errors.push(`Event ${event.id}: missing hash`);
        continue;
      }

      // Verify hash
      const expectedHash = await hashEvent(event, event.prevHash);
      if (event.hash !== expectedHash) {
        errors.push(`Event ${event.id}: hash mismatch`);
      }

      // Verify chain
      if (i > 0 && event.prevHash !== events[i - 1].hash) {
        errors.push(`Event ${event.id}: chain broken`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getCategory(type: AuditEventType): AuditCategory {
    if (type.startsWith('agent.')) return 'agent';
    if (type.startsWith('llm.')) return 'llm';
    if (type.startsWith('tool.')) return 'tool';
    if (type.startsWith('security.')) return 'security';
    if (type.startsWith('rag.') || type.startsWith('kb.')) return 'rag';
    if (type.startsWith('auth.')) return 'auth';
    if (type.startsWith('config.')) return 'config';
    return 'system';
  }

  private redactDetails(details: Record<string, unknown>): Record<string, unknown> {
    const redacted = { ...details };

    for (const field of this.config.redactFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }
}

/**
 * Create an audit logger
 */
export function createAuditLogger(config: AuditLoggerConfig): AuditLogger {
  return new AuditLogger(config);
}

/**
 * Global audit logger instance
 */
let globalAuditLogger: AuditLogger | null = null;

/**
 * Initialize global audit logger
 */
export function initAuditLogger(config: AuditLoggerConfig): AuditLogger {
  globalAuditLogger = new AuditLogger(config);
  return globalAuditLogger;
}

/**
 * Get global audit logger
 */
export function getAuditLogger(): AuditLogger {
  if (!globalAuditLogger) {
    throw new Error('Audit logger not initialized. Call initAuditLogger() first.');
  }
  return globalAuditLogger;
}
