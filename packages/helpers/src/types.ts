/**
 * Type definitions for @rana/helpers
 */

import { z } from 'zod';

// Provider configuration
export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'together' | 'mistral';

export interface HelperConfig {
  provider?: Provider;
  model?: string;
  apiKey?: string;
  cache?: boolean;
  cacheTTL?: number; // seconds
  timeout?: number; // milliseconds
  maxRetries?: number;
}

// Summarize types
export interface SummarizeOptions extends HelperConfig {
  length?: 'short' | 'medium' | 'long';
  style?: 'bullet' | 'paragraph' | 'tweet';
  maxWords?: number;
  focus?: string;
}

export interface SummarizeResult {
  summary: string;
  wordCount: number;
  compressionRatio: number;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Translate types
export interface TranslateOptions extends HelperConfig {
  to: string; // Target language code (e.g., 'es', 'fr', 'de')
  from?: string; // Source language (auto-detected if not provided)
  formal?: boolean;
  preserveFormatting?: boolean;
}

export interface TranslateResult {
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Classify types
export interface ClassifyOptions extends HelperConfig {
  multiLabel?: boolean;
  threshold?: number; // Confidence threshold for multi-label
  explain?: boolean;
}

export interface ClassifyResult {
  label: string;
  labels?: string[]; // For multi-label classification
  confidence: number;
  confidences?: Record<string, number>;
  explanation?: string;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Extract types
export type SchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object' | z.ZodType;

export interface ExtractOptions extends HelperConfig {
  strict?: boolean; // Fail if extraction incomplete
  examples?: Array<{ input: string; output: Record<string, unknown> }>;
}

export interface ExtractResult<T = Record<string, unknown>> {
  data: T;
  completeness: number; // 0-1, how many fields were extracted
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Sentiment types
export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface SentimentOptions extends HelperConfig {
  granular?: boolean; // Return detailed emotions
  aspects?: string[]; // Aspect-based sentiment
}

export interface SentimentResult {
  sentiment: SentimentLabel;
  score: number; // -1 to 1
  confidence: number;
  emotions?: Record<string, number>; // joy, anger, sadness, etc.
  aspects?: Record<string, { sentiment: SentimentLabel; score: number }>;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Answer types
export interface AnswerOptions extends HelperConfig {
  context?: string;
  sources?: string[];
  maxLength?: number;
  citeSources?: boolean;
}

export interface AnswerResult {
  answer: string;
  confidence: number;
  sources?: string[];
  citations?: Array<{ text: string; source: string }>;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Rewrite types
export type RewriteStyle = 'formal' | 'casual' | 'professional' | 'friendly' | 'concise' | 'detailed';

export interface RewriteOptions extends HelperConfig {
  style?: RewriteStyle;
  tone?: string;
  audience?: string;
  preserveMeaning?: boolean;
  improveGrammar?: boolean;
}

export interface RewriteResult {
  rewritten: string;
  changes: string[];
  readabilityScore: number;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Generate types
export type GenerateType = 'text' | 'email' | 'tweet' | 'blog' | 'code' | 'product_description' | 'headline';

export interface GenerateOptions extends HelperConfig {
  type?: GenerateType;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  template?: string;
  variables?: Record<string, string>;
}

export interface GenerateResult {
  content: string;
  wordCount: number;
  type: GenerateType;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Compare types
export interface CompareOptions extends HelperConfig {
  criteria?: string[];
  detailed?: boolean;
}

export interface CompareResult {
  similarity: number; // 0-1
  differences: string[];
  similarities: string[];
  winner?: string; // Which text is "better" based on criteria
  analysis?: string;
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Moderate types
export type ModerationCategory =
  | 'hate'
  | 'harassment'
  | 'violence'
  | 'sexual'
  | 'self_harm'
  | 'spam'
  | 'misinformation'
  | 'pii';

export interface ModerateOptions extends HelperConfig {
  categories?: ModerationCategory[];
  threshold?: number;
  explain?: boolean;
}

export interface ModerateResult {
  flagged: boolean;
  categories: Record<ModerationCategory, boolean>;
  scores: Record<ModerationCategory, number>;
  explanation?: string;
  suggestedAction?: 'allow' | 'review' | 'block';
  cached: boolean;
  cost: number;
  latencyMs: number;
}

// Batch types
export interface BatchOptions {
  concurrency?: number;
  stopOnError?: boolean;
  progressCallback?: (completed: number, total: number) => void;
}

// Common response metadata
export interface HelperMetadata {
  cached: boolean;
  cost: number;
  latencyMs: number;
  provider: Provider;
  model: string;
  requestId: string;
}
