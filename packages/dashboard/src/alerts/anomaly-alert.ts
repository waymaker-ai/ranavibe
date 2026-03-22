/**
 * Anomaly Alert - Detects cost spikes and violation bursts using z-score
 */

import * as crypto from 'node:crypto';
import type { DashboardEvent, Alert, AlertLevel } from '../types.js';

export interface AnomalyAlertOptions {
  /** Rolling window size for computing baseline */
  windowSize?: number;
  /** Z-score threshold for cost spike detection (default: 2.0) */
  costSpikeThreshold?: number;
  /** Number of violations in a window to trigger burst alert */
  violationBurstCount?: number;
  /** Time window for violation burst detection (ms, default: 5 min) */
  violationBurstWindowMs?: number;
}

export class AnomalyAlert {
  private readonly windowSize: number;
  private readonly costSpikeThreshold: number;
  private readonly violationBurstCount: number;
  private readonly violationBurstWindowMs: number;

  // Rolling window for cost values
  private costWindow: number[] = [];

  // Sliding window for violation timestamps
  private violationTimestamps: number[] = [];

  constructor(options: AnomalyAlertOptions = {}) {
    this.windowSize = options.windowSize ?? 20;
    this.costSpikeThreshold = options.costSpikeThreshold ?? 2.0;
    this.violationBurstCount = options.violationBurstCount ?? 5;
    this.violationBurstWindowMs = options.violationBurstWindowMs ?? 5 * 60 * 1000;
  }

  /**
   * Check an event for anomalies
   */
  check(event: DashboardEvent): Alert | null {
    // Cost spike detection
    if (event.type === 'cost') {
      const cost = typeof event.data.cost === 'number' ? event.data.cost : 0;
      if (cost <= 0) return null;

      const alert = this.checkCostSpike(cost, event.timestamp);
      this.costWindow.push(cost);
      if (this.costWindow.length > this.windowSize) {
        this.costWindow.shift();
      }
      return alert;
    }

    // Violation burst detection
    if (event.type === 'compliance' || event.type === 'security') {
      const result = (event.data.result as string)?.toLowerCase();
      const category = (event.data.category as string) ?? (event.data.type as string);

      const isViolation = result === 'fail' || result === 'failed' || result === 'violation'
        || category === 'injection' || category === 'pii';

      if (isViolation) {
        return this.checkViolationBurst(event.timestamp);
      }
    }

    return null;
  }

  private checkCostSpike(cost: number, timestamp: number): Alert | null {
    if (this.costWindow.length < 3) return null; // Need enough data

    const mean = this.costWindow.reduce((a, b) => a + b, 0) / this.costWindow.length;
    const variance =
      this.costWindow.reduce((sum, v) => sum + (v - mean) ** 2, 0) / this.costWindow.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      // All values the same; any different value is an anomaly
      if (cost > mean * 2) {
        return this.createAlert(
          'warning',
          `Cost anomaly: $${cost.toFixed(4)} is more than 2x the rolling average of $${mean.toFixed(4)}`,
          { cost, mean, stdDev: 0, zScore: Infinity }
        );
      }
      return null;
    }

    const zScore = (cost - mean) / stdDev;

    if (zScore >= this.costSpikeThreshold) {
      const level: AlertLevel = zScore >= this.costSpikeThreshold * 1.5 ? 'critical' : 'warning';
      return this.createAlert(
        level,
        `Cost spike detected: $${cost.toFixed(4)} (z-score: ${zScore.toFixed(2)}, rolling avg: $${mean.toFixed(4)})`,
        { cost, mean, stdDev, zScore }
      );
    }

    return null;
  }

  private checkViolationBurst(timestamp: number): Alert | null {
    // Clean old timestamps
    const cutoff = timestamp - this.violationBurstWindowMs;
    this.violationTimestamps = this.violationTimestamps.filter((t) => t >= cutoff);
    this.violationTimestamps.push(timestamp);

    if (this.violationTimestamps.length >= this.violationBurstCount) {
      // Only alert once per burst (reset window after alert)
      const count = this.violationTimestamps.length;
      this.violationTimestamps = [];
      return this.createAlert(
        'critical',
        `Violation burst: ${count} violations detected in ${this.violationBurstWindowMs / 1000}s window`,
        { count, windowMs: this.violationBurstWindowMs }
      );
    }

    return null;
  }

  private createAlert(
    level: AlertLevel,
    message: string,
    data: Record<string, unknown>
  ): Alert {
    return {
      id: crypto.randomUUID(),
      type: 'anomaly',
      level,
      message,
      timestamp: Date.now(),
      data,
      acknowledged: false,
    };
  }
}
