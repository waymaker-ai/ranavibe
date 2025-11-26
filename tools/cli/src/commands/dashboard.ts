/**
 * Real-time Cost Dashboard
 * Terminal UI for monitoring RANA costs and performance
 */

import chalk from 'chalk';

interface DashboardStats {
  totalSpent: number;
  totalSaved: number;
  savingsPercentage: number;
  requests: number;
  cacheHitRate: number;
  breakdown: {
    provider: string;
    cost: number;
    percentage: number;
    requests: number;
  }[];
  recommendations: string[];
}

export async function dashboardCommand() {
  console.clear();

  // Mock stats - in real implementation, this would load from RANA SDK
  const stats: DashboardStats = {
    totalSpent: 12.50,
    totalSaved: 87.50,
    savingsPercentage: 70,
    requests: 1250,
    cacheHitRate: 0.45,
    breakdown: [
      { provider: 'Anthropic', cost: 8.00, percentage: 64, requests: 800 },
      { provider: 'OpenAI', cost: 3.50, percentage: 28, requests: 350 },
      { provider: 'Gemini', cost: 1.00, percentage: 8, requests: 100 },
    ],
    recommendations: [
      'Switch to Gemini Flash for simple tasks → Save $5/day',
      'Enable caching on /api/chat → Save $30/month',
      'Reduce max_tokens to 500 on summaries → Save 20%',
    ],
  };

  displayDashboard(stats);
}

function displayDashboard(stats: DashboardStats) {
  const width = 60;

  // Header
  console.log(chalk.bold.cyan('╔' + '═'.repeat(width - 2) + '╗'));
  console.log(chalk.bold.cyan('║') + centerText('RANA Cost Dashboard', width - 2) + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚' + '═'.repeat(width - 2) + '╝'));
  console.log();

  // Main stats
  console.log(chalk.bold('💰 Cost Summary'));
  console.log(chalk.gray('─'.repeat(width)));

  console.log(
    chalk.white('  Total Spent:     ') +
    chalk.red.bold(`$${stats.totalSpent.toFixed(2)}`)
  );

  console.log(
    chalk.white('  Total Saved:     ') +
    chalk.green.bold(`$${stats.totalSaved.toFixed(2)}`) +
    chalk.gray(` (${stats.savingsPercentage}%)`)
  );

  console.log(
    chalk.white('  Cache Hit Rate:  ') +
    chalk.cyan.bold(`${(stats.cacheHitRate * 100).toFixed(0)}%`)
  );

  console.log(
    chalk.white('  Total Requests:  ') +
    chalk.yellow.bold(stats.requests.toLocaleString())
  );

  console.log();

  // Provider breakdown
  console.log(chalk.bold('📊 Provider Breakdown'));
  console.log(chalk.gray('─'.repeat(width)));

  stats.breakdown.forEach((provider) => {
    const barLength = Math.floor((provider.percentage / 100) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);

    console.log(
      chalk.white(`  ${provider.provider.padEnd(12)}`) +
      chalk.cyan(bar) +
      chalk.white(` $${provider.cost.toFixed(2)} `) +
      chalk.gray(`(${provider.percentage}%)`)
    );
  });

  console.log();

  // Recommendations
  console.log(chalk.bold('💡 Recommendations'));
  console.log(chalk.gray('─'.repeat(width)));

  stats.recommendations.forEach((rec, i) => {
    console.log(chalk.yellow(`  ${i + 1}.`) + chalk.white(` ${rec}`));
  });

  console.log();

  // Footer
  console.log(chalk.gray('─'.repeat(width)));
  console.log(chalk.gray('  Press Ctrl+C to exit'));
  console.log();
}

function centerText(text: string, width: number): string {
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
}

// Live updating dashboard (optional)
export async function dashboardLiveCommand() {
  let running = true;

  process.on('SIGINT', () => {
    running = false;
    console.clear();
    console.log(chalk.green('\n✓ Dashboard closed\n'));
    process.exit(0);
  });

  while (running) {
    await dashboardCommand();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Update every 2s
  }
}
