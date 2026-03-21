/**
 * @cofounder/context-optimizer
 * Extended context optimization for CoFounder - Efficiently handle 400K+ token contexts
 *
 * @example
 * ```typescript
 * import { createContextOptimizer } from '@cofounder/context-optimizer';
 *
 * const optimizer = createContextOptimizer({
 *   strategy: 'hybrid',
 *   maxTokens: 400000,
 *   costTarget: 'balanced',
 * });
 *
 * const optimized = await optimizer.optimize({
 *   query: 'Find all authentication flows',
 *   codebase: files,
 *   preserveCritical: true,
 * });
 *
 * console.log(`Tokens used: ${optimized.tokensUsed} / 400K`);
 * console.log(`Cost saved: ${optimized.costSaved}%`);
 * ```
 */

// Types
export type * from './types';

// Optimizer
export { ContextOptimizer, createContextOptimizer } from './optimizer';
