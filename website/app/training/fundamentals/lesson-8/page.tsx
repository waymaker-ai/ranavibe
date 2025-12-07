import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Building Your First Agent | RANA Fundamentals',
  description: 'Create a complete AI agent with tools, memory, and error handling',
};

export default function Lesson8Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 8 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>Building Your First Agent</h1>

          <p className="lead">
            In this capstone lesson, you&apos;ll build a complete AI agent that
            can search the web, perform calculations, and remember context
            across conversations.
          </p>

          <h2>What We&apos;re Building</h2>

          <p>
            A research assistant agent that can:
          </p>

          <ul>
            <li>Search the web for information</li>
            <li>Perform mathematical calculations</li>
            <li>Remember previous interactions</li>
            <li>Handle errors gracefully</li>
          </ul>

          <h2>Step 1: Define the Tools</h2>

          <div className="code-block">
            <pre>
              <code>{`// lib/tools.ts
import { Tool, z } from '@rana/core';

export const searchTool = new Tool({
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(5)
  }),
  execute: async ({ query, maxResults }) => {
    // In production, use a real search API
    const response = await fetch(
      \`https://api.search.example/search?q=\${encodeURIComponent(query)}&limit=\${maxResults}\`
    );
    const data = await response.json();
    return data.results.map(r => ({
      title: r.title,
      snippet: r.snippet,
      url: r.url
    }));
  }
});

export const calculatorTool = new Tool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression to evaluate, e.g., "2 + 2 * 3"')
  }),
  execute: async ({ expression }) => {
    // Safe math evaluation
    const result = Function(\`"use strict"; return (\${expression})\`)();
    return { expression, result };
  }
});

export const memoryTool = new Tool({
  name: 'remember',
  description: 'Store information for later recall',
  parameters: z.object({
    key: z.string().describe('Key to store the information under'),
    value: z.string().describe('Information to remember')
  }),
  execute: async ({ key, value }, context) => {
    // Store in agent memory
    context.memory.set(key, value);
    return { stored: true, key };
  }
});

export const recallTool = new Tool({
  name: 'recall',
  description: 'Retrieve previously stored information',
  parameters: z.object({
    key: z.string().describe('Key to retrieve')
  }),
  execute: async ({ key }, context) => {
    const value = context.memory.get(key);
    return value ? { found: true, value } : { found: false };
  }
});`}</code>
            </pre>
          </div>

          <h2>Step 2: Create the Agent</h2>

          <div className="code-block">
            <pre>
              <code>{`// lib/research-agent.ts
import { Agent } from '@rana/core';
import { searchTool, calculatorTool, memoryTool, recallTool } from './tools';

export const researchAgent = new Agent({
  name: 'ResearchAssistant',
  model: 'claude-sonnet-4-20250514',

  systemPrompt: \`You are a helpful research assistant with access to web search,
a calculator, and memory capabilities.

Guidelines:
- Use web_search for current events or facts you're unsure about
- Use calculator for any mathematical operations
- Use remember to store important information the user might need later
- Use recall to retrieve previously stored information
- Always cite your sources when providing information from search
- Be honest when you don't know something\`,

  tools: [searchTool, calculatorTool, memoryTool, recallTool],

  // Agent configuration
  temperature: 0.7,
  maxTokens: 2000,
  maxToolCalls: 10,  // Prevent infinite loops

  // Memory configuration
  memory: {
    type: 'session',  // or 'persistent'
    maxItems: 100
  },

  // Error handling
  onToolError: async (error, toolCall, context) => {
    console.error(\`Tool \${toolCall.name} failed:\`, error);
    return {
      error: true,
      message: \`The \${toolCall.name} tool encountered an error. Please try again or use an alternative approach.\`
    };
  }
});`}</code>
            </pre>
          </div>

          <h2>Step 3: Create the API Route</h2>

          <div className="code-block">
            <pre>
              <code>{`// app/api/agent/route.ts
import { researchAgent } from '@/lib/research-agent';
import { streamResponse } from '@rana/helpers';

export async function POST(request: Request) {
  try {
    const { messages, sessionId } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Run agent with session context
    const stream = researchAgent.stream(messages, {
      sessionId,  // For memory persistence
      metadata: {
        userId: request.headers.get('x-user-id'),
        timestamp: Date.now()
      }
    });

    return streamResponse(stream, {
      // Include tool calls in stream
      includeToolCalls: true,
      // Format for frontend consumption
      format: 'sse'
    });
  } catch (error) {
    console.error('Agent error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}`}</code>
            </pre>
          </div>

          <h2>Step 4: Build the Frontend</h2>

          <div className="code-block">
            <pre>
              <code>{`// components/ResearchAgent.tsx
'use client';

import { useAgent } from '@rana/react';
import { useState } from 'react';

export function ResearchAgent() {
  const [sessionId] = useState(() => crypto.randomUUID());

  const {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error,
    toolCalls,
    isExecutingTool,
    currentTool
  } = useAgent({
    api: '/api/agent',
    body: { sessionId }
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Research Assistant</h1>

      {/* Messages */}
      <div className="space-y-4 mb-4 max-h-[500px] overflow-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={\`p-4 rounded-lg \${
              message.role === 'user'
                ? 'bg-blue-100 ml-12'
                : 'bg-gray-100 mr-12'
            }\`}
          >
            {/* Message content */}
            <div className="prose">{message.content}</div>

            {/* Tool calls */}
            {message.toolCalls?.map((tc) => (
              <div key={tc.id} className="mt-2 p-2 bg-gray-200 rounded text-sm">
                <span className="font-mono">🔧 {tc.name}</span>
                <pre className="text-xs mt-1">
                  {JSON.stringify(tc.arguments, null, 2)}
                </pre>
              </div>
            ))}

            {/* Tool results */}
            {message.toolResults?.map((tr) => (
              <div key={tr.id} className="mt-2 p-2 bg-green-100 rounded text-sm">
                <span className="font-mono">✓ Result</span>
                <pre className="text-xs mt-1">
                  {JSON.stringify(tr.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-4 bg-gray-50 rounded-lg mr-12">
            {isExecutingTool ? (
              <span className="animate-pulse">
                Executing {currentTool}...
              </span>
            ) : (
              <span className="animate-pulse">Thinking...</span>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !isLoading) {
            send();
          }
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Suggestions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['What\\'s the weather today?', 'Calculate 15% tip on $85', 'Remember my name is Alex'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Step 5: Add to Your App</h2>

          <div className="code-block">
            <pre>
              <code>{`// app/page.tsx
import { ResearchAgent } from '@/components/ResearchAgent';

export default function Home() {
  return (
    <main className="min-h-screen py-12">
      <ResearchAgent />
    </main>
  );
}`}</code>
            </pre>
          </div>

          <h2>Testing Your Agent</h2>

          <p>Try these interactions to test all features:</p>

          <ol>
            <li>
              <strong>Web Search:</strong> &quot;What are the latest developments in AI?&quot;
            </li>
            <li>
              <strong>Calculator:</strong> &quot;What is 234 * 567 + 890?&quot;
            </li>
            <li>
              <strong>Memory:</strong> &quot;Remember that my favorite color is blue&quot;
            </li>
            <li>
              <strong>Recall:</strong> &quot;What is my favorite color?&quot;
            </li>
            <li>
              <strong>Multi-step:</strong> &quot;Search for the current Bitcoin price
              and calculate how much 0.5 BTC is worth&quot;
            </li>
          </ol>

          <h2>What You&apos;ve Learned</h2>

          <div className="card bg-background-secondary my-6">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Created custom tools with validation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Configured an agent with multiple capabilities</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Built a streaming API endpoint</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Created a React frontend with useAgent hook</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Implemented error handling and loading states</span>
              </li>
            </ul>
          </div>

          <h2>Next Steps</h2>

          <p>
            Congratulations on completing RANA Fundamentals! You now have a solid
            foundation for building AI applications. Here&apos;s what to explore next:
          </p>

          <ul>
            <li>
              <strong>Building AI Agents</strong> - Deep dive into advanced agent
              patterns and orchestration
            </li>
            <li>
              <strong>Advanced Patterns</strong> - Learn caching, rate limiting,
              and optimization techniques
            </li>
            <li>
              <strong>Production Deployment</strong> - Deploy, monitor, and scale
              your agents
            </li>
          </ul>

          <div className="card bg-gradient-subtle mt-8">
            <h3 className="text-xl font-bold mb-4">Course Complete!</h3>
            <p className="text-foreground-secondary mb-4">
              You&apos;ve completed all 8 lessons in RANA Fundamentals. You&apos;re now
              ready to build production AI applications.
            </p>
            <div className="flex gap-4">
              <Link href="/training/building-agents" className="btn-primary">
                Continue to Building Agents
              </Link>
              <Link href="/docs" className="btn-secondary">
                Explore Documentation
              </Link>
            </div>
          </div>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-7"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: State Management Patterns
          </Link>
          <Link
            href="/training/building-agents"
            className="btn-primary px-6 py-3"
          >
            Next Course: Building AI Agents
          </Link>
        </div>
      </div>
    </div>
  );
}
