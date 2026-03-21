# guard-demo

Demonstrates the core features of `@ranavibe/guard`:

- **One-shot guard check** with `guard()` for quick validation
- **PII redaction** across emails, SSNs, credit cards, and more
- **Injection detection** blocking prompt injection attempts (25+ patterns)
- **Model gating** to restrict which LLM models can be used
- **Standalone detectors** for using PII/injection detection independently
- **Reporting** to review all guard activity

## Run

```bash
pnpm install
pnpm start
```

## What it shows

The demo runs several checks and prints results to the console, showing how each guardrail handles different types of input. No API keys are required -- all checks are performed locally with zero network calls.
