---
name: cofounder-vibespec-author
description: Use this skill when the user asks to "set up CoFounder", "create a VibeSpec", or "what rules should this project follow?". Reads the repo to infer existing conventions (design system, file layout, test framework, branching style, security posture) and proposes a VibeSpec that codifies them. Writes to `config/vibes/<id>.yml`.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: heavy
nextSkill: cofounder-feature-new
emits: [skill.run, vibespec.proposed]
---

# CoFounder: VibeSpec Author

You write VibeSpec files by **reading the repo's actual conventions**, not by suggesting generic best practices. The hard rule: **every rule in the VibeSpec must trace to evidence in the codebase.**

## When to invoke

- "Set up CoFounder for this repo"
- "Create a VibeSpec"
- "What conventions does this repo follow?"
- After `npx aicofounder init` if the user asks for help configuring

## Process

### Step 1 — Confirm what kind of VibeSpec

Ask once:
> "What context should this vibe cover — frontend work, backend/API work, DB/migration work, customer-facing chat, or general feature work?"

This determines which conventions to mine and which rules to enforce.

### Step 2 — Mine evidence

Run, in parallel:

**Stack detection** (always):
- Read `package.json` — framework (Next.js, Remix, Vite, Express, etc.), test runner, linter.
- Read `tsconfig.json` — strict mode, paths.
- Read `.eslintrc*` / `biome.json` — current lint rules.

**Design system** (frontend vibes):
- Look for `tailwind.config.{js,ts}` — extract tokens.
- Look for `components/ui/`, `app/components/`, `packages/ui/` — list primitives.
- Grep for raw hex colors in `app/` / `components/`. If rare, infer `forbidRawColors: true`.
- Look for theme files (`theme.ts`, `tokens.ts`).

**Database** (backend vibes):
- Look for `prisma/schema.prisma`, `drizzle.config.*`, `db/migrations/`.
- Sample a few migrations to detect convention (snake_case vs camelCase, soft deletes, audit columns).

**Conventions** (always):
- Read `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*`.
- Read recent PR titles via `git log --oneline -50` to detect commit style (Conventional Commits? prefix tags?).
- Sample 3–5 recent feature directories to detect file layout convention.

**Security posture**:
- Look for existing CoFounder packages (`@waymakerai/aicofounder-*`) in `package.json`.
- Look for compliance hints (HIPAA / GDPR / SOC 2 docs in `docs/`).

### Step 3 — Propose the VibeSpec

Write a draft to `config/vibes/<inferred-id>.yml`. Use this schema:

```yaml
apiVersion: cofounder.cx/v1
id: feature_work             # or frontend_work, backend_work, etc.
name: "Feature work — Next.js + Tailwind"
description: >
  Auto-generated from repo conventions. Review and edit before committing.

vibe:
  tone: "concise, factual"
  scopeRules:
    allowedPaths:
      - "app/**"
      - "components/**"
      - "lib/**"
      - "tests/**"
    forbiddenPaths:
      - ".env*"
      - "infrastructure/**"
  dataRules:
    forbidMockInProd: true
    forbidHardcodedCredentials: true
    requireRealDbForMigrations: true
  designSystem:
    forbidRawColors: true       # Detected: <N> raw hexes in app/, but <M> token usages
    componentLibrary: "components/ui"
    tokensFile: "tailwind.config.ts"
  testing:
    framework: "vitest"          # Detected from devDependencies
    requireForFeatureWork: true
    minTier1Coverage: "all acceptance criteria"
  vcs:
    branchPattern: "feat/<slug>" # Detected from recent branch names
    commitStyle: "conventional"  # Detected from git log
    requireBranchPerFeature: true

allowedActions:
  - "edit_files"
  - "run_tests"
  - "create_branch"
  - "open_pr"
disallowedActions:
  - "force_push"
  - "modify_env_files"
  - "modify_ci_config"          # unless explicitly requested

llm:
  provider: "anthropic"          # If present in @waymakerai/aicofounder-core config
  modelClass:
    light: "claude-haiku-4-5-20251001"
    mid: "claude-sonnet-4-6"
    heavy: "claude-opus-4-7"
  temperature: 0.2
```

### Step 4 — Show evidence

Don't just hand the user the file. Print a summary of **why each rule was chosen**, with concrete repo evidence:

```
# VibeSpec proposed: config/vibes/feature_work.yml

Evidence trail:

- forbidRawColors: true
  Found 3 raw hex colors in app/, but 247 token usages of `bg-*` / `text-*`. Repo clearly uses tokens.
- branchPattern: feat/<slug>
  Last 50 commits: 38 feat/, 7 fix/, 5 chore/. Pattern is consistent.
- testing.framework: vitest
  Detected in devDependencies; .test.ts files exist under tests/.

Things I couldn't determine — please review and edit:

- llm.provider: defaulted to anthropic (no @waymakerai/aicofounder-core config found).
- compliance: not auto-set. Run `cofounder-compliance-frame` if HIPAA/GDPR/etc. apply.
```

### Step 5 — Confirm before writing

Show the proposed file path, confirm the user wants it written, then write.

## What NOT to do

- Don't propose rules without evidence.
- Don't enable strict rules (`forbidRawColors: true`) on a repo where the convention is mixed — flag the ambiguity instead.
- Don't write the file without showing the user first.
- Don't overwrite an existing VibeSpec — diff against it and propose a merge.
