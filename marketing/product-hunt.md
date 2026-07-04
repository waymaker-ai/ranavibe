# CoFounder — Product Hunt Launch (v2 — umbrella relaunch)

> **What changed**: this draft replaces the 2025 guardrails-only copy. The Skill Library is the headline; guardrails are the supporting layer.

---

## Tagline (60 chars max — PH limit)

> Spec, scope, ship. Guardrails for AI coding agents.

Backups (in order of preference):
- *AI coding without the cleanup. Free, MIT.*
- *Stop AI agents from wrecking your codebase.*
- *The skill library + safety net for AI agents.*

---

## Description (260 chars — PH limit)

CoFounder is a free, open-source skill library + guardrail layer for AI coding agents (Claude Code, Cursor, Cline, Windsurf). 16 curated skills run a spec→branch→safe-draft loop with secret detection, scope fences, and sandbox preview before destructive ops. MIT licensed.

Char count: 256 ✓

---

## Maker's First Comment

Hey Product Hunt! Ashley here, co-founder of Waymaker AI.

We've been shipping AI features into healthcare, fintech, and legal apps for the past year, and the same incident kept happening: an agent would commit a Stripe key, invent an API that didn't exist, or run a destructive migration against the wrong DB. Smarter models didn't fix it. We needed a flow that was hard to bypass.

CoFounder is what we built. Three things, layered:

1. **A 16-skill library.** Skills like `cofounder-feature-new` (asks clarifying questions, writes a spec), `cofounder-pattern-scout` (finds prior art before agents reinvent), and `cofounder-sandbox-preview` (runs destructive ops in isolation first). Plus 3 sub-agents and 4 slash commands.

2. **A guardrail layer.** Secret detection, PII redaction, prompt-injection blocking, compliance presets for HIPAA / GDPR / SEC / PCI / SOX / FERPA. Skills declare their sensitivity (`mayTouchPII`, `writesCode`, `runsShell`) and the runtime applies the right guard policies before they run.

3. **Per-skill model routing.** Skills declare a model class (light / mid / heavy). Our benchmarks show 33% cost savings vs. everything-on-Opus, with quality-critical skills (compliance review, second-opinion) explicitly protected from cost-driven downgrades. Numbers reproducible: `pnpm --filter @waymakerai/aicofounder-skills benchmark`.

It works in **Claude Code, Cursor, Cline, Windsurf, Claude Desktop** — every skill is auto-published as an MCP tool, so the same flow runs everywhere.

What it is **not**: a "ship a startup in 30 minutes" magic button. AI-assisted development still needs engineers, reviews, and tests. CoFounder is the part that catches the things no responsible engineer would do.

We'd love your feedback. Especially if you've watched an agent break something embarrassing — what would have caught it?

`npm install @waymakerai/aicofounder-cli && npx aicofounder init`

— Ashley Kays (Product & Strategy) & Christian Moore (Engineering & Architecture)

---

## Gallery slides (5)

1. **The flow** — One image diagramming `/spec` → `cofounder-feature-new` → `cofounder-feature-implement` → `cofounder-check`, with annotation arrows showing what the user types and what the system asserts at each step.

2. **90-second screen recording** — `marketing/screen-recording-script.md` is the storyboard. Shows install → spec → scoped diff → check → sandbox preview teaser. The single most important asset.

3. **Cross-host compatibility** — Side-by-side screenshots of the same skill running in Claude Code, Cursor, Cline, and Windsurf. Caption: *"One skill library. Every MCP-capable agent."*

4. **Compliance frame** — Before/after of a feature spec reframed against HIPAA. Same feature, but `affectedPaths` reorganized, audit-log requirements surfaced, prerequisites listed. Caption: *"Catches HIPAA findings at the spec stage, not at audit."*

5. **Reproducible benchmarks** — Screenshot of `BENCHMARKS.md` with the three numbers (preflight overhead, cost delta, fixture validity) and the command to reproduce them. Caption: *"Numbers come with a script. No marketing math."*

---

## Comments-ready FAQ

> "How is this different from Cursor rules?"

Cursor rules are project-level instructions that live in your repo. CoFounder skills are *executable* — they have their own system prompts, sensitivity declarations, and chain dependencies. A rule says "use Tailwind tokens"; a skill says "before writing code, run `pattern-scout`, then check the spec, then sandbox-preview anything destructive." Different layers, they pair well: keep your Cursor rules for in-editor habits, use CoFounder skills for the safe-flow scaffolding.

> "Why not just use Anthropic's Agent Skills format directly?"

We do — that's the substrate. CoFounder skills are valid Anthropic skills with extension fields (`sensitivity`, `modelClass`, `nextSkill`, `requires`, `emits`). A skill without those extensions still works as a plain skill; with them, it gets telemetry, cost-aware routing, sandbox preview, and FlowSpec chaining for free.

> "What happens to my code? Do you train on it?"

No. CoFounder runs entirely in your environment. There's no "CoFounder cloud" to send anything to. Telemetry writes locally to `.cofounder/telemetry.jsonl`. You bring your own LLM API keys.

> "Show me the math on '33% cost savings'."

`packages/skills/BENCHMARKS.md`. The script's at `runtime/src/cli/benchmark.ts`. The number reflects the manifest's current 16-skill class distribution at modeled token sizes — your real workload will vary, which is why we ship the script. Run it on your own usage.

> "Is this just for Anthropic models?"

The skills are model-agnostic — anything that follows system-prompt + tool-use semantics. Default routing maps `light/mid/heavy` to Haiku/Sonnet/Opus, but you can override the registry with any provider.

> "Can I write my own skills?"

Yes. `CONTRIBUTING_SKILLS.md` walks through the format. Third-party skills can be published as separate npm packages with `keywords: ["cofounder-skill"]` and installed via `@waymakerai/aicofounder-marketplace`.

---

## Links

- **GitHub**: https://github.com/waymaker-ai/cofounder
- **Website**: https://cofounder.cx
- **Skill Library**: https://cofounder.cx/docs/skills
- **Browse skills**: https://cofounder.cx/skills/browse
- **Benchmarks**: https://github.com/waymaker-ai/cofounder/blob/main/packages/skills/BENCHMARKS.md
- **MCP host setup**: https://cofounder.cx/docs/integrations/cursor (also `/cline`, `/windsurf`)
- **npm**: `@waymakerai/aicofounder-cli`, `@waymakerai/aicofounder-skills`, `@waymakerai/aicofounder-core`, `@waymakerai/aicofounder-guard`

---

## Pre-launch checklist

Before submitting:

- [ ] All `npm install @waymakerai/aicofounder-skills` commands point to a published package (block on this).
- [ ] 90-second recording shot, cut, and uploaded.
- [ ] BENCHMARKS.md re-run on a clean checkout to confirm numbers reproduce.
- [ ] GitHub repo > 50 stars (cold launches under that get torpedoed in comments).
- [ ] At least 3 founding-customer testimonials in `marketing/testimonials.md` (or pull from existing case studies).
- [ ] One real "before/after" screenshot from a real repo (with permission), not a synthetic example.
- [ ] First-comment ready in a draft, ready to paste at exact launch time (12:01 AM PT).
- [ ] Hunters confirmed (PH bumps you up the leaderboard if a credible hunter posts you).

If any item is unchecked, **delay**.
