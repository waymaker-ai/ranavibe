---
name: cofounder-context-fit
description: Use this skill when the agent is hitting context limits, the prompt is too long, or "this conversation is getting expensive". Distills long inputs (long files, long histories, huge diffs, large RAG returns) into the minimum context that preserves the answer. Wraps `@waymakerai/aicofounder-context-optimizer`.
sensitivity:
  mayTouchPII: false
  writesCode: false
  runsShell: false
modelClass: mid
emits: [skill.run, context.distilled, context.savings]
---

# CoFounder: Context Fit

You shrink long inputs without losing the signal. The hard rule: **the distilled context must be sufficient to answer the question** — saving tokens at the cost of correctness is a regression.

## When to invoke

- The next prompt is going to exceed the model's window.
- The agent is reading a 5000-line file when only a section is relevant.
- A RAG retrieval returned 50 chunks and only ~5 are likely useful.
- The user says "this is getting too long / too expensive".

## Strategies (apply in order)

### 1. Targeted slicing (cheapest, do first)

Before any LLM call:
- **For files**: identify the function, class, or section relevant to the question. Drop the rest.
- **For diffs**: drop hunks in unrelated files.
- **For chat history**: keep system prompt + last N turns + any turn the user explicitly references.

This is regex / AST work, not a model call. Always try it before summarization.

### 2. Hierarchical summarization

For inputs that survive slicing but are still too long:
- Chunk by structural boundary (function, section, paragraph), not by token count.
- Summarize each chunk in isolation with a small model (Haiku).
- Concatenate summaries; if still too long, summarize the summaries.

### 3. RAG re-rank

For RAG returns:
- Rerank chunks by query relevance (small reranker model or BM25).
- Keep top-K (default K=8).
- Drop near-duplicates.

### 4. Repository-aware chunking (for code-heavy contexts)

When summarizing a codebase:
- Always preserve: type definitions, public API signatures, JSDoc comments.
- Drop first: tests, generated code, vendored deps, lock files.
- Group by domain, not by directory tree.

## Process

### Step 1 — Estimate

Count tokens of the current context. Identify the biggest contributors (top 3 files / sources).

### Step 2 — Pick strategies

Decide which strategies apply. Prefer slicing over summarization (lossless > lossy).

### Step 3 — Distill

Run the strategies. After each, re-estimate tokens. Stop when under target or when further compression risks correctness.

### Step 4 — Verify

Ask yourself: "Could a reader answer the user's question from the distilled context alone?" If no, back off compression.

### Step 5 — Report

```markdown
# Context Fit Report

**Original:** 184K tokens
**Distilled:** 23K tokens (87% reduction)
**Strategies applied:**
1. Sliced 3 files to relevant sections (147K → 41K)
2. Summarized 12 RAG chunks to 4 (41K → 28K)
3. Dropped chat turns 1–18 (kept the last 6) (28K → 23K)

**Cost saved:** ~$0.41 on this call (estimated at Sonnet rates).
**Correctness check:** verified by sampling — distilled context contains the symbols / facts the question requires.

**What was dropped:**
- Test files (out of scope)
- Generated migrations (not relevant to the question)
- Old conversation turns that didn't reference the current task
```

## What NOT to do

- Don't compress a context you haven't read first.
- Don't drop content that is referenced by the question without flagging.
- Don't summarize legal text, configuration, or anything where exact wording matters — slice instead.
- Don't apply lossy compression to security-critical context (audit logs, compliance evidence).
