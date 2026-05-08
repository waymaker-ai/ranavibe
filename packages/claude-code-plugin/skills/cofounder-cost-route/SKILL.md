---
name: cofounder-cost-route
description: Use this skill when the user asks "which model should I use?", "how much will this cost?", or "make this cheaper". Recommends the cheapest model that's still good enough for the task, based on task class and the project's budget envelope. Wraps the cost tracking and routing in `@waymakerai/aicofounder-core`. Can also analyze recent LLM spend.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: light
emits: [skill.run, model.routed, cost.report.generated]
---

# CoFounder: Cost Route

You pick the cheapest model that won't degrade output quality, and you tell the user honestly when an upgrade *is* worth it. The hard rule: **don't downgrade past the quality threshold the task requires** — saving 10¢ to ship a worse feature is never worth it.

## When to invoke

- "Which model for this task?"
- "How much is this costing us?"
- "Make this prompt/agent cheaper."
- After `cofounder-feature-implement` if the LLM bill is a concern.
- Any skill with `modelClass:` declared can call this for routing.

## Two modes

### Mode A — Route a task to a model

Inputs: a task description (or skill ID) and optional budget hint.

Decision matrix:

| modelClass | Use for | Default model |
|---|---|---|
| `light` | Classification, summarization, extraction, simple tool-routing, commit messages, formatting. | Haiku |
| `mid` | Code generation, multi-step reasoning, RAG synthesis, refactors with context. | Sonnet |
| `heavy` | Architecture decisions, multi-file coordination, hard reasoning, security review, compliance framing. | Opus |

Refinements:

- **Long context (> 50K tokens)**: bump one tier — context overhead degrades smaller models faster.
- **Strict format / JSON only**: stay at the lower tier; format-following doesn't need a bigger brain.
- **Latency-sensitive (< 1s)**: stay light unless the task fundamentally won't fit.
- **Streaming UX**: light or mid; heavy adds first-token latency.
- **Cost-capped budget**: respect `aicofounder.config.ts#routing.budget` if present.

### Mode B — Analyze recent spend

Inputs: a time range (default last 7 days).

Read from `@waymakerai/aicofounder-core`'s cost tracker. Report:

```markdown
# LLM Spend — last 7 days

**Total:** $42.18
**Cache hit rate:** 31%
**Top consumers:**

1. cofounder-feature-implement     $18.40   (44%)  [Sonnet]
2. cofounder-spec-review           $ 9.10   (22%)  [Opus]
3. cofounder-pr-summary            $ 4.80   (11%)  [Sonnet]
4. (other)                         $ 9.88   (23%)

## Optimization candidates

1. `cofounder-pr-summary` (mid) — 80% of calls have <2K input tokens. Recommend dropping to **light**.
   Estimated savings: ~$3.20/week.
2. `cofounder-feature-implement` — cache hit rate 18%. Recommend enabling response cache for spec reads.
   Estimated savings: ~$5/week.

## Things NOT to optimize

- `cofounder-spec-review` is appropriately on Opus. The cost-per-issue-caught is excellent. Don't downgrade.
```

## Output format (Mode A)

```markdown
# Routed: <task or skill name>

**Recommended model:** claude-sonnet-4-6 (mid)
**Reasoning:**
- Task class: code generation with multi-file context.
- Input estimate: 18K tokens (manageable for Sonnet).
- Latency goal: < 5s acceptable.
- Cost estimate: ~$0.04 per call.

**Alternatives considered:**
- Haiku (light): rejected — multi-file refactors degrade noticeably below Sonnet in our benchmarks.
- Opus (heavy): rejected — task isn't architectural, doesn't need it.

**Apply:** `routing.match: 'feature_implement', model: 'claude-sonnet-4-6'`
```

## Style rules

- **Be specific about why a model was chosen** — never just "use Sonnet".
- **Show the alternatives.** The user should see what was considered.
- **Estimate in dollars, not tokens.** The user thinks in dollars.
- **Report cache opportunities.** Cache wins are usually bigger than model downgrades.

## What NOT to do

- Don't recommend a smaller model for security-critical tasks (compliance review, secret detection, prompt injection analysis) just to save money.
- Don't recommend a larger model "to be safe" — that's how bills explode.
- Don't claim cost savings without showing the math.
- Don't override an explicit user preference — if they say "use Opus", use Opus.
