import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cost Monitoring & Alerts | Production Deployment',
  description: 'CoFounder cost tracker, budget enforcement, per-user cost limits, cost dashboards, and alert thresholds for AI agent applications.',
};

export default function Lesson8Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 8 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Cost Monitoring &amp; Alerts</h1>
          <p className="lead">
            LLM costs can spiral quickly when agents loop, users abuse the system, or a bug causes
            excessive API calls. CoFounder includes a built-in cost tracking system that lets you
            enforce budgets at the project, team, and individual user level. This lesson shows
            how to set it up and configure meaningful alerts.
          </p>

          <h2>CoFounder Cost Tracker</h2>
          <p>
            The <code>@waymakerai/aicofounder-core</code> package includes a cost tracker that
            records every LLM call with its token usage and calculated cost. It persists data to
            your Supabase database for querying and dashboards:
          </p>
          <div className="code-block"><pre><code>{`// lib/cost-tracker.ts
import { CostTracker } from '@waymakerai/aicofounder-core';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const costTracker = new CostTracker({
  db: supabase,
  table: 'llm_costs',
  pricing: {
    'gpt-4o':              { input: 0.0025, output: 0.01 },
    'gpt-4o-mini':         { input: 0.00015, output: 0.0006 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    'claude-haiku-3':      { input: 0.00025, output: 0.00125 },
  },
});

// Record a call
await costTracker.record({
  userId: 'user_123',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  inputTokens: 1500,
  outputTokens: 800,
  metadata: { agentId: 'support-agent', sessionId: 'sess_abc' },
});

// Query costs
const monthlyCost = await costTracker.getMonthlyCost();
const userCost = await costTracker.getUserCost('user_123', { period: '30d' });`}</code></pre></div>

          <h2>Budget Enforcement</h2>
          <p>
            Budget enforcement prevents runaway costs by rejecting LLM calls once a threshold
            is reached. Configure budgets in your <code>.cofounder.yml</code> and enforce them
            in middleware:
          </p>
          <div className="code-block"><pre><code>{`// middleware/cost-guard.ts
import { costTracker } from '@/lib/cost-tracker';
import { env } from '@/lib/env';

export async function costGuard(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remainingBudget?: number;
}> {
  // Check project-level monthly budget
  const monthlyCost = await costTracker.getMonthlyCost();
  if (monthlyCost >= env.COFOUNDER_BUDGET_MONTHLY_USD) {
    return {
      allowed: false,
      reason: 'Monthly project budget exceeded. Contact your administrator.',
    };
  }

  // Check per-user limit
  const userCost = await costTracker.getUserCost(userId, { period: '30d' });
  const userLimit = 10; // $10/user/month from .cofounder.yml
  if (userCost >= userLimit) {
    return {
      allowed: false,
      reason: 'Your monthly usage limit has been reached.',
      remainingBudget: 0,
    };
  }

  return {
    allowed: true,
    remainingBudget: userLimit - userCost,
  };
}

// Usage in an API route
import { costGuard } from '@/middleware/cost-guard';

export async function POST(req: Request) {
  const userId = await getUserId(req);
  const budget = await costGuard(userId);

  if (!budget.allowed) {
    return Response.json({ error: budget.reason }, { status: 429 });
  }

  // Proceed with agent execution...
}`}</code></pre></div>

          <h2>Cost Dashboard with SQL</h2>
          <p>
            Build a cost dashboard by querying the <code>llm_costs</code> table directly.
            These SQL queries work with Supabase and can power a real-time admin dashboard:
          </p>
          <div className="code-block"><pre><code>{`-- Daily cost breakdown by model
SELECT
  DATE(created_at) AS day,
  model,
  COUNT(*) AS calls,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(cost_usd) AS total_cost
FROM llm_costs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day, model
ORDER BY day DESC, total_cost DESC;

-- Top 10 most expensive users this month
SELECT
  user_id,
  COUNT(*) AS total_calls,
  SUM(cost_usd) AS total_cost,
  AVG(cost_usd) AS avg_cost_per_call
FROM llm_costs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 10;

-- Hourly cost trend (for spike detection)
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  SUM(cost_usd) AS hourly_cost,
  COUNT(*) AS call_count
FROM llm_costs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;`}</code></pre></div>

          <h2>Alert Thresholds</h2>
          <p>
            Configure alerts at multiple levels to catch cost problems early. CoFounder supports
            alert thresholds as a percentage of your budget:
          </p>
          <div className="code-block"><pre><code>{`// lib/cost-alerts.ts
import { costTracker } from '@/lib/cost-tracker';

interface AlertThreshold {
  percent: number;
  channel: 'email' | 'slack' | 'pagerduty';
  severity: 'info' | 'warning' | 'critical';
}

const thresholds: AlertThreshold[] = [
  { percent: 50, channel: 'slack', severity: 'info' },
  { percent: 80, channel: 'slack', severity: 'warning' },
  { percent: 95, channel: 'pagerduty', severity: 'critical' },
];

export async function checkCostAlerts(budgetUsd: number) {
  const currentCost = await costTracker.getMonthlyCost();
  const percentUsed = (currentCost / budgetUsd) * 100;

  for (const threshold of thresholds) {
    if (percentUsed >= threshold.percent) {
      await sendAlert({
        severity: threshold.severity,
        channel: threshold.channel,
        message: \`LLM cost alert: \${percentUsed.toFixed(1)}% of monthly budget used (\$\${currentCost.toFixed(2)} / \$\${budgetUsd})\`,
      });
    }
  }
}

// Run via cron job: every hour
// See vercel.json crons or a scheduled Lambda`}</code></pre></div>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-7" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: OpenTelemetry Integration
          </Link>
          <Link href="/training/production-deployment/lesson-9" className="btn-primary px-6 py-3 group">
            Next: Scaling Strategies
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
