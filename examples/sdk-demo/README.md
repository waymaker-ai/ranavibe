# CoFounder SDK Demo

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
- `useCoFounderChat` - Simple chat
- `useCoFounderStream` - Streaming chat
- `useCoFounderCost` - Cost dashboard
- `useCoFounderConversation` - Full conversation
- `useCoFounderOptimize` - Optimization suggestions

### 3. **Configuration** (`cofounder.config.ts`)
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
import { createCoFounder } from '@waymakerai/aicofounder-core';

const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

// Simple usage
const response = await cofounder.chat('Hello!');
console.log(response.content);

// Fluent API
const response = await cofounder
  .anthropic()
  .optimize('cost')
  .chat('Hello!');

// Cost tracking
const stats = await cofounder.cost.stats();
console.log(`Saved: $${stats.total_saved} (${stats.savings_percentage}%)`);
```

## React Example

```tsx
import { useCoFounderChat } from '@waymakerai/aicofounder-react';

function ChatComponent() {
  const { chat, response, loading, cost } = useCoFounderChat(cofounder);

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
- `cofounder.config.ts` - TypeScript configuration
- `package.json` - Dependencies

## Learn More

- [CoFounder SDK Guide](../../CoFounder_SDK_GUIDE.md)
- [Core API Reference](../../packages/core/README.md)
- [React Hooks Reference](../../packages/react/README.md)
