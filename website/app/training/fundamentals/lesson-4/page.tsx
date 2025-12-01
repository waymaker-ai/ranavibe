import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Your First RANA Project | RANA Fundamentals',
  description: 'Build your first AI application with RANA step by step',
};

export default function Lesson4Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 4 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>Your First RANA Project</h1>

          <p className="lead">
            Let&apos;s build a complete AI chat application from scratch. We&apos;ll create
            both the backend API and the React frontend to understand how all
            the pieces fit together.
          </p>

          <h2>What We&apos;re Building</h2>

          <p>
            A simple but production-ready chat application with:
          </p>

          <ul>
            <li>Streaming responses for instant feedback</li>
            <li>Conversation history management</li>
            <li>Error handling and loading states</li>
            <li>A clean, responsive UI</li>
          </ul>

          <h2>Step 1: Create the Agent</h2>

          <p>
            First, let&apos;s define our agent configuration:
          </p>

          <div className="code-block">
            <pre>
              <code>{`// lib/agent.ts
import { Agent } from '@rana/core';

export const chatAgent = new Agent({
  name: 'ChatAssistant',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: \`You are a helpful, friendly assistant.
    Be concise but thorough in your responses.
    If you don't know something, say so honestly.\`,
  temperature: 0.7,
  maxTokens: 1000
});`}</code>
            </pre>
          </div>

          <h2>Step 2: Create the API Route</h2>

          <p>
            Next, create the API endpoint that handles chat requests:
          </p>

          <div className="code-block">
            <pre>
              <code>{`// app/api/chat/route.ts
import { chatAgent } from '@/lib/agent';
import { streamResponse } from '@rana/helpers';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Stream the response
    const stream = chatAgent.stream(messages);

    return streamResponse(stream);
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}`}</code>
            </pre>
          </div>

          <h2>Step 3: Create the Chat Component</h2>

          <p>
            Now let&apos;s build the React component:
          </p>

          <div className="code-block">
            <pre>
              <code>{`// components/Chat.tsx
'use client';

import { useChat } from '@rana/react';
import { useState } from 'react';

export function Chat() {
  const {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error,
    stop
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      send();
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Start a conversation by typing a message below
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={\`flex \${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }\`}
          >
            <div
              className={\`max-w-[80%] rounded-lg px-4 py-2 \${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }\`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Step 4: Add to Your Page</h2>

          <div className="code-block">
            <pre>
              <code>{`// app/page.tsx
import { Chat } from '@/components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        AI Chat Assistant
      </h1>
      <Chat />
    </main>
  );
}`}</code>
            </pre>
          </div>

          <h2>Step 5: Test Your Application</h2>

          <p>
            Start the development server:
          </p>

          <div className="code-block">
            <pre>
              <code>{`npm run dev`}</code>
            </pre>
          </div>

          <p>
            Open http://localhost:3000 and try chatting with your AI assistant!
          </p>

          <h2>How It Works</h2>

          <ol>
            <li>
              <strong>User types a message</strong> - The input is captured by the
              useChat hook
            </li>
            <li>
              <strong>Form submitted</strong> - send() is called, which sends a POST
              request to /api/chat
            </li>
            <li>
              <strong>API processes request</strong> - The agent receives the messages
              and streams a response
            </li>
            <li>
              <strong>Response streams back</strong> - The hook updates messages state
              as chunks arrive
            </li>
            <li>
              <strong>UI updates in real-time</strong> - React re-renders to show the
              streaming response
            </li>
          </ol>

          <h2>Adding Features</h2>

          <h3>Persist Conversation History</h3>

          <div className="code-block">
            <pre>
              <code>{`const { messages } = useChat({
  api: '/api/chat',
  initialMessages: loadSavedMessages(),
  onFinish: (message) => {
    saveMessages([...messages, message]);
  }
});`}</code>
            </pre>
          </div>

          <h3>Add a System Message Toggle</h3>

          <div className="code-block">
            <pre>
              <code>{`const [mode, setMode] = useState<'helpful' | 'creative'>('helpful');

const systemPrompts = {
  helpful: 'You are a helpful, precise assistant.',
  creative: 'You are a creative, imaginative assistant.'
};

// Pass to your API and update agent system prompt`}</code>
            </pre>
          </div>

          <h2>What&apos;s Next?</h2>

          <p>
            Congratulations! You&apos;ve built your first RANA application. In the next
            lesson, we&apos;ll dive deeper into the LLM client and explore advanced
            configuration options.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-3"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: Setting Up Environment
          </Link>
          <Link
            href="/training/fundamentals/lesson-5"
            className="btn-primary px-6 py-3 group"
          >
            Next: Understanding the LLM Client
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
