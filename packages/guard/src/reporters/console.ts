import type { CheckResult, GuardReport } from '../types.js';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

export function reportCheck(result: CheckResult): void {
  const status = result.blocked
    ? `${COLORS.red}${COLORS.bold}BLOCKED${COLORS.reset}`
    : result.warnings.length > 0
    ? `${COLORS.yellow}${COLORS.bold}WARNING${COLORS.reset}`
    : `${COLORS.green}${COLORS.bold}PASSED${COLORS.reset}`;

  console.log(`\n${COLORS.cyan}[RANA Guard]${COLORS.reset} ${status}`);

  if (result.blocked && result.reason) {
    console.log(`  ${COLORS.red}Reason: ${result.reason}${COLORS.reset}`);
  }

  if (result.piiFindings.length > 0) {
    console.log(`  ${COLORS.magenta}PII Found: ${result.piiFindings.length} item(s)${COLORS.reset}`);
    for (const f of result.piiFindings) {
      console.log(`    - ${f.type} (confidence: ${(f.confidence * 100).toFixed(0)}%)`);
    }
  }

  if (result.injectionFindings.length > 0) {
    console.log(`  ${COLORS.red}Injection Patterns: ${result.injectionFindings.length}${COLORS.reset}`);
    for (const f of result.injectionFindings) {
      console.log(`    - [${f.severity}] ${f.pattern} (${f.category})`);
    }
  }

  if (result.toxicityFindings.length > 0) {
    console.log(`  ${COLORS.red}Toxicity: ${result.toxicityFindings.length} match(es)${COLORS.reset}`);
    for (const f of result.toxicityFindings) {
      console.log(`    - [${f.severity}] ${f.category}`);
    }
  }

  for (const w of result.warnings) {
    console.log(`  ${COLORS.yellow}Warning: ${w}${COLORS.reset}`);
  }

  if (result.cost !== undefined) {
    console.log(`  ${COLORS.dim}Cost: $${result.cost.toFixed(4)}${COLORS.reset}`);
  }
}

export function reportSummary(report: GuardReport): void {
  console.log(`\n${COLORS.cyan}${COLORS.bold}=== RANA Guard Report ===${COLORS.reset}`);
  console.log(`${COLORS.dim}Period: ${new Date(report.startedAt).toISOString()} - ${new Date(report.lastCheckAt).toISOString()}${COLORS.reset}\n`);

  const rows = [
    ['Total Checks', report.totalChecks.toString()],
    ['Passed', `${COLORS.green}${report.passed}${COLORS.reset}`],
    ['Blocked', report.blocked > 0 ? `${COLORS.red}${report.blocked}${COLORS.reset}` : '0'],
    ['Warnings', report.warned > 0 ? `${COLORS.yellow}${report.warned}${COLORS.reset}` : '0'],
    ['PII Redacted', report.piiRedacted.toString()],
    ['Injection Attempts', report.injectionAttempts > 0 ? `${COLORS.red}${report.injectionAttempts}${COLORS.reset}` : '0'],
    ['Toxicity Found', report.toxicityFound.toString()],
    ['Total Cost', `$${report.totalCost.toFixed(4)}`],
    ['Budget Remaining', `$${report.budgetRemaining.toFixed(2)}`],
    ['Rate Limit Hits', report.rateLimitHits.toString()],
    ['Model Denials', report.modelDenials.toString()],
  ];

  for (const [label, value] of rows) {
    console.log(`  ${label.padEnd(22)} ${value}`);
  }

  console.log('');
}
