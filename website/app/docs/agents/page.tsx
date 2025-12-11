'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Wrench, MessageSquare, GitBranch, Repeat, Zap, Radio, Send } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Creating Agents',
    description: 'Build autonomous AI agents with tools and memory',
    code: `import { Agent } from '@rana/core';

const agent = new Agent({
  name: 'ResearchAssistant',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: \`You are a helpful research assistant.
    You can search the web, read documents, and summarize findings.\`,
  memory: {
    type: 'conversation',
    maxMessages: 50
  }
});

// Simple execution
const result = await agent.run('Find the latest AI research papers');

// Streaming execution
for await (const chunk of agent.stream('Summarize this article...')) {
  process.stdout.write(chunk.content);
}`,
  },
  {
    icon: Wrench,
    title: 'Tools & Functions',
    description: 'Give agents access to custom tools and APIs',
    code: `import { Agent, Tool } from '@rana/core';

// Define custom tools
const searchTool = new Tool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: {
    query: { type: 'string', description: 'Search query' },
    maxResults: { type: 'number', default: 5 }
  },
  handler: async ({ query, maxResults }) => {
    const results = await searchAPI.search(query, maxResults);
    return results.map(r => r.snippet).join('\\n');
  }
});

const calculatorTool = new Tool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    expression: { type: 'string', description: 'Math expression' }
  },
  handler: async ({ expression }) => {
    return eval(expression).toString();
  }
});

// Create agent with tools
const agent = new Agent({
  name: 'Assistant',
  model: 'claude-sonnet-4-20250514',
  tools: [searchTool, calculatorTool]
});

// Agent will automatically use tools as needed
const result = await agent.run('What is 25% of $1,234?');`,
  },
  {
    icon: MessageSquare,
    title: 'Conversation Management',
    description: 'Multi-turn conversations with context management',
    code: `import { Agent, Conversation } from '@rana/core';

const agent = new Agent({
  name: 'ChatBot',
  model: 'claude-sonnet-4-20250514'
});

// Create a conversation
const conversation = new Conversation({
  agent,
  userId: 'user-123',
  metadata: { channel: 'web' }
});

// Multi-turn conversation
await conversation.send('Hello, I need help with my order');
// "Hi! I'd be happy to help. What's your order number?"

await conversation.send('It\\'s ORDER-12345');
// "Let me look that up for you..."

await conversation.send('Can you change the shipping address?');
// "Of course! What's the new address?"

// Get conversation history
const history = conversation.getHistory();

// Clear and start fresh
conversation.clear();`,
  },
  {
    icon: GitBranch,
    title: 'Multi-Agent Systems',
    description: 'Orchestrate multiple agents working together',
    code: `import { Agent, AgentOrchestrator } from '@rana/core';

// Define specialized agents
const researcher = new Agent({
  name: 'Researcher',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You research and gather information.'
});

const writer = new Agent({
  name: 'Writer',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You write clear, engaging content.'
});

const reviewer = new Agent({
  name: 'Reviewer',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You review and improve content.'
});

// Create orchestrator
const orchestrator = new AgentOrchestrator({
  agents: { researcher, writer, reviewer },
  workflow: [
    { agent: 'researcher', output: 'research' },
    { agent: 'writer', input: 'research', output: 'draft' },
    { agent: 'reviewer', input: 'draft', output: 'final' }
  ]
});

// Run the workflow
const result = await orchestrator.run(
  'Write a blog post about quantum computing'
);

console.log(result.final);  // The reviewed blog post`,
  },
  {
    icon: Repeat,
    title: 'Agent Loops',
    description: 'Iterative agents that refine their output',
    code: `import { Agent, AgentLoop } from '@rana/core';

const agent = new Agent({
  name: 'CodeWriter',
  model: 'claude-sonnet-4-20250514',
  tools: [runTestsTool, lintTool]
});

// Create an iterative loop
const loop = new AgentLoop({
  agent,
  maxIterations: 5,
  stopCondition: async (result) => {
    // Stop when tests pass
    const testResult = await runTests(result.code);
    return testResult.passed;
  },
  onIteration: (iteration, result) => {
    console.log(\`Iteration \${iteration}: \${result.status}\`);
  }
});

// Run until success or max iterations
const result = await loop.run(
  'Write a function that sorts an array of objects by date'
);

console.log(result.iterations);  // How many attempts
console.log(result.code);        // Final code`,
  },
  {
    icon: Zap,
    title: 'Streaming & Events',
    description: 'Real-time streaming and event handling',
    code: `import { Agent } from '@rana/core';

const agent = new Agent({
  name: 'Assistant',
  model: 'claude-sonnet-4-20250514',
  tools: [searchTool]
});

// Stream with events
const stream = agent.stream('Research AI trends', {
  onToolCall: (tool, args) => {
    console.log(\`Calling tool: \${tool.name}\`);
  },
  onToolResult: (tool, result) => {
    console.log(\`Tool result: \${result.slice(0, 100)}...\`);
  },
  onThinking: (thought) => {
    console.log(\`Thinking: \${thought}\`);
  }
});

// Process the stream
for await (const chunk of stream) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'tool_use') {
    console.log(\`Using tool: \${chunk.tool}\`);
  }
}`,
  },
  {
    icon: Radio,
    title: 'Agent Messaging Protocol',
    description: 'Type-safe pub/sub and request/response communication between agents',
    code: `import { createMessageBroker, createChannel } from '@rana/agents';

// Create a message broker
const broker = createMessageBroker({
  deliveryGuarantee: 'at-least-once',
  enableRetry: true,
  maxRetries: 3
});

// Define typed channels
const taskChannel = createChannel<{ task: string; priority: number }>({
  name: 'tasks',
  type: 'topic',
  schema: { task: 'string', priority: 'number' }
});

// Subscribe to messages
broker.subscribe(taskChannel, async (message, context) => {
  console.log(\`Received task: \${message.payload.task}\`);
  await context.acknowledge();
});

// Publish messages with priority
await broker.publish(taskChannel, {
  task: 'Analyze user data',
  priority: 1
}, { priority: 'high' });`,
  },
  {
    icon: Send,
    title: 'Request/Response Channels',
    description: 'Synchronous request-response patterns for agent coordination',
    code: `import { createRequestChannel, createMessageBroker } from '@rana/agents';

// Create request/response channel
const queryChannel = createRequestChannel<
  { query: string },
  { results: string[]; count: number }
>({
  name: 'search-queries',
  timeout: 5000
});

// Register handler (responder agent)
broker.registerHandler(queryChannel, async (request) => {
  const results = await searchDatabase(request.payload.query);
  return {
    results: results.map(r => r.title),
    count: results.length
  };
});

// Send request and await response (requester agent)
const response = await broker.request(queryChannel, {
  query: 'AI research papers'
});

console.log(\`Found \${response.count} results\`);`,
  },
];

export default function AgentsPage() {
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
              <Bot className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Agents</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Build autonomous AI agents with tools, memory, and multi-agent orchestration.
            Create agents that can reason, use tools, and collaborate.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/core
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supported Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Models</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Claude 3.5 Sonnet',
              'Claude 3 Opus',
              'GPT-4o',
              'GPT-4 Turbo',
              'Gemini Pro',
              'Gemini Ultra',
              'Llama 3',
              'Mistral Large'
            ].map((model) => (
              <div
                key={model}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium"
              >
                {model}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
