/**
 * Sentiment - Sentiment analysis helper
 *
 * @example
 * ```typescript
 * import { sentiment } from '@rana/helpers';
 *
 * const result = await sentiment('This product is amazing!');
 * console.log(result.sentiment); // "positive"
 * console.log(result.score); // 0.85
 *
 * // With emotions
 * const detailed = await sentiment('I love this!', { granular: true });
 * console.log(detailed.emotions); // { joy: 0.9, love: 0.8, ... }
 *
 * // Aspect-based sentiment
 * const review = await sentiment('Great food but slow service', {
 *   aspects: ['food', 'service', 'ambiance']
 * });
 * ```
 */

import type { SentimentOptions, SentimentResult, SentimentLabel } from '../types';
import { callLLM, parseJSON } from './base';

/**
 * Analyze sentiment of text
 *
 * @param text - The text to analyze
 * @param options - Analysis options
 * @returns Sentiment result with scores
 */
export async function sentiment(
  text: string,
  options: SentimentOptions = {}
): Promise<SentimentResult> {
  const { granular = false, aspects } = options;

  const systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of the given text.

${granular ? `Also identify specific emotions present in the text (joy, sadness, anger, fear, surprise, disgust, trust, anticipation).` : ''}

${aspects ? `Analyze sentiment for these specific aspects: ${aspects.join(', ')}` : ''}

Respond with a JSON object:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": -1 to 1 (negative to positive),
  "confidence": 0 to 1
  ${granular ? `,
  "emotions": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "surprise": 0-1,
    "disgust": 0-1,
    "trust": 0-1,
    "anticipation": 0-1
  }` : ''}
  ${aspects ? `,
  "aspects": {
    "${aspects[0]}": { "sentiment": "positive/negative/neutral", "score": -1 to 1 },
    ...
  }` : ''}
}`;

  const { result, metadata } = await callLLM(
    'sentiment',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    sentiment: SentimentLabel;
    score: number;
    confidence: number;
    emotions?: Record<string, number>;
    aspects?: Record<string, { sentiment: SentimentLabel; score: number }>;
  };

  return {
    sentiment: parsed.sentiment,
    score: parsed.score,
    confidence: parsed.confidence,
    emotions: parsed.emotions,
    aspects: parsed.aspects,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Quick positive/negative check
 */
export async function isPositive(
  text: string,
  options: SentimentOptions = {}
): Promise<boolean> {
  const result = await sentiment(text, options);
  return result.score > 0.2;
}

/**
 * Quick negative check
 */
export async function isNegative(
  text: string,
  options: SentimentOptions = {}
): Promise<boolean> {
  const result = await sentiment(text, options);
  return result.score < -0.2;
}

/**
 * Get dominant emotion
 */
export async function dominantEmotion(
  text: string,
  options: SentimentOptions = {}
): Promise<{ emotion: string; score: number }> {
  const result = await sentiment(text, { ...options, granular: true });

  if (!result.emotions) {
    return { emotion: 'neutral', score: 0.5 };
  }

  const entries = Object.entries(result.emotions);
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [emotion, score] = sorted[0] || ['neutral', 0.5];

  return { emotion, score };
}

/**
 * Batch sentiment analysis
 */
export async function sentimentBatch(
  texts: string[],
  options: SentimentOptions = {}
): Promise<SentimentResult[]> {
  return Promise.all(texts.map(text => sentiment(text, options)));
}
