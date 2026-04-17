---
name: cofounder-feature-new
description: Use this skill when the user wants to start a new feature — "add X feature", "let's build a Y page", "I want to add Z to the app". Guides idea → clarifying questions → VibeSpec-compliant feature spec written to `specs/<slug>.spec.yml`. DOES NOT write implementation code.
---

# CoFounder: Feature Spec Flow

You are helping the user turn a feature idea into a clear, VibeSpec-compliant spec file. You are NOT writing implementation code yet — that's a separate skill (`cofounder-feature-implement`).

## When to invoke

Trigger this skill when:
- The user describes a new feature in the app
- The user asks to "add", "build", "create" something non-trivial
- There's ambiguity about scope, acceptance criteria, or data sources

Skip this skill for trivial changes (typos, one-line bug fixes, README edits).

## Process

### Step 1 — Read active VibeSpecs

Check the repo for:
- `.aicofounder.yml` — project config
- `specs/vibes/*.yml` or `config/vibes/*.yml` — available VibeSpecs
- `CLAUDE.md` — project-specific conventions

Apply the VibeSpec constraints that match the current context (e.g. a `frontend_work` or `feature_work` vibe). If none match, default to "ask before acting" mode.

### Step 2 — Ask 3–5 clarifying questions

Always ask:
1. **Which user roles** can see/use this?
2. **Source of truth** for any data involved (existing DB table? external API? new schema?)
3. **Affected routes / pages / modules**
4. **Acceptance criteria** — how will we know it works?
5. **Non-goals** — what is explicitly out of scope?

If `AskUserQuestion` is available, use it. Otherwise, ask in plain text.

### Step 3 — Search for prior art

Before drafting, grep the repo for similar features. Tell the user what you found and ask whether to extend or create new.

### Step 4 — Write the spec

Produce `specs/<slug>.spec.yml` following the CoFounder FlowSpec v1 format (see `spec/SPEC.md` at the repo root if present). At minimum include:

```yaml
apiVersion: cofounder.cx/v1
id: <slug>
name: "<Human name>"
description: >
  <1-3 sentence summary>

userStories:
  - "As a <role>, I can <action> so that <outcome>"

acceptanceCriteria:
  - "<testable criterion>"

affectedPaths:
  - "app/..."
  - "components/..."

dataSources:
  - "<table / API>"

constraints:
  - "<design system, security, business rule>"

nonGoals:
  - "<what's explicitly out of scope>"
```

### Step 5 — Summarize and hand off

Report:
- Path to the spec file
- Summary of scope (bullet list)
- Suggested next command: `aicofounder feature:implement specs/<slug>.spec.yml` OR invoke the `cofounder-feature-implement` skill

## What NOT to do

- Do not write implementation code in this skill.
- Do not create branches or commit anything.
- Do not invent data sources, table names, or API endpoints — ask the user.
