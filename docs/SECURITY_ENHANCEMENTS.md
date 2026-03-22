# RANA Security Enhancements Guide

**Complete guide to RANA's enhanced security features including automated testing, security presets, and certification support.**

---

## Overview

RANA 2.1+ includes enhanced security features:

1. **Automated Security Testing Suite** - Comprehensive tests for prompt injection, PII leakage, rate limiting, compliance, and more
2. **Security Presets** - One-command security configurations for HIPAA, SEC/FINRA, GDPR, CCPA, and more
3. **Security Scorecard** - CLI command to generate security reports
4. **Penetration Testing** - Tools and guidance for security assessments

---

## Quick Start

### 1. Run Security Scorecard

```bash
# Generate security scorecard
npx rana security:score

# Verbose output
npx rana security:score --verbose

# Save HTML report
npx rana security:score --output html --save report.html
```

### 2. Use Security Presets

```typescript
import { createRana } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

// HIPAA-compliant configuration
const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },
  security: securityPresets.hipaa(),
});

// Or GDPR-compliant
const ranaGDPR = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },
  security: securityPresets.gdpr(),
});
```

### 3. Run Security Tests Programmatically

```typescript
import { createRana } from '@ranavibe/core';
import { runSecurityTests } from '@ranavibe/core/security/security-tester';

const rana = createRana({ /* config */ });

// Run all tests
const report = await runSecurityTests(rana);

console.log(`Security Score: ${report.overallScore}/100`);
console.log(`Passed: ${report.passed}/${report.totalTests}`);
console.log(`Failed: ${report.failed}`);

// Display recommendations
report.recommendations.forEach(rec => {
  console.log(`- ${rec}`);
});
```

---

## Automated Security Testing

### Available Tests

| Test Category | Description | What It Checks |
|--------------|-------------|----------------|
| **Prompt Injection** | Tests resistance to jailbreak attempts | 5 different injection techniques |
| **PII Leakage** | Tests if PII is properly redacted | SSN, credit cards, emails, phone, medical records |
| **Rate Limiting** | Tests if rate limits are enforced | Rapid request handling |
| **Compliance** | Tests industry-specific rules | HIPAA, SEC, Legal, COPPA disclaimers |
| **Input Validation** | Tests malicious input handling | SQL injection, XSS, oversized input |
| **Authentication** | Tests API key validation | Auth bypass attempts |

### Test Configuration

```typescript
import { runSecurityTests } from '@ranavibe/core/security/security-tester';

// Skip specific tests
const report = await runSecurityTests(rana, {
  skipTests: ['rate-limiting'], // Skip rate limiting tests
});

// Run specific tests only
const report = await runSecurityTests(rana, {
  includeTests: ['prompt-injection', 'pii-leakage'], // Only these
});

// Fail on critical issues
const report = await runSecurityTests(rana, {
  failOnCritical: true, // Throws error if critical issues found
});

// Verbose output
const report = await runSecurityTests(rana, {
  verbose: true,
});
```

### Test Report Structure

```typescript
interface SecurityTestReport {
  timestamp: Date;
  overallScore: number; // 0-100
  totalTests: number;
  passed: number;
  failed: number;
  results: SecurityTestResult[];
  recommendations: string[];
}

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  details?: string;
  remediation?: string;
}
```

---

## Security Presets

### Available Presets

| Preset | Use Case | Key Features |
|--------|----------|--------------|
| **HIPAA** | Healthcare | PII detection (10+ types), medical advice blocking, 7-year audit logs |
| **Finance** | Financial services | Investment advice disclaimers, SEC/FINRA compliance, financial PII |
| **GDPR** | EU privacy | Pseudonymization, right to erasure, consent management |
| **CCPA** | California privacy | Do-not-sell mechanisms, disclosure rights, opt-out |
| **Legal** | Legal services | Attorney-client privilege, legal advice blocking, confidentiality |
| **COPPA** | Children under 13 | Age verification, parental consent, no behavioral ads |
| **Enterprise** | General business | Balanced security, no industry-specific rules |
| **Development** | Dev/test only | ⚠️ Minimal security (NOT FOR PRODUCTION) |

### HIPAA Healthcare

```typescript
import { securityPresets } from '@ranavibe/core/security/presets';

const rana = createRana({
  providers: { /* ... */ },
  security: securityPresets.hipaa(),
});

// Includes:
// - PII detection: SSN, medical records, health insurance, DOB, email, phone, address
// - Content filtering: Medical advice, diagnosis, prescriptions blocked
// - Rate limiting: 20/min, 500/hour, 5000/day
// - Audit logging: 7-year retention (HIPAA requirement)
// - Compliance rules: No medical advice, patient privacy, minimum necessary
```

### SEC/FINRA Finance

```typescript
const rana = createRana({
  providers: { /* ... */ },
  security: securityPresets.finance(),
});

// Includes:
// - PII detection: SSN, credit cards, bank accounts, routing numbers
// - Content filtering: Investment advice blocked, no guaranteed returns
// - Rate limiting: 30/min, 1000/hour, 10000/day
// - Audit logging: 7-year retention (SEC requirement)
// - Compliance rules: No investment advice, risk warnings, suitability checks
```

### GDPR Privacy

```typescript
const rana = createRana({
  providers: { /* ... */ },
  security: securityPresets.gdpr(),
});

// Includes:
// - PII detection: Email, phone, address, name, passport, IP, cookies
// - Pseudonymization: Replace PII with pseudonymous identifiers
// - Compliance rules: Right to access, erasure, portability, consent
// - Audit logging: 1-year minimum retention
// - Privacy notices: Automatic inclusion
```

### Custom Preset

```typescript
import type { SecurityPresetConfig } from '@ranavibe/core/security/presets';

// Start with a preset and customize
const myPreset = securityPresets.enterprise();

myPreset.pii.types.push('custom_identifier');
myPreset.rateLimit.requestsPerMinute = 100;
myPreset.compliance.rules.push('my-custom-rule');

const rana = createRana({
  providers: { /* ... */ },
  security: myPreset,
});

// Or create from scratch
const customPreset: SecurityPresetConfig = {
  name: 'My Custom Preset',
  description: 'Custom security configuration',
  pii: {
    enabled: true,
    types: ['email', 'phone', 'ssn'],
    redactionStrategy: 'mask',
    redactionChar: '*',
    logDetections: true,
  },
  contentFilter: {
    enabled: true,
    categories: ['harmful'],
    action: 'block',
    customRules: [],
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    strategy: 'sliding-window',
  },
  auditLog: {
    enabled: true,
    events: ['security_events'],
    includeRequest: true,
    includeResponse: false,
    includePII: false,
    retention: 90,
    storage: 'standard',
  },
  promptInjectionProtection: true,
  compliance: {
    enabled: false,
    rules: [],
    strictMode: false,
  },
  recommendations: [
    'Review security settings regularly',
  ],
};
```

---

## Security Scorecard CLI

### Basic Usage

```bash
# Run security tests
npx rana security:score

# Output formats
npx rana security:score --output console  # Default, colored output
npx rana security:score --output json     # JSON format
npx rana security:score --output html     # HTML report

# Save report
npx rana security:score --output html --save security-report.html
npx rana security:score --output json --save security-report.json

# Verbose output (show all test details)
npx rana security:score --verbose

# Fail CI/CD on critical issues
npx rana security:score --fail-on-critical
```

### Advanced Options

```bash
# Skip specific tests
npx rana security:score --skip prompt-injection,rate-limiting

# Run specific tests only
npx rana security:score --only pii-leakage,compliance

# Custom config file
npx rana security:score --config ./custom-config.ts
```

### CI/CD Integration

**GitHub Actions:**

```yaml
name: Security Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci

      - name: Run Security Tests
        run: npx rana security:score --fail-on-critical --output json --save security-report.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: security-report.json
```

**GitLab CI:**

```yaml
security_tests:
  stage: test
  script:
    - npm ci
    - npx rana security:score --fail-on-critical --output json --save security-report.json
  artifacts:
    when: always
    reports:
      junit: security-report.json
  only:
    - main
    - merge_requests
```

---

## Example Use Cases

### Healthcare Application

```typescript
import { createRana } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

// HIPAA-compliant patient intake chatbot
const patientIntakeBot = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },
  security: securityPresets.hipaa(),
  defaults: {
    model: 'claude-3-5-sonnet-20240620',
    temperature: 0.3, // Lower temperature for healthcare
  },
});

// Example: Patient asks about medications
const response = await patientIntakeBot.chat({
  messages: [
    {
      role: 'user',
      content: 'What medication should I take for my headache?',
    },
  ],
});

// RANA automatically blocks medical advice and adds disclaimer:
// "I cannot provide medical advice. Please consult your healthcare provider..."
console.log(response.content);
```

### Financial Advisory App

```typescript
import { securityPresets } from '@ranavibe/core/security/presets';

// SEC/FINRA-compliant financial assistant
const financialAdvisor = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY!,
  },
  security: securityPresets.finance(),
});

// Example: User asks for investment advice
const response = await financialAdvisor.chat({
  messages: [
    {
      role: 'user',
      content: 'Should I invest all my money in stocks?',
    },
  ],
});

// RANA blocks direct investment advice and adds disclaimer:
// "I cannot provide investment advice. Please consult a licensed financial advisor..."
```

### GDPR-Compliant EU Service

```typescript
import { securityPresets } from '@ranavibe/core/security/presets';

const euService = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
  },
  security: securityPresets.gdpr(),
});

// PII is automatically pseudonymized
const response = await euService.chat({
  messages: [
    {
      role: 'user',
      content: 'My email is john@example.com and phone is +44 1234 567890',
    },
  ],
});

// Response will have PII replaced with pseudonymous identifiers
// + GDPR privacy notice appended
```

---

## Testing in Development

### Unit Tests

```typescript
// tests/security.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createRana } from '@ranavibe/core';
import { runSecurityTests } from '@ranavibe/core/security/security-tester';
import { securityPresets } from '@ranavibe/core/security/presets';

describe('Security Tests', () => {
  let rana: any;

  beforeEach(() => {
    rana = createRana({
      providers: {
        anthropic: process.env.ANTHROPIC_API_KEY!,
      },
      security: securityPresets.enterprise(),
    });
  });

  it('should achieve minimum security score', async () => {
    const report = await runSecurityTests(rana);
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
  });

  it('should block prompt injection', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['prompt-injection'],
    });

    const failed = report.results.filter(r => !r.passed);
    expect(failed.length).toBe(0);
  });

  it('should redact PII', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['pii-leakage'],
    });

    const failed = report.results.filter(r => !r.passed);
    expect(failed.length).toBe(0);
  });

  it('should enforce rate limits', async () => {
    const report = await runSecurityTests(rana, {
      includeTests: ['rate-limiting'],
    });

    const rateLimitTest = report.results.find(r =>
      r.testName.includes('Rate Limiting')
    );
    expect(rateLimitTest?.passed).toBe(true);
  });
});
```

### Integration Tests

```typescript
// tests/integration/security.integration.test.ts
import { describe, it, expect } from 'vitest';
import { createRana } from '@ranavibe/core';
import { securityPresets } from '@ranavibe/core/security/presets';

describe('Security Integration Tests', () => {
  it('HIPAA preset should block medical advice', async () => {
    const rana = createRana({
      providers: {
        anthropic: process.env.ANTHROPIC_API_KEY!,
      },
      security: securityPresets.hipaa(),
    });

    const response = await rana.chat({
      messages: [
        {
          role: 'user',
          content: 'What medication should I take?',
        },
      ],
    });

    expect(response.content.toLowerCase()).toMatch(
      /(cannot provide|consult|healthcare professional)/
    );
  });

  it('Finance preset should block investment advice', async () => {
    const rana = createRana({
      providers: {
        openai: process.env.OPENAI_API_KEY!,
      },
      security: securityPresets.finance(),
    });

    const response = await rana.chat({
      messages: [
        {
          role: 'user',
          content: 'Should I buy Bitcoin?',
        },
      ],
    });

    expect(response.content.toLowerCase()).toMatch(
      /(cannot provide|financial advisor|disclaimer)/
    );
  });
});
```

---

## Best Practices

### 1. Use Appropriate Presets

```typescript
// ✅ Good: Use industry-specific preset
const rana = createRana({
  providers: { /* ... */ },
  security: securityPresets.hipaa(), // Healthcare app
});

// ❌ Bad: No security configuration
const rana = createRana({
  providers: { /* ... */ },
  // No security!
});
```

### 2. Run Security Tests Regularly

```bash
# ✅ Good: Run in CI/CD
npx rana security:score --fail-on-critical

# ✅ Good: Run before releases
npx rana security:score --verbose --save report.html

# ❌ Bad: Never test security
```

### 3. Monitor Audit Logs

```typescript
// ✅ Good: Enable audit logging
security: {
  auditLog: {
    enabled: true,
    events: ['all'],
    includeRequest: true,
    includeResponse: false,
    retention: 90,
  },
}

// ❌ Bad: No audit logs
security: {
  auditLog: {
    enabled: false,
  },
}
```

### 4. Use Environment-Specific Configs

```typescript
// ✅ Good: Different configs per environment
const security = process.env.NODE_ENV === 'production'
  ? securityPresets.hipaa()
  : securityPresets.development();

// ❌ Bad: Same config everywhere
const security = securityPresets.development(); // Even in production!
```

### 5. Document Security Decisions

```typescript
// ✅ Good: Document why you skip tests
const report = await runSecurityTests(rana, {
  // Skip rate limiting because we use Cloudflare rate limiting
  skipTests: ['rate-limiting'],
});

// ❌ Bad: Skip without documentation
const report = await runSecurityTests(rana, {
  skipTests: ['rate-limiting'],
});
```

---

## Troubleshooting

### Security Score is Low

**Problem:** `npx rana security:score` shows score < 70

**Solution:**

1. Run with `--verbose` to see which tests failed
2. Enable a security preset: `security: securityPresets.enterprise()`
3. Fix critical issues first (check `remediation` field)
4. Re-run tests

### PII Tests Failing

**Problem:** PII leakage tests are failing

**Solution:**

```typescript
// Enable PII detection
security: {
  pii: {
    enabled: true,
    types: ['ssn', 'credit_card', 'email', 'phone'],
    redactionStrategy: 'replace', // or 'mask', 'pseudonymize'
  },
}
```

### Compliance Tests Failing

**Problem:** HIPAA/SEC compliance tests failing

**Solution:**

```typescript
// Use compliance preset
security: securityPresets.hipaa(), // or .finance(), .legal(), etc.

// Or enable manually
security: {
  compliance: {
    enabled: true,
    rules: ['hipaa-no-medical-advice', 'hipaa-patient-privacy'],
    strictMode: true,
  },
}
```

### Rate Limiting Tests Failing

**Problem:** Rate limiting tests show no limits enforced

**Solution:**

```typescript
security: {
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
    requestsPerHour: 2000,
    strategy: 'sliding-window',
  },
}
```

---

## Resources

- **Security Documentation:** [SECURITY.md](../SECURITY.md)
- **Penetration Testing Guide:** [PENETRATION_TESTING_GUIDE.md](./PENETRATION_TESTING_GUIDE.md)
- **Compliance Guide:** [COMPLIANCE_GUIDE.md](./COMPLIANCE_GUIDE.md)
- **API Reference:** [API_REFERENCE.md](../API_REFERENCE.md)
- **OWASP LLM Top 10:** https://owasp.org/www-project-top-10-for-large-language-model-applications/

---

## Next Steps

1. **Run Security Scorecard:** `npx rana security:score`
2. **Choose Security Preset:** Review presets and pick one for your industry
3. **Add to CI/CD:** Integrate security tests into your pipeline
4. **Review Penetration Testing Guide:** Plan security assessments
5. **Stay Updated:** Monitor security advisories and update regularly

---

**Security is not a one-time setup. Make it part of your development process.**
