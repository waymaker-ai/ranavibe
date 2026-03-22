# agent-sdk-demo

Demonstrates the core features of `@cofounder/agent-sdk`:

- **Basic guarded agent** with `guards: true` for sensible defaults
- **HIPAA agent factory** with strict PII blocking and compliance enforcement
- **Safe agent factory** for general-purpose use
- **Tool guarding** with `guardTool()` to protect individual tool calls
- **Custom GuardPipeline** for composing your own interceptor chain

## Run

```bash
pnpm install
pnpm start
```

## Notes

- Works without `@anthropic-ai/sdk` installed. The agent validates input/output through all guards and returns a fallback message showing which guards were applied.
- Install `@anthropic-ai/sdk` and set `ANTHROPIC_API_KEY` for real LLM calls.
- No PII or sensitive data leaves your machine in demo mode.
