# Strategic Opportunities — Q2 2026 Cross-Product Analysis

**Date**: April 1, 2026
**Version**: 3.0
**Scope**: RanaVibe (CoFounder) + Visionstack (Waymaker AI)
**Authors**: Ashley Kays, Christian Moore, Claude Opus 4.6 Analysis
**Status**: Complete — All Leak Findings + Enhancement Plan Integrated

---

## Executive Summary

This document captures every actionable product opportunity across both Waymaker properties — **RanaVibe/CoFounder** (AI guardrail framework) and **Visionstack/Waymaker AI** (entrepreneurial platform) — based on deep codebase analysis performed April 1, 2026.

**Key Finding**: The two products have **zero cross-integration** despite sharing a team, brand, and complementary capabilities. CoFounder builds safety tools; Visionstack ships unguarded code generators. Connecting them is the single highest-leverage opportunity.

**The Claude Code leak (March 31, 2026) changes everything**:
- Anthropic's security-through-obscurity model just collapsed — 512K lines exposed
- CoFounder's security-by-design philosophy is now the market's validated need
- But CoFounder has the **same `.npmignore` vulnerability** that caused the leak
- Visionstack's LLM costs can drop 50-90% by stealing Claude's prompt caching patterns
- Cameron is already ahead of Claude's unreleased KAIROS daemon — but needs polish

**The AI landscape has shifted since the Jan 2026 strategic doc**:
- Claude Opus 4.6 with 1M context is live
- Claude Code plugin/skill ecosystem is booming (Vercel, Pinecone, Figma, HuggingFace all have official plugins)
- Anthropic Agent SDK is the official way to build autonomous agents
- MCP is now standard infrastructure, not experimental
- Remote triggers/cron allow scheduled Claude Code agents
- 5 new CoFounder packages just shipped: `conversation-guard`, `hallucination`, `schema-validator`, `tool-auth`, `validator-registry`

**Three source documents merged into this plan**:
1. Cross-product codebase analysis (Ashley, April 1)
2. Claude Code leak technical breakdown + Waymaker comparison (Christian, March 31)
3. Waymaker Enhancement Plan from leak insights (Christian, April 1)

---

## Part 1: RanaVibe / CoFounder Opportunities

### 1.1 🔴 Claude Code Plugin (Priority: CRITICAL)

**Gap**: No `plugin.json` exists. CoFounder has a full MCP server (`packages/mcp-server/src/index.ts`, 143KB) with PII detection, injection blocking, and compliance checks — but no Claude Code plugin wrapper.

**Why it matters**: Claude Code's plugin ecosystem is the fastest-growing distribution channel for developer tools. Vercel, Pinecone, Figma, and HuggingFace all ship official plugins. CoFounder is absent.

**What exists**:
- MCP server with guardrail tools ✅
- CLI with init/check/feature flows ✅
- No `plugin.json` ❌
- No Claude Code hooks integration ❌
- No skill definitions ❌

**Action Items**:
| # | Task | Effort | Files |
|---|------|--------|-------|
| 1 | Create `plugin.json` manifest | 1 day | `/plugin.json` |
| 2 | Create PreToolUse hook for guardrail checks | 2 days | `/hooks/pre-tool-use.sh` |
| 3 | Create skills for VibeSpec init, compliance check | 2 days | `/skills/` |
| 4 | Create agent for autonomous guardrail scanning | 1 day | `/agents/guardrail-scanner/` |
| 5 | Publish to Claude Code plugin registry | 1 day | — |

**Impact**: Immediate distribution to every Claude Code user. Zero-friction adoption.

---

### 1.2 🔴 Anthropic Agent SDK Adapter (Priority: CRITICAL)

**Gap**: LangChain adapter exists (`packages/langchain/src/index.ts`, 230 lines). CrewAI adapter exists. **No Anthropic Agent SDK adapter**.

**Why it matters**: The Agent SDK is Anthropic's official framework for building autonomous agents. CoFounder supports every framework *except* the one made by the company whose model powers most AI coding.

**What exists**:
- `packages/langchain/` — `RanaChatModel` wrapping LLM calls with guardrails ✅
- `packages/crewai/` — Parallel adapter pattern ✅
- `packages/agent-sdk/` — Has `createGuardedAgent()` factory but targets generic Anthropic SDK, NOT Agent SDK ⚠️
- `packages/adapters/src/anthropic-agent-sdk.ts` — Does NOT exist ❌

**Action Items**:
| # | Task | Effort |
|---|------|--------|
| 1 | Create `@waymakerai/aicofounder-agent-sdk` package | 3 days |
| 2 | Implement tool interceptor pattern (mirror LangChain adapter) | 2 days |
| 3 | Add integration tests with real Agent SDK workflows | 2 days |
| 4 | Documentation + examples | 1 day |

---

### 1.3 🟡 VibeSpecs → CLAUDE.md Bridge (Priority: HIGH)

**Gap**: VibeSpecs compile to system prompts but cannot generate `CLAUDE.md` files.

**What exists**:
- `packages/agents/src/vibe-spec.ts` (lines 11-48) — Full VibeSpec interface ✅
- `compileVibe()` generates systemPrompt from VibeConfig ✅
- `loadVibeSpec()` for JSON/YAML loading ✅
- No compiler target for CLAUDE.md ❌
- Planned "CompilerTarget" type referenced in docs but not implemented ❌

**Action Items**:
| # | Task | Effort |
|---|------|--------|
| 1 | Create `/packages/core/src/compiler/claude-md.ts` | 2 days |
| 2 | Add CLI command: `cofound generate claude-md` | 1 day |
| 3 | Auto-include security constraints, tone, allowed patterns | 1 day |

**Impact**: Every VibeSpec user can instantly export their rules into Claude Code projects.

---

### 1.4 🟡 Cursor/Windsurf Rules Export (Priority: HIGH)

**Gap**: No export to `.cursorrules` or Windsurf configuration.

**Why it matters**: Not everyone uses Claude Code. Cursor and Windsurf have significant market share. Same VibeSpec → different output format.

**Action**: Add compiler targets alongside CLAUDE.md generation. 1-2 days additional effort.

---

### 1.5 🟡 Claude Code Hooks Integration (Priority: HIGH)

**Gap**: Claude Code hooks (`PreToolUse`, `PostToolUse`, `Stop`) are a perfect fit for guardrail checks. No integration exists.

**Concept**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|Bash",
      "command": "npx cofound check --file $TOOL_INPUT"
    }]
  }
}
```

Every file write or bash command gets checked by CoFounder guardrails automatically.

---

### 1.6 🟢 Integration Test Coverage (Priority: MEDIUM)

**Current**: 56 test files, mostly unit tests. Only 1 E2E scenario file (`packages/core/src/__tests__/e2e-scenarios.test.ts`).

**Missing**:
- Cross-package integration tests (adapter + core)
- MCP server + Agent SDK integration tests
- CLI + core package integration flows
- Website/playground integration tests

**Action**: Create `/packages/integration-tests/` — 3-5 day effort.

---

### 1.7 🟢 Marketing Site Conversion (Priority: MEDIUM)

**What exists**: Pricing page (240L), 9 framework comparisons, playground with live detection, 22 doc categories.

**What's missing**:
- ROI calculator / cost-comparison interactive tool
- API reference page (auto-generated from packages)
- Developer testimonials / case studies
- "vs Guardrail alternatives" comparison grid
- Competitive positioning on benchmarks page (560L)

---

## Part 2: Visionstack / Waymaker AI Opportunities

### 2.1 🔴 Stripe App Store Checkout (Priority: CRITICAL — Revenue)

**Gap**: App Store module exists with code generation templates but no payment flow.

**What exists**:
- `stripe_integration_api.py` (192 lines) — Template-based code generation ✅
- `stripe_integration_service.py` (341 lines) — Full service layer ✅
- 19 Stripe-related migrations (subscriptions, payment plans, invoices, Connect, marketplace) ✅
- No app store module registry ❌
- No buyer-facing checkout flow ❌
- Products built in `/create` cannot self-serve add Stripe ❌

**Action Items**:
| # | Task | Effort |
|---|------|--------|
| 1 | Create `app_store_registry_api.py` with module manifest system | 3 days |
| 2 | Build frontend module browser + checkout flow | 3 days |
| 3 | Wire Stripe subscription status into feature gates | 2 days |
| 4 | Test end-to-end purchase → activation flow | 2 days |

**Impact**: Direct revenue enablement. Currently impossible to monetize premium modules.

---

### 2.2 🔴 AI Community Events Backend Deployment (Priority: CRITICAL — Differentiator)

**Gap**: Frontend is built, backend has endpoints, but realtime layer is missing.

**What exists**:
- Frontend: `EventChatPanel`, `EventsPage`, `liveEventService.ts` (80L REST calls) ✅
- Backend: `live_events_api.py` (7.5KB, 11 endpoints) for registration, rooms, recording ✅
- Database: 4 event migrations including `founder_personas_and_event_chat.sql` ✅
- WebSocket/Realtime subscriptions: ZERO ❌
- Scheduled event tasks (Celery/cron): NONE ❌
- Human-joins-mid-session detection: NONE ❌

**Action Items**:
| # | Task | Effort |
|---|------|--------|
| 1 | Add Supabase Realtime subscriptions to event chat | 2 days |
| 2 | Create `event_scheduler_tasks.py` for recurring events | 2 days |
| 3 | Implement participant notification system | 1 day |
| 4 | Deploy + test end-to-end event flow | 2 days |

---

### 2.3 🔴 Leads HQ Unified Dashboard (Priority: HIGH)

**Gap**: Architecture is solid, frontend is 60% incomplete.

**What exists**:
- Design spec: 2026-03-21 detailed plan (50+ components) ✅
- Backend: `leadsHqService.ts` (118L), 3 database migrations, endpoints drafted ✅
- `unified_leads` database view ✅
- Apollo enrichment integration planned ✅
- Missing React components: `AllLeadsTab`, `LeadDetailDrawer`, `EnrichmentCard`, `ConversationList`, `ChatPanel` ❌
- Supabase Realtime for live conversation sync: ZERO usage across entire codebase ❌

**Important Finding**: Supabase Realtime has ~10 files with some usage, but coverage is spotty. Leads HQ, Events chat, and Product Brain specifically lack realtime subscriptions and are polling-based.

---

### 2.4 🟡 Cameron Intelligence Upgrade (Priority: HIGH)

**What exists**: Massive — 23 dedicated API files totaling 13,307 lines of backend code. 7 Cameron-specific schema migrations. Bond system, moment detection, intelligence upgrades, routing, personality.

**Gap**: Tools system is partially wired.
- `cameron_tools.py` source EXISTS (4,154 lines) — **CORRECTION**: earlier analysis incorrectly reported only `.pyc`
- 40+ tools planned, some implemented but not fully wired into agentic dispatch
- Tool dispatch system needs completion, not recovery

**Action**: Wire existing `cameron_tools.py` tools into agentic dispatch system. Expose via MCP.

---

### 2.5 🟡 Supabase Realtime (Priority: HIGH — Platform-Wide)

**Finding**: **ZERO** Supabase Realtime subscriptions exist anywhere in the Visionstack codebase.

**Affected features**:
- AI Community Events chat (polling)
- Leads HQ conversations (polling)
- Product Brain collaboration (single-player)
- Task updates (manual refresh)
- Notifications (no push)

**Action**: Create shared `useSupabaseRealtime` hook, apply to Events → Leads → Brain in that order.

---

### 2.6 🟡 PWA & Push Notifications (Priority: HIGH)

**What exists**:
- `pwaService.ts` (685 lines) — More substantial than initially assessed, has interface definitions + logic ✅
- `generate-pwa-icons.html` in public/ ✅
- No service worker ❌
- No `vite-plugin-pwa` ❌
- No manifest integration ❌
- No notification subscription flow ❌

**Action**: Install `vite-plugin-pwa`, implement WorkboxJS service worker, add notification permission flow. 3-day effort.

---

### 2.7 🟢 Assessment → Academy Recommendations (Priority: MEDIUM)

**Gap**: Assessments collect user data (DiSC, energy patterns, motivation types) but don't feed into the 44-course, 807-lesson Academy to suggest personalized learning paths.

**Action**: Create recommendation engine mapping assessment results to course suggestions. 2-3 day effort.

---

### 2.8 🟢 Google Calendar ↔ Events Bridge (Priority: MEDIUM)

**Gap**: Google Calendar integration exists. AI Events exist. They don't talk to each other.

**Action**: Auto-create calendar events when users RSVP. Sync event times. 1-2 day effort.

---

## Part 3: Cross-Product Opportunities

### 3.1 🔴 CoFounder Guardrails in Visionstack Builder (Priority: CRITICAL)

**The #1 opportunity across both products.**

**Current state**: Visionstack has 6 builder variations (Simple, Enhanced, Gamma, Pipeline, V3, Unified) that generate code. CoFounder has guardrail tools that check code for security, quality, and compliance. **They are completely disconnected.**

**Impact**:
- Visionstack builders produce higher-quality code
- CoFounder gets a real-world production deployment + case study
- Users see guardrails in action before adopting CoFounder standalone
- "Waymaker AI: the only platform that safety-checks its own AI output"

**Action Items**:
| # | Task | Effort |
|---|------|--------|
| 1 | Import CoFounder core as dependency in Visionstack | 1 day |
| 2 | Wrap builder code generation with guardrail checks | 3 days |
| 3 | Show guardrail results in builder UI (pass/fail indicators) | 2 days |
| 4 | Write case study for CoFounder marketing site | 1 day |

---

### 3.2 🟡 Cameron ↔ CoFounder Personality Bridge (Priority: MEDIUM)

**Concept**: Cameron's personality system (bond, moments, intelligence layers) could inform CoFounder's VibeSpec tone/constraints. A founder's AI co-founder personality shapes how guardrails communicate.

---

### 3.3 🟡 Unified Analytics Dashboard (Priority: MEDIUM)

**Concept**: CoFounder tracks LLM costs/usage. Visionstack tracks user engagement. A unified dashboard showing "AI spend vs business outcome" would be unique in the market.

---

## Part 4: Visionstack Enhancements — Stolen from the Leak

> These are specific technical improvements for the Waymaker AI platform derived from
> analyzing Claude Code's internal architecture. Source: Christian Moore's analysis session.

### 4.1 🔴 Anthropic Prompt Caching — CRITICAL (50-90% Cost Reduction)

**The problem**: Waymaker's `anthropic_provider.py` is 57 lines with zero `cache_control` blocks. Cameron's 15K-30K token system prompts are sent fresh on every call. Anthropic gives a **90% discount on cached input tokens**.

**What Claude does**: Tracks 14 cache-break vectors. Uses "sticky latches" to prevent mode toggles from invalidating cache. Treats cache invalidation as an accounting problem.

**What to build**:
- Restructure `AnthropicProvider.call()` to accept block-based `system` content with `cache_control` markers
- Split system prompt: (a) agent personality/instructions [cached], (b) brain digest [cached], (c) task-specific context [not cached]
- Track `cache_creation_input_tokens` and `cache_read_input_tokens` in `llm_usage` table

**Files to modify**:
- `backend/services/llm_providers/anthropic_provider.py` — add `cache_control: {"type": "ephemeral"}` blocks
- `backend/services/llm_gateway.py` — add `cacheable_system_blocks` to `LLMRequest`
- `backend/services/llm_providers/base_provider.py` — update `ProviderResponse` with cache metrics
- `backend/agents/base_agent.py` — in `call_llm()`, split system_message into cached/uncached

**Effort**: 3-4 days | **Impact**: 50-90% reduction in input token costs

---

### 4.2 🔴 Brain Digest (Always-in-Context Summary) — CRITICAL

**The problem**: STANDARD tier loads 15K tokens of brain context per call. LIGHT tier loads 3K. Both are expensive and often redundant.

**What Claude does**: MEMORY.md is a lightweight index (~150 chars/entry) always in context. Full details loaded on-demand only.

**What to build**:
- `generate_digest(user_id, product_plan_id)` in `BrainContextService` — uses Haiku to compress brain state into ~500 tokens
- Contents: one-line vision, top 3 priorities, current phase, key blockers, active personas, tech stack, last decision
- Store in `product_plans.brain_digest` column (TEXT)
- Regenerate on brain cache invalidation (debounced, max 1x per 5 min)
- Inject as the first cached block in every LLM call (pairs with 4.1)
- LIGHT tier switches from 3K full nodes to 500-token digest = **6x cheaper**

**Files to modify**:
- `backend/services/brain_context_service.py` — add `generate_digest()`, call on invalidation
- `backend/services/brain_service.py` — trigger digest regen on node CRUD
- New migration: `brain_digest` TEXT column on `product_plans`
- `backend/services/llm_gateway.py` — auto-prepend digest to all requests

**Effort**: 3-4 days | **Impact**: 6x cheaper LIGHT context, ambient awareness in every call

---

### 4.3 🔴 Dream Mode v2: Brain Consolidation — HIGH

**The problem**: Current Dream Mode builds new brain nodes but never consolidates existing ones. Over months, the Brain accumulates cruft, duplicates, and contradictions.

**What Claude built (unreleased)**: KAIROS `autoDream` — background memory consolidation that merges observations, eliminates contradictions, converts vague insights into verified facts.

**What to build**: `consolidate_brain(user_id, product_plan_id)` in `CameronAutonomousService`:
1. **Duplicate detection**: LLM-powered semantic similarity, merge nodes >0.85 similar
2. **Contradiction detection**: find conflicting information (two pricing strategies, contradictory personas)
3. **Stale pruning**: flag nodes not updated in 90+ days for user review
4. **Forgotten priorities**: surface "high priority" nodes with zero recent activity
5. **Link inference**: suggest connections between unlinked but related nodes
- Run weekly via Celery Beat
- Output as "Brain Health Report" nudge with actionable suggestions
- **User approves merges/deletions** — Cameron suggests, doesn't auto-delete

**Files**: `cameron_autonomous_service.py`, new Celery Beat schedule, `cameron_nudge_service.py` (new `brain_health` type)

**Effort**: 5-7 days | **Impact**: Living, self-healing Brain that improves over time

---

### 4.4 🟡 Frustration Regex Pre-Filter — HIGH

**The problem**: Cameron's moment detection is LLM-based and runs every 5 min. A user typing "this is broken wtf" waits for scheduled inference.

**What Claude does**: Regex-based frustration detection (`userPromptKeywords.ts`) — ~20+ patterns in <1ms before LLM call.

**What to build**: `detect_frustration(message: str) -> Optional[float]` in Cameron router:
- Regex patterns: profanity, complaint phrases ("nothing works", "waste of time", "I give up", ALL CAPS)
- When confidence > 0.7, inject `frustration_detected: true` into request metadata
- Prepend de-escalation instruction: "Acknowledge frustration. Be concise. Solve the immediate problem. Skip cheerfulness."

**Files**: `cameron_router.py`, `cameron_brain_agent.py`

**Effort**: 1-2 days | **Impact**: Instant empathy, zero extra cost

---

### 4.5 🟡 Auto-Compaction Failure Limit — HIGH

**The problem**: Waymaker compacts at 70% context capacity using Haiku but has no failure limit. Claude was wasting **250K API calls/day** from infinite compaction retries before they added one.

**What to build**: Add `_compaction_failures: int = 0` counter. After 3 consecutive failures → stop trying for that session, log warning.

**Files**: `base_agent.py`

**Effort**: 0.5 days | **Impact**: Prevents runaway costs

---

### 4.6 🟡 Cross-Session Outcome Tracking — HIGH

**The problem**: Claude Code sessions are isolated. Waymaker can track whether advice actually worked.

**What to build**:
- New `brain_outcomes` table: `advice_node_id`, `metric_type`, `baseline_value`, `current_value`, `measured_at`, `attribution_confidence`
- Tag strategic advice brain nodes as `trackable_decision`
- Daily cron pulls metrics from connected sources (Stripe, GA4) and compares against baselines
- Surface in Cameron briefings: "3 weeks ago you switched to annual pricing. Revenue is up 18%."

**Effort**: 5-7 days | **Impact**: Proves advice works, builds irreplaceable trust

---

### 4.7 🟡 Proactive Relationship Management — HIGH

**What to build** — 3 new nudge detectors:
- `accountability_check`: user set a goal/deadline in Brain → Cameron checks daily
- `hard_question`: periodic challenges ("burn rate at current spend = 8 months, have you considered...?")
- `blind_spot_alert`: detect patterns like "no customer conversations in 3 weeks" or "all tasks are feature-building, none are sales"
- Max 2 proactive nudges per day to avoid fatigue

**Effort**: 3-4 days | **Impact**: Cameron feels like a real partner

---

### 4.8 🟢 Founder DNA (Decision Pattern Learning) — MEDIUM

**What to build**: `founder_dna_profile` table — `decision_speed`, `risk_tolerance` (0-10 from actual choices), `timeline_accuracy` (predicted vs actual), `cognitive_biases`, `strength_areas`, `blind_spots`
- Build passively from decisions captured as brain nodes
- Inject into agent context: "This founder underestimates timelines by ~30%. Auto-adjust."
- Surface periodically: "I've noticed you consistently choose speed over quality in infrastructure decisions."

**Effort**: 5-7 days | **Impact**: Deep personalization moat — un-replicable by new tools

---

### 4.9 🟢 ULTRAPLAN / Deep Think Mode — MEDIUM

**What Claude built (unreleased)**: Remote deep-thinking sessions in cloud containers, up to 30-minute windows, with approval before executing.

**What to build for Waymaker**: For complex business planning (market entry, competitive analysis, full business plan), an async "deep think" mode:
- Multi-step, multi-minute analysis using multiple LLM calls, web research, and Brain context
- Cameron presents results when done: "Cameron is thinking deeply about your strategy..."
- Premium feature potential

**Effort**: 5-7 days | **Impact**: Premium differentiator

---

### 4.10 🟢 Enhanced MCP Server — MEDIUM

**What exists**: `brain-mcp.ts` exposes Brain resources with PII redaction.

**What to add**:
- Tools: `ask_cameron` (question with Brain context), `create_brain_node` (save coding discoveries), `get_brain_digest`
- Resources: `brain://digest` (500-token summary), `brain://outcomes` (tracked decisions)
- Prompts: `code_with_context` (pre-built prompt with Brain Digest + tech stack + sprint)

**Effort**: 3-4 days | **Impact**: Definitive bridge between Waymaker and any IDE

---

### 4.11 🟢 Dynamic CLAUDE.md Generation — MEDIUM

**What to build**: `GET /api/brain/{product_id}/claude-md` endpoint
- Include: product vision, current phase, active sprint items, tech stack, key decisions, blockers
- Expose via MCP as resource
- CLI: `waymaker sync` to refresh

**Effort**: 2-3 days | **Impact**: Auto business context in every coding session

---

## Part 4B: Competitive Positioning — Waymaker vs Claude Code

| Area | Claude Code | Waymaker | Edge |
|------|------------|---------|------|
| Domain expertise | General coding | 57 specialized agents (sales, coaching, marketing, dev) | **Waymaker** |
| Knowledge graph | Flat file memory | Full graph with nodes, links, semantic search | **Waymaker** |
| User relationship | Transactional tool | Cameron bond, nudges, moments, attachment | **Waymaker** |
| Business context | None (code only) | Brain captures vision, strategy, risks, milestones | **Waymaker** |
| Multi-agent coordination | Coordinator + workers | Agent router + 57 specialists + signal pipeline | **Waymaker** |
| Background autonomy | KAIROS (unreleased) | Cameron autonomous service (live) | **Waymaker** |
| Security hardening | 23 bash checks, attestation | CoFounder: 35+ injection patterns, PII redaction, compliance | **Waymaker** |
| Cache optimization | 14 cache-break vectors tracked | Cost tracking but no cache optimization (yet) | **Claude** |
| Memory efficiency | 3-layer with strict discipline | Full graph (potentially over-loading context) | **Claude** |
| Tool permissions | Per-tool, per-user gating | `tool-auth` package (NEW — just shipped) | **Converging** |

**Strategic position**: Complementary, not competitive. Waymaker is the **business brain**, Claude Code is the **coding hands**. The MCP integration makes them work together.

---

## Part 5: Claude Code Leak — What Happened & Technical Analysis

### 5.0 What Happened

On March 31, 2026, Anthropic accidentally published **512,000 lines of Claude Code source** (~1,900 files) to the public npm registry. A 59.8 MB source map file (.map) was bundled in version 2.1.88 of `@anthropic-ai/claude-code` due to a **missing `.npmignore` entry**. Security researcher Chaofan Shou spotted it, posted on X, and within hours the codebase was mirrored across GitHub. One clean-room rewrite hit 50K GitHub stars in 2 hours.

**Compounding factor**: Simultaneously, the `axios` npm package (100M+ weekly downloads) was compromised with a Remote Access Trojan via a poisoned dependency (`plain-crypto-js`). Anyone who installed/updated Claude Code between 00:21-03:29 UTC March 31 may have pulled in the RAT.

### 5.1 What Was Exposed

| Codename | What It Is | Implication |
|----------|-----------|-------------|
| **KAIROS** | Unreleased autonomous daemon mode — always-on background agent | Shows where agentic AI is headed: persistent, unsupervised agents |
| **autoDream** | Background memory consolidation while user is idle — merges observations, removes contradictions | Unsupervised subprocess reads ALL session transcripts |
| **Undercover Mode** | Strips Anthropic traces when contributing to public OSS ("don't blow your cover") | Anthropic uses Claude Code stealthily in OSS without disclosure |
| **Anti-Distillation** | Injects fake tool definitions into API traffic to poison competitors' training data | User API traffic carries decoy payloads — now exposed and useless |
| **Frustration Regexes** | Regex-based sentiment detection for when users swear at the tool | User emotional state tracked, opaque to user |
| **44 Feature Flags** | Fully built but unshipped features behind compile-time flags | Full internal roadmap exposed |
| **CHICAGO** | Computer use / desktop control — mouse clicks, keyboard, clipboard, screenshots | Deep system access when enabled |
| **Analytics Pipeline** | Phones home with user ID, session ID, email, org UUID, platform, terminal type | Extensive telemetry on every session |

### 5.2 What Claude Code LACKS That CoFounder HAS

The leak revealed Claude Code has **no runtime guardrail layer**:

| Security Concern | Claude Code | CoFounder |
|-----------------|-------------|-----------|
| System prompt extraction | No protection — source IS the prompt now | `system_leak` injection category blocks 4+ extraction patterns (weight 7-9) |
| PII in agent traffic | Analytics collects email, user ID, org UUID — no PII redaction on content | 11+ PII types auto-redacted before any LLM call |
| Prompt injection | No runtime detection in leaked code | 35+ patterns across 8 categories, weighted scoring, configurable sensitivity |
| Anti-distillation (IP) | Fake tool injection — now exposed and useless | Not needed — guard pipeline doesn't rely on security-through-obscurity |
| Supply chain safety | No verification of what gets published | CI guardrail (`@cofounder/ci`) scans PRs for hardcoded keys, PII, unapproved models |
| Build artifact leakage | Missing .npmignore shipped source maps | Quality gates can enforce `npm pack --dry-run` checks pre-publish |
| Compliance | None | 9 frameworks: HIPAA, GDPR, SEC, PCI-DSS, SOX, FERPA, CCPA, COPPA, Safety |
| Cost visibility | Hidden — no user-facing cost tracking | Real-time cost tracking, budget enforcement, 70% optimization |
| Behavioral constraints | System prompts only (now leaked) | VibeSpecs with enforced allowed/disallowed actions |
| Audit trail | Analytics telemetry (for Anthropic, not the user) | SHA256 tamper-proof audit logs (for the user/team) |

**Core insight**: Claude Code's security was **security-through-obscurity** — hidden source, hidden flags, hidden anti-distillation traps. Once the source leaked, ALL protections evaporated. CoFounder's security is **security-by-design** — guard patterns, PII detection, and injection blocking work even when the source code is public (MIT-licensed).

### 5.3 Implications for Cowork

**What Cowork does today**: Cameron dispatches tasks to Claude Code via MCP. Claude Code claims tasks, executes with Brain context, reports results back.

**What the leak reveals about the risk**: When a user runs Cowork, they're running Claude Code with a **now-public attack surface**:
1. Internal architecture is public — adversaries know exactly how data flows
2. Session transcripts are read by background processes (autoDream)
3. Analytics phones home with user identity on every session
4. Supply chain attacks can inject RATs through npm dependencies
5. Feature flags can enable capabilities (CHICAGO/desktop control) users don't know about

### 5.4 New Products to Build

#### 5.4.1 🔴 Cowork Guard Pipeline (`@cofounder/cowork`) — CRITICAL

The full guarded task flow:

```
User Request
  → Auth Check (JWT + RLS)
  → CoFounder Guard (PII redact + injection block)
  → Cameron (AI Cofounder) analyzes intent
  → Task Spec generated with constraints
  → CoFounder Guard on task spec (no PII in dispatch payload)
  ↓
Cowork Queue (dedicated table, RLS-protected, lease-based)
  ↓
Claude Code claims via MCP
  → CoFounder Guard on MCP inputs (every tool call)
  → Execution with Brain context
  → CoFounder Guard on outputs (PII scan + quality check)
  ↓
Result Verification
  → Cameron reviews (automated quality gate)
  → User approval gate (for high-impact changes)
  → Brain update (knowledge graph)
  → Audit log (tamper-proof)
```

**Cowork Tasks Table** (with RLS):

```sql
CREATE TABLE cowork_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_plan_id UUID REFERENCES product_plans(id),
  title TEXT NOT NULL,
  spec JSONB NOT NULL,
  context JSONB,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','claimed','in_progress','review','completed','failed','expired')),
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  lease_expires_at TIMESTAMPTZ,
  result JSONB,
  guard_report JSONB,
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE cowork_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their cowork tasks"
  ON cowork_tasks FOR ALL
  USING (auth.uid() = user_id);
```

#### 5.4.2 🔴 Supply Chain Guard — CRITICAL

After what happened with axios + the .npmignore leak, add to `@cofounder/ci`:
- `npm pack --dry-run` verification — fail pipeline if .map, .env, or credential files present
- Lockfile integrity check — flag unexpected dependency changes
- Known-malicious package detection — check against npm advisories before install
- Dependency pinning enforcement — no floating versions in production

#### 5.4.3 🟡 Telemetry Firewall — HIGH

Block or redact outbound telemetry that Claude Code sends:
- Strip email, org UUID from analytics payloads
- Log what's being sent home (transparency)
- Optional: proxy all Claude API traffic through CoFounder for inspection

### 5.5 The Narrative

> *"On March 31, 2026, Anthropic accidentally published 512,000 lines of Claude Code's source code. The leak revealed there were no runtime guardrails — no PII protection, no injection blocking, no audit trail for users. Their security was obscurity. Now that obscurity is gone.*
>
> *CoFounder is different. Our guard pipeline works even when the source code is public — because it's open-source by design. Every LLM call goes through PII redaction, injection blocking, and compliance checking. Every cowork task has an audit trail. Every output is verified before it touches your data.*
>
> *If you use Claude Code, Cursor, Windsurf, or any AI coding tool — CoFounder is the guardrail layer they should have had."*

---

## Part 6: Security Audit — Open Vulnerabilities

> **WARNING**: All previously identified security gaps remain **UNFIXED** as of April 1, 2026.
> These MUST be resolved before building new features.

### 6.1 🚨 CoFounder Has the SAME Vulnerability That Caused the Claude Leak

**Finding**: Zero `.npmignore` files exist anywhere in the RanaVibe/CoFounder repository.

| Package | `.npmignore` | `"files"` in package.json | Risk |
|---------|-------------|--------------------------|------|
| `@waymakerai/aicofounder-cli` (`tools/cli/`) | MISSING | MISSING | Source, .env, tests would publish |
| `@waymaker/aicofounder-pro` (`tools/waymaker-aicofounder-pro/`) | MISSING | MISSING | Source, .env, tests would publish |
| All other packages | MISSING | MISSING | Same risk |

**This is the exact same class of bug that exposed Claude Code.** Fix this before publishing anything to npm.

### 6.2 🚨 Visionstack RLS Policies Still Permissive

| Table | Policy | Status |
|-------|--------|--------|
| `key_results` | `USING (true)` | FIX_RLS_POLICIES.sql exists but **NOT confirmed run in production** |
| `external_task_links` | `USING (true)` | Same |
| `okr_updates` | `USING (true)` | Same |
| `ux_workshops` | `USING (true)` | **NEW** — not covered by FIX_RLS_POLICIES.sql |
| `workshop_activities` | `USING (true)` | **NEW** — not covered |
| `workshop_templates` | `USING (true)` | **NEW** — not covered |

### 6.3 🚨 Unauthenticated API Endpoints

| Endpoint | File | Issue |
|----------|------|-------|
| `/api/analyze/file` | `backend/api/analysis_api.py` | `user_id: str = "demo-user"` — hardcoded default, no auth |
| `/api/ai/chat` | `backend/api/ai_chat.py` | No `Depends(get_current_user)` — completely open |
| `/public/chat` | `backend/api/embed_widget_api.py` | Intentionally public but needs rate limiting review |

### 6.4 🚨 Auth Tokens in localStorage (12+ Components)

**Confirmed still present in**:
- `ResumeBuilder.tsx` — `localStorage.getItem('supabase.auth.token')`
- `CoverLetterGenerator.tsx` — same
- `AIBuilderTrailIntegration.tsx` — same
- `BuildStageEnhanced.tsx` — `localStorage.getItem('auth_token')`
- `TrackStageEnhanced.tsx` — same pattern
- `ZapierIntegration.tsx`, `FigmaIntegration.tsx` — same
- `UpgradeModal.tsx`, `SupabaseSecurityAdvisors.tsx` — same
- `OfferBuilder.tsx`, `MessagingFramework.tsx`, `ICPMapper.tsx` — same

**No httpOnly cookies implemented.** Only PostHog analytics has `secure_cookie: true`.

### 6.5 npm Audit Vulnerabilities

8 known vulnerabilities flagged (severity unconfirmed — requires `npm audit` run).

---

## Part 7: Master Priority Matrix (Security-First, 30 Items)

> Combines all three source documents. Items tagged with origin:
> [A] = Ashley's cross-product analysis, [C] = Christian's leak analysis, [S] = Security audit

### Tier 0 — Fix NOW (Security — Before ANY New Features) [~6.5 days]

| # | Task | Product | Effort | Origin | Risk if Ignored |
|---|------|---------|--------|--------|-----------------|
| 0a | ~~Add `.npmignore` / `"files"` to ALL CoFounder packages~~ | CoFounder | ✅ DONE | [S] | 42 packages covered, 8 `"files"` fields added |
| 0b | Run `FIX_RLS_POLICIES.sql` in production + workshop tables | Visionstack | 1 day | [S] | Any auth'd user reads all OKR data |
| 0c | Add auth to `/analyze/file` and `/ai/chat` endpoints | Visionstack | 1 day | [S] | Unauthenticated AI chat + file analysis |
| 0d | Migrate auth tokens from localStorage to Supabase sessions | Visionstack | 3 days | [S] | XSS steals auth tokens |
| 0e | ~~Run `npm audit fix`~~ | Both | ✅ DONE | [S] | 47→4 vulns (remaining: ESLint 8 transitive) |

### Tier 1 — Weeks 1-2: Quick Wins + Post-Leak Positioning [~25 days]

| # | Task | Product | Effort | Origin | Impact |
|---|------|---------|--------|--------|--------|
| 1 | Anthropic prompt caching | Visionstack | 4 days | [C] | 50-90% input cost reduction |
| 2 | Brain Digest (always-in-context 500-token summary) | Visionstack | 4 days | [C] | 6x cheaper LIGHT context |
| 3 | Auto-compaction failure limit | Visionstack | 0.5 day | [C] | Prevents runaway costs |
| 4 | Frustration regex pre-filter | Visionstack | 2 days | [C] | Instant empathy, zero cost |
| 5 | Supply Chain Guard (`@cofounder/ci`) | CoFounder | 3 days | [A] | Prevents npm leaks |
| 6 | Cowork Guard Pipeline (`@cofounder/cowork`) | Both | 7 days | [A] | Secure task dispatch |
| 7 | Claude Code Plugin (`plugin.json` + hooks + skills) | CoFounder | 7 days | [A] | Distribution explosion |

### Tier 2 — Weeks 3-5: Revenue + Distribution [~26 days]

| # | Task | Product | Effort | Origin | Impact |
|---|------|---------|--------|--------|--------|
| 8 | Stripe App Store Checkout | Visionstack | 10 days | [A] | Revenue enablement |
| 9 | Agent SDK Adapter | CoFounder | 8 days | [A] | Market completeness |
| 10 | CoFounder ↔ Visionstack Builder Integration | Both | 7 days | [A] | Cross-product moat |
| 11 | Telemetry Firewall | CoFounder | 3 days | [A] | Transparency differentiator |

### Tier 3 — Weeks 5-8: Product Quality + Cameron Intelligence [~38 days]

| # | Task | Product | Effort | Origin | Impact |
|---|------|---------|--------|--------|--------|
| 12 | Dream Mode v2: Brain Consolidation | Visionstack | 7 days | [C] | Living, self-healing Brain |
| 13 | Cross-Session Outcome Tracking | Visionstack | 7 days | [C] | Proves advice works |
| 14 | Supabase Realtime (platform-wide) | Visionstack | 5 days | [A] | Live experience |
| 15 | AI Events Backend Deploy | Visionstack | 7 days | [A] | Differentiator |
| 16 | Enhanced MCP Server (ask_cameron, brain_digest tools) | Both | 4 days | [C] | IDE bridge |
| 17 | Dynamic CLAUDE.md Generation | Both | 3 days | [C] | Auto business context |
| 18 | VibeSpecs → CLAUDE.md Bridge | CoFounder | 4 days | [A] | Developer adoption |
| 19 | Leads HQ Frontend Completion | Visionstack | 5 days | [A] | Feature completion |
| 20 | Proactive Nudges (accountability, hard questions) | Visionstack | 4 days | [C] | Cameron partnership feel |

### Tier 4 — Ongoing: Polish + Moat Deepening [~38 days]

| # | Task | Product | Effort | Origin | Impact |
|---|------|---------|--------|--------|--------|
| 21 | Founder DNA (decision pattern learning) | Visionstack | 7 days | [C] | Deep personalization moat |
| 22 | ULTRAPLAN / Deep Think Mode | Visionstack | 7 days | [C] | Premium feature |
| 23 | Ambient Business Intelligence | Visionstack | 4 days | [C] | Always-on market awareness |
| 24 | PWA + Push Notifications | Visionstack | 3 days | [A] | Engagement |
| 25 | Cameron Tools Recovery | Visionstack | 3 days | [A] | Agent capability |
| 26 | Integration Test Suite | CoFounder | 5 days | [A] | Reliability |
| 27 | Cursor/Windsurf Rules Export | CoFounder | 2 days | [A] | Non-Claude users |
| 28 | Marketing Site Conversion | CoFounder | 5 days | [A] | Adoption |
| 29 | Assessment → Academy Bridge | Visionstack | 3 days | [A] | Personalization |
| 30 | Calendar ↔ Events Bridge | Visionstack | 2 days | [A] | UX polish |

### Summary by Product

| Product | Tier 0 | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total |
|---------|--------|--------|--------|--------|--------|-------|
| **CoFounder** | 1.5d | 17d | 18d | 4d | 12d | ~52.5d |
| **Visionstack** | 5.5d | 10.5d | 10d | 35d | 26d | ~87d |
| **Both** | — | 7d | 7d | 7d | — | ~21d |
| **Total** | **6.5d** | **27.5d** | **28d** | **39d** | **38d** | **~139d** |

---

## Appendix A: Key File Paths Referenced

### RanaVibe / CoFounder
- MCP Server: `packages/mcp-server/src/index.ts` (143KB)
- VibeSpec: `packages/agents/src/vibe-spec.ts` (lines 11-48)
- LangChain Adapter: `packages/langchain/src/index.ts` (230L)
- Agent SDK: `packages/agent-sdk/`
- E2E Tests: `packages/core/src/__tests__/e2e-scenarios.test.ts`
- CLI package.json (missing files/npmignore): `tools/cli/package.json`
- Pro package.json (missing files/npmignore): `tools/waymaker-aicofounder-pro/package.json`
- Previous Strategy Doc: `docs/STRATEGIC_OPPORTUNITIES_2026.md`

### Visionstack / Waymaker AI
- Stripe API: `backend/api/stripe_integration_api.py` (192L)
- Stripe Service: `backend/api/stripe_integration_service.py` (341L)
- Events API: `backend/api/live_events_api.py` (7.5KB)
- Events Frontend: `frontend/src/components/events/`
- Leads Service: `frontend/src/services/leadsHqService.ts` (118L)
- Cameron APIs: 23 files, 13,307 lines in `backend/api/cameron_*`
- PWA Service: `frontend/src/services/pwaService.ts` (60L)
- Product Brain: `frontend/src/components/brain/`
- RLS Fix Script: `migrations/FIX_RLS_POLICIES.sql` (312L)
- Unauth endpoint: `backend/api/analysis_api.py` (analyze_file)
- Unauth endpoint: `backend/api/ai_chat.py` (ai_chat)
- localStorage auth: 12+ components (see Section 5.4)

### New Packages (Landed April 1, 2026 — git pull)
- `packages/conversation-guard/` — Multi-turn conversation manipulation detection
- `packages/hallucination/` — Hallucination detection (Claude Code has nothing equivalent)
- `packages/schema-validator/` — Schema validation for structured LLM outputs
- `packages/tool-auth/` — Per-tool permission gating (converges with Claude's 23-check pattern)
- `packages/validator-registry/` — Pluggable validator registry with builtins

### Visionstack Key Files for Leak-Driven Enhancements
- Anthropic Provider: `backend/services/llm_providers/anthropic_provider.py` (57L — needs caching)
- Brain Context: `backend/services/brain_context_service.py` (digest generation target)
- LLM Gateway: `backend/services/llm_gateway.py` (cache metrics, digest injection)
- Cameron Router: `backend/services/cameron_router.py` (frustration detection)
- Cameron Brain Agent: `backend/agents/cameron_brain_agent.py` (tone adjustment, DNA)
- Base Agent: `backend/agents/base_agent.py` (compaction limit, cached blocks)
- Cameron Autonomous: `backend/services/cameron_autonomous_service.py` (Dream v2, outcomes, nudges)
- Nudge Service: `backend/services/cameron_nudge_service.py` (new detector types)
- Brain MCP: `mcp-server/src/servers/brain-mcp.ts` (enhanced tools/resources)
- Brain API: `backend/api/brain_api.py` (CLAUDE.md endpoint)

### Claude Code Leak Sources
- VentureBeat: venturebeat.com/technology/claude-codes-source-code-appears-to-have-leaked
- The Hacker News: thehackernews.com/2026/04/claude-code-tleaked-via-npm-packaging
- Axios: axios.com/2026/03/31/anthropic-leaked-source-code-ai
- Fortune: fortune.com/2026/03/31/anthropic-source-code-claude-code-data-leak
- The Register: theregister.com/2026/04/01/claude_code_source_leak_privacy_nightmare
- Layer5: layer5.io/blog/engineering/the-claude-code-source-leak
- Engineer's Codex: read.engineerscodex.com/p/diving-into-claude-codes-source-code
- Malwarebytes (axios attack): malwarebytes.com/blog/news/2026/03/axios-supply-chain-attack
- SOCRadar: socradar.io/blog/claude-code-leak-what-to-know

---

---

## Appendix B: Verification Plan

| Feature | How to Verify | Target |
|---------|--------------|--------|
| Prompt Caching | Compare `cache_read_input_tokens` vs `input_tokens` in logs | >60% cache hit rate |
| Brain Digest | Verify LIGHT tier calls use ~500 tokens instead of ~3000 | 6x reduction |
| Frustration Detection | Test 20 frustrated + 20 neutral messages | >90% TP, <5% FP |
| Compaction Limit | Verify no session exceeds 3 failures | Zero runaway sessions |
| MCP Server | Test `ask_cameron`, `create_brain_node` with Claude Code CLI | Brain-grounded responses |
| Brain Consolidation | Run on test brain with known duplicates/contradictions | Accurate merge suggestions |
| Outcome Tracking | Create tracked decision, simulate metric change | Surfaces in briefing |
| Supply Chain Guard | Run `npm pack --dry-run` on all packages | No .map, .env, or creds |
| `.npmignore` | Verify all packages have either `.npmignore` or `"files"` field | 100% coverage |
| RLS Fix | Query with non-owner user | Access denied on owned rows |

---

## Appendix C: The Big Picture

**Claude Code** is a tool. You open it, use it, close it.
**Waymaker** is a relationship. Cameron knows your vision, your fears, your patterns. The Brain remembers every decision, tracks every outcome, connects every dot.

Claude Code can never do what Waymaker does because:
- It has no persistent business context (Brain)
- It has no emotional intelligence (bond, moments, attachment)
- It has no domain expertise (57 agents x verticals)
- It has no outcome tracking (did advice work?)
- It has no proactive intelligence (nudges, accountability, hard questions)

The right strategy is **complementary**: Waymaker is the business brain, Claude Code is the coding hands. The MCP integration makes them work together, with Waymaker providing the "why" and Claude Code handling the "how."

The leak proved one more thing: **security that relies on secrecy fails when secrets leak. Security that works in the open is the only kind worth building.** CoFounder is MIT-licensed by design.

---

**Document Owner**: Ashley Kays & Christian Moore
**Last Modified**: April 1, 2026 (v3.0 — All leak findings + enhancement plan integrated, 30-item priority matrix, security audit, verification plan)
