---
name: cofounder-second-opinion
description: Use this skill when the user asks "is this right?", "double-check this", "get another perspective", or before merging anything high-stakes. Routes the same prompt through a *different* model (or even a different provider) via `@waymakerai/aicofounder-core`'s router and diffs the answers. Surfaces disagreements where they matter, not where they don't.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: heavy
emits: [skill.run, second.opinion.requested, second.opinion.disagreement]
---

# CoFounder: Second Opinion

You catch single-model blindspots by running the same question through a *different* model and surfacing where the answers disagree on substance — not where they disagree on word choice. The hard rule: **only flag disagreements that change the recommendation.**

## When to invoke

- "Double-check this code change."
- "Is this migration safe?"
- "Get a second opinion on the architecture decision."
- Before any irreversible operation (production deploy, schema migration, key rotation).
- After a high-stakes review by `cofounder-reviewer` if the verdict is borderline.

This is **not** for trivial questions — it doubles cost. Skip for cheap, low-stakes asks.

## Process

### Step 1 — Capture the question

Get the exact prompt or task. If invoked after another skill, capture that skill's input *and* output — you'll diff against the output, not just re-run the prompt.

### Step 2 — Pick the second model

Strategy:
- **Different family** — if the first opinion was Claude, run the second on a different provider (e.g., a Gemini or GPT line via `@waymakerai/aicofounder-core` providers). Same-family second opinions catch fewer blindspots.
- **Different size** — if cross-provider isn't possible, use a different size from the same family (Opus → Sonnet, or Haiku → Sonnet).
- **Different prompting** — frame the question in a different way (e.g., "what could go wrong with X?" instead of "is X correct?"). Reduces priming bias.

If the project's `.aicofounder.yml` declares a `secondOpinion` provider, use that.

### Step 3 — Run

Both opinions go through the same router so cost is tracked:

```ts
const cofounder = createCoFounder(config);
const a = await cofounder.complete({ prompt, model: 'first-choice' });
const b = await cofounder.complete({ prompt, model: 'second-choice' });
```

### Step 4 — Diff for substance, not surface

Substance disagreements = different conclusions, different recommended actions, different risk assessments.

Surface disagreements = different word choice, different ordering, different verbosity. **Ignore these.**

For each substance disagreement, attempt to identify which is more likely correct:
- Does one cite specific code/spec evidence the other lacks?
- Does one make claims contradicted by what's in the repo?
- Does one match the project's existing conventions better?

### Step 5 — Report

```markdown
# Second Opinion

**Question:** Is this Stripe webhook handler safe to merge?

**Models:** Claude Opus (first) ↔ GPT-5.2 (second)

## Agreement (high confidence)

- Both flagged the missing signature verification in `app/api/webhooks/stripe/route.ts`.
- Both flagged that retries from Stripe could cause double-processing without idempotency.

## Substance disagreement

**Disagreement #1 — Type of idempotency key**
- First: recommends using Stripe's `event.id` as the idempotency key.
- Second: recommends using a hash of `(event.id, event.type, customer_id)` to handle replays across event types.

**Verdict (mine):** First is correct. Stripe guarantees `event.id` is globally unique per event delivery, so the hash is overengineering. Second's reasoning is plausible but contradicts Stripe's docs.

## Surface differences (not flagged)

- Different ordering of recommendations.
- One uses "must" language, the other uses "should" — semantically equivalent.

## Recommendation

Apply both flagged issues (signature verification, idempotency via `event.id`). Skip the hash-based approach.
```

### Step 6 — Hand off

Return the merged recommendation. If the disagreement is unresolvable from available evidence, say so explicitly:

> "Models disagree on X and the repo doesn't contain evidence to break the tie. Recommend testing both approaches against fixture inputs, or asking a senior engineer."

## What NOT to do

- Don't flag stylistic disagreements as "issues".
- Don't pretend to break a tie when you can't — surface the disagreement honestly.
- Don't run a second opinion through the *same* model — that's not a second opinion.
- Don't run on every task — this skill costs ~2x. Reserve for high-stakes.
- Don't blindly average the two opinions. That's how you ship the median wrong answer.
