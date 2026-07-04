import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advanced Streaming Patterns | Advanced Patterns',
  description: 'Master the ReadableStream API, TransformStreams, backpressure handling, and streaming with the useAgent hook in CoFounder.',
};

export default function Lesson1Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/advanced-patterns" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 1 of 15</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Advanced Streaming Patterns</h1>
          <p className="lead">
            Streaming is the foundation of responsive AI applications. In this lesson you will go beyond basic streaming to master the Web Streams API, implement backpressure handling, and integrate streaming seamlessly with CoFounder&apos;s useAgent hook.
          </p>

          <h2>Understanding the ReadableStream API</h2>
          <p>
            The Web Streams API gives you fine-grained control over how data flows from your LLM provider to the browser. CoFounder&apos;s core package exposes raw ReadableStream instances so you can compose custom pipelines. A ReadableStream consists of an underlying source that produces chunks and a controller that manages the queue.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent } from '@waymakerai/aicofounder-core';

const agent = createAgent({
  model: 'gpt-4o',
  streaming: true,
});

// Get the raw ReadableStream from a completion
const stream = await agent.stream('Explain quantum computing');

const reader = stream.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value, { stream: true });
  process.stdout.write(text);
}`}</code></pre></div>
          <p>
            The key insight is that <code>reader.read()</code> returns a promise that resolves only when data is available. This natural backpressure means your consumer never gets overwhelmed. If your processing is slow, the stream automatically pauses until you call <code>read()</code> again.
          </p>

          <h2>TransformStreams for Data Processing</h2>
          <p>
            TransformStreams sit between a ReadableStream and a WritableStream, letting you modify chunks in flight. This is ideal for parsing SSE data, extracting tool calls, or transforming tokens before they reach the UI.
          </p>
          <div className="code-block"><pre><code>{`// A TransformStream that extracts JSON tool calls from the stream
function createToolCallExtractor() {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      buffer += text;

      // Check for complete tool call JSON
      const toolCallRegex = /\\{\\{tool:(.*?)\\}\\}/g;
      let match;

      while ((match = toolCallRegex.exec(buffer)) !== null) {
        const toolCall = JSON.parse(match[1]);
        controller.enqueue({
          type: 'tool_call',
          data: toolCall,
        });
        buffer = buffer.slice(match.index + match[0].length);
      }

      // Pass through regular text
      if (buffer.length > 0 && !buffer.includes('{{tool:')) {
        controller.enqueue({ type: 'text', data: buffer });
        buffer = '';
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue({ type: 'text', data: buffer });
      }
    },
  });
}`}</code></pre></div>

          <h2>Backpressure Handling</h2>
          <p>
            Backpressure occurs when the consumer cannot keep up with the producer. Without proper handling, memory grows unboundedly. The Streams API has built-in backpressure via the internal queue&apos;s high water mark, but you need to be aware of it when building custom pipelines.
          </p>
          <p>
            CoFounder provides a <code>BufferedStream</code> utility that lets you set explicit watermarks and get notified when the queue is filling up. This is critical when streaming to multiple clients simultaneously or when your UI rendering is expensive.
          </p>
          <div className="code-block"><pre><code>{`import { createAgent, BufferedStream } from '@waymakerai/aicofounder-core';

const agent = createAgent({ model: 'gpt-4o', streaming: true });

// Create a buffered stream with a high water mark of 10 chunks
const buffered = new BufferedStream({
  highWaterMark: 10,
  onPressure: (queueSize) => {
    console.warn(\`Stream queue at \${queueSize} chunks\`);
  },
});

const response = await agent.stream('Write a long essay');
const processed = response.pipeThrough(buffered);

// The useAgent hook handles this automatically
// but for custom implementations you control the flow
const reader = processed.getReader();
for await (const chunk of readerToAsyncIterable(reader)) {
  await renderToDOM(chunk); // slow operation
  // backpressure naturally applied
}`}</code></pre></div>

          <h2>Streaming with the useAgent Hook</h2>
          <p>
            CoFounder&apos;s <code>useAgent</code> hook abstracts away the stream management while still giving you control over the rendering lifecycle. Under the hood it uses a ReadableStream with automatic cancellation when the component unmounts.
          </p>
          <p>
            The hook exposes <code>onChunk</code>, <code>onComplete</code>, and <code>onError</code> callbacks that let you process streaming data at each stage. The <code>onChunk</code> callback fires for each token, letting you implement typewriter effects, syntax highlighting, or progressive rendering.
          </p>

          <h2>Server-Sent Events Setup</h2>
          <p>
            For Next.js applications, Server-Sent Events provide a clean protocol for streaming from your API routes to the client. Unlike WebSockets, SSE works over standard HTTP, passes through proxies and CDNs without configuration, and automatically reconnects on failure.
          </p>
          <p>
            In the next lesson we will take a deep dive into the SSE protocol and build a production-grade SSE endpoint. For now, understand that CoFounder&apos;s streaming layer can target either a raw ReadableStream (for server components and edge functions) or an SSE endpoint (for traditional client-server architectures).
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <span className="text-foreground-secondary text-sm">
            ← Previous lesson
          </span>
          <Link href="/training/advanced-patterns/lesson-2" className="btn-primary px-6 py-3 group">
            Next: Server-Sent Events Deep Dive
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
