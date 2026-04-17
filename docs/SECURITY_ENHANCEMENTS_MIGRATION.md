# Security Enhancements Migration Guide

**Version:** RANA 2.1+
**Date:** January 2026
**Type:** Non-Breaking Addition (No migrations required)

---

## Overview

This guide covers how to adopt RANA's new security enhancements including automated testing, security presets, and the security scorecard CLI command.

**Good News:** No database migrations or breaking changes. These are additive features that are 100% backward compatible.

---

## Prerequisites

- RANA 2.1 or higher
- Node.js 18+
- pnpm 8+ (or npm/yarn)

---

## Step 1: Rebuild Packages

Since new TypeScript files were added, you need to rebuild:

### Option A: Rebuild Everything (Recommended)

```bash
# From repository root
pnpm build
```

### Option B: Rebuild Specific Packages

```bash
# Build core package (security modules)
pnpm --filter @ranavibe/core build

# Build CLI package (security:score command)
pnpm --filter @ranavibe/cli build
```

### Option C: Development Mode

```bash
# Watch mode for active development
pnpm --filter @ranavibe/core dev
pnpm --filter @ranavibe/cli dev
```

---

## Step 2: Verify Installation

Test that the new features are available:

### Test CLI Command

```bash
# Should show help for security:score command
npx rana security:score --help

# Expected output:
# Usage: rana security:score [options]
# Run security tests and generate a security scorecard
# ...
```

### Test Security Presets

```bash
# Test in Node.js
node --input-type=module -e "
import { listPresets } from '@ranavibe/core/security/presets';
console.log('Available presets:', listPresets());
"
```

Expected output:
```json
[
  { "name": "hipaa", "description": "HIPAA-compliant configuration..." },
  { "name": "finance", "description": "SEC/FINRA-compliant configuration..." },
  { "name": "gdpr", "description": "GDPR-compliant configuration..." },
  ...
]
```

### Test Security Testing Suite

```bash
# Create a test file
cat > test-security.mjs << 'EOF'
import { createRana } from '@ranavibe/core';
import { runSecurityTests } from '@ranavibe/core/security/security-tester';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
});

const report = await runSecurityTests(rana, {
  includeTests: ['prompt-injection'], // Just test one category
});

console.log(`Security Score: ${report.overallScore}/100`);
console.log(`Passed: ${report.passed}/${report.totalTests}`);
EOF

# Run it
node test-security.mjs
```

---

## Step 3: Adopt Security Features (Optional)

You can start using the new security features gradually. **Nothing is required** - all features are opt-in.

### Option 1: Quick Start with Security Presets

Add a security preset to your existing config:

```typescript
// rana.config.ts
import { defineConfig } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    openai: process.env.OPENAI_API_KEY!,
  },

  // Add security preset
  security: securityPresets.enterprise(), // Start with this
});
```

**Choose the right preset for your industry:**

```typescript
// Healthcare/Medical
security: securityPresets.hipaa()

// Financial Services
security: securityPresets.finance()

// EU Privacy (GDPR)
security: securityPresets.gdpr()

// California Privacy (CCPA)
security: securityPresets.ccpa()

// Legal Services
security: securityPresets.legal()

// Apps for Children
security: securityPresets.coppa()

// General Enterprise
security: securityPresets.enterprise()

// Development/Testing ONLY
security: securityPresets.development()
```

### Option 2: Custom Security Configuration

Start with a preset and customize:

```typescript
import { securityPresets } from '@ranavibe/core/security/presets';

const mySecurityConfig = securityPresets.enterprise();

// Customize PII detection
mySecurityConfig.pii.types.push('employee_id', 'customer_id');
mySecurityConfig.pii.redactionStrategy = 'mask'; // or 'replace', 'pseudonymize'

// Customize rate limiting
mySecurityConfig.rateLimit.requestsPerMinute = 100;
mySecurityConfig.rateLimit.requestsPerHour = 5000;

// Add custom compliance rules
mySecurityConfig.compliance.enabled = true;
mySecurityConfig.compliance.rules.push('my-custom-rule');

export default defineConfig({
  providers: { /* ... */ },
  security: mySecurityConfig,
});
```

### Option 3: Gradual Adoption (No Changes)

You can use RANA exactly as before. Security features are opt-in:

```typescript
// Your existing config works fine
export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },
  // No security config needed
});
```

---

## Step 4: Add Security Testing to CI/CD

### GitHub Actions

Add to `.github/workflows/security.yml`:

```yaml
name: Security Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Security Tests
        run: npx rana security:score --fail-on-critical --output json --save security-report.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: security-report.json

      - name: Comment PR with Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('security-report.json', 'utf8'));

            const comment = `
            ## 🛡️ Security Test Results

            **Overall Score:** ${report.overallScore}/100
            **Tests:** ${report.passed}/${report.totalTests} passed

            ${report.recommendations.map(r => `- ${r}`).join('\n')}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
security_tests:
  stage: test
  image: node:18
  script:
    - npm ci
    - npx rana security:score --fail-on-critical --output json --save security-report.json
  artifacts:
    when: always
    reports:
      junit: security-report.json
    paths:
      - security-report.json
  only:
    - main
    - merge_requests
```

### CircleCI

Add to `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  security_tests:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install Dependencies
          command: npm ci
      - run:
          name: Run Security Tests
          command: npx rana security:score --fail-on-critical --output json --save security-report.json
      - store_artifacts:
          path: security-report.json
          destination: security-report

workflows:
  version: 2
  test:
    jobs:
      - security_tests
```

---

## Step 5: Add Security Tests to Your Test Suite

### Unit Tests with Vitest

```typescript
// tests/security.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createRana } from '@ranavibe/core';
import { runSecurityTests } from '@ranavibe/core/security/security-tester';
import { securityPresets } from '@ranavibe/core/security/presets';

describe('RANA Security Tests', () => {
  let rana: any;

  beforeEach(() => {
    rana = createRana({
      providers: {
        anthropic: process.env.ANTHROPIC_API_KEY!,
      },
      security: securityPresets.enterprise(),
    });
  });

  it('should achieve minimum security score of 80', async () => {
    const report = await runSecurityTests(rana);
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
  }, 30000); // 30 second timeout

  it('should block all prompt injection attempts', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['prompt-injection'],
    });

    const failed = report.results.filter(r => !r.passed);
    expect(failed).toHaveLength(0);
  }, 30000);

  it('should redact all PII', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['pii-leakage'],
    });

    const failed = report.results.filter(r => !r.passed);
    expect(failed).toHaveLength(0);
  }, 30000);

  it('should enforce rate limits', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['rate-limiting'],
    });

    const rateLimitTest = report.results.find(r =>
      r.testName.includes('Rate Limiting')
    );
    expect(rateLimitTest?.passed).toBe(true);
  }, 30000);
});
```

### Add to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:security": "vitest run tests/security.test.ts",
    "security:score": "rana security:score",
    "security:report": "rana security:score --output html --save security-report.html"
  }
}
```

---

## Step 6: Generate Your First Security Report

### Console Report

```bash
# Basic report (console output)
npx rana security:score

# Verbose (shows all test details)
npx rana security:score --verbose
```

### HTML Report

```bash
# Generate HTML report
npx rana security:score --output html --save security-report.html

# Open in browser
open security-report.html  # macOS
xdg-open security-report.html  # Linux
start security-report.html  # Windows
```

### JSON Report

```bash
# Generate JSON report (for CI/CD)
npx rana security:score --output json --save security-report.json

# View with jq
cat security-report.json | jq '.overallScore'
cat security-report.json | jq '.recommendations'
```

---

## Common Usage Patterns

### Pattern 1: Healthcare Application

```typescript
// config/rana.config.ts
import { defineConfig } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },

  // HIPAA-compliant out of the box
  security: securityPresets.hipaa(),

  defaults: {
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.3, // Lower for healthcare
  },
});
```

### Pattern 2: Financial Advisory

```typescript
import { defineConfig } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

export default defineConfig({
  providers: {
    openai: process.env.OPENAI_API_KEY!,
  },

  // SEC/FINRA-compliant
  security: securityPresets.finance(),

  defaults: {
    model: 'gpt-4o',
  },
});
```

### Pattern 3: Multi-Region SaaS

```typescript
import { defineConfig } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

// Choose preset based on user region
const getSecurityPreset = (region: string) => {
  switch (region) {
    case 'EU':
      return securityPresets.gdpr();
    case 'US-CA':
      return securityPresets.ccpa();
    default:
      return securityPresets.enterprise();
  }
};

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },

  security: getSecurityPreset(process.env.USER_REGION || 'default'),
});
```

### Pattern 4: Development vs Production

```typescript
import { defineConfig } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },

  // Minimal security in dev, full security in prod
  security: isDevelopment
    ? securityPresets.development()
    : securityPresets.enterprise(),
});
```

---

## Troubleshooting

### Issue: `Cannot find module '@ranavibe/core/security/presets'`

**Solution:** Rebuild the core package:

```bash
pnpm --filter @ranavibe/core build
```

### Issue: `rana security:score` command not found

**Solution:** Rebuild the CLI package:

```bash
pnpm --filter @ranavibe/cli build

# Or reinstall globally
npm uninstall -g @ranavibe/cli
npm install -g @ranavibe/cli
```

### Issue: Security tests timing out

**Solution:** Increase timeout in test config:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000, // 60 seconds
  },
});
```

### Issue: Low security score

**Solution:** Enable a security preset:

```typescript
import { securityPresets } from '@ranavibe/core/security/presets';

const rana = createRana({
  providers: { /* ... */ },
  security: securityPresets.enterprise(), // This will boost your score
});
```

### Issue: TypeScript errors with new imports

**Solution:** Ensure TypeScript can find the new exports:

```typescript
// Check your tsconfig.json includes:
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

## Rollback Instructions (If Needed)

If you need to rollback (though there's no breaking changes):

### Option 1: Don't Use New Features

Simply don't add security presets or run security tests. Everything else continues to work as before.

### Option 2: Revert Files

```bash
# Revert to previous version
git checkout HEAD~1 packages/core/src/security/security-tester.ts
git checkout HEAD~1 packages/core/src/security/presets.ts
git checkout HEAD~1 packages/cli/src/commands/security-score.ts

# Rebuild
pnpm build
```

### Option 3: Use Previous Package Version

```bash
# If packages were published, use previous version
npm install @ranavibe/core@2.0.0
npm install @ranavibe/cli@1.0.0
```

---

## What's Next?

After completing this migration:

1. ✅ **Run your first security scan:** `npx rana security:score`
2. ✅ **Choose a security preset** for your industry
3. ✅ **Add security tests to CI/CD**
4. ✅ **Review documentation:**
   - [Security Enhancements Guide](./SECURITY_ENHANCEMENTS.md)
   - [Penetration Testing Guide](./PENETRATION_TESTING_GUIDE.md)
5. ✅ **Share your security score** with your team

---

## Resources

- **Security Enhancements Guide:** [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md)
- **Penetration Testing Guide:** [PENETRATION_TESTING_GUIDE.md](./PENETRATION_TESTING_GUIDE.md)
- **Security Policy:** [SECURITY.md](../SECURITY.md)
- **API Reference:** [API_REFERENCE.md](../API_REFERENCE.md)

---

## Support

**Questions?**
- GitHub Issues: https://github.com/waymaker-ai/ranavibe/issues
- Discussions: https://github.com/waymaker-ai/ranavibe/discussions
- Email: security@waymaker.ai

---

**Migration Status:** ✅ Complete
**Breaking Changes:** None
**Action Required:** Optional (opt-in features)
**Estimated Time:** 5-10 minutes
