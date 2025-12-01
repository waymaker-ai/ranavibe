'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, MessageSquare, FileText, Search, Mail, Bot, Clock } from 'lucide-react';

const tutorials = [
  {
    icon: MessageSquare,
    title: 'Build a ChatGPT Clone',
    difficulty: 'Beginner',
    time: '15 min',
    description: 'Create a full-featured chat interface with streaming, conversation history, and multiple models',
    code: `// 1. Create the chat API route
// app/api/chat/route.ts
import { Agent } from '@rana/core';
import { streamResponse } from '@rana/helpers';

const agent = new Agent({
  name: 'ChatBot',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You are a helpful assistant.'
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = agent.stream(messages);
  return streamResponse(stream);
}

// 2. Create the chat component
// components/Chat.tsx
'use client';
import { useChat } from '@rana/react';

export function Chat() {
  const { messages, input, setInput, send, isLoading } = useChat({
    api: '/api/chat'
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
            <div className="inline-block p-3 rounded-lg max-w-[80%]">
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="w-full p-3 border rounded-lg"
        />
      </form>
    </div>
  );
}`,
  },
  {
    icon: FileText,
    title: 'Document Q&A with RAG',
    difficulty: 'Intermediate',
    time: '30 min',
    description: 'Build a system that answers questions from your documents using RAG',
    code: `// 1. Index your documents
import { RAGPresets, SemanticChunker } from '@rana/rag';

const pipeline = RAGPresets.balanced();

// Load and chunk documents
const documents = await loadDocuments('./docs');
const chunker = new SemanticChunker({ maxTokens: 500 });

for (const doc of documents) {
  const chunks = await chunker.chunk(doc.content);
  await pipeline.index(chunks.map((chunk, i) => ({
    id: \`\${doc.id}-\${i}\`,
    content: chunk,
    metadata: { source: doc.name, page: i }
  })));
}

// 2. Create the Q&A endpoint
// app/api/ask/route.ts
import { pipeline } from '@/lib/rag';

export async function POST(req: Request) {
  const { question } = await req.json();

  const result = await pipeline.query({
    query: question,
    topK: 5,
    includeMetadata: true
  });

  return Response.json({
    answer: result.answer,
    sources: result.sources.map(s => ({
      content: s.content.slice(0, 200),
      source: s.metadata.source,
      page: s.metadata.page
    }))
  });
}

// 3. Create the UI
'use client';
import { useState } from 'react';

export function DocumentQA() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);

  const ask = async () => {
    const res = await fetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    setResult(await res.json());
  };

  return (
    <div>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about your documents..."
      />
      <button onClick={ask}>Ask</button>

      {result && (
        <div>
          <h3>Answer</h3>
          <p>{result.answer}</p>
          <h4>Sources</h4>
          {result.sources.map((s, i) => (
            <div key={i}>
              <strong>{s.source}</strong> (Page {s.page})
              <p>{s.content}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`,
  },
  {
    icon: Bot,
    title: 'AI Agent with Tools',
    difficulty: 'Intermediate',
    time: '25 min',
    description: 'Create an agent that can search the web, read files, and execute code',
    code: `import { Agent, Tool } from '@rana/core';

// Define tools
const webSearchTool = new Tool({
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  },
  handler: async ({ query }) => {
    const results = await fetch(
      \`https://api.search.com?q=\${encodeURIComponent(query)}\`
    );
    return await results.json();
  }
});

const calculatorTool = new Tool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    expression: { type: 'string', description: 'Math expression to evaluate' }
  },
  handler: async ({ expression }) => {
    // Safe evaluation
    const result = new Function(\`return \${expression}\`)();
    return { result };
  }
});

const weatherTool = new Tool({
  name: 'weather',
  description: 'Get current weather for a location',
  parameters: {
    location: { type: 'string', description: 'City name' }
  },
  handler: async ({ location }) => {
    const res = await fetch(
      \`https://api.weather.com/current?city=\${location}\`
    );
    return await res.json();
  }
});

// Create agent with tools
const agent = new Agent({
  name: 'ResearchAssistant',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: \`You are a helpful research assistant.
    Use tools when needed to find accurate, current information.
    Always cite your sources.\`,
  tools: [webSearchTool, calculatorTool, weatherTool]
});

// Run the agent
const result = await agent.run(
  'What is the weather in Tokyo and what is 15% of 234?'
);

console.log(result);
// "The weather in Tokyo is currently 22°C and sunny.
//  15% of 234 is 35.1"`,
  },
  {
    icon: Mail,
    title: 'Email Processing Pipeline',
    difficulty: 'Advanced',
    time: '45 min',
    description: 'Automatically classify, summarize, and respond to emails',
    code: `import { Workflow, Step, Branch } from '@rana/core';
import { classify, summarize, generate } from '@rana/helpers';

const emailWorkflow = new Workflow({ name: 'email-processor' });

// Step 1: Classify the email
emailWorkflow.addStep(new Step({
  name: 'classify',
  handler: async (input) => {
    const category = await classify(input.email.body, [
      'support', 'sales', 'partnership', 'spam', 'other'
    ]);
    return { category, email: input.email };
  }
}));

// Step 2: Summarize (except spam)
emailWorkflow.addStep(new Step({
  name: 'summarize',
  dependsOn: ['classify'],
  condition: (ctx) => ctx.getOutput('classify').category !== 'spam',
  handler: async (_, ctx) => {
    const { email } = ctx.getOutput('classify');
    const summary = await summarize(email.body, { style: 'brief' });
    return { summary };
  }
}));

// Step 3: Branch based on category
emailWorkflow.addBranch(new Branch({
  name: 'route',
  dependsOn: ['classify', 'summarize'],
  conditions: [
    {
      when: (ctx) => ctx.getOutput('classify').category === 'support',
      then: 'support-response'
    },
    {
      when: (ctx) => ctx.getOutput('classify').category === 'sales',
      then: 'sales-response'
    }
  ],
  default: 'generic-response'
}));

// Support response
emailWorkflow.addStep(new Step({
  name: 'support-response',
  handler: async (_, ctx) => {
    const { email } = ctx.getOutput('classify');
    const response = await generate(\`
      Write a helpful support response to this email:

      Subject: \${email.subject}
      Body: \${email.body}

      Be empathetic, professional, and offer specific solutions.
    \`);
    return { response, action: 'send' };
  }
}));

// Sales response
emailWorkflow.addStep(new Step({
  name: 'sales-response',
  handler: async (_, ctx) => {
    const { email } = ctx.getOutput('classify');
    const response = await generate(\`
      Write a sales follow-up to this inquiry:

      Subject: \${email.subject}
      Body: \${email.body}

      Be professional, highlight our value proposition.
    \`);
    return { response, action: 'draft' }; // Don't auto-send sales
  }
}));

// Run workflow
const result = await emailWorkflow.run({
  email: {
    subject: 'Issue with my subscription',
    body: 'I was charged twice this month...',
    from: 'customer@example.com'
  }
});`,
  },
  {
    icon: Search,
    title: 'Semantic Code Search',
    difficulty: 'Advanced',
    time: '40 min',
    description: 'Build a code search engine that understands natural language queries',
    code: `import { RAGPresets } from '@rana/rag';
import { glob } from 'glob';
import * as fs from 'fs/promises';

// 1. Create code-optimized pipeline
const pipeline = RAGPresets.code('typescript');

// 2. Index your codebase
async function indexCodebase(dir: string) {
  const files = await glob(\`\${dir}/**/*.{ts,tsx,js,jsx}\`);

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Extract functions, classes, and interfaces
    const chunks = extractCodeChunks(content);

    for (const chunk of chunks) {
      await pipeline.index([{
        id: \`\${file}:\${chunk.line}\`,
        content: chunk.content,
        metadata: {
          file,
          line: chunk.line,
          type: chunk.type,  // 'function' | 'class' | 'interface'
          name: chunk.name
        }
      }]);
    }
  }
}

// 3. Search with natural language
async function searchCode(query: string) {
  const result = await pipeline.query({
    query,
    topK: 10,
    synthesize: false  // Return raw results
  });

  return result.sources.map(s => ({
    file: s.metadata.file,
    line: s.metadata.line,
    type: s.metadata.type,
    name: s.metadata.name,
    code: s.content,
    score: s.score
  }));
}

// 4. Example usage
await indexCodebase('./src');

const results = await searchCode(
  'function that handles user authentication'
);

// Returns matches like:
// [
//   { file: 'src/auth/login.ts', line: 45, name: 'authenticateUser', ... },
//   { file: 'src/middleware/auth.ts', line: 12, name: 'verifyToken', ... }
// ]`,
  },
  {
    icon: Clock,
    title: 'Scheduled AI Reports',
    difficulty: 'Intermediate',
    time: '20 min',
    description: 'Generate and send automated AI reports on a schedule',
    code: `import { Agent } from '@rana/core';
import { CronJob } from 'cron';

// 1. Create report generator agent
const reportAgent = new Agent({
  name: 'ReportGenerator',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: \`You are a business analyst.
    Generate clear, actionable reports with insights.\`
});

// 2. Define report generation function
async function generateDailyReport() {
  // Fetch data from your sources
  const salesData = await fetchSalesData();
  const userMetrics = await fetchUserMetrics();
  const systemHealth = await fetchSystemHealth();

  // Generate report with AI
  const report = await reportAgent.run(\`
    Generate a daily business report based on this data:

    Sales: \${JSON.stringify(salesData)}
    User Metrics: \${JSON.stringify(userMetrics)}
    System Health: \${JSON.stringify(systemHealth)}

    Include:
    - Executive summary (3 bullet points)
    - Key metrics with trends
    - Notable insights
    - Recommended actions
  \`);

  // Send report
  await sendEmail({
    to: 'team@company.com',
    subject: \`Daily Report - \${new Date().toLocaleDateString()}\`,
    body: report
  });

  await sendSlack({
    channel: '#daily-reports',
    text: report
  });

  console.log('Daily report sent!');
}

// 3. Schedule the report
const job = new CronJob(
  '0 8 * * *',  // Every day at 8 AM
  generateDailyReport,
  null,
  true,
  'America/New_York'
);

job.start();
console.log('Report scheduler started');`,
  },
];

const difficultyColors: Record<string, string> = {
  'Beginner': 'bg-green-500/20 text-green-400',
  'Intermediate': 'bg-yellow-500/20 text-yellow-400',
  'Advanced': 'bg-red-500/20 text-red-400',
};

export default function TutorialsPage() {
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
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Tutorials</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Step-by-step tutorials to build real-world AI applications with RANA.
            From beginner to advanced, learn by building.
          </p>
        </motion.div>

        {/* Tutorials */}
        <div className="space-y-12">
          {tutorials.map((tutorial, index) => (
            <motion.div
              key={tutorial.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <tutorial.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{tutorial.title}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[tutorial.difficulty]}`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-sm text-foreground-secondary flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {tutorial.time}
                    </span>
                  </div>
                  <p className="text-foreground-secondary">{tutorial.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto max-h-[500px] overflow-y-auto">
                <pre>{tutorial.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* More tutorials coming */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card bg-gradient-subtle text-center"
        >
          <h2 className="text-2xl font-bold mb-4">More Tutorials Coming Soon</h2>
          <p className="text-foreground-secondary mb-4">
            We&apos;re adding new tutorials regularly. Have a request?
          </p>
          <Link
            href="https://github.com/waymaker-ai/ranavibe/issues"
            target="_blank"
            className="btn-primary inline-block"
          >
            Request a Tutorial
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
