# CoFounder Architecture

This document describes the high-level architecture of the CoFounder monorepo, its package structure, design principles, and key abstractions.

---

## Monorepo Structure

CoFounder is organized as a pnpm workspace monorepo with the following top-level directories:

```
cofounder/
  packages/       Core libraries and SDK packages (published to npm)
  examples/       Example projects demonstrating usage patterns
  tools/          Internal CLI tools and developer utilities
  website/        Marketing site and documentation (Next.js)
  extensions/     IDE extensions (VS Code)
  apps/           Application frontends (docs, web)
```

### packages/

All publishable packages live here. Each package is independently versioned and published under the `@waymakerai/aicofounder-*` scope.

| Package | Purpose |
|---------|---------|
| `core` | Central client, config, plugin system, integrations, MCP, observability |
| `guard` | Zero-dependency guardrail engine (PII detection, injection checks, cost limits) |
| `compliance` | Regulatory enforcement (HIPAA, GDPR, SEC, SOX, PCI-DSS) |
| `agent-sdk` | Agent SDK with interceptor pipeline and audit logging |
| `agents` | Higher-level agent abstractions (LLM agent, chat agent, task agent, RAG-QA agent) |
| `streaming` | Stream-aware guardrails with provider adapters (OpenAI, Anthropic, SSE) |
| `policies` | YAML/JSON policy engine for declarative rule enforcement |
| `guidelines` | Dynamic behavioral guidelines with conditions and versioning |
| `cli` | Developer CLI (generate, playground, prompts) |
| `ci` | CI/CD integration (GitHub PR comments, SARIF reports) |
| `sdk` | Unified developer SDK surface |
| `react` | React bindings and provider components |
| `rag` | Retrieval-augmented generation utilities |
| `mcp` | Model Context Protocol client and server |
| `mcp-server` | Standalone MCP server with scaffolding |
| `helpers` | High-level helper functions (summarize, classify, extract, translate, etc.) |
| `context-optimizer` | Context window optimization strategies |
| `compliance` | Compliance rule engine and enforcer |
| `openclaw` | OpenClaw compliance bridge |
| `sandbox` | Sandboxed code execution |
| `testing` | Test runner and assertion utilities for guardrail validation |
| `benchmark` | Performance benchmarking framework |
| `soc2` | SOC 2 evidence collection and report generation |
| `dashboard` | Runtime dashboard and storage |
| `colang` | Colang integration |
| `adapters` | Provider adapters (Bedrock, Galileo) |
| `langchain` | LangChain integration |
| `crewai` | CrewAI integration |
| `marketplace` | Plugin marketplace catalog and publisher |
| `llm-detect` | LLM-generated content detection |
| `multi-tenant` | Multi-tenant isolation |
| `prompts` | Prompt management and versioning |
| `generate` | Code generation CLI and API |
| `create-rana-app` | Project scaffolding tool |
| `rana-ui` | UI component library |
| `rana-ui-cli` | UI component CLI |

### examples/

Runnable example projects demonstrating real-world integration patterns:

- `agent-sdk-demo` -- Agent SDK with interceptors
- `chatbot` -- Basic chatbot with guardrails
- `ci-demo` -- CI/CD integration
- `code-generation-demo` -- Code generation with guardrails
- `compliance-demo` -- Compliance enforcement
- `dashboard-demo` -- Dashboard setup
- `guard-demo` -- Core guard usage
- `guidelines-demo` -- Dynamic guidelines
- `multi-agent` -- Multi-agent orchestration
- `openclaw-demo` -- OpenClaw integration
- `policies-demo` -- Policy engine
- `rag-app` -- RAG with guardrails
- `rana-ui-example` -- UI components
- `sdk-demo` -- Full SDK usage
- `phase-3-features` -- Advanced features (voice, fine-tuning, edge, etc.)

### tools/

Internal developer tooling:

- `cli` -- The main `cofounder` CLI binary
- `waymaker-aads-pro` -- Internal Waymaker tooling

### website/

Next.js marketing and documentation site deployed at cofounder.cx.

### extensions/

- `vscode-rana` -- VS Code extension for in-editor guardrail feedback

---

## Package Dependency Graph

The dependency flow follows a layered architecture. Lower layers have zero or minimal dependencies; higher layers compose them.

```
                         apps / examples
                              |
              +---------------+---------------+
              |               |               |
          agents          react           dashboard
              |               |               |
          agent-sdk       sdk             ci
              |               |               |
    +---------+---------+     |          +----+----+
    |         |         |     |          |         |
compliance  guard   streaming |       policies  testing
    |         |         |     |          |
    +----+----+---------+-----+----------+
         |
        core
         |
    (zero runtime deps)
```

Key design constraint: `guard` has **zero runtime dependencies**. It can be used standalone in any JavaScript environment without pulling in the rest of the framework.

---

## Design Principles

### 1. Zero-Dependency Guard

The `guard` package is the foundation. It performs PII scanning, prompt injection detection, and cost estimation with no external dependencies. This means it can run in edge runtimes, serverless functions, browsers, or CI pipelines without bloat.

### 2. Composable Interceptors

The `agent-sdk` uses an interceptor pipeline pattern. Each interceptor (audit, compliance, cost, PII, injection) is a composable middleware that can be added, removed, or reordered. This follows the same pattern as HTTP middleware stacks.

### 3. Compliance-First

Regulatory compliance (HIPAA, GDPR, SEC, SOX, PCI-DSS) is not an afterthought. The `compliance` package provides an `ComplianceEnforcer` that validates every LLM interaction against a configurable set of rules before the request reaches the provider.

### 4. Provider-Agnostic

CoFounder does not lock you into any LLM provider. The `core` package supports OpenAI, Anthropic, Bedrock, and others. The `streaming` package has dedicated adapters per provider. You bring your own API keys.

### 5. Declarative Policies

The `policies` package lets you define guardrail rules as YAML or JSON files in your repository. This makes rules reviewable in PRs, versionable in git, and enforceable in CI.

### 6. Integration-Friendly

CoFounder is designed to plug into your existing stack (Vercel AI SDK, LangChain, CrewAI, Supabase) rather than replace it. Integration packages provide thin bridges, not heavy abstractions.

---

## Guardrails Pipeline

When a prompt flows through CoFounder, it passes through a series of checks:

```
User Input
    |
    v
[1. PII Scan] -----> Detect and redact personally identifiable information
    |
    v
[2. Injection Check] --> Detect prompt injection and jailbreak attempts
    |
    v
[3. Compliance] ----> Enforce regulatory rules (HIPAA, GDPR, SEC, etc.)
    |
    v
[4. Policy Check] --> Evaluate declarative YAML/JSON policy rules
    |
    v
[5. Cost Estimation] -> Estimate token cost, enforce budget limits
    |
    v
[6. LLM Provider] --> Forward to OpenAI / Anthropic / Bedrock / etc.
    |
    v
[7. Output Scan] ---> Scan LLM response for PII leaks, compliance violations
    |
    v
[8. Stream Guard] --> (If streaming) Scan token-by-token with buffered detection
    |
    v
Safe Output
```

Each stage can block the request, redact content, log a warning, or let it pass. The pipeline is fully configurable -- you can disable stages, reorder them, or add custom interceptors.

---

## Key Abstractions

### Guard

The core guardrail engine in `packages/guard`. Provides:
- `scanPII()` -- Detect personally identifiable information
- `detectInjection()` -- Detect prompt injection attempts
- `estimateCost()` -- Estimate token usage and cost
- `guard()` -- Run the full scan pipeline

### Interceptor (Agent SDK)

A middleware function in `packages/agent-sdk` that wraps LLM calls:

```typescript
interface Interceptor {
  beforeRequest?(context: RequestContext): Promise<RequestContext>;
  afterResponse?(context: ResponseContext): Promise<ResponseContext>;
}
```

Built-in interceptors: `AuditInterceptor`, `ComplianceInterceptor`, `CostInterceptor`, `PIIInterceptor`.

### ComplianceEnforcer

In `packages/compliance`. Evaluates LLM interactions against a set of compliance rules:

```typescript
const enforcer = new ComplianceEnforcer({
  frameworks: ['hipaa', 'gdpr'],
  rules: [...],
});
const result = await enforcer.evaluate(interaction);
```

### PolicyEngine

In `packages/policies`. Loads and evaluates declarative policy files:

```typescript
const engine = new PolicyEngine();
await engine.load('./policies/*.yaml');
const result = await engine.evaluate(request);
```

### StreamGuard

In `packages/streaming`. Wraps streaming LLM responses and scans tokens in real time using a sliding buffer window:

```typescript
const guarded = new StreamGuard(stream, {
  detectors: [piiDetector, injectionDetector],
  bufferSize: 50,
});
```

### GuidelineManager

In `packages/guidelines`. Manages dynamic behavioral guidelines with conditions, versioning, and real-time updates.

---

## How to Add a New Package

1. Create a directory under `packages/<your-package>/`
2. Add a `package.json` with:
   - Name: `@waymakerai/aicofounder-<your-package>`
   - Build script using `tsup`
   - TypeScript as a dev dependency
3. Add a `tsconfig.json` extending the root config
4. Add `src/index.ts` as the entry point
5. Add `src/types.ts` for type definitions
6. Write tests as `*.test.ts` files alongside source files
7. Export from `src/index.ts`
8. Add the package to the pnpm workspace (`pnpm-workspace.yaml`)
9. If the package depends on other CoFounder packages, use workspace protocol: `"@waymakerai/aicofounder-core": "workspace:*"`

---

## Technology Choices

| Choice | Rationale |
|--------|-----------|
| **TypeScript** | Type safety across the entire monorepo. All packages are TypeScript-first. |
| **pnpm** | Fast, disk-efficient package manager with first-class workspace support. |
| **tsup** | Fast, zero-config TypeScript bundler built on esbuild. Produces ESM and CJS. |
| **vitest** | Fast test runner with native TypeScript support, compatible with Jest API. |
| **Zod** | Runtime schema validation used for config parsing and API validation. |
| **Next.js** | Website and docs framework (website/ and apps/). |

---

## Configuration

CoFounder uses a layered configuration system:

1. **`aicofounder.config.ts`** -- TypeScript config file in the project root
2. **`.aicofounder.yml`** -- YAML config for simpler setups
3. **Policy files** -- `policies/*.yaml` for declarative rules
4. **Environment variables** -- API keys and runtime overrides

The `core` package's `defineConfig()` function provides type-safe configuration with validation.
