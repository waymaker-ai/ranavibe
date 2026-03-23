'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, DollarSign, TrendingDown, BarChart3,
  Bell, Wallet, Calculator, Cpu
} from 'lucide-react';

export default function CostManagementPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cost Management</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Track, optimize, and control your AI spending. Understand how CoFounder handles
            cost tracking across providers, enforce budgets, route to cheaper models, and set up alerts.
          </p>
        </motion.div>

        {/* How Cost Tracking Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <DollarSign className="mr-3 h-6 w-6 text-gradient-from" />
            How Cost Tracking Works
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder calculates costs by counting input and output tokens for each API call and
            multiplying by the model&apos;s per-token pricing. Costs are tracked automatically when you use
            the OpenClaw guard, the dashboard, or the adapters package. The system maintains a running
            total per budget period (request, hour, day, or month) and can enforce limits at each level.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  model: 'claude-sonnet-4-20250514',
  budget: {
    limit: 100,              // $100 per period
    period: 'day',           // 'request' | 'hour' | 'day' | 'month'
    warningThreshold: 0.8,   // Warn at 80% usage
    onExceeded: 'block',     // 'block' | 'warn' | 'downgrade'
  },
});

// Every guard check automatically tracks cost
const result = await skill.hooks.beforeMessage(
  { role: 'user', content: 'Explain quantum computing' },
  { user: { id: 'user-123' } }
);

// Cost is available on the guard result
console.log(result.guardResult.cost);
// {
//   model: 'claude-sonnet-4-20250514',
//   provider: 'anthropic',
//   inputTokens: 12,
//   outputTokens: 0,     // Input guard, no output yet
//   inputCost: 0.000036,
//   outputCost: 0,
//   totalCost: 0.000036,
//   budgetRemaining: 99.99,
//   budgetWarning: false,
// }

// Get cost report
const costReport = skill.getCostReport();
console.log(costReport.totalSpent);      // $45.23
console.log(costReport.budgetLimit);     // $100.00
console.log(costReport.budgetRemaining); // $54.77
console.log(costReport.period);          // 'day'
console.log(costReport.byModel);
// { 'claude-sonnet-4-20250514': 40.00, 'gpt-4o': 5.23 }`}</pre>
          </div>
        </motion.section>

        {/* Supported Models */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Cpu className="mr-3 h-6 w-6 text-gradient-from" />
            Supported Models &amp; Pricing
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder maintains a built-in pricing table for all major models. Pricing is automatically
            updated. You can also configure custom pricing for self-hosted or fine-tuned models.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Model</th>
                  <th className="text-right py-3 px-4">Input / 1M tokens</th>
                  <th className="text-right py-3 px-4">Output / 1M tokens</th>
                  <th className="text-right py-3 px-4">Context Window</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: 'Claude Sonnet 4', input: '$3.00', output: '$15.00', context: '200K' },
                  { model: 'Claude Opus 4', input: '$15.00', output: '$75.00', context: '200K' },
                  { model: 'Claude Haiku 3.5', input: '$0.80', output: '$4.00', context: '200K' },
                  { model: 'GPT-4o', input: '$2.50', output: '$10.00', context: '128K' },
                  { model: 'GPT-4o mini', input: '$0.15', output: '$0.60', context: '128K' },
                  { model: 'GPT-4 Turbo', input: '$10.00', output: '$30.00', context: '128K' },
                  { model: 'Gemini 1.5 Pro', input: '$1.25', output: '$5.00', context: '2M' },
                  { model: 'Gemini 1.5 Flash', input: '$0.075', output: '$0.30', context: '1M' },
                  { model: 'Llama 3.1 405B', input: '$3.00', output: '$3.00', context: '128K' },
                  { model: 'Llama 3.1 70B', input: '$0.70', output: '$0.90', context: '128K' },
                  { model: 'Mistral Large', input: '$2.00', output: '$6.00', context: '128K' },
                ].map((row) => (
                  <tr key={row.model} className="border-b border-border">
                    <td className="py-3 px-4 font-medium">{row.model}</td>
                    <td className="text-right py-3 px-4 text-foreground-secondary">{row.input}</td>
                    <td className="text-right py-3 px-4 text-foreground-secondary">{row.output}</td>
                    <td className="text-right py-3 px-4 text-foreground-secondary">{row.context}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-foreground-secondary">
            Prices are approximate and may change. CoFounder tracks actual costs reported by each provider API.
          </p>
        </motion.section>

        {/* Budget Enforcement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Wallet className="mr-3 h-6 w-6 text-gradient-from" />
            Budget Enforcement Strategies
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder supports three actions when a budget is exceeded. Configure this through the
            OpenClaw skill or the policies system.
          </p>
          <div className="space-y-4 mb-6">
            <div className="card">
              <h3 className="font-semibold mb-1">Block</h3>
              <p className="text-sm text-foreground-secondary">
                Reject the request entirely. Returns a budget exceeded error to the caller.
                Best for hard spending limits.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-1">Warn</h3>
              <p className="text-sm text-foreground-secondary">
                Allow the request but log a warning and trigger alert notifications.
                Best for soft limits where you want visibility without interrupting users.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-1">Downgrade</h3>
              <p className="text-sm text-foreground-secondary">
                Automatically switch to a cheaper model. For example, downgrade from Claude Sonnet
                to Claude Haiku when the daily budget is exceeded. Maintains availability while controlling cost.
              </p>
            </div>
          </div>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// Budget enforcement through policies
// policies/cost-controls.yml
rules:
  cost:
    enabled: true
    maxCostPerRequest: 0.50      # Block any single request over $0.50
    maxCostPerDay: 100.00        # Daily limit
    maxCostPerMonth: 2000.00     # Monthly limit
    maxTokensPerRequest: 50000   # Token limit per request
    maxCompletionTokens: 4096    # Output token limit

// Programmatic budget enforcement
import { PolicyEvaluator, PolicyLoader } from '@waymakerai/aicofounder-policies';

const loader = new PolicyLoader();
const policy = await loader.loadFile('./policies/cost-controls.yml');
const evaluator = new PolicyEvaluator(policy);

// Check if a request is within budget
const result = evaluator.evaluate({
  cost: 0.03,                    // Estimated cost
  tokens: 2500,                  // Estimated tokens
  dailyCost: 85.00,              // Accumulated daily spend
  monthlyCost: 1450.00,          // Accumulated monthly spend
});

if (!result.passed) {
  const costViolations = result.violations.filter(v => v.category === 'cost');
  console.log(costViolations);
  // [{ rule: 'maxCostPerDay', severity: 'high', message: 'Daily cost limit exceeded' }]
}`}</pre>
          </div>
        </motion.section>

        {/* Model Routing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <TrendingDown className="mr-3 h-6 w-6 text-gradient-from" />
            Model Routing for Cost Optimization
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder&apos;s model router analyzes the complexity of each request and routes it to the
            most cost-effective model that can handle it. Simple queries go to cheaper models while
            complex reasoning tasks use premium models.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { ModelRouter } from '@waymakerai/aicofounder-core';

const router = new ModelRouter({
  models: [
    {
      id: 'claude-haiku',
      model: 'claude-3-5-haiku-20241022',
      provider: 'anthropic',
      costPerInputToken: 0.0000008,
      costPerOutputToken: 0.000004,
      capabilities: ['simple-chat', 'classification', 'extraction'],
      maxComplexity: 'low',
    },
    {
      id: 'claude-sonnet',
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      costPerInputToken: 0.000003,
      costPerOutputToken: 0.000015,
      capabilities: ['chat', 'reasoning', 'coding', 'analysis'],
      maxComplexity: 'high',
    },
    {
      id: 'claude-opus',
      model: 'claude-opus-4-20250514',
      provider: 'anthropic',
      costPerInputToken: 0.000015,
      costPerOutputToken: 0.000075,
      capabilities: ['complex-reasoning', 'research', 'creative'],
      maxComplexity: 'very-high',
    },
  ],
  strategy: 'cost-optimized',    // 'cost-optimized' | 'quality-first' | 'balanced'
  fallback: 'claude-sonnet',     // Default if routing fails
});

// Route a request to the cheapest suitable model
const route = await router.route({
  messages: [{ role: 'user', content: 'What is 2 + 2?' }],
  requiredCapabilities: ['simple-chat'],
});

console.log(route.selectedModel);  // 'claude-haiku' (cheapest for simple queries)
console.log(route.estimatedCost);  // $0.0001
console.log(route.reason);         // 'Simple query routed to cheapest model'

// Complex query routes to more capable model
const complexRoute = await router.route({
  messages: [{ role: 'user', content: 'Analyze this 50-page legal document...' }],
  requiredCapabilities: ['complex-reasoning', 'analysis'],
});

console.log(complexRoute.selectedModel); // 'claude-sonnet' or 'claude-opus'`}</pre>
          </div>
        </motion.section>

        {/* Caching */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Calculator className="mr-3 h-6 w-6 text-gradient-from" />
            Caching Strategies
          </h2>
          <p className="text-foreground-secondary mb-4">
            Caching identical or semantically similar requests can reduce costs by 40-70%. CoFounder
            supports exact-match caching and semantic caching (where similar questions return cached
            responses if the similarity score is above a threshold).
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { configure } from '@waymakerai/aicofounder-core';

configure({
  cache: {
    enabled: true,
    ttl: '1h',                   // Cache duration
    storage: 'redis',            // 'memory' | 'redis'
    redisUrl: process.env.REDIS_URL,

    // Exact match caching
    exactMatch: true,

    // Semantic caching - returns cached result for similar queries
    semanticMatch: {
      enabled: true,
      threshold: 0.92,           // Minimum similarity score
      embeddingModel: 'text-embedding-3-small',
    },

    // Cache key configuration
    keyStrategy: 'content-hash', // 'content-hash' | 'full-request'
    includeModel: true,          // Different models get different cache entries
    includeTemperature: true,    // Different temperatures get different entries

    // Cache warming
    warmup: [
      // Pre-cache common queries
      { query: 'What are your business hours?', model: 'claude-haiku' },
      { query: 'How do I reset my password?', model: 'claude-haiku' },
    ],
  },
});

// Cache hit statistics
const stats = await getCacheStats();
console.log(stats.hits);         // 12,000
console.log(stats.misses);       // 8,000
console.log(stats.hitRate);      // 0.60 (60% cache hit rate)
console.log(stats.costSaved);    // $450.00 saved from cache hits`}</pre>
          </div>
        </motion.section>

        {/* Cost Reports */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-gradient-from" />
            Cost Reports &amp; Analytics
          </h2>
          <p className="text-foreground-secondary mb-4">
            The dashboard provides detailed cost analytics across multiple dimensions. Query by time
            period, model, provider, user, or custom tags.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createDashboard } from '@waymakerai/aicofounder-dashboard';

const dashboard = createDashboard({ storage: 'file', storagePath: './data/events.json' });

// Cost metrics by period
const costs = await dashboard.getCostMetrics({ period: 'month' });
console.log(costs.total);               // $2,345.67
console.log(costs.projectedMonthly);    // $3,100.00
console.log(costs.trend);               // 'increasing' | 'decreasing' | 'stable'

// Cost by model
console.log(costs.byModel);
// {
//   'claude-sonnet-4-20250514': 1500.00,
//   'gpt-4o': 600.00,
//   'claude-3-5-haiku-20241022': 245.67,
// }

// Cost by provider
console.log(costs.byProvider);
// { anthropic: 1745.67, openai: 600.00 }

// Cost over time
console.log(costs.byPeriod);
// [
//   { period: '2025-01-01', cost: 75.00 },
//   { period: '2025-01-02', cost: 82.00 },
//   ...
// ]

// Export for finance team
const csvReport = await dashboard.export({
  format: 'csv',
  from: Date.now() - 30 * 86400000,  // Last 30 days
  type: 'cost',
});

const jsonReport = await dashboard.export({
  format: 'json',
  from: Date.now() - 30 * 86400000,
  type: 'cost',
});`}</pre>
          </div>
        </motion.section>

        {/* Budget Alerts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Bell className="mr-3 h-6 w-6 text-gradient-from" />
            Budget Alerts
          </h2>
          <p className="text-foreground-secondary mb-4">
            Configure proactive alerts for budget thresholds, cost spikes, and anomalies. Alerts can
            be sent to Slack, email, PagerDuty, or any webhook endpoint.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createDashboard } from '@waymakerai/aicofounder-dashboard';

const dashboard = createDashboard({
  storage: 'file',
  storagePath: './data/events.json',
  alerts: [
    {
      type: 'budget',
      enabled: true,
      thresholds: {
        daily: 50,       // Alert at $50/day
        monthly: 1000,   // Alert at $1000/month
      },
    },
    {
      type: 'anomaly',
      enabled: true,
      thresholds: {
        stddev: 3,       // Alert on 3x standard deviation in hourly spend
      },
    },
  ],
});

// Listen for alerts
dashboard.onAlert((alert) => {
  console.log(\`[\${alert.level}] \${alert.type}: \${alert.message}\`);
  // [warning] budget: Daily spend at 82% of $50 limit ($41.00)
  // [critical] budget: Monthly budget exceeded: $1,023.45 / $1,000.00
  // [critical] anomaly: Hourly cost spike: $45.00 (avg: $8.00)

  // Send notifications
  if (alert.level === 'critical') {
    sendSlackAlert(alert);
    sendPagerDutyAlert(alert);
  } else {
    sendSlackAlert(alert);
  }
});

// Check active alerts
const activeAlerts = await dashboard.getActiveAlerts();
for (const alert of activeAlerts) {
  console.log(\`\${alert.id}: \${alert.message} (since \${new Date(alert.timestamp)})\`);
}

// Acknowledge an alert
await dashboard.acknowledgeAlert(activeAlerts[0].id);

// OpenClaw budget warning threshold
// When budget hits 80%, the guard result includes a warning:
const guardResult = await skill.hooks.beforeMessage(message, context);
if (guardResult.guardResult.cost?.budgetWarning) {
  console.log(\`Budget warning: \${guardResult.guardResult.cost.budgetRemaining} remaining\`);
}`}</pre>
          </div>
        </motion.section>

        {/* Key Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Cost Optimization Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Savings', value: '70%', desc: 'With caching + routing', color: 'text-green-500' },
              { label: 'Cache Hit Rate', value: '60%', desc: 'Typical after warmup', color: 'text-blue-500' },
              { label: 'Model Routing', value: '45%', desc: 'Savings from auto-routing', color: 'text-purple-500' },
              { label: 'Providers', value: '9+', desc: 'Supported with pricing', color: 'text-orange-500' },
            ].map((stat) => (
              <div key={stat.label} className="card text-center">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="font-medium text-sm mt-1">{stat.label}</div>
                <div className="text-xs text-foreground-secondary mt-1">{stat.desc}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/enterprise"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Enterprise
          </Link>
          <Link
            href="/docs/cli"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            CLI Reference
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
