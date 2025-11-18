/**
 * Syntax Highlighting Worker
 * Dedicated worker for log syntax highlighting
 * Runs in a background thread to avoid blocking the UI
 */

import { WorkerTask, WorkerResult } from './WorkerPool';

// ANSI color codes
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
};

// Simple regex-based tokenizer (no Prism dependency)
const PATTERNS = {
  timestamp: /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/g,
  error: /\b(ERROR|ERR|FATAL|PANIC|CRITICAL)\b/gi,
  warning: /\b(WARN|WARNING)\b/gi,
  info: /\b(INFO|INFORMATION)\b/gi,
  debug: /\b(TRACE|DEBUG)\b/gi,
  success: /\b(PASSED|SUCCESS|SUCCESSFUL|OK)\b/gi,
  failure: /\b(FAILED|FAILURE|FAIL)\b/gi,
  url: /https?:\/\/[^\s<]+/g,
  string: /"(?:\\.|[^\\"\r\n])*"/g,
  number: /\b\d+\.?\d*\b/g,
};

const COLORS = {
  timestamp: ANSI.magenta,
  error: ANSI.bold + ANSI.brightRed,
  warning: ANSI.bold + ANSI.brightYellow,
  info: ANSI.bold + ANSI.brightCyan,
  debug: ANSI.gray,
  success: ANSI.bold + ANSI.brightGreen,
  failure: ANSI.bold + ANSI.brightRed,
  url: ANSI.cyan,
  string: ANSI.green,
  number: ANSI.magenta,
};

// Highlight a single line using regex matching
function highlightLine(line: string): string {
  if (!line.trim()) {
    return line;
  }

  try {
    // Track which parts of the string have been colored
    const matches: Array<{ start: number; end: number; color: string; text: string }> = [];

    // Find all matches for each pattern
    for (const [type, pattern] of Object.entries(PATTERNS)) {
      const color = COLORS[type as keyof typeof COLORS];
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(line)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          color,
          text: match[0],
        });
      }
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep the first one)
    const filteredMatches: typeof matches = [];
    let lastEnd = -1;
    for (const match of matches) {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    }

    // Build the highlighted string
    if (filteredMatches.length === 0) {
      return line;
    }

    let result = '';
    let lastPos = 0;

    for (const match of filteredMatches) {
      // Add unhighlighted text before this match
      result += line.substring(lastPos, match.start);
      // Add highlighted match
      result += match.color + match.text + ANSI.reset;
      lastPos = match.end;
    }

    // Add any remaining unhighlighted text
    result += line.substring(lastPos);

    return result;
  } catch (error) {
    // Return original line on error
    console.error('[Worker] Error highlighting line:', error);
    return line;
  }
}

// Task payload interface
interface SyntaxHighlightPayload {
  lines: string[];
  batchSize?: number;
}

// Task result interface
interface SyntaxHighlightResult {
  highlighted: string[];
}

// Message handler - using onmessage to replace any existing handlers
self.onmessage = async (event: MessageEvent) => {
  const task = event.data as WorkerTask;

  console.log('[Worker] Received task:', task.type, 'id:', task.id);

  // Only handle SYNTAX_HIGHLIGHT tasks
  if (task.type !== 'SYNTAX_HIGHLIGHT') {
    const result: WorkerResult = {
      type: 'ERROR',
      id: task.id,
      payload: null,
      error: `This worker only handles SYNTAX_HIGHLIGHT tasks, got: ${task.type}`,
    };
    self.postMessage(result);
    return;
  }

  try {
    const payload = task.payload as SyntaxHighlightPayload;
    const { lines, batchSize = 100 } = payload;

    console.log('[Worker] Processing', lines.length, 'lines');

    const highlighted: string[] = [];

    // Process in batches
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      highlighted.push(...batch.map(highlightLine));
    }

    const resultPayload: SyntaxHighlightResult = { highlighted };
    const result: WorkerResult = {
      type: 'SUCCESS',
      id: task.id,
      payload: resultPayload,
    };
    self.postMessage(result);
  } catch (error) {
    const result: WorkerResult = {
      type: 'ERROR',
      id: task.id,
      payload: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(result);
  }
};

// Export for TypeScript
export {};
