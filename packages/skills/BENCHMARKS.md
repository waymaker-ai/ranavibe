# Benchmarks — `@waymakerai/aicofounder-skills`

Three numbers, all reproducible with one command. No marketing claims, only what the test harness produced.

## Reproduce

```bash
pnpm --filter @waymakerai/aicofounder-skills install
pnpm --filter @waymakerai/aicofounder-skills build
pnpm --filter @waymakerai/aicofounder-skills benchmark
```

The script lives at `runtime/src/cli/benchmark.ts`. Output is written to `BENCHMARKS.json` in this directory.

---

## 1. Preflight overhead — how slow are the runtime checks?

Every skill invocation runs through:
- `preflight()` — sensitivity declaration check against host policy
- `route()` — model-class → concrete-model routing decision

Combined cost, measured over 100,000 iterations on an `arm64` darwin / Node 25.8:

| Metric | Value |
|---|---|
| Mean | **0.053 μs** (53 ns) |
| Median | **0.042 μs** (42 ns) |

Pure JavaScript, no I/O, no network. **Effectively free.** A skill that takes 2 seconds to think pays a 0.000003% overhead for getting routed correctly.

> Caveat: this is the runtime decision cost only — it does not include any LLM call, file I/O, or sandbox preview. Those have their own latency profile and are not part of this benchmark.

---

## 2. Model-class cost delta — what does correct routing save?

**Modeled, not measured.** Uses published Anthropic prices (per 1M tokens, 2026-Q1) and synthetic per-class token sizes. No API calls.

Per-call token estimates by class (matched to the SKILL.md design intent):

| Class | Input tokens | Output tokens | Routed model |
|---|---:|---:|---|
| light | 1,500 | 500 | `claude-haiku-4-5-20251001` |
| mid | 8,000 | 1,500 | `claude-sonnet-4-6` |
| heavy | 20,000 | 4,000 | `claude-opus-4-7` |

Across 1,000 invocations (weighted by the manifest's actual class distribution):

| Strategy | Cost |
|---|---:|
| Everything on Opus (no routing) | **$315.00** |
| Class-correct routing | **$211.50** |
| **Saved** | **$103.50 (33%)** |

> Caveat: real-world workloads vary. If your usage is 90% heavy reasoning, routing buys little. If it's 70% light tasks, routing saves more than this. The number above reflects the manifest's current 16-skill distribution, not yours. Re-run with your own access pattern.

---

## 3. Fixture structural validity — do the golden fixtures parse?

Every shipped fixture was loaded through `loadFixtures()` and structurally validated:

| Metric | Value |
|---:|---:|
| Total fixtures shipped | **4** |
| Parsed clean | **4** |
| With latency budgets | **4** |
| With refuse-to-write assertions | **2** |

> Caveat: this is **structural** validity — fixture JSON parses, required fields exist, expectation arrays are well-formed. It is **not** end-to-end skill execution validity. Running a skill against its fixtures requires an LLM API key and is the next benchmark we will add. Until then, we don't claim "fixture pass rate" higher than "fixture parse rate".

---

## What this benchmark does NOT measure

We are deliberate about what isn't here.

- **End-to-end skill latency.** Depends on your model, your context size, your network. No single number is meaningful.
- **Token reduction from `cofounder-context-fit`.** Requires real long-context inputs to evaluate. We have not run this against a public corpus yet.
- **Sandbox preview accuracy.** Depends on the kind of operation; not a single number.
- **Adversarial guard recall** (PII, prompt injection). Lives in `@waymakerai/aicofounder-guard` and `@waymakerai/aicofounder-llm-detect`. See those packages for their own benchmarks.

If a number isn't here, we haven't measured it yet. We will not claim "70% cost reduction" or "sub-millisecond" without a reproducible script behind it.

---

## Methodology notes

- **Hardware**: numbers above were produced on a single Apple Silicon machine. Run the benchmark on your hardware for your-machine numbers.
- **Modeled costs**: published prices are taken from the constants in `benchmark.ts`. If Anthropic changes pricing, regenerate.
- **Iteration count**: 100,000 is enough to make per-call noise negligible. Mean and median agree to within 25%.
- **No warmup throwing**: 5,000 untimed warmup iterations precede measurement to let the JIT stabilize.

---

## How to add benchmarks

If you measure something else worth defending, add it to `runtime/src/cli/benchmark.ts` and re-run. The output JSON is the single source of truth — this README is a human view of what the JSON says.

Skills shouldn't grow benchmark debt. If a number ages out of date, delete it.
