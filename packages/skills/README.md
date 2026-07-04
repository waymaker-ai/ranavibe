# @waymakerai/aicofounder-skills

> **CoFounder Skill Library** — agentic skills, sub-agents, and slash commands for AI coding agents working in real codebases.

This package is the **source-of-truth** for every skill, sub-agent, and slash command CoFounder ships. The Claude Code plugin and MCP server consume from this package — write a skill once, surface it everywhere.

## What's in this package

```
src/
  feature-flow/      Spec → branch → safe draft (the CoFounder feature flow)
  codebase-intel/    Pattern discovery, scope-aware scouting
  documentation/     Diagrams, READMEs from real code
  vcs/               Commits, PR summaries, branch ops
  testing/           Test plans, scaffolding, regressions
  native/            CoFounder-native skills (compliance, cost, sandbox, second-opinion, context-fit, vibespec-author)
  fixtures/          Golden inputs/outputs for skill regression testing
runtime/             TypeScript runtime: manifest builder, telemetry, model router, sandbox preview
```

## Why a separate package?

So that:

- **The Claude Code plugin** (`packages/claude-code-plugin`) consumes skills from here.
- **The MCP server** auto-exposes every skill as an MCP tool, so non-Claude agents (Cursor, Cline, Windsurf, Claude Desktop) get the same capabilities.
- **The CI scanner** (`@waymakerai/aicofounder-ci`) replays golden fixtures to catch skill regressions.
- **The marketplace** (`@waymakerai/aicofounder-marketplace`) can publish/install third-party skills under the same schema.

## Skill schema

Every skill is a directory with at minimum a `SKILL.md`:

```
src/<category>/<skill-name>/
  SKILL.md          Required. Anthropic Agent Skills format + CoFounder extensions.
  README.md         Optional. User-facing docs.
  fixtures/         Optional. Golden input/output pairs for regression replay.
  scripts/          Optional. Helper shell/node scripts.
```

`SKILL.md` uses standard YAML frontmatter plus CoFounder extensions:

```yaml
---
name: cofounder-feature-new
description: Use when the user wants to start a new feature...
# CoFounder extensions:
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: light          # light | mid | heavy — used by per-skill router
nextSkill: cofounder-feature-implement   # for FlowSpec chaining
requires: []               # other skills that must run first
emits: [skill.run]         # telemetry event names
---
```

The CoFounder extensions are **optional and additive** — skills without them still work, they just don't get telemetry, model routing, sandbox preview, or chaining for free.

## Extension fields explained

| Field | Purpose |
|---|---|
| `sensitivity.mayTouchPII` | Guard policies (`@waymakerai/aicofounder-policies`) auto-apply if true. |
| `sensitivity.writesCode` | Skill output may modify the repo — eligible for sandbox preview. |
| `sensitivity.runsShell` | Skill executes shell commands — auto-routed through `@waymakerai/aicofounder-sandbox`. |
| `modelClass: light\|mid\|heavy` | Per-skill model routing chooses Haiku / Sonnet / Opus. Cheap-when-cheap-suffices. |
| `nextSkill` | After this skill finishes, suggest invoking the named skill. |
| `requires` | Skill IDs that must complete before this skill runs (FlowSpec chain). |
| `emits` | Telemetry events the skill publishes; consumed by `@waymakerai/aicofounder-dashboard`. |

## Build

```bash
pnpm --filter @waymakerai/aicofounder-skills build       # compile runtime
pnpm --filter @waymakerai/aicofounder-skills manifest    # regenerate MANIFEST.json
pnpm --filter @waymakerai/aicofounder-skills test        # replay golden fixtures
```

## License

MIT — © Waymaker AI
