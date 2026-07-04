---
name: cofounder-sandbox-preview
description: "Use this skill BEFORE running anything destructive — migrations, data backfills, mass renames, deletions, scripts that touch external services. Runs the operation in `@waymakerai/aicofounder-sandbox` and reports what would happen, without touching the real environment. Required for any skill marked `sensitivity.runsShell: true`."
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: true
modelClass: mid
emits: [skill.run, sandbox.preview.complete, sandbox.violation]
---

# CoFounder: Sandbox Preview

You preview destructive operations in isolation before they touch reality. The hard rule: **never run the real command if the sandbox preview surfaces a violation, an unexpected side effect, or any output that doesn't match what the user expects.**

## When to invoke

- The agent is about to run a database migration.
- The agent is about to run a script that mutates files at scale (`scripts/backfill-*.ts`, `scripts/migrate-*.ts`).
- The agent is about to call a third-party API that has side effects (Stripe charges, email sends).
- The user says "preview this", "dry-run", "what would this do?".
- Any skill with `sensitivity.runsShell: true` should chain to this skill before executing.

## Process

### Step 1 — Identify the operation

What is the agent about to run? Capture:
- The exact command or function call.
- The arguments.
- The environment / working directory.
- Expected side effects (files written, rows changed, requests sent).

If the operation is genuinely read-only, this skill isn't needed — say so and exit.

### Step 2 — Pick a sandbox policy

`@waymakerai/aicofounder-sandbox` ships these named presets — pick the strictest one that still lets the operation observe what it needs:

| Policy | When to use |
|---|---|
| `restrictedAgent` | Default for unknown / untrusted code. Read-only fs, no network, no spawn. |
| `sandboxed` | Stricter than `restrictedAgent`. Use when you want maximum isolation. |
| `ciRunner` | Use when the operation needs to run tests / build commands — narrowly scoped network. |
| `openAgent` | Most permissive. Use only after a `restrictedAgent` preview has already been clean. |
| `defaultPolicy` | Reasonable default for most cases. |

If none fit exactly, derive an inline policy with `parsePolicy()` and the **minimum** permissions needed.

### Step 3 — Run the preview

```ts
import { Sandbox, restrictedAgent } from '@waymakerai/aicofounder-sandbox';

const sandbox = new Sandbox({
  policy: restrictedAgent,
  workingDir: './workspace-snapshot',  // a copy, not the real workspace
  env: { NODE_ENV: 'sandbox' },
});

const result = await sandbox.run(commandOrCode);
```

For DB migrations, route through the migration tool's dry-run mode (`prisma migrate diff`, `drizzle-kit generate`, etc.) inside the sandbox.

### Step 4 — Diff the outcome

Compare the sandbox's after-state against its before-state:
- Files created / modified / deleted.
- DB schema delta.
- Network calls attempted (should be zero unless explicitly allowed).
- Sandbox violations.

### Step 5 — Report

```markdown
# Sandbox Preview: <operation>

**Outcome:** SAFE TO RUN | NEEDS REVIEW | BLOCKED

## What would happen

- 14 files would be modified (`src/components/**/*.tsx`)
- 2 files would be deleted (`src/legacy/old.tsx`, `src/legacy/older.tsx`)
- 1 migration would be applied (adds column `users.invited_by`)
- 0 network requests outside DB

## Sandbox violations

- None ✅

## Risks I flag

- The migration adds a NOT NULL column without a default. **This will fail on the existing 12K rows.**
  Recommend: add a default, OR run the migration in two steps (add nullable, backfill, alter to NOT NULL).

## Recommendation

**Do not run as-is.** Apply the fix above, re-run the preview, then proceed.
```

### Step 6 — Decide

Three outcomes:
- **SAFE TO RUN** — preview matched expectations, no violations. The user can execute the real command.
- **NEEDS REVIEW** — preview surfaced something unexpected. Show it to the user; let them decide.
- **BLOCKED** — preview surfaced a violation (sandbox policy violation, dangerous operation). Refuse to suggest the real run.

## What NOT to do

- Don't run the real command yourself — only the user does that, after seeing the preview.
- Don't preview against the production environment — sandbox = isolated copy or read-only access.
- Don't claim "safe" if the preview output doesn't match what the user described.
- Don't skip the preview because "it's probably fine" — that's how prod gets dropped.
