# openclaw-demo

Demonstrates how `@cofounder/openclaw` integrates CoFounder guardrails with OpenClaw agents:

- **createRanaSkill()** to create a guard skill with PII, injection, and compliance hooks
- **Skill manifest** exposing capabilities and configurable settings to OpenClaw
- **beforeMessage / afterMessage hooks** to guard user input and agent output
- **beforeToolCall / afterToolCall hooks** to guard tool invocations
- **Skill commands** for status and reporting within OpenClaw conversations
- **OpenClawBridge** for a higher-level integration pattern

## Run

```bash
pnpm install
pnpm start
```

## What it shows

The demo simulates a Slack-based medical chatbot scenario. User messages containing PII (emails, SSNs) are automatically redacted. Injection attempts are blocked. Agent responses are also guarded to prevent PII leakage. The skill exposes `/status` and `/report` commands for in-conversation guard monitoring.

The OpenClaw runtime is not required to run this demo -- the skill/bridge pattern is demonstrated using the types from `@cofounder/openclaw`.
