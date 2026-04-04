import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cost Optimization Techniques | Advanced Patterns',
  description: 'Learn prompt compression, model routing by complexity, caching to reduce calls, token budgets, and CoFounder cost tracking.',
};

export default function Lesson11Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 11 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Cost Optimization Techniques</h1>
          <p className="lead">
            LLM costs can spiral quickly at scale. A well-optimized application can reduce costs by 60-80% without sacrificing quality. This lesson covers practical techniques: prompt compression, intelligent model routing, caching, token budgets, and using CoFounder&apos;s cost tracker to identify optimization opportunities.
          </p>

          <h2>Prompt Compression</h2>
          <p>
            Every token in your prompt costs money, and context windows have limits. Prompt compression reduces the size of your inputs without losing meaning. Techniques include: summarizing conversation history instead of sending full transcripts, stripping unnecessary formatting and whitespace, using abbreviations in system prompts, and compressing RAG context to only the most relevant passages.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, compressHistory } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  model: 'gpt-4o',
  contextManagement: {
    // Compress conversation history when it exceeds 4k tokens
    maxHistoryTokens: 4000,
    compressionStrategy: 'summarize',
    // Keep the last 3 messages verbatim, summarize older ones
    keepRecentMessages: 3,
  },
});

// Manual compression for custom scenarios
const longHistory = await getConversationHistory(sessionId);
const compressed = await compressHistory(longHistory, {
  targetTokens: 2000,
  preserveToolCalls: true,  // Keep tool call/results intact
  preserveSystemContext: true,
});

const result = await agent.run('Continue our conversation', {
  history: compressed,
});

console.log(\`Saved \${longHistory.tokenCount - compressed.tokenCount} tokens\`);`}</code></pre></div>

          <h2>Model Routing by Complexity</h2>
          <p>
            Not every request needs GPT-4o. Simple questions, formatting tasks, and classification can use smaller, cheaper models. A complexity router analyzes the incoming request and routes it to the most cost-effective model that can handle it well.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, ModelRouter } from '@waymakerai/aicofounder-core';

const router = new ModelRouter({
  rules: [
    {
      // Simple factual queries -> cheapest model
      condition: (prompt) => prompt.length < 100 && !prompt.includes('code'),
      model: 'gpt-4o-mini',
      costPerMToken: 0.15,
    },
    {
      // Code generation -> best model
      condition: (prompt) => prompt.includes('code') || prompt.includes('function'),
      model: 'gpt-4o',
      costPerMToken: 2.50,
    },
    {
      // Long analysis tasks -> balanced model
      condition: (prompt) => prompt.length > 500,
      model: 'claude-3-5-sonnet',
      costPerMToken: 3.00,
    },
  ],
  default: 'gpt-4o-mini',
});

const agent = createAgent({
  modelRouter: router,
});

// Automatically routed to the best model for the task
const result = await agent.run('What is 2+2?');
console.log(result.model); // 'gpt-4o-mini' - cheapest option
console.log(result.cost);  // $0.0001`}</code></pre></div>

          <h2>Token Budgets</h2>
          <p>
            Set hard limits on how many tokens a single request, user, or session can consume. Token budgets prevent runaway costs from verbose prompts, recursive agent loops, or malicious input. CoFounder enforces budgets at multiple levels: per-request, per-session, per-user daily, and global monthly.
          </p>
          <p>
            When a budget is exceeded, the agent can either fail with a clear error, truncate its response at the budget limit, or switch to a cheaper model to stay within budget. The strategy depends on your application&apos;s requirements.
          </p>

          <h2>CoFounder Cost Tracker</h2>
          <p>
            CoFounder&apos;s cost tracker records every LLM call with its token usage, model, latency, and calculated cost. This data is stored in Supabase and exposed through a dashboard API. Use it to identify your most expensive prompts, track cost trends over time, and set up alerts when spending exceeds thresholds.
          </p>
          <p>
            The cost tracker integrates with the caching layer to show you exactly how much you are saving. It also provides per-user cost breakdowns, letting you implement usage-based billing or identify users who are disproportionately expensive to serve.
          </p>

          <h2>Practical Cost Reduction Checklist</h2>
          <p>
            Apply these optimizations in order of impact: first, implement caching (40-60% cost reduction for typical applications). Second, route simple queries to smaller models (20-30% additional savings). Third, compress conversation history (10-20% savings on long conversations). Fourth, set token budgets to prevent outlier costs. Finally, audit your system prompts quarterly to remove unnecessary instructions that consume tokens on every request.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-10" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Rate Limiting Implementation
          </Link>
          <Link href="/training/advanced-patterns/lesson-12" className="btn-primary px-6 py-3 group">
            Next: Building a Multi-Model Router
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
