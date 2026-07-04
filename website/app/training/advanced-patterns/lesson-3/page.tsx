import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Complex State Management | Advanced Patterns',
  description: 'Learn agent state machines, useReducer patterns, global agent state with context, and state persistence strategies.',
};

export default function Lesson3Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 3 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Complex State Management</h1>
          <p className="lead">
            AI agents produce complex, evolving state: conversation histories, tool call results, streaming tokens, error states, and metadata. This lesson teaches you how to model agent state as finite state machines, use useReducer for predictable updates, share state globally, and persist it across sessions.
          </p>

          <h2>Agent State Machines</h2>
          <p>
            An agent session moves through well-defined states: idle, thinking, streaming, executing tools, waiting for user input, and error. Modeling these as an explicit state machine prevents impossible states (like streaming and idle simultaneously) and makes your UI logic clearer.
          </p>
          <div className="code-block"><pre><code>{`// Define agent states and transitions
type AgentState =
  | { status: 'idle' }
  | { status: 'thinking'; startedAt: number }
  | { status: 'streaming'; tokens: string[]; startedAt: number }
  | { status: 'tool_executing'; toolName: string; args: Record<string, any> }
  | { status: 'awaiting_input'; prompt: string }
  | { status: 'error'; error: Error; lastGoodState: AgentState }
  | { status: 'complete'; result: string; metadata: AgentMetadata };

type AgentAction =
  | { type: 'START_THINKING' }
  | { type: 'START_STREAMING' }
  | { type: 'RECEIVE_TOKEN'; token: string }
  | { type: 'EXECUTE_TOOL'; toolName: string; args: Record<string, any> }
  | { type: 'REQUEST_INPUT'; prompt: string }
  | { type: 'COMPLETE'; result: string; metadata: AgentMetadata }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };`}</code></pre></div>

          <h2>useReducer Patterns for Agents</h2>
          <p>
            The <code>useReducer</code> hook is a natural fit for agent state because it centralizes all state transitions into a single reducer function. Each action maps to exactly one state transition, making the logic testable and predictable.
          </p>
          <div className="code-block"><pre><code>{`import { useReducer, useCallback } from 'react';
import { useAgent } from '@waymakerai/aicofounder-react';

function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'START_THINKING':
      if (state.status !== 'idle' && state.status !== 'complete') return state;
      return { status: 'thinking', startedAt: Date.now() };

    case 'START_STREAMING':
      if (state.status !== 'thinking') return state;
      return { status: 'streaming', tokens: [], startedAt: state.startedAt };

    case 'RECEIVE_TOKEN':
      if (state.status !== 'streaming') return state;
      return { ...state, tokens: [...state.tokens, action.token] };

    case 'EXECUTE_TOOL':
      return { status: 'tool_executing', toolName: action.toolName, args: action.args };

    case 'COMPLETE':
      return { status: 'complete', result: action.result, metadata: action.metadata };

    case 'ERROR':
      return { status: 'error', error: action.error, lastGoodState: state };

    case 'RESET':
      return { status: 'idle' };

    default:
      return state;
  }
}

function useAgentWithState() {
  const [state, dispatch] = useReducer(agentReducer, { status: 'idle' });

  const agent = useAgent({
    onStart: () => dispatch({ type: 'START_THINKING' }),
    onStream: () => dispatch({ type: 'START_STREAMING' }),
    onChunk: (chunk) => dispatch({ type: 'RECEIVE_TOKEN', token: chunk.text }),
    onToolCall: (tool) => dispatch({ type: 'EXECUTE_TOOL', toolName: tool.name, args: tool.args }),
    onComplete: (result) => dispatch({ type: 'COMPLETE', result: result.text, metadata: result.metadata }),
    onError: (error) => dispatch({ type: 'ERROR', error }),
  });

  return { state, agent };
}`}</code></pre></div>

          <h2>Global Agent State with Context</h2>
          <p>
            When multiple components need access to the same agent state, React Context provides a clean solution. Create an AgentProvider that wraps your application and exposes both the current state and dispatch function. This is especially useful for showing agent status in headers, sidebars, or notification areas while the main chat interface handles the conversation.
          </p>
          <p>
            CoFounder&apos;s <code>AgentProvider</code> component handles this pattern out of the box, but understanding the underlying mechanism lets you customize it for complex layouts where agent state drives multiple disconnected UI regions.
          </p>

          <h2>State Persistence</h2>
          <p>
            For production applications, agent state must survive page refreshes and reconnections. CoFounder integrates with Supabase to persist conversation history and agent state. The key decision is what to persist: full token-level history is expensive, so most applications persist message-level state and rebuild the streaming UI from the last complete message on reload.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const agent = createAgent({
  model: 'gpt-4o',
  persistence: {
    adapter: 'supabase',
    client: supabase,
    table: 'agent_sessions',
    // Persist after each complete message, not each token
    strategy: 'message',
    // Auto-restore on reconnection
    restoreOnInit: true,
  },
});

// State is automatically saved after each agent turn
const result = await agent.run('What were we discussing?');
// Agent has full context from previous messages`}</code></pre></div>

          <h2>Debugging State Transitions</h2>
          <p>
            Complex state machines benefit from logging and visualization. Wrap your reducer with a logging middleware that records every transition. In development, CoFounder&apos;s debug mode outputs a state timeline you can inspect in the browser console, showing every state change with timestamps, making it easy to trace bugs in multi-step agent workflows.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-2" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Server-Sent Events Deep Dive
          </Link>
          <Link href="/training/advanced-patterns/lesson-4" className="btn-primary px-6 py-3 group">
            Next: Optimistic Updates
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
