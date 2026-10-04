# @waymakerai/aicofounder-ci

CI/CD guardrails for AI applications. Scan your codebase for security, compliance, cost, and safety issues in AI/LLM code -- with zero runtime dependencies.

## Features

- **No Hardcoded Keys** - Detect API keys, secrets, and credentials (Anthropic, OpenAI, AWS, Groq, xAI)
- **No PII in Prompts** - Find personally identifiable information in prompt templates and test fixtures
- **No Injection Vulnerabilities** - Detect prompt injection patterns (string concatenation, f-strings, unsanitized input)
- **Approved Models** - Enforce an allowlist of approved LLM models, warn on deprecated models
- **Cost Estimation** - Estimate monthly costs from LLM calls found in code
- **Safe Defaults** - Check for unsafe configs (temperature > 2, missing max_tokens, missing system prompts)
- **Agent-Agnostic Pre-commit Hook** - Block secrets, unsafe `.env*` files, and mock data at commit time — works no matter which coding agent (or human) produced the diff, since it checks the commit boundary rather than integrating with any one agent's hook API

## Installation

```bash
npm install @waymakerai/aicofounder-ci --save-dev
```

## CLI Usage

```bash
# Scan current directory
npx aicofounder-ci scan

# Scan specific path with specific rules
npx aicofounder-ci scan ./src --rules no-hardcoded-keys,no-injection-vuln --format json

# Fail only on critical issues
npx aicofounder-ci scan . --fail-on critical

# Output SARIF for GitHub Security tab
npx aicofounder-ci scan . --format sarif > results.sarif

# Validate configuration
npx aicofounder-ci validate .cofounder.yml

# Scan and post to GitHub PR
npx aicofounder-ci check . --format github-pr
```

## Pre-commit hook (agent-agnostic protection)

The scanner above works against any codebase — it doesn't care whether the
diff came from a human, Claude Code, Cursor, Copilot, Aider, or any other
coding agent. `precommit` runs a focused Tier-1 subset (secrets,
`.env`-file safety, mock-data-in-prod warnings) against exactly what's
**staged** — not the working tree, so an unstaged edit on top of a staged
file can't hide or introduce a finding.

```bash
# One-time install: writes .git/hooks/pre-commit
npx aicofounder-ci install-hook

# Re-run to update; --force to overwrite a hook this tool didn't install
npx aicofounder-ci install-hook --force

# Run it manually against currently-staged files
npx aicofounder-ci precommit
```

The installed hook checks for a local `./node_modules/.bin/aicofounder-ci`
first (fast, no network) and falls back to `npx` if this package isn't a
project dependency. Bypass for one commit with `git commit --no-verify`
(the hook can't stop that — it's a git-level escape hatch, not a bug).

### Husky

```bash
npx husky init   # if not already set up
echo 'npx aicofounder-ci precommit' > .husky/pre-commit
```

### Lefthook

```yaml
# lefthook.yml
pre-commit:
  commands:
    cofounder:
      run: npx aicofounder-ci precommit
```

Only `install-hook` writes to `.git/hooks/pre-commit` directly — with
husky or lefthook already managing that file, just add the `npx
aicofounder-ci precommit` line as shown above instead of running
`install-hook` (which will refuse to overwrite a hook it didn't create,
to avoid clobbering your existing setup).

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
          approved-models: 'claude-sonnet-5,gpt-4o,gemini-2.0-flash'
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
    - claude-sonnet-5
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
import { scan, formatReport } from '@waymakerai/aicofounder-ci';

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
| `no-exposed-assets` | high | Detect source maps, build misconfigs, debug modes, sensitive files, API introspection, CORS, directory listing, CI/CD secret leaks |
| `no-unsafe-env-file` | critical | Block a staged `.env*` file that isn't `.env.local`/`.env.example`/`.env.sample`/`.env.template` |
| `no-mock-data-in-prod` | medium | Warn on a mock/fake-data identifier outside a test/fixture path |

`no-hardcoded-keys`, `no-unsafe-env-file`, and `no-mock-data-in-prod` also
make up `precommit`'s rule set (see above) — the other rules are scoped to
CoFounder's own LLM-usage conventions and don't apply to an arbitrary
downstream repo's pre-commit hook.

## License

MIT
