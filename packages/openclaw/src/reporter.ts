// ---------------------------------------------------------------------------
// @ranavibe/openclaw - Report formatting for OpenClaw chat platforms
// ---------------------------------------------------------------------------
// Formats guard reports as chat-friendly markdown messages suitable for
// Slack, Telegram, WhatsApp, Discord, and web interfaces.
// ---------------------------------------------------------------------------

import type {
  GuardResult,
  GuardReport,
  CostReport,
  ComplianceReport,
  ComplianceViolation,
  OpenClawChannel,
  Severity,
} from './types.js';

// =========================================================================
// Severity Indicators
// =========================================================================

const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

function severityBar(severity: Severity): string {
  switch (severity) {
    case 'critical': return '[!!!!]';
    case 'high': return '[!!! ]';
    case 'medium': return '[!!  ]';
    case 'low': return '[!   ]';
  }
}

// =========================================================================
// Guard Result Formatting
// =========================================================================

/**
 * Format a guard result as a chat-friendly message.
 */
export function formatGuardResult(result: GuardResult, channel?: OpenClawChannel): string {
  const lines: string[] = [];

  if (result.blocked) {
    lines.push('**RANA Guard: BLOCKED**');
    if (result.reason) {
      lines.push(`> ${result.reason}`);
    }
  } else if (result.violations.length > 0) {
    lines.push('**RANA Guard: WARNING**');
  } else {
    lines.push('**RANA Guard: PASSED**');
  }

  lines.push('');

  // PII findings
  if (result.piiFindings.length > 0) {
    lines.push(`**PII Detected:** ${result.piiFindings.length} item(s)`);
    const types = [...new Set(result.piiFindings.map((f) => f.type))];
    lines.push(`  Types: ${types.join(', ')}`);
    if (result.redactedContent) {
      lines.push('  Action: Redacted');
    }
  }

  // Injection findings
  if (result.injectionFindings.length > 0) {
    lines.push(`**Injection Attempts:** ${result.injectionFindings.length}`);
    const categories = [...new Set(result.injectionFindings.map((f) => f.category))];
    lines.push(`  Categories: ${categories.join(', ')}`);
    const maxSeverity = getMaxSeverity(result.injectionFindings.map((f) => f.severity));
    lines.push(`  Max Severity: ${SEVERITY_LABEL[maxSeverity]} ${severityBar(maxSeverity)}`);
  }

  // Toxicity findings
  if (result.toxicityFindings.length > 0) {
    lines.push(`**Toxicity Detected:** ${result.toxicityFindings.length} item(s)`);
    const categories = [...new Set(result.toxicityFindings.map((f) => f.category))];
    lines.push(`  Categories: ${categories.join(', ')}`);
  }

  // Compliance violations
  if (result.complianceViolations.length > 0) {
    lines.push(`**Compliance Violations:** ${result.complianceViolations.length}`);
    for (const v of result.complianceViolations.slice(0, 3)) {
      lines.push(`  ${severityBar(v.severity)} ${v.framework.toUpperCase()}: ${v.message}`);
    }
    if (result.complianceViolations.length > 3) {
      lines.push(`  ... and ${result.complianceViolations.length - 3} more`);
    }
  }

  // Cost
  if (result.cost) {
    lines.push(`**Cost:** $${result.cost.totalCost.toFixed(6)} (${result.cost.model})`);
    if (result.cost.budgetWarning) {
      lines.push(`  Budget Warning: $${result.cost.budgetRemaining?.toFixed(4)} remaining`);
    }
  }

  // Processing time
  lines.push('');
  lines.push(`_Processed in ${result.processingTimeMs}ms_`);

  return adaptForChannel(lines.join('\n'), channel);
}

// =========================================================================
// Guard Report Formatting (Summary)
// =========================================================================

/**
 * Format a full guard report as a summary message.
 */
export function formatGuardReport(report: GuardReport, channel?: OpenClawChannel): string {
  const lines: string[] = [];

  lines.push('**RANA Guard Report**');
  lines.push('---');

  // Overview
  lines.push('**Overview**');
  lines.push(`  Total checks: ${report.totalChecks}`);
  lines.push(`  Passed: ${report.passed}`);
  lines.push(`  Warned: ${report.warned}`);
  lines.push(`  Blocked: ${report.blocked}`);
  lines.push(`  Redacted: ${report.redacted}`);
  lines.push('');

  // PII
  if (Object.keys(report.piiByType).length > 0) {
    lines.push('**PII Detections**');
    for (const [type, count] of Object.entries(report.piiByType)) {
      lines.push(`  ${type}: ${count}`);
    }
    lines.push('');
  }

  // Injection
  if (report.injectionAttempts > 0) {
    lines.push(`**Injection Attempts:** ${report.injectionAttempts}`);
    for (const [category, count] of Object.entries(report.injectionByCategory)) {
      lines.push(`  ${category}: ${count}`);
    }
    lines.push('');
  }

  // Toxicity
  if (Object.keys(report.toxicityByCategory).length > 0) {
    lines.push('**Toxicity Detections**');
    for (const [category, count] of Object.entries(report.toxicityByCategory)) {
      lines.push(`  ${category}: ${count}`);
    }
    lines.push('');
  }

  // Compliance
  if (Object.keys(report.complianceViolationsByFramework).length > 0) {
    lines.push('**Compliance Violations**');
    for (const [framework, count] of Object.entries(report.complianceViolationsByFramework)) {
      lines.push(`  ${framework.toUpperCase()}: ${count}`);
    }
    lines.push('');
  }

  // Cost
  lines.push('**Cost**');
  lines.push(`  Total spent: $${report.totalCost.toFixed(4)}`);
  lines.push(`  Budget remaining: $${report.budgetRemaining.toFixed(4)}`);
  lines.push('');

  // Time range
  const duration = report.lastCheckAt - report.startedAt;
  const durationStr = duration < 60000
    ? `${Math.round(duration / 1000)}s`
    : duration < 3600000
      ? `${Math.round(duration / 60000)}m`
      : `${Math.round(duration / 3600000)}h`;
  lines.push(`_Report period: ${durationStr} | ${report.auditEntries} audit entries_`);

  return adaptForChannel(lines.join('\n'), channel);
}

// =========================================================================
// Cost Report Formatting
// =========================================================================

/**
 * Format a cost report as a chat message.
 */
export function formatCostReport(report: CostReport, channel?: OpenClawChannel): string {
  const lines: string[] = [];

  lines.push('**RANA Cost Report**');
  lines.push('---');

  const usage = report.budgetLimit > 0
    ? ((report.totalSpent / report.budgetLimit) * 100).toFixed(1)
    : '0.0';

  lines.push(`  Spent: $${report.totalSpent.toFixed(4)} / $${report.budgetLimit.toFixed(2)} (${usage}%)`);
  lines.push(`  Remaining: $${report.budgetRemaining.toFixed(4)}`);
  lines.push(`  Period: ${report.period}`);
  lines.push('');

  // By model
  if (Object.keys(report.byModel).length > 0) {
    lines.push('**By Model**');
    const sorted = Object.entries(report.byModel).sort((a, b) => b[1] - a[1]);
    for (const [model, cost] of sorted) {
      const pct = report.totalSpent > 0 ? ((cost / report.totalSpent) * 100).toFixed(0) : '0';
      lines.push(`  ${model}: $${cost.toFixed(4)} (${pct}%)`);
    }
    lines.push('');
  }

  // Recent transactions
  if (report.entries.length > 0) {
    lines.push('**Recent Transactions**');
    const recent = report.entries.slice(-5).reverse();
    for (const entry of recent) {
      const time = new Date(entry.timestamp).toISOString().slice(11, 19);
      lines.push(`  ${time} | ${entry.model} | $${entry.cost.toFixed(6)}`);
    }
    if (report.entries.length > 5) {
      lines.push(`  ... and ${report.entries.length - 5} more`);
    }
  }

  return adaptForChannel(lines.join('\n'), channel);
}

// =========================================================================
// Compliance Report Formatting
// =========================================================================

/**
 * Format a compliance report as a chat message.
 */
export function formatComplianceReport(report: ComplianceReport, channel?: OpenClawChannel): string {
  const lines: string[] = [];

  const status = report.compliant ? 'COMPLIANT' : 'NON-COMPLIANT';
  lines.push(`**RANA Compliance: ${status}**`);
  lines.push('---');

  lines.push(`  Frameworks: ${report.frameworks.map((f) => f.toUpperCase()).join(', ')}`);
  lines.push(`  Total checks: ${report.totalChecks}`);
  lines.push(`  Violations: ${report.totalViolations}`);
  lines.push('');

  // By framework
  if (Object.keys(report.violationsByFramework).length > 0) {
    lines.push('**Violations by Framework**');
    for (const [framework, count] of Object.entries(report.violationsByFramework)) {
      const icon = count === 0 ? '[OK]' : '[!!]';
      lines.push(`  ${icon} ${framework.toUpperCase()}: ${count} violation(s)`);
    }
    lines.push('');
  }

  // Recent violations
  if (report.recentViolations.length > 0) {
    lines.push('**Recent Violations**');
    for (const v of report.recentViolations.slice(0, 5)) {
      lines.push(`  ${severityBar(v.severity)} ${v.framework.toUpperCase()} (${v.rule})`);
      lines.push(`    ${v.message}`);
      lines.push(`    Fix: ${v.recommendation}`);
    }
    if (report.recentViolations.length > 5) {
      lines.push(`  ... and ${report.recentViolations.length - 5} more`);
    }
  }

  return adaptForChannel(lines.join('\n'), channel);
}

// =========================================================================
// Scan Result Formatting
// =========================================================================

/**
 * Format a text scan result for the /rana-scan command.
 */
export function formatScanResult(result: GuardResult, textPreview: string, channel?: OpenClawChannel): string {
  const lines: string[] = [];

  lines.push('**RANA Scan Result**');
  lines.push('---');
  lines.push(`> ${textPreview.slice(0, 100)}${textPreview.length > 100 ? '...' : ''}`);
  lines.push('');

  const issues = result.piiFindings.length + result.injectionFindings.length + result.toxicityFindings.length + result.complianceViolations.length;

  if (issues === 0) {
    lines.push('No issues found. Content appears safe.');
  } else {
    lines.push(`Found ${issues} issue(s):`);
    lines.push('');

    if (result.piiFindings.length > 0) {
      lines.push(`  PII: ${result.piiFindings.length} finding(s)`);
      for (const f of result.piiFindings) {
        lines.push(`    - ${f.type} (confidence: ${(f.confidence * 100).toFixed(0)}%)`);
      }
    }

    if (result.injectionFindings.length > 0) {
      lines.push(`  Injection: ${result.injectionFindings.length} finding(s)`);
      for (const f of result.injectionFindings) {
        lines.push(`    - ${f.pattern} [${SEVERITY_LABEL[f.severity]}]`);
      }
    }

    if (result.toxicityFindings.length > 0) {
      lines.push(`  Toxicity: ${result.toxicityFindings.length} finding(s)`);
      for (const f of result.toxicityFindings) {
        lines.push(`    - ${f.category} [${SEVERITY_LABEL[f.severity]}]`);
      }
    }

    if (result.complianceViolations.length > 0) {
      lines.push(`  Compliance: ${result.complianceViolations.length} violation(s)`);
      for (const v of result.complianceViolations) {
        lines.push(`    - ${v.framework.toUpperCase()}: ${v.message}`);
      }
    }

    if (result.redactedContent) {
      lines.push('');
      lines.push('**Redacted version:**');
      lines.push(`> ${result.redactedContent.slice(0, 200)}${result.redactedContent.length > 200 ? '...' : ''}`);
    }
  }

  lines.push('');
  lines.push(`_Scanned in ${result.processingTimeMs}ms_`);

  return adaptForChannel(lines.join('\n'), channel);
}

// =========================================================================
// Channel Adapters
// =========================================================================

/**
 * Adapt markdown for specific chat channels.
 */
function adaptForChannel(markdown: string, channel?: OpenClawChannel): string {
  switch (channel) {
    case 'whatsapp':
      // WhatsApp uses *bold* and _italic_ (no **bold** or ----)
      return markdown
        .replace(/\*\*(.+?)\*\*/g, '*$1*')
        .replace(/^---$/gm, '----------')
        .replace(/^_(.+?)_$/gm, '_$1_');

    case 'telegram':
      // Telegram supports markdown, mostly compatible
      return markdown;

    case 'slack':
      // Slack uses *bold* and _italic_, > for quotes, ``` for code
      return markdown
        .replace(/\*\*(.+?)\*\*/g, '*$1*')
        .replace(/^---$/gm, '---');

    case 'discord':
      // Discord supports full markdown
      return markdown;

    default:
      // Default: standard markdown
      return markdown;
  }
}

// =========================================================================
// Helpers
// =========================================================================

function getMaxSeverity(severities: Severity[]): Severity {
  const order: Severity[] = ['low', 'medium', 'high', 'critical'];
  let max = 0;
  for (const s of severities) {
    const idx = order.indexOf(s);
    if (idx > max) max = idx;
  }
  return order[max];
}
