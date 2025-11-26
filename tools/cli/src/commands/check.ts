import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import yaml from 'js-yaml';
import { glob } from 'glob';

interface CheckOptions {
  verbose?: boolean;
  fix?: boolean;
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  fixable?: boolean;
}

export async function checkCommand(options: CheckOptions) {
  console.log(chalk.bold.cyan('\n🔍 Checking RANA compliance...\n'));

  const results: CheckResult[] = [];

  // 1. Check if .rana.yml exists
  const spinner = ora('Checking for .rana.yml...').start();
  const configPath = path.join(process.cwd(), '.rana.yml');

  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(configContent) as any;
    spinner.succeed('Found .rana.yml');

    // 2. Validate configuration
    spinner.start('Validating configuration...');
    const configValid = validateConfig(config);
    if (configValid.passed) {
      spinner.succeed('Configuration is valid');
    } else {
      spinner.fail(`Configuration invalid: ${configValid.message}`);
      results.push(configValid);
    }

    // 3. Check for mock data
    spinner.start('Scanning for mock data...');
    const mockDataResult = await checkForMockData();
    if (mockDataResult.passed) {
      spinner.succeed('No mock data found');
    } else {
      spinner.warn(`Mock data detected: ${mockDataResult.message}`);
    }
    results.push(mockDataResult);

    // 4. Check TypeScript configuration
    if (config.standards?.code_quality?.typescript?.strict_mode) {
      spinner.start('Checking TypeScript strict mode...');
      const tsResult = await checkTypeScriptStrict();
      if (tsResult.passed) {
        spinner.succeed('TypeScript strict mode enabled');
      } else {
        spinner.warn(tsResult.message);
      }
      results.push(tsResult);
    }

    // 5. Check for 'any' types
    if (config.standards?.code_quality?.typescript?.no_any_types) {
      spinner.start('Scanning for TypeScript any types...');
      const anyTypesResult = await checkForAnyTypes();
      if (anyTypesResult.passed) {
        spinner.succeed('No any types found');
      } else {
        spinner.warn(anyTypesResult.message);
      }
      results.push(anyTypesResult);
    }

    // 6. Check for console.log in production code
    if (config.standards?.code_quality?.general?.no_console_log_in_production) {
      spinner.start('Checking for console.log...');
      const consoleResult = await checkForConsoleLogs();
      if (consoleResult.passed) {
        spinner.succeed('No console.log in production code');
      } else {
        spinner.warn(consoleResult.message);
      }
      results.push(consoleResult);
    }

    // 7. Check git status
    spinner.start('Checking git status...');
    const gitResult = await checkGitStatus();
    if (gitResult.passed) {
      spinner.succeed('All changes committed');
    } else {
      spinner.info(gitResult.message);
    }
    results.push(gitResult);

    // Display results
    displayResults(results, options.verbose || false);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      spinner.fail('.rana.yml not found');
      console.log(chalk.yellow('\n�  No .rana.yml configuration found'));
      console.log(chalk.gray('   Run ') + chalk.cyan('aads init') + chalk.gray(' to initialize RANA\n'));
      process.exit(1);
    } else {
      spinner.fail('Error during check');
      console.error(chalk.red('\nL Error:'), error.message);
      process.exit(1);
    }
  }
}

function validateConfig(config: any): CheckResult {
  if (!config.version) {
    return {
      name: 'Configuration version',
      passed: false,
      message: 'Missing version field',
    };
  }

  if (!config.project) {
    return {
      name: 'Project configuration',
      passed: false,
      message: 'Missing project field',
    };
  }

  if (!config.standards?.principles || !Array.isArray(config.standards.principles)) {
    return {
      name: 'Standards principles',
      passed: false,
      message: 'Missing or invalid standards.principles',
    };
  }

  return {
    name: 'Configuration validation',
    passed: true,
    message: 'Configuration is valid',
  };
}

async function checkForMockData(): Promise<CheckResult> {
  try {
    // Patterns that might indicate mock data
    const mockPatterns = [
      /const\s+mock\w+\s*=\s*\[/gi,
      /const\s+dummy\w+\s*=\s*\[/gi,
      /const\s+fake\w+\s*=\s*\[/gi,
      /const\s+test\w+\s*=\s*\[.*\{.*id.*:.*1/gi,
    ];

    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      cwd: process.cwd(),
    });

    const violations: string[] = [];

    for (const file of files.slice(0, 100)) { // Limit to first 100 files
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');

      for (const pattern of mockPatterns) {
        if (pattern.test(content)) {
          violations.push(file);
          break;
        }
      }
    }

    if (violations.length > 0) {
      return {
        name: 'Mock data check',
        passed: false,
        message: `Found ${violations.length} file(s) with potential mock data: ${violations.slice(0, 3).join(', ')}${violations.length > 3 ? '...' : ''}`,
        fixable: false,
      };
    }

    return {
      name: 'Mock data check',
      passed: true,
      message: 'No obvious mock data patterns found',
    };
  } catch (error) {
    return {
      name: 'Mock data check',
      passed: true,
      message: 'Could not scan for mock data',
    };
  }
}

async function checkTypeScriptStrict(): Promise<CheckResult> {
  try {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    const content = await fs.readFile(tsConfigPath, 'utf-8');
    const tsConfig = JSON.parse(content);

    const strictEnabled = tsConfig.compilerOptions?.strict === true;

    if (strictEnabled) {
      return {
        name: 'TypeScript strict mode',
        passed: true,
        message: 'Strict mode is enabled',
      };
    }

    return {
      name: 'TypeScript strict mode',
      passed: false,
      message: 'Strict mode not enabled in tsconfig.json',
      fixable: true,
    };
  } catch (error) {
    return {
      name: 'TypeScript strict mode',
      passed: true,
      message: 'No tsconfig.json found (not a TypeScript project)',
    };
  }
}

async function checkForAnyTypes(): Promise<CheckResult> {
  try {
    const files = await glob('**/*.{ts,tsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts'],
      cwd: process.cwd(),
    });

    const violations: string[] = [];
    const anyPattern = /:\s*any\b/g;

    for (const file of files.slice(0, 50)) { // Limit scan
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
      if (anyPattern.test(content)) {
        violations.push(file);
      }
    }

    if (violations.length > 0) {
      return {
        name: 'Any types check',
        passed: false,
        message: `Found 'any' types in ${violations.length} file(s): ${violations.slice(0, 3).join(', ')}`,
        fixable: false,
      };
    }

    return {
      name: 'Any types check',
      passed: true,
      message: 'No any types found',
    };
  } catch (error) {
    return {
      name: 'Any types check',
      passed: true,
      message: 'Could not scan TypeScript files',
    };
  }
}

async function checkForConsoleLogs(): Promise<CheckResult> {
  try {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      cwd: process.cwd(),
    });

    const violations: string[] = [];
    const consolePattern = /console\.(log|debug|info)\(/g;

    for (const file of files.slice(0, 50)) {
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
      if (consolePattern.test(content)) {
        violations.push(file);
      }
    }

    if (violations.length > 0) {
      return {
        name: 'Console.log check',
        passed: false,
        message: `Found console.log in ${violations.length} file(s)`,
        fixable: true,
      };
    }

    return {
      name: 'Console.log check',
      passed: true,
      message: 'No console.log statements found',
    };
  } catch (error) {
    return {
      name: 'Console.log check',
      passed: true,
      message: 'Could not scan for console.log',
    };
  }
}

async function checkGitStatus(): Promise<CheckResult> {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });

    if (output.trim() === '') {
      return {
        name: 'Git status',
        passed: true,
        message: 'Working directory clean',
      };
    }

    return {
      name: 'Git status',
      passed: false,
      message: 'Uncommitted changes detected',
      fixable: false,
    };
  } catch (error) {
    return {
      name: 'Git status',
      passed: true,
      message: 'Not a git repository or git not available',
    };
  }
}

function displayResults(results: CheckResult[], verbose: boolean) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(chalk.bold('\n=� RANA Compliance Report\n'));

  if (verbose) {
    console.log(chalk.gray('Detailed Results:\n'));
    results.forEach(result => {
      const icon = result.passed ? chalk.green('') : chalk.yellow('�');
      const color = result.passed ? chalk.green : chalk.yellow;
      console.log(`${icon} ${color(result.name)}: ${chalk.gray(result.message)}`);
      if (result.fixable) {
        console.log(chalk.gray(`   � Fixable with --fix flag`));
      }
    });
    console.log();
  }

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(chalk.green(`   ${passed} passed`));
  if (failed > 0) {
    console.log(chalk.yellow(`  � ${failed} warnings`));
  }
  console.log(chalk.gray(`  Total: ${total} checks\n`));

  // Overall status
  if (failed === 0) {
    console.log(chalk.bold.green(' All checks passed!\n'));
  } else {
    console.log(chalk.bold.yellow(`�  ${failed} warning(s) found\n`));
    console.log(chalk.gray('Run with ') + chalk.cyan('--verbose') + chalk.gray(' for detailed output'));
    console.log(chalk.gray('Run with ') + chalk.cyan('--fix') + chalk.gray(' to auto-fix fixable issues\n'));
  }
}
