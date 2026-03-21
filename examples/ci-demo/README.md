# ci-demo

Demonstrates `@ranavibe/ci` for CI/CD guardrails:

- **Available rules** listing all built-in scan rules (hardcoded keys, PII in prompts, injection vulnerabilities, model approval, cost estimation, safe defaults)
- **Programmatic scan** running a full codebase scan from TypeScript
- **Multiple report formats** -- console, JSON, Markdown, and SARIF
- **GitHub Actions workflow** at `.github/workflows/rana.yml`

## Run the demo

```bash
pnpm install
pnpm start
```

## GitHub Actions Workflow

The `.github/workflows/rana.yml` file shows a complete CI pipeline that:

1. Runs the RANA scan on every push to main and every PR
2. Uploads SARIF results to GitHub Code Scanning
3. Posts a PR comment with findings
4. Fails the build if high or critical issues are found

To use it in your own repo, copy the workflow file and optionally add a `.rana.yml` config file to your repo root.

## .rana.yml example

```yaml
models:
  approved:
    - claude-sonnet-4-6
    - gpt-4o
    - gpt-4o-mini
budget:
  monthly: 500
rules:
  - no-hardcoded-keys
  - no-pii-in-prompts
  - no-injection-vuln
  - approved-models
  - cost-estimation
  - safe-defaults
ignore:
  - node_modules
  - dist
  - "*.test.ts"
```
