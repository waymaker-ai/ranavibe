/**
 * Budget Alert - Triggers at configurable spending thresholds
 */

import * as crypto from 'node:crypto';
import type { DashboardEvent, Alert, AlertConfig, AlertLevel } from '../types.js';

export interface BudgetAlertOptions {
  monthlyBudget: number;
  warningThreshold?: number;  // default 0.80 (80%)
  criticalThreshold?: number; // default 0.95 (95%)
}

export class BudgetAlert {
  private readonly monthlyBudget: number;
  private readonly warningThreshold: number;
  private readonly criticalThreshold: number;
  private currentMonthSpend: number = 0;
  private currentMonth: string = '';
  private warningFired: boolean = false;
  private criticalFired: boolean = false;

  constructor(options: BudgetAlertOptions) {
    this.monthlyBudget = options.monthlyBudget;
    this.warningThreshold = options.warningThreshold ?? 0.80;
    this.criticalThreshold = options.criticalThreshold ?? 0.95;
  }

  /**
   * Check an event and return an alert if budget threshold is crossed
   */
  check(event: DashboardEvent): Alert | null {
    if (event.type !== 'cost') return null;
    const cost = typeof event.data.cost === 'number' ? event.data.cost : 0;
    if (cost <= 0) return null;

    // Reset tracking on new month
    const monthKey = getMonthKey(event.timestamp);
    if (monthKey !== this.currentMonth) {
      this.currentMonth = monthKey;
      this.currentMonthSpend = 0;
      this.warningFired = false;
      this.criticalFired = false;
    }

    this.currentMonthSpend += cost;
    const ratio = this.currentMonthSpend / this.monthlyBudget;

    if (ratio >= this.criticalThreshold && !this.criticalFired) {
      this.criticalFired = true;
      return this.createAlert(
        'critical',
        `Budget critical: spending at ${(ratio * 100).toFixed(1)}% of $${this.monthlyBudget} monthly budget ($${this.currentMonthSpend.toFixed(2)} spent)`,
        { ratio, spent: this.currentMonthSpend, budget: this.monthlyBudget }
      );
    }

    if (ratio >= this.warningThreshold && !this.warningFired) {
      this.warningFired = true;
      return this.createAlert(
        'warning',
        `Budget warning: spending at ${(ratio * 100).toFixed(1)}% of $${this.monthlyBudget} monthly budget ($${this.currentMonthSpend.toFixed(2)} spent)`,
        { ratio, spent: this.currentMonthSpend, budget: this.monthlyBudget }
      );
    }

    return null;
  }

  /**
   * Get current month spend
   */
  getCurrentSpend(): number {
    return this.currentMonthSpend;
  }

  /**
   * Create alert config from options
   */
  static createConfig(options: BudgetAlertOptions): AlertConfig {
    return {
      type: 'budget',
      enabled: true,
      thresholds: {
        monthlyBudget: options.monthlyBudget,
        warning: options.warningThreshold ?? 0.80,
        critical: options.criticalThreshold ?? 0.95,
      },
    };
  }

  private createAlert(level: AlertLevel, message: string, data: Record<string, unknown>): Alert {
    return {
      id: crypto.randomUUID(),
      type: 'budget',
      level,
      message,
      timestamp: Date.now(),
      data,
      acknowledged: false,
    };
  }
}

function getMonthKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
