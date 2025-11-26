/**
 * @rana/helpers - Quick LLM Helpers
 * One-line AI functions for common tasks
 *
 * @example
 * ```typescript
 * import { summarize, translate, classify, extract } from '@rana/helpers';
 *
 * const summary = await summarize(longText);
 * const spanish = await translate(text, { to: 'es' });
 * const category = await classify(text, ['spam', 'ham']);
 * const data = await extract(text, { name: 'string', email: 'string' });
 * ```
 */

export * from './helpers/summarize';
export * from './helpers/translate';
export * from './helpers/classify';
export * from './helpers/extract';
export * from './helpers/sentiment';
export * from './helpers/answer';
export * from './helpers/rewrite';
export * from './helpers/generate';
export * from './helpers/compare';
export * from './helpers/moderate';

export * from './types';
export * from './config';
export * from './cache';
