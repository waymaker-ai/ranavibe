# @waymakerai/aicofounder-streaming

Guard SSE/streaming LLM responses token-by-token. Catch PII, prompt injection, and toxicity mid-stream in real-time.

**Zero runtime dependencies.**

## Installation

```bash
npm install @waymakerai/aicofounder-streaming
```

## Quick Start

### With Anthropic SDK

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { StreamGuard } from '@waymakerai/aicofounder-streaming';

const client = new Anthropic();
const guard = new StreamGuard({
  pii: { enabled: true, redact: true },
  injection: { enabled: true, blockOnDetection: true },
  toxicity: { enabled: true },
});

const stream = client.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Tell me about data privacy.' }],
});

for await (const event of guard.guardAnthropic(stream)) {
  switch (event.type) {
    case 'chunk':
      // Safe chunk — render to UI
      process.stdout.write(event.data.text ?? '');
      break;
    case 'redacted':
      // PII was found and redacted
      process.stdout.write(event.data.text ?? '');
      console.warn('PII redacted:', event.data.violation?.detail);
      break;
    case 'violation':
      // Non-blocking violation detected
      console.warn('Violation:', event.data.violation?.detail);
      break;
    case 'blocked':
      // Stream blocked due to critical violation
      console.error('Stream blocked:', event.data.reason);
      break;
    case 'complete':
      // Stream finished — get report
      console.log('\nReport:', event.data.report);
      break;
  }
}
```

### With OpenAI SDK

```typescript
import OpenAI from 'openai';
import { StreamGuard } from '@waymakerai/aicofounder-streaming';

const client = new OpenAI();
const guard = new StreamGuard();

const stream = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

for await (const event of guard.guardOpenAI(stream)) {
  if (event.type === 'chunk') {
    process.stdout.write(event.data.text ?? '');
  }
}

const report = guard.finalize();
console.log(`Processed ${report.totalChunks} chunks, ${report.violations.length} violations`);
```

### With Any Async Iterable

```typescript
import { StreamGuard } from '@waymakerai/aicofounder-streaming';

const guard = new StreamGuard({
  bufferSize: 300,       // Sliding window size in chars
  flushInterval: 500,    // Flush interval in ms
  pii: {
    enabled: true,
    redact: true,
    replacement: '***',
    categories: ['email', 'phone', 'ssn', 'credit_card'],
  },
  injection: {
    enabled: true,
    blockOnDetection: true,
    checkInterval: 5,    // Check every 5 chunks
  },
  toxicity: {
    enabled: true,
    blockOnDetection: false,
    minSeverity: 'medium',
  },
});

async function* myStream(): AsyncGenerator<string> {
  yield 'Hello, ';
  yield 'my email is ';
  yield 'user@example.com';
  yield ' and I need help.';
}

for await (const event of guard.guard(myStream())) {
  if (event.type === 'chunk' || event.type === 'redacted') {
    process.stdout.write(event.data.text ?? '');
  }
}
```

### Generic SSE Parsing

```typescript
import { extractSSETextDeltas, StreamGuard } from '@waymakerai/aicofounder-streaming';

// Parse raw SSE from any provider
const guard = new StreamGuard();

async function guardFetchStream(url: string) {
  const response = await fetch(url);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  async function* readChunks(): AsyncGenerator<string> {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  }

  const textDeltas = extractSSETextDeltas(readChunks());

  for await (const event of guard.guard(textDeltas)) {
    if (event.type === 'chunk') {
      process.stdout.write(event.data.text ?? '');
    }
  }
}
```

### Processing Individual Chunks

```typescript
import { StreamGuard } from '@waymakerai/aicofounder-streaming';

const guard = new StreamGuard();

// Process chunks one at a time (e.g., in a WebSocket handler)
const event1 = guard.processChunk('Hello, ');
const event2 = guard.processChunk('my SSN is ');
const event3 = guard.processChunk('123-45-6789');
// event3.type === 'redacted'

const report = guard.finalize();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bufferSize` | `number` | `200` | Sliding window size in characters |
| `flushInterval` | `number` | `500` | Flush interval in ms |
| `pii.enabled` | `boolean` | `true` | Enable PII detection |
| `pii.redact` | `boolean` | `true` | Replace detected PII |
| `pii.replacement` | `string` | `'[REDACTED]'` | Replacement string |
| `pii.categories` | `PiiCategory[]` | all | PII types to detect |
| `injection.enabled` | `boolean` | `true` | Enable injection detection |
| `injection.blockOnDetection` | `boolean` | `true` | Block stream on injection |
| `injection.checkInterval` | `number` | `5` | Check every N chunks |
| `toxicity.enabled` | `boolean` | `true` | Enable toxicity detection |
| `toxicity.blockOnDetection` | `boolean` | `false` | Block stream on toxicity |
| `toxicity.minSeverity` | `ViolationSeverity` | `'medium'` | Minimum severity to flag |

## How It Works

1. **Buffering**: Tokens are accumulated into a sliding window buffer. Pattern matching runs against the buffer, not individual tokens, avoiding false positives on partial matches.

2. **PII Detection**: Every chunk triggers a PII scan of the buffer. Matches at the buffer edge are held until confirmed complete. Detected PII is redacted in real-time.

3. **Injection Detection**: Accumulated text is checked periodically (every N chunks) for prompt injection patterns. Critical injections block the stream immediately.

4. **Toxicity Detection**: Toxicity checks run at sentence boundaries for natural, efficient detection. The buffer flushes on sentence-ending punctuation.

5. **Events**: The guard emits typed events (`chunk`, `violation`, `redacted`, `blocked`, `complete`) so your UI can react appropriately to each situation.

## License

MIT
