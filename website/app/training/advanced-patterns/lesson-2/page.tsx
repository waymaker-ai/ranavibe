import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Server-Sent Events Deep Dive | Advanced Patterns',
  description: 'Master the SSE protocol, build Next.js API route SSE endpoints, handle reconnection, and implement custom event types.',
};

export default function Lesson2Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 2 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Server-Sent Events Deep Dive</h1>
          <p className="lead">
            Server-Sent Events are the most practical transport for streaming AI responses to browsers. This lesson covers the protocol internals, building robust SSE endpoints in Next.js, client-side consumption with EventSource, and advanced patterns like custom event types and reconnection handling.
          </p>

          <h2>The SSE Protocol</h2>
          <p>
            SSE is a simple text-based protocol over HTTP. The server sets <code>Content-Type: text/event-stream</code> and sends lines prefixed with <code>data:</code>, <code>event:</code>, <code>id:</code>, or <code>retry:</code>. Each message is terminated by a double newline. The simplicity is its strength: it works through load balancers, CDNs, and reverse proxies without special configuration.
          </p>
          <p>
            Key advantages over WebSockets for AI streaming: automatic reconnection built into the browser API, simpler server implementation, works with HTTP/2 multiplexing, and no need for a separate protocol upgrade handshake.
          </p>

          <h2>Building an SSE Endpoint in Next.js</h2>
          <p>
            CoFounder provides helpers to convert agent streams into SSE-formatted responses. Here is how to set up an SSE endpoint in a Next.js App Router API route that streams agent responses with proper headers and cleanup.
          </p>
          <div className="code-block"><pre><code>{`// app/api/agent/stream/route.ts
import { createAgent } from '@waymakerai/aicofounder-core';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, sessionId } = await req.json();

  const agent = createAgent({
    model: 'gpt-4o',
    streaming: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const response = await agent.stream(prompt, { sessionId });
        const reader = response.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode('event: done\\ndata: {}\\n\\n'));
            controller.close();
            break;
          }
          const data = JSON.stringify({ text: value.content, type: value.type });
          controller.enqueue(encoder.encode(\`data: \${data}\\n\\n\`));
        }
      } catch (error) {
        const errorData = JSON.stringify({ error: error.message });
        controller.enqueue(encoder.encode(\`event: error\\ndata: \${errorData}\\n\\n\`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}`}</code></pre></div>

          <h2>EventSource Client and Reconnection</h2>
          <p>
            The browser&apos;s <code>EventSource</code> API automatically handles reconnection, but it only supports GET requests. For POST-based agent endpoints you need to use the <code>fetch</code> API with a stream reader, or use a library like <code>eventsource-parser</code>. CoFounder&apos;s React package handles this transparently.
          </p>
          <div className="code-block"><pre><code>{`// Using CoFounder's useAgent hook (recommended)
import { useAgent } from '@waymakerai/aicofounder-react';

function ChatStream() {
  const { send, messages, isStreaming } = useAgent({
    endpoint: '/api/agent/stream',
    onChunk: (chunk) => {
      // Process each chunk as it arrives
      console.log('Received:', chunk.text);
    },
    onError: (error) => {
      // Automatic retry with exponential backoff
      console.error('Stream error:', error);
    },
    reconnect: {
      maxRetries: 3,
      backoffMs: 1000,
    },
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {isStreaming && <div className="animate-pulse">Thinking...</div>}
    </div>
  );
}`}</code></pre></div>

          <h2>Custom Event Types</h2>
          <p>
            Beyond simple text streaming, SSE supports named event types. This lets you multiplex different data channels over a single connection: text tokens, tool call notifications, status updates, and metadata all on separate event channels. The client listens for specific event names, keeping your code organized.
          </p>
          <div className="code-block"><pre><code>{`// Server: sending different event types
function sendSSEEvent(controller: ReadableStreamController, event: string, data: any) {
  const encoder = new TextEncoder();
  const payload = \`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`;
  controller.enqueue(encoder.encode(payload));
}

// During streaming, emit typed events:
sendSSEEvent(controller, 'token', { text: 'Hello' });
sendSSEEvent(controller, 'tool_call', { name: 'search', args: { q: 'weather' } });
sendSSEEvent(controller, 'status', { phase: 'reasoning' });
sendSSEEvent(controller, 'metadata', { tokensUsed: 150, model: 'gpt-4o' });
sendSSEEvent(controller, 'done', { totalTokens: 420 });`}</code></pre></div>

          <h2>Production Considerations</h2>
          <p>
            In production, SSE connections need timeout handling, connection cleanup on client disconnect, and proper error boundaries. Set a reasonable timeout (30-60 seconds for most agent tasks), implement heartbeat pings to detect dead connections, and ensure your server cleans up agent resources when the client disconnects. CoFounder&apos;s SSE helpers handle connection lifecycle automatically, including aborting the underlying LLM request when the client closes the connection.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/advanced-patterns/lesson-1" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            ← Previous: Advanced Streaming Patterns
          </Link>
          <Link href="/training/advanced-patterns/lesson-3" className="btn-primary px-6 py-3 group">
            Next: Complex State Management
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
