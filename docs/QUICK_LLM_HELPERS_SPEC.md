# Quick LLM Helpers Specification

## Executive Summary

**Feature**: Quick LLM Helper Functions for RANA Framework
**Priority**: P1 (Developer Experience)
**Impact**: Development Speed, Ease of Use
**Timeline**: Q1 2025 (4 weeks)

This specification defines simple, ergonomic helper functions for common LLM tasks. The `quick` API provides one-liner access to frequent operations like summarization, translation, classification, and extraction without verbose setup.

---

## Problem Statement

### Current State

RANA developers must:
- Write verbose boilerplate for simple LLM tasks
- Configure client, model, prompt for each operation
- Handle streaming, errors, retries manually
- Repeat common patterns across projects

### Example: Current Approach

```typescript
// Current: Verbose boilerplate for simple summarization
import { createRanaClient } from '@rana/core';

const client = createRanaClient({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4',
});

const response = await client.complete({
  prompt: `Summarize this text in 2-3 sentences:\n\n${longText}`,
  temperature: 0.3,
  maxTokens: 200,
});

const summary = response.content;
```

### Target State: Quick API

```typescript
// New: One-liner for common tasks
import { quick } from '@rana/quick';

// Summarization
const summary = await quick.summarize(longText);

// Translation
const translated = await quick.translate(text, { to: 'es' });

// Classification
const category = await quick.classify(email, {
  labels: ['spam', 'important', 'newsletter'],
});

// Extraction
const entities = await quick.extract(resume, {
  schema: { name: 'string', email: 'string', skills: 'string[]' },
});

// Sentiment
const sentiment = await quick.sentiment(review); // 'positive' | 'negative' | 'neutral'

// Q&A
const answer = await quick.answer(question, { context: documentation });

// Rewriting
const improved = await quick.rewrite(draft, { tone: 'professional' });

// Generation
const content = await quick.generate('blog post about AI safety', {
  length: 'medium',
  tone: 'technical',
});
```

---

## Technical Architecture

### 1. Package Structure

```
@rana/quick
├── summarize.ts          # Text summarization
├── translate.ts          # Language translation
├── classify.ts           # Text classification
├── extract.ts            # Structured extraction
├── sentiment.ts          # Sentiment analysis
├── answer.ts             # Question answering
├── rewrite.ts            # Text rewriting
├── generate.ts           # Content generation
├── compare.ts            # Text comparison
├── moderate.ts           # Content moderation
├── core/
│   ├── client.ts         # Shared client
│   ├── cache.ts          # Result caching
│   ├── retry.ts          # Retry logic
│   └── config.ts         # Global config
└── types.ts              # Type definitions
```

### 2. Core Design Principles

1. **Zero Configuration**: Works out of the box with sensible defaults
2. **Type Safe**: Full TypeScript support with inference
3. **Cached by Default**: Automatic caching for identical inputs
4. **Cost Optimized**: Use cheapest appropriate model
5. **Error Resilient**: Automatic retries with exponential backoff
6. **Streaming Optional**: Easy opt-in for streaming responses

---

## API Reference

### 1. Summarize

```typescript
// packages/quick/src/summarize.ts

export interface SummarizeOptions {
  length?: 'short' | 'medium' | 'long';    // Number of sentences
  format?: 'paragraph' | 'bullets';        // Output format
  style?: 'simple' | 'technical';          // Language style
  focus?: string;                          // What to focus on
  model?: string;                          // Override model
  stream?: boolean;                        // Stream response
}

/**
 * Summarize text in 2-3 sentences
 */
export async function summarize(
  text: string,
  options?: SummarizeOptions
): Promise<string> {
  const lengthMap = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    long: '2-3 paragraphs',
  };

  const length = lengthMap[options?.length || 'short'];
  const format = options?.format || 'paragraph';
  const focus = options?.focus ? `\nFocus on: ${options.focus}` : '';

  const prompt = `
Summarize this text in ${length}.${focus}

Text:
${text}

Summary${format === 'bullets' ? ' (bullet points)' : ''}:
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-haiku',
    temperature: 0.3,
    maxTokens: 500,
    cache: true,
  });

  return result.trim();
}

/**
 * Streaming version
 */
export async function* summarizeStream(
  text: string,
  options?: SummarizeOptions
): AsyncGenerator<string> {
  // ... streaming implementation
}

// Usage examples
const short = await summarize(article);
const bullets = await summarize(article, { format: 'bullets' });
const technical = await summarize(paper, { style: 'technical', length: 'long' });
const focused = await summarize(report, { focus: 'key findings and recommendations' });
```

### 2. Translate

```typescript
// packages/quick/src/translate.ts

export interface TranslateOptions {
  to: string;                              // Target language (ISO 639-1)
  from?: string;                           // Source language (auto-detect if omitted)
  tone?: 'formal' | 'casual';              // Translation style
  preserveFormatting?: boolean;            // Keep markdown/HTML
  model?: string;
}

/**
 * Translate text to another language
 */
export async function translate(
  text: string,
  options: TranslateOptions
): Promise<string> {
  const fromLang = options.from || 'auto-detect';
  const toLang = LANGUAGE_NAMES[options.to] || options.to;
  const tone = options.tone ? ` in a ${options.tone} tone` : '';

  const prompt = `
Translate this text from ${fromLang} to ${toLang}${tone}.
${options.preserveFormatting ? 'Preserve all formatting (markdown, HTML, etc.).' : ''}

Text:
${text}

Translation:
`;

  const result = await getClient().complete(prompt, {
    model: options.model || 'claude-haiku',
    temperature: 0.3,
    cache: true,
  });

  return result.trim();
}

// Usage examples
const spanish = await translate(text, { to: 'es' });
const formal = await translate(email, { to: 'ja', tone: 'formal' });
const preserved = await translate(markdown, { to: 'fr', preserveFormatting: true });
```

### 3. Classify

```typescript
// packages/quick/src/classify.ts

export interface ClassifyOptions<T extends string = string> {
  labels: readonly T[];                    // Classification labels
  description?: string;                    // What you're classifying
  multiLabel?: boolean;                    // Allow multiple labels
  confidence?: boolean;                    // Return confidence scores
  model?: string;
}

export type ClassifyResult<T extends string> =
  | T
  | { label: T; confidence: number }
  | T[]
  | Array<{ label: T; confidence: number }>;

/**
 * Classify text into predefined categories
 */
export async function classify<T extends string>(
  text: string,
  options: ClassifyOptions<T>
): Promise<ClassifyResult<T>> {
  const description = options.description || 'this text';
  const multiLabel = options.multiLabel ? ' (select all that apply)' : '';

  const prompt = `
Classify ${description} into one of these categories${multiLabel}:
${options.labels.map((l, i) => `${i + 1}. ${l}`).join('\n')}

Text:
${text}

${options.confidence ? 'Output: label (confidence 0-1)' : 'Output: label only'}
`;

  const result = await getClient().complete(prompt, {
    model: options.model || 'claude-haiku',
    temperature: 0,
    cache: true,
  });

  // Parse result
  if (options.confidence) {
    return this.parseWithConfidence(result, options.labels);
  } else if (options.multiLabel) {
    return this.parseMultiLabel(result, options.labels);
  } else {
    return this.parseSingleLabel(result, options.labels);
  }
}

// Usage examples
const category = await classify(email, {
  labels: ['spam', 'important', 'newsletter', 'personal'],
});

const sentiment = await classify(review, {
  labels: ['positive', 'negative', 'neutral'],
  description: 'customer review',
});

const topics = await classify(article, {
  labels: ['tech', 'business', 'politics', 'sports'],
  multiLabel: true,
});

const withConfidence = await classify(email, {
  labels: ['urgent', 'normal', 'low-priority'],
  confidence: true,
});
// Result: { label: 'urgent', confidence: 0.92 }
```

### 4. Extract

```typescript
// packages/quick/src/extract.ts

export interface ExtractOptions<T = any> {
  schema: ExtractSchema<T>;                // What to extract
  description?: string;                    // Context about the data
  multiple?: boolean;                      // Extract array of items
  strict?: boolean;                        // Fail if schema doesn't match
  model?: string;
}

export type ExtractSchema<T> = {
  [K in keyof T]: 'string' | 'number' | 'boolean' | 'date' | 'string[]' | 'number[]' | ExtractSchema<any>;
};

/**
 * Extract structured data from unstructured text
 */
export async function extract<T>(
  text: string,
  options: ExtractOptions<T>
): Promise<T | T[]> {
  const schemaDescription = this.describeSchema(options.schema);
  const multiple = options.multiple ? ' (return array of matches)' : '';

  const prompt = `
Extract structured data from this text${multiple}.

Schema:
${schemaDescription}

${options.description ? `Context: ${options.description}\n` : ''}
Text:
${text}

Output valid JSON matching the schema:
`;

  const result = await getClient().complete(prompt, {
    model: options.model || 'claude-haiku',
    temperature: 0,
    responseFormat: { type: 'json_object' },
    cache: true,
  });

  const parsed = JSON.parse(result);

  // Validate against schema
  if (options.strict) {
    this.validateSchema(parsed, options.schema);
  }

  return parsed as T | T[];
}

// Usage examples
const contact = await extract(email, {
  schema: {
    name: 'string',
    email: 'string',
    phone: 'string',
    company: 'string',
  },
});

const resume = await extract(resumeText, {
  schema: {
    name: 'string',
    email: 'string',
    experience: 'number',
    skills: 'string[]',
    education: {
      degree: 'string',
      school: 'string',
      year: 'number',
    },
  },
  description: 'candidate resume',
});

const products = await extract(webpage, {
  schema: {
    name: 'string',
    price: 'number',
    inStock: 'boolean',
  },
  multiple: true,
});
```

### 5. Sentiment

```typescript
// packages/quick/src/sentiment.ts

export interface SentimentOptions {
  detailed?: boolean;                      // Return scores for all sentiments
  aspects?: string[];                      // Analyze specific aspects
  model?: string;
}

export type SentimentResult =
  | 'positive' | 'negative' | 'neutral'
  | { overall: 'positive' | 'negative' | 'neutral'; scores: Record<string, number> }
  | { aspect: string; sentiment: 'positive' | 'negative' | 'neutral' }[];

/**
 * Analyze sentiment of text
 */
export async function sentiment(
  text: string,
  options?: SentimentOptions
): Promise<SentimentResult> {
  if (options?.aspects) {
    return this.aspectSentiment(text, options.aspects);
  }

  const prompt = `
Analyze the sentiment of this text.

Text:
${text}

${options?.detailed
  ? 'Output JSON: { "overall": "positive/negative/neutral", "scores": { "positive": 0-1, "negative": 0-1, "neutral": 0-1 } }'
  : 'Output one word: positive, negative, or neutral'
}
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-haiku',
    temperature: 0,
    responseFormat: options?.detailed ? { type: 'json_object' } : undefined,
    cache: true,
  });

  if (options?.detailed) {
    return JSON.parse(result);
  } else {
    return result.trim().toLowerCase() as 'positive' | 'negative' | 'neutral';
  }
}

// Usage examples
const simple = await sentiment(review);
// 'positive'

const detailed = await sentiment(review, { detailed: true });
// { overall: 'positive', scores: { positive: 0.85, negative: 0.05, neutral: 0.10 } }

const aspects = await sentiment(review, {
  aspects: ['product quality', 'shipping', 'customer service'],
});
// [
//   { aspect: 'product quality', sentiment: 'positive' },
//   { aspect: 'shipping', sentiment: 'negative' },
//   { aspect: 'customer service', sentiment: 'positive' }
// ]
```

### 6. Answer

```typescript
// packages/quick/src/answer.ts

export interface AnswerOptions {
  context?: string | string[];             // Context for answering
  concise?: boolean;                       // Keep answer brief
  citations?: boolean;                     // Include sources
  model?: string;
}

/**
 * Answer a question, optionally with context
 */
export async function answer(
  question: string,
  options?: AnswerOptions
): Promise<string> {
  const context = options?.context
    ? Array.isArray(options.context)
      ? options.context.join('\n\n---\n\n')
      : options.context
    : null;

  const prompt = context
    ? `
Answer this question using the provided context.

Context:
${context}

Question: ${question}

${options?.concise ? 'Answer concisely in 1-2 sentences.' : 'Answer:'}
${options?.citations ? 'Include citations from the context.' : ''}
`
    : `
Answer this question.

Question: ${question}

${options?.concise ? 'Answer concisely in 1-2 sentences.' : 'Answer:'}
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-sonnet-4',
    temperature: 0.3,
    cache: true,
  });

  return result.trim();
}

// Usage examples
const general = await answer("What is the capital of France?");

const withContext = await answer("How do I deploy to production?", {
  context: docsContent,
  citations: true,
});

const concise = await answer("Explain quantum computing", {
  concise: true,
});
```

### 7. Rewrite

```typescript
// packages/quick/src/rewrite.ts

export interface RewriteOptions {
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'persuasive';
  length?: 'shorter' | 'same' | 'longer';
  style?: 'simple' | 'technical' | 'creative';
  fix?: ('grammar' | 'spelling' | 'clarity' | 'conciseness')[];
  model?: string;
}

/**
 * Rewrite text with different tone, style, or improvements
 */
export async function rewrite(
  text: string,
  options?: RewriteOptions
): Promise<string> {
  const instructions: string[] = [];

  if (options?.tone) {
    instructions.push(`Use a ${options.tone} tone`);
  }

  if (options?.length) {
    instructions.push(`Make it ${options.length}`);
  }

  if (options?.style) {
    instructions.push(`Use ${options.style} language`);
  }

  if (options?.fix) {
    instructions.push(`Fix ${options.fix.join(', ')}`);
  }

  const prompt = `
Rewrite this text.

Instructions:
${instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Original:
${text}

Rewritten:
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-sonnet-4',
    temperature: 0.5,
    cache: true,
  });

  return result.trim();
}

// Usage examples
const professional = await rewrite(email, { tone: 'professional' });

const concise = await rewrite(draft, {
  length: 'shorter',
  fix: ['clarity', 'conciseness'],
});

const simplified = await rewrite(technical, {
  style: 'simple',
  tone: 'friendly',
});
```

### 8. Generate

```typescript
// packages/quick/src/generate.ts

export interface GenerateOptions {
  length?: 'short' | 'medium' | 'long';    // Content length
  tone?: 'professional' | 'casual' | 'formal' | 'creative';
  format?: 'paragraph' | 'bullets' | 'outline';
  include?: string[];                      // Topics to include
  style?: string;                          // Custom style guide
  model?: string;
  stream?: boolean;
}

/**
 * Generate content from a description
 */
export async function generate(
  description: string,
  options?: GenerateOptions
): Promise<string> {
  const lengthMap = {
    short: '1-2 paragraphs',
    medium: '3-5 paragraphs',
    long: '6-10 paragraphs',
  };

  const length = lengthMap[options?.length || 'medium'];
  const tone = options?.tone ? ` in a ${options.tone} tone` : '';
  const format = options?.format || 'paragraph';
  const include = options?.include?.length
    ? `\n\nInclude these topics:\n${options.include.map(t => `- ${t}`).join('\n')}`
    : '';
  const style = options?.style ? `\n\nStyle guide: ${options.style}` : '';

  const prompt = `
Generate content based on this description.

Description: ${description}

Length: ${length}
Format: ${format}${tone}${include}${style}

Content:
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 2000,
    cache: true,
  });

  return result.trim();
}

// Usage examples
const blog = await generate('blog post about AI safety', {
  length: 'long',
  tone: 'professional',
  include: ['current challenges', 'best practices', 'future outlook'],
});

const email = await generate('follow-up email to client about project delay', {
  tone: 'professional',
  length: 'short',
});

const outline = await generate('product launch strategy', {
  format: 'outline',
  length: 'medium',
});
```

### 9. Compare

```typescript
// packages/quick/src/compare.ts

export interface CompareOptions {
  criteria?: string[];                     // What to compare
  format?: 'prose' | 'table' | 'bullets';
  model?: string;
}

/**
 * Compare two texts and highlight differences/similarities
 */
export async function compare(
  text1: string,
  text2: string,
  options?: CompareOptions
): Promise<string> {
  const criteria = options?.criteria?.length
    ? `\n\nFocus comparison on: ${options.criteria.join(', ')}`
    : '';
  const format = options?.format || 'prose';

  const prompt = `
Compare these two texts. Highlight key differences and similarities.${criteria}

Text 1:
${text1}

Text 2:
${text2}

Comparison${format === 'table' ? ' (table format)' : format === 'bullets' ? ' (bullet points)' : ''}:
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-sonnet-4',
    temperature: 0.3,
    cache: true,
  });

  return result.trim();
}

// Usage examples
const diff = await compare(version1, version2);

const detailed = await compare(proposal1, proposal2, {
  criteria: ['cost', 'timeline', 'risk'],
  format: 'table',
});
```

### 10. Moderate

```typescript
// packages/quick/src/moderate.ts

export interface ModerateOptions {
  categories?: string[];                   // What to check for
  threshold?: 'low' | 'medium' | 'high';   // Sensitivity
  details?: boolean;                       // Return detailed scores
  model?: string;
}

export interface ModerationResult {
  safe: boolean;
  flagged: string[];
  scores?: Record<string, number>;
  explanation?: string;
}

/**
 * Check content for safety/policy violations
 */
export async function moderate(
  text: string,
  options?: ModerateOptions
): Promise<ModerationResult> {
  const categories = options?.categories || [
    'hate speech',
    'violence',
    'sexual content',
    'harassment',
    'illegal activity',
  ];

  const prompt = `
Review this content for policy violations.

Categories to check:
${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Content:
${text}

Output JSON:
{
  "safe": true/false,
  "flagged": ["category1", "category2"],
  ${options?.details ? '"scores": { "category": 0-1 },' : ''}
  "explanation": "brief explanation"
}
`;

  const result = await getClient().complete(prompt, {
    model: options?.model || 'claude-haiku',
    temperature: 0,
    responseFormat: { type: 'json_object' },
    cache: true,
  });

  return JSON.parse(result);
}

// Usage examples
const check = await moderate(userComment);
// { safe: true, flagged: [] }

const detailed = await moderate(post, {
  details: true,
  threshold: 'medium',
});
// {
//   safe: false,
//   flagged: ['hate speech'],
//   scores: { 'hate speech': 0.85, 'violence': 0.1 },
//   explanation: 'Contains offensive language targeting a group'
// }
```

---

## Caching & Performance

```typescript
// packages/quick/src/core/cache.ts

export class QuickCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Cache results with TTL
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Generate cache key from inputs
   */
  generateKey(fn: string, ...args: any[]): string {
    const hash = createHash('sha256');
    hash.update(fn);
    hash.update(JSON.stringify(args));
    return hash.digest('hex');
  }
}

// Automatic caching decorator
function cached(ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      const key = cache.generateKey(propertyKey, ...args);

      // Check cache
      const cached = await cache.get(key);
      if (cached) {
        return cached;
      }

      // Execute and cache
      const result = await originalMethod.apply(this, args);
      await cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}
```

---

## Configuration

```typescript
// packages/quick/src/core/config.ts

export interface QuickConfig {
  // Default model for each function
  models?: {
    summarize?: string;
    translate?: string;
    classify?: string;
    extract?: string;
    sentiment?: string;
    answer?: string;
    rewrite?: string;
    generate?: string;
  };

  // Caching
  cache?: {
    enabled?: boolean;
    ttl?: number;                          // Default TTL (ms)
    maxSize?: number;                      // Max cache entries
  };

  // Retry logic
  retry?: {
    enabled?: boolean;
    attempts?: number;
    backoff?: 'linear' | 'exponential';
  };

  // Cost optimization
  cost?: {
    maxPerCall?: number;                   // Max cost per call (USD)
    preferCheaper?: boolean;               // Prefer cheaper models
  };

  // Logging
  logging?: {
    level?: 'none' | 'error' | 'warn' | 'info' | 'debug';
    costs?: boolean;                       // Log costs
    latency?: boolean;                     // Log latency
  };
}

// Global configuration
let globalConfig: QuickConfig = {
  cache: {
    enabled: true,
    ttl: 3600000,
    maxSize: 1000,
  },
  retry: {
    enabled: true,
    attempts: 3,
    backoff: 'exponential',
  },
  cost: {
    preferCheaper: true,
  },
  logging: {
    level: 'warn',
    costs: true,
    latency: true,
  },
};

export function configure(config: Partial<QuickConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

// Usage
import { configure } from '@rana/quick';

configure({
  models: {
    summarize: 'claude-haiku',        // Use faster model for summaries
    answer: 'claude-opus-4',          // Use best model for Q&A
  },
  cache: {
    enabled: true,
    ttl: 7200000,                     // 2 hours
  },
  cost: {
    maxPerCall: 0.10,                 // Max $0.10 per call
  },
});
```

---

## React Hooks

```typescript
// packages/quick/src/react/hooks.ts

/**
 * Hook for quick LLM operations
 */
export function useQuick() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cost, setCost] = useState(0);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const startTime = Date.now();
        const result = await fn();
        const latency = Date.now() - startTime;

        // Track cost (if available)
        const currentCost = getLastCallCost();
        setCost(prev => prev + currentCost);

        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { execute, isLoading, error, cost };
}

// Usage example
function SummaryButton({ text }: { text: string }) {
  const { execute, isLoading, error } = useQuick();
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    const result = await execute(() => quick.summarize(text));
    setSummary(result);
  };

  return (
    <div>
      <button onClick={handleSummarize} disabled={isLoading}>
        {isLoading ? 'Summarizing...' : 'Summarize'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {summary && <p>{summary}</p>}
    </div>
  );
}
```

---

## CLI Commands

```bash
# Quick commands via CLI
rana quick summarize --text "Long article..." --format bullets

rana quick translate --text "Hello world" --to es

rana quick classify --text "User email..." --labels "spam,important,newsletter"

rana quick extract --text "Resume text..." --schema "name,email,skills[]"

rana quick sentiment --text "Product review..."

# Batch processing
rana quick summarize --input articles.txt --output summaries.txt

# Configuration
rana quick config --cache-ttl 7200 --prefer-cheaper
```

---

## Implementation Plan

### Phase 1: Core Functions (Weeks 1-2)
- Summarize
- Translate
- Classify
- Extract
- Basic caching

### Phase 2: Advanced Functions (Week 3)
- Sentiment
- Answer
- Rewrite
- Generate
- React hooks

### Phase 3: Polish & Optimization (Week 4)
- Compare
- Moderate
- Advanced caching
- Cost optimization
- CLI integration
- Documentation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API call latency | < 2s |
| Cache hit rate | > 60% |
| Cost per call | < $0.01 |
| Developer adoption | > 70% of RANA users |
| Code reduction | > 80% fewer lines |

---

## Examples

### Real-World Use Cases

**1. Customer Support Automation**
```typescript
import { quick } from '@rana/quick';

async function handleSupportEmail(email: string) {
  // Classify urgency
  const urgency = await quick.classify(email, {
    labels: ['urgent', 'normal', 'low'],
  });

  // Extract issue details
  const issue = await quick.extract(email, {
    schema: {
      problem: 'string',
      product: 'string',
      customerName: 'string',
    },
  });

  // Generate response
  const response = await quick.generate(
    `Support response for ${issue.problem} with ${issue.product}`,
    { tone: 'professional', length: 'short' }
  );

  return { urgency, issue, response };
}
```

**2. Content Moderation Pipeline**
```typescript
import { quick } from '@rana/quick';

async function moderateUserPost(post: string) {
  // Check for policy violations
  const moderation = await quick.moderate(post);

  if (!moderation.safe) {
    return { allowed: false, reason: moderation.explanation };
  }

  // Classify sentiment
  const sentiment = await quick.sentiment(post);

  // Classify topic
  const topic = await quick.classify(post, {
    labels: ['tech', 'business', 'lifestyle', 'other'],
  });

  return { allowed: true, sentiment, topic };
}
```

**3. Document Processing**
```typescript
import { quick } from '@rana/quick';

async function processDocument(doc: string) {
  // Summarize
  const summary = await quick.summarize(doc, {
    length: 'medium',
    format: 'bullets',
  });

  // Extract entities
  const entities = await quick.extract(doc, {
    schema: {
      people: 'string[]',
      organizations: 'string[]',
      locations: 'string[]',
      dates: 'date[]',
    },
    multiple: true,
  });

  // Classify document type
  const type = await quick.classify(doc, {
    labels: ['contract', 'invoice', 'report', 'letter'],
  });

  return { summary, entities, type };
}
```

---

**Status**: Draft Specification
**Version**: 1.0
**Last Updated**: 2025-11-25
