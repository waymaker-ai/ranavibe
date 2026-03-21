# @ranavibe/agent-sdk

Guardrail wrapper for the Anthropic Agent SDK. Adds PII detection, prompt injection blocking, compliance enforcement, cost tracking, content filtering, rate limiting, and tamper-proof audit logging to any agent -- with a single function call.

```typescript
import { createGuardedAgent } from '@ranavibe/agent-sdk';

const agent = createGuardedAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a helpful assistant.',
  guards: true, // Sensible defaults for all 7 interceptors
});

const result = await agent.run('What is the capital of France?');
console.log(result.output);       // "The capital of France is Paris."
console.log(result.blocked);      // false
console.log(result.guardsApplied); // ['rateLimit', 'injection', 'pii', 'contentFilter', 'cost', 'audit']
```

## Features

- **7 interceptors** -- rate limit, injection, PII, compliance, content filter, cost, audit
- **Pre-built factories** -- HIPAA, financial, GDPR, and general safety agents in one call
- **guardTool()** -- wrap individual tools with guards
- **GuardPipeline** -- compose your own middleware chain
- **Works without Anthropic SDK** -- guards still function, with a graceful fallback message
- **Full reporting** -- cost, compliance, and audit summaries

## Installation

```bash
npm install @ranavibe/agent-sdk
```

The Anthropic SDK is an **optional** peer dependency. If installed, the agent will use it to make LLM calls. If not, the agent still validates input/output through all guards and returns a fallback message.

```bash
# Optional: install for real LLM calls
npm install @anthropic-ai/sdk
```

## Quick Start

### Defaults with `guards: true`

Passing `guards: true` enables sensible defaults for all interceptors:

```typescript
import { createGuardedAgent } from '@ranavibe/agent-sdk';

const agent = createGuardedAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a helpful assistant.',
  guards: true,
});

const result = await agent.run('Hello, how are you?');
console.log(result.output);
console.log(result.cost);          // Total cost in dollars
console.log(result.tokensUsed);    // { input: 42, output: 128 }
console.log(result.guardsApplied); // List of active interceptor names
```

Default configuration when `guards: true`:

| Interceptor | Default |
|-------------|---------|
| PII | Redact mode, auto-redact on detection |
| Injection | Medium sensitivity, block on detection |
| Cost | Daily budget tracking, 80% warning threshold |
| Content Filter | All categories enabled |
| Audit | Console logging |
| Rate Limit | 100 requests per 60 seconds |
| Compliance | Not enabled (use factories or explicit config) |

### Advanced Configuration

```typescript
import { createGuardedAgent } from '@ranavibe/agent-sdk';

const agent = createGuardedAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a compliance-aware assistant.',
  maxTurns: 5,
  guards: {
    pii: {
      mode: 'block',
      types: ['ssn', 'creditCard', 'medical_record'],
      onDetection: 'block',
    },
    injection: {
      sensitivity: 'high',
      onDetection: 'block',
      customPatterns: [/my-custom-pattern/gi],
    },
    cost: {
      budgetLimit: 100,
      budgetPeriod: 'day',
      warningThreshold: 0.8,
      onExceeded: 'block',
      fallbackModel: 'claude-3-haiku-20240307',
    },
    compliance: {
      frameworks: ['hipaa', 'gdpr'],
      onViolation: 'block',
    },
    contentFilter: {
      categories: ['violence', 'selfHarm', 'hate', 'adult'],
      action: 'block',
      severity: 'medium',
    },
    audit: {
      destination: 'file',
      filePath: './audit.log',
      events: ['request', 'response', 'violation', 'cost'],
      tamperProof: true,
      includePayload: false,
    },
    rateLimit: {
      maxRequests: 60,
      windowMs: 60000,
      onExceeded: 'block',
    },
  },
});
```

## Pre-Built Agent Factories

### `createHIPAAAgent(config?)`

HIPAA-compliant medical assistant with strict PII blocking, high injection sensitivity, file-based tamper-proof audit logging, and medical content filtering.

```typescript
import { createHIPAAAgent } from '@ranavibe/agent-sdk';

const agent = createHIPAAAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a medical records assistant.',
  auditPath: './hipaa-audit.log',
});

const result = await agent.run('Look up patient records for SSN 123-45-6789');
console.log(result.blocked); // true -- SSN detected and blocked
console.log(result.violations);
// [{ interceptor: 'pii', rule: 'ssn', severity: 'critical', ... }]
```

**Pre-configured guards:**
- PII: Block SSN, credit card, medical record, DOB, address, phone
- Injection: High sensitivity, block
- Compliance: HIPAA framework, block on violation
- Content: Block violence, self-harm, hate
- Audit: File-based, tamper-proof, payloads excluded (no PHI in logs)
- Cost: $50/day budget, block on exceeded
- Rate limit: 60 requests/minute

### `createFinancialAgent(config?)`

SEC and SOX-compliant financial assistant.

```typescript
import { createFinancialAgent } from '@ranavibe/agent-sdk';

const agent = createFinancialAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a financial analysis assistant.',
});
```

### `createGDPRAgent(config?)`

GDPR-compliant assistant for EU data handling.

```typescript
import { createGDPRAgent } from '@ranavibe/agent-sdk';

const agent = createGDPRAgent({
  model: 'claude-sonnet-4-6',
  instructions: 'You are a customer service assistant for EU users.',
});
```

### `createSafeAgent(config?)`

General-purpose safe assistant with balanced defaults.

```typescript
import { createSafeAgent } from '@ranavibe/agent-sdk';

const agent = createSafeAgent();

const result = await agent.run('Help me write an email');
console.log(result.output);
```

**Pre-configured guards:**
- PII: Redact mode
- Injection: Medium sensitivity, block
- Content: All categories enabled
- Audit: Console logging
- Cost: $25/day budget, warn on exceeded
- Rate limit: 120 requests/minute

## `guardTool()` -- Guard Individual Tools

Wrap any tool definition with guards. Input to the tool is checked before execution; output is checked after.

```typescript
import { guardTool } from '@ranavibe/agent-sdk';

const lookupTool = {
  name: 'database_lookup',
  description: 'Look up user records',
  execute: async (query: string) => {
    // ... database call
    return `User: John Smith, SSN: 123-45-6789`;
  },
};

const guardedTool = guardTool(lookupTool, {
  pii: { mode: 'redact', onDetection: 'redact' },
  injection: { sensitivity: 'high', onDetection: 'block' },
  audit: { destination: 'console' },
});

// The tool's output will have PII redacted automatically
const result = await guardedTool.execute('find user 42');
// result === "User: [NAME], SSN: [SSN]"
```

If the tool input contains an injection attempt, it throws:

```
Error: [RANA Guard] Tool "database_lookup" blocked: Injection detected
```

## `GuardPipeline` -- Custom Middleware

Build a custom interceptor pipeline for full control:

```typescript
import {
  GuardPipeline,
  PIIInterceptor,
  InjectionInterceptor,
  CostInterceptor,
  AuditInterceptor,
} from '@ranavibe/agent-sdk';

const pipeline = new GuardPipeline();

pipeline
  .use(new InjectionInterceptor({ sensitivity: 'high', onDetection: 'block' }))
  .use(new PIIInterceptor({ mode: 'redact', onDetection: 'redact' }))
  .use(new CostInterceptor({ budgetLimit: 50, budgetPeriod: 'day' }))
  .use(new AuditInterceptor({ destination: 'console' }));

// Process input through the pipeline
const result = await pipeline.processInput('My SSN is 123-45-6789', {
  model: 'claude-sonnet-4-6',
});

console.log(result.allowed);     // true (PII was redacted, not blocked)
console.log(result.transformed); // "My SSN is [SSN]"
console.log(result.violations);  // [{ interceptor: 'pii', rule: 'ssn', ... }]
```

## All 7 Interceptors

| Interceptor | Import | Purpose |
|-------------|--------|---------|
| `PIIInterceptor` | `@ranavibe/agent-sdk` | Detect, redact, or block PII |
| `InjectionInterceptor` | `@ranavibe/agent-sdk` | Block prompt injection attempts |
| `CostInterceptor` | `@ranavibe/agent-sdk` | Track and enforce cost budgets |
| `ComplianceInterceptor` | `@ranavibe/agent-sdk` | Enforce HIPAA, GDPR, CCPA, SEC, SOX, PCI, FERPA |
| `ContentInterceptor` | `@ranavibe/agent-sdk` | Filter profanity, violence, hate, adult, spam, self-harm |
| `AuditInterceptor` | `@ranavibe/agent-sdk` | Log all guard activity (console, file, or custom handler) |
| `RateLimitInterceptor` | `@ranavibe/agent-sdk` | Enforce request rate limits |

## Reporting

### Guard Report

```typescript
const report = agent.getGuardReport();
console.log(report);
// {
//   totalRequests: 15,
//   totalCost: 0.42,
//   ppiDetections: 3,
//   ppiByType: {},
//   injectionAttempts: 1,
//   complianceViolations: 0,
//   complianceByFramework: {},
//   contentFiltered: 2,
//   rateLimitHits: 0,
//   auditEvents: 30,
//   startedAt: 1710000000000,
//   lastActivityAt: 1710003600000,
// }
```

### Cost Report

```typescript
import { generateCostReport, formatCostReport } from '@ranavibe/agent-sdk';
```

### Compliance Report

```typescript
import { generateComplianceReport, formatComplianceReport } from '@ranavibe/agent-sdk';
```

## Result Shape

Every `agent.run()` call returns a `GuardedAgentResult`:

```typescript
interface GuardedAgentResult {
  output: string;                    // The agent's response (or block message)
  blocked: boolean;                  // Whether the request was blocked
  violations: Violation[];           // All violations detected
  cost: number;                      // Total cost in dollars
  tokensUsed: { input: number; output: number };
  guardsApplied: string[];          // Names of active interceptors
}
```

## TypeScript Types

```typescript
import type {
  GuardConfig,
  GuardedAgentConfig,
  GuardedAgent,
  GuardedAgentResult,
  GuardReport,
  PIIConfig,
  InjectionConfig,
  CostConfig,
  ComplianceConfig,
  ContentFilterConfig,
  AuditConfig,
  RateLimitConfig,
  Interceptor,
  InterceptorResult,
  InterceptorContext,
  Violation,
  AuditEvent,
  CostEntry,
  ComplianceRule,
  ComplianceViolation,
  Severity,
} from '@ranavibe/agent-sdk';
```

## License

MIT -- [Waymaker](https://waymaker.cx)
