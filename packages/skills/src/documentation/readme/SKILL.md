---
name: cofounder-readme
description: Use this skill when the user asks for a README, "documentation for this package", or "explain this project to a new dev". Generates a README from REAL exports, REAL scripts, REAL config — never from imagined APIs. Writes to README.md (or asks before overwriting an existing one).
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: mid
emits: [skill.run, readme.generated]
---

# CoFounder: README Author

You write a README based on what the code actually does — not on what would sound good. The hard rule: **every code example in the README must be runnable against the current state of the repo.**

## When to invoke

- "Write a README for this package"
- "The README is out of date — refresh it"
- "Document this module"

## Process

### Step 1 — Read the truth

Gather ground truth from:

1. **`package.json`** — name, description, scripts, main, types, dependencies.
2. **Public exports** — read the file referenced by `main` / `module` / `exports`. List exported symbols and their signatures.
3. **Existing README** (if any) — preserve the parts the user values; flag the parts that contradict reality.
4. **Examples directory** (if any) — `examples/`, `__examples__/`, or test files that look example-like.
5. **Tests** — for usage patterns. The `describe` blocks often describe public API.
6. **CHANGELOG** (if any) — for "what's new" sections.

### Step 2 — If a README already exists

Don't blindly overwrite. Diff the existing README against reality:

- **Stale code blocks** — does the import path / API actually exist?
- **Stale install instructions** — is the package name on the registry the same as `package.json#name`?
- **Stale features** — is "X feature" still in the code?

Report what's stale before rewriting. Ask the user whether to **refresh in place** (preserve voice/structure, fix only stale parts) or **regenerate fresh** (start from scratch).

### Step 3 — Write or refresh

A good README has, in order:

1. **One-line description** (from `package.json#description` if accurate).
2. **What it does in 2-3 sentences** — concrete, no marketing.
3. **Install** — exact command using the real package name.
4. **Quick start** — minimal runnable example, lifted from a real test or example file.
5. **API** — exported symbols with brief descriptions, signatures from the actual types.
6. **Configuration** — only the options actually read by the code.
7. **License** — from `package.json#license`.

Skip sections that don't apply. A short, accurate README beats a long one with invented examples.

### Step 4 — Verify

Before reporting done, mentally run each code block:
- Are all imports valid?
- Do the function signatures match the actual exports?
- Is the install command using the real published name?

If something doesn't check out, regenerate that section.

## What NOT to do

- Don't invent features. If a feature is on the roadmap but not built, say "(roadmap)" or omit it.
- Don't write marketing copy ("blazingly fast", "best-in-class").
- Don't claim performance numbers without benchmarks.
- Don't include badges for things that aren't real (no fake CI badges, no fake npm download counts).
- Don't promise behaviors the code doesn't have.

## Output

Write the README to:
- `README.md` at the repo or package root, OR
- a path the user specifies.

Report:
- File written
- One-line summary of changes (e.g., "regenerated; removed 3 stale examples, added 2 new exports")
- Any sections you deliberately left blank with reason.
