/**
 * Moderate - Content moderation helper
 *
 * @example
 * ```typescript
 * import { moderate } from '@rana/helpers';
 *
 * // Basic moderation
 * const result = await moderate('Some user content here');
 * if (result.flagged) {
 *   console.log(result.categories); // { hate: true, harassment: false, ... }
 * }
 *
 * // With specific categories
 * const spam = await moderate(text, {
 *   categories: ['spam', 'hate', 'harassment']
 * });
 *
 * // With explanation
 * const detailed = await moderate(text, { explain: true });
 * console.log(detailed.explanation);
 * ```
 */

import type { ModerateOptions, ModerateResult, ModerationCategory } from '../types';
import { callLLM, parseJSON } from './base';

const allCategories: ModerationCategory[] = [
  'hate',
  'harassment',
  'violence',
  'sexual',
  'self_harm',
  'spam',
  'misinformation',
  'pii',
];

const categoryDescriptions: Record<ModerationCategory, string> = {
  hate: 'Content expressing hatred towards individuals or groups based on protected characteristics',
  harassment: 'Content that harasses, bullies, or threatens individuals',
  violence: 'Content depicting or promoting violence',
  sexual: 'Sexually explicit content',
  self_harm: 'Content promoting self-harm or suicide',
  spam: 'Spam, advertisements, or promotional content',
  misinformation: 'False or misleading information',
  pii: 'Personally identifiable information (emails, phone numbers, addresses)',
};

/**
 * Moderate content for policy violations
 *
 * @param text - The text to moderate
 * @param options - Moderation options
 * @returns Moderation result with category flags and scores
 */
export async function moderate(
  text: string,
  options: ModerateOptions = {}
): Promise<ModerateResult> {
  const { categories = allCategories, threshold = 0.5, explain = false } = options;

  const categoryList = categories
    .map(c => `- ${c}: ${categoryDescriptions[c]}`)
    .join('\n');

  const systemPrompt = `You are a content moderation system. Analyze the given content for policy violations.

Check for these categories:
${categoryList}

For each category:
- Score from 0 to 1 (0 = definitely not, 1 = definitely yes)
- Flag as true if score >= ${threshold}

${explain ? 'Also provide an explanation for any flagged content.' : ''}

Respond with a JSON object:
{
  "flagged": true/false (any category flagged),
  "categories": {
    "${categories[0]}": true/false,
    ...
  },
  "scores": {
    "${categories[0]}": 0-1,
    ...
  },
  "suggestedAction": "allow" | "review" | "block"
  ${explain ? ',"explanation": "explanation if flagged"' : ''}
}`;

  const { result, metadata } = await callLLM(
    'moderate',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    flagged: boolean;
    categories: Record<ModerationCategory, boolean>;
    scores: Record<ModerationCategory, number>;
    suggestedAction: 'allow' | 'review' | 'block';
    explanation?: string;
  };

  return {
    flagged: parsed.flagged,
    categories: parsed.categories,
    scores: parsed.scores,
    explanation: parsed.explanation,
    suggestedAction: parsed.suggestedAction,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Check if content is safe (no flags)
 */
export async function isSafe(
  text: string,
  options: ModerateOptions = {}
): Promise<boolean> {
  const result = await moderate(text, options);
  return !result.flagged;
}

/**
 * Check for spam
 */
export async function isSpam(
  text: string,
  options: Omit<ModerateOptions, 'categories'> = {}
): Promise<{ isSpam: boolean; score: number }> {
  const result = await moderate(text, { ...options, categories: ['spam'] });
  return {
    isSpam: result.categories.spam || false,
    score: result.scores.spam || 0,
  };
}

/**
 * Check for hate speech
 */
export async function isHateSpeech(
  text: string,
  options: Omit<ModerateOptions, 'categories'> = {}
): Promise<{ isHate: boolean; score: number; explanation?: string }> {
  const result = await moderate(text, {
    ...options,
    categories: ['hate', 'harassment'],
    explain: true,
  });
  return {
    isHate: result.categories.hate || result.categories.harassment || false,
    score: Math.max(result.scores.hate || 0, result.scores.harassment || 0),
    explanation: result.explanation,
  };
}

/**
 * Detect PII in text
 */
export async function detectPII(
  text: string,
  options: Omit<ModerateOptions, 'categories'> = {}
): Promise<{
  hasPII: boolean;
  types: string[];
  locations?: Array<{ type: string; value: string }>;
}> {
  const systemPrompt = `You are a PII detection system. Identify any personally identifiable information in the text.

Look for:
- Email addresses
- Phone numbers
- Physical addresses
- Social Security numbers
- Credit card numbers
- Names (if in context of PII)
- Dates of birth
- IP addresses

Respond with a JSON object:
{
  "hasPII": true/false,
  "types": ["email", "phone", ...],
  "locations": [
    { "type": "email", "value": "found value" },
    ...
  ]
}`;

  const { result } = await callLLM(
    'detect_pii',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  return result as {
    hasPII: boolean;
    types: string[];
    locations: Array<{ type: string; value: string }>;
  };
}

/**
 * Redact PII from text
 */
export async function redactPII(
  text: string,
  options: ModerateOptions = {}
): Promise<{ redacted: string; redactions: Array<{ type: string; original: string }> }> {
  const systemPrompt = `You are a PII redaction system. Replace any personally identifiable information with appropriate placeholders.

Replacements:
- Emails: [EMAIL]
- Phone numbers: [PHONE]
- Addresses: [ADDRESS]
- SSN: [SSN]
- Credit cards: [CARD]
- Names (if clearly PII): [NAME]
- Dates of birth: [DOB]
- IP addresses: [IP]

Respond with a JSON object:
{
  "redacted": "text with PII replaced",
  "redactions": [
    { "type": "email", "original": "original value" },
    ...
  ]
}`;

  const { result } = await callLLM(
    'redact_pii',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  return result as {
    redacted: string;
    redactions: Array<{ type: string; original: string }>;
  };
}

/**
 * Batch moderate multiple texts
 */
export async function moderateBatch(
  texts: string[],
  options: ModerateOptions = {}
): Promise<ModerateResult[]> {
  return Promise.all(texts.map(text => moderate(text, options)));
}
