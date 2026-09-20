/**
 * Agent-agnostic git pre-commit scanning.
 *
 * Ships as `aicofounder-ci precommit` — the highest-leverage coverage item
 * from the 2026-07-04 security hardening evaluation (P2-8): most coding
 * agents (Copilot, Aider, Codex, Continue, Zed, Amazon Q, ...) have no
 * Claude-Code-style blocking hook API at all, so the only way to protect a
 * repo against ALL of them at once is a last line of defense that doesn't
 * care which agent produced the diff — the commit boundary itself.
 *
 * Runs the same PRECOMMIT_RULES (secrets, unsafe .env files, mock data) the
 * Claude Code plugin's hooks enforce, but against the *staged* content
 * (`git show :<path>`), not the working tree — so it checks exactly what
 * will actually be committed, unaffected by unstaged edits sitting on top.
 */
import { execFileSync } from 'node:child_process';
import type { Finding, Severity } from './types.js';
import { PRECOMMIT_RULES } from './rules/index.js';
import { severityMeetsThreshold, SEVERITY_ORDER } from './types.js';

const PRECOMMIT_CONFIG = {
  scanPath: '.',
  rules: 'all' as const,
  failOn: 'high' as Severity,
  format: 'console' as const,
  commentOnPr: false,
  ignorePatterns: [],
};

export interface PrecommitResult {
  findings: Finding[];
  filesScanned: number;
  blocked: boolean;
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/** Staged files (added/copied/modified), excluding deletes and renames-only. */
export function getStagedFiles(cwd: string): string[] {
  const out = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'], cwd);
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** Staged content for one file — what will actually be committed, not the
 * working-tree version (which may have further unstaged edits on top). */
function getStagedContent(path: string, cwd: string): string | null {
  try {
    return git(['show', `:${path}`], cwd);
  } catch {
    return null; // binary content, or git couldn't read it — skip rather than crash
  }
}

const MAX_FILE_BYTES = 2 * 1024 * 1024; // skip anything over 2MB — not source code

export function runPrecommitScan(cwd: string = process.cwd()): PrecommitResult {
  const stagedFiles = getStagedFiles(cwd);
  const findings: Finding[] = [];
  let filesScanned = 0;

  for (const file of stagedFiles) {
    const content = getStagedContent(file, cwd);
    if (content === null) continue;
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) continue;
    // Binary files show up as content containing a NUL byte
    if (content.includes('\u0000')) continue;

    filesScanned++;
    for (const rule of PRECOMMIT_RULES) {
      const result = rule.run(file, content, PRECOMMIT_CONFIG);
      findings.push(...result.findings);
    }
  }

  const blocked = findings.some((f) => severityMeetsThreshold(f.severity, 'high'));

  return { findings, filesScanned, blocked };
}

export function formatPrecommitReport(result: PrecommitResult): string {
  if (result.findings.length === 0) {
    return `CoFounder pre-commit: ${result.filesScanned} file(s) checked, clean.`;
  }

  const sorted = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );

  const lines: string[] = [];
  lines.push(`CoFounder pre-commit: ${result.findings.length} finding(s) in ${result.filesScanned} file(s).`);
  lines.push('');
  for (const f of sorted) {
    const sevLabel = f.severity.toUpperCase().padEnd(8);
    lines.push(`  [${sevLabel}] ${f.file}:${f.line} — ${f.message}`);
    if (f.suggestion) lines.push(`             ${f.suggestion}`);
  }
  lines.push('');
  if (result.blocked) {
    lines.push('Commit blocked. Fix the findings above, or:');
    lines.push('  - git commit --no-verify to bypass this check (not recommended)');
  } else {
    lines.push('No blocking findings (medium/low severity only) — commit allowed.');
  }

  return lines.join('\n');
}
