import type { Finding, GitHubContext, Severity } from '../types.js';

/** Map severity to GitHub annotation level */
function toAnnotationLevel(severity: Severity): 'failure' | 'warning' | 'notice' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'failure';
    case 'medium':
      return 'warning';
    case 'low':
    case 'info':
      return 'notice';
  }
}

interface CheckAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  annotation_level: 'failure' | 'warning' | 'notice';
  message: string;
  title: string;
  raw_details?: string;
}

/**
 * Make a GitHub API request using native fetch.
 */
async function githubFetch(
  url: string,
  token: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

/**
 * Create a GitHub Check Run with file-level annotations.
 *
 * Uses the GitHub Checks API to attach annotations to specific files/lines.
 * This shows up in the PR's "Checks" tab and inline in file diffs.
 */
export async function createCheckRun(
  context: GitHubContext,
  findings: Finding[],
  passed: boolean,
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!context.token) {
    return { success: false, error: 'No GitHub token provided' };
  }
  if (!context.owner || !context.repo || !context.sha) {
    return { success: false, error: 'Missing repository context (owner/repo/sha)' };
  }

  // GitHub Checks API limits annotations to 50 per request
  const MAX_ANNOTATIONS = 50;

  const annotations: CheckAnnotation[] = findings
    .slice(0, MAX_ANNOTATIONS)
    .map(f => ({
      path: f.file,
      start_line: f.line,
      end_line: f.line,
      start_column: f.column,
      annotation_level: toAnnotationLevel(f.severity),
      message: f.message + (f.suggestion ? `\n\nSuggestion: ${f.suggestion}` : ''),
      title: `${f.rule}: ${f.severity.toUpperCase()}`,
      raw_details: f.source,
    }));

  const summaryParts: string[] = [];
  const sevCounts: Record<string, number> = {};
  for (const f of findings) {
    sevCounts[f.severity] = (sevCounts[f.severity] || 0) + 1;
  }
  for (const [sev, count] of Object.entries(sevCounts)) {
    summaryParts.push(`${sev}: ${count}`);
  }

  const summary = findings.length === 0
    ? 'No findings. All AI guardrail checks passed!'
    : `Found ${findings.length} issue(s): ${summaryParts.join(', ')}`;

  const truncatedNote = findings.length > MAX_ANNOTATIONS
    ? `\n\n*Showing first ${MAX_ANNOTATIONS} of ${findings.length} annotations.*`
    : '';

  try {
    const url = `${context.apiUrl}/repos/${context.owner}/${context.repo}/check-runs`;
    const { status, data } = await githubFetch(url, context.token, {
      method: 'POST',
      body: {
        name: 'RANA CI - AI Guardrails',
        head_sha: context.sha,
        status: 'completed',
        conclusion: passed ? 'success' : 'failure',
        output: {
          title: passed ? 'RANA CI: All checks passed' : 'RANA CI: Issues found',
          summary: summary + truncatedNote,
          annotations,
        },
      },
    });

    if (status === 201) {
      const htmlUrl = (data as Record<string, unknown>)?.html_url as string | undefined;
      return { success: true, url: htmlUrl };
    }

    return { success: false, error: `Failed to create check run: HTTP ${status}` };
  } catch (err) {
    return {
      success: false,
      error: `GitHub API error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Output findings as GitHub Actions workflow commands (::warning, ::error).
 * These create inline annotations without needing the Checks API.
 */
export function outputWorkflowCommands(findings: Finding[]): string {
  const lines: string[] = [];

  for (const f of findings) {
    const level = f.severity === 'critical' || f.severity === 'high'
      ? 'error'
      : f.severity === 'medium'
        ? 'warning'
        : 'notice';

    const title = `[${f.rule}] ${f.severity.toUpperCase()}`;
    lines.push(
      `::${level} file=${f.file},line=${f.line},col=${f.column},title=${title}::${f.message}`
    );
  }

  return lines.join('\n');
}
