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

// Interactive Wizard command (comprehensive)
program
  .command('wizard')
  .alias('w')
  .description('Interactive code generation wizard')
  .action(async () => {
    await runFullWizard();
  });

// Database schema command
program
  .command('schema')
  .description('Generate database schema and models')
  .option('-i, --interactive', 'Use interactive mode')
  .argument('[description]', 'Schema description')
  .action(async (description, options) => {
    if (options.interactive || !description) {
      await runDatabaseWizard();
    } else {
      await generateDatabaseSchema(description);
    }
  });

// API command
program
  .command('api')
  .description('Generate REST or GraphQL API')
  .option('-i, --interactive', 'Use interactive mode')
  .argument('[description]', 'API description')
  .action(async (description, options) => {
    if (options.interactive || !description) {
      await runAPIWizard();
    } else {
      await generateAPI(description);
    }
  });

// Component command
program
  .command('component')
  .alias('c')
  .description('Generate React/Next.js components')
  .option('-i, --interactive', 'Use interactive mode')
  .argument('[name]', 'Component name')
  .action(async (name, options) => {
    if (options.interactive || !name) {
      await runComponentWizard();
    } else {
      await generateComponent(name);
    }
  });

// ============================================================================
// Interactive Wizards
// ============================================================================

/**
 * Full interactive wizard - guides through all generation options
 */
async function runFullWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   RANA Code Generator - Full Wizard                     │'));
  console.log(chalk.cyan('│   Build production-ready features step by step          │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────────────╯'));
  console.log();

  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What would you like to generate?',
      choices: [
        { name: '📦 Full Feature - Complete feature with UI, API, and database', value: 'feature' },
        { name: '🗄️ Database Schema - Models, migrations, and ORM setup', value: 'database' },
        { name: '🔌 REST API - CRUD endpoints with validation', value: 'api' },
        { name: '⚛️ React Component - UI component with props and tests', value: 'component' },
        { name: '📝 Form - Form with validation and submission', value: 'form' },
        { name: '🔐 Authentication - Auth flow with providers', value: 'auth' },
        { name: '📊 Dashboard - Admin dashboard with charts', value: 'dashboard' },
      ],
    },
  ]);

  switch (type) {
    case 'database':
      await runDatabaseWizard();
      break;
    case 'api':
      await runAPIWizard();
      break;
    case 'component':
      await runComponentWizard();
      break;
    case 'form':
      await runFormWizard();
      break;
    case 'auth':
      await runAuthWizard();
      break;
    case 'dashboard':
      await runDashboardWizard();
      break;
    case 'feature':
    default:
      await runFeatureWizard();
      break;
  }
}

/**
 * Database schema wizard
 */
async function runDatabaseWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Database Schema Generator                     │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'orm',
      message: 'Which ORM/database library?',
      choices: [
        { name: 'Prisma (recommended)', value: 'prisma' },
        { name: 'Drizzle ORM', value: 'drizzle' },
        { name: 'TypeORM', value: 'typeorm' },
        { name: 'Mongoose (MongoDB)', value: 'mongoose' },
        { name: 'Raw SQL', value: 'sql' },
      ],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database type?',
      choices: (a: { orm: string }) => {
        if (a.orm === 'mongoose') return [{ name: 'MongoDB', value: 'mongodb' }];
        return [
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'SQLite', value: 'sqlite' },
        ];
      },
    },
    {
      type: 'input',
      name: 'entities',
      message: 'What entities/models do you need? (comma-separated)',
      default: 'User, Post, Comment',
      validate: (input: string) => input.length > 0 || 'Enter at least one entity',
    },
    {
      type: 'confirm',
      name: 'timestamps',
      message: 'Include timestamps (createdAt, updatedAt)?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'softDelete',
      message: 'Include soft delete (deletedAt)?',
      default: false,
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Additional features?',
      choices: [
        { name: 'Relations between models', value: 'relations', checked: true },
        { name: 'Indexes for common queries', value: 'indexes', checked: true },
        { name: 'Seed data', value: 'seeds' },
        { name: 'Migration files', value: 'migrations', checked: true },
        { name: 'TypeScript types', value: 'types', checked: true },
      ],
    },
  ]);

  await generateDatabaseSchema(buildDatabaseDescription(answers));
}

/**
 * API generation wizard
 */
async function runAPIWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   API Generator                                 │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'style',
      message: 'API style?',
      choices: [
        { name: 'REST API', value: 'rest' },
        { name: 'GraphQL', value: 'graphql' },
        { name: 'tRPC', value: 'trpc' },
      ],
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Framework?',
      choices: (a: { style: string }) => {
        if (a.style === 'graphql') {
          return [
            { name: 'Apollo Server', value: 'apollo' },
            { name: 'Pothos (Next.js)', value: 'pothos' },
            { name: 'GraphQL Yoga', value: 'yoga' },
          ];
        }
        if (a.style === 'trpc') {
          return [
            { name: 'tRPC with Next.js', value: 'trpc-next' },
            { name: 'tRPC standalone', value: 'trpc-standalone' },
          ];
        }
        return [
          { name: 'Next.js API Routes', value: 'next' },
          { name: 'Express', value: 'express' },
          { name: 'Fastify', value: 'fastify' },
          { name: 'Hono', value: 'hono' },
        ];
      },
    },
    {
      type: 'input',
      name: 'resources',
      message: 'What resources/endpoints? (comma-separated)',
      default: 'users, posts, comments',
    },
    {
      type: 'checkbox',
      name: 'operations',
      message: 'Which operations?',
      choices: [
        { name: 'Create', value: 'create', checked: true },
        { name: 'Read (single)', value: 'read', checked: true },
        { name: 'Read (list)', value: 'list', checked: true },
        { name: 'Update', value: 'update', checked: true },
        { name: 'Delete', value: 'delete', checked: true },
        { name: 'Search', value: 'search' },
        { name: 'Bulk operations', value: 'bulk' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'API features?',
      choices: [
        { name: 'Input validation (Zod)', value: 'validation', checked: true },
        { name: 'Authentication required', value: 'auth', checked: true },
        { name: 'Rate limiting', value: 'ratelimit' },
        { name: 'Pagination', value: 'pagination', checked: true },
        { name: 'Sorting & filtering', value: 'filtering' },
        { name: 'OpenAPI/Swagger docs', value: 'openapi' },
        { name: 'Error handling', value: 'errors', checked: true },
      ],
    },
  ]);

  await generateAPI(buildAPIDescription(answers));
}

/**
 * Component generation wizard
 */
async function runComponentWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Component Generator                           │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Component name?',
      validate: (input: string) => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Use PascalCase (e.g., UserCard)',
    },
    {
      type: 'list',
      name: 'type',
      message: 'Component type?',
      choices: [
        { name: 'UI Component (presentational)', value: 'ui' },
        { name: 'Feature Component (with state)', value: 'feature' },
        { name: 'Page Component', value: 'page' },
        { name: 'Layout Component', value: 'layout' },
        { name: 'Form Component', value: 'form' },
      ],
    },
    {
      type: 'list',
      name: 'styling',
      message: 'Styling approach?',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwind' },
        { name: 'CSS Modules', value: 'cssmodules' },
        { name: 'styled-components', value: 'styled' },
        { name: 'Emotion', value: 'emotion' },
        { name: 'No styling', value: 'none' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Component features?',
      choices: [
        { name: 'TypeScript props interface', value: 'typescript', checked: true },
        { name: 'Unit tests', value: 'tests', checked: true },
        { name: 'Storybook story', value: 'storybook' },
        { name: 'Loading state', value: 'loading' },
        { name: 'Error state', value: 'error' },
        { name: 'Dark mode support', value: 'darkmode' },
        { name: 'Accessibility (a11y)', value: 'a11y', checked: true },
        { name: 'Animation (Framer Motion)', value: 'animation' },
      ],
    },
    {
      type: 'input',
      name: 'props',
      message: 'Main props? (comma-separated, e.g., "title: string, onClick: () => void")',
      default: '',
    },
  ]);

  await generateComponent(answers.name, answers);
}

/**
 * Form generation wizard
 */
async function runFormWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Form Generator                                │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Form name?',
      default: 'ContactForm',
    },
    {
      type: 'list',
      name: 'library',
      message: 'Form library?',
      choices: [
        { name: 'React Hook Form (recommended)', value: 'react-hook-form' },
        { name: 'Formik', value: 'formik' },
        { name: 'Native React state', value: 'native' },
      ],
    },
    {
      type: 'list',
      name: 'validation',
      message: 'Validation library?',
      choices: [
        { name: 'Zod', value: 'zod' },
        { name: 'Yup', value: 'yup' },
        { name: 'Built-in', value: 'builtin' },
      ],
    },
    {
      type: 'input',
      name: 'fields',
      message: 'Fields? (name:type, e.g., "email:email, password:password, name:text")',
      default: 'email:email, password:password',
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Form features?',
      choices: [
        { name: 'Server action submission', value: 'serveraction' },
        { name: 'API submission', value: 'api' },
        { name: 'Loading states', value: 'loading', checked: true },
        { name: 'Error display', value: 'errors', checked: true },
        { name: 'Success message', value: 'success', checked: true },
        { name: 'Field-level validation', value: 'fieldvalidation', checked: true },
        { name: 'Multi-step form', value: 'multistep' },
      ],
    },
  ]);

  const description = `Create a ${answers.name} form using ${answers.library} with ${answers.validation} validation. Fields: ${answers.fields}. Features: ${answers.features.join(', ')}`;
  await generateCode(description, { framework: 'next' });
}

/**
 * Auth generation wizard
 */
async function runAuthWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Authentication Generator                      │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Auth provider?',
      choices: [
        { name: 'NextAuth.js / Auth.js', value: 'nextauth' },
        { name: 'Clerk', value: 'clerk' },
        { name: 'Supabase Auth', value: 'supabase' },
        { name: 'Custom JWT', value: 'jwt' },
        { name: 'Firebase Auth', value: 'firebase' },
      ],
    },
    {
      type: 'checkbox',
      name: 'methods',
      message: 'Authentication methods?',
      choices: [
        { name: 'Email/Password', value: 'credentials', checked: true },
        { name: 'Google OAuth', value: 'google', checked: true },
        { name: 'GitHub OAuth', value: 'github' },
        { name: 'Magic Link (email)', value: 'magiclink' },
        { name: 'Phone/SMS', value: 'phone' },
        { name: 'Apple OAuth', value: 'apple' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Auth features?',
      choices: [
        { name: 'Login page', value: 'login', checked: true },
        { name: 'Register page', value: 'register', checked: true },
        { name: 'Forgot password', value: 'forgot', checked: true },
        { name: 'Email verification', value: 'verify' },
        { name: 'Protected routes middleware', value: 'middleware', checked: true },
        { name: 'User profile page', value: 'profile' },
        { name: 'Session management', value: 'session', checked: true },
        { name: 'Role-based access', value: 'roles' },
      ],
    },
  ]);

  const description = `Create authentication system using ${answers.provider} with ${answers.methods.join(', ')} login methods. Include: ${answers.features.join(', ')}`;
  await generateCode(description, { framework: 'next' });
}

/**
 * Dashboard generation wizard
 */
async function runDashboardWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Dashboard Generator                           │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Dashboard name?',
      default: 'AdminDashboard',
    },
    {
      type: 'checkbox',
      name: 'widgets',
      message: 'Dashboard widgets?',
      choices: [
        { name: 'Statistics cards', value: 'stats', checked: true },
        { name: 'Line chart', value: 'linechart', checked: true },
        { name: 'Bar chart', value: 'barchart' },
        { name: 'Pie chart', value: 'piechart' },
        { name: 'Data table', value: 'table', checked: true },
        { name: 'Activity feed', value: 'activity' },
        { name: 'User list', value: 'users' },
        { name: 'Calendar', value: 'calendar' },
      ],
    },
    {
      type: 'list',
      name: 'chartLib',
      message: 'Chart library?',
      choices: [
        { name: 'Recharts', value: 'recharts' },
        { name: 'Chart.js', value: 'chartjs' },
        { name: 'Tremor', value: 'tremor' },
        { name: 'Nivo', value: 'nivo' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Dashboard features?',
      choices: [
        { name: 'Sidebar navigation', value: 'sidebar', checked: true },
        { name: 'Dark mode toggle', value: 'darkmode', checked: true },
        { name: 'Real-time updates', value: 'realtime' },
        { name: 'Export to CSV/PDF', value: 'export' },
        { name: 'Date range filter', value: 'datefilter', checked: true },
        { name: 'Search', value: 'search' },
        { name: 'Responsive layout', value: 'responsive', checked: true },
      ],
    },
  ]);

  const description = `Create ${answers.name} dashboard with ${answers.widgets.join(', ')} widgets using ${answers.chartLib}. Features: ${answers.features.join(', ')}`;
  await generateCode(description, { framework: 'next' });
}

/**
 * Full feature wizard
 */
async function runFeatureWizard(): Promise<void> {
  console.log();
  console.log(chalk.cyan('╭─────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│   Full Feature Generator                        │'));
  console.log(chalk.cyan('╰─────────────────────────────────────────────────╯'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'feature',
      message: 'Describe the feature you want to build:',
      validate: (input: string) => input.length > 10 || 'Please provide more detail',
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Framework?',
      choices: [
        { name: 'Next.js (App Router)', value: 'next' },
        { name: 'React + Express', value: 'react-express' },
        { name: 'React + Fastify', value: 'react-fastify' },
      ],
    },
    {
      type: 'checkbox',
      name: 'layers',
      message: 'What layers to generate?',
      choices: [
        { name: 'Database schema & models', value: 'database', checked: true },
        { name: 'API routes/endpoints', value: 'api', checked: true },
        { name: 'UI components', value: 'ui', checked: true },
        { name: 'Pages/routes', value: 'pages', checked: true },
        { name: 'Unit tests', value: 'tests', checked: true },
        { name: 'E2E tests', value: 'e2e' },
      ],
    },
    {
      type: 'checkbox',
      name: 'security',
      message: 'Security requirements?',
      choices: [
        { name: 'Authentication required', value: 'auth', checked: true },
        { name: 'Authorization/roles', value: 'authz' },
        { name: 'Input validation', value: 'validation', checked: true },
        { name: 'Rate limiting', value: 'ratelimit' },
        { name: 'CSRF protection', value: 'csrf', checked: true },
      ],
    },
  ]);

  const description = `${answers.feature}. Framework: ${answers.framework}. Generate: ${answers.layers.join(', ')}. Security: ${answers.security.join(', ')}`;
  await generateCode(description, { framework: answers.framework.split('-')[0] });
}

// ============================================================================
// Generation Functions
// ============================================================================

async function generateDatabaseSchema(description: string): Promise<void> {
  const spinner = ora('Generating database schema...').start();
  try {
    const parser = new IntentParser({ defaultFramework: 'next' });
    const intent = await parser.parse(`Database schema: ${description}`);

    const planner = new ImplementationPlanner({ includeTests: true });
    const context = await new ContextAnalyzer().analyze(process.cwd());
    const plan = await planner.createPlan(intent, context);

    spinner.succeed('Parsed schema requirements');
    displayPlan(intent, plan);

    const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Generate schema?', default: true }]);
    if (!proceed) return;

    spinner.start('Generating schema files...');
    const generator = new CodeGenerator({ includeTests: true });
    const files = await generator.generate(plan, context);
    spinner.succeed(`Generated ${files.length} files`);

    await writeFiles(files, process.cwd());
    displaySummary(files, plan);
  } catch (error) {
    spinner.fail('Schema generation failed');
    console.error(chalk.red(error instanceof Error ? error.message : error));
  }
}

async function generateAPI(description: string): Promise<void> {
  const spinner = ora('Generating API...').start();
  try {
    const parser = new IntentParser({ defaultFramework: 'next' });
    const intent = await parser.parse(`REST API: ${description}`);

    const planner = new ImplementationPlanner({ includeTests: true });
    const context = await new ContextAnalyzer().analyze(process.cwd());
    const plan = await planner.createPlan(intent, context);

    spinner.succeed('Parsed API requirements');
    displayPlan(intent, plan);

    const { proceed } = await inquirer.prompt([{ type: 'confirm', name: 'proceed', message: 'Generate API?', default: true }]);
    if (!proceed) return;

    spinner.start('Generating API files...');
    const generator = new CodeGenerator({ includeTests: true, securityAudit: true });
    const files = await generator.generate(plan, context);
    spinner.succeed(`Generated ${files.length} files`);

    await writeFiles(files, process.cwd());
    displaySummary(files, plan);
  } catch (error) {
    spinner.fail('API generation failed');
    console.error(chalk.red(error instanceof Error ? error.message : error));
  }
}

async function generateComponent(name: string, options?: any): Promise<void> {
  const spinner = ora('Generating component...').start();
  try {
    const description = options
      ? `React component ${name}: ${options.type} component with ${options.styling} styling. Features: ${options.features?.join(', ') || 'basic'}. Props: ${options.props || 'none'}`
      : `React component ${name}`;

    const parser = new IntentParser({ defaultFramework: 'react' });
    const intent = await parser.parse(description);

    const planner = new ImplementationPlanner({ includeTests: true });
    const context = await new ContextAnalyzer().analyze(process.cwd());
    const plan = await planner.createPlan(intent, context);

    spinner.succeed('Parsed component requirements');

    const generator = new CodeGenerator({ includeTests: true });
    const files = await generator.generate(plan, context);
    spinner.succeed(`Generated ${files.length} files`);

    await writeFiles(files, process.cwd());
    displaySummary(files, plan);
  } catch (error) {
    spinner.fail('Component generation failed');
    console.error(chalk.red(error instanceof Error ? error.message : error));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildDatabaseDescription(answers: any): string {
  const entities = answers.entities.split(',').map((e: string) => e.trim());
  return `Database schema with ${answers.orm} for ${answers.database}. Models: ${entities.join(', ')}. ${answers.timestamps ? 'Include timestamps.' : ''} ${answers.softDelete ? 'Include soft delete.' : ''} Features: ${answers.features.join(', ')}.`;
}

function buildAPIDescription(answers: any): string {
  const resources = answers.resources.split(',').map((r: string) => r.trim());
  return `${answers.style} API using ${answers.framework} for resources: ${resources.join(', ')}. Operations: ${answers.operations.join(', ')}. Features: ${answers.features.join(', ')}.`;
}

// ============================================================================
// Original Interactive Wizard (for backward compatibility)
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
