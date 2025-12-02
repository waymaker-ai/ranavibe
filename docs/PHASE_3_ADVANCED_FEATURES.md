# RANA Phase 3.1: Advanced Features Guide

This guide covers the advanced features introduced in Phase 3.1 of RANA, including model routing, agent debugging, structured output, fine-tuning, prompt collaboration, edge computing, real-time voice, and advanced RAG.

## Table of Contents

1. [Model Router](#model-router)
2. [Agent Debugger](#agent-debugger)
3. [Structured Output](#structured-output)
4. [Fine-Tuning Pipeline](#fine-tuning-pipeline)
5. [Prompt Collaboration](#prompt-collaboration)
6. [Edge/Offline Support](#edgeoffline-support)
7. [Real-Time Voice](#real-time-voice)
8. [Advanced RAG](#advanced-rag)

---

## Model Router

The Model Router provides intelligent request routing across multiple LLM providers, optimizing for cost, latency, or quality.

### Features

- **Multi-provider routing**: Route requests to OpenAI, Anthropic, Google, and more
- **Adaptive strategies**: Cost-optimized, quality-optimized, latency-optimized, balanced
- **Automatic fallback**: Graceful degradation when providers are unavailable
- **Load balancing**: Distribute requests across providers
- **Circuit breaker**: Prevent cascading failures

### Quick Start

```typescript
import { ModelRouter } from '@rana/core';

const router = new ModelRouter({
  providers: ['openai', 'anthropic', 'google'],
  defaultStrategy: 'balanced',
  fallbackEnabled: true,
});

// Route a request
const response = await router.route({
  task: 'code-generation',
  prompt: 'Write a function to sort an array',
  constraints: {
    maxCost: 0.01,
    maxLatency: 2000,
  },
});
```

### CLI Commands

```bash
# Check router status
rana router

# Test routing decision
rana router:test --message "Hello world" --task chat

# Compare strategies
rana router:compare --strategies cost,quality,balanced

# Configure router
rana router:config --strategy adaptive --fallback
```

### Routing Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `cost-optimized` | Minimizes API costs | High-volume applications |
| `quality-optimized` | Uses best available model | Critical tasks |
| `latency-optimized` | Prioritizes response speed | Real-time applications |
| `balanced` | Considers all factors | General use |
| `adaptive` | Learns from usage patterns | Long-running applications |

---

## Agent Debugger

The Agent Debugger provides step-through debugging for AI agents, including breakpoints, time-travel, and decision tree visualization.

### Features

- **Step-through execution**: Pause at any event
- **Breakpoints**: Set breakpoints on LLM calls, tool usage, state changes
- **Time-travel**: Replay and inspect any point in execution
- **Decision tree visualization**: Understand agent reasoning
- **State inspection**: View variables and context at any step

### Quick Start

```typescript
import { AgentDebugger } from '@rana/core';

const debugger = new AgentDebugger({
  stepMode: true,
  breakpoints: ['tool-call', 'llm-request'],
  watchVariables: ['userQuery', 'searchResults'],
});

// Start debugging session
const session = await debugger.startSession(myAgent);

// Step through execution
await session.step();

// Inspect state
console.log(session.getState());

// Visualize decision tree
const tree = session.getDecisionTree();
```

### CLI Commands

```bash
# Debug an agent
rana debug my-agent --step --breakpoints tool-call,llm-request

# Replay a debug session
rana debug:replay dbg-m8k2j --speed 2x

# Visualize decision tree
rana debug:visualize dbg-m8k2j --output tree.html

# List recent sessions
rana debug:sessions -n 10
```

### Event Types

- `llm-request`: LLM API call initiated
- `llm-response`: LLM response received
- `tool-call`: Tool/function called
- `tool-result`: Tool returned result
- `state-change`: Agent state modified
- `thinking`: Agent reasoning step
- `error`: Error occurred

---

## Structured Output

Generate and validate structured data from LLM responses using JSON Schema or Zod.

### Features

- **Schema-based generation**: Define output structure with JSON Schema or Zod
- **Automatic retry**: Retry on validation failure
- **Partial extraction**: Extract valid portions from partial responses
- **Schema inference**: Generate schemas from sample data
- **Type safety**: Full TypeScript support

### Quick Start

```typescript
import { StructuredOutput } from '@rana/core';
import { z } from 'zod';

// Define schema with Zod
const PersonSchema = z.object({
  name: z.string(),
  age: z.number().min(0).max(150),
  email: z.string().email(),
  skills: z.array(z.string()),
});

const generator = new StructuredOutput({
  schema: PersonSchema,
  maxRetries: 3,
});

// Generate structured data
const person = await generator.generate({
  prompt: 'Extract person info from: John Doe, 30 years old, john@example.com, knows TypeScript and Python',
});

console.log(person);
// { name: "John Doe", age: 30, email: "john@example.com", skills: ["TypeScript", "Python"] }
```

### CLI Commands

```bash
# Generate from schema
rana structured ./schemas/person.json --prompt "John is 30 years old"

# Validate data against schema
rana structured:validate ./data.json --schema ./schema.json

# Generate schema from sample
rana structured:schema ./sample.json --output zod
```

---

## Fine-Tuning Pipeline

Prepare datasets and manage fine-tuning jobs across providers.

### Features

- **Dataset preparation**: Convert raw data to training format
- **Multi-provider support**: OpenAI, Anthropic, Together AI
- **Job management**: Monitor training progress
- **Model versioning**: Track and compare fine-tuned models
- **Evaluation**: Test model performance

### Quick Start

```typescript
import { FineTuningPipeline } from '@rana/core';

const pipeline = new FineTuningPipeline({
  provider: 'openai',
  baseModel: 'gpt-4o-mini',
});

// Prepare dataset
const dataset = await pipeline.prepareDataset({
  source: './training-data.jsonl',
  format: 'chat',
  splitRatio: 0.9,
});

// Start fine-tuning
const job = await pipeline.startJob({
  dataset,
  epochs: 3,
  suffix: 'customer-support-v1',
});

// Monitor progress
job.on('progress', (progress) => {
  console.log(`Training: ${progress.percentage}%`);
});
```

### CLI Commands

```bash
# Start fine-tuning
rana finetune ./dataset.jsonl --model gpt-4o-mini --epochs 3

# Check job status
rana finetune:status ft-abc123 --watch

# List datasets
rana finetune:datasets --validate

# Prepare dataset
rana finetune:prepare ./raw-data.csv --format chat --split 0.9

# Compare model versions
rana finetune:compare v1,v2,base --prompts ./test-prompts.txt
```

---

## Prompt Collaboration

Git-like version control for prompts with review workflows.

### Features

- **Version history**: Track all prompt changes
- **Diff visualization**: See what changed between versions
- **Review workflow**: Request and approve changes
- **Publishing**: Deploy prompts to production
- **Rollback**: Quickly revert to previous versions

### Quick Start

```typescript
import { PromptRegistry } from '@rana/core';

const registry = new PromptRegistry({
  storage: 'database', // or 'filesystem'
});

// Create a prompt
await registry.create({
  id: 'customer-support',
  template: 'You are a helpful customer support agent...',
  variables: ['customerName', 'issue'],
});

// Commit changes
await registry.commit('customer-support', {
  message: 'Improved response formatting',
});

// Request review
await registry.requestReview('customer-support', {
  reviewers: ['alice', 'bob'],
});

// Publish to production
await registry.publish('customer-support', { version: 5 });
```

### CLI Commands

```bash
# View version history
rana prompt:version customer-support

# Show diff between versions
rana prompt:version customer-support --diff 1:4

# Commit changes
rana prompt:commit customer-support -m "Updated instructions"

# Request review
rana prompt:review customer-support --reviewers alice,bob

# Approve review
rana prompt:review customer-support --approve --comment "LGTM"

# Publish to production
rana prompt:publish customer-support --version 5

# Rollback
rana prompt:rollback customer-support --version 4
```

---

## Edge/Offline Support

Run models locally with ONNX Runtime and llama.cpp.

### Features

- **Local inference**: Run models on device
- **Offline support**: Works without internet
- **Multiple backends**: ONNX Runtime, llama.cpp
- **Quantization**: Support for Q4, Q8, F16 models
- **Hybrid mode**: Seamlessly switch between cloud and edge

### Quick Start

```typescript
import { EdgeRuntime } from '@rana/core';

const edge = new EdgeRuntime({
  backend: 'llama.cpp',
  modelPath: './models/phi-2-q4.gguf',
  gpuAcceleration: true,
});

// Run inference
const response = await edge.generate({
  prompt: 'Explain quantum computing in simple terms',
  maxTokens: 200,
});

console.log(response.text);
```

### CLI Commands

```bash
# Check edge runtime status
rana edge

# List available models
rana edge:models --installed

# Download a model
rana edge:download llama-2-7b --quantization q4

# Run inference
rana edge:run phi-2-q4 --prompt "Hello, how are you?" --stream

# Benchmark performance
rana edge:benchmark phi-2-q4 --iterations 10
```

### Supported Models

| Model | Size | Context | Speed |
|-------|------|---------|-------|
| phi-2-q4 | 1.6 GB | 2K | Fast |
| tinyllama-1b-q8 | 1.2 GB | 2K | Very Fast |
| llama-2-7b-q4 | 4.1 GB | 4K | Medium |
| mistral-7b-q4 | 4.4 GB | 8K | Medium |
| codellama-7b-q4 | 4.0 GB | 16K | Medium |

---

## Real-Time Voice

Voice conversations with AI using WebRTC.

### Features

- **Real-time transcription**: Speech-to-text with Whisper
- **Text-to-speech**: Generate natural speech
- **Voice activity detection**: Automatic turn-taking
- **Low latency**: Optimized for real-time interaction
- **Multiple voices**: Choose from various voice styles

### Quick Start

```typescript
import { VoiceSession } from '@rana/core';

const session = new VoiceSession({
  model: 'gpt-4o-realtime-preview',
  voice: 'alloy',
  vadEnabled: true,
});

// Start session
await session.connect();

// Handle audio
session.on('audio', (audio) => {
  playAudio(audio);
});

session.on('transcript', (text) => {
  console.log('User said:', text);
});

// Send audio
session.sendAudio(microphoneStream);
```

### CLI Commands

```bash
# Start voice session
rana voice --voice alloy --model gpt-4o-realtime-preview

# Test audio setup
rana voice:test

# Transcribe audio file
rana voice:transcribe ./audio.wav --format srt --output transcript.srt

# Text-to-speech
rana voice:speak "Hello, world!" --voice nova --output hello.mp3 --play
```

### Available Voices

| Voice | Style | Gender |
|-------|-------|--------|
| alloy | Balanced | Neutral |
| echo | Warm | Male |
| fable | British | Male |
| onyx | Deep | Male |
| nova | Friendly | Female |
| shimmer | Expressive | Female |

---

## Advanced RAG

Multi-modal RAG with self-correction and query optimization.

### Features

- **Multi-modal**: Index text, images, and tables
- **Self-correction**: Verify and correct answers
- **Query optimization**: Automatic query expansion
- **Hybrid search**: Combine vector and keyword search
- **Evaluation**: Measure retrieval quality

### Quick Start

```typescript
import { AdvancedRAG } from '@rana/core';

const rag = new AdvancedRAG({
  embeddings: 'text-embedding-3-small',
  retriever: 'hybrid',
  reranker: 'cross-encoder',
  selfCorrection: true,
});

// Index documents
await rag.index({
  source: './docs',
  modalities: ['text', 'image', 'table'],
  chunker: 'semantic',
});

// Query with verification
const result = await rag.query({
  question: 'How does the routing system work?',
  topK: 5,
  verify: true,
  citations: true,
});

console.log(result.answer);
console.log(result.citations);
console.log(result.confidence);
```

### CLI Commands

```bash
# Index documents
rana rag:index ./docs --modalities text,image,table

# Query with verification
rana rag:query "How does routing work?" --verify --citations

# Check RAG status
rana rag:status

# Evaluate performance
rana rag:eval ./test-questions.json --metrics relevance,faithfulness

# Configure RAG
rana rag:config --retriever hybrid --reranker cross-encoder --self-correct
```

### RAG Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Context Relevance | Retrieved docs match query | > 0.8 |
| Answer Faithfulness | Answer grounded in sources | > 0.9 |
| Answer Correctness | Factual accuracy | > 0.85 |
| Answer Relevance | Answer addresses query | > 0.85 |
| Retrieval Precision | Top-k quality | > 0.75 |

---

## Configuration

All Phase 3.1 features can be configured in `.rana.yml`:

```yaml
version: "2.0"

router:
  providers:
    - openai
    - anthropic
    - google
  defaultStrategy: balanced
  fallbackEnabled: true

debugger:
  enabled: true
  storeSessions: true
  maxSessions: 100

structuredOutput:
  maxRetries: 3
  partialExtraction: true

fineTuning:
  defaultProvider: openai
  datasetPath: ./datasets

prompts:
  storage: database
  reviewRequired: true

edge:
  backend: llama.cpp
  modelsPath: ./models
  gpuAcceleration: true

voice:
  defaultVoice: alloy
  vadSensitivity: medium

rag:
  embeddings: text-embedding-3-small
  retriever: hybrid
  selfCorrection: true
```

---

## Best Practices

### Model Router
- Use `adaptive` strategy for long-running applications
- Set appropriate cost and latency constraints
- Enable fallback for production deployments

### Agent Debugger
- Use step mode during development
- Set breakpoints on critical operations
- Export decision trees for documentation

### Structured Output
- Use Zod for type-safe schemas
- Enable partial extraction for long responses
- Test with edge cases

### Fine-Tuning
- Prepare high-quality datasets
- Use validation sets for evaluation
- Start with fewer epochs and iterate

### Prompt Collaboration
- Write descriptive commit messages
- Require reviews for production prompts
- Test prompts before publishing

### Edge/Offline
- Choose appropriate quantization for your hardware
- Benchmark before deployment
- Use hybrid mode for flexibility

### Voice
- Test audio setup before sessions
- Use push-to-talk in noisy environments
- Choose voice style appropriate for use case

### Advanced RAG
- Use semantic chunking for better retrieval
- Enable self-correction for critical applications
- Regularly evaluate and tune performance

---

## Troubleshooting

### Router not finding providers
```bash
# Check provider configuration
rana config:validate

# Verify API keys
rana config:list
```

### Debug session not starting
```bash
# Verify agent is properly configured
rana doctor

# Check for missing dependencies
npm install
```

### Edge models not loading
```bash
# Check model files
rana edge:models --installed

# Re-download model
rana edge:download <model> --force
```

### RAG returning poor results
```bash
# Evaluate current performance
rana rag:eval --metrics all

# Re-index with different settings
rana rag:index ./docs --chunker semantic --chunk-size 256
```

---

## API Reference

For detailed API documentation, see:
- [@rana/core API Reference](./API_REFERENCE.md)
- [TypeScript Types](../packages/core/src/types.ts)
- [Examples](../examples/)
