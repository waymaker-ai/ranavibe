/**
 * Status Command
 * Show CoFounder project status
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

interface StatusInfo {
  hasConfig: boolean;
  hasPackageJson: boolean;
  hasGit: boolean;
  gitBranch?: string;
  gitStatus?: string;
  nodeVersion?: string;
  dependencies: {
    installed: boolean;
    count: number;
  };
  frameworks: string[];
}

export async function showStatus() {
  console.log(chalk.bold.cyan('\n📊 CoFounder Project Status\n'));

  const status = await collectStatus();

  // CoFounder Configuration
  console.log(chalk.bold('🔧 Configuration'));
  console.log(chalk.gray('─'.repeat(50)));

  if (status.hasConfig) {
    console.log(chalk.green('  ✓ .cofounder.yml found'));

    // Load and show config summary
    try {
      const content = fs.readFileSync('.cofounder.yml', 'utf-8');
      const config = yaml.load(content) as Record<string, unknown>;
      const project = config.project as Record<string, unknown> | undefined;

      if (project) {
        console.log(chalk.white('    Project: ') + chalk.cyan(project.name || 'Unknown'));
        console.log(chalk.white('    Type:    ') + chalk.cyan(project.type || 'Unknown'));
      }
      console.log(chalk.white('    Version: ') + chalk.cyan(config.version || 'Unknown'));
    } catch {
      // Ignore parse errors
    }
  } else {
    console.log(chalk.yellow('  ⚠ No .cofounder.yml found'));
    console.log(chalk.gray('    Run `cofounder init` to create one'));
  }

  // Environment
  console.log(chalk.bold('\n🖥️ Environment'));
  console.log(chalk.gray('─'.repeat(50)));

  if (status.nodeVersion) {
    console.log(chalk.white('  Node.js:  ') + chalk.cyan(status.nodeVersion));
  }

  console.log(chalk.white('  Platform: ') + chalk.cyan(process.platform));
  console.log(chalk.white('  CWD:      ') + chalk.cyan(process.cwd()));

  // Git Status
  console.log(chalk.bold('\n📦 Version Control'));
  console.log(chalk.gray('─'.repeat(50)));

  if (status.hasGit) {
    console.log(chalk.green('  ✓ Git repository'));
    if (status.gitBranch) {
      console.log(chalk.white('    Branch: ') + chalk.cyan(status.gitBranch));
    }
    if (status.gitStatus) {
      console.log(chalk.white('    Status: ') + chalk.cyan(status.gitStatus));
    }
  } else {
    console.log(chalk.yellow('  ⚠ Not a git repository'));
  }

  // Dependencies
  console.log(chalk.bold('\n📚 Dependencies'));
  console.log(chalk.gray('─'.repeat(50)));

  if (status.hasPackageJson) {
    console.log(chalk.green('  ✓ package.json found'));

    if (status.dependencies.installed) {
      console.log(chalk.green(`  ✓ ${status.dependencies.count} packages installed`));
    } else {
      console.log(chalk.yellow('  ⚠ node_modules not found'));
      console.log(chalk.gray('    Run `npm install` to install dependencies'));
    }
  } else {
    console.log(chalk.yellow('  ⚠ No package.json found'));
  }

  // Detected Frameworks
  if (status.frameworks.length > 0) {
    console.log(chalk.bold('\n🛠️ Detected Stack'));
    console.log(chalk.gray('─'.repeat(50)));
    status.frameworks.forEach(fw => {
      console.log(chalk.cyan(`  • ${fw}`));
    });
  }

  // Quick Actions
  console.log(chalk.bold('\n💡 Quick Actions'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('  cofounder check         ') + chalk.white('Check compliance'));
  console.log(chalk.gray('  cofounder analyze       ') + chalk.white('Analyze project'));
  console.log(chalk.gray('  cofounder llm:analyze   ') + chalk.white('Check LLM costs'));
  console.log(chalk.gray('  cofounder security:audit') + chalk.white('Run security scan'));

  console.log();
}

async function collectStatus(): Promise<StatusInfo> {
  const status: StatusInfo = {
    hasConfig: fs.existsSync('.cofounder.yml'),
    hasPackageJson: fs.existsSync('package.json'),
    hasGit: fs.existsSync('.git'),
    dependencies: {
      installed: fs.existsSync('node_modules'),
      count: 0
    },
    frameworks: []
  };

  // Get Node version
  try {
    status.nodeVersion = process.version;
  } catch {
    // Ignore
  }

  // Get Git info
  if (status.hasGit) {
    try {
      status.gitBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
      status.gitStatus = gitStatus ? `${gitStatus.split('\n').length} changes` : 'Clean';
    } catch {
      // Ignore
    }
  }

  // Count dependencies
  if (status.hasPackageJson) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      status.dependencies.count = deps + devDeps;

      // Detect frameworks
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps.next) status.frameworks.push(`Next.js ${allDeps.next}`);
      else if (allDeps.react) status.frameworks.push(`React ${allDeps.react}`);

      if (allDeps.typescript) status.frameworks.push(`TypeScript ${allDeps.typescript}`);
      if (allDeps['@supabase/supabase-js']) status.frameworks.push('Supabase');
      if (allDeps.prisma) status.frameworks.push('Prisma');
      if (allDeps.tailwindcss) status.frameworks.push('Tailwind CSS');
      if (allDeps.openai) status.frameworks.push('OpenAI SDK');
      if (allDeps['@anthropic-ai/sdk']) status.frameworks.push('Anthropic SDK');

    } catch {
      // Ignore
    }
  }

  return status;
}
