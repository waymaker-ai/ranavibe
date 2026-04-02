# CoFounder Implementation Plan — Q2 2026

**Date**: April 1, 2026
**Scope**: RanaVibe / CoFounder — Tiers 0-4 from STRATEGIC_OPPORTUNITIES_Q2_2026.md
**Status**: Tier 0a ✅ Complete | Tier 0e ✅ Complete (47→4 vulns, remaining are ESLint 8 transitive)

---

## Tier 0 — Security Fixes ✅ DONE

### 0a: .npmignore + "files" field ✅ COMPLETE
- Created `.npmignore` in all 42 publishable packages
- Added `"files": ["dist", "README.md", "LICENSE"]` to 8 packages that were missing it
- Created root-level `.npmignore` for defense-in-depth
- **Verification**: `find packages tools -name ".npmignore" | wc -l` = 42, zero packages missing `"files"` field

### 0e: npm audit fix ✅ COMPLETE
- Reduced from 47 → 4 vulnerabilities
- Updated `@modelcontextprotocol/sdk` to >=1.26.0 (fixed ReDoS + cross-client data leak)
- Updated `pnpm audit --fix` overrides for brace-expansion, picomatch, yaml, path-to-regexp, dompurify, lodash-es
- **Remaining**: 4 `minimatch` vulns in ESLint 8 (website transitive dep — requires ESLint 9 upgrade)

---

## Tier 1 — Post-Leak Positioning (Weeks 1-2)

### 1.1 Supply Chain Guard (`@cofounder/ci` extension) — 3 days

**What**: Add supply chain safety checks to the existing `packages/ci/` package.

**Files to create/modify**:
- `packages/ci/src/checks/supply-chain.ts` — New check module
- `packages/ci/src/checks/index.ts` — Export new check
- `packages/ci/src/__tests__/supply-chain.test.ts` — Tests

**Implementation**:
1. `verifyNpmPack()` — Run `npm pack --dry-run --json`, fail if any `.map`, `.env`, `.pem`, `.key`, or credential files present
2. `verifyLockfileIntegrity()` — Compare lockfile hash against known-good baseline, flag unexpected dependency additions
3. `detectMaliciousPackages()` — Check `npm audit --json` output, fail on critical/high severity
4. `enforcePinning()` — Scan package.json for floating versions (`^`, `~`, `*`), warn on non-pinned production deps

**Verification**: Run against CoFounder's own packages — should pass cleanly with the new `.npmignore` files.

---

### 1.2 Cowork Guard Pipeline (`@cofounder/cowork`) — 7 days

**What**: New package wrapping MCP task dispatch with guardrail checks on both input and output.

**Files to create**:
- `packages/cowork/package.json`
- `packages/cowork/src/index.ts` — Main exports
- `packages/cowork/src/guard-pipeline.ts` — Core pipeline (User → Guard → Cameron → Guard → Queue → Claude Code → Guard → Verify)
- `packages/cowork/src/task-queue.ts` — Lease-based task queue interface
- `packages/cowork/src/telemetry-firewall.ts` — Strip/log outbound analytics
- `packages/cowork/src/types.ts` — CoworkTask, GuardReport, LeaseConfig types
- `packages/cowork/src/__tests__/guard-pipeline.test.ts`
- `packages/cowork/.npmignore` — Already templated

**Dependencies**: `@waymakerai/aicofounder-core`, `@waymakerai/aicofounder-guard`

**Implementation steps**:
1. Define `CoworkTask` type matching the SQL schema in strategic doc
2. Build `GuardPipeline` class with `guardInput()` and `guardOutput()` methods
3. Wire existing `PII detection` + `injection blocking` from core as input guards
4. Add `qualityCheck()` output guard (code quality, no hardcoded secrets, no mock data)
5. Build `TelemetryFirewall` that intercepts and logs outbound analytics
6. Add lease-based timeout (auto-expire tasks if agent disconnects)

**Verification**: Unit tests simulating task flow with PII in input → should be redacted. Injection attempt in task spec → should be blocked.

---

### 1.3 Claude Code Plugin — 7 days

**What**: Package CoFounder as a Claude Code plugin with hooks, skills, and agents.

**Files to create**:
```
plugin.json                          # Plugin manifest
hooks/pre-tool-use-guard.sh          # PreToolUse hook — run guardrail on every tool call
skills/init-guardrails/              # Skill: initialize CoFounder in a project
skills/compliance-check/             # Skill: run compliance check on codebase
skills/supply-chain-audit/           # Skill: audit npm packages
agents/guardrail-scanner/            # Agent: autonomous guardrail scanning
agents/guardrail-scanner/index.md    # Agent definition with frontmatter
```

**Implementation steps**:
1. Create `plugin.json` with name, description, version, hooks array, skills array, agents array
2. Build `pre-tool-use-guard.sh` hook that:
   - Receives tool name + input via stdin
   - Runs `npx @waymakerai/aicofounder-cli check --stdin` on Write/Edit/Bash tool calls
   - Returns exit 0 (allow) or exit 2 (block with message)
3. Create init skill (generates `.rana/config.yml` + VibeSpec)
4. Create compliance-check skill (runs `npx cofound check --compliance`)
5. Create guardrail-scanner agent (scans entire codebase for security issues)

**Verification**: Install plugin locally (`claude plugins add .`), verify hooks fire on Write tool calls.

---

## Tier 2 — Distribution (Weeks 3-5)

### 2.1 Anthropic Agent SDK Adapter — 8 days

**What**: Adapter wrapping Anthropic's Agent SDK with CoFounder guardrails, mirroring the LangChain adapter pattern.

**Files to create**:
- `packages/adapters/src/anthropic-agent-sdk.ts` — Core adapter
- `packages/adapters/src/__tests__/anthropic-agent-sdk.test.ts`

**Reference pattern**: `packages/langchain/src/index.ts` (230L) — `RanaChatModel` class

**Implementation steps**:
1. Study Agent SDK's tool interceptor/middleware API
2. Create `GuardedAgentSDK` class that wraps `Agent` from `@anthropic-ai/agent-sdk`
3. Intercept tool calls: run CoFounder guard before execution, guard output after
4. Add PII redaction on all messages flowing through
5. Track costs via CoFounder's cost tracking

**Verification**: Create example agent using `GuardedAgentSDK`, verify guardrails fire on tool calls.

---

### 2.2 Telemetry Firewall (standalone) — 3 days

**What**: Move telemetry firewall from `@cofounder/cowork` into its own reusable module.

**Files**: `packages/cowork/src/telemetry-firewall.ts` → extract to `packages/core/src/telemetry/firewall.ts`

**Implementation**:
1. HTTP proxy that intercepts outbound requests to known analytics endpoints
2. Strip PII fields (email, user_id, org_uuid) from payloads
3. Log what was sent vs what was stripped (transparency report)
4. Configurable allowlist/blocklist

---

### 2.3 CoFounder ↔ Visionstack Builder Integration — 7 days

**What**: Import CoFounder core into Visionstack's builder suite, wrap code generation with guardrail checks.

**This is a cross-repo task** — implementation plan in Visionstack's `IMPLEMENTATION_PLAN_Q2_2026.md`.

CoFounder side:
1. Ensure `@waymakerai/aicofounder-core` can be imported as a dependency in a Python/React project
2. Create `@waymakerai/aicofounder-browser` lightweight bundle for client-side guard checks
3. Document integration API: `guard(code) → { passed, issues, redacted }`

---

## Tier 3 — Quality (Weeks 5-8)

### 3.1 VibeSpecs → CLAUDE.md Bridge — 4 days

**Files to create/modify**:
- `packages/agents/src/compilers/claude-md.ts` — New compiler target
- `packages/cli/src/commands/generate-claude-md.ts` — CLI command
- `packages/agents/src/compilers/cursor-rules.ts` — Bonus: `.cursorrules` export
- `packages/agents/src/compilers/index.ts` — Export all compilers

**Implementation**:
1. Read VibeSpec (JSON/YAML)
2. Extract: constraints, allowed/disallowed actions, tone, security rules, model preferences
3. Format as CLAUDE.md sections: `## Rules`, `## Security`, `## Style`
4. CLI: `cofound generate claude-md --input .rana/config.yml --output CLAUDE.md`

---

### 3.2 Enhanced MCP Server — 4 days

**Files to modify**: `packages/mcp-server/src/index.ts` (143KB — large file)

**New tools to add**:
- `ask_cameron` — Route question through Cameron with Brain context
- `create_brain_node` — Save discoveries from coding sessions
- `get_brain_digest` — Compact 500-token summary

**New resources**:
- `brain://digest` — Always-fresh summary
- `brain://outcomes` — Tracked decision results

---

## Tier 4 — Polish (Ongoing)

### 4.1 Integration Test Suite — 5 days
- Create `packages/integration-tests/`
- Suites: adapter-workflows, agent-sdk-with-guards, mcp-client-scenarios, cli-e2e-flows

### 4.2 Cursor/Windsurf Rules Export — 2 days
- Add compiler targets in `packages/agents/src/compilers/`

### 4.3 Marketing Site Conversion — 5 days
- ROI calculator page
- API reference (auto-generated from packages)
- Case study template with Visionstack dogfooding story
- "vs Guardrail alternatives" comparison grid

---

## Progress Tracking

| Item | Status | Notes |
|------|--------|-------|
| 0a: .npmignore | ✅ Done | 42 packages covered |
| 0e: npm audit | ✅ Done | 47→4 (remaining: ESLint 8 transitive) |
| 1.1: Supply Chain Guard | ⬜ Pending | |
| 1.2: Cowork Guard Pipeline | ⬜ Pending | |
| 1.3: Claude Code Plugin | ⬜ Pending | |
| 2.1: Agent SDK Adapter | ⬜ Pending | |
| 2.2: Telemetry Firewall | ⬜ Pending | |
| 2.3: Builder Integration | ⬜ Pending | Cross-repo |
| 3.1: VibeSpecs → CLAUDE.md | ⬜ Pending | |
| 3.2: Enhanced MCP | ⬜ Pending | |
| 4.1: Integration Tests | ⬜ Pending | |
| 4.2: Cursor/Windsurf | ⬜ Pending | |
| 4.3: Marketing Site | ⬜ Pending | |

---

**Document Owner**: Ashley Kays & Christian Moore
**Last Modified**: April 1, 2026
