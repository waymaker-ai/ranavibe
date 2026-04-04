import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agent Configuration Deep Dive | Building AI Agents',
  description: 'Master AgentConfig options including model selection, system prompts, temperature, token limits, and provider configuration.',
};

export default function Lesson2Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 2 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Agent Configuration Deep Dive</h1>
          <p className="lead">
            Every CoFounder agent starts with a configuration object that controls its behavior,
            model selection, and capabilities. Understanding each option lets you fine-tune agents
            for specific tasks, balancing quality, speed, and cost.
          </p>

          <h2>The AgentConfig Type</h2>
          <p>
            The <code>AgentConfig</code> type defines every parameter your agent accepts. Here is the
            full shape with commonly used fields:
          </p>
          <div className="code-block"><pre><code>{`import { AgentConfig } from '@waymakerai/aicofounder-core';

const config: AgentConfig = {
  name: 'my-agent',
  model: 'gpt-4o',
  provider: 'openai',
  systemPrompt: 'You are a helpful assistant that answers concisely.',
  temperature: 0.7,
  maxTokens: 4096,
  maxSteps: 15,
  tools: [],
  memory: { type: 'sliding-window', maxMessages: 50 },
};`}</code></pre></div>
          <p>
            Each field is optional except <code>name</code> and <code>model</code>. CoFounder applies
            sensible defaults for everything else.
          </p>

          <h2>Model Selection and Providers</h2>
          <p>
            CoFounder supports multiple LLM providers out of the box. You specify the provider and
            model as separate fields, which makes it easy to swap models without changing your agent logic:
          </p>
          <ul>
            <li><strong>OpenAI</strong> -- <code>gpt-4o</code>, <code>gpt-4o-mini</code>, <code>gpt-3.5-turbo</code></li>
            <li><strong>Anthropic</strong> -- <code>claude-sonnet-4-20250514</code>, <code>claude-haiku-4-20250414</code></li>
            <li><strong>Google</strong> -- <code>gemini-pro</code>, <code>gemini-1.5-flash</code></li>
          </ul>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

// Switch providers by changing two fields
const agent = createAgent({
  name: 'flexible-agent',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You are a technical writer.',
  temperature: 0.3,
  maxTokens: 2048,
});`}</code></pre></div>

          <h2>System Prompts and Temperature</h2>
          <p>
            The <code>systemPrompt</code> sets the agent&apos;s persona and behavioral guidelines. Keep it
            focused: tell the agent what it is, what it should do, and any constraints.
          </p>
          <p>
            The <code>temperature</code> parameter controls randomness. Use low values (0.0 -- 0.3) for
            deterministic tasks like code generation or data extraction. Use higher values (0.7 -- 1.0)
            for creative tasks like brainstorming or content writing.
          </p>

          <h2>Token Limits and Step Budgets</h2>
          <p>
            Two limits control how much work an agent does:
          </p>
          <ul>
            <li><code>maxTokens</code> -- The maximum number of tokens in each LLM response. Set this to prevent runaway generation costs.</li>
            <li><code>maxSteps</code> -- The maximum number of observe-think-act cycles the agent can perform. This prevents infinite loops when an agent cannot resolve its task.</li>
          </ul>
          <p>
            For most agents, 10-20 steps is sufficient. Research agents that need to gather many sources
            may need 20-30 steps.
          </p>

          <h2>Tool Definitions in Config</h2>
          <p>
            Tools are passed as an array in the configuration. Each tool object defines a name,
            description, parameter schema, and execute function. We will cover tool creation in depth
            in the next lesson -- for now, here is how they appear in config:
          </p>
          <div className="code-block"><pre><code>{`const config: AgentConfig = {
  name: 'tool-agent',
  model: 'gpt-4o',
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
      execute: async ({ location }) => {
        const data = await fetchWeather(location);
        return JSON.stringify(data);
      },
    },
  ],
};`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-1" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Introduction to Agents
          </Link>
          <Link href="/training/building-agents/lesson-3" className="btn-primary px-6 py-3 group">
            Next: Creating Custom Tools
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
