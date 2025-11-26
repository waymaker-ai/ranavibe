# Security Setup Guide for RANA/RANA Framework

## 🛡️ Protecting Your Repository from Malicious Contributions

This guide helps you set up security measures to accept community contributions safely.

---

## 1️⃣ GitHub Branch Protection

### Enable Branch Protection for `master`:

1. Go to: Settings → Branches → Add rule
2. Branch name pattern: `master` (or `main`)
3. Enable these settings:

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Status checks: (add after CI setup)
      - tests
      - build
      - security-scan

✅ Require conversation resolution before merging

✅ Require signed commits (optional but recommended)

✅ Require linear history

✅ Do not allow bypassing the above settings
   (even for admins - this protects YOU from mistakes)

✅ Restrict who can push to matching branches
   - Add only: @ashleykays, @christian (core team)
```

### Result:
- Nobody can push directly to master
- All changes go through PR review
- You approve everything before it merges

---

## 2️⃣ GitHub Actions CI/CD (Automated Security)

Create `.github/workflows/security.yml`:

```yaml
name: Security Checks

on:
  pull_request:
    branches: [master, main]
  push:
    branches: [master, main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Scan for secrets
      - name: Secret Scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

      # Dependency vulnerability scan
      - name: Run npm audit
        run: npm audit --audit-level=high

      # Check for malicious packages
      - name: Socket Security
        uses: SocketDev/socket-action@v1
        with:
          token: ${{ secrets.SOCKET_TOKEN }}

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run build
        run: npm run build

      - name: Lint
        run: npm run lint

  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check licenses
        uses: pilosus/action-pip-license-checker@v2
        with:
          requirements: 'package.json'
          fail-on: 'GPL,AGPL,LGPL'  # Block copyleft licenses
```

### Create `.github/workflows/pr-checks.yml`:

```yaml
name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-size-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR size
        uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const totalChanges = files.reduce((sum, file) =>
              sum + file.additions + file.deletions, 0
            );

            if (totalChanges > 1000) {
              core.setFailed('PR is too large (>1000 lines). Please split into smaller PRs.');
            }

  require-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Check for linked issue
        uses: actions/github-script@v7
        with:
          script: |
            const pr = context.payload.pull_request;
            const body = pr.body || '';

            const hasIssue = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#\d+/i.test(body);

            if (!hasIssue) {
              core.setFailed('PR must link to an issue using "Fixes #123"');
            }

  block-sensitive-files:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for sensitive file changes
        run: |
          # Block changes to sensitive files
          git diff --name-only origin/${{ github.base_ref }}..HEAD | \
          grep -E '(\.env$|\.key$|\.pem$|\.p12$|credentials|secrets)' && \
          echo "::error::PR contains changes to sensitive files" && exit 1 || exit 0
```

---

## 3️⃣ CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Code owners - these people must review PRs affecting these files

# Root files
/LICENSE @ashleykays @christian
/package.json @ashleykays @christian
/.github/ @ashleykays @christian

# Security-sensitive files
/tools/cli/src/commands/security.ts @ashleykays @christian
**/auth/** @ashleykays @christian
**/api/keys/** @ashleykays @christian

# Documentation
/docs/ @ashleykays @christian
/README.md @ashleykays @christian

# Templates (critical for users)
/templates/ @ashleykays @christian

# CLI (user-facing)
/tools/cli/ @ashleykays @christian
```

---

## 4️⃣ Dependabot Security Updates

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Enable security updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    reviewers:
      - "ashleykays"
      - "christian"
    labels:
      - "dependencies"
      - "security"
    # Auto-merge minor/patch security updates
    allow:
      - dependency-type: "all"

  # Check GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "ashleykays"
```

---

## 5️⃣ Security Policy (SECURITY.md already created ✅)

Your SECURITY.md is good! Make sure it's up to date.

---

## 6️⃣ Pull Request Template (already created ✅)

Your PR template is excellent! Keep it.

---

## 7️⃣ Issue Templates (already created ✅)

Your issue templates look good!

---

## 8️⃣ Pre-commit Hooks (Local Developer Protection)

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Prevent committing secrets
npx secretlint --secretlintrc .secretlintrc.json "**/*"

# Run tests before commit
npm test

# Lint code
npm run lint

# Check for console.logs in production code
if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -n 'console\.(log|debug|info)' ; then
    echo "❌ Error: Found console.log statements. Remove them before committing."
    exit 1
fi
```

Install husky:
```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit
```

---

## 9️⃣ npm Package Security (if publishing to npm)

### In `package.json`, add:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm test && npm audit",
    "preversion": "npm test",
    "postversion": "git push && git push --tags"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### Enable 2FA on npm:
```bash
npm profile enable-2fa auth-and-writes
```

---

## 🔟 Contributor License Agreement (CLA)

### Create `CLA.md`:

```markdown
# Contributor License Agreement

By contributing to RANA/RANA, you agree that:

1. **You own the code** you're contributing
2. **You grant us license** to use your contribution under the MIT License
3. **You haven't copied** code from proprietary sources
4. **You understand** we may modify or reject your contribution
5. **Your contribution** doesn't violate any third-party rights

To accept, add this to your first PR:

> I have read and agree to the Contributor License Agreement (CLA.md)

This protects both you and the project.
```

### Automate CLA with GitHub Action:

Create `.github/workflows/cla.yml`:

```yaml
name: CLA Assistant

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  cla-check:
    runs-on: ubuntu-latest
    steps:
      - uses: contributor-assistant/github-action@v2
        with:
          path-to-signatures: 'signatures/cla.json'
          path-to-document: 'CLA.md'
          branch: 'main'
          remote-organization-name: 'waymaker'
          remote-repository-name: 'cla-signatures'
```

---

## 1️⃣1️⃣ Rate Limiting (Protect from Spam PRs)

GitHub automatically rate-limits, but you can add:

### In PR template, add:

```markdown
## 🚦 Before Submitting

- [ ] I have read CONTRIBUTING.md
- [ ] I have searched existing issues/PRs
- [ ] I have tested my changes locally
- [ ] This PR does ONE thing (not multiple unrelated changes)
- [ ] I agree to the CLA
```

---

## 1️⃣2️⃣ Security Scanning Tools (Free for Open Source)

Enable these on your GitHub repo:

### Snyk (Free for Open Source)
1. Visit: https://snyk.io
2. Connect GitHub repo
3. Auto-scans for vulnerabilities

### Socket Security (Free for Open Source)
1. Visit: https://socket.dev
2. Connect GitHub repo
3. Detects supply chain attacks

### CodeQL (Free on GitHub)
1. Go to: Settings → Code security and analysis
2. Enable: "Code scanning"
3. Add CodeQL workflow

---

## 1️⃣3️⃣ Emergency Response Plan

### If malicious code gets merged:

```bash
# 1. Revert immediately
git revert <bad-commit-hash>
git push origin master

# 2. Force update if needed (DANGEROUS - only if critical)
git reset --hard <last-good-commit>
git push --force origin master

# 3. Notify users
# - Post GitHub Security Advisory
# - Email users
# - Update README with security notice

# 4. Review what happened
# - How did it get through?
# - Update protections
# - Ban malicious contributor
```

---

## 1️⃣4️⃣ Monitoring & Alerts

### GitHub: Enable Security Alerts

Settings → Code security and analysis:
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Dependabot version updates
- ✅ Code scanning (CodeQL)
- ✅ Secret scanning
- ✅ Secret scanning push protection

### Email Notifications

Ensure you get emails for:
- Security advisories
- New PRs
- Failed CI checks
- Dependabot alerts

---

## ✅ Quick Setup Checklist

```bash
# 1. Create GitHub Actions
mkdir -p .github/workflows
# Copy security.yml and pr-checks.yml from above

# 2. Create CODEOWNERS
# Copy from above

# 3. Create dependabot.yml
# Copy from above

# 4. Enable branch protection
# Go to GitHub Settings → Branches → Add rule

# 5. Enable security features
# Go to GitHub Settings → Code security and analysis → Enable all

# 6. Set up pre-commit hooks
npm install -D husky
npx husky install

# 7. Test it!
# Create a test PR and verify:
# - CI runs
# - Review is required
# - Can't merge without approval
```

---

## 🎓 Training for Reviewers (You!)

### When reviewing PRs, check for:

1. **Malicious code:**
   - Unusual network requests
   - File system access (reading sensitive files)
   - Process execution (child_process)
   - Obfuscated code
   - Suspicious dependencies

2. **Breaking changes:**
   - API changes without docs
   - Removed features
   - Changed behavior

3. **Quality:**
   - Tests included
   - Documentation updated
   - Follows code style
   - No console.logs

4. **Scope:**
   - Does ONE thing
   - Small enough to review (<500 lines)
   - Related to linked issue

### Red Flags:

- 🚩 PR from new account (<1 month old)
- 🚩 Changes to `.github/workflows` (CI bypass attempt)
- 🚩 Changes to `package.json` dependencies
- 🚩 Obfuscated or minified code
- 🚩 Very large PRs (>1000 lines)
- 🚩 Unrelated changes bundled together
- 🚩 No tests included
- 🚩 Changes to auth/security code
- 🚩 New external API calls
- 🚩 File system operations

---

## 🚀 You're Protected!

With these safeguards:

✅ No direct pushes to master
✅ All code reviewed by you
✅ Automated security scans
✅ Dependency vulnerability checks
✅ Secret detection
✅ CLA enforcement
✅ Size limits on PRs
✅ Pre-commit hooks
✅ Monitoring and alerts

**Result: Safe, secure, community-friendly repository!**

---

## 📧 Questions?

- Email: security@waymaker.ai
- GitHub Security Advisories: Use for reporting vulnerabilities

**Built with care by Waymaker ❤️**
