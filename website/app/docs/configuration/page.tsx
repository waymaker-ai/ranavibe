'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Settings, Shield, FileText, DollarSign, Globe, Package, Terminal } from 'lucide-react';

export default function ConfigurationPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Configuration</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Complete guide to configuring CoFounder for your project, from the YAML config file
            to per-package settings and environment variables.
          </p>
        </motion.div>

        {/* .cofounder.yml */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-gradient-from" />
            The .cofounder.yml File
          </h2>
          <p className="text-foreground-secondary mb-4">
            The <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">.cofounder.yml</code> file
            is the central configuration for your project. Place it at the root of your repository. It controls
            project metadata, quality gates, AI standards, testing requirements, and deployment settings.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# .cofounder.yml - Full configuration reference

version: 1.0.0

project:
  name: "My AI Application"
  type: "application"          # "application" | "tooling" | "library"
  description: "Production AI app with guardrails"
  languages:
    - "typescript"
    - "python"

standards:
  # Core development principles enforced by CoFounder
  principles:
    - search_before_create       # Check existing code before writing new
    - real_data_only             # No mock/placeholder data in production
    - test_everything            # All features must have tests
    - deploy_to_production       # Code must be deployable
    - documentation_required     # All public APIs must be documented

  # TypeScript code quality rules
  code_quality:
    typescript_strict: true      # Enable strict mode
    no_any_types: true           # Disallow 'any' type annotations
    meaningful_names: true       # Variable names must be descriptive
    comments_for_complex_logic: true

  # Testing requirements
  testing:
    manual_testing_required: true
    unit_tests_required: true
    integration_tests_required: true
    e2e_tests_required: false
    coverage_threshold: 80       # Minimum code coverage percentage

  # Documentation standards
  documentation:
    readme_required: true
    api_docs_required: true
    examples_required: true
    changelog_required: true

# Quality gates run at different stages
quality_gates:
  pre_implementation:
    - check_existing_code
    - review_documentation
    - understand_requirements
    - plan_architecture

  implementation:
    - typescript_strict_mode
    - no_any_types
    - error_handling_required
    - meaningful_variable_names
    - dry_principle

  testing:
    - manual_testing_complete
    - unit_tests_passing
    - coverage_meets_threshold

  deployment:
    - git_commit_required
    - version_bumped
    - changelog_updated
    - npm_publish_verified

# Deployment targets
deployment:
  npm:
    enabled: true
    package_name: "@myorg/my-ai-app"
    registry: "https://registry.npmjs.org/"
  github:
    enabled: true
    auto_release: true
    release_notes: true

# AI assistant behavior constraints
ai_assistant:
  instructions_path: "docs/AGENT_INSTRUCTIONS.md"
  checklist_path: "docs/DEVELOPMENT_CHECKLIST.md"
  enforce:
    - no_mock_data
    - real_implementations_only
    - existing_patterns_first
    - test_before_commit
    - deploy_after_test

# Tooling integration
tools:
  cli:
    name: "@waymakerai/aicofounder-cli"
    version: "0.1.0"
    commands:
      - init
      - check
      - validate
      - deploy
  documentation:
    framework: "Nextra"
    url: "https://my-app.dev"`}</pre>
          </div>
        </motion.section>

        {/* Guard Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            Guard Configuration
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder&apos;s guard system provides PII detection, prompt injection protection, and toxicity
            filtering. Configure it through <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-guard</code> or
            the OpenClaw integration.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-8">PII Detection Modes</h3>
          <p className="text-foreground-secondary mb-4">
            PII detection supports three modes: <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">detect</code> (flag
            but allow), <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">redact</code> (replace
            with placeholders), and <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">block</code> (reject
            the entire request). Supported PII types include email, phone, SSN, credit card, IP address, date of
            birth, address, medical record, name, passport, and drivers license.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  // PII detection: 'detect' | 'redact' | 'block' | false
  pii: 'redact',

  // Prompt injection protection
  injectionSensitivity: 'high',    // 'low' | 'medium' | 'high'
  injectionAction: 'block',        // 'block' | 'warn' | 'sanitize'

  // Toxicity filtering
  toxicity: 'block',               // 'block' | 'warn' | false

  // Custom blocked message returned to users
  blockedMessage: 'This request was blocked by our safety system.',

  // Guard tool calls as well as messages
  guardToolCalls: true,
});

// Use the guard directly
const result = await skill.hooks.beforeMessage(
  { role: 'user', content: 'My SSN is 123-45-6789' },
  { user: { id: 'user-1' } }
);

console.log(result.proceed);           // false (if mode is 'block')
console.log(result.guardResult.piiFindings);
// [{ type: 'ssn', value: '123-45-6789', redacted: '[SSN]', confidence: 0.99 }]`}</pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">Injection Sensitivity Levels</h3>
          <p className="text-foreground-secondary mb-4">
            The injection detector checks for direct injection, system prompt leaks, jailbreaks, role manipulation,
            delimiter attacks, encoding exploits, context manipulation, and multi-language injection attempts. Each
            sensitivity level adjusts the score threshold:
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Sensitivity</th>
                  <th className="text-left py-3 px-4">Score Threshold</th>
                  <th className="text-left py-3 px-4">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono">low</td>
                  <td className="py-3 px-4">0.8+</td>
                  <td className="py-3 px-4 text-foreground-secondary">Internal tools, trusted users</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono">medium</td>
                  <td className="py-3 px-4">0.5+</td>
                  <td className="py-3 px-4 text-foreground-secondary">General applications</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono">high</td>
                  <td className="py-3 px-4">0.3+</td>
                  <td className="py-3 px-4 text-foreground-secondary">Public-facing, regulated industries</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">Toxicity Categories</h3>
          <p className="text-foreground-secondary mb-4">
            The toxicity filter detects profanity, hate speech, violence, self-harm, sexual content, harassment,
            and spam. When set to <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">block</code>,
            content containing any of these categories is rejected. When set
            to <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">warn</code>, findings are
            logged but content is allowed through.
          </p>
        </motion.section>

        {/* Compliance Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-gradient-from" />
            Compliance Presets &amp; Custom Rules
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder includes built-in compliance presets for major regulatory frameworks. You can also
            define custom compliance rules that integrate with the enforcement engine.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { ComplianceEnforcer } from '@waymakerai/aicofounder-compliance';

const enforcer = new ComplianceEnforcer({
  // Enable preset compliance frameworks
  enableAllPresets: false,
  strictMode: true,
  logViolations: true,
  storeViolations: true,

  // Add custom rules
  rules: [
    {
      id: 'no-financial-advice',
      name: 'Block Financial Advice',
      description: 'Prevent AI from giving specific financial recommendations',
      category: 'finance',
      severity: 'critical',
      enabled: true,
      tags: ['sec', 'finra'],
      check: (input, output, context) => {
        const patterns = [
          /you should (buy|sell|invest)/i,
          /I recommend (buying|selling)/i,
          /guaranteed returns/i,
        ];
        const found = patterns.some(p => p.test(output));
        return {
          compliant: !found,
          action: found ? 'append' : 'allow',
          replacement: found
            ? output + '\\n\\nDisclaimer: This is not financial advice.'
            : undefined,
          message: found ? 'Financial advice detected' : undefined,
        };
      },
    },
    {
      id: 'medical-disclaimer',
      name: 'Medical Disclaimer Required',
      description: 'Ensure medical content includes disclaimer',
      category: 'healthcare',
      severity: 'high',
      check: (input, output, context) => {
        const isMedical = /symptom|diagnosis|treatment|medication/i.test(output);
        const hasDisclaimer = /not a substitute for.*medical/i.test(output);
        return {
          compliant: !isMedical || hasDisclaimer,
          action: isMedical && !hasDisclaimer ? 'append' : 'allow',
        };
      },
    },
  ],

  // Callbacks
  onViolation: async (violation) => {
    console.log(\`Violation: \${violation.rule.name} [\${violation.rule.severity}]\`);
  },
  onEnforcement: async (result) => {
    if (result.wasModified) {
      console.log('Output was modified for compliance');
    }
  },
});

// Enforce compliance on AI output
const result = await enforcer.enforce(
  userInput,
  aiOutput,
  { input: userInput, output: aiOutput, user: { id: 'user-1' } }
);

console.log(result.compliant);       // boolean
console.log(result.finalOutput);     // Safe output to return to user
console.log(result.violations);      // Any violations detected
console.log(result.wasModified);     // Whether output was changed`}</pre>
          </div>
        </motion.section>

        {/* Policy YAML */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-6 w-6 text-gradient-from" />
            Policy YAML Format
          </h2>
          <p className="text-foreground-secondary mb-4">
            Policies define security and compliance rules in a declarative YAML format. Use
            the <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">@waymakerai/aicofounder-policies</code> package
            to load and evaluate them.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# policies/production.yml
metadata:
  id: "prod-policy-v1"
  name: "Production Policy"
  version: "1.0.0"
  description: "Standard production guardrails"
  author: "Security Team"
  framework: "hipaa"
  tags:
    - production
    - healthcare

rules:
  pii:
    enabled: true
    action: redact             # block | redact | detect | allow
    patterns:
      - name: email
        pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}"
        action: redact
        severity: high
      - name: ssn
        pattern: "\\\\b\\\\d{3}-\\\\d{2}-\\\\d{4}\\\\b"
        action: block
        severity: critical
      - name: credit_card
        pattern: "\\\\b\\\\d{4}[- ]?\\\\d{4}[- ]?\\\\d{4}[- ]?\\\\d{4}\\\\b"
        action: block
        severity: critical
    customPatterns:
      - name: internal_id
        pattern: "INT-\\\\d{8}"
        action: redact
        severity: medium
        description: "Internal employee IDs"
    allowlist:
      - "support@company.com"
      - "noreply@company.com"

  content:
    enabled: true
    prohibited:
      - name: competitor_mention
        pattern: "use (CompetitorA|CompetitorB) instead"
        severity: medium
        message: "Do not recommend competitors"
    required:
      - name: safety_disclaimer
        pattern: "consult a (doctor|professional)"
        severity: high
        message: "Medical responses must include professional referral"
    maxToxicity: 0.3

  model:
    enabled: true
    allow:
      - "claude-*"
      - "gpt-4o*"
    deny:
      - "gpt-3.5-turbo"         # Deprecated model
    maxContextTokens: 128000

  cost:
    enabled: true
    maxCostPerRequest: 0.50     # USD
    maxCostPerDay: 100.00
    maxCostPerMonth: 2000.00
    maxTokensPerRequest: 50000
    maxCompletionTokens: 4096

  data:
    enabled: true
    allowedCategories:
      - "general"
      - "support"
    prohibitedCategories:
      - "medical_records"
      - "financial_records"
    retention:
      maxDays: 90
      encryptAtRest: true
      encryptInTransit: true
    requireAuditLog: true
    requireConsent: true
    allowExport: true
    allowDeletion: true

  response:
    enabled: true
    maxLength: 10000
    requireJson: false
    prohibitedPatterns:
      - name: no_code_execution
        pattern: "eval\\\\(|exec\\\\("
        severity: critical
        message: "Code execution patterns not allowed"

  access:
    enabled: true
    allowedRoles:
      - admin
      - developer
      - analyst
    requireAuth: true
    requireMFA: false
    rateLimit: 60                # requests per minute`}</pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-8">Loading and Evaluating Policies</h3>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { PolicyLoader, PolicyEvaluator } from '@waymakerai/aicofounder-policies';

// Load policies from YAML files
const loader = new PolicyLoader();
const policy = await loader.loadFile('./policies/production.yml');

// Or load from a directory (merges all .yml files)
const policies = await loader.loadDirectory('./policies/');

// Compose multiple policies with conflict resolution
const composed = loader.compose(policies, {
  strategy: 'strictest',         // 'strictest' | 'first' | 'last'
  overrides: {
    cost: 'last',                // Use last policy's cost rules
  },
});

// Evaluate content against a policy
const evaluator = new PolicyEvaluator(composed);
const result = evaluator.evaluate({
  content: userMessage,
  model: 'claude-sonnet-4-20250514',
  cost: 0.03,
  tokens: 1500,
  role: 'developer',
  authenticated: true,
  ip: '10.0.0.1',
  dailyCost: 45.00,
  monthlyCost: 890.00,
});

console.log(result.passed);           // boolean
console.log(result.violations);       // Violation[]
console.log(result.redactedContent);  // Content with PII replaced
console.log(result.durationMs);       // Evaluation time
console.log(result.policiesEvaluated); // Policy IDs checked`}</pre>
          </div>
        </motion.section>

        {/* Cost & Budget */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <DollarSign className="mr-3 h-6 w-6 text-gradient-from" />
            Cost Tracking &amp; Budget Configuration
          </h2>
          <p className="text-foreground-secondary mb-4">
            Budget enforcement can be configured through the OpenClaw skill, the policies system, or
            programmatically. When a budget is exceeded, the system can block requests, issue warnings,
            or downgrade to a cheaper model.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { createOpenClawSkill } from '@waymakerai/aicofounder-openclaw';

const skill = createOpenClawSkill({
  // Budget enforcement
  budget: {
    limit: 100.00,              // Maximum spend in USD
    period: 'day',              // 'request' | 'hour' | 'day' | 'month'
    warningThreshold: 0.8,      // Warn at 80% usage
    onExceeded: 'block',        // 'block' | 'warn' | 'downgrade'
  },

  // Model for cost calculation
  model: 'claude-sonnet-4-20250514',

  // Audit logging
  audit: {
    enabled: true,
    level: 'standard',          // 'minimal' | 'standard' | 'verbose'
    maxEntries: 10000,
  },
});

// Check cost report
const report = skill.getCostReport();
console.log(report.totalSpent);       // $45.23
console.log(report.budgetRemaining);  // $54.77
console.log(report.byModel);          // { 'claude-sonnet-4-20250514': 45.23 }`}</pre>
          </div>
        </motion.section>

        {/* Environment Variables */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Globe className="mr-3 h-6 w-6 text-gradient-from" />
            Environment Variables
          </h2>
          <p className="text-foreground-secondary mb-4">
            CoFounder reads API keys and settings from environment variables. Place these in
            a <code className="px-2 py-1 rounded bg-background-secondary font-mono text-sm">.env</code> file
            or set them in your deployment environment.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# .env - CoFounder environment variables

# ─── Provider API Keys ───────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...
COHERE_API_KEY=...
HF_API_KEY=hf_...

# Azure OpenAI
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# AWS Bedrock (uses standard AWS credentials)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# ─── CoFounder Settings ──────────────────────────────────────
COFOUNDER_DEFAULT_MODEL=claude-sonnet-4-20250514
COFOUNDER_DEFAULT_PROVIDER=anthropic
COFOUNDER_LOG_LEVEL=info          # debug | info | warn | error
COFOUNDER_TIMEOUT=30000           # Request timeout in ms

# ─── Cache Configuration ─────────────────────────────────────
COFOUNDER_CACHE_ENABLED=true
COFOUNDER_CACHE_TTL=3600          # Seconds
COFOUNDER_CACHE_REDIS_URL=redis://localhost:6379

# ─── Telemetry / Observability ────────────────────────────────
COFOUNDER_TELEMETRY=true
COFOUNDER_OTLP_ENDPOINT=http://localhost:4318

# ─── Dashboard ────────────────────────────────────────────────
COFOUNDER_DASHBOARD_API_KEY=your-dashboard-key
COFOUNDER_DASHBOARD_STORAGE=file  # memory | file
COFOUNDER_DASHBOARD_PATH=./data/dashboard.json

# ─── Enterprise ───────────────────────────────────────────────
COFOUNDER_LICENSE_KEY=...         # Required for enterprise features
COFOUNDER_SENTRY_DSN=https://...@sentry.io/...
SLACK_WEBHOOK=https://hooks.slack.com/services/...`}</pre>
          </div>
        </motion.section>

        {/* Per-Package Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Package className="mr-3 h-6 w-6 text-gradient-from" />
            Per-Package Configuration
          </h2>
          <p className="text-foreground-secondary mb-4">
            Each CoFounder package accepts its own configuration object. Here is a summary of key
            configuration options for the most commonly used packages.
          </p>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">@waymakerai/aicofounder-dashboard</h3>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{`import { createDashboard } from '@waymakerai/aicofounder-dashboard';

const dashboard = createDashboard({
  storage: 'file',                 // 'memory' | 'file' | StorageInterface
  storagePath: './data/events.json',
  maxEvents: 100000,
  flushIntervalMs: 5000,
  apiKey: process.env.COFOUNDER_DASHBOARD_API_KEY,
  corsOrigins: ['http://localhost:3000'],
  rateLimitPerMinute: 120,
  alerts: [
    { type: 'budget', enabled: true, thresholds: { daily: 50, monthly: 1000 } },
    { type: 'security', enabled: true },
    { type: 'compliance', enabled: true },
    { type: 'anomaly', enabled: true, thresholds: { stddev: 3 } },
  ],
});`}</pre>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-2">@waymakerai/aicofounder-ci</h3>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{`// .aicofounder.yml - CI scanner configuration
rules:
  no-hardcoded-keys:
    enabled: true
    severity: critical
  no-raw-env:
    enabled: true
    severity: high
  approved-models-only:
    enabled: true
    severity: medium
    options:
      models: ["claude-*", "gpt-4o*"]

scan:
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exclude: ["**/*.test.ts", "**/node_modules/**"]
  extensions: [".ts", ".tsx", ".js", ".jsx"]

models:
  approved: ["claude-sonnet-4-20250514", "gpt-4o"]
  blocked: ["gpt-3.5-turbo"]

budget:
  monthly: 2000
  perCall: 0.50

ignore:
  - "*.test.ts"
  - "fixtures/**"`}</pre>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-2">@waymakerai/aicofounder-testing</h3>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{`// cofounder.test.config.ts
import { defineTestConfig } from '@waymakerai/aicofounder-testing';

export default defineTestConfig({
  parallel: true,                  // Run tests in parallel
  timeout: 30000,                  // Global timeout per test
  maxCostPerTest: 0.10,            // Budget limit per test
  maxCostPerSuite: 1.00,           // Budget limit per suite
  semanticModel: 'text-embedding-3-small',
  snapshotDir: '__snapshots__',
  reporter: ['default', 'html'],
  retry: 2,                        // Retry flaky AI tests
});`}</pre>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-2">@waymakerai/aicofounder-soc2</h3>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{`import { SOC2ReportGenerator } from '@waymakerai/aicofounder-soc2';

const generator = new SOC2ReportGenerator({
  organizationName: 'Acme Corp',
  systemName: 'AI Customer Service Platform',
  systemDescription: 'Automated support with LLM-based agents',
  auditPeriod: {
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  trustServiceCategories: [
    'security',
    'availability',
    'processing_integrity',
    'confidentiality',
    'privacy',
  ],
  exportFormat: 'html',            // 'json' | 'html' | 'markdown'
  includeEvidence: true,
  includeTestResults: true,
  auditorName: 'Jane Doe, CPA',
  auditorFirm: 'Big Four Audit LLP',
});`}</pre>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CI Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Terminal className="mr-3 h-6 w-6 text-gradient-from" />
            Configuration Validation
          </h2>
          <p className="text-foreground-secondary mb-4">
            Validate your configuration files using the CLI before deploying.
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`# Validate .cofounder.yml
npx aicofounder check

# Validate with specific config path
npx aicofounder check --config ./configs/.cofounder.yml

# Validate and auto-fix issues
npx aicofounder fix

# Show current configuration summary
npx aicofounder status`}</pre>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link
            href="/docs"
            className="text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Documentation
          </Link>
          <Link
            href="/docs/integrations"
            className="btn-primary px-4 py-2 inline-flex items-center"
          >
            Integrations
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
