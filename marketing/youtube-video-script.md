# YouTube Video Script: RANA Demo

**Title:** "RANA: Build Production AI Apps in 5 Minutes (9 LLM Providers, 70% Cost Cut)"

**Length:** 5 minutes

**Description:**
```
RANA (Rapid AI Native Architecture) is an open-source framework that makes building AI applications as easy as React made building UIs.

In this 5-minute demo, I'll show you:
✅ How to set up RANA in 5 minutes
✅ How to switch LLM providers in ONE line
✅ How automatic cost optimization works (70% savings)
✅ Real production cost comparisons

🔗 Links:
- Try RANA: https://rana.dev
- GitHub: https://github.com/waymaker/rana
- Documentation: https://rana.dev/docs
- Whitepaper: https://rana.dev/whitepaper
- Discord: https://discord.gg/rana

🎯 Timestamps:
0:00 - The AI integration problem
0:45 - What is RANA?
1:30 - 5-minute setup demo
3:00 - Cost optimization explained
4:00 - Real production results
4:45 - Get started

💰 Cost Savings Case Studies:
- E-commerce: $22.5K → $6.75K/month (70% cut)
- SaaS: $18K → $5.4K/month
- Healthcare: $12K → $3.6K/month

🔧 Tech Stack:
- Next.js, TypeScript, Supabase
- Works with: React, Vue, Express, FastAPI, etc.
- 9 LLM Providers supported

📚 Learn More:
- RANA vs LangChain: https://rana.dev/comparison
- Security Guide: https://rana.dev/security
- Cost Optimization Guide: https://rana.dev/optimization

🐟 RANA is named after my son and made with love to help developers succeed faster.

#AI #OpenSource #LLM #WebDevelopment #Tutorial
```

---

## Video Script

### [0:00-0:45] THE PROBLEM

**[SCREEN: Title slide "RANA: Production AI Apps in 5 Minutes"]**

**[TALKING HEAD]**

"Hey everyone! I'm Ashley, and I need to show you something that's going to save you weeks of work and thousands of dollars.

Here's the problem: You want to build an AI app. You choose OpenAI. You spend 40 hours integrating their API. Everything works great.

Then OpenAI raises prices 300%.

Now what? You're locked in. Switching to Anthropic or Google means rewriting everything. Another 40 hours. Your client is frustrated. Your timeline is blown.

I've lived this nightmare 5 times while building AI apps for clients.

So my co-founder Christian and I built RANA."

---

### [0:45-1:30] WHAT IS RANA?

**[SCREEN: Animation showing one API connecting to 9 providers]**

"RANA stands for Rapid AI Native Architecture.

It's a framework that gives you ONE API for NINE LLM providers.

OpenAI, Anthropic, Google, xAI, Mistral, Cohere, Together, Groq, and Ollama.

Want to switch from OpenAI to Claude? Change ONE line of code.

Want to use the cheapest provider for each task? RANA does it automatically.

And here's the best part: It's MIT licensed. Free forever.

Let me show you how it works."

---

### [1:30-3:00] 5-MINUTE SETUP DEMO

**[SCREEN: Terminal]**

"Setting up RANA takes 5 minutes. I'll prove it.

Step 1: Install."

```bash
npx create-rana-app my-ai-app
cd my-ai-app
```

**[SCREEN: Shows installation running]**

"30 seconds. Done.

Step 2: Add your API keys."

```bash
cp .env.example .env.local
```

**[SCREEN: Opens .env.local in VS Code]**

"Paste your OpenAI key, Anthropic key, Google key - whatever you have. You don't need all 9. Even one works.

I'll add OpenAI and Anthropic."

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

"60 seconds.

Step 3: Run it."

```bash
npm run dev
```

**[SCREEN: Shows server starting]**

"30 seconds.

Now let's open it."

**[SCREEN: Browser opens to localhost:3000]**

"Look at that. A working AI chat app. In 3 minutes.

Let me show you the code."

**[SCREEN: VS Code showing app code]**

```typescript
import { rana } from '@rana/core';

const response = await rana.chat({
  messages: [{ role: 'user', content: userMessage }],
  provider: 'openai',
  stream: true,
});
```

"That's it. 5 lines of code.

Now watch this. I want to switch to Anthropic."

**[SCREEN: Changes 'openai' to 'anthropic']**

```typescript
provider: 'anthropic',
```

"I changed ONE word. Let's test it."

**[SCREEN: Refreshes browser, sends message]**

"Now I'm using Claude instead of GPT-4. Zero code changes needed.

That's the power of RANA."

---

### [3:00-4:00] COST OPTIMIZATION

**[SCREEN: Cost comparison dashboard]**

"Here's where it gets really good: cost optimization.

Let me show you a real example from production."

**[SCREEN: Shows e-commerce case study]**

"This e-commerce company was spending $22,500 a month on OpenAI.

They switched to RANA and changed one setting:"

```typescript
optimize: 'cost'
```

**[SCREEN: Shows code with optimize flag]**

"RANA analyzed their queries. 80% were simple customer support questions.

RANA automatically routed those to Gemini Flash - 50x cheaper than GPT-4.

The complex 20%? Still went to GPT-4.

New monthly cost: $6,750.

They saved $15,750 per month. That's $189,000 per year.

Same quality. 70% less cost."

**[SCREEN: Shows savings graph]**

---

### [4:00-4:45] REAL RESULTS

**[TALKING HEAD]**

"We've deployed RANA in production for 5 companies.

Results across all of them:

E-commerce: $189K saved per year
SaaS: $151K saved per year
Healthcare: $100K saved per year

Combined: $441,000 in annual savings.

And setup? 5 minutes instead of 40+ hours.

That's a 120x speed improvement."

**[SCREEN: Shows GitHub repo with stars]**

"RANA is open source. MIT licensed. Free forever.

We're not trying to make money from the framework.

We want it to become the standard - like React for UIs."

---

### [4:45-5:00] GET STARTED

**[TALKING HEAD]**

"If you're building AI applications, try RANA.

It'll save you time. It'll save you money. And you'll never be locked into one provider again."

**[SCREEN: Shows rana.dev homepage]**

"Head to rana.dev to get started.

Full documentation, tutorials, case studies - all there.

Questions? Join our Discord. Link in the description.

I'm Ashley, this is RANA."

**[SCREEN: End card]**

"Made with love to help you succeed faster. 🐟

Star us on GitHub if this helped you!"

**[END]**
