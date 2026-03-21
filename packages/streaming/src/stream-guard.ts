/**
 * @ranavibe/streaming - StreamGuard
 *
 * Main class for guarding SSE/streaming LLM responses token-by-token.
 * Buffers tokens, runs detectors incrementally, and emits events for
 * safe chunks, violations, redactions, and blocks.
 */

import type {
  StreamGuardConfig,
  StreamGuardEvent,
  StreamChunk,
  StreamViolation,
  StreamReport,
  PiiStreamConfig,
  InjectionStreamConfig,
  ToxicityStreamConfig,
  ComplianceStreamConfig,
} from './types';
import { TokenBuffer } from './buffer';
import { PiiDetector, InjectionDetector, ToxicityDetector } from './detectors';
import { extractAnthropicDeltas } from './adapters/anthropic';
import { extractOpenAIDeltas } from './adapters/openai';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PII: PiiStreamConfig = {
  enabled: true,
  redact: true,
  replacement: '[REDACTED]',
  categories: ['email', 'phone', 'ssn', 'credit_card', 'ip_address', 'date_of_birth'],
};

const DEFAULT_INJECTION: InjectionStreamConfig = {
  enabled: true,
  blockOnDetection: true,
  checkInterval: 5,
};

const DEFAULT_TOXICITY: ToxicityStreamConfig = {
  enabled: true,
  blockOnDetection: false,
  minSeverity: 'medium',
};

const DEFAULT_COMPLIANCE: ComplianceStreamConfig = {
  enabled: false,
  frameworks: [],
};

const DEFAULT_CONFIG: StreamGuardConfig = {
  pii: DEFAULT_PII,
  injection: DEFAULT_INJECTION,
  toxicity: DEFAULT_TOXICITY,
  compliance: DEFAULT_COMPLIANCE,
  bufferSize: 200,
  flushInterval: 500,
};

function mergeConfig(partial?: Partial<StreamGuardConfig>): StreamGuardConfig {
  if (!partial) return { ...DEFAULT_CONFIG };
  return {
    pii: { ...DEFAULT_PII, ...partial.pii },
    injection: { ...DEFAULT_INJECTION, ...partial.injection },
    toxicity: { ...DEFAULT_TOXICITY, ...partial.toxicity },
    compliance: { ...DEFAULT_COMPLIANCE, ...partial.compliance },
    bufferSize: partial.bufferSize ?? DEFAULT_CONFIG.bufferSize,
    flushInterval: partial.flushInterval ?? DEFAULT_CONFIG.flushInterval,
  };
}

// ---------------------------------------------------------------------------
// StreamGuard
// ---------------------------------------------------------------------------

export class StreamGuard {
  private readonly config: StreamGuardConfig;
  private readonly buffer: TokenBuffer;
  private readonly piiDetector: PiiDetector;
  private readonly injectionDetector: InjectionDetector;
  private readonly toxicityDetector: ToxicityDetector;

  private chunkIndex: number = 0;
  private accumulated: string = '';
  private violations: StreamViolation[] = [];
  private redactionCount: number = 0;
  private blocked: boolean = false;
  private blockReason: string = '';
  private startTime: number = 0;
  private lastFlushTime: number = 0;

  constructor(config?: Partial<StreamGuardConfig>) {
    this.config = mergeConfig(config);
    this.buffer = new TokenBuffer(this.config.bufferSize);

    const piiConfig = this.config.pii as PiiStreamConfig;
    const injectionConfig = this.config.injection as InjectionStreamConfig;
    const toxicityConfig = this.config.toxicity as ToxicityStreamConfig;

    this.piiDetector = new PiiDetector(piiConfig.categories, piiConfig.replacement);
    this.injectionDetector = new InjectionDetector(injectionConfig.checkInterval);
    this.toxicityDetector = new ToxicityDetector(toxicityConfig.minSeverity);
  }

  /**
   * Process a single chunk from a stream.
   * Returns a StreamGuardEvent indicating what happened.
   */
  processChunk(text: string): StreamGuardEvent {
    if (this.startTime === 0) {
      this.startTime = Date.now();
      this.lastFlushTime = this.startTime;
    }

    if (this.blocked) {
      return {
        type: 'blocked',
        data: { text: '', reason: this.blockReason },
      };
    }

    const chunk: StreamChunk = {
      text,
      index: this.chunkIndex++,
      timestamp: Date.now(),
      accumulated: this.accumulated + text,
    };

    this.accumulated += text;
    this.buffer.append(text);

    const bufferText = this.buffer.getBuffer();
    const piiConfig = this.config.pii as PiiStreamConfig;
    const injectionConfig = this.config.injection as InjectionStreamConfig;
    const toxicityConfig = this.config.toxicity as ToxicityStreamConfig;

    // 1. PII Detection
    if (piiConfig.enabled) {
      const piiResult = this.piiDetector.detect(bufferText, chunk);
      if (piiResult.found) {
        this.violations.push(...piiResult.violations);
        if (piiConfig.redact && piiResult.redactedText !== undefined) {
          this.redactionCount += piiResult.violations.length;
          return {
            type: 'redacted',
            data: {
              text: piiResult.redactedText,
              originalText: bufferText,
              chunk,
              violation: piiResult.violations[0],
            },
          };
        }
      }
    }

    // 2. Injection Detection (checked periodically on accumulated text)
    if (injectionConfig.enabled) {
      const injResult = this.injectionDetector.detect(this.accumulated, chunk);
      if (injResult.found) {
        this.violations.push(...injResult.violations);
        const critical = injResult.violations.find(v => v.severity === 'critical');
        if (critical && injectionConfig.blockOnDetection) {
          this.blocked = true;
          this.blockReason = critical.detail;
          return {
            type: 'blocked',
            data: {
              text: '',
              chunk,
              violation: critical,
              reason: critical.detail,
            },
          };
        }
        return {
          type: 'violation',
          data: {
            text,
            chunk,
            violation: injResult.violations[0],
          },
        };
      }
    }

    // 3. Toxicity Detection (checked at sentence boundaries)
    if (toxicityConfig.enabled && this.buffer.isAtSentenceBoundary()) {
      const sentence = this.buffer.flushToSentenceBoundary();
      if (sentence) {
        const toxResult = this.toxicityDetector.detect(sentence, chunk);
        if (toxResult.found) {
          this.violations.push(...toxResult.violations);
          const critical = toxResult.violations.find(v => v.severity === 'critical');
          if (critical && toxicityConfig.blockOnDetection) {
            this.blocked = true;
            this.blockReason = critical.detail;
            return {
              type: 'blocked',
              data: {
                text: '',
                chunk,
                violation: critical,
                reason: critical.detail,
              },
            };
          }
          return {
            type: 'violation',
            data: {
              text,
              chunk,
              violation: toxResult.violations[0],
            },
          };
        }
      }
    }

    // Safe chunk — pass through.
    return {
      type: 'chunk',
      data: { text, chunk },
    };
  }

  /**
   * Wrap an async iterable stream and yield guarded events.
   * This is the primary API for guarding any text stream.
   */
  async *guard(stream: AsyncIterable<string>): AsyncGenerator<StreamGuardEvent> {
    for await (const text of stream) {
      const event = this.processChunk(text);
      yield event;
      if (this.blocked) break;
    }
    yield this.createCompleteEvent();
  }

  /**
   * Wrap an Anthropic streaming response.
   * Accepts the stream from `client.messages.stream()` or similar.
   */
  async *guardAnthropic(stream: AsyncIterable<unknown>): AsyncGenerator<StreamGuardEvent> {
    const deltas = extractAnthropicDeltas(
      stream as AsyncIterable<{ type: string; [key: string]: unknown }>,
    );
    yield* this.guard(deltas);
  }

  /**
   * Wrap an OpenAI streaming response.
   * Accepts the stream from `client.chat.completions.create({ stream: true })`.
   */
  async *guardOpenAI(stream: AsyncIterable<unknown>): AsyncGenerator<StreamGuardEvent> {
    const deltas = extractOpenAIDeltas(
      stream as AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>,
    );
    yield* this.guard(deltas);
  }

  /**
   * Finalize the stream and get the report.
   * Call this after the stream ends (or is blocked) to get statistics.
   */
  finalize(): StreamReport {
    const duration = this.startTime > 0 ? Date.now() - this.startTime : 0;
    return {
      totalChunks: this.chunkIndex,
      totalTokens: approximateTokenCount(this.accumulated),
      violations: [...this.violations],
      redactions: this.redactionCount,
      blocked: this.blocked,
      duration,
    };
  }

  /** Whether the stream is currently blocked. */
  get isBlocked(): boolean {
    return this.blocked;
  }

  /** Get the accumulated text so far. */
  get text(): string {
    return this.accumulated;
  }

  /** Reset state for reuse. */
  reset(): void {
    this.chunkIndex = 0;
    this.accumulated = '';
    this.violations = [];
    this.redactionCount = 0;
    this.blocked = false;
    this.blockReason = '';
    this.startTime = 0;
    this.lastFlushTime = 0;
    this.buffer.reset();
    this.injectionDetector.reset();
  }

  private createCompleteEvent(): StreamGuardEvent {
    return {
      type: 'complete',
      data: {
        report: this.finalize(),
      },
    };
  }
}

function approximateTokenCount(text: string): number {
  if (!text) return 0;
  // Rough approximation: ~4 characters per token for English text.
  return Math.ceil(text.length / 4);
}
