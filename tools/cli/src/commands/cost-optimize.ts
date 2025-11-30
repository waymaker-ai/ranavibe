/**
 * RANA Cost Optimization Suggestions
 *
 * Analyzes usage patterns and suggests cost savings
 *
 * @example
 * ```bash
 * # Get optimization suggestions
 * rana cost:optimize
 *
 * # Apply suggestions automatically
 * rana cost:optimize --apply
 *
 * # Show detailed analysis
 * rana cost:optimize --detailed
 * ```
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface UsagePattern {
  provider: string;
  model: string;
  avgTokens: number;
  avgLatency: number;
  totalCost: number;
  requestCount: number;
  timeRange: { start: Date; end: Date };
}

interface Optimization {
  id: string;
  type: 'model-switch' | 'caching' | 'batching' | 'prompt-optimization' | 'local-dev' | 'provider-switch';
  title: string;
  description: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  savingsPercent: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  command?: string;
  config?: Record<string, any>;
}

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  // Google
  'gemini-2.0-flash-exp': { input: 0.00, output: 0.00 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  // Groq (fast & cheap)
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  // Local (free)
  'llama3.2': { input: 0, output: 0 },
  'llama3.2:1b': { input: 0, output: 0 },
  'codellama': { input: 0, output: 0 },
};

// Alternative models for each use case
const MODEL_ALTERNATIVES: Record<string, string[]> = {
  'gpt-4o': ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-1.5-flash'],
  'gpt-4-turbo': ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'],
  'claude-3-opus-20240229': ['claude-3-5-sonnet-20241022', 'gpt-4o', 'gemini-1.5-pro'],
  'claude-3-5-sonnet-20241022': ['claude-3-5-haiku-20241022', 'gpt-4o-mini', 'gemini-1.5-flash'],
  'gemini-1.5-pro': ['gemini-1.5-flash', 'gpt-4o-mini', 'claude-3-5-haiku-20241022'],
};

/**
 * Main cost optimization command
 */
export async function costOptimizeCommand(options: {
  apply?: boolean;
  detailed?: boolean;
}): Promise<void> {
  console.log(chalk.bold.cyan('\n💰 RANA Cost Optimization Analysis\n'));

  // Load usage data
  const usage = await loadUsageData();

  if (!usage || usage.length === 0) {
    console.log(chalk.yellow('No usage data found.'));
    console.log(chalk.gray('Start using RANA to collect usage data for optimization suggestions.\n'));
    showQuickTips();
    return;
  }

  // Analyze and generate suggestions
  const optimizations = generateOptimizations(usage);

  if (optimizations.length === 0) {
    console.log(chalk.green('✓ Your setup is already well-optimized!\n'));
    showQuickTips();
    return;
  }

  // Display suggestions
  displayOptimizations(optimizations, options.detailed || false);

  // Apply if requested
  if (options.apply) {
    await applyOptimizations(optimizations);
  }
}

/**
 * Load usage data from cost store
 */
async function loadUsageData(): Promise<UsagePattern[]> {
  const configDir = path.join(os.homedir(), '.rana');
  const costFile = path.join(configDir, 'costs.json');

  try {
    if (!fs.existsSync(costFile)) {
      return [];
    }

    const data = JSON.parse(fs.readFileSync(costFile, 'utf-8'));
    const records = data.records || [];

    // Group by model
    const byModel = new Map<string, any[]>();
    for (const record of records) {
      const key = `${record.provider}:${record.model}`;
      if (!byModel.has(key)) {
        byModel.set(key, []);
      }
      byModel.get(key)!.push(record);
    }

    // Calculate patterns
    const patterns: UsagePattern[] = [];
    for (const [key, records] of byModel) {
      const [provider, model] = key.split(':');
      const totalCost = records.reduce((sum: number, r: any) => sum + (r.cost?.total_cost || 0), 0);
      const totalTokens = records.reduce((sum: number, r: any) => sum + (r.usage?.total_tokens || 0), 0);
      const totalLatency = records.reduce((sum: number, r: any) => sum + (r.latency_ms || 0), 0);

      patterns.push({
        provider,
        model,
        avgTokens: totalTokens / records.length,
        avgLatency: totalLatency / records.length,
        totalCost,
        requestCount: records.length,
        timeRange: {
          start: new Date(Math.min(...records.map((r: any) => new Date(r.created_at).getTime()))),
          end: new Date(Math.max(...records.map((r: any) => new Date(r.created_at).getTime()))),
        },
      });
    }

    return patterns;
  } catch {
    return [];
  }
}

/**
 * Generate optimization suggestions
 */
function generateOptimizations(usage: UsagePattern[]): Optimization[] {
  const optimizations: Optimization[] = [];

  for (const pattern of usage) {
    // 1. Model switch suggestions
    const alternatives = MODEL_ALTERNATIVES[pattern.model];
    if (alternatives && pattern.totalCost > 0.10) {
      for (const alt of alternatives) {
        const currentPricing = MODEL_PRICING[pattern.model];
        const altPricing = MODEL_PRICING[alt];

        if (currentPricing && altPricing) {
          const currentCostPer1M = (currentPricing.input + currentPricing.output) / 2;
          const altCostPer1M = (altPricing.input + altPricing.output) / 2;

          if (altCostPer1M < currentCostPer1M * 0.7) {
            const savingsPercent = ((currentCostPer1M - altCostPer1M) / currentCostPer1M) * 100;
            const projectedSavings = pattern.totalCost * (savingsPercent / 100);

            optimizations.push({
              id: `model-switch-${pattern.model}-${alt}`,
              type: 'model-switch',
              title: `Switch from ${pattern.model} to ${alt}`,
              description: `For similar quality tasks, ${alt} can provide ${savingsPercent.toFixed(0)}% cost reduction.`,
              currentCost: pattern.totalCost,
              projectedCost: pattern.totalCost - projectedSavings,
              savings: projectedSavings,
              savingsPercent,
              effort: 'low',
              impact: savingsPercent > 50 ? 'high' : 'medium',
              config: { model: alt },
            });
          }
        }
      }
    }

    // 2. Local development suggestion
    if (pattern.provider !== 'ollama' && pattern.totalCost > 0.50) {
      optimizations.push({
        id: `local-dev-${pattern.model}`,
        type: 'local-dev',
        title: 'Use Ollama for local development',
        description: `Running ${pattern.model} requests locally with Ollama costs $0.`,
        currentCost: pattern.totalCost,
        projectedCost: 0,
        savings: pattern.totalCost,
        savingsPercent: 100,
        effort: 'low',
        impact: 'high',
        command: 'rana ollama:pull llama3.2',
      });
    }

    // 3. Caching suggestion
    if (pattern.requestCount > 10) {
      const estimatedDuplicates = Math.floor(pattern.requestCount * 0.2); // Assume 20% duplicates
      const cacheSavings = (pattern.totalCost / pattern.requestCount) * estimatedDuplicates;

      if (cacheSavings > 0.05) {
        optimizations.push({
          id: `caching-${pattern.model}`,
          type: 'caching',
          title: 'Enable response caching',
          description: `With ${pattern.requestCount} requests, caching could save ~${estimatedDuplicates} duplicate API calls.`,
          currentCost: pattern.totalCost,
          projectedCost: pattern.totalCost - cacheSavings,
          savings: cacheSavings,
          savingsPercent: (cacheSavings / pattern.totalCost) * 100,
          effort: 'low',
          impact: 'medium',
          config: { cache: true, ttl: 3600 },
        });
      }
    }

    // 4. Batching suggestion
    if (pattern.avgLatency < 1000 && pattern.requestCount > 50) {
      const batchSavings = pattern.totalCost * 0.1; // ~10% savings from batching
      optimizations.push({
        id: `batching-${pattern.model}`,
        type: 'batching',
        title: 'Batch similar requests',
        description: 'Combine multiple small requests to reduce API overhead.',
        currentCost: pattern.totalCost,
        projectedCost: pattern.totalCost - batchSavings,
        savings: batchSavings,
        savingsPercent: 10,
        effort: 'medium',
        impact: 'medium',
      });
    }

    // 5. Prompt optimization suggestion
    if (pattern.avgTokens > 2000) {
      const promptSavings = pattern.totalCost * 0.3; // ~30% from shorter prompts
      optimizations.push({
        id: `prompt-${pattern.model}`,
        type: 'prompt-optimization',
        title: 'Optimize prompt length',
        description: `Average token count is ${Math.round(pattern.avgTokens)}. Shorter prompts = lower costs.`,
        currentCost: pattern.totalCost,
        projectedCost: pattern.totalCost - promptSavings,
        savings: promptSavings,
        savingsPercent: 30,
        effort: 'medium',
        impact: 'high',
      });
    }
  }

  // Sort by savings (highest first) and deduplicate
  const seen = new Set<string>();
  return optimizations
    .filter(o => {
      if (seen.has(o.type)) return false;
      seen.add(o.type);
      return true;
    })
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5); // Top 5 suggestions
}

/**
 * Display optimization suggestions
 */
function displayOptimizations(optimizations: Optimization[], detailed: boolean): void {
  const totalSavings = optimizations.reduce((sum, o) => sum + o.savings, 0);

  console.log(chalk.bold(`Found ${optimizations.length} optimization opportunities\n`));
  console.log(chalk.green(`Potential savings: $${totalSavings.toFixed(2)}/period\n`));
  console.log(chalk.gray('─'.repeat(60)) + '\n');

  for (let i = 0; i < optimizations.length; i++) {
    const opt = optimizations[i];
    const impactColor = opt.impact === 'high' ? chalk.green : opt.impact === 'medium' ? chalk.yellow : chalk.gray;
    const effortBadge = opt.effort === 'low' ? chalk.green('Easy') : opt.effort === 'medium' ? chalk.yellow('Medium') : chalk.red('Complex');

    console.log(chalk.bold.white(`${i + 1}. ${opt.title}`));
    console.log(chalk.gray(`   ${opt.description}`));
    console.log('');
    console.log(`   ${chalk.gray('Savings:')} ${chalk.green(`$${opt.savings.toFixed(2)}`)} ${chalk.gray(`(${opt.savingsPercent.toFixed(0)}%)`)}`);
    console.log(`   ${chalk.gray('Impact:')} ${impactColor(opt.impact.toUpperCase())}  ${chalk.gray('Effort:')} ${effortBadge}`);

    if (opt.command) {
      console.log(`   ${chalk.gray('Command:')} ${chalk.cyan(opt.command)}`);
    }

    if (detailed && opt.config) {
      console.log(`   ${chalk.gray('Config:')} ${JSON.stringify(opt.config)}`);
    }

    console.log('');
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('\nApply all suggestions: ') + chalk.cyan('rana cost:optimize --apply'));
  console.log('');
}

/**
 * Apply optimization suggestions
 */
async function applyOptimizations(optimizations: Optimization[]): Promise<void> {
  console.log(chalk.bold.cyan('\n📝 Applying Optimizations\n'));

  for (const opt of optimizations) {
    console.log(chalk.gray(`• ${opt.title}...`));

    switch (opt.type) {
      case 'local-dev':
        console.log(chalk.green(`  ✓ Run: ${opt.command}`));
        console.log(chalk.gray('  Set environment: NODE_ENV=development'));
        break;

      case 'caching':
        console.log(chalk.green('  ✓ Add to your RANA config:'));
        console.log(chalk.gray('    cache: { enabled: true, ttl: 3600 }'));
        break;

      case 'model-switch':
        console.log(chalk.green(`  ✓ Update model in config to: ${opt.config?.model}`));
        break;

      case 'prompt-optimization':
        console.log(chalk.green('  ✓ Tips to reduce prompt length:'));
        console.log(chalk.gray('    - Remove redundant instructions'));
        console.log(chalk.gray('    - Use examples sparingly'));
        console.log(chalk.gray('    - Let the model infer context'));
        break;

      case 'batching':
        console.log(chalk.green('  ✓ Use batchProcess() for multiple requests:'));
        console.log(chalk.gray('    import { batchProcess } from "@rana/core";'));
        break;

      default:
        console.log(chalk.yellow('  ⚠ Manual configuration required'));
    }

    console.log('');
  }

  console.log(chalk.green('✓ Optimization guide generated!\n'));
}

/**
 * Show quick optimization tips
 */
function showQuickTips(): void {
  console.log(chalk.bold('💡 Quick Cost-Saving Tips:\n'));

  console.log(chalk.white('1. Use local models for development'));
  console.log(chalk.gray('   rana ollama:pull llama3.2\n'));

  console.log(chalk.white('2. Enable caching for repeated queries'));
  console.log(chalk.gray('   const rana = createRana({ cache: true });\n'));

  console.log(chalk.white('3. Use smaller models when possible'));
  console.log(chalk.gray('   gpt-4o-mini is 16x cheaper than gpt-4o\n'));

  console.log(chalk.white('4. Set budget limits'));
  console.log(chalk.gray('   rana budget:set --limit 10 --period daily\n'));

  console.log(chalk.white('5. Monitor costs in real-time'));
  console.log(chalk.gray('   rana dashboard --live\n'));
}

/**
 * Quick cost tips command
 */
export async function costTipsCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n💡 RANA Cost Optimization Tips\n'));
  showQuickTips();
}
