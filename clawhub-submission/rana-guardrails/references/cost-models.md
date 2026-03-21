# CoFounder Supported Model Pricing Reference

All costs are in USD per 1 million tokens. Context window sizes are in tokens.

Data sourced from `packages/guard/src/enforcers/budget.ts` (primary) and `extensions/vscode-cofounder/src/detectors.ts` (supplementary).

---

## Anthropic Models

| Model | Input / 1M tokens | Output / 1M tokens | Context Window |
|---|---|---|---|
| claude-opus-4-6 | $15.00 | $75.00 | 200,000 |
| claude-sonnet-4-6 | $3.00 | $15.00 | 200,000 |
| claude-haiku-4-5-20251001 | $0.80 | $4.00 | 200,000 |
| claude-3-5-sonnet-20241022 | $3.00 | $15.00 | 200,000 |
| claude-3-5-haiku-20241022 | $0.80 | $4.00 | 200,000 |
| claude-3-opus-20240229 | $15.00 | $75.00 | 200,000 |
| claude-3-sonnet-20240229 | $3.00 | $15.00 | 200,000 |
| claude-3-haiku-20240307 | $0.25 | $1.25 | 200,000 |

## OpenAI Models

| Model | Input / 1M tokens | Output / 1M tokens | Context Window |
|---|---|---|---|
| gpt-4o | $2.50 | $10.00 | 128,000 |
| gpt-4o-mini | $0.15 | $0.60 | 128,000 |
| gpt-4-turbo | $10.00 | $30.00 | 128,000 |
| gpt-4 | $30.00 | $60.00 | 8,192 |
| gpt-3.5-turbo | $0.50 | $1.50 | 16,385 |
| o1 | $15.00 | $60.00 | 200,000 |
| o1-mini | $3.00 | $12.00 | 128,000 |
| o3-mini | $1.10 | $4.40 | 200,000 |

## Google Models

| Model | Input / 1M tokens | Output / 1M tokens | Context Window |
|---|---|---|---|
| gemini-2.5-pro | $1.25 | $10.00 | 1,048,576 |
| gemini-2.0-flash | $0.10 | $0.40 | 1,048,576 |
| gemini-1.5-pro | $1.25 | $5.00 | 2,097,152 |
| gemini-1.5-flash | $0.075 | $0.30 | 1,048,576 |

## Mistral Models

| Model | Input / 1M tokens | Output / 1M tokens | Context Window |
|---|---|---|---|
| mistral-large | $2.00 | $6.00 | 128,000 |
| mistral-small | $0.20 | $0.60 | 32,000 |

## Groq-Hosted Models (Meta)

| Model | Input / 1M tokens | Output / 1M tokens | Context Window |
|---|---|---|---|
| llama-3.1-70b | $0.59 | $0.79 | 131,072 |
| llama-3.1-8b | $0.05 | $0.08 | 131,072 |

---

## VS Code Extension Quick-Reference Pricing

The VS Code extension uses a simplified pricing table for inline cost estimation:

| Model | Input / 1M tokens | Output / 1M tokens |
|---|---|---|
| gpt-4o | $2.50 | $10.00 |
| gpt-4 | $30.00 | $60.00 |
| gpt-4-turbo | $10.00 | $30.00 |
| gpt-3.5-turbo | $0.50 | $1.50 |
| o1-preview | $15.00 | $60.00 |
| o1-mini | $3.00 | $12.00 |
| claude-3-opus | $15.00 | $75.00 |
| claude-3-sonnet | $3.00 | $15.00 |
| claude-3-haiku | $0.25 | $1.25 |
| gemini-pro | $0.50 | $1.50 |
| gemini-ultra | $5.00 | $15.00 |

---

## Cost Estimation

CoFounder estimates costs using the formula:

```
cost = (input_tokens / 1,000,000) * input_rate + (output_tokens / 1,000,000) * output_rate
```

Token count estimation uses a rough heuristic of approximately 4 characters per token when exact tokenizer counts are unavailable.

## Budget Enforcement

The `BudgetEnforcer` class supports:

- **Period types**: `request` (per-call), `hour`, `day`, `month`
- **Warning threshold**: Configurable (default 80% of limit)
- **Exceeded action**: `block` (default) or `warn`
- **Model comparison**: `BudgetEnforcer.compareModels(inputTokens, outputTokens)` returns all models sorted by cost

## Provider Detection

Models are automatically assigned to providers based on prefix:

| Prefix | Provider |
|---|---|
| `claude*` | Anthropic |
| `gpt*`, `o1*`, `o3*` | OpenAI |
| `gemini*` | Google |
| `mistral*` | Mistral |
| `llama*` | Groq |
