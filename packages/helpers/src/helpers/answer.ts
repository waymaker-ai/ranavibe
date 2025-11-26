/**
 * Answer - Question answering helper
 *
 * @example
 * ```typescript
 * import { answer } from '@rana/helpers';
 *
 * // Simple Q&A
 * const result = await answer('What is the capital of France?');
 * console.log(result.answer); // "Paris"
 *
 * // With context
 * const contextual = await answer('What is the main product?', {
 *   context: 'Acme Corp sells widgets and gadgets. Their main product is the SuperWidget 3000.'
 * });
 *
 * // With source citations
 * const cited = await answer('What are the benefits?', {
 *   sources: [doc1, doc2, doc3],
 *   citeSources: true
 * });
 * ```
 */

import type { AnswerOptions, AnswerResult } from '../types';
import { callLLM, parseJSON } from './base';

/**
 * Answer a question
 *
 * @param question - The question to answer
 * @param options - Answer options
 * @returns Answer result with confidence and optional citations
 */
export async function answer(
  question: string,
  options: AnswerOptions = {}
): Promise<AnswerResult> {
  const { context, sources, maxLength, citeSources = false } = options;

  const contextSection = context ? `\nContext:\n${context}` : '';
  const sourcesSection = sources
    ? `\nSources:\n${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n')}`
    : '';

  const systemPrompt = `You are a helpful question-answering assistant. Answer the question accurately and concisely.

${contextSection}
${sourcesSection}

Guidelines:
- Answer based on the provided context/sources if available
- If no context is provided, use your general knowledge
- Be concise but complete
${maxLength ? `- Keep the answer under ${maxLength} characters` : ''}
${citeSources ? '- Cite your sources using [1], [2], etc.' : ''}
- If you cannot answer the question, say so and explain why

${citeSources ? `Respond with a JSON object:
{
  "answer": "your answer here",
  "confidence": 0-1,
  "citations": [
    { "text": "relevant quote", "source": "[1]" }
  ]
}` : `Respond with a JSON object:
{
  "answer": "your answer here",
  "confidence": 0-1
}`}`;

  const { result, metadata } = await callLLM(
    'answer',
    question,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    answer: string;
    confidence: number;
    citations?: Array<{ text: string; source: string }>;
  };

  return {
    answer: parsed.answer,
    confidence: parsed.confidence,
    sources: sources,
    citations: parsed.citations,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Answer with RAG-style context retrieval
 * (Uses provided documents as context)
 */
export async function answerFromDocs(
  question: string,
  documents: string[],
  options: Omit<AnswerOptions, 'sources'> = {}
): Promise<AnswerResult> {
  return answer(question, {
    ...options,
    sources: documents,
    citeSources: true,
  });
}

/**
 * Yes/No question answering
 */
export async function answerYesNo(
  question: string,
  options: AnswerOptions = {}
): Promise<{ answer: boolean; confidence: number; explanation: string }> {
  const systemPrompt = `You are a yes/no question answering assistant. Answer the question with yes or no, and provide a brief explanation.

${options.context ? `Context:\n${options.context}` : ''}

Respond with a JSON object:
{
  "answer": true or false,
  "confidence": 0-1,
  "explanation": "brief explanation"
}`;

  const { result, metadata } = await callLLM(
    'answer_yesno',
    question,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    answer: boolean;
    confidence: number;
    explanation: string;
  };

  return {
    answer: parsed.answer,
    confidence: parsed.confidence,
    explanation: parsed.explanation,
  };
}

/**
 * Multiple choice question answering
 */
export async function answerMultipleChoice(
  question: string,
  choices: string[],
  options: AnswerOptions = {}
): Promise<{ answer: string; index: number; confidence: number; explanation: string }> {
  const choiceList = choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`).join('\n');

  const systemPrompt = `You are a multiple choice question answering assistant. Select the best answer from the choices.

${options.context ? `Context:\n${options.context}` : ''}

Choices:
${choiceList}

Respond with a JSON object:
{
  "answer": "the letter of your choice (A, B, C, etc.)",
  "index": 0-based index of the choice,
  "confidence": 0-1,
  "explanation": "brief explanation of why this is the best answer"
}`;

  const { result } = await callLLM(
    'answer_mc',
    question,
    systemPrompt,
    options,
    parseJSON
  );

  const parsed = result as {
    answer: string;
    index: number;
    confidence: number;
    explanation: string;
  };

  return {
    answer: choices[parsed.index] || parsed.answer,
    index: parsed.index,
    confidence: parsed.confidence,
    explanation: parsed.explanation,
  };
}

/**
 * Batch answer multiple questions
 */
export async function answerBatch(
  questions: string[],
  options: AnswerOptions = {}
): Promise<AnswerResult[]> {
  return Promise.all(questions.map(q => answer(q, options)));
}
