import Link from 'next/link';

export const metadata = {
  title: 'RANA vs NemoClaw / OpenClaw - Comparison',
  description: 'Compare RANA guardrails with NVIDIA NemoClaw and the OpenClaw ecosystem',
};

export default function NemoClawComparePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <Link href="/compare" className="text-gray-400 hover:text-white mb-8 inline-block">
          &larr; Back to comparisons
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          RANA vs NemoClaw / OpenClaw
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          OpenClaw is the viral open-source AI agent (100K+ GitHub stars). NemoClaw is
          NVIDIA{"'"}s project that adds security guardrails to OpenClaw via NeMo Guardrails + OpenShell.
          RANA provides the same guardrail capabilities — and more — for <strong className="text-white">any</strong> agent
          framework, not just OpenClaw.
        </p>

        {/* Architecture comparison */}
        <h2 className="text-2xl font-bold mb-6">Architecture Comparison</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">NemoClaw Stack</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                <strong>OpenClaw Agent</strong> — autonomous AI agent
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                <strong>NeMo Guardrails</strong> — PII, injection, content safety
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                <strong>OpenShell</strong> — sandboxed execution environment
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                <strong>Privacy Router</strong> — local vs cloud model switching
              </div>
              <p className="text-xs text-gray-500 mt-2">Python only. OpenClaw only. NVIDIA GPU recommended.</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-800/50 bg-blue-900/10 p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">RANA Stack</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="p-3 rounded bg-blue-800/20 border border-blue-700/50">
                <strong>Any Agent</strong> — Anthropic SDK, OpenClaw, LangChain, custom
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-blue-800/20 border border-blue-700/50">
                <strong>@ranavibe/agent-sdk</strong> — 7 interceptors, compliance factories
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-blue-800/20 border border-blue-700/50">
                <strong>@ranavibe/guard</strong> — zero-dep PII, injection, cost, rate-limit
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-blue-800/20 border border-blue-700/50">
                <strong>@ranavibe/policies</strong> — 9 compliance presets (HIPAA, GDPR, SEC...)
              </div>
              <div className="text-center text-gray-500">&darr;</div>
              <div className="p-3 rounded bg-blue-800/20 border border-blue-700/50">
                <strong>@ranavibe/dashboard</strong> — observability, alerts, Prometheus
              </div>
              <p className="text-xs text-blue-400 mt-2">TypeScript. Any agent. Any provider. Zero deps available.</p>
            </div>
          </div>
        </div>

        {/* What RANA adds beyond NemoClaw */}
        <h2 className="text-2xl font-bold mb-6">What RANA Adds Beyond NemoClaw</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            { title: '9 Compliance Frameworks', desc: 'HIPAA, GDPR, CCPA, SEC, PCI, SOX, FERPA, Safety, Enterprise — with real regulatory rules' },
            { title: 'Cost Tracking & Budgets', desc: 'Real-time pricing for 25+ models. Per-request, hourly, daily, monthly budget enforcement' },
            { title: 'CI/CD Security Scanning', desc: 'GitHub Action scans PRs for hardcoded keys, PII in prompts, injection vulnerabilities' },
            { title: 'MCP Server (15+ tools)', desc: 'Use guardrails from Claude Desktop, Claude Code, or Cursor without writing code' },
            { title: 'Observability Dashboard', desc: 'Metrics, anomaly detection, compliance scoring, Prometheus export, HTTP API' },
            { title: 'Agent-Agnostic', desc: 'Works with Anthropic SDK, OpenAI, Google, LangChain, CrewAI — not locked to OpenClaw' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
              <h4 className="font-semibold text-green-400 mb-2">{item.title}</h4>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Code example */}
        <h2 className="text-2xl font-bold mb-6">Guardrailing OpenClaw with RANA</h2>
        <p className="text-gray-400 mb-4">
          RANA can be used as a guardrail layer for OpenClaw agents, similar to what NemoClaw does
          but with more features and TypeScript support:
        </p>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-16">
          <pre className="text-sm text-gray-300 overflow-x-auto"><code>{`import { createGuard } from '@ranavibe/guard';
import { PolicyEngine } from '@ranavibe/policies';
import { RanaDashboard } from '@ranavibe/dashboard';

// 1. Create guard with compliance policies
const policies = PolicyEngine.fromPresets(['hipaa', 'gdpr', 'safety']);
const guard = createGuard({
  pii: 'redact',
  injection: 'block',
  toxicity: 'block',
  budget: { limit: 50, period: 'day' },
});

// 2. Set up observability
const dashboard = new RanaDashboard({ storage: 'file' });

// 3. Guard any agent input/output (OpenClaw, Anthropic, etc.)
async function guardedAgentCall(input: string) {
  // Check input
  const inputCheck = guard.check(input, { direction: 'input' });
  if (inputCheck.blocked) throw new Error(inputCheck.reason);

  // Check policies
  const policyCheck = policies.evaluate(inputCheck.redacted || input);
  if (!policyCheck.allowed) throw new Error(policyCheck.violations[0].message);

  // Call your agent (OpenClaw, Anthropic SDK, etc.)
  const output = await yourAgent.run(inputCheck.redacted || input);

  // Check output
  const outputCheck = guard.check(output, { direction: 'output' });

  // Track in dashboard
  dashboard.collect({ type: 'llm_request', cost: 0.03, model: 'claude-sonnet-4-6' });

  return outputCheck.redacted || output;
}`}</code></pre>
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
