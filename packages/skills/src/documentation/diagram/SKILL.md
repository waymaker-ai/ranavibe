---
name: cofounder-diagram
description: Use this skill when the user asks for an architecture diagram, sequence diagram, ER diagram, dependency graph, flowchart, or "show me how this works visually". Generates Mermaid (default) or PlantUML diagrams from REAL code — actual imports, actual call graph, actual schema — never invented relationships. Writes to `docs/diagrams/<slug>.md`.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: mid
emits: [skill.run, diagram.generated]
---

# CoFounder: Diagram

You generate visual diagrams from the actual code, not from imagination. The hard rule: **every node and edge in the diagram must trace to a real file, function, or table.**

## When to invoke

- "Diagram the auth flow"
- "Show me how the payment service connects"
- "Architecture diagram for this module"
- "ER diagram from the schema"
- "Sequence diagram for the checkout"

## Diagram types supported

| Type | When to use | Mermaid kind |
|---|---|---|
| Architecture | high-level system view | `flowchart` or `C4Context` |
| Sequence | request/response flow over time | `sequenceDiagram` |
| ER | database schema | `erDiagram` |
| Class | OO inheritance / composition | `classDiagram` |
| State | finite state machines | `stateDiagram-v2` |
| Flowchart | decision flow / process | `flowchart` |

Default to Mermaid unless the user requests PlantUML or the diagram needs notation Mermaid lacks.

## Process

### Step 1 — Confirm scope

Ask one question only:
> "Which slice should I diagram — a module, a feature, the whole app, or a specific request flow?"

### Step 2 — Gather real evidence

Depending on diagram type:

- **Architecture**: read entrypoints (`package.json` scripts, `app/`, `pages/`, `api/`, `lib/`). Trace top-level imports.
- **Sequence**: pick the entrypoint (e.g., a route handler), then follow the call chain through `await` calls and DB queries.
- **ER**: read migration files / Prisma schema / SQL DDL — never invent column names.
- **Class**: read TS class definitions and `extends` / `implements` chains.

If you can't trace something, **omit it** rather than guess. Say so in the output.

### Step 3 — Render

Write the diagram to `docs/diagrams/<slug>.md` with:

```markdown
# <Title>

> Generated from code at <ISO timestamp> by `cofounder-diagram`.
> Source files: <comma-separated file paths>

\`\`\`mermaid
<diagram>
\`\`\`

## What's in scope
- <bullet list of files/modules represented>

## What's NOT shown
- <bullet list of things deliberately omitted, e.g. "internal helpers under 10 LOC", "test fixtures">
```

### Step 4 — Verify

After writing, scan your own diagram and ask:
- Does every node correspond to a real file/symbol?
- Does every edge correspond to a real import or call?
- Are there obvious gaps (e.g., missing the auth layer in a request flow)?

If a verification step fails, regenerate before reporting done.

## Style rules

- **Concise labels.** Use the short name from the file (e.g., `BillingPage`, not `app/(dashboard)/settings/billing/page.tsx`).
- **No magic boxes.** Every component must be defended by a file path comment in the source.
- **Group by domain**, not by tech layer (group "billing" and "auth" together, not "all controllers vs all services").
- **Cap node count** at ~25 for readability. If the slice is larger, split into multiple diagrams.

## What NOT to do

- Don't invent services, functions, or tables that don't exist in the code.
- Don't include third-party services unless they're actually called from the code.
- Don't add "TODO: future state" boxes — diagram the current code only.
