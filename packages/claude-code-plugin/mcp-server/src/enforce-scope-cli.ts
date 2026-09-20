#!/usr/bin/env node
/**
 * Deterministic scope-enforcement CLI, invoked from the Claude Code plugin's
 * bash hooks (pre-edit-guardrails.sh, pre-bash-guardrails.sh).
 *
 * Turns `cofounder.validateAgainstVibe`'s scope check from advisory (a tool
 * the agent may or may not call) into enforcement (a hook that always runs
 * and can block). Reuses the exact same matching logic via ./scope.js so
 * the two never disagree about what's in scope.
 *
 * Usage: node enforce-scope-cli.js <filePath> [repoRoot]
 *
 * Exit 0  — allowed (no vibe declares scopeRules, or the file is in scope)
 * Exit 1  — blocked (a VibeSpec's scopeRules exclude this file); reason on stderr
 * Exit 0  — also used when nothing can be determined (missing args, no
 *           VibeSpecs found) — this CLI fails open, matching the fallback
 *           posture of the secret-scan hooks (degrade gracefully rather
 *           than block on infrastructure trouble).
 */
import { checkFileScope } from "./scope.js";

const [, , filePath, repoRootArg] = process.argv;

if (!filePath) {
  process.exit(0);
}

const repoRoot = repoRootArg || process.cwd();

try {
  const result = checkFileScope(filePath, repoRoot);
  if (result.blocked) {
    process.stderr.write(`${result.reason} (see ${result.vibePath})\n`);
    process.exit(1);
  }
  process.exit(0);
} catch {
  // Fail open — a bug in enforcement shouldn't turn into a denial-of-service
  // against every edit in the repo.
  process.exit(0);
}
