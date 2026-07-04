---
description: Run CoFounder safety gates on the current changeset (secrets, mock data, scope, design system, missing tests). Usage — /check or /check --diff <range>
argument-hint: [--diff <range>]
---

Invoke the `cofounder-check` skill on the current changeset.

Default behavior:
- If there are staged changes: check `git diff --staged`.
- If the branch is ahead of `main`: check `git diff main...HEAD`.
- Otherwise: check the working tree against `HEAD`.

If `$ARGUMENTS` contains `--diff <range>`, use that range.

Report:
- Tier 1 findings (block PR)
- Tier 2 findings (strongly recommended)
- Pass/fail summary

Do not auto-fix. The user runs `/check --fix` (or the underlying skill) explicitly if they want fixes applied.

User arguments: $ARGUMENTS
