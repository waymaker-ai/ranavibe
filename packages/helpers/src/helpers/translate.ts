/**
 * Translate - Language translation helper
 *
 * @example
 * ```typescript
 * import { translate } from '@rana/helpers';
 *
 * const result = await translate('Hello, world!', { to: 'es' });
 * console.log(result.translation); // "¡Hola, mundo!"
 *
 * // Formal translation
 * const formal = await translate('How are you?', {
 *   to: 'de',
 *   formal: true
 * });
 * ```
 */

import type { TranslateOptions, TranslateResult } from '../types';
import { callLLM, parseJSON } from './base';

// Language code to name mapping
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  sv: 'Swedish',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  el: 'Greek',
  he: 'Hebrew',
  uk: 'Ukrainian',
};

/**
 * Translate text to another language
 *
 * @param text - The text to translate
 * @param options - Translation options (must include 'to' language)
 * @returns Translation result with metadata
 */
export async function translate(
  text: string,
  options: TranslateOptions
): Promise<TranslateResult> {
  const { to, from, formal = false, preserveFormatting = true } = options;

  const targetLang = languageNames[to] || to;
  const sourceLang = from ? (languageNames[from] || from) : 'auto-detected';

  const systemPrompt = `You are an expert translator. Translate the given text to ${targetLang}.

Guidelines:
${from ? `- Source language: ${sourceLang}` : '- Auto-detect the source language'}
- Target language: ${targetLang}
${formal ? '- Use formal/polite language register' : '- Use natural, conversational language'}
${preserveFormatting ? '- Preserve any formatting, line breaks, and structure' : ''}
- Maintain the meaning, tone, and intent of the original
- Handle idioms and expressions appropriately for the target culture

Respond with a JSON object:
{
  "translation": "translated text here",
  "sourceLanguage": "detected or specified source language code",
  "confidence": 0.95
}`;

  const { result, metadata } = await callLLM(
    'translate',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as { translation: string; sourceLanguage: string; confidence: number };

  return {
    translation: parsed.translation,
    sourceLanguage: parsed.sourceLanguage || from || 'en',
    targetLanguage: to,
    confidence: parsed.confidence || 0.9,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Detect the language of text
 */
export async function detectLanguage(
  text: string,
  options: Omit<TranslateOptions, 'to'> = {} as TranslateOptions
): Promise<{ language: string; confidence: number }> {
  const systemPrompt = `Detect the language of the given text. Respond with a JSON object:
{
  "language": "language code (e.g., 'en', 'es', 'fr')",
  "languageName": "full language name",
  "confidence": 0.95
}`;

  const { result } = await callLLM(
    'detect_language',
    text,
    systemPrompt,
    { ...options, to: 'en' } as TranslateOptions,
    parseJSON
  );

  const parsed = result as { language: string; confidence: number };
  return {
    language: parsed.language,
    confidence: parsed.confidence,
  };
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  options: TranslateOptions
): Promise<TranslateResult[]> {
  return Promise.all(texts.map(text => translate(text, options)));
}
