/**
 * RANA Test Command
 *
 * Run AI-native tests with semantic matching, regression detection,
 * cost assertions, and statistical testing.
 *
 * @example
 * ```bash
 * # Run all tests
 * rana test
 *
 * # Run specific file
 * rana test src/chat.test.ts
 *
 * # Run with coverage
 * rana test --coverage
 *
 * # Update baselines
 * rana test --update-baselines
 *
 * # Watch mode
 * rana test --watch
 * ```
 */

import chalk from 'chalk';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

interface TestOptions {
  coverage?: boolean;
  watch?: boolean;
  updateBaselines?: boolean;
  updateSnapshots?: boolean;
  verbose?: boolean;
  parallel?: boolean;
  maxCost?: number;
  filter?: string;
}

/**
 * Run AI tests
 */
export async function testCommand(
  filePattern?: string,
  options: TestOptions = {}
): Promise<void> {
  console.log(chalk.bold.cyan('\n🧪 RANA AI Test Runner\n'));

  // Find test files
  const pattern = filePattern || '**/*.{test,spec}.{ts,tsx,js,jsx}';
  const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/.rana/**'];

  console.log(chalk.gray(`Looking for tests matching: ${pattern}`));

  const files = await glob(pattern, {
    ignore: ignorePatterns,
    cwd: process.cwd(),
  });

  if (files.length === 0) {
    console.log(chalk.yellow('\n⚠️  No test files found.'));
    console.log(chalk.gray('Create a file ending in .test.ts or .spec.ts'));
    console.log(chalk.gray('\nExample test file:\n'));
    console.log(
      chalk.white(`
import { describe, aiTest, runTimes } from '@rana/testing';

describe('My AI Feature', () => {
  aiTest('should work correctly', async ({ expect }) => {
    const result = await myAIFunction('input');

    // Semantic matching
    await expect(result).toSemanticMatch('expected meaning');

    // Cost assertion
    await expect(result).toCostLessThan(0.01);
  });
});
`)
    );
    return;
  }

  console.log(chalk.gray(`Found ${files.length} test file(s)\n`));

  // Cost budget check
  if (options.maxCost) {
    console.log(chalk.gray(`Cost budget: $${options.maxCost.toFixed(2)}\n`));
  }

  // Dynamic import of @rana/testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testing: any = null;

  try {
    testing = await (Function('return import("@rana/testing")')() as Promise<unknown>);
  } catch {
    // @rana/testing not installed, use built-in runner
    console.log(chalk.yellow('Note: @rana/testing not installed, using built-in runner'));
  }

  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalCost = 0;
  const failedTests: Array<{ name: string; error: string }> = [];

  // Process each test file
  for (const file of files) {
    const fullPath = path.resolve(process.cwd(), file);

    if (options.verbose) {
      console.log(chalk.gray(`\nRunning: ${file}`));
    }

    try {
      // For now, we'll use a simple approach - execute with tsx/ts-node
      // In production, this would properly integrate with the test runner

      if (testing) {
        // Reset runner state
        testing.reset();

        // Configure
        testing.configure({
          baselineDir: '.rana/baselines',
          snapshotDir: '.rana/snapshots',
          maxTotalCost: options.maxCost,
        });

        // Import and run the test file
        await import(fullPath);

        // Run tests
        const results = await testing.run();

        totalPassed += results.passed;
        totalFailed += results.failed;
        totalSkipped += results.skipped;
        totalCost += results.totalCost;

        // Collect failures
        for (const result of results.results) {
          if (result.status === 'failed' && result.error) {
            failedTests.push({
              name: result.name,
              error: result.error.message,
            });
          }
        }
      } else {
        // Fallback: Try to run with Node
        console.log(chalk.gray(`  ${file}`));

        // Check if file exists and is readable
        if (fs.existsSync(fullPath)) {
          try {
            // Try dynamic import (works for ESM)
            await import(fullPath);
            totalPassed++;
            console.log(chalk.green(`    ✓ Loaded successfully`));
          } catch (importError) {
            totalFailed++;
            const errorMsg = importError instanceof Error ? importError.message : String(importError);
            console.log(chalk.red(`    ✗ Failed to load: ${errorMsg}`));
            failedTests.push({ name: file, error: errorMsg });
          }
        }
      }
    } catch (error) {
      totalFailed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`  ✗ ${file}: ${errorMsg}`));
      failedTests.push({ name: file, error: errorMsg });
    }
  }

  const duration = Date.now() - startTime;

  // Print summary
  console.log('\n' + chalk.gray('─'.repeat(60)));

  if (totalFailed === 0) {
    console.log(
      chalk.green.bold(`\n✓ All tests passed!`) +
        chalk.gray(` (${totalPassed} tests in ${duration}ms)`)
    );
  } else {
    console.log(
      chalk.red.bold(`\n✗ ${totalFailed} test(s) failed`) +
        chalk.gray(` (${totalPassed} passed, ${totalSkipped} skipped)`)
    );

    // Show failed tests
    if (failedTests.length > 0) {
      console.log(chalk.red('\nFailed tests:'));
      for (const { name, error } of failedTests) {
        console.log(chalk.red(`  ✗ ${name}`));
        console.log(chalk.gray(`    ${error.split('\n')[0]}`));
      }
    }
  }

  // Cost summary
  if (totalCost > 0) {
    console.log(chalk.gray(`\nTotal cost: $${totalCost.toFixed(6)}`));

    if (options.maxCost && totalCost > options.maxCost) {
      console.log(
        chalk.yellow(
          `\n⚠️  Cost exceeded budget of $${options.maxCost.toFixed(2)}`
        )
      );
    }
  }

  // Tips
  if (totalFailed > 0) {
    console.log(chalk.gray('\nTips:'));
    console.log(chalk.gray('  • Run with --verbose for more details'));
    console.log(chalk.gray('  • Run with --update-baselines to update regression baselines'));
    console.log(chalk.gray('  • Run with --update-snapshots to update semantic snapshots'));
  }

  console.log('');

  // Exit with error code if tests failed
  if (totalFailed > 0) {
    process.exit(1);
  }
}

/**
 * Watch mode for tests
 */
export async function watchTests(pattern?: string): Promise<void> {
  const chokidar = await import('chokidar').catch(() => null);

  if (!chokidar) {
    console.log(chalk.yellow('Install chokidar for watch mode: npm i -D chokidar'));
    return;
  }

  console.log(chalk.cyan('👀 Watching for changes...\n'));

  const watcher = chokidar.watch(
    pattern || ['**/*.test.ts', '**/*.spec.ts', 'src/**/*.ts'],
    {
      ignored: ['node_modules', 'dist', '.rana'],
      persistent: true,
    }
  );

  let isRunning = false;

  const runTests = async () => {
    if (isRunning) return;
    isRunning = true;

    console.clear();
    await testCommand(pattern, { verbose: false });

    console.log(chalk.gray('\nWatching for changes... (Ctrl+C to stop)'));
    isRunning = false;
  };

  watcher.on('change', runTests);
  watcher.on('add', runTests);

  // Initial run
  await runTests();
}

/**
 * Generate a test file
 */
export async function generateTest(
  targetFile: string,
  options: { type?: 'unit' | 'integration' | 'e2e' } = {}
): Promise<void> {
  const { type = 'unit' } = options;

  const testFile = targetFile.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1');

  if (fs.existsSync(testFile)) {
    console.log(chalk.yellow(`Test file already exists: ${testFile}`));
    return;
  }

  const template = `/**
 * Tests for ${path.basename(targetFile)}
 */

import { describe, aiTest, runTimes } from '@rana/testing';

describe('${path.basename(targetFile, path.extname(targetFile))}', () => {
  aiTest('should work correctly', async ({ expect }) => {
    // TODO: Import your function and test it
    // const result = await myFunction('input');

    // Semantic matching - test meaning, not exact strings
    // await expect(result).toSemanticMatch('expected behavior');

    // Cost assertion - ensure budget compliance
    // await expect(result).toCostLessThan(0.01);

    expect(true).toBe(true);
  });

  aiTest('should handle edge cases', async ({ expect }) => {
    // Test edge cases
    expect(true).toBeTruthy();
  });

  ${
    type === 'unit'
      ? `
  // Example: Statistical testing for non-deterministic outputs
  // aiTest('should be consistent', async ({ expect }) => {
  //   const results = await runTimes(10, () => myAIFunction('input'));
  //   await expect(results).toMostlyBe('expected', { threshold: 0.8 });
  // });
  `
      : ''
  }

  ${
    type === 'integration'
      ? `
  // Example: Integration test with real API
  // aiTest('should integrate with API', async ({ expect }) => {
  //   const result = await callAPI();
  //   await expect(result).toMatchSchema({ type: 'object', required: ['data'] });
  // });
  `
      : ''
  }
});
`;

  fs.writeFileSync(testFile, template);
  console.log(chalk.green(`✓ Created test file: ${testFile}`));
}

/**
 * Show test coverage report
 */
export async function showCoverage(): Promise<void> {
  const coverageDir = path.join(process.cwd(), '.rana', 'coverage');

  if (!fs.existsSync(coverageDir)) {
    console.log(chalk.yellow('No coverage data found. Run tests with --coverage first.'));
    return;
  }

  console.log(chalk.cyan('\n📊 Test Coverage Report\n'));
  // Would read and display coverage data
  console.log(chalk.gray('Coverage reporting coming soon...'));
}

/**
 * List all baselines
 */
export async function listBaselines(): Promise<void> {
  const baselineDir = path.join(process.cwd(), '.rana', 'baselines');

  if (!fs.existsSync(baselineDir)) {
    console.log(chalk.yellow('No baselines found.'));
    return;
  }

  const files = fs.readdirSync(baselineDir).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.log(chalk.yellow('No baselines found.'));
    return;
  }

  console.log(chalk.cyan('\n📋 Regression Baselines\n'));

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(baselineDir, file), 'utf-8')
    );
    console.log(
      chalk.white(`  ${content.id}`) +
        chalk.gray(` (v${content.version}, ${content.updatedAt})`)
    );
  }

  console.log(chalk.gray(`\n${files.length} baseline(s) total\n`));
}
