/**
 * React Hooks for RAG
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RAGPipeline, RAGResult, QueryOptions, Citation, StreamChunk } from '../types';

// Global pipeline instance
let globalPipeline: RAGPipeline | null = null;

/**
 * Initialize global RAG pipeline
 */
export function initRAGPipeline(pipeline: RAGPipeline): void {
  globalPipeline = pipeline;
}

/**
 * Get the global RAG pipeline
 */
export function getRAGPipeline(): RAGPipeline {
  if (!globalPipeline) {
    throw new Error('RAG pipeline not initialized. Call initRAGPipeline first.');
  }
  return globalPipeline;
}

/**
 * useRAG Hook
 * Execute RAG queries with loading states
 */
export function useRAG(pipeline?: RAGPipeline) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const activePipeline = pipeline || globalPipeline;

  const query = useCallback(
    async (q: string, options?: Omit<QueryOptions, 'query'>): Promise<RAGResult> => {
      if (!activePipeline) {
        throw new Error('RAG pipeline not initialized');
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await activePipeline.query({ query: q, ...options });
        setResult(res);
        return res;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Query failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [activePipeline]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    result,
    answer: result?.answer,
    citations: result?.citations,
    sources: result?.sources,
    metrics: result?.metrics,
    isLoading,
    error,
    reset,
  };
}

/**
 * useRAGStream Hook
 * Execute RAG queries with streaming
 */
export function useRAGStream(pipeline?: RAGPipeline) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [stage, setStage] = useState<string>('');
  const abortRef = useRef(false);

  const activePipeline = pipeline || globalPipeline;

  const queryStream = useCallback(
    async (q: string, options?: Omit<QueryOptions, 'query'>): Promise<void> => {
      if (!activePipeline?.queryStream) {
        throw new Error('Pipeline does not support streaming');
      }

      setIsStreaming(true);
      setChunks([]);
      setCitations([]);
      setError(null);
      abortRef.current = false;

      try {
        const stream = activePipeline.queryStream({ query: q, ...options });

        for await (const chunk of stream) {
          if (abortRef.current) break;

          switch (chunk.type) {
            case 'content':
              setChunks(prev => [...prev, chunk.data as string]);
              break;
            case 'citation':
              setCitations(prev => [...prev, chunk.data as Citation]);
              break;
            case 'metadata':
              if (typeof chunk.data === 'object' && chunk.data && 'stage' in chunk.data) {
                setStage((chunk.data as { stage: string }).stage);
              }
              break;
            case 'done':
              break;
          }
        }
      } catch (err) {
        if (!abortRef.current) {
          const error = err instanceof Error ? err : new Error('Stream failed');
          setError(error);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [activePipeline]
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setChunks([]);
    setCitations([]);
    setError(null);
    setIsStreaming(false);
    setStage('');
  }, []);

  return {
    queryStream,
    answer: chunks.join(''),
    chunks,
    citations,
    stage,
    isStreaming,
    error,
    stop,
    reset,
  };
}

/**
 * useRAGIndex Hook
 * Manage document indexing
 */
export function useRAGIndex(pipeline?: RAGPipeline) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [documentCount, setDocumentCount] = useState(0);

  const activePipeline = pipeline || globalPipeline;

  const index = useCallback(
    async (documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>): Promise<void> => {
      if (!activePipeline) {
        throw new Error('RAG pipeline not initialized');
      }

      setIsIndexing(true);
      setProgress(0);
      setError(null);

      try {
        // Index in batches for progress tracking
        const batchSize = 10;
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          await activePipeline.index(batch);
          setProgress(Math.min(100, ((i + batch.length) / documents.length) * 100));
        }

        setDocumentCount(documents.length);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Indexing failed');
        setError(error);
        throw error;
      } finally {
        setIsIndexing(false);
      }
    },
    [activePipeline]
  );

  const deleteDocuments = useCallback(
    async (ids: string[]): Promise<void> => {
      if (!activePipeline) {
        throw new Error('RAG pipeline not initialized');
      }

      try {
        await activePipeline.delete(ids);
        setDocumentCount(prev => Math.max(0, prev - ids.length));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Delete failed');
        setError(error);
        throw error;
      }
    },
    [activePipeline]
  );

  return {
    index,
    deleteDocuments,
    isIndexing,
    progress,
    documentCount,
    error,
  };
}

/**
 * RAGProvider Props
 */
interface RAGProviderProps {
  pipeline: RAGPipeline;
  children: React.ReactNode;
}

/**
 * RAGProvider Component
 * Initialize RAG pipeline for the application
 */
export function RAGProvider({ pipeline, children }: RAGProviderProps) {
  useEffect(() => {
    initRAGPipeline(pipeline);
  }, [pipeline]);

  return <>{children}</>;
}
