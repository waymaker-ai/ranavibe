import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import yaml from 'js-yaml';

interface InitOptions {
  template?: string;
  force?: boolean;
}

interface ProjectConfig {
  name: string;
  type: 'frontend' | 'backend' | 'fullstack';
  languages: string[];
  frameworks: {
    frontend?: string;
    backend?: string;
    database?: string;
  };
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.bold.cyan('\n🚀 Initializing RANA in your project...\n'));

  // Check if .rana.yml already exists
  const configPath = path.join(process.cwd(), '.rana.yml');
  const exists = await fileExists(configPath);

  if (exists && !options.force) {
    console.log(chalk.yellow('⚠️  .rana.yml already exists!'));
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite it?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray('Aborted.'));
      return;
    }
  }

  // Gather project information
  const spinner = ora('Gathering project information...').start();

  const projectInfo = await gatherProjectInfo();
  spinner.succeed('Project information collected');

  // Generate configuration
  spinner.start('Generating .rana.yml configuration...');
  const config = generateConfig(projectInfo, options.template || 'default');
  spinner.succeed('.rana.yml configuration generated');

  // Write configuration file
  spinner.start('Writing .rana.yml...');
  await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }));
  spinner.succeed('.rana.yml created successfully');

  // Create docs directory
  spinner.start('Creating docs/rana/ directory...');
  const docsPath = path.join(process.cwd(), 'docs', 'rana');
  await fs.mkdir(docsPath, { recursive: true });
  spinner.succeed('docs/rana/ directory created');

  // Copy documentation templates
  spinner.start('Copying documentation templates...');
  await copyDocTemplates(docsPath);
  spinner.succeed('Documentation templates copied');

  // Success message
  console.log(chalk.bold.green('\n✅ RANA initialized successfully!\n'));
  console.log(chalk.gray('Files created:'));
  console.log(chalk.gray('  📄 .rana.yml'));
  console.log(chalk.gray('  📁 docs/rana/'));
  console.log(chalk.gray('  📝 docs/rana/AGENT_INSTRUCTIONS.md'));
  console.log(chalk.gray('  ✅ docs/rana/DEVELOPMENT_CHECKLIST.md\n'));

  console.log(chalk.bold.white('Next steps:'));
  console.log(chalk.gray('  1. Review and customize .rana.yml'));
  console.log(chalk.gray('  2. Update docs/rana/AGENT_INSTRUCTIONS.md with project-specific rules'));
  console.log(chalk.gray('  3. Run ') + chalk.cyan('rana check') + chalk.gray(' to verify setup'));
  console.log(chalk.gray('  4. Share .rana.yml with your AI assistant\n'));

  console.log(chalk.bold.cyan('💡 Pro Tip:'));
  console.log(chalk.gray('When working with AI assistants, say:'));
  console.log(chalk.italic.white('"Follow the RANA framework defined in .rana.yml"\n'));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function gatherProjectInfo(): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: path.basename(process.cwd()),
    },
    {
      type: 'list',
      name: 'type',
      message: 'Project type:',
      choices: [
        { name: 'Frontend only', value: 'frontend' },
        { name: 'Backend only', value: 'backend' },
        { name: 'Full-stack', value: 'fullstack' },
      ],
    },
    {
      type: 'checkbox',
      name: 'languages',
      message: 'Languages used:',
      choices: [
        { name: 'TypeScript', value: 'typescript', checked: true },
        { name: 'JavaScript', value: 'javascript' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'Rust', value: 'rust' },
      ],
    },
  ]);

  // Ask framework questions based on project type
  const frameworks: ProjectConfig['frameworks'] = {};

  if (answers.type === 'frontend' || answers.type === 'fullstack') {
    const { frontend } = await inquirer.prompt([
      {
        type: 'list',
        name: 'frontend',
        message: 'Frontend framework:',
        choices: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'other'],
      },
    ]);
    frameworks.frontend = frontend;
  }

  if (answers.type === 'backend' || answers.type === 'fullstack') {
    const { backend } = await inquirer.prompt([
      {
        type: 'list',
        name: 'backend',
        message: 'Backend framework:',
        choices: ['fastapi', 'express', 'nestjs', 'django', 'flask', 'other'],
      },
    ]);
    frameworks.backend = backend;
  }

  if (answers.type === 'fullstack') {
    const { database } = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Database:',
        choices: ['postgresql', 'mysql', 'mongodb', 'supabase', 'firebase', 'other'],
      },
    ]);
    frameworks.database = database;
  }

  return {
    name: answers.name,
    type: answers.type,
    languages: answers.languages,
    frameworks,
  };
}

function generateConfig(projectInfo: ProjectConfig, template: string): any {
  const baseConfig = {
    version: '1.0.0',
    project: {
      name: projectInfo.name,
      type: projectInfo.type,
      languages: projectInfo.languages,
    },
    standards: {
      principles: [
        'search_before_create',
        'real_data_only',
        'test_everything',
        'design_system_compliance',
        'deploy_to_production',
      ],
      patterns: {} as any,
      code_quality: {
        general: {
          no_console_log_in_production: true,
          comprehensive_error_handling: true,
          loading_states_required: true,
          empty_states_required: true,
        },
      },
    },
    quality_gates: {
      pre_implementation: [
        {
          name: 'Search for existing implementations',
          description: 'Use search to find existing code patterns',
          required: true,
        },
        {
          name: 'Review documentation',
          description: 'Check docs/ directory for feature guides',
          required: true,
        },
      ],
      implementation: [
        {
          name: 'Error handling implemented',
          description: 'Try-catch blocks, user-friendly error messages',
          required: true,
        },
        {
          name: 'Loading states implemented',
          description: 'Show loading indicators during async operations',
          required: true,
        },
      ],
      testing: [
        {
          name: 'Manual testing completed',
          description: 'Test all user flows manually',
          required: true,
        },
      ],
      deployment: [
        {
          name: 'Code committed to git',
          description: 'All changes committed with descriptive message',
          required: true,
        },
        {
          name: 'Production verification',
          description: 'Test feature in production environment',
          required: true,
        },
      ],
    },
    ai_assistant: {
      rules: [
        'ALWAYS search codebase before implementing new features',
        'NEVER create mock data in production code',
        'NEVER skip error handling',
        'ALWAYS add loading and empty states',
        'Features are NOT done until deployed to production',
      ],
    },
  };

  // Add framework-specific patterns
  if (projectInfo.frameworks.frontend) {
    baseConfig.standards.patterns.frontend_framework = projectInfo.frameworks.frontend;
  }
  if (projectInfo.frameworks.backend) {
    baseConfig.standards.patterns.backend_framework = projectInfo.frameworks.backend;
  }
  if (projectInfo.frameworks.database) {
    baseConfig.standards.patterns.database = projectInfo.frameworks.database;
  }

  // Add language-specific rules
  if (projectInfo.languages.includes('typescript')) {
    baseConfig.standards.code_quality['typescript'] = {
      strict_mode: true,
      no_any_types: true,
    };
  }

  if (projectInfo.languages.includes('python')) {
    baseConfig.standards.code_quality['python'] = {
      type_hints: true,
      pep8_compliance: true,
    };
  }

  return baseConfig;
}

async function copyDocTemplates(docsPath: string) {
  // Create basic documentation files
  const agentInstructions = `# Agent Instructions

**Read this document before making ANY changes to the codebase.**

## Core Principles

### 1. ALWAYS Check if Logic Already Exists

Before implementing ANY feature:
1. Search the codebase first
2. Check for existing services
3. Review existing components
4. Examine existing API endpoints

### 2. Be Extremely Careful - Don't Break Anything

- Read existing code before modifying
- Check dependencies
- Preserve existing functionality
- Test your changes

### 3. Follow the Design System - ALWAYS

Use design system components consistently throughout the application.

### 4. Real Data Only - No Mocks

Always connect to real APIs and databases. No mock data in production code.

### 5. Test Everything

Manual and automated testing required before deployment.

### 6. Deploy to Production

Features aren't done until deployed and verified in production.

---

*Customize this file with project-specific instructions.*
`;

  const developmentChecklist = `# Development Checklist

Use this checklist for every feature/bugfix.

## Pre-Implementation ✅
- [ ] Searched for existing implementations
- [ ] Reviewed relevant documentation
- [ ] Identified reusable patterns
- [ ] Planned approach

## Implementation ✅
- [ ] Code follows existing patterns
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] TypeScript types correct (no 'any')
- [ ] Design system components used
- [ ] Real data (no mocks)

## Testing ✅
- [ ] Tested manually
- [ ] Tested edge cases
- [ ] Tested error scenarios
- [ ] Responsive on mobile
- [ ] Works in dark mode

## Deployment ✅
- [ ] Code committed to git
- [ ] Deployed to staging/production
- [ ] Verified in production
- [ ] Rollback plan documented

---

*Customize this checklist for your project needs.*
`;

  await fs.writeFile(
    path.join(docsPath, 'AGENT_INSTRUCTIONS.md'),
    agentInstructions
  );

  await fs.writeFile(
    path.join(docsPath, 'DEVELOPMENT_CHECKLIST.md'),
    developmentChecklist
  );
}
