# @rana/compliance

> Enterprise compliance enforcement for RANA agents - Healthcare, Finance, Privacy, Security

## Features

✅ **HIPAA Compliance** - Healthcare data protection and medical advice prevention
💰 **SEC/FINRA Compliance** - Financial disclaimers and investment advice rules
⚖️ **Legal Protection** - Legal advice disclaimers and attorney references
🔒 **Privacy (GDPR/CCPA)** - PII detection and redaction
🛡️ **Safety First** - Age-appropriate content and security best practices
⚡ **Real-time Enforcement** - Automatic output validation and modification
📊 **Violation Tracking** - Complete audit trail and analytics

## Installation

```bash
npm install @rana/compliance
```

## Quick Start

### Enable All Presets

```typescript
import { createComplianceEnforcer } from '@rana/compliance';

const enforcer = createComplianceEnforcer({
  enableAllPresets: true,  // Enable all built-in rules
  strictMode: true,        // Block on critical violations
});

// Enforce compliance
const result = await enforcer.enforce(
  'Should I buy Bitcoin?',
  'Yes, you should definitely invest in Bitcoin!',
  { topic: 'finance' }
);

console.log(result.finalOutput);
// "Yes, Bitcoin can be an interesting investment option...
//  📋 Disclaimer: This is not financial advice..."

console.log(result.violations);
// [{ rule: {...}, checkResult: {...}, ... }]
```

### Custom Rules

```typescript
import { createComplianceEnforcer, createComplianceRule } from '@rana/compliance';

const enforcer = createComplianceEnforcer();

// Add custom rule
enforcer.addRule(createComplianceRule({
  id: 'company-disclaimer',
  name: 'Company Disclaimer Required',
  description: 'Require company disclaimer on all product recommendations',
  category: 'custom',
  severity: 'medium',
  check: async (input, output, context) => {
    if (output.includes('recommend') && !output.includes('disclaimer')) {
      return {
        compliant: false,
        action: 'append',
        message: 'Product recommendation requires disclaimer',
        replacement: output + '\n\nDisclaimer: This is a general recommendation...',
      };
    }
    return { compliant: true, action: 'allow' };
  },
}));
```

## Preset Rules

### Healthcare (HIPAA)

```typescript
import { PresetRules } from '@rana/compliance';

// No medical advice
enforcer.addRule(PresetRules.hipaaNoMedicalAdvice());

// PHI/PII protection
enforcer.addRule(PresetRules.hipaaPIIProtection());
```

**Example:**
```typescript
const result = await enforcer.enforce(
  'I have a headache',
  'You have a migraine. Take 500mg ibuprofen.',
  { topic: 'medical' }
);

// result.action: 'replace'
// result.finalOutput: 'I cannot provide medical advice...'
```

### Finance (SEC/FINRA)

```typescript
// Financial disclaimer
enforcer.addRule(PresetRules.secFinancialDisclaimer());

// No investment advice
enforcer.addRule(PresetRules.secNoInvestmentAdvice());
```

**Example:**
```typescript
const result = await enforcer.enforce(
  'What should I invest in?',
  'I recommend investing in Tesla stock.',
  { topic: 'investment' }
);

// result.action: 'replace'
// result.finalOutput: 'I cannot provide specific investment recommendations...'
```

### Legal

```typescript
enforcer.addRule(PresetRules.noLegalAdvice());
```

**Example:**
```typescript
const result = await enforcer.enforce(
  'Can I sue my landlord?',
  'Yes, you should sue them for breach of contract.',
  { topic: 'legal' }
);

// result.action: 'append'
// result.finalOutput: '... ⚖️ This is not legal advice. Please consult with a licensed attorney...'
```

### Privacy (GDPR/CCPA)

```typescript
enforcer.addRule(PresetRules.gdprPIIProtection());
enforcer.addRule(PresetRules.ccpaPrivacy());
```

**Example:**
```typescript
const result = await enforcer.enforce(
  'What is your email?',
  'My email is john.doe@example.com and my phone is 555-1234.',
  {}
);

// result.action: 'redact'
// result.finalOutput: 'My email is [REDACTED] and my phone is [REDACTED].'
```

### Safety & Security

```typescript
enforcer.addRule(PresetRules.ageAppropriate(13));
enforcer.addRule(PresetRules.noPasswordRequest());
```

## Enforcement Actions

The system supports 7 enforcement actions:

| Action | Description | Use Case |
|--------|-------------|----------|
| `allow` | Pass through unchanged | No violations |
| `block` | Block response entirely | Critical violations |
| `redact` | Remove sensitive info | PII, PHI exposure |
| `append` | Add disclaimers | Financial, legal advice |
| `replace` | Substitute safe response | Medical, investment advice |
| `warn` | Log but allow | Minor issues |
| `escalate` | Route to human review | Complex cases |

## PII Detection & Redaction

```typescript
import { detectPII, redactPII } from '@rana/compliance';

// Detect PII
const text = 'Contact me at john@example.com or 555-1234';
const pii = detectPII(text);
console.log(pii);
// [
//   { type: 'email', text: 'john@example.com', start: 14, end: 32, confidence: 0.8 },
//   { type: 'phone', text: '555-1234', start: 36, end: 44, confidence: 0.8 }
// ]

// Redact PII
const redacted = redactPII(text);
console.log(redacted);
// 'Contact me at [REDACTED] or [REDACTED]'

// Redact specific types
const emailRedacted = redactPII(text, ['email']);
// 'Contact me at [REDACTED] or 555-1234'
```

**Supported PII Types:**
- `email` - Email addresses
- `phone` - Phone numbers
- `ssn` - Social Security Numbers
- `credit_card` - Credit card numbers
- `address` - Physical addresses
- `name` - Person names
- `date_of_birth` - Dates of birth
- `medical_record` - Medical record numbers
- `ip_address` - IP addresses
- `passport` - Passport numbers

## Violation Tracking

```typescript
// Get all violations
const violations = enforcer.getViolations();

// Filter violations
const medicalViolations = enforcer.getViolations({
  ruleId: 'hipaa-no-medical-advice',
});

const userViolations = enforcer.getViolations({
  userId: 'user123',
  since: new Date('2026-01-01'),
  limit: 10,
});

// Clear violations
enforcer.clearViolations();
enforcer.clearViolations({ ruleId: 'specific-rule' });
```

## Statistics & Analytics

```typescript
const stats = enforcer.getStats();
console.log(stats);
// {
//   totalRules: 9,
//   enabledRules: 9,
//   totalViolations: 25,
//   violationsByRule: {
//     'hipaa-no-medical-advice': 10,
//     'sec-financial-disclaimer': 8,
//     ...
//   },
//   violationsBySeverity: {
//     'critical': 15,
//     'high': 8,
//     'medium': 2
//   },
//   recentViolations: [...]
// }
```

## Configuration

```typescript
const enforcer = createComplianceEnforcer({
  // Enable all preset rules
  enableAllPresets: true,

  // Custom rules
  rules: [myCustomRule],

  // Strict mode: block on critical violations
  strictMode: true,

  // Logging
  logViolations: true,
  storeViolations: true,

  // Callbacks
  onViolation: async (violation) => {
    console.log('Violation:', violation);
    await db.saveViolation(violation);
  },

  onEnforcement: async (result) => {
    if (!result.compliant) {
      await analytics.track('compliance_violation', {
        rules: result.violations.map(v => v.rule.id),
      });
    }
  },
});
```

## Dry Run (Check Without Enforcing)

```typescript
// Check compliance without modifying output
const result = await enforcer.check(
  'input',
  'output',
  context
);

console.log('Would modify:', result.wasModified);
console.log('Violations:', result.violations.length);
// Output not actually modified
```

## Advanced Example: Complete Integration

```typescript
import { createComplianceEnforcer, PresetRules } from '@rana/compliance';
import { createRana } from '@rana/core';

// Create RANA client
const rana = createRana({
  providers: { anthropic: process.env.ANTHROPIC_API_KEY },
});

// Create compliance enforcer
const enforcer = createComplianceEnforcer({
  enableAllPresets: true,
  strictMode: true,
  logViolations: true,

  onViolation: async (violation) => {
    // Send to monitoring
    await monitoring.alert({
      type: 'compliance_violation',
      severity: violation.rule.severity,
      rule: violation.rule.id,
      userId: violation.userId,
    });
  },
});

// Compliant chat function
async function compliantChat(userMessage: string, context: any) {
  // Generate response
  const response = await rana.chat({
    messages: [{ role: 'user', content: userMessage }],
  });

  // Enforce compliance
  const result = await enforcer.enforce(
    userMessage,
    response.content,
    {
      topic: context.topic,
      user: context.user,
    }
  );

  // Handle result
  if (result.action === 'block') {
    return {
      content: 'I apologize, but I cannot provide that information due to compliance requirements.',
      blocked: true,
    };
  }

  if (result.action === 'escalate') {
    await escalateToHuman(userMessage, response.content, result.violations);
    return {
      content: 'Let me connect you with a human agent who can better assist you.',
      escalated: true,
    };
  }

  return {
    content: result.finalOutput,
    wasModified: result.wasModified,
    warnings: result.warnings,
  };
}
```

## Rule Development Guide

```typescript
import { createComplianceRule } from '@rana/compliance';

const myRule = createComplianceRule({
  id: 'unique-id',
  name: 'Human Readable Name',
  description: 'What this rule enforces',

  category: 'healthcare', // or 'finance', 'legal', 'privacy', 'safety', 'security', 'custom'
  severity: 'critical',   // or 'high', 'medium', 'low'

  tags: ['tag1', 'tag2'],
  enabled: true,

  check: async (input, output, context) => {
    // Your compliance logic here

    // Compliant response
    if (isCompliant) {
      return {
        compliant: true,
        action: 'allow',
      };
    }

    // Violation - block response
    return {
      compliant: false,
      action: 'block',
      message: 'Why this violates the rule',
      issues: ['issue_code_1', 'issue_code_2'],
      confidence: 0.9,
    };

    // Or redact sensitive info
    return {
      compliant: false,
      action: 'redact',
      replacement: redactedOutput,
      message: 'PII detected and redacted',
    };

    // Or append disclaimer
    return {
      compliant: false,
      action: 'append',
      replacement: output + '\n\nDisclaimer: ...',
      message: 'Added required disclaimer',
    };
  },
});
```

## Export/Import

```typescript
// Export configuration
const config = enforcer.export();
await fs.writeFile('compliance-config.json', JSON.stringify(config));

// Import configuration
const data = JSON.parse(await fs.readFile('compliance-config.json'));
enforcer.import(data);
```

## Best Practices

1. **Start with Presets** - Use built-in rules as foundation
2. **Enable Strict Mode** - For production systems
3. **Log Everything** - Track all violations for audit trails
4. **Test Thoroughly** - Test each rule with edge cases
5. **Monitor Analytics** - Review violation patterns regularly
6. **Update Regularly** - Keep rules current with regulations
7. **Escalate Complex Cases** - Use human review for ambiguous situations
8. **Document Rules** - Clear descriptions and examples

## Compliance Checklist

- [ ] HIPAA (Healthcare): `hipaaNoMedicalAdvice()`, `hipaaPIIProtection()`
- [ ] SEC/FINRA (Finance): `secFinancialDisclaimer()`, `secNoInvestmentAdvice()`
- [ ] Legal: `noLegalAdvice()`
- [ ] GDPR (EU Privacy): `gdprPIIProtection()`
- [ ] CCPA (California): `ccpaPrivacy()`
- [ ] COPPA (Children): `ageAppropriate(13)`
- [ ] Security: `noPasswordRequest()`

## License

MIT © Waymaker
