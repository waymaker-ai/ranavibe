/**
 * Classify - Text classification helper
 *
 * @example
 * ```typescript
 * import { classify } from '@rana/helpers';
 *
 * const result = await classify('This is spam!', ['spam', 'ham', 'urgent']);
 * console.log(result.label); // "spam"
 * console.log(result.confidence); // 0.95
 *
 * // Multi-label classification
 * const multi = await classify('Breaking news about sports', ['news', 'sports', 'entertainment'], {
 *   multiLabel: true
 * });
 * console.log(multi.labels); // ["news", "sports"]
 * ```
 */

import type { ClassifyOptions, ClassifyResult } from '../types';
import { callLLM, parseJSON } from './base';

/**
 * Classify text into one or more categories
 *
 * @param text - The text to classify
 * @param categories - Array of possible categories
 * @param options - Classification options
 * @returns Classification result with confidence scores
 */
export async function classify(
  text: string,
  categories: string[],
  options: ClassifyOptions = {}
): Promise<ClassifyResult> {
  const { multiLabel = false, threshold = 0.5, explain = false } = options;

  const categoryList = categories.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const systemPrompt = `You are a precise text classifier. Classify the given text into ${multiLabel ? 'one or more of' : 'exactly one of'} the following categories:

${categoryList}

${multiLabel
    ? `For multi-label classification, select all categories that apply with confidence >= ${threshold}.`
    : 'Select the single most appropriate category.'
  }

${explain ? 'Also provide a brief explanation for your classification.' : ''}

Respond with a JSON object:
{
  "label": "primary category name",
  ${multiLabel ? '"labels": ["category1", "category2"],' : ''}
  "confidence": 0.95,
  "confidences": {
    "category1": 0.95,
    "category2": 0.30,
    ...
  }${explain ? ',\n  "explanation": "reason for classification"' : ''}
}`;

  const { result, metadata } = await callLLM(
    'classify',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    label: string;
    labels?: string[];
    confidence: number;
    confidences?: Record<string, number>;
    explanation?: string;
  };

  // Filter labels by threshold for multi-label
  let filteredLabels: string[] | undefined;
  if (multiLabel && parsed.confidences) {
    filteredLabels = Object.entries(parsed.confidences)
      .filter(([, conf]) => conf >= threshold)
      .map(([label]) => label);
  }

  return {
    label: parsed.label,
    labels: filteredLabels || parsed.labels,
    confidence: parsed.confidence,
    confidences: parsed.confidences,
    explanation: parsed.explanation,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Binary classification (yes/no, true/false)
 */
export async function classifyBinary(
  text: string,
  question: string,
  options: ClassifyOptions = {}
): Promise<{ answer: boolean; confidence: number; explanation?: string }> {
  const result = await classify(
    `Question: ${question}\n\nText: ${text}`,
    ['yes', 'no'],
    { ...options, explain: true }
  );

  return {
    answer: result.label.toLowerCase() === 'yes',
    confidence: result.confidence,
    explanation: result.explanation,
  };
}

/**
 * Batch classify multiple texts
 */
export async function classifyBatch(
  texts: string[],
  categories: string[],
  options: ClassifyOptions = {}
): Promise<ClassifyResult[]> {
  return Promise.all(texts.map(text => classify(text, categories, options)));
}
