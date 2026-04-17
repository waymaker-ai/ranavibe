---
description: CoFounder root command — route to feature-new, feature-implement, check, or spec-review. Usage — /cofounder <subcommand> [args]
argument-hint: <new|implement|check|review> [args]
---

Route to the appropriate CoFounder skill based on the first argument:

- `new` → invoke skill `cofounder-feature-new`
- `implement <spec>` → invoke skill `cofounder-feature-implement` with `$ARGUMENTS`
- `check` → invoke skill `cofounder-check`
- `review [diff-range]` → invoke agent `cofounder-reviewer` with `$ARGUMENTS`

If no argument is given, list the subcommands with one-line descriptions.

Do not execute any of these subcommands yourself — always delegate to the named skill or agent so the user sees the full guided flow.

User arguments: $ARGUMENTS
