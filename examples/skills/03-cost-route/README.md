# Example 03 — cost route

How `cofounder-cost-route` shifts a workload from "everything-on-Opus" to class-correct routing — and what that costs.

## The setup

You have a CoFounder-powered repo. You ran 1,000 invocations across the skills last week. Your bill came in higher than expected. The CFO is asking why.

`cofounder-cost-route` answers in two modes:
- **Mode A** — "Which model should this skill use?"
- **Mode B** — "Where is my last week of LLM spend going, and what's the optimization candidate?"

This example demonstrates Mode B against the manifest's actual class distribution.

## Run

```bash
pnpm --filter @waymakerai/aicofounder-skills install
pnpm --filter @waymakerai/aicofounder-skills build
pnpm --filter @waymakerai/aicofounder-skills benchmark
```

Output:

```json
{
  "modelCostDelta": {
    "per1kInvocations": {
      "everythingOnOpus": 315.00,
      "correctlyRouted": 211.50,
      "saved": 103.50
    },
    "byClass": [
      { "cls": "light", "model": "claude-haiku-4-5-20251001", "perCall": 0.004 },
      { "cls": "mid",   "model": "claude-sonnet-4-6",         "perCall": 0.0465 },
      { "cls": "heavy", "model": "claude-opus-4-7",           "perCall": 0.6 }
    ]
  }
}
```

## What `cofounder-cost-route` would say (Mode B)

```markdown
# LLM Spend — last 1K invocations (modeled)

Total (everything-on-Opus): $315.00
Total (class-correct):      $211.50
Saved:                      $103.50  (33%)

## Top consumers (correctly routed)
1. cofounder-feature-implement     $90.00  (43%)  [heavy / Opus]
2. cofounder-spec-review           $40.50  (19%)  [heavy / Opus]
3. cofounder-pr-summary            $14.30  ( 7%)  [mid   / Sonnet]
4. cofounder-pattern-scout         $ 1.30  ( 1%)  [light / Haiku]
5. (other 12 skills)               $65.40  (31%)

## Optimization candidates

1. cofounder-pr-summary (mid) — 80% of calls have <2K input tokens.
   Recommend: drop to light for short diffs only.
   Estimated savings: $9 per 1K invocations.

2. cofounder-feature-implement — cache hit rate appears low.
   Recommend: enable response cache for the spec-read step.
   Estimated savings: $15 per 1K invocations (depends on cache hit rate).

## Things NOT to optimize

- cofounder-spec-review is appropriately on Opus. Cost-per-issue-caught is
  excellent. Don't downgrade.
- cofounder-compliance-frame is in the HEAVY_NEEDS_SKILLS allowlist —
  the runtime refuses to route it to a smaller model regardless.
```

## Why this example matters

Three real properties of this skill:

1. **It refuses to downgrade quality-critical skills.** `cofounder-compliance-frame`, `cofounder-second-opinion`, `cofounder-spec-review` are explicitly in `HEAVY_NEEDS_SKILLS` in `runtime/src/router.ts`. The user asking "make it cheaper" doesn't override safety.

2. **The numbers come from `runtime/src/cli/benchmark.ts`** — not from a marketing deck. Anyone can clone the repo, run the benchmark, and verify the math.

3. **It's modeled, not measured.** We are honest about the difference. Real workloads will vary. The frame proves the *direction* is right; your invocation counts make the *amount* precise.

## What this is NOT

This is not a load-tested production cost simulator. It does not account for:
- Cached responses
- Streaming overhead
- Rate-limit retries
- Provider-specific minimums

For those, run with your own invocation counts via `cofounder-cost-route` against your actual cost-tracker logs.
