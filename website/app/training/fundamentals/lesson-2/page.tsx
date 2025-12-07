import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Core Architecture Overview | RANA Fundamentals',
  description: 'Understanding the architecture and design patterns of RANA',
};

export default function Lesson2Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/training/fundamentals"
            className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 2 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>Core Architecture Overview</h1>

          <p className="lead">
            RANA is built on a layered architecture that separates concerns and
            enables flexibility. Understanding this architecture will help you
            build better applications and extend the framework when needed.
          </p>

          <h2>Architecture Layers</h2>

          <div className="code-block">
            <pre>
              <code>{`┌─────────────────────────────────────────┐
│           Your Application              │
├─────────────────────────────────────────┤
│     @rana/react (Hooks & Components)    │
├─────────────────────────────────────────┤
│     @rana/prompts (Prompt Management)   │
├─────────────────────────────────────────┤
│     @rana/core (LLM Client & Agents)    │
├─────────────────────────────────────────┤
│        LLM Providers (OpenAI, etc)      │
└─────────────────────────────────────────┘`}</code>
            </pre>
          </div>

          <h2>@rana/core - The Foundation</h2>

          <p>
            The core package provides the fundamental building blocks:
          </p>

          <h3>Agent Class</h3>
          <p>
            The Agent class is the primary way to interact with LLMs. It handles
            communication, streaming, retries, and tool execution.
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { Agent } from '@rana/core';

const agent = new Agent({
  name: 'Assistant',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You are a helpful assistant.',
  tools: [searchTool, calculatorTool],
  memory: { type: 'conversation', maxMessages: 50 }
});

// Simple execution
const result = await agent.run('Hello!');

// Streaming execution
for await (const chunk of agent.stream('Tell me a story')) {
  process.stdout.write(chunk.content);
}`}</code>
            </pre>
          </div>

          <h3>Provider Abstraction</h3>
          <p>
            RANA abstracts away provider-specific details, allowing you to switch
            between OpenAI, Anthropic, Google, and other providers seamlessly.
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { configureProviders } from '@rana/core';

configureProviders({
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
  google: { apiKey: process.env.GOOGLE_API_KEY }
});

// Works with any configured provider
const agent = new Agent({ model: 'gpt-4' });        // OpenAI
const agent2 = new Agent({ model: 'claude-sonnet-4-20250514' }); // Anthropic
const agent3 = new Agent({ model: 'gemini-pro' }); // Google`}</code>
            </pre>
          </div>

          <h2>@rana/react - React Integration</h2>

          <p>
            The React package provides hooks that manage state and side effects
            for AI interactions.
          </p>

          <h3>useChat Hook</h3>
          <div className="code-block">
            <pre>
              <code>{`import { useChat } from '@rana/react';

function ChatComponent() {
  const {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
    onFinish: (message) => console.log('Done:', message)
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={send} disabled={isLoading}>Send</button>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h3>useAgent Hook</h3>
          <div className="code-block">
            <pre>
              <code>{`import { useAgent } from '@rana/react';

function AgentComponent() {
  const {
    run,
    result,
    isRunning,
    toolCalls,
    stop
  } = useAgent({
    name: 'ResearchAgent',
    tools: [searchTool]
  });

  return (
    <div>
      <button onClick={() => run('Research AI trends')}>
        Start Research
      </button>
      {toolCalls.map(tc => (
        <div key={tc.id}>Using: {tc.tool}</div>
      ))}
      <div>{result}</div>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>@rana/prompts - Prompt Management</h2>

          <p>
            Enterprise-grade prompt management with versioning, A/B testing,
            and analytics.
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'my-app' });

// Register prompts with versioning
await pm.register('greeting', {
  template: 'Hello {{name}}, how can I help you today?',
  variables: ['name'],
  version: '1.0.0'
});

// Execute with automatic tracking
const result = await pm.execute('greeting', {
  variables: { name: 'John' }
});

// Get analytics
const stats = await pm.getAnalytics('greeting');`}</code>
            </pre>
          </div>

          <h2>Data Flow</h2>

          <p>Understanding how data flows through RANA:</p>

          <ol>
            <li><strong>User Input</strong> - User sends a message via UI</li>
            <li><strong>React Hook</strong> - Hook captures input and manages state</li>
            <li><strong>API Route</strong> - Request sent to your API endpoint</li>
            <li><strong>Agent Processing</strong> - Agent processes with tools/memory</li>
            <li><strong>LLM Request</strong> - Agent sends request to LLM provider</li>
            <li><strong>Streaming Response</strong> - Response streams back through all layers</li>
            <li><strong>UI Update</strong> - React hook updates state, UI re-renders</li>
          </ol>

          <h2>Key Design Patterns</h2>

          <h3>Composition over Inheritance</h3>
          <p>
            RANA favors composition. You build complex agents by combining
            simple, focused components.
          </p>

          <h3>Convention over Configuration</h3>
          <p>
            Sensible defaults everywhere. You can customize anything, but you
            rarely need to.
          </p>

          <h3>Type-Safe by Default</h3>
          <p>
            Everything is fully typed. TypeScript inference works throughout
            the entire stack.
          </p>

          <h2>What&apos;s Next?</h2>

          <p>
            Now that you understand the architecture, let&apos;s set up your
            development environment in the next lesson.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-1"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: What is RANA?
          </Link>
          <Link
            href="/training/fundamentals/lesson-3"
            className="btn-primary px-6 py-3 group"
          >
            Next: Setting Up Your Environment
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
