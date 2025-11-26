/**
 * React Hooks for RANA
 * React-friendly hooks for using RANA in your components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  RanaClient,
  RanaChatRequest,
  RanaChatResponse,
  Message,
  LLMProvider,
  LLMModel,
  CostStats,
} from './types';

// ============================================================================
// useRanaChat Hook
// ============================================================================

export interface UseRanaChatOptions {
  provider?: LLMProvider;
  model?: LLMModel;
  temperature?: number;
  max_tokens?: number;
  optimize?: 'cost' | 'speed' | 'quality' | 'balanced';
  cache?: boolean;
  onSuccess?: (response: RanaChatResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseRanaChatReturn {
  chat: (messages: Message[] | string) => Promise<RanaChatResponse | null>;
  response: RanaChatResponse | null;
  loading: boolean;
  error: Error | null;
  cost: number;
  reset: () => void;
}

/**
 * Hook for making chat requests with RANA
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { chat, response, loading, error, cost } = useRanaChat(rana, {
 *     provider: 'anthropic',
 *     optimize: 'cost'
 *   });
 *
 *   const handleSend = async () => {
 *     await chat('Hello!');
 *   };
 *
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       {error && <Error message={error.message} />}
 *       {response && <div>{response.content}</div>}
 *       <p>Cost: ${cost.toFixed(4)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRanaChat(
  client: RanaClient,
  options: UseRanaChatOptions = {}
): UseRanaChatReturn {
  const [response, setResponse] = useState<RanaChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cost, setCost] = useState(0);

  const chat = useCallback(
    async (messages: Message[] | string) => {
      setLoading(true);
      setError(null);

      try {
        const normalizedMessages: Message[] =
          typeof messages === 'string'
            ? [{ role: 'user', content: messages }]
            : messages;

        const result = await client.chat({
          messages: normalizedMessages,
          provider: options.provider,
          model: options.model,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          optimize: options.optimize,
          cache: options.cache,
        });

        setResponse(result);
        setCost((prev) => prev + result.cost.total_cost);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.onError) {
          options.onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, options]
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setCost(0);
  }, []);

  return {
    chat,
    response,
    loading,
    error,
    cost,
    reset,
  };
}

// ============================================================================
// useRanaStream Hook
// ============================================================================

export interface UseRanaStreamReturn {
  stream: (messages: Message[] | string) => Promise<void>;
  content: string;
  loading: boolean;
  error: Error | null;
  done: boolean;
  reset: () => void;
}

/**
 * Hook for streaming chat responses with RANA
 *
 * @example
 * ```tsx
 * function StreamingChat() {
 *   const { stream, content, loading, done } = useRanaStream(rana);
 *
 *   const handleSend = async () => {
 *     await stream('Tell me a story');
 *   };
 *
 *   return (
 *     <div>
 *       <div>{content}</div>
 *       {loading && !done && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRanaStream(
  client: RanaClient,
  options: UseRanaChatOptions = {}
): UseRanaStreamReturn {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [done, setDone] = useState(false);

  const stream = useCallback(
    async (messages: Message[] | string) => {
      setLoading(true);
      setError(null);
      setContent('');
      setDone(false);

      try {
        const normalizedMessages: Message[] =
          typeof messages === 'string'
            ? [{ role: 'user', content: messages }]
            : messages;

        for await (const chunk of client.stream({
          messages: normalizedMessages,
          provider: options.provider,
          model: options.model,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          optimize: options.optimize,
        })) {
          setContent((prev) => prev + chunk.delta);
          if (chunk.done) {
            setDone(true);
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [client, options]
  );

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setDone(false);
  }, []);

  return {
    stream,
    content,
    loading,
    error,
    done,
    reset,
  };
}

// ============================================================================
// useRanaCost Hook
// ============================================================================

export interface UseRanaCostReturn {
  stats: CostStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for tracking RANA costs
 *
 * @example
 * ```tsx
 * function CostDashboard() {
 *   const { stats, loading, refresh } = useRanaCost(rana);
 *
 *   if (loading) return <Spinner />;
 *   if (!stats) return null;
 *
 *   return (
 *     <div>
 *       <h2>Total Spent: ${stats.total_spent.toFixed(2)}</h2>
 *       <h3>Saved: ${stats.total_saved.toFixed(2)} ({stats.savings_percentage.toFixed(0)}%)</h3>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRanaCost(client: RanaClient): UseRanaCostReturn {
  const [stats, setStats] = useState<CostStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const costStats = await client.cost.stats();
      setStats(costStats);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    refresh,
  };
}

// ============================================================================
// useRanaOptimize Hook
// ============================================================================

export interface UseRanaOptimizeReturn {
  savings: {
    total: number;
    percentage: number;
  };
  recommendations: string[];
}

/**
 * Hook for getting optimization recommendations
 *
 * @example
 * ```tsx
 * function OptimizationPanel() {
 *   const { savings, recommendations } = useRanaOptimize(rana);
 *
 *   return (
 *     <div>
 *       <h3>Potential Savings: ${savings.total} ({savings.percentage}%)</h3>
 *       <ul>
 *         {recommendations.map((rec, i) => (
 *           <li key={i}>{rec}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRanaOptimize(client: RanaClient): UseRanaOptimizeReturn {
  const [savings, setSavings] = useState({ total: 0, percentage: 0 });
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const stats = client.cost.stats();
    stats.then((s) => {
      setSavings({
        total: s.total_saved,
        percentage: s.savings_percentage,
      });

      const recs: string[] = [];

      if (s.cache_hit_rate < 0.3) {
        recs.push('Enable caching to save up to 40% on costs');
      }

      // Check if using expensive models
      const expensiveModels = s.breakdown.filter(
        (b) => b.model.includes('gpt-4') || b.model.includes('opus')
      );
      if (expensiveModels.length > 0) {
        recs.push(
          'Switch simple tasks to Gemini Flash or Claude Haiku to save 60%+'
        );
      }

      setRecommendations(recs);
    });
  }, [client]);

  return {
    savings,
    recommendations,
  };
}

// ============================================================================
// useRanaConversation Hook
// ============================================================================

export interface UseRanaConversationReturn {
  messages: Message[];
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing a conversation with RANA
 *
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const { messages, sendMessage, loading } = useRanaConversation(rana);
 *
 *   const handleSend = async (text: string) => {
 *     await sendMessage(text);
 *   };
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i} className={msg.role}>
 *           {msg.content}
 *         </div>
 *       ))}
 *       {loading && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRanaConversation(
  client: RanaClient,
  options: UseRanaChatOptions = {}
): UseRanaConversationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const response = await client.chat({
          messages: [...messages, userMessage],
          provider: options.provider,
          model: options.model,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          optimize: options.optimize,
        });

        const assistantMessage: Message = {
          role: 'assistant',
          content: response.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [client, messages, options]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    addMessage,
    sendMessage,
    clearConversation,
    loading,
    error,
  };
}
