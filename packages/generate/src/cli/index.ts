#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';

import { IntentParser } from '../engine/parser';
import { ImplementationPlanner } from '../engine/planner';
import { ContextAnalyzer } from '../engine/context-analyzer';
import { CodeGenerator } from '../engine/generator';
import { QualityValidator } from '../quality/validator';
import { getAllTemplates } from '../templates';
import type { GeneratedFile, ParsedIntent, ImplementationPlan } from '../types';

// ============================================================================
// CLI - rana generate command
// ============================================================================

const program = new Command();

program
  .name('rana-generate')
  .description('Generate production-ready code from natural language')
  .version('1.0.0');

// Main generate command
program
  .command('generate')
  .alias('g')
  .description('Generate code from a natural language description')
  .argument('[description]', 'What you want to generate')
  .option('-i, --interactive', 'Use interactive wizard mode')
  .option('-f, --from <file>', 'Read description from file')
  .option('--framework <framework>', 'Target framework (react, next, express)')
  .option('--dry-run', 'Preview without writing files')
  .option('--no-tests', 'Skip test generation')
  .option('--no-security', 'Skip security audit')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (description, options) => {
    try {
      // Get description from various sources
      let prompt = description;

      if (options.from) {
        prompt = await fs.readFile(options.from, 'utf-8');
      }

      if (options.interactive || !prompt) {
        prompt = await runInteractiveWizard(options);
      }

      if (!prompt) {
        console.log(chalk.yellow('No description provided. Use --interactive for guided mode.'));
        return;
      }

      await generateCode(prompt, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// List templates command
program
  .command('templates')
  .description('List available code generation templates')
  .option('-c, --category <category>', 'Filter by category')
  .action((options) => {
    const templates = getAllTemplates();
    const filtered = options.category
      ? templates.filter(t => t.category === options.category)
      : templates;

    console.log(chalk.bold('\nAvailable Templates:\n'));

    const categories = [...new Set(filtered.map(t => t.category))];

    for (const category of categories) {
      console.log(chalk.cyan(`\n${category.toUpperCase()}`));
      console.log(chalk.gray('─'.repeat(40)));

      const categoryTemplates = filtered.filter(t => t.category === category);
      for (const template of categoryTemplates) {
        console.log(`  ${chalk.green(template.id.padEnd(25))} ${template.description}`);
      }
    }

    console.log();
  });

// Explain command
program
  .command('explain <file>')
  .description('Explain generated code')
  .action(async (file) => {
    try {
      const content = await fs.readFile(file, 'utf-8');
      console.log(chalk.bold('\nCode Explanation:\n'));
      console.log(chalk.gray('This feature requires an LLM provider to be configured.'));
      console.log(chalk.gray('The code appears to be a ' + getFileType(file) + ' file.'));
      console.log();
    } catch (error) {
      console.error(chalk.red('Error reading file:'), error);
    }
  });

// ============================================================================
// Interactive Wizard
// ============================================================================

async function runInteractiveWizard(options: any): Promise<string> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   RANA Code Generator                          │'));
  console.log(chalk.cyan('│   Generate production-ready code from ideas    │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'What do you want to build?',
      validate: (input) => input.length > 5 || 'Please provide a more detailed description',
    },
    {
      type: 'list',
      name: 'framework',
      message: 'What framework are you using?',
      choices: [
        { name: 'Next.js (App Router)', value: 'next' },
        { name: 'React', value: 'react' },
        { name: 'Express', value: 'express' },
        { name: 'Fastify', value: 'fastify' },
        { name: 'Node.js', value: 'node' },
      ],
      default: options.framework || 'next',
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'What features should it include?',
      choices: [
        { name: 'Authentication required', value: 'auth', checked: true },
        { name: 'Real-time updates (WebSocket)', value: 'realtime' },
        { name: 'File upload support', value: 'upload' },
        { name: 'Dark mode', value: 'darkmode' },
        { name: 'Internationalization (i18n)', value: 'i18n' },
        { name: 'Offline support (PWA)', value: 'pwa' },
      ],
    },
    {
      type: 'checkbox',
      name: 'security',
      message: 'Security requirements?',
      choices: [
        { name: 'OWASP Top 10 compliance', value: 'owasp', checked: true },
        { name: 'CSRF protection', value: 'csrf', checked: true },
        { name: 'Rate limiting', value: 'ratelimit', checked: true },
        { name: 'Input validation', value: 'validation', checked: true },
        { name: 'SOC 2 audit trail', value: 'soc2' },
      ],
    },
    {
      type: 'confirm',
      name: 'includeTests',
      message: 'Generate tests?',
      default: true,
    },
  ]);

  // Build description from answers
  let fullDescription = answers.description;

  if (answers.features.length > 0) {
    fullDescription += `. Features: ${answers.features.join(', ')}`;
  }

  if (answers.security.length > 0) {
    fullDescription += `. Security: ${answers.security.join(', ')}`;
  }

  fullDescription += `. Framework: ${answers.framework}`;

  return fullDescription;
}

// ============================================================================
// Code Generation
// ============================================================================

async function generateCode(description: string, options: any): Promise<void> {
  const spinner = ora();

  try {
    // Step 1: Analyze codebase context
    spinner.start('Analyzing codebase...');
    const analyzer = new ContextAnalyzer();
    const context = await analyzer.analyze(options.output || process.cwd());
    spinner.succeed(`Analyzed codebase (${context.framework} framework)`);

    // Step 2: Parse intent
    spinner.start('Understanding your request...');
    const parser = new IntentParser({ defaultFramework: options.framework || context.framework });
    const intent = await parser.parse(description);
    spinner.succeed(`Parsed intent: ${intent.feature}`);

    // Step 3: Create implementation plan
    spinner.start('Creating implementation plan...');
    const planner = new ImplementationPlanner({ includeTests: options.tests !== false });
    const plan = await planner.createPlan(intent, context);
    spinner.succeed('Created implementation plan');

    // Display plan
    displayPlan(intent, plan);

    // Confirm before proceeding
    if (!options.dryRun) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with generation?',
          default: true,
        },
      ]);

      if (!proceed) {
        console.log(chalk.yellow('\nGeneration cancelled.'));
        return;
      }
    }

    // Step 4: Generate code
    spinner.start('Generating code...');
    const generator = new CodeGenerator({
      includeTests: options.tests !== false,
      securityAudit: options.security !== false,
    });
    const files = await generator.generate(plan, context);
    spinner.succeed(`Generated ${files.length} files`);

    // Step 5: Validate code
    if (options.security !== false) {
      spinner.start('Running quality gates...');
      const validator = new QualityValidator();
      const validation = await validator.validate(files);

      if (validation.passed) {
        spinner.succeed(`Quality gates passed (${validation.score}/100)`);
      } else {
        spinner.warn(`Quality gates: ${validation.errors.length} issues found`);
        displayValidationResults(validation);
      }
    }

    // Step 6: Write files (unless dry-run)
    if (options.dryRun) {
      console.log(chalk.yellow('\n[Dry Run] Files would be written:'));
      for (const file of files) {
        console.log(`  ${chalk.green('+')} ${file.path} (${file.content.length} chars)`);
      }
    } else {
      spinner.start('Writing files...');
      await writeFiles(files, options.output || process.cwd());
      spinner.succeed('Files written successfully');

      // Display summary
      displaySummary(files, plan);
    }

  } catch (error) {
    spinner.fail('Generation failed');
    throw error;
  }
}

// ============================================================================
// Display Functions
// ============================================================================

function displayPlan(intent: ParsedIntent, plan: ImplementationPlan): void {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│ Implementation Plan                             │'));
  console.log(chalk.cyan('├─────────────────────────────────────────────────┤'));

  for (const step of plan.steps) {
    console.log(chalk.cyan(`│ ${(step.order + '.').padEnd(3)} ${step.description.slice(0, 42).padEnd(42)} │`));
  }

  console.log(chalk.cyan('├─────────────────────────────────────────────────┤'));
  console.log(chalk.cyan(`│ Files: ${String(plan.files.length).padEnd(3)} | Tests: ${String(plan.tests.length).padEnd(3)} | Complexity: ${plan.estimatedComplexity.padEnd(8)} │`));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  // Security notes
  if (plan.securityNotes.length > 0) {
    console.log(chalk.yellow('Security Notes:'));
    for (const note of plan.securityNotes) {
      console.log(chalk.yellow(`  ⚠ ${note}`));
    }
    console.log();
  }

  // Dependencies
  if (plan.dependencies.length > 0) {
    console.log(chalk.gray('Dependencies to install:'));
    const deps = plan.dependencies.filter(d => !d.dev).map(d => d.name);
    const devDeps = plan.dependencies.filter(d => d.dev).map(d => d.name);

    if (deps.length > 0) {
      console.log(chalk.gray(`  npm install ${deps.join(' ')}`));
    }
    if (devDeps.length > 0) {
      console.log(chalk.gray(`  npm install -D ${devDeps.join(' ')}`));
    }
    console.log();
  }
}

function displayValidationResults(validation: any): void {
  console.log();

  for (const error of validation.errors) {
    console.log(chalk.red(`  ✗ ${error.type}: ${error.message}`));
    if (error.file) {
      console.log(chalk.gray(`    ${error.file}${error.line ? `:${error.line}` : ''}`));
    }
  }

  for (const warning of validation.warnings) {
    console.log(chalk.yellow(`  ⚠ ${warning.type}: ${warning.message}`));
  }

  console.log();
}

function displaySummary(files: GeneratedFile[], plan: ImplementationPlan): void {
  console.log();
  console.log(chalk.green('✓ Code generated successfully!'));
  console.log();
  console.log(chalk.bold('Files created:'));

  for (const file of files) {
    const lines = file.content.split('\n').length;
    console.log(`  ${chalk.green('+')} ${file.path} (${lines} lines)`);
  }

  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log('  1. Review generated code');
  console.log('  2. Run tests: npm test');
  console.log('  3. Start dev server: npm run dev');
  console.log();
}

// ============================================================================
// File Operations
// ============================================================================

async function writeFiles(files: GeneratedFile[], basePath: string): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(basePath, file.path);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file.content, 'utf-8');

    // Write tests if present
    if (file.tests) {
      const testPath = file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const testFullPath = path.join(basePath, testPath);
      await fs.writeFile(testFullPath, file.tests, 'utf-8');
    }
  }
}

function getFileType(filePath: string): string {
  if (filePath.includes('component') || filePath.endsWith('.tsx')) return 'React component';
  if (filePath.includes('api') || filePath.includes('route')) return 'API route';
  if (filePath.includes('.test.')) return 'test';
  if (filePath.endsWith('.ts')) return 'TypeScript';
  return 'code';
}

// Run CLI
program.parse();
