# LLM Optimization Guide for RANA

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

LLM costs can spiral out of control quickly. A typical application can spend $1,000-$5,000/month on LLM API calls. This guide shows you how to **reduce costs by 70%** while maintaining or improving quality through systematic optimization.

**RANA Principle:** Optimize by default. Every LLM call should be efficient, cached when possible, and cost-monitored.

---

## Table of Contents

1. [Cost Analysis](#cost-analysis)
2. [Token Optimization](#token-optimization)
3. [Caching Strategies](#caching-strategies)
4. [Model Selection](#model-selection)
5. [Prompt Engineering](#prompt-engineering)
6. [RAG (Retrieval Augmented Generation)](#rag-retrieval-augmented-generation)
7. [Vector Databases](#vector-databases)
8. [Local LLMs](#local-llms)
9. [Cost Monitoring](#cost-monitoring)
10. [RANA Quality Gates](#aads-quality-gates)

---

## Cost Analysis

### Understanding LLM Costs

```typescript
// lib/llm/cost-calculator.ts

/**
 * ✅ RANA: LLM cost calculation utilities
 */

export const MODEL_COSTS = {
  // OpenAI
  'gpt-4-turbo': { input: 0.01, output: 0.03 }, // per 1K tokens
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },

  // xAI Grok
  'grok-beta': { input: 0.005, output: 0.015 },

  // Google
  'gemini-pro': { input: 0.00025, output: 0.0005 },
  'gemini-ultra': { input: 0.01, output: 0.02 },
} as const;

export type ModelName = keyof typeof MODEL_COSTS;

export function calculateCost(
  model: ModelName,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return inputCost + outputCost;
}

// Example usage
const cost = calculateCost('gpt-4-turbo', 5000, 1000);
console.log(`Cost: $${cost.toFixed(4)}`); // Cost: $0.0800

// Monthly projection
function projectMonthlyCost(
  model: ModelName,
  avgInputTokens: number,
  avgOutputTokens: number,
  callsPerDay: number
): number {
  const costPerCall = calculateCost(model, avgInputTokens, avgOutputTokens);
  return costPerCall * callsPerDay * 30;
}

// Example: 1000 calls/day
const monthlyCost = projectMonthlyCost('gpt-4-turbo', 3000, 500, 1000);
console.log(`Monthly cost: $${monthlyCost.toFixed(2)}`); // $1,650/month
```

### Typical Cost Breakdown (Before Optimization)

```
Application with 1,000 LLM calls/day:

GPT-4 Turbo:
- Input: 3,000 tokens avg × $0.01/1K = $0.03
- Output: 500 tokens avg × $0.03/1K = $0.015
- Per call: $0.045
- Monthly (30 days): $1,350

❌ Common mistakes that increase costs:
1. No caching (repeat calls for same input)
2. Using GPT-4 for simple tasks
3. Large context windows (unnecessary history)
4. No response streaming (users wait)
5. No token counting (blind spending)
```

---

## Token Optimization

### Strategy 1: Token Counting & Tracking

```typescript
// lib/llm/token-counter.ts
import { encoding_for_model } from 'tiktoken';

/**
 * ✅ RANA: Count tokens before API calls
 */

const encoder = encoding_for_model('gpt-4');

export function countTokens(text: string): number {
  const tokens = encoder.encode(text);
  return tokens.length;
}

export function estimateCost(
  prompt: string,
  expectedOutputTokens: number,
  model: ModelName = 'gpt-4-turbo'
): { tokens: number; cost: number } {
  const inputTokens = countTokens(prompt);
  const cost = calculateCost(model, inputTokens, expectedOutputTokens);

  return {
    tokens: inputTokens + expectedOutputTokens,
    cost,
  };
}

// ✅ GOOD: Check token count before calling
async function generateResponse(prompt: string) {
  const estimate = estimateCost(prompt, 500);

  // Alert if prompt is too large
  if (estimate.tokens > 8000) {
    console.warn(`Large prompt: ${estimate.tokens} tokens, $${estimate.cost.toFixed(4)}`);
  }

  // Truncate if needed
  if (estimate.tokens > 16000) {
    prompt = truncatePrompt(prompt, 15500);
  }

  return await callLLM(prompt);
}
```

### Strategy 2: Context Window Management

```typescript
// lib/llm/context-manager.ts

/**
 * ✅ RANA: Manage conversation history efficiently
 */

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens?: number;
}

export class ContextManager {
  private maxTokens: number;
  private messages: Message[] = [];

  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
  }

  addMessage(role: Message['role'], content: string) {
    const tokens = countTokens(content);
    this.messages.push({ role, content, tokens });
    this.pruneIfNeeded();
  }

  private pruneIfNeeded() {
    let totalTokens = this.getTotalTokens();

    if (totalTokens > this.maxTokens) {
      // Keep system message and recent messages
      const systemMessages = this.messages.filter(m => m.role === 'system');
      const otherMessages = this.messages.filter(m => m.role !== 'system');

      // Remove oldest messages until under limit
      while (totalTokens > this.maxTokens && otherMessages.length > 2) {
        const removed = otherMessages.shift()!;
        totalTokens -= removed.tokens || 0;
      }

      this.messages = [...systemMessages, ...otherMessages];
      console.log(`Pruned context: ${totalTokens} tokens`);
    }
  }

  private getTotalTokens(): number {
    return this.messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
  }

  getMessages(): Message[] {
    return this.messages;
  }

  // ✅ RANA: Summarize old context to save tokens
  async summarizeHistory() {
    if (this.messages.length < 10) return;

    const oldMessages = this.messages.slice(0, -4); // Keep last 4 messages
    const recentMessages = this.messages.slice(-4);

    // Create summary of old messages
    const summary = await this.createSummary(oldMessages);

    this.messages = [
      { role: 'system', content: `Previous conversation summary: ${summary}` },
      ...recentMessages,
    ];
  }

  private async createSummary(messages: Message[]): Promise<string> {
    // Use cheaper model for summaries
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await callLLM(
      `Summarize this conversation in 2-3 sentences:\n${text}`,
      { model: 'gpt-3.5-turbo', maxTokens: 100 }
    );

    return response;
  }
}

// Usage
const context = new ContextManager(4000);
context.addMessage('system', 'You are a helpful assistant');
context.addMessage('user', 'What is React?');
context.addMessage('assistant', 'React is a JavaScript library...');

// Automatically prunes when needed
context.addMessage('user', 'Tell me more...');
```

### Strategy 3: Prompt Compression

```typescript
// lib/llm/prompt-optimizer.ts

/**
 * ✅ RANA: Compress prompts to reduce tokens
 */

export function compressPrompt(prompt: string): string {
  return prompt
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove common words in structured prompts
    .replace(/please|kindly|could you/gi, '')
    // Use abbreviations for common terms
    .replace(/JavaScript/g, 'JS')
    .replace(/TypeScript/g, 'TS')
    .replace(/function/g, 'fn')
    .trim();
}

// ❌ BAD: Verbose prompt (150 tokens)
const verbosePrompt = `
  Please could you kindly help me by analyzing the following JavaScript code
  and providing detailed feedback on potential improvements, including but not
  limited to performance optimizations, code style recommendations, and best
  practices that should be followed according to modern JavaScript standards.

  Here is the code:
  ${code}
`;

// ✅ GOOD: Compressed prompt (80 tokens)
const compressedPrompt = `
  Analyze this JS code for:
  - Performance optimizations
  - Style improvements
  - Best practices

  Code:
  ${code}
`;

// Savings: 47% reduction in tokens
```

---

## Caching Strategies

### Strategy 1: Response Caching

```typescript
// lib/llm/cache.ts
import { redis } from '@/lib/redis';

/**
 * ✅ RANA: Cache LLM responses to avoid repeat calls
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  model: ModelName;
}

export async function cachedLLMCall(
  prompt: string,
  options: CacheOptions
): Promise<string> {
  // Create cache key from prompt hash
  const cacheKey = `llm:${options.model}:${hashPrompt(prompt)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache hit! Saved API call');
    return cached as string;
  }

  // Cache miss - call LLM
  console.log('Cache miss - calling LLM');
  const response = await callLLM(prompt, { model: options.model });

  // Store in cache
  await redis.set(
    cacheKey,
    response,
    'EX',
    options.ttl || 3600 // Default 1 hour
  );

  return response;
}

function hashPrompt(prompt: string): string {
  // Create deterministic hash
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

// Usage
const response = await cachedLLMCall(
  'Explain React hooks',
  { model: 'gpt-3.5-turbo', ttl: 86400 } // Cache for 24 hours
);

// ✅ Result: Second call is instant + free!
```

### Strategy 2: Semantic Caching

```typescript
// lib/llm/semantic-cache.ts
import { embedText, cosineSimilarity } from '@/lib/embeddings';

/**
 * ✅ RANA: Semantic caching for similar prompts
 * If a prompt is 95% similar to cached prompt, use cached response
 */

interface SemanticCacheEntry {
  prompt: string;
  embedding: number[];
  response: string;
  timestamp: Date;
}

export class SemanticCache {
  private cache: SemanticCacheEntry[] = [];
  private similarityThreshold = 0.95;

  async get(prompt: string): Promise<string | null> {
    if (this.cache.length === 0) return null;

    // Get embedding for current prompt
    const promptEmbedding = await embedText(prompt);

    // Find most similar cached prompt
    let maxSimilarity = 0;
    let bestMatch: SemanticCacheEntry | null = null;

    for (const entry of this.cache) {
      const similarity = cosineSimilarity(promptEmbedding, entry.embedding);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = entry;
      }
    }

    // Return if similarity is high enough
    if (maxSimilarity >= this.similarityThreshold && bestMatch) {
      console.log(`Semantic cache hit! Similarity: ${(maxSimilarity * 100).toFixed(1)}%`);
      return bestMatch.response;
    }

    return null;
  }

  async set(prompt: string, response: string) {
    const embedding = await embedText(prompt);

    this.cache.push({
      prompt,
      embedding,
      response,
      timestamp: new Date(),
    });

    // Keep cache size manageable
    if (this.cache.length > 1000) {
      this.cache.shift();
    }
  }
}

// Usage
const cache = new SemanticCache();

const response1 = await cache.get('What is React?');
if (!response1) {
  const llmResponse = await callLLM('What is React?');
  await cache.set('What is React?', llmResponse);
}

// Similar prompt - cache hit!
const response2 = await cache.get('Can you explain React?');
// Returns cached response (95% similar)
```

### Strategy 3: Prompt Caching (Anthropic)

```typescript
// lib/llm/anthropic-prompt-cache.ts

/**
 * ✅ RANA: Use Anthropic's prompt caching
 * Cache large context (docs, codebase) to save 90% on input tokens
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function chatWithCachedContext(
  systemContext: string, // Large, reusable context
  userMessage: string
) {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemContext,
        // ✅ RANA: Cache this - saves 90% on repeated calls
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Log cache performance
  console.log('Cache stats:', {
    inputTokens: response.usage.input_tokens,
    cacheCreationTokens: response.usage.cache_creation_input_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens,
  });

  return response.content[0].text;
}

// Example: Cache entire documentation
const docs = await fs.readFile('docs/API_REFERENCE.md', 'utf-8');

// First call: Creates cache
const answer1 = await chatWithCachedContext(docs, 'How do I authenticate?');
// Input: 10,000 tokens (full price)

// Second call: Uses cache
const answer2 = await chatWithCachedContext(docs, 'How do I make a POST request?');
// Input: 50 tokens + 10,000 cached (10% price) = 90% savings!
```

---

## Model Selection

### Strategy 1: Task-Based Model Selection

```typescript
// lib/llm/model-router.ts

/**
 * ✅ RANA: Route tasks to appropriate models
 */

type TaskType =
  | 'simple-classification'
  | 'summarization'
  | 'code-generation'
  | 'complex-reasoning'
  | 'creative-writing';

export function selectOptimalModel(task: TaskType, budget: 'low' | 'medium' | 'high'): ModelName {
  const modelMatrix: Record<TaskType, Record<string, ModelName>> = {
    'simple-classification': {
      low: 'claude-3-haiku',
      medium: 'gpt-3.5-turbo',
      high: 'gpt-3.5-turbo',
    },
    'summarization': {
      low: 'claude-3-haiku',
      medium: 'claude-3-sonnet',
      high: 'grok-beta',
    },
    'code-generation': {
      low: 'gpt-3.5-turbo',
      medium: 'grok-beta',
      high: 'gpt-4-turbo',
    },
    'complex-reasoning': {
      low: 'claude-3-sonnet',
      medium: 'grok-beta',
      high: 'claude-3-opus',
    },
    'creative-writing': {
      low: 'claude-3-sonnet',
      medium: 'grok-beta',
      high: 'claude-3-opus',
    },
  };

  return modelMatrix[task][budget];
}

// Usage
const model = selectOptimalModel('simple-classification', 'low');
// Returns: 'claude-3-haiku' (cheapest option for simple tasks)

// ✅ Cost comparison for 1M calls:
// GPT-4: $30,000-$60,000
// Claude Haiku: $250-$1,250
// Savings: 95%+
```

### Strategy 2: Cascading Model Calls

```typescript
// lib/llm/cascade.ts

/**
 * ✅ RANA: Try cheaper models first, escalate if needed
 */

export async function cascadingLLMCall(prompt: string): Promise<string> {
  // Try cheapest model first
  try {
    const response = await callLLM(prompt, {
      model: 'claude-3-haiku',
      maxTokens: 500,
    });

    // Check if response is high quality
    if (isHighQuality(response)) {
      console.log('Haiku succeeded!');
      return response;
    }
  } catch (error) {
    console.log('Haiku failed, escalating...');
  }

  // Escalate to mid-tier
  try {
    const response = await callLLM(prompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
    });

    if (isHighQuality(response)) {
      console.log('GPT-3.5 succeeded!');
      return response;
    }
  } catch (error) {
    console.log('GPT-3.5 failed, escalating...');
  }

  // Final escalation to premium model
  console.log('Using GPT-4 (premium)');
  return await callLLM(prompt, {
    model: 'gpt-4-turbo',
    maxTokens: 2000,
  });
}

function isHighQuality(response: string): boolean {
  // Simple quality checks
  return (
    response.length > 50 &&
    !response.includes('I cannot') &&
    !response.includes('I do not know')
  );
}

// ✅ Result: 70% of requests handled by cheap models
```

---

## Prompt Engineering

### Strategy 1: Few-Shot Learning

```typescript
/**
 * ✅ RANA: Few-shot prompts for better results with smaller models
 */

function createFewShotPrompt(task: string, examples: Array<{input: string; output: string}>) {
  let prompt = `Task: ${task}\n\nExamples:\n\n`;

  examples.forEach((ex, i) => {
    prompt += `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n\n`;
  });

  prompt += `Now process this:\nInput: `;

  return prompt;
}

// Usage
const prompt = createFewShotPrompt(
  'Extract email addresses from text',
  [
    { input: 'Contact me at john@example.com', output: 'john@example.com' },
    { input: 'Email: admin@company.org', output: 'admin@company.org' },
  ]
);

// ✅ Result: GPT-3.5 performs like GPT-4 with examples
```

### Strategy 2: Chain-of-Thought

```typescript
/**
 * ✅ RANA: Use chain-of-thought for complex reasoning
 */

async function chainOfThought(problem: string): Promise<string> {
  const prompt = `
Solve this step by step:

Problem: ${problem}

Let's think through this:
1. First, identify the key information
2. Then, determine what we need to find
3. Finally, solve and verify

Your response:
  `.trim();

  return await callLLM(prompt, { model: 'gpt-3.5-turbo' });
}

// ✅ Result: Better results with cheaper models
```

---

## RAG (Retrieval Augmented Generation)

### Pattern 1: Basic RAG Implementation

```typescript
// lib/rag/basic.ts
import { embedText, search } from '@/lib/vector-db';

/**
 * ✅ RANA: RAG reduces token usage by fetching relevant context only
 */

export async function ragQuery(question: string, collection: string): Promise<string> {
  // 1. Embed the question
  const questionEmbedding = await embedText(question);

  // 2. Search vector database for relevant documents
  const relevantDocs = await search({
    collection,
    embedding: questionEmbedding,
    limit: 3, // Only get top 3 most relevant
  });

  // 3. Create context from relevant docs
  const context = relevantDocs
    .map((doc, i) => `[${i + 1}] ${doc.content}`)
    .join('\n\n');

  // 4. Generate answer with context
  const prompt = `
Answer the question based on this context:

Context:
${context}

Question: ${question}

Answer:
  `.trim();

  const answer = await callLLM(prompt, {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
  });

  return answer;
}

// ✅ Instead of: 50,000 token context (entire docs)
// ✅ We use: 1,500 token context (relevant chunks only)
// ✅ Savings: 97% reduction in context size
```

### Pattern 2: Advanced RAG with Re-ranking

```typescript
// lib/rag/advanced.ts

/**
 * ✅ RANA: Two-stage retrieval for better accuracy
 */

export async function advancedRAG(question: string): Promise<string> {
  // Stage 1: Fast vector search (get 20 candidates)
  const questionEmbedding = await embedText(question);
  const candidates = await search({
    collection: 'knowledge-base',
    embedding: questionEmbedding,
    limit: 20,
  });

  // Stage 2: Re-rank with cross-encoder (more accurate)
  const reranked = await rerank(question, candidates);
  const topResults = reranked.slice(0, 3);

  // Stage 3: Generate answer
  const context = topResults
    .map(doc => doc.content)
    .join('\n\n');

  const answer = await cachedLLMCall(
    `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
    { model: 'gpt-3.5-turbo', ttl: 3600 }
  );

  return answer;
}

async function rerank(
  query: string,
  documents: Array<{ content: string; score: number }>
): Promise<typeof documents> {
  // Use smaller model for re-ranking
  const scores = await Promise.all(
    documents.map(async (doc) => {
      const prompt = `Rate relevance 0-10:\nQuery: ${query}\nDoc: ${doc.content.slice(0, 200)}`;
      const rating = await callLLM(prompt, {
        model: 'claude-3-haiku',
        maxTokens: 10,
      });
      return { ...doc, rerankedScore: parseInt(rating) || 0 };
    })
  );

  return scores.sort((a, b) => b.rerankedScore - a.rerankedScore);
}
```

---

## Vector Databases

### Setup with Supabase Vector

```sql
-- migrations/create_vector_store.sql

/**
 * ✅ RANA: Vector storage for RAG
 */

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table with vector embeddings
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast vector search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### Vector Search Implementation

```typescript
// lib/vector-db/supabase.ts
import { supabase } from '@/lib/supabase/client';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * ✅ RANA: Vector database operations
 */

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  return response.data[0].embedding;
}

export async function addDocument(content: string, metadata?: any) {
  const embedding = await embedText(content);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      content,
      metadata,
      embedding,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function searchDocuments(
  query: string,
  options: {
    threshold?: number;
    limit?: number;
  } = {}
) {
  const queryEmbedding = await embedText(query);

  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: queryEmbedding,
    match_threshold: options.threshold || 0.7,
    match_count: options.limit || 5,
  });

  if (error) throw error;
  return data;
}

// Usage: Index your documentation
await addDocument(
  'React is a JavaScript library for building user interfaces',
  { category: 'documentation', topic: 'react' }
);

// Search
const results = await searchDocuments('How do I use React?');
// Returns relevant docs for RAG
```

---

## xAI Grok Integration

### Why Use Grok?

**Grok** is xAI's conversational AI model with competitive pricing and strong performance:

- **Cost-effective:** $0.005/1K input tokens, $0.015/1K output tokens
- **Good balance:** Between GPT-3.5 and GPT-4 in quality
- **Real-time data:** Access to X (Twitter) data and current events
- **Fast responses:** Lower latency than GPT-4

**Best Use Cases:**
- Summarization (especially news/current events)
- Code generation (medium complexity)
- Creative writing
- Social media content
- Real-time information queries

### Grok Setup

```typescript
// lib/llm/grok.ts

/**
 * ✅ RANA: xAI Grok integration
 */

import OpenAI from 'openai';

// Grok uses OpenAI-compatible API
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function callGrok(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const completion = await grok.chat.completions.create({
    model: 'grok-beta',
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
  });

  return completion.choices[0].message.content || '';
}

// Example usage
const response = await callGrok([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Summarize the latest tech news' },
]);
```

### Environment Configuration

```bash
# .env
XAI_API_KEY=xai-...
```

### Grok Cost Optimization

```typescript
// lib/llm/providers.ts

/**
 * ✅ RANA: Multi-provider strategy with Grok
 */

export async function smartMultiProviderCall(
  prompt: string,
  taskType: 'simple' | 'medium' | 'complex'
): Promise<string> {
  switch (taskType) {
    case 'simple':
      // Use cheapest: Claude Haiku
      return await callClaude(prompt, 'claude-3-haiku');

    case 'medium':
      // Use Grok for good balance
      return await callGrok([
        { role: 'user', content: prompt }
      ]);

    case 'complex':
      // Use best: GPT-4 or Claude Opus
      return await callOpenAI(prompt, 'gpt-4-turbo');
  }
}

// ✅ Cost comparison (1K calls, 1K tokens each):
// Simple (Haiku): $0.25-$1.25
// Medium (Grok): $5-$15
// Complex (GPT-4): $10-$30
// Total: $15.25-$46.25 vs $40-$120 (all GPT-4)
// Savings: 60%+
```

### Grok with Caching

```typescript
// app/api/ai/grok/route.ts
import { callGrok } from '@/lib/llm/grok';
import { getCachedResponse, cacheResponse } from '@/lib/llm/cache';

export async function POST(request: Request) {
  const { message } = await request.json();

  // Check cache first
  const cached = await getCachedResponse(message, 'grok-beta');
  if (cached) {
    return Response.json({ response: cached, cached: true });
  }

  // Call Grok
  const response = await callGrok([
    { role: 'user', content: message }
  ]);

  // Cache for 1 hour
  await cacheResponse(message, 'grok-beta', response, 0.7, 3600);

  return Response.json({ response, cached: false });
}
```

### When to Use Grok vs Others

```typescript
// lib/llm/router.ts

/**
 * ✅ RANA: Smart provider routing
 */

export function selectProvider(
  taskType: string,
  requiresRealTime: boolean
): 'openai' | 'anthropic' | 'grok' {
  // Grok excels with real-time data
  if (requiresRealTime) {
    return 'grok';
  }

  // Task-based selection
  switch (taskType) {
    case 'classification':
    case 'simple-qa':
      return 'anthropic'; // Claude Haiku cheapest

    case 'summarization':
    case 'creative-writing':
    case 'code-generation':
      return 'grok'; // Good balance of cost/quality

    case 'complex-reasoning':
    case 'analysis':
      return 'openai'; // GPT-4 best quality

    default:
      return 'grok'; // Default to balanced option
  }
}
```

---

## Local LLMs

### Setup with Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download models
ollama pull llama3.2:3b    # 3B parameters (fast, cheap)
ollama pull mistral:7b      # 7B parameters (balanced)
ollama pull codellama:13b   # 13B for code

# Start server
ollama serve
```

### Local LLM Integration

```typescript
// lib/llm/local.ts

/**
 * ✅ RANA: Use local LLMs for development/simple tasks
 * Cost: $0 (runs on your hardware)
 */

export async function callLocalLLM(
  prompt: string,
  model: string = 'llama3.2:3b'
): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response;
}

// Strategy: Use local for development, cloud for production
export async function smartLLMCall(prompt: string): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    return await callLocalLLM(prompt);
  }

  return await cachedLLMCall(prompt, { model: 'gpt-3.5-turbo' });
}

// ✅ Result: Zero cost during development
```

---

## Cost Monitoring

### Real-time Cost Tracking

```typescript
// lib/llm/cost-tracker.ts
import { prisma } from '@/lib/prisma';

/**
 * ✅ RANA: Track every LLM call for cost analysis
 */

export async function trackLLMCall(data: {
  model: ModelName;
  inputTokens: number;
  outputTokens: number;
  cached: boolean;
  userId?: string;
  purpose: string;
}) {
  const cost = calculateCost(data.model, data.inputTokens, data.outputTokens);

  await prisma.llmCall.create({
    data: {
      ...data,
      cost,
      timestamp: new Date(),
    },
  });

  // Alert if daily budget exceeded
  const todayCost = await getTodayCost();
  if (todayCost > 100) { // $100 daily budget
    await sendAlert(`LLM costs: $${todayCost.toFixed(2)} today (budget: $100)`);
  }
}

export async function getLLMAnalytics(period: 'day' | 'week' | 'month') {
  const since = {
    day: new Date(Date.now() - 24 * 60 * 60 * 1000),
    week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  }[period];

  const calls = await prisma.llmCall.findMany({
    where: { timestamp: { gte: since } },
  });

  const totalCost = calls.reduce((sum, call) => sum + call.cost, 0);
  const totalCalls = calls.length;
  const cacheHitRate = calls.filter(c => c.cached).length / totalCalls;

  const byModel = calls.reduce((acc, call) => {
    acc[call.model] = (acc[call.model] || 0) + call.cost;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCost,
    totalCalls,
    avgCostPerCall: totalCost / totalCalls,
    cacheHitRate: (cacheHitRate * 100).toFixed(1) + '%',
    byModel,
    projection: {
      monthly: totalCost * (30 / ((Date.now() - since.getTime()) / (24 * 60 * 60 * 1000))),
    },
  };
}

// Usage
const analytics = await getLLMAnalytics('week');
console.log('LLM Analytics:', analytics);
// {
//   totalCost: 145.23,
//   totalCalls: 3456,
//   avgCostPerCall: 0.042,
//   cacheHitRate: '67.2%',
//   byModel: { 'gpt-4-turbo': 120.45, 'gpt-3.5-turbo': 24.78 },
//   projection: { monthly: 621.23 }
// }
```

---

## RANA Quality Gates

```yaml
# .rana.yml LLM optimization quality gates

quality_gates:
  llm_optimization:
    # Cost Management
    - token_counting_before_calls
    - cost_tracking_enabled
    - daily_budget_alerts
    - monthly_projection_monitored

    # Caching
    - response_caching_enabled
    - cache_hit_rate_above_50_percent
    - semantic_caching_for_similar_queries

    # Model Selection
    - task_based_model_routing
    - cheaper_models_for_simple_tasks
    - cascading_fallback_strategy

    # Context Management
    - context_window_limits
    - history_pruning_enabled
    - context_summarization

    # RAG (if applicable)
    - vector_database_configured
    - relevant_context_only
    - document_chunking_optimized

    # Monitoring
    - cost_per_call_logged
    - model_usage_tracked
    - optimization_opportunities_identified
```

---

## Optimization Checklist

```markdown
## LLM Optimization Checklist

### Cost Tracking
- [ ] Token counting before API calls
- [ ] Cost calculation per call
- [ ] Daily/monthly cost monitoring
- [ ] Budget alerts configured

### Caching
- [ ] Response caching implemented
- [ ] Cache expiration configured
- [ ] Semantic caching for similar prompts
- [ ] Prompt caching (Anthropic) for large context

### Model Selection
- [ ] Task-based model router
- [ ] Cheaper models for simple tasks
- [ ] Cascading calls (try cheap first)
- [ ] Local LLMs for development

### Context Management
- [ ] Context window limits enforced
- [ ] Conversation history pruning
- [ ] Context summarization for long conversations
- [ ] Prompt compression techniques

### RAG Implementation
- [ ] Vector database setup
- [ ] Document chunking optimized
- [ ] Relevant context only (not entire docs)
- [ ] Re-ranking for accuracy

### Monitoring
- [ ] All calls logged
- [ ] Cost per model tracked
- [ ] Cache hit rate monitored
- [ ] Optimization opportunities identified
```

---

## Cost Reduction Results

### Before RANA Optimization
```
Monthly Cost: $1,500
- GPT-4 for everything: $1,200
- No caching: $200
- Large context windows: $100
```

### After RANA Optimization
```
Monthly Cost: $450 (70% reduction)
- Task-based routing: $250 (saved $950)
- Caching (67% hit rate): $100 (saved $200)
- Context management: $100 (saved $100)

Annual Savings: $12,600
```

---

## Conclusion

LLM optimization is **critical** for sustainable AI applications. Following these patterns achieves:

✅ **70% cost reduction** through caching and model selection
✅ **Faster responses** with local LLMs and streaming
✅ **Better accuracy** with RAG and semantic search
✅ **Scalability** with proper monitoring and budgets

**Next:** [SEO Framework Guide](./SEO_FRAMEWORK_GUIDE.md)

---

*Part of the RANA Framework - Production-Quality AI Development*
