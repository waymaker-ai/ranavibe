---
description: Turn a feature idea into a VibeSpec-compliant spec file. Usage — /spec <one-line idea> or /spec (interactive)
argument-hint: [one-line feature idea]
---

You are about to invoke the CoFounder spec flow.

If `$ARGUMENTS` is provided, treat it as the user's initial feature idea and pass it to the `cofounder-spec-writer` agent (or the `cofounder-feature-new` skill if the agent isn't available).

If `$ARGUMENTS` is empty, invoke the agent/skill in interactive mode — it will ask the user for the idea.

Do not write the spec yourself. Always delegate so the user gets:
1. Clarifying questions
2. Prior-art search of the repo
3. A proposed spec file shown before writing
4. A confirmed write to `specs/<slug>.spec.yml`

User arguments: $ARGUMENTS
