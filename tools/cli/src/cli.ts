#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';
import { deployCommand } from './commands/deploy.js';

const program = new Command();

program
  .name('rana')
  .description('RANA - Rapid AI Native Architecture - Production-quality AI development framework')
  .version('2.0.0');

// ASCII Art Banner
const banner = `
${chalk.bold.cyan('╔═══════════════════════════════════════╗')}
${chalk.bold.cyan('║')}  ${chalk.bold.white('RANA - Rapid AI Native')}      ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}       ${chalk.bold.white('Production AI Development')}        ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════╝')}

${chalk.gray('9 LLM Providers • 70% Cost Reduction • 5min Setup')}
${chalk.gray('Made by')} ${chalk.bold('Waymaker')} ${chalk.gray('• https://rana.dev')}
`;

// Init command
program
  .command('init')
  .description('Initialize RANA in your project')
  .option('-t, --template <type>', 'Template to use (default, react, nextjs, vue)', 'default')
  .option('-f, --force', 'Overwrite existing .rana.yml')
  .action(initCommand);

// ============================================================================
// ONE-WORD SHORTCUTS (New!)
// ============================================================================

// Playground - Interactive demo
program
  .command('playground')
  .alias('play')
  .description('Interactive playground to try RANA features')
  .option('--demo', 'Run demo mode without API keys')
  .action(async (options) => {
    if (options.demo) {
      const { playgroundDemo } = await import('./commands/playground.js');
      await playgroundDemo();
    } else {
      const { playgroundCommand } = await import('./commands/playground.js');
      await playgroundCommand();
    }
  });

// Dashboard - Real-time cost monitoring
program
  .command('dashboard')
  .alias('dash')
  .description('Real-time cost dashboard')
  .option('-l, --live', 'Live updating mode')
  .action(async (options) => {
    const { dashboardCommand, dashboardLiveCommand } = await import('./commands/dashboard.js');
    if (options.live) {
      await dashboardLiveCommand();
    } else {
      await dashboardCommand();
    }
  });

// Analyze - Smart project analysis
program
  .command('analyze')
  .description('Analyze project and get recommendations')
  .option('-d, --detailed', 'Show detailed analysis')
  .action(async (options) => {
    const { analyzeCommand } = await import('./commands/analyze.js');
    await analyzeCommand(options);
  });

// Optimize - Apply optimizations automatically
program
  .command('optimize')
  .description('Apply cost optimizations automatically')
  .option('-a, --all', 'Apply all optimizations without prompting')
  .option('-d, --dry', 'Dry run - show what would be done')
  .action(async (options) => {
    const { optimizeCommand } = await import('./commands/optimize.js');
    await optimizeCommand(options);
  });

// Fix - Auto-fix all issues
program
  .command('fix')
  .description('Automatically fix all detected issues')
  .action(async () => {
    console.log(chalk.cyan('\n⚡ Auto-fixing issues...\n'));
    await checkCommand({ fix: true });
  });

// Test - Run AI-native tests
program
  .command('test [pattern]')
  .description('Run AI-native tests with semantic matching and cost tracking')
  .option('-c, --coverage', 'Show coverage report')
  .option('-w, --watch', 'Watch mode - rerun on changes')
  .option('-v, --verbose', 'Verbose output')
  .option('--update-baselines', 'Update regression baselines')
  .option('--update-snapshots', 'Update semantic snapshots')
  .option('--max-cost <amount>', 'Maximum cost budget for test run', parseFloat)
  .option('--parallel', 'Run tests in parallel')
  .action(async (pattern, options) => {
    const { testCommand, watchTests } = await import('./commands/test.js');
    if (options.watch) {
      await watchTests(pattern);
    } else {
      await testCommand(pattern, options);
    }
  });

// Test: Generate test file
program
  .command('test:generate <file>')
  .alias('test:gen')
  .description('Generate a test file for a source file')
  .option('-t, --type <type>', 'Test type (unit, integration, e2e)', 'unit')
  .action(async (file, options) => {
    const { generateTest } = await import('./commands/test.js');
    await generateTest(file, options);
  });

// Test: List baselines
program
  .command('test:baselines')
  .description('List all regression test baselines')
  .action(async () => {
    const { listBaselines } = await import('./commands/test.js');
    await listBaselines();
  });

// Migrate - Smart database migration (auto-detects)
program
  .command('migrate')
  .description('Run database migrations')
  .action(async () => {
    const { dbMigrate } = await import('./commands/db.js');
    await dbMigrate();
  });

// Audit - Security audit (auto-detects)
program
  .command('audit')
  .description('Run security audit')
  .option('-f, --fix', 'Auto-fix issues')
  .action(async (options) => {
    const { securityAudit } = await import('./commands/security.js');
    await securityAudit(options);
  });

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
  .option('--skip-build', 'Skip build phase')
  .option('--skip-security', 'Skip security audit')
  .option('--prod', 'Deploy to production')
  .option('-p, --platform <platform>', 'Deployment platform (vercel, railway, docker)')
  .action(deployCommand);

// Deploy Status
program
  .command('deploy:status')
  .description('Show deployment history and status')
  .action(async () => {
    const { deployStatus } = await import('./commands/deploy.js');
    await deployStatus();
  });

// Deploy Rollback
program
  .command('deploy:rollback')
  .description('Rollback to previous deployment')
  .action(async () => {
    const { deployRollback } = await import('./commands/deploy.js');
    await deployRollback();
  });

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

// Config: Set API Key
program
  .command('config:set')
  .description('Configure API key for a provider')
  .option('-p, --provider <provider>', 'Provider name (openai, anthropic, google, etc.)')
  .option('-k, --key <key>', 'API key value')
  .action(async (options) => {
    const { configSet } = await import('./commands/config.js');
    await configSet(options);
  });

// Config: List API Keys
program
  .command('config:list')
  .alias('config:keys')
  .description('List all configured API keys')
  .action(async () => {
    const { configList } = await import('./commands/config.js');
    await configList();
  });

// Config: Validate API Keys
program
  .command('config:validate')
  .description('Validate configured API keys')
  .option('-p, --provider <provider>', 'Provider to validate')
  .action(async (options) => {
    const { configValidate } = await import('./commands/config.js');
    await configValidate(options);
  });

// Config: Remove API Key
program
  .command('config:remove')
  .description('Remove an API key')
  .option('-p, --provider <provider>', 'Provider to remove')
  .action(async (options) => {
    const { configRemove } = await import('./commands/config.js');
    await configRemove(options);
  });

// Config: Export Keys to .env
program
  .command('config:export')
  .description('Export API keys to .env file')
  .option('-f, --file <file>', 'Output file (default: .env.rana)')
  .action(async (options) => {
    const { configExport } = await import('./commands/config.js');
    await configExport(options);
  });

// Config: Import Keys from .env
program
  .command('config:import')
  .description('Import API keys from .env file')
  .option('-f, --file <file>', 'Input file (default: .env)')
  .action(async (options) => {
    const { configImport } = await import('./commands/config.js');
    await configImport(options);
  });

// Status command
program
  .command('status')
  .description('Show RANA project status')
  .action(async () => {
    const { showStatus } = await import('./commands/status.js');
    await showStatus();
  });

// Database commands
program
  .command('db:setup')
  .description('Interactive database setup wizard')
  .action(async () => {
    const { dbSetup } = await import('./commands/db.js');
    await dbSetup();
  });

program
  .command('db:migrate')
  .description('Run database migrations')
  .action(async () => {
    const { dbMigrate } = await import('./commands/db.js');
    await dbMigrate();
  });

program
  .command('db:seed')
  .description('Seed database with data')
  .action(async () => {
    const { dbSeed } = await import('./commands/db.js');
    await dbSeed();
  });

program
  .command('db:reset')
  .description('Reset database (WARNING: deletes all data)')
  .action(async () => {
    const { dbReset } = await import('./commands/db.js');
    await dbReset();
  });

program
  .command('db:studio')
  .description('Open Prisma Studio')
  .action(async () => {
    const { dbStudio } = await import('./commands/db.js');
    await dbStudio();
  });

program
  .command('db:status')
  .description('Show database status')
  .action(async () => {
    const { dbStatus } = await import('./commands/db.js');
    await dbStatus();
  });

// Security commands
program
  .command('security:audit')
  .description('Run security audit on codebase')
  .option('--fix', 'Automatically fix issues where possible')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const { securityAudit } = await import('./commands/security.js');
    await securityAudit(options);
  });

program
  .command('security:setup')
  .description('Interactive security setup wizard')
  .action(async () => {
    const { securitySetup } = await import('./commands/security.js');
    await securitySetup();
  });

// LLM commands
program
  .command('llm:analyze')
  .description('Analyze LLM usage and costs')
  .option('--detailed', 'Show detailed analysis')
  .action(async (options) => {
    const { llmAnalyze } = await import('./commands/llm.js');
    await llmAnalyze(options);
  });

program
  .command('llm:optimize')
  .description('Apply LLM cost optimizations')
  .option('--all', 'Apply all optimizations without prompting')
  .action(async (options) => {
    const { llmOptimize } = await import('./commands/llm.js');
    await llmOptimize(options);
  });

program
  .command('llm:compare')
  .description('Compare LLM models and pricing')
  .action(async () => {
    const { llmCompare } = await import('./commands/llm.js');
    await llmCompare();
  });

program
  .command('llm:setup')
  .description('Setup LLM providers (OpenAI, Anthropic, Grok, etc.)')
  .action(async () => {
    const { llmSetup } = await import('./commands/llm.js');
    await llmSetup();
  });

// SEO commands
program
  .command('seo:check')
  .description('Validate SEO setup')
  .option('--fix', 'Automatically fix issues where possible')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const { seoCheck } = await import('./commands/seo.js');
    await seoCheck(options);
  });

program
  .command('seo:generate')
  .description('Generate sitemap, robots.txt, and other SEO files')
  .option('--all', 'Generate all SEO files')
  .action(async (options) => {
    const { seoGenerate } = await import('./commands/seo.js');
    await seoGenerate(options);
  });

program
  .command('seo:analyze')
  .description('Analyze pages for SEO')
  .action(async () => {
    const { seoAnalyze } = await import('./commands/seo.js');
    await seoAnalyze();
  });

program
  .command('seo:setup')
  .description('Interactive SEO setup wizard')
  .action(async () => {
    const { seoSetup } = await import('./commands/seo.js');
    await seoSetup();
  });

// Mobile commands
program
  .command('mobile:validate')
  .description('Validate mobile-first compliance')
  .option('--fix', 'Automatically fix issues where possible')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const { mobileValidate } = await import('./commands/mobile.js');
    await mobileValidate(options);
  });

program
  .command('mobile:test')
  .description('Test on different mobile viewports')
  .action(async () => {
    const { mobileTest } = await import('./commands/mobile.js');
    await mobileTest();
  });

program
  .command('mobile:setup')
  .description('Interactive mobile setup wizard')
  .action(async () => {
    const { mobileSetup } = await import('./commands/mobile.js');
    await mobileSetup();
  });

// ============================================================================
// PROCESS INTELLIGENCE COMMANDS (New!)
// Competes with HatchWorks GenIQ
// ============================================================================

// Velocity Analysis - Development velocity and DORA metrics
program
  .command('analyze:velocity')
  .alias('velocity')
  .description('Analyze development velocity and DORA metrics')
  .option('-p, --period <days>', 'Analysis period (e.g., 30d, 7d)', '30d')
  .option('-d, --detailed', 'Show detailed breakdown')
  .option('-e, --export <format>', 'Export report (json, csv)')
  .action(async (options) => {
    const { velocityAnalyze } = await import('./commands/velocity.js');
    await velocityAnalyze(options);
  });

// Legacy Analysis - Legacy code modernization analysis
program
  .command('analyze:legacy')
  .alias('legacy')
  .description('Analyze legacy code and generate modernization plan')
  .option('-p, --path <path>', 'Path to analyze', '.')
  .option('-d, --detailed', 'Show detailed issues')
  .option('-f, --fix', 'Auto-fix simple issues')
  .option('-e, --export <format>', 'Export report (json, md)')
  .action(async (options) => {
    const { legacyAnalyze } = await import('./commands/legacy.js');
    await legacyAnalyze(options);
  });

// Velocity Setup
program
  .command('velocity:setup')
  .description('Setup velocity tracking for your project')
  .action(async () => {
    const { velocitySetup } = await import('./commands/velocity.js');
    await velocitySetup();
  });

// ============================================================================
// COST & BENCHMARKING COMMANDS
// ============================================================================

// Cost Estimate
program
  .command('cost:estimate')
  .alias('cost')
  .description('Estimate LLM costs for your application')
  .option('-s, --scenario <type>', 'Usage scenario (light, medium, heavy, enterprise)')
  .option('-r, --requests <number>', 'Daily request count', parseInt)
  .option('-p, --provider <name>', 'Filter by provider')
  .action(async (options) => {
    const { costEstimate } = await import('./commands/cost.js');
    await costEstimate(options);
  });

// Cost Compare
program
  .command('cost:compare')
  .description('Compare LLM provider pricing')
  .action(async () => {
    const { costCompare } = await import('./commands/cost.js');
    await costCompare();
  });

// Cost Optimize
program
  .command('cost:optimize')
  .description('Get cost optimization suggestions based on usage')
  .option('-a, --apply', 'Apply optimization suggestions')
  .option('-d, --detailed', 'Show detailed analysis')
  .action(async (options) => {
    const { costOptimizeCommand } = await import('./commands/cost-optimize.js');
    await costOptimizeCommand(options);
  });

// Cost Tips
program
  .command('cost:tips')
  .description('Quick cost-saving tips')
  .action(async () => {
    const { costTipsCommand } = await import('./commands/cost-optimize.js');
    await costTipsCommand();
  });

// ============================================================================
// BUDGET ENFORCEMENT COMMANDS
// Hard limits on AI spending
// ============================================================================

// Budget Status
program
  .command('budget')
  .description('View current budget status and spending')
  .action(async () => {
    const { budgetCommand } = await import('./commands/budget.js');
    await budgetCommand();
  });

// Budget Set
program
  .command('budget:set')
  .description('Set spending budget with hard limits')
  .option('-l, --limit <amount>', 'Maximum budget amount ($)', parseFloat)
  .option('-p, --period <period>', 'Budget period (hourly, daily, weekly, monthly, total)')
  .option('-a, --action <action>', 'Action when exceeded (block, warn, log)')
  .option('-w, --warning <percent>', 'Warning threshold percentage', parseInt)
  .option('-b, --bypass', 'Allow critical requests to bypass budget')
  .option('-i, --interactive', 'Interactive setup mode')
  .action(async (options) => {
    const { setBudgetCommand } = await import('./commands/budget.js');
    await setBudgetCommand(options);
  });

// Budget Clear
program
  .command('budget:clear')
  .description('Remove budget enforcement')
  .action(async () => {
    const { clearBudgetCommand } = await import('./commands/budget.js');
    await clearBudgetCommand();
  });

// Budget Reset
program
  .command('budget:reset')
  .description('Reset current period spending to $0')
  .action(async () => {
    const { resetBudgetCommand } = await import('./commands/budget.js');
    await resetBudgetCommand();
  });

// Budget Preset
program
  .command('budget:preset <preset>')
  .description('Apply a budget preset (testing, development, staging, production)')
  .action(async (preset: string) => {
    const { budgetPresetCommand } = await import('./commands/budget.js');
    await budgetPresetCommand(preset);
  });

// ============================================================================
// COST ALERTS
// Notifications for budget thresholds via Slack, Discord, email, webhooks
// ============================================================================

// Alerts Setup
program
  .command('alerts')
  .alias('alerts:setup')
  .description('Setup cost alerts (Slack, Discord, email, webhooks)')
  .action(async () => {
    const { alertsSetupCommand } = await import('./commands/alerts.js');
    await alertsSetupCommand();
  });

// Alerts Add
program
  .command('alerts:add <type> <target>')
  .description('Add a new alert (slack, discord, email, webhook)')
  .action(async (type: string, target: string) => {
    const { alertsAddCommand } = await import('./commands/alerts.js');
    await alertsAddCommand(type, target);
  });

// Alerts List
program
  .command('alerts:list')
  .description('List all configured alerts')
  .action(async () => {
    const { alertsListCommand } = await import('./commands/alerts.js');
    await alertsListCommand();
  });

// Alerts Test
program
  .command('alerts:test [id]')
  .description('Test configured alerts')
  .action(async (id?: string) => {
    const { alertsTestCommand } = await import('./commands/alerts.js');
    await alertsTestCommand(id);
  });

// Alerts Remove
program
  .command('alerts:remove <id>')
  .description('Remove an alert')
  .action(async (id: string) => {
    const { alertsRemoveCommand } = await import('./commands/alerts.js');
    await alertsRemoveCommand(id);
  });

// Alerts Threshold
program
  .command('alerts:threshold')
  .description('Set alert thresholds')
  .option('-w, --warning <percent>', 'Warning threshold percentage', parseInt)
  .option('-c, --critical <percent>', 'Critical threshold percentage', parseInt)
  .option('--cooldown <minutes>', 'Minutes between alerts', parseInt)
  .action(async (options) => {
    const { alertsThresholdCommand } = await import('./commands/alerts.js');
    await alertsThresholdCommand(options);
  });

// Benchmark Run
program
  .command('benchmark:run')
  .alias('benchmark')
  .description('Benchmark LLM providers for your use case')
  .option('-p, --providers <list>', 'Providers to benchmark (comma-separated)')
  .option('-i, --iterations <number>', 'Number of iterations', parseInt)
  .action(async (options) => {
    const { benchmarkRun } = await import('./commands/benchmark.js');
    const providers = options.providers ? options.providers.split(',') : undefined;
    await benchmarkRun({ ...options, providers });
  });

// Benchmark Quick
program
  .command('benchmark:quick')
  .description('Quick latency check for all providers')
  .action(async () => {
    const { benchmarkQuick } = await import('./commands/benchmark.js');
    await benchmarkQuick();
  });

// ============================================================================
// LOCAL DEVELOPMENT (Ollama)
// ============================================================================

// Ollama Status
program
  .command('ollama')
  .description('Check Ollama status for local AI development')
  .action(async () => {
    const { ollamaCommand } = await import('./commands/ollama.js');
    await ollamaCommand();
  });

// Ollama Models
program
  .command('ollama:models')
  .description('List installed Ollama models')
  .action(async () => {
    const { ollamaModelsCommand } = await import('./commands/ollama.js');
    await ollamaModelsCommand();
  });

// Ollama Pull
program
  .command('ollama:pull <model>')
  .description('Pull/download an Ollama model')
  .action(async (model: string) => {
    const { ollamaPullCommand } = await import('./commands/ollama.js');
    await ollamaPullCommand(model);
  });

// Ollama Test
program
  .command('ollama:test [model]')
  .description('Test an Ollama model')
  .action(async (model?: string) => {
    const { ollamaTestCommand } = await import('./commands/ollama.js');
    await ollamaTestCommand(model);
  });

// ============================================================================
// DIAGNOSTIC COMMANDS
// ============================================================================

// Doctor - Diagnose project setup
program
  .command('doctor')
  .description('Diagnose project setup and fix common issues')
  .option('-f, --fix', 'Automatically fix detected issues')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (options) => {
    const { doctorCommand } = await import('./commands/doctor.js');
    await doctorCommand(options);
  });

// ============================================================================
// CODE GENERATION COMMANDS (New 2025!)
// Natural language to code generation
// ============================================================================

// Generate - Natural language code generation
program
  .command('generate [prompt]')
  .alias('gen')
  .description('Generate code from natural language description')
  .option('-o, --output <file>', 'Output file path')
  .option('-l, --language <lang>', 'Target language (typescript, javascript)')
  .option('-f, --framework <name>', 'Framework (react, vue, nextjs, express)')
  .option('-t, --test', 'Also generate tests')
  .option('-d, --dry-run', 'Preview without saving')
  .action(async (prompt: string | undefined, options) => {
    const { generateCommand } = await import('./commands/generate.js');
    await generateCommand(prompt || '', options);
  });

// Generate templates list
program
  .command('generate:templates')
  .alias('gen:list')
  .description('List available code generation templates')
  .action(async () => {
    const { generateTemplates } = await import('./commands/generate.js');
    await generateTemplates();
  });

// Generate interactive mode
program
  .command('generate:interactive')
  .alias('gen:i')
  .description('Interactive code generation wizard')
  .action(async () => {
    const { generateInteractive } = await import('./commands/generate.js');
    await generateInteractive();
  });

// ============================================================================
// PROMPT MANAGEMENT COMMANDS (New!)
// Enterprise prompt management via CLI
// ============================================================================

// Prompt Create
program
  .command('prompt:create')
  .description('Create a new prompt template')
  .option('-i, --id <id>', 'Prompt ID')
  .option('-t, --template <template>', 'Prompt template')
  .option('-f, --file <file>', 'Load template from file')
  .option('-m, --model <model>', 'Default model')
  .option('-p, --provider <provider>', 'Default provider')
  .action(async (options) => {
    const { promptCreate } = await import('./commands/prompt.js');
    await promptCreate(options);
  });

// Prompt List
program
  .command('prompt:list')
  .alias('prompts')
  .description('List all registered prompts')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    const { promptList } = await import('./commands/prompt.js');
    await promptList(options);
  });

// Prompt Test
program
  .command('prompt:test <id>')
  .description('Test a prompt with sample variables')
  .option('-v, --variables <vars>', 'Variables as key=value,key2=value2')
  .option('-d, --dry-run', 'Preview without executing')
  .action(async (id, options) => {
    const { promptTest } = await import('./commands/prompt.js');
    await promptTest(id, options);
  });

// Prompt Protect
program
  .command('prompt:protect')
  .description('Configure prompt protection (injection detection, PII masking)')
  .option('-e, --enable', 'Enable protection')
  .option('-d, --disable', 'Disable protection')
  .option('-s, --status', 'Show current status')
  .action(async (options) => {
    const { promptProtect } = await import('./commands/prompt.js');
    await promptProtect(options);
  });

// Prompt Delete
program
  .command('prompt:delete <id>')
  .description('Delete a prompt')
  .action(async (id) => {
    const { promptDelete } = await import('./commands/prompt.js');
    await promptDelete(id);
  });

// Prompt Export
program
  .command('prompt:export')
  .description('Export all prompts to a file')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    const { promptExport } = await import('./commands/prompt.js');
    await promptExport(options);
  });

// Prompt Import
program
  .command('prompt:import <file>')
  .description('Import prompts from a file')
  .action(async (file) => {
    const { promptImport } = await import('./commands/prompt.js');
    await promptImport(file);
  });

// Prompt Templates
program
  .command('prompt:templates')
  .description('Show built-in prompt templates')
  .action(async () => {
    const { promptTemplates } = await import('./commands/prompt.js');
    await promptTemplates();
  });

// ============================================================================
// WIZARD COMMANDS
// Step-by-step guided setup for beginners
// ============================================================================

// Full Wizard
program
  .command('wizard')
  .description('Step-by-step guided setup (10 minutes)')
  .action(async () => {
    const { wizardCommand } = await import('./commands/wizard.js');
    await wizardCommand();
  });

// Quick Wizard
program
  .command('wizard:quick')
  .alias('quick-start')
  .description('Quick setup with recommended defaults')
  .action(async () => {
    const { wizardQuickCommand } = await import('./commands/wizard.js');
    await wizardQuickCommand();
  });

// ============================================================================
// HEALTH & MONITORING COMMANDS
// Uptime checks, health endpoints, monitoring integration
// ============================================================================

// Health Check
program
  .command('health:check')
  .description('Check health of all endpoints')
  .option('-u, --url <url>', 'Base URL to check')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    const { healthCheck } = await import('./commands/health.js');
    await healthCheck(options);
  });

// Health Setup
program
  .command('health:setup')
  .description('Add health endpoint to your app')
  .action(async () => {
    const { healthSetup } = await import('./commands/health.js');
    await healthSetup();
  });

// Monitor Setup
program
  .command('monitor:setup')
  .description('Setup external monitoring (BetterStack, UptimeRobot)')
  .action(async () => {
    const { monitorSetup } = await import('./commands/health.js');
    await monitorSetup();
  });

// Monitor Status
program
  .command('monitor:status')
  .description('Check monitoring status')
  .action(async () => {
    const { monitorStatus } = await import('./commands/health.js');
    await monitorStatus();
  });

// ============================================================================
// DOCUMENTATION MANAGEMENT
// AI collaboration and document health tools
// ============================================================================

// Docs Check - Document health
program
  .command('docs:check')
  .description('Check document health and frontmatter')
  .action(async () => {
    const { docsCheckCommand } = await import('./commands/docs.js');
    await docsCheckCommand();
  });

// Docs List - List all documents
program
  .command('docs:list')
  .alias('docs')
  .description('List all project documents with status')
  .option('-a, --all', 'Include deprecated documents')
  .action(async (options) => {
    const { docsListCommand } = await import('./commands/docs.js');
    await docsListCommand(options);
  });

// Docs Status - Project status summary
program
  .command('docs:status')
  .description('Show project status summary')
  .action(async () => {
    const { docsStatusCommand } = await import('./commands/docs.js');
    await docsStatusCommand();
  });

// Docs Archive - Archive deprecated docs
program
  .command('docs:archive')
  .description('Archive deprecated documents')
  .option('-d, --dry-run', 'Preview without making changes')
  .action(async (options) => {
    const { docsArchiveCommand } = await import('./commands/docs.js');
    await docsArchiveCommand(options);
  });

// Docs Validate - Validate frontmatter
program
  .command('docs:validate')
  .description('Validate document frontmatter')
  .action(async () => {
    const { docsValidateCommand } = await import('./commands/docs.js');
    await docsValidateCommand();
  });

// ============================================================================
// LEARNING & SCAFFOLDING
// Rails-like developer experience
// ============================================================================

// Learn - Interactive tutorials
program
  .command('learn [topic]')
  .description('Interactive tutorials for learning RANA')
  .action(async (topic) => {
    const { learnCommand } = await import('./commands/learn.js');
    await learnCommand(topic);
  });

// Learn: List all lessons
program
  .command('learn:list')
  .description('List all available lessons')
  .action(async () => {
    const { listLessons } = await import('./commands/learn.js');
    listLessons();
  });

// New - Scaffolding generator (Rails-like)
program
  .command('new <type> [name]')
  .description('Generate new components (chatbot, rag, agent, api)')
  .option('-p, --provider <provider>', 'LLM provider to use', 'openai')
  .option('-m, --model <model>', 'Model to use')
  .option('-d, --dir <directory>', 'Output directory')
  .action(async (type, name, options) => {
    const { newCommand } = await import('./commands/new.js');
    await newCommand(type, name, options);
  });

// ============================================================================
// DOCKER COMMANDS
// Container build and deployment
// ============================================================================

// Docker Build
program
  .command('docker:build')
  .description('Build Docker image for your app')
  .option('-t, --tag <tag>', 'Image tag', 'latest')
  .option('-p, --push', 'Push to registry after build')
  .action(async (options) => {
    const { dockerBuild } = await import('./commands/docker.js');
    await dockerBuild(options);
  });

// Docker Push
program
  .command('docker:push')
  .description('Push Docker image to registry')
  .option('-t, --tag <tag>', 'Image tag', 'latest')
  .option('-r, --registry <registry>', 'Docker registry')
  .action(async (options) => {
    const { dockerPush } = await import('./commands/docker.js');
    await dockerPush(options);
  });

// Docker Run
program
  .command('docker:run')
  .description('Run app in Docker locally')
  .option('-p, --port <port>', 'Port to expose', '3000')
  .action(async (options) => {
    const { dockerRun } = await import('./commands/docker.js');
    await dockerRun(options);
  });

// ============================================================================
// SHELL COMPLETION
// Auto-completion for bash, zsh, and fish
// ============================================================================

// Completion - Show setup instructions
program
  .command('completion')
  .description('Setup shell auto-completion (bash, zsh, fish)')
  .action(async () => {
    const { completionCommand } = await import('./commands/completion.js');
    await completionCommand();
  });

// Completion: Bash
program
  .command('completion:bash')
  .description('Generate bash completion script')
  .action(async () => {
    const { completionBashCommand } = await import('./commands/completion.js');
    await completionBashCommand();
  });

// Completion: Zsh
program
  .command('completion:zsh')
  .description('Generate zsh completion script')
  .action(async () => {
    const { completionZshCommand } = await import('./commands/completion.js');
    await completionZshCommand();
  });

// Completion: Fish
program
  .command('completion:fish')
  .description('Generate fish completion script')
  .action(async () => {
    const { completionFishCommand } = await import('./commands/completion.js');
    await completionFishCommand();
  });

// Completion: Install
program
  .command('completion:install')
  .description('Auto-install completion for your shell')
  .action(async () => {
    const { completionInstallCommand } = await import('./commands/completion.js');
    await completionInstallCommand();
  });

// Show banner before help
program.on('--help', () => {
  console.log(banner);
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  $ rana init                  # Initialize RANA in current project'));
  console.log(chalk.gray('  $ rana check                 # Check compliance'));
  console.log(chalk.gray('  $ rana llm:compare           # Compare 9 LLM providers'));
  console.log(chalk.gray('  $ rana analyze:velocity      # View development velocity metrics'));
  console.log(chalk.gray('  $ rana analyze:legacy        # Analyze legacy code for modernization'));
  console.log(chalk.gray('  $ rana deploy --verify       # Deploy with verification'));
  console.log(chalk.gray('\nDocumentation: https://rana.dev'));
  console.log(chalk.gray('GitHub: https://github.com/waymaker/rana\n'));
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.outputHelp();
}
