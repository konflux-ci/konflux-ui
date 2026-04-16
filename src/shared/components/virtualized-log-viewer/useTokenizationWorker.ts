/**
 * Hook for managing tokenization workers
 *
 * Creates a pool of workers to tokenize monster lines in parallel without blocking the UI.
 * Falls back to main thread tokenization if Web Workers are not available.
 */

import React from 'react';
import type Prism from 'prismjs';

interface TokenizeRequest {
  id: string;
  text: string;
  lineIndex: number;
}

interface TokenizeResponse {
  id: string;
  lineIndex: number;
  tokens: (string | Prism.Token)[];
  text: string;
  error?: string;
}

type PendingRequest = {
  resolve: (response: TokenizeResponse) => void;
  reject: (error: Error) => void;
};

const MAX_WORKERS = 2; // Use 2 workers for parallel tokenization
const REQUEST_TIMEOUT = 115000; // 5 second timeout for tokenization

/**
 * Worker pool manager for tokenization
 */
class TokenizationWorkerPool {
  private workers: Worker[] = [];
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private workerSupported: boolean;

  constructor() {
    // Temporarily disable workers for debugging
    // TODO: Re-enable after fixing webpack config
    //this.workerSupported = false;
    
    //console.log('Workers temporarily disabled');

    
    this.workerSupported = typeof Worker !== 'undefined';

    if (this.workerSupported) {
      try {
        // Create worker pool
        for (let i = 0; i < MAX_WORKERS; i++) {
          const worker = new Worker(
            new URL('./tokenization.worker.ts', import.meta.url),
          );

          worker.onmessage = this.handleWorkerMessage.bind(this);
          worker.onerror = this.handleWorkerError.bind(this);

          this.workers.push(worker);
        }
      } catch (error) {
        // Worker creation failed, disable worker support
        console.warn('Failed to create tokenization workers:', error);
        this.workerSupported = false;
        this.workers = [];
      }
    }
    
  }

  private handleWorkerMessage(event: MessageEvent<TokenizeResponse>) {
    const { id } = event.data;
    const pending = this.pendingRequests.get(id);

    if (pending) {
      this.pendingRequests.delete(id);
      pending.resolve(event.data);
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);
    console.error('Worker error details:', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error,
    });
  }

  /**
   * Tokenize text using a worker
   */
  tokenize(text: string, lineIndex: number): Promise<TokenizeResponse> {
    if (!this.workerSupported || this.workers.length === 0) {
      return Promise.reject(new Error('Workers not available'));
    }

    const id = `tokenize-${this.requestCounter++}`;

    return new Promise((resolve, reject) => {
      // Set timeout for request
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Tokenization timeout'));
      }, REQUEST_TIMEOUT);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (response) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      // Send request to a worker (round-robin)
      const workerIndex = this.requestCounter % this.workers.length;
      const worker = this.workers[workerIndex];

      const request: TokenizeRequest = { id, text, lineIndex };
      worker.postMessage(request);
    });
  }

  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.pendingRequests.clear();
  }

  /**
   * Check if workers are supported and available
   */
  isAvailable(): boolean {
    return this.workerSupported && this.workers.length > 0;
  }
}

// Global worker pool instance
let workerPool: TokenizationWorkerPool | null = null;

function getWorkerPool(): TokenizationWorkerPool {
  if (!workerPool) {
    workerPool = new TokenizationWorkerPool();
  }
  return workerPool;
}

/**
 * Hook to use tokenization workers
 */
export function useTokenizationWorker() {
  const pool = React.useRef<TokenizationWorkerPool | null>(null);

  React.useEffect(() => {
    // Initialize worker pool on mount
    pool.current = getWorkerPool();

    // Cleanup on unmount
    return () => {
      // Don't terminate the global pool, as it may be used by other components
      pool.current = null;
    };
  }, []);

  const tokenizeWithWorker = React.useCallback(
    async (text: string, lineIndex: number): Promise<TokenizeResponse> => {
      if (!pool.current || !pool.current.isAvailable()) {
        throw new Error('Workers not available');
      }

      return pool.current.tokenize(text, lineIndex);
    },
    [],
  );

  return {
    tokenizeWithWorker,
    isWorkerAvailable: pool.current?.isAvailable() ?? false,
  };
}
