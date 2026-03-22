/**
 * RANA Security Scorecard CLI Command
 *
 * Runs comprehensive security tests and generates a security scorecard
 * showing the security posture of your RANA application.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRana } from '@ranavibe/core';
import {
  createSecurityTester,
  type SecurityTestReport,
  type SecurityTestResult,
} from '@ranavibe/core/security/security-tester';
import { listPresets } from '@ranavibe/core/security/presets';
import fs from 'fs/promises';
import path from 'path';

export const securityScoreCommand = new Command('security:score')
  .description('Run security tests and generate a security scorecard')
  .option('-c, --config <path>', 'Path to RANA config file', 'rana.config.ts')
  .option('-o, --output <format>', 'Output format (console, json, html)', 'console')
  .option('--save <path>', 'Save report to file')
  .option('--fail-on-critical', 'Exit with error if critical issues found')
  .option('--skip <tests>', 'Comma-separated list of tests to skip')
  .option('--only <tests>', 'Comma-separated list of tests to run')
  .option('-v, --verbose', 'Show detailed test results')
  .action(async (options) => {
    const spinner = ora('Initializing security tests...').start();

    try {
      // Load RANA config
      spinner.text = 'Loading RANA configuration...';
      const configPath = path.resolve(process.cwd(), options.config);
      let ranaConfig: any;

      try {
        const configModule = await import(configPath);
        ranaConfig = configModule.default || configModule;
      } catch (error) {
        spinner.fail('Failed to load RANA config');
        console.error(chalk.red(`\nError: Could not find config at ${configPath}`));
        console.log(chalk.yellow('\nTip: Run `rana init` to create a config file'));
        process.exit(1);
      }

      // Create RANA client
      const rana = createRana(ranaConfig);

      // Create security tester
      const tester = createSecurityTester(rana);

      // Prepare test config
      const testConfig = {
        skipTests: options.skip?.split(',').map((t: string) => t.trim()),
        includeTests: options.only?.split(',').map((t: string) => t.trim()),
        verbose: options.verbose,
        failOnCritical: options.failOnCritical,
      };

      // Run security tests
      spinner.text = 'Running security tests...';
      const report = await tester.runAllTests(testConfig);
      spinner.succeed('Security tests completed');

      // Display report
      if (options.output === 'console') {
        displayConsoleReport(report, options.verbose);
      } else if (options.output === 'json') {
        const json = JSON.stringify(report, null, 2);
        console.log(json);
      } else if (options.output === 'html') {
        const html = generateHTMLReport(report);
        console.log(html);
      }

      // Save report if requested
      if (options.save) {
        const savePath = path.resolve(process.cwd(), options.save);
        let content: string;

        if (options.output === 'html') {
          content = generateHTMLReport(report);
        } else {
          content = JSON.stringify(report, null, 2);
        }

        await fs.writeFile(savePath, content);
        console.log(chalk.green(`\n📄 Report saved to: ${savePath}`));
      }

      // Exit with error if critical issues and failOnCritical
      if (options.failOnCritical) {
        const criticalIssues = report.results.filter(
          r => !r.passed && r.severity === 'critical'
        );
        if (criticalIssues.length > 0) {
          process.exit(1);
        }
      }
    } catch (error) {
      spinner.fail('Security test failed');
      console.error(chalk.red('\nError:'), error);
      process.exit(1);
    }
  });

/**
 * Display report in console with colors and formatting
 */
function displayConsoleReport(report: SecurityTestReport, verbose: boolean): void {
  console.log('\n');
  console.log(chalk.bold('═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('           RANA SECURITY SCORECARD'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════'));
  console.log();

  // Overall Score
  const scoreColor =
    report.overallScore >= 90
      ? chalk.green
      : report.overallScore >= 70
      ? chalk.yellow
      : chalk.red;

  console.log(chalk.bold('Overall Security Score:'), scoreColor.bold(`${report.overallScore}/100`));
  console.log();

  // Score breakdown
  const scoreEmoji =
    report.overallScore >= 90
      ? '🛡️  Excellent'
      : report.overallScore >= 70
      ? '⚠️  Good'
      : '🚨 Needs Improvement';

  console.log(scoreColor(scoreEmoji));
  console.log();

  // Test summary
  console.log(chalk.bold('Test Summary:'));
  console.log(`  Total Tests:  ${report.totalTests}`);
  console.log(`  Passed:       ${chalk.green(report.passed)} ✓`);
  console.log(`  Failed:       ${chalk.red(report.failed)} ✗`);
  console.log();

  // Failed tests by severity
  const critical = report.results.filter(r => !r.passed && r.severity === 'critical');
  const high = report.results.filter(r => !r.passed && r.severity === 'high');
  const medium = report.results.filter(r => !r.passed && r.severity === 'medium');
  const low = report.results.filter(r => !r.passed && r.severity === 'low');

  if (critical.length + high.length + medium.length + low.length > 0) {
    console.log(chalk.bold('Issues by Severity:'));
    if (critical.length > 0)
      console.log(`  ${chalk.red.bold('Critical:')} ${critical.length}`);
    if (high.length > 0) console.log(`  ${chalk.red('High:')}     ${high.length}`);
    if (medium.length > 0)
      console.log(`  ${chalk.yellow('Medium:')}   ${medium.length}`);
    if (low.length > 0) console.log(`  ${chalk.gray('Low:')}      ${low.length}`);
    console.log();
  }

  // Failed tests detail
  if (verbose || critical.length + high.length > 0) {
    console.log(chalk.bold('Test Results:'));
    console.log();

    // Group by category
    const categories = groupByCategory(report.results);

    Object.entries(categories).forEach(([category, results]) => {
      console.log(chalk.bold.underline(category));
      results.forEach((result: SecurityTestResult) => {
        const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
        const severityColor = getSeverityColor(result.severity);
        const name = result.testName.replace(`${category}: `, '');

        console.log(
          `  ${icon} ${name} ${severityColor(`[${result.severity.toUpperCase()}]`)}`
        );

        if (!result.passed) {
          console.log(chalk.gray(`     ${result.description}`));
          if (result.details) {
            console.log(chalk.gray(`     Details: ${result.details}`));
          }
          if (result.remediation) {
            console.log(chalk.yellow(`     💡 ${result.remediation}`));
          }
        }
        console.log();
      });
    });
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(chalk.bold('Recommendations:'));
    report.recommendations.forEach((rec) => {
      console.log(`  ${rec}`);
    });
    console.log();
  }

  // Available presets
  console.log(chalk.bold('Security Presets Available:'));
  console.log(chalk.gray('  Use these one-command security configurations:\n'));
  const presets = listPresets();
  presets.forEach((preset) => {
    console.log(`  ${chalk.cyan(`rana.security.presets.${preset.name}()`)} - ${preset.description}`);
  });
  console.log();

  // Footer
  console.log(chalk.bold('═══════════════════════════════════════════════════════════'));
  console.log(chalk.gray(`Generated: ${report.timestamp.toLocaleString()}`));
  console.log(chalk.gray('Learn more: https://rana.cx/security'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════'));
  console.log();
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report: SecurityTestReport): string {
  const scoreColor =
    report.overallScore >= 90
      ? '#10b981'
      : report.overallScore >= 70
      ? '#f59e0b'
      : '#ef4444';

  const criticalCount = report.results.filter(
    r => !r.passed && r.severity === 'critical'
  ).length;
  const highCount = report.results.filter(r => !r.passed && r.severity === 'high')
    .length;

  const testsHTML = report.results
    .map(
      (result) => `
    <tr class="${result.passed ? 'passed' : 'failed'}">
      <td>${result.passed ? '✓' : '✗'}</td>
      <td>${result.testName}</td>
      <td><span class="severity ${result.severity}">${result.severity}</span></td>
      <td>${result.description}</td>
      <td>${result.details || '-'}</td>
      <td>${result.remediation || '-'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>RANA Security Scorecard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #0f172a;
      color: #e2e8f0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      color: #38bdf8;
      margin: 0;
      font-size: 36px;
    }
    .score-container {
      text-align: center;
      margin: 40px 0;
      padding: 40px;
      background: #1e293b;
      border-radius: 12px;
    }
    .score {
      font-size: 72px;
      font-weight: bold;
      color: ${scoreColor};
      margin: 20px 0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    .summary-card {
      background: #1e293b;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #94a3b8;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1e293b;
      border-radius: 8px;
      overflow: hidden;
      margin: 40px 0;
    }
    th {
      background: #334155;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #38bdf8;
    }
    td {
      padding: 12px;
      border-top: 1px solid #334155;
    }
    tr.passed td:first-child {
      color: #10b981;
    }
    tr.failed td:first-child {
      color: #ef4444;
    }
    .severity {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .severity.critical {
      background: #7f1d1d;
      color: #fecaca;
    }
    .severity.high {
      background: #7c2d12;
      color: #fed7aa;
    }
    .severity.medium {
      background: #713f12;
      color: #fde68a;
    }
    .severity.low {
      background: #1e3a8a;
      color: #bfdbfe;
    }
    .recommendations {
      background: #1e293b;
      padding: 30px;
      border-radius: 8px;
      margin: 40px 0;
    }
    .recommendations h2 {
      color: #38bdf8;
      margin-top: 0;
    }
    .recommendations ul {
      list-style: none;
      padding: 0;
    }
    .recommendations li {
      padding: 10px 0;
      border-bottom: 1px solid #334155;
    }
    .footer {
      text-align: center;
      color: #64748b;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ RANA Security Scorecard</h1>
    <p>Generated: ${report.timestamp.toLocaleString()}</p>
  </div>

  <div class="score-container">
    <div>Overall Security Score</div>
    <div class="score">${report.overallScore}<span style="font-size: 36px;">/100</span></div>
    <div>${
      report.overallScore >= 90
        ? '🛡️ Excellent Security'
        : report.overallScore >= 70
        ? '⚠️ Good Security'
        : '🚨 Needs Improvement'
    }</div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tests</h3>
      <div class="value">${report.totalTests}</div>
    </div>
    <div class="summary-card">
      <h3>Passed</h3>
      <div class="value" style="color: #10b981;">${report.passed}</div>
    </div>
    <div class="summary-card">
      <h3>Failed</h3>
      <div class="value" style="color: #ef4444;">${report.failed}</div>
    </div>
    <div class="summary-card">
      <h3>Critical Issues</h3>
      <div class="value" style="color: ${criticalCount > 0 ? '#ef4444' : '#10b981'};">${criticalCount}</div>
    </div>
  </div>

  <h2 style="color: #38bdf8;">Test Results</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Test</th>
        <th>Severity</th>
        <th>Description</th>
        <th>Details</th>
        <th>Remediation</th>
      </tr>
    </thead>
    <tbody>
      ${testsHTML}
    </tbody>
  </table>

  <div class="recommendations">
    <h2>Recommendations</h2>
    <ul>
      ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p>RANA Security Testing Suite</p>
    <p><a href="https://rana.cx/security" style="color: #38bdf8;">Learn more about RANA security</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * Group test results by category
 */
function groupByCategory(results: SecurityTestResult[]): Record<string, SecurityTestResult[]> {
  const categories: Record<string, SecurityTestResult[]> = {};

  results.forEach((result) => {
    const category = result.testName.split(':')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(result);
  });

  return categories;
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: string): (text: string) => string {
  switch (severity) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.gray;
    default:
      return chalk.white;
  }
}
