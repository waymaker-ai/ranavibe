/**
 * @ranavibe/ci - Type definitions
 * Zero-dependency CI guardrails for AI applications
 */

/** Severity levels for findings */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Output format for reports */
export type ReportFormat = 'console' | 'json' | 'sarif' | 'markdown' | 'github-pr';

/** A single finding from scanning */
export interface Finding {
  /** Absolute or relative file path */
  file: string;
  /** 1-based line number */
  line: number;
  /** 1-based column number */
  column: number;
  /** Rule ID that generated this finding (e.g. "no-hardcoded-keys") */
  rule: string;
  /** Severity of the finding */
  severity: Severity;
  /** Human-readable message describing the finding */
  message: string;
  /** Optional suggested fix */
  suggestion?: string;
  /** The matched source text (snippet) */
  source?: string;
}

/** Result of a full scan */
export interface ScanResult {
  /** All findings from all rules */
  findings: Finding[];
  /** Total files scanned */
  filesScanned: number;
  /** Total rules applied */
  rulesApplied: number;
  /** Scan duration in milliseconds */
  durationMs: number;
  /** Whether the scan passed (no findings at or above fail-on severity) */
  passed: boolean;
  /** Summary counts by severity */
  summary: Record<Severity, number>;
}

/** Definition of a scanning rule */
export interface RuleDefinition {
  /** Unique rule ID (e.g. "no-hardcoded-keys") */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Detailed description */
  description: string;
  /** Default severity */
  severity: Severity;
  /** File extensions this rule applies to (e.g. [".ts", ".js"]) */
  fileExtensions: string[];
  /** Run the rule against a single file's content */
  run(filePath: string, content: string, config: ScanConfig): RuleResult;
}

/** Result from running a single rule on a single file */
export interface RuleResult {
  /** Findings from this rule */
  findings: Finding[];
}

/** Configuration for a scan */
export interface ScanConfig {
  /** Path to scan */
  scanPath: string;
  /** Rules to enable ("all" or list of rule IDs) */
  rules: string[] | 'all';
  /** Minimum severity to fail on */
  failOn: Severity;
  /** Output format */
  format: ReportFormat;
  /** Path to .rana.yml config file */
  configPath?: string;
  /** Whether to comment on PRs */
  commentOnPr: boolean;
  /** GitHub token for API calls */
  githubToken?: string;
  /** Approved model list (overrides default) */
  approvedModels?: string[];
  /** Monthly budget limit in USD */
  budgetLimit?: number;
  /** Patterns to ignore (from .ranaignore) */
  ignorePatterns: string[];
}

/** GitHub Action context parsed from environment */
export interface GitHubContext {
  token?: string;
  eventPath?: string;
  repository?: string;
  sha?: string;
  ref?: string;
  pullRequestNumber?: number;
  owner?: string;
  repo?: string;
  runId?: string;
  serverUrl: string;
  apiUrl: string;
}

/** Structure of .rana.yml configuration */
export interface RanaConfig {
  rules?: {
    [ruleId: string]: {
      enabled?: boolean;
      severity?: Severity;
      options?: Record<string, unknown>;
    };
  };
  scan?: {
    include?: string[];
    exclude?: string[];
    extensions?: string[];
  };
  models?: {
    approved?: string[];
    blocked?: string[];
  };
  budget?: {
    monthly?: number;
    perCall?: number;
  };
  ignore?: string[];
}

/** Severity ordering for comparison */
export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/** Check if a severity meets or exceeds a threshold */
export function severityMeetsThreshold(severity: Severity, threshold: Severity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[threshold];
}
