#!/usr/bin/env node
/**
 * P1-7 from the 2026-07-04 security hardening evaluation: PII is never
 * checked at agent-edit time. The runtime PII libraries only run if the
 * host app wires them into its request path — they never see an agent
 * writing a hardcoded SSN into a fixture or a prompt template.
 *
 * Called from pre-edit-guardrails.sh. Reuses the same PII classifier the
 * taint tracker uses (content-sensitivity.ts) — deliberately narrow for
 * v1 (email + US SSN; phone / credit-card have far higher false-positive
 * rates and are a scoped-out follow-up, not silently included).
 *
 * Mode, per the doc: `warn` by default, `block` when a .cofounder.yml /
 * .aicofounder.yml in scope declares a compliance framework of `hipaa` or
 * `gdpr` (or an explicit `pii: { mode: block }`).
 *
 * Usage: node check-pii-cli.js <filePath> <repoRoot>
 * Content on stdin.
 *   Exit 0 — allowed. If PII was found in warn mode, reasons go to stderr
 *            prefixed "WARN" (the hook surfaces them without blocking).
 *   Exit 2 — blocked (PII found AND compliance mode active); reasons on stderr.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { classifySensitiveContent } from './content-sensitivity.js';

type Mode = 'warn' | 'block';

const COMPLIANCE_TRIGGERS = new Set(['hipaa', 'gdpr']);

function findConfig(startDir: string): unknown | null {
  let dir = resolve(startDir);
  while (true) {
    for (const name of ['.cofounder.yml', '.aicofounder.yml']) {
      const path = join(dir, name);
      if (existsSync(path)) {
        try {
          return parseYaml(readFileSync(path, 'utf8'));
        } catch {
          return null; // malformed config — treat as absent, don't crash
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function resolveMode(config: unknown): Mode {
  if (!config || typeof config !== 'object') return 'warn';
  const c = config as Record<string, unknown>;

  // Explicit override: pii: { mode: warn | block }
  const pii = c.pii as Record<string, unknown> | undefined;
  if (pii && (pii.mode === 'warn' || pii.mode === 'block')) return pii.mode;

  // compliance.frameworks: [hipaa, gdpr, ...]  (the shape the doc names)
  const compliance = c.compliance as Record<string, unknown> | undefined;
  const frameworks = [
    ...asStringArray(compliance?.frameworks),
    // also accept security.compliance: [...] (the VibeSpec schema's shape)
    ...asStringArray((c.security as Record<string, unknown> | undefined)?.compliance),
  ].map((s) => s.toLowerCase());

  if (frameworks.some((f) => COMPLIANCE_TRIGGERS.has(f))) return 'block';
  return 'warn';
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const [, , filePath, repoRoot] = process.argv;
  if (!filePath || !repoRoot) process.exit(0);

  const content = await readStdin();
  const piiReasons = classifySensitiveContent(content).filter((r) => r.startsWith('pii:'));
  if (piiReasons.length === 0) process.exit(0);

  const mode = resolveMode(findConfig(dirname(resolve(filePath))));
  const kinds = piiReasons.map((r) => r.slice('pii:'.length)).join(', ');

  if (mode === 'block') {
    process.stderr.write(
      `PII (${kinds}) detected in ${filePath}. Blocked — a .cofounder.yml in scope declares a hipaa/gdpr compliance framework. ` +
        `Remove the PII, or set \`pii: { mode: warn }\` if this is intentional test data.\n`,
    );
    process.exit(2);
  }

  process.stderr.write(
    `WARN: PII (${kinds}) detected in ${filePath}. Not blocked (no compliance framework declared). ` +
      `Verify this isn't real personal data being committed.\n`,
  );
  process.exit(0);
}

main().catch(() => process.exit(0)); // fail open
