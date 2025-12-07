import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Understanding the LLM Client | RANA Fundamentals',
  description: 'Deep dive into the RANA LLM client configuration and capabilities',
};

export default function Lesson5Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 5 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>Understanding the LLM Client</h1>

          <p className="lead">
            The LLM client is the core of RANA&apos;s interaction with AI models.
            This lesson covers configuration, provider switching, and advanced
            options for optimizing your AI applications.
          </p>

          <h2>The LLMClient Class</h2>

          <p>
            RANA provides a unified client that abstracts away provider differences:
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { LLMClient } from '@rana/core';

// Create a client with default settings
const client = new LLMClient({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Or use auto-detection based on env vars
const autoClient = LLMClient.auto();`}</code>
            </pre>
          </div>

          <h2>Configuration Options</h2>

          <p>
            The client accepts numerous configuration options:
          </p>

          <div className="code-block">
            <pre>
              <code>{`const client = new LLMClient({
  // Required
  provider: 'anthropic' | 'openai' | 'google' | 'azure',
  model: string,

  // Authentication
  apiKey: string,
  baseURL?: string,        // For custom endpoints
  organization?: string,   // OpenAI org ID

  // Request defaults
  temperature?: number,    // 0.0 - 1.0
  maxTokens?: number,      // Max response tokens
  topP?: number,           // Nucleus sampling
  topK?: number,           // Top-k sampling

  // Timeouts and retries
  timeout?: number,        // Request timeout (ms)
  maxRetries?: number,     // Auto-retry count
  retryDelay?: number,     // Delay between retries

  // Advanced
  stream?: boolean,        // Default streaming mode
  cache?: CacheConfig,     // Response caching
  rateLimit?: RateLimitConfig
});`}</code>
            </pre>
          </div>

          <h2>Making Requests</h2>

          <h3>Basic Chat Completion</h3>

          <div className="code-block">
            <pre>
              <code>{`const response = await client.chat({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing.' }
  ]
});

console.log(response.content);
console.log(response.usage); // { inputTokens, outputTokens, totalTokens }`}</code>
            </pre>
          </div>

          <h3>Streaming Responses</h3>

          <div className="code-block">
            <pre>
              <code>{`const stream = client.stream({
  messages: [
    { role: 'user', content: 'Write a short story about robots.' }
  ]
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

// Or collect all chunks
const fullResponse = await stream.collect();`}</code>
            </pre>
          </div>

          <h3>With Tool Calling</h3>

          <div className="code-block">
            <pre>
              <code>{`const response = await client.chat({
  messages: [
    { role: 'user', content: 'What is the weather in Tokyo?' }
  ],
  tools: [{
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }]
});

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(call.name, call.arguments);
  }
}`}</code>
            </pre>
          </div>

          <h2>Provider-Specific Features</h2>

          <h3>Anthropic-Specific</h3>

          <div className="code-block">
            <pre>
              <code>{`const client = new LLMClient({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  // Anthropic-specific options
  anthropicBeta: ['prompt-caching-2024-07-31'],
  cacheControl: true
});

// Use prompt caching for repeated system prompts
const response = await client.chat({
  messages: [
    {
      role: 'system',
      content: longSystemPrompt,
      cacheControl: { type: 'ephemeral' }
    },
    { role: 'user', content: 'User query here' }
  ]
});`}</code>
            </pre>
          </div>

          <h3>OpenAI-Specific</h3>

          <div className="code-block">
            <pre>
              <code>{`const client = new LLMClient({
  provider: 'openai',
  model: 'gpt-4o',
  // OpenAI-specific options
  organization: 'org-xxxxx',
  responseFormat: { type: 'json_object' }
});

// Use JSON mode
const response = await client.chat({
  messages: [
    { role: 'user', content: 'Return a JSON object with name and age' }
  ],
  responseFormat: { type: 'json_object' }
});`}</code>
            </pre>
          </div>

          <h2>Error Handling</h2>

          <div className="code-block">
            <pre>
              <code>{`import { LLMError, RateLimitError, AuthError } from '@rana/core';

try {
  const response = await client.chat({ messages });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    await delay(error.retryAfter);
    return client.chat({ messages });
  }
  if (error instanceof AuthError) {
    console.error('Check your API key');
  }
  if (error instanceof LLMError) {
    console.error('LLM error:', error.code, error.message);
  }
  throw error;
}`}</code>
            </pre>
          </div>

          <h2>Caching Responses</h2>

          <p>
            Enable caching to reduce costs and latency for repeated queries:
          </p>

          <div className="code-block">
            <pre>
              <code>{`const client = new LLMClient({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  cache: {
    enabled: true,
    ttl: 3600,              // 1 hour
    storage: 'redis',       // or 'memory', 'file'
    keyPrefix: 'llm-cache:'
  }
});

// Responses are automatically cached
const response1 = await client.chat({ messages });
const response2 = await client.chat({ messages }); // From cache`}</code>
            </pre>
          </div>

          <h2>Rate Limiting</h2>

          <p>
            Built-in rate limiting prevents API throttling:
          </p>

          <div className="code-block">
            <pre>
              <code>{`const client = new LLMClient({
  provider: 'openai',
  model: 'gpt-4o',
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000,
    strategy: 'sliding-window'  // or 'fixed-window'
  }
});

// Requests are automatically queued and throttled`}</code>
            </pre>
          </div>

          <h2>Switching Providers</h2>

          <p>
            RANA makes it easy to switch between providers:
          </p>

          <div className="code-block">
            <pre>
              <code>{`// Factory function for easy switching
function createClient(provider: 'anthropic' | 'openai' | 'google') {
  const configs = {
    anthropic: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      apiKey: process.env.ANTHROPIC_API_KEY
    },
    openai: {
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY
    },
    google: {
      provider: 'google',
      model: 'gemini-pro',
      apiKey: process.env.GOOGLE_API_KEY
    }
  };

  return new LLMClient(configs[provider]);
}

// Switch based on env or config
const client = createClient(process.env.LLM_PROVIDER as any);`}</code>
            </pre>
          </div>

          <h2>Best Practices</h2>

          <ul>
            <li>
              <strong>Reuse clients</strong> - Create one client instance and reuse it
              rather than creating new ones for each request
            </li>
            <li>
              <strong>Set appropriate timeouts</strong> - Longer for complex queries,
              shorter for simple ones
            </li>
            <li>
              <strong>Use streaming for long responses</strong> - Better UX and allows
              early termination
            </li>
            <li>
              <strong>Enable caching for repeated queries</strong> - Significant cost
              savings for common requests
            </li>
            <li>
              <strong>Handle errors gracefully</strong> - Implement proper retry logic
              with exponential backoff
            </li>
          </ul>

          <h2>What&apos;s Next?</h2>

          <p>
            Now that you understand the LLM client, the next lesson covers
            RANA&apos;s React hooks for building interactive AI interfaces.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-4"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: Your First RANA Project
          </Link>
          <Link
            href="/training/fundamentals/lesson-6"
            className="btn-primary px-6 py-3 group"
          >
            Next: React Hooks Deep Dive
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
