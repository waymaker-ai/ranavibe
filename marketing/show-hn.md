Show HN: CoFounder – Open-source skill library + guardrails for AI coding agents

Hi HN — we built CoFounder because we kept watching AI agents do real damage in our own work and our customers': committing API keys, inventing functions that don't exist, running destructive migrations against the wrong database, leaking PII into logs. Smarter models did not fix this. We wrote down a flow that was hard to bypass.

CoFounder ships three layers, all MIT licensed, all working with your existing stack:

**1. A skill library (the new part).** 16 skills that run a spec → branch → safe-draft loop. The interesting ones:

- `cofounder-feature-new` — asks 3-5 clarifying questions before writing any code. Writes a YAML spec with acceptance criteria, affected paths, non-goals.
- `cofounder-pattern-scout` — greps for prior art before the agent invents a parallel implementation. Returns ranked matches with extend-vs-create recommendations.
- `cofounder-compliance-frame` — reframes a feature spec against HIPAA / GDPR / SEC / PCI / SOX / FERPA *before* code is written. Catches findings at the spec stage when the cost is rewriting two YAML lines, not at audit.
- `cofounder-sandbox-preview` — runs destructive operations (migrations, mass renames, side-effecting API calls) in `@waymakerai/aicofounder-sandbox` and reports what would happen. Three outcomes: safe-to-run, needs-review, blocked.
- `cofounder-second-opinion` — routes the same prompt through a different model and diffs the substance disagreements (different recommendations) from the surface ones (different word choice).

Plus 3 sub-agents and 4 slash commands. Every skill declares its sensitivity (`mayTouchPII`, `writesCode`, `runsShell`, `network`) and a model class (`light` / `mid` / `heavy`); the runtime uses these for cost-aware routing, sandbox preview, and policy enforcement.

**2. A guardrail layer.** Secret scan on Edit/Write, PII detection, prompt-injection detection, audit logging, content moderation, rate limiting, compliance presets — composable, sub-millisecond, no runtime deps. Same package family as the skills.

**3. MCP re-exposure.** Every skill is auto-published as an MCP tool, so the same flow runs in Claude Code, Cursor, Cline, Windsurf, and Claude Desktop. The Claude Code plugin gets the hooks; the others get the skills via MCP.

A few things we feel strongly about:

- **No "30-minute startup" fantasy.** AI-assisted development still needs tests, reviews, and engineers. CoFounder is the part that catches what no responsible engineer would do.
- **No proprietary cloud.** Run entirely on your infra. No telemetry leaves your repo. Bring your own LLM keys.
- **Numbers come with scripts.** Our cost-routing benchmark shows 33% savings vs everything-on-Opus across our class distribution — reproduce with `pnpm --filter @waymakerai/aicofounder-skills benchmark`. We do not claim "70%" without a script behind it.

Stack:

    npm install @waymakerai/aicofounder-cli @waymakerai/aicofounder-skills
    npx aicofounder init
    /spec Add a billing settings page with annual upgrade

We'd genuinely love your eyes on this. The skills format is Anthropic's Agent Skills (we extended it with sensitivity and chain fields). The hard part isn't writing skills — it's deciding which ones earn their place. We curated to 16 deliberately. Anything you'd add or kill?

GitHub: https://github.com/waymaker-ai/cofounder
Skill docs: https://cofounder.cx/docs/skills
Benchmarks: https://github.com/waymaker-ai/cofounder/blob/main/packages/skills/BENCHMARKS.md
Browse skills (live manifest viewer): https://cofounder.cx/skills/browse
