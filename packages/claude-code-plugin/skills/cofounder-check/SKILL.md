---
name: cofounder-check
description: Use this skill when the user asks to validate their repo against CoFounder guardrails — "run cofounder check", "verify the changes are safe", "is this PR-ready?", "check for guardrail violations". Runs typecheck, lint, tests, and CoFounder-specific rules (no secrets, no mock data in prod, no scope creep, no design-system violations) and reports a pass/fail summary.
---

# CoFounder: Guardrail Check

You are running CoFounder's safety gates on the current state of the repo.

## When to invoke

- User explicitly asks to check/validate
- Before creating a PR
- At the end of `cofounder-feature-implement`
- When the user is about to deploy

## Process

### Step 1 — Prefer the CLI if installed

Check for `aicofounder` or the local CLI:

```bash
command -v aicofounder && aicofounder check
```

If that runs, report its output verbatim and skip the manual checks below.

### Step 2 — Manual fallback

If the CLI isn't available, run each check individually using the Bash tool:

1. **Typecheck** — try in order: `npm run typecheck`, `npx tsc --noEmit`, `pnpm typecheck`
2. **Lint** — try: `npm run lint`, `npx eslint .`, `npx biome check`
3. **Tests** — try: `npm test`, `npx vitest run`, `pnpm test`
4. **Secret scan** — `git diff --staged` and look for high-entropy strings, API key patterns, `.env*` modifications
5. **Mock data scan** — `Grep` the diff for `mockUsers|fakeUsers|const.*data.*=.*\[{`
6. **Scope check** — if there's an active spec, `git diff --name-only` and verify every changed file is under `affectedPaths`
7. **Design system** — if the active VibeSpec sets `forbidRawColors`, grep the diff for `#[0-9a-f]{3,6}` in TSX/CSS

### Step 3 — Report

Produce a summary table:

```
Check                  Status   Notes
---------------------  -------  ---------------------------
typecheck              PASS     —
lint                   PASS     —
test                   FAIL     2 tests failing in auth.test.ts
secrets                PASS     —
mock-data              FAIL     components/Dashboard.tsx:42 has mockUsers
scope-respect          PASS     all changes within affectedPaths
design-system          WARN     1 raw color: button.tsx:18 #0A0910
```

For every FAIL or WARN, show the file and line number. For FAILs, recommend the fix.

### Step 4 — Gate decision

- All PASS → "ready to open PR"
- Any FAIL → "do not open PR yet" + list of required fixes
- WARNs only → "PR-able but please review the warnings"

## What NOT to do

- Don't auto-fix issues unless the user explicitly asks.
- Don't run destructive commands (no `rm`, no `git reset`, no `git clean`).
- Don't skip a check because you assume it would pass.
