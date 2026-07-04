# Contributing a CoFounder Skill

A skill is a markdown file that an agent reads as system context. The CoFounder runtime adds frontmatter extensions for sensitivity, model routing, chaining, and telemetry — but the heart of every skill is the markdown body that tells the agent what to do.

This guide is for adding a new skill to `@waymakerai/aicofounder-skills`. For third-party skills published outside this monorepo, see the marketplace section at the bottom.

---

## TL;DR

```bash
# 1. Make the skill
mkdir -p packages/skills/src/<category>/<skill-slug>
$EDITOR packages/skills/src/<category>/<skill-slug>/SKILL.md

# 2. Add fixtures
mkdir packages/skills/src/<category>/<skill-slug>/fixtures
$EDITOR packages/skills/src/<category>/<skill-slug>/fixtures/happy-path.json

# 3. Regenerate the manifest
pnpm --filter @waymakerai/aicofounder-skills manifest

# 4. Run tests + benchmarks
pnpm --filter @waymakerai/aicofounder-skills test
pnpm --filter @waymakerai/aicofounder-skills benchmark

# 5. Open a PR
```

---

## SKILL.md format

Every skill is a single markdown file with YAML frontmatter. The required fields come from Anthropic's Agent Skills format. The optional fields are CoFounder extensions — they're additive, so a skill without them works as a plain Anthropic skill, just without telemetry, model routing, sandbox preview, or chaining.

### Required

```yaml
---
name: cofounder-<slug>
description: Plain-language hint about when to use this skill. Should be specific enough that an agent reading 50 skill descriptions can pick the right one.
---
```

**Naming.** All bundled skills are prefixed `cofounder-`. Third-party skills should use a different prefix (`yourorg-...`) to avoid collisions in the manifest.

**Description.** Write the description from the perspective of "what is the user saying when this skill applies?" Trigger phrases in quotes work well: *"Use when the user says 'review this PR' or 'is this safe to merge'."*

### CoFounder extensions

```yaml
sensitivity:
  mayTouchPII: false       # default false; true triggers PII guard policies
  writesCode: false        # default false; true makes the skill sandbox-eligible
  runsShell: false         # default false; true forces sandbox preview
  network: false           # default false; true triggers network guard policies

modelClass: mid            # light | mid | heavy — drives the router
nextSkill: cofounder-...   # suggested follow-up; powers FlowSpec chaining
requires: []               # skills that must complete first
emits: [skill.run, ...]    # event names this skill publishes for telemetry
tools: [Read, Grep, ...]   # Anthropic Agent Skills standard — tool allowlist
```

### Body

The body is markdown. Treat it as **the system prompt the agent will read**:

- A `## When to invoke` section with concrete triggers.
- A `## Process` section with numbered steps.
- A `## Output format` section showing what the agent should return.
- A `## What NOT to do` section that enumerates failure modes.

Look at any of the existing skills for the canonical shape — `packages/skills/src/feature-flow/feature-new/SKILL.md` is a good template.

### YAML gotchas

- **Quote descriptions that contain colons followed by a space.** `description: "Use ... when sensitivity.runsShell: true"` — without the quotes, YAML parses the embedded `: true` as a nested mapping and the file fails to load.
- **No tabs in YAML.** Tabs are not whitespace in YAML; use spaces.
- **Backticks inside descriptions are fine** as long as the content inside doesn't trigger another YAML rule.

---

## Fixtures

Every skill should ship at least one fixture. Fixtures are JSON files that assert *behavior*, not exact tokens — substring matches and refused-file lists are the primary signal.

```json
{
  "id": "happy-path",
  "input": {
    "userMessage": "What the user typed",
    "files": { "path/to/file.ts": "file contents" },
    "args": { "anyOther": "input the skill needs" }
  },
  "expect": {
    "contains": ["substring that must appear"],
    "notContains": ["substring that must NOT appear"],
    "writesFiles": ["path the skill should write"],
    "refusesToWriteFiles": ["path the skill must NEVER write"],
    "maxLatencySeconds": 30
  }
}
```

The CI scanner replays fixtures on every PR. A regression — substring missing, banned substring present, file written that shouldn't be — fails the build.

**Don't fixture model output literally.** Models are non-deterministic. Assert the *shape* (presence of headings, refusal language, key file paths) not the *prose*.

---

## Sensitivity declarations — pick honestly

The runtime makes real decisions based on these flags. Misdeclaring them is worse than not declaring them at all.

| Flag | When to set true |
|---|---|
| `mayTouchPII` | The skill reads, processes, or could output any data that includes PII / PHI / financial identifiers. When in doubt, set true. |
| `writesCode` | The skill modifies files in the user's repo. Read-only analysis = false. |
| `runsShell` | The skill calls `git`, `npm`, `psql`, any shell command. Even read-only commands count. |
| `network` | The skill makes HTTP calls outside the LLM provider. |

These cascade into:
- **PreToolUse hooks** that block secret writes (Claude Code only).
- **Sandbox preview** for destructive operations.
- **Policy presets** loaded from `@waymakerai/aicofounder-policies`.
- **Host-level allowlists** that can refuse to run a skill at all.

---

## Model class — pick honestly

| Class | Use for |
|---|---|
| `light` | Classification, summarization, extraction, simple commit messages, formatting. |
| `mid` | Code generation, multi-step reasoning, RAG synthesis, refactors with moderate context. |
| `heavy` | Architecture decisions, multi-file coordination, hard reasoning, security review, compliance framing. |

The router can bump up for large context (>50K tokens) and bump down for tight cost caps — but **never** for skills in `HEAVY_NEEDS_SKILLS` (compliance, second-opinion, spec-review, vibespec-author, reviewer). If your skill's value comes from quality, add it there in `runtime/src/router.ts`.

---

## Chaining — when to declare `nextSkill` and `requires`

- **`nextSkill`** is a *suggestion*. The runtime surfaces it in the chain plan and the calling agent can choose to honor it. Use this for "after I finish, the natural next step is X".
- **`requires`** is *enforced*. The runtime computes the topological order and refuses to invoke a skill whose requirements haven't been met in the current chain. Use this only when the prerequisite is genuinely necessary — most skills should not declare any.

Cycles are detected and reported. If you see one, you've over-declared `requires`.

---

## Telemetry events — `emits`

List every event name your skill publishes. The runtime soft-warns on undeclared events; the manifest builder uses this list for documentation. Conventional events:

- `skill.run` — every skill should emit this when it starts.
- `skill.complete` — emit when finished, with `outcome: "ok" | "warn" | "fail"`.
- `skill.fail` — emit on terminal failure, with `metadata.reason`.
- Skill-specific: `spec.proposed`, `branch.created`, `compliance.violation.predicted`, etc. Use a noun.verb shape.

---

## Running the harness locally

```bash
# Compile the runtime
pnpm --filter @waymakerai/aicofounder-skills build

# Regenerate MANIFEST.json from src/
pnpm --filter @waymakerai/aicofounder-skills manifest

# Run unit tests + fixture replays
pnpm --filter @waymakerai/aicofounder-skills test

# Run benchmarks (preflight overhead, cost delta, fixture structure)
pnpm --filter @waymakerai/aicofounder-skills benchmark
```

The PR-bot will run these on every push.

---

## Semver discipline for skill schemas

Skill frontmatter is a **public contract**. Breaking changes need:

1. A version bump on `@waymakerai/aicofounder-skills`.
2. A codemod in `runtime/src/cli/codemod/<change>.ts` that transforms old skills to new.
3. A migration note in `CHANGELOG.md`.
4. A deprecation warning in the manifest builder for one minor version before removal.

What counts as breaking:

- Removing or renaming a frontmatter field.
- Changing the meaning of a value (e.g., `modelClass: light` mapping to a different default model).
- Changing the manifest output schema.

What does NOT count as breaking:

- Adding a new optional frontmatter field.
- Adding a new event name to the standard set.
- Adding a new sensitivity flag (defaulting to false).

---

## Third-party skills (community marketplace)

If your skill isn't a fit for the bundled library, publish it as a separate npm package. The CoFounder marketplace package can install it:

```ts
import { skillsMarketplace } from '@waymakerai/aicofounder-marketplace';

await skillsMarketplace.install({
  source: 'npm',
  identifier: '@yourorg/cofounder-skill-yourname',
});
```

Your package should expose:
- A `SKILL.md` (or multiple, in a `skills/` directory).
- A `package.json` with `keywords: ["cofounder-skill"]` for discovery.
- Optional `fixtures/` directory with golden fixtures.

**Naming.** Use a prefix specific to your org or project. Don't squat on `cofounder-*` — that namespace is for the bundled library.

**License.** MIT or Apache-2.0 strongly preferred; we don't list copyleft-licensed skills in the official browse page.

**Quality bar.** Ship fixtures, ship a README, declare sensitivity honestly. Skills without fixtures get a "verify locally" badge instead of a green check.

---

## Code review checklist

Before opening a PR, walk through:

- [ ] SKILL.md frontmatter parses (run `pnpm manifest` — no errors).
- [ ] Description starts with "Use this skill when…" or similar trigger language.
- [ ] Sensitivity flags are honest.
- [ ] `modelClass` is honest. (If unsure, run the skill on Sonnet first; if Sonnet handles it, set `mid`. If you needed Opus, set `heavy`.)
- [ ] At least one fixture, with at least one `contains` and one `notContains` assertion.
- [ ] No invented APIs in the SKILL.md body — every package, function, or file path you reference must exist.
- [ ] No marketing language. Imperative, factual, terse.
- [ ] Tests pass: `pnpm --filter @waymakerai/aicofounder-skills test`.
- [ ] Manifest reflects your skill: `pnpm --filter @waymakerai/aicofounder-skills manifest`.

---

## Questions

- **GitHub Discussions** — `https://github.com/waymaker-ai/cofounder/discussions` (for "how do I express X as a skill")
- **Discord** — coming soon; linked from the README when live.
- **Email** — `support@waymaker.cx`
