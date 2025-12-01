'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, Check, X } from 'lucide-react';

const migrations = [
  {
    from: 'LangChain',
    sections: [
      {
        title: 'Chat Models',
        before: `import { ChatOpenAI } from '@langchain/openai';

const chat = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
});

const response = await chat.invoke([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);`,
        after: `import { Agent } from '@rana/core';

const agent = new Agent({
  model: 'gpt-4',
  temperature: 0.7,
  systemPrompt: 'You are a helpful assistant.'
});

const response = await agent.run('Hello!');
console.log(response);`,
      },
      {
        title: 'Chains',
        before: `import { LLMChain, PromptTemplate } from 'langchain';

const template = 'Translate to {language}: {text}';
const prompt = new PromptTemplate({
  template,
  inputVariables: ['language', 'text']
});

const chain = new LLMChain({ llm: chat, prompt });

const result = await chain.call({
  language: 'Spanish',
  text: 'Hello world'
});`,
        after: `import { translate } from '@rana/helpers';

const result = await translate('Hello world', {
  to: 'Spanish'
});

// Or with PromptManager for complex prompts
import { PromptManager } from '@rana/prompts';

const pm = new PromptManager({ workspace: 'app' });
await pm.register('translate', {
  template: 'Translate to {{language}}: {{text}}',
  variables: ['language', 'text']
});

const result = await pm.execute('translate', {
  variables: { language: 'Spanish', text: 'Hello world' }
});`,
      },
      {
        title: 'RAG',
        before: `import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { RetrievalQAChain } from 'langchain/chains';

const embeddings = new OpenAIEmbeddings();
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex: index
});

const chain = RetrievalQAChain.fromLLM(chat, vectorStore.asRetriever());

const response = await chain.call({
  query: 'What is the refund policy?'
});`,
        after: `import { RAGPresets } from '@rana/rag';

const pipeline = RAGPresets.balanced();

// Index documents
await pipeline.index(documents);

// Query with citations
const result = await pipeline.query({
  query: 'What is the refund policy?'
});

console.log(result.answer);
console.log(result.citations);`,
      },
    ],
  },
  {
    from: 'Vercel AI SDK',
    sections: [
      {
        title: 'Streaming Chat',
        before: `import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await streamText({
  model: openai('gpt-4'),
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}`,
        after: `import { Agent } from '@rana/core';

const agent = new Agent({ model: 'gpt-4' });

for await (const chunk of agent.stream('Hello!')) {
  process.stdout.write(chunk.content);
}

// Or with React hook
import { useChat } from '@rana/react';

function Chat() {
  const { messages, input, send } = useChat();
  // Same API, more features included
}`,
      },
      {
        title: 'Tool Calling',
        before: `import { streamText, tool } from 'ai';
import { z } from 'zod';

const result = await streamText({
  model: openai('gpt-4'),
  tools: {
    weather: tool({
      description: 'Get the weather',
      parameters: z.object({
        city: z.string()
      }),
      execute: async ({ city }) => {
        return \`Weather in \${city}: 72°F\`;
      }
    })
  },
  messages: [{ role: 'user', content: 'Weather in NYC?' }]
});`,
        after: `import { Agent, Tool } from '@rana/core';

const weatherTool = new Tool({
  name: 'weather',
  description: 'Get the weather',
  parameters: {
    city: { type: 'string' }
  },
  handler: async ({ city }) => {
    return \`Weather in \${city}: 72°F\`;
  }
});

const agent = new Agent({
  model: 'gpt-4',
  tools: [weatherTool]
});

const result = await agent.run('Weather in NYC?');`,
      },
    ],
  },
  {
    from: 'OpenAI SDK',
    sections: [
      {
        title: 'Basic Chat',
        before: `import OpenAI from 'openai';

const openai = new OpenAI();

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(completion.choices[0].message.content);`,
        after: `import { Agent } from '@rana/core';

const agent = new Agent({
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
});

const result = await agent.run('Hello!');
console.log(result);

// Benefits:
// - Automatic retries & fallbacks
// - Built-in cost tracking
// - Type-safe responses
// - Memory management`,
      },
      {
        title: 'Streaming',
        before: `const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}`,
        after: `import { Agent } from '@rana/core';

const agent = new Agent({ model: 'gpt-4' });

for await (const chunk of agent.stream('Hello!')) {
  process.stdout.write(chunk.content);
}

// Benefits:
// - Unified streaming API across all providers
// - Automatic error handling
// - Progress events & callbacks`,
      },
      {
        title: 'Function Calling',
        before: `const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Weather in NYC?' }],
  functions: [{
    name: 'get_weather',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' }
      }
    }
  }],
  function_call: 'auto'
});

if (completion.choices[0].message.function_call) {
  const args = JSON.parse(completion.choices[0].message.function_call.arguments);
  const weather = await getWeather(args.city);
  // Need to send another request with the result...
}`,
        after: `import { Agent, Tool } from '@rana/core';

const agent = new Agent({
  model: 'gpt-4',
  tools: [
    new Tool({
      name: 'get_weather',
      description: 'Get weather for a city',
      parameters: { city: { type: 'string' } },
      handler: async ({ city }) => getWeather(city)
    })
  ]
});

// Automatic tool execution loop!
const result = await agent.run('Weather in NYC?');

// Benefits:
// - Automatic tool execution
// - Multi-turn tool usage
// - Type-safe tool definitions`,
      },
    ],
  },
];

const benefits = [
  { feature: 'Automatic retries & fallbacks', rana: true, others: false },
  { feature: 'Built-in cost tracking', rana: true, others: false },
  { feature: 'Provider-agnostic API', rana: true, others: false },
  { feature: 'Semantic testing', rana: true, others: false },
  { feature: 'Memory management', rana: true, others: false },
  { feature: 'Prompt versioning', rana: true, others: false },
  { feature: 'RAG with citations', rana: true, others: false },
  { feature: 'OpenTelemetry support', rana: true, others: false },
];

export default function MigrationPage() {
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
              <RefreshCw className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Migration Guide</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Migrate from LangChain, Vercel AI SDK, or OpenAI SDK to RANA.
            Side-by-side code comparisons to make migration easy.
          </p>
        </motion.div>

        {/* Benefits table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Why Migrate to RANA?</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">RANA</th>
                  <th className="text-center py-3 px-4">Others</th>
                </tr>
              </thead>
              <tbody>
                {benefits.map((b) => (
                  <tr key={b.feature} className="border-b border-border">
                    <td className="py-3 px-4">{b.feature}</td>
                    <td className="text-center py-3 px-4">
                      {b.rana ? (
                        <Check className="inline h-5 w-5 text-green-500" />
                      ) : (
                        <X className="inline h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {b.others ? (
                        <Check className="inline h-5 w-5 text-green-500" />
                      ) : (
                        <X className="inline h-5 w-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Migration guides */}
        {migrations.map((migration, mIndex) => (
          <motion.div
            key={migration.from}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (mIndex + 1) * 0.1 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8">
              From {migration.from} to RANA
            </h2>

            <div className="space-y-8">
              {migration.sections.map((section, sIndex) => (
                <div key={sIndex} className="card">
                  <h3 className="text-xl font-bold mb-6">{section.title}</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-red-400 mb-2">
                        Before ({migration.from})
                      </div>
                      <div className="code-block font-mono text-sm overflow-x-auto">
                        <pre>{section.before}</pre>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-400 mb-2">
                        After (RANA)
                      </div>
                      <div className="code-block font-mono text-sm overflow-x-auto">
                        <pre>{section.after}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Quick migration steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-6">Quick Migration Steps</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                1
              </span>
              <div>
                <strong>Install RANA packages</strong>
                <div className="code-block font-mono text-sm mt-2">
                  npm install @rana/core @rana/helpers @rana/prompts @rana/rag
                </div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                2
              </span>
              <div>
                <strong>Configure your API keys</strong>
                <div className="code-block font-mono text-sm mt-2">
                  {`# .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...`}
                </div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                3
              </span>
              <div>
                <strong>Update imports and code</strong>
                <p className="text-foreground-secondary mt-1">
                  Replace imports and update code following the examples above
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                4
              </span>
              <div>
                <strong>Run tests</strong>
                <div className="code-block font-mono text-sm mt-2">
                  npm test
                </div>
              </div>
            </li>
          </ol>
        </motion.div>

        {/* Need help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-foreground-secondary mb-4">
            Need help with your migration?
          </p>
          <Link href="https://discord.gg/rana" target="_blank" className="btn-primary">
            Join our Discord
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
