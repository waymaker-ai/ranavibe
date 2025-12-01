# Dev.to Article

---
title: "Introducing RANA: The Rails of AI"
published: true
description: "A TypeScript-first AI framework with testing, cost tracking, and everything you need for production"
tags: ai, typescript, opensource, webdev
cover_image: https://rana.dev/og/launch.png
---

## The Problem with AI Frameworks

I've been building AI-powered applications for the past two years. In that time, I've tried every framework:

**LangChain** - Powerful, but I spent more time debugging the framework than building my app. The abstractions are leaky, the documentation is sparse, and good luck understanding the call stack when something breaks.

**Vercel AI SDK** - Clean and simple, but I kept needing things it didn't have. Testing utilities? Roll your own. Cost tracking? Roll your own. Fallbacks? Roll your own.

**Raw SDK calls** - Works great until your app grows. Then you're maintaining a bespoke framework anyway.

I wanted something different. Something that was:
- Simple enough to learn in an afternoon
- Powerful enough for production
- Tested enough to deploy with confidence

So I built RANA.

## What is RANA?

RANA is a TypeScript-first AI framework. The name comes from wanting to create "the Rails of AI" - opinionated, productive, and a joy to use.

Here's Hello World:

```typescript
import { createRana } from '@rana/core';

const rana = createRana();
const response = await rana.chat('Hello!');
console.log(response.content);
```

That's it. Three lines.

But the magic is what happens as your app grows. Every feature you need is built-in, not bolted-on.

## Feature 1: Testing That Actually Works

Testing AI code is notoriously hard. The outputs are probabilistic. Exact matching doesn't work. So most teams just... don't test.

RANA changes that:

```typescript
import { aiTest, expect } from '@rana/testing';

aiTest('answers questions about TypeScript', async ({ rana }) => {
  const response = await rana.chat('What is TypeScript?');

  // Semantic matching - compares meaning, not exact text
  await expect(response).toSemanticMatch('a programming language');

  // Cost assertions - ensure you're not burning money
  await expect(response).toCostLessThan(0.01);

  // Timing assertions - catch performance regressions
  await expect(response).toRespondWithin(2000);
});
```

The `toSemanticMatch` assertion uses embeddings to compare meaning. "TypeScript is a strongly-typed programming language" matches "a programming language" because they're semantically related.

For non-deterministic tests, there's `toMostlyBe`:

```typescript
aiTest('usually says yes to valid requests', async ({ rana }) => {
  await expect(() => rana.chat('Can you help me?'))
    .toMostlyBe('yes', { confidence: 0.8, samples: 10 });
});
```

## Feature 2: Cost Tracking

AI APIs are expensive. GPT-4 can easily cost $0.10+ per request. Without visibility, costs spiral.

RANA tracks every token:

```typescript
const rana = createRana({
  budget: {
    daily: 10,        // $10/day limit
    alertAt: 8,       // Alert at $8
  },
  onBudgetAlert: (stats) => {
    slack.send(`AI budget at ${stats.percentUsed}%`);
  },
});

// Later...
const stats = rana.getCostStats();
console.log(stats);
// { today: 4.32, thisWeek: 28.50, thisMonth: 112.00, byFeature: {...} }
```

Hard limits mean no surprise bills. Per-feature tracking means you know exactly where the money goes.

## Feature 3: Multi-Provider Support

What happens when OpenAI goes down? With most frameworks, your app goes down too.

RANA supports every major provider with a unified API:

```typescript
const rana = createRana({
  providers: ['openai', 'anthropic', 'google'],
  fallback: true,
});

// This will try OpenAI first, then Anthropic, then Google
const response = await rana.chat('Hello');
```

Same code works everywhere:

```typescript
await rana.model('gpt-4').chat('...');        // OpenAI
await rana.model('claude-3-opus').chat('...'); // Anthropic
await rana.model('gemini-pro').chat('...');   // Google
await rana.model('ollama/llama2').chat('...'); // Local
```

## Feature 4: Security By Default

AI apps have unique security concerns. Prompt injection. PII leakage. Jailbreaking.

RANA includes defenses out of the box:

```typescript
import { detectInjection, redactPII } from '@rana/security';

// Prompt injection detection
const userInput = "Ignore previous instructions and...";
const result = detectInjection(userInput);
if (result.isInjection) {
  console.log(result.confidence); // 0.92
  console.log(result.pattern); // "instruction override"
}

// PII redaction
const text = "Call me at 555-123-4567";
const redacted = redactPII(text);
// "Call me at [PHONE]"
```

## Feature 5: Observability

When something goes wrong in production, you need visibility:

```typescript
import { createTracer } from '@rana/observability';

const tracer = createTracer({
  export: 'opentelemetry',
  sentry: { dsn: '...' },
});

// Every request is now traced
// View in your observability platform of choice
```

## The Numbers

| Metric | RANA | LangChain |
|--------|------|-----------|
| Bundle Size | ~50KB | ~500KB |
| Hello World | 3 lines | 15+ lines |
| RAG Example | 8 lines | 35+ lines |
| TypeScript | 100% | Partial |
| Built-in Testing | ✓ | ✗ |
| Built-in Cost Tracking | ✓ | ✗ |

## Getting Started

```bash
# Create a new project
npx create-rana-app my-ai-app

# Or add to existing project
npm install @rana/core
```

Set your API key:

```bash
export OPENAI_API_KEY=sk-...
```

Write some code:

```typescript
import { createRana } from '@rana/core';

const rana = createRana();

// Simple chat
const response = await rana.chat('Write a haiku about TypeScript');
console.log(response.content);

// With tools
const weather = createTool({
  name: 'get_weather',
  description: 'Get current weather',
  parameters: { location: { type: 'string' } },
  handler: ({ location }) => `Weather in ${location}: Sunny, 72°F`,
});

const response = await rana
  .tools([weather])
  .chat('What\'s the weather in San Francisco?');
```

## Links

- **GitHub**: https://github.com/waymaker-ai/ranavibe
- **Docs**: https://rana.dev/docs
- **Discord**: https://discord.gg/rana

MIT licensed. Contributions welcome.

---

*If you've struggled with AI frameworks before, give RANA a try. I built it for developers like us.*
