---
name: cofounder-test-plan
description: Use this skill when the user asks "what tests should I write?", "test plan for this feature", or after a feature is implemented but tests are missing. Reads a spec or a diff and proposes a tiered test plan — what to assert, at what layer (unit / integration / e2e), and what's NOT worth testing. Writes nothing without confirmation.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: mid
nextSkill: cofounder-feature-implement
emits: [skill.run, test.plan.generated]
---

# CoFounder: Test Plan

You design test plans, not test code. The point is to think about *what to assert* before *how to assert it*. The hard rule: **every test in the plan must trace to either an acceptance criterion or a known failure mode** — no "let's add tests for completeness".

## When to invoke

- "What tests should I write?"
- "Test plan for this feature"
- After `cofounder-feature-implement` if tests are missing
- Before `cofounder-check` reports missing test coverage

## Process

### Step 1 — Find the spec (or diff)

Look for:
- A `specs/<slug>.spec.yml` with `acceptanceCriteria`.
- An issue with acceptance criteria in the description.
- If neither exists, fall back to the staged or branch diff.

If only a diff exists, mine **public-facing changes** for test seams (route handlers, exported functions, components used by other modules).

### Step 2 — Triage by tier

| Tier | What | When |
|---|---|---|
| **Tier 1: must-test** | Acceptance criteria, security boundaries, money/data integrity, public API contracts | Always |
| **Tier 2: should-test** | Common error paths, integration points, regressions of past bugs | Usually |
| **Tier 3: nice-to-have** | Edge cases, performance, fuzz inputs | When budget allows |
| **Tier 0: skip** | Trivial getters, generated code, third-party library behavior, framework code | Always skip |

### Step 3 — Pick the right layer

For each Tier 1/2 test, choose:

- **Unit** — pure function with stable inputs and outputs. Fastest, most stable.
- **Integration** — multiple modules wired together with a real DB / real adapter. Catches the bugs unit tests miss.
- **E2E** — through the UI or HTTP boundary. Slowest, flakiest, but the only way to catch wiring issues.

Rule of thumb: **push tests as low as they'll go** while still catching the failure mode you care about.

### Step 4 — Write the plan

```markdown
# Test Plan: <feature name>

**Source:** <spec path or diff range>
**Acceptance criteria covered:** <N of M>

## Tier 1 — must-test

| # | What | Layer | File | Notes |
|---|---|---|---|---|
| 1 | Returns 401 if unauthenticated | integration | `tests/api/billing.test.ts` | Acceptance #3 |
| 2 | Annual upgrade halves the monthly amount | unit | `tests/billing/upgrade.test.ts` | Money correctness; mock Stripe |
| 3 | UI disables submit while in-flight | e2e | `tests/e2e/billing.spec.ts` | Prevents double-charge |

## Tier 2 — should-test

| # | What | Layer | File | Notes |
|---|---|---|---|---|
| 4 | Network error shows retry banner | integration | `tests/api/billing.test.ts` | Common error path |

## Tier 3 — nice-to-have

| # | What | Notes |
|---|---|---|
| 5 | Concurrent upgrade requests deduped | If we see this in prod, add it |

## Deliberately not testing

- Stripe SDK internals (third-party).
- The `formatCurrency` util (one-liner, exhaustively tested via consumers).
- The `<Button>` component (design-system primitive, owned by `packages/ui`).

## Estimated effort

- Tier 1: ~2 hours
- Tier 2: ~1 hour
- Tier 3: defer
```

### Step 5 — Hand off

Suggest the next step:
> "Want me to scaffold the Tier 1 tests? Run `cofounder-feature-implement` with this plan as input, or write them manually."

## What NOT to do

- Don't write the test code in this skill — that's `cofounder-feature-implement`'s job.
- Don't propose tests for things that don't exist yet (vaporware coverage).
- Don't propose 100% coverage as a goal — coverage is a side effect of testing the right things.
- Don't ignore the test pyramid: catch yourself proposing 10 e2e tests and 0 unit tests.
