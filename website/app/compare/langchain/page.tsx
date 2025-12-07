'use client';

import Link from 'next/link';

const codeExamples = [
  {
    title: 'Simple Chat',
    langchain: `import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

const messages = [
  new SystemMessage("You are a helpful assistant."),
  new HumanMessage("Hello!"),
];

const response = await model.invoke(messages);
console.log(response.content);`,
    rana: `import { createRana } from '@rana/core';

const rana = createRana();

const response = await rana.chat('Hello!');
console.log(response.content);`,
  },
  {
    title: 'With Tools',
    langchain: `import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const weatherTool = tool(
  async ({ location }) => {
    return \`Weather in \${location}: Sunny, 72°F\`;
  },
  {
    name: "get_weather",
    description: "Get weather for a location",
    schema: z.object({
      location: z.string(),
    }),
  }
);

const model = new ChatOpenAI({
  modelName: "gpt-4",
}).bindTools([weatherTool]);

const response = await model.invoke("What's the weather in SF?");
// Handle tool calls manually...`,
    rana: `import { createRana, createTool } from '@rana/core';

const rana = createRana();

const weather = createTool({
  name: 'get_weather',
  description: 'Get weather for a location',
  parameters: { location: { type: 'string' } },
  handler: ({ location }) => \`Weather in \${location}: Sunny, 72°F\`,
});

const response = await rana
  .tools([weather])
  .chat('What\\'s the weather in SF?');`,
  },
  {
    title: 'RAG Pipeline',
    langchain: `import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const embeddings = new OpenAIEmbeddings();
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const docs = await splitter.createDocuments([text]);
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
const retriever = vectorStore.asRetriever();

const prompt = ChatPromptTemplate.fromTemplate(\`
Answer based on context: {context}
Question: {input}
\`);

const documentChain = await createStuffDocumentsChain({
  llm: new ChatOpenAI(),
  prompt,
});

const retrievalChain = await createRetrievalChain({
  combineDocsChain: documentChain,
  retriever,
});

const response = await retrievalChain.invoke({ input: "question" });`,
    rana: `import { createRana } from '@rana/core';
import { createRAG } from '@rana/rag';

const rana = createRana();
const rag = createRAG({ rana });

await rag.ingest(text);

const response = await rag.query('question');`,
  },
];

export default function LangChainComparisonPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Link
          href="/compare"
          className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2"
        >
          ← Back to comparisons
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            RANA vs LangChain
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            LangChain is powerful but complex. RANA gives you the same capabilities
            with 90% less code and a gentler learning curve.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">90%</div>
            <div className="text-gray-400">Less Code</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">10x</div>
            <div className="text-gray-400">Faster Setup</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-gray-400">TypeScript</div>
          </div>
        </div>

        <div className="space-y-16">
          {codeExamples.map((example, index) => (
            <div key={index} className="space-y-6">
              <h2 className="text-2xl font-semibold">{example.title}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                      LangChain
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.langchain.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.langchain}</code>
                  </pre>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      RANA
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.rana.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.rana}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <h2 className="text-2xl font-semibold mb-6">When to Choose RANA</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-4">Choose RANA if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want to ship fast without a steep learning curve
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Prefer TypeScript-first development
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Need built-in testing and cost tracking
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Value convention over configuration
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4">Choose LangChain if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need Python as your primary language
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Have existing LangChain investments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need very specific chain configurations
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="https://github.com/waymaker-ai/ranavibe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Try RANA Now
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
