/**
 * @rana/prompts - Enterprise Prompt Management
 * Versioning, A/B testing, and analytics for LLM prompts
 *
 * @example
 * ```typescript
 * import { PromptManager, usePrompt } from '@rana/prompts';
 *
 * const pm = new PromptManager({ workspace: 'my-app' });
 *
 * // Register a prompt
 * await pm.register('greeting', {
 *   template: 'Hello {{name}}, how can I help you today?',
 *   variables: ['name']
 * });
 *
 * // Execute with tracking
 * const response = await pm.execute('greeting', { name: 'John' });
 *
 * // A/B test variants
 * await pm.abTest('greeting', {
 *   variants: ['formal', 'casual'],
 *   metric: 'user_satisfaction'
 * });
 * ```
 */

export { PromptManager } from './manager';
export { PromptRegistry } from './registry';
export { ABTestManager } from './ab-testing';
export { PromptAnalytics } from './analytics';
export { PromptOptimizer } from './optimizer';

export * from './types';
export * from './hooks';
