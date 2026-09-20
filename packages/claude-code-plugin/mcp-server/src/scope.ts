/**
 * Shared VibeSpec scope-checking logic.
 *
 * Extracted from index.ts's tool_validateAgainstVibe so the exact same
 * matching logic can be reused by the deterministic enforcement CLI
 * (enforce-scope-cli.ts, invoked from the Claude Code plugin hooks) instead
 * of being duplicated. Before this, `validateAgainstVibe` could only
 * report scope violations as advice — nothing actually blocked an agent
 * from editing outside its declared scope.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { parse as parseYaml } from "yaml";

export interface VibeScopeRules {
  allowedPaths?: string[];
  forbiddenPaths?: string[];
  requireChangesetApproval?: boolean;
}

export interface VibeSpecDoc {
  id?: string;
  name?: string;
  vibe?: {
    scopeRules?: VibeScopeRules;
    dataRules?: { forbidMockInProd?: boolean; forbidHardcodedCredentials?: boolean };
    designSystem?: { forbidRawColors?: boolean };
  };
}

/** Minimal glob matcher — supports ** and *. */
export function matchesGlob(path: string, pattern: string): boolean {
  const re = new RegExp(
    "^" +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "§§")
        .replace(/\*/g, "[^/]*")
        .replace(/§§/g, ".*") +
      "$",
  );
  return re.test(path);
}

export function findVibeSpecs(root: string): string[] {
  const candidates: string[] = [];
  for (const dir of ["specs/vibes", "config/vibes", ".cofounder/vibes"]) {
    const full = join(root, dir);
    if (existsSync(full) && statSync(full).isDirectory()) {
      for (const f of readdirSync(full)) {
        if (f.endsWith(".yml") || f.endsWith(".yaml")) {
          candidates.push(join(full, f));
        }
      }
    }
  }
  return candidates;
}

export function loadVibeSpec(path: string): VibeSpecDoc {
  return parseYaml(readFileSync(path, "utf8")) as VibeSpecDoc;
}

export interface ScopeCheckResult {
  blocked: boolean;
  /** Human-readable reason, present when blocked. */
  reason?: string;
  /** The VibeSpec id that produced the block, present when blocked. */
  vibeId?: string;
  vibePath?: string;
}

/**
 * Check a single file path against every VibeSpec in the repo that declares
 * scopeRules. Returns the first blocking match, if any.
 *
 * A file is "in scope" for a given vibe when:
 *   - the vibe has no scopeRules at all (nothing to enforce), OR
 *   - allowedPaths is unset AND the file doesn't match forbiddenPaths, OR
 *   - allowedPaths is set AND the file matches at least one allowedPaths
 *     glob AND does not match any forbiddenPaths glob.
 *
 * Vibes with no scopeRules are silently skipped — this only enforces vibes
 * that opted in.
 */
export function checkFileScope(filePath: string, root: string): ScopeCheckResult {
  const absRoot = resolve(root);
  const relPath = filePath.startsWith(absRoot) ? relative(absRoot, filePath) : filePath;

  for (const specPath of findVibeSpecs(absRoot)) {
    let vibe: VibeSpecDoc;
    try {
      vibe = loadVibeSpec(specPath);
    } catch {
      continue; // malformed spec — don't let a bad YAML file break enforcement
    }
    const scope = vibe.vibe?.scopeRules;
    if (!scope || (!scope.allowedPaths && !scope.forbiddenPaths)) continue;

    const forbidden = (scope.forbiddenPaths ?? []).some((pat) => matchesGlob(relPath, pat));
    const allowed = scope.allowedPaths ? scope.allowedPaths.some((pat) => matchesGlob(relPath, pat)) : true;

    if (forbidden || !allowed) {
      return {
        blocked: true,
        vibeId: vibe.id,
        vibePath: relative(absRoot, specPath),
        reason: forbidden
          ? `${relPath} matches a forbiddenPaths rule in VibeSpec "${vibe.id}"`
          : `${relPath} is outside the allowedPaths declared by VibeSpec "${vibe.id}"`,
      };
    }
  }

  return { blocked: false };
}
