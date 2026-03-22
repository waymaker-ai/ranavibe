import type { ScanResult, ReportFormat } from '../types.js';
import { formatConsole } from './console.js';
import { formatJson } from './json.js';
import { formatSarif } from './sarif.js';
import { formatMarkdown } from './markdown.js';
import { formatGitHubPr } from './github.js';

/**
 * Format scan results using the specified format.
 */
export function formatReport(result: ScanResult, format: ReportFormat): string {
  switch (format) {
    case 'console':
      return formatConsole(result);
    case 'json':
      return formatJson(result);
    case 'sarif':
      return formatSarif(result);
    case 'markdown':
      return formatMarkdown(result);
    case 'github-pr':
      return formatGitHubPr(result);
    default:
      return formatConsole(result);
  }
}

export { formatConsole, formatJson, formatSarif, formatMarkdown, formatGitHubPr };
