/**
 * useWorkerTask: Generic React Hook for executing CPU-intensive tasks in Web Workers
 *
 * Features:
 * - Automatic worker pool management
 * - Type-safe task execution
 * - Memoized results
 * - Automatic cleanup
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { WorkerPool } from './WorkerPool';

// Singleton worker pool instance
let workerPoolInstance: WorkerPool | null = null;

function getWorkerPool(): WorkerPool {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool(
      () => new Worker(
        /* webpackChunkName: "syntax-highlight-worker" */
        new URL('./syntax-highlight-worker.ts', import.meta.url),
        {
          // Note: No 'type: module' - Webpack generates classic script format (IIFE)
          name: 'syntax-highlight-worker',
        }
      ),
      navigator.hardwareConcurrency || 2,
    );
  }
  return workerPoolInstance;
}

interface UseWorkerTaskOptions<T, R> {
  taskType: string;
  input: T;
  enabled?: boolean;
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
}

interface UseWorkerTaskResult<R> {
  data: R | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Execute a task in the worker pool with automatic memoization
 *
 * @example
 * const { data, isLoading } = useWorkerTask({
 *   taskType: 'SYNTAX_HIGHLIGHT',
 *   input: { lines: logLines },
 *   enabled: syntaxHighlightEnabled,
 * });
 */
export function useWorkerTask<T = unknown, R = unknown>(
  options: UseWorkerTaskOptions<T, R>,
): UseWorkerTaskResult<R> {
  const { taskType, input, enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState<R | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortedRef = useRef(false);

  // Serialize input for stable dependency comparison, with error handling
  const inputSerialized = useMemo(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('Serializing input:', input);
      const serialized = JSON.stringify(input);
      // eslint-disable-next-line no-console
      console.log('Serialized result:', serialized.substring(0, 100));
      return serialized;
    } catch (err) {
      console.error('Failed to serialize worker input:', err);
      return '';
    }
  }, [input]);

  useEffect(() => {
    if (!enabled || !inputSerialized) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortedRef.current = false;
    setIsLoading(true);
    setError(null);

    const pool = getWorkerPool();
    let taskInput: T;

    try {
      taskInput = JSON.parse(inputSerialized) as T;
    } catch (err) {
      const parseError = new Error(`Failed to parse worker input: ${err}`);
      setError(parseError);
      setIsLoading(false);
      onError?.(parseError);
      return;
    }

    pool
      .execute<T, R>(taskType, taskInput)
      .then((result) => {
        if (!abortedRef.current) {
          setData(result);
          setIsLoading(false);
          onSuccess?.(result);
        }
      })
      .catch((err: Error) => {
        if (!abortedRef.current) {
          setError(err);
          setIsLoading(false);
          onError?.(err);
        }
      });

    return () => {
      abortedRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType, inputSerialized, enabled]);

  return { data, isLoading, error };
}

/**
 * Cleanup the worker pool (useful for testing or app shutdown)
 */
export function cleanupWorkerPool() {
  if (workerPoolInstance) {
    workerPoolInstance.terminate();
    workerPoolInstance = null;
  }
}
