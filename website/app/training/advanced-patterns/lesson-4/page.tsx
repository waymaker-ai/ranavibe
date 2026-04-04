import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Optimistic Updates | Advanced Patterns',
  description: 'Implement optimistic UI for agent responses, rollback strategies, pending state management, and concurrent request handling.',
};

export default function Lesson4Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 4 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Optimistic Updates</h1>
          <p className="lead">
            Users expect instant feedback. Optimistic updates let your UI respond immediately while the agent processes in the background. This lesson covers how to implement optimistic patterns for agent interactions, handle rollbacks when things go wrong, manage pending states, and deal with concurrent requests gracefully.
          </p>

          <h2>Optimistic UI for Agent Responses</h2>
          <p>
            The simplest optimistic update is showing the user&apos;s message in the chat immediately, before the server confirms receipt. But optimistic patterns go deeper with AI agents: you can predict tool call outcomes, pre-render expected UI changes, and show placeholder content that transitions smoothly into the real response.
          </p>
          <div className="code-block"><pre><code>{`import { useAgent } from '@waymakerai/aicofounder-react';
import { useState, useCallback } from 'react';

function OptimisticChat() {
  const [messages, setMessages] = useState<Message[]>([]);

  const { send } = useAgent({
    endpoint: '/api/agent/chat',
    onComplete: (response) => {
      // Replace the optimistic message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === response.requestId
            ? { ...msg, status: 'confirmed', agentReply: response.text }
            : msg
        )
      );
    },
    onError: (error, requestId) => {
      // Mark the optimistic message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === requestId
            ? { ...msg, status: 'failed', error: error.message }
            : msg
        )
      );
    },
  });

  const handleSend = useCallback((text: string) => {
    const requestId = crypto.randomUUID();

    // Optimistically add the user message and a placeholder reply
    setMessages((prev) => [
      ...prev,
      { id: requestId, role: 'user', content: text, status: 'pending' },
      { id: requestId + '-reply', role: 'assistant', content: '', status: 'streaming' },
    ]);

    send(text, { requestId });
  }, [send]);

  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}`}</code></pre></div>

          <h2>Rollback Strategies</h2>
          <p>
            When an optimistic update fails, you need a clear rollback strategy. The three main approaches are: snapshot-based rollback (save the previous state and restore it), reverse-action rollback (apply an inverse operation), and reconciliation (merge the server state with the optimistic state).
          </p>
          <p>
            For agent interactions, snapshot-based rollback works best. Before applying the optimistic update, save the current messages array. If the request fails, restore the snapshot and show an error toast. CoFounder&apos;s <code>useAgent</code> hook supports a <code>rollbackOnError</code> option that handles this automatically.
          </p>

          <h2>Pending State Management</h2>
          <p>
            When a message is in a pending state, the UI should communicate that clearly without being disruptive. Use subtle visual cues: a slightly reduced opacity, a small spinner, or a pulsing indicator. Avoid blocking the entire UI; the user should be able to scroll through history and even queue additional messages while one is pending.
          </p>
          <div className="code-block"><pre><code>{`function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={\`message \${message.status === 'pending' ? 'opacity-80' : ''}\`}>
      <div className="message-content">
        {message.content}
        {message.status === 'pending' && (
          <span className="inline-block ml-2 animate-pulse text-xs text-muted">
            Sending...
          </span>
        )}
        {message.status === 'failed' && (
          <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
            <span>Failed to send</span>
            <button
              onClick={() => retrySend(message.id)}
              className="underline hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}`}</code></pre></div>

          <h2>Concurrent Request Handling</h2>
          <p>
            Users often send multiple messages before the first response arrives. Your application needs to handle this gracefully. The key decisions are: should you queue messages, send them in parallel, or cancel the previous request? CoFounder supports all three strategies via the <code>concurrency</code> option.
          </p>
          <p>
            For chat interfaces, queuing is usually correct: each message depends on the context of previous ones. For independent agent tasks (like generating multiple summaries), parallel execution is more efficient. For search-as-you-type scenarios, cancellation of the previous request makes the most sense.
          </p>

          <h2>Optimistic Tool Call Results</h2>
          <p>
            Advanced optimistic patterns can predict the outcome of tool calls. If an agent is calling a weather API, you can show cached or estimated weather data while the real call completes. CoFounder&apos;s tool registry lets you define <code>optimisticResult</code> functions that produce placeholder data, which gets replaced transparently when the real result arrives.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-3" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Complex State Management
          </Link>
          <Link href="/training/advanced-patterns/lesson-5" className="btn-primary px-6 py-3 group">
            Next: Caching Strategies
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
