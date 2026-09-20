/**
 * Session-scoped taint tracking.
 *
 * Every other guardrail in this plugin is point-in-time: it inspects one
 * edit, or one shell command, in isolation. That structurally can't catch
 * the pattern a competing tool (Harden AIF) demonstrated publicly in
 * 2026-09: an agent writes customer emails into a diagnostic file while
 * debugging, then — HOURS later, in an unrelated-looking step — uploads
 * that file to an external service. Nothing in the upload command itself
 * looks dangerous; the danger is in what an earlier action put into the
 * file it's now moving.
 *
 * This module gives the hooks a minimal memory: when a write contains a
 * secret or PII pattern, record it; when a later shell command looks like
 * it moves data out (curl POST, scp, rsync to a remote host, etc.) and
 * references a tainted path, block it and name the edit that tainted it.
 *
 * State lives at .cofounder/taint/<session_id>.jsonl inside the repo —
 * scoped per Claude Code session (session_id from the hook's stdin JSON)
 * so concurrent sessions in the same repo, or the same session in a
 * different repo, never cross-contaminate.
 */
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export interface TaintEvent {
  file: string;
  reason: string;
  timestamp: string;
}

export function taintLogPath(repoRoot: string, sessionId: string): string {
  return join(resolve(repoRoot), '.cofounder', 'taint', `${sessionId}.jsonl`);
}

export function getTaintEvents(repoRoot: string, sessionId: string): TaintEvent[] {
  const path = taintLogPath(repoRoot, sessionId);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  const events: TaintEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as TaintEvent);
    } catch {
      // one malformed line shouldn't invalidate the rest of the log
    }
  }
  return events;
}

export function recordTaint(repoRoot: string, sessionId: string, filePath: string, reason: string): void {
  const absRoot = resolve(repoRoot);
  const relPath = filePath.startsWith(absRoot) ? relative(absRoot, filePath) : filePath;
  const path = taintLogPath(absRoot, sessionId);
  mkdirSync(dirname(path), { recursive: true });
  const event: TaintEvent = { file: relPath, reason, timestamp: new Date().toISOString() };
  appendFileSync(path, JSON.stringify(event) + '\n');
}

/**
 * Does any tainted file appear to be referenced by this command? Exact
 * argument parsing is fragile across curl/scp/rsync/aws-cli's differing
 * syntaxes (-F file=@path, path host:, --upload-file path, ...) — a
 * substring check against the full command text is the pragmatic,
 * good-enough heuristic: false negatives (a path referenced in a way that
 * doesn't literally appear, e.g. via a shell variable) are possible, false
 * positives are not (the exact path or its basename must appear).
 */
export function findTaintedReference(command: string, events: TaintEvent[]): TaintEvent | null {
  for (const event of events) {
    const basename = event.file.split('/').pop() || event.file;
    if (command.includes(event.file) || (basename && command.includes(basename))) {
      return event;
    }
  }
  return null;
}

/** Command shapes that plausibly move data to an external destination. */
const EXFIL_SHAPE_PATTERNS: RegExp[] = [
  /\bcurl\b.*(-X\s*POST|-X\s*PUT|--data|--data-binary|--data-raw|-F\s|--upload-file|-T\s)/i,
  /\bwget\b.*(--post-data|--post-file)/i,
  /\bscp\b.+:/, // scp <local> <host>:<remote>
  /\brsync\b.+:/, // rsync <local> <host>:<remote>
  /\baws\s+s3\s+cp\b/i,
  /\bgh\s+gist\s+create\b/i,
  /\bnc\b.+\|/, // netcat piping data out
];

export function looksExfilShaped(command: string): boolean {
  return EXFIL_SHAPE_PATTERNS.some((p) => p.test(command));
}
