# CoFounder Quick Reference Card

One-page reference for common CoFounder operations.

---

## 📦 Installation

```bash
npm install @cofounder/core @cofounder/react
```

---

## ⚡ Quick Start

```typescript
import { createCoFounder } from '@cofounder/core';

const cofounder = createCoFounder({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await cofounder.chat('Hello!');
console.log(response.content);
```

---

## 🎯 Common Patterns

### Simple Chat
```typescript
const response = await cofounder.chat('What is TypeScript?');
```

### Provider Shortcuts
```typescript
const claude = await cofounder.anthropic().chat('Hello!');
const gpt = await cofounder.openai().chat('Hello!');
const gemini = await cofounder.google().chat('Hello!');
```

### Fluent API
```typescript
const response = await cofounder
  .provider('anthropic')
  .model('claude-3-5-sonnet-20241022')
  .temperature(0.7)
  .optimize('cost')
  .cache(true)
  .chat('Hello!');
```

### Streaming
```typescript
for await (const chunk of cofounder.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

---

## ⚛️ React Hooks

```tsx
import { useCoFounderChat } from '@cofounder/react';

function ChatApp() {
  const { chat, response, loading, cost } = useCoFounderChat(cofounder);
  return <div>{response?.content}</div>;
}
```

---

## 🛠️ Utility Helpers

```typescript
// Compare providers
const comparison = await compareProviders(['anthropic', 'openai'], 'Question', keys);

// Find cheapest
const { provider, cost } = await findCheapestProvider('Question', keys);

// Batch process
const responses = await batchProcess(cofounder, ['Q1', 'Q2', 'Q3']);
```

---

## 📋 Presets & Templates

```typescript
// Use preset
const cofounder = createCoFounder(getPreset('costOptimized'));

// Use template
const request = getTemplate('summarize', text, 200);
```

---

## 🔌 CLI Commands

```bash
cofounder dashboard    # Real-time cost monitoring
cofounder analyze      # Project analysis
cofounder optimize     # Auto-optimization
```

---

**Full docs:** [CoFounder_SDK_GUIDE.md](./CoFounder_SDK_GUIDE.md)
