import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

interface AnalyticsOptions {
  period?: string;
  export?: string;
}

interface ComplianceMetric {
  date: string;
  score: number;
  violations: number;
  checks: number;
}

export async function analyticsCommand(options: AnalyticsOptions) {
  const spinner = ora('Fetching RANA analytics...').start();

  try {
    // Check if user is authenticated
    const authToken = await getAuthToken();
    if (!authToken) {
      spinner.fail('Not authenticated. Run: waymaker-rana login');
      return;
    }

    // TODO: Fetch real data from Waymaker API
    const period = parseInt(options.period || '30');
    const metrics = await fetchAnalytics(authToken, period);

    spinner.succeed('Analytics fetched');

    displayAnalytics(metrics, period);

    if (options.export) {
      await exportAnalytics(metrics, options.export);
    }
  } catch (error: any) {
    spinner.fail(`Analytics error: ${error.message}`);
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const configPath = path.join(process.env.HOME || '', '.waymaker', 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    return config.authToken || null;
  } catch {
    return null;
  }
}

async function fetchAnalytics(token: string, days: number): Promise<ComplianceMetric[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`https://api.waymaker.com/v1/rana/analytics?days=${days}`, {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
  // return response.json();

  // Mock data for now
  return Array.from({ length: Math.min(days, 30) }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    score: 85 + Math.random() * 15,
    violations: Math.floor(Math.random() * 10),
    checks: 150 + Math.floor(Math.random() * 50)
  })).reverse();
}

function displayAnalytics(metrics: ComplianceMetric[], period: number) {
  console.log(chalk.bold.cyan(`\n📊 RANA Compliance Analytics (Last ${period} days)\n`));

  const avgScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
  const totalViolations = metrics.reduce((sum, m) => sum + m.violations, 0);
  const totalChecks = metrics.reduce((sum, m) => sum + m.checks, 0);

  console.log(chalk.bold('Summary:'));
  console.log(`  Average Score: ${chalk.green(avgScore.toFixed(1))}%`);
  console.log(`  Total Violations: ${chalk.yellow(totalViolations)}`);
  console.log(`  Total Checks: ${chalk.blue(totalChecks)}`);
  console.log();

  console.log(chalk.bold('Recent Compliance Scores:'));
  metrics.slice(-7).forEach(metric => {
    const scoreColor = metric.score >= 90 ? chalk.green : metric.score >= 75 ? chalk.yellow : chalk.red;
    const bar = '█'.repeat(Math.floor(metric.score / 5));
    console.log(`  ${metric.date}: ${scoreColor(metric.score.toFixed(1))}% ${bar}`);
  });

  console.log();
  console.log(chalk.gray('View detailed analytics: https://waymaker.com/dashboard/rana'));
}

async function exportAnalytics(metrics: ComplianceMetric[], format: string) {
  const spinner = ora('Exporting analytics...').start();

  try {
    const filename = `rana-analytics-${Date.now()}.${format}`;
    let content: string;

    if (format === 'json') {
      content = JSON.stringify(metrics, null, 2);
    } else if (format === 'csv') {
      const headers = 'Date,Score,Violations,Checks';
      const rows = metrics.map(m => `${m.date},${m.score.toFixed(1)},${m.violations},${m.checks}`);
      content = [headers, ...rows].join('\n');
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    await fs.writeFile(filename, content, 'utf-8');
    spinner.succeed(`Exported to ${filename}`);
  } catch (error: any) {
    spinner.fail(`Export failed: ${error.message}`);
  }
}
