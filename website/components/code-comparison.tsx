'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const comparisons = [
  {
    name: 'Simple Chat',
    langchain: `import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

const messages = [
  new SystemMessage("You are helpful."),
  new HumanMessage("Hello!"),
];

const response = await model.invoke(messages);
console.log(response.content);`,
    rana: `import { createRana } from '@rana/core';

const rana = createRana();

const response = await rana.chat('Hello!');
console.log(response.content);`,
    langchainLines: 14,
    ranaLines: 5,
  },
  {
    name: 'RAG Pipeline',
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
    langchainLines: 31,
    ranaLines: 8,
  },
  {
    name: 'Tool Calling',
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

const response = await model.invoke("Weather in SF?");
// Handle tool calls manually...`,
    rana: `import { createRana, createTool } from '@rana/core';

const rana = createRana();

const weather = createTool({
  name: 'get_weather',
  description: 'Get weather for a location',
  parameters: { location: { type: 'string' } },
  handler: ({ location }) => \`Weather in \${location}: Sunny\`,
});

const response = await rana
  .tools([weather])
  .chat('Weather in SF?');`,
    langchainLines: 22,
    ranaLines: 13,
  },
];

export function CodeComparison() {
  const [activeTab, setActiveTab] = useState(0);
  const comparison = comparisons[activeTab];
  const reduction = Math.round((1 - comparison.ranaLines / comparison.langchainLines) * 100);

  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="container-wide">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text">{reduction}% Less Code</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            Same functionality, dramatically simpler code
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-2 mb-8"
        >
          {comparisons.map((comp, index) => (
            <button
              key={comp.name}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'bg-foreground text-background'
                  : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
              }`}
            >
              {comp.name}
            </button>
          ))}
        </motion.div>

        {/* Code blocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* LangChain */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm font-medium">
                LangChain
              </span>
              <span className="text-sm text-foreground-secondary">
                {comparison.langchainLines} lines
              </span>
            </div>
            <div className="code-block overflow-x-auto max-h-96">
              <pre className="text-sm">
                <code className="text-foreground-secondary">{comparison.langchain}</code>
              </pre>
            </div>
          </div>

          {/* RANA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium">
                RANA
              </span>
              <span className="text-sm text-foreground-secondary">
                {comparison.ranaLines} lines
              </span>
            </div>
            <div className="code-block overflow-x-auto max-h-96">
              <pre className="text-sm">
                <code className="text-foreground-secondary">{comparison.rana}</code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Link
            href="/compare"
            className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
          >
            See all comparisons →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
