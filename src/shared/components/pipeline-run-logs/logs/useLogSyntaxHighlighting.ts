import { useMemo } from 'react';
import Prism from './prismLogLanguage';

/**
 * ANSI color codes for terminal output
 * These are properly formatted escape sequences that PatternFly's ansiUp will recognize
 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',

  // Standard colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',

  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
};

/**
 * Map Prism token types to ANSI color codes
 */
const TOKEN_TO_ANSI: Record<string, string> = {
  // Timestamps and numbers
  'timestamp': ANSI.magenta,
  'number': ANSI.magenta,

  // Log levels (nested tokens)
  'log-level': '',  // Parent token, no color
  'error': ANSI.bold + ANSI.brightRed,
  'warning': ANSI.bold + ANSI.brightYellow,
  'info': ANSI.bold + ANSI.brightCyan,
  'debug': ANSI.gray,

  // Results
  'result': '',  // Parent token
  'success': ANSI.bold + ANSI.brightGreen,
  'failure': ANSI.bold + ANSI.brightRed,

  // Key-value pairs
  'key-value': '',  // Parent token
  'key': ANSI.brightCyan,
  'value': ANSI.yellow,

  // Strings and paths
  'string': ANSI.green,
  'path': ANSI.yellow,
  'url': ANSI.cyan,

  // Punctuation
  'punctuation': ANSI.gray,
};

/**
 * Recursively convert Prism tokens to ANSI-colored text
 */
function tokenToAnsi(token: string | Prism.Token): string {
  // Base case: plain string
  if (typeof token === 'string') {
    return token;
  }

  // Recursive case: process token content
  let content = '';
  if (Array.isArray(token.content)) {
    content = token.content.map(tokenToAnsi).join('');
  } else {
    content = tokenToAnsi(token.content);
  }

  // Get the token type (handle both string and array types)
  const tokenType = typeof token.type === 'string' ? token.type : token.type[0];
  const ansiCode = TOKEN_TO_ANSI[tokenType];

  // Apply ANSI color if defined
  if (ansiCode) {
    return ansiCode + content + ANSI.reset;
  }

  return content;
}

/**
 * Highlight a single line using Prism.js tokenization + ANSI output
 */
function highlightLine(line: string): string {
  if (!line.trim()) {
    return line;
  }

  try {
    // Use Prism to tokenize the line (this gives us accurate parsing)
    const tokens = Prism.tokenize(line, Prism.languages.applog);

    // Convert tokens to ANSI-colored text
    return tokens.map(tokenToAnsi).join('');
  } catch (error) {
    console.error('Error highlighting line:', error);
    return line;
  }
}

/**
 * Hook to apply syntax highlighting to log data using ANSI color codes
 *
 * RENDERING FLOW:
 * 1. Prism.tokenize() - Accurate lexical analysis (no regex overlaps)
 * 2. Convert tokens to ANSI codes - Add color escape sequences
 * 3. PatternFly LogViewer receives ANSI-coded strings
 * 4. Internal ansiUp.ansi_to_html() converts ANSI to HTML
 * 5. Rendered as colored text via dangerouslySetInnerHTML
 *
 * WHY ANSI instead of HTML:
 * - LogViewer only accepts string | string[], not ReactNode[]
 * - ansiUp is designed to process ANSI codes, not pass-through HTML
 * - Prism.tokenize() avoids regex overlap bugs (URLs being broken)
 *
 * @param data - Raw log data (newline-separated string)
 * @param enabled - Whether to enable syntax highlighting
 * @returns ANSI-colored log data (string)
 */
export const useLogSyntaxHighlighting = (
  data: string,
  enabled: boolean = true,
): string => {
  return useMemo(() => {
    if (!enabled || !data) {
      return data;
    }

    try {
      const lines = data.split('\n');
      const highlightedLines = lines.map(highlightLine);
      return highlightedLines.join('\n');
    } catch (error) {
      console.error('Syntax highlighting error:', error);
      return data;
    }
  }, [data, enabled]);
};
