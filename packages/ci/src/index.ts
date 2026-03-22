/**
 * @cofounder/ci - CI/CD guardrails for AI applications
 *
 * Zero runtime dependencies. Scans your codebase for AI security,
 * compliance, cost, and safety issues.
 */

// Types
export type {
  Finding,
  ScanResult,
  RuleDefinition,
  RuleResult,
  ScanConfig,
  ReportFormat,
  Severity,
  GitHubContext,
  CoFounderConfig,
} from './types.js';

export { SEVERITY_ORDER, severityMeetsThreshold } from './types.js';

// Rules
export {
  ALL_RULES,
  RULES_MAP,
  getRules,
  noHardcodedKeys,
  noPiiInPrompts,
  noInjectionVuln,
  approvedModels,
  costEstimation,
  safeDefaults,
} from './rules/index.js';

// Scanners
export {
  scanFiles,
  collectFiles,
  readFileSafe,
  loadIgnorePatterns,
  detectPromptTemplates,
  scanPromptTemplates,
  validateConfig,
  loadConfig,
  parseSimpleYaml,
} from './scanners/index.js';

// Reporters
export {
  formatReport,
  formatConsole,
  formatJson,
  formatSarif,
  formatMarkdown,
  formatGitHubPr,
} from './reporters/index.js';

// GitHub integration
export {
  postOrUpdateComment,
  parsePrNumber,
  createCheckRun,
  outputWorkflowCommands,
} from './github/index.js';

// Main scan function
import * as path from 'node:path';
import type { ScanConfig, ScanResult, Severity, GitHubContext } from './types.js';
import { severityMeetsThreshold } from './types.js';
import { getRules } from './rules/index.js';
import { scanFiles } from './scanners/file-scanner.js';
import { validateConfig, loadConfig } from './scanners/config-scanner.js';
import { formatReport } from './reporters/index.js';

/**
 * Run a full scan with the given configuration.
 */
export function scan(config: ScanConfig): ScanResult {
  const startTime = Date.now();

  // Load .cofounder.yml if it exists
  const cofounderConfig = config.configPath ? loadConfig(config.configPath) : null;

  // Merge config from .cofounder.yml
  if (cofounderConfig) {
    if (cofounderConfig.models?.approved && !config.approvedModels) {
      config.approvedModels = cofounderConfig.models.approved;
    }
    if (cofounderConfig.budget?.monthly && !config.budgetLimit) {
      config.budgetLimit = cofounderConfig.budget.monthly;
    }
    if (cofounderConfig.ignore) {
      config.ignorePatterns = [...config.ignorePatterns, ...cofounderConfig.ignore];
    }
  }

  // Get rules
  const rules = getRules(config.rules);

  // Scan files
  const { findings, filesScanned } = scanFiles(config, rules);

  // Also include config validation findings
  if (config.configPath) {
    const configFindings = validateConfig(config.configPath);
    findings.push(...configFindings);
  }

  // Calculate summary
  const summary: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) {
    summary[f.severity]++;
  }

  // Determine if scan passed
  const passed = !findings.some(f => severityMeetsThreshold(f.severity, config.failOn));

  const durationMs = Date.now() - startTime;

  return {
    findings,
    filesScanned,
    rulesApplied: rules.length,
    durationMs,
    passed,
    summary,
  };
}

/**
 * Parse GitHub Actions context from environment variables.
 */
export function parseGitHubContext(): GitHubContext {
  const env = process.env;
  const repository = env.GITHUB_REPOSITORY || '';
  const [owner, repo] = repository.split('/');

  let pullRequestNumber: number | undefined;
  if (env.GITHUB_EVENT_PATH) {
    try {
      const fs = require('node:fs');
      const event = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf-8'));
      pullRequestNumber = event?.pull_request?.number ?? event?.issue?.number;
    } catch {
      // Ignore
    }
  }

  return {
    token: env.GITHUB_TOKEN || env.INPUT_GITHUB_TOKEN,
    eventPath: env.GITHUB_EVENT_PATH,
    repository,
    sha: env.GITHUB_SHA,
    ref: env.GITHUB_REF,
    pullRequestNumber,
    owner,
    repo,
    runId: env.GITHUB_RUN_ID,
    serverUrl: env.GITHUB_SERVER_URL || 'https://github.com',
    apiUrl: env.GITHUB_API_URL || 'https://api.github.com',
  };
}

/**
 * Run scan and produce formatted output. Returns the ScanResult and formatted string.
 */
export function runAndFormat(config: ScanConfig): { result: ScanResult; output: string } {
  const result = scan(config);
  const output = formatReport(result, config.format);
  return { result, output };
}
