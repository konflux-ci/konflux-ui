/**
 * Web Worker for tokenizing monster log lines (>= 50KB)
 *
 * This worker offloads CPU-intensive Prism tokenization to a background thread,
 * preventing the main thread from blocking during heavy syntax highlighting.
 *
 * Benefits:
 * - Non-blocking: UI stays responsive while tokenizing large lines
 * - Parallel processing: Can tokenize multiple lines simultaneously
 * - Better UX: No freezing when scrolling through logs with monster lines
 */

// Disable Prism's built-in worker message handler
// @ts-ignore - Prism global configuration
self.Prism = { disableWorkerMessageHandler: true };

import type Prism from 'prismjs';
import { tokenizeLine } from './tokenize-core';

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

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { id, text, lineIndex } = event.data;

  try {
    // Reuse the same tokenization logic as main thread
    const result = tokenizeLine(text);

    // Send the result back to the main thread
    const response: TokenizeResponse = {
      id,
      lineIndex,
      tokens: result.tokens,
      text: result.text,
    };

    self.postMessage(response);
  } catch (error) {
    // Send error back to main thread
    const response: TokenizeResponse = {
      id,
      lineIndex,
      tokens: [],
      text,
      error: error instanceof Error ? error.message : 'Tokenization failed',
    };

    self.postMessage(response);
  }
};
