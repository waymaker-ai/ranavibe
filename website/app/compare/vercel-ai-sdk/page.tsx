'use client';

import Link from 'next/link';

const features = [
  {
    feature: 'Core Streaming',
    vercel: true,
    rana: true,
    note: 'Both support streaming responses',
  },
  {
    feature: 'Multi-Provider',
    vercel: true,
    rana: true,
    note: 'Both support multiple AI providers',
  },
  {
    feature: 'Tool Calling',
    vercel: true,
    rana: true,
    note: 'Both support function/tool calling',
  },
  {
    feature: 'React Hooks',
    vercel: true,
    rana: true,
    note: 'Both provide React integration',
  },
  {
    feature: 'Cost Tracking',
    vercel: false,
    rana: true,
    note: 'RANA tracks costs and provides budgets',
  },
  {
    feature: 'Built-in Testing',
    vercel: false,
    rana: true,
    note: 'RANA has @rana/testing for AI testing',
  },
  {
    feature: 'Prompt Injection Detection',
    vercel: false,
    rana: true,
    note: 'RANA includes security features',
  },
  {
    feature: 'PII Redaction',
    vercel: false,
    rana: true,
    note: 'RANA can detect and redact PII',
  },
  {
    feature: 'RAG Pipeline',
    vercel: false,
    rana: true,
    note: 'RANA includes @rana/rag for RAG',
  },
  {
    feature: 'MCP Support',
    vercel: false,
    rana: true,
    note: 'RANA supports Model Context Protocol',
  },
  {
    feature: 'Agent Framework',
    vercel: false,
    rana: true,
    note: 'RANA includes agent orchestration',
  },
  {
    feature: 'Observability',
    vercel: false,
    rana: true,
    note: 'RANA has built-in tracing and logging',
  },
];

export default function VercelAIComparisonPage() {
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
            RANA vs Vercel AI SDK
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Vercel AI SDK is great for getting started. RANA builds on those patterns
            and adds everything you need for production: testing, security, observability, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">+8</div>
            <div className="text-gray-400 text-sm">Extra Features</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
            <div className="text-gray-400 text-sm">Compatible API</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">1 day</div>
            <div className="text-gray-400 text-sm">Migration Time</div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">MIT</div>
            <div className="text-gray-400 text-sm">Licensed</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 overflow-hidden mb-16">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="py-4 px-6 text-left font-semibold">Feature</th>
                <th className="py-4 px-6 text-center font-semibold">Vercel AI</th>
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
                    {item.vercel ? (
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

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Migration is Easy</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                    Vercel AI SDK
                  </span>
                </div>
                <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                  <code className="text-gray-300">{`import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello!',
});`}</code>
                </pre>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                    RANA
                  </span>
                </div>
                <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto text-sm">
                  <code className="text-gray-300">{`import { createRana } from '@rana/core';

const rana = createRana();

const response = await rana
  .model('gpt-4')
  .chat('Hello!');`}</code>
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Extra Features You Get</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="text-lg font-medium mb-3">Cost Tracking</h3>
                <pre className="p-3 rounded-lg bg-black/50 text-sm overflow-x-auto">
                  <code className="text-gray-300">{`const rana = createRana({
  budget: { daily: 10 }
});

const stats = rana.getCostStats();
// { today: 2.34, total: 45.67 }`}</code>
                </pre>
              </div>
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="text-lg font-medium mb-3">Security</h3>
                <pre className="p-3 rounded-lg bg-black/50 text-sm overflow-x-auto">
                  <code className="text-gray-300">{`import { detectInjection } from '@rana/core';

const result = detectInjection(userInput);
if (result.isInjection) {
  // Block malicious input
}`}</code>
                </pre>
              </div>
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="text-lg font-medium mb-3">Testing</h3>
                <pre className="p-3 rounded-lg bg-black/50 text-sm overflow-x-auto">
                  <code className="text-gray-300">{`import { aiTest } from '@rana/testing';

aiTest('responds helpfully', async () => {
  const response = await rana.chat('Help');
  await expect(response).toPassRegression();
});`}</code>
                </pre>
              </div>
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
                <h3 className="text-lg font-medium mb-3">Observability</h3>
                <pre className="p-3 rounded-lg bg-black/50 text-sm overflow-x-auto">
                  <code className="text-gray-300">{`import { createTracer } from '@rana/core';

const tracer = createTracer();
// All requests automatically traced
// Export to OpenTelemetry, Sentry, etc.`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to level up from Vercel AI SDK?
          </h2>
          <p className="text-gray-400 mb-6">
            Keep everything you love, gain everything you need.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="https://github.com/waymaker-ai/ranavibe"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-700 text-white font-semibold hover:bg-gray-900 transition-colors"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
