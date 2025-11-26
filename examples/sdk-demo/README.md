# RANA SDK Demo

Complete example showing all the new SDK features.

## Installation

```bash
npm install
npm run dev
```

## Features Demonstrated

### 1. **Core SDK** (`src/core-examples.ts`)
- Fluent API
- Cost tracking
- Streaming responses
- Provider switching
- Caching

### 2. **React Hooks** (`src/react-examples.tsx`)
- `useRanaChat` - Simple chat
- `useRanaStream` - Streaming chat
- `useRanaCost` - Cost dashboard
- `useRanaConversation` - Full conversation
- `useRanaOptimize` - Optimization suggestions

### 3. **Configuration** (`rana.config.ts`)
- TypeScript configuration
- Provider setup
- Cache configuration
- Cost tracking setup

### 4. **Plugins** (`src/plugins/`)
- Analytics plugin
- Logging plugin
- Custom cache plugin
- Rate limiting plugin

## Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

// Simple usage
const response = await rana.chat('Hello!');
console.log(response.content);

// Fluent API
const response = await rana
  .anthropic()
  .optimize('cost')
  .chat('Hello!');

// Cost tracking
const stats = await rana.cost.stats();
console.log(`Saved: $${stats.total_saved} (${stats.savings_percentage}%)`);
```

## React Example

```tsx
import { useRanaChat } from '@rana/react';

function ChatComponent() {
  const { chat, response, loading, cost } = useRanaChat(rana);

  return (
    <div>
      {response && <div>{response.content}</div>}
      <button onClick={() => chat('Hello!')}>Send</button>
      <div>Cost: ${cost.toFixed(4)}</div>
    </div>
  );
}
```

## Files

- `src/core-examples.ts` - Core SDK examples
- `src/react-examples.tsx` - React hooks examples
- `src/plugins/` - Custom plugins
- `rana.config.ts` - TypeScript configuration
- `package.json` - Dependencies

## Learn More

- [RANA SDK Guide](../../RANA_SDK_GUIDE.md)
- [Core API Reference](../../packages/core/README.md)
- [React Hooks Reference](../../packages/react/README.md)
