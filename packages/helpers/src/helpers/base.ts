/**
 * Base helper utilities shared across all helper functions
 */

import type { Provider, HelperConfig, HelperMetadata } from '../types';
import { mergeConfig, modelCosts } from '../config';
import { generateCacheKey, getFromCache, setInCache } from '../cache';

// Simple LLM client interface
interface LLMClient {
  chat(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
  }): Promise<{
    content: string;
    usage?: { prompt_tokens: number; completion_tokens: number };
  }>;
}

// Provider-specific clients (simplified for now)
const clients: Record<Provider, LLMClient | null> = {
  openai: null,
  anthropic: null,
  google: null,
  groq: null,
  together: null,
  mistral: null,
};

/**
 * Get or create LLM client for provider
 */
async function getClient(provider: Provider, apiKey: string): Promise<LLMClient> {
  // Lazy load provider SDKs
  switch (provider) {
    case 'openai': {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });
      return {
        async chat(params) {
          const response = await client.chat.completions.create({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.max_tokens,
            response_format: params.response_format,
          });
          return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage ? {
              prompt_tokens: response.usage.prompt_tokens,
              completion_tokens: response.usage.completion_tokens,
            } : undefined,
          };
        },
      };
    }

    case 'anthropic': {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      return {
        async chat(params) {
          const systemMessage = params.messages.find(m => m.role === 'system');
          const otherMessages = params.messages.filter(m => m.role !== 'system');

          const response = await client.messages.create({
            model: params.model,
            max_tokens: params.max_tokens || 4096,
            system: systemMessage?.content,
            messages: otherMessages.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          });

          const textBlock = response.content.find(c => c.type === 'text');
          return {
            content: textBlock && 'text' in textBlock ? textBlock.text : '',
            usage: {
              prompt_tokens: response.usage.input_tokens,
              completion_tokens: response.usage.output_tokens,
            },
          };
        },
      };
    }

    case 'google': {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      return {
        async chat(params) {
          const model = genAI.getGenerativeModel({ model: params.model });
          const systemMessage = params.messages.find(m => m.role === 'system');
          const userMessage = params.messages.find(m => m.role === 'user');

          const prompt = systemMessage
            ? `${systemMessage.content}\n\n${userMessage?.content || ''}`
            : userMessage?.content || '';

          const result = await model.generateContent(prompt);
          const response = await result.response;

          return {
            content: response.text(),
            usage: undefined, // Google doesn't return token counts easily
          };
        },
      };
    }

    default:
      throw new Error(`Provider ${provider} not yet implemented`);
  }
}

/**
 * Call LLM with caching and error handling
 */
export async function callLLM(
  operation: string,
  input: string,
  systemPrompt: string,
  options: HelperConfig = {},
  parseResponse?: (content: string) => unknown
): Promise<{ result: unknown; metadata: HelperMetadata }> {
  const startTime = Date.now();
  const config = mergeConfig(options);
  const requestId = generateRequestId();

  // Check cache
  const cacheKey = generateCacheKey(operation, input, {
    provider: config.provider,
    model: config.model,
  });

  if (config.cache) {
    const cached = await getFromCache<{ result: unknown; metadata: HelperMetadata }>(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          latencyMs: Date.now() - startTime,
        },
      };
    }
  }

  // Call LLM
  const client = await getClient(config.provider, config.apiKey);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await Promise.race([
        client.chat({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), config.timeout)
        ),
      ]);

      const result = parseResponse ? parseResponse(response.content) : response.content;

      // Calculate cost
      const cost = calculateCost(
        config.model,
        response.usage?.prompt_tokens || estimateTokens(systemPrompt + input),
        response.usage?.completion_tokens || estimateTokens(response.content)
      );

      const metadata: HelperMetadata = {
        cached: false,
        cost,
        latencyMs: Date.now() - startTime,
        provider: config.provider,
        model: config.model,
        requestId,
      };

      // Cache result
      if (config.cache) {
        await setInCache(cacheKey, { result, metadata }, config.cacheTTL);
      }

      return { result, metadata };
    } catch (error) {
      lastError = error as Error;
      if (attempt < config.maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Failed to call LLM');
}

/**
 * Estimate token count from text
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = modelCosts[model] || { input: 0.01, output: 0.03 };
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `rana_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse JSON safely
 */
export function parseJSON<T>(content: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse JSON: ${content.substring(0, 200)}`);
  }
}
