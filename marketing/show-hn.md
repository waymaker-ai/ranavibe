Show HN: AICofounder – Open-source guardrails that stop AI agents from breaking your codebase

We built AICofounder because we kept watching AI agents do real damage: committing API keys to public repos, hallucinating destructive database migrations, blowing through $400 in tokens on a loop, and quietly dropping PII into logs. The "vibe coding" era is great until your agent rewrites your auth middleware at 2am and nobody catches it until production is on fire.

AICofounder is a 7-layer guard system that sits between your AI agent and your codebase. PII redaction, prompt injection blocking, cost tracking with hard limits, compliance enforcement (HIPAA/GDPR/SEC/SOX/PCI DSS), content filtering, full audit logging, and rate limiting. It runs in under 1ms, has zero runtime dependencies, and weighs about 50KB. It's not a framework that replaces your stack — it wraps whatever you already use:

    import { createGuardedAI } from '@waymakerai/aicofounder-core';

    const ai = createGuardedAI({
      guards: ['pii-redaction', 'injection-blocking', 'cost-tracking'],
      compliance: ['hipaa', 'gdpr'],
      costLimit: { daily: 50.00 }
    });

Works with Vercel AI SDK, LangChain, CrewAI, Supabase, and anything else that speaks HTTP or has a middleware pattern. The caching and smart routing layer typically cuts token costs by ~70%, which alone has paid for the integration time for most teams we've talked to.

One thing we feel strongly about: we refuse to sell the "ship a startup in 30 minutes with AI" fantasy. AI-assisted development is powerful, but it needs the same engineering discipline as everything else — tests, code review, guardrails. AICofounder is the guardrails part. MIT licensed, no vendor lock-in, no telemetry, no cloud dependency. Run it entirely on your own infra.

GitHub: https://github.com/waymaker-ai/cofounder
npm: npm install @waymakerai/aicofounder-core
Docs: https://cofounder.cx
