/**
 * Installs a git pre-commit hook that runs `aicofounder-ci precommit`.
 *
 * Deliberately not husky/lefthook-only: teams without either just get a
 * plain `.git/hooks/pre-commit`. See README.md for the husky/lefthook
 * recipes for teams that already manage hooks that way (this installer
 * would overwrite a husky-managed hook file, so it warns instead of
 * clobbering one it detects).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

export const HOOK_MARKER = '# installed-by: aicofounder-ci install-hook';

export const HOOK_SCRIPT = `#!/usr/bin/env sh
${HOOK_MARKER}
# Re-run \`aicofounder-ci install-hook --force\` to update; don't edit by
# hand — local customization belongs in .cofounder.yml (see PRECOMMIT_RULES
# docs). Bypass for a single commit: git commit --no-verify.
if [ -x "./node_modules/.bin/aicofounder-ci" ]; then
  ./node_modules/.bin/aicofounder-ci precommit
else
  npx --yes @waymakerai/aicofounder-ci precommit
fi
`;

export interface InstallResult {
  installed: boolean;
  path: string;
  reason?: string;
}

function gitDir(cwd: string): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', '--git-dir'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return join(cwd, out);
  } catch {
    return null;
  }
}

export function installGitHook(cwd: string = process.cwd(), force = false): InstallResult {
  const dotGit = gitDir(cwd);
  if (!dotGit) {
    return { installed: false, path: '', reason: 'not a git repository (git rev-parse --git-dir failed)' };
  }

  const hooksDir = join(dotGit, 'hooks');
  const hookPath = join(hooksDir, 'pre-commit');

  if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });

  if (existsSync(hookPath) && !force) {
    const existing = readFileSync(hookPath, 'utf8');
    if (existing.includes(HOOK_MARKER)) {
      return { installed: false, path: hookPath, reason: 'already installed (use --force to reinstall)' };
    }
    return {
      installed: false,
      path: hookPath,
      reason: 'a pre-commit hook already exists at this path and was not installed by this tool — use --force to overwrite, or add `npx aicofounder-ci precommit` to it manually (e.g. inside .husky/pre-commit)',
    };
  }

  writeFileSync(hookPath, HOOK_SCRIPT, { mode: 0o755 });
  chmodSync(hookPath, 0o755);
  return { installed: true, path: hookPath };
}
