import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runPrecommitScan } from './precommit.js';

let repo: string;

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'cofounder-precommit-test-'));
  git(['init', '-q']);
  git(['-c', 'user.email=t@t.com', '-c', 'user.name=t', 'commit', '--allow-empty', '-q', '-m', 'init']);
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('runPrecommitScan', () => {
  it('passes with no staged files', () => {
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(false);
    expect(result.filesScanned).toBe(0);
  });

  it('passes with a clean staged file', () => {
    writeFileSync(join(repo, 'app.ts'), 'export const x = 1;\n');
    git(['add', 'app.ts']);
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(false);
    expect(result.filesScanned).toBe(1);
  });

  it('blocks a staged secret', () => {
    writeFileSync(join(repo, 'app.ts'), "const key = 'sk-ant-abcdefghijklmnopqrstuvwxyz';\n");
    git(['add', 'app.ts']);
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(true);
    expect(result.findings.some((f) => f.rule === 'no-hardcoded-keys')).toBe(true);
  });

  it('blocks a staged unsafe .env file', () => {
    writeFileSync(join(repo, '.env'), 'DATABASE_URL=postgresql://u:p@h/db\n');
    git(['add', '-f', '.env']);
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(true);
    expect(result.findings.some((f) => f.rule === 'no-unsafe-env-file')).toBe(true);
  });

  it('allows a staged .env.example', () => {
    writeFileSync(join(repo, '.env.example'), 'DATABASE_URL=\n');
    git(['add', '.env.example']);
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(false);
  });

  it('only scans staged content, not further unstaged edits on top', () => {
    writeFileSync(join(repo, 'app.ts'), 'export const x = 1;\n');
    git(['add', 'app.ts']);
    // Unstaged edit adds a secret AFTER staging — precommit should see the
    // staged (clean) version, not this working-tree version.
    writeFileSync(join(repo, 'app.ts'), "const key = 'sk-ant-abcdefghijklmnopqrstuvwxyz';\n");
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(false);
  });

  it('does not scan unstaged files', () => {
    writeFileSync(join(repo, 'untouched.ts'), "const key = 'sk-ant-abcdefghijklmnopqrstuvwxyz';\n");
    const result = runPrecommitScan(repo);
    expect(result.filesScanned).toBe(0);
    expect(result.blocked).toBe(false);
  });

  it('does not block on medium-severity-only findings (mock data)', () => {
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src', 'app.ts'), 'export const mockUsers = [];\n');
    git(['add', 'src/app.ts']);
    const result = runPrecommitScan(repo);
    expect(result.blocked).toBe(false);
    expect(result.findings.some((f) => f.rule === 'no-mock-data-in-prod')).toBe(true);
  });
});
