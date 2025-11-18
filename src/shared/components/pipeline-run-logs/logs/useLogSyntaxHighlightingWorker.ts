/**
 * useLogSyntaxHighlightingWorker: Worker-based syntax highlighting for logs
 * Uses the generic Worker infrastructure for CPU-intensive highlighting
 */

import { useMemo } from 'react';
import { useWorkerTask } from '~/utils/worker/useWorkerTask';

interface SyntaxHighlightInput {
  lines: string[];
  batchSize?: number;
}

interface SyntaxHighlightResult {
  highlighted: string[];
}

/**
 * Highlight log data using Web Worker
 * @param data - Raw log data
 * @param enabled - Enable/disable syntax highlighting
 * @returns Object with highlighted data and error (if any)
 */
export function useLogSyntaxHighlightingWorker(
  data: string,
  enabled: boolean = true,
): { data: string; error: Error | null } {
  // Memoize input to avoid unnecessary worker calls
  const input = useMemo<SyntaxHighlightInput>(() => {
    if (!enabled || !data) {
      return { lines: [] };
    }
    const lines = data.split('\n');
    // eslint-disable-next-line no-console
    console.log('Creating worker input with', lines.length, 'lines');
    // eslint-disable-next-line no-console
    console.log('First line type:', typeof lines[0], 'value:', lines[0]?.substring(0, 50));
    // eslint-disable-next-line no-console
    console.log('Lines array:', lines.slice(0, 3).map(l => ({ type: typeof l, value: l?.substring(0, 30) })));
    return {
      lines,
      batchSize: 100,
    };
  }, [data, enabled]);

  const { data: result, isLoading, error } = useWorkerTask<SyntaxHighlightInput, SyntaxHighlightResult>({
    taskType: 'SYNTAX_HIGHLIGHT',
    input,
    enabled: enabled && data.length > 0,
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error('Syntax highlighting worker error:', err);
    },
  });

  // Return highlighted data or original data as fallback
  return useMemo(() => {
    if (!enabled || !data) {
      return { data, error: null };
    }

    // If error occurred, return original data with error
    if (error) {
      return { data, error };
    }

    // While loading or if no result yet, return original data
    if (isLoading || !result) {
      return { data, error: null };
    }

    return { data: result.highlighted.join('\n'), error: null };
  }, [enabled, data, result, isLoading, error]);
}
