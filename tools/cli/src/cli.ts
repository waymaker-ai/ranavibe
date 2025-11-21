#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';
import { deployCommand } from './commands/deploy.js';

const program = new Command();

program
  .name('aads')
  .description('AI-Assisted Development Standard - CLI tool for production-quality AI development')
  .version('0.1.0');

// ASCII Art Banner
const banner = `
${chalk.bold.cyan('╔═══════════════════════════════════════╗')}
${chalk.bold.cyan('║')}  ${chalk.bold.white('AADS - AI-Assisted Development')}  ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}       ${chalk.bold.white('Production-Quality AI Code')}       ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════╝')}

${chalk.gray('Sponsored by')} ${chalk.bold('Waymaker')} ${chalk.gray('• https://waymaker.com/aads')}
`;

// Init command
program
  .command('init')
  .description('Initialize AADS in your project')
  .option('-t, --template <type>', 'Template to use (default, react, nextjs, vue)', 'default')
  .option('-f, --force', 'Overwrite existing .aads.yml')
  .action(initCommand);

// Check command
program
  .command('check')
  .description('Check compliance with AADS standards')
  .option('-v, --verbose', 'Show detailed output')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .action(checkCommand);

// Deploy command
program
  .command('deploy')
  .description('Deploy with AADS verification workflow')
  .option('--verify', 'Verify deployment in production')
  .option('--skip-tests', 'Skip testing phase (not recommended)')
  .action(deployCommand);

// Validate command
program
  .command('validate')
  .description('Validate .aads.yml configuration')
  .action(async () => {
    const { validateConfig } = await import('./commands/validate.js');
    await validateConfig();
  });

// Config command
program
  .command('config')
  .description('Show current AADS configuration')
  .action(async () => {
    const { showConfig } = await import('./commands/config.js');
    await showConfig();
  });

// Status command
program
  .command('status')
  .description('Show AADS project status')
  .action(async () => {
    const { showStatus } = await import('./commands/status.js');
    await showStatus();
  });

// Show banner before help
program.on('--help', () => {
  console.log(banner);
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  $ aads init                  # Initialize AADS in current project'));
  console.log(chalk.gray('  $ aads check                 # Check compliance'));
  console.log(chalk.gray('  $ aads deploy --verify       # Deploy with verification'));
  console.log(chalk.gray('\nDocumentation: https://aads.dev'));
  console.log(chalk.gray('GitHub: https://github.com/aads-dev/aads-framework\n'));
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.outputHelp();
}
