/**
 * Code generation commands
 * rana generate, rana templates, rana explain
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';

// Import from @rana/generate
import {
  generate,
  parseIntent,
  createPlan,
  generateFromPlan,
  validateCode,
  fixCode,
  analyzeCodebase,
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
} from '@rana/generate';

import type {
  GeneratedFile,
  ParsedIntent,
  ImplementationPlan,
  ValidationResult,
} from '@rana/generate';

/**
 * Register generate commands
 */
export function registerGenerateCommands(program: Command): void {
  // Main generate command
  program
    .command('generate [description]')
    .alias('g')
    .description('Generate production-ready code from natural language')
    .option('-i, --interactive', 'Use interactive wizard mode')
    .option('-f, --from <file>', 'Read description from file')
    .option('--framework <framework>', 'Target framework (react, next, express)')
    .option('--dry-run', 'Preview without writing files')
    .option('--no-tests', 'Skip test generation')
    .option('--no-security', 'Skip security audit')
    .option('--auto-fix', 'Auto-fix issues after generation')
    .option('-o, --output <dir>', 'Output directory', '.')
    .action(async (description, options) => {
      try {
        let prompt = description;

        // Read from file if specified
        if (options.from) {
          if (!fs.existsSync(options.from)) {
            console.error(chalk.red(`File not found: ${options.from}`));
            process.exit(1);
          }
          prompt = fs.readFileSync(options.from, 'utf-8').trim();
        }

        // Interactive mode
        if (options.interactive || !prompt) {
          prompt = await runInteractiveWizard(options);
        }

        if (!prompt) {
          console.log(chalk.yellow('No description provided. Use --interactive for guided mode.'));
          return;
        }

        await runGeneration(prompt, options);
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
    .option('-s, --search <query>', 'Search templates')
    .action((options) => {
      let templates = getAllTemplates();

      if (options.category) {
        templates = getTemplatesByCategory(options.category);
      }

      if (options.search) {
        templates = searchTemplates(options.search);
      }

      if (templates.length === 0) {
        console.log(chalk.yellow('\nNo templates found matching your criteria.\n'));
        return;
      }

      console.log(chalk.bold.blue('\n Available Templates\n'));

      const categories = [...new Set(templates.map(t => t.category))];

      for (const category of categories) {
        console.log(chalk.cyan(`\n  ${category.toUpperCase()}`));
        console.log(chalk.gray('  ' + '─'.repeat(50)));

        const categoryTemplates = templates.filter(t => t.category === category);
        for (const template of categoryTemplates) {
          console.log(
            `  ${chalk.green(template.id.padEnd(25))} ${chalk.gray(template.description)}`
          );
        }
      }

      console.log();
    });

  // Explain command
  program
    .command('explain <file>')
    .description('Analyze and explain code in a file')
    .action(async (file) => {
      try {
        if (!fs.existsSync(file)) {
          console.error(chalk.red(`File not found: ${file}`));
          process.exit(1);
        }

        const content = fs.readFileSync(file, 'utf-8');
        const ext = path.extname(file);

        console.log(chalk.bold.blue('\n Code Analysis\n'));
        console.log(chalk.gray('File:'), chalk.white(file));
        console.log(chalk.gray('Type:'), chalk.white(getFileType(ext)));
        console.log(chalk.gray('Lines:'), chalk.white(content.split('\n').length.toString()));
        console.log();

        // Basic analysis
        const analysis = analyzeFile(content, ext);

        if (analysis.imports.length > 0) {
          console.log(chalk.cyan('Imports:'));
          analysis.imports.slice(0, 10).forEach(imp => {
            console.log(chalk.gray(`  ${imp}`));
          });
          if (analysis.imports.length > 10) {
            console.log(chalk.gray(`  ... and ${analysis.imports.length - 10} more`));
          }
          console.log();
        }

        if (analysis.exports.length > 0) {
          console.log(chalk.cyan('Exports:'));
          analysis.exports.forEach(exp => {
            console.log(chalk.gray(`  ${exp}`));
          });
          console.log();
        }

        if (analysis.functions.length > 0) {
          console.log(chalk.cyan('Functions/Components:'));
          analysis.functions.forEach(fn => {
            console.log(chalk.gray(`  ${fn}`));
          });
          console.log();
        }

        console.log(chalk.gray('For detailed explanation, configure an LLM provider.\n'));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Analyze codebase command
  program
    .command('analyze')
    .description('Analyze the current codebase')
    .option('-d, --dir <directory>', 'Directory to analyze', '.')
    .action(async (options) => {
      const spinner = ora('Analyzing codebase...').start();

      try {
        const context = await analyzeCodebase(options.dir);
        spinner.succeed('Analysis complete');

        console.log(chalk.bold.blue('\n Codebase Analysis\n'));

        console.log(chalk.cyan('Framework:'), chalk.white(context.framework));
        console.log(chalk.cyan('Testing:'), chalk.white(context.testingFramework || 'Not detected'));
        console.log(chalk.cyan('State Management:'), chalk.white(context.stateManagement || 'Not detected'));
        console.log();

        if (context.dependencies.length > 0) {
          console.log(chalk.cyan('Key Dependencies:'));
          context.dependencies.slice(0, 10).forEach(dep => {
            console.log(chalk.gray(`  ${dep.name}@${dep.version}`));
          });
          if (context.dependencies.length > 10) {
            console.log(chalk.gray(`  ... and ${context.dependencies.length - 10} more`));
          }
          console.log();
        }

        if (context.patterns.length > 0) {
          console.log(chalk.cyan('Detected Patterns:'));
          context.patterns.forEach(pattern => {
            console.log(chalk.gray(`  ${pattern.name}: ${pattern.description}`));
          });
          console.log();
        }

        console.log(chalk.cyan('Style Guide:'));
        console.log(chalk.gray(`  Indentation: ${context.styleGuide.indentation}`));
        console.log(chalk.gray(`  Quotes: ${context.styleGuide.quotes}`));
        console.log(chalk.gray(`  Semicolons: ${context.styleGuide.semicolons ? 'Yes' : 'No'}`));
        console.log();
      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}

/**
 * Interactive wizard for gathering requirements
 */
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
      validate: (input: string) =>
        input.length > 5 || 'Please provide a more detailed description',
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

/**
 * Run the full generation pipeline
 */
async function runGeneration(description: string, options: any): Promise<void> {
  const spinner = ora();

  try {
    // Step 1: Analyze codebase context
    spinner.start('Analyzing codebase...');
    const cwd = path.resolve(options.output || process.cwd());

    // Step 2: Generate code
    spinner.text = 'Generating code...';
    const result = await generate(description, {
      cwd,
      framework: options.framework,
      includeTests: options.tests !== false,
      securityAudit: options.security !== false,
      autoFix: options.autoFix,
    });

    spinner.succeed(`Generated ${result.files.length} files`);

    // Display plan
    displayPlan(result.intent, result.plan);

    // Display validation results
    displayValidation(result.validation);

    // Display fixes if applied
    if (result.fixes && result.fixes.some(f => f.fixed)) {
      console.log(chalk.cyan('\n Applied Fixes:\n'));
      for (const fix of result.fixes.filter(f => f.fixed)) {
        console.log(chalk.green(`  ✓ ${fix.file.path}`));
        fix.changes.forEach(change => {
          console.log(chalk.gray(`    - ${change}`));
        });
      }
    }

    // Confirm before writing
    if (!options.dryRun) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Write files to disk?',
          default: true,
        },
      ]);

      if (!proceed) {
        console.log(chalk.yellow('\nGeneration cancelled.\n'));
        return;
      }

      // Write files
      spinner.start('Writing files...');
      await writeFiles(result.files, cwd);
      spinner.succeed('Files written successfully');

      // Display summary
      displaySummary(result.files, result.plan);
    } else {
      console.log(chalk.yellow('\n[Dry Run] Files would be written:'));
      for (const file of result.files) {
        console.log(`  ${chalk.green('+')} ${file.path} (${file.content.length} chars)`);
      }
      console.log();
    }
  } catch (error) {
    spinner.fail('Generation failed');
    throw error;
  }
}

/**
 * Display implementation plan
 */
function displayPlan(intent: ParsedIntent, plan: ImplementationPlan): void {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│ Implementation Plan                             │'));
  console.log(chalk.cyan('├─────────────────────────────────────────────────┤'));

  for (const step of plan.steps.slice(0, 8)) {
    const desc = step.description.slice(0, 42).padEnd(42);
    console.log(chalk.cyan(`│ ${(step.order + '.').padEnd(3)} ${desc} │`));
  }

  if (plan.steps.length > 8) {
    console.log(chalk.cyan(`│     ... and ${plan.steps.length - 8} more steps                    │`));
  }

  console.log(chalk.cyan('├─────────────────────────────────────────────────┤'));
  console.log(
    chalk.cyan(
      `│ Files: ${String(plan.files.length).padEnd(3)} | Tests: ${String(plan.tests.length).padEnd(3)} | Complexity: ${plan.estimatedComplexity.padEnd(8)} │`
    )
  );
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));

  // Security notes
  if (plan.securityNotes.length > 0) {
    console.log(chalk.yellow('\nSecurity Notes:'));
    for (const note of plan.securityNotes.slice(0, 3)) {
      console.log(chalk.yellow(`  ⚠ ${note}`));
    }
  }

  // Dependencies
  if (plan.dependencies.length > 0) {
    console.log(chalk.gray('\nDependencies to install:'));
    const deps = plan.dependencies.filter(d => !d.dev).map(d => d.name);
    const devDeps = plan.dependencies.filter(d => d.dev).map(d => d.name);

    if (deps.length > 0) {
      console.log(chalk.gray(`  npm install ${deps.slice(0, 5).join(' ')}${deps.length > 5 ? ' ...' : ''}`));
    }
    if (devDeps.length > 0) {
      console.log(chalk.gray(`  npm install -D ${devDeps.slice(0, 5).join(' ')}${devDeps.length > 5 ? ' ...' : ''}`));
    }
  }
}

/**
 * Display validation results
 */
function displayValidation(validation: ValidationResult): void {
  console.log();

  if (validation.passed) {
    console.log(chalk.green.bold(`✓ Quality gates passed (${validation.score}/100)`));
  } else {
    console.log(chalk.yellow.bold(`⚠ Quality gates: ${validation.score}/100`));

    if (validation.errors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      for (const error of validation.errors.slice(0, 5)) {
        console.log(chalk.red(`  ✗ ${error.type}: ${error.message}`));
        if (error.file) {
          console.log(chalk.gray(`    ${error.file}`));
        }
      }
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      for (const warning of validation.warnings.slice(0, 5)) {
        console.log(chalk.yellow(`  ⚠ ${warning.type}: ${warning.message}`));
      }
    }
  }
}

/**
 * Display generation summary
 */
function displaySummary(files: GeneratedFile[], plan: ImplementationPlan): void {
  console.log();
  console.log(chalk.green.bold('✓ Code generated successfully!'));
  console.log();
  console.log(chalk.bold('Files created:'));

  for (const file of files.slice(0, 10)) {
    const lines = file.content.split('\n').length;
    console.log(`  ${chalk.green('+')} ${file.path} (${lines} lines)`);
  }

  if (files.length > 10) {
    console.log(chalk.gray(`  ... and ${files.length - 10} more files`));
  }

  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log('  1. Review generated code');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Run tests: npm test');
  console.log('  4. Start dev server: npm run dev');
  console.log();
}

/**
 * Write generated files to disk
 */
async function writeFiles(files: GeneratedFile[], basePath: string): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(basePath, file.path);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, file.content, 'utf-8');

    // Write tests if present
    if (file.tests) {
      const testPath = file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const testFullPath = path.join(basePath, testPath);
      fs.writeFileSync(testFullPath, file.tests, 'utf-8');
    }
  }
}

/**
 * Get file type from extension
 */
function getFileType(ext: string): string {
  const types: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript React',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript React',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.md': 'Markdown',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.html': 'HTML',
  };

  return types[ext] || 'Unknown';
}

/**
 * Basic file analysis
 */
function analyzeFile(content: string, ext: string): {
  imports: string[];
  exports: string[];
  functions: string[];
} {
  const imports: string[] = [];
  const exports: string[] = [];
  const functions: string[] = [];

  // Extract imports
  const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  if (importMatches) {
    imports.push(...importMatches.map(m => {
      const match = m.match(/from\s+['"]([^'"]+)['"]/);
      return match ? match[1] : m;
    }));
  }

  // Extract exports
  const exportMatches = content.match(/export\s+(default\s+)?(function|const|class|interface|type)\s+(\w+)/g);
  if (exportMatches) {
    exports.push(...exportMatches.map(m => {
      const match = m.match(/(function|const|class|interface|type)\s+(\w+)/);
      return match ? `${match[1]} ${match[2]}` : m;
    }));
  }

  // Extract functions/components
  const funcMatches = content.match(/(function|const)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|<|\()/g);
  if (funcMatches) {
    functions.push(...funcMatches.map(m => {
      const match = m.match(/(function|const)\s+(\w+)/);
      return match ? match[2] : m;
    }));
  }

  return { imports, exports, functions };
}
