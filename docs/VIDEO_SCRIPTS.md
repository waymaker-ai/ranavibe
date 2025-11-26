# RANA Video Scripts

## Overview

This document contains scripts for RANA training videos, tutorials, and marketing content.

---

## Series 1: "5 Minutes with RANA"

Quick tutorial videos for developers getting started.

---

### Episode 1: Getting Started with RANA

**Duration:** 5 minutes
**Target Audience:** Developers new to RANA
**Goal:** First successful API call

---

**[INTRO - 0:00-0:30]**

[Screen: RANA logo animation]

**Host:** "Hey everyone! Welcome to 5 Minutes with RANA. I'm Ashley, and today we're going to go from zero to your first AI-powered API call in under 5 minutes."

[Screen: Terminal window]

**Host:** "No fluff, no filler - let's dive straight in."

---

**[INSTALLATION - 0:30-1:30]**

**Host:** "First, let's create a new RANA project."

[Type command]
```bash
npx create-rana-app my-ai-app
```

**Host:** "This command does everything - sets up your project structure, installs dependencies, and creates your configuration files."

[Wait for installation to complete]

**Host:** "Done! Now let's navigate into our project."

```bash
cd my-ai-app
```

**Host:** "Let's run the doctor command to make sure everything is set up correctly."

```bash
rana doctor
```

**Host:** "Green checks across the board. Perfect."

---

**[CONFIGURATION - 1:30-2:30]**

**Host:** "Now we need to add an LLM provider. RANA supports 9 providers, but let's start with OpenAI."

[Open .env file]

**Host:** "In your .env file, add your OpenAI API key."

```
OPENAI_API_KEY=sk-proj-your-key-here
```

**Host:** "Or if you want an interactive setup, run:"

```bash
rana llm:setup
```

**Host:** "This wizard walks you through adding any provider."

---

**[FIRST API CALL - 2:30-4:00]**

**Host:** "Now for the magic. Let's make our first API call."

[Open code editor with example file]

```typescript
import { rana } from '@rana/core';

async function main() {
  const response = await rana.chat({
    provider: 'openai',
    messages: [
      { role: 'user', content: 'What is RANA?' }
    ]
  });

  console.log(response.content);
}

main();
```

**Host:** "That's it. Four lines of code to call any LLM."

[Run the code]

**Host:** "And there's our response. Beautiful."

---

**[SWITCHING PROVIDERS - 4:00-4:30]**

**Host:** "But here's where RANA shines. Want to switch to Claude? Change one word."

```typescript
provider: 'anthropic'  // was 'openai'
```

**Host:** "No code changes. No different SDK. Just swap the provider name."

---

**[OUTRO - 4:30-5:00]**

**Host:** "That's it! In under 5 minutes, you've:
- Created a RANA project
- Connected a provider
- Made your first AI call
- Learned how to switch providers

Next video, we'll cover cost optimization - how to save 70% on your LLM bills.

Hit subscribe so you don't miss it. Thanks for watching!"

[Screen: RANA logo, links to docs and GitHub]

---

### Episode 2: Save 70% on LLM Costs

**Duration:** 5 minutes
**Target Audience:** Developers using LLMs in production
**Goal:** Enable cost optimization features

---

**[INTRO - 0:00-0:30]**

[Screen: Cost comparison graphic - $22,500 vs $6,750]

**Host:** "What if I told you that you're probably overpaying for AI by 70%?"

[Screen: Terminal]

**Host:** "I'm Ashley, and in this episode, I'll show you exactly how to cut your LLM costs by 70% with RANA. Let's go."

---

**[THE PROBLEM - 0:30-1:30]**

**Host:** "Here's what most developers do wrong."

[Screen: Code example]

```typescript
// The expensive way
const response = await openai.chat.completions.create({
  model: 'gpt-4o',  // $5 per million tokens
  messages: [...]
});
```

**Host:** "They use GPT-4 for everything. Customer support? GPT-4. Summarization? GPT-4. Hello world? GPT-4."

[Screen: Cost chart showing expensive queries]

**Host:** "That's like driving a Ferrari to get groceries. It works, but it's expensive."

---

**[THE SOLUTION - 1:30-3:00]**

**Host:** "Here's the RANA way."

[Screen: Code example]

```typescript
// The smart way
const response = await rana.chat({
  messages: [...],
  optimize: 'cost'  // This one flag changes everything
});
```

**Host:** "One flag. That's it. RANA automatically routes your queries to the most cost-effective provider."

[Screen: Diagram showing smart routing]

**Host:** "Simple queries go to Gemini Flash - $0.075 per million tokens. Complex reasoning goes to Claude Sonnet - $3 per million. Repeated queries hit the cache - free."

---

**[COST ESTIMATE - 3:00-4:00]**

**Host:** "Want to see your potential savings? Run this command."

```bash
rana cost:estimate
```

[Show command output with cost comparison table]

**Host:** "Look at this. Medium usage scenario - 1000 requests per day. Standard cost: $6,750 per month. With RANA: $2,025. That's $56,700 in annual savings."

```bash
rana cost:estimate -s enterprise
```

**Host:** "Enterprise scenario? You're looking at savings of $472,500 per month."

---

**[BENCHMARK - 4:00-4:30]**

**Host:** "Not sure which provider is best for your use case?"

```bash
rana benchmark
```

[Show benchmark output]

**Host:** "RANA benchmarks all providers and recommends the best one for speed, quality, or cost."

---

**[OUTRO - 4:30-5:00]**

**Host:** "That's how you save 70% on LLM costs:
- Enable smart routing with `optimize: 'cost'`
- Use `rana cost:estimate` to see savings
- Benchmark providers with `rana benchmark`

Next episode: Multi-provider setup for 99.9% uptime.

Drop a comment if you've got questions. See you next time!"

---

### Episode 3: Multi-Provider Setup for 99.9% Uptime

**Duration:** 5 minutes
**Target Audience:** Production deployments
**Goal:** Configure multiple providers with fallback

---

**[INTRO - 0:00-0:30]**

**Host:** "OpenAI goes down. Your entire application breaks. Sound familiar?"

[Screen: Twitter showing OpenAI outage tweets]

**Host:** "In this episode, I'll show you how to set up multi-provider fallback with RANA. Never lose an AI request again."

---

**[THE RISK - 0:30-1:00]**

**Host:** "Single provider dependency is a business risk."

[Screen: Statistics]

**Host:** "OpenAI: 99.5% uptime = 43 hours of downtime per year
Claude: Similar
Gemini: Similar

But what if you could use ALL of them?"

---

**[MULTI-PROVIDER SETUP - 1:00-2:30]**

**Host:** "Here's how to add multiple providers to RANA."

```bash
rana llm:setup
```

[Walk through adding OpenAI, Anthropic, Google]

**Host:** "Now RANA knows about all three. Let's configure fallback."

[Open .rana.yml]

```yaml
llm:
  providers:
    primary: anthropic
    fallback:
      - openai
      - google

  fallback_behavior:
    retry_count: 3
    timeout_ms: 5000
```

**Host:** "Primary: Claude. If Claude fails, try OpenAI. If OpenAI fails, try Gemini."

---

**[DEMONSTRATION - 2:30-3:30]**

**Host:** "Let's see this in action."

[Run code that simulates primary failure]

```typescript
const response = await rana.chat({
  messages: [...],
  // No provider specified - uses fallback chain
});

console.log(response.provider); // Shows which provider responded
```

**Host:** "Even though we didn't specify a provider, RANA automatically used the fallback chain. Claude was unavailable, so it fell back to GPT-4."

---

**[MONITORING - 3:30-4:30]**

**Host:** "How do you monitor this?"

```bash
rana status
```

**Host:** "Shows which providers are online, current latency, and recent failures."

```bash
rana dashboard --live
```

**Host:** "For real-time monitoring, use the dashboard. Shows requests per provider, costs, and health status."

---

**[OUTRO - 4:30-5:00]**

**Host:** "With multi-provider setup:
- 99.9% uptime across 3 providers
- Automatic failover - no code changes
- Real-time monitoring

Next episode: Security best practices for AI applications.

Thanks for watching - hit subscribe for more!"

---

### Episode 4: Security Audit for AI Applications

**Duration:** 5 minutes
**Target Audience:** Developers concerned about security
**Goal:** Run security audit and fix common issues

---

**[INTRO - 0:00-0:30]**

**Host:** "Is your AI application secure? Let's find out."

[Screen: security:audit command]

**Host:** "I'm Ashley, and today we're running a security audit on an AI app with RANA."

---

**[COMMON VULNERABILITIES - 0:30-1:30]**

**Host:** "The top 3 security issues in AI applications:"

[Screen: List]

**Host:** "
1. API keys in source code
2. No rate limiting
3. PII exposure to LLMs

Let's check for all of these."

---

**[RUNNING AUDIT - 1:30-3:00]**

**Host:** "Run the security audit:"

```bash
rana security:audit
```

[Show output with issues found]

**Host:** "Look at this. We've got:
- Warning: Hardcoded API key in config.ts line 23
- Fail: No rate limiting configured
- Warning: PII patterns detected in prompts

Let's fix these."

---

**[FIXING ISSUES - 3:00-4:30]**

**Host:** "First, the API key. Move it to .env:"

```bash
# Before (bad)
const apiKey = 'sk-proj-...'

# After (good)
const apiKey = process.env.OPENAI_API_KEY
```

**Host:** "Second, add rate limiting. RANA makes this easy:"

```yaml
# .rana.yml
security:
  rate_limiting:
    enabled: true
    requests_per_minute: 60
```

**Host:** "Third, PII protection:"

```yaml
security:
  pii_detection:
    enabled: true
    action: redact  # or 'warn' or 'block'
```

**Host:** "Run the audit again:"

```bash
rana security:audit
```

[Show clean output]

**Host:** "All green. Security score: 96/100."

---

**[OUTRO - 4:30-5:00]**

**Host:** "Security checklist:
- Run `rana security:audit` regularly
- Keep API keys in environment variables
- Enable rate limiting
- Use PII detection

Next episode: Production deployment in 60 seconds.

Stay secure, see you next time!"

---

### Episode 5: Deploy to Production in 60 Seconds

**Duration:** 5 minutes
**Target Audience:** Developers ready to deploy
**Goal:** Deploy RANA app to production

---

**[INTRO - 0:00-0:30]**

**Host:** "From localhost to production in 60 seconds. Let's do it."

[Screen: Stopwatch]

---

**[PRE-DEPLOY CHECKLIST - 0:30-1:30]**

**Host:** "Before we deploy, let's run the pre-flight checks."

```bash
rana doctor
rana check
rana security:audit
```

**Host:** "All green? We're ready."

---

**[DEPLOYMENT - 1:30-3:00]**

**Host:** "Start the timer. 60 seconds."

[Screen: Timer starts]

```bash
rana deploy
```

**Host:** "RANA handles:
- Running tests
- Building the app
- Deploying to Vercel
- Verifying deployment"

[Wait for deployment]

**Host:** "Done! 47 seconds."

[Show live URL]

---

**[VERIFICATION - 3:00-4:00]**

**Host:** "Let's verify it's working."

```bash
rana deploy --verify
```

**Host:** "RANA pings your endpoints and confirms everything is healthy."

[Show verification output]

---

**[MONITORING - 4:00-4:30]**

**Host:** "Once live, monitor your app:"

```bash
rana dashboard --live
```

**Host:** "Real-time costs, requests, and health status."

---

**[OUTRO - 4:30-5:00]**

**Host:** "Deployed and verified in under 60 seconds.

That's the power of RANA - from zero to production-ready AI in 5 minutes.

If you followed along with this series, you've now got:
- A working RANA project
- 70% cost optimization
- Multi-provider fallback
- Security compliance
- Production deployment

What will you build? Drop a comment below!

Thanks for watching. Happy building!"

---

## Series 2: Deep Dives

Longer tutorials for advanced users.

---

### Deep Dive 1: LangChain to RANA Migration

**Duration:** 15 minutes
**Target Audience:** LangChain users considering migration
**Goal:** Complete migration walkthrough

---

**[OUTLINE]**

1. **Intro** (0:00-2:00)
   - Why migrate?
   - What you'll learn
   - Prerequisites

2. **Side-by-Side Comparison** (2:00-5:00)
   - Code comparison
   - API differences
   - Feature parity

3. **Migration Steps** (5:00-12:00)
   - Install RANA
   - Replace LangChain imports
   - Update chat calls
   - Convert chains to RANA patterns
   - Test everything

4. **Results** (12:00-14:00)
   - Performance comparison
   - Cost comparison
   - Developer experience

5. **Outro** (14:00-15:00)
   - Summary
   - Resources
   - Q&A invitation

---

### Deep Dive 2: Building a Customer Support Bot

**Duration:** 20 minutes
**Target Audience:** Developers building production apps
**Goal:** Build complete customer support solution

---

**[OUTLINE]**

1. **Intro & Architecture** (0:00-3:00)
   - What we're building
   - Architecture overview
   - Tech stack

2. **Project Setup** (3:00-6:00)
   - Create RANA app
   - Add providers
   - Configure cost optimization

3. **Core Chat Logic** (6:00-10:00)
   - Chat endpoint
   - Streaming responses
   - Context management

4. **RAG Integration** (10:00-14:00)
   - Add knowledge base
   - Embed documents
   - Retrieval logic

5. **Production Features** (14:00-18:00)
   - Rate limiting
   - Error handling
   - Logging & monitoring

6. **Deployment** (18:00-20:00)
   - Deploy to Vercel
   - Verify & test
   - Monitor costs

---

### Deep Dive 3: Enterprise Security Setup

**Duration:** 15 minutes
**Target Audience:** Enterprise developers, security engineers
**Goal:** Implement enterprise-grade security

---

**[OUTLINE]**

1. **Security Overview** (0:00-2:00)
   - OWASP Top 10 for AI
   - RANA security features
   - Compliance requirements

2. **Authentication** (2:00-5:00)
   - API key management
   - JWT integration
   - Role-based access

3. **Rate Limiting** (5:00-8:00)
   - Redis setup
   - Rate limit configuration
   - Abuse prevention

4. **PII Protection** (8:00-11:00)
   - Detection patterns
   - Redaction logic
   - Audit logging

5. **Compliance** (11:00-14:00)
   - GDPR considerations
   - SOC 2 requirements
   - Audit trails

6. **Wrap-Up** (14:00-15:00)
   - Security checklist
   - Ongoing monitoring
   - Resources

---

## Webinar Scripts

### Webinar: RANA 101 - Live Demo

**Duration:** 45 minutes
**Format:** Live coding + Q&A

---

**[AGENDA]**

1. **Welcome & Intros** (5 min)
2. **The Problem We Solve** (5 min)
3. **Live Demo: Zero to Production** (20 min)
4. **Q&A** (15 min)

---

**[SPEAKER NOTES]**

**Welcome:**
- Thank attendees for joining
- Quick intro: Ashley, Waymaker, RANA
- Overview of what we'll cover

**Problem:**
- Show cost comparison slide
- Explain vendor lock-in
- Discuss breaking API changes
- "This is why we built RANA"

**Live Demo:**
- Create new project
- Add multiple providers
- Make API calls
- Enable cost optimization
- Deploy to production
- Show cost savings in real-time

**Q&A:**
- Answer live questions
- Share resources
- Announce next webinar

---

## Video Production Notes

### Technical Requirements

- Screen resolution: 1920x1080
- Font size in terminal: 18px minimum
- Code editor theme: Dark (VS Code)
- Audio: Clear, no background noise
- B-roll: Code typing, terminal commands

### Editing Guidelines

- Keep transitions simple (cuts only)
- Add captions for accessibility
- Include timestamps in description
- End card with subscribe CTA

### Distribution

- YouTube: Primary platform
- LinkedIn: Clips and teasers
- Twitter: Thread summaries
- Discord: Announcements

---

*Ashley Kays | Waymaker | RANA*
*Teach, don't sell*
