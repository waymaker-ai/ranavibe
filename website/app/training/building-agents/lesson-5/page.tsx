import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Memory and Context Management | Building AI Agents',
  description: 'Master conversation history, context windows, token counting, summarization strategies, and persistent memory with Supabase.',
};

export default function Lesson5Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/building-agents" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 5 of 12</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Memory and Context Management</h1>
          <p className="lead">
            Agents need memory to maintain coherent conversations and build on previous interactions.
            But context windows are finite and expensive. This lesson covers strategies for managing
            what your agent remembers, from simple sliding windows to persistent storage with Supabase.
          </p>

          <h2>Understanding Context Windows</h2>
          <p>
            Every LLM has a context window -- the maximum number of tokens it can process in a single
            request. This includes the system prompt, conversation history, tool definitions, tool
            results, and the model&apos;s response. When your context exceeds the window, you lose
            information.
          </p>
          <ul>
            <li><strong>GPT-4o</strong> -- 128K tokens context window</li>
            <li><strong>Claude Sonnet</strong> -- 200K tokens context window</li>
            <li><strong>Gemini 1.5</strong> -- Up to 1M tokens context window</li>
          </ul>
          <p>
            Even with large windows, more context means higher cost and slower responses. Effective
            memory management keeps context lean and relevant.
          </p>

          <h2>Sliding Window Strategy</h2>
          <p>
            The simplest approach is a sliding window that keeps the most recent N messages. CoFounder
            makes this easy to configure:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  name: 'chat-agent',
  model: 'gpt-4o',
  memory: {
    type: 'sliding-window',
    maxMessages: 40,
    // Always keep the system prompt and first user message
    preserveFirst: true,
  },
});`}</code></pre></div>
          <p>
            The sliding window works well for conversational agents where recent context matters most.
            The downside is that information from early in the conversation is lost permanently.
          </p>

          <h2>Summarization Strategy</h2>
          <p>
            For longer conversations, CoFounder can automatically summarize older messages into a
            compact summary that preserves key facts:
          </p>
          <div className="code-block"><pre><code>{`const agent = createAgent({
  name: 'long-conversation-agent',
  model: 'gpt-4o',
  memory: {
    type: 'summarize',
    maxMessages: 30,
    summarizeAfter: 20, // Summarize when history exceeds 20 messages
    summaryModel: 'gpt-4o-mini', // Use a cheaper model for summaries
    summaryPrompt: 'Summarize the key facts, decisions, and open questions from this conversation.',
  },
});`}</code></pre></div>
          <p>
            When the message count exceeds <code>summarizeAfter</code>, CoFounder takes the oldest
            messages, generates a summary, and replaces them with a single summary message. The
            most recent messages are kept intact.
          </p>

          <h2>Token Counting</h2>
          <p>
            CoFounder provides built-in token counting so you can monitor context usage and make
            informed decisions about when to trim:
          </p>
          <div className="code-block"><pre><code>{`import { countTokens, estimateCost } from '@waymakerai/aicofounder-core';

// Count tokens in a message array
const tokenCount = countTokens(agent.getHistory(), 'gpt-4o');
console.log(\`Current context: \${tokenCount} tokens\`);

// Estimate cost before running
const cost = estimateCost({
  model: 'gpt-4o',
  inputTokens: tokenCount,
  estimatedOutputTokens: 500,
});
console.log(\`Estimated cost: $\${cost.toFixed(4)}\`);`}</code></pre></div>

          <h2>Persistent Memory with Supabase</h2>
          <p>
            For agents that need to remember information across sessions, CoFounder integrates with
            Supabase to store and retrieve conversation history and key facts:
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, SupabaseMemory } from '@waymakerai/aicofounder-core';

const memory = new SupabaseMemory({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
  table: 'agent_memory',
  userId: 'user-123',
});

const agent = createAgent({
  name: 'persistent-agent',
  model: 'gpt-4o',
  memory: {
    type: 'persistent',
    store: memory,
    loadOnStart: true, // Load previous conversation on initialization
    saveInterval: 'after-each-step', // Save after every agent step
  },
});

// The agent remembers previous conversations with this user
const result = await agent.run('What did we discuss last time?');`}</code></pre></div>
          <p>
            Persistent memory is essential for customer support agents, personal assistants, and
            any agent that interacts with users over multiple sessions.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/building-agents/lesson-4" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Tool Execution Patterns
          </Link>
          <Link href="/training/building-agents/lesson-6" className="btn-primary px-6 py-3 group">
            Next: Multi-Tool Agents
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
