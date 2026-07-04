import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Parallel Agent Execution | Advanced Patterns',
  description: 'Learn Promise.allSettled for agents, worker pools, concurrent tool execution, and resource throttling patterns.',
};

export default function Lesson6Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 6 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Parallel Agent Execution</h1>
          <p className="lead">
            Many real-world tasks benefit from running multiple agents simultaneously. Whether you are gathering information from different sources, generating multiple drafts, or executing independent tool calls, parallel execution can dramatically reduce end-to-end latency. This lesson covers the patterns and pitfalls of concurrent agent operations.
          </p>

          <h2>Promise.allSettled for Agents</h2>
          <p>
            When running multiple agents in parallel, <code>Promise.allSettled</code> is preferred over <code>Promise.all</code> because it never short-circuits. If one agent fails, the others still complete. This is critical for AI workflows where partial results are often better than no results.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({ model: 'gpt-4o' });

async function gatherResearch(topic: string) {
  const tasks = [
    agent.run(\`Summarize recent developments in \${topic}\`),
    agent.run(\`List key players and companies in \${topic}\`),
    agent.run(\`What are the main challenges facing \${topic}?\`),
    agent.run(\`Predict future trends for \${topic}\`),
  ];

  const results = await Promise.allSettled(tasks);

  const research = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { section: index, content: result.value.text, success: true };
    }
    return { section: index, error: result.reason.message, success: false };
  });

  // Use successful results even if some failed
  const successfulSections = research.filter((r) => r.success);
  console.log(\`\${successfulSections.length}/\${tasks.length} sections completed\`);

  return research;
}`}</code></pre></div>

          <h2>Worker Pools for Agent Tasks</h2>
          <p>
            Running unlimited parallel agents can overwhelm your LLM provider&apos;s rate limits and spike costs. A worker pool pattern limits concurrency while still processing tasks as fast as possible. CoFounder provides an <code>AgentPool</code> that manages a fixed number of concurrent agent executions with automatic queuing.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, AgentPool } from '@waymakerai/aicofounder-core';

const pool = new AgentPool({
  agent: createAgent({ model: 'gpt-4o' }),
  concurrency: 5,        // Max 5 simultaneous LLM calls
  queueLimit: 100,       // Max 100 pending tasks
  timeoutMs: 30000,      // Per-task timeout
  onQueueFull: () => {
    console.warn('Agent pool queue is full, requests will be rejected');
  },
});

// Submit tasks - they execute up to 5 at a time
const promises = documents.map((doc) =>
  pool.submit(\`Summarize this document: \${doc.content}\`)
);

const summaries = await Promise.allSettled(promises);

// Graceful shutdown waits for in-flight tasks
await pool.drain();`}</code></pre></div>

          <h2>Concurrent Tool Execution</h2>
          <p>
            When an agent needs to call multiple tools that are independent of each other, executing them concurrently saves significant time. CoFounder&apos;s tool executor detects independent tool calls and runs them in parallel automatically. You can also explicitly mark tools as parallelizable in your tool definitions.
          </p>
          <p>
            The key consideration is dependency analysis: if tool B needs the output of tool A, they must run sequentially. CoFounder builds a dependency graph from the agent&apos;s tool call plan and executes the maximum number of tools in parallel at each step.
          </p>

          <h2>Resource Throttling</h2>
          <p>
            Beyond concurrency limits, you need to throttle based on tokens per minute, requests per minute, and cost budgets. CoFounder&apos;s throttling layer integrates with the rate limiter to ensure parallel execution stays within your provider&apos;s limits. If you are approaching a rate limit, the pool automatically slows down rather than hitting errors.
          </p>
          <p>
            A good rule of thumb: set your pool concurrency to 50-70% of your provider&apos;s rate limit to leave headroom for other parts of your application. Monitor the pool&apos;s queue depth as a leading indicator of capacity problems.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-5" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Caching Strategies
          </Link>
          <Link href="/training/advanced-patterns/lesson-7" className="btn-primary px-6 py-3 group">
            Next: Agent Pipelines
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
