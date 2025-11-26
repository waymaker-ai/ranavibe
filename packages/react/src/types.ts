/**
 * Type definitions for RANA React
 * These mirror @rana/core types for standalone use
 */

export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'xai' | 'mistral' | 'cohere' | 'together' | 'groq' | 'ollama';
export type LLMModel = string;
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: MessageRole;
  content: string | any[];
  name?: string;
}

export interface RanaChatRequest {
  messages: Message[];
  provider?: LLMProvider;
  model?: LLMModel;
  temperature?: number;
  max_tokens?: number;
  optimize?: 'cost' | 'speed' | 'quality' | 'balanced';
  cache?: boolean;
}

export interface RanaChatResponse {
  id: string;
  provider: LLMProvider;
  model: string;
  content: string;
  role: MessageRole;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
  };
  latency_ms: number;
  cached: boolean;
  created_at: Date;
  finish_reason: string | null;
  raw: any;
}

export interface CostStats {
  total_spent: number;
  total_saved: number;
  savings_percentage: number;
  total_requests: number;
  total_tokens: number;
  cache_hit_rate: number;
  breakdown: any[];
  period: {
    start: Date;
    end: Date;
  };
}

export interface RanaClient {
  chat(input: string | RanaChatRequest): Promise<RanaChatResponse>;
  stream(input: string | RanaChatRequest): AsyncGenerator<any>;
  cost: {
    stats(): Promise<CostStats>;
    reset(): void;
    total: number;
    saved: number;
  };
}
