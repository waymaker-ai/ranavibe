#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '@aads/cli/dist/commands/init.js';
import { checkCommand } from '@aads/cli/dist/commands/check.js';
import { deployCommand } from '@aads/cli/dist/commands/deploy.js';
import { analyticsCommand } from './commands/analytics.js';
import { teamCommand } from './commands/team.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('waymaker-aads')
  .description('Waymaker AADS Pro - Enhanced AI development with team collaboration')
  .version('0.1.0');

const banner = `
${chalk.bold.cyan('╔═══════════════════════════════════════════════╗')}
${chalk.bold.cyan('║')}  ${chalk.bold.white('Waymaker AADS Pro')}                        ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}       ${chalk.bold.white('Enterprise AI Development')}              ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════════════╝')}

${chalk.gray('Powered by AADS - AI-Assisted Development Standard')}
`;

console.log(banner);

// Core AADS commands (inherit from @aads/cli)
program
  .command('init')
  .description('Initialize AADS in your project (with Waymaker integration)')
  .option('-t, --template <type>', 'Template to use', 'default')
  .option('-f, --force', 'Overwrite existing .aads.yml')
  .option('--team-id <id>', 'Connect to Waymaker team')
  .action(initCommand);

program
  .command('check')
  .description('Check compliance with AADS standards')
  .option('-v, --verbose', 'Show detailed output')
  .option('-f, --fix', 'Automatically fix issues')
  .option('--upload', 'Upload results to Waymaker dashboard')
  .action(checkCommand);

program
  .command('deploy')
  .description('Deploy with AADS verification')
  .option('--verify', 'Verify deployment')
  .option('--skip-tests', 'Skip tests (not recommended)')
  .option('--track', 'Track deployment in Waymaker')
  .action(deployCommand);

// Waymaker Pro exclusive commands
program
  .command('analytics')
  .description('View AADS compliance analytics')
  .option('-p, --period <days>', 'Time period in days', '30')
  .option('--export <format>', 'Export format (json, csv)', 'json')
  .action(analyticsCommand);

program
  .command('team')
  .description('Manage team AADS settings')
  .option('--list', 'List team members')
  .option('--add <email>', 'Add team member')
  .option('--remove <email>', 'Remove team member')
  .option('--role <role>', 'Set role (admin, developer, viewer)')
  .action(teamCommand);

program
  .command('sync')
  .description('Sync AADS configuration with Waymaker platform')
  .option('--push', 'Push local config to Waymaker')
  .option('--pull', 'Pull config from Waymaker')
  .option('--auto', 'Enable auto-sync')
  .action(syncCommand);

program
  .command('login')
  .description('Login to Waymaker platform')
  .action(async () => {
    console.log(chalk.yellow('\n🔐 Waymaker Authentication\n'));
    console.log('Visit: https://waymaker.com/auth/cli');
    console.log('\nAfter authentication, paste your token here:');
    // TODO: Implement OAuth flow
  });

program
  .command('upgrade')
  .description('Upgrade from AADS CLI to Waymaker AADS Pro')
  .action(async () => {
    console.log(chalk.cyan('\n✨ Welcome to Waymaker AADS Pro!\n'));
    console.log('Enhanced features:');
    console.log('  ✅ Team collaboration');
    console.log('  ✅ Real-time analytics');
    console.log('  ✅ Custom quality gates');
    console.log('  ✅ Priority support');
    console.log('\nVisit: https://waymaker.com/aads/pro');
  });

program.parse();
