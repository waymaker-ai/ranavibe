---
name: cofounder-pr-summary
description: Use this skill before opening a PR, when the user asks "write the PR description" or "summarize these changes". Generates a PR description from the ACTUAL diff — what changed, why, blast radius, test coverage — framed as a mental model the reviewer can hold in their head, not a list of file names.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: true
modelClass: mid
emits: [skill.run, pr.summary.generated]
---

# CoFounder: PR Summary

You write PR descriptions that a tired reviewer at 4pm on Friday can read and immediately know what's safe to ship. The hard rule: **only describe what's actually in the diff** — no aspirational language about "this enables future X".

## When to invoke

- "Write the PR description"
- "Summarize these changes for the PR"
- After `cofounder-feature-implement` finishes
- Before running `gh pr create`

## Process

### Step 1 — Gather the diff

Run, in order:
1. `git status` — what's staged, what's not.
2. `git diff origin/main...HEAD --stat` — file-level summary.
3. `git diff origin/main...HEAD` — full diff.
4. `git log origin/main..HEAD --oneline` — commits in this branch.

If the branch isn't pushed yet, use `main` (or whatever the repo's default branch is).

### Step 2 — Identify the spec or issue

Look for:
- A `specs/<slug>.spec.yml` referenced in commit messages.
- An issue number in the branch name (e.g., `feat/123-team-billing`).
- A linked GitHub/Linear/Jira ticket.

If found, read it — the PR description should map back to acceptance criteria.

### Step 3 — Build the mental model

Frame the change in one sentence: **"This PR <verb> <noun> so that <outcome>."**

Then identify:
- **Blast radius**: which modules, which user-facing surfaces, which DB tables.
- **Risk**: anything reversible (config flag, migration with rollback) vs. permanent.
- **Test coverage**: new tests added, existing tests touched, manual test steps if any.
- **Out of scope**: things the reviewer might expect that this PR explicitly doesn't do.

### Step 4 — Write the description

Use this template:

```markdown
## Summary

<one-sentence mental model>

<2–4 bullet points expanding what changed and why>

## Spec / Issue

<link or path>

## Blast radius

- **User-facing**: <pages, flows>
- **API**: <endpoints added/changed>
- **Data**: <tables, migrations>
- **Config / env**: <new vars, flags>

## How to test

- [ ] <concrete step>
- [ ] <concrete step>

## Out of scope

- <what this PR deliberately doesn't do, with brief reason>

## Notes for the reviewer

- <anything surprising in the diff and why>
- <any backward-compatibility concerns>
```

Skip sections that are genuinely empty — don't pad.

### Step 5 — Output

Print the description to the user. Do **not** automatically run `gh pr create` unless explicitly asked. The user reviews and runs the command themselves.

## Style rules

- **No marketing language** ("comprehensive overhaul", "next-generation").
- **No "this enables future X"** — describe what's in the diff.
- **No file lists** — reviewers can read the file tree themselves; what they need is the *mental model*.
- **Verbs over nouns**: "Adds team billing page" beats "Team billing page implementation".
- **Be honest about gaps**: if tests are missing for an edge case, say so.

## What NOT to do

- Don't include the `🤖 Generated with Claude Code` footer unless the user asks.
- Don't claim test coverage that doesn't exist.
- Don't list "future improvements" — those go in issues, not PR descriptions.
- Don't summarize commits one-by-one — synthesize.
