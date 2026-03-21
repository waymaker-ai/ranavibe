# @cofounder/ci

CI/CD guardrails for AI applications. Scan your codebase for security, compliance, cost, and safety issues in AI/LLM code -- with zero runtime dependencies.

## Features

- **No Hardcoded Keys** - Detect API keys, secrets, and credentials (Anthropic, OpenAI, AWS, Groq, xAI)
- **No PII in Prompts** - Find personally identifiable information in prompt templates and test fixtures
- **No Injection Vulnerabilities** - Detect prompt injection patterns (string concatenation, f-strings, unsanitized input)
- **Approved Models** - Enforce an allowlist of approved LLM models, warn on deprecated models
- **Cost Estimation** - Estimate monthly costs from LLM calls found in code
- **Safe Defaults** - Check for unsafe configs (temperature > 2, missing max_tokens, missing system prompts)

## Installation

```bash
npm install @cofounder/ci --save-dev
```

## CLI Usage

```bash
# Scan current directory
npx cofounder-ci scan

# Scan specific path with specific rules
npx cofounder-ci scan ./src --rules no-hardcoded-keys,no-injection-vuln --format json

# Fail only on critical issues
npx cofounder-ci scan . --fail-on critical

# Output SARIF for GitHub Security tab
npx cofounder-ci scan . --format sarif > results.sarif

# Validate configuration
npx cofounder-ci validate .cofounder.yml

# Scan and post to GitHub PR
npx cofounder-ci check . --format github-pr
```

## GitHub Action Usage

```yaml
name: AI Guardrails
on:
  pull_request:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: CoFounder CI Scan
        uses: waymaker-ai/cofounder/packages/ci@v1
        with:
          scan-path: '.'
          rules: 'all'
          fail-on: 'high'
          config: '.cofounder.yml'
          comment-on-pr: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          approved-models: 'claude-sonnet-4-20250514,gpt-4o,gemini-2.0-flash'
          budget-limit: '500'
```

### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `scan-path` | Path to scan | `.` |
| `rules` | Comma-separated rules to enable | `all` |
| `fail-on` | Severity to fail on (`critical`, `high`, `medium`, `low`, `none`) | `high` |
| `config` | Path to `.cofounder.yml` config | `.cofounder.yml` |
| `comment-on-pr` | Whether to comment on PRs with results | `true` |
| `github-token` | GitHub token for PR comments | `${{ github.token }}` |
| `approved-models` | Comma-separated list of approved models | _(all common models)_ |
| `budget-limit` | Monthly budget limit in USD | _(none)_ |

### Action Outputs

| Output | Description |
|--------|-------------|
| `findings` | Number of findings |
| `critical` | Number of critical findings |
| `passed` | Whether the scan passed |

## Configuration (.cofounder.yml)

```yaml
rules:
  no-hardcoded-keys:
    enabled: true
    severity: critical
  no-pii-in-prompts:
    enabled: true
    severity: high
  approved-models:
    enabled: true
    severity: medium

scan:
  exclude:
    - "dist"
    - "node_modules"
    - "*.test.ts"

models:
  approved:
    - claude-sonnet-4-20250514
    - gpt-4o
    - gemini-2.0-flash
  blocked:
    - text-davinci-003

budget:
  monthly: 500
  perCall: 0.05

ignore:
  - "*.md"
  - "docs/"
```

## .cofounderignore

Create a `.cofounderignore` file in your project root (gitignore-style syntax):

```
# Ignore test fixtures with intentional secrets
test/fixtures/
*.test.ts

# Ignore generated files
dist/
build/
```

## Output Formats

- **console** - ANSI-colored terminal output (default)
- **json** - Machine-readable JSON
- **sarif** - SARIF 2.1.0 for GitHub Security tab
- **markdown** - Markdown report
- **github-pr** - GitHub PR comment with tables and expandable details

## Programmatic Usage

```typescript
import { scan, formatReport } from '@cofounder/ci';

const result = scan({
  scanPath: './src',
  rules: 'all',
  failOn: 'high',
  format: 'json',
  ignorePatterns: [],
  commentOnPr: false,
});

console.log(`Found ${result.findings.length} issues`);
console.log(`Passed: ${result.passed}`);

const report = formatReport(result, 'json');
console.log(report);
```

## Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-hardcoded-keys` | critical | Detect hardcoded API keys and secrets |
| `no-pii-in-prompts` | high | Detect PII in prompt templates |
| `no-injection-vuln` | critical | Detect prompt injection vulnerabilities |
| `approved-models` | medium | Enforce approved model list |
| `cost-estimation` | medium | Estimate LLM usage costs |
| `safe-defaults` | medium | Check for unsafe LLM configurations |

## License

MIT
