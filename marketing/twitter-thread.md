# AICofounder Launch Thread

---

**Tweet 1 (Hook)**

I lost 3 days because an AI agent rewrote my auth middleware and leaked PII to the client. No warning, no diff review, just a "helpful" refactor that exposed SSNs in API responses. We need guardrails. Not vibes. Actual guardrails.

---

**Tweet 2 (What it is)**

So we built AICofounder -- an open-source guardrails framework for AI-assisted development. PII detection, prompt injection blocking, toxicity filtering, cost tracking, rate limiting. One import. Zero dependencies.

---

**Tweet 3 (Speed + simplicity)**

The guard runs in <1ms. Zero deps, under 50KB. Ships ESM + CJS + full TypeScript types. Detects 11 PII types, 25+ injection patterns, and 7 toxicity categories out of the box. No ML model to load. No Python sidecar. Just JavaScript.

---

**Tweet 4 (Compliance)**

If you're building in healthcare, finance, or anything touching user data: we ship HIPAA, GDPR/CCPA, and SEC/FINRA compliance presets. Automatic output validation. Full audit trail. The kind of stuff that takes 6 months to build internally.

---

**Tweet 5 (Cost savings)**

We were burning $4k/mo on LLM calls before we added smart routing and caching. Now it's under $1.2k. 70% cost reduction isn't marketing copy, it's our actual AWS bill. Built-in cost tracking across 20+ models from 9 providers.

---

**Tweet 6 (Code snippet)**

It's actually this simple:

```ts
import { createGuard } from '@waymakerai/aicofounder-guard';

const guard = createGuard({
  pii: 'redact',
  injection: 'block'
});

const result = guard.check(userInput);
// result.safe, result.redacted, result.reason
```

That's it. That's the whole setup.

---

**Tweet 7 (Integrations)**

Works with LangChain, CrewAI, Vercel AI SDK. Adapters for Lakera Guard and AWS Bedrock Guardrails. Express/Fastify middleware included. Wraps any LLM client -- OpenAI, Anthropic, Google, Mistral, Groq, Ollama. You don't rewrite your stack. You wrap it.

---

**Tweet 8 (CI Scanner)**

We also ship a CI/CD scanner with 7 rules that catches exposed source maps, VITE_SECRET env vars in client bundles, debug modes left on in prod, GraphQL introspection without auth, secrets echoed in GitHub Actions, and more. Just: npx @waymakerai/aicofounder-ci scan --rules all

---

**Tweet 9 (Training)**

We built a free training academy with 45 lessons across 4 courses: Fundamentals, Building AI Agents, Advanced Patterns, Production Deployment. Real code, real patterns, not vibes. cofounder.waymaker.cx/training

---

**Tweet 10 (Open source)**

MIT licensed. Fully open source. No "open core" bait-and-switch. The compliance module, the guard, the agent SDK, the CI scanner, the cost optimizer -- all of it, free. We'd rather have 10,000 devs using this than 10 enterprises paying us to ignore the problem.

---

**Tweet 11 (CTA)**

Ship AI features without shipping liability.

GitHub: https://github.com/waymaker-ai/cofounder
npm: npm install @waymakerai/aicofounder-core
Docs: https://cofounder.cx

Star the repo. Try the guard. Open an issue if we missed something. We're building this in the open and we want your feedback.

---
