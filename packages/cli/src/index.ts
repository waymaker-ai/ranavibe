#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import {
  ConfigParser,
  QualityGateChecker,
  REPMValidator,
  TemplateManager,
} from '@rana/core';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('rana')
  .description('RANA CLI - Rapid AI Native Architecture quality gates and REPM validation')
  .version('0.1.0');

// Command: init
program
  .command('init')
  .description('Initialize a new RANA project')
  .option('-t, --type <type>', 'Project type (nextjs, react, python)', 'default')
  .option('-o, --output <path>', 'Output directory', process.cwd())
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 RANA Project Initialization\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(options.output),
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'Project type:',
        choices: ['nextjs', 'react', 'python', 'fullstack', 'other'],
        default: options.type,
      },
      {
        type: 'checkbox',
        name: 'languages',
        message: 'Programming languages:',
        choices: ['typescript', 'javascript', 'python', 'go', 'rust'],
        default: ['typescript'],
      },
    ]);

    const spinner = ora('Creating .rana.yml...').start();

    try {
      const templateManager = new TemplateManager();
      const config = templateManager.getDefaultConfig();

      // Customize config with user input
      const customConfig = config
        .replace('name: "My Project"', `name: "${answers.projectName}"`)
        .replace('type: "fullstack"', `type: "${answers.projectType}"`)
        .replace(
          'languages:\n    - "typescript"',
          `languages:\n${answers.languages.map((lang: string) => `    - "${lang}"`).join('\n')}`
        );

      const configPath = path.join(options.output, '.rana.yml');
      fs.writeFileSync(configPath, customConfig, 'utf8');

      spinner.succeed(chalk.green('Created .rana.yml'));

      console.log(chalk.green.bold('\n✅ RANA project initialized!\n'));
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray('  1. Customize .rana.yml for your project'));
      console.log(chalk.gray('  2. Run `rana validate` to verify configuration'));
      console.log(chalk.gray('  3. Run `rana check pre` before implementing features\n'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create .rana.yml'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Command: validate
program
  .command('validate')
  .description('Validate .rana.yml configuration')
  .option('-c, --config <path>', 'Path to .rana.yml file')
  .action(async (options) => {
    const spinner = ora('Validating configuration...').start();

    try {
      const configPath = options.config || ConfigParser.findConfig();
      if (!configPath) {
        spinner.fail(chalk.red('No .rana.yml file found'));
        console.log(chalk.gray('\nRun `rana init` to create one.\n'));
        process.exit(1);
      }

      const config = ConfigParser.parse(configPath);

      spinner.succeed(chalk.green('Configuration valid!'));

      console.log(chalk.blue.bold('\n📋 Project Configuration\n'));
      console.log(chalk.gray('Project:'), chalk.white(config.project.name));
      console.log(chalk.gray('Type:'), chalk.white(config.project.type));
      console.log(
        chalk.gray('Languages:'),
        chalk.white(config.project.languages.join(', '))
      );

      console.log(chalk.blue.bold('\n🎯 Quality Gates\n'));
      console.log(
        chalk.gray('  Pre-implementation:'),
        chalk.white(config.quality_gates.pre_implementation.length),
        'gates'
      );
      console.log(
        chalk.gray('  Implementation:'),
        chalk.white(config.quality_gates.implementation.length),
        'gates'
      );
      console.log(
        chalk.gray('  Testing:'),
        chalk.white(config.quality_gates.testing.length),
        'gates'
      );
      console.log(
        chalk.gray('  Deployment:'),
        chalk.white(config.quality_gates.deployment.length),
        'gates\n'
      );
    } catch (error) {
      spinner.fail(chalk.red('Configuration validation failed'));
      console.error(chalk.red('\n' + (error instanceof Error ? error.message : String(error)) + '\n'));
      process.exit(1);
    }
  });

// Command: check
program
  .command('check <phase>')
  .description('Check quality gates for a specific phase')
  .option('-c, --config <path>', 'Path to .rana.yml file')
  .action(async (phase, options) => {
    const validPhases = ['pre', 'impl', 'test', 'deploy'];
    const phaseMap: Record<string, 'pre_implementation' | 'implementation' | 'testing' | 'deployment'> = {
      pre: 'pre_implementation',
      impl: 'implementation',
      test: 'testing',
      deploy: 'deployment',
    };

    if (!validPhases.includes(phase)) {
      console.error(
        chalk.red(`Invalid phase: ${phase}. Must be one of: ${validPhases.join(', ')}`)
      );
      process.exit(1);
    }

    try {
      const configPath = options.config || ConfigParser.findConfig();
      if (!configPath) {
        console.error(chalk.red('No .rana.yml file found'));
        process.exit(1);
      }

      const config = ConfigParser.parse(configPath);
      const checker = new QualityGateChecker(config);
      const results = checker.checkPhase(phaseMap[phase]);

      const phaseName = phaseMap[phase].replace('_', ' ').toUpperCase();
      console.log(chalk.blue.bold(`\n🎯 Quality Gates: ${phaseName}\n`));

      for (const result of results.gates) {
        const icon = result.passed ? '✅' : '⚠️';
        console.log(`${icon} ${chalk.white.bold(result.gate.name)}`);
        console.log(chalk.gray(`   ${result.gate.description}`));
        if (!result.passed) {
          console.log(chalk.yellow(`   Status: ${result.message}`));
        }
        console.log();
      }

      if (results.allPassed) {
        console.log(chalk.green.bold('✅ All gates passed!\n'));
      } else {
        console.log(chalk.yellow.bold('⚠️  Some gates need attention\n'));
      }
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Command: repm
program
  .command('repm [phase]')
  .description('Run REPM validation (outcome, monetization, gtm, ux, product, build, idea)')
  .action(async (phase) => {
    const validator = new REPMValidator();

    if (phase) {
      const phaseData = validator.getPhase(phase);
      if (!phaseData) {
        console.error(chalk.red(`Invalid REPM phase: ${phase}`));
        process.exit(1);
      }

      console.log(chalk.blue.bold(`\n🔍 REPM Phase: ${phaseData.description}\n`));
      console.log(chalk.white.bold('Key Questions:\n'));
      for (const question of phaseData.questions) {
        console.log(chalk.gray(`  • ${question}`));
      }

      console.log(chalk.white.bold('\n📝 Template:\n'));
      console.log(chalk.gray(phaseData.template));
      console.log();
    } else {
      console.log(chalk.blue.bold('\n🔍 REPM Validation Checklist\n'));
      const checklist = validator.generateChecklist();
      console.log(chalk.gray(checklist));
      console.log();
    }
  });

// Command: is-major
program
  .command('is-major')
  .description('Check if a feature requires REPM validation')
  .option('-c, --config <path>', 'Path to .rana.yml file')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Describe the feature you want to build:',
      },
    ]);

    try {
      const configPath = options.config || ConfigParser.findConfig();
      if (!configPath) {
        console.error(chalk.red('No .rana.yml file found'));
        process.exit(1);
      }

      const config = ConfigParser.parse(configPath);
      const isMajor = ConfigParser.isMajorFeature(config, answers.description);

      if (isMajor) {
        console.log(chalk.yellow.bold('\n⚠️  This is a MAJOR FEATURE\n'));
        console.log(
          chalk.gray(
            'This feature involves revenue streams, new products, pricing, or market segments.'
          )
        );
        console.log(chalk.white.bold('\nREPM validation required before implementation.\n'));
        console.log(chalk.gray('Run: rana repm\n'));
      } else {
        console.log(chalk.green.bold('\n✅ This is a standard feature\n'));
        console.log(chalk.gray('No REPM validation needed.'));
        console.log(chalk.white.bold('\nProceed with regular quality gates:\n'));
        console.log(chalk.gray('  1. Run: rana check pre'));
        console.log(chalk.gray('  2. Implement feature'));
        console.log(chalk.gray('  3. Run: rana check impl'));
        console.log(chalk.gray('  4. Run: rana check test'));
        console.log(chalk.gray('  5. Run: rana check deploy\n'));
      }
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Command: report
program
  .command('report')
  .description('Generate compliance report')
  .option('-c, --config <path>', 'Path to .rana.yml file')
  .option('-o, --output <file>', 'Output file (markdown)')
  .action(async (options) => {
    const spinner = ora('Generating compliance report...').start();

    try {
      const configPath = options.config || ConfigParser.findConfig();
      if (!configPath) {
        spinner.fail(chalk.red('No .rana.yml file found'));
        process.exit(1);
      }

      const config = ConfigParser.parse(configPath);
      const checker = new QualityGateChecker(config);

      let report = `# RANA Compliance Report\n\n`;
      report += `**Project**: ${config.project.name}\n`;
      report += `**Type**: ${config.project.type}\n`;
      report += `**Languages**: ${config.project.languages.join(', ')}\n\n`;

      const phases = ['pre_implementation', 'implementation', 'testing', 'deployment'] as const;
      for (const phase of phases) {
        const results = checker.checkPhase(phase);
        report += `## ${phase.replace('_', ' ').toUpperCase()}\n\n`;

        for (const result of results.gates) {
          const icon = result.passed ? '✅' : '⚠️';
          report += `${icon} **${result.gate.name}**\n`;
          report += `   ${result.gate.description}\n\n`;
        }
      }

      if (options.output) {
        fs.writeFileSync(options.output, report, 'utf8');
        spinner.succeed(chalk.green(`Report saved to ${options.output}`));
      } else {
        spinner.succeed(chalk.green('Report generated'));
        console.log('\n' + report);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate report'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();
