# Getting Started with RANA

> **Build Production AI Apps in Minutes, Not Months**

Welcome to RANA (Rapid AI Native Architecture) - the complete AI development framework that makes enterprise AI accessible to everyone.

## 🚀 5-Minute Quick Start

### 1. Install RANA CLI

```bash
npm install -g @rana/cli
```

### 2. Initialize Your Project

```bash
# Create new project
npx create-rana-app my-ai-app
cd my-ai-app

# Or add to existing project
rana init
```

### 3. Configure Your LLM Provider

```bash
# Interactive setup
rana llm:setup

# Or set environment variables
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Start Building

```bash
# Generate code from natural language
rana generate "create a React component for user profile"

# Run the development server
npm run dev
```

---

## 📦 What's Included

RANA 2025 comes with three powerful packages:

### @rana/helpers - Quick LLM Functions

One-line AI operations for common tasks:

```typescript
import { summarize, translate, classify, extract } from '@rana/helpers';

// Summarize text
const summary = await summarize(longText, { style: 'brief' });

// Translate content
const french = await translate(text, { to: 'french' });

// Classify into categories
const category = await classify(text, ['spam', 'ham', 'promotion']);

// Extract structured data
const data = await extract(text, {
  name: 'string',
  email: 'string',
  phone: 'string?'
});
```

All helpers include:
- 🔄 Automatic caching
- ⚡ Provider fallback
- 📊 Cost tracking
- 🔁 Retry logic

### @rana/prompts - Prompt Management

Enterprise-grade prompt versioning and A/B testing:

```typescript
import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'my-app' });

// Register prompts
await pm.register('greeting', {
  template: 'Hello {{name}}, how can I help you today?',
  variables: ['name'],
});

// Execute with tracking
const result = await pm.execute('greeting', {
  variables: { name: 'John' },
});

// A/B test prompts
const testId = await pm.createABTest('greeting', {
  name: 'Greeting Style Test',
  variants: [
    { name: 'formal', template: 'Good day, {{name}}.' },
    { name: 'casual', template: 'Hey {{name}}!' },
  ],
  metric: 'user_satisfaction',
});
```

### @rana/rag - Advanced RAG

Production-ready retrieval augmented generation:

```typescript
import { RAGPresets, createRAGPipeline } from '@rana/rag';

// Use a preset
const pipeline = RAGPresets.balanced();

// Index your documents
await pipeline.index([
  { id: 'doc1', content: 'Your documentation...' },
  { id: 'doc2', content: 'More content...' },
]);

// Query with citations
const result = await pipeline.query({
  query: 'How do I configure authentication?',
});

console.log(result.answer);
console.log(result.citations);
```

---

## 🛠️ CLI Commands

### Essential Commands

```bash
# Initialize project
rana init

# Check compliance
rana check

# Auto-fix issues
rana fix

# View dashboard
rana dashboard

# Run diagnostics
rana doctor
```

### Code Generation

```bash
# Generate from natural language
rana generate "create a user authentication API"

# List templates
rana generate:templates

# Interactive mode
rana generate:interactive
```

### LLM Management

```bash
# Setup providers
rana llm:setup

# Compare pricing
rana llm:compare

# Analyze usage
rana llm:analyze

# Cost estimation
rana cost:estimate
```

### Database Operations

```bash
# Setup database
rana db:setup

# Run migrations
rana db:migrate

# Open Prisma Studio
rana db:studio
```

### Security & SEO

```bash
# Security audit
rana security:audit

# SEO check
rana seo:check

# Generate sitemap
rana seo:generate
```

---

## 🎯 Common Use Cases

### 1. Build a Chatbot

```typescript
import { PromptManager } from '@rana/prompts';
import { RAGPresets } from '@rana/rag';

// Setup RAG for knowledge base
const rag = RAGPresets.chat();
await rag.index(documents);

// Setup prompt management
const pm = new PromptManager({ workspace: 'chatbot' });

await pm.register('chat', {
  template: `Context: {{context}}

Question: {{question}}

Provide a helpful, accurate response based on the context.`,
});

// Handle user query
async function handleQuery(question: string) {
  const ragResult = await rag.query({ query: question });

  const response = await pm.execute('chat', {
    variables: {
      context: ragResult.citations.map(c => c.text).join('\n'),
      question,
    },
  });

  return {
    answer: response.response,
    sources: ragResult.sources,
  };
}
```

### 2. Content Generation

```typescript
import { generate, rewrite, summarize } from '@rana/helpers';

// Generate blog post
const blog = await generate('Write a blog post about AI trends', {
  type: 'blog',
  length: 'long',
});

// Rewrite for different audiences
const technical = await rewrite(blog, { style: 'technical' });
const simple = await rewrite(blog, { style: 'simple' });

// Create summary for social
const tweet = await summarize(blog, {
  style: 'bullet',
  maxLength: 280,
});
```

### 3. Data Extraction

```typescript
import { extract, classify } from '@rana/helpers';

// Extract structured data from emails
const emailData = await extract(email, {
  sender: 'string',
  subject: 'string',
  intent: 'string',
  urgency: 'high | medium | low',
  actionRequired: 'boolean',
});

// Classify and route
const category = await classify(email, [
  'support',
  'sales',
  'billing',
  'feedback',
]);
```

---

## 💰 Cost Optimization

RANA helps you reduce LLM costs by up to 70%:

```bash
# Analyze current costs
rana llm:analyze

# Get optimization suggestions
rana optimize

# Compare provider pricing
rana cost:compare

# Estimate costs for usage scenarios
rana cost:estimate --scenario enterprise
```

### Built-in Optimizations

- **Smart Caching**: Automatic response caching reduces redundant calls
- **Model Routing**: Use cheaper models for simple tasks
- **Token Optimization**: Prompt compression and efficient formatting
- **Fallback Chains**: Automatic failover between providers

---

## 📊 Monitoring & Analytics

```typescript
// Get prompt analytics
const analytics = await pm.getAnalytics('greeting', 'week');
console.log(analytics.executions);
console.log(analytics.avgLatency);
console.log(analytics.totalCost);

// Get usage report
const report = await pm.getUsageReport();
console.log(report.totalCost);
console.log(report.topPrompts);
```

---

## 🔧 Configuration

### .rana.yml

```yaml
version: "2.0"
name: my-ai-app

providers:
  primary: anthropic
  fallback: openai

models:
  default: claude-sonnet-4
  fast: gpt-4o-mini
  reasoning: claude-opus-4

optimization:
  caching: true
  costAlerts: true
  maxCostPerDay: 100

monitoring:
  enabled: true
  sampleRate: 1.0
```

---

## 📚 Learn More

- **Documentation**: https://rana.dev/docs
- **API Reference**: https://rana.dev/api
- **Examples**: https://github.com/rana-framework/examples
- **Discord**: https://discord.gg/rana

---

## 🆘 Getting Help

```bash
# View all commands
rana --help

# Get command help
rana <command> --help

# Run diagnostics
rana doctor

# Check project status
rana status
```

---

## 🎉 What's New in 2025

- **@rana/helpers** - 10 one-line AI functions
- **@rana/prompts** - Enterprise prompt management with A/B testing
- **@rana/rag** - Advanced RAG with hybrid retrieval and re-ranking
- **Natural Language Code Generation** - `rana generate` command
- **Process Intelligence** - Velocity metrics and legacy analysis
- **Enhanced Cost Tracking** - Per-request cost estimation

---

Made with ❤️ by [Waymaker](https://hatchworks.com)

**RANA** - Rapid AI Native Architecture
