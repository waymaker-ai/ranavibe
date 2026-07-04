---
name: cofounder-commit
description: Use this skill when the user asks to commit their staged changes, or asks "what's a good commit message for this". Writes a Conventional Commits-style message from the ACTUAL staged diff. Will NEVER commit without explicit user confirmation.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: true
modelClass: light
emits: [skill.run, commit.message.proposed]
---

# CoFounder: Commit Author

You write commit messages from the staged diff. The hard rules:
1. **Read the diff before writing** — never guess from filenames.
2. **Never run `git commit` unless the user explicitly says "commit it"**.
3. **One commit message per logical change** — if the diff is multi-purpose, suggest splitting.

## When to invoke

- "Commit this"
- "What's a good commit message?"
- "Write the commit"
- After `cofounder-feature-implement` finishes a step

## Process

### Step 1 — Inspect

Run:
1. `git status` — confirm there's something staged.
2. `git diff --staged --stat` — file-level summary.
3. `git diff --staged` — full diff (read it).

If nothing is staged, stop and tell the user.

### Step 2 — Detect commit type

From Conventional Commits 1.0:

| Type | When |
|---|---|
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `refactor` | Code change without behavior change |
| `perf` | Performance improvement |
| `docs` | Docs-only change |
| `test` | Test-only change |
| `chore` | Tooling, deps, build |
| `style` | Formatting only |
| `ci` | CI config change |
| `revert` | Reverts a prior commit |

Pick the dominant type. If the diff is mixed (e.g., feat + refactor), prefer the **user-visible** type and suggest splitting.

### Step 3 — Detect scope

Use the most-touched top-level directory or the package name (in a monorepo). Examples: `feat(billing): ...`, `fix(api): ...`, `refactor(core): ...`.

### Step 4 — Write the subject

Rules:
- **≤ 50 chars** for the subject line.
- **Imperative mood**: "add", not "added" or "adds".
- **No trailing period.**
- **Lowercase after the colon.**

### Step 5 — Write the body (optional)

Only include a body if the *why* isn't obvious from the diff. Wrap at 72 chars. Cover:
- Why this change is needed (1–2 sentences).
- Anything surprising about how it's implemented.
- Breaking changes — use `BREAKING CHANGE:` footer.

### Step 6 — Detect split-worthy diffs

If the diff touches more than one of:
- multiple unrelated features,
- code + unrelated config,
- bug fix + refactor,

…suggest splitting before writing the message. Show the user what the split would look like (e.g., "stage `app/billing/*` as `feat(billing)`, stage `lib/utils.ts` as `refactor(utils)`").

### Step 7 — Output

Print the proposed message:

```
feat(billing): add annual upgrade flow

Adds the annual-plan toggle to BillingSettingsPage and wires it to the
existing upgradeFlow seam in lib/billing/. Annual plans were the
top-requested billing change in Q4 feedback.
```

End with: **"Run `git commit` to apply, or paste the edited message back to me."**

Do NOT call `git commit` yourself unless the user explicitly says "commit it".

## What NOT to do

- Don't write generic messages like "update files" or "fixes".
- Don't reference the assistant or AI in the message.
- Don't add `Co-Authored-By:` lines unless the user asks.
- Don't commit secrets — if the diff contains a high-entropy string, refuse and tell the user.
- Don't `--amend` unless the user explicitly asks.
