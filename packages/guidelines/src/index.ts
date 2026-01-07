/**
 * @rana/guidelines
 * Dynamic guideline management for RANA agents
 *
 * @example
 * ```typescript
 * import { createGuidelineManager, createGuideline, Conditions } from '@rana/guidelines';
 *
 * const manager = createGuidelineManager();
 *
 * // Add a guideline
 * await manager.addGuideline(createGuideline({
 *   id: 'no-medical-advice',
 *   condition: Conditions.topic('medical'),
 *   content: 'Never provide medical diagnoses. Always suggest consulting a doctor.',
 *   enforcement: 'strict',
 *   priority: 100
 * }));
 *
 * // Match guidelines
 * const matched = await manager.match({
 *   topic: 'medical',
 *   message: 'I have a headache, what should I do?'
 * });
 * ```
 */

// Core types
export type * from './types';

// Guideline creation
export {
  createGuideline,
  Conditions,
  PresetGuidelines,
  resolveContent,
  matchesContext,
} from './guideline';
export type { CreateGuidelineOptions } from './guideline';

// Manager
export { GuidelineManager, createGuidelineManager } from './manager';

// Storage
export { MemoryStorage, FileStorage, createStorage } from './storage';
