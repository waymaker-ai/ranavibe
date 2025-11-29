/**
 * RANA Budget Command
 *
 * Manage cost budget limits and enforcement
 *
 * @example
 * ```bash
 * # Set a daily budget
 * rana budget:set --limit 10 --period daily
 *
 * # Set a hard limit that blocks API calls
 * rana budget:set --limit 5 --period daily --action block
 *
 * # View current budget status
 * rana budget
 *
 * # Clear budget enforcement
 * rana budget:clear
 * ```
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';

interface BudgetConfig {
  limit: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'total';
  action: 'block' | 'warn' | 'log';
  warningThreshold: number;
  allowCriticalBypass: boolean;
}

interface StoredBudget extends BudgetConfig {
  createdAt: string;
  spent: number;
  periodStart: string;
}

const BUDGET_FILE = '.rana/budget.json';

/**
 * Load stored budget configuration
 */
function loadBudget(): StoredBudget | null {
  const budgetPath = path.join(process.cwd(), BUDGET_FILE);

  try {
    if (fs.existsSync(budgetPath)) {
      return JSON.parse(fs.readFileSync(budgetPath, 'utf-8'));
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Save budget configuration
 */
function saveBudget(budget: StoredBudget): void {
  const budgetPath = path.join(process.cwd(), BUDGET_FILE);
  const ranaDir = path.dirname(budgetPath);

  if (!fs.existsSync(ranaDir)) {
    fs.mkdirSync(ranaDir, { recursive: true });
  }

  fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 2));
}

/**
 * Show current budget status
 */
export async function budgetCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n💰 RANA Budget Status\n'));

  const budget = loadBudget();

  if (!budget) {
    console.log(chalk.yellow('No budget configured.'));
    console.log(chalk.gray('\nSet a budget with: rana budget:set --limit <amount>\n'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  rana budget:set --limit 10 --period daily'));
    console.log(chalk.gray('  rana budget:set --limit 50 --period weekly --action block'));
    console.log(chalk.gray('  rana budget:set --limit 100 --period monthly --warning 80\n'));
    return;
  }

  // Calculate status
  const percentUsed = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const remaining = Math.max(0, budget.limit - budget.spent);
  const isExceeded = budget.spent >= budget.limit;
  const isWarning = percentUsed >= budget.warningThreshold;

  // Status color
  const statusColor = isExceeded
    ? chalk.red
    : isWarning
      ? chalk.yellow
      : chalk.green;

  // Display budget info
  console.log(chalk.gray('Budget Configuration:'));
  console.log(`  Limit:     ${chalk.white('$' + budget.limit.toFixed(2))} per ${budget.period}`);
  console.log(`  Action:    ${chalk.white(budget.action)}`);
  console.log(`  Warning:   ${chalk.white(budget.warningThreshold + '%')}`);
  console.log(`  Bypass:    ${chalk.white(budget.allowCriticalBypass ? 'enabled' : 'disabled')}`);

  console.log(chalk.gray('\nCurrent Status:'));
  console.log(`  Spent:     ${statusColor('$' + budget.spent.toFixed(4))}`);
  console.log(`  Remaining: ${chalk.white('$' + remaining.toFixed(4))}`);
  console.log(`  Used:      ${statusColor(percentUsed.toFixed(1) + '%')}`);

  // Progress bar
  const barWidth = 40;
  const filledWidth = Math.min(barWidth, Math.round((percentUsed / 100) * barWidth));
  const emptyWidth = barWidth - filledWidth;
  const progressChar = isExceeded ? '█' : isWarning ? '▓' : '▓';
  const progressBar =
    statusColor(progressChar.repeat(filledWidth)) + chalk.gray('░'.repeat(emptyWidth));

  console.log(`\n  [${progressBar}]`);

  // Status message
  if (isExceeded) {
    console.log(chalk.red.bold('\n  ⛔ BUDGET EXCEEDED'));
    if (budget.action === 'block') {
      console.log(chalk.red('     API calls are blocked until budget resets'));
    }
  } else if (isWarning) {
    console.log(chalk.yellow.bold('\n  ⚠️  APPROACHING BUDGET LIMIT'));
  } else {
    console.log(chalk.green.bold('\n  ✓ Within budget'));
  }

  // Period info
  console.log(chalk.gray(`\n  Period started: ${new Date(budget.periodStart).toLocaleString()}`));

  console.log('');
}

/**
 * Set budget configuration
 */
export async function setBudgetCommand(options: {
  limit?: number;
  period?: string;
  action?: string;
  warning?: number;
  bypass?: boolean;
  interactive?: boolean;
}): Promise<void> {
  console.log(chalk.bold.cyan('\n💰 Set RANA Budget\n'));

  let config: BudgetConfig;

  if (options.interactive || (!options.limit && !options.period)) {
    // Interactive mode
    const response = await prompts([
      {
        type: 'number',
        name: 'limit',
        message: 'Maximum budget amount ($)',
        initial: options.limit || 10,
        validate: (v) => (v > 0 ? true : 'Must be greater than 0'),
      },
      {
        type: 'select',
        name: 'period',
        message: 'Budget period',
        choices: [
          { title: 'Hourly', value: 'hourly' },
          { title: 'Daily', value: 'daily' },
          { title: 'Weekly', value: 'weekly' },
          { title: 'Monthly', value: 'monthly' },
          { title: 'Total (never resets)', value: 'total' },
        ],
        initial: 1, // daily
      },
      {
        type: 'select',
        name: 'action',
        message: 'What to do when budget is exceeded',
        choices: [
          { title: 'Block - Prevent API calls (recommended)', value: 'block' },
          { title: 'Warn - Log warning but allow', value: 'warn' },
          { title: 'Log - Silent logging only', value: 'log' },
        ],
        initial: 0,
      },
      {
        type: 'number',
        name: 'warningThreshold',
        message: 'Warning threshold (%)',
        initial: 80,
        validate: (v) => (v >= 0 && v <= 100 ? true : 'Must be 0-100'),
      },
      {
        type: 'confirm',
        name: 'allowCriticalBypass',
        message: 'Allow critical requests to bypass budget?',
        initial: false,
      },
    ]);

    if (!response.limit) {
      console.log(chalk.gray('Budget setup cancelled.'));
      return;
    }

    config = {
      limit: response.limit,
      period: response.period,
      action: response.action,
      warningThreshold: response.warningThreshold,
      allowCriticalBypass: response.allowCriticalBypass,
    };
  } else {
    // CLI options mode
    config = {
      limit: options.limit || 10,
      period: (options.period || 'daily') as BudgetConfig['period'],
      action: (options.action || 'block') as BudgetConfig['action'],
      warningThreshold: options.warning ?? 80,
      allowCriticalBypass: options.bypass ?? false,
    };
  }

  // Load existing budget to preserve spent amount
  const existing = loadBudget();
  const spent = existing?.spent ?? 0;
  const periodStart = existing?.periodStart ?? new Date().toISOString();

  // Save budget
  const budget: StoredBudget = {
    ...config,
    createdAt: new Date().toISOString(),
    spent,
    periodStart,
  };

  saveBudget(budget);

  console.log(chalk.green('✓ Budget configured!\n'));
  console.log(chalk.gray('Settings:'));
  console.log(`  Limit:    $${config.limit.toFixed(2)} per ${config.period}`);
  console.log(`  Action:   ${config.action}`);
  console.log(`  Warning:  ${config.warningThreshold}%`);
  console.log(`  Bypass:   ${config.allowCriticalBypass ? 'enabled' : 'disabled'}`);

  if (config.action === 'block') {
    console.log(chalk.yellow('\n⚠️  API calls will be blocked when budget is exceeded.'));
    console.log(chalk.gray('   Use --critical flag on individual calls to bypass if needed.'));
  }

  console.log(chalk.gray('\nView status: rana budget'));
  console.log(chalk.gray('Clear budget: rana budget:clear\n'));
}

/**
 * Clear budget configuration
 */
export async function clearBudgetCommand(): Promise<void> {
  const budgetPath = path.join(process.cwd(), BUDGET_FILE);

  if (fs.existsSync(budgetPath)) {
    fs.unlinkSync(budgetPath);
    console.log(chalk.green('✓ Budget cleared. No spending limits are active.\n'));
  } else {
    console.log(chalk.yellow('No budget was configured.\n'));
  }
}

/**
 * Reset budget period (keep config, reset spent)
 */
export async function resetBudgetCommand(): Promise<void> {
  const budget = loadBudget();

  if (!budget) {
    console.log(chalk.yellow('No budget configured.\n'));
    return;
  }

  budget.spent = 0;
  budget.periodStart = new Date().toISOString();
  saveBudget(budget);

  console.log(chalk.green('✓ Budget period reset. Spent amount is now $0.00\n'));
}

/**
 * Add to spent amount (for testing/manual tracking)
 */
export async function addSpentCommand(amount: number): Promise<void> {
  const budget = loadBudget();

  if (!budget) {
    console.log(chalk.yellow('No budget configured. Set one first with: rana budget:set\n'));
    return;
  }

  budget.spent += amount;
  saveBudget(budget);

  console.log(chalk.green(`✓ Added $${amount.toFixed(4)} to spent total.`));
  console.log(chalk.gray(`  Total spent: $${budget.spent.toFixed(4)}\n`));
}

/**
 * Quick budget setup presets
 */
export async function budgetPresetCommand(preset: string): Promise<void> {
  const presets: Record<string, Omit<BudgetConfig, 'createdAt'>> = {
    testing: {
      limit: 1,
      period: 'daily',
      action: 'block',
      warningThreshold: 50,
      allowCriticalBypass: true,
    },
    development: {
      limit: 10,
      period: 'daily',
      action: 'warn',
      warningThreshold: 80,
      allowCriticalBypass: true,
    },
    staging: {
      limit: 50,
      period: 'weekly',
      action: 'block',
      warningThreshold: 80,
      allowCriticalBypass: false,
    },
    production: {
      limit: 100,
      period: 'monthly',
      action: 'block',
      warningThreshold: 70,
      allowCriticalBypass: false,
    },
  };

  const config = presets[preset];

  if (!config) {
    console.log(chalk.yellow(`Unknown preset: ${preset}\n`));
    console.log('Available presets:');
    console.log(chalk.gray('  • testing     - $1/day, strict blocking'));
    console.log(chalk.gray('  • development - $10/day, warnings only'));
    console.log(chalk.gray('  • staging     - $50/week, blocking'));
    console.log(chalk.gray('  • production  - $100/month, blocking'));
    console.log(chalk.gray('\nUsage: rana budget:preset <name>\n'));
    return;
  }

  const budget: StoredBudget = {
    ...config,
    createdAt: new Date().toISOString(),
    spent: 0,
    periodStart: new Date().toISOString(),
  };

  saveBudget(budget);

  console.log(chalk.green(`✓ Applied "${preset}" budget preset!\n`));
  console.log(chalk.gray('Settings:'));
  console.log(`  Limit:    $${config.limit.toFixed(2)} per ${config.period}`);
  console.log(`  Action:   ${config.action}`);
  console.log(`  Warning:  ${config.warningThreshold}%`);
  console.log(chalk.gray('\nView status: rana budget\n'));
}
