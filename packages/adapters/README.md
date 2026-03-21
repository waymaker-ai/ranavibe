# @ranavibe/adapters

Integration adapters for enterprise guardrail products. Provides unified conversion between RANA policies and Lakera Guard, AWS Bedrock Guardrails, and Galileo evaluation formats.

## Installation

```bash
npm install @ranavibe/adapters
```

## Quick Start

### Unified Adapter

Run RANA policies alongside enterprise adapters and merge all findings:

```typescript
import { createUnifiedAdapter } from '@ranavibe/adapters';

const unified = createUnifiedAdapter({
  rana: { pii: 'redact', injection: 'block' },
  lakera: { apiKey: 'lk-...', endpoint: 'https://api.lakera.ai' },
  bedrock: { region: 'us-east-1', guardrailId: 'abc123' },
});

const result = await unified.evaluate('Please process my SSN 123-45-6789');
console.log(result.passed);     // false
console.log(result.findings);   // combined findings from all adapters
```

### Individual Adapters

```typescript
import { createLakeraAdapter, createBedrockAdapter, createGalileoAdapter } from '@ranavibe/adapters';

// Lakera Guard
const lakera = createLakeraAdapter({
  apiKey: 'lk-...',
  policies: [{ ranaCategory: 'injection', action: 'block', threshold: 0.7 }],
});

// AWS Bedrock Guardrails
const bedrock = createBedrockAdapter({
  region: 'us-east-1',
  guardrailId: 'abc123',
  policies: [{ ranaCategory: 'pii', action: 'redact' }],
});

// Galileo
const galileo = createGalileoAdapter({
  apiKey: 'gal-...',
  projectName: 'my-project',
  policies: [{ ranaCategory: 'hallucination', action: 'flag', threshold: 0.6 }],
});
```

## Features

- Convert RANA policies to/from Lakera, Bedrock, and Galileo formats
- Import evaluation results from any supported adapter into normalised RANA findings
- Export RANA policies into enterprise-specific configurations
- Run all adapters in parallel with the unified adapter
- Zero runtime dependencies

## License

MIT
