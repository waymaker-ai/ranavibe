import type { ScanResult, Finding, Severity } from '../types.js';

/** ANSI color codes */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: COLORS.bgRed + COLORS.white,
  high: COLORS.red,
  medium: COLORS.yellow,
  low: COLORS.cyan,
  info: COLORS.dim,
};

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: 'X',
  high: '!',
  medium: '~',
  low: '-',
  info: 'i',
};

function colorize(text: string, color: string): string {
  return `${color}${text}${COLORS.reset}`;
}

function severityLabel(severity: Severity): string {
  const icon = SEVERITY_ICONS[severity];
  const color = SEVERITY_COLORS[severity];
  return colorize(`[${icon}] ${severity.toUpperCase()}`, color);
}

/** Group findings by file */
function groupByFile(findings: Finding[]): Map<string, Finding[]> {
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const existing = map.get(f.file);
    if (existing) {
      existing.push(f);
    } else {
      map.set(f.file, [f]);
    }
  }
  return map;
}

/**
 * Format scan results as ANSI-colored terminal output.
 */
export function formatConsole(result: ScanResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(colorize('  CoFounder CI - AI Guardrails Scanner', COLORS.bold + COLORS.cyan));
  lines.push(colorize('  ================================', COLORS.dim));
  lines.push('');

  if (result.findings.length === 0) {
    lines.push(colorize('  No findings. All checks passed!', COLORS.green + COLORS.bold));
    lines.push('');
  } else {
    const grouped = groupByFile(result.findings);

    for (const [file, findings] of grouped) {
      lines.push(colorize(`  ${file}`, COLORS.underline + COLORS.white));

      // Sort by line number
      findings.sort((a, b) => a.line - b.line);

      for (const f of findings) {
        const location = colorize(`${f.line}:${f.column}`, COLORS.dim);
        lines.push(`    ${location}  ${severityLabel(f.severity)}  ${f.message}`);
        if (f.suggestion) {
          lines.push(`           ${colorize('suggestion:', COLORS.blue)} ${f.suggestion}`);
        }
        if (f.source) {
          lines.push(`           ${colorize('>', COLORS.dim)} ${colorize(f.source, COLORS.dim)}`);
        }
      }
      lines.push('');
    }
  }

  // Summary table
  lines.push(colorize('  Summary', COLORS.bold));
  lines.push(colorize('  -------', COLORS.dim));

  const summaryRows: Array<[string, string, string]> = [
    ['Files scanned', String(result.filesScanned), ''],
    ['Rules applied', String(result.rulesApplied), ''],
    ['Duration', `${result.durationMs}ms`, ''],
    ['Total findings', String(result.findings.length), result.findings.length > 0 ? COLORS.yellow : COLORS.green],
  ];

  for (const [label, value, color] of summaryRows) {
    lines.push(`  ${colorize(label.padEnd(20), COLORS.dim)} ${color ? colorize(value, color) : value}`);
  }

  lines.push('');

  // Severity breakdown
  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (const sev of severities) {
    const count = result.summary[sev];
    if (count > 0) {
      lines.push(`  ${severityLabel(sev).padEnd(35)} ${count}`);
    }
  }

  lines.push('');

  // Pass/fail
  if (result.passed) {
    lines.push(colorize('  PASSED', COLORS.bgGreen + COLORS.white + COLORS.bold));
  } else {
    lines.push(colorize('  FAILED', COLORS.bgRed + COLORS.white + COLORS.bold));
  }
  lines.push('');

  return lines.join('\n');
}

export default formatConsole;
