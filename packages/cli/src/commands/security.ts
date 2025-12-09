/**
 * Security commands
 * rana security:check, rana security:scan
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SecurityIssue {
  file: string;
  line?: number;
  type: 'secret' | 'pii' | 'vulnerability' | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  match?: string;
}

/**
 * Patterns for detecting secrets
 */
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /\b(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
    severity: 'critical' as const,
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws[_-]?secret[_-]?access[_-]?key['":\s]*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
    severity: 'critical' as const,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'critical' as const,
  },
  {
    name: 'API Key',
    pattern: /\b(api[_-]?key|apikey)['":\s]*['"]?([A-Za-z0-9_-]{20,})['"]?/gi,
    severity: 'high' as const,
  },
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[A-Za-z0-9_-]{20,}/gi,
    severity: 'high' as const,
  },
  {
    name: 'Password in Code',
    pattern: /(password|passwd|pwd)['":\s]*['"]([^'"]{4,})['"](?!\s*:)/gi,
    severity: 'high' as const,
  },
  {
    name: 'Database URL',
    pattern: /(postgres|mysql|mongodb|redis):\/\/[^'":\s]+:[^'"@\s]+@/gi,
    severity: 'critical' as const,
  },
  {
    name: 'GitHub Token',
    pattern: /\b(ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|ghr_[A-Za-z0-9]{36})\b/g,
    severity: 'critical' as const,
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/g,
    severity: 'high' as const,
  },
  {
    name: 'Stripe Key',
    pattern: /\b(sk_live_[A-Za-z0-9]{24,}|rk_live_[A-Za-z0-9]{24,})\b/g,
    severity: 'critical' as const,
  },
];

/**
 * PII patterns
 */
const PII_PATTERNS = [
  {
    name: 'Email Address',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'medium' as const,
  },
  {
    name: 'SSN',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    severity: 'critical' as const,
  },
  {
    name: 'Credit Card',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    severity: 'critical' as const,
  },
  {
    name: 'Phone Number',
    pattern: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'medium' as const,
  },
];

/**
 * Files to skip
 */
const SKIP_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/*.min.js',
  '**/*.map',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/*.png',
  '**/*.jpg',
  '**/*.gif',
  '**/*.ico',
  '**/*.woff*',
  '**/*.ttf',
];

/**
 * Scan a file for security issues
 */
async function scanFile(filePath: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check secrets
      for (const { name, pattern, severity } of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'secret',
            severity,
            description: `Potential ${name} detected`,
            match: match[0].substring(0, 20) + '...',
          });
        }
      }

      // Check PII (only in non-test files)
      if (!filePath.includes('test') && !filePath.includes('spec')) {
        for (const { name, pattern, severity } of PII_PATTERNS) {
          pattern.lastIndex = 0;
          const matches = line.matchAll(pattern);
          for (const match of matches) {
            // Skip if it looks like a variable name or test data
            if (
              match[0].includes('example') ||
              match[0].includes('test') ||
              match[0].includes('fake')
            ) {
              continue;
            }

            issues.push({
              file: filePath,
              line: lineNum,
              type: 'pii',
              severity,
              description: `Potential ${name} in code`,
              match: match[0].substring(0, 15) + '...',
            });
          }
        }
      }
    }
  } catch {
    // Skip files that can't be read
  }

  return issues;
}

export function registerSecurityCommands(program: Command): void {
  const security = program
    .command('security')
    .alias('sec')
    .description('Security scanning and checks');

  // security:scan - Scan for secrets and PII
  security
    .command('scan [path]')
    .description('Scan codebase for secrets and PII')
    .option('--secrets-only', 'Only scan for secrets')
    .option('--pii-only', 'Only scan for PII')
    .option('--severity <level>', 'Minimum severity to report (low, medium, high, critical)', 'medium')
    .action(async (scanPath, options) => {
      const targetPath = scanPath || process.cwd();
      const spinner = ora('Scanning for security issues...').start();

      try {
        // Find all files
        const files = await glob('**/*', {
          cwd: targetPath,
          nodir: true,
          ignore: SKIP_PATTERNS,
          absolute: true,
        });

        spinner.text = `Scanning ${files.length} files...`;

        const allIssues: SecurityIssue[] = [];
        let scanned = 0;

        for (const file of files) {
          const issues = await scanFile(file);
          allIssues.push(...issues);
          scanned++;

          if (scanned % 100 === 0) {
            spinner.text = `Scanned ${scanned}/${files.length} files... (${allIssues.length} issues found)`;
          }
        }

        spinner.stop();

        // Filter by severity
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const minSeverityIndex = severityOrder.indexOf(options.severity);
        const filteredIssues = allIssues.filter(
          (issue) => severityOrder.indexOf(issue.severity) >= minSeverityIndex
        );

        // Filter by type
        let issues = filteredIssues;
        if (options.secretsOnly) {
          issues = issues.filter((i) => i.type === 'secret');
        } else if (options.piiOnly) {
          issues = issues.filter((i) => i.type === 'pii');
        }

        // Display results
        console.log(chalk.blue.bold('\n🔒 Security Scan Results\n'));
        console.log(chalk.gray('Files scanned:'), chalk.white(files.length));
        console.log(chalk.gray('Issues found:'), chalk.white(issues.length));
        console.log();

        if (issues.length === 0) {
          console.log(chalk.green.bold('✅ No security issues found!\n'));
          return;
        }

        // Group by severity
        const critical = issues.filter((i) => i.severity === 'critical');
        const high = issues.filter((i) => i.severity === 'high');
        const medium = issues.filter((i) => i.severity === 'medium');
        const low = issues.filter((i) => i.severity === 'low');

        if (critical.length > 0) {
          console.log(chalk.red.bold(`🚨 Critical (${critical.length}):\n`));
          for (const issue of critical.slice(0, 10)) {
            console.log(chalk.red(`  ${path.relative(targetPath, issue.file)}:${issue.line}`));
            console.log(chalk.gray(`    ${issue.description}`));
            if (issue.match) {
              console.log(chalk.gray(`    Match: ${issue.match}`));
            }
            console.log();
          }
          if (critical.length > 10) {
            console.log(chalk.gray(`  ... and ${critical.length - 10} more\n`));
          }
        }

        if (high.length > 0) {
          console.log(chalk.yellow.bold(`⚠️  High (${high.length}):\n`));
          for (const issue of high.slice(0, 10)) {
            console.log(chalk.yellow(`  ${path.relative(targetPath, issue.file)}:${issue.line}`));
            console.log(chalk.gray(`    ${issue.description}`));
            console.log();
          }
          if (high.length > 10) {
            console.log(chalk.gray(`  ... and ${high.length - 10} more\n`));
          }
        }

        if (medium.length > 0) {
          console.log(chalk.blue(`ℹ️  Medium (${medium.length}):\n`));
          for (const issue of medium.slice(0, 5)) {
            console.log(chalk.blue(`  ${path.relative(targetPath, issue.file)}:${issue.line}`));
            console.log(chalk.gray(`    ${issue.description}`));
            console.log();
          }
          if (medium.length > 5) {
            console.log(chalk.gray(`  ... and ${medium.length - 5} more\n`));
          }
        }

        // Summary
        console.log(chalk.white.bold('Summary:'));
        console.log(chalk.red(`  Critical: ${critical.length}`));
        console.log(chalk.yellow(`  High: ${high.length}`));
        console.log(chalk.blue(`  Medium: ${medium.length}`));
        console.log(chalk.gray(`  Low: ${low.length}`));
        console.log();

        if (critical.length > 0 || high.length > 0) {
          console.log(chalk.red.bold('❌ Security scan failed - fix critical and high issues\n'));
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(chalk.red('Scan failed'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // security:check - Quick check (alias for scan with high severity)
  security
    .command('check')
    .description('Quick security check (critical and high severity only)')
    .action(async () => {
      // Forward to scan with high severity
      await security.parseAsync(['scan', '--severity', 'high']);
    });

  // Alias at top level
  program
    .command('check')
    .description('Run guardrail checks (security, constraints)')
    .action(async () => {
      console.log(chalk.blue.bold('\n🛡️  RANA Guardrail Checks\n'));

      // Run security scan
      console.log(chalk.white.bold('1. Security Scan\n'));
      const spinner = ora('Scanning...').start();

      try {
        const files = await glob('**/*', {
          nodir: true,
          ignore: SKIP_PATTERNS,
          absolute: true,
        });

        let issueCount = 0;
        for (const file of files) {
          const issues = await scanFile(file);
          const critical = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
          issueCount += critical.length;
        }

        spinner.stop();

        if (issueCount === 0) {
          console.log(chalk.green('   ✅ No critical security issues\n'));
        } else {
          console.log(chalk.red(`   ❌ ${issueCount} critical/high issues found`));
          console.log(chalk.gray('   Run: rana security scan for details\n'));
        }
      } catch {
        spinner.stop();
        console.log(chalk.yellow('   ⚠️  Could not complete security scan\n'));
      }

      // Add more checks here as needed
      console.log(chalk.white.bold('2. Dependency Check\n'));
      console.log(chalk.gray('   Run: npm audit\n'));

      console.log(chalk.gray('---\n'));
      console.log(chalk.gray('For full security scan: rana security scan'));
      console.log(chalk.gray('For feature checks: rana feature check <name>\n'));
    });
}
