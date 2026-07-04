import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Building a Multi-Model Router | Advanced Patterns',
  description: 'Build a router agent pattern with model capability matching, cost-aware routing, and A/B testing for LLM models.',
};

export default function Lesson12Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 12 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Building a Multi-Model Router</h1>
          <p className="lead">
            A multi-model router is a meta-agent that analyzes incoming requests and routes them to the most appropriate LLM based on the task requirements, cost constraints, and performance needs. This lesson walks through building a production-grade router from scratch using CoFounder&apos;s primitives.
          </p>

          <h2>Router Agent Pattern</h2>
          <p>
            The router pattern uses a lightweight classifier (often a small, fast model) to categorize the incoming request and then dispatches it to a specialized agent. The classifier adds minimal latency and cost while enabling significant savings by avoiding expensive models for simple tasks.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, ModelRouter } from '@waymakerai/aicofounder-core';

// The classifier is a small, fast model
const classifier = createAgent({
  model: 'gpt-4o-mini',
  systemPrompt: \`Classify the user request into exactly one category:
- SIMPLE: factual questions, greetings, simple math
- CODE: programming, debugging, code generation
- CREATIVE: writing, brainstorming, storytelling
- ANALYSIS: data analysis, reasoning, complex problem solving
- VISION: image description, chart reading

Respond with ONLY the category name.\`,
});

const models = {
  SIMPLE: createAgent({ model: 'gpt-4o-mini' }),
  CODE: createAgent({ model: 'gpt-4o', systemPrompt: 'You are an expert programmer.' }),
  CREATIVE: createAgent({ model: 'claude-3-5-sonnet', systemPrompt: 'You are a creative writer.' }),
  ANALYSIS: createAgent({ model: 'gpt-4o', systemPrompt: 'You are a data analyst. Be thorough.' }),
  VISION: createAgent({ model: 'gpt-4o', systemPrompt: 'Describe images accurately.' }),
};

async function routeRequest(prompt: string) {
  const classification = await classifier.run(prompt);
  const category = classification.text.trim() as keyof typeof models;
  const agent = models[category] || models.SIMPLE;

  const result = await agent.run(prompt);
  return {
    ...result,
    routedTo: category,
    classificationCost: classification.cost,
  };
}`}</code></pre></div>

          <h2>Model Capability Matching</h2>
          <p>
            Different models excel at different tasks. GPT-4o is strong at code and reasoning, Claude excels at long-form writing and nuance, and smaller models handle classification and extraction efficiently. A capability matrix maps task types to model strengths, informed by benchmarks and your own evaluation data.
          </p>
          <p>
            CoFounder maintains an internal capability registry that you can customize. It tracks each model&apos;s strengths, weaknesses, context window size, cost per token, and average latency. The router uses this registry to make informed routing decisions without needing a classifier call for well-defined task categories.
          </p>

          <h2>Cost-Aware Routing</h2>
          <p>
            Cost-aware routing balances quality against budget. When the daily budget is nearly exhausted, the router can automatically downgrade to cheaper models for non-critical requests while preserving the best models for high-priority tasks.
          </p>
          <div className="code-block"><pre><code>{`const costAwareRouter = new ModelRouter({
  budget: {
    dailyLimit: 50.00,    // $50/day budget
    warningThreshold: 0.8, // Warn at 80%
    degradeThreshold: 0.9, // Degrade at 90%
  },
  costStrategy: async (task, budget) => {
    const spent = await budget.getTodaySpend();
    const ratio = spent / budget.dailyLimit;

    if (ratio > budget.degradeThreshold) {
      // Budget nearly exhausted: use cheapest model
      return { model: 'gpt-4o-mini', reason: 'budget-conservation' };
    }

    if (ratio > budget.warningThreshold && task.priority !== 'high') {
      // Getting close: downgrade non-critical tasks
      return { model: 'gpt-4o-mini', reason: 'budget-warning' };
    }

    // Normal operation: route by capability
    return null; // Fall through to capability-based routing
  },
});`}</code></pre></div>

          <h2>A/B Testing Models</h2>
          <p>
            When a new model launches or you want to compare providers, A/B testing lets you measure real-world performance. Route a percentage of traffic to each model variant, collect quality metrics (user feedback, task completion rates), and make data-driven model selection decisions.
          </p>
          <p>
            CoFounder&apos;s router supports traffic splitting with configurable percentages. Combined with the feedback system from Lesson 8, you can run statistically valid experiments to determine which model performs best for each task category. Store experiment results in Supabase for analysis and automate model promotion when a new model consistently outperforms the incumbent.
          </p>

          <h2>Router Performance Optimization</h2>
          <p>
            The classification step adds latency to every request. Optimize it by caching classification results for similar prompts, using embeddings-based classification instead of LLM calls, or implementing a rule-based pre-classifier that handles obvious cases (like code blocks or image URLs) without calling the classifier model at all.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-11" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Cost Optimization Techniques
          </Link>
          <Link href="/training/advanced-patterns/lesson-13" className="btn-primary px-6 py-3 group">
            Next: RAG Implementation Patterns
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
