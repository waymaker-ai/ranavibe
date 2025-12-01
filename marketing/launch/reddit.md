# Reddit Launch Posts

## r/programming

### Title
RANA: A TypeScript AI framework focused on testing, cost tracking, and production-readiness

### Post
Hey r/programming,

I've been working on RANA, an AI framework for TypeScript that tries to solve the problems I kept hitting with existing tools.

**The Problem**

Every AI framework I tried had tradeoffs I didn't like:
- LangChain: Feature-rich but the abstraction complexity became the thing I was debugging
- Vercel AI SDK: Clean API but missing production essentials
- Raw SDKs: Works until you need testing, fallbacks, monitoring...

**What RANA Does Differently**

1. **Testing is first-class**

```typescript
import { aiTest, expect } from '@rana/testing';

aiTest('answers questions helpfully', async ({ rana }) => {
  const response = await rana.chat('What is TypeScript?');
  await expect(response).toSemanticMatch('programming language');
  await expect(response).toCostLessThan(0.01);
});
```

2. **Cost visibility built-in**
Every request tracked. Budgets enforced. No surprise bills.

3. **Multi-provider with one API**
Same code works with OpenAI, Anthropic, Google, or local Ollama models.

4. **Security by default**
Prompt injection detection, PII redaction, audit logs - all included.

**Code Comparison**

Basic RAG in LangChain: ~35 lines, 6 imports
Basic RAG in RANA: ~8 lines, 2 imports

**Numbers**
- Bundle size: ~50KB (vs ~500KB LangChain)
- 100% TypeScript with full type inference
- MIT licensed

**Links**
- GitHub: https://github.com/waymaker-ai/ranavibe
- Docs: https://rana.dev/docs

Looking for feedback on the API design. What would make you consider switching from your current setup?

---

## r/MachineLearning

### Title
[P] RANA: Production-focused AI framework with built-in testing and cost tracking

### Post
**TL;DR**: TypeScript AI framework that prioritizes testing, observability, and cost management for production ML applications.

**Motivation**

I've been shipping ML-powered products for a few years and kept rebuilding the same infrastructure:
- Cost tracking (token counting, budget alerts)
- Testing (how do you even test AI outputs?)
- Fallback handling (what happens when OpenAI is down?)
- Security (injection attacks, PII leakage)

RANA bundles all of this into a coherent framework.

**Key Features**

1. **Semantic Testing**
```typescript
await expect(response).toSemanticMatch('helpful response');
// Uses embeddings to compare meaning, not exact text
```

2. **Statistical Assertions**
```typescript
await expect(() => rana.chat(prompt)).toMostlyBe('yes', {
  confidence: 0.8,
  samples: 10
});
// Handles the probabilistic nature of LLMs
```

3. **Cost-Aware Routing**
```typescript
const rana = createRana({
  costOptimize: true, // Uses cheaper models when quality allows
});
```

4. **Automatic Fallbacks**
```typescript
const rana = createRana({
  providers: ['openai', 'anthropic'],
  fallback: true, // If OpenAI fails, try Anthropic
});
```

**Why TypeScript?**

The type system catches entire categories of bugs (wrong model names, malformed tool schemas, etc.) before runtime. The ecosystem is underserved compared to Python.

**Not a Replacement For**

- Training/fine-tuning (use HuggingFace, your cloud provider)
- Research experiments (use notebooks)
- Python-only environments (we're TS-only for now)

**Links**
- Code: https://github.com/waymaker-ai/ranavibe
- Paper/Design doc: https://rana.dev/design

Interested in feedback on the testing approach specifically. How do you currently test LLM outputs?

---

## r/typescript

### Title
Built a TypeScript-first AI framework: full type inference, great DX, no runtime surprises

### Post
Hey TypeScript folks,

Sharing a project I've been working on: RANA, an AI framework designed from the ground up for TypeScript.

**Why This Matters**

Most AI frameworks are Python-first with TypeScript as an afterthought. You get:
- `any` types everywhere
- Runtime errors for config mistakes
- No autocomplete for model names, parameters

RANA is the opposite.

**Type Examples**

```typescript
// Model names are typed
await rana.model('gpt-4').chat('...'); // ✓
await rana.model('gpt-5').chat('...'); // Type error!

// Tool parameters are inferred
const tool = createTool({
  name: 'get_weather',
  parameters: {
    location: { type: 'string' },
    unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
  },
  handler: ({ location, unit }) => {
    // location: string, unit: 'celsius' | 'fahrenheit'
    // No manual type annotations needed
  },
});

// Response types flow through
const response = await rana.chat('...'); // RanaResponse
const content = response.content; // string
const cost = response.usage.cost; // number
```

**Other Nice Things**

- Full JSDoc on everything
- Discriminated unions for responses
- Generic tool typing
- Template literal types for model IDs

**Links**
- GitHub: https://github.com/waymaker-ai/ranavibe
- Types source: https://github.com/waymaker-ai/ranavibe/blob/main/packages/core/src/types.ts

Would love feedback from TS purists on the type design. Any sharp edges you see?

---

## r/webdev

### Title
Built an AI framework for web devs: works with Next.js, Remix, Express out of the box

### Post
If you're a web dev adding AI features to your app, you might like RANA.

**What It Is**

A TypeScript AI framework that focuses on:
- Simple API (learn in an afternoon)
- Production features (testing, cost tracking, security)
- Framework-agnostic (works everywhere)

**Quick Examples**

**Next.js API Route**
```typescript
// app/api/chat/route.ts
import { createRana } from '@rana/core';

const rana = createRana();

export async function POST(req: Request) {
  const { message } = await req.json();
  const response = await rana.chat(message);
  return Response.json({ content: response.content });
}
```

**Streaming**
```typescript
export async function POST(req: Request) {
  const { message } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of rana.stream(message)) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream);
}
```

**React Hook**
```typescript
'use client';
import { useChat } from '@rana/react';

export function Chat() {
  const { messages, send, isLoading } = useChat();
  // Full chat UI with streaming, history, etc.
}
```

**Why Not Just Use the OpenAI SDK?**

You can! But RANA adds:
- Same API for OpenAI, Anthropic, Google (switch with one line)
- Automatic fallbacks when providers are down
- Cost tracking per user/feature
- Rate limiting, PII detection, etc.

MIT licensed, ~50KB.

GitHub: https://github.com/waymaker-ai/ranavibe
