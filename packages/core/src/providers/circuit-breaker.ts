/**
 * Circuit Breaker Pattern for Provider Reliability
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * and provide graceful degradation when providers are experiencing issues.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Provider is failing, reject requests immediately
 * - HALF_OPEN: Testing if provider has recovered
 */

import type { LLMProvider } from '../types';
import { RanaError } from '../types';
import { EventEmitter } from 'events';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before opening circuit
   * @default 5
   */
  failureThreshold?: number;

  /**
   * Failure rate percentage (0-100) to open circuit
   * @default 50
   */
  failureRateThreshold?: number;

  /**
   * Time window in ms to calculate failure rate
   * @default 60000 (1 minute)
   */
  failureRateWindow?: number;

  /**
   * Time in ms before attempting to recover (transition to HALF_OPEN)
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;

  /**
   * Number of successful requests in HALF_OPEN before closing circuit
   * @default 2
   */
  successThreshold?: number;

  /**
   * Callback when circuit state changes
   */
  onStateChange?: (provider: LLMProvider, from: CircuitState, to: CircuitState) => void;

  /**
   * Callback when circuit opens
   */
  onOpen?: (provider: LLMProvider, failures: number) => void;

  /**
   * Callback when circuit closes
   */
  onClose?: (provider: LLMProvider) => void;

  /**
   * Enable/disable circuit breaker
   * @default true
   */
  enabled?: boolean;
}

interface ProviderCircuit {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  resetTimer: NodeJS.Timeout | null;
  requestHistory: RequestRecord[];
}

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

export class CircuitBreakerError extends RanaError {
  constructor(provider: LLMProvider, state: CircuitState, details?: any) {
    super(
      `Circuit breaker is ${state} for ${provider}. Provider may be experiencing issues.`,
      'CIRCUIT_BREAKER_OPEN',
      provider,
      503,
      { state, ...details }
    );
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker extends EventEmitter {
  private circuits: Map<LLMProvider, ProviderCircuit> = new Map();
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    super();

    // Set defaults
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      failureRateThreshold: config.failureRateThreshold ?? 50,
      failureRateWindow: config.failureRateWindow ?? 60000,
      resetTimeout: config.resetTimeout ?? 30000,
      successThreshold: config.successThreshold ?? 2,
      onStateChange: config.onStateChange ?? (() => {}),
      onOpen: config.onOpen ?? (() => {}),
      onClose: config.onClose ?? (() => {}),
      enabled: config.enabled ?? true,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    provider: LLMProvider,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    // Initialize circuit if needed
    this.ensureCircuit(provider);
    const circuit = this.circuits.get(provider)!;

    // Check if circuit is open
    if (circuit.state === 'OPEN') {
      throw new CircuitBreakerError(provider, 'OPEN', {
        failureCount: circuit.failureCount,
        lastFailureTime: circuit.lastFailureTime,
      });
    }

    try {
      const result = await fn();
      this.onSuccess(provider);
      return result;
    } catch (error) {
      this.onFailure(provider, error);
      throw error;
    }
  }

  /**
   * Get current state of a provider's circuit
   */
  getState(provider: LLMProvider): CircuitState {
    const circuit = this.circuits.get(provider);
    return circuit?.state ?? 'CLOSED';
  }

  /**
   * Get statistics for a provider
   */
  getStats(provider: LLMProvider): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    failureRate: number;
    totalRequests: number;
  } {
    const circuit = this.circuits.get(provider);
    if (!circuit) {
      return {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        failureRate: 0,
        totalRequests: 0,
      };
    }

    const recentRequests = this.getRecentRequests(circuit);
    const failures = recentRequests.filter(r => !r.success).length;
    const total = recentRequests.length;
    const failureRate = total > 0 ? (failures / total) * 100 : 0;

    return {
      state: circuit.state,
      failureCount: circuit.failureCount,
      successCount: circuit.successCount,
      failureRate,
      totalRequests: total,
    };
  }

  /**
   * Get stats for all providers
   */
  getAllStats(): Record<LLMProvider, ReturnType<typeof this.getStats>> {
    const stats: any = {};
    for (const [provider] of this.circuits) {
      stats[provider] = this.getStats(provider);
    }
    return stats;
  }

  /**
   * Manually reset a circuit (force close)
   */
  reset(provider: LLMProvider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;

    this.transitionTo(provider, 'CLOSED');
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.lastFailureTime = null;
    circuit.requestHistory = [];

    if (circuit.resetTimer) {
      clearTimeout(circuit.resetTimer);
      circuit.resetTimer = null;
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    for (const [provider] of this.circuits) {
      this.reset(provider);
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<CircuitBreakerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      onStateChange: config.onStateChange ?? this.config.onStateChange,
      onOpen: config.onOpen ?? this.config.onOpen,
      onClose: config.onClose ?? this.config.onClose,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private ensureCircuit(provider: LLMProvider): void {
    if (!this.circuits.has(provider)) {
      this.circuits.set(provider, {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        resetTimer: null,
        requestHistory: [],
      });
    }
  }

  private onSuccess(provider: LLMProvider): void {
    const circuit = this.circuits.get(provider)!;

    // Record success
    this.recordRequest(circuit, true);

    // Handle state-specific logic
    if (circuit.state === 'HALF_OPEN') {
      circuit.successCount++;

      // If we've reached success threshold, close the circuit
      if (circuit.successCount >= this.config.successThreshold) {
        this.transitionTo(provider, 'CLOSED');
        circuit.failureCount = 0;
        circuit.successCount = 0;
        this.config.onClose(provider);
        this.emit('close', provider);
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset failure count on success in CLOSED state
      circuit.failureCount = 0;
    }
  }

  private onFailure(provider: LLMProvider, error: any): void {
    const circuit = this.circuits.get(provider)!;

    // Record failure
    this.recordRequest(circuit, false);
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    // Calculate failure rate
    const recentRequests = this.getRecentRequests(circuit);
    const failures = recentRequests.filter(r => !r.success).length;
    const failureRate = (failures / recentRequests.length) * 100;

    // Determine if we should open the circuit
    const shouldOpen =
      circuit.failureCount >= this.config.failureThreshold ||
      (recentRequests.length > 0 && failureRate >= this.config.failureRateThreshold);

    if (shouldOpen && circuit.state !== 'OPEN') {
      this.openCircuit(provider);
    } else if (circuit.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN returns to OPEN
      this.openCircuit(provider);
    }

    this.emit('failure', provider, error, circuit.failureCount);
  }

  private openCircuit(provider: LLMProvider): void {
    const circuit = this.circuits.get(provider)!;

    this.transitionTo(provider, 'OPEN');
    circuit.successCount = 0;

    // Clear any existing reset timer
    if (circuit.resetTimer) {
      clearTimeout(circuit.resetTimer);
    }

    // Schedule transition to HALF_OPEN
    circuit.resetTimer = setTimeout(() => {
      this.transitionTo(provider, 'HALF_OPEN');
      circuit.failureCount = 0;
      circuit.successCount = 0;
      this.emit('half-open', provider);
    }, this.config.resetTimeout);

    this.config.onOpen(provider, circuit.failureCount);
    this.emit('open', provider, circuit.failureCount);
  }

  private transitionTo(provider: LLMProvider, newState: CircuitState): void {
    const circuit = this.circuits.get(provider)!;
    const oldState = circuit.state;

    if (oldState !== newState) {
      circuit.state = newState;
      this.config.onStateChange(provider, oldState, newState);
      this.emit('state-change', provider, oldState, newState);
    }
  }

  private recordRequest(circuit: ProviderCircuit, success: boolean): void {
    circuit.requestHistory.push({
      timestamp: Date.now(),
      success,
    });

    // Clean up old records outside the window
    const cutoff = Date.now() - this.config.failureRateWindow;
    circuit.requestHistory = circuit.requestHistory.filter(
      r => r.timestamp > cutoff
    );
  }

  private getRecentRequests(circuit: ProviderCircuit): RequestRecord[] {
    const cutoff = Date.now() - this.config.failureRateWindow;
    return circuit.requestHistory.filter(r => r.timestamp > cutoff);
  }

  /**
   * Clean up timers when destroying
   */
  destroy(): void {
    for (const [, circuit] of this.circuits) {
      if (circuit.resetTimer) {
        clearTimeout(circuit.resetTimer);
      }
    }
    this.circuits.clear();
    this.removeAllListeners();
  }
}

/**
 * Create a circuit breaker instance
 *
 * @example
 * ```typescript
 * const breaker = createCircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   onStateChange: (provider, from, to) => {
 *     console.log(`${provider}: ${from} -> ${to}`);
 *   }
 * });
 *
 * // Use with provider calls
 * try {
 *   const result = await breaker.execute('anthropic', async () => {
 *     return await callAnthropicAPI();
 *   });
 * } catch (error) {
 *   if (error instanceof CircuitBreakerError) {
 *     // Handle circuit breaker open
 *   }
 * }
 * ```
 */
export function createCircuitBreaker(config?: CircuitBreakerConfig): CircuitBreaker {
  return new CircuitBreaker(config);
}
