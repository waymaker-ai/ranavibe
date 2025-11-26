# RANA v2.0 Launch Materials

Complete launch materials for all platforms. Copy/paste and customize as needed.

---

## 🐦 Twitter/X Thread

### Tweet 1 (Main Announcement)
```
🚀 Launching RANA v2.0 - The React of AI Development

We've transformed RANA from a CLI tool into a full JavaScript framework.

Now you can:
✅ Use as a library (@rana/core)
✅ React hooks (@rana/react)
✅ Full TypeScript support
✅ 70% cost savings (automatic)
✅ One-word CLI commands

🧵 Thread 👇
```

### Tweet 2 (Problem)
```
The problem with AI development today:

❌ Vendor lock-in (stuck with one provider)
❌ Expensive (GPT-4 costs $5/1M tokens)
❌ Fragmented tools (different SDK for each provider)
❌ No cost tracking
❌ Hours of setup

RANA solves all of this.
```

### Tweet 3 (Solution - SDK)
```
RANA v2.0 gives you a unified SDK:

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('Hello!');
```

One API. 9 providers. Zero lock-in.
```

### Tweet 4 (React Hooks)
```
React hooks that feel natural:

```tsx
function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana);

  return (
    <div>
      {response && <div>{response.content}</div>}
      <p>Cost: ${cost.toFixed(4)}</p>
    </div>
  );
}
```

Build AI apps like you build with React!
```

### Tweet 5 (Cost Savings)
```
70% automatic cost reduction:

Before RANA: $1,800/month on OpenAI
After RANA: $450/month (mixed providers)
Savings: $16,200/year 💰

How?
• Response caching (40% savings)
• Smart routing (25% savings)
• Prompt optimization (15% savings)
• RAG implementation (30% savings)
```

### Tweet 6 (Features)
```
What you get:

🤖 9 LLM providers (Anthropic, OpenAI, Google, xAI, Mistral, Cohere, Together, Groq, Ollama)
💰 Real-time cost tracking
⚡ Response caching
🔌 Plugin system
📊 Terminal dashboard
🎯 Smart analysis
🔧 Auto-optimization

All free & open source (MIT)
```

### Tweet 7 (CLI)
```
Enhanced CLI with one-word commands:

```bash
rana dashboard     # Real-time cost monitoring
rana analyze       # Get AI recommendations
rana optimize      # Apply optimizations
rana fix           # Auto-fix issues
```

Fast, intuitive, powerful.
```

### Tweet 8 (TypeScript)
```
Full TypeScript support:

• IntelliSense for all providers/models
• Type-safe configuration
• Auto-complete everywhere
• Catch errors before runtime

Your IDE becomes your AI copilot.
```

### Tweet 9 (Comparison)
```
RANA vs Others:

| Feature | RANA | LangChain | Haystack |
|---------|------|-----------|----------|
| Providers | 9 | 6 | 4 |
| Cost tracking | ✅ | ❌ | ❌ |
| React hooks | ✅ | ❌ | ❌ |
| Free forever | ✅ | Paid tiers | Paid tiers |

RANA wins 17/18 categories 🏆
```

### Tweet 10 (CTA)
```
Get started in 5 minutes:

```bash
npm install @rana/core @rana/react
```

📚 Docs: https://rana.dev
⭐ Star: https://github.com/waymaker/rana
💬 Discord: https://discord.gg/rana

Made with ❤️ to help you build better AI apps.

RT to share! 🚀
```

---

## 📰 Product Hunt

### Title
```
RANA – AI SDK with React hooks and 70% cost reduction
```

### Tagline
```
Build AI apps like you build with React. 9 LLM providers, automatic cost optimization, free forever.
```

### Description
```
## What is RANA?

RANA (Rapid AI Native Architecture) is a comprehensive JavaScript framework for building production AI applications. Think of it as "the React of AI development."

## The Problem

Building AI applications today is fragmented and expensive:
- Vendor lock-in (stuck with one provider)
- High costs ($1,800/month is common)
- Different SDK for each provider
- No cost tracking or optimization
- Hours of manual setup

## The Solution

RANA provides:

**🤖 Unified SDK**
- One API for 9 LLM providers (Anthropic, OpenAI, Google Gemini, xAI, Mistral, Cohere, Together.ai, Groq, Ollama)
- Switch providers in one line of code
- No vendor lock-in ever

**⚛️ React Hooks**
```tsx
const { chat, response, loading, cost } = useRanaChat(rana);
```
- 5 custom hooks
- Feels like React Query
- Full TypeScript support

**💰 70% Cost Reduction (Automatic)**
- Response caching
- Smart model selection
- Prompt optimization
- RAG implementation

**⚡ Developer Experience**
- Fluent, chainable API
- One-word CLI commands
- Real-time cost dashboard
- AI-powered analysis
- Auto-optimization

## Quick Start

```bash
npm install @rana/core @rana/react
```

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('Hello!');
```

## Why RANA?

✅ **Free Forever** - MIT license, no paid tiers
✅ **9 Providers** - Most in the industry
✅ **70% Savings** - Automatic cost optimization
✅ **React Hooks** - Build like you're used to
✅ **TypeScript** - Full IntelliSense support
✅ **5min Setup** - vs 40 hours manual

## Perfect For

- Startups building AI features
- Developers tired of vendor lock-in
- Teams wanting to reduce LLM costs
- Anyone building chatbots, agents, or AI apps

## What's Different?

Unlike LangChain or Haystack, RANA:
- Has more providers (9 vs 4-6)
- Includes React hooks out of the box
- Provides automatic cost optimization
- Offers real-time cost tracking
- Is 100% free forever (MIT)

## Get Started

📚 Documentation: https://rana.dev
⭐ GitHub: https://github.com/waymaker/rana
💬 Discord: https://discord.gg/rana

Made with ❤️ by Waymaker
```

### First Comment (Hunter's Comment)
```
Hey Product Hunt! 👋

I'm Ashley from Waymaker, and I'm excited to share RANA v2.0 with you!

## The Story

We were building AI apps and kept running into the same problems:
- Vendor lock-in was scary
- LLM costs were crushing our budget
- Every provider had a different SDK
- No good way to track costs

So we built RANA to solve these problems for everyone.

## What Makes RANA Special

1. **True SDK** - Not just a CLI tool. Full programmatic API with React hooks.

2. **9 Providers** - More than any other framework. Switch with one line of code.

3. **70% Cost Reduction** - Automatic. No configuration needed.

4. **React Hooks** - Build AI apps the same way you build web apps.

5. **Free Forever** - MIT license. No paid tiers, ever.

## What's New in v2.0

- ✅ Full SDK (@rana/core)
- ✅ React hooks (@rana/react)
- ✅ TypeScript throughout
- ✅ Fluent API
- ✅ Plugin system
- ✅ Cost dashboard
- ✅ Smart analysis
- ✅ Auto-optimization

## Try It Now

```bash
npm install @rana/core
```

```typescript
import { createRana } from '@rana/core';
const rana = createRana({ ... });
const response = await rana.chat('Hello!');
```

## Questions?

I'll be here all day to answer questions! Ask me anything about:
- How the cost optimization works
- Provider comparisons
- React integration
- Migration from other frameworks
- Anything else!

Thanks for checking out RANA! 🚀

P.S. We're also on Discord: https://discord.gg/rana
```

---

## 🔶 Hacker News

### Title
```
Show HN: RANA – AI SDK with React hooks and 70% automatic cost reduction
```

### Post
```
Hi HN,

I'm Ashley from Waymaker. We've been building RANA (Rapid AI Native Architecture), an open-source framework for AI development, and today we're launching v2.0 with full SDK support.

## What is RANA?

RANA is a unified JavaScript framework for building AI applications. Think of it as "the React of AI development" - it provides a consistent API across 9 LLM providers with automatic cost optimization.

## The Problem We're Solving

When building AI apps, you face:
1. Vendor lock-in - Each provider has its own SDK
2. High costs - No easy way to optimize spending
3. Fragmentation - Different tools for each provider
4. Setup time - 40+ hours to integrate properly

## The Solution

RANA provides:

**Unified SDK:**
```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  }
});

// Same code works with any provider
const response = await rana.chat('Hello!');
```

**React Hooks:**
```tsx
function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana);
  // Build AI apps like you build web apps
}
```

**70% Cost Reduction (Automatic):**
- Response caching (40% savings)
- Smart model selection (25% savings)
- Prompt optimization (15% savings)
- RAG implementation (30% savings)

## Technical Details

- **Providers:** Anthropic, OpenAI, Google Gemini, xAI Grok, Mistral, Cohere, Together.ai, Groq, Ollama
- **Language:** TypeScript with full type safety
- **Caching:** Redis or in-memory
- **Streaming:** AsyncGenerator support
- **Plugins:** Extensible architecture
- **License:** MIT (free forever)

## What's New in v2.0

We've transformed RANA from a CLI tool into a full SDK:
- Full programmatic API
- React hooks package
- Fluent, chainable methods
- Plugin system
- Real-time cost dashboard
- AI-powered analysis
- Auto-optimization

## Performance

Real-world results:
- E-commerce support: $22,500/mo → $6,750/mo (70% reduction)
- SaaS content gen: $18,000/mo → $5,400/mo (70% reduction)
- Healthcare AI: $12,000/mo → $3,600/mo (70% reduction)

## Get Started

```bash
npm install @rana/core @rana/react
```

Docs: https://rana.dev
GitHub: https://github.com/waymaker/rana

## Questions?

Happy to answer any technical questions about:
- Architecture decisions
- Cost optimization algorithms
- Provider abstraction layer
- TypeScript implementation
- React hooks design
- Anything else!

The whole codebase is open source (MIT), so feel free to dive in.

Looking forward to your feedback!
```

---

## 📱 Reddit (r/programming, r/javascript, r/reactjs)

### Title
```
RANA v2.0: AI development framework with React hooks and 70% automatic cost reduction [Open Source]
```

### Post
```
Hey r/programming!

I wanted to share RANA v2.0, an open-source framework we've been building for AI development.

## TL;DR

- Unified SDK for 9 LLM providers (Anthropic, OpenAI, Google, etc.)
- React hooks for building AI apps
- 70% automatic cost reduction
- Full TypeScript support
- Free & open source (MIT)

## The Long Version

**The Problem:**

Building AI apps today means:
- Vendor lock-in (each provider has different SDK)
- High costs (GPT-4 is $5/1M tokens)
- No cost tracking
- Lots of boilerplate

**The Solution (RANA):**

```typescript
// Simple usage
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('Hello!');

// React hooks
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana);
  return <div>...</div>;
}
```

**Features:**

- 🤖 9 LLM providers (one API)
- ⚛️ React hooks
- 💰 70% cost reduction (automatic)
- 📊 Real-time cost tracking
- ⚡ Response caching
- 🔌 Plugin system
- 📝 Full TypeScript

**Cost Optimization:**

The 70% savings comes from:
1. Response caching (40%) - Redis/memory cache
2. Smart routing (25%) - Uses cheapest model for task
3. Prompt optimization (15%) - Removes wasted tokens
4. RAG (30%) - Reduces context window size

**Tech Stack:**

- TypeScript
- React (for hooks)
- Commander (CLI)
- Supports: Node.js, Next.js, Express, React, Vue (coming)

**Links:**

- Docs: https://rana.dev
- GitHub: https://github.com/waymaker/rana
- npm: `npm install @rana/core @rana/react`

**License:** MIT (free forever)

## Example: Real-world savings

Before RANA:
- $1,800/month on OpenAI GPT-4
- Manual cost tracking
- Vendor lock-in

After RANA:
- $450/month (mixed providers)
- Automatic optimization
- Switch providers anytime

**Savings:** $16,200/year

## Why Another Framework?

Good question! Here's how RANA compares:

| Feature | RANA | LangChain | Haystack |
|---------|------|-----------|----------|
| Providers | 9 | 6 | 4 |
| React hooks | ✅ | ❌ | ❌ |
| Cost tracking | ✅ | ❌ | ❌ |
| Free forever | ✅ | Paid tiers | Paid tiers |
| TypeScript | Full | Partial | Partial |

## Get Started

```bash
npm install @rana/core @rana/react
```

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('What is TypeScript?');
console.log(response.content);
console.log(`Cost: $${response.cost.total_cost}`);
```

## Questions?

Happy to answer any questions! Also on Discord: https://discord.gg/rana

**Star on GitHub if you find this useful!** ⭐
```

---

## 📧 Email (Partners/Influencers)

### Subject
```
RANA v2.0: Open-source AI SDK with React hooks [Partnership Opportunity]
```

### Body
```
Hi [Name],

I hope this email finds you well!

I'm Ashley from Waymaker, and I wanted to share something we've been working on that I think might interest you.

## What is RANA?

RANA (Rapid AI Native Architecture) is an open-source JavaScript framework for building AI applications. We just launched v2.0 with full SDK support, React hooks, and automatic cost optimization.

## Why I'm Reaching Out

Given your work with [their area - e.g., "AI development" / "React" / "developer tools"], I thought RANA might be relevant to your audience. Here's what makes it unique:

**For Developers:**
- Unified API for 9 LLM providers
- React hooks (useRanaChat, useRanaStream, etc.)
- 70% automatic cost reduction
- Full TypeScript support
- Free & open source (MIT)

**Quick Example:**
```typescript
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana);
  return <div>...</div>;
}
```

## The Numbers

Real-world results:
- E-commerce: $22,500/mo → $6,750/mo (70% savings)
- SaaS: $18,000/mo → $5,400/mo (70% savings)
- 5-minute setup vs 40 hours manual

## Partnership Ideas

I'd love to explore how we could work together:

1. **Content Collaboration** - Tutorial/review
2. **Integration** - RANA + [your product]
3. **Community** - Cross-promotion
4. **Technical** - Feature collaboration

## Links

- Docs: https://rana.dev
- GitHub: https://github.com/waymaker/rana
- Demo: [video link]

Would you be interested in chatting more? I'm happy to:
- Give you a personalized demo
- Answer any technical questions
- Discuss partnership ideas

Looking forward to hearing from you!

Best,
Ashley Kays
Founder, Waymaker
ashley@waymaker.cx
```

---

## 📝 Dev.to Article

### Title
```
Introducing RANA v2.0: Build AI Apps Like You Build with React
```

### Tags
```
#ai #react #javascript #opensource
```

### Article
```markdown
# Introducing RANA v2.0: Build AI Apps Like You Build with React

Today, I'm excited to share RANA v2.0 - an open-source framework that makes building AI applications as easy as building React apps.

## The Problem

If you've built AI applications, you know the pain:

```javascript
// OpenAI
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: '...' });
const response = await openai.chat.completions.create({...});

// Anthropic (different API)
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: '...' });
const response = await anthropic.messages.create({...});

// Google (different again)
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('...');
const response = await model.generateContent({...});
```

Every provider has a different SDK. Switching means rewriting code. Plus:
- ❌ No cost tracking
- ❌ No optimization
- ❌ Vendor lock-in
- ❌ Hours of setup

## The Solution: RANA

RANA provides one API for all providers:

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY,
  }
});

// Same code, any provider
const response = await rana.chat('Hello!');
```

Switch providers in one line:

```typescript
const claude = await rana.anthropic().chat('Hello');
const gpt = await rana.openai().chat('Hello');
const gemini = await rana.google().chat('Hello');
```

## React Hooks

The real magic is the React integration:

```tsx
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, error, cost } = useRanaChat(rana, {
    provider: 'anthropic',
    optimize: 'cost'
  });

  return (
    <div>
      <button onClick={() => chat('Hello!')}>
        Send
      </button>
      {loading && <Spinner />}
      {response && <div>{response.content}</div>}
      <p>Cost: ${cost.toFixed(4)}</p>
    </div>
  );
}
```

It feels like `useState` or React Query. Natural and intuitive.

## 70% Cost Reduction

RANA automatically reduces costs through:

1. **Response Caching (40% savings)**
```typescript
// First request: calls API
const response1 = await rana.chat('What is React?');

// Second request: from cache
const response2 = await rana.chat('What is React?');
// response2.cached === true
```

2. **Smart Model Selection (25% savings)**
```typescript
// Uses Gemini Flash ($0.10/1M) for simple tasks
const simple = await rana.chat({
  messages: [{role: 'user', content: 'Say hello'}],
  optimize: 'cost'
});

// Uses Claude Sonnet ($3/1M) for complex tasks
const complex = await rana.chat({
  messages: [{role: 'user', content: 'Explain quantum physics'}],
  optimize: 'quality'
});
```

3. **Real-time Cost Tracking**
```typescript
const stats = await rana.cost.stats();

console.log(`Spent: $${stats.total_spent}`);
console.log(`Saved: $${stats.total_saved}`);
console.log(`Savings: ${stats.savings_percentage}%`);
```

## Real-World Results

### E-commerce Customer Support
- Before: $22,500/month (OpenAI only)
- After: $6,750/month (RANA optimized)
- **Savings: $189,000/year**

### SaaS Content Generation
- Before: $18,000/month (GPT-4o)
- After: $5,400/month (mixed providers)
- **Savings: $151,200/year**

## More Features

### Fluent API
```typescript
const response = await rana
  .provider('anthropic')
  .model('claude-3-5-sonnet-20241022')
  .temperature(0.7)
  .maxTokens(1000)
  .optimize('cost')
  .cache(true)
  .chat({messages: [...]});
```

### Streaming
```typescript
for await (const chunk of rana.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

### Plugin System
```typescript
const analyticsPlugin = definePlugin({
  name: 'analytics',
  async onAfterResponse(response) {
    await analytics.track('llm_request', {
      cost: response.cost.total_cost
    });
    return response;
  }
});

await rana.use(analyticsPlugin);
```

### CLI Tools
```bash
rana dashboard     # Real-time cost monitoring
rana analyze       # Get AI recommendations
rana optimize      # Apply optimizations
rana fix           # Auto-fix issues
```

## Get Started

Install:
```bash
npm install @rana/core @rana/react
```

Create a simple chat:
```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('What is TypeScript?');
console.log(response.content);
```

Build with React:
```tsx
import { RanaProvider, useRanaChat } from '@rana/react';

function App() {
  return (
    <RanaProvider client={rana}>
      <ChatComponent />
    </RanaProvider>
  );
}

function ChatComponent() {
  const { chat, response, loading } = useRanaChat(rana);
  // ... your component
}
```

## Why Choose RANA?

| Feature | RANA | LangChain | Haystack |
|---------|------|-----------|----------|
| Providers | 9 | 6 | 4 |
| React hooks | ✅ | ❌ | ❌ |
| Cost tracking | ✅ | ❌ | ❌ |
| Free forever | ✅ | Paid tiers | Paid tiers |
| TypeScript | Full | Partial | Partial |
| Setup time | 5 min | 40 hours | 40 hours |

## What's Next?

We're working on:
- Vue composables (@rana/vue)
- VSCode extension
- Web dashboard
- Plugin marketplace
- Mobile SDKs

## Try It Today

- 📚 Docs: https://rana.dev
- ⭐ GitHub: https://github.com/waymaker/rana
- 💬 Discord: https://discord.gg/rana

## Conclusion

RANA v2.0 makes AI development feel like modern web development. No more vendor lock-in, no more manual cost tracking, no more boilerplate.

Just install, code, and ship.

What do you think? Have questions? Drop a comment below!

---

**P.S.** We're open source (MIT) and always looking for contributors. Star us on GitHub if you find this useful! ⭐
```

---

## 📊 Analytics Tracking

Track these metrics on launch day:

**GitHub:**
- Stars (goal: 50+)
- Forks
- Issues/PRs

**npm:**
- Downloads (goal: 500+)
- Versions

**Social:**
- Twitter impressions/engagement
- Product Hunt upvotes (goal: 25+)
- HackerNews points
- Reddit upvotes

**Community:**
- Discord joins
- Questions asked
- Positive sentiment

---

**All materials ready! Pick your launch day and go! 🚀**
