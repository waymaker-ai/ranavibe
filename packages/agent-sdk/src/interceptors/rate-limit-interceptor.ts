import type { Interceptor, InterceptorResult, InterceptorContext, RateLimitConfig, Violation } from '../types.js';

export class RateLimitInterceptor implements Interceptor {
  name = 'rate_limit';
  private timestamps: number[] = [];
  private config: Required<RateLimitConfig>;
  hitCount = 0;

  constructor(config: RateLimitConfig | true) {
    const c = config === true ? { maxRequests: 60, windowMs: 60000 } : config;
    this.config = {
      maxRequests: c.maxRequests,
      windowMs: c.windowMs,
      onExceeded: c.onExceeded || 'block',
    };
  }

  processInput(_text: string, _ctx: InterceptorContext): InterceptorResult {
    this.cleanup();

    if (this.timestamps.length >= this.config.maxRequests) {
      this.hitCount++;
      const resetMs = this.timestamps[0] + this.config.windowMs - Date.now();
      const violation: Violation = {
        interceptor: 'rate_limit',
        rule: 'exceeded',
        severity: 'high',
        message: `Rate limit exceeded: ${this.config.maxRequests} requests per ${this.config.windowMs}ms. Resets in ${Math.ceil(resetMs / 1000)}s`,
        action: this.config.onExceeded,
      };

      if (this.config.onExceeded === 'block') {
        return { allowed: false, blocked: true, reason: violation.message, violations: [violation], metadata: { resetMs } };
      }

      return { allowed: true, blocked: false, violations: [violation], metadata: { resetMs } };
    }

    this.timestamps.push(Date.now());
    return {
      allowed: true, blocked: false, violations: [],
      metadata: { remaining: this.config.maxRequests - this.timestamps.length },
    };
  }

  processOutput(_text: string, _ctx: InterceptorContext): InterceptorResult {
    return { allowed: true, blocked: false, violations: [], metadata: {} };
  }

  reset(): void {
    this.timestamps = [];
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}
