'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Terminal, Play, Shield, FileText, BarChart3, Code, Settings, Wrench } from 'lucide-react';

export default function CLIPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CLI Reference</h1>
          <p className="text-lg text-foreground-secondary mb-4">
            Complete guide to all CoFounder CLI commands with examples. The CLI provides project
            initialization, compliance scanning, code generation, prompt management, cost analytics,
            and CI/CD integration.
          </p>
          <div className="code-block font-mono text-sm mb-12">
            <div className="text-foreground-secondary"># Install globally</div>
            <div>npm install -g @waymakerai/aicofounder-cli</div>
            <div className="mt-4 text-foreground-secondary"># Or use with npx (no install needed)</div>
            <div>npx @waymakerai/aicofounder-cli init</div>
          </div>
        </motion.div>

        {/* Init & Setup */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Play className="mr-3 h-6 w-6 text-gradient-from" />
            Project Initialization
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Initialize CoFounder in your project
# Creates .cofounder.yml with smart defaults based on your project
aicofounder init

# Interactive mode - walks through all configuration options
aicofounder init --interactive

# Initialize with a specific template
aicofounder init --template healthcare    # HIPAA-compliant defaults
aicofounder init --template fintech       # SEC/PCI-compliant defaults
aicofounder init --template saas          # Multi-tenant defaults

# Check project health and configuration
aicofounder doctor

# Output:
#   [OK] .cofounder.yml found and valid
#   [OK] TypeScript strict mode enabled
#   [OK] Guard configuration detected
#   [WARN] No CI pipeline configuration found
#   [WARN] No budget limits configured

# Show current project status
aicofounder status

# Output:
#   Project: My AI App
#   Type: application
#   Standards: 5 principles, 4 quality gates
#   Tests: 89% coverage (threshold: 80%)
#   Last scan: 2 findings (0 critical)

# Quick start guide
aicofounder quickstart

# Run an interactive demo
aicofounder demo`}</pre>
          </div>
        </motion.section>

        {/* Check & Scan */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            Scanning &amp; Compliance
          </h2>
          <p className="text-foreground-secondary mb-4">
            Scan your codebase for security issues, compliance violations, hardcoded keys, unapproved
            models, and budget misconfigurations. Supports multiple output formats including SARIF for
            GitHub Security integration.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Run compliance check against .cofounder.yml standards
aicofounder check

# Output:
#   Scanning src/ ... 142 files scanned
#   Rules applied: 8
#
#   src/config.ts:15:10
#     [critical] no-hardcoded-keys: Hardcoded API key detected
#     Fix: Use environment variables instead
#
#   src/chat.ts:42:5
#     [high] approved-models-only: Model 'gpt-3.5-turbo' is not approved
#     Fix: Use an approved model: claude-sonnet-4-20250514, gpt-4o
#
#   Summary: 0 critical, 2 high, 3 medium, 1 low
#   Status: FAILED (threshold: high)

# Scan with specific options
aicofounder check --path ./src --fail-on critical
aicofounder check --rules no-hardcoded-keys,approved-models-only
aicofounder check --config ./configs/.cofounder.yml

# Output in different formats
aicofounder check --format json --output results.json
aicofounder check --format sarif --output results.sarif
aicofounder check --format markdown --output results.md

# Auto-fix detected issues
aicofounder fix

# Output:
#   [FIXED] src/config.ts:15 - Replaced hardcoded key with process.env reference
#   [MANUAL] src/chat.ts:42 - Cannot auto-fix: model change requires review
#   Fixed: 1/2 issues

# Security audit
aicofounder security:audit

# Output:
#   Security Audit Report
#   ---------------------
#   PII handling: PASS (redaction enabled)
#   Injection protection: PASS (high sensitivity)
#   API key management: FAIL (2 hardcoded keys found)
#   Model access: WARN (1 unapproved model)
#   Budget controls: PASS (daily limit set)
#   Overall: 3/5 checks passed`}</pre>
          </div>
        </motion.section>

        {/* Code Generation */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Code className="mr-3 h-6 w-6 text-gradient-from" />
            Code Generation
          </h2>
          <p className="text-foreground-secondary mb-4">
            Generate CoFounder-compliant code from natural language descriptions. The generator
            automatically includes guard configuration, cost tracking, and error handling.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Generate code from a description
aicofounder generate "Create a chat API with PII redaction and HIPAA compliance"

# Output: Generates a complete file with:
# - Express route handler
# - OpenClaw guard with PII redaction
# - HIPAA compliance enforcement
# - Cost tracking
# - Error handling
# - TypeScript types

# Interactive code generation (asks follow-up questions)
aicofounder generate:interactive

# List available templates
aicofounder generate:templates

# Output:
#   chat-api          - REST API with guardrails
#   agent-basic       - Simple LLM agent with tools
#   agent-multi       - Multi-agent orchestration
#   rag-pipeline      - RAG with vector search
#   guard-middleware   - Express/Fastify guard middleware
#   mcp-server        - MCP server with tools
#   compliance-check  - Compliance enforcement setup
#   dashboard-setup   - Observability dashboard

# Generate from a template
aicofounder generate --template chat-api --output src/api/chat.ts
aicofounder generate --template mcp-server --output src/mcp/server.ts`}</pre>
          </div>
        </motion.section>

        {/* Prompt Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-gradient-from" />
            Prompt Management
          </h2>
          <p className="text-foreground-secondary mb-4">
            Version, analyze, and optimize your prompts from the command line.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Save a prompt with metadata and tags
aicofounder prompts save \\
  --name "customer-greeting" \\
  --template "Hello {{name}}, welcome to {{company}}. How can I help?" \\
  --tags "customer-service,greeting" \\
  --model "claude-sonnet-4-20250514"

# List saved prompts with filtering
aicofounder prompts list
aicofounder prompts list --tag customer-service
aicofounder prompts list --model claude-sonnet-4-20250514

# Use a saved prompt
aicofounder prompts use customer-greeting --vars '{"name":"Alice","company":"Acme"}'

# Analyze prompt quality
aicofounder prompts analyze --name customer-greeting

# Output:
#   Prompt Quality Analysis
#   ----------------------
#   Clarity:        8/10
#   Specificity:    7/10
#   Safety:         9/10
#   Cost estimate:  $0.002 per call
#   Suggestions:
#     - Add output format instructions
#     - Specify response length constraints

# Get AI-powered improvement suggestions
aicofounder prompts improve --name customer-greeting

# Compare two prompt versions
aicofounder prompts compare customer-greeting-v1 customer-greeting-v2

# Export/import prompts
aicofounder prompts export --output prompts.json
aicofounder prompts import --input prompts.json`}</pre>
          </div>
        </motion.section>

        {/* Cost & Analytics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-gradient-from" />
            Cost &amp; Analytics
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Open the real-time cost dashboard (terminal UI)
aicofounder dashboard

# Output:
#   CoFounder Dashboard - Live
#   ─────────────────────────────────────────
#   Today's Cost:    $42.15 / $100.00 (42%)
#   Monthly Cost:    $890.45 / $2,000.00 (45%)
#   Requests:        3,452 (23/min avg)
#   Cache Hit Rate:  62%
#
#   Top Models:
#     claude-sonnet-4-20250514  $32.00  (76%)
#     gpt-4o                    $8.15   (19%)
#     claude-haiku              $2.00   (5%)
#
#   Security Events:  12 blocked, 45 warnings
#   Compliance Score: 97.5%

# Estimate costs for a workload
aicofounder cost:estimate \\
  --model claude-sonnet-4-20250514 \\
  --input-tokens 1000 \\
  --output-tokens 500 \\
  --requests 10000

# Output:
#   Model:           claude-sonnet-4-20250514
#   Input cost:      $0.03 per request
#   Output cost:     $0.0075 per request
#   Total per req:   $0.0375
#   Total (10,000):  $375.00

# Compare model pricing
aicofounder cost:compare --models "claude-sonnet-4-20250514,gpt-4o,gemini-1.5-pro"

# Output:
#   Model                     Input/1M   Output/1M  Est. Monthly
#   claude-sonnet-4-20250514  $3.00      $15.00     $1,800
#   gpt-4o                    $2.50      $10.00     $1,250
#   gemini-1.5-pro            $1.25      $5.00      $625

# Get optimization recommendations
aicofounder optimize

# Output:
#   Optimization Recommendations
#   ────────────────────────────
#   1. Enable caching (est. savings: $400/mo)
#      Current: disabled
#      Recommendation: Enable semantic caching with Redis
#
#   2. Route simple queries to cheaper model (est. savings: $250/mo)
#      42% of requests are simple classification tasks
#      Use claude-haiku instead of claude-sonnet
#
#   3. Compress prompts (est. savings: $100/mo)
#      Average prompt has 30% redundant tokens
#
#   Total potential savings: $750/mo (42%)

# Analyze project for improvements
aicofounder analyze`}</pre>
          </div>
        </motion.section>

        {/* MCP Commands */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Wrench className="mr-3 h-6 w-6 text-gradient-from" />
            MCP Server Management
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Create a new MCP server from template
aicofounder mcp:create --name my-tools --template basic

# Output:
#   Created MCP server: my-tools/
#     my-tools/src/index.ts      (server entry point)
#     my-tools/src/tools.ts      (tool definitions)
#     my-tools/package.json
#     my-tools/tsconfig.json

# List installed MCP servers
aicofounder mcp:list

# Install an MCP server from npm
aicofounder mcp:install @waymakerai/aicofounder-mcp-server

# Configure MCP server settings
aicofounder mcp:configure my-tools --set pii_mode=redact

# Test MCP server tools
aicofounder mcp:test my-tools

# Output:
#   Testing MCP server: my-tools
#   [PASS] guard_check - Returned valid result
#   [PASS] compliance_check - Returned valid result
#   [PASS] cost_estimate - Returned valid result
#   All 3 tools passed`}</pre>
          </div>
        </motion.section>

        {/* Database Commands */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Settings className="mr-3 h-6 w-6 text-gradient-from" />
            Additional Commands
          </h2>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# ─── Database ────────────────────────────────────────────────
aicofounder db:setup          # Interactive database setup wizard
aicofounder db:migrate        # Run pending migrations
aicofounder db:seed           # Seed database with sample data
aicofounder db:studio         # Open Prisma Studio
aicofounder db:status         # Show migration status

# ─── LLM Management ─────────────────────────────────────────
aicofounder llm:setup         # Interactive provider setup
aicofounder llm:analyze       # Analyze LLM usage patterns
aicofounder llm:optimize      # Apply LLM cost optimizations
aicofounder llm:compare       # Compare models side-by-side

# ─── SEO (for web apps) ──────────────────────────────────────
aicofounder seo:check         # Validate SEO setup
aicofounder seo:generate      # Generate sitemap, robots.txt
aicofounder seo:analyze       # Analyze pages for SEO issues

# ─── Deployment ──────────────────────────────────────────────
aicofounder deploy            # Deploy with verification workflow
aicofounder deploy --dry-run  # Preview deployment without executing

# ─── Process Intelligence ────────────────────────────────────
aicofounder analyze:velocity  # Development velocity & DORA metrics
aicofounder analyze:legacy    # Legacy code modernization analysis
aicofounder benchmark:run     # Benchmark LLM providers

# ─── Playground ──────────────────────────────────────────────
aicofounder playground        # Interactive testing playground
                              # Test prompts, guards, and models in real-time`}</pre>
          </div>
        </motion.section>

        {/* CI/CD Usage */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Terminal className="mr-3 h-6 w-6 text-gradient-from" />
            CI/CD Usage
          </h2>
          <p className="text-foreground-secondary mb-4">
            All CLI commands support non-interactive mode for CI/CD pipelines. Use exit codes and
            machine-readable output formats for automation.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# CI-friendly scanning (non-interactive, JSON output, exit code)
aicofounder check --format json --output results.json --fail-on high

# Exit codes:
# 0 = All checks passed
# 1 = Findings at or above fail-on severity
# 2 = Configuration error

# GitHub Actions usage
# .github/workflows/cofounder.yml
name: CoFounder Gate
on: [pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx aicofounder check --fail-on high --format sarif --output results.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with: { sarif_file: results.sarif }

# GitLab CI usage
# .gitlab-ci.yml
cofounder-scan:
  image: node:20
  script:
    - npm ci
    - npx aicofounder check --fail-on high --format json --output results.json
  artifacts:
    reports:
      sast: results.json

# Pre-commit hook
# package.json
{
  "scripts": {
    "pre-commit": "aicofounder check --path ./src --fail-on critical"
  }
}`}</pre>
          </div>
        </motion.section>

        {/* Global Options */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <div className="p-6 rounded-lg bg-background-secondary border border-border">
            <h3 className="text-lg font-semibold mb-3">Global Options</h3>
            <p className="text-foreground-secondary mb-4">
              These flags work with any command:
            </p>
            <div className="code-block font-mono text-sm overflow-x-auto">
              <pre>{`--help, -h        Show help for any command
--version, -v     Show CLI version
--verbose         Enable debug output
--quiet           Suppress non-essential output
--config <path>   Path to .cofounder.yml
--no-color        Disable colored output (useful for CI)

# Examples:
aicofounder check --help
aicofounder generate --verbose "Create a chat endpoint"
aicofounder scan --quiet --format json --output results.json`}</pre>
            </div>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs/cost-management"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Cost Management
          </Link>
          <Link
            href="/docs/api"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            API Reference
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
