import type { ScanResult } from '../types.js';

/**
 * Format scan results as JSON.
 */
export function formatJson(result: ScanResult): string {
  return JSON.stringify(
    {
      passed: result.passed,
      summary: result.summary,
      filesScanned: result.filesScanned,
      rulesApplied: result.rulesApplied,
      durationMs: result.durationMs,
      totalFindings: result.findings.length,
      findings: result.findings.map(f => ({
        file: f.file,
        line: f.line,
        column: f.column,
        rule: f.rule,
        severity: f.severity,
        message: f.message,
        suggestion: f.suggestion,
        source: f.source,
      })),
    },
    null,
    2,
  );
}

export default formatJson;
