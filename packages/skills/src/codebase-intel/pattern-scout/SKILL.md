---
name: cofounder-pattern-scout
description: Use this skill BEFORE writing new code, when the user asks to "add", "build", "create", or "extract" something — to find existing patterns in the repo so the agent extends them instead of reinventing. Searches for similar functions, components, hooks, models, routes, and styling. Returns the closest matches ranked by similarity, with a recommendation to extend or create new.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: light
nextSkill: cofounder-feature-new
emits: [skill.run, skill.match.found, skill.match.empty]
---

# CoFounder: Pattern Scout

You are scouting the repo for existing code that solves a similar problem to what the user is asking for. The point is to **prevent agents from reinventing what already exists** — a leading cause of bloated codebases and inconsistent UX.

## When to invoke

- User asks to "add a settings page", "build a dashboard widget", "extract a hook", etc.
- Agent is about to write something net-new and the term sounds generic enough that it might already exist.
- Pre-flight before `cofounder-feature-new`.

Skip for trivial fixes (typos, one-line bugs).

## Process

### Step 1 — Get a query

If the user's intent is unclear, ask one clarifying question only:
> "What kind of <thing> are you adding — a page, a component, a hook, a route, a database model, or something else?"

### Step 2 — Search

Use Grep / Glob with these strategies in order:

1. **Exact noun match** — `grep -ri "<noun>" --include="*.ts" --include="*.tsx"`
2. **Pluralization variants** — try singular and plural forms.
3. **Concept match** — synonyms (e.g., "billing" → ["billing", "subscription", "plan", "invoice"]).
4. **Structural match** — by file pattern (e.g., for a "settings page", glob `app/**/settings/**`, `pages/**/settings/**`).
5. **Imports of related modules** — if the user mentions Stripe, search imports of `stripe`, `@stripe/*`.

### Step 3 — Rank matches

For each match, score on:
- **Same shape**: a component vs. a function vs. a route — exact match scores higher.
- **Same domain**: file path overlap with the intent (e.g., `app/settings/*` for a settings feature).
- **Recently touched**: `git log -1 --format=%ar -- <file>` — fresher = more likely the canonical version.
- **Public surface**: exported symbols rank higher than internal helpers.

### Step 4 — Report

```
# Pattern Scout Report

**Intent:** <what user asked for>

## Top matches

1. `components/settings/BillingSettingsPage.tsx` — 92% match (same domain, exported, touched 3 days ago)
   - Exposes: <key exports>
   - Recommendation: **extend** this. Avoid creating a parallel page.

2. `lib/billing/upgradeFlow.ts` — 78% match (related domain, used by 4 callers)
   - Recommendation: this is the upgrade-flow seam — reuse it for new plan changes.

3. `components/settings/PlanSelector.tsx` — 65% match
   - Recommendation: probable composition target — extend rather than fork.

## Recommendation

**Extend existing.** No new top-level page, no new lib module — this functionality already lives in `components/settings/`. Pass the user's request to `cofounder-feature-new` with affected paths set to `components/settings/`, `lib/billing/`.

## What I checked
- Searched for: ["billing", "subscription", "plan", "invoice", "upgrade"]
- Globs: `app/**/settings/**`, `components/settings/**`, `lib/billing/**`
- 47 files scanned, 12 candidates, 3 high-confidence.
```

## Confidence rules

- Don't report a match below 50% similarity unless nothing else exists.
- If nothing relevant is found, say so explicitly — don't pad the report.
- Never recommend "extend" if the existing code is clearly stale (no recent edits, no tests, deprecated comments). Say "create new but mirror the structure of <X>" instead.

## What NOT to do

- Don't write code.
- Don't create files.
- Don't pretend to find matches when there are none.
- Don't recommend extending something that's flagged `@deprecated`.
