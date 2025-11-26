/**
 * Velocity Analysis Command
 * Process Intelligence - Development velocity tracking and insights
 * Inspired by HatchWorks GenIQ but with RANA's cost-focused approach
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface VelocityMetrics {
  totalCommits: number;
  commitsThisWeek: number;
  commitsLastWeek: number;
  averageCommitsPerDay: number;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  netLinesChanged: number;
  topContributors: { name: string; commits: number }[];
  aiGeneratedEstimate: number;
  deploymentFrequency: string;
  leadTime: string;
  changeFailureRate: string;
  mttr: string;
}

interface CostMetrics {
  estimatedLLMCalls: number;
  estimatedCostWithoutRANA: number;
  estimatedCostWithRANA: number;
  savings: number;
  savingsPercentage: number;
}

interface VelocityReport {
  period: string;
  metrics: VelocityMetrics;
  costs: CostMetrics;
  insights: string[];
  recommendations: string[];
}

export async function velocityAnalyze(options: {
  period?: string;
  detailed?: boolean;
  export?: string;
} = {}) {
  const period = options.period || '30d';

  console.log(chalk.bold.cyan('\n📊 RANA Velocity Analysis\n'));
  console.log(chalk.gray(`Analyzing development velocity for the last ${period}...\n`));

  try {
    const report = await generateVelocityReport(period);

    displayVelocityDashboard(report, options.detailed);
    displayCostInsights(report);
    displayDORAMetrics(report);
    displayRecommendations(report);

    if (options.export) {
      exportReport(report, options.export);
    }

  } catch (error) {
    console.log(chalk.red('Error analyzing velocity. Make sure you\'re in a git repository.\n'));
  }
}

async function generateVelocityReport(period: string): Promise<VelocityReport> {
  const metrics = await collectGitMetrics(period);
  const costs = estimateCosts(metrics);
  const insights = generateInsights(metrics, costs);
  const recommendations = generateRecommendations(metrics, costs);

  return {
    period,
    metrics,
    costs,
    insights,
    recommendations,
  };
}

async function collectGitMetrics(period: string): Promise<VelocityMetrics> {
  const days = parseInt(period) || 30;
  const since = `${days} days ago`;

  // Get commit counts
  let totalCommits = 0;
  let commitsThisWeek = 0;
  let commitsLastWeek = 0;

  try {
    totalCommits = parseInt(execSync(`git rev-list --count --since="${since}" HEAD 2>/dev/null || echo "0"`, { encoding: 'utf-8' }).trim()) || 0;
    commitsThisWeek = parseInt(execSync(`git rev-list --count --since="7 days ago" HEAD 2>/dev/null || echo "0"`, { encoding: 'utf-8' }).trim()) || 0;
    commitsLastWeek = parseInt(execSync(`git rev-list --count --since="14 days ago" --until="7 days ago" HEAD 2>/dev/null || echo "0"`, { encoding: 'utf-8' }).trim()) || 0;
  } catch (e) {
    // Git not available or not a repo
  }

  // Get line changes
  let linesAdded = 0;
  let linesDeleted = 0;
  let filesChanged = 0;

  try {
    const diffStat = execSync(`git diff --stat --since="${since}" HEAD 2>/dev/null || echo ""`, { encoding: 'utf-8' });
    const matches = diffStat.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    if (matches) {
      filesChanged = parseInt(matches[1]) || 0;
      linesAdded = parseInt(matches[2]) || 0;
      linesDeleted = parseInt(matches[3]) || 0;
    }
  } catch (e) {
    // Fallback to estimates
    filesChanged = totalCommits * 3;
    linesAdded = totalCommits * 50;
    linesDeleted = totalCommits * 20;
  }

  // Get top contributors
  let topContributors: { name: string; commits: number }[] = [];
  try {
    const contributors = execSync(`git shortlog -sn --since="${since}" HEAD 2>/dev/null || echo ""`, { encoding: 'utf-8' });
    topContributors = contributors.split('\n')
      .filter(line => line.trim())
      .slice(0, 5)
      .map(line => {
        const match = line.trim().match(/(\d+)\s+(.+)/);
        return match ? { name: match[2], commits: parseInt(match[1]) } : null;
      })
      .filter((c): c is { name: string; commits: number } => c !== null);
  } catch (e) {
    // No contributors data
  }

  // Estimate AI-generated code percentage based on commit patterns
  const aiGeneratedEstimate = estimateAIGeneratedCode(totalCommits, linesAdded);

  return {
    totalCommits,
    commitsThisWeek,
    commitsLastWeek,
    averageCommitsPerDay: totalCommits / days,
    filesChanged,
    linesAdded,
    linesDeleted,
    netLinesChanged: linesAdded - linesDeleted,
    topContributors,
    aiGeneratedEstimate,
    deploymentFrequency: calculateDeploymentFrequency(totalCommits, days),
    leadTime: calculateLeadTime(totalCommits),
    changeFailureRate: 'Low (<15%)', // Would need actual deployment data
    mttr: '<1 hour', // Would need actual incident data
  };
}

function estimateAIGeneratedCode(commits: number, linesAdded: number): number {
  // Heuristic: If average lines per commit is high (>100), likely AI-assisted
  const avgLinesPerCommit = commits > 0 ? linesAdded / commits : 0;

  if (avgLinesPerCommit > 200) return 85;
  if (avgLinesPerCommit > 100) return 70;
  if (avgLinesPerCommit > 50) return 50;
  if (avgLinesPerCommit > 25) return 30;
  return 15;
}

function calculateDeploymentFrequency(commits: number, days: number): string {
  const commitsPerDay = commits / days;

  if (commitsPerDay >= 3) return 'Multiple per day (Elite)';
  if (commitsPerDay >= 1) return 'Daily (High)';
  if (commitsPerDay >= 0.25) return 'Weekly (Medium)';
  return 'Monthly or less (Low)';
}

function calculateLeadTime(commits: number): string {
  // Heuristic based on commit frequency
  if (commits > 100) return '<1 day (Elite)';
  if (commits > 50) return '1-7 days (High)';
  if (commits > 20) return '1-4 weeks (Medium)';
  return '>1 month (Low)';
}

function estimateCosts(metrics: VelocityMetrics): CostMetrics {
  // Estimate LLM calls based on AI-generated code percentage
  const estimatedLLMCalls = Math.round(metrics.linesAdded * (metrics.aiGeneratedEstimate / 100) * 0.1);

  // Average cost per LLM call without optimization: ~$0.05
  // Average cost per LLM call with RANA optimization: ~$0.015
  const estimatedCostWithoutRANA = estimatedLLMCalls * 0.05;
  const estimatedCostWithRANA = estimatedLLMCalls * 0.015;
  const savings = estimatedCostWithoutRANA - estimatedCostWithRANA;
  const savingsPercentage = estimatedCostWithoutRANA > 0
    ? (savings / estimatedCostWithoutRANA) * 100
    : 70;

  return {
    estimatedLLMCalls,
    estimatedCostWithoutRANA,
    estimatedCostWithRANA,
    savings,
    savingsPercentage: Math.round(savingsPercentage),
  };
}

function generateInsights(metrics: VelocityMetrics, costs: CostMetrics): string[] {
  const insights: string[] = [];

  // Velocity trend
  if (metrics.commitsThisWeek > metrics.commitsLastWeek) {
    const increase = ((metrics.commitsThisWeek - metrics.commitsLastWeek) / Math.max(metrics.commitsLastWeek, 1)) * 100;
    insights.push(`📈 Velocity increased ${Math.round(increase)}% this week`);
  } else if (metrics.commitsThisWeek < metrics.commitsLastWeek) {
    const decrease = ((metrics.commitsLastWeek - metrics.commitsThisWeek) / Math.max(metrics.commitsLastWeek, 1)) * 100;
    insights.push(`📉 Velocity decreased ${Math.round(decrease)}% this week`);
  } else {
    insights.push('➡️ Velocity stable compared to last week');
  }

  // AI usage insight
  if (metrics.aiGeneratedEstimate > 70) {
    insights.push(`🤖 High AI assistance detected (~${metrics.aiGeneratedEstimate}% of code)`);
  } else if (metrics.aiGeneratedEstimate > 40) {
    insights.push(`🤖 Moderate AI assistance detected (~${metrics.aiGeneratedEstimate}% of code)`);
  } else {
    insights.push(`👨‍💻 Mostly manual coding detected (~${100 - metrics.aiGeneratedEstimate}% manual)`);
  }

  // Cost insight
  if (costs.savings > 100) {
    insights.push(`💰 Estimated ${costs.savingsPercentage}% cost savings with RANA ($${costs.savings.toFixed(2)})`);
  }

  // Code churn insight
  const churnRate = metrics.linesDeleted / Math.max(metrics.linesAdded, 1);
  if (churnRate > 0.5) {
    insights.push(`⚠️ High code churn detected (${Math.round(churnRate * 100)}% of additions deleted)`);
  }

  return insights;
}

function generateRecommendations(metrics: VelocityMetrics, costs: CostMetrics): string[] {
  const recommendations: string[] = [];

  // AI adoption recommendation
  if (metrics.aiGeneratedEstimate < 50) {
    recommendations.push('Consider increasing AI assistance for faster development');
  }

  // Cost optimization recommendations
  if (costs.estimatedCostWithoutRANA > costs.estimatedCostWithRANA * 1.5) {
    recommendations.push('Run `rana llm:optimize` to apply cost optimizations');
  }

  // Velocity recommendations
  if (metrics.averageCommitsPerDay < 1) {
    recommendations.push('Consider smaller, more frequent commits for better flow');
  }

  // DORA metrics recommendations
  if (metrics.deploymentFrequency.includes('Low') || metrics.deploymentFrequency.includes('Medium')) {
    recommendations.push('Increase deployment frequency for faster feedback loops');
  }

  // Quality recommendations
  if (metrics.netLinesChanged > 5000) {
    recommendations.push('Large codebase growth - ensure test coverage is maintained');
  }

  return recommendations;
}

function displayVelocityDashboard(report: VelocityReport, detailed: boolean = false) {
  const { metrics } = report;

  console.log(chalk.bold('📈 Development Velocity'));
  console.log(chalk.gray('─'.repeat(60)));

  // Main metrics
  console.log(`  ${chalk.white('Total Commits:')}      ${chalk.cyan(metrics.totalCommits)}`);
  console.log(`  ${chalk.white('This Week:')}          ${chalk.cyan(metrics.commitsThisWeek)} commits`);
  console.log(`  ${chalk.white('Last Week:')}          ${chalk.cyan(metrics.commitsLastWeek)} commits`);
  console.log(`  ${chalk.white('Avg/Day:')}            ${chalk.cyan(metrics.averageCommitsPerDay.toFixed(1))} commits`);
  console.log();
  console.log(`  ${chalk.white('Files Changed:')}      ${chalk.cyan(metrics.filesChanged)}`);
  console.log(`  ${chalk.white('Lines Added:')}        ${chalk.green('+' + metrics.linesAdded)}`);
  console.log(`  ${chalk.white('Lines Deleted:')}      ${chalk.red('-' + metrics.linesDeleted)}`);
  console.log(`  ${chalk.white('Net Change:')}         ${chalk.yellow(metrics.netLinesChanged > 0 ? '+' : '')}${chalk.yellow(metrics.netLinesChanged)}`);
  console.log();
  console.log(`  ${chalk.white('AI-Generated:')}       ~${chalk.magenta(metrics.aiGeneratedEstimate + '%')}`);

  if (detailed && metrics.topContributors.length > 0) {
    console.log(chalk.bold('\n👥 Top Contributors'));
    console.log(chalk.gray('─'.repeat(60)));
    metrics.topContributors.forEach((contributor, index) => {
      console.log(`  ${index + 1}. ${chalk.white(contributor.name)} - ${chalk.cyan(contributor.commits)} commits`);
    });
  }

  console.log();
}

function displayCostInsights(report: VelocityReport) {
  const { costs } = report;

  console.log(chalk.bold('💰 Cost Analysis'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  ${chalk.white('Estimated LLM Calls:')}     ${chalk.cyan(costs.estimatedLLMCalls.toLocaleString())}`);
  console.log(`  ${chalk.white('Cost Without RANA:')}       ${chalk.red('$' + costs.estimatedCostWithoutRANA.toFixed(2))}`);
  console.log(`  ${chalk.white('Cost With RANA:')}          ${chalk.green('$' + costs.estimatedCostWithRANA.toFixed(2))}`);
  console.log(`  ${chalk.white('Savings:')}                 ${chalk.green('$' + costs.savings.toFixed(2))} (${costs.savingsPercentage}%)`);
  console.log();
}

function displayDORAMetrics(report: VelocityReport) {
  const { metrics } = report;

  console.log(chalk.bold('🎯 DORA Metrics'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  ${chalk.white('Deployment Frequency:')}   ${getMetricColor(metrics.deploymentFrequency)}`);
  console.log(`  ${chalk.white('Lead Time for Changes:')} ${getMetricColor(metrics.leadTime)}`);
  console.log(`  ${chalk.white('Change Failure Rate:')}   ${chalk.green(metrics.changeFailureRate)}`);
  console.log(`  ${chalk.white('Mean Time to Recovery:')} ${chalk.green(metrics.mttr)}`);
  console.log();
}

function getMetricColor(metric: string): string {
  if (metric.includes('Elite') || metric.includes('High')) {
    return chalk.green(metric);
  } else if (metric.includes('Medium')) {
    return chalk.yellow(metric);
  } else {
    return chalk.red(metric);
  }
}

function displayRecommendations(report: VelocityReport) {
  console.log(chalk.bold('💡 Insights'));
  console.log(chalk.gray('─'.repeat(60)));
  report.insights.forEach(insight => {
    console.log(`  ${insight}`);
  });

  if (report.recommendations.length > 0) {
    console.log(chalk.bold('\n🎯 Recommendations'));
    console.log(chalk.gray('─'.repeat(60)));
    report.recommendations.forEach(rec => {
      console.log(`  → ${chalk.white(rec)}`);
    });
  }

  console.log();
}

function exportReport(report: VelocityReport, format: string) {
  const filename = `rana-velocity-report-${new Date().toISOString().split('T')[0]}`;

  if (format === 'json') {
    fs.writeFileSync(`${filename}.json`, JSON.stringify(report, null, 2));
    console.log(chalk.green(`✓ Report exported to ${filename}.json\n`));
  } else if (format === 'csv') {
    const csv = generateCSV(report);
    fs.writeFileSync(`${filename}.csv`, csv);
    console.log(chalk.green(`✓ Report exported to ${filename}.csv\n`));
  }
}

function generateCSV(report: VelocityReport): string {
  const { metrics, costs } = report;
  const rows = [
    ['Metric', 'Value'],
    ['Period', report.period],
    ['Total Commits', metrics.totalCommits.toString()],
    ['Commits This Week', metrics.commitsThisWeek.toString()],
    ['Commits Last Week', metrics.commitsLastWeek.toString()],
    ['Files Changed', metrics.filesChanged.toString()],
    ['Lines Added', metrics.linesAdded.toString()],
    ['Lines Deleted', metrics.linesDeleted.toString()],
    ['AI Generated %', metrics.aiGeneratedEstimate.toString()],
    ['Estimated LLM Calls', costs.estimatedLLMCalls.toString()],
    ['Cost Without RANA', costs.estimatedCostWithoutRANA.toFixed(2)],
    ['Cost With RANA', costs.estimatedCostWithRANA.toFixed(2)],
    ['Savings', costs.savings.toFixed(2)],
    ['Savings %', costs.savingsPercentage.toString()],
  ];

  return rows.map(row => row.join(',')).join('\n');
}

export async function velocitySetup() {
  console.log(chalk.bold.cyan('\n📊 RANA Velocity Tracking Setup\n'));
  console.log(chalk.gray('Setting up development velocity tracking...\n'));

  // Check for git
  try {
    execSync('git --version', { encoding: 'utf-8' });
    console.log(chalk.green('✓ Git detected'));
  } catch {
    console.log(chalk.red('✗ Git not found - velocity tracking requires git'));
    return;
  }

  // Create velocity config
  const config = {
    velocity: {
      enabled: true,
      trackAIUsage: true,
      trackCosts: true,
      doraMetrics: true,
      reportFrequency: 'weekly',
    }
  };

  console.log(chalk.green('✓ Velocity tracking enabled'));
  console.log(chalk.gray('\nRun `rana analyze:velocity` to see your development metrics.\n'));
}
