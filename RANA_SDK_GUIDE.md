# RANA SDK Guide: Making RANA Like React/Vue.js

> Transform RANA from CLI-only to a full JavaScript framework with fluent APIs, hooks, and one-word commands

## Overview

This guide explains the new **RANA SDK** architecture that makes RANA feel more like modern JavaScript frameworks (React, Vue.js, Express, etc.) with:

✅ **Programmatic API** - Use RANA as a library, not just CLI
✅ **Fluent Interface** - Chainable, intuitive methods
✅ **React Hooks** - `useRanaChat`, `useRanaCost`, etc.
✅ **TypeScript First** - Full type safety and IntelliSense
✅ **One-Word Commands** - Short, memorable CLI shortcuts
✅ **Plugin System** - Extend RANA with custom plugins

---

## Table of Contents

1. [Installation](#installation)
2. [Core SDK (@rana/core)](#core-sdk-ranacore)
3. [React Hooks (@rana/react)](#react-hooks-ranareact)
4. [Configuration as Code](#configuration-as-code)
5. [CLI Improvements](#cli-improvements)
6. [Plugin System](#plugin-system)
7. [Migration Guide](#migration-guide)
8. [Examples](#examples)

---

## Installation

```bash
# Core SDK
npm install @rana/core

# React hooks
npm install @rana/react

# CLI (for commands)
npm install -g @rana/cli
```

---

## Core SDK (@rana/core)

### Simple Usage

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  }
});

// One-liner chat
const response = await rana.chat('Hello, world!');
console.log(response.content);
```

### Fluent API (Chainable)

```typescript
// React/jQuery-style chainable API
const response = await rana
  .provider('anthropic')
  .model('claude-3-5-sonnet-20241022')
  .temperature(0.7)
  .maxTokens(1000)
  .optimize('cost')
  .cache(true)
  .chat({ messages: [{ role: 'user', content: 'Hello!' }] });
```

### Shorthand Methods

```typescript
// Provider shortcuts
const claude = await rana.anthropic().chat('Hello!');
const gpt = await rana.openai().chat('Hello!');
const gemini = await rana.google().chat('Hello!');
```

### Cost Tracking

```typescript
// Get real-time cost statistics
const stats = await rana.cost.stats();

console.log(`Spent: $${stats.total_spent.toFixed(2)}`);
console.log(`Saved: $${stats.total_saved.toFixed(2)} (${stats.savings_percentage}%)`);
console.log(`Cache hit rate: ${(stats.cache_hit_rate * 100).toFixed(0)}%`);

// Breakdown by provider
stats.breakdown.forEach(b => {
  console.log(`${b.provider}: $${b.total_cost} (${b.percentage}%)`);
});
```

### Streaming

```typescript
// Stream responses like modern frameworks
for await (const chunk of rana.stream('Tell me a story')) {
  process.stdout.write(chunk.delta);
}
```

### Global Instance (Optional)

```typescript
// Make RANA globally available (like jQuery's $)
global.rana = createRana({ ... });

// Use anywhere
const response = await rana('What is 2+2?');
```

---

## React Hooks (@rana/react)

### Setup with Provider

```tsx
import { createRana } from '@rana/core';
import { RanaProvider } from '@rana/react';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

function App() {
  return (
    <RanaProvider client={rana}>
      <ChatApp />
    </RanaProvider>
  );
}
```

### useRanaChat Hook

```tsx
import { useRanaChat } from '@rana/react';

function ChatComponent() {
  const { chat, response, loading, error, cost } = useRanaChat(rana, {
    provider: 'anthropic',
    optimize: 'cost',
  });

  const handleSend = async (message: string) => {
    await chat(message);
  };

  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error.message} />}
      {response && <div>{response.content}</div>}
      <p>Cost: ${cost.toFixed(4)}</p>
      <button onClick={() => handleSend('Hello!')}>Send</button>
    </div>
  );
}
```

### useRanaStream Hook

```tsx
import { useRanaStream } from '@rana/react';

function StreamingChat() {
  const { stream, content, loading, done } = useRanaStream(rana);

  const handleStream = async () => {
    await stream('Tell me a long story');
  };

  return (
    <div>
      <div className="message">{content}</div>
      {loading && !done && <TypingIndicator />}
      <button onClick={handleStream}>Start Story</button>
    </div>
  );
}
```

### useRanaCost Hook

```tsx
import { useRanaCost } from '@rana/react';

function CostDashboard() {
  const { stats, loading, refresh } = useRanaCost(rana);

  if (loading) return <Spinner />;
  if (!stats) return null;

  return (
    <div className="dashboard">
      <h2>💰 Cost Tracking</h2>
      <div className="stat">
        <label>Total Spent:</label>
        <span>${stats.total_spent.toFixed(2)}</span>
      </div>
      <div className="stat success">
        <label>Total Saved:</label>
        <span>${stats.total_saved.toFixed(2)} ({stats.savings_percentage.toFixed(0)}%)</span>
      </div>
      <div className="stat">
        <label>Cache Hit Rate:</label>
        <span>{(stats.cache_hit_rate * 100).toFixed(0)}%</span>
      </div>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### useRanaConversation Hook

```tsx
import { useRanaConversation } from '@rana/react';

function ChatInterface() {
  const {
    messages,
    sendMessage,
    clearConversation,
    loading,
  } = useRanaConversation(rana, {
    provider: 'anthropic',
    optimize: 'balanced',
  });

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      {loading && <TypingIndicator />}
      <ChatInput onSend={sendMessage} />
      <button onClick={clearConversation}>Clear</button>
    </div>
  );
}
```

### useRanaOptimize Hook

```tsx
import { useRanaOptimize } from '@rana/react';

function OptimizationPanel() {
  const { savings, recommendations } = useRanaOptimize(rana);

  return (
    <div className="optimization">
      <h3>💡 Optimization Recommendations</h3>
      <div className="savings">
        Potential Savings: ${savings.total.toFixed(2)} ({savings.percentage}%)
      </div>
      <ul className="recommendations">
        {recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Configuration as Code

### TypeScript Config (Recommended)

Create `rana.config.ts`:

```typescript
import { defineConfig } from '@rana/core';

export default defineConfig({
  // Provider API keys
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY,
  },

  // Defaults
  defaults: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 1024,
    optimize: 'balanced',
  },

  // Caching (automatic cost reduction)
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    provider: 'redis', // or 'memory'
    redis: {
      url: process.env.REDIS_URL,
    }
  },

  // Cost tracking
  cost_tracking: {
    enabled: true,
    log_to_console: true,
    save_to_db: false,
  },

  // Logging
  logging: {
    level: 'info',
    enabled: true,
  },
});
```

### JavaScript Config

```javascript
// rana.config.js
export default {
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  defaults: {
    optimize: 'cost',
  },
};
```

### Load Config Automatically

```typescript
import { loadConfig, createRana } from '@rana/core';

// Auto-loads from rana.config.ts or environment
const config = await loadConfig();
const rana = createRana(config);
```

---

## CLI Improvements

### One-Word Commands

```bash
# Current (verbose)
rana llm:analyze
rana db:migrate
rana security:audit

# New (one-word shortcuts)
rana analyze      # Auto-detects LLM analysis
rana migrate      # Auto-detects database
rana audit        # Auto-detects security
rana optimize     # Apply all optimizations
rana fix          # Auto-fix all issues
rana test         # Run all tests
rana check        # Check everything
```

### Interactive Mode

```bash
$ npx create-rana-app

✨ Create RANA App

📦 Project name: my-app
🎨 Template:
  ❯ Next.js + Supabase (recommended)
    React + Firebase
    Vue + Supabase

🤖 LLM Providers:
  ❯ ✓ OpenAI
    ✓ Anthropic
    ○ Google Gemini

💾 Database:
  ❯ Supabase
    Prisma

✅ Creating project...
🎉 Done!

Next steps:
  cd my-app
  rana dev
```

### Smart Commands

```bash
# Development mode with monitoring
rana dev

# Cost analysis with recommendations
rana analyze
> 💰 Total spent: $12.50
> 💵 Saved: $87.50 (70%)
> 💡 Tip: Switch to Gemini Flash for simple tasks → Save $5/day

# One-command optimization
rana optimize
> ✓ Enabled caching on 5 routes
> ✓ Switched 3 endpoints to Gemini Flash
> ✓ Reduced max_tokens from 2000 to 500
> 💰 Estimated savings: $45/month

# Test all providers
rana test
> ✓ Anthropic: OK (120ms)
> ✓ OpenAI: OK (95ms)
> ✗ Google: FAILED (Check API key)
```

---

## Plugin System

### Create a Custom Plugin

```typescript
import { definePlugin } from '@rana/core';

const analyticsPlugin = definePlugin({
  name: 'analytics-plugin',
  version: '1.0.0',

  async onInit(config) {
    console.log('Analytics plugin initialized');
  },

  async onBeforeRequest(request) {
    // Log request
    await logRequest(request);
    return request;
  },

  async onAfterResponse(response) {
    // Track analytics
    await analytics.track('llm_request', {
      provider: response.provider,
      cost: response.cost.total_cost,
      latency: response.latency_ms,
      cached: response.cached,
    });
    return response;
  },

  async onError(error) {
    // Track errors
    await analytics.track('llm_error', {
      error: error.message,
      code: error.code,
    });
  },
});

// Use the plugin
await rana.use(analyticsPlugin);
```

### Example Plugins

```typescript
// Logging plugin
const loggingPlugin = definePlugin({
  name: 'logging',
  async onAfterResponse(response) {
    console.log(`[${response.provider}] $${response.cost.total_cost.toFixed(4)} | ${response.latency_ms}ms`);
    return response;
  },
});

// Rate limiting plugin
const rateLimitPlugin = definePlugin({
  name: 'rate-limit',
  requests: 0,
  maxRequests: 100,

  async onBeforeRequest(request) {
    this.requests++;
    if (this.requests > this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    return request;
  },
});

// Custom caching plugin
const customCachePlugin = definePlugin({
  name: 'custom-cache',
  cache: new Map(),

  async onBeforeRequest(request) {
    const key = JSON.stringify(request.messages);
    if (this.cache.has(key)) {
      return { ...request, __cached: this.cache.get(key) };
    }
    return request;
  },

  async onAfterResponse(response) {
    const key = JSON.stringify(response.raw.messages);
    this.cache.set(key, response);
    return response;
  },
});
```

---

## Migration Guide

### Before (CLI Only)

```bash
# Setup
rana init
rana llm:setup
rana db:setup

# Development
npm run dev

# Check
rana check --verbose

# Deploy
rana deploy
```

### After (SDK + CLI)

```typescript
// 1. Install SDK
import { createRana } from '@rana/core';

// 2. Initialize in code
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

// 3. Use programmatically
const response = await rana.chat('Hello!');

// 4. Use shorter CLI commands
rana dev        // Instead of npm run dev
rana analyze    // Instead of rana llm:analyze
rana optimize   // Instead of rana llm:optimize
```

### From Template to SDK

**Old way (template only):**
```bash
npx create-rana-app my-app
cd my-app
# Everything pre-configured, but hard to customize
```

**New way (SDK + template):**
```bash
npx create-rana-app my-app
cd my-app

# Customize using rana.config.ts
# Use programmatic API alongside template
# Add custom plugins
# Full TypeScript support
```

---

## Examples

### 1. Simple Chat App (Express)

```typescript
import express from 'express';
import { createRana } from '@rana/core';

const app = express();
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const response = await rana
    .anthropic()
    .optimize('cost')
    .chat(message);

  res.json({
    content: response.content,
    cost: response.cost.total_cost,
    cached: response.cached,
  });
});

app.listen(3000);
```

### 2. React Chat Component

```tsx
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, cost } = useRanaChat(rana, {
    optimize: 'cost'
  });

  const [input, setInput] = useState('');

  const handleSend = async () => {
    await chat(input);
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {response && <div>{response.content}</div>}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      <div className="cost">Cost: ${cost.toFixed(4)}</div>
    </div>
  );
}
```

### 3. Cost Dashboard

```typescript
import { createRana } from '@rana/core';

const rana = createRana({ ... });

// Get cost stats
const stats = await rana.cost.stats();

console.log(`
💰 RANA Cost Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Spent:     $${stats.total_spent.toFixed(2)}
Total Saved:     $${stats.total_saved.toFixed(2)}
Savings:         ${stats.savings_percentage.toFixed(0)}%

📊 Provider Breakdown:
${stats.breakdown.map(b =>
  `  ${b.provider.padEnd(12)} $${b.total_cost.toFixed(2)} (${b.percentage.toFixed(0)}%)`
).join('\n')}

⚡ Cache Hit Rate: ${(stats.cache_hit_rate * 100).toFixed(0)}%
📈 Total Requests: ${stats.total_requests}
`);
```

### 4. Custom Plugin

```typescript
const myPlugin = definePlugin({
  name: 'my-custom-plugin',

  async onBeforeRequest(request) {
    // Add custom metadata
    request.metadata = {
      ...request.metadata,
      timestamp: Date.now(),
      userId: getCurrentUser(),
    };
    return request;
  },

  async onAfterResponse(response) {
    // Save to database
    await db.llmRequests.create({
      provider: response.provider,
      cost: response.cost.total_cost,
      latency: response.latency_ms,
      userId: getCurrentUser(),
    });
    return response;
  },
});

await rana.use(myPlugin);
```

---

## Next Steps

1. **Install the SDK**: `npm install @rana/core`
2. **Try the examples**: See `examples/` directory
3. **Read the docs**: Visit https://rana.dev
4. **Join Discord**: https://discord.gg/rana

---

## Summary: Why This is Better

### Before (CLI-only)
❌ CLI commands only, no programmatic API
❌ Configuration in YAML files only
❌ No React/framework integration
❌ Verbose commands (`rana llm:analyze`)
❌ Limited customization

### After (SDK + CLI)
✅ Full programmatic API
✅ Configuration as code (TypeScript)
✅ React hooks, Vue composables
✅ One-word commands (`rana analyze`)
✅ Plugin system for extensions
✅ Fluent, chainable API
✅ TypeScript IntelliSense
✅ Feels like React/Vue.js/Express

---

**Made with ❤️ by Waymaker**

https://rana.dev
