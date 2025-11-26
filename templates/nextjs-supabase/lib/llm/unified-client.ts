/**
 * LUKA - Layered Utility Kit for AI
 * Unified LLM Client with Multi-Provider Support
 *
 * Supports: OpenAI, Anthropic, Google Gemini, xAI, Mistral, Cohere, Together.ai, Groq, Ollama
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'cohere'
  | 'together'
  | 'groq'
  | 'xai'
  | 'ollama';

export type ModelName =
  // OpenAI
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  // Anthropic
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-haiku-20240307'
  | 'claude-3-opus-20240229'
  // Google Gemini
  | 'gemini-3'
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  // Mistral
  | 'mistral-large-latest'
  | 'mistral-small-latest'
  // Cohere
  | 'command-r-plus'
  | 'command-r'
  // Together.ai
  | 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo'
  | 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
  // Groq
  | 'llama-3.1-70b-versatile'
  | 'llama-3.1-8b-instant'
  // xAI
  | 'grok-beta'
  // Ollama
  | 'llama3.2'
  | 'mistral'
  | 'codellama';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MultimodalContent[];
}

export interface MultimodalContent {
  type: 'text' | 'image' | 'audio' | 'video';
  text?: string;
  image?: string; // Base64 or URL
  audio?: string; // Base64 or URL
  video?: string; // Base64 or URL
  mimeType?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface LLMRequest {
  model: ModelName;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  stream?: boolean;
  multimodal?: boolean;
}

export interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/**
 * Unified LLM Client
 * Abstracts differences between providers with consistent API
 */
export class LUKAClient {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private google?: GoogleGenerativeAI;

  constructor() {
    // Initialize clients based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    if (process.env.GOOGLE_API_KEY) {
      this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
  }

  /**
   * Main method: Send messages to any LLM provider
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProvider(request.model);

    switch (provider) {
      case 'openai':
        return this.callOpenAI(request);
      case 'anthropic':
        return this.callAnthropic(request);
      case 'google':
        return this.callGoogle(request);
      case 'mistral':
        return this.callMistral(request);
      case 'cohere':
        return this.callCohere(request);
      case 'together':
        return this.callTogether(request);
      case 'groq':
        return this.callGroq(request);
      case 'xai':
        return this.callXAI(request);
      case 'ollama':
        return this.callOllama(request);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Streaming chat method
   */
  async *chatStream(request: LLMRequest): AsyncGenerator<string> {
    const provider = this.getProvider(request.model);

    switch (provider) {
      case 'openai':
        yield* this.streamOpenAI(request);
        break;
      case 'anthropic':
        yield* this.streamAnthropic(request);
        break;
      case 'google':
        yield* this.streamGoogle(request);
        break;
      default:
        throw new Error(`Streaming not yet implemented for ${provider}`);
    }
  }

  /**
   * OpenAI Implementation
   */
  private async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const completion = await this.openai.chat.completions.create({
      model: request.model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      tools: request.tools as any,
    });

    const usage = completion.usage!;
    const cost = this.calculateCost(request.model, usage.prompt_tokens, usage.completion_tokens);

    return {
      content: completion.choices[0].message.content || '',
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost,
      toolCalls: completion.choices[0].message.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      finishReason: completion.choices[0].finish_reason,
    };
  }

  private async *streamOpenAI(request: LLMRequest): AsyncGenerator<string> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const stream = await this.openai.chat.completions.create({
      model: request.model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  /**
   * Anthropic Implementation
   */
  private async callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const systemMessage = request.messages.find(m => m.role === 'system');
    const userMessages = request.messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: request.model,
      system: systemMessage?.content as string,
      messages: userMessages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      tools: request.tools as any,
    });

    const usage = response.usage;
    const cost = this.calculateCost(request.model, usage.input_tokens, usage.output_tokens);

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
      },
      cost,
      finishReason: response.stop_reason || undefined,
    };
  }

  private async *streamAnthropic(request: LLMRequest): AsyncGenerator<string> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const systemMessage = request.messages.find(m => m.role === 'system');
    const userMessages = request.messages.filter(m => m.role !== 'system');

    const stream = await this.anthropic.messages.create({
      model: request.model,
      system: systemMessage?.content as string,
      messages: userMessages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Google Gemini Implementation (Gemini 2.0 Flash & Gemini 3 support)
   */
  private async callGoogle(request: LLMRequest): Promise<LLMResponse> {
    if (!this.google) throw new Error('Google client not initialized');

    const model = this.google.getGenerativeModel({ model: request.model });

    // Convert messages to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: typeof m.content === 'string'
          ? [{ text: m.content }]
          : this.convertMultimodalContent(m.content),
      }));

    const systemInstruction = request.messages.find(m => m.role === 'system')?.content as string;

    const result = await model.generateContent({
      contents,
      systemInstruction,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      },
    });

    const response = result.response;
    const text = response.text();

    // Estimate token usage (Gemini API doesn't always provide exact counts)
    const inputTokens = Math.ceil(JSON.stringify(contents).length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const cost = this.calculateCost(request.model, inputTokens, outputTokens);

    return {
      content: text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      cost,
    };
  }

  private async *streamGoogle(request: LLMRequest): AsyncGenerator<string> {
    if (!this.google) throw new Error('Google client not initialized');

    const model = this.google.getGenerativeModel({ model: request.model });

    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: typeof m.content === 'string'
          ? [{ text: m.content }]
          : this.convertMultimodalContent(m.content),
      }));

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /**
   * Convert multimodal content to Gemini format
   */
  private convertMultimodalContent(content: MultimodalContent[]) {
    return content.map(item => {
      switch (item.type) {
        case 'text':
          return { text: item.text };
        case 'image':
          return {
            inlineData: {
              mimeType: item.mimeType || 'image/jpeg',
              data: item.image!.replace(/^data:image\/\w+;base64,/, ''),
            },
          };
        case 'audio':
          return {
            inlineData: {
              mimeType: item.mimeType || 'audio/mp3',
              data: item.audio!.replace(/^data:audio\/\w+;base64,/, ''),
            },
          };
        case 'video':
          return {
            inlineData: {
              mimeType: item.mimeType || 'video/mp4',
              data: item.video!.replace(/^data:video\/\w+;base64,/, ''),
            },
          };
        default:
          return { text: '' };
      }
    });
  }

  /**
   * Mistral Implementation (OpenAI-compatible API)
   */
  private async callMistral(request: LLMRequest): Promise<LLMResponse> {
    const mistralClient = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY,
      baseURL: 'https://api.mistral.ai/v1',
    });

    return this.callOpenAICompatible(mistralClient, request);
  }

  /**
   * Groq Implementation (OpenAI-compatible API with ultra-fast inference)
   */
  private async callGroq(request: LLMRequest): Promise<LLMResponse> {
    const groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    return this.callOpenAICompatible(groqClient, request);
  }

  /**
   * Together.ai Implementation (OpenAI-compatible API)
   */
  private async callTogether(request: LLMRequest): Promise<LLMResponse> {
    const togetherClient = new OpenAI({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: 'https://api.together.xyz/v1',
    });

    return this.callOpenAICompatible(togetherClient, request);
  }

  /**
   * xAI Grok Implementation (OpenAI-compatible API)
   */
  private async callXAI(request: LLMRequest): Promise<LLMResponse> {
    const xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    return this.callOpenAICompatible(xaiClient, request);
  }

  /**
   * Ollama Implementation (local models)
   */
  private async callOllama(request: LLMRequest): Promise<LLMResponse> {
    const ollamaClient = new OpenAI({
      apiKey: 'ollama', // Ollama doesn't require API key
      baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
    });

    return this.callOpenAICompatible(ollamaClient, request);
  }

  /**
   * Cohere Implementation
   */
  private async callCohere(request: LLMRequest): Promise<LLMResponse> {
    // Cohere has a different API, would need cohere-ai SDK
    // For now, placeholder
    throw new Error('Cohere implementation coming soon - use Command R+ via API');
  }

  /**
   * Generic OpenAI-compatible API caller
   */
  private async callOpenAICompatible(client: OpenAI, request: LLMRequest): Promise<LLMResponse> {
    const completion = await client.chat.completions.create({
      model: request.model,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    const usage = completion.usage!;
    const cost = this.calculateCost(request.model, usage.prompt_tokens, usage.completion_tokens);

    return {
      content: completion.choices[0].message.content || '',
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost,
      finishReason: completion.choices[0].finish_reason,
    };
  }

  /**
   * Determine provider from model name
   */
  private getProvider(model: ModelName): LLMProvider {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'google';
    if (model.startsWith('mistral-')) return 'mistral';
    if (model.startsWith('command-')) return 'cohere';
    if (model.includes('llama') && model.includes('Meta')) return 'together';
    if (model.includes('llama-3.1')) return 'groq';
    if (model === 'grok-beta') return 'xai';
    if (['llama3.2', 'mistral', 'codellama'].includes(model)) return 'ollama';

    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Calculate cost based on model pricing
   */
  private calculateCost(model: ModelName, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      // OpenAI (per 1M tokens)
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4o': { input: 5, output: 15 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },

      // Anthropic (per 1M tokens)
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-3-opus-20240229': { input: 15, output: 75 },

      // Google Gemini (per 1M tokens)
      'gemini-3': { input: 2, output: 8 },
      'gemini-2.0-flash-exp': { input: 0.1, output: 0.4 },
      'gemini-1.5-pro': { input: 1.25, output: 5 },
      'gemini-1.5-flash': { input: 0.075, output: 0.3 },

      // Mistral (per 1M tokens)
      'mistral-large-latest': { input: 4, output: 12 },
      'mistral-small-latest': { input: 1, output: 3 },

      // Groq (per 1M tokens)
      'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
      'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },

      // Together.ai (per 1M tokens)
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': { input: 3.5, output: 3.5 },
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': { input: 0.88, output: 0.88 },

      // xAI (per 1M tokens)
      'grok-beta': { input: 10, output: 30 },

      // Ollama (free)
      'llama3.2': { input: 0, output: 0 },
      'mistral': { input: 0, output: 0 },
      'codellama': { input: 0, output: 0 },
    };

    const modelPricing = pricing[model] || { input: 0, output: 0 };
    return (inputTokens / 1_000_000) * modelPricing.input +
           (outputTokens / 1_000_000) * modelPricing.output;
  }
}

/**
 * Convenience function for quick access
 */
export const luka = new LUKAClient();

/**
 * Helper: Cascading model strategy (auto-fallback)
 */
export async function smartChat(
  messages: Message[],
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): Promise<LLMResponse> {
  const client = new LUKAClient();

  const strategies: Record<string, ModelName[]> = {
    simple: ['llama-3.1-8b-instant', 'gemini-2.0-flash-exp', 'claude-3-haiku-20240307', 'gpt-3.5-turbo'],
    medium: ['gemini-2.0-flash-exp', 'claude-3-5-sonnet-20241022', 'gpt-4o'],
    complex: ['gemini-3', 'claude-3-5-sonnet-20241022', 'gpt-4o', 'gpt-4-turbo'],
  };

  const models = strategies[complexity];

  for (const model of models) {
    try {
      return await client.chat({ model, messages });
    } catch (error) {
      console.warn(`Failed with ${model}, trying next...`);
      continue;
    }
  }

  throw new Error('All models failed');
}
