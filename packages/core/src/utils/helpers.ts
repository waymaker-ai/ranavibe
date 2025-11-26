/**
 * RANA Utility Helpers
 * Convenient shortcuts and utilities for common tasks
 */

import type {
  RanaChatRequest,
  RanaChatResponse,
  Message,
  LLMProvider,
  CostStats
} from '../types';

/**
 * Quick chat helper - one-liner for simple requests
 * @example
 * const response = await quickChat('anthropic', 'What is React?');
 */
export async function quickChat(
  provider: LLMProvider,
  message: string,
  apiKey: string
): Promise<string> {
  const { createRana } = await import('../index');
  const rana = createRana({
    providers: { [provider]: apiKey }
  });
  const response = await rana.chat(message);
  return response.content;
}

/**
 * Compare responses from multiple providers
 * @example
 * const comparison = await compareProviders(
 *   ['anthropic', 'openai', 'google'],
 *   'Explain quantum computing',
 *   { anthropic: key1, openai: key2, google: key3 }
 * );
 */
export async function compareProviders(
  providers: LLMProvider[],
  message: string,
  apiKeys: Record<string, string>
): Promise<Array<{ provider: LLMProvider; response: string; cost: number; latency: number }>> {
  const { createRana } = await import('../index');
  const rana = createRana({ providers: apiKeys });

  const results = await Promise.all(
    providers.map(async (provider) => {
      const response = await rana.chat({
        messages: [{ role: 'user' as const, content: message }],
        provider
      });
      return {
        provider,
        response: response.content,
        cost: response.cost.total_cost,
        latency: response.latency_ms
      };
    })
  );

  return results;
}

/**
 * Find the cheapest provider for a given task
 * @example
 * const { provider, cost } = await findCheapestProvider(
 *   'Summarize this text...',
 *   { anthropic: key1, openai: key2 }
 * );
 */
export async function findCheapestProvider(
  message: string,
  apiKeys: Record<string, string>
): Promise<{ provider: LLMProvider; cost: number; response: string }> {
  const providers = Object.keys(apiKeys) as LLMProvider[];
  const comparison = await compareProviders(providers, message, apiKeys);

  const cheapest = comparison.reduce((min, current) =>
    current.cost < min.cost ? current : min
  );

  return {
    provider: cheapest.provider,
    cost: cheapest.cost,
    response: cheapest.response
  };
}

/**
 * Format cost for display
 * @example
 * formatCost(0.0001234) // "$0.0001"
 * formatCost(1.5) // "$1.50"
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) return '$0.0000';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format latency for display
 * @example
 * formatLatency(1234) // "1.23s"
 * formatLatency(234) // "234ms"
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Calculate savings percentage
 */
export function calculateSavings(actualCost: number, estimatedCost: number): number {
  if (estimatedCost === 0) return 0;
  return ((estimatedCost - actualCost) / estimatedCost) * 100;
}

/**
 * Format cost stats for display
 */
export function formatCostStats(stats: CostStats): string {
  const lines = [
    `Total Spent: ${formatCost(stats.total_spent)}`,
    `Total Saved: ${formatCost(stats.total_saved)}`,
    `Savings: ${stats.savings_percentage.toFixed(0)}%`,
    ``,
    `Breakdown:`
  ];

  stats.breakdown.forEach(item => {
    lines.push(
      `  ${item.provider}: ${formatCost(item.total_cost)} (${item.percentage.toFixed(0)}%)`
    );
  });

  return lines.join('\n');
}

/**
 * Create a message from a string or object
 */
export function createMessage(content: string, role: 'user' | 'assistant' | 'system' = 'user'): Message {
  return { role, content };
}

/**
 * Create a conversation from an array of strings (alternating user/assistant)
 * @example
 * const messages = createConversation([
 *   'Hello!',           // user
 *   'Hi there!',        // assistant
 *   'How are you?',     // user
 *   'I am doing well!'  // assistant
 * ]);
 */
export function createConversation(messages: string[]): Message[] {
  return messages.map((content, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content
  }));
}

/**
 * Extract text content from a response
 */
export function extractContent(response: RanaChatResponse | string): string {
  if (typeof response === 'string') return response;
  return response.content;
}

/**
 * Batch process multiple messages
 * @example
 * const responses = await batchProcess(rana, [
 *   'What is React?',
 *   'What is Vue?',
 *   'What is Angular?'
 * ]);
 */
export async function batchProcess(
  client: any, // RanaClient
  messages: string[],
  options?: { parallel?: boolean; delay?: number }
): Promise<RanaChatResponse[]> {
  const { parallel = true, delay = 0 } = options || {};

  if (parallel) {
    return Promise.all(messages.map(msg => client.chat(msg)));
  }

  const results: RanaChatResponse[] = [];
  for (const message of messages) {
    const response = await client.chat(message);
    results.push(response);
    if (delay > 0 && message !== messages[messages.length - 1]) {
      await sleep(delay);
    }
  }

  return results;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry helper with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; initialDelay?: number; maxDelay?: number }
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options || {};

  let lastError: Error;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Chunk text into smaller pieces
 */
export function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            chunks.push(sentence.trim());
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Count tokens (rough estimate)
 * More accurate counting requires actual tokenizer
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedChars = maxTokens * 4;
  if (text.length <= estimatedChars) return text;
  return text.substring(0, estimatedChars) + '...';
}

/**
 * Calculate estimated cost for a request
 */
export function estimateCost(
  provider: LLMProvider,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Cost per 1M tokens (approximate rates)
  const rates: Record<string, { prompt: number; completion: number }> = {
    'claude-3-5-sonnet-20241022': { prompt: 3.00, completion: 15.00 },
    'claude-3-opus-20240229': { prompt: 15.00, completion: 75.00 },
    'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
    'gpt-4': { prompt: 30.00, completion: 60.00 },
    'gpt-3.5-turbo': { prompt: 0.50, completion: 1.50 },
    'gemini-pro': { prompt: 0.50, completion: 1.50 },
  };

  const rate = rates[model] || { prompt: 1.00, completion: 3.00 };
  const promptCost = (promptTokens / 1_000_000) * rate.prompt;
  const completionCost = (completionTokens / 1_000_000) * rate.completion;

  return promptCost + completionCost;
}

/**
 * Validate API key format
 */
export function validateApiKey(provider: LLMProvider, key: string): boolean {
  const patterns: Record<LLMProvider, RegExp> = {
    anthropic: /^sk-ant-/,
    openai: /^sk-/,
    google: /^[A-Za-z0-9_-]+$/,
    xai: /^xai-/,
    mistral: /^[A-Za-z0-9]+$/,
    cohere: /^[A-Za-z0-9_-]+$/,
    together: /^[A-Za-z0-9]+$/,
    groq: /^gsk_/,
    ollama: /.*/  // Local, no key needed
  };

  return patterns[provider]?.test(key) || false;
}

/**
 * Get provider display name
 */
export function getProviderName(provider: LLMProvider): string {
  const names: Record<LLMProvider, string> = {
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
    xai: 'xAI (Grok)',
    mistral: 'Mistral AI',
    cohere: 'Cohere',
    together: 'Together AI',
    groq: 'Groq',
    ollama: 'Ollama (Local)'
  };

  return names[provider] || provider;
}

/**
 * Parse streaming chunk
 */
export function parseStreamChunk(chunk: any): { delta: string; done: boolean } {
  if (typeof chunk === 'string') {
    return { delta: chunk, done: false };
  }

  return {
    delta: chunk.delta || chunk.content || '',
    done: chunk.done || chunk.finish_reason !== null
  };
}

/**
 * Create a simple CLI spinner
 */
export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private current = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string;

  constructor(message: string = 'Loading...') {
    this.message = message;
  }

  start() {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.current]} ${this.message}`);
      this.current = (this.current + 1) % this.frames.length;
    }, 80);
  }

  stop(finalMessage?: string) {
    if (this.interval) {
      clearInterval(this.interval);
      process.stdout.write(`\r${finalMessage || '✓ Done'}\n`);
    }
  }

  update(message: string) {
    this.message = message;
  }
}

/**
 * Simple progress bar
 */
export function createProgressBar(total: number, width: number = 40): (current: number) => string {
  return (current: number) => {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filled = Math.round((width * percentage) / 100);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage.toFixed(0)}% (${current}/${total})`;
  };
}
