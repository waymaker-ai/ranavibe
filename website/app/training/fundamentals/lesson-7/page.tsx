import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'State Management Patterns | RANA Fundamentals',
  description: 'Learn effective state management patterns for AI applications',
};

export default function Lesson7Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 7 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>State Management Patterns</h1>

          <p className="lead">
            AI applications have unique state management needs. This lesson covers
            patterns for managing conversations, streaming data, and complex
            multi-agent interactions.
          </p>

          <h2>Conversation State</h2>

          <p>
            RANA hooks manage conversation state internally, but you may need
            additional state for complex applications:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useChat } from '@rana/react';
import { create } from 'zustand';

// Global conversation store
const useConversationStore = create((set, get) => ({
  conversations: {},
  activeId: null,

  createConversation: () => {
    const id = crypto.randomUUID();
    set(state => ({
      conversations: {
        ...state.conversations,
        [id]: { id, messages: [], createdAt: Date.now() }
      },
      activeId: id
    }));
    return id;
  },

  setActive: (id) => set({ activeId: id }),

  updateMessages: (id, messages) => set(state => ({
    conversations: {
      ...state.conversations,
      [id]: { ...state.conversations[id], messages }
    }
  }))
}));

function ChatWithHistory() {
  const { conversations, activeId, updateMessages } = useConversationStore();
  const activeConvo = conversations[activeId];

  const chat = useChat({
    api: '/api/chat',
    initialMessages: activeConvo?.messages || [],
    onFinish: (message) => {
      // Sync to global store
      updateMessages(activeId, [...chat.messages, message]);
    }
  });

  // ... render
}`}</code>
            </pre>
          </div>

          <h2>Streaming State</h2>

          <p>
            Handle streaming data with proper state updates:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useState, useCallback } from 'react';
import { useChat } from '@rana/react';

function StreamingChat() {
  // Track streaming state
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const chat = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      // New message started streaming
      const messageId = response.headers.get('x-message-id');
      setStreamingMessageId(messageId);
    },
    onFinish: () => {
      setStreamingMessageId(null);
    }
  });

  return (
    <div>
      {chat.messages.map(m => (
        <Message
          key={m.id}
          message={m}
          isStreaming={m.id === streamingMessageId}
        />
      ))}
    </div>
  );
}

// Animated message component
function Message({ message, isStreaming }) {
  return (
    <div className={\`message \${isStreaming ? 'streaming' : ''}\`}>
      {message.content}
      {isStreaming && <span className="cursor" />}
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Multi-Agent State</h2>

          <p>
            Coordinating state across multiple agents:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { create } from 'zustand';

interface AgentState {
  agents: Record<string, {
    id: string;
    status: 'idle' | 'thinking' | 'executing' | 'done';
    lastOutput: string | null;
    tools: string[];
  }>;
  pipeline: string[];  // Order of agent execution
  currentStep: number;
}

const useAgentOrchestrator = create<AgentState>((set, get) => ({
  agents: {},
  pipeline: [],
  currentStep: 0,

  registerAgent: (agent) => set(state => ({
    agents: { ...state.agents, [agent.id]: agent }
  })),

  startPipeline: async (input: string) => {
    const { pipeline, agents } = get();

    for (let i = 0; i < pipeline.length; i++) {
      set({ currentStep: i });
      const agentId = pipeline[i];

      // Update agent status
      set(state => ({
        agents: {
          ...state.agents,
          [agentId]: { ...state.agents[agentId], status: 'thinking' }
        }
      }));

      // Execute agent
      const result = await executeAgent(agentId, input);

      // Store result
      set(state => ({
        agents: {
          ...state.agents,
          [agentId]: {
            ...state.agents[agentId],
            status: 'done',
            lastOutput: result
          }
        }
      }));

      // Pass output to next agent
      input = result;
    }
  }
}));`}</code>
            </pre>
          </div>

          <h2>Optimistic Updates</h2>

          <p>
            Show immediate feedback while waiting for AI responses:
          </p>

          <div className="code-block">
            <pre>
              <code>{`function OptimisticChat() {
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  const chat = useChat({
    api: '/api/chat',
    onError: (error) => {
      // Remove optimistic message on error
      setOptimisticMessages([]);
    }
  });

  const handleSend = () => {
    // Add optimistic user message
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: chat.input,
      isOptimistic: true
    };
    setOptimisticMessages([optimisticMsg]);

    // Actually send
    chat.send();
  };

  // Merge optimistic with real messages
  const allMessages = [...chat.messages, ...optimisticMessages];

  return (
    <div>
      {allMessages.map(m => (
        <div
          key={m.id}
          className={m.isOptimistic ? 'opacity-70' : ''}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Persisting State</h2>

          <p>
            Save and restore conversation state:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useChat } from '@rana/react';
import { useEffect } from 'react';

function PersistentChat({ conversationId }) {
  // Load from storage
  const loadMessages = () => {
    const saved = localStorage.getItem(\`chat-\${conversationId}\`);
    return saved ? JSON.parse(saved) : [];
  };

  const chat = useChat({
    api: '/api/chat',
    id: conversationId,
    initialMessages: loadMessages(),
    onFinish: (message) => {
      // Save after each message
      localStorage.setItem(
        \`chat-\${conversationId}\`,
        JSON.stringify(chat.messages)
      );
    }
  });

  // Also save on unmount
  useEffect(() => {
    return () => {
      localStorage.setItem(
        \`chat-\${conversationId}\`,
        JSON.stringify(chat.messages)
      );
    };
  }, [conversationId, chat.messages]);

  return <ChatUI chat={chat} />;
}

// For server-side persistence
async function saveConversation(id: string, messages: Message[]) {
  await fetch('/api/conversations', {
    method: 'PUT',
    body: JSON.stringify({ id, messages })
  });
}`}</code>
            </pre>
          </div>

          <h2>Context Management</h2>

          <p>
            Use React Context for shared AI state:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { createContext, useContext, useState } from 'react';

interface AIContextValue {
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }) {
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [systemPrompt, setSystemPrompt] = useState('You are helpful.');
  const [temperature, setTemperature] = useState(0.7);

  return (
    <AIContext.Provider value={{
      model, setModel,
      systemPrompt, setSystemPrompt,
      temperature, setTemperature
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within AIProvider');
  return context;
}

// Usage in components
function Chat() {
  const { model, systemPrompt, temperature } = useAI();

  const chat = useChat({
    api: '/api/chat',
    body: { model, systemPrompt, temperature }
  });

  // ...
}`}</code>
            </pre>
          </div>

          <h2>Derived State</h2>

          <p>
            Compute values from conversation state:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useMemo } from 'react';
import { useChat } from '@rana/react';

function ChatAnalytics() {
  const chat = useChat({ api: '/api/chat' });

  // Derive analytics from messages
  const analytics = useMemo(() => ({
    totalMessages: chat.messages.length,
    userMessages: chat.messages.filter(m => m.role === 'user').length,
    assistantMessages: chat.messages.filter(m => m.role === 'assistant').length,
    totalTokens: chat.messages.reduce((acc, m) => acc + (m.tokens || 0), 0),
    averageResponseLength: chat.messages
      .filter(m => m.role === 'assistant')
      .reduce((acc, m, _, arr) => acc + m.content.length / arr.length, 0)
  }), [chat.messages]);

  return (
    <div>
      <div className="analytics">
        <span>{analytics.totalMessages} messages</span>
        <span>{analytics.totalTokens} tokens</span>
      </div>
      <ChatUI chat={chat} />
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Best Practices</h2>

          <ul>
            <li>
              <strong>Keep UI state separate from AI state</strong> - Don&apos;t mix
              loading spinners with message content
            </li>
            <li>
              <strong>Use derived state for computed values</strong> - Don&apos;t
              duplicate data that can be calculated
            </li>
            <li>
              <strong>Persist strategically</strong> - Save to localStorage for
              quick access, sync to server for durability
            </li>
            <li>
              <strong>Handle race conditions</strong> - Use IDs to match responses
              to requests when sending multiple messages
            </li>
            <li>
              <strong>Clean up old conversations</strong> - Implement retention
              policies to prevent unbounded storage growth
            </li>
          </ul>

          <h2>What&apos;s Next?</h2>

          <p>
            In the final lesson of this course, we&apos;ll build your first
            complete AI agent that combines everything you&apos;ve learned.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-6"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: React Hooks Deep Dive
          </Link>
          <Link
            href="/training/fundamentals/lesson-8"
            className="btn-primary px-6 py-3 group"
          >
            Next: Building Your First Agent
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
