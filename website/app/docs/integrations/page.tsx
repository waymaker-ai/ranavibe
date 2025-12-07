'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Database, BarChart3, AlertCircle, Cloud, Box } from 'lucide-react';

const integrations = [
  {
    icon: Box,
    title: 'Hugging Face',
    description: 'Use any Hugging Face model with RANA',
    code: `import { HuggingFaceProvider } from '@rana/integrations/huggingface';

const hf = new HuggingFaceProvider({
  apiKey: process.env.HF_API_KEY,
  defaultModel: 'mistralai/Mistral-7B-Instruct-v0.2'
});

// Use as a provider
const result = await hf.chat({
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Use specific models
const embedding = await hf.embed(
  'Your text here',
  { model: 'sentence-transformers/all-MiniLM-L6-v2' }
);

// Use in agents
const agent = new Agent({
  provider: hf,
  model: 'meta-llama/Llama-2-70b-chat-hf'
});`,
  },
  {
    icon: Database,
    title: 'Supabase',
    description: 'Vector storage and RAG with Supabase',
    code: `import { SupabaseVectorStore } from '@rana/integrations/supabase';

const vectorStore = new SupabaseVectorStore({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  tableName: 'documents',
  embeddingColumn: 'embedding'
});

// Store vectors
await vectorStore.upsert([
  {
    id: 'doc-1',
    content: 'Your document text',
    metadata: { source: 'manual' }
  }
]);

// Similarity search
const results = await vectorStore.search(
  'search query',
  { limit: 5, threshold: 0.7 }
);

// Use with RAG
const rag = new RAGPipeline({
  vectorStore,
  retriever: { topK: 5 }
});`,
  },
  {
    icon: BarChart3,
    title: 'Weights & Biases',
    description: 'Experiment tracking and model monitoring',
    code: `import { WandBIntegration } from '@rana/integrations/wandb';

const wandb = new WandBIntegration({
  apiKey: process.env.WANDB_API_KEY,
  project: 'my-ai-app',
  entity: 'my-team'
});

// Log experiments
await wandb.logRun({
  name: 'prompt-v2',
  config: {
    model: 'gpt-4',
    temperature: 0.7,
    prompt_version: 'v2'
  }
});

// Log metrics
await wandb.logMetrics({
  accuracy: 0.95,
  latency: 1200,
  cost: 0.05
});

// Log artifacts
await wandb.logArtifact({
  name: 'prompts',
  type: 'dataset',
  data: promptTemplates
});

// Compare runs
const comparison = await wandb.compareRuns(['run-1', 'run-2']);`,
  },
  {
    icon: AlertCircle,
    title: 'Sentry',
    description: 'Error tracking and performance monitoring',
    code: `import { SentryIntegration } from '@rana/integrations/sentry';

const sentry = new SentryIntegration({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 1.0
});

// Automatic error capture
sentry.captureException(error, {
  tags: { model: 'gpt-4', feature: 'chat' },
  extra: { prompt: userMessage }
});

// Transaction tracing
const transaction = sentry.startTransaction({
  name: 'AI Request',
  op: 'ai.chat'
});

const span = transaction.startChild({
  op: 'ai.completion',
  description: 'OpenAI completion'
});

// ... do work ...

span.finish();
transaction.finish();

// Use as middleware
agent.use(sentry.middleware());`,
  },
  {
    icon: Cloud,
    title: 'AWS Bedrock',
    description: 'Use AWS Bedrock models with RANA',
    code: `import { BedrockProvider } from '@rana/integrations/aws-bedrock';

const bedrock = new BedrockProvider({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Use Claude on Bedrock
const result = await bedrock.chat({
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Use Titan embeddings
const embedding = await bedrock.embed(
  'Your text here',
  { model: 'amazon.titan-embed-text-v1' }
);

// Streaming
const stream = bedrock.stream({
  model: 'anthropic.claude-3-haiku-20240307-v1:0',
  messages: [{ role: 'user', content: 'Tell me a story' }]
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}`,
  },
  {
    icon: Link2,
    title: 'MCP (Model Context Protocol)',
    description: 'Connect to any MCP-compatible tool server',
    code: `import { MCPClient, MCPServer } from '@rana/integrations/mcp';

// Connect to MCP server
const client = new MCPClient({
  serverUrl: 'http://localhost:3001',
  capabilities: ['tools', 'resources']
});

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool('search', {
  query: 'latest news'
});

// Create your own MCP server
const server = new MCPServer({
  name: 'my-tools',
  version: '1.0.0'
});

server.addTool({
  name: 'calculate',
  description: 'Perform calculations',
  inputSchema: { expression: { type: 'string' } },
  handler: async ({ expression }) => {
    return eval(expression);
  }
});

server.addResource({
  name: 'config',
  description: 'Application configuration',
  handler: async () => {
    return { theme: 'dark', language: 'en' };
  }
});

await server.start(3001);`,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Link2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Integrations</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Connect RANA with your favorite tools and services. Hugging Face, Supabase,
            Weights & Biases, Sentry, AWS Bedrock, and MCP support.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/integrations
          </div>
        </motion.div>

        {/* Integrations */}
        <div className="space-y-12">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <integration.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{integration.title}</h2>
                  <p className="text-foreground-secondary">{integration.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{integration.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* All Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">All Available Integrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Hugging Face',
              'Supabase',
              'Weights & Biases',
              'Sentry',
              'AWS Bedrock',
              'Azure OpenAI',
              'Google Vertex',
              'MCP Protocol',
              'LangSmith',
              'Datadog',
              'New Relic',
              'Grafana'
            ].map((name) => (
              <div
                key={name}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium"
              >
                {name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
