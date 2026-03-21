import type { ScanResult, Finding, Severity } from '../types.js';

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '[CRITICAL]',
  high: '[HIGH]',
  medium: '[MEDIUM]',
  low: '[LOW]',
  info: '[INFO]',
};

/**
 * Format scan results as Markdown.
 */
export function formatMarkdown(result: ScanResult): string {
  const lines: string[] = [];

  lines.push('# CoFounder CI Scan Results');
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Files scanned | ${result.filesScanned} |`);
  lines.push(`| Rules applied | ${result.rulesApplied} |`);
  lines.push(`| Duration | ${result.durationMs}ms |`);
  lines.push(`| Total findings | ${result.findings.length} |`);
  lines.push(`| Status | ${result.passed ? 'PASSED' : 'FAILED'} |`);
  lines.push('');

  // Severity breakdown
  lines.push('## Severity Breakdown');
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (const sev of severities) {
    lines.push(`| ${SEVERITY_EMOJI[sev]} | ${result.summary[sev]} |`);
  }
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('No findings. All checks passed!');
    lines.push('');
    return lines.join('\n');
  }

  // Findings grouped by file
  lines.push('## Findings');
  lines.push('');

  const grouped = groupByFile(result.findings);

  for (const [file, findings] of grouped) {
    lines.push(`### \`${file}\``);
    lines.push('');
    lines.push('| Line | Severity | Rule | Message |');
    lines.push('|------|----------|------|---------|');

    findings.sort((a, b) => a.line - b.line);

    for (const f of findings) {
      const severity = SEVERITY_EMOJI[f.severity];
      const escapedMessage = f.message.replace(/\|/g, '\\|');
      lines.push(`| ${f.line}:${f.column} | ${severity} | \`${f.rule}\` | ${escapedMessage} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

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

export default formatMarkdown;
