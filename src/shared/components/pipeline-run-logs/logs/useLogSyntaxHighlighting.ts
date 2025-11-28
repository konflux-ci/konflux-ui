import { useMemo, useRef } from 'react';
import Prism from './prismLogLanguage';

/**
 * Configuration constants
 */
const DEFAULT_MAX_LINES = 20000;
const CACHE_SIZE_LIMIT = 20000;

/**
 * Cache for highlighted lines to avoid re-processing
 */
const highlightCache = new Map<string, string>();

/**
 * ANSI color codes for terminal output
 * These are properly formatted escape sequences that PatternFly's ansiUp will recognize
 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
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
  timestamp: ANSI.magenta,
  number: ANSI.magenta,

  // Log levels (nested tokens)
  'log-level': '', // Parent token, no color
  error: ANSI.bold + ANSI.brightRed,
  warning: ANSI.bold + ANSI.brightYellow,
  info: ANSI.bold + ANSI.brightCyan,
  debug: ANSI.gray,

  // Results
  result: '', // Parent token
  success: ANSI.bold + ANSI.brightGreen,
  failure: ANSI.bold + ANSI.brightRed,

  // Key-value pairs
  'key-value': '', // Parent token
  key: ANSI.brightCyan,
  value: ANSI.yellow,

  // Strings and paths
  string: ANSI.green,
  path: ANSI.yellow,
  url: ANSI.cyan,

  // Punctuation
  punctuation: ANSI.gray,
};

/**
 * Recursively convert Prism tokens to ANSI-colored text
 */
function tokenToAnsi(token: string | Prism.Token): string {
  if (typeof token === 'string') {
    return token;
  }

  const content = Array.isArray(token.content)
    ? token.content.map(tokenToAnsi).join('')
    : tokenToAnsi(token.content);

  const tokenType = typeof token.type === 'string' ? token.type : token.type[0];
  const ansiCode = TOKEN_TO_ANSI[tokenType];

  return ansiCode ? ansiCode + content + ANSI.reset : content;
}

/**
 * Highlight a single line using Prism.js tokenization + ANSI output
 * Uses cache to avoid re-processing the same line
 */
function highlightLine(line: string): string {
  if (!line.trim()) {
    return line;
  }

  const cached = highlightCache.get(line);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const tokens = Prism.tokenize(line, Prism.languages.applog);
    const highlighted = tokens.map(tokenToAnsi).join('');

    if (highlightCache.size >= CACHE_SIZE_LIMIT) {
      highlightCache.clear();
    }
    highlightCache.set(line, highlighted);

    return highlighted;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error highlighting line:', error);
    return line;
  }
}

/**
 * Highlight lines up to a limit, leaving remaining lines unhighlighted
 */
function highlightLinesUpToLimit(lines: string[], limit: number): string[] {
  return lines.map((line, index) => (index < limit ? highlightLine(line) : line));
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
 * PERFORMANCE OPTIMIZATION:
 * - Incremental processing: only highlights new lines when data is appended
 * - Uses caching to avoid re-processing the same lines
 * - Limits highlighting to first N lines for large logs (performance)
 * - PatternFly LogViewer's built-in virtualization handles rendering performance
 * - Perfect for streaming logs (running tasks)
 *
 * @param data - Raw log data (newline-separated string)
 * @param maxLines - Maximum number of lines to highlight (default: 10000)
 * @returns ANSI-colored log data (string)
 */
export const useLogSyntaxHighlighting = (
  data: string,
  maxLines: number = DEFAULT_MAX_LINES,
): string => {
  const prevDataRef = useRef<string>('');
  const prevResultRef = useRef<string>('');
  const prevMaxLinesRef = useRef<number>(maxLines);

  return useMemo(() => {
    if (!data) {
      prevDataRef.current = '';
      prevResultRef.current = '';
      return data;
    }

    if (prevMaxLinesRef.current !== maxLines) {
      prevDataRef.current = '';
      prevResultRef.current = '';
      prevMaxLinesRef.current = maxLines;
    }

    try {
      // Incremental processing: detect if data is appended (streaming logs)
      if (prevDataRef.current && data.startsWith(prevDataRef.current)) {
        const newData = data.slice(prevDataRef.current.length);
        if (!newData) {
          return prevResultRef.current;
        }

        const existingLineCount = prevDataRef.current.split('\n').length;
        if (existingLineCount >= maxLines) {
          const result = prevResultRef.current + newData;
          prevDataRef.current = data;
          prevResultRef.current = result;
          return result;
        }

        const newLines = newData.split('\n');
        const remainingLines = maxLines - existingLineCount;
        const highlightedNewLines = highlightLinesUpToLimit(newLines, remainingLines);
        const result = prevResultRef.current + highlightedNewLines.join('\n');

        prevDataRef.current = data;
        prevResultRef.current = result;
        return result;
      }

      // Full processing: data was replaced or first run
      const lines = data.split('\n');
      const highlightedLines = highlightLinesUpToLimit(lines, maxLines);
      const result = highlightedLines.join('\n');

      prevDataRef.current = data;
      prevResultRef.current = result;
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Syntax highlighting error:', error);
      prevDataRef.current = '';
      prevResultRef.current = '';
      return data;
    }
  }, [data, maxLines]);
};
