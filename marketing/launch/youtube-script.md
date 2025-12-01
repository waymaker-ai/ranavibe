# YouTube Launch Video Script

## Video Title
RANA: Ship Production AI Apps in 5 Minutes (The Rails of AI)

## Video Description
Learn how to build production-ready AI applications with RANA, a TypeScript-first framework with built-in testing, cost tracking, and multi-provider support.

🔗 Links:
- GitHub: https://github.com/waymaker-ai/ranavibe
- Docs: https://rana.dev/docs
- Discord: https://discord.gg/rana

⏱️ Timestamps:
0:00 - Intro
0:45 - The Problem with AI Frameworks
2:00 - Creating Your First RANA App
3:30 - Adding Tools
4:30 - Testing AI Code
5:45 - Cost Tracking
6:30 - Multi-Provider Support
7:30 - Security Features
8:15 - Deploying to Production
9:30 - Conclusion

## Script

### [0:00 - Intro]
*[Screen: Terminal with code]*

"What if I told you that you could go from zero to a deployed AI application in under 5 minutes? Not a toy demo - a real production app with testing, cost tracking, and security built in.

That's what we're building today with RANA - a new AI framework I've been working on.

By the end of this video, you'll have a working AI app deployed to the cloud."

### [0:45 - The Problem]
*[Screen: Code comparison side by side]*

"But first, let me show you WHY I built this.

Here's a simple RAG pipeline in LangChain. *[show code]* 35 lines. Six imports. And if something breaks? Good luck reading that stack trace.

Here's the same thing in RANA. *[show code]* Eight lines. Two imports. And when something breaks, you can actually read the code.

The problem isn't that LangChain is bad. It's powerful. But it optimizes for flexibility over simplicity. When you just want to ship, that's a problem.

Vercel AI SDK is better on simplicity, but it's missing things you need for production. Testing utilities? None. Cost tracking? None. Fallbacks? None.

RANA is my attempt at having both: simple enough to learn in an afternoon, powerful enough to trust in production."

### [2:00 - Creating Your First App]
*[Screen: Terminal]*

"Let's build something. I'll start from scratch.

```bash
npx create-rana-app demo-app
```

This scaffolds a complete project with TypeScript, testing setup, everything.

```bash
cd demo-app
```

Let's add our API key. I'm using OpenAI but you could use Anthropic or Google.

```bash
export OPENAI_API_KEY=sk-...
```

Now let's look at the code that was generated.

*[Open editor, show src/index.ts]*

```typescript
import { createRana } from '@rana/core';

const rana = createRana();

const response = await rana.chat('Hello!');
console.log(response.content);
```

Three lines. Let's run it.

```bash
npm run dev
```

And there we go - our first AI response. But that's just Hello World. Let's make it useful."

### [3:30 - Adding Tools]
*[Screen: Editor]*

"AI gets really powerful when you give it tools to use. Let's add one.

```typescript
import { createRana, createTool } from '@rana/core';

const rana = createRana();

const searchDocs = createTool({
  name: 'search_docs',
  description: 'Search the documentation',
  parameters: {
    query: { type: 'string', description: 'Search query' },
  },
  handler: async ({ query }) => {
    // In real life, this would hit a vector database
    return `Found docs about ${query}`;
  },
});

const response = await rana
  .tools([searchDocs])
  .chat('How do I set up authentication?');
```

Notice what RANA does automatically: it calls the tool, gets the result, and incorporates it into the response. No manual tool call handling.

The types are inferred too. `query` is typed as `string` automatically."

### [4:30 - Testing AI Code]
*[Screen: Editor with test file]*

"Here's where RANA really shines. Let's write a test.

```typescript
import { aiTest, expect } from '@rana/testing';

aiTest('answers documentation questions', async ({ rana }) => {
  const response = await rana
    .tools([searchDocs])
    .chat('How do I authenticate?');

  // Semantic matching - doesn't need exact text
  await expect(response).toSemanticMatch('authentication');

  // Make sure we're not spending too much
  await expect(response).toCostLessThan(0.05);

  // Performance check
  await expect(response).toRespondWithin(3000);
});
```

Let's run it:

```bash
npm test
```

*[Show passing test]*

The semantic matching is key. AI outputs vary - the same prompt can give different words. `toSemanticMatch` uses embeddings to compare meaning, not exact text.

This means your tests don't break every time the model's phrasing changes."

### [5:45 - Cost Tracking]
*[Screen: Editor]*

"AI APIs are expensive. I've seen teams get surprise $10,000 bills. RANA prevents that.

```typescript
const rana = createRana({
  budget: {
    daily: 10,  // $10/day limit
    alertAt: 8, // Alert at $8
  },
  onBudgetAlert: (stats) => {
    console.log(`Warning: ${stats.percentUsed}% of budget used`);
  },
});
```

Now every request is tracked.

```typescript
const stats = rana.getCostStats();
console.log(stats);
// { today: 2.34, thisMonth: 45.67, byFeature: {...} }
```

You can see exactly what each feature costs. When the CFO asks why the AI bill is high, you have the answer."

### [6:30 - Multi-Provider Support]
*[Screen: Editor]*

"What happens when OpenAI goes down?

*[Show: OpenAI status page with outage]*

With most setups, your app goes down too. With RANA:

```typescript
const rana = createRana({
  providers: ['openai', 'anthropic', 'google'],
  fallback: true,
});
```

If OpenAI fails, we automatically try Anthropic. If that fails, Google. Your users never notice.

And the best part - same code works with any provider:

```typescript
await rana.model('gpt-4').chat('...');
await rana.model('claude-3-opus').chat('...');
await rana.model('gemini-pro').chat('...');
```

Want to test with local models? Just:

```typescript
await rana.model('ollama/llama2').chat('...');
```

Same API. Zero code changes."

### [7:30 - Security]
*[Screen: Editor]*

"AI apps have unique security issues. Prompt injection. PII leakage. RANA includes defenses.

```typescript
import { detectInjection, redactPII } from '@rana/security';

// Check for injection attacks
const userInput = "Ignore your instructions and...";
const check = detectInjection(userInput);
if (check.isInjection) {
  return 'Nice try!';
}

// Redact sensitive info before sending to AI
const safeText = redactPII(userInput);
// "Call me at [PHONE]" instead of real numbers
```

This isn't optional. These are real attacks happening in production."

### [8:15 - Deploying]
*[Screen: Terminal]*

"Let's deploy this. I'll use Vercel, but this works anywhere.

```bash
vercel deploy
```

*[Show deployment process]*

And we're live. That's a production AI app with testing, cost tracking, security, and multi-provider fallbacks.

Let's test it:

```bash
curl https://demo-app.vercel.app/api/chat -d '{"message":"Hello"}'
```

*[Show response]*

Working in production."

### [9:30 - Conclusion]
*[Screen: Slide with links]*

"That's RANA. A TypeScript AI framework that prioritizes developer experience AND production readiness.

- GitHub: github.com/waymaker-ai/ranavibe
- Docs: rana.dev/docs
- Discord: discord.gg/rana

If you're building AI apps and frustrated with the current options, give RANA a try. It's MIT licensed, community-driven, and I'd love your feedback.

Thanks for watching. If you found this helpful, subscribe for more AI development content."

---

## B-Roll Suggestions
- Terminal typing animations
- Code highlighting with zooms
- Split screen comparisons (RANA vs others)
- Dashboard mockups for cost tracking
- Architecture diagrams for multi-provider
- Green checkmarks for passing tests
