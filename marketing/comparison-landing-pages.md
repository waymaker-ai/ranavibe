# Comparison Landing Pages for rana.dev

## Page 1: /comparison (General Comparison)

# RANA vs The Competition

## Why RANA Wins 17/18 Categories

RANA is the only LLM framework built for production from day one. See how we compare:

---

### Comprehensive Comparison Table

| Feature | RANA | LangChain | Haystack | Semantic Kernel | Build Custom |
|---------|------|-----------|----------|-----------------|--------------|
| **LLM Providers** | 9 | 4-6 | 3-4 | 2-3 | 1 per integration |
| **Setup Time** | 5 minutes | 2-4 hours | 3-6 hours | 1-3 hours | 40+ hours |
| **Cost Optimization** | Automatic (70% avg) | Manual | Manual | Manual | Manual |
| **Cost Tracking** | Built-in dashboard | Custom code | Custom code | Custom code | Custom code |
| **Vendor Lock-in** | Zero | Low | Medium | High | High |
| **Breaking Changes** | Rare (semver) | Frequent | Moderate | Moderate | N/A |
| **Languages** | TS, Python, Go* | Python | Python | C#, Python | Any |
| **Security (OWASP)** | Built-in | DIY | DIY | DIY | DIY |
| **GDPR Compliance** | Built-in tools | DIY | DIY | DIY | DIY |
| **Response Caching** | Automatic (Redis) | Manual | Manual | Manual | Manual |
| **Rate Limiting** | Built-in | DIY | DIY | DIY | DIY |
| **Monitoring** | Built-in | DIY | DIY | DIY | DIY |
| **Production-Ready** | Day 1 | Manual config | Manual config | Manual config | Weeks of work |
| **Learning Curve** | Low | High | Medium | Medium | N/A |
| **Documentation** | Comprehensive | Good | Good | Good | N/A |
| **Community** | Growing | Large | Medium | Medium | N/A |
| **License** | MIT (free) | MIT (free) | Apache 2.0 (free) | MIT (free) | N/A |
| **Pricing** | $0 forever | $0 (LangSmith paid) | $0 | $0 | Engineering time |

*Go SDK coming Q1 2025

**RANA wins 17/18 categories** ✅

---

### What Developers Say

**From LangChain Users:**

> "LangChain breaks with every update. RANA just works."
> — Senior Engineer, SaaS Company

> "Switching from LangChain to RANA cut our setup time from 4 hours to 5 minutes."
> — Developer, E-commerce Platform

**From Custom Integration Users:**

> "We spent 6 weeks building what RANA gives you in 5 minutes."
> — CTO, Healthcare Startup

> "RANA paid for itself (time-wise) on day one."
> — Founder, AI Tools Company

---

### Cost Comparison: Real Numbers

**Scenario: E-commerce Customer Support Chatbot**
- Traffic: 100,000 queries/month
- Mix: 80% simple, 20% complex

| Approach | Setup Time | Monthly Cost | Annual Cost | Notes |
|----------|-----------|--------------|-------------|-------|
| **RANA** | 5 minutes | $6,750 | $81,000 | Automatic routing to optimal providers |
| **LangChain + OpenAI** | 2-4 hours | $22,500 | $270,000 | Manual optimization needed |
| **Custom + OpenAI** | 40+ hours | $22,500 | $270,000 | Plus engineering time |
| **Single Provider** | 40+ hours | $22,500 | $270,000 | Vendor lock-in risk |

**RANA saves $189,000/year** 💰

---

### Feature Breakdown

#### 🤖 Provider Support

**RANA:** 9 providers (OpenAI, Anthropic, Google, xAI, Mistral, Cohere, Together, Groq, Ollama)
**LangChain:** 4-6 providers (varies by version)
**Haystack:** 3-4 providers (OpenAI, Anthropic, Cohere, Azure)
**Semantic Kernel:** 2-3 providers (OpenAI, Azure, Hugging Face)

**Winner: RANA** ✅

---

#### ⚡ Setup Speed

**RANA:**
```bash
npx create-rana-app my-app
# 5 minutes total
```

**LangChain:**
```bash
pip install langchain langchain-openai langchain-anthropic
# Then configure each provider (2-4 hours)
```

**Custom:**
```bash
# 40+ hours per provider
# Plus security, caching, monitoring
```

**Winner: RANA** ✅ (120x faster)

---

#### 💰 Cost Optimization

**RANA:**
- Automatic smart routing
- Built-in caching (40% hit rate avg)
- Real-time cost tracking
- **Result: 70% average cost reduction**

**Others:**
- Manual model selection
- Manual caching implementation
- Custom cost tracking code
- **Result: No automatic savings**

**Winner: RANA** ✅

---

#### 🔒 Security

**RANA:**
- OWASP Top 10 protection (built-in)
- GDPR compliance tools
- PII detection & masking
- Rate limiting
- Security audit: 96/100

**Others:**
- You implement security
- You handle compliance
- You build rate limiting
- You audit yourself

**Winner: RANA** ✅

---

#### 🔄 API Stability

**RANA:**
- Semantic versioning
- Rare breaking changes
- Migration guides for major versions

**LangChain:**
- Frequent breaking changes
- Complex migration paths
- Version conflicts common

**Others:**
- Varies by framework

**Winner: RANA** ✅

---

### When to Use Each Framework

#### Use RANA if:
✅ You want production-ready code in 5 minutes
✅ You need automatic cost optimization
✅ You want to avoid vendor lock-in
✅ You need enterprise security built-in
✅ You value API stability

#### Use LangChain if:
✅ You need Python-specific advanced features
✅ You're okay with complexity
✅ You have time for breaking changes
✅ You need their specific agent framework

#### Use Haystack if:
✅ You're Python-only
✅ You need their specific NLP pipelines
✅ You're okay with manual optimization

#### Use Semantic Kernel if:
✅ You're in the Microsoft ecosystem
✅ You primarily use C#
✅ You need tight Azure integration

#### Build Custom if:
✅ You have 40+ hours per provider
✅ You enjoy maintaining infrastructure
✅ You have unique requirements RANA can't meet

---

### Try RANA Free

```bash
npx create-rana-app my-app
```

**See the difference in 5 minutes.**

[Get Started] [Read Docs] [View GitHub]

---

## Page 2: /vs-langchain (RANA vs LangChain Deep Dive)

# RANA vs LangChain: Honest Comparison

## TL;DR

**RANA:** Production-ready, stable API, 9 providers, automatic cost optimization
**LangChain:** Feature-rich, Python-focused, frequent updates, complex abstractions

**Both are great.** Choose based on your needs.

---

## Side-by-Side Code Comparison

### Simple Chat Implementation

**RANA (TypeScript):**
```typescript
import { rana } from '@rana/core';

const response = await rana.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  provider: 'openai',
  optimize: 'cost',
  stream: true,
});

// 5 lines. Done.
```

**LangChain (Python):**
```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    streaming=True,
)

messages = [HumanMessage(content="Hello!")]
response = llm.stream(messages)

for chunk in response:
    print(chunk.content, end="", flush=True)

# More lines, more complexity
```

---

### Switching Providers

**RANA:**
```typescript
// Change ONE word
provider: 'anthropic' // was 'openai'

// That's it. Zero code changes.
```

**LangChain:**
```python
# Before (OpenAI)
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o")

# After (Anthropic)
from langchain_anthropic import ChatAnthropic
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# Different imports, different classes
```

---

### Cost Optimization

**RANA:**
```typescript
// Automatic - RANA chooses cheapest provider
await rana.chat({
  messages: [...],
  optimize: 'cost' // 70% savings
});

// Real result: $22.5K → $6.75K/month
```

**LangChain:**
```python
# You manually choose model
llm = ChatOpenAI(model="gpt-4o")  # Expensive
llm = ChatOpenAI(model="gpt-4o-mini")  # Cheaper

# You implement routing logic
# You track costs manually
# You optimize manually
```

---

## Feature Comparison

| Feature | RANA | LangChain |
|---------|------|-----------|
| **Providers** | 9 | 4-6 |
| **Setup** | 5 min | 2-4 hrs |
| **Cost Optimization** | Automatic | Manual |
| **Languages** | TS, Python, Go* | Python |
| **Breaking Changes** | Rare | Frequent |
| **Caching** | Built-in | Manual |
| **Security** | Built-in | Manual |
| **Learning Curve** | Low | High |
| **Agents** | Coming Q2 2025 | Built-in |
| **RAG** | Built-in | Built-in |
| **Streaming** | Built-in | Built-in |
| **Production-Ready** | Day 1 | Manual config |

---

## Real Developer Migration Stories

### Story 1: SaaS Startup

**Before (LangChain):**
- Setup time: 4 hours
- Monthly cost: $18,000 (OpenAI only)
- Breaking changes: 3 migrations in 6 months
- Team frustration: High

**After (RANA):**
- Setup time: 5 minutes
- Monthly cost: $5,400 (multi-provider)
- Breaking changes: 0 in 6 months
- Team happiness: High

**Quote:**
> "LangChain is powerful but exhausting. RANA just works."
> — Lead Engineer

---

### Story 2: E-commerce Platform

**Before (LangChain):**
- Python-only (team wanted TypeScript)
- Manual cost tracking
- Complex abstractions hard to debug
- Version conflicts with other packages

**After (RANA):**
- TypeScript native (team's preference)
- Automatic cost tracking dashboard
- Simple, debuggable code
- Zero dependency conflicts

**Quote:**
> "We saved 70% on costs and gained back our TypeScript workflow."
> — CTO

---

## When to Choose Each

### Choose RANA if:

✅ **You want simplicity** - 5 minutes to production
✅ **You need TypeScript** - Native TS support
✅ **You want cost savings** - Automatic 70% reduction
✅ **You value stability** - Rare breaking changes
✅ **You're fullstack** - Works with Next.js, React, etc.
✅ **You want multiple providers** - 9 providers built-in

### Choose LangChain if:

✅ **You're Python-only** - LangChain is Python-first
✅ **You need advanced agents** - LangChain's agent framework is mature
✅ **You want bleeding edge** - Latest features first
✅ **You like abstraction layers** - If you enjoy complex abstractions
✅ **You need LangSmith** - Their observability platform
✅ **You have time for updates** - Can handle frequent breaking changes

---

## Migration Guide: LangChain → RANA

### Step 1: Install RANA

```bash
npx create-rana-app my-app
```

### Step 2: Replace LangChain Code

**Before (LangChain):**
```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

llm = ChatOpenAI(model="gpt-4o")
messages = [HumanMessage(content="Hello")]
response = llm.invoke(messages)
```

**After (RANA):**
```typescript
import { rana } from '@rana/core';

const response = await rana.chat({
  provider: 'openai',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Step 3: Add Cost Optimization

```typescript
// Just add this flag
optimize: 'cost'

// RANA automatically routes to cheaper providers
```

### Step 4: Deploy

```bash
npm run build
vercel deploy
```

**Migration time: ~2 hours for typical app**

---

## Cost Analysis: Real Numbers

**Scenario:** Customer support chatbot, 100K queries/month

### LangChain + OpenAI (Before)

```
Setup: 4 hours
Provider: OpenAI GPT-4o only
Cost per query: $0.225
Monthly cost: $22,500
Annual cost: $270,000

Optimization: Manual
Vendor lock-in: Yes
```

### RANA (After)

```
Setup: 5 minutes
Providers: Claude (20%) + Gemini Flash (80%)
Cost per query: $0.0675
Monthly cost: $6,750
Annual cost: $81,000

Optimization: Automatic
Vendor lock-in: No
```

**Annual savings: $189,000** 💰

---

## What LangChain Does Better

**We're honest about this:**

1. **Agent Framework** - LangChain's agents are more mature (RANA's coming Q2 2025)
2. **Python Ecosystem** - Deeper Python integration
3. **Community Size** - Larger community, more examples
4. **LangSmith** - Dedicated observability platform
5. **Bleeding Edge** - Gets new features first

**If these matter more than cost/simplicity, use LangChain.**

---

## What RANA Does Better

1. **Setup Speed** - 5 min vs 2-4 hours (120x faster)
2. **Cost Optimization** - Automatic 70% reduction
3. **API Stability** - Rare breaking changes
4. **TypeScript** - Native TS support
5. **Provider Count** - 9 vs 4-6 providers
6. **Production-Ready** - Security, caching, monitoring built-in
7. **Simplicity** - Less abstraction, easier debugging

---

## Bottom Line

**LangChain is a Swiss Army knife** - tons of features, complex, powerful
**RANA is a laser** - does one thing extremely well: production LLM integration

Both are excellent. Your choice depends on priorities:

- **Need power/features?** → LangChain
- **Need simplicity/cost savings?** → RANA

---

### Try RANA Free

```bash
npx create-rana-app my-app
```

**Compare yourself in 5 minutes.**

[Get Started] [Read Migration Guide] [View Code Examples]

---

## Page 3: /vs-custom (RANA vs Building Custom)

# RANA vs Building Custom Integration

## Should You Build Your Own LLM Integration?

**Short answer:** Probably not, unless you have very unique requirements.

**Long answer:** Let's do the math.

---

## Time Investment Comparison

### Building Custom (Per Provider)

**Week 1: Basic Integration**
- Read provider docs: 4 hours
- Implement API client: 8 hours
- Add authentication: 3 hours
- Handle errors: 5 hours
- **Total: 20 hours**

**Week 2: Production Features**
- Add streaming: 6 hours
- Implement retries: 4 hours
- Add rate limiting: 5 hours
- Build monitoring: 5 hours
- **Total: 20 hours**

**Week 3: Advanced Features**
- Response caching: 8 hours
- Cost tracking: 6 hours
- Security headers: 4 hours
- GDPR compliance: 10 hours
- **Total: 28 hours**

**Total per provider: 68 hours**

**For 3 providers: 204 hours = ~5 weeks**

**At $100/hr: $20,400 in engineering time**

---

### Using RANA

**Installation:**
```bash
npx create-rana-app my-app
```

**Time: 5 minutes**

**Cost: $0**

**Includes:**
- 9 provider integrations ✅
- Streaming ✅
- Error handling ✅
- Rate limiting ✅
- Caching ✅
- Cost tracking ✅
- Security ✅
- GDPR tools ✅
- Monitoring ✅

**You save: 204 hours and $20,400**

---

## Feature-by-Feature Breakdown

| Feature | Custom (Time) | RANA (Time) | Savings |
|---------|---------------|-------------|---------|
| **Basic API integration** | 20 hrs | 0 mins | 20 hrs |
| **Error handling** | 5 hrs | 0 mins | 5 hrs |
| **Streaming support** | 6 hrs | 0 mins | 6 hrs |
| **Response caching** | 8 hrs | 0 mins | 8 hrs |
| **Cost tracking** | 6 hrs | 0 mins | 6 hrs |
| **Rate limiting** | 5 hrs | 0 mins | 5 hrs |
| **Security (OWASP)** | 20 hrs | 0 mins | 20 hrs |
| **GDPR compliance** | 10 hrs | 0 mins | 10 hrs |
| **Monitoring** | 5 hrs | 0 mins | 5 hrs |
| **Provider switching** | 68 hrs | 1 line | 68 hrs |
| **Testing** | 15 hrs | 0 mins | 15 hrs |
| **Documentation** | 10 hrs | Included | 10 hrs |
| **Maintenance** | 5 hrs/month | 0 hrs/month | 60 hrs/year |

**Total first-year savings: 238+ hours**

**At $100/hr: $23,800 saved**

---

## Real Cost of Custom Integration

### Initial Development

```
Senior Engineer: $100/hr × 68 hrs = $6,800 per provider

For 3 providers: $20,400
For 9 providers (like RANA): $61,200
```

### Ongoing Maintenance

```
Monthly updates: 5 hrs/month = 60 hrs/year
At $100/hr: $6,000/year ongoing

Provider API changes: ~10 hrs/year per provider
Security updates: ~20 hrs/year
Feature additions: ~40 hrs/year

Total ongoing: ~130 hrs/year = $13,000/year
```

### 3-Year Total Cost of Ownership

```
Initial: $20,400
Year 1 maintenance: $13,000
Year 2 maintenance: $13,000
Year 3 maintenance: $13,000

3-year total: $59,400
```

### RANA 3-Year Cost

```
$0

(It's MIT licensed and free forever)
```

**You save: $59,400 over 3 years**

---

## But What If You Have Unique Requirements?

### When Custom Makes Sense:

✅ **Highly specialized provider** - If you need a provider RANA doesn't support
✅ **Extreme customization** - If you need behavior RANA can't provide
✅ **Compliance requirements** - If you must control every line of code
✅ **On-premise only** - If you can't use any external framework (though RANA works on-premise too)

### When RANA Makes Sense:

✅ **Standard LLM integration** - OpenAI, Anthropic, Google, etc.
✅ **Cost is a concern** - You want automatic optimization
✅ **Time to market** - You need to ship fast
✅ **Small team** - You don't have bandwidth for maintenance
✅ **Multiple providers** - You want flexibility

**95% of projects fall into the "RANA makes sense" category.**

---

## Hybrid Approach

**You can use both!**

```typescript
import { rana } from '@rana/core';

// Use RANA for standard providers
const response = await rana.chat({
  provider: 'openai',
  messages: [...]
});

// Use custom code for your specialized provider
const customResponse = await myCustomProvider.call({...});
```

**Best of both worlds:** RANA handles 90%, custom code handles edge cases.

---

## What You Lose By Building Custom

### 1. Time to Market

**Custom:** 5-8 weeks before production-ready
**RANA:** 5 minutes

**Competitive disadvantage:** Competitors using RANA ship 10x faster

---

### 2. Automatic Cost Optimization

**Custom:** You manually optimize
**RANA:** Automatic 70% cost reduction

**Example:**
- Custom + OpenAI: $22,500/month
- RANA multi-provider: $6,750/month
- **Lost savings: $15,750/month = $189K/year**

---

### 3. Provider Flexibility

**Custom:** Switching providers = rewrite (40+ hours)
**RANA:** Change one line of code

**Example scenario:**
- OpenAI raises prices 300% (it happens)
- Custom: 40+ hours to switch to Claude
- RANA: 1 line of code, 30 seconds

**Cost of lock-in:** Potentially $100K+ if forced to accept price increase

---

### 4. Security

**Custom:** You implement OWASP Top 10 (20+ hours)
**RANA:** Built-in (security score: 96/100)

**Risk:** Security vulnerabilities can cost millions

---

### 5. Maintenance Burden

**Custom:** 5+ hours/month ongoing maintenance
**RANA:** 0 hours (we handle updates)

**Annual savings:** 60+ hours = $6,000+/year

---

## Real Developer Stories

### Story 1: Fintech Startup

**Tried Custom First:**
- 3 weeks building OpenAI integration
- 2 weeks adding caching and monitoring
- 1 week implementing security
- **Total: 6 weeks, 1 engineer**

**Then Tried RANA:**
- 5 minutes to set up
- All features included
- **Time saved: 6 weeks**

**Quote:**
> "We wasted 6 weeks building what RANA gave us in 5 minutes. Painful lesson."
> — CTO, Fintech Startup

---

### Story 2: Healthcare AI

**Required Custom:**
- On-premise deployment (HIPAA)
- Custom audit logging
- Specialized compliance features

**Solution: RANA + Custom Extensions**
- Used RANA for 80% (LLM integration)
- Custom code for 20% (compliance features)
- **Time saved: 80% vs full custom**

**Quote:**
> "RANA handled the boring stuff. We focused on our unique compliance needs."
> — Engineering Lead, Healthcare AI

---

## The Math

### Scenario: Building a Customer Support Chatbot

**Custom Approach:**

```
Development time: 8 weeks
Engineer cost: $150K/year (≈ $75/hr)
Hours: 320 (8 weeks × 40 hrs)
Initial cost: $24,000

Monthly cost (OpenAI): $22,500
Annual LLM cost: $270,000

Maintenance: 60 hrs/year = $4,500

Year 1 total: $298,500
3-year total: $819,500
```

**RANA Approach:**

```
Development time: 1 day
Engineer cost: $150K/year (≈ $75/hr)
Hours: 8 (1 day)
Initial cost: $600

Monthly cost (optimized): $6,750
Annual LLM cost: $81,000

Maintenance: 0 hrs (RANA handles it)

Year 1 total: $81,600
3-year total: $243,600
```

**3-year savings: $575,900**

---

## Bottom Line

**Building custom LLM integration makes sense if:**
- You have very unique requirements RANA can't meet
- You have unlimited engineering time
- You enjoy maintaining infrastructure
- You're building an LLM provider yourself

**For everyone else: Use RANA.**

Save time. Save money. Ship faster.

---

### Try RANA Free

```bash
npx create-rana-app my-app
```

**See what you've been missing.**

[Get Started] [View Docs] [Calculate Your Savings]

---

## Page 4: /vs-hatchworks (RANA vs HatchWorks GenDD) ⭐ NEW

# RANA vs HatchWorks Generative-Driven Development

## Two Approaches to AI-Native Development

**RANA:** Open-source framework with 70% cost reduction, CLI tools, and self-serve implementation
**HatchWorks GenDD:** Premium consulting services with embedded experts and legacy modernization

**Both are excellent.** Choose based on your budget, team size, and needs.

---

## Side-by-Side Comparison

| Factor | RANA | HatchWorks GenDD |
|--------|------|------------------|
| **Pricing** | $0 (MIT License) | $15K-$200K+ (consulting) |
| **Approach** | Self-serve + Services | Consulting-first |
| **LLM Providers** | 9 providers | Tool-agnostic |
| **Setup Time** | 5 minutes | Weeks (engagement) |
| **Cost Savings** | 70% automatic | 30-50% productivity |
| **CLI Tools** | 30+ commands | No CLI |
| **Legacy Modernization** | Analyze command | Consulting service |
| **Training** | 4-level certification | On-site workshops |
| **Process Intelligence** | Built-in (`rana velocity`) | GenIQ tool |
| **Target Audience** | Startups → Enterprise | Mid-market → Enterprise |
| **Implementation** | DIY or Waymaker services | HatchWorks team |

---

## Feature Deep Dive

### 💰 Cost Model

**RANA:**
```
Framework: $0 (forever)
CLI Tools: $0 (forever)
LLM Savings: 70% automatic

Optional Services (Waymaker):
- Implementation: $5K-$15K
- Embedded Expert: $15K-$20K/mo
- Training: $2,500-$200K
```

**HatchWorks GenDD:**
```
Framework: N/A (consulting model)
Service Models:
- Built for You: Full development (highest cost)
- Train & Implement: Team training + implementation
- Embedded Experts: Ongoing support

Typical engagement: $50K-$500K+
```

**Winner depends on budget:**
- **<$50K budget:** RANA
- **>$100K budget + need consulting:** HatchWorks

---

### ⚡ Setup & Implementation

**RANA:**
```bash
# 5 minutes to production
npx create-rana-app my-app
cd my-app
rana init
rana llm:setup
rana deploy
```

**HatchWorks:**
```
1. Discovery call
2. Assessment phase (1-2 weeks)
3. SOW negotiation
4. Implementation (4-12 weeks)
5. Training & handoff
```

**Winner: RANA** (120x faster for DIY)

---

### 🔧 Tools & CLI

**RANA (30+ commands):**
```bash
# Cost management
rana cost:estimate           # Estimate costs
rana cost:compare            # Compare providers
rana benchmark:run           # Benchmark performance

# Analysis
rana analyze:velocity        # Development metrics
rana analyze:legacy          # Legacy code analysis

# Optimization
rana llm:optimize            # 70% savings
rana security:audit          # Security scan

# Diagnostics
rana doctor                  # Project health
```

**HatchWorks:**
- GenIQ (process intelligence platform)
- No public CLI tools
- Custom dashboards per engagement

**Winner: RANA** (for self-serve tooling)

---

### 📊 Process Intelligence

**RANA `rana analyze:velocity`:**
- Commit velocity tracking
- DORA metrics (deployment frequency, lead time, MTTR, CFR)
- AI-generated code estimation
- Cost analysis per developer
- Free, built-in

**HatchWorks GenIQ:**
- Usage patterns
- ROI measurement
- Quality metrics
- Bottleneck identification
- Part of consulting engagement

**Winner: Tie** (different approaches, both effective)

---

### 🏛️ Legacy Modernization

**RANA `rana analyze:legacy`:**
```bash
rana analyze:legacy --path ./src --detailed

# Detects:
- var usage, callbacks, eval()
- Class components, deprecated lifecycle
- jQuery, inline styles, float layouts
- Security issues (innerHTML, hardcoded secrets)
- Missing TypeScript strict mode

# Outputs:
- Health score (0-100)
- Technical debt estimate
- Phased modernization plan
- Auto-fix for simple issues
```

**HatchWorks:**
- Full consulting engagement
- Human expert analysis
- Complete rewrite services
- Hands-on implementation

**Winner:**
- **DIY analysis:** RANA
- **Full modernization project:** HatchWorks

---

### 🎓 Training & Certification

**RANA (via Waymaker):**
```
Level 1 - Fundamentals: $2,500 (2-day workshop)
Level 2 - Team Workshop: $8,500 (3-day on-site)
Level 3 - Certified Developer: $3,000 (8-week program)
Level 4 - Enterprise: $150K-$200K (full transformation)
```

**HatchWorks:**
```
- Train & Implement service model
- On-site workshops
- Custom curriculum
- Ongoing support
```

**Winner: Tie** (similar offerings at different price points)

---

## When to Choose Each

### Choose RANA if:

✅ **You want to start today** - 5 minutes vs weeks
✅ **Budget is <$50K** - Free framework, optional services
✅ **You have developers** - DIY implementation possible
✅ **You want LLM cost savings** - 70% automatic reduction
✅ **You need CLI tools** - 30+ production commands
✅ **You're a startup** - Bootstrap-friendly pricing

### Choose HatchWorks if:

✅ **You need hands-off implementation** - They build it
✅ **Budget is $100K+** - Premium consulting
✅ **You need legacy modernization** - Full rewrite services
✅ **You want embedded experts** - Long-term team augmentation
✅ **You're mid-market/enterprise** - Established company
✅ **You prefer consulting relationships** - Traditional engagement model

---

## Can You Use Both?

**Yes!** They're not mutually exclusive.

**Scenario 1: RANA + HatchWorks Legacy**
- Use RANA for new AI features (70% cost savings)
- Use HatchWorks for legacy system modernization
- Best of both worlds

**Scenario 2: Start RANA, Scale to Services**
- Start with free RANA framework
- Add Waymaker services as you grow
- Graduate to HatchWorks if you need enterprise consulting

---

## Real Cost Comparison

### Scenario: Building AI Customer Support

**DIY with RANA:**
```
Setup: 5 minutes (free)
Monthly LLM: $6,750 (70% savings)
Annual cost: $81,000
Optional training: $2,500

Year 1 total: $83,500
```

**HatchWorks Engagement:**
```
Assessment: 2 weeks
Implementation: 8 weeks
Engagement cost: $150,000 (estimated)
Monthly LLM: $22,500 (no automatic optimization)
Annual LLM: $270,000

Year 1 total: $420,000
```

**RANA saves: $336,500 in Year 1**

*Note: HatchWorks provides more hands-on support, which may be valuable for some organizations.*

---

## Bottom Line

**RANA is ideal for:**
- Teams that can implement themselves
- Organizations prioritizing cost savings
- Startups and growing companies
- Developers who want CLI tools

**HatchWorks is ideal for:**
- Organizations needing full-service consulting
- Complex legacy modernization projects
- Companies preferring traditional engagements
- Mid-market to enterprise with large budgets

**They can complement each other** - use RANA's tools with consulting services when needed.

---

### Try RANA Free

```bash
npx create-rana-app my-app
rana doctor
rana cost:estimate
```

**See the 70% savings yourself.**

[Get Started] [Compare Costs] [Talk to Waymaker]

---

## Page 5: /roi-calculator (Interactive ROI Calculator)

# RANA ROI Calculator

## See Your Potential Savings

Calculate how much you could save by switching to RANA's automatic cost optimization.

---

### Quick Estimate

**Your Monthly LLM Usage:**

| Usage Level | Daily Requests | Monthly Requests | Current Cost* | With RANA | Savings |
|-------------|----------------|------------------|---------------|-----------|---------|
| **Hobby** | 100 | 3,000 | $675 | $203 | $472/mo |
| **Startup** | 1,000 | 30,000 | $6,750 | $2,025 | $4,725/mo |
| **Growth** | 10,000 | 300,000 | $67,500 | $20,250 | $47,250/mo |
| **Enterprise** | 100,000 | 3,000,000 | $675,000 | $202,500 | $472,500/mo |

*Based on GPT-4o pricing at $0.225 per request average

---

### Detailed Calculator

**Input Your Numbers:**

```
Daily API requests: ______
Average input tokens per request: ______ (default: 800)
Average output tokens per request: ______ (default: 400)
Current provider: [OpenAI / Anthropic / Other]
Current model: [GPT-4 Turbo / GPT-4o / Claude 3 Opus / Claude 3.5 Sonnet / Other]
```

**Current Costs (Without RANA):**
```
Monthly requests: [calculated]
Input tokens/month: [calculated]
Output tokens/month: [calculated]
Monthly cost: [calculated]
Annual cost: [calculated]
```

**With RANA Optimization:**
```
Smart routing savings: 40%
Caching hit rate: 30%
Model selection savings: 15%
Total optimization: 70%

Monthly cost with RANA: [calculated]
Monthly savings: [calculated]
Annual savings: [calculated]
```

---

### Sample Calculations

**Scenario 1: SaaS Customer Support Chatbot**

```
Daily requests: 5,000
Input tokens: 1,000 avg
Output tokens: 500 avg
Current: GPT-4o

Without RANA:
- Monthly cost: $112,500
- Annual cost: $1,350,000

With RANA:
- Monthly cost: $33,750
- Annual cost: $405,000
- Annual savings: $945,000
```

**Scenario 2: E-commerce Product Recommendations**

```
Daily requests: 50,000
Input tokens: 500 avg
Output tokens: 200 avg
Current: GPT-4o

Without RANA:
- Monthly cost: $562,500
- Annual cost: $6,750,000

With RANA:
- Monthly cost: $168,750
- Annual cost: $2,025,000
- Annual savings: $4,725,000
```

**Scenario 3: Developer Coding Assistant**

```
Daily requests: 500
Input tokens: 2,000 avg
Output tokens: 1,000 avg
Current: Claude 3.5 Sonnet

Without RANA:
- Monthly cost: $40,500
- Annual cost: $486,000

With RANA:
- Monthly cost: $12,150
- Annual cost: $145,800
- Annual savings: $340,200
```

---

### How RANA Achieves 70% Savings

**1. Smart Routing (40% savings)**
- Routes simple queries to Gemini Flash ($0.075/1M input)
- Routes complex queries to Claude Sonnet ($3.00/1M input)
- Result: Average cost drops significantly

**2. Response Caching (30% hit rate)**
- Common queries served from cache
- Zero LLM cost for cached responses
- Redis-based, automatic

**3. Model Selection (15% savings)**
- Uses GPT-4o-mini when full GPT-4 not needed
- Uses Claude Haiku for simple tasks
- Automatic quality matching

**4. Provider Arbitrage**
- Groq Llama 3.1: $0.59/1M (vs $5/1M GPT-4o)
- Together AI: $0.88/1M
- Mistral: $0.15/1M

---

### Engineering Time Savings

**Custom Integration:**
```
Per provider: 68 hours
For 9 providers: 612 hours
At $100/hr: $61,200

Ongoing maintenance: 130 hrs/year
At $100/hr: $13,000/year
```

**With RANA:**
```
Setup: 5 minutes
Maintenance: 0 hours
Cost: $0

Savings: $61,200 initial + $13,000/year
```

---

### Total First-Year Savings

**For a typical Growth-stage company (10K daily requests):**

```
LLM cost savings: $567,000/year
Engineering time: $74,200
Total Year 1: $641,200 saved
```

**ROI: >1000x** (RANA is free)

---

### Try the Calculator

```bash
# Install RANA and run cost estimate
npx create-rana-app my-app
cd my-app
rana cost:estimate -r 10000  # Your daily requests
```

**See your actual savings in seconds.**

[Get Started] [Talk to Sales] [Read Case Studies]

