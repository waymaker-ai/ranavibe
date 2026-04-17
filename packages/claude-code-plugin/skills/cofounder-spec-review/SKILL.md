---
name: cofounder-spec-review
description: Use this skill when the user has a CoFounder spec file (under specs/) and asks to review it — "review this spec", "is this spec good?", "anything missing?". Returns a structured critique covering completeness, testability, scope clarity, and VibeSpec compliance. Does NOT modify the spec.
---

# CoFounder: Spec Review

You are reviewing a feature spec for completeness and quality before the user runs `cofounder-feature-implement` on it.

## When to invoke

- User points at a file under `specs/` and asks for review
- Before `cofounder-feature-implement` if the spec looks thin
- As part of a PR review when the spec is part of the change

## Rubric

Score the spec on each dimension. For each FAIL, suggest the specific missing content.

### 1. Identity & framing
- [ ] Has `id`, `name`, `description`
- [ ] Description is 1–3 sentences, not vague ("make it better")
- [ ] References `apiVersion: cofounder.cx/v1` (helps other tools)

### 2. User stories
- [ ] At least one story
- [ ] Follows "As a <role>, I can <action> so that <outcome>" format
- [ ] Role is a real role in this app (check auth/roles tables)

### 3. Acceptance criteria
- [ ] At least one criterion per user story
- [ ] Each criterion is testable (not "works well" — "returns 401 if unauthenticated")
- [ ] No duplication with user stories

### 4. Scope
- [ ] `affectedPaths` is present and uses globs (not vague "the frontend")
- [ ] `nonGoals` is present (this is the single most common omission)
- [ ] Scope feels appropriately sized (1–3 days of work, not 3 weeks)

### 5. Data sources
- [ ] Real DB tables / API endpoints named (not "user data" — "auth.users, profiles.user_id")
- [ ] No invented endpoints
- [ ] If external API, link to docs

### 6. Constraints
- [ ] References the active VibeSpec by id
- [ ] Lists any feature-specific rules (auth, rate limits, pagination)
- [ ] Design-system notes if UI work

### 7. Risk
- [ ] Any destructive or irreversible operations called out
- [ ] Migration / rollback plan if DB schema changes
- [ ] Third-party dependency additions listed

## Output

```
## Spec Review: <spec id>

**Overall:** READY | NEEDS WORK | BLOCKED

### Scores
- Identity & framing:   PASS
- User stories:         PASS
- Acceptance criteria:  NEEDS WORK (see below)
- Scope:                PASS
- Data sources:         FAIL
- Constraints:          WARN
- Risk:                 PASS

### Required before implement
1. **Data sources**: spec says "use the billing API" — which API? Internal `billing.subscriptions` table or Stripe? Add the exact source.
2. **Acceptance criteria #3**: "handles errors gracefully" is not testable. Replace with "returns 400 with message X on invalid input; returns 502 on upstream Stripe timeout".

### Suggestions (not blocking)
- Add a `nonGoals` note clarifying this does NOT cover annual → monthly downgrade.
```

## What NOT to do

- Don't rewrite the spec yourself — ask the user to update it based on your findings.
- Don't implement anything.
- Don't downgrade FAILs to WARNs to "be nice." Be direct.
