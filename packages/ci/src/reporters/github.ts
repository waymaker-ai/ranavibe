import type { ScanResult, Finding, Severity } from '../types.js';

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: '![critical](https://img.shields.io/badge/-CRITICAL-red)',
  high: '![high](https://img.shields.io/badge/-HIGH-orange)',
  medium: '![medium](https://img.shields.io/badge/-MEDIUM-yellow)',
  low: '![low](https://img.shields.io/badge/-LOW-blue)',
  info: '![info](https://img.shields.io/badge/-INFO-lightgrey)',
};

/**
 * Format scan results as a GitHub PR comment with tables,
 * suggestions, and expandable details.
 */
export function formatGitHubPr(result: ScanResult): string {
  const lines: string[] = [];

  // Header
  const statusIcon = result.passed ? ':white_check_mark:' : ':x:';
  lines.push(`## ${statusIcon} RANA CI Scan Results`);
  lines.push('');

  // Summary table
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Files scanned | **${result.filesScanned}** |`);
  lines.push(`| Rules applied | **${result.rulesApplied}** |`);
  lines.push(`| Duration | **${result.durationMs}ms** |`);
  lines.push(`| Total findings | **${result.findings.length}** |`);
  lines.push(`| Status | ${result.passed ? '**PASSED** :white_check_mark:' : '**FAILED** :x:'} |`);
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('> :tada: No findings. All AI guardrail checks passed!');
    lines.push('');
    lines.push('---');
    lines.push('*Scanned by [RANA CI](https://rana.cx)*');
    return lines.join('\n');
  }

  // Severity breakdown badges
  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const badgeParts: string[] = [];
  for (const sev of severities) {
    if (result.summary[sev] > 0) {
      badgeParts.push(`${SEVERITY_BADGE[sev]} **${result.summary[sev]}**`);
    }
  }
  if (badgeParts.length > 0) {
    lines.push(badgeParts.join(' '));
    lines.push('');
  }

  // Critical/High findings always visible
  const criticalFindings = result.findings.filter(
    f => f.severity === 'critical' || f.severity === 'high'
  );

  if (criticalFindings.length > 0) {
    lines.push('### :rotating_light: Critical & High Severity');
    lines.push('');
    lines.push('| File | Line | Rule | Message |');
    lines.push('|------|------|------|---------|');

    for (const f of criticalFindings) {
      const msg = f.message.replace(/\|/g, '\\|');
      lines.push(`| \`${f.file}\` | ${f.line}:${f.column} | \`${f.rule}\` | ${msg} |`);
    }
    lines.push('');

    // Suggestions for critical findings
    const withSuggestions = criticalFindings.filter(f => f.suggestion);
    if (withSuggestions.length > 0) {
      lines.push('<details>');
      lines.push('<summary>:bulb: Suggestions for critical/high findings</summary>');
      lines.push('');
      for (const f of withSuggestions) {
        lines.push(`- **\`${f.file}:${f.line}\`** (\`${f.rule}\`): ${f.suggestion}`);
      }
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }

  // Medium/Low/Info findings in expandable details
  const otherFindings = result.findings.filter(
    f => f.severity !== 'critical' && f.severity !== 'high'
  );

  if (otherFindings.length > 0) {
    lines.push('<details>');
    lines.push(`<summary>:mag: Other findings (${otherFindings.length})</summary>`);
    lines.push('');
    lines.push('| File | Line | Severity | Rule | Message |');
    lines.push('|------|------|----------|------|---------|');

    for (const f of otherFindings) {
      const msg = f.message.replace(/\|/g, '\\|');
      const sev = f.severity.toUpperCase();
      lines.push(`| \`${f.file}\` | ${f.line}:${f.column} | ${sev} | \`${f.rule}\` | ${msg} |`);
    }
    lines.push('');

    // Suggestions in nested expandable
    const otherSuggestions = otherFindings.filter(f => f.suggestion);
    if (otherSuggestions.length > 0) {
      lines.push('<details>');
      lines.push('<summary>:bulb: Suggestions</summary>');
      lines.push('');
      for (const f of otherSuggestions) {
        lines.push(`- **\`${f.file}:${f.line}\`** (\`${f.rule}\`): ${f.suggestion}`);
      }
      lines.push('');
      lines.push('</details>');
    }

    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  // Source snippets for top findings
  const topFindings = result.findings
    .filter(f => f.source && (f.severity === 'critical' || f.severity === 'high'))
    .slice(0, 5);

  if (topFindings.length > 0) {
    lines.push('<details>');
    lines.push('<summary>:page_facing_up: Source snippets</summary>');
    lines.push('');
    for (const f of topFindings) {
      lines.push(`**\`${f.file}:${f.line}\`** - \`${f.rule}\``);
      lines.push('```');
      lines.push(f.source || '');
      lines.push('```');
      lines.push('');
    }
    lines.push('</details>');
    lines.push('');
  }

  lines.push('---');
  lines.push('*Scanned by [RANA CI](https://rana.cx)*');

  return lines.join('\n');
}

export default formatGitHubPr;
