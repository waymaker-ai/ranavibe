import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { installGitHook, HOOK_MARKER } from './install-hook.js';

let repo: string;

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'cofounder-installhook-test-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('installGitHook', () => {
  it('fails outside a git repo', () => {
    const notARepo = mkdtempSync(join(tmpdir(), 'not-a-repo-'));
    try {
      const result = installGitHook(notARepo);
      expect(result.installed).toBe(false);
      expect(result.reason).toMatch(/not a git repository/);
    } finally {
      rmSync(notARepo, { recursive: true, force: true });
    }
  });

  it('installs a fresh hook', () => {
    const result = installGitHook(repo);
    expect(result.installed).toBe(true);
    expect(existsSync(result.path)).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toContain(HOOK_MARKER);
  });

  it('refuses to reinstall without --force', () => {
    installGitHook(repo);
    const second = installGitHook(repo);
    expect(second.installed).toBe(false);
    expect(second.reason).toMatch(/already installed/);
  });

  it('reinstalls with force', () => {
    installGitHook(repo);
    const second = installGitHook(repo, true);
    expect(second.installed).toBe(true);
  });

  it('refuses to clobber a hook it did not install', () => {
    const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: repo, encoding: 'utf8' }).trim();
    const hooksDir = join(repo, gitDir, 'hooks');
    mkdirSync(hooksDir, { recursive: true });
    writeFileSync(join(hooksDir, 'pre-commit'), '#!/usr/bin/env sh\necho "existing custom hook"\n');

    const result = installGitHook(repo);
    expect(result.installed).toBe(false);
    expect(result.reason).toMatch(/not installed by this tool/);
  });

  it('overwrites a foreign hook with --force', () => {
    const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: repo, encoding: 'utf8' }).trim();
    const hooksDir = join(repo, gitDir, 'hooks');
    mkdirSync(hooksDir, { recursive: true });
    writeFileSync(join(hooksDir, 'pre-commit'), '#!/usr/bin/env sh\necho "existing custom hook"\n');

    const result = installGitHook(repo, true);
    expect(result.installed).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toContain(HOOK_MARKER);
  });
});
