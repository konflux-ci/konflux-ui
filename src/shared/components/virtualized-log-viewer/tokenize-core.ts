/**
 * Core tokenization logic (pure function)
 * Can be used in both main thread and Web Worker
 */

import Prism from 'prismjs';
import registerLogSyntaxCore from './refractor-log-core';

// Register log language using the core version (no SCSS imports)
// This is safe for both main thread and Web Workers
registerLogSyntaxCore(Prism);

/** Recursively flattens nested Prism tokens into plain text */
function flattenTokenText(token: string | Prism.Token): string {
  if (typeof token === 'string') return token;
  if (Array.isArray(token.content)) return token.content.map(flattenTokenText).join('');
  return flattenTokenText(token.content);
}

export interface TokenizeResult {
  tokens: (string | Prism.Token)[];
  text: string;
}

/**
 * Tokenize a line of text using Prism
 * This is a pure function with no side effects
 */
export function tokenizeLine(text: string): TokenizeResult {
  if (!text) {
    return { tokens: [], text: '' };
  }

  try {
    const tokens = Prism.tokenize(text, Prism.languages.log);
    const flattenedText = tokens.map(flattenTokenText).join('');
    return { tokens, text: flattenedText };
  } catch (error) {
    // Fallback to plain text on error
    return { tokens: [], text };
  }
}
