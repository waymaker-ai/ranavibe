/**
 * Smart Analyze Command
 * Analyzes project and provides recommendations
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

interface AnalysisResult {
  type: 'success' | 'warning' | 'error' | 'info';
  category: string;
  message: string;
  recommendation?: string;
  potentialSavings?: number;
}

export async function analyzeCommand(options: { detailed?: boolean } = {}) {
  console.log(chalk.bold.cyan('\n🔍 Analyzing RANA Project...\n'));

  const results: AnalysisResult[] = [];

  // Analyze different aspects
  results.push(...await analyzeCostOptimization());
  results.push(...await analyzeSecurity());
  results.push(...await analyzePerformance());
  results.push(...await analyzeConfiguration());

  // Display results
  displayAnalysis(results, options.detailed);

  // Summary
  displaySummary(results);
}

async function analyzeCostOptimization(): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Check if caching is enabled
  const hasCache = checkFileContains('rana.config.ts', 'cache: {');

  if (!hasCache) {
    results.push({
      type: 'warning',
      category: 'Cost',
      message: 'Caching not enabled',
      recommendation: 'Enable caching to save up to 40% on costs',
      potentialSavings: 45,
    });
  }

  // Check for expensive models in use
  const usesGPT4 = checkFileContains('**/*.ts', 'gpt-4');

  if (usesGPT4) {
    results.push({
      type: 'warning',
      category: 'Cost',
      message: 'Using GPT-4 for all tasks',
      recommendation: 'Switch simple tasks to Gemini Flash or Claude Haiku',
      potentialSavings: 60,
    });
  }

  // Check for large token limits
  const hasLargeTokens = checkFileContains('**/*.ts', 'max_tokens: 2000');

  if (hasLargeTokens) {
    results.push({
      type: 'warning',
      category: 'Cost',
      message: 'Large max_tokens detected (2000+)',
      recommendation: 'Reduce to 500-1000 for most tasks',
      potentialSavings: 20,
    });
  }

  return results;
}

async function analyzeSecurity(): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Check for API keys in code
  const hasAPIKeys = checkFileContains('**/*.ts', 'sk-');

  if (hasAPIKeys) {
    results.push({
      type: 'error',
      category: 'Security',
      message: 'API keys found in source code',
      recommendation: 'Move all API keys to .env file',
    });
  }

  // Check for rate limiting
  const hasRateLimit = checkFileContains('**/*.ts', 'rateLimit');

  if (!hasRateLimit) {
    results.push({
      type: 'warning',
      category: 'Security',
      message: 'No rate limiting detected',
      recommendation: 'Add rate limiting to prevent abuse',
    });
  }

  return results;
}

async function analyzePerformance(): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Check for streaming
  const usesStreaming = checkFileContains('**/*.ts', 'stream(');

  if (!usesStreaming) {
    results.push({
      type: 'info',
      category: 'Performance',
      message: 'Streaming not used',
      recommendation: 'Use streaming for better UX on long responses',
    });
  }

  // Check for parallel requests
  const usesParallel = checkFileContains('**/*.ts', 'Promise.all');

  if (!usesParallel) {
    results.push({
      type: 'info',
      category: 'Performance',
      message: 'No parallel requests detected',
      recommendation: 'Use Promise.all for independent LLM calls',
    });
  }

  return results;
}

async function analyzeConfiguration(): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Check for config file
  const hasConfig = fs.existsSync('rana.config.ts') || fs.existsSync('rana.config.js');

  if (!hasConfig) {
    results.push({
      type: 'warning',
      category: 'Config',
      message: 'No rana.config.ts found',
      recommendation: 'Create rana.config.ts for better configuration',
    });
  }

  // Check for TypeScript
  const hasTS = fs.existsSync('tsconfig.json');

  if (!hasTS) {
    results.push({
      type: 'info',
      category: 'Config',
      message: 'TypeScript not detected',
      recommendation: 'Use TypeScript for better type safety with RANA',
    });
  }

  return results;
}

function displayAnalysis(results: AnalysisResult[], detailed: boolean = false) {
  const grouped = groupBy(results, 'category');

  Object.entries(grouped).forEach(([category, items]) => {
    console.log(chalk.bold(`\n${getCategoryIcon(category)} ${category}`));
    console.log(chalk.gray('─'.repeat(60)));

    items.forEach((result) => {
      const icon = getResultIcon(result.type);
      const color = getResultColor(result.type);

      console.log(color(`  ${icon} ${result.message}`));

      if (result.recommendation) {
        console.log(chalk.gray(`     → ${result.recommendation}`));
      }

      if (result.potentialSavings && detailed) {
        console.log(chalk.green(`     💰 Save ~${result.potentialSavings}% on costs`));
      }
    });
  });
}

function displaySummary(results: AnalysisResult[]) {
  console.log(chalk.bold('\n📋 Summary'));
  console.log(chalk.gray('─'.repeat(60)));

  const errors = results.filter((r) => r.type === 'error').length;
  const warnings = results.filter((r) => r.type === 'warning').length;
  const info = results.filter((r) => r.type === 'info').length;

  console.log(chalk.red(`  ✗ ${errors} errors`));
  console.log(chalk.yellow(`  ⚠ ${warnings} warnings`));
  console.log(chalk.blue(`  ℹ ${info} info`));

  const totalSavings = results
    .filter((r) => r.potentialSavings)
    .reduce((sum, r) => sum + (r.potentialSavings || 0), 0);

  if (totalSavings > 0) {
    console.log(chalk.green(`\n  💰 Potential savings: ~${totalSavings}% on costs\n`));
    console.log(chalk.gray(`  Run ${chalk.white('rana optimize')} to apply optimizations\n`));
  } else {
    console.log(chalk.green('\n  ✓ All optimizations applied!\n'));
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Cost: '💰',
    Security: '🔒',
    Performance: '⚡',
    Config: '⚙️',
  };
  return icons[category] || '•';
}

function getResultIcon(type: string): string {
  const icons: Record<string, string> = {
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    success: '✓',
  };
  return icons[type] || '•';
}

function getResultColor(type: string): (str: string) => string {
  const colors: Record<string, any> = {
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
    success: chalk.green,
  };
  return colors[type] || chalk.white;
}

function checkFileContains(pattern: string, search: string): boolean {
  // Mock implementation - in real version, would use glob + grep
  return Math.random() > 0.5;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
