# RANA SDK Quick Start Guide

> Get started with the new RANA SDK in 5 minutes

## Installation

```bash
npm install @rana/core @rana/react
```

## 30-Second Example

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

// One line to chat with AI
const response = await rana.chat('Hello!');
console.log(response.content);

// Check your savings
const stats = await rana.cost.stats();
console.log(`Saved: $${stats.total_saved} (${stats.savings_percentage}%)`);
```

## Core Patterns

### 1. Simple Chat
```typescript
const response = await rana.chat('What is TypeScript?');
```

### 2. Fluent API
```typescript
const response = await rana
  .anthropic()
  .optimize('cost')
  .chat('Explain AI');
```

### 3. Provider Switching
```typescript
// Anthropic Claude
const claude = await rana.anthropic().chat('Hello');

// OpenAI GPT-4
const gpt = await rana.openai().chat('Hello');

// Google Gemini
const gemini = await rana.google().chat('Hello');
```

### 4. Cost Tracking
```typescript
const stats = await rana.cost.stats();

console.log(`
💰 Cost Dashboard
━━━━━━━━━━━━━━━━━━━━
Spent:  $${stats.total_spent.toFixed(2)}
Saved:  $${stats.total_saved.toFixed(2)}
Rate:   ${stats.savings_percentage.toFixed(0)}%
`);
```

### 5. Streaming
```typescript
for await (const chunk of rana.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

## React Integration

### Setup
```tsx
import { RanaProvider } from '@rana/react';

function App() {
  return (
    <RanaProvider client={rana}>
      <YourApp />
    </RanaProvider>
  );
}
```

### Use Hooks
```tsx
import { useRanaChat } from '@rana/react';

function ChatComponent() {
  const { chat, response, loading, cost } = useRanaChat(rana);

  return (
    <div>
      <button onClick={() => chat('Hello!')}>
        Send
      </button>
      {loading && <Spinner />}
      {response && <div>{response.content}</div>}
      <div>Cost: ${cost.toFixed(4)}</div>
    </div>
  );
}
```

## Configuration File

Create `rana.config.ts`:

```typescript
import { defineConfig } from '@rana/core';

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  defaults: {
    provider: 'anthropic',
    optimize: 'cost',
  },
  cache: {
    enabled: true,
  },
});
```

## CLI Shortcuts

```bash
# Old way
rana llm:analyze
rana db:migrate
rana security:audit

# New way (one word!)
rana analyze
rana migrate
rana audit
rana optimize
rana fix
```

## Plugin Example

```typescript
import { definePlugin } from '@rana/core';

const myPlugin = definePlugin({
  name: 'analytics',
  async onAfterResponse(response) {
    console.log(`Cost: $${response.cost.total_cost}`);
    return response;
  },
});

await rana.use(myPlugin);
```

## Common Recipes

### Express API
```typescript
import express from 'express';

app.post('/api/chat', async (req, res) => {
  const response = await rana
    .anthropic()
    .optimize('cost')
    .chat(req.body.message);

  res.json({
    content: response.content,
    cost: response.cost.total_cost,
  });
});
```

### Next.js API Route
```typescript
export default async function handler(req, res) {
  const response = await rana.chat(req.body.message);
  res.json(response);
}
```

### Cost Dashboard
```typescript
const stats = await rana.cost.stats();

// Show breakdown
stats.breakdown.forEach(b => {
  console.log(`${b.provider}: $${b.total_cost} (${b.percentage}%)`);
});
```

### Conversation
```tsx
function Chat() {
  const { messages, sendMessage, loading } = useRanaConversation(rana);

  return (
    <div>
      {messages.map(msg => (
        <div className={msg.role}>{msg.content}</div>
      ))}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

## Full Type Safety

```typescript
import type {
  RanaClient,
  RanaChatRequest,
  RanaChatResponse,
  LLMProvider,
  CostStats,
} from '@rana/core';

// Everything is typed
const response: RanaChatResponse = await rana.chat('Hello');
const provider: LLMProvider = 'anthropic';
const stats: CostStats = await rana.cost.stats();
```

## Learn More

- **Full Guide**: [RANA_SDK_GUIDE.md](./RANA_SDK_GUIDE.md)
- **Core Docs**: [packages/core/README.md](./packages/core/README.md)
- **Examples**: [examples/sdk-demo/](./examples/sdk-demo/)
- **Website**: https://rana.dev

## Key Benefits

✅ **70% Cost Savings** - Automatic optimization
✅ **9 LLM Providers** - Switch in one line
✅ **Fluent API** - Chainable, intuitive
✅ **React Hooks** - Easy integration
✅ **TypeScript** - Full type safety
✅ **Plugin System** - Extend easily
✅ **Cost Tracking** - Real-time monitoring
✅ **Caching** - Faster, cheaper responses

## Quick Comparison

### Before (CLI only)
```bash
rana llm:setup
rana llm:analyze
# No programmatic access
```

### After (SDK + CLI)
```typescript
// Use as library
const response = await rana.chat('Hello');

// Or CLI
rana analyze
```

**It's that simple!** 🎉

---

**Questions?** Open an issue or join our [Discord](https://discord.gg/rana)
