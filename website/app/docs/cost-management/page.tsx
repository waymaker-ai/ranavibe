'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingDown, BarChart3, Bell, Wallet, Calculator } from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Cost Tracking',
    description: 'Real-time tracking of all AI API costs',
    code: `import { CostTracker } from '@rana/core';

const tracker = new CostTracker({
  storage: 'postgresql',
  currency: 'USD'
});

// Automatic tracking on all requests
const result = await tracker.wrap(
  () => chat('Hello, world!'),
  { userId: 'user-123', feature: 'chat' }
);

console.log(result.cost);         // $0.0023
console.log(result.inputTokens);  // 15
console.log(result.outputTokens); // 42

// Get cost summary
const daily = await tracker.getDailyCosts();
const byUser = await tracker.getCostsByUser('user-123');
const byFeature = await tracker.getCostsByMetadata('feature');

// Export for billing
const invoice = await tracker.generateInvoice({
  userId: 'user-123',
  period: 'last-month'
});`,
  },
  {
    icon: Wallet,
    title: 'Budget Management',
    description: 'Set and enforce spending limits',
    code: `import { BudgetManager } from '@rana/core';

const budget = new BudgetManager({
  storage: 'redis',
  alertThresholds: [0.5, 0.8, 0.9, 1.0]
});

// Set global budget
await budget.setGlobalBudget({
  daily: 100,    // $100/day
  monthly: 2000  // $2000/month
});

// Set per-user budgets
await budget.setUserBudget('user-123', {
  daily: 5,
  monthly: 50
});

// Check budget before request
const allowed = await budget.checkBudget('user-123', estimatedCost);

if (!allowed.success) {
  console.log(\`Budget exceeded: \${allowed.reason}\`);
  console.log(\`Resets at: \${allowed.resetsAt}\`);
  throw new BudgetExceededError(allowed);
}

// Listen for alerts
budget.on('threshold', (userId, percentage, budget) => {
  if (percentage >= 0.8) {
    notifyUser(userId, \`You've used \${percentage * 100}% of your budget\`);
  }
});`,
  },
  {
    icon: TrendingDown,
    title: 'Cost Optimization',
    description: 'Automatic cost reduction strategies',
    code: `import { CostOptimizer } from '@rana/core';

const optimizer = new CostOptimizer({
  strategies: ['caching', 'model-routing', 'prompt-compression'],
  targetSavings: 0.5  // Target 50% cost reduction
});

// Automatic optimization
const result = await optimizer.optimize(
  () => chat(longPrompt),
  { quality: 'balanced' }  // 'fast', 'balanced', 'quality'
);

console.log(result.originalCost);   // $0.05
console.log(result.optimizedCost);  // $0.02
console.log(result.savings);        // 60%
console.log(result.strategies);     // ['cached', 'compressed']

// Get optimization recommendations
const recommendations = await optimizer.analyze();
// [
//   { type: 'caching', potentialSavings: '$500/mo', effort: 'low' },
//   { type: 'model-routing', potentialSavings: '$300/mo', effort: 'medium' },
// ]`,
  },
  {
    icon: Calculator,
    title: 'Cost Estimation',
    description: 'Predict costs before making requests',
    code: `import { CostEstimator } from '@rana/core';

const estimator = new CostEstimator();

// Estimate single request
const estimate = estimator.estimate({
  model: 'claude-sonnet-4-20250514',
  inputText: userPrompt,
  expectedOutputTokens: 500
});

console.log(estimate.inputCost);   // $0.003
console.log(estimate.outputCost);  // $0.015
console.log(estimate.totalCost);   // $0.018
console.log(estimate.confidence);  // 0.95

// Estimate batch processing
const batchEstimate = estimator.estimateBatch({
  model: 'claude-sonnet-4-20250514',
  documents: documents,
  operation: 'summarize'
});

console.log(batchEstimate.totalCost);     // $45.00
console.log(batchEstimate.timeEstimate);  // '2 hours'

// Compare model costs
const comparison = estimator.compareModels(userPrompt, [
  'claude-sonnet-4-20250514',
  'gpt-4o',
  'gemini-pro'
]);`,
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Detailed analytics and reporting',
    code: `import { UsageAnalytics } from '@rana/core';

const analytics = new UsageAnalytics({
  storage: 'postgresql',
  retention: '1 year'
});

// Get usage breakdown
const usage = await analytics.getUsage({
  period: 'last-30-days',
  groupBy: ['model', 'feature', 'user']
});

// Cost trends
const trends = await analytics.getTrends({
  metric: 'cost',
  period: 'last-6-months',
  resolution: 'weekly'
});

// Top consumers
const topUsers = await analytics.getTopConsumers({
  metric: 'cost',
  limit: 10
});

// Export reports
const report = await analytics.exportReport({
  format: 'pdf',
  period: 'last-quarter',
  sections: ['summary', 'breakdown', 'trends', 'recommendations']
});

// Dashboard data
const dashboard = await analytics.getDashboard();
console.log(dashboard.totalCost);       // $1,234.56
console.log(dashboard.costChange);      // -15% (vs last period)
console.log(dashboard.topModels);       // [{ model: 'gpt-4', cost: $800 }]`,
  },
  {
    icon: Bell,
    title: 'Cost Alerts',
    description: 'Proactive alerting for cost anomalies',
    code: `import { CostAlerts } from '@rana/core';

const alerts = new CostAlerts({
  channels: [
    { type: 'email', recipients: ['admin@company.com'] },
    { type: 'slack', webhook: process.env.SLACK_WEBHOOK },
    { type: 'pagerduty', routingKey: process.env.PD_KEY }
  ]
});

// Budget alerts
alerts.addRule({
  name: 'daily-budget-warning',
  condition: 'daily_cost > daily_budget * 0.8',
  severity: 'warning',
  channels: ['email', 'slack']
});

// Anomaly detection
alerts.addRule({
  name: 'cost-spike',
  condition: 'hourly_cost > avg_hourly_cost * 3',
  severity: 'critical',
  channels: ['slack', 'pagerduty']
});

// Per-user alerts
alerts.addRule({
  name: 'user-overspend',
  condition: 'user_daily_cost > user_daily_limit',
  severity: 'high',
  action: async (context) => {
    await disableUser(context.userId);
    await notifyAdmin(context);
  }
});

// Start monitoring
alerts.start();`,
  },
];

export default function CostManagementPage() {
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
              <DollarSign className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Cost Management</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Track, optimize, and control your AI spending. Budget management,
            cost estimation, analytics, and automated optimization.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/core
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Avg. Savings', value: '70%', color: 'text-green-500' },
            { label: 'Providers', value: '9+', color: 'text-blue-500' },
            { label: 'Real-time', value: 'Yes', color: 'text-purple-500' },
            { label: 'Alerts', value: 'Built-in', color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-foreground-secondary">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Model Pricing Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Model</th>
                  <th className="text-right py-3 px-4">Input (per 1M tokens)</th>
                  <th className="text-right py-3 px-4">Output (per 1M tokens)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { model: 'Claude 3.5 Sonnet', input: '$3.00', output: '$15.00' },
                  { model: 'Claude 3 Opus', input: '$15.00', output: '$75.00' },
                  { model: 'GPT-4o', input: '$5.00', output: '$15.00' },
                  { model: 'GPT-4 Turbo', input: '$10.00', output: '$30.00' },
                  { model: 'Gemini Pro', input: '$0.50', output: '$1.50' },
                  { model: 'Llama 3 70B', input: '$0.70', output: '$0.90' },
                ].map((row) => (
                  <tr key={row.model} className="border-b border-border">
                    <td className="py-3 px-4 font-medium">{row.model}</td>
                    <td className="text-right py-3 px-4 text-foreground-secondary">{row.input}</td>
                    <td className="text-right py-3 px-4 text-foreground-secondary">{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-foreground-secondary">
            * Prices are approximate and may vary. RANA automatically tracks actual costs from each provider.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
