import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Multi-Tool Agents | Building AI Agents',
  description: 'Learn to register multiple tools, implement tool selection strategies, set priorities, and combine search, compute, and action tools.',
};

export default function Lesson6Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 6 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Multi-Tool Agents</h1>
          <p className="lead">
            Real-world agents rarely rely on a single tool. A capable agent combines search tools for
            gathering information, compute tools for processing data, and action tools for producing
            outputs. This lesson covers how to register, organize, and optimize agents with multiple tools.
          </p>

          <h2>Registering Multiple Tools</h2>
          <p>
            CoFounder agents accept an array of tools. You can define them inline or import them from
            separate modules for better organization:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';
import { searchTool } from './tools/search';
import { calculatorTool } from './tools/calculator';
import { emailTool } from './tools/email';
import { databaseTool } from './tools/database';
import { chartTool } from './tools/chart';

const agent = createAgent({
  name: 'multi-tool-agent',
  model: 'gpt-4o',
  systemPrompt: \`You are a business analyst assistant. You can:
- Search the web for market data
- Query internal databases for company metrics
- Perform calculations and analysis
- Generate charts from data
- Send email reports to stakeholders

Always verify data from multiple sources before making claims.\`,
  tools: [searchTool, calculatorTool, emailTool, databaseTool, chartTool],
});`}</code></pre></div>

          <h2>Tool Selection Strategies</h2>
          <p>
            When an agent has many tools, the LLM must decide which one to use. The quality of this
            decision depends on how well you describe each tool. Follow these guidelines:
          </p>
          <ul>
            <li><strong>Distinct names</strong> -- Each tool name should clearly indicate its purpose. Avoid generic names like <code>helper</code> or <code>process</code>.</li>
            <li><strong>Detailed descriptions</strong> -- Explain when to use the tool and when not to. Include examples of good queries.</li>
            <li><strong>Non-overlapping scope</strong> -- If two tools do similar things, explain the difference in their descriptions.</li>
          </ul>
          <div className="code-block"><pre><code>{`// Bad: vague, overlapping descriptions
const badTools = [
  { name: 'search', description: 'Search for things' },
  { name: 'lookup', description: 'Look up information' },
];

// Good: specific, distinct descriptions
const goodTools = [
  {
    name: 'web_search',
    description: 'Search the public web for current information, news, and general knowledge. Use this for questions about recent events or public data.',
  },
  {
    name: 'internal_db_lookup',
    description: 'Query the internal company database for employee records, sales data, and inventory. Use this for company-specific questions. NOT for public information.',
  },
];`}</code></pre></div>

          <h2>Tool Categories and Priority</h2>
          <p>
            CoFounder lets you organize tools into categories and assign priorities. This helps the
            agent prefer cheaper or faster tools when they can accomplish the task:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, ToolCategory } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'prioritized-agent',
  model: 'gpt-4o',
  tools: [
    { ...cacheLookupTool, category: ToolCategory.RETRIEVAL, priority: 1 },
    { ...databaseTool, category: ToolCategory.RETRIEVAL, priority: 2 },
    { ...webSearchTool, category: ToolCategory.RETRIEVAL, priority: 3 },
    { ...calculatorTool, category: ToolCategory.COMPUTE, priority: 1 },
    { ...emailTool, category: ToolCategory.ACTION, priority: 1 },
  ],
  systemPrompt: \`When retrieving information, try the cache first,
then the database, and only use web search as a last resort.\`,
});`}</code></pre></div>

          <h2>Combining Search, Compute, and Action Tools</h2>
          <p>
            The most powerful agents combine three types of tools:
          </p>
          <ul>
            <li><strong>Search tools</strong> -- Gather data from external sources (web search, database queries, API calls).</li>
            <li><strong>Compute tools</strong> -- Process and analyze data (calculations, data transformations, chart generation).</li>
            <li><strong>Action tools</strong> -- Produce side effects (send emails, create records, trigger workflows).</li>
          </ul>
          <p>
            A well-designed system prompt guides the agent to use these in the right order: gather
            data first, analyze it, then take action only when confident in the results.
          </p>

          <h2>Managing Tool Count</h2>
          <p>
            More tools give agents more capabilities, but too many tools degrade performance. Each
            tool definition consumes tokens in the context window, and too many options can confuse
            the model. As a guideline:
          </p>
          <ul>
            <li>Keep to 10-15 tools maximum per agent.</li>
            <li>If you need more, use an orchestrator pattern (covered in Lesson 7) to delegate to specialized sub-agents.</li>
            <li>Use the <code>toolFilter</code> option to dynamically show only relevant tools based on context.</li>
          </ul>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-5" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Memory and Context Management
          </Link>
          <Link href="/training/building-agents/lesson-7" className="btn-primary px-6 py-3 group">
            Next: Agent Orchestration
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
