/**
 * @cofounder/llm-detect - Type definitions for LLM-augmented detection
 */

/** Supported LLM providers */
export type LLMProvider = 'anthropic' | 'openai';

/** Types of content to detect */
export type DetectionType = 'pii' | 'injection' | 'toxicity' | 'compliance';

/** Configuration for the LLM detector */
export interface LLMDetectorConfig {
  /** Model identifier (e.g., 'claude-haiku-4-5-20251001', 'gpt-4o-mini') */
  model: string;
  /** LLM provider */
  provider: LLMProvider;
  /** API key for the provider */
  apiKey: string;
  /** Whether to fall back to regex when LLM is unavailable. Default: true */
  fallbackToRegex?: boolean;
  /** Minimum confidence threshold for findings (0-1). Default: 0.8 */
  confidenceThreshold?: number;
  /** Maximum tokens for the LLM response. Default: 1024 */
  maxTokens?: number;
  /** Request timeout in milliseconds. Default: 10000 */
  timeout?: number;
  /** Base URL override for the API endpoint */
  baseUrl?: string;
}

/** A request to detect content */
export interface DetectionRequest {
  /** The text to analyze */
  text: string;
  /** What type of detection to perform */
  type: DetectionType;
  /** Optional additional context for more accurate detection */
  context?: string;
  /** Optional compliance framework for compliance checks */
  framework?: string;
}

/** A single finding within a detection result */
export interface Finding {
  /** Type of finding (e.g., 'ssn', 'email', 'prompt_injection', 'hate_speech') */
  type: string;
  /** The matched or identified value */
  value: string;
  /** Start character index in the original text (-1 if not determinable) */
  start: number;
  /** End character index in the original text (-1 if not determinable) */
  end: number;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Human-readable explanation of why this was flagged */
  explanation: string;
  /** Whether this finding came from regex or LLM */
  source?: 'regex' | 'llm';
}

/** Result of a detection operation */
export interface DetectionResult {
  /** Detected findings */
  findings: Finding[];
  /** Overall confidence of the detection */
  confidence: number;
  /** Which model was used (or 'regex' if fallback) */
  modelUsed: string;
  /** Whether regex fallback was used */
  fallbackUsed: boolean;
  /** Estimated cost in USD (0 for regex) */
  cost: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** The detection type that was requested */
  detectionType: DetectionType;
}

/** Raw response from an LLM provider */
export interface LLMResponse {
  findings: Array<{
    type: string;
    value: string;
    start: number;
    end: number;
    confidence: number;
    explanation: string;
  }>;
  overallConfidence: number;
}

/** Interface for LLM provider implementations */
export interface LLMProviderInterface {
  /** Send a prompt to the LLM and get structured findings back */
  complete(
    systemPrompt: string,
    userPrompt: string,
    config: LLMDetectorConfig
  ): Promise<LLMResponse>;
}
