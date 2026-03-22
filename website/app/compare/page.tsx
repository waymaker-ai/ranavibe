'use client';

import Link from 'next/link';

const comparisons = [
  {
    name: 'NeMo Guardrails',
    slug: 'nemo-guardrails',
    tagline: 'Same guardrails, more features, TypeScript-first',
    description: 'CoFounder covers everything NeMo Guardrails does — plus compliance, cost tracking, CI/CD, MCP, and a dashboard',
    featured: true,
  },
  {
    name: 'NemoClaw / OpenClaw',
    slug: 'nemoclaw',
    tagline: 'Guardrails for the OpenClaw ecosystem',
    description: 'CoFounder provides the same security layer NemoClaw adds to OpenClaw — and works with any agent framework',
    featured: true,
  },
  {
    name: 'LangChain',
    slug: 'langchain',
    tagline: 'Simple by default, powerful when needed',
    description: 'See how CoFounder provides LangChain functionality with 90% less code',
  },
  {
    name: 'MetaGPT',
    slug: 'metagpt',
    tagline: 'Multi-agent orchestration in TypeScript',
    description: 'Get MetaGPT patterns with simpler APIs and better state management',
  },
  {
    name: 'CrewAI',
    slug: 'crewai',
    tagline: 'True parallel execution and consensus',
    description: 'CrewAI patterns with transactional state and TypeScript support',
  },
  {
    name: 'Vercel AI SDK',
    slug: 'vercel-ai-sdk',
    tagline: 'Full-featured and production-ready',
    description: 'CoFounder extends Vercel AI SDK patterns with enterprise features',
  },
  {
    name: 'LlamaIndex',
    slug: 'llamaindex',
    tagline: 'Built-in RAG without complexity',
    description: 'Get LlamaIndex RAG capabilities with simpler APIs',
  },
  {
    name: 'OpenAI SDK',
    slug: 'openai-sdk',
    tagline: 'Multi-provider by design',
    description: 'Use OpenAI, Anthropic, Google, and more with one unified API',
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How CoFounder Compares
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how CoFounder stacks up against other AI frameworks.
            We believe in transparency and letting the code speak for itself.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="group block p-8 rounded-2xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  CoFounder vs {comparison.name}
                </h2>
                <span className="text-gray-500 group-hover:text-white transition-colors">
                  →
                </span>
              </div>
              <p className="text-lg text-blue-400 mb-2">{comparison.tagline}</p>
              <p className="text-gray-400">{comparison.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/50">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Guardrails Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-3 font-semibold">Feature</th>
                  <th className="py-4 px-3 font-semibold text-center">CoFounder</th>
                  <th className="py-4 px-3 font-semibold text-center">NeMo Guardrails</th>
                  <th className="py-4 px-3 font-semibold text-center">NemoClaw</th>
                  <th className="py-4 px-3 font-semibold text-center">OpenGuardrails</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">TypeScript-first</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-red-400">Python</td>
                  <td className="py-3 px-3 text-center text-red-400">Python</td>
                  <td className="py-3 px-3 text-center text-red-400">Python</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">PII detection & redaction</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 20+ patterns</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Prompt injection blocking</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 25+ patterns</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Content safety filtering</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 7 categories</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-yellow-400">Limited</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Compliance frameworks</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 9 frameworks</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Cost tracking & budgets</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 25+ models</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">MCP server</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ 15+ tools</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">CI/CD integration</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ GitHub Action</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Observability dashboard</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Agent SDK wrapping</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ Anthropic</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-yellow-400">OpenClaw only</td>
                  <td className="py-3 px-3 text-center text-yellow-400">OpenClaw only</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Declarative policies (YAML)</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-yellow-400">Colang DSL</td>
                  <td className="py-3 px-3 text-center text-yellow-400">via NeMo</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-3">Zero dependencies</td>
                  <td className="py-3 px-3 text-center text-green-400">✓ @aicofounder/guard</td>
                  <td className="py-3 px-3 text-center text-red-400">Heavy deps</td>
                  <td className="py-3 px-3 text-center text-red-400">Heavy deps</td>
                  <td className="py-3 px-3 text-center text-yellow-400">Moderate</td>
                </tr>
                <tr>
                  <td className="py-3 px-3">Transactional state</td>
                  <td className="py-3 px-3 text-center text-green-400">✓</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                  <td className="py-3 px-3 text-center text-red-400">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
