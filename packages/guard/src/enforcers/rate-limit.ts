import type { RateLimitConfig } from '../types.js';

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60000; // default 1 minute

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60000;
    case 'h': return value * 3600000;
    case 'd': return value * 86400000;
    default: return 60000;
  }
}

export class RateLimiter {
  private timestamps: number[] = [];
  private windowMs: number;
  private max: number;

  constructor(config: RateLimitConfig) {
    this.max = config.max;
    this.windowMs = parseWindow(config.window);
  }

  check(): { allowed: boolean; remaining: number; resetMs: number } {
    this.cleanup();

    const remaining = Math.max(0, this.max - this.timestamps.length);
    const resetMs = this.timestamps.length > 0
      ? Math.max(0, this.timestamps[0] + this.windowMs - Date.now())
      : 0;

    return {
      allowed: this.timestamps.length < this.max,
      remaining,
      resetMs,
    };
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  reset(): void {
    this.timestamps = [];
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}
