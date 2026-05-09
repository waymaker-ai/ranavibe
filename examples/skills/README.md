# Examples — CoFounder Skill Library

Three small, runnable examples that demonstrate the skill library on real-shaped problems. End-users don't read docs; they copy examples.

| # | Example | Skills used | What you learn |
|---|---|---|---|
| 01 | [`01-feature-flow`](./01-feature-flow) | `feature-new` → `feature-implement` → `check` | The end-to-end loop. Spec, branch, scoped diff, gates. |
| 02 | [`02-hipaa-compliance`](./02-hipaa-compliance) | `compliance-frame` | How regulated-industry constraints reshape a feature *before* code is written. |
| 03 | [`03-cost-route`](./03-cost-route) | `cost-route` (via the runtime benchmark) | Real-money implications of class-correct routing — modeled and reproducible. |

## How to use

Each example is self-contained. Read its README first; the README walks through what to type and what to expect. The configs (`config/vibes/*.yml`, `.aicofounder.yml`, `specs/*.yml`) are reference material — copy them, edit them, fork them.

## What these examples are NOT

- Not full Next.js apps you should `npm run dev`. They're config + spec + README so you can see the *flow*, not so you can run a billing system.
- Not the only valid setup. Every project's VibeSpec will look different — the examples codify our defaults.

## Adding your own example

Open a PR with:
- `examples/skills/NN-your-name/README.md` — what it demonstrates
- `examples/skills/NN-your-name/specs/*.yml` — any spec files
- `examples/skills/NN-your-name/.aicofounder.yml` — the project config

We'll review and merge.
