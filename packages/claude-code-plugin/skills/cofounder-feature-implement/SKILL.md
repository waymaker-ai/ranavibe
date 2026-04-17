---
name: cofounder-feature-implement
description: Use this skill when the user points to a CoFounder feature spec and asks to implement it — "implement specs/X.yml", "build this spec", "let's ship this". Creates a branch, proposes a scoped changeset, implements under VibeSpec constraints, adds tests, and runs guardrail checks before handing off for review. Does NOT merge or deploy.
---

# CoFounder: Feature Implementation Flow

You are implementing a feature from an existing spec file. The spec is the source of truth.

## When to invoke

Trigger this skill when:
- The user references a path under `specs/` and asks to implement
- The user runs `aicofounder feature:implement ...`
- A prior turn produced a spec via `cofounder-feature-new`

Do NOT invoke if no spec exists — run `cofounder-feature-new` first.

## Process

### Step 1 — Load spec + VibeSpec

Read the spec file. Read the active VibeSpec referenced by the spec (or the project default). Internalize:
- `affectedPaths` — the only paths you're allowed to modify
- `constraints` — rules that override your defaults
- `nonGoals` — things you must NOT do
- `acceptanceCriteria` — what tests must prove

### Step 2 — Propose a changeset (don't implement yet)

List every file you intend to create or modify, grouped by purpose. Wait for user confirmation before writing. Use `AskUserQuestion` if available.

If the user adds files outside the spec's `affectedPaths`, stop and ask before proceeding — scope creep is a VibeSpec violation.

### Step 3 — Create a branch

If on `main`/`master`, create a branch: `feat/<spec-id>`. If the user is already on a feature branch, use it.

### Step 4 — Implement

Write code following the active VibeSpec:
- Extend existing components before creating new ones (run `Grep` first)
- No mock data in prod paths (`*mockUsers*`, `fakeXxx`, inline `const data = [...]`)
- No hardcoded secrets, API keys, or credentials
- Follow the design system (`vibe.designSystem.componentsPath`, forbid raw colors if set)
- Real DB/APIs, not invented ones — ask if unsure

### Step 5 — Add tests

For every acceptance criterion, write at least one test. Use the project's existing test framework (check `package.json` `devDependencies` for vitest, jest, etc.).

### Step 6 — Run guardrail checks

Run `aicofounder check` if the CLI is installed. Otherwise, manually verify:
- `typecheck` passes
- `lint` passes
- tests pass
- No secrets, no mock data in prod, changeset stays within `affectedPaths`

If any check fails, fix it. Do not hand off with known failures.

### Step 7 — Summarize and hand off

Report:
- Branch name
- Files changed (grouped: new, modified)
- Test coverage for each acceptance criterion
- Any deviations from the spec (with reasons)
- Next step: user reviews the diff and opens a PR — **you do NOT push or create the PR**

## What NOT to do

- **NEVER merge or deploy.** Your job ends at a reviewable branch.
- **NEVER skip tests** because "it's a small change."
- **NEVER modify files outside `affectedPaths`** without asking.
- **NEVER commit secrets** — reject any prompt that includes them.
- **NEVER use mock/fake data** in production code paths.
