/**
 * Rewrite - Text rewriting helper
 *
 * @example
 * ```typescript
 * import { rewrite } from '@rana/helpers';
 *
 * // Make it formal
 * const formal = await rewrite('hey whats up', { style: 'formal' });
 * console.log(formal.rewritten); // "Hello, how are you?"
 *
 * // Make it concise
 * const concise = await rewrite(longText, { style: 'concise' });
 *
 * // Custom tone
 * const friendly = await rewrite(email, {
 *   tone: 'warm and friendly',
 *   audience: 'existing customers'
 * });
 * ```
 */

import type { RewriteOptions, RewriteResult, RewriteStyle } from '../types';
import { callLLM, parseJSON } from './base';

const styleDescriptions: Record<RewriteStyle, string> = {
  formal: 'Use formal, professional language. Avoid contractions and slang.',
  casual: 'Use casual, conversational language. Feel free to use contractions.',
  professional: 'Use clear, professional business language. Be direct and clear.',
  friendly: 'Use warm, friendly language. Be approachable and personable.',
  concise: 'Make it shorter and more direct. Remove unnecessary words.',
  detailed: 'Expand on the content. Add more detail and explanation.',
};

/**
 * Rewrite text with a different style or tone
 *
 * @param text - The text to rewrite
 * @param options - Rewrite options
 * @returns Rewritten text with change summary
 */
export async function rewrite(
  text: string,
  options: RewriteOptions = {}
): Promise<RewriteResult> {
  const {
    style = 'professional',
    tone,
    audience,
    preserveMeaning = true,
    improveGrammar = true,
  } = options;

  const styleGuide = styleDescriptions[style] || `Write in a ${style} style.`;

  const systemPrompt = `You are an expert editor and writing assistant. Rewrite the given text according to these guidelines:

Style: ${styleGuide}
${tone ? `Tone: ${tone}` : ''}
${audience ? `Target audience: ${audience}` : ''}
${preserveMeaning ? 'Important: Preserve the original meaning and intent.' : ''}
${improveGrammar ? 'Fix any grammar, spelling, or punctuation errors.' : ''}

Respond with a JSON object:
{
  "rewritten": "the rewritten text",
  "changes": ["change 1", "change 2", ...],
  "readabilityScore": 0-100 (higher is more readable)
}`;

  const { result, metadata } = await callLLM(
    'rewrite',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    rewritten: string;
    changes: string[];
    readabilityScore: number;
  };

  return {
    rewritten: parsed.rewritten,
    changes: parsed.changes,
    readabilityScore: parsed.readabilityScore,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Fix grammar and spelling only
 */
export async function fixGrammar(
  text: string,
  options: Omit<RewriteOptions, 'style'> = {}
): Promise<RewriteResult> {
  const systemPrompt = `You are a grammar and spelling checker. Fix any errors in the text while preserving the original style and meaning.

Only fix:
- Spelling errors
- Grammar mistakes
- Punctuation issues
- Subject-verb agreement

Do NOT change:
- Writing style
- Tone
- Word choice (unless incorrect)
- Sentence structure (unless grammatically wrong)

Respond with a JSON object:
{
  "rewritten": "the corrected text",
  "changes": ["change 1", "change 2", ...],
  "readabilityScore": 0-100
}`;

  const { result, metadata } = await callLLM(
    'fix_grammar',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    rewritten: string;
    changes: string[];
    readabilityScore: number;
  };

  return {
    rewritten: parsed.rewritten,
    changes: parsed.changes,
    readabilityScore: parsed.readabilityScore,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Simplify complex text
 */
export async function simplify(
  text: string,
  options: RewriteOptions = {}
): Promise<RewriteResult> {
  return rewrite(text, {
    ...options,
    style: 'concise',
    tone: 'simple and clear',
    audience: 'general audience with no specialized knowledge',
  });
}

/**
 * Expand brief text
 */
export async function expand(
  text: string,
  options: RewriteOptions = {}
): Promise<RewriteResult> {
  return rewrite(text, {
    ...options,
    style: 'detailed',
  });
}

/**
 * Paraphrase text (different words, same meaning)
 */
export async function paraphrase(
  text: string,
  options: RewriteOptions = {}
): Promise<RewriteResult> {
  const systemPrompt = `You are a paraphrasing assistant. Rewrite the text using different words and sentence structures while preserving the exact same meaning.

Guidelines:
- Use synonyms and alternative phrasings
- Change sentence structures where possible
- Keep the same level of formality
- Preserve all the original information
- Do not add or remove information

Respond with a JSON object:
{
  "rewritten": "the paraphrased text",
  "changes": ["used synonym X for Y", ...],
  "readabilityScore": 0-100
}`;

  const { result, metadata } = await callLLM(
    'paraphrase',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    rewritten: string;
    changes: string[];
    readabilityScore: number;
  };

  return {
    rewritten: parsed.rewritten,
    changes: parsed.changes,
    readabilityScore: parsed.readabilityScore,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Batch rewrite multiple texts
 */
export async function rewriteBatch(
  texts: string[],
  options: RewriteOptions = {}
): Promise<RewriteResult[]> {
  return Promise.all(texts.map(text => rewrite(text, options)));
}
