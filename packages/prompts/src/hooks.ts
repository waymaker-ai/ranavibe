/**
 * React Hooks for Prompt Management
 * Provides easy integration with React applications
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  PromptDefinition,
  PromptExecutionOptions,
  PromptExecutionResult,
  ABTestResult,
} from './types';
import { PromptManager } from './manager';

// Global prompt manager instance
let globalManager: PromptManager | null = null;

/**
 * Initialize the global prompt manager
 */
export function initPromptManager(config: {
  workspace: string;
  defaultProvider?: string;
  defaultModel?: string;
}): PromptManager {
  globalManager = new PromptManager(config);
  return globalManager;
}

/**
 * Get the global prompt manager
 */
export function getPromptManager(): PromptManager {
  if (!globalManager) {
    throw new Error('PromptManager not initialized. Call initPromptManager first.');
  }
  return globalManager;
}

/**
 * usePrompt Hook
 * Execute prompts with loading states and error handling
 */
export function usePrompt(promptId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PromptExecutionResult | null>(null);
  const [prompt, setPrompt] = useState<PromptDefinition | null>(null);

  // Load prompt definition
  useEffect(() => {
    const loadPrompt = async () => {
      try {
        const manager = getPromptManager();
        const p = await manager.get(promptId);
        setPrompt(p);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load prompt'));
      }
    };
    loadPrompt();
  }, [promptId]);

  const execute = useCallback(
    async (
      variables: Record<string, string>,
      options?: Partial<PromptExecutionOptions>
    ): Promise<PromptExecutionResult> => {
      setLoading(true);
      setError(null);

      try {
        const manager = getPromptManager();
        const res = await manager.execute(promptId, {
          variables,
          ...options,
        });
        setResult(res);
        return res;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Execution failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [promptId]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    prompt,
    execute,
    result,
    loading,
    error,
    reset,
    response: result?.response,
    metrics: result?.metrics,
  };
}

/**
 * usePromptStream Hook
 * Execute prompts with streaming support
 */
export function usePromptStream(promptId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [metrics, setMetrics] = useState<PromptExecutionResult['metrics'] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      variables: Record<string, string>,
      options?: Partial<PromptExecutionOptions>
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      setContent('');
      setIsStreaming(true);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const manager = getPromptManager();

        // For now, use non-streaming and simulate streaming
        // In production, this would use actual streaming API
        const result = await manager.execute(promptId, {
          variables,
          stream: true,
          ...options,
        });

        // Simulate streaming by revealing characters gradually
        const response = result.response;
        for (let i = 0; i <= response.length; i++) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }
          setContent(response.substring(0, i));
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        setMetrics(result.metrics);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Cancelled by user
          return;
        }
        const error = err instanceof Error ? err : new Error('Stream failed');
        setError(error);
      } finally {
        setLoading(false);
        setIsStreaming(false);
      }
    },
    [promptId]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setLoading(false);
    setIsStreaming(false);
    setMetrics(null);
  }, []);

  return {
    execute,
    content,
    loading,
    isStreaming,
    error,
    metrics,
    stop,
    reset,
  };
}

/**
 * usePromptABTest Hook
 * Run A/B tests on prompts
 */
export function usePromptABTest(testId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<ABTestResult | null>(null);
  const [currentVariant, setCurrentVariant] = useState<string | null>(null);

  // Load test results
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const manager = getPromptManager();
      const res = await manager.getABTestResults(testId);
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load results'));
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const execute = useCallback(
    async (
      promptId: string,
      variables: Record<string, string>,
      userId?: string
    ): Promise<PromptExecutionResult> => {
      setLoading(true);
      setError(null);

      try {
        const manager = getPromptManager();
        const result = await manager.execute(promptId, {
          variables,
          abTestId: testId,
          userId,
        });

        if (result.abTest) {
          setCurrentVariant(result.abTest.variant);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Execution failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [testId]
  );

  const recordConversion = useCallback(
    async (variantId: string, value: number = 1): Promise<void> => {
      try {
        const manager = getPromptManager();
        await manager.recordConversion(testId, variantId, value);
        // Refresh results
        await loadResults();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to record conversion'));
      }
    },
    [testId, loadResults]
  );

  return {
    execute,
    recordConversion,
    results,
    currentVariant,
    loading,
    error,
    refresh: loadResults,
  };
}

/**
 * usePromptAnalytics Hook
 * Access prompt analytics data
 */
export function usePromptAnalytics(
  promptId: string,
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [analytics, setAnalytics] = useState<{
    executions: number;
    avgLatency: number;
    avgCost: number;
    successRate: number;
  } | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const manager = getPromptManager();
      const data = await manager.getAnalytics(promptId, period);
      setAnalytics({
        executions: data.executions,
        avgLatency: data.avgLatency,
        avgCost: data.avgCost,
        successRate: data.successRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, [promptId, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
  };
}

/**
 * usePromptVersions Hook
 * Access prompt version history
 */
export function usePromptVersions(promptId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [versions, setVersions] = useState<
    Array<{
      version: string;
      createdAt: Date;
      isActive: boolean;
      changelog?: string;
    }>
  >([]);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const manager = getPromptManager();
      const v = await manager.getVersions(promptId);
      setVersions(v);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load versions'));
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const rollback = useCallback(
    async (version: string): Promise<void> => {
      try {
        const manager = getPromptManager();
        await manager.rollback(promptId, version);
        await loadVersions();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to rollback'));
        throw err;
      }
    },
    [promptId, loadVersions]
  );

  return {
    versions,
    loading,
    error,
    rollback,
    refresh: loadVersions,
  };
}

/**
 * PromptProvider Props
 */
interface PromptProviderProps {
  config: {
    workspace: string;
    defaultProvider?: string;
    defaultModel?: string;
  };
  children: React.ReactNode;
}

/**
 * PromptProvider Component
 * Initializes the prompt manager for the application
 */
export function PromptProvider({ config, children }: PromptProviderProps) {
  useEffect(() => {
    initPromptManager(config);
  }, [config]);

  return <>{children}</>;
}
