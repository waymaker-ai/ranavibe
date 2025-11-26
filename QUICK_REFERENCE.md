# RANA Quick Reference Card

One-page reference for common RANA operations.

---

## 📦 Installation

```bash
npm install @rana/core @rana/react
```

---

## ⚡ Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('Hello!');
console.log(response.content);
```

---

## 🎯 Common Patterns

### Simple Chat
```typescript
const response = await rana.chat('What is TypeScript?');
```

### Provider Shortcuts
```typescript
const claude = await rana.anthropic().chat('Hello!');
const gpt = await rana.openai().chat('Hello!');
const gemini = await rana.google().chat('Hello!');
```

### Fluent API
```typescript
const response = await rana
  .provider('anthropic')
  .model('claude-3-5-sonnet-20241022')
  .temperature(0.7)
  .optimize('cost')
  .cache(true)
  .chat('Hello!');
```

### Streaming
```typescript
for await (const chunk of rana.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

---

## ⚛️ React Hooks

```tsx
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana);
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
const responses = await batchProcess(rana, ['Q1', 'Q2', 'Q3']);
```

---

## 📋 Presets & Templates

```typescript
// Use preset
const rana = createRana(getPreset('costOptimized'));

// Use template
const request = getTemplate('summarize', text, 200);
```

---

## 🔌 CLI Commands

```bash
rana dashboard    # Real-time cost monitoring
rana analyze      # Project analysis
rana optimize     # Auto-optimization
```

---

**Full docs:** [RANA_SDK_GUIDE.md](./RANA_SDK_GUIDE.md)
