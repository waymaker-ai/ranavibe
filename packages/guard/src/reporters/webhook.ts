import type { CheckResult, GuardReport } from '../types.js';

export class WebhookReporter {
  private url: string;
  private queue: object[] = [];
  private flushing = false;
  private batchSize = 10;
  private flushIntervalMs = 5000;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(url: string, options?: { batchSize?: number; flushIntervalMs?: number }) {
    this.url = url;
    if (options?.batchSize) this.batchSize = options.batchSize;
    if (options?.flushIntervalMs) this.flushIntervalMs = options.flushIntervalMs;

    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      (this.timer as NodeJS.Timeout).unref();
    }
  }

  logCheck(result: CheckResult): void {
    this.queue.push({
      type: 'check',
      timestamp: new Date().toISOString(),
      safe: result.safe,
      blocked: result.blocked,
      reason: result.reason,
      piiCount: result.piiFindings.length,
      injectionFindings: result.injectionFindings.length,
      toxicityFindings: result.toxicityFindings.length,
      warnings: result.warnings,
      cost: result.cost,
      model: result.model,
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  logReport(report: GuardReport): void {
    this.queue.push({
      type: 'report',
      timestamp: new Date().toISOString(),
      ...report,
    });
    this.flush();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    const batch = this.queue.splice(0, this.batchSize);

    try {
      await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'aicofounder-guard', events: batch }),
      });
    } catch {
      // Re-queue on failure
      this.queue.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}
