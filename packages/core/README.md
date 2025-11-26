# @rana/core

> Core SDK for RANA - Rapid AI Native Architecture

The `@rana/core` package provides a unified, type-safe API for working with 9 LLM providers, automatic cost optimization, and intelligent caching.

## Features

- 🤖 **9 LLM Providers** - OpenAI, Anthropic, Google Gemini, xAI, Mistral, Cohere, Together.ai, Groq, Ollama
- 💰 **70% Cost Reduction** - Automatic caching, smart routing, prompt optimization
- 🔄 **Fluent API** - Chainable, intuitive interface
- 📊 **Cost Tracking** - Real-time cost monitoring and statistics
- ⚡ **Caching** - Redis or in-memory caching for faster responses
- 🔌 **Plugin System** - Extend functionality with custom plugins
- 📝 **TypeScript** - Full type safety and IntelliSense support

## Installation

```bash
npm install @rana/core
```

## Quick Start

### Simple Usage

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  }
});

// Simple chat
const response = await rana.chat('Hello, world!');
console.log(response.content);
```

### Fluent API

```typescript
const response = await rana
  .provider('anthropic')
  .model('claude-3-5-sonnet-20241022')
  .optimize('cost')
  .cache(true)
  .chat({ messages: [{ role: 'user', content: 'Hello!' }] });
```

### Shorthand Provider Methods

```typescript
// Anthropic
const response = await rana
  .anthropic()
  .model('claude-3-5-sonnet-20241022')
  .chat({ messages: [...] });

// OpenAI
const response = await rana
  .openai()
  .model('gpt-4o')
  .chat({ messages: [...] });

// Google
const response = await rana
  .google()
  .model('gemini-2.0-flash-exp')
  .chat({ messages: [...] });
```

## Configuration

### TypeScript Config File

Create `rana.config.ts`:

```typescript
import { defineConfig } from '@rana/core';

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY,
  },

  defaults: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 1024,
    optimize: 'balanced',
  },

  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    provider: 'redis',
    redis: {
      url: process.env.REDIS_URL,
    }
  },

  cost_tracking: {
    enabled: true,
    log_to_console: true,
  },

  logging: {
    level: 'info',
    enabled: true,
  },
});
```

### Runtime Configuration

```typescript
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  defaults: {
    optimize: 'cost',
  },
  cache: {
    enabled: true,
    provider: 'memory',
  },
});
```

## Advanced Usage

### Cost Optimization

```typescript
// Optimize for cost (uses cheapest providers)
const response = await rana.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  optimize: 'cost', // Uses Gemini Flash ($0.10/1M)
});

// Optimize for speed (uses fastest providers)
const response = await rana.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  optimize: 'speed', // Uses Groq
});

// Optimize for quality (uses best models)
const response = await rana.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  optimize: 'quality', // Uses Claude 3.5 Sonnet
});
```

### Streaming Responses

```typescript
for await (const chunk of rana.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

### Cost Tracking

```typescript
// Get cost statistics
const stats = await rana.cost.stats();

console.log(`Total spent: $${stats.total_spent.toFixed(2)}`);
console.log(`Total saved: $${stats.total_saved.toFixed(2)}`);
console.log(`Savings: ${stats.savings_percentage.toFixed(0)}%`);
console.log(`Cache hit rate: ${(stats.cache_hit_rate * 100).toFixed(0)}%`);

// Get breakdown by provider
stats.breakdown.forEach(b => {
  console.log(`${b.provider}: $${b.total_cost.toFixed(2)} (${b.percentage.toFixed(0)}%)`);
});

// Reset cost tracking
rana.cost.reset();
```

### Tool Calling (Function Calling)

```typescript
const response = await rana.chat({
  messages: [{ role: 'user', content: 'What is the weather in SF?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get the weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
          },
          required: ['location'],
        },
      },
    },
  ],
});

if (response.tool_calls) {
  console.log('Function to call:', response.tool_calls[0].function.name);
  console.log('Arguments:', response.tool_calls[0].function.arguments);
}
```

### Multimodal (Images)

```typescript
const response = await rana.chat({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/image.jpg',
          },
        },
      ],
    },
  ],
});
```

### Caching

```typescript
// Enable caching for this request
const response = await rana.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  cache: true,
});

console.log('From cache:', response.cached);

// Clear all cache
await rana.clearCache();
```

### Error Handling

```typescript
import { RanaAuthError, RanaRateLimitError, RanaNetworkError } from '@rana/core';

try {
  const response = await rana.chat('Hello!');
} catch (error) {
  if (error instanceof RanaAuthError) {
    console.error('Authentication failed. Check your API key.');
  } else if (error instanceof RanaRateLimitError) {
    console.error('Rate limit exceeded. Please wait or upgrade.');
  } else if (error instanceof RanaNetworkError) {
    console.error('Network error. Check your connection.');
  }
}
```

## Plugin System

### Creating a Plugin

```typescript
import { definePlugin } from '@rana/core';

const loggingPlugin = definePlugin({
  name: 'logging-plugin',

  async onInit(config) {
    console.log('RANA initialized with config:', config);
  },

  async onBeforeRequest(request) {
    console.log('Making request:', request);
    return request;
  },

  async onAfterResponse(response) {
    console.log('Received response:', response.content.substring(0, 50) + '...');
    return response;
  },

  async onError(error) {
    console.error('Error occurred:', error.message);
  },
});

// Use the plugin
await rana.use(loggingPlugin);
```

### Built-in Plugin Examples

```typescript
// Analytics plugin
const analyticsPlugin = definePlugin({
  name: 'analytics',
  async onAfterResponse(response) {
    await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        provider: response.provider,
        cost: response.cost.total_cost,
        latency: response.latency_ms,
      }),
    });
    return response;
  },
});

// Rate limiting plugin
const rateLimitPlugin = definePlugin({
  name: 'rate-limit',
  requestCount: 0,
  maxRequests: 100,

  async onBeforeRequest(request) {
    this.requestCount++;
    if (this.requestCount > this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    return request;
  },
});
```

## Testing Provider Connections

```typescript
// Test a single provider
const isWorking = await rana.test('anthropic');
console.log('Anthropic working:', isWorking);

// Test all providers
const providers = ['anthropic', 'openai', 'google'];
for (const provider of providers) {
  const working = await rana.test(provider);
  console.log(`${provider}: ${working ? '✓' : '✗'}`);
}
```

## API Reference

### RanaClient Methods

- `chat(input: string | RanaChatRequest): Promise<RanaChatResponse>` - Make a chat request
- `stream(input: string | RanaChatRequest): AsyncGenerator<RanaStreamChunk>` - Stream chat responses
- `provider(provider: LLMProvider): RanaChatBuilder` - Create fluent builder
- `anthropic()`, `openai()`, `google()` - Shorthand provider methods
- `cost.stats()` - Get cost statistics
- `cost.reset()` - Reset cost tracking
- `use(plugin: RanaPlugin)` - Register a plugin
- `test(provider: LLMProvider)` - Test provider connection
- `clearCache()` - Clear response cache

### Types

See the full [API Reference](https://rana.dev/api/core) for complete type definitions.

## Examples

See the [examples directory](../../examples) for complete working examples:

- [Simple chat](../../examples/simple-chat)
- [Streaming chat](../../examples/streaming-chat)
- [Cost optimization](../../examples/cost-optimization)
- [Function calling](../../examples/function-calling)
- [Multimodal](../../examples/multimodal)
- [Custom plugins](../../examples/plugins)

## License

MIT © Waymaker
