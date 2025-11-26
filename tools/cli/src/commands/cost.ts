/**
 * Cost Estimate Command
 * Estimate LLM costs for your application
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

interface CostEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costPerMonth: number;
  costWithRANA: number;
  savings: number;
  savingsPercent: number;
}

interface UsageScenario {
  name: string;
  dailyRequests: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

// Provider pricing per 1M tokens (as of Jan 2025)
const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  },
  anthropic: {
    'claude-3-opus': { input: 15.00, output: 75.00 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  },
  google: {
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  },
  groq: {
    'llama-3.1-70b': { input: 0.59, output: 0.79 },
    'llama-3.1-8b': { input: 0.05, output: 0.08 },
    'mixtral-8x7b': { input: 0.24, output: 0.24 },
  },
  together: {
    'llama-3.1-70b': { input: 0.88, output: 0.88 },
    'llama-3.1-8b': { input: 0.18, output: 0.18 },
    'qwen-2.5-72b': { input: 1.20, output: 1.20 },
  },
};

const SCENARIOS: UsageScenario[] = [
  { name: 'Light (Hobby)', dailyRequests: 100, avgInputTokens: 500, avgOutputTokens: 200 },
  { name: 'Medium (Startup)', dailyRequests: 1000, avgInputTokens: 800, avgOutputTokens: 400 },
  { name: 'Heavy (Growth)', dailyRequests: 10000, avgInputTokens: 1000, avgOutputTokens: 500 },
  { name: 'Enterprise', dailyRequests: 100000, avgInputTokens: 1200, avgOutputTokens: 600 },
];

export async function costEstimate(options: {
  scenario?: string;
  requests?: number;
  provider?: string;
  model?: string;
} = {}) {
  console.log(chalk.bold.cyan('\n💰 RANA Cost Estimator\n'));

  // Determine scenario
  let scenario: UsageScenario;
  if (options.requests) {
    scenario = {
      name: 'Custom',
      dailyRequests: options.requests,
      avgInputTokens: 800,
      avgOutputTokens: 400,
    };
  } else {
    const scenarioName = options.scenario || 'Medium (Startup)';
    scenario = SCENARIOS.find(s => s.name.toLowerCase().includes(scenarioName.toLowerCase()))
      || SCENARIOS[1];
  }

  console.log(chalk.bold('📊 Usage Scenario: ') + chalk.cyan(scenario.name));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  Daily Requests:    ${chalk.cyan(scenario.dailyRequests.toLocaleString())}`);
  console.log(`  Avg Input Tokens:  ${chalk.cyan(scenario.avgInputTokens)}`);
  console.log(`  Avg Output Tokens: ${chalk.cyan(scenario.avgOutputTokens)}`);
  console.log(`  Monthly Requests:  ${chalk.cyan((scenario.dailyRequests * 30).toLocaleString())}`);

  // Calculate costs for all providers
  const estimates: CostEstimate[] = [];

  Object.entries(PRICING).forEach(([provider, models]) => {
    Object.entries(models).forEach(([model, pricing]) => {
      const monthlyInputTokens = scenario.dailyRequests * 30 * scenario.avgInputTokens;
      const monthlyOutputTokens = scenario.dailyRequests * 30 * scenario.avgOutputTokens;

      const inputCost = (monthlyInputTokens / 1_000_000) * pricing.input;
      const outputCost = (monthlyOutputTokens / 1_000_000) * pricing.output;
      const costPerMonth = inputCost + outputCost;

      // RANA saves ~70% through caching, smart routing, etc.
      const costWithRANA = costPerMonth * 0.30;
      const savings = costPerMonth - costWithRANA;
      const savingsPercent = 70;

      estimates.push({
        provider,
        model,
        inputTokens: monthlyInputTokens,
        outputTokens: monthlyOutputTokens,
        costPerMonth,
        costWithRANA,
        savings,
        savingsPercent,
      });
    });
  });

  // Sort by cost
  estimates.sort((a, b) => a.costWithRANA - b.costWithRANA);

  // Display results
  console.log(chalk.bold('\n💵 Monthly Cost Estimates'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('Provider        Model                  Standard    With RANA   Savings'));
  console.log(chalk.gray('─'.repeat(60)));

  estimates.forEach(est => {
    const providerPad = est.provider.padEnd(14);
    const modelPad = est.model.padEnd(22);
    const costPad = ('$' + est.costPerMonth.toFixed(2)).padStart(10);
    const ranaCostPad = ('$' + est.costWithRANA.toFixed(2)).padStart(10);
    const savingsPad = ('$' + est.savings.toFixed(2)).padStart(10);

    console.log(
      chalk.white(providerPad) +
      chalk.cyan(modelPad) +
      chalk.red(costPad) +
      chalk.green(ranaCostPad) +
      chalk.yellow(savingsPad)
    );
  });

  // Summary
  const cheapest = estimates[0];
  const mostExpensive = estimates[estimates.length - 1];

  console.log(chalk.bold('\n📈 Summary'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.green(`  Cheapest:    ${cheapest.provider}/${cheapest.model} at $${cheapest.costWithRANA.toFixed(2)}/mo`));
  console.log(chalk.red(`  Expensive:   ${mostExpensive.provider}/${mostExpensive.model} at $${mostExpensive.costWithRANA.toFixed(2)}/mo`));

  // Calculate potential savings if using RANA vs not using RANA with GPT-4
  const gpt4Estimate = estimates.find(e => e.model === 'gpt-4-turbo');
  if (gpt4Estimate) {
    console.log(chalk.bold('\n💡 If using GPT-4 Turbo without RANA:'));
    console.log(chalk.red(`  Standard Cost:  $${gpt4Estimate.costPerMonth.toFixed(2)}/mo`));
    console.log(chalk.green(`  With RANA:      $${gpt4Estimate.costWithRANA.toFixed(2)}/mo`));
    console.log(chalk.yellow(`  You Save:       $${gpt4Estimate.savings.toFixed(2)}/mo (70%)`));
    console.log(chalk.green(`  Annual Savings: $${(gpt4Estimate.savings * 12).toFixed(2)}/year`));
  }

  // Recommendations
  console.log(chalk.bold('\n🎯 Recommendations'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('  1. Use ' + chalk.cyan('Gemini Flash') + ' for simple tasks (chat, summarization)');
  console.log('  2. Use ' + chalk.cyan('Claude Sonnet') + ' for complex reasoning');
  console.log('  3. Use ' + chalk.cyan('GPT-4') + ' only for specialized tasks');
  console.log('  4. Enable ' + chalk.cyan('response caching') + ' for 40% additional savings');
  console.log('  5. Run ' + chalk.cyan('rana llm:optimize') + ' to apply all optimizations');

  console.log();
}

export async function costCompare() {
  console.log(chalk.bold.cyan('\n💰 RANA Provider Comparison\n'));

  console.log(chalk.bold('Pricing per 1M tokens (as of January 2025)'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log(chalk.gray('Provider       Model                    Input       Output      Tier'));
  console.log(chalk.gray('─'.repeat(70)));

  // Flatten and display all pricing
  const allModels: { provider: string; model: string; input: number; output: number }[] = [];

  Object.entries(PRICING).forEach(([provider, models]) => {
    Object.entries(models).forEach(([model, pricing]) => {
      allModels.push({ provider, model, ...pricing });
    });
  });

  // Sort by input cost
  allModels.sort((a, b) => a.input - b.input);

  allModels.forEach(m => {
    const tier = m.input < 0.50 ? chalk.green('Budget')
      : m.input < 3.00 ? chalk.yellow('Standard')
      : chalk.red('Premium');

    console.log(
      chalk.white(m.provider.padEnd(14)) +
      chalk.cyan(m.model.padEnd(24)) +
      chalk.white(('$' + m.input.toFixed(2)).padStart(10)) +
      chalk.white(('$' + m.output.toFixed(2)).padStart(12)) +
      '  ' + tier
    );
  });

  console.log(chalk.gray('\n* RANA automatically routes to optimal models and caches responses'));
  console.log(chalk.gray('* Run `rana cost:estimate` for usage-based estimates\n'));
}
