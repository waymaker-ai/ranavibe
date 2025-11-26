/**
 * Summarize - Text summarization helper
 *
 * @example
 * ```typescript
 * import { summarize } from '@rana/helpers';
 *
 * const result = await summarize(longArticle);
 * console.log(result.summary);
 *
 * // With options
 * const bullets = await summarize(longArticle, {
 *   style: 'bullet',
 *   length: 'short',
 *   maxWords: 100
 * });
 * ```
 */

import type { SummarizeOptions, SummarizeResult } from '../types';
import { callLLM } from './base';

/**
 * Summarize text into a shorter version
 *
 * @param text - The text to summarize
 * @param options - Summarization options
 * @returns Summary result with metadata
 */
export async function summarize(
  text: string,
  options: SummarizeOptions = {}
): Promise<SummarizeResult> {
  const { length = 'medium', style = 'paragraph', maxWords, focus } = options;

  const lengthGuidance = {
    short: 'Keep the summary very brief, around 50-75 words.',
    medium: 'Create a moderate summary, around 100-150 words.',
    long: 'Create a comprehensive summary, around 200-300 words.',
  };

  const styleGuidance = {
    bullet: 'Format the summary as bullet points, each capturing a key point.',
    paragraph: 'Write the summary as flowing paragraphs.',
    tweet: 'Summarize in 280 characters or less, suitable for a tweet.',
  };

  const systemPrompt = `You are a precise summarization assistant. Your task is to summarize the given text while preserving the key information and meaning.

Guidelines:
- ${lengthGuidance[length]}
- ${styleGuidance[style]}
${maxWords ? `- Maximum ${maxWords} words.` : ''}
${focus ? `- Focus particularly on: ${focus}` : ''}
- Be accurate and don't add information not present in the original text.
- Maintain the original tone and perspective.`;

  const { result, metadata } = await callLLM('summarize', text, systemPrompt, options);

  const summary = result as string;
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  const originalWordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    summary,
    wordCount,
    compressionRatio: originalWordCount > 0 ? wordCount / originalWordCount : 0,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Batch summarize multiple texts
 */
export async function summarizeBatch(
  texts: string[],
  options: SummarizeOptions = {}
): Promise<SummarizeResult[]> {
  return Promise.all(texts.map(text => summarize(text, options)));
}
