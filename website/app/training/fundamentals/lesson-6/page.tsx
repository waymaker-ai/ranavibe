import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'React Hooks Deep Dive | RANA Fundamentals',
  description: 'Master RANA React hooks for building interactive AI interfaces',
};

export default function Lesson6Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 6 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>React Hooks Deep Dive</h1>

          <p className="lead">
            RANA provides purpose-built React hooks for AI interactions.
            This lesson covers all available hooks and best practices for
            building responsive AI interfaces.
          </p>

          <h2>Available Hooks</h2>

          <p>RANA provides several hooks for different use cases:</p>

          <ul>
            <li><code>useChat</code> - Full chat interface with history</li>
            <li><code>useCompletion</code> - Single completion requests</li>
            <li><code>useAgent</code> - Agent interactions with tools</li>
            <li><code>useStream</code> - Low-level streaming control</li>
            <li><code>useTokenCount</code> - Real-time token counting</li>
          </ul>

          <h2>useChat Hook</h2>

          <p>
            The most commonly used hook for chat interfaces:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useChat } from '@rana/react';

function ChatComponent() {
  const {
    // Message state
    messages,           // Array of messages
    input,              // Current input value
    setInput,           // Update input

    // Actions
    send,               // Send current input
    append,             // Add message without sending
    reload,             // Regenerate last response
    stop,               // Stop streaming

    // Status
    isLoading,          // Request in progress
    error,              // Error object if any

    // Utilities
    setMessages,        // Override all messages
    clearMessages       // Clear conversation
  } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onFinish: (message) => console.log('Done:', message),
    onError: (error) => console.error('Error:', error)
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} className={m.role}>
          {m.content}
        </div>
      ))}

      <form onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h3>useChat Options</h3>

          <div className="code-block">
            <pre>
              <code>{`const chat = useChat({
  // Required
  api: string,                    // API endpoint

  // Initial state
  initialMessages?: Message[],    // Starting messages
  initialInput?: string,          // Starting input value
  id?: string,                    // Conversation ID

  // Callbacks
  onFinish?: (message: Message) => void,
  onError?: (error: Error) => void,
  onResponse?: (response: Response) => void,

  // Request options
  headers?: Record<string, string>,
  body?: Record<string, any>,     // Extra body params
  credentials?: RequestCredentials,

  // Behavior
  sendExtraMessageFields?: boolean,
  streamMode?: 'text' | 'sse'
});`}</code>
            </pre>
          </div>

          <h2>useCompletion Hook</h2>

          <p>
            For single-shot completions without conversation history:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useCompletion } from '@rana/react';

function CompletionComponent() {
  const {
    completion,    // Current completion text
    input,
    setInput,
    complete,      // Trigger completion
    isLoading,
    error,
    stop
  } = useCompletion({
    api: '/api/complete'
  });

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter prompt..."
      />
      <button onClick={() => complete(input)}>
        Generate
      </button>
      {completion && (
        <div className="result">{completion}</div>
      )}
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>useAgent Hook</h2>

          <p>
            For interactions with agents that use tools:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useAgent } from '@rana/react';

function AgentComponent() {
  const {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error,

    // Agent-specific
    toolCalls,           // Current tool calls
    toolResults,         // Results from tools
    isExecutingTool,     // Tool execution in progress
    currentTool          // Currently executing tool name
  } = useAgent({
    api: '/api/agent',
    onToolCall: async (toolCall) => {
      // Handle tool execution client-side if needed
      console.log('Tool called:', toolCall.name);
    },
    onToolResult: (result) => {
      console.log('Tool result:', result);
    }
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <div className={m.role}>{m.content}</div>
          {m.toolCalls?.map(tc => (
            <div key={tc.id} className="tool-call">
              Calling: {tc.name}
            </div>
          ))}
        </div>
      ))}

      {isExecutingTool && (
        <div className="executing">
          Executing {currentTool}...
        </div>
      )}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={send}>Send</button>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>useStream Hook</h2>

          <p>
            Low-level hook for custom streaming scenarios:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useStream } from '@rana/react';

function CustomStreamComponent() {
  const {
    data,           // Accumulated stream data
    chunks,         // Individual chunks
    isStreaming,
    error,
    start,          // Start streaming
    stop,           // Stop streaming
    reset           // Clear data
  } = useStream<string>({
    url: '/api/stream',
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onComplete: (fullData) => {
      console.log('Stream complete:', fullData);
    }
  });

  return (
    <div>
      <button onClick={() => start({ prompt: 'Hello' })}>
        Start Stream
      </button>
      {isStreaming && <button onClick={stop}>Stop</button>}
      <div>{data}</div>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>useTokenCount Hook</h2>

          <p>
            Real-time token counting for input validation:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useTokenCount } from '@rana/react';

function TokenAwareInput() {
  const [text, setText] = useState('');
  const { count, isLoading } = useTokenCount(text, {
    model: 'claude-sonnet-4-20250514',
    debounce: 300  // Debounce in ms
  });

  const maxTokens = 4000;
  const isOverLimit = count > maxTokens;

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={isOverLimit ? 'error' : ''}
      />
      <div className="token-count">
        {isLoading ? 'Counting...' : \`\${count} / \${maxTokens} tokens\`}
      </div>
      {isOverLimit && (
        <div className="error">
          Input exceeds token limit
        </div>
      )}
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Combining Hooks</h2>

          <p>
            Hooks can be combined for complex interfaces:
          </p>

          <div className="code-block">
            <pre>
              <code>{`function AdvancedChat() {
  const chat = useChat({ api: '/api/chat' });
  const { count } = useTokenCount(chat.input);

  // Calculate total conversation tokens
  const conversationTokens = chat.messages.reduce(
    (acc, m) => acc + (m.tokenCount || 0),
    0
  );

  return (
    <div>
      <div className="stats">
        Conversation: {conversationTokens} tokens
      </div>

      {chat.messages.map(m => (
        <Message key={m.id} message={m} />
      ))}

      <form onSubmit={(e) => { e.preventDefault(); chat.send(); }}>
        <input
          value={chat.input}
          onChange={(e) => chat.setInput(e.target.value)}
        />
        <span>{count} tokens</span>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Optimistic Updates</h2>

          <p>
            Show user messages immediately for better UX:
          </p>

          <div className="code-block">
            <pre>
              <code>{`const chat = useChat({
  api: '/api/chat',
  // Message appears immediately, before API response
  experimental_prepareRequestBody: ({ messages }) => {
    return { messages };
  }
});

// Messages are optimistically added before send completes
// If send fails, the message is removed automatically`}</code>
            </pre>
          </div>

          <h2>Error Handling Patterns</h2>

          <div className="code-block">
            <pre>
              <code>{`function ChatWithErrorHandling() {
  const {
    messages,
    input,
    setInput,
    send,
    error,
    reload  // Retry last message
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      // Log to error tracking service
      trackError(error);
    }
  });

  return (
    <div>
      {messages.map(m => <Message key={m.id} message={m} />)}

      {error && (
        <div className="error-banner">
          <p>Something went wrong: {error.message}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}`}</code>
            </pre>
          </div>

          <h2>Best Practices</h2>

          <ul>
            <li>
              <strong>Use appropriate hooks</strong> - useChat for conversations,
              useCompletion for single requests
            </li>
            <li>
              <strong>Handle loading states</strong> - Always show loading indicators
              during API calls
            </li>
            <li>
              <strong>Implement error handling</strong> - Display errors and provide
              retry options
            </li>
            <li>
              <strong>Debounce token counting</strong> - Prevent excessive API calls
              during typing
            </li>
            <li>
              <strong>Clean up on unmount</strong> - Hooks handle this automatically,
              but be aware of in-flight requests
            </li>
          </ul>

          <h2>What&apos;s Next?</h2>

          <p>
            Now that you&apos;re comfortable with React hooks, the next lesson
            covers state management patterns for complex AI applications.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-5"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: Understanding the LLM Client
          </Link>
          <Link
            href="/training/fundamentals/lesson-7"
            className="btn-primary px-6 py-3 group"
          >
            Next: State Management Patterns
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
