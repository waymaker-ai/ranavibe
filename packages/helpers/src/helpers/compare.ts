/**
 * Compare - Text comparison helper
 *
 * @example
 * ```typescript
 * import { compare } from '@rana/helpers';
 *
 * // Compare two texts
 * const result = await compare(text1, text2);
 * console.log(result.similarity); // 0.85
 * console.log(result.differences); // ["Text 1 mentions X", "Text 2 is more detailed"]
 *
 * // Compare with criteria
 * const detailed = await compare(text1, text2, {
 *   criteria: ['accuracy', 'clarity', 'completeness'],
 *   detailed: true
 * });
 * ```
 */

import type { CompareOptions, CompareResult } from '../types';
import { callLLM, parseJSON } from './base';

/**
 * Compare two texts
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @param options - Comparison options
 * @returns Comparison result with similarity and differences
 */
export async function compare(
  text1: string,
  text2: string,
  options: CompareOptions = {}
): Promise<CompareResult> {
  const { criteria, detailed = false } = options;

  const criteriaSection = criteria
    ? `Evaluate based on these criteria: ${criteria.join(', ')}`
    : '';

  const systemPrompt = `You are a text comparison expert. Compare the two texts and provide a detailed analysis.

${criteriaSection}

Analyze:
- Overall similarity (0-1 scale)
- Key differences
- Key similarities
${criteria ? '- Which text is better based on the criteria' : ''}
${detailed ? '- Detailed breakdown of differences' : ''}

Respond with a JSON object:
{
  "similarity": 0-1,
  "differences": ["difference 1", "difference 2", ...],
  "similarities": ["similarity 1", "similarity 2", ...],
  ${criteria ? '"winner": "text1" or "text2" or "tie",' : ''}
  ${detailed ? '"analysis": "detailed analysis text"' : ''}
}`;

  const input = `TEXT 1:\n${text1}\n\nTEXT 2:\n${text2}`;

  const { result, metadata } = await callLLM(
    'compare',
    input,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    similarity: number;
    differences: string[];
    similarities: string[];
    winner?: string;
    analysis?: string;
  };

  return {
    similarity: parsed.similarity,
    differences: parsed.differences,
    similarities: parsed.similarities,
    winner: parsed.winner,
    analysis: parsed.analysis,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Check if two texts are semantically similar
 */
export async function isSimilar(
  text1: string,
  text2: string,
  threshold: number = 0.7,
  options: CompareOptions = {}
): Promise<boolean> {
  const result = await compare(text1, text2, options);
  return result.similarity >= threshold;
}

/**
 * Check if two texts are duplicates or near-duplicates
 */
export async function isDuplicate(
  text1: string,
  text2: string,
  threshold: number = 0.9,
  options: CompareOptions = {}
): Promise<{ isDuplicate: boolean; similarity: number }> {
  const result = await compare(text1, text2, options);
  return {
    isDuplicate: result.similarity >= threshold,
    similarity: result.similarity,
  };
}

/**
 * Compare multiple texts and rank them
 */
export async function rank(
  texts: string[],
  criteria: string,
  options: CompareOptions = {}
): Promise<{ rankings: Array<{ index: number; text: string; score: number }>; explanation: string }> {
  const systemPrompt = `You are a ranking expert. Rank the following texts based on: ${criteria}

Respond with a JSON object:
{
  "rankings": [
    { "index": 0, "score": 0-100, "reason": "why this rank" },
    ...
  ],
  "explanation": "overall explanation of rankings"
}`;

  const input = texts.map((t, i) => `TEXT ${i + 1}:\n${t}`).join('\n\n---\n\n');

  const { result } = await callLLM(
    'rank',
    input,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    rankings: Array<{ index: number; score: number; reason: string }>;
    explanation: string;
  };

  return {
    rankings: parsed.rankings
      .sort((a, b) => b.score - a.score)
      .map(r => ({
        index: r.index,
        text: texts[r.index] || '',
        score: r.score,
      })),
    explanation: parsed.explanation,
  };
}

/**
 * Find the most similar text from a list
 */
export async function findMostSimilar(
  query: string,
  candidates: string[],
  options: CompareOptions = {}
): Promise<{ index: number; text: string; similarity: number }> {
  const results = await Promise.all(
    candidates.map(async (candidate, index) => {
      const result = await compare(query, candidate, options);
      return { index, text: candidate, similarity: result.similarity };
    })
  );

  const sorted = results.sort((a, b) => b.similarity - a.similarity);
  return sorted[0] || { index: -1, text: '', similarity: 0 };
}

/**
 * Diff two texts and highlight changes
 */
export async function diff(
  text1: string,
  text2: string,
  options: CompareOptions = {}
): Promise<{
  added: string[];
  removed: string[];
  modified: Array<{ original: string; modified: string }>;
}> {
  const systemPrompt = `You are a diff expert. Compare the two texts and identify what was added, removed, and modified.

Respond with a JSON object:
{
  "added": ["new content 1", "new content 2", ...],
  "removed": ["removed content 1", ...],
  "modified": [
    { "original": "original text", "modified": "new text" },
    ...
  ]
}`;

  const input = `ORIGINAL:\n${text1}\n\nMODIFIED:\n${text2}`;

  const { result } = await callLLM(
    'diff',
    input,
    systemPrompt,
    options,
    parseJSON
  );

  return result as {
    added: string[];
    removed: string[];
    modified: Array<{ original: string; modified: string }>;
  };
}
