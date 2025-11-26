/**
 * Synthesis module exports
 */

export { RefineSynthesizer, refineSynthesizer } from './refine';
export { TreeSummarizeSynthesizer, treeSummarizeSynthesizer } from './tree-summarize';
export { CompactSynthesizer, compactSynthesizer } from './compact';

import type { SynthesizerOptions } from '../types';
import { RefineSynthesizer } from './refine';
import { TreeSummarizeSynthesizer } from './tree-summarize';
import { CompactSynthesizer } from './compact';

/**
 * Synthesizer factory
 */
export const synthesizers = {
  refine: (options?: SynthesizerOptions) => new RefineSynthesizer(),
  treeSummarize: (options?: SynthesizerOptions) => new TreeSummarizeSynthesizer(),
  compact: (options?: SynthesizerOptions) => new CompactSynthesizer(),
};
