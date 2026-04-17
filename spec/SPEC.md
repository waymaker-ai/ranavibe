# CoFounder Open Spec

**Status:** Draft v1
**Applies to:** `cofounder.cx/v1`
**License:** CC-BY 4.0 (spec text) / MIT (schemas)

The CoFounder Open Spec defines two portable configuration formats for AI-assisted development:

- **VibeSpec** — declares **how an agent should behave** in a context (tone, constraints, allowed actions, design-system rules, data rules, compliance).
- **FlowSpec** — declares **how AI-assisted work is broken into steps** (clarify → plan → implement → test → review) with **gates** that must pass before the flow advances.

The goal is interoperability: a single `.yml` file in your repo should be readable by CoFounder's CLI, a Claude Code plugin, a Cursor rules generator, a Cline adapter, a LangChain wrapper, or any other tool that implements the spec.

## Why a spec

Every AI-coding tool today ships its own rules format (`CLAUDE.md`, `.cursorrules`, `.cursor/rules/*.mdc`, `.clinerules`, Continue `config.yaml`, Windsurf rules). None of them talk to each other. Switching tools means re-writing your guardrails.

VibeSpec and FlowSpec aim to be the **interchange format**. Tools are expected to translate a VibeSpec to their native format at install time, not to replace their native format wholesale.

## Conformance

A tool **conforms to CoFounder Spec v1** if it:

1. Accepts a VibeSpec or FlowSpec document with `apiVersion: cofounder.cx/v1`.
2. Validates the document against the published JSON Schemas in this directory.
3. Rejects documents that reference unknown required fields (`additionalProperties: false` is enforced at the top level).
4. Ignores `metadata.*` keys it does not understand (they are free-form, namespaced by convention).
5. Preserves the document verbatim when re-emitting (no silent rewrites).

## VibeSpec

### Minimal example

```yaml
apiVersion: cofounder.cx/v1
id: next_feature_work
name: "Next.js Feature Work"
description: "Constraints for agents working on Next.js App Router features in our SaaS."

vibe:
  tone: "concise, technical, asks-before-acting"
  constraints:
    - "Never delete existing files without explicit human approval."
    - "Follow the App Router conventions — no pages/ directory."
    - "Extend existing components before creating new ones."
  designSystem:
    componentsPath: "components/ui"
    forbidRawColors: true
  dataRules:
    forbidMockInProd: true
    piiHandling: redact
  scopeRules:
    allowedPaths:
      - "app/**"
      - "components/**"
      - "lib/**"
    forbiddenPaths:
      - ".env*"
      - "drizzle/**"

llm:
  provider: anthropic
  model: claude-sonnet-4-5-20250929
  temperature: 0.2

security:
  piiRedaction: true
  promptInjectionDetection: true
  compliance: [gdpr]

budget:
  limit: 5
  period: day
  onExceeded: warn
```

### Field reference

See [`vibespec.v1.schema.json`](./vibespec.v1.schema.json) for the complete, machine-validated reference.

**Top-level:**
- `apiVersion` (recommended) — always `cofounder.cx/v1`
- `id` (required) — lowercase identifier, unique within your repo
- `name` (required) — human-readable label
- `extends` (optional) — inherit from another VibeSpec by id

**Behavioral fields** (`vibe.*`):
- `tone` — how the agent should talk
- `constraints` — rules the agent MUST follow, one imperative sentence each
- `allowedActions` / `disallowedActions` — tool whitelists/blacklists
- `designSystem` — componentsPath, tokensPath, `forbidRawColors`, `forbidRawSpacing`, `requireComponents`
- `dataRules` — `forbidMockInProd`, `forbidHardcodedCredentials`, `allowedDatabases`, `piiHandling`
- `scopeRules` — `allowedPaths`, `forbiddenPaths`, `requireChangesetApproval`

**Runtime fields:**
- `rag` — kbId, topK, rerank, filters
- `llm` — provider, model, temperature, maxTokens, fallback chain
- `security` — redaction + compliance flags
- `budget` — monetary ceiling per period
- `eval` — success criteria + blocked patterns for CI / benchmarking

**Tool-specific fields** live under `metadata.*` with a tool namespace (e.g. `metadata.claude.skillName`, `metadata.cursor.priority`, `metadata.openclaw.emoji`).

## FlowSpec

### Minimal example

```yaml
apiVersion: cofounder.cx/v1
id: new_feature
name: "New feature from idea to PR"
vibe: next_feature_work

inputs:
  - name: idea
    type: string
    description: "One-paragraph feature idea"
    required: true

steps:
  - id: clarify
    name: "Clarify requirements"
    kind: clarify
    prompt: |
      Read the idea: {{inputs.idea}}
      Ask up to 5 clarifying questions about roles, data sources, and acceptance criteria.
    output:
      savePath: "specs/{{inputs.idea | slug}}.clarifications.md"

  - id: spec
    name: "Write feature spec"
    kind: plan
    requires: [clarify]
    promptPath: "prompts/feature-spec.md"
    output:
      savePath: "specs/{{inputs.idea | slug}}.spec.yml"
      format: yaml
    gate:
      humanApprovalRequired: true

  - id: implement
    name: "Implement the changeset"
    kind: implement
    requires: [spec]
    prompt: "Implement {{steps.spec.output}} under the VibeSpec constraints."
    gate:
      checks: [typecheck, aicofounder-check, scope-respect, no-mock-data]
    onFail: ask-human

  - id: tests
    name: "Add tests"
    kind: test
    requires: [implement]
    prompt: "Write vitest tests covering the acceptance criteria in {{steps.spec.output}}."
    gate:
      checks: [test]

  - id: review
    name: "Self-review and open PR"
    kind: review
    requires: [tests]
    prompt: "Produce a PR description. Do NOT push; present the diff for human approval."
    gate:
      humanApprovalRequired: true
```

### Gate checks

The canonical check vocabulary (other tools may extend it):

| Check | What it does |
|-------|--------------|
| `compile` | Project builds |
| `typecheck` | `tsc --noEmit` or equivalent |
| `lint` | ESLint/Biome/ruff passes |
| `test` | Project test suite passes |
| `aicofounder-check` | Run the full CoFounder guardrail suite (PII, secrets, compliance, budget) |
| `no-secrets` | No new high-entropy strings, API key patterns, or `.env*` writes |
| `no-mock-data` | No `mockUsers`, `fakeXxx`, `const data = [{...}]` patterns in prod paths |
| `scope-respect` | Changeset stays within the step's declared paths |
| `design-system-compliance` | No hex colors, raw Tailwind arbitrary values, or bypassed UI primitives |
| `human-approval` | Wait for explicit user confirmation |

## Path reference syntax

Within `prompt`, `promptPath`, and `output.savePath`, the following interpolations are available:

- `{{inputs.<name>}}` — an input value
- `{{steps.<id>.output}}` — the output captured by a prior step
- `{{repo.root}}` — absolute path to the repo root
- `{{vibe.id}}` — id of the active VibeSpec
- Pipe filters: `| slug`, `| upper`, `| lower`

## Compatibility matrix (initial)

| Tool | VibeSpec read | VibeSpec translated to | FlowSpec executed |
|------|---------------|------------------------|-------------------|
| CoFounder CLI (`aicofounder`) | native | — | yes |
| Claude Code plugin (`@waymakerai/claude-plugin-cofounder`) | native | `CLAUDE.md` + skills + hooks | via skills |
| Cursor rules generator (`aicofounder cursor:generate`) | native | `.cursor/rules/*.mdc` | no |
| Cline (future) | native (planned) | `.clinerules` | planned |
| OpenClaw skill (`@waymakerai/aicofounder-openclaw`) | native | skill system prompt | no |
| LangChain adapter | native | runtime config | no |

## Versioning

The spec is **additive within a major version**. Breaking changes bump `apiVersion` (e.g. `cofounder.cx/v2`). Tools SHOULD support the latest two major versions.

Minor additions (new optional fields) are allowed within `v1` without a version bump; tools MUST ignore unknown optional fields.

## Contributing

Proposed changes:
- Open a PR against `spec/` with updates to the JSON Schema and this document.
- Include at least one example document that exercises the new field.
- If the change affects any existing tool adapter, link the adapter PR.

## Open questions

1. Should `llm.provider` be constrained to an enum, or kept open for custom providers?
2. How do we express cross-vibe composition beyond single `extends`?
3. Should FlowSpec `gate.checks` be pluggable so tools can register new checks?

Feedback welcome at <https://github.com/waymaker-ai/cofounder/discussions>.
