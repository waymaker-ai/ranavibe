import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tool Execution Patterns | Building AI Agents',
  description: 'Learn sequential vs parallel tool execution, tool chaining, conditional tool use, and result parsing strategies.',
};

export default function Lesson4Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 4 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Tool Execution Patterns</h1>
          <p className="lead">
            How tools are executed matters as much as what they do. CoFounder supports sequential
            execution, parallel execution, chaining, and conditional patterns. Choosing the right
            pattern can dramatically improve agent speed and reliability.
          </p>

          <h2>Sequential Execution</h2>
          <p>
            Sequential execution is the default. The agent calls one tool at a time, waits for the
            result, and then decides its next action. This is the safest pattern and works well when
            each step depends on the previous result.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'sequential-agent',
  model: 'gpt-4o',
  systemPrompt: \`You are a research assistant. When asked a question:
1. First search for relevant information
2. Then fetch the most relevant page
3. Finally summarize the findings\`,
  tools: [searchTool, fetchPageTool, summarizeTool],
  execution: { mode: 'sequential' }, // default
});`}</code></pre></div>

          <h2>Parallel Execution</h2>
          <p>
            When an agent needs independent pieces of information, it can call multiple tools
            simultaneously. CoFounder detects when the LLM requests multiple tool calls in a single
            response and runs them in parallel using <code>Promise.all</code>:
          </p>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'parallel-agent',
  model: 'gpt-4o',
  systemPrompt: \`You are a comparison assistant. When comparing items,
fetch data for ALL items simultaneously using parallel tool calls.\`,
  tools: [fetchProductTool, fetchReviewsTool, fetchPriceTool],
  execution: {
    mode: 'parallel',
    maxConcurrent: 5, // Limit concurrent tool calls
    timeoutMs: 30000, // Timeout per tool call
  },
});

// The agent will call fetchProductTool for multiple products at once
const result = await agent.run('Compare the iPhone 15 Pro and Samsung S24 Ultra');`}</code></pre></div>
          <p>
            Parallel execution can reduce total latency by 50-80% for multi-source queries, but be
            mindful of rate limits on external APIs.
          </p>

          <h2>Tool Chaining</h2>
          <p>
            Tool chaining is when the output of one tool becomes the input of another. CoFounder
            supports explicit chaining through the <code>chainTools</code> helper:
          </p>
          <div className="code-block"><pre><code>{`import { chainTools } from '@waymakerai/aicofounder-core';

const searchAndSummarize = chainTools([
  {
    tool: searchTool,
    mapOutput: (results) => ({
      urls: JSON.parse(results).map((r: any) => r.url).slice(0, 3),
    }),
  },
  {
    tool: fetchPageTool,
    mapOutput: (pages) => ({
      content: JSON.parse(pages).map((p: any) => p.text).join('\\n\\n'),
    }),
  },
  {
    tool: summarizeTool,
  },
]);

// Register the chain as a single composite tool
const agent = createAgent({
  name: 'chaining-agent',
  model: 'gpt-4o',
  tools: [searchAndSummarize],
});`}</code></pre></div>

          <h2>Conditional Tool Use</h2>
          <p>
            Sometimes a tool should only be available based on context. CoFounder allows dynamic
            tool filtering with the <code>toolFilter</code> option:
          </p>
          <ul>
            <li>Filter tools based on user permissions or roles</li>
            <li>Enable expensive tools only when simpler ones fail</li>
            <li>Restrict tools based on the current step count</li>
          </ul>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'conditional-agent',
  model: 'gpt-4o',
  tools: [quickSearchTool, deepSearchTool, databaseTool],
  toolFilter: ({ step, previousResults }) => {
    // Only allow deep search after step 3 if quick search was insufficient
    if (step < 3) return ['quick_search', 'database'];
    return ['quick_search', 'deep_search', 'database'];
  },
});`}</code></pre></div>

          <h2>Parsing Tool Results</h2>
          <p>
            Tool results are always strings (JSON-serialized). CoFounder provides utilities to
            help agents parse and validate tool output:
          </p>
          <ul>
            <li>Always return valid JSON from your tools -- agents reason about structured data more reliably.</li>
            <li>Include metadata like timestamps, source URLs, or confidence scores so the agent can assess quality.</li>
            <li>Keep results concise. Large tool outputs consume context window space and can confuse the agent.</li>
          </ul>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-3" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Creating Custom Tools
          </Link>
          <Link href="/training/building-agents/lesson-5" className="btn-primary px-6 py-3 group">
            Next: Memory and Context Management
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
