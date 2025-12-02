# Phase 3.1 Feature Examples

This directory contains comprehensive examples for all Phase 3.1 advanced features in RANA.

## Examples

| File | Description |
|------|-------------|
| [model-router.ts](./model-router.ts) | Intelligent routing across LLM providers |
| [agent-debugger.ts](./agent-debugger.ts) | Step-through debugging for AI agents |
| [structured-output.ts](./structured-output.ts) | Schema-based LLM response generation |
| [fine-tuning.ts](./fine-tuning.ts) | Dataset preparation and model training |
| [prompt-collaboration.ts](./prompt-collaboration.ts) | Git-like version control for prompts |
| [edge-offline.ts](./edge-offline.ts) | Local model execution with llama.cpp |
| [voice-realtime.ts](./voice-realtime.ts) | Voice conversations with AI |
| [advanced-rag.ts](./advanced-rag.ts) | Multi-modal RAG with self-correction |

## Prerequisites

1. Install dependencies:
```bash
npm install @rana/core
```

2. Set up environment variables:
```bash
export OPENAI_API_KEY=your-key
export ANTHROPIC_API_KEY=your-key
export GOOGLE_API_KEY=your-key
```

3. For edge/offline examples, download models:
```bash
rana edge:download phi-2-q4
rana edge:download llama-2-7b-chat-q4
```

## Running Examples

```bash
# Run with ts-node
npx ts-node model-router.ts

# Or compile and run
npx tsc model-router.ts
node model-router.js
```

## Feature Highlights

### Model Router
- Route requests to the best provider based on cost, quality, or latency
- Automatic fallback when providers fail
- Custom routing rules and adaptive learning

### Agent Debugger
- Set breakpoints on LLM calls, tool usage, state changes
- Time-travel debugging to replay execution
- Visualize agent decision trees

### Structured Output
- Generate data matching JSON Schema or Zod schemas
- Automatic retry on validation failure
- Infer schemas from sample data

### Fine-Tuning
- Prepare datasets from CSV, JSON, or conversations
- Monitor training progress
- Compare model versions

### Prompt Collaboration
- Version control with diffs and history
- Review workflow with approvals
- A/B testing and analytics

### Edge/Offline
- Run models locally with llama.cpp
- Hybrid mode: cloud + edge
- Model management and optimization

### Voice/Real-time
- Real-time voice conversations
- Speech-to-text transcription
- Text-to-speech synthesis

### Advanced RAG
- Multi-modal indexing (text, images, tables)
- Self-correcting answers
- Query optimization and reranking

## Documentation

For detailed documentation, see:
- [Phase 3 Advanced Features Guide](../../docs/PHASE_3_ADVANCED_FEATURES.md)
- [API Reference](../../docs/API_REFERENCE.md)

## Support

- GitHub Issues: https://github.com/waymaker/rana/issues
- Documentation: https://rana.dev/docs
