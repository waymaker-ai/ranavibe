#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';
import { deployCommand } from './commands/deploy.js';

const program = new Command();

program
  .name('rana')
  .description('AI-Assisted Development Standard - CLI tool for production-quality AI development')
  .version('0.1.0');

// ASCII Art Banner
const banner = `
${chalk.bold.cyan('╔═══════════════════════════════════════╗')}
${chalk.bold.cyan('║')}  ${chalk.bold.white('RANA - AI-Assisted Development')}  ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}       ${chalk.bold.white('Production-Quality AI Code')}       ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════╝')}

${chalk.gray('Sponsored by')} ${chalk.bold('Waymaker')} ${chalk.gray('• https://waymaker.com/rana')}
`;

// Init command
program
  .command('init')
  .description('Initialize RANA in your project')
  .option('-t, --template <type>', 'Template to use (default, react, nextjs, vue)', 'default')
  .option('-f, --force', 'Overwrite existing .rana.yml')
  .action(initCommand);

// Check command
program
  .command('check')
  .description('Check compliance with RANA standards')
  .option('-v, --verbose', 'Show detailed output')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .action(checkCommand);

// Deploy command
program
  .command('deploy')
  .description('Deploy with RANA verification workflow')
  .option('--verify', 'Verify deployment in production')
  .option('--skip-tests', 'Skip testing phase (not recommended)')
  .action(deployCommand);

// Validate command
program
  .command('validate')
  .description('Validate .rana.yml configuration')
  .action(async () => {
    const { validateConfig } = await import('./commands/validate.js');
    await validateConfig();
  });

// Config command
program
  .command('config')
  .description('Show current RANA configuration')
  .action(async () => {
    const { showConfig } = await import('./commands/config.js');
    await showConfig();
  });

// Status command
program
  .command('status')
  .description('Show RANA project status')
  .action(async () => {
    const { showStatus } = await import('./commands/status.js');
    await showStatus();
  });

// Show banner before help
program.on('--help', () => {
  console.log(banner);
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  $ rana init                  # Initialize RANA in current project'));
  console.log(chalk.gray('  $ rana check                 # Check compliance'));
  console.log(chalk.gray('  $ rana deploy --verify       # Deploy with verification'));
  console.log(chalk.gray('\nDocumentation: https://rana.dev'));
  console.log(chalk.gray('GitHub: https://github.com/rana-dev/rana-framework\n'));
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.outputHelp();
}
