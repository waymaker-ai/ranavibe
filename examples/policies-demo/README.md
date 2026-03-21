# policies-demo

Demonstrates the core features of `@cofounder/policies`:

- **Listing available presets** (HIPAA, GDPR, CCPA, SEC, PCI, FERPA, SOX, safety, enterprise)
- **Loading presets** and evaluating text against them
- **HIPAA evaluation** detecting SSNs and medical records in content
- **GDPR evaluation** detecting personal data in EU contexts
- **Policy composition** merging multiple policies with the `strictest` strategy
- **Targeted evaluation** checking against a specific policy by ID
- **Serialization** exporting and restoring policy engines as JSON

## Run

```bash
pnpm install
pnpm start
```

## What it shows

All policy evaluation is performed locally with pattern matching and rule evaluation. No LLM calls are made. The demo prints violation details including severity, message, and which policy triggered each finding.
