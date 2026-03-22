/**
 * Doctor Command
 * Diagnose project setup and fix common issues
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fix?: () => Promise<void>;
}

interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
}

export async function doctorCommand(options: DoctorOptions = {}) {
  console.log(chalk.bold.cyan('\n🩺 CoFounder Doctor\n'));
  console.log(chalk.gray('Diagnosing your project setup...\n'));

  const checks: DiagnosticCheck[] = [];

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    checks.push({
      name: 'Node.js Version',
      status: 'pass',
      message: `Node.js ${nodeVersion} (>= 18 required)`,
    });
  } else {
    checks.push({
      name: 'Node.js Version',
      status: 'fail',
      message: `Node.js ${nodeVersion} is too old. Please upgrade to Node.js 18+`,
    });
  }

  // 2. Check for package.json
  const hasPackageJson = fs.existsSync('package.json');
  if (hasPackageJson) {
    checks.push({
      name: 'package.json',
      status: 'pass',
      message: 'package.json found',
    });
  } else {
    checks.push({
      name: 'package.json',
      status: 'fail',
      message: 'No package.json found. Run `npm init` to create one.',
    });
  }

  // 3. Check for .aicofounder.yml
  const hasCoFounderConfig = fs.existsSync('.aicofounder.yml');
  if (hasCoFounderConfig) {
    checks.push({
      name: 'CoFounder Configuration',
      status: 'pass',
      message: '.aicofounder.yml found',
    });
  } else {
    checks.push({
      name: 'CoFounder Configuration',
      status: 'warn',
      message: 'No .aicofounder.yml found. Run `aicofounder init` to create one.',
      fix: async () => {
        console.log(chalk.yellow('  → Run `aicofounder init` to create configuration'));
      },
    });
  }

  // 4. Check for node_modules
  const hasNodeModules = fs.existsSync('node_modules');
  if (hasNodeModules) {
    checks.push({
      name: 'Dependencies',
      status: 'pass',
      message: 'node_modules found',
    });
  } else if (hasPackageJson) {
    checks.push({
      name: 'Dependencies',
      status: 'warn',
      message: 'node_modules not found. Run `npm install`.',
      fix: async () => {
        console.log(chalk.yellow('  → Installing dependencies...'));
        try {
          execSync('npm install', { stdio: 'inherit' });
        } catch {
          console.log(chalk.red('  → Failed to install dependencies'));
        }
      },
    });
  }

  // 5. Check for Git
  const hasGit = fs.existsSync('.git');
  if (hasGit) {
    checks.push({
      name: 'Git Repository',
      status: 'pass',
      message: 'Git repository initialized',
    });
  } else {
    checks.push({
      name: 'Git Repository',
      status: 'warn',
      message: 'Not a git repository. Run `git init`.',
      fix: async () => {
        console.log(chalk.yellow('  → Initializing git repository...'));
        try {
          execSync('git init', { stdio: 'inherit' });
        } catch {
          console.log(chalk.red('  → Failed to initialize git'));
        }
      },
    });
  }

  // 6. Check for TypeScript
  const hasTypeScript = fs.existsSync('tsconfig.json');
  if (hasTypeScript) {
    checks.push({
      name: 'TypeScript',
      status: 'pass',
      message: 'tsconfig.json found',
    });

    // Check for strict mode
    try {
      const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
      if (tsConfig.compilerOptions?.strict) {
        checks.push({
          name: 'TypeScript Strict Mode',
          status: 'pass',
          message: 'Strict mode enabled',
        });
      } else {
        checks.push({
          name: 'TypeScript Strict Mode',
          status: 'warn',
          message: 'Strict mode not enabled. Recommended for CoFounder projects.',
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  // 7. Check for .env file
  const hasEnv = fs.existsSync('.env');
  const hasEnvExample = fs.existsSync('.env.example');
  if (hasEnv) {
    checks.push({
      name: 'Environment Variables',
      status: 'pass',
      message: '.env file found',
    });

    // Check for common API keys
    try {
      const envContent = fs.readFileSync('.env', 'utf-8');
      const hasOpenAI = envContent.includes('OPENAI_API_KEY');
      const hasAnthropic = envContent.includes('ANTHROPIC_API_KEY');

      if (hasOpenAI || hasAnthropic) {
        checks.push({
          name: 'LLM API Keys',
          status: 'pass',
          message: `API keys configured (${[hasOpenAI && 'OpenAI', hasAnthropic && 'Anthropic'].filter(Boolean).join(', ')})`,
        });
      } else {
        checks.push({
          name: 'LLM API Keys',
          status: 'warn',
          message: 'No LLM API keys found in .env',
        });
      }
    } catch {
      // Ignore read errors
    }
  } else if (hasEnvExample) {
    checks.push({
      name: 'Environment Variables',
      status: 'warn',
      message: '.env not found but .env.example exists. Copy and configure it.',
      fix: async () => {
        console.log(chalk.yellow('  → Copying .env.example to .env...'));
        try {
          fs.copyFileSync('.env.example', '.env');
          console.log(chalk.green('  → Created .env file. Please configure your API keys.'));
        } catch {
          console.log(chalk.red('  → Failed to copy .env.example'));
        }
      },
    });
  }

  // 8. Check for ESLint
  const hasEslint = fs.existsSync('.eslintrc.js') ||
    fs.existsSync('.eslintrc.json') ||
    fs.existsSync('.eslintrc.yml') ||
    fs.existsSync('eslint.config.js');

  if (hasEslint) {
    checks.push({
      name: 'ESLint',
      status: 'pass',
      message: 'ESLint configuration found',
    });
  } else {
    checks.push({
      name: 'ESLint',
      status: 'warn',
      message: 'No ESLint configuration found. Recommended for code quality.',
    });
  }

  // 9. Check for Prettier
  const hasPrettier = fs.existsSync('.prettierrc') ||
    fs.existsSync('.prettierrc.json') ||
    fs.existsSync('prettier.config.js');

  if (hasPrettier) {
    checks.push({
      name: 'Prettier',
      status: 'pass',
      message: 'Prettier configuration found',
    });
  } else {
    checks.push({
      name: 'Prettier',
      status: 'warn',
      message: 'No Prettier configuration found. Recommended for consistent formatting.',
    });
  }

  // 10. Check for security issues in dependencies
  if (hasNodeModules && hasPackageJson) {
    try {
      const auditResult = execSync('npm audit --json 2>/dev/null', { encoding: 'utf-8' });
      const audit = JSON.parse(auditResult);
      const vulns = audit.metadata?.vulnerabilities || {};
      const total = (vulns.high || 0) + (vulns.critical || 0);

      if (total === 0) {
        checks.push({
          name: 'Security Vulnerabilities',
          status: 'pass',
          message: 'No high/critical vulnerabilities found',
        });
      } else {
        checks.push({
          name: 'Security Vulnerabilities',
          status: 'fail',
          message: `${total} high/critical vulnerabilities found. Run \`npm audit fix\`.`,
          fix: async () => {
            console.log(chalk.yellow('  → Running npm audit fix...'));
            try {
              execSync('npm audit fix', { stdio: 'inherit' });
            } catch {
              console.log(chalk.red('  → Some vulnerabilities could not be fixed automatically'));
            }
          },
        });
      }
    } catch {
      // npm audit may fail, that's ok
      checks.push({
        name: 'Security Vulnerabilities',
        status: 'warn',
        message: 'Could not run security audit',
      });
    }
  }

  // Display results
  console.log(chalk.bold('📋 Diagnostic Results'));
  console.log(chalk.gray('─'.repeat(60)));

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  const fixableChecks: DiagnosticCheck[] = [];

  checks.forEach((check) => {
    let icon: string;
    let color: typeof chalk;

    switch (check.status) {
      case 'pass':
        icon = chalk.green('✓');
        color = chalk.green;
        passCount++;
        break;
      case 'warn':
        icon = chalk.yellow('⚠');
        color = chalk.yellow;
        warnCount++;
        if (check.fix) fixableChecks.push(check);
        break;
      case 'fail':
        icon = chalk.red('✗');
        color = chalk.red;
        failCount++;
        if (check.fix) fixableChecks.push(check);
        break;
    }

    console.log(`  ${icon} ${chalk.white(check.name.padEnd(25))} ${color(check.message)}`);
  });

  console.log(chalk.gray('─'.repeat(60)));

  // Summary
  console.log(chalk.bold('\n📊 Summary'));
  console.log(`  ${chalk.green(`${passCount} passed`)}  ${chalk.yellow(`${warnCount} warnings`)}  ${chalk.red(`${failCount} failed`)}`);

  // Health score
  const totalChecks = checks.length;
  const healthScore = Math.round(((passCount + warnCount * 0.5) / totalChecks) * 100);
  const healthColor = healthScore >= 80 ? chalk.green : healthScore >= 60 ? chalk.yellow : chalk.red;

  console.log(chalk.bold('\n🏥 Health Score: ') + healthColor(`${healthScore}%`));

  // Fix suggestions
  if (fixableChecks.length > 0 && options.fix) {
    console.log(chalk.bold('\n🔧 Applying fixes...\n'));
    for (const check of fixableChecks) {
      if (check.fix) {
        console.log(chalk.cyan(`  Fixing: ${check.name}`));
        await check.fix();
      }
    }
  } else if (fixableChecks.length > 0) {
    console.log(chalk.bold('\n💡 Auto-fixable Issues'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('  Run `aicofounder doctor --fix` to automatically fix:'));
    fixableChecks.forEach((check) => {
      console.log(chalk.yellow(`  • ${check.name}`));
    });
  }

  // Recommendations
  if (failCount > 0) {
    console.log(chalk.bold.red('\n⚠️ Critical Issues'));
    console.log(chalk.gray('─'.repeat(60)));
    checks
      .filter((c) => c.status === 'fail')
      .forEach((c) => {
        console.log(chalk.red(`  • ${c.name}: ${c.message}`));
      });
  }

  console.log(chalk.bold('\n📚 Next Steps'));
  console.log(chalk.gray('─'.repeat(60)));

  if (!hasCoFounderConfig) {
    console.log(chalk.cyan('  1. Run `aicofounder init` to create configuration'));
  }
  if (healthScore < 80) {
    console.log(chalk.cyan('  2. Fix warnings to improve project health'));
  }
  console.log(chalk.cyan('  3. Run `aicofounder check` to validate CoFounder compliance'));
  console.log(chalk.cyan('  4. Run `aicofounder llm:analyze` to analyze LLM usage'));

  console.log();
}
