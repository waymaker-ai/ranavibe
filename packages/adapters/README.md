# @waymakerai/aicofounder-adapters

Integration adapters for enterprise guardrail products. Provides unified conversion between CoFounder policies and Lakera Guard, AWS Bedrock Guardrails, and Galileo evaluation formats.

## Installation

```bash
npm install @waymakerai/aicofounder-adapters
```

## Quick Start

### Unified Adapter

Run CoFounder policies alongside enterprise adapters and merge all findings:

```typescript
import { createUnifiedAdapter } from '@waymakerai/aicofounder-adapters';

const unified = createUnifiedAdapter({
  cofounder: { pii: 'redact', injection: 'block' },
  lakera: { apiKey: 'lk-...', endpoint: 'https://api.lakera.ai' },
  bedrock: { region: 'us-east-1', guardrailId: 'abc123' },
});

const result = await unified.evaluate('Please process my SSN 123-45-6789');
console.log(result.passed);     // false
console.log(result.findings);   // combined findings from all adapters
```

### Individual Adapters

```typescript
import { createLakeraAdapter, createBedrockAdapter, createGalileoAdapter } from '@waymakerai/aicofounder-adapters';

// Lakera Guard
const lakera = createLakeraAdapter({
  apiKey: 'lk-...',
  policies: [{ cofounderCategory: 'injection', action: 'block', threshold: 0.7 }],
});

// AWS Bedrock Guardrails
const bedrock = createBedrockAdapter({
  region: 'us-east-1',
  guardrailId: 'abc123',
  policies: [{ cofounderCategory: 'pii', action: 'redact' }],
});

// Galileo
const galileo = createGalileoAdapter({
  apiKey: 'gal-...',
  projectName: 'my-project',
  policies: [{ cofounderCategory: 'hallucination', action: 'flag', threshold: 0.6 }],
});
```

## Features

- Convert CoFounder policies to/from Lakera, Bedrock, and Galileo formats
- Import evaluation results from any supported adapter into normalised CoFounder findings
- Export CoFounder policies into enterprise-specific configurations
- Run all adapters in parallel with the unified adapter
- Zero runtime dependencies

## License

MIT
