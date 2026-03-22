import { createHash } from 'crypto';
import { appendFileSync } from 'fs';
import type { Interceptor, InterceptorResult, InterceptorContext, AuditConfig, AuditEvent, AuditEventType } from '../types.js';

let eventCounter = 0;

export class AuditInterceptor implements Interceptor {
  name = 'audit';
  private config: Required<AuditConfig>;
  private events: AuditEvent[] = [];
  private lastHash = '0';

  constructor(config: AuditConfig | true) {
    const c = config === true ? {} : config;
    this.config = {
      destination: c.destination || 'console',
      filePath: c.filePath || './cofounder-audit.log',
      events: c.events || ['request', 'response', 'tool_call', 'violation', 'cost', 'error'],
      includePayload: c.includePayload ?? false,
      tamperProof: c.tamperProof ?? false,
      customHandler: c.customHandler || (() => {}),
    };
  }

  processInput(text: string, ctx: InterceptorContext): InterceptorResult {
    this.logEvent('request', ctx, 'allowed', [], text);
    return { allowed: true, blocked: false, violations: [], metadata: {} };
  }

  processOutput(text: string, ctx: InterceptorContext): InterceptorResult {
    this.logEvent('response', ctx, 'allowed', [], text);
    return { allowed: true, blocked: false, violations: [], metadata: {} };
  }

  logViolation(ctx: InterceptorContext, violations: Array<{ interceptor: string; rule: string; severity: string; message: string; action: string }>, payload?: string): void {
    this.logEvent('violation', ctx, 'blocked', violations, payload);
  }

  logCost(ctx: InterceptorContext, cost: number): void {
    this.logEvent('cost', ctx, 'allowed', [], undefined, cost);
  }

  logError(ctx: InterceptorContext, error: string): void {
    this.logEvent('error', ctx, 'blocked', [{ interceptor: 'system', rule: 'error', severity: 'high', message: error, action: 'log' }]);
  }

  getEvents(): AuditEvent[] {
    return [...this.events];
  }

  get eventCount(): number {
    return this.events.length;
  }

  private logEvent(
    type: AuditEventType,
    ctx: InterceptorContext,
    result: 'allowed' | 'blocked' | 'warned',
    violations: any[] = [],
    payload?: string,
    cost?: number,
  ): void {
    if (!this.config.events.includes(type)) return;

    const event: AuditEvent = {
      id: `audit-${Date.now()}-${++eventCounter}`,
      timestamp: Date.now(),
      type,
      direction: ctx.direction,
      model: ctx.model,
      interceptor: ctx.metadata?.interceptor as string | undefined,
      result,
      violations,
      payload: this.config.includePayload ? payload?.slice(0, 1000) : undefined,
      cost,
    };

    if (this.config.tamperProof) {
      const data = JSON.stringify({ ...event, previousHash: this.lastHash });
      event.previousHash = this.lastHash;
      event.hash = createHash('sha256').update(data).digest('hex');
      this.lastHash = event.hash;
    }

    this.events.push(event);

    switch (this.config.destination) {
      case 'console':
        console.log(`[CoFounder Audit] ${type} ${result} ${ctx.direction} ${event.model || ''} ${violations.length > 0 ? `violations: ${violations.length}` : ''}`);
        break;
      case 'file':
        try { appendFileSync(this.config.filePath, JSON.stringify(event) + '\n'); } catch {}
        break;
      case 'custom':
        try { this.config.customHandler(event); } catch {}
        break;
    }
  }
}
