import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Orchestration | Building AI Agents',
  description: 'Build multi-agent systems with delegation, supervisor patterns, parallel execution, and inter-agent communication.',
};

export default function Lesson7Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 7 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Agent Orchestration</h1>
          <p className="lead">
            Complex tasks often exceed what a single agent can handle effectively. Agent orchestration
            lets you coordinate multiple specialized agents, each focused on a specific domain, to
            solve problems that require diverse expertise.
          </p>

          <h2>Why Multi-Agent Systems?</h2>
          <p>
            Single agents struggle when tasks require too many tools, different expertise domains,
            or parallel workflows. Multi-agent systems solve this by:
          </p>
          <ul>
            <li>Keeping each agent focused with a small, relevant tool set</li>
            <li>Allowing different models for different tasks (cheap models for simple tasks, powerful models for complex reasoning)</li>
            <li>Running independent sub-tasks in parallel</li>
            <li>Improving reliability through specialization</li>
          </ul>

          <h2>The Supervisor Pattern</h2>
          <p>
            The most common orchestration pattern uses a supervisor agent that delegates work to
            specialized worker agents. CoFounder provides the <code>createOrchestrator</code> helper:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, createOrchestrator } from '@waymakerai/aicofounder-core';

const researchAgent = createAgent({
  name: 'researcher',
  model: 'gpt-4o',
  systemPrompt: 'You are a research specialist. Find and verify facts.',
  tools: [webSearchTool, fetchPageTool],
});

const analysisAgent = createAgent({
  name: 'analyst',
  model: 'gpt-4o',
  systemPrompt: 'You are a data analyst. Analyze data and produce insights.',
  tools: [calculatorTool, chartTool, databaseTool],
});

const writerAgent = createAgent({
  name: 'writer',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You are a technical writer. Produce clear, well-structured reports.',
  tools: [],
});

const orchestrator = createOrchestrator({
  name: 'report-generator',
  model: 'gpt-4o',
  agents: [researchAgent, analysisAgent, writerAgent],
  strategy: 'supervisor',
  systemPrompt: \`You coordinate a team of specialists to produce research reports.
Delegate research tasks to the researcher, analysis to the analyst,
and final writing to the writer.\`,
});

const result = await orchestrator.run('Create a market analysis report for the EV industry in 2025.');`}</code></pre></div>

          <h2>Agent Delegation</h2>
          <p>
            Under the hood, each sub-agent is exposed to the supervisor as a tool. The supervisor
            calls the agent by name and passes it a task description. CoFounder handles routing
            the message, running the sub-agent, and returning its output:
          </p>
          <div className="code-block"><pre><code>{`// The orchestrator automatically creates tools like this for each agent:
{
  name: 'delegate_to_researcher',
  description: 'Delegate a research task to the researcher agent.',
  parameters: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'The research task to perform' },
      context: { type: 'string', description: 'Additional context or constraints' },
    },
    required: ['task'],
  },
  execute: async ({ task, context }) => {
    return await researchAgent.run(task, { context });
  },
}`}</code></pre></div>

          <h2>Parallel Agent Execution</h2>
          <p>
            When sub-tasks are independent, run agents in parallel to reduce total execution time:
          </p>
          <div className="code-block"><pre><code>{`const orchestrator = createOrchestrator({
  name: 'parallel-orchestrator',
  model: 'gpt-4o',
  agents: [researchAgent, analysisAgent, writerAgent],
  strategy: 'supervisor',
  execution: {
    allowParallel: true,
    maxConcurrentAgents: 3,
  },
});

// The supervisor can now delegate to researcher AND analyst simultaneously
// The writer waits until both produce results`}</code></pre></div>

          <h2>Agent Communication</h2>
          <p>
            Agents can share context through a shared memory space. This lets downstream agents
            access results from upstream agents without the supervisor needing to relay everything:
          </p>
          <ul>
            <li><strong>Shared context</strong> -- A key-value store that all agents in the orchestration can read and write to.</li>
            <li><strong>Message passing</strong> -- Agents can send structured messages to specific other agents.</li>
            <li><strong>Result aggregation</strong> -- The orchestrator collects all agent outputs and can pass aggregated results to a final agent.</li>
          </ul>
          <p>
            Keep communication structured and minimal. Each agent should receive only the context it
            needs to do its job, not the full output of every other agent.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-6" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Multi-Tool Agents
          </Link>
          <Link href="/training/building-agents/lesson-8" className="btn-primary px-6 py-3 group">
            Next: Building a Research Agent
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
