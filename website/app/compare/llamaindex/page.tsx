'use client';

import Link from 'next/link';

const codeExamples = [
  {
    title: 'Basic RAG Setup',
    llamaindex: `import { Document, VectorStoreIndex, serviceContextFromDefaults } from "llamaindex";

// Create documents
const documents = [
  new Document({ text: "Your document content here..." }),
  new Document({ text: "Another document..." }),
];

// Create service context
const serviceContext = serviceContextFromDefaults({
  chunkSize: 512,
  chunkOverlap: 50,
});

// Create index
const index = await VectorStoreIndex.fromDocuments(
  documents,
  { serviceContext }
);

// Create query engine
const queryEngine = index.asQueryEngine();

// Query
const response = await queryEngine.query("Your question here");
console.log(response.toString());`,
    rana: `import { createRana } from '@rana/core';
import { createRAG } from '@rana/rag';

const rana = createRana();
const rag = createRAG({ rana });

await rag.ingest([
  "Your document content here...",
  "Another document..."
]);

const response = await rag.query("Your question here");
console.log(response.content);`,
  },
  {
    title: 'Custom Embeddings',
    llamaindex: `import {
  Document,
  VectorStoreIndex,
  OpenAIEmbedding,
  serviceContextFromDefaults
} from "llamaindex";

const embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
  dimensions: 1536,
});

const serviceContext = serviceContextFromDefaults({
  embedModel,
});

const documents = [new Document({ text: content })];

const index = await VectorStoreIndex.fromDocuments(
  documents,
  { serviceContext }
);`,
    rana: `import { createRana } from '@rana/core';
import { createRAG } from '@rana/rag';

const rana = createRana();
const rag = createRAG({
  rana,
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
});

await rag.ingest(content);`,
  },
  {
    title: 'Streaming Responses',
    llamaindex: `import {
  Document,
  VectorStoreIndex,
  OpenAI,
  serviceContextFromDefaults
} from "llamaindex";

const llm = new OpenAI({
  model: "gpt-4",
  temperature: 0.7,
});

const serviceContext = serviceContextFromDefaults({ llm });

const index = await VectorStoreIndex.fromDocuments(docs, { serviceContext });
const queryEngine = index.asQueryEngine();

const stream = await queryEngine.query(
  "Your question",
  { streaming: true }
);

for await (const chunk of stream) {
  process.stdout.write(chunk.response);
}`,
    rana: `import { createRana } from '@rana/core';
import { createRAG } from '@rana/rag';

const rana = createRana({ model: 'gpt-4' });
const rag = createRAG({ rana });

await rag.ingest(docs);

for await (const chunk of rag.queryStream("Your question")) {
  process.stdout.write(chunk);
}`,
  },
];

const features = [
  {
    feature: 'RAG Pipeline',
    llamaindex: true,
    rana: true,
    note: 'Both provide RAG capabilities',
  },
  {
    feature: 'Vector Storage',
    llamaindex: true,
    rana: true,
    note: 'Both support vector stores',
  },
  {
    feature: 'Document Loaders',
    llamaindex: true,
    rana: true,
    note: 'Both support multiple document types',
  },
  {
    feature: 'TypeScript Native',
    llamaindex: false,
    rana: true,
    note: 'RANA is TypeScript-first',
  },
  {
    feature: 'Cost Tracking',
    llamaindex: false,
    rana: true,
    note: 'RANA tracks costs automatically',
  },
  {
    feature: 'Built-in Testing',
    llamaindex: false,
    rana: true,
    note: 'RANA has @rana/testing',
  },
  {
    feature: 'Security Features',
    llamaindex: false,
    rana: true,
    note: 'RANA includes PII detection, injection prevention',
  },
  {
    feature: 'Multi-Provider',
    llamaindex: true,
    rana: true,
    note: 'Both support multiple providers',
  },
  {
    feature: 'Observability',
    llamaindex: false,
    rana: true,
    note: 'RANA has built-in tracing',
  },
  {
    feature: 'Agent Framework',
    llamaindex: true,
    rana: true,
    note: 'Both support agent patterns',
  },
];

export default function LlamaIndexComparisonPage() {
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
            RANA vs LlamaIndex
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            LlamaIndex pioneered RAG frameworks. RANA builds on those patterns
            with a simpler API, TypeScript-first design, and production features.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">70%</div>
            <div className="text-gray-400 text-sm">Less Code</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
            <div className="text-gray-400 text-sm">TypeScript</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">Built-in</div>
            <div className="text-gray-400 text-sm">Cost Tracking</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">~50KB</div>
            <div className="text-gray-400 text-sm">Bundle Size</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 overflow-hidden mb-16">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Feature</th>
                <th className="py-4 px-6 text-center font-semibold">LlamaIndex</th>
                <th className="py-4 px-6 text-center font-semibold">RANA</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium">{item.feature}</div>
                    <div className="text-sm text-gray-500">{item.note}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.llamaindex ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.rana ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-16">
          {codeExamples.map((example, index) => (
            <div key={index} className="space-y-6">
              <h2 className="text-2xl font-semibold">{example.title}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                      LlamaIndex
                    </span>
                    <span className="text-gray-500 text-sm">
                      {example.llamaindex.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                    <code className="text-gray-300">{example.llamaindex}</code>
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
          <h2 className="text-2xl font-semibold mb-6">When to Choose Each</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-4">Choose RANA if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want simpler, more readable RAG code
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Need TypeScript-first with great type inference
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Want built-in cost tracking and security
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  Prefer convention over configuration
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4">Choose LlamaIndex if you:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need Python as your primary language
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Have existing LlamaIndex integrations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  Need highly specialized index types
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
