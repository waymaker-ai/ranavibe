# @waymakerai/aicofounder-policies

Declarative policy engine for AI guardrails. Ships with battle-tested compliance presets for HIPAA, GDPR, CCPA, SEC, PCI DSS, FERPA, SOX, and general AI safety. Zero runtime dependencies.

## Installation

```bash
npm install @waymakerai/aicofounder-policies
```

## Quick Start

```ts
import { PolicyEngine } from '@waymakerai/aicofounder-policies';

// Create an engine from presets
const engine = PolicyEngine.fromPresets(['hipaa', 'safety']);

// Evaluate content
const result = engine.evaluate({
  content: 'Patient John Smith, SSN 123-45-6789, was diagnosed with diabetes.',
  model: 'gpt-4o',
  role: 'physician',
  authenticated: true,
  mfa: true,
});

console.log(result.passed);          // false (SSN triggers block)
console.log(result.violations);      // detailed violation objects
console.log(result.redactedContent); // content with PII redacted (if action is redact)
```

## Available Presets

| Preset       | Framework    | Description                                              |
|-------------|-------------|----------------------------------------------------------|
| `hipaa`     | HIPAA        | All 18 PHI identifiers, audit trails, encryption         |
| `gdpr`      | GDPR         | Data minimization, consent, right to erasure/portability |
| `ccpa`      | CCPA/CPRA    | Right to know, delete, opt-out, non-discrimination       |
| `sec`       | SEC          | Investment disclaimers, insider trading, anti-fraud       |
| `pci`       | PCI DSS v4.0 | Cardholder data, CVV/PIN, encryption, access control     |
| `ferpa`     | FERPA        | Student records, directory info, consent                 |
| `sox`       | SOX          | Financial reporting, internal controls, record retention |
| `safety`    | AI Safety    | Harmful content, suicide prevention, child safety        |
| `enterprise`| Enterprise   | Balanced default: safety + privacy + PII + governance    |

```ts
import { listPresets, getPreset } from '@waymakerai/aicofounder-policies';

console.log(listPresets()); // ['hipaa', 'gdpr', 'ccpa', ...]

const hipaa = getPreset('hipaa');
```

## Policy Composition

Combine multiple policies with different strategies:

```ts
import { PolicyEngine, compose, getPreset } from '@waymakerai/aicofounder-policies';

// Strictest: block > redact > detect, lower cost limits, intersection of allowed models
const composed = compose(
  [getPreset('hipaa'), getPreset('gdpr'), getPreset('safety')],
  'strictest',
);

// Or use the engine directly
const engine = PolicyEngine.compose(
  [getPreset('hipaa'), getPreset('pci')],
  'strictest',
);
```

Strategies:
- **`strictest`** (default) - Most restrictive rules win
- **`first`** - First policy wins on conflict
- **`last`** - Last policy wins on conflict

## Custom Policies

```ts
import { PolicyBuilder, CORE_PII_PATTERNS } from '@waymakerai/aicofounder-policies';

const policy = new PolicyBuilder('my-policy', 'My Custom Policy')
  .description('Custom policy for internal use')
  .piiPatterns(CORE_PII_PATTERNS)
  .piiAction('redact')
  .prohibitContent({
    name: 'no-competitors',
    pattern: 'competitor-name',
    flags: 'gi',
    severity: 'medium',
    message: 'Do not mention competitor names',
  })
  .maxCostPerRequest(1.0)
  .allowModels(['gpt-4*', 'claude-*'])
  .requireAuth()
  .allowRoles(['admin', 'developer'])
  .build();

const engine = new PolicyEngine([policy]);
```

## Extending Presets

```ts
import { parsePolicy } from '@waymakerai/aicofounder-policies';

const policy = parsePolicy({
  metadata: {
    id: 'my-hipaa-plus',
    name: 'HIPAA Plus Custom Rules',
    version: '1.0.0',
    extends: 'hipaa', // inherits all HIPAA rules
  },
  rules: {
    // additional rules are deep-merged on top
    cost: {
      enabled: true,
      maxCostPerRequest: 2.0,
    },
  },
});
```

## Validation

```ts
import { validatePolicy } from '@waymakerai/aicofounder-policies';

const result = validatePolicy(myPolicyObject);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Evaluation Context

```ts
interface EvaluationContext {
  content?: string;           // Text to evaluate
  model?: string;             // Model identifier
  cost?: number;              // Request cost (USD)
  tokens?: number;            // Total token count
  completionTokens?: number;  // Completion token count
  role?: string;              // Caller's role
  authenticated?: boolean;    // Auth status
  mfa?: boolean;              // MFA status
  ip?: string;                // Caller's IP
  dailyCost?: number;         // Accumulated daily cost
  monthlyCost?: number;       // Accumulated monthly cost
}
```

## Rule Categories

- **PII** - Regex-based detection of emails, phones, SSNs, credit cards, addresses, and more
- **Content** - Prohibited patterns (harmful content) and required patterns (disclaimers)
- **Model** - Allow/deny lists with glob matching
- **Cost** - Per-request, daily, and monthly cost limits; token limits
- **Data** - Retention periods, encryption requirements, consent, purpose limitation
- **Response** - Length limits, required/prohibited patterns, JSON validation
- **Access** - Role-based access, authentication, MFA, IP allowlists, rate limiting

## License

MIT
