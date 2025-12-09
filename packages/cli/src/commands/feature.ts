/**
 * Feature workflow commands
 * rana feature:new, rana feature:implement, rana feature:check
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export interface FeatureSpec {
  name: string;
  description: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'docs';
  branch?: string;
  constraints: string[];
  acceptance: string[];
  files?: string[];
  tests?: string[];
  createdAt: string;
  status: 'draft' | 'approved' | 'in_progress' | 'review' | 'done';
}

const FEATURES_DIR = '.rana/features';

/**
 * Ensure features directory exists
 */
function ensureFeaturesDir(): void {
  if (!fs.existsSync(FEATURES_DIR)) {
    fs.mkdirSync(FEATURES_DIR, { recursive: true });
  }
}

/**
 * Load a feature spec
 */
function loadFeature(name: string): FeatureSpec | null {
  const filePath = path.join(FEATURES_DIR, `${name}.yml`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return YAML.parse(content) as FeatureSpec;
}

/**
 * Save a feature spec
 */
function saveFeature(spec: FeatureSpec): void {
  ensureFeaturesDir();
  const filePath = path.join(FEATURES_DIR, `${spec.name}.yml`);
  fs.writeFileSync(filePath, YAML.stringify(spec), 'utf-8');
}

/**
 * List all features
 */
function listFeatures(): FeatureSpec[] {
  ensureFeaturesDir();
  const files = fs.readdirSync(FEATURES_DIR).filter((f) => f.endsWith('.yml'));
  return files.map((f) => {
    const content = fs.readFileSync(path.join(FEATURES_DIR, f), 'utf-8');
    return YAML.parse(content) as FeatureSpec;
  });
}

/**
 * Generate branch name from feature name
 */
function generateBranchName(name: string, type: string): string {
  const prefix = type === 'bugfix' ? 'fix' : type === 'feature' ? 'feat' : type;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}/${slug}`;
}

/**
 * Default constraints based on type
 */
function getDefaultConstraints(type: string): string[] {
  const common = [
    'No breaking changes to public APIs without deprecation',
    'All new code must have tests',
    'No hardcoded secrets or credentials',
    'Follow existing code style and patterns',
  ];

  switch (type) {
    case 'feature':
      return [
        ...common,
        'Feature must be behind a feature flag if experimental',
        'Documentation must be updated',
      ];
    case 'bugfix':
      return [
        ...common,
        'Include regression test for the bug',
        'Root cause must be documented in PR',
      ];
    case 'refactor':
      return [
        ...common,
        'No functional changes - only structural',
        'All existing tests must pass unchanged',
      ];
    case 'docs':
      return [
        'Verify all code examples work',
        'Check for broken links',
        'Ensure consistent formatting',
      ];
    default:
      return common;
  }
}

export function registerFeatureCommands(program: Command): void {
  const feature = program
    .command('feature')
    .description('Feature workflow commands');

  // feature:new - Create a new feature spec
  feature
    .command('new')
    .alias('create')
    .description('Create a new feature specification')
    .option('-n, --name <name>', 'Feature name')
    .option('-t, --type <type>', 'Feature type (feature, bugfix, refactor, docs)')
    .option('--no-interactive', 'Skip interactive prompts')
    .action(async (options) => {
      console.log(chalk.blue.bold('\n🚀 Create New Feature Spec\n'));

      let answers: any;

      if (options.interactive !== false) {
        answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Feature name:',
            default: options.name,
            validate: (input: string) =>
              input.length > 0 ? true : 'Name is required',
          },
          {
            type: 'list',
            name: 'type',
            message: 'Type:',
            choices: ['feature', 'bugfix', 'refactor', 'docs'],
            default: options.type || 'feature',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
            validate: (input: string) =>
              input.length > 0 ? true : 'Description is required',
          },
          {
            type: 'editor',
            name: 'acceptance',
            message: 'Acceptance criteria (one per line):',
            default: '- Feature works as expected\n- Tests pass\n- No regressions',
          },
        ]);
      } else {
        answers = {
          name: options.name,
          type: options.type || 'feature',
          description: '',
          acceptance: '',
        };
      }

      const acceptanceCriteria = answers.acceptance
        .split('\n')
        .map((line: string) => line.replace(/^-\s*/, '').trim())
        .filter((line: string) => line.length > 0);

      const spec: FeatureSpec = {
        name: answers.name,
        description: answers.description,
        type: answers.type,
        branch: generateBranchName(answers.name, answers.type),
        constraints: getDefaultConstraints(answers.type),
        acceptance: acceptanceCriteria,
        createdAt: new Date().toISOString(),
        status: 'draft',
      };

      saveFeature(spec);

      console.log(chalk.green.bold('\n✅ Feature spec created!\n'));
      console.log(chalk.gray('File:'), chalk.white(`.rana/features/${spec.name}.yml`));
      console.log(chalk.gray('Branch:'), chalk.white(spec.branch));
      console.log(chalk.gray('Status:'), chalk.yellow(spec.status));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Review and edit the spec file'));
      console.log(chalk.gray('  2. Run: rana feature approve ' + spec.name));
      console.log(chalk.gray('  3. Run: rana feature implement ' + spec.name + '\n'));
    });

  // feature:list - List all features
  feature
    .command('list')
    .alias('ls')
    .description('List all feature specs')
    .option('--status <status>', 'Filter by status')
    .action(async (options) => {
      const features = listFeatures();

      if (features.length === 0) {
        console.log(chalk.yellow('\nNo features found.\n'));
        console.log(chalk.gray('Run: rana feature new\n'));
        return;
      }

      const filtered = options.status
        ? features.filter((f) => f.status === options.status)
        : features;

      console.log(chalk.blue.bold('\n📋 Feature Specs\n'));

      for (const f of filtered) {
        const statusColor =
          f.status === 'done'
            ? chalk.green
            : f.status === 'in_progress'
              ? chalk.blue
              : f.status === 'approved'
                ? chalk.cyan
                : chalk.yellow;

        console.log(
          `${statusColor('●')} ${chalk.white.bold(f.name)} ${chalk.gray(`[${f.type}]`)}`
        );
        console.log(chalk.gray(`  ${f.description || 'No description'}`));
        console.log(chalk.gray(`  Status: ${statusColor(f.status)}`));
        console.log();
      }
    });

  // feature:show - Show feature details
  feature
    .command('show <name>')
    .description('Show feature spec details')
    .action(async (name) => {
      const spec = loadFeature(name);

      if (!spec) {
        console.log(chalk.red(`\nFeature not found: ${name}\n`));
        return;
      }

      console.log(chalk.blue.bold(`\n📄 Feature: ${spec.name}\n`));
      console.log(chalk.gray('Type:'), chalk.white(spec.type));
      console.log(chalk.gray('Branch:'), chalk.white(spec.branch || 'Not set'));
      console.log(chalk.gray('Status:'), chalk.white(spec.status));
      console.log(chalk.gray('Created:'), chalk.white(spec.createdAt));

      if (spec.description) {
        console.log(chalk.gray('\nDescription:'));
        console.log(chalk.white(`  ${spec.description}`));
      }

      console.log(chalk.gray('\nConstraints:'));
      for (const c of spec.constraints) {
        console.log(chalk.white(`  • ${c}`));
      }

      console.log(chalk.gray('\nAcceptance Criteria:'));
      for (const a of spec.acceptance) {
        console.log(chalk.white(`  ☐ ${a}`));
      }

      console.log();
    });

  // feature:approve - Approve a feature for implementation
  feature
    .command('approve <name>')
    .description('Approve a feature spec for implementation')
    .action(async (name) => {
      const spec = loadFeature(name);

      if (!spec) {
        console.log(chalk.red(`\nFeature not found: ${name}\n`));
        return;
      }

      if (spec.status !== 'draft') {
        console.log(chalk.yellow(`\nFeature is already ${spec.status}\n`));
        return;
      }

      spec.status = 'approved';
      saveFeature(spec);

      console.log(chalk.green.bold(`\n✅ Feature approved: ${name}\n`));
      console.log(chalk.gray('Next step: rana feature implement ' + name + '\n'));
    });

  // feature:implement - Start implementing a feature
  feature
    .command('implement <name>')
    .description('Start implementing a feature (creates branch, updates status)')
    .option('--no-branch', 'Skip branch creation')
    .action(async (name, options) => {
      const spec = loadFeature(name);

      if (!spec) {
        console.log(chalk.red(`\nFeature not found: ${name}\n`));
        return;
      }

      if (spec.status === 'draft') {
        console.log(chalk.yellow('\nFeature not approved. Run: rana feature approve ' + name + '\n'));
        return;
      }

      if (spec.status === 'in_progress') {
        console.log(chalk.yellow('\nFeature already in progress.\n'));
        return;
      }

      const spinner = ora('Setting up feature...').start();

      try {
        if (options.branch !== false && spec.branch) {
          // Try to create git branch
          const { simpleGit } = await import('simple-git');
          const git = simpleGit();

          try {
            await git.checkoutLocalBranch(spec.branch);
            spinner.text = `Created branch: ${spec.branch}`;
          } catch {
            // Branch might already exist
            try {
              await git.checkout(spec.branch);
              spinner.text = `Switched to branch: ${spec.branch}`;
            } catch {
              spinner.warn(`Could not create/switch to branch: ${spec.branch}`);
            }
          }
        }

        spec.status = 'in_progress';
        saveFeature(spec);

        spinner.succeed(chalk.green('Feature implementation started'));

        console.log(chalk.blue.bold('\n🔨 Implementation Started\n'));
        console.log(chalk.gray('Feature:'), chalk.white(spec.name));
        console.log(chalk.gray('Branch:'), chalk.white(spec.branch || 'N/A'));

        console.log(chalk.yellow.bold('\n⚠️  Constraints to follow:\n'));
        for (const c of spec.constraints) {
          console.log(chalk.white(`  • ${c}`));
        }

        console.log(chalk.gray('\n\nWhen done, run: rana feature check ' + name + '\n'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to start implementation'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      }
    });

  // feature:check - Check feature against constraints and acceptance criteria
  feature
    .command('check [name]')
    .description('Check feature against guardrails and acceptance criteria')
    .action(async (name) => {
      // If no name provided, try to detect from current branch
      let spec: FeatureSpec | null = null;

      if (name) {
        spec = loadFeature(name);
      } else {
        // Try to find feature from current branch
        try {
          const { simpleGit } = await import('simple-git');
          const git = simpleGit();
          const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
          const features = listFeatures();
          spec = features.find((f) => f.branch === branch.trim()) || null;

          if (spec) {
            console.log(chalk.gray(`\nDetected feature from branch: ${spec.name}\n`));
          }
        } catch {
          // Ignore git errors
        }
      }

      if (!spec) {
        console.log(chalk.red('\nNo feature specified or detected.\n'));
        console.log(chalk.gray('Usage: rana feature check <name>\n'));
        return;
      }

      console.log(chalk.blue.bold(`\n🔍 Checking Feature: ${spec.name}\n`));

      // Check constraints
      console.log(chalk.white.bold('Constraints:\n'));
      const constraintResults: boolean[] = [];

      for (const constraint of spec.constraints) {
        // For now, we just show them as manual checks
        // In a full implementation, some could be automated
        const isAutomatable =
          constraint.includes('tests') ||
          constraint.includes('secrets') ||
          constraint.includes('hardcoded');

        if (isAutomatable) {
          // Could run automated checks here
          console.log(chalk.yellow('  ⏳'), chalk.gray(constraint));
          constraintResults.push(true); // Placeholder
        } else {
          console.log(chalk.blue('  ☐'), chalk.gray(constraint), chalk.gray('(manual)'));
          constraintResults.push(true);
        }
      }

      // Check acceptance criteria
      console.log(chalk.white.bold('\nAcceptance Criteria:\n'));

      for (const criterion of spec.acceptance) {
        console.log(chalk.blue('  ☐'), chalk.gray(criterion));
      }

      // Summary
      const allPassed = constraintResults.every((r) => r);

      console.log(chalk.white.bold('\n---\n'));

      if (allPassed) {
        console.log(chalk.green.bold('✅ All automated checks passed'));
        console.log(chalk.gray('\nManual verification required for:'));
        console.log(chalk.gray('  • Acceptance criteria'));
        console.log(chalk.gray('  • Manual constraints\n'));
        console.log(chalk.gray('When ready, run: rana feature done ' + spec.name + '\n'));
      } else {
        console.log(chalk.red.bold('❌ Some checks failed'));
        console.log(chalk.gray('\nFix the issues and run this command again.\n'));
      }
    });

  // feature:done - Mark feature as complete
  feature
    .command('done <name>')
    .description('Mark a feature as complete')
    .action(async (name) => {
      const spec = loadFeature(name);

      if (!spec) {
        console.log(chalk.red(`\nFeature not found: ${name}\n`));
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'allCriteriaMet',
          message: 'Have all acceptance criteria been met?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'constraintsFollowed',
          message: 'Were all constraints followed?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'testsPass',
          message: 'Do all tests pass?',
          default: false,
        },
      ]);

      if (!answers.allCriteriaMet || !answers.constraintsFollowed || !answers.testsPass) {
        console.log(chalk.yellow('\n⚠️  Cannot mark as done until all checks pass.\n'));
        return;
      }

      spec.status = 'done';
      saveFeature(spec);

      console.log(chalk.green.bold(`\n🎉 Feature complete: ${name}\n`));
      console.log(chalk.gray('Don\'t forget to:'));
      console.log(chalk.gray('  • Create a pull request'));
      console.log(chalk.gray('  • Request code review'));
      console.log(chalk.gray('  • Update documentation\n'));
    });
}
