# Visionstack × CoFounder Integration Plan

**Date:** 2026-04-17
**Author:** Ashley Kays (with Claude Opus 4.7 analysis)
**Status:** Draft — ready for execution
**Canonical repos:**
- Visionstack (target): `/Users/ashleykays/visionstack` → `github.com/ashleyrabbitt/waymaker` (branch: `main`)
- CoFounder (source): `/Users/ashleykays/projects/ranavibe` → `github.com/waymaker-ai/ranavibe` (branch: `main`)

---

## TL;DR

Wire `@waymakerai/aicofounder-guard` into Visionstack's LLM call paths so that every AI-generated output is PII-redacted, injection-blocked, and compliance-checked. Solo-founder + no-users-yet means we can move fast (~2 weeks) and skip heavyweight canary/rollout machinery we don't need. First step: audit which of the 10 `ai_builder_*.py` files are actually registered in production.

---

## Context

### What we're integrating
- **CoFounder guard** (`@waymakerai/aicofounder-guard`, TypeScript/npm) — zero-dependency runtime guardrails: PII detection/redaction, prompt-injection blocking, toxicity filtering, compliance (HIPAA/GDPR/SEC), cost/budget tracking.
- **Visionstack** (Python / FastAPI on Railway; React frontend on Vercel) — entrepreneurial platform with AI code generators, companions, agent orchestration.

### Why now
- Strategic doc (`/Users/ashleykays/visionstack-to-betr/docs/STRATEGIC_OPPORTUNITIES_Q2_2026.md`) explicitly flagged Visionstack-CoFounder integration as the **single highest-leverage cross-product opportunity**. Same team, same brand, zero technical integration today.
- Visionstack is pre-launch (no users yet) — risk tolerance is at an all-time high.
- CoFounder needs a real case study. "CoFounder protects Visionstack in production" is the single best marketing asset we can create.
- Each product is materially better *with* the other: CoFounder gets a dogfood story, Visionstack gets safety-by-design positioning.

### Scale we're working against
| Surface | Count | Language | Framework |
|---|---|---|---|
| Python files calling OpenAI/Anthropic | **298** | Python | FastAPI |
| `ai_builder_*.py` files | 10 (4 registered in prod, 6 stale) | Python | FastAPI |
| Frontend LLM-calling TSX/TS | ~9 TSX + 2 TS | TypeScript | React |
| Agent modules | 9 | Python | — |
| Backend infra | Railway | — | — |
| Frontend infra | Vercel | — | — |

---

## What changes (file-by-file)

### New files — additive, low risk

| File | Purpose |
|---|---|
| `services/cofounder-guard/` (new Railway service) | Node/Fastify HTTP service wrapping `@waymakerai/aicofounder-guard`. Endpoints: `POST /guard/input`, `POST /guard/output`, `POST /guard/tool`, `GET /health` |
| `backend/llm/__init__.py` | Module marker |
| `backend/llm/client.py` | Centralized LLM call wrapper. Every existing `openai`/`anthropic` call gradually routes through this. |
| `backend/llm/guard_client.py` | HTTP client for the guard sidecar. Handles timeouts, fail-open logic, structured logging. |
| `backend/llm/config.py` | Reads `COFOUNDER_GUARD_URL`, `COFOUNDER_GUARD_MODE` (off\|shadow\|enforce), per-surface overrides. |
| `supabase/migrations/<stamp>_guard_events.sql` | Table: `guard_events (id, created_at, surface, user_id, mode, input_findings jsonb, output_findings jsonb, blocked boolean, latency_ms int)` |
| `frontend/src/lib/guard.ts` | Frontend guard helper. Optional — only needed for frontend-direct LLM calls. |
| `.env.example` additions | `COFOUNDER_GUARD_URL=http://localhost:4567` + `COFOUNDER_GUARD_MODE=shadow` |

### Modified files — behavioral, higher risk

| File | Change | Risk | Mitigation |
|---|---|---|---|
| `backend/agents/base_agent.py` | Wrap `call_llm()` with pre/post guard hooks | **High** (9 agents inherit) | Feature flag + fail-open in shadow |
| `backend/api/ai_builder_api.py` (registered) | Route through `backend/llm/client.py` | **High** (user-facing code gen) | Feature flag + enforce only after internal test |
| `backend/api/ai_builder_complete_api.py` (registered) | Same | **High** | Same |
| `backend/api/ai_builder_enhanced_api.py` (registered) | Same | **Medium** | Same |
| `backend/api/ai_builder_simple_api.py` (registered) | Same | **Medium** | Same |
| `backend/content_generation_engine.py` | Same pattern | **Medium** | Same |
| `backend/api/ai_agents_api.py` | Same pattern | **Medium** | Same |
| `backend/requirements.txt` | Add `httpx` (likely already present) | **Low** | — |
| `backend/main_production.py` | Archive the 6 stale `ai_builder_*` imports/routes | **Medium** | Done as prerequisite cleanup |

### Intentionally NOT changing

- API contracts (request/response shapes stay the same)
- Authentication / session handling
- Supabase schema except the new `guard_events` table
- Frontend UX/copy
- Anything in `agents/` that doesn't call an LLM
- Anything in `frontend/src/components/**` outside the ~9 AI-calling components
- The 6 stale `ai_builder_*.py` files — we **archive** them (git mv to `backend/api/_archive/`) rather than modify

If any of the above change, the PR has scope-crept — stop and split it.

---

## Phased plan (calibrated for solo + no users)

With **zero users**, we skip canary and shadow-observation windows. With **solo operator**, we skip team coordination gates. But we **tighten the automated-test gate** because there's no user traffic to catch regressions.

### Stage 0 — Audit + observability (2 days)

**Goal:** Know the current state. Nothing ships yet.

**Tasks:**
- [ ] In `/Users/ashleykays/visionstack`, run `pytest backend/` and record: pass count, fail count, errors. Fix critical red tests before proceeding (or document them as known-broken).
- [ ] Run `cd frontend && npx cypress run` (or the equivalent) and record baseline.
- [ ] Identify the canonical `ai_builder_*` files: the 4 registered are `ai_builder_api`, `ai_builder_complete_api`, `ai_builder_enhanced_api`, `ai_builder_simple_api`. Confirm by `git log -1 --format=%ai backend/api/ai_builder_*.py` — ignore any whose last-modified date is >6 months old.
- [ ] Archive the 6 stale files: `git mv backend/api/ai_builder_{enhanced_v2,enhanced,multipage,production,real,ultimate}.py backend/api/_archive/`. Commit separately as "chore: archive stale ai_builder variants".
- [ ] Set up Sentry (or Logtail) on both Railway backend and Vercel frontend. Even without users, you'll be exercising the code yourself — the errors need to land somewhere. Sentry free tier is fine.
- [ ] Screenshot 5 golden-path flows in current (pre-integration) state for visual regression reference.
- [ ] `supabase db dump -f backup-pre-guard.sql` on the prod database.

**Exit gate:** Written audit report in `docs/plans/2026-04-17-visionstack-audit.md` containing: canonical file list, test baseline, observability URLs, screenshots.

**Rollback:** N/A — read-only stage.

### Stage 1 — Guard sidecar on Railway (2 days)

**Goal:** A working guard service that Visionstack *could* call, but doesn't yet.

**Tasks:**
- [ ] Create `services/cofounder-guard/` in the Visionstack repo (keeps deploys colocated).
- [ ] Implement Fastify server wrapping `@waymakerai/aicofounder-guard`. Endpoints:
  - `POST /guard/input` → `{ redacted, blocked, findings, latencyMs }`
  - `POST /guard/output` → same shape
  - `POST /guard/tool` → `{ blocked, reason }`
  - `GET /health` → `{ ok: true, version }`
- [ ] Add a Railway service entry. Environment: `GUARD_DEFAULT_MODE`, `GUARD_COMPLIANCE_PRESETS`, no external secrets yet.
- [ ] Load-test locally with k6 or autocannon: 1000 sequential requests, assert p95 < 50ms.
- [ ] Deploy to Railway. Confirm `curl https://<your>.up.railway.app/health` returns 200.

**Exit gate:** Guard service deployed, reachable, load-tested, not yet wired to any caller.

**Rollback:** Delete the Railway service. Nothing depends on it.

### Stage 2 — Integrate at `base_agent.py` + one ai_builder (2 days)

**Goal:** First real integration. No users means we can go straight to enforce mode for our own testing — no shadow-mode observation window.

**Tasks:**
- [ ] Create `backend/llm/client.py`, `guard_client.py`, `config.py`.
- [ ] Modify `backend/agents/base_agent.py` to route `call_llm()` through `backend/llm/client.py`. Default `GUARD_MODE=shadow` so initially everything is logged but nothing is blocked.
- [ ] Run the Visionstack backend locally. Exercise each of the 9 agents (`vision_agent`, `emotion_coach_agent`, `focus_agent`, etc.) and confirm behavior unchanged.
- [ ] Flip `GUARD_MODE=enforce` locally. Re-test. Confirm nothing breaks.
- [ ] Wire the simplest of the 4 registered ai_builder routers (`ai_builder_simple_api.py`) the same way. Test the full request lifecycle.
- [ ] Add integration tests: `backend/tests/test_guard_integration.py` with 10 cases (PII input, injection attempt, clean input, guard-down fallback, latency budget, etc.).

**Exit gate:** `base_agent.py` + `ai_builder_simple_api.py` in enforce mode locally, all integration tests green.

**Rollback (one-liner):**
```bash
railway variables set COFOUNDER_GUARD_MODE=off && railway redeploy
```
Zero code change needed.

### Stage 3 — Expand to remaining surfaces (3 days)

**Goal:** All high-risk surfaces protected.

**Tasks:**
- [ ] Repeat Stage 2 pattern for:
  - `ai_builder_api.py` (the base one — touch last, highest blast radius)
  - `ai_builder_complete_api.py`
  - `ai_builder_enhanced_api.py`
  - `content_generation_engine.py`
  - `api/ai_agents_api.py`
- [ ] Each goes shadow → enforce locally before committing.
- [ ] Separate PR per surface. Small commits.
- [ ] Update `backend/tests/test_guard_integration.py` to cover each new surface.

**Exit gate:** All 6 surfaces (base_agent + 5 APIs) in enforce mode, test suite green, p95 latency regression < 30ms on synthetic load.

**Rollback:** Per-surface env flag (`COFOUNDER_GUARD_MODE_AI_BUILDER=shadow`, etc.).

### Stage 4 — Pre-launch hardening (1 day)

**Goal:** Ready to invite first users.

**Tasks:**
- [ ] Verify observability: a synthetic guard finding should show up in Sentry within 60s.
- [ ] Set up a weekly rollup job (Supabase cron) that aggregates `guard_events` into daily counts. Feeds the eventual case study.
- [ ] Write a minimal incident runbook: `docs/runbooks/guard-down.md`, `docs/runbooks/guard-false-positive.md`. Each <1 page.
- [ ] Verify rollback works end-to-end: flip `COFOUNDER_GUARD_MODE=off` → confirm user requests pass through untouched.
- [ ] Test the "guard service dies" path: kill the Railway service → confirm Visionstack stays up (fail-open).

**Exit gate:** All rollback paths verified manually.

### Stage 5 — Invite first users (ongoing)

**Goal:** Real data.

**Tasks:**
- [ ] Invite 5–10 internal/friends first-users.
- [ ] Monitor `guard_events` daily for the first 2 weeks.
- [ ] After 2 weeks of clean data, publish the case study: "CoFounder caught N PII leaks, M injection attempts, K mock-data attempts across Visionstack's first weeks".

**This is where the CoFounder marketing flywheel starts.**

---

## Total timeline

| Stage | Days | Notes |
|---|---|---|
| 0 — Audit | 2 | Blocks everything else |
| 1 — Guard sidecar | 2 | Parallelizable with Stage 0 in theory but risky solo — do sequentially |
| 2 — First integration | 2 | base_agent + simplest ai_builder |
| 3 — Expand | 3 | 5 more surfaces |
| 4 — Pre-launch | 1 | Runbooks, rollback verification |
| **Total engineering** | **10 days** | ~2 weeks calendar time solo |
| 5 — User invite + observation | +2 weeks | Observation for case study |
| **Total to "case study ready"** | **~4 weeks** | |

---

## Safety mechanisms — what we use vs. what we skip

### We use

- **Feature flag on every integration site**. `COFOUNDER_GUARD_MODE` can be `off` / `shadow` / `enforce` globally, with per-surface overrides. Flipping is a single Railway env var, no redeploy code change.
- **Fail-open**. If the guard sidecar is down or slow (> 200ms timeout), Visionstack falls through to the raw LLM call. The guard is a safety net, not a dependency.
- **Separate service on Railway**. Guard lives in its own Railway project. Can be redeployed/restarted without touching Visionstack.
- **Automated tests as regression gate**. Because there are no users to catch bugs, `pytest backend/` has to be green before each stage transition. Start strict, stay strict.
- **Single-PR-per-surface**. Don't bundle multiple `ai_builder_*.py` changes. Small diffs, easy revert.
- **Supabase backup before Stage 2**. Cheap insurance.
- **Sentry on both Railway and Vercel**. You are the only on-call; you need alerts.

### We skip (with reasons)

- **Canary rollout** (`1% → 10% → 100%` by user ID). Skipped because **zero users** — 1% of nobody is nobody. Would be security theater. When you launch to users, you can add percentage-based gating via Supabase feature flags then.
- **Shadow-mode 1-week observation window**. Skipped because no user traffic to observe. Dogfood in enforce mode locally instead.
- **"Page the team" incident process**. Skipped because solo operator. Replaced with "Sentry emails Ashley" + written runbooks.
- **PR review gate between stages**. Skipped because solo. Replaced with a written self-checklist at each exit gate.
- **Separate staging environment that mirrors prod**. Skipped because expensive for a pre-launch project. Instead: local dev = staging. Prod only gets merged code after local enforce-mode testing passes.

### Canary explained (since you asked)

Canary deploy = release a change to a small percentage of users first (the "canary in the coal mine"), observe metrics, then expand. Example: `if user_id.hash() % 100 < 1: new_code() else: old_code()`.

**Why it doesn't apply to you right now:** You have no users. When you have 100+ users, canary becomes valuable because breaking 1 user is recoverable; breaking 100 isn't. Pre-launch, just dogfood and ship.

**When to add it:** When you cross ~50 active users on Visionstack. Implementation is ~half a day — add a `guard_mode_override` column to `users` table, query it in `backend/llm/config.py`, manually promote users from "treatment group" to "everyone" as you gain confidence.

---

## Observability setup (prerequisite)

You said Vercel might be set up but no API keys added. Minimal required before Stage 2:

### Must-have

| Tool | Purpose | Cost |
|---|---|---|
| **Sentry** (or Logtail) | Error tracking on Railway backend + Vercel frontend | Free tier |
| **Railway logs** | Already included with Railway — just need to know how to tail them | $0 |
| **Supabase dashboard** | Already exists — use it for `guard_events` telemetry | $0 |

### Nice-to-have (add after Stage 3)

| Tool | Purpose |
|---|---|
| **Grafana Cloud** | Dashboard for guard metrics (block rate, latency, top categories) |
| **PostHog** | Product analytics once users arrive |
| **Uptime Robot** | Pings `/health` on guard service every 5 min |

### Setup commands (~30 min total)

```bash
# Sentry backend
pip install sentry-sdk[fastapi]
# Add to backend/main_production.py
# sentry_sdk.init(dsn=os.environ["SENTRY_DSN"], traces_sample_rate=0.1)

# Sentry frontend
pnpm -C frontend add @sentry/react @sentry/vite-plugin
# Configure in main.tsx per Sentry docs

# Uptime Robot — just sign up, add https://<guard>.up.railway.app/health
```

---

## Open questions (things still TBD)

1. **Python-side guard library**: The plan uses an HTTP sidecar. Alternative: port the regex patterns from `@waymakerai/aicofounder-guard` into a thin `pip install cofounder-guard-py` package. Sidecar is faster to ship; Python port is lower-latency long-term. **Recommendation: sidecar for v1, revisit after Stage 4.**
2. **Frontend integration**: The 9 TSX/TS files calling LLMs aren't in the top-5 high-risk list. **Recommendation: defer to a separate plan; backend-first.**
3. **Compliance mode**: Should Visionstack enable `compliance: ["gdpr"]` from day 1? Adds stricter PII handling. **Recommendation: yes, GDPR only for v1.**
4. **Rate limiting**: Guard service could be overwhelmed if Visionstack gets unexpectedly hot. **Recommendation: Railway autoscale min=1 max=3, and Fastify `@fastify/rate-limit` at 1000 rpm per IP.**
5. **Cost budget feature**: CoFounder guard has budget tracking. Visionstack will want this eventually. **Recommendation: wire in Stage 3, default to warn-only (`onExceeded: warn`) to avoid blocking real usage.**

---

## Success criteria

### Engineering (binary pass/fail)

- [ ] All 6 target surfaces route through `backend/llm/client.py`.
- [ ] `pytest backend/` green.
- [ ] Frontend Cypress green.
- [ ] `GUARD_MODE=off` flip disables guard with zero code change.
- [ ] Kill-test: guard service down → Visionstack stays up.
- [ ] p95 latency regression < 30ms vs pre-integration baseline.

### Product (measurable)

- [ ] `guard_events` table has entries for every LLM call in all 6 surfaces.
- [ ] After 2 weeks with first users: at least 10 non-trivial findings in `guard_events` (any type).
- [ ] Zero user-reported incidents attributed to guard false positives.

### Business (the case study)

- [ ] Published blog post / README update citing the concrete numbers from Stage 5.
- [ ] CoFounder README adds a "Who uses it" section with Visionstack linked.

---

## The single first step

Do this **tomorrow morning**:

```bash
cd /Users/ashleykays/visionstack
pytest backend/ 2>&1 | tee /tmp/visionstack-test-baseline.txt
cd frontend && (npx cypress run --reporter json > /tmp/cypress-baseline.json 2>&1 || true)
```

You'll either have a green baseline (great — Stage 0 proceeds) or you'll have a list of pre-existing failures to document before integrating anything new. Either way, you know where you stand before touching a single LLM call.

---

## Related documents

- `/Users/ashleykays/visionstack-to-betr/docs/STRATEGIC_OPPORTUNITIES_Q2_2026.md` — original cross-product strategic analysis
- `/Users/ashleykays/projects/ranavibe/spec/SPEC.md` — CoFounder open standard (VibeSpec / FlowSpec)
- `/Users/ashleykays/projects/ranavibe/packages/claude-code-plugin/README.md` — complementary Claude Code integration
- `/Users/ashleykays/projects/ranavibe/packages/adversarial/README.md` — the benchmark suite that will validate the integration

## Changelog

- 2026-04-17 — initial draft (Claude Opus 4.7 analysis + Ashley's answers on solo-founder constraints)
