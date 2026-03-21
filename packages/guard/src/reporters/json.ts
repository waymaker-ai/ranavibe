import { writeFileSync, appendFileSync, existsSync } from 'fs';
import type { CheckResult, GuardReport } from '../types.js';

export class JsonReporter {
  private filePath: string;

  constructor(filePath: string = './rana-guard.log.json') {
    this.filePath = filePath;
  }

  logCheck(result: CheckResult): void {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'check',
      safe: result.safe,
      blocked: result.blocked,
      reason: result.reason,
      piiCount: result.piiFindings.length,
      injectionScore: result.injectionFindings.reduce((s, f) => s + f.score, 0),
      toxicityCount: result.toxicityFindings.length,
      warnings: result.warnings,
      cost: result.cost,
      model: result.model,
    };

    this.append(entry);
  }

  logReport(report: GuardReport): void {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'report',
      ...report,
    };
    this.append(entry);
  }

  private append(entry: object): void {
    const line = JSON.stringify(entry) + '\n';
    try {
      appendFileSync(this.filePath, line, 'utf-8');
    } catch {
      // Silently fail if file write is not possible (e.g., browser env)
    }
  }
}
