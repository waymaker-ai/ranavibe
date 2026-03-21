/**
 * Main LLM-augmented detector class.
 *
 * Uses a small, fast LLM (e.g., Haiku/mini) to detect content issues
 * that regex patterns cannot catch, such as obfuscated PII, novel
 * injection techniques, and context-dependent toxicity.
 */

import type {
  LLMDetectorConfig,
  DetectionRequest,
  DetectionResult,
  Finding,
  LLMResponse,
} from './types';
import { createProvider } from './providers';
import { getSystemPrompt, buildUserPrompt } from './prompts';
import { regexDetect } from './hybrid';

/** Default configuration values */
const DEFAULTS = {
  fallbackToRegex: true,
  confidenceThreshold: 0.8,
  maxTokens: 1024,
  timeout: 10000,
} as const;

/** Rough cost estimates per 1K tokens (USD) */
const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.0008, output: 0.004 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  default: { input: 0.001, output: 0.002 },
};

export class LLMDetector {
  private config: Required<
    Pick<
      LLMDetectorConfig,
      'model' | 'provider' | 'apiKey' | 'fallbackToRegex' | 'confidenceThreshold' | 'maxTokens' | 'timeout'
    >
  > & Pick<LLMDetectorConfig, 'baseUrl'>;

  constructor(config: LLMDetectorConfig) {
    this.config = {
      model: config.model,
      provider: config.provider,
      apiKey: config.apiKey,
      fallbackToRegex: config.fallbackToRegex ?? DEFAULTS.fallbackToRegex,
      confidenceThreshold: config.confidenceThreshold ?? DEFAULTS.confidenceThreshold,
      maxTokens: config.maxTokens ?? DEFAULTS.maxTokens,
      timeout: config.timeout ?? DEFAULTS.timeout,
      baseUrl: config.baseUrl,
    };
  }

  /**
   * Detect content issues using the configured LLM.
   *
   * @example
   * ```typescript
   * const detector = new LLMDetector({
   *   model: 'claude-haiku-4-5-20251001',
   *   provider: 'anthropic',
   *   apiKey: process.env.ANTHROPIC_API_KEY!,
   *   confidenceThreshold: 0.8,
   *   fallbackToRegex: true,
   * });
   *
   * const result = await detector.detect({
   *   text: 'My social is one two three, forty five, sixty seven eighty nine',
   *   type: 'pii',
   * });
   * // Finds SSN written in words!
   * ```
   */
  async detect(request: DetectionRequest): Promise<DetectionResult> {
    const startTime = Date.now();

    try {
      const provider = createProvider(this.config.provider);
      const systemPrompt = getSystemPrompt(request.type, request.framework);
      const userPrompt = buildUserPrompt(request.text, request.context);

      const llmResponse = await provider.complete(
        systemPrompt,
        userPrompt,
        this.config
      );

      // Filter findings by confidence threshold
      const findings: Finding[] = llmResponse.findings
        .filter((f) => f.confidence >= this.config.confidenceThreshold)
        .map((f) => ({
          ...f,
          source: 'llm' as const,
        }));

      const cost = estimateCost(
        this.config.model,
        request.text.length,
        this.config.maxTokens
      );

      return {
        findings,
        confidence: llmResponse.overallConfidence,
        modelUsed: this.config.model,
        fallbackUsed: false,
        cost,
        processingTime: Date.now() - startTime,
        detectionType: request.type,
      };
    } catch (error) {
      // Fall back to regex if configured
      if (this.config.fallbackToRegex) {
        const regexFindings = regexDetect(request.text, request.type);

        return {
          findings: regexFindings,
          confidence: regexFindings.length > 0 ? 0.7 : 1.0,
          modelUsed: 'regex',
          fallbackUsed: true,
          cost: 0,
          processingTime: Date.now() - startTime,
          detectionType: request.type,
        };
      }

      throw error;
    }
  }

  /**
   * Detect content issues across multiple detection types.
   */
  async detectAll(
    text: string,
    types: DetectionRequest['type'][] = ['pii', 'injection', 'toxicity'],
    context?: string
  ): Promise<Record<string, DetectionResult>> {
    const results: Record<string, DetectionResult> = {};

    for (const type of types) {
      results[type] = await this.detect({ text, type, context });
    }

    return results;
  }

  /**
   * Update the detector configuration.
   */
  updateConfig(updates: Partial<LLMDetectorConfig>): void {
    if (updates.model !== undefined) this.config.model = updates.model;
    if (updates.provider !== undefined) this.config.provider = updates.provider;
    if (updates.apiKey !== undefined) this.config.apiKey = updates.apiKey;
    if (updates.fallbackToRegex !== undefined)
      this.config.fallbackToRegex = updates.fallbackToRegex;
    if (updates.confidenceThreshold !== undefined)
      this.config.confidenceThreshold = updates.confidenceThreshold;
    if (updates.maxTokens !== undefined) this.config.maxTokens = updates.maxTokens;
    if (updates.timeout !== undefined) this.config.timeout = updates.timeout;
    if (updates.baseUrl !== undefined) this.config.baseUrl = updates.baseUrl;
  }
}

/**
 * Estimate the cost of an LLM call in USD.
 */
function estimateCost(
  model: string,
  inputChars: number,
  maxOutputTokens: number
): number {
  const pricing = COST_PER_1K_TOKENS[model] || COST_PER_1K_TOKENS['default'];

  // Rough estimate: ~4 chars per token
  const inputTokens = Math.ceil(inputChars / 4);
  // Assume output uses ~50% of max tokens on average
  const outputTokens = Math.ceil(maxOutputTokens * 0.5);

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;

  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}
