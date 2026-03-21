import Link from 'next/link';

export const metadata = {
  title: 'RANA vs NeMo Guardrails - Comparison',
  description: 'Compare RANA and NVIDIA NeMo Guardrails for AI safety and guardrails',
};

export default function NemoGuardrailsComparePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <Link href="/compare" className="text-gray-400 hover:text-white mb-8 inline-block">
          &larr; Back to comparisons
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          RANA vs NeMo Guardrails
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          NVIDIA NeMo Guardrails pioneered programmable AI safety. RANA builds on the same
          principles — PII detection, injection blocking, topical control, content safety —
          then adds compliance frameworks, cost tracking, CI/CD, MCP, and observability.
          TypeScript-first, zero dependencies optional, works with any LLM provider.
        </p>

        {/* Side by side code */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">NeMo Guardrails (Python + Colang)</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`# config.yml
models:
  - type: main
    engine: openai
    model: gpt-4

# config.co (Colang)
define user ask about politics
  "What do you think about..."

define flow politics
  user ask about politics
  bot refuse to respond

define bot refuse to respond
  "I'm not able to discuss political topics."

# Python
from nemoguardrails import RailsConfig, LLMRails

config = RailsConfig.from_path("./config")
rails = LLMRails(config)
response = rails.generate(
  messages=[{"role": "user", "content": input}]
)`}</code></pre>
          </div>

          <div className="rounded-xl border border-blue-800/50 bg-blue-900/10 p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">RANA (TypeScript, zero deps)</h3>
            <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`import { createGuard } from '@ranavibe/guard';

// One line — everything enabled
const g = createGuard({
  pii: 'redact',
  injection: 'block',
  toxicity: 'block',
  budget: { limit: 10, period: 'day' },
  models: ['claude-sonnet-4-6', 'gpt-4o'],
});

// Wrap any client — automatic guardrails
const client = g.wrap(new Anthropic());

// Or use pre-built compliant agents
import { createHIPAAAgent } from '@ranavibe/agent-sdk';
const agent = createHIPAAAgent({
  model: 'claude-sonnet-4-6',
  auditPath: './hipaa-audit.log',
});`}</code></pre>
          </div>
        </div>

        {/* Feature comparison */}
        <h2 className="text-2xl font-bold mb-6">Feature-by-Feature Comparison</h2>
        <div className="rounded-xl border border-gray-800 overflow-hidden mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="py-4 px-4 text-left font-semibold">Capability</th>
                <th className="py-4 px-4 text-center font-semibold">RANA</th>
                <th className="py-4 px-4 text-center font-semibold">NeMo Guardrails</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {[
                ['Language', 'TypeScript', 'Python + Colang DSL'],
                ['PII Detection', '✓ 20+ patterns, Luhn validation', '✓ via NIM microservices'],
                ['Prompt Injection', '✓ 25+ patterns, scoring system', '✓ built-in'],
                ['Content Safety', '✓ 7 categories, severity levels', '✓ via content safety NIM'],
                ['Topical Control', '✓ via policies & guidelines', '✓ via Colang dialog flows'],
                ['Output Rails', '✓ output interceptors', '✓ output moderation'],
                ['Compliance (HIPAA/GDPR/SEC)', '✓ 9 frameworks, real rules', '✗'],
                ['Cost Tracking', '✓ 25+ models, budget enforcement', '✗'],
                ['Agent SDK Wrapping', '✓ Anthropic, OpenAI, Google', '✗'],
                ['MCP Server', '✓ 15+ tools for Claude/Cursor', '✗'],
                ['CI/CD Integration', '✓ GitHub Action + SARIF', '✗'],
                ['Observability Dashboard', '✓ metrics, alerts, API', '✗'],
                ['Declarative Policies', '✓ YAML with 9 presets', '✓ Colang DSL'],
                ['Zero Dependencies', '✓ @ranavibe/guard', '✗ heavy Python deps'],
                ['GPU Acceleration', '✗ not needed (regex-based)', '✓ NIM microservices'],
                ['Hallucination Detection', '✓ via fact-check rails', '✓ built-in'],
                ['Multi-provider', '✓ 9+ LLM providers', '✓ OpenAI, NVIDIA'],
              ].map(([feature, rana, nemo], i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-3 px-4">{feature}</td>
                  <td className={`py-3 px-4 text-center ${(rana as string).startsWith('✓') ? 'text-green-400' : (rana as string).startsWith('✗') ? 'text-red-400' : ''}`}>{rana}</td>
                  <td className={`py-3 px-4 text-center ${(nemo as string).startsWith('✓') ? 'text-green-400' : (nemo as string).startsWith('✗') ? 'text-red-400' : ''}`}>{nemo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* When to choose */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Choose RANA when you need:</h3>
            <ul className="space-y-2 text-gray-300">
              <li>- TypeScript/Node.js ecosystem</li>
              <li>- Compliance frameworks (HIPAA, GDPR, SEC, PCI)</li>
              <li>- Cost tracking and budget enforcement</li>
              <li>- CI/CD integration (GitHub Action)</li>
              <li>- MCP tools for Claude Desktop/Code</li>
              <li>- Zero-dependency lightweight guard</li>
              <li>- Observability dashboard</li>
              <li>- Works with any LLM provider</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-xl font-bold text-gray-400 mb-4">Choose NeMo Guardrails when you need:</h3>
            <ul className="space-y-2 text-gray-400">
              <li>- Python-first ecosystem</li>
              <li>- Colang DSL for dialog flow control</li>
              <li>- GPU-accelerated safety models (NIM)</li>
              <li>- NVIDIA enterprise ecosystem</li>
              <li>- Existing LangChain/LlamaIndex Python stack</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/docs/quick-start"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Get Started with RANA &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
