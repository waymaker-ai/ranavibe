# RANA

**Guardrails & Guidance for AI-Assisted Development**

> **RANA is a free, open-source, integration-friendly guardrail layer for AI-assisted development.**
> It plugs into your existing stack (Vercel AI SDK, Supabase, LangChain, CrewAI, etc.) and makes sure agents **don't trash your codebase, ignore your design system and business rules, ship mock-only work, or waste your time and budget.**

RANA's job is to be the **safety harness and brain coach for AI agents** so they build **real, safe, on-spec product work** — not cute demos that create mess.

Everything else (RAG, specs, flows, integrations) exists to support that.

- Free and open source
- Bring-your-own LLM providers and tools
- Designed for real products, not toy demos

[![GitHub Stars](https://img.shields.io/github/stars/waymaker-ai/ranavibe?style=social)](https://github.com/waymaker-ai/ranavibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40ranavibe%2Fcore.svg)](https://www.npmjs.com/package/@ranavibe/core)

---

## Reality Over Hype (No "30-Minute Production" Myth)

AI frameworks love to promise:

> "Ship a production-ready product in 30 minutes."

**RANA is deliberately not that.**

You can't build a real, scalable, secure product in 30 minutes — not if you care about:

- security and privacy
- real databases and real users
- code quality, tests, and reviews
- uptime, monitoring, and incident response
- business rules, compliance, and long-term maintainability

**RANA refuses that hype.**

Instead, RANA's promise is:

> **RANA helps AI-assisted development move faster *without* becoming sloppier — by stopping agents from doing things no responsible engineer would do.**

Not "magic production in 30 minutes," but:

- less rework
- fewer messes
- fewer "WTF did this agent just change?" moments
- more signal, less chaos

RANA focuses on:

- turning **feature ideas → clear specs → safe draft implementations**
- enforcing **design systems, business rules, and engineering hygiene**
- integrating into real stacks (Vercel AI SDK, Supabase, LangChain, CrewAI, etc.)
- helping humans **ship real features faster** instead of cleaning up after reckless agents

**You still need engineers, reviews, and real operations.**
RANA just makes the AI-powered parts safer, sharper, and less painful.

---

## Core Guardrails

RANA is an **integration-friendly guardrail & guidance layer** for AI agents working in real codebases and products.

### 1. Stop Bad Agent Behavior

- Don't break the codebase
- Don't secretly add features without asking
- Don't duplicate existing features
- Don't randomly refactor everything
- Don't trash the design system or UX patterns
- Don't use mock/demo data in production
- Don't "fake done" when nothing is wired to real systems

### 2. Enforce Good Engineering & Product Hygiene

- Use **real DB models and APIs**, not invented ones
- Follow the **design system** and shared UX patterns
- Follow **business rules, constraints, and specs**
- **Ask clarifying questions** when requirements are incomplete
- Always **surface what changed and why**
- Encourage **tests, checks, and safe PRs** — not "oops I pushed to main"

### 3. Real Features, Not Just Demos

- Turn feature ideas into:
  - a clear spec
  - a task chain / flow
  - scoped code changes that compile and pass checks
- Make sure the agent **helps** the dev, not slows them down

### 4. Save Time & Money by Avoiding Chaos

- Less throwaway agent output
- Less "fix what the agent just broke"
- Less "start from scratch because the prototype is unusable"
- More consistent, trustworthy AI-assisted work

---

## What RANA *Is* / *Isn't*

### RANA *is*:

- **Free & open source**
  Built to be inspected, forked, extended, and improved by the community.

- **A guardrail + guidance layer for AI-assisted development**
  Keeps agents from breaking your app, your rules, or your budget.

- **Integration-friendly**
  Plugs into your existing stack:
  - Vercel AI SDK
  - Supabase
  - LangChain / LangGraph
  - CrewAI
  - MCP / IDE integrations

- **Spec-driven**
  Uses:
  - **VibeSpecs** → how agents should behave (tone, constraints, allowed actions, design/DB rules)
  - **FlowSpecs** → how work is broken into steps (clarify → plan → implement → test → review)

  Specs live as **plain config in your repo**, so other tools can read and honor the same rules.

- **Focused on real product work**
  Designed for **real stacks, real DBs, real users**, not toy examples.

---

### RANA is *not*:

- **A "ship-a-startup-in-30-minutes" magic button**
  It won't pretend you can build a full, scalable production product in half an hour.

- **A replacement for your engineers or your stack**
  It doesn't replace Vercel AI SDK, Supabase, LangChain, CrewAI, or your CI/CD.
  It complements them with guardrails and guidance.

- **A walled-garden orchestrator**
  It isn't trying to be "the only way to run agents or graphs."
  It feeds better context, rules, and checks into the tools you already use.

- **A sandbox for throwaway prototypes**
  It's not about "cool toy demos."
  RANA is meant for **serious apps** where breaking things has real cost.

---

## Quickstart

RANA is designed to sit *under* the tools you already use.

### 1. Install

```bash
# Core library + CLI
npm install @ranavibe/core
npm install --save-dev @ranavibe/cli
```

Or with pnpm:

```bash
pnpm add @ranavibe/core
pnpm add -D @ranavibe/cli
```

### 2. Initialize RANA in your app

From your app root (for example, a Vercel AI SDK + Supabase app):

```bash
npx rana init
```

This will:
- create a basic `.rana.yml` config
- add example VibeSpecs (behavior/constraints)
- optionally add package.json scripts for `rana check`, `rana feature:new`, etc.

### 3. Configure providers and basic rules

Example `rana.config.ts`:

```typescript
import { defineConfig } from '@ranavibe/core';

export default defineConfig({
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      models: ['claude-3-5-sonnet-20241022'],
    },
  },

  routing: {
    defaultProvider: 'openai',
    rules: [
      { match: 'light', provider: 'openai', model: 'gpt-4.1-mini' },
      { match: 'heavy', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    ],
  },

  guardrails: {
    disallowMockDataInProd: true,
    requireTestsForFeatureWork: true,
    requireBranchPerFeature: true,
  },
});
```

### 4. Use RANA in your server code

Example with a Vercel AI SDK–style handler:

```typescript
// app/api/rana-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRana } from '@ranavibe/core';
import config from '../../../rana.config';

const rana = createRana(config);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body;

  const result = await rana.chat({
    messages,
    vibe: 'default', // refers to a VibeSpec in config/vibes/default.yml
  });

  return NextResponse.json(result);
}
```

You still use your usual stack (Vercel AI SDK + Supabase, LangChain, CrewAI, etc.)—
RANA just centralizes providers, routing, and guardrails underneath.

---

## Feature Flow: From Idea → Spec → Branch → Safe Draft

RANA's flagship experience is a **feature flow** that helps agents work in your codebase without wrecking it.

Instead of "ship a startup in 30 minutes," RANA focuses on:

> **Feature idea → spec → branch → draft implementation + tests + checks**
> under your rules, using your stack.

### CLI Overview

```bash
npx rana init            # one-time setup in your app
rana feature:new         # turn a feature idea into a clear spec
rana feature:implement   # create a branch + safe draft changes
rana check               # run safety gates (tests, lint, design, mock-data checks)
```

### Step 1: `rana feature:new` — Guided Spec, Not Guesswork

You start with a human-sized idea, e.g.:
> "Add a 'team billing' settings page so admins can upgrade from monthly to annual."

Then run:

```bash
rana feature:new
```

RANA will:

1. **Ask clarifying questions:**
   - What user roles can see this?
   - What is the source of truth for billing (Stripe, internal, etc.)?
   - What routes / pages will this affect?
   - What are the acceptance criteria?

2. **Search your codebase & knowledge base** for similar features:
   - "Looks like you already have `BillingSettingsPage` and `SubscriptionCard`."
   - "Do you want to extend these, or create something new?"

3. **Produce a structured feature spec**, e.g. `specs/feature-team-billing.yml`:
   - summary
   - user stories
   - acceptance criteria
   - affected routes / modules
   - data sources / APIs
   - constraints (design system, business rules, security notes)

This spec becomes the **source of truth** for any later agent work.

### Step 2: `rana feature:implement` — Branch + Scoped Changes

Once the spec looks good, you run:

```bash
rana feature:implement specs/feature-team-billing.yml
```

RANA will:

1. **Create a feature branch**, e.g. `feat/team-billing`.

2. **Propose a changeset** (what files/dirs it wants to touch) and ask you to confirm:
   - `app/settings/billing/page.tsx`
   - `components/Billing/PlanSelector.tsx`
   - `lib/billing/upgradeToAnnual.ts`
   - `tests/billing/teamBilling.test.ts`

3. **Use the spec + your VibeSpecs** to guide agents to:
   - extend existing components instead of inventing new patterns,
   - use your design system (`@/components/ui/*`, tokens, layouts),
   - call real DB/APIs, not mocks, in production code paths,
   - add or update tests for new behavior.

**RANA does not merge or deploy.**
It prepares a draft commit/PR that you can review, edit, and ship.

### Step 3: `rana check` — Don't Let Agents Cowboy-Code

Before you open a PR, or as part of CI, run:

```bash
rana check
```

By default, `rana check` can be wired to:

- compile / typecheck (e.g. `tsc`, Next.js build)
- run tests (`npm test`, vitest, etc.)
- run lint (eslint, biome, etc.)
- enforce RANA-specific guardrails, such as:
  - No mock/demo data in production code
  - No inline hex colors / raw CSS if you use a design system
  - No unauthorized large refactors or file renames
  - No changes outside the declared changeset / scope

If any of these fail, the run is considered **unsafe**, and RANA will tell you why.

**The goal is not "perfect code with no humans," but:**

> "A good draft, in the right place, that doesn't wreck your repo — much faster than starting from a blank file."

---

## VibeSpecs: Declarative Agent Behavior

VibeSpecs define **how agents should behave** — their tone, constraints, allowed actions, and rules.

Example `config/vibes/customer-support.yml`:

```yaml
id: customer_support_eu
name: "EU Customer Support Assistant"
description: >
  Handles EU customer questions about orders, shipping, and refunds.
  Never invents policies or numbers.

vibe:
  tone: "calm, factual, friendly, professional"
  constraints:
    - "Never invent policies, prices, or numbers."
    - "Only answer using documents from the knowledge base."
    - "If unsure, escalate to human support."
    - "Always provide citation for policy-related answers."
  allowedActions:
    - "escalate_to_human"
    - "create_ticket"
    - "lookup_order"
  disallowedActions:
    - "issue_refund"
    - "modify_billing"
    - "delete_account"

rag:
  kbId: "policies_eu"
  topK: 6
  rerank: true

llm:
  provider: "anthropic"
  model: "claude-3-5-sonnet-20241022"
  temperature: 0.1

security:
  piiRedaction: true
  promptInjectionDetection: true
  maxToolCalls: 5
```

Specs live as **plain config in your repo**, so:
- other tools can read and honor the same rules
- you can version control behavior changes
- agents inherit constraints automatically

---

## Using RANA with LangChain

RANA is **not** trying to replace LangChain.
Instead, it acts as a **guardrail + provider layer** underneath it.

### Wrap RANA as a LangChain ChatModel

```typescript
import { RanaChatModel } from '@ranavibe/langchain';
import { createRana } from '@ranavibe/core';

const rana = createRana(config);

const model = new RanaChatModel({
  rana,
  vibe: 'feature_work', // uses VibeSpec: design system, DB rules, etc.
});

// Use in LangChain chains
const chain = prompt.pipe(model).pipe(outputParser);
const result = await chain.invoke({ input: 'Help me add a settings page' });
```

### Key idea:

- **LangChain** stays your orchestrator
- **RANA** provides:
  - provider routing (OpenAI/Anthropic/etc.)
  - VibeSpec (design system rules, "ask before acting", no mock data, etc.)
  - logging, cost-awareness, and optional checks

---

## Using RANA with CrewAI

RANA plays nicely with CrewAI: **CrewAI owns the crew/graph orchestration; RANA provides the LLM + guardrails + context rules.**

### Wrap RANA as a CrewAI-compatible LLM

```typescript
import { createRanaCrewModel } from '@ranavibe/crewai';
import { createRana } from '@ranavibe/core';

const rana = createRana(config);

const ranaLLM = createRanaCrewModel({
  rana,
  vibe: 'feature_work', // agent inherits RANA's feature-work guardrails
});

// Use with CrewAI agents
const featureAgent = new Agent({
  name: 'Feature Implementer',
  role: 'Implement features safely in an existing codebase.',
  llm: ranaLLM,
});
```

### Key idea:

- **CrewAI** defines who the agents are and how they coordinate
- **RANA** defines:
  - how each agent should behave (via VibeSpecs)
  - which providers/models to use
  - what constraints apply (no mock data, DS rules, ask-before-acting, etc.)

---

## Packages

| Package | Description |
|---------|-------------|
| `@ranavibe/core` | Unified LLM client, cost tracking, plugins, security |
| `@ranavibe/cli` | CLI for init, check, feature flows, deploy |
| `@ranavibe/rag` | RAG pipeline: chunking, retrieval, reranking, synthesis |
| `@ranavibe/agents` | Agent Development Kit (ADK): BaseAgent, tools, vibes |
| `@ranavibe/langchain` | LangChain adapter |
| `@ranavibe/crewai` | CrewAI adapter |
| `@ranavibe/mcp` | Model Context Protocol server & client |
| `@ranavibe/react` | React hooks for chat, RAG, streaming |

---

## CLI Commands

### Core Commands
```bash
rana init                # Initialize RANA in your project
rana check               # Run safety gates (tests, lint, guardrails)
rana check --fix         # Auto-fix issues where possible
```

### Feature Commands
```bash
rana feature:new         # Guided spec creation from an idea
rana feature:implement   # Branch + scoped implementation
```

### LLM Commands
```bash
rana llm:setup           # Configure providers
rana llm:analyze         # Cost and usage analysis
rana llm:compare         # Compare providers for your use case
```

### Database Commands
```bash
rana db:setup            # Setup wizard
rana db:migrate          # Run migrations
rana db:check            # Validate schema
```

### Security Commands
```bash
rana security:audit      # Run security scan
rana security:setup      # Setup security config
```

### Agent Commands
```bash
rana agent:new           # Scaffold a new agent
rana agent:test          # Run agent tests
rana agent:serve         # Start agent as API server
```

### Vibe Commands
```bash
rana vibe:new            # Create new VibeSpec
rana vibe:validate       # Validate VibeSpec YAML
rana vibe:compile        # Show compiled system prompt
```

---

## Documentation

### Getting Started
- **[START_HERE.md](START_HERE.md)** - Navigation hub
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - 5-minute tutorial
- **[docs/rana-os-spec.md](docs/rana-os-spec.md)** - Full API specification

### Framework Guides
- **[docs/LLM_OPTIMIZATION_GUIDE.md](docs/LLM_OPTIMIZATION_GUIDE.md)** - Cost optimization
- **[docs/SECURITY_FRAMEWORK_GUIDE.md](docs/SECURITY_FRAMEWORK_GUIDE.md)** - Security patterns
- **[docs/AGENT_DEVELOPMENT_KIT_GUIDE.md](docs/AGENT_DEVELOPMENT_KIT_GUIDE.md)** - Build AI agents
- **[docs/MCP_INTEGRATION_GUIDE.md](docs/MCP_INTEGRATION_GUIDE.md)** - MCP integration

### Technical
- **[RANA_WHITEPAPER.md](RANA_WHITEPAPER.md)** - Technical whitepaper
- **[CLI_COMMANDS_REFERENCE.md](CLI_COMMANDS_REFERENCE.md)** - All CLI commands

---

## Free & Open Source

RANA is **free and open source**.

- No per-seat license
- No proprietary runtime lock-in
- You control:
  - your models and providers
  - your data and logs
  - your CI/CD and deployment pipeline

Use RANA as:

- a drop-in guardrail layer in your existing projects
- a foundation for your own internal AI dev tools
- a place to contribute better patterns for safe, AI-assisted development

**License:** MIT

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Where to start (guardrails, vibes, flows, integrations)
- Code style expectations
- Vision guidelines (to avoid turning RANA into Another Orchestrator™)

**Key areas for contribution:**

1. **Guardrails & Checks** - New safety rules and validation
2. **VibeSpecs & FlowSpecs** - Reusable behavior definitions
3. **Integrations** - LangChain, CrewAI, MCP, IDE plugins
4. **Documentation & Examples** - Tutorials and sample apps

---

## Credits

**Created by:**
- **Ashley Kays** - Creator, Product & Strategy
- **Christian Moore** - Creator, Engineering & Architecture

**Organizations:**
- [Waymaker.cx](https://waymaker.cx)
- [Betr.ai](https://betr.ai)

**Named after:** Ashley's son (RANA = his nickname, like a piranha)

---

## Get Started

```bash
# Install
npm install @ranavibe/core @ranavibe/cli

# Initialize in your project
npx rana init

# Create your first feature spec
rana feature:new

# Run safety checks
rana check
```

**Questions?**
- GitHub Issues: https://github.com/waymaker-ai/ranavibe/issues
- Email: ashley@waymaker.cx or christian@waymaker.cx

---

**RANA** - Guardrails & Guidance for AI-Assisted Development

*Made with love to help you build real products, safely.*
