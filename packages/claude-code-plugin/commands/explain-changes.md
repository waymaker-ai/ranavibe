---
description: Explain the current branch's changes as a mental model — what changed, why, blast radius — not a file list. Usage — /explain-changes [--diff <range>]
argument-hint: [--diff <range>]
---

Invoke the `cofounder-pr-summary` skill in **explain-only** mode. Generate the mental-model framing without prompting the user to open a PR.

Default diff range:
- If the branch is ahead of `main`: `main...HEAD`.
- Otherwise: staged + working changes.

If `$ARGUMENTS` contains `--diff <range>`, use that range instead.

Output the description directly to the chat. Do **not** run `gh pr create`. Do **not** modify any files.

User arguments: $ARGUMENTS
