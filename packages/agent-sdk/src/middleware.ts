import type { Interceptor, InterceptorContext, InterceptorResult, Violation, GuardReport } from './types.js';
import { randomUUID } from 'crypto';

export class GuardPipeline {
  private interceptors: Interceptor[] = [];
  private allViolations: Violation[] = [];
  private requestCount = 0;
  private startedAt = Date.now();
  private lastActivityAt = Date.now();

  use(interceptor: Interceptor): this {
    this.interceptors.push(interceptor);
    return this;
  }

  async processInput(text: string, context?: Partial<InterceptorContext>): Promise<InterceptorResult> {
    this.requestCount++;
    this.lastActivityAt = Date.now();

    const ctx: InterceptorContext = {
      model: context?.model,
      provider: context?.provider,
      requestId: context?.requestId || randomUUID(),
      timestamp: Date.now(),
      direction: 'input',
      metadata: context?.metadata,
    };

    let currentText = text;
    const mergedViolations: Violation[] = [];
    const metadata: Record<string, unknown> = {};

    for (const interceptor of this.interceptors) {
      const result = interceptor.processInput(currentText, ctx);

      mergedViolations.push(...result.violations);

      if (result.blocked) {
        this.allViolations.push(...result.violations);
        return {
          allowed: false,
          blocked: true,
          reason: result.reason,
          transformed: undefined,
          violations: mergedViolations,
          metadata: { ...metadata, blockedBy: interceptor.name },
        };
      }

      if (result.transformed) {
        currentText = result.transformed;
      }

      Object.assign(metadata, result.metadata);
    }

    this.allViolations.push(...mergedViolations);

    return {
      allowed: true,
      blocked: false,
      transformed: currentText !== text ? currentText : undefined,
      violations: mergedViolations,
      metadata,
    };
  }

  async processOutput(text: string, context?: Partial<InterceptorContext>): Promise<InterceptorResult> {
    this.lastActivityAt = Date.now();

    const ctx: InterceptorContext = {
      model: context?.model,
      provider: context?.provider,
      requestId: context?.requestId || randomUUID(),
      timestamp: Date.now(),
      direction: 'output',
      metadata: context?.metadata,
    };

    let currentText = text;
    const mergedViolations: Violation[] = [];
    const metadata: Record<string, unknown> = {};

    for (const interceptor of this.interceptors) {
      const result = interceptor.processOutput(currentText, ctx);
      mergedViolations.push(...result.violations);

      if (result.blocked) {
        this.allViolations.push(...result.violations);
        return { allowed: false, blocked: true, reason: result.reason, violations: mergedViolations, metadata: { ...metadata, blockedBy: interceptor.name } };
      }

      if (result.transformed) currentText = result.transformed;
      Object.assign(metadata, result.metadata);
    }

    this.allViolations.push(...mergedViolations);
    return { allowed: true, blocked: false, transformed: currentText !== text ? currentText : undefined, violations: mergedViolations, metadata };
  }

  async processToolCall(name: string, input: unknown, context?: Partial<InterceptorContext>): Promise<InterceptorResult> {
    this.lastActivityAt = Date.now();

    const ctx: InterceptorContext = {
      model: context?.model,
      provider: context?.provider,
      requestId: context?.requestId || randomUUID(),
      timestamp: Date.now(),
      direction: 'tool',
      metadata: { ...context?.metadata, toolName: name },
    };

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const mergedViolations: Violation[] = [];

    for (const interceptor of this.interceptors) {
      if (!interceptor.processToolCall) continue;
      const result = interceptor.processToolCall(name, input, ctx);
      mergedViolations.push(...result.violations);
      if (result.blocked) {
        this.allViolations.push(...result.violations);
        return { allowed: false, blocked: true, reason: result.reason, violations: mergedViolations, metadata: { blockedBy: interceptor.name } };
      }
    }

    // Also run input interceptors on the serialized tool input
    return this.processInput(inputStr, { ...context, direction: 'tool' } as any);
  }

  getViolations(): Violation[] {
    return [...this.allViolations];
  }

  getInterceptorNames(): string[] {
    return this.interceptors.map((i) => i.name);
  }

  get stats() {
    return {
      requests: this.requestCount,
      violations: this.allViolations.length,
      interceptors: this.interceptors.length,
      startedAt: this.startedAt,
      lastActivityAt: this.lastActivityAt,
    };
  }
}
