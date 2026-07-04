# @waymakerai/claude-plugin-cofounder

CoFounder guardrails + spec-driven feature flow as a [Claude Code](https://claude.com/claude-code) plugin.

Stops agents from committing secrets, shipping mock data, refactoring out of scope, or violating your design system — without you having to tell it every session.

## What's in the plugin

| Component | Purpose |
|-----------|---------|
| `skills/cofounder-feature-new` | Turn an idea into a VibeSpec-compliant spec file |
| `skills/cofounder-feature-implement` | Scoped, spec-driven implementation on a feature branch |
| `skills/cofounder-check` | Run the full guardrail suite before opening a PR |
| `skills/cofounder-spec-review` | Structured critique of a draft spec |
| `agents/cofounder-reviewer` | Read-only diff review against VibeSpecs, with confidence-filtered findings |
| `hooks/session-start.sh` | Auto-load `.aicofounder.yml` + VibeSpecs into every session |
| `hooks/pre-edit-guardrails.sh` | Block secrets and `.env*` writes at `Edit`/`Write` time |
| `hooks/stop-summary.sh` | End-of-turn reminder to run `aicofounder check` |
| `mcp-server/` | MCP tools (`cofounder.listVibeSpecs`, `.getFeatureSpec`, `.validateAgainstVibe`, `.checkChangeset`) — callable from Claude Code, Cursor, Cline, Claude Desktop, Windsurf, or any MCP host |
| `commands/cofounder.md` | `/cofounder <new\|implement\|check\|review>` slash command |

## Install

### From source (development)

```bash
git clone https://github.com/waymaker-ai/cofounder
cd cofounder/packages/claude-code-plugin
pnpm install
pnpm --filter @waymakerai/claude-plugin-cofounder-mcp build
# Then symlink or reference from your Claude Code plugin path
```

### Published (coming soon)

```bash
claude plugin install @waymakerai/claude-plugin-cofounder
```

## Configure

Add a `.aicofounder.yml` at your repo root (or let `cofounder-feature-new` create one). Place VibeSpecs under one of:
- `specs/vibes/<id>.yml`
- `config/vibes/<id>.yml`
- `.cofounder/vibes/<id>.yml`

See [`../../spec/SPEC.md`](../../spec/SPEC.md) for the VibeSpec/FlowSpec reference.

## MCP tools exposed

All tools are callable by any MCP host. Use the Claude Code plugin install for the full experience; use the MCP server alone if you're on Cursor / Cline / Claude Desktop.

| Tool | Purpose |
|------|---------|
| `cofounder.listVibeSpecs` | Enumerate VibeSpecs in the repo |
| `cofounder.getFeatureSpec` | Load and parse a `specs/*.spec.yml` file |
| `cofounder.validateAgainstVibe` | Run scope + content checks against a specific VibeSpec |
| `cofounder.checkChangeset` | Lightweight check (secrets, env writes) without a VibeSpec |

## How the hooks work

- **SessionStart**: Reads `.aicofounder.yml`, lists VibeSpecs, and surfaces the three most recently modified `specs/*.spec.yml` files into the session so the agent inherits your rules automatically.
- **PreToolUse (Edit/Write/MultiEdit)**: Blocks (exit 2) on high-confidence secret patterns (Stripe live, OpenAI, Anthropic, AWS) and on any `.env*` write. Warns (non-blocking) on mock-data identifiers in non-test paths.
- **Stop**: If there are uncommitted changes and `.aicofounder.yml` is present, reminds the user to run `aicofounder check` or `/cofounder review` before a PR.

## Design principles

1. **Portable first.** The MCP server is the single source of truth. Skills/hooks/commands are thin adapters. Cursor/Cline/Windsurf can use the same server without any rework.
2. **Confidence-filtered.** Hooks only block on Tier-1 patterns (near-zero false positives). Tier-2 issues warn but do not block. Tier-3 issues are suppressed unless asked.
3. **No merge, no deploy.** Plugins surface risk and prepare branches — a human always reviews the diff.

## License

MIT
