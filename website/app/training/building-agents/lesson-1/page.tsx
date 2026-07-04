import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Introduction to Agents | Building AI Agents',
  description: 'Learn what AI agents are, how they differ from simple LLM calls, and understand the observe-think-act cycle in CoFounder.',
};

export default function Lesson1Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 1 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Introduction to Agents</h1>
          <p className="lead">
            AI agents go beyond simple prompt-response interactions. They can reason about problems,
            use tools to gather information, and take autonomous actions to accomplish goals. In this
            lesson, you will learn what makes an agent different from a basic LLM call and how
            CoFounder structures agent behavior.
          </p>

          <h2>What Is an AI Agent?</h2>
          <p>
            A simple LLM call takes a prompt, generates a response, and stops. An AI agent, on the
            other hand, operates in a loop. It observes its environment, thinks about what to do next,
            and acts by invoking tools or producing output. This loop continues until the agent
            determines its task is complete.
          </p>
          <p>
            In practical terms, agents can search the web, query databases, run code, call APIs, and
            combine the results before answering. They maintain state across multiple steps and can
            recover from errors mid-task.
          </p>

          <h2>The Observe-Think-Act Cycle</h2>
          <p>
            Every CoFounder agent follows a three-phase cycle:
          </p>
          <ul>
            <li><strong>Observe</strong> -- The agent receives input from the user or from tool results. It reads conversation history and any new context.</li>
            <li><strong>Think</strong> -- The LLM reasons about the current state, decides which tools to call (if any), and plans its next move.</li>
            <li><strong>Act</strong> -- The agent executes tool calls, appends results to its context, and either loops back to observe or returns a final response.</li>
          </ul>
          <p>
            This cycle repeats until the agent produces a final answer or hits a configured step limit.
          </p>

          <h2>Agents vs. Simple LLM Calls</h2>
          <p>
            Here is a basic LLM call using CoFounder -- it sends a message and gets a single response:
          </p>
          <div className="code-block"><pre><code>{`import { createLLMClient } from '@waymakerai/aicofounder-core';

const client = createLLMClient({ provider: 'openai' });

const response = await client.chat({
  messages: [{ role: 'user', content: 'What is React?' }],
});

console.log(response.content);`}</code></pre></div>
          <p>
            Compare that with creating an agent that can use tools and loop autonomously:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'research-assistant',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful research assistant.',
  tools: [searchTool, summarizeTool],
  maxSteps: 10,
});

const result = await agent.run('Find the latest React 19 features and summarize them.');
console.log(result.output);`}</code></pre></div>
          <p>
            The agent automatically decides when to search, when to summarize, and when it has
            enough information to respond.
          </p>

          <h2>CoFounder Agent Architecture</h2>
          <p>
            CoFounder provides a layered architecture for building agents:
          </p>
          <ul>
            <li><strong>Core layer</strong> (<code>@waymakerai/aicofounder-core</code>) -- The LLM client, agent runtime, tool registry, and memory management.</li>
            <li><strong>React layer</strong> (<code>@waymakerai/aicofounder-react</code>) -- Hooks like <code>useAgent</code> and <code>useChat</code> that connect agents to your UI.</li>
            <li><strong>CLI layer</strong> (<code>@waymakerai/aicofounder-cli</code>) -- Scaffolding commands to generate agent boilerplate and test harnesses.</li>
          </ul>
          <p>
            Throughout this course, you will work primarily with the core layer to understand agent
            fundamentals before connecting agents to a React frontend.
          </p>

          <h2>What You Will Build</h2>
          <p>
            Over the next 12 lessons, you will progress from configuring a basic agent to building
            full-featured research and code assistant agents. By the end, you will understand tool
            design, memory management, orchestration, error handling, testing, and production best
            practices.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <span className="text-foreground-secondary text-sm">
            Previous lesson
          </span>
          <Link href="/training/building-agents/lesson-2" className="btn-primary px-6 py-3 group">
            Next: Agent Configuration Deep Dive
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
