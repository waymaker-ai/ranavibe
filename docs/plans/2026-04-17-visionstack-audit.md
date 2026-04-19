# Visionstack Stage 0 Audit — Findings

**Date:** 2026-04-17 (extended 2026-04-19)
**Auditor:** Ashley Kays + Claude Opus 4.7 (read-only investigation)
**Target repo:** `/Users/ashleykays/visionstack` → `github.com/ashleyrabbitt/waymaker` (branch `main`)
**Companion plan:** [`./2026-04-17-visionstack-cofounder-integration.md`](./2026-04-17-visionstack-cofounder-integration.md)

---

## Executive summary

I completed a **fully read-only audit** of Visionstack in preparation for integrating CoFounder guardrails. Three of my earlier assumptions were wrong:

1. **Stale files: 2, not 6.** Of the 10 `ai_builder_*.py` files, only `ai_builder_enhanced.py` and `ai_builder_production.py` have zero live-code references. The other 8 are all imported somewhere.
2. **Scale: 139 direct imports, not 298 calls.** Earlier "298 Python files calling OpenAI/Anthropic" counted call sites. The actual number of files that `import openai` or `import anthropic` is 139. Still big, but more manageable.
3. **No central LLM chokepoint exists.** Each of the 139 files imports providers directly. This means the integration plan can't assume a clean `backend/llm/client.py` to wrap — it has to be **created** as part of the integration, and guard enforcement has to happen at the **API boundary**, not per call site.

**Nothing was modified in the Visionstack repo.** Working tree is identical to when we started.

---

## Repo safety baseline

| Check | Result |
|---|---|
| Branch | `main` |
| Remote | `git@github.com:ashleyrabbitt/waymaker.git` |
| Working tree | **Clean** (0 uncommitted files) |
| Ahead/behind origin | `0/0` — in sync |
| Stashes | 5 pre-existing (preserved, not touched) |
| Latest commit | `672be3d5e fix: brain chat 500 — add StreamingResponse import at module level` |

**Safe to investigate.** No work-in-progress to disturb.

---

## Test harness audit (did NOT run tests)

| Surface | State |
|---|---|
| `backend/tests/conftest.py` | Present (centralized fixtures) |
| `backend/pytest.ini` | Present with `testpaths = tests`, `asyncio_mode = auto`, markers for `integration`, `llm`, `database` |
| Tests collected (`pytest --collect-only`) | **645 tests** across ~69 test files, zero collection errors |
| Tests referencing `os.environ` | 7 files (including `test_ai_builder.py`, `test_link_preview.py`) |
| Tests importing real providers (supabase/openai/anthropic/stripe) | 10+ files |
| Explicit "real LLM" tests | Yes — `test_cameron_integration.py:101 test_real_llm_generates_content` |
| Cypress `baseUrl` | `http://localhost:3000` — requires local dev server; **local dev server loads `frontend/.env.local` which has live Supabase URL** |
| `.env` files present | `/.env`, `/.env.local`, `/.env.production`; `backend/.env`; `frontend/.env`, `.env.local`, `.env.production`, `.env.stripe` |

**Safe test invocation** (user should run, not Claude):
```bash
cd /Users/ashleykays/visionstack/backend
source venv/bin/activate
pytest tests/ -m "not integration and not llm and not database" 2>&1 | tee /tmp/visionstack-safe-tests.txt
```
This excludes the three markers that signal "hits real services" and gives a clean baseline for the unit/mocked layer.

---

## `ai_builder_*` file classification (authoritative)

All 10 files with `--- status` line showing authoritative verdict:

| # | File | Status | Live imports / references |
|---|------|--------|--------------------------|
| 1 | `ai_builder_api.py` | **LIVE — registered router** | `main.py:2167`, `main_production.py:496` |
| 2 | `ai_builder_complete_api.py` | **LIVE — registered router** | `main.py:2168`, `main_production.py:3205` |
| 3 | `ai_builder_enhanced_api.py` | **LIVE — registered router** | `main.py:2169`, `main_production.py:3211` |
| 4 | `ai_builder_simple_api.py` | **LIVE — registered router** | `main.py:2170`, `main_production.py:3217` |
| 5 | `ai_builder_enhanced_v2.py` | **LIVE — helper** | `pipeline_orchestrator_fastapi.py:76` (fallback path) |
| 6 | `ai_builder_multipage.py` | **LIVE — helper** | `pipeline_phases_api.py:189` |
| 7 | `ai_builder_real.py` | **LIVE — heavily-used helper** | `pipeline_orchestrator_fastapi.py:2921`, `analysis_api_simple.py:3,17`, `ai_builder_multipage.py:9` |
| 8 | `ai_builder_ultimate.py` | **LIVE — helper** | `pipeline_orchestrator_fastapi.py:60,83`, `builder_modes_api.py:49,53`, `pipeline_phases_api.py:150`, `comprehensive_app_generator.py:14` |
| 9 | `ai_builder_enhanced.py` | **STALE** | 0 live-code refs (earlier matches were `_api` / `_v2` lookalikes) |
| 10 | `ai_builder_production.py` | **STALE** | 0 live-code refs (only `.ruff_cache/` hits, which auto-regenerate) |

**Safe archive set: 2 files.** Not 6. My earlier plan was wrong.

**The original plan (companion doc) should be corrected:** change Stage 0 task "Archive 6 stale files" → "Archive 2 stale files (`ai_builder_enhanced.py`, `ai_builder_production.py`) after confirming no git pending branch or WIP depends on them."

---

## The real architectural finding

Visionstack has **no central LLM client**. 139 Python files directly call `from openai import ...` or `from anthropic import ...`. There's no `backend/llm/client.py` to wrap — it would have to be created and adopted file-by-file, which is a months-long refactor, not a 2-week integration.

**Implication:** the integration pattern has to change from what the plan doc originally described.

### Original plan (incorrect assumption)

> "Wrap the centralized LLM client with pre/post guards in `backend/llm/client.py`."

This assumed a centralized client existed or could be introduced quickly.

### Corrected integration pattern — guard at the API boundary

Instead of wrapping every LLM call, guard at the **HTTP request/response boundary** for each high-risk API:

```python
# backend/api/ai_builder_api.py (pattern)
from backend.llm.guard_client import guard_request, guard_response

@router.post("/ai-builder/generate")
async def generate(req: GenerateRequest):
    # Guard input before dispatching
    checked = await guard_request(req.prompt, user_id=req.user_id, surface="ai_builder_api")
    if checked.blocked:
        raise HTTPException(status_code=400, detail=checked.reason)

    # Existing code — unchanged. Calls whatever helpers (ai_builder_real, ultimate, etc.)
    result = await existing_generator(checked.redacted, req.config)

    # Guard output before returning
    final = await guard_response(result, user_id=req.user_id, surface="ai_builder_api")
    return {"output": final.redacted, "blocked": final.blocked}
```

This means:
- **What gets wrapped:** 4 registered ai_builder routers + ~5 other high-risk APIs (`ai_agents_api`, `content_generation_engine`, `pipeline_orchestrator_fastapi`, etc.) = ~9 wrap points.
- **What doesn't get wrapped:** The 139 internal LLM call sites. Their outputs flow through the guard at the API response boundary.
- **Trade-off:** Input-time PII redaction only happens for user-supplied prompts (not for internal agent-to-agent calls). Good enough for v1; can be refined later.
- **Benefit:** dramatically smaller integration scope. Each wrapped endpoint is a ~15-line change, not a 50-file refactor.

The `backend/llm/client.py` module can still exist — but it becomes **optional for future LLM calls to adopt**, not a prerequisite.

---

## Observability state

You said "not yet, might be in place." Here's the reality:

| Tool | Status |
|---|---|
| Sentry (backend) | **Not configured.** Grep for `sentry_sdk.init` in backend → 0 hits. |
| Sentry (frontend) | **Partial.** `frontend/src/sentry.ts` exists and is imported from `main.tsx`; needs `VITE_SENTRY_DSN` env var populated to activate. |
| Logtail / Axiom / etc. | Not configured |
| Railway logs | Available by default (no setup needed — `railway logs` works) |
| Supabase dashboard | Available by default |
| Uptime monitoring | Not configured |

**Minimum before Stage 2:**
1. Create a Sentry project (free tier). Get two DSNs: one for Python backend, one for React frontend.
2. Backend: add `sentry-sdk[fastapi]==2.*` to `backend/requirements.txt`; add `sentry_sdk.init(dsn=os.environ["SENTRY_DSN"], traces_sample_rate=0.1)` near the top of `main_production.py`.
3. Frontend: set `VITE_SENTRY_DSN` in `frontend/.env.local` (and later `.env.production`).
4. Railway env var: `SENTRY_DSN=...`
5. Vercel env var: `VITE_SENTRY_DSN=...`

Estimated time: 20 minutes end-to-end. You do this, not Claude — the account creation + DSN handling should be on your machine.

---

## What was NOT done (and why)

Per your instruction "be very careful and ultrathink," I deliberately held these for you:

| Task | Why deferred |
|------|-------------|
| Execute `pytest tests/` | `.env` has live creds; 10+ test files touch real services; user should run with `-m "not integration and not llm and not database"` filter |
| Execute Cypress | Local dev server loads `.env.local` (live Supabase); user should decide when |
| Archive the 2 stale files via `git mv` | Irreversible-ish. Need your OK after you review the classification table above |
| Sentry account creation / DSN config | Requires your account + env var writes to Railway + Vercel |
| `supabase db dump` | Requires `supabase` CLI auth under your identity |
| Screenshot golden-path flows | Requires browser interaction with live frontend |
| Any push or commit in the Visionstack repo | Different repo; no authorization given yet |

---

## Prerequisites you need to complete before Stage 1

In order of priority:

### 1. Run the safe test baseline (5 min)
```bash
cd /Users/ashleykays/visionstack/backend
source venv/bin/activate
pytest tests/ -m "not integration and not llm and not database" 2>&1 | tee /tmp/visionstack-safe-tests.txt
tail -30 /tmp/visionstack-safe-tests.txt
```
Save the summary line ("X passed, Y failed, Z skipped") into the follow-up audit doc. This is your regression baseline — every future stage has to keep this number stable.

### 2. Set up Sentry (20 min)
Follow the steps in the "Observability state" section above. Confirm by triggering a manual exception in a dev endpoint and seeing it land in Sentry.

### 3. Backup Supabase (5 min)
```bash
cd /Users/ashleykays/visionstack
supabase db dump -f backups/pre-cofounder-guard-$(date +%Y%m%d).sql
```

### 4. Confirm the stale-file archive is safe (2 min, read-only)
```bash
# Confirm no open branch or WIP depends on the 2 stale files
cd /Users/ashleykays/visionstack
git stash list | head -10
git branch -a | head -20
grep -rn "ai_builder_enhanced\b\|ai_builder_production\b" .worktrees/ 2>/dev/null | head -5
```
If stashes or worktree branches reference them, leave them alone for now.

### 5. Confirm Railway service for the guard sidecar
Decide: same Railway project with a new service, or a separate Railway project? Same-project is simpler. I recommend **same Railway project, new service** named `cofounder-guard`.

---

## Updated timeline (calibrated for real findings)

| Stage | Original estimate | Revised estimate | Change reason |
|-------|-------------------|------------------|---------------|
| 0 — Audit | 2 days | **~0.5 day** (completed today minus your prerequisites) | Audit was faster than expected; no central client to untangle |
| 1 — Guard sidecar on Railway | 2 days | 2 days | unchanged |
| 2 — First integration | 2 days | **1 day** | No central client to wire; just add `guard_request`/`guard_response` at one ai_builder router |
| 3 — Expand to other surfaces | 3 days | **2–3 days** | 9 wrap points, each ~15 lines |
| 4 — Pre-launch hardening | 1 day | 1 day | unchanged |
| **Total engineering** | **10 days** | **~6.5 days** | Smaller scope than feared |

**Caveat:** the "139 direct import sites" problem doesn't go away — it just isn't blocking. Over the long run you'll want to adopt `backend/llm/client.py` across those 139 files. That's a Phase 2 project (months, not weeks), unrelated to the initial guard integration.

---

## Recommended next step

**Do the 4 prerequisites in order.** Each is ~5–20 minutes. When all four are done:
- Safe test baseline saved
- Sentry alerting confirmed
- Supabase backup exists
- Stale-file archive confirmed safe

Ping me (or yourself in a future session) with the test summary line + Sentry DSN URLs, and we can start Stage 1 (build the guard sidecar) confidently.

## Open questions surfaced by the audit

1. **`frontend/src/sentry.ts` already exists** — was this set up and abandoned, or is it ready to activate?
2. **`.worktrees/design-studio-upgrade/` exists** — what branch is this? It has copies of `main.py` with ai_builder imports. Should be audited separately before archiving stale files.
3. **5 stashes** — is any of them relevant to CoFounder integration or long-since-abandoned? Worth a `git stash show -p stash@{N}` pass to decide.
4. **`backend/.env.builders.example` (11.7KB)** — is this the canonical config schema for AI builders? If so, the guard config should be documented there alongside provider keys.

---

## Changelog

- 2026-04-17 — initial audit (Claude Opus 4.7 + Ashley)
- Stale count corrected from 6 → 2 after exhaustive grep
- Integration pattern revised from "wrap central client" to "guard at API boundary"
- Timeline shortened from 10 days to ~6.5 days engineering
