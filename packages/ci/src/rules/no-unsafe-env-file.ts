import type { RuleDefinition, RuleResult, Finding, ScanConfig } from '../types.js';

/**
 * Flags a staged .env* file by name alone (no content inspection needed):
 * a file only reaches `git diff --cached` if `git add` accepted it, which
 * means it either isn't gitignored, or someone force-added an ignored file
 * — both cases worth a hard stop before commit. Safe-by-convention names
 * (mirrored from the Claude Code plugin's pre-edit-guardrails.sh) are
 * excluded so this can't block the exact files it recommends using instead.
 */
const SAFE_ENV_NAMES = new Set(['.env.example', '.env.sample', '.env.template']);

function isSafeEnvName(basename: string): boolean {
  if (SAFE_ENV_NAMES.has(basename)) return true;
  // .env.local, .env.<anything>.local
  if (basename === '.env.local' || /^\.env\..+\.local$/.test(basename)) return true;
  return false;
}

export const noUnsafeEnvFile: RuleDefinition = {
  id: 'no-unsafe-env-file',
  name: 'No Unsafe .env File Staged',
  description: 'Block committing a .env* file that is not one of the safe-by-convention names.',
  severity: 'critical',
  fileExtensions: [], // matched by filename, not extension — see run()

  run(filePath: string, _content: string, _config: ScanConfig): RuleResult {
    const basename = filePath.split('/').pop() || '';
    if (!basename.startsWith('.env')) return { findings: [] };
    if (isSafeEnvName(basename)) return { findings: [] };

    const findings: Finding[] = [
      {
        file: filePath,
        line: 1,
        column: 1,
        rule: 'no-unsafe-env-file',
        severity: 'critical',
        message: `${basename} is staged for commit. Env files should stay gitignored (.env.local, .env.*.local) — only .env.example/.env.sample/.env.template belong in version control.`,
        suggestion: 'git restore --staged this file, add it to .gitignore, and use .env.local for real values.',
      },
    ];

    return { findings };
  },
};

export default noUnsafeEnvFile;
