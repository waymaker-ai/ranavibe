# Hacker News Launch

## Show HN Title
Show HN: RANA – The Rails of AI (TypeScript framework with testing, cost tracking)

## Post Content
Hi HN,

We're launching RANA, an AI framework built with one goal: make building production AI apps as easy as Rails made building web apps.

**Why we built this:**

After building several AI products, we kept hitting the same walls:
- LangChain: Powerful but the learning curve is steep and the abstractions leak
- Vercel AI SDK: Simple but missing production essentials
- Raw SDK calls: Works until you need testing, fallbacks, cost tracking...

RANA is our attempt at the sweet spot: simple enough to learn in an afternoon, powerful enough for production.

**What makes it different:**

```typescript
// The whole thing fits in your head
import { createRana } from '@rana/core';

const rana = createRana();
const response = await rana.chat('Hello!');
```

But when you need more:

```typescript
const rana = createRana({
  providers: ['openai', 'anthropic', 'ollama'],
  fallback: true,
  budget: { daily: 10 },
});

// Automatic fallbacks, cost tracking, all built-in
const response = await rana
  .model('gpt-4')
  .system('You are helpful')
  .tools([myTool])
  .chat('Help me with...');
```

**The parts we're most proud of:**

1. **Testing** - `aiTest()` with semantic matching and regression testing. Finally, CI for AI.
2. **Cost tracking** - Know exactly what you're spending. Set budgets. Get alerts.
3. **Security** - Prompt injection detection, PII redaction built-in.
4. **Multi-provider** - Same API for OpenAI, Anthropic, Google, local models.

**Numbers:**
- 90% less code than LangChain for equivalent functionality
- ~50KB bundle (vs ~500KB for LangChain)
- 100% TypeScript with full inference

**Links:**
- GitHub: https://github.com/waymaker-ai/ranavibe
- Docs: https://rana.dev/docs
- 5-min demo: https://rana.dev/demo

MIT licensed. We'd love feedback on the API design and what features you'd prioritize.

---

## Anticipated Questions & Answers

**Q: Why not just use LangChain?**
A: LangChain is great for experimentation but the abstraction complexity often becomes the problem you're solving. RANA prioritizes readability and debuggability. When something breaks, you can read the code and understand it.

**Q: How is this different from the Vercel AI SDK?**
A: We love the Vercel AI SDK and share similar API philosophies. RANA adds what you need for production: testing utilities, cost tracking, security features, multi-provider fallbacks, and observability. Think of it as "Vercel AI SDK + production essentials."

**Q: Why TypeScript?**
A: AI code benefits enormously from types. When you're passing around model configurations, tools, messages, knowing exactly what shape things are prevents entire categories of bugs. Plus, the DX with autocomplete is chef's kiss.

**Q: What about Python?**
A: We're focused on TypeScript for now. Python has LangChain and LlamaIndex which are mature. The TypeScript ecosystem for AI is comparatively underserved.

**Q: How do you handle testing AI outputs?**
A: We built `@rana/testing` specifically for this. It includes:
- `semanticMatch()` - Fuzzy semantic comparison (accounts for word choice variations)
- `toPassRegression()` - Snapshot testing for prompts
- `toMostlyBe()` - Statistical assertions for probabilistic outputs

**Q: What's the cost tracking approach?**
A: Every API call is tracked with token counts and pricing. You can set hard budget limits, get alerts at thresholds, and see per-feature cost breakdowns. All stored locally - we don't phone home.

**Q: Is this production-ready?**
A: We've been running it in production for 6 months processing ~500k requests/day. That said, we're marking it as beta until we have more community feedback.
