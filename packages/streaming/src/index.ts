/**
 * @ranavibe/streaming
 *
 * Guard SSE/streaming LLM responses token-by-token.
 * Catch PII, injection, and toxicity mid-stream in real-time.
 *
 * Zero runtime dependencies.
 */

// Core
export { StreamGuard } from './stream-guard';
export { TokenBuffer } from './buffer';

// Detectors
export { PiiDetector, InjectionDetector, ToxicityDetector } from './detectors';
export type { DetectionResult } from './detectors';

// Adapters
export {
  extractAnthropicDeltas,
  extractAnthropicSSEDeltas,
} from './adapters/anthropic';
export {
  extractOpenAIDeltas,
  extractOpenAISSEDeltas,
} from './adapters/openai';
export {
  parseSSEStream,
  extractSSETextDeltas,
} from './adapters/sse';
export type { SSEEvent } from './adapters/sse';

// Types
export type {
  StreamGuardConfig,
  StreamChunk,
  StreamGuardEvent,
  StreamGuardEventType,
  StreamGuardEventData,
  StreamViolation,
  StreamReport,
  PiiStreamConfig,
  InjectionStreamConfig,
  ToxicityStreamConfig,
  ComplianceStreamConfig,
  PiiCategory,
  ViolationType,
  ViolationSeverity,
} from './types';
