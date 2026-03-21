import { BenchmarkResult, CombinedReport, Metrics } from './types';

/**
 * Format a number as a percentage string
 */
function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Pad a string to a given length
 */
function pad(str: string, len: number, align: 'left' | 'right' = 'left'): string {
  if (align === 'right') {
    return str.padStart(len);
  }
  return str.padEnd(len);
}

/**
 * Format benchmark results as a console table
 */
export function formatConsoleTable(report: CombinedReport): string {
  const lines: string[] = [];
  const sep = '='.repeat(90);
  const thinSep = '-'.repeat(90);

  lines.push(sep);
  lines.push('  RANA Detection Benchmark Report');
  lines.push(`  Generated: ${report.generatedAt}`);
  lines.push(`  Total Duration: ${report.totalDurationMs}ms`);
  lines.push(sep);

  for (const result of report.results) {
    lines.push('');
    lines.push(`  Detector: ${result.detectorName}`);
    lines.push(`  Test Cases: ${result.totalCases} | Duration: ${result.durationMs}ms`);
    lines.push(thinSep);

    // Overall metrics
    lines.push('  OVERALL METRICS:');
    lines.push(formatMetricsLine(result.overall));
    lines.push('');

    // Category breakdown table header
    lines.push(
      `  ${pad('Category', 12)} ${pad('Prec', 8, 'right')} ${pad('Recall', 8, 'right')} ${pad('F1', 8, 'right')} ${pad('Acc', 8, 'right')} ${pad('FPR', 8, 'right')} ${pad('FNR', 8, 'right')} ${pad('Cases', 7, 'right')}`,
    );
    lines.push(`  ${'-'.repeat(75)}`);

    for (const cat of result.categories) {
      lines.push(
        `  ${pad(cat.category, 12)} ${pad(pct(cat.metrics.precision), 8, 'right')} ${pad(pct(cat.metrics.recall), 8, 'right')} ${pad(pct(cat.metrics.f1), 8, 'right')} ${pad(pct(cat.metrics.accuracy), 8, 'right')} ${pad(pct(cat.metrics.falsePositiveRate), 8, 'right')} ${pad(pct(cat.metrics.falseNegativeRate), 8, 'right')} ${pad(String(cat.totalCases), 7, 'right')}`,
      );
    }

    // Confusion matrix summary
    lines.push('');
    lines.push('  Classification Summary:');
    const passed = result.details.filter((d) => d.passed).length;
    const failed = result.details.filter((d) => !d.passed).length;
    const tp = result.details.filter((d) => d.classification === 'true-positive').length;
    const tn = result.details.filter((d) => d.classification === 'true-negative').length;
    const fp = result.details.filter((d) => d.classification === 'false-positive').length;
    const fn = result.details.filter((d) => d.classification === 'false-negative').length;
    lines.push(`    Passed: ${passed} | Failed: ${failed}`);
    lines.push(`    TP: ${tp} | TN: ${tn} | FP: ${fp} | FN: ${fn}`);

    // Failed cases detail
    const failedCases = result.details.filter((d) => !d.passed);
    if (failedCases.length > 0) {
      lines.push('');
      lines.push('  Failed Cases (first 10):');
      for (const fc of failedCases.slice(0, 10)) {
        lines.push(
          `    [${fc.classification}] ${fc.entry.id}: ${fc.entry.description}`,
        );
      }
      if (failedCases.length > 10) {
        lines.push(`    ... and ${failedCases.length - 10} more`);
      }
    }

    lines.push(thinSep);
  }

  lines.push('');
  lines.push(sep);
  return lines.join('\n');
}

function formatMetricsLine(m: Metrics): string {
  return [
    `    Precision: ${pct(m.precision)}`,
    `    Recall:    ${pct(m.recall)}`,
    `    F1 Score:  ${pct(m.f1)}`,
    `    Accuracy:  ${pct(m.accuracy)}`,
    `    FP Rate:   ${pct(m.falsePositiveRate)}`,
    `    FN Rate:   ${pct(m.falseNegativeRate)}`,
  ].join('\n');
}

/**
 * Format benchmark results as JSON
 */
export function formatJSON(report: CombinedReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format benchmark results as a markdown table
 */
export function formatMarkdownTable(report: CombinedReport): string {
  const lines: string[] = [];

  lines.push('# RANA Detection Benchmark Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Total Duration:** ${report.totalDurationMs}ms`);
  lines.push('');

  for (const result of report.results) {
    lines.push(`## ${result.detectorName}`);
    lines.push('');
    lines.push(`- **Test Cases:** ${result.totalCases}`);
    lines.push(`- **Duration:** ${result.durationMs}ms`);
    lines.push('');

    // Overall metrics
    lines.push('### Overall Metrics');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Precision | ${pct(result.overall.precision)} |`);
    lines.push(`| Recall | ${pct(result.overall.recall)} |`);
    lines.push(`| F1 Score | ${pct(result.overall.f1)} |`);
    lines.push(`| Accuracy | ${pct(result.overall.accuracy)} |`);
    lines.push(`| False Positive Rate | ${pct(result.overall.falsePositiveRate)} |`);
    lines.push(`| False Negative Rate | ${pct(result.overall.falseNegativeRate)} |`);
    lines.push('');

    // Category breakdown
    lines.push('### Per-Category Breakdown');
    lines.push('');
    lines.push('| Category | Precision | Recall | F1 | Accuracy | FPR | FNR | Cases |');
    lines.push('|----------|-----------|--------|------|----------|-----|-----|-------|');

    for (const cat of result.categories) {
      lines.push(
        `| ${cat.category} | ${pct(cat.metrics.precision)} | ${pct(cat.metrics.recall)} | ${pct(cat.metrics.f1)} | ${pct(cat.metrics.accuracy)} | ${pct(cat.metrics.falsePositiveRate)} | ${pct(cat.metrics.falseNegativeRate)} | ${cat.totalCases} |`,
      );
    }

    lines.push('');

    // Confusion matrix
    const tp = result.details.filter((d) => d.classification === 'true-positive').length;
    const tn = result.details.filter((d) => d.classification === 'true-negative').length;
    const fp = result.details.filter((d) => d.classification === 'false-positive').length;
    const fn = result.details.filter((d) => d.classification === 'false-negative').length;

    lines.push('### Confusion Matrix');
    lines.push('');
    lines.push('| | Predicted Positive | Predicted Negative |');
    lines.push('|---|---|---|');
    lines.push(`| **Actual Positive** | TP: ${tp} | FN: ${fn} |`);
    lines.push(`| **Actual Negative** | FP: ${fp} | TN: ${tn} |`);
    lines.push('');

    // Failed cases
    const failedCases = result.details.filter((d) => !d.passed);
    if (failedCases.length > 0) {
      lines.push('### Failed Cases');
      lines.push('');
      lines.push('| ID | Classification | Description |');
      lines.push('|----|---------------|-------------|');
      for (const fc of failedCases.slice(0, 20)) {
        lines.push(`| ${fc.entry.id} | ${fc.classification} | ${fc.entry.description} |`);
      }
      if (failedCases.length > 20) {
        lines.push(`| ... | ... | ${failedCases.length - 20} more cases |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format a report in the specified format
 */
export function formatReport(
  report: CombinedReport,
  format: 'console' | 'json' | 'markdown',
): string {
  switch (format) {
    case 'console':
      return formatConsoleTable(report);
    case 'json':
      return formatJSON(report);
    case 'markdown':
      return formatMarkdownTable(report);
    default:
      return formatConsoleTable(report);
  }
}
