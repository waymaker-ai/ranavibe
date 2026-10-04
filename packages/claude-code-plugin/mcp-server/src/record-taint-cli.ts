#!/usr/bin/env node
/**
 * Called from pre-edit-guardrails.sh after a write has passed every
 * blocking check (secrets, unsafe .env, scope). Never blocks — it only
 * records whether the just-written content is taint-worthy, so a later
 * shell command that tries to move this file's contents out can be
 * checked against it.
 *
 * Usage: node record-taint-cli.js <filePath> <repoRoot> <sessionId>
 * Content read from stdin. Always exits 0.
 */
import { classifySensitiveContent } from './content-sensitivity.js';
import { recordTaint } from './taint.js';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const [, , filePath, repoRoot, sessionId] = process.argv;
  if (!filePath || !repoRoot || !sessionId) {
    process.exit(0);
  }

  const content = await readStdin();
  const reasons = classifySensitiveContent(content);
  for (const reason of reasons) {
    recordTaint(repoRoot, sessionId, filePath, reason);
  }
  process.exit(0);
}

main().catch(() => process.exit(0)); // fail open — recording taint is best-effort
