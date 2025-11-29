# RANA Integrations Guide

## Hugging Face Integration

Hugging Face is the GitHub of ML. Integrating deeply gives RANA access to:
- 500k+ models
- 100k+ datasets
- Inference API
- Spaces for demos
- Community reach

### Implementation

```typescript
import { HuggingFace } from '@rana/huggingface';

// Use any HF model
const hf = new HuggingFace({ token: process.env.HF_TOKEN });

// Text generation with open models
const response = await hf.textGeneration({
  model: 'meta-llama/Llama-3.1-70B-Instruct',
  inputs: 'What is the meaning of life?',
});

// Embeddings with open models (FREE!)
const embeddings = await hf.embeddings({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
  inputs: ['Hello world', 'How are you?'],
});

// Zero-shot classification
const classification = await hf.zeroShotClassification({
  model: 'facebook/bart-large-mnli',
  inputs: 'I love this product!',
  candidateLabels: ['positive', 'negative', 'neutral'],
});

// Image generation
const image = await hf.textToImage({
  model: 'stabilityai/stable-diffusion-xl-base-1.0',
  inputs: 'A serene mountain landscape at sunset',
});

// Speech to text
const transcription = await hf.automaticSpeechRecognition({
  model: 'openai/whisper-large-v3',
  data: audioBuffer,
});
```

### Use Cases

1. **Free embeddings** - Use sentence-transformers instead of OpenAI
2. **Open models** - Llama, Mistral without API costs
3. **Specialized models** - Code, medical, legal specific models
4. **Fine-tuned models** - Use your own fine-tuned models
5. **Datasets** - Access training/eval datasets

---

## Model Context Protocol (MCP)

MCP is the future of AI tool integration. Be an early adopter.

### Create MCP Server

```typescript
import { createMCPServer, Tool, Resource } from '@rana/mcp';

const server = createMCPServer({
  name: 'my-company-tools',
  version: '1.0.0',
});

// Add tools
server.addTool({
  name: 'search_customers',
  description: 'Search for customers by name or email',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 10 },
    },
    required: ['query'],
  },
  handler: async ({ query, limit }) => {
    const customers = await db.customers.search(query, limit);
    return { customers };
  },
});

// Add resources
server.addResource({
  uri: 'company://docs/{path}',
  name: 'Company Documentation',
  description: 'Internal documentation and guides',
  handler: async ({ path }) => {
    const content = await readDocs(path);
    return { content, mimeType: 'text/markdown' };
  },
});

// Start server
server.listen({ port: 3100 });
```

### Connect to Claude Code

```json
// ~/.claude/mcp_servers.json
{
  "my-company": {
    "command": "npx",
    "args": ["@mycompany/mcp-server"],
    "env": {
      "API_KEY": "..."
    }
  }
}
```

---

## Observability Stack

### OpenTelemetry (Industry Standard)

```typescript
import { enableTracing } from '@rana/observability';

enableTracing({
  serviceName: 'my-ai-app',
  exporters: ['otlp', 'console'],
  endpoint: process.env.OTEL_ENDPOINT,
});

// Automatic spans for all RANA operations
// - LLM calls with tokens, cost, latency
// - RAG retrieval with results
// - Agent tool calls
// - Memory operations
```

### Integrate with Popular Tools

```typescript
// Datadog
import { DatadogExporter } from '@rana/observability/datadog';
enableTracing({ exporter: new DatadogExporter() });

// New Relic
import { NewRelicExporter } from '@rana/observability/newrelic';
enableTracing({ exporter: new NewRelicExporter() });

// Grafana/Tempo
import { TempoExporter } from '@rana/observability/tempo';
enableTracing({ exporter: new TempoExporter() });

// Honeycomb
import { HoneycombExporter } from '@rana/observability/honeycomb';
enableTracing({ exporter: new HoneycombExporter() });
```

### Custom Dashboard

```bash
# Start local observability dashboard
rana observe

# Opens localhost:4000 with:
# - Request timeline
# - Token usage graphs
# - Cost tracking
# - Error rates
# - Model performance
# - Prompt analytics
```

---

## Vector Databases

### Already Implemented
- Pinecone
- Chroma
- Qdrant

### Add These

```typescript
// Weaviate
import { WeaviateRetriever } from '@rana/rag/weaviate';

// Milvus
import { MilvusRetriever } from '@rana/rag/milvus';

// pgvector (PostgreSQL)
import { PgVectorRetriever } from '@rana/rag/pgvector';

// Supabase Vector
import { SupabaseRetriever } from '@rana/rag/supabase';

// Redis Vector
import { RedisRetriever } from '@rana/rag/redis';

// LanceDB (local, serverless)
import { LanceRetriever } from '@rana/rag/lance';

// Turbopuffer (new, fast)
import { TurbopufferRetriever } from '@rana/rag/turbopuffer';
```

---

## Deployment Platforms

### Vercel

```typescript
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}

// One-click deploy
$ rana deploy vercel

// Automatic:
// - Edge runtime for streaming
// - Serverless functions
// - Environment variables
// - Custom domains
```

### Railway

```typescript
$ rana deploy railway

// Includes:
// - Redis for caching
// - PostgreSQL for persistence
// - Auto-scaling
```

### Fly.io

```typescript
$ rana deploy fly

// Includes:
// - Edge deployment
// - Global distribution
// - SQLite/LiteFS
```

### Docker/Kubernetes

```bash
# Generate production Dockerfile
rana docker:generate

# Generate Helm chart
rana k8s:generate

# Includes:
# - Multi-stage builds
# - Health checks
# - Resource limits
# - Horizontal pod autoscaling
```

---

## Communication Platforms

### Slack

```typescript
import { SlackBot } from '@rana/slack';

const bot = new SlackBot({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

bot.onMessage(async (message, say) => {
  const response = await rana.chat(message.text, {
    context: await bot.getThreadContext(message),
  });
  await say(response);
});

bot.onSlashCommand('/ask', async (command, respond) => {
  const response = await rana.chat(command.text);
  await respond(response);
});

bot.start();
```

### Discord

```typescript
import { DiscordBot } from '@rana/discord';

const bot = new DiscordBot({
  token: process.env.DISCORD_TOKEN,
});

bot.onMessage(async (message) => {
  if (message.mentions.has(bot.user)) {
    const response = await rana.chat(message.content);
    await message.reply(response);
  }
});

bot.start();
```

### Microsoft Teams

```typescript
import { TeamsBot } from '@rana/teams';
// Similar API...
```

---

## Knowledge Bases

### Notion

```typescript
import { NotionLoader } from '@rana/loaders/notion';

const loader = new NotionLoader({
  token: process.env.NOTION_TOKEN,
});

// Load all pages from a database
const docs = await loader.loadDatabase('database-id');

// Index into RAG
await rag.index(docs);

// Sync changes (webhook or polling)
loader.onUpdate(async (page) => {
  await rag.update(page.id, page.content);
});
```

### Confluence

```typescript
import { ConfluenceLoader } from '@rana/loaders/confluence';

const loader = new ConfluenceLoader({
  baseUrl: 'https://company.atlassian.net',
  email: process.env.CONFLUENCE_EMAIL,
  token: process.env.CONFLUENCE_TOKEN,
});

const docs = await loader.loadSpace('ENGINEERING');
```

### GitHub

```typescript
import { GitHubLoader } from '@rana/loaders/github';

const loader = new GitHubLoader({
  token: process.env.GITHUB_TOKEN,
});

// Load repository code
const docs = await loader.loadRepo('owner/repo', {
  include: ['**/*.ts', '**/*.md'],
  exclude: ['node_modules/**', 'dist/**'],
});

// Load issues/discussions
const issues = await loader.loadIssues('owner/repo');
```

---

## Data Processing

### Unstructured.io

```typescript
import { UnstructuredLoader } from '@rana/loaders/unstructured';

// Parse any document type
const loader = new UnstructuredLoader({
  apiKey: process.env.UNSTRUCTURED_API_KEY,
});

// PDFs, Word docs, PowerPoints, images, etc.
const docs = await loader.load('./documents/**/*');
```

### LlamaParse

```typescript
import { LlamaParseLoader } from '@rana/loaders/llamaparse';

// Best-in-class PDF parsing
const loader = new LlamaParseLoader({
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
});

const docs = await loader.load('./documents/*.pdf');
```

---

## Error Tracking

### Sentry

```typescript
import { SentryPlugin } from '@rana/plugins/sentry';

rana.use(SentryPlugin({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  captureAIErrors: true,  // Capture LLM errors with context
}));
```

---

## Analytics

### PostHog

```typescript
import { PostHogPlugin } from '@rana/plugins/posthog';

rana.use(PostHogPlugin({
  apiKey: process.env.POSTHOG_KEY,
  trackUsage: true,
  trackCost: true,
  trackLatency: true,
}));

// Automatic events:
// - ai_request (model, tokens, cost, latency)
// - ai_error (type, message, context)
// - ai_feedback (rating, comment)
```

### Mixpanel

```typescript
import { MixpanelPlugin } from '@rana/plugins/mixpanel';
// Similar API...
```

---

## Billing & Usage

### Stripe

```typescript
import { StripeUsageBilling } from '@rana/billing/stripe';

const billing = new StripeUsageBilling({
  secretKey: process.env.STRIPE_SECRET_KEY,
  priceId: 'price_xxx',  // Usage-based price
});

// Automatically meter AI usage
rana.use(billing.middleware());

// Track usage per customer
await rana.chat('Hello', {
  customerId: 'cus_xxx',  // Stripe customer ID
});
```

---

## Feature Flags

### LaunchDarkly

```typescript
import { LaunchDarklyPlugin } from '@rana/plugins/launchdarkly';

rana.use(LaunchDarklyPlugin({
  sdkKey: process.env.LD_SDK_KEY,
}));

// Feature flag model selection
const model = await rana.flag('ai-model', {
  default: 'gpt-4o-mini',
  user: { key: userId },
});

const response = await rana.chat('Hello', { model });
```

---

## Workflow Automation

### n8n

```typescript
// n8n custom node for RANA
export class RanaNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'RANA',
    name: 'rana',
    group: ['transform'],
    // ...
  };
}
```

### Zapier

```typescript
// Zapier integration
// Triggers: New AI response, Cost threshold, Error
// Actions: Chat, Summarize, Classify, Extract
```

---

## IDE Extensions

### VS Code

```json
// .vscode/extensions.json
{
  "recommendations": ["rana.rana-vscode"]
}
```

Features:
- Prompt syntax highlighting
- Inline cost estimation
- Test runner integration
- Prompt debugging
- Model switching
- Token counting

### JetBrains

Similar plugin for IntelliJ, WebStorm, etc.

---

## CLI Integrations

### GitHub Actions

```yaml
# .github/workflows/ai-tests.yml
name: AI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup RANA
        uses: rana/setup-action@v1
        with:
          version: latest

      - name: Run AI Tests
        run: rana test
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Check Costs
        run: rana cost:check --budget 10.00
```

### GitLab CI

```yaml
# .gitlab-ci.yml
ai-tests:
  script:
    - npx rana test
    - npx rana cost:check --budget 10.00
```

---

## Security Integrations

### Vault (HashiCorp)

```typescript
import { VaultSecrets } from '@rana/secrets/vault';

const secrets = new VaultSecrets({
  address: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

// Auto-rotate API keys
const openaiKey = await secrets.get('openai/api-key');
```

### AWS Secrets Manager

```typescript
import { AWSSecrets } from '@rana/secrets/aws';

const secrets = new AWSSecrets({
  region: 'us-east-1',
});

const anthropicKey = await secrets.get('anthropic-api-key');
```

---

## This is Your Ecosystem

Build these integrations and you have:
- Best developer experience
- Enterprise-ready
- Community ecosystem
- Platform lock-in (the good kind)

**Start with the most requested, add more based on demand.**
