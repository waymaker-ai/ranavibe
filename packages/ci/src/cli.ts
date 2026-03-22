#!/usr/bin/env node

/**
 * @waymakerai/aicofounder-ci CLI
 *
 * Usage:
 *   aicofounder-ci scan [path] [--rules all] [--format console] [--fail-on high]
 *   aicofounder-ci validate [config-path]
 *   aicofounder-ci check [path] [--format github-pr]
 */

import type { ReportFormat, Severity, ScanConfig } from './types.js';
import { scan, parseGitHubContext, runAndFormat } from './index.js';
import { validateConfig } from './scanners/config-scanner.js';
import { formatReport } from './reporters/index.js';
import { postOrUpdateComment } from './github/pr-comment.js';
import { createCheckRun, outputWorkflowCommands } from './github/annotations.js';
import { formatGitHubPr } from './reporters/github.js';

// ---- Argument parsing (zero deps) ----

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node and script path
  const command = args[0] || 'scan';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const eqIdx = key.indexOf('=');
      if (eqIdx !== -1) {
        flags[key.slice(0, eqIdx)] = key.slice(eqIdx + 1);
      } else {
        // Next arg is the value, unless it's another flag or missing
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = 'true';
        }
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const shortFlags: Record<string, string> = {
        r: 'rules',
        f: 'format',
        p: 'path',
        c: 'config',
      };
      const key = shortFlags[arg[1]] || arg[1];
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { command, positional, flags };
}

function printUsage(): void {
  const usage = `
CoFounder CI - AI Guardrails Scanner

Usage:
  aicofounder-ci scan [path]       Scan codebase for AI security issues
  aicofounder-ci validate [config] Validate .aicofounder.yml configuration
  aicofounder-ci check [path]      Scan and post results to GitHub PR
  aicofounder-ci help              Show this help message

Options:
  --rules <rules>     Comma-separated rules or "all" (default: all)
  --format <format>   Output format: console, json, sarif, markdown, github-pr (default: console)
  --fail-on <level>   Minimum severity to fail: critical, high, medium, low, none (default: high)
  --config <path>     Path to .aicofounder.yml config (default: .aicofounder.yml)
  --approved-models   Comma-separated approved model list
  --budget-limit      Monthly budget limit in USD

Environment:
  GITHUB_TOKEN        GitHub token for PR comments and annotations
  GITHUB_EVENT_PATH   Path to GitHub event payload JSON

Examples:
  aicofounder-ci scan ./src --rules no-hardcoded-keys,no-pii-in-prompts --format json
  aicofounder-ci scan . --fail-on critical --format sarif > results.sarif
  aicofounder-ci validate .aicofounder.yml
  aicofounder-ci check . --format github-pr
`;
  process.stdout.write(usage + '\n');
}

function buildConfig(parsed: ParsedArgs): ScanConfig {
  const scanPath = parsed.positional[0] || parsed.flags.path || '.';
  const rulesStr = parsed.flags.rules || 'all';
  const rules: string[] | 'all' = rulesStr === 'all' ? 'all' : rulesStr.split(',').map(s => s.trim());
  const format = (parsed.flags.format || 'console') as ReportFormat;
  const failOn = (parsed.flags['fail-on'] || 'high') as Severity;
  const configPath = parsed.flags.config || '.aicofounder.yml';
  const commentOnPr = parsed.flags['comment-on-pr'] !== 'false';

  const approvedModels = parsed.flags['approved-models']
    ? parsed.flags['approved-models'].split(',').map(s => s.trim())
    : undefined;

  const budgetLimit = parsed.flags['budget-limit']
    ? parseFloat(parsed.flags['budget-limit'])
    : undefined;

  // Check for GitHub token from env or input
  const githubToken = process.env.GITHUB_TOKEN
    || process.env.INPUT_GITHUB_TOKEN
    || parsed.flags['github-token'];

  return {
    scanPath,
    rules,
    failOn,
    format,
    configPath,
    commentOnPr,
    githubToken,
    approvedModels,
    budgetLimit,
    ignorePatterns: [],
  };
}

// ---- Commands ----

async function cmdScan(parsed: ParsedArgs): Promise<number> {
  const config = buildConfig(parsed);
  const { result, output } = runAndFormat(config);

  process.stdout.write(output + '\n');

  // If running in GitHub Actions, also output workflow commands
  if (process.env.GITHUB_ACTIONS === 'true') {
    const commands = outputWorkflowCommands(result.findings);
    if (commands) {
      process.stdout.write(commands + '\n');
    }

    // Set outputs for GitHub Actions
    process.stdout.write(`::set-output name=findings::${result.findings.length}\n`);
    process.stdout.write(`::set-output name=critical::${result.summary.critical}\n`);
    process.stdout.write(`::set-output name=passed::${result.passed}\n`);
  }

  return result.passed ? 0 : 1;
}

async function cmdValidate(parsed: ParsedArgs): Promise<number> {
  const configPath = parsed.positional[0] || parsed.flags.config || '.aicofounder.yml';
  const findings = validateConfig(configPath);

  if (findings.length === 0) {
    process.stdout.write(`Configuration "${configPath}" is valid.\n`);
    return 0;
  }

  process.stdout.write(`Configuration issues in "${configPath}":\n\n`);
  for (const f of findings) {
    const sevLabel = f.severity.toUpperCase().padEnd(8);
    process.stdout.write(`  [${sevLabel}] Line ${f.line}: ${f.message}\n`);
  }
  process.stdout.write('\n');

  const hasErrors = findings.some(f => f.severity === 'high' || f.severity === 'critical');
  return hasErrors ? 1 : 0;
}

async function cmdCheck(parsed: ParsedArgs): Promise<number> {
  // Force github-pr format if not specified
  if (!parsed.flags.format) {
    parsed.flags.format = 'github-pr';
  }

  const config = buildConfig(parsed);
  const result = scan(config);

  // Output console format to stdout for CI logs
  const consoleOutput = formatReport(result, 'console');
  process.stdout.write(consoleOutput + '\n');

  // GitHub Actions integration
  const ghContext = parseGitHubContext();

  if (ghContext.token && ghContext.owner && ghContext.repo) {
    // Output workflow commands for inline annotations
    const commands = outputWorkflowCommands(result.findings);
    if (commands) {
      process.stdout.write(commands + '\n');
    }

    // Create check run with annotations
    if (ghContext.sha) {
      const checkResult = await createCheckRun(ghContext, result.findings, result.passed);
      if (checkResult.success) {
        process.stdout.write(`Check run created: ${checkResult.url || 'OK'}\n`);
      } else {
        process.stderr.write(`Warning: Failed to create check run: ${checkResult.error}\n`);
      }
    }

    // Post PR comment
    if (config.commentOnPr && ghContext.pullRequestNumber) {
      const prBody = formatGitHubPr(result);
      const commentResult = await postOrUpdateComment(
        ghContext,
        ghContext.pullRequestNumber,
        prBody,
      );
      if (commentResult.success) {
        process.stdout.write(`PR comment posted: ${commentResult.url || 'OK'}\n`);
      } else {
        process.stderr.write(`Warning: Failed to post PR comment: ${commentResult.error}\n`);
      }
    }

    // Set GitHub Actions outputs
    process.stdout.write(`::set-output name=findings::${result.findings.length}\n`);
    process.stdout.write(`::set-output name=critical::${result.summary.critical}\n`);
    process.stdout.write(`::set-output name=passed::${result.passed}\n`);
  } else {
    // Not in GitHub Actions, just output the formatted report
    const output = formatReport(result, config.format);
    process.stdout.write(output + '\n');
  }

  return result.passed ? 0 : 1;
}

// ---- Main ----

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  let exitCode: number;

  switch (parsed.command) {
    case 'scan':
      exitCode = await cmdScan(parsed);
      break;
    case 'validate':
      exitCode = await cmdValidate(parsed);
      break;
    case 'check':
      exitCode = await cmdCheck(parsed);
      break;
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      exitCode = 0;
      break;
    case 'version':
    case '--version':
    case '-v':
      process.stdout.write('aicofounder-ci v1.0.0\n');
      exitCode = 0;
      break;
    default:
      process.stderr.write(`Unknown command: ${parsed.command}\n`);
      printUsage();
      exitCode = 1;
  }

  process.exit(exitCode);
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
