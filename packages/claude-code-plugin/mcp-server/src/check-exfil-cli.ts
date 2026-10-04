#!/usr/bin/env node
/**
 * Called from pre-bash-guardrails.sh on every Bash command. Blocks when a
 * command looks exfil-shaped (curl POST, scp, rsync to a remote, etc.) AND
 * references a file this session tainted earlier (via record-taint-cli).
 *
 * Usage: node check-exfil-cli.js <command> <repoRoot> <sessionId>
 *
 * Exit 0 — allowed (not exfil-shaped, no taint match, or no session)
 * Exit 1 — blocked; reason on stderr, naming the earlier taint event
 */
import { getTaintEvents, findTaintedReference, looksExfilShaped } from './taint.js';

function main() {
  const [, , command, repoRoot, sessionId] = process.argv;
  if (!command || !repoRoot || !sessionId) {
    process.exit(0);
  }

  if (!looksExfilShaped(command)) {
    process.exit(0);
  }

  const events = getTaintEvents(repoRoot, sessionId);
  if (events.length === 0) {
    process.exit(0);
  }

  const match = findTaintedReference(command, events);
  if (!match) {
    process.exit(0);
  }

  process.stderr.write(
    `This command references ${match.file}, which this session wrote ${match.reason}-shaped content into ` +
      `at ${match.timestamp}, and the command looks like it sends data to an external destination.\n`,
  );
  process.exit(1);
}

try {
  main();
} catch {
  process.exit(0); // fail open — a bug here shouldn't block every exfil-shaped command forever
}
