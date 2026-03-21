# @ranavibe/llm-detect

LLM-augmented detection using a small model (Haiku/mini) for edge cases that regex patterns cannot catch. Zero runtime dependencies.

## Overview

Standard regex-based detection misses obfuscated PII, novel injection techniques, and context-dependent toxicity. This package uses a small, fast LLM to catch what regex cannot, while falling back to regex for well-known patterns (hybrid approach).

## Features

- **LLM-powered detection** of obfuscated PII, novel injections, subtle toxicity, and compliance issues
- **Hybrid mode** combining fast regex with smart LLM for best coverage
- **Multi-provider support** for Anthropic and OpenAI (using native fetch, no SDK dependencies)
- **Automatic fallback** to regex when LLM is unavailable
- **Cost estimation** for LLM calls
- **Zero runtime dependencies**

## Installation

```bash
npm install @ranavibe/llm-detect
```

## Quick Start

### LLM-only Detection

```typescript
import { LLMDetector } from '@ranavibe/llm-detect';

const detector = new LLMDetector({
  model: 'claude-haiku-4-5-20251001',
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  confidenceThreshold: 0.8,
  fallbackToRegex: true,
});

// Detects obfuscated PII that regex misses
const result = await detector.detect({
  text: 'My social is one two three, forty five, sixty seven eighty nine',
  type: 'pii',
});
// Finds SSN written in words!
console.log(result.findings);
```

### Hybrid Detection (Recommended)

```typescript
import { HybridDetector } from '@ranavibe/llm-detect';

const detector = new HybridDetector({
  model: 'claude-haiku-4-5-20251001',
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  confidenceThreshold: 0.8,
});

// 1. Regex runs first (fast, free)
// 2. If regex confidence < threshold, LLM runs
// 3. Results are merged and deduplicated
const result = await detector.detect({
  text: 'Contact me at user at example dot com or 555-123-4567',
  type: 'pii',
});
```

### Regex-only Detection

```typescript
import { regexDetect } from '@ranavibe/llm-detect';

// Fast, free detection for well-known patterns
const findings = regexDetect('My SSN is 123-45-6789', 'pii');
```

## Detection Types

| Type | Description | LLM Advantage |
|------|-------------|---------------|
| `pii` | Personally identifiable information | Finds obfuscated, spelled-out, split, or encoded PII |
| `injection` | Prompt injection and jailbreak attempts | Detects novel techniques not in pattern databases |
| `toxicity` | Harmful or inappropriate content | Understands sarcasm, coded language, context |
| `compliance` | Framework-specific compliance checks | Evaluates nuanced compliance scenarios |

## Providers

### Anthropic

```typescript
const detector = new LLMDetector({
  model: 'claude-haiku-4-5-20251001',
  provider: 'anthropic',
  apiKey: 'sk-ant-...',
});
```

### OpenAI

```typescript
const detector = new LLMDetector({
  model: 'gpt-4o-mini',
  provider: 'openai',
  apiKey: 'sk-...',
});
```

## API

### `LLMDetector`

Main detector class using LLM with optional regex fallback.

- `detect(request)` - Detect issues in text
- `detectAll(text, types?, context?)` - Run multiple detection types
- `updateConfig(updates)` - Update configuration

### `HybridDetector`

Combines regex and LLM for optimal coverage and cost.

- `detect(request)` - Hybrid detection (regex first, LLM if needed)
- `detectAll(text, types?, context?)` - Run multiple detection types

### `regexDetect(text, type)`

Standalone regex detection function (no LLM required).

## Cost

The package estimates LLM costs per request. Using small models like Claude Haiku or GPT-4o-mini keeps costs under $0.001 per detection.

## License

MIT
