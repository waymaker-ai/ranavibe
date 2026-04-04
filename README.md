# CoFounder

**by [Waymaker AI](https://waymaker.cx) | Guardrails & Guidance for AI-Assisted Development**

> **CoFounder is a free, open-source, integration-friendly guardrail layer for AI-assisted development.**
> It plugs into your existing stack (Vercel AI SDK, Supabase, LangChain, CrewAI, etc.) and makes sure agents **don't trash your codebase, ignore your design system and business rules, ship mock-only work, or waste your time and budget.**

CoFounder's job is to be the **safety harness and brain coach for AI agents** so they build **real, safe, on-spec product work** — not cute demos that create mess.

Everything else (RAG, specs, flows, integrations) exists to support that.

- Free and open source
- Bring-your-own LLM providers and tools
- Designed for real products, not toy demos

[![GitHub Stars](https://img.shields.io/github/stars/waymaker-ai/cofounder?style=social)](https://github.com/waymaker-ai/cofounder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40waymakerai%2Faicofounder-core.svg)](https://www.npmjs.com/package/@waymakerai/aicofounder-core)
[![npm downloads](https://img.shields.io/npm/dm/@waymakerai/aicofounder-core)](https://www.npmjs.com/package/@waymakerai/aicofounder-core)
[![CI](https://img.shields.io/github/actions/workflow/status/waymaker-ai/cofounder/ci.yml?branch=main)](https://github.com/waymaker-ai/cofounder/actions)
[![Discord](https://img.shields.io/discord/PLACEHOLDER?label=discord)](https://discord.gg/PLACEHOLDER)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## Quick Demo

### Before AICofounder (agent goes rogue):
```
❌ Agent commits AWS keys to repo
❌ Agent leaks patient SSN in API response
❌ Agent blows through $500 in API calls overnight
❌ Agent gives investment advice (SEC violation)
❌ Agent rewrites your auth middleware "for fun"
```

### After AICofounder (3 lines of code):
```typescript
import { createGuard } from '@waymakerai/aicofounder-guard';

const guard = createGuard({
  pii: 'redact',
  injection: 'block',
  budget: { limit: 50, period: 'day' },
  compliance: { frameworks: ['hipaa', 'gdpr', 'sec'] }
});

const result = guard.check(userInput);
// ✅ PII redacted, injections blocked, budget enforced, compliance checked
// All in < 1ms with zero dependencies
```

---

## Why AICofounder?

- ⚡ **< 1ms guard latency** (vs 100ms-2s for LLM-based alternatives)
- 📦 **~50KB, zero runtime dependencies**
- 💰 **70% cost reduction** through caching + smart routing
- 🔒 **HIPAA, GDPR, SEC, SOX, PCI DSS** compliance built-in
- 🔌 **Works with LangChain, CrewAI, Vercel AI SDK, Supabase**
- 🆓 **MIT licensed**, free forever

---

## Reality Over Hype (No "30-Minute Production" Myth)

AI frameworks love to promise:

> "Ship a production-ready product in 30 minutes."

**CoFounder is deliberately not that.**

You can't build a real, scalable, secure product in 30 minutes — not if you care about:

- security and privacy
- real databases and real users
- code quality, tests, and reviews
- uptime, monitoring, and incident response
- business rules, compliance, and long-term maintainability

**CoFounder refuses that hype.**

Instead, CoFounder's promise is:

> **CoFounder helps AI-assisted development move faster *without* becoming sloppier — by stopping agents from doing things no responsible engineer would do.**

Not "magic production in 30 minutes," but:

- less rework
- fewer messes
- fewer "WTF did this agent just change?" moments
- more signal, less chaos

CoFounder focuses on:

- turning **feature ideas → clear specs → safe draft implementations**
- enforcing **design systems, business rules, and engineering hygiene**
- integrating into real stacks (Vercel AI SDK, Supabase, LangChain, CrewAI, etc.)
- helping humans **ship real features faster** instead of cleaning up after reckless agents

**You still need engineers, reviews, and real operations.**
CoFounder just makes the AI-powered parts safer, sharper, and less painful.

---

## Core Guardrails

CoFounder is an **integration-friendly guardrail & guidance layer** for AI agents working in real codebases and products.

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

## What CoFounder *Is* / *Isn't*

### CoFounder *is*:

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

### CoFounder is *not*:

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
  CoFounder is meant for **serious apps** where breaking things has real cost.

---

## Quickstart

CoFounder is designed to sit *under* the tools you already use.

### 1. Install

```bash
# Core library + CLI
npm install @waymakerai/aicofounder-core
npm install --save-dev @waymakerai/aicofounder-cli
```

Or with pnpm:

```bash
pnpm add @waymakerai/aicofounder-core
pnpm add -D @waymakerai/aicofounder-cli
```

### 2. Initialize CoFounder in your app

From your app root (for example, a Vercel AI SDK + Supabase app):

```bash
npx aicofounder init
```

This will:
- create a basic `.aicofounder.yml` config
- add example VibeSpecs (behavior/constraints)
- optionally add package.json scripts for `aicofounder check`, `aicofounder feature:new`, etc.

### 3. Configure providers and basic rules

Example `aicofounder.config.ts`:

```typescript
import { defineConfig } from '@waymakerai/aicofounder-core';

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

### 4. Use CoFounder in your server code

Example with a Vercel AI SDK–style handler:

```typescript
// app/api/cofounder-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCoFounder } from '@waymakerai/aicofounder-core';
import config from '../../../aicofounder.config';

const cofounder = createCoFounder(config);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body;

  const result = await cofounder.chat({
    messages,
    vibe: 'default', // refers to a VibeSpec in config/vibes/default.yml
  });

  return NextResponse.json(result);
}
```

You still use your usual stack (Vercel AI SDK + Supabase, LangChain, CrewAI, etc.)—
CoFounder just centralizes providers, routing, and guardrails underneath.

---

## Feature Flow: From Idea → Spec → Branch → Safe Draft

CoFounder's flagship experience is a **feature flow** that helps agents work in your codebase without wrecking it.

Instead of "ship a startup in 30 minutes," CoFounder focuses on:

> **Feature idea → spec → branch → draft implementation + tests + checks**
> under your rules, using your stack.

### CLI Overview

```bash
npx aicofounder init            # one-time setup in your app
aicofounder feature:new         # turn a feature idea into a clear spec
aicofounder feature:implement   # create a branch + safe draft changes
aicofounder check               # run safety gates (tests, lint, design, mock-data checks)
```

### Step 1: `aicofounder feature:new` — Guided Spec, Not Guesswork

You start with a human-sized idea, e.g.:
> "Add a 'team billing' settings page so admins can upgrade from monthly to annual."

Then run:

```bash
aicofounder feature:new
```

CoFounder will:

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

### Step 2: `aicofounder feature:implement` — Branch + Scoped Changes

Once the spec looks good, you run:

```bash
aicofounder feature:implement specs/feature-team-billing.yml
```

CoFounder will:

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

**CoFounder does not merge or deploy.**
It prepares a draft commit/PR that you can review, edit, and ship.

### Step 3: `aicofounder check` — Don't Let Agents Cowboy-Code

Before you open a PR, or as part of CI, run:

```bash
aicofounder check
```

By default, `aicofounder check` can be wired to:

- compile / typecheck (e.g. `tsc`, Next.js build)
- run tests (`npm test`, vitest, etc.)
- run lint (eslint, biome, etc.)
- enforce CoFounder-specific guardrails, such as:
  - No mock/demo data in production code
  - No inline hex colors / raw CSS if you use a design system
  - No unauthorized large refactors or file renames
  - No changes outside the declared changeset / scope

If any of these fail, the run is considered **unsafe**, and CoFounder will tell you why.

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

## Using CoFounder with LangChain

CoFounder is **not** trying to replace LangChain.
Instead, it acts as a **guardrail + provider layer** underneath it.

### Wrap CoFounder as a LangChain ChatModel

```typescript
import { RanaChatModel } from '@waymakerai/aicofounder-langchain';
import { createCoFounder } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder(config);

const model = new RanaChatModel({
  cofounder,
  vibe: 'feature_work', // uses VibeSpec: design system, DB rules, etc.
});

// Use in LangChain chains
const chain = prompt.pipe(model).pipe(outputParser);
const result = await chain.invoke({ input: 'Help me add a settings page' });
```

### Key idea:

- **LangChain** stays your orchestrator
- **CoFounder** provides:
  - provider routing (OpenAI/Anthropic/etc.)
  - VibeSpec (design system rules, "ask before acting", no mock data, etc.)
  - logging, cost-awareness, and optional checks

---

## Using CoFounder with CrewAI

CoFounder plays nicely with CrewAI: **CrewAI owns the crew/graph orchestration; CoFounder provides the LLM + guardrails + context rules.**

### Wrap CoFounder as a CrewAI-compatible LLM

```typescript
import { createCoFounderCrewModel } from '@waymakerai/aicofounder-crewai';
import { createCoFounder } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder(config);

const cofounderLLM = createCoFounderCrewModel({
  cofounder,
  vibe: 'feature_work', // agent inherits CoFounder's feature-work guardrails
});

// Use with CrewAI agents
const featureAgent = new Agent({
  name: 'Feature Implementer',
  role: 'Implement features safely in an existing codebase.',
  llm: cofounderLLM,
});
```

### Key idea:

- **CrewAI** defines who the agents are and how they coordinate
- **CoFounder** defines:
  - how each agent should behave (via VibeSpecs)
  - which providers/models to use
  - what constraints apply (no mock data, DS rules, ask-before-acting, etc.)

---

## Packages

| Package | Description |
|---------|-------------|
| `@waymakerai/aicofounder-core` | Unified LLM client, cost tracking, plugins, security |
| `@waymakerai/aicofounder-cli` | CLI for init, check, feature flows, deploy |
| `@waymakerai/aicofounder-rag` | RAG pipeline: chunking, retrieval, reranking, synthesis |
| `@waymakerai/aicofounder-agents` | Agent Development Kit (ADK): BaseAgent, tools, vibes |
| `@waymakerai/aicofounder-langchain` | LangChain adapter |
| `@waymakerai/aicofounder-crewai` | CrewAI adapter |
| `@waymakerai/aicofounder-mcp` | Model Context Protocol server & client |
| `@waymakerai/aicofounder-react` | React hooks for chat, RAG, streaming |
| `@waymakerai/aicofounder-ci` | CI/CD scanner: 7 rules for secrets, PII, injection, exposed assets |
| `@waymakerai/aicofounder-guard` | Runtime guard engine: PII, injection, toxicity, budget, rate limit |

---

## Feature Maturity Status

**Honest assessment** of what's production-ready vs experimental.

### Production Ready (Stable)

These features are tested, documented, and suitable for production use:

| Feature | Package | Status |
|---------|---------|--------|
| LLM Client (multi-provider) | `core` | Stable |
| Cost Tracking & Budgets | `core` | Stable |
| Provider Fallback | `core` | Stable |
| Retry with Exponential Backoff | `core` | Stable |
| Rate Limiting | `core` | Stable |
| Circuit Breaker | `core` | Stable |
| Response Caching | `core` | Stable |
| Prompt Injection Detection | `core` | Stable |
| PII Detection & Redaction | `core` | Stable |
| Content Filtering | `core` | Stable |
| Audit Logging | `core` | Stable |
| Memory Management | `core` | Stable |
| Config Parsing | `core` | Stable |
| CI Scanner (7 rules) | `ci` | Stable |
| Exposed Asset Detection | `ci` | Stable |

### Beta (Functional, Needs Validation)

These features work but may have edge cases or need more real-world testing:

| Feature | Package | Notes |
|---------|---------|-------|
| RAG Pipeline | `rag` | Core retrieval works; some advanced features need validation |
| Agent Framework | `agents` | Base agents work; orchestration patterns need more testing |
| MCP Server/Client | `mcp` | Protocol implemented; needs broader compatibility testing |
| React Hooks | `react` | Core hooks work; streaming needs edge case testing |
| LangChain Adapter | `langchain` | Basic integration works |
| CrewAI Adapter | `crewai` | Basic integration works |
| Quick LLM Helpers | `helpers` | All helpers functional |
| Prompt Management | `prompts` | Core versioning works |
| Code Generation | `generate` | Templates work; AI generation needs tuning |

### Experimental (Use With Caution)

These features are implemented but not production-hardened:

| Feature | Package | Notes |
|---------|---------|-------|
| Voice/Real-time | `core` | API defined; needs real provider testing |
| Video Understanding | `core` | Stub implementation |
| Image Generation | `core` | Stub implementation |
| Fine-tuning Pipeline | `core` | API defined; provider integration incomplete |
| Enterprise SSO/RBAC | `core` | Structure in place; not battle-tested |
| Edge/Offline Runtime | `core` | Architecture defined; limited testing |
| Advanced RAG (Self-Correcting) | `core` | Experimental algorithms |
| Model Router | `core` | Basic routing works; ML routing experimental |
| Agent Debugger | `core` | Basic tracing works; advanced features incomplete |

### Known Limitations

1. **No Production Deployments Yet**: CoFounder has not been deployed at scale in production environments. Use with appropriate caution.

2. **Integration Testing**: While unit tests pass, end-to-end integration testing with all providers is ongoing.

3. **Documentation Gaps**: Some advanced features lack comprehensive documentation.

4. **CLI Commands**: Many CLI commands are implemented but not all have been thoroughly tested in diverse project structures.

### What We'd Recommend

For a new project today, we recommend using:

- `@waymakerai/aicofounder-core` for LLM client, cost tracking, security features
- `@waymakerai/aicofounder-helpers` for quick LLM tasks
- `@waymakerai/aicofounder-prompts` for prompt versioning

Other packages are suitable for experimentation and early adoption but should be validated for your specific use case.

---

## CLI Commands

### Core Commands
```bash
aicofounder init                # Initialize CoFounder in your project
aicofounder check               # Run safety gates (tests, lint, guardrails)
aicofounder check --fix         # Auto-fix issues where possible
```

### Feature Commands
```bash
aicofounder feature:new         # Guided spec creation from an idea
aicofounder feature:implement   # Branch + scoped implementation
```

### LLM Commands
```bash
cofounder llm:setup           # Configure providers
cofounder llm:analyze         # Cost and usage analysis
cofounder llm:compare         # Compare providers for your use case
```

### Database Commands
```bash
cofounder db:setup            # Setup wizard
cofounder db:migrate          # Run migrations
cofounder db:check            # Validate schema
```

### Security Commands
```bash
cofounder security:audit      # Run security scan
cofounder security:setup      # Setup security config
```

### CI/CD Scanner
```bash
npx @waymakerai/aicofounder-ci scan --rules all          # Scan codebase for security issues
npx @waymakerai/aicofounder-ci scan --rules no-exposed-assets  # Check for exposed assets only
npx @waymakerai/aicofounder-ci validate                  # Validate .aicofounder.yml config
```

### Agent Commands
```bash
cofounder agent:new           # Scaffold a new agent
cofounder agent:test          # Run agent tests
cofounder agent:serve         # Start agent as API server
```

### Vibe Commands
```bash
cofounder vibe:new            # Create new VibeSpec
cofounder vibe:validate       # Validate VibeSpec YAML
cofounder vibe:compile        # Show compiled system prompt
```

---

## Documentation

### Getting Started
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Navigation hub
- **[QUICK_START.md](QUICK_START.md)** - 5-minute tutorial
- **[docs/cofounder-os-spec.md](docs/cofounder-os-spec.md)** - Full API specification

### Training Academy
- **[Fundamentals](https://cofounder.waymaker.cx/training/fundamentals)** - 8 lessons: framework basics, architecture, first project
- **[Building AI Agents](https://cofounder.waymaker.cx/training/building-agents)** - 12 lessons: tools, memory, orchestration, testing
- **[Advanced Patterns](https://cofounder.waymaker.cx/training/advanced-patterns)** - 15 lessons: streaming, caching, RAG, pipelines
- **[Production Deployment](https://cofounder.waymaker.cx/training/production-deployment)** - 10 lessons: Vercel, AWS, Docker, monitoring, security

### Framework Guides
- **[docs/LLM_OPTIMIZATION_GUIDE.md](docs/LLM_OPTIMIZATION_GUIDE.md)** - Cost optimization
- **[docs/SECURITY_FRAMEWORK_GUIDE.md](docs/SECURITY_FRAMEWORK_GUIDE.md)** - Security patterns
- **[docs/AGENT_DEVELOPMENT_KIT_GUIDE.md](docs/AGENT_DEVELOPMENT_KIT_GUIDE.md)** - Build AI agents
- **[docs/MCP_INTEGRATION_GUIDE.md](docs/MCP_INTEGRATION_GUIDE.md)** - MCP integration

### Technical
- **[CoFounder_WHITEPAPER.md](CoFounder_WHITEPAPER.md)** - Technical whitepaper
- **[CLI_COMMANDS_REFERENCE.md](CLI_COMMANDS_REFERENCE.md)** - All CLI commands

---

## Free & Open Source

CoFounder is **free and open source**.

- No per-seat license
- No proprietary runtime lock-in
- You control:
  - your models and providers
  - your data and logs
  - your CI/CD and deployment pipeline

Use CoFounder as:

- a drop-in guardrail layer in your existing projects
- a foundation for your own internal AI dev tools
- a place to contribute better patterns for safe, AI-assisted development

**License:** MIT

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Where to start (guardrails, vibes, flows, integrations)
- Code style expectations
- Vision guidelines (to avoid turning CoFounder into Another Orchestrator™)

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

**Named after:** Ashley's son (CoFounder = his nickname, like a piranha)

---

## Get Started

```bash
# Install
npm install @waymakerai/aicofounder-core @waymakerai/aicofounder-cli

# Initialize in your project
npx aicofounder init

# Create your first feature spec
aicofounder feature:new

# Run safety checks
aicofounder check
```

**Questions?**
- GitHub Issues: https://github.com/waymaker-ai/cofounder/issues
- Email: ashley@waymaker.cx or christian@waymaker.cx

---

**CoFounder** - Guardrails & Guidance for AI-Assisted Development

*Made with love to help you build real products, safely.*
