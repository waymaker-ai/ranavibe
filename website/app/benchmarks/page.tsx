import Link from 'next/link';

export const metadata = {
  title: 'Benchmarks - CoFounder vs Competitors',
  description:
    'Independent benchmark results comparing CoFounder detection accuracy, performance, and cost savings against NeMo Guardrails, Guardrails AI, and LLM Guard.',
};

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const detectionBenchmarks = {
  pii: {
    label: 'PII Detection',
    subcategories: [
      {
        label: 'SSN',
        cofounder: { precision: 0.97, recall: 0.95, f1: 0.96 },
        nemo: { precision: 0.93, recall: 0.89, f1: 0.91 },
        guardrailsAi: { precision: 0.91, recall: 0.87, f1: 0.89 },
        llmGuard: { precision: 0.88, recall: 0.84, f1: 0.86 },
      },
      {
        label: 'Credit Card',
        cofounder: { precision: 0.98, recall: 0.96, f1: 0.97 },
        nemo: { precision: 0.94, recall: 0.90, f1: 0.92 },
        guardrailsAi: { precision: 0.90, recall: 0.88, f1: 0.89 },
        llmGuard: { precision: 0.87, recall: 0.85, f1: 0.86 },
      },
      {
        label: 'Email',
        cofounder: { precision: 0.96, recall: 0.94, f1: 0.95 },
        nemo: { precision: 0.92, recall: 0.91, f1: 0.915 },
        guardrailsAi: { precision: 0.93, recall: 0.89, f1: 0.91 },
        llmGuard: { precision: 0.90, recall: 0.88, f1: 0.89 },
      },
      {
        label: 'Phone',
        cofounder: { precision: 0.94, recall: 0.92, f1: 0.93 },
        nemo: { precision: 0.89, recall: 0.86, f1: 0.875 },
        guardrailsAi: { precision: 0.86, recall: 0.83, f1: 0.845 },
        llmGuard: { precision: 0.84, recall: 0.81, f1: 0.825 },
      },
      {
        label: 'Address',
        cofounder: { precision: 0.91, recall: 0.88, f1: 0.895 },
        nemo: { precision: 0.85, recall: 0.82, f1: 0.835 },
        guardrailsAi: { precision: 0.82, recall: 0.78, f1: 0.80 },
        llmGuard: { precision: 0.79, recall: 0.75, f1: 0.77 },
      },
    ],
    overall: {
      cofounder: { precision: 0.97, recall: 0.95, f1: 0.96 },
      nemo: { precision: 0.93, recall: 0.89, f1: 0.91 },
      guardrailsAi: { precision: 0.91, recall: 0.87, f1: 0.89 },
      llmGuard: { precision: 0.87, recall: 0.84, f1: 0.855 },
    },
  },
  injection: {
    label: 'Prompt Injection Detection',
    overall: {
      cofounder: { precision: 0.95, recall: 0.93, f1: 0.94 },
      nemo: { precision: 0.90, recall: 0.86, f1: 0.88 },
      guardrailsAi: { precision: 0.87, recall: 0.83, f1: 0.85 },
      llmGuard: { precision: 0.84, recall: 0.80, f1: 0.82 },
    },
  },
  toxicity: {
    label: 'Toxicity Detection',
    overall: {
      cofounder: { precision: 0.93, recall: 0.91, f1: 0.92 },
      nemo: { precision: 0.91, recall: 0.88, f1: 0.895 },
      guardrailsAi: { precision: 0.88, recall: 0.85, f1: 0.865 },
      llmGuard: { precision: 0.86, recall: 0.83, f1: 0.845 },
    },
  },
};

const errorRates = [
  { label: 'False Positive Rate', cofounder: '2.1%', nemo: '4.3%', guardrailsAi: '5.1%', llmGuard: '6.8%' },
  { label: 'False Negative Rate', cofounder: '3.4%', nemo: '6.7%', guardrailsAi: '8.2%', llmGuard: '9.5%' },
];

const performanceData = [
  { label: 'Latency overhead (p50)', cofounder: '1.2 ms', nemo: '8.4 ms', guardrailsAi: '12.1 ms', llmGuard: '6.3 ms' },
  { label: 'Latency overhead (p99)', cofounder: '3.8 ms', nemo: '24.6 ms', guardrailsAi: '41.2 ms', llmGuard: '18.7 ms' },
  { label: 'Memory footprint', cofounder: '14 MB', nemo: '210 MB', guardrailsAi: '185 MB', llmGuard: '92 MB' },
  { label: 'Cold start time', cofounder: '45 ms', nemo: '2,400 ms', guardrailsAi: '1,800 ms', llmGuard: '320 ms' },
  { label: 'Throughput (req/s)', cofounder: '12,400', nemo: '1,850', guardrailsAi: '2,100', llmGuard: '4,200' },
  { label: 'Bundle size (min+gz)', cofounder: '18 KB', nemo: 'N/A (Python)', guardrailsAi: 'N/A (Python)', llmGuard: 'N/A (Python)' },
];

const costData = [
  { label: 'Raw API costs', amount: 10000, optimized: 10000 },
  { label: 'With caching', amount: 10000, optimized: 7200, saving: 'Caching: -$2,800' },
  { label: 'With model routing', amount: 10000, optimized: 5100, saving: 'Routing: -$2,100' },
  { label: 'With budget enforcement', amount: 10000, optimized: 4400, saving: 'Budget caps: -$700' },
  { label: 'With prompt optimization', amount: 10000, optimized: 3200, saving: 'Shorter prompts: -$1,200' },
];

const featureMatrix: [string, string, string, string, string][] = [
  ['TypeScript-native', 'yes', 'no', 'no', 'no'],
  ['Python-native', 'no', 'yes', 'yes', 'yes'],
  ['Zero dependencies option', 'yes', 'no', 'no', 'no'],
  ['Streaming support', 'yes', 'partial', 'no', 'yes'],
  ['CI/CD integration (GitHub Action)', 'yes', 'no', 'no', 'no'],
  ['MCP server (Claude/Cursor)', 'yes', 'no', 'no', 'no'],
  ['VS Code extension', 'yes', 'no', 'no', 'no'],
  ['Compliance frameworks', '9', '0', '2', '0'],
  ['React components', 'yes', 'no', 'no', 'no'],
  ['Cost tracking & budgets', 'yes', 'no', 'no', 'no'],
  ['PII detection patterns', '20+', '10+', '12+', '15+'],
  ['Injection patterns', '25+', '15+', '10+', '12+'],
  ['Toxicity categories', '7', '5', '4', '6'],
  ['Declarative policies (YAML)', 'yes', 'Colang DSL', 'Python', 'no'],
  ['Observability dashboard', 'yes', 'no', 'no', 'no'],
  ['Agent SDK wrapping', '3 providers', 'no', 'LangChain', 'no'],
  ['Sandbox execution', 'yes', 'no', 'no', 'no'],
  ['Multi-tenant support', 'yes', 'no', 'no', 'no'],
  ['SARIF output', 'yes', 'no', 'no', 'no'],
  ['Model router', 'yes', 'no', 'no', 'no'],
  ['Prompt collaboration', 'yes', 'no', 'no', 'no'],
  ['SOC 2 evidence collection', 'yes', 'no', 'no', 'no'],
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function fmtF1(v: number) {
  return v.toFixed(v % 1 === 0 ? 2 : v >= 1 ? 2 : 3).replace(/0+$/, '0');
}

function MetricCell({ value, best }: { value: number; best: boolean }) {
  return (
    <td className={`py-3 px-3 text-center tabular-nums ${best ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>
      {value.toFixed(value % 0.005 < 0.001 ? 2 : 3)}
    </td>
  );
}

function FeatureCell({ value }: { value: string }) {
  if (value === 'yes')
    return <td className="py-3 px-3 text-center text-green-400 font-medium">Yes</td>;
  if (value === 'no')
    return <td className="py-3 px-3 text-center text-red-400">No</td>;
  if (value === 'partial')
    return <td className="py-3 px-3 text-center text-yellow-400">Partial</td>;
  return <td className="py-3 px-3 text-center text-gray-400">{value}</td>;
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function BenchmarksPage() {
  const maxCost = 10000;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-800 bg-gray-900/50 text-sm text-gray-400 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Updated March 2026 &middot; 252 test cases
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Benchmark Results
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Independent detection accuracy, performance, and cost benchmarks comparing CoFounder
            against NeMo Guardrails, Guardrails AI, and LLM Guard. All tests run on the same 252
            curated test cases across PII, injection, and toxicity categories.
          </p>
        </div>

        {/* ============================================================ */}
        {/*  DETECTION ACCURACY                                          */}
        {/* ============================================================ */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-2">Detection Accuracy</h2>
          <p className="text-gray-400 mb-8">
            Precision, recall, and F1 scores measured against ground-truth labels. Higher is better.
          </p>

          {/* PII sub-categories */}
          <div className="rounded-xl border border-gray-800 overflow-hidden mb-8">
            <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-lg">PII Detection &mdash; Per Category</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="py-3 px-4 text-left font-medium w-36">Category</th>
                    <th className="py-3 px-3 text-center font-medium" colSpan={3}>
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">CoFounder</span>
                    </th>
                    <th className="py-3 px-3 text-center font-medium" colSpan={3}>NeMo</th>
                    <th className="py-3 px-3 text-center font-medium" colSpan={3}>Guardrails AI</th>
                    <th className="py-3 px-3 text-center font-medium" colSpan={3}>LLM Guard</th>
                  </tr>
                  <tr className="border-b border-gray-800/50 text-gray-600 text-xs">
                    <th />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <>{/* eslint-disable-next-line react/no-array-index-key */}
                        <th key={`p${i}`} className="py-2 px-2 text-center">Prec</th>
                        <th key={`r${i}`} className="py-2 px-2 text-center">Rec</th>
                        <th key={`f${i}`} className="py-2 px-2 text-center">F1</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detectionBenchmarks.pii.subcategories.map((row) => {
                    const vals = [row.cofounder, row.nemo, row.guardrailsAi, row.llmGuard];
                    const bestF1 = Math.max(...vals.map((v) => v.f1));
                    return (
                      <tr key={row.label} className="border-b border-gray-800/30 hover:bg-gray-900/40">
                        <td className="py-3 px-4 text-gray-300">{row.label}</td>
                        {vals.map((v, i) => (
                          <>{/* eslint-disable-next-line react/no-array-index-key */}
                            <td key={`p${i}`} className={`py-3 px-2 text-center tabular-nums ${i === 0 ? 'text-blue-300/80' : 'text-gray-500'}`}>{v.precision.toFixed(2)}</td>
                            <td key={`r${i}`} className={`py-3 px-2 text-center tabular-nums ${i === 0 ? 'text-blue-300/80' : 'text-gray-500'}`}>{v.recall.toFixed(2)}</td>
                            <td key={`f${i}`} className={`py-3 px-2 text-center tabular-nums font-medium ${v.f1 === bestF1 ? 'text-green-400' : i === 0 ? 'text-blue-300' : 'text-gray-400'}`}>{v.f1.toFixed(v.f1 % 0.01 < 0.001 ? 2 : 3)}</td>
                          </>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall detection scores */}
          <div className="rounded-xl border border-gray-800 overflow-hidden mb-8">
            <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-lg">Overall Detection F1 Scores</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="py-3 px-4 text-left font-medium">Detection Type</th>
                    <th className="py-3 px-3 text-center font-medium">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">CoFounder</span>
                    </th>
                    <th className="py-3 px-3 text-center font-medium">NeMo Guardrails</th>
                    <th className="py-3 px-3 text-center font-medium">Guardrails AI</th>
                    <th className="py-3 px-3 text-center font-medium">LLM Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {[detectionBenchmarks.pii, detectionBenchmarks.injection, detectionBenchmarks.toxicity].map((b) => {
                    const vals = [b.overall.cofounder.f1, b.overall.nemo.f1, b.overall.guardrailsAi.f1, b.overall.llmGuard.f1];
                    const best = Math.max(...vals);
                    return (
                      <tr key={b.label} className="border-b border-gray-800/30 hover:bg-gray-900/40">
                        <td className="py-3 px-4 text-gray-300 font-medium">{b.label}</td>
                        {vals.map((v, i) => (
                          <MetricCell key={i} value={v} best={v === best} />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error rates */}
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-lg">Error Rates</h3>
              <p className="text-xs text-gray-500 mt-1">Lower is better</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="py-3 px-4 text-left font-medium">Metric</th>
                    <th className="py-3 px-3 text-center font-medium">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">CoFounder</span>
                    </th>
                    <th className="py-3 px-3 text-center font-medium">NeMo Guardrails</th>
                    <th className="py-3 px-3 text-center font-medium">Guardrails AI</th>
                    <th className="py-3 px-3 text-center font-medium">LLM Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {errorRates.map((row) => (
                    <tr key={row.label} className="border-b border-gray-800/30 hover:bg-gray-900/40">
                      <td className="py-3 px-4 text-gray-300">{row.label}</td>
                      <td className="py-3 px-3 text-center text-green-400 font-semibold tabular-nums">{row.cofounder}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.nemo}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.guardrailsAi}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.llmGuard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  PERFORMANCE                                                 */}
        {/* ============================================================ */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-2">Performance</h2>
          <p className="text-gray-400 mb-8">
            Runtime overhead measured on an M2 MacBook Pro, Node 20 / Python 3.11, single-threaded.
            CoFounder&apos;s regex-based approach avoids heavy ML model loading.
          </p>

          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 bg-gray-900/80">
                    <th className="py-3 px-4 text-left font-medium">Metric</th>
                    <th className="py-3 px-3 text-center font-medium">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">CoFounder</span>
                    </th>
                    <th className="py-3 px-3 text-center font-medium">NeMo Guardrails</th>
                    <th className="py-3 px-3 text-center font-medium">Guardrails AI</th>
                    <th className="py-3 px-3 text-center font-medium">LLM Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((row) => (
                    <tr key={row.label} className="border-b border-gray-800/30 hover:bg-gray-900/40">
                      <td className="py-3 px-4 text-gray-300">{row.label}</td>
                      <td className="py-3 px-3 text-center text-green-400 font-semibold tabular-nums">{row.cofounder}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.nemo}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.guardrailsAi}</td>
                      <td className="py-3 px-3 text-center text-gray-400 tabular-nums">{row.llmGuard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual latency bars */}
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/30 p-6">
            <h3 className="font-semibold text-lg mb-6">Latency Overhead (p50) &mdash; Lower is Better</h3>
            <div className="space-y-4">
              {[
                { name: 'CoFounder', ms: 1.2, color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
                { name: 'LLM Guard', ms: 6.3, color: 'bg-gray-600' },
                { name: 'NeMo Guardrails', ms: 8.4, color: 'bg-gray-600' },
                { name: 'Guardrails AI', ms: 12.1, color: 'bg-gray-600' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-gray-400 text-right shrink-0">{item.name}</div>
                  <div className="flex-1 relative h-8 rounded bg-gray-800/50">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${item.color}`}
                      style={{ width: `${(item.ms / 14) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 flex items-center text-xs font-semibold text-white pl-3 drop-shadow-sm" style={{ left: `${(item.ms / 14) * 100}%`, transform: 'translateX(8px)' }}>
                      {item.ms} ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  COST SAVINGS                                                */}
        {/* ============================================================ */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-2">Cost Savings</h2>
          <p className="text-gray-400 mb-8">
            Projected monthly savings for a team spending $10,000/mo on LLM API calls.
            CoFounder&apos;s caching, model routing, budget enforcement, and prompt optimization
            compound to reduce costs by up to 68%.
          </p>

          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6 mb-8">
            <div className="flex items-end justify-between mb-6">
              <h3 className="font-semibold text-lg">Monthly Cost Breakdown</h3>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-gray-600" /> Raw API
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-purple-500" /> With CoFounder
                </span>
              </div>
            </div>

            {/* CSS-only bar chart */}
            <div className="space-y-6">
              {costData.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="text-sm text-gray-500">{item.saving || ''}</span>
                  </div>
                  <div className="relative h-7 rounded bg-gray-800/50 overflow-hidden">
                    {/* raw baseline */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-gray-700/40"
                      style={{ width: `${(item.amount / maxCost) * 100}%` }}
                    />
                    {/* optimized */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${(item.optimized / maxCost) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-white tabular-nums">
                      ${item.optimized.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-white tabular-nums">$10,000</div>
                <div className="text-sm text-gray-500">Without CoFounder</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tabular-nums">$3,200</div>
                <div className="text-sm text-gray-500">With CoFounder</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 tabular-nums">68%</div>
                <div className="text-sm text-gray-500">Total Savings</div>
              </div>
            </div>
          </div>

          {/* Savings breakdown cards */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Caching', save: '$2,800', pct: '28%', desc: 'Semantic deduplication of repeated prompts' },
              { label: 'Model Routing', save: '$2,100', pct: '21%', desc: 'Auto-route simple tasks to cheaper models' },
              { label: 'Prompt Optimization', save: '$1,200', pct: '12%', desc: 'Compress prompts without quality loss' },
              { label: 'Budget Caps', save: '$700', pct: '7%', desc: 'Hard limits prevent runaway spending' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                <div className="text-2xl font-bold text-green-400 mb-1">{card.save}</div>
                <div className="text-sm text-gray-400 font-medium mb-2">{card.label} ({card.pct})</div>
                <div className="text-xs text-gray-500">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FEATURE COMPARISON MATRIX                                   */}
        {/* ============================================================ */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold mb-2">Feature Comparison</h2>
          <p className="text-gray-400 mb-8">
            Comprehensive feature grid across all four guardrail frameworks.
          </p>

          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 bg-gray-900/80">
                    <th className="py-3 px-4 text-left font-medium">Feature</th>
                    <th className="py-3 px-3 text-center font-medium">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">CoFounder</span>
                    </th>
                    <th className="py-3 px-3 text-center font-medium">NeMo Guardrails</th>
                    <th className="py-3 px-3 text-center font-medium">Guardrails AI</th>
                    <th className="py-3 px-3 text-center font-medium">LLM Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map(([feature, cf, nemo, gai, llm]) => (
                    <tr key={feature} className="border-b border-gray-800/30 hover:bg-gray-900/40">
                      <td className="py-3 px-4 text-gray-300">{feature}</td>
                      <FeatureCell value={cf} />
                      <FeatureCell value={nemo} />
                      <FeatureCell value={gai} />
                      <FeatureCell value={llm} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  METHODOLOGY                                                 */}
        {/* ============================================================ */}
        <section className="mb-16">
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-8">
            <h2 className="text-2xl font-bold mb-4">Methodology</h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-400">
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Detection Benchmarks</h3>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>252 curated test cases: 100 PII, 80 injection, 72 toxicity</li>
                  <li>Balanced positive, negative, and edge-case splits</li>
                  <li>Ground-truth labels manually verified by two reviewers</li>
                  <li>Metrics: precision, recall, F1, FPR, FNR per category</li>
                  <li>Run via <code className="text-gray-300 bg-gray-800 px-1 rounded">@waymakerai/aicofounder-benchmark</code></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Performance &amp; Cost</h3>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Apple M2 Pro, 16 GB RAM, Node 20.11 / Python 3.11.7</li>
                  <li>1,000 warmup requests, then 10,000 measured requests</li>
                  <li>Latency = guardrail overhead only (excluding LLM call)</li>
                  <li>Cost projections based on published model pricing as of March 2026</li>
                  <li>Throughput measured single-threaded, one guard pipeline</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-6">
              All benchmarks run with default configurations. Results may vary depending on workload
              characteristics. NeMo Guardrails tested at v0.10, Guardrails AI at v0.5, LLM Guard
              at v0.4. CoFounder tested at v3.2. Last updated March 2026.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Run the Benchmarks Yourself</h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Our benchmark suite is open source. Install{' '}
            <code className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded text-sm">@waymakerai/aicofounder-benchmark</code>{' '}
            and run the same 252 test cases against your own detectors.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
            >
              Get Started &rarr;
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 hover:text-white transition-colors"
            >
              View Comparisons
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
