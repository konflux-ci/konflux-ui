import React from 'react';

// Maximum characters per virtual sub-line (10KB)
// Large lines will be split into chunks of this size
const SUBLINE_CHUNK_SIZE = 10 * 1024;

// Threshold for splitting lines (50KB)
// Lines smaller than this remain as single lines
const SPLIT_THRESHOLD = 50 * 1024;

// Threshold for attempting JSON formatting (10KB)
// Lines larger than this will be checked if they're compressed JSON
const JSON_FORMAT_THRESHOLD = 10 * 1024;

export interface VirtualLine {
  /** Original line index in the source data */
  originalLineIndex: number;
  /** Sub-line index (0 for first chunk, 1 for second, etc.) */
  subLineIndex: number;
  /** Total number of sub-lines for this original line */
  totalSubLines: number;
  /** Start position in the original line */
  startPos: number;
  /** End position in the original line */
  endPos: number;
  /** The text content of this virtual line */
  text: string;
  /** Whether this is part of a split line */
  isSplit: boolean;
  /** Whether this line was auto-formatted from JSON */
  isFormatted?: boolean;
}

/**
 * Calculates the display line number for a virtual line
 *
 * For formatted JSON lines: shows continuous numbering (line 2 -> 2, 3, 4, 5...)
 * For chunked text lines: uses original line number
 * For normal lines: uses original line number
 */
export function getDisplayLineNumber(
  virtualLineInfo: VirtualLine | null,
  fallbackIndex: number,
): number {
  if (!virtualLineInfo) return fallbackIndex + 1;

  // For formatted JSON, show continuous line numbers starting from original line
  if (virtualLineInfo.isSplit && virtualLineInfo.isFormatted) {
    return virtualLineInfo.originalLineIndex + 1 + virtualLineInfo.subLineIndex;
  }

  // For all other cases (normal lines, chunked text), use original line number
  return virtualLineInfo.originalLineIndex + 1;
}

/**
 * Detects if a line is likely compressed JSON
 * Checks first/last chars and looks for JSON patterns
 */
function isLikelyCompressedJSON(line: string, length: number): boolean {
  if (length < JSON_FORMAT_THRESHOLD) return false;

  const trimmed = line.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  // Check if starts/ends with JSON delimiters
  const looksLikeJSON = (first === '{' && last === '}') || (first === '[' && last === ']');

  if (!looksLikeJSON) return false;

  // Quick validation: check for JSON patterns in first 1KB
  const sample = trimmed.substring(0, 1024);
  const hasJSONPatterns = sample.includes('":') || sample.includes('","');

  return hasJSONPatterns;
}

/**
 * Attempts to parse and format JSON with error handling
 * Returns formatted lines or null if parsing fails
 */
function tryFormatJSON(line: string): string[] | null {
  try {
    // Parse JSON
    const parsed = JSON.parse(line);

    // Format with 2-space indentation
    const formatted = JSON.stringify(parsed, null, 2);

    // Split into lines
    return formatted.split('\n');
  } catch (error) {
    // Not valid JSON or parsing failed
    return null;
  }
}

/**
 * Hook to handle very large lines by splitting them into virtual sub-lines
 * This integrates with vertical virtualization to only render visible sub-lines
 *
 * Example: 800MB compressed JSON → auto-formatted into thousands of normal lines
 * Example: 800MB plain text → 80,000 virtual sub-lines of 10KB each
 * Only ~20 visible sub-lines are rendered at any time
 */
export function useLargeLineHandler(lines: string[]) {
  const virtualLines = React.useMemo(() => {
    const result: VirtualLine[] = [];

    lines.forEach((line, originalLineIndex) => {
      const lineLength = line.length;

      // Small lines: keep as-is (no splitting)
      if (lineLength <= SPLIT_THRESHOLD) {
        result.push({
          originalLineIndex,
          subLineIndex: 0,
          totalSubLines: 1,
          startPos: 0,
          endPos: lineLength,
          text: line,
          isSplit: false,
        });
        return;
      }

      // Large lines: check if it's compressed JSON
      if (isLikelyCompressedJSON(line, lineLength)) {
        const formattedLines = tryFormatJSON(line);

        if (formattedLines) {
          // Successfully formatted JSON - add each line as a virtual line
          formattedLines.forEach((formattedLine, index) => {
            result.push({
              originalLineIndex,
              subLineIndex: index,
              totalSubLines: formattedLines.length,
              startPos: 0, // Position doesn't apply to formatted lines
              endPos: formattedLine.length,
              text: formattedLine,
              isSplit: true,
              isFormatted: true,
            });
          });
          return;
        }
        // If JSON parsing failed, fall through to chunking
      }

      // Large non-JSON lines (or JSON parsing failed): split into chunks
      const totalSubLines = Math.ceil(lineLength / SUBLINE_CHUNK_SIZE);

      for (let subLineIndex = 0; subLineIndex < totalSubLines; subLineIndex++) {
        const startPos = subLineIndex * SUBLINE_CHUNK_SIZE;
        const endPos = Math.min(startPos + SUBLINE_CHUNK_SIZE, lineLength);

        result.push({
          originalLineIndex,
          subLineIndex,
          totalSubLines,
          startPos,
          endPos,
          text: line.substring(startPos, endPos),
          isSplit: true,
          isFormatted: false,
        });
      }
    });

    return result;
  }, [lines]);

  /**
   * Map virtual line index back to original line info
   */
  const getOriginalLineInfo = React.useCallback(
    (virtualLineIndex: number) => {
      return virtualLines[virtualLineIndex] ?? null;
    },
    [virtualLines],
  );

  /**
   * Map original line index to the range of virtual line indices
   * Returns the first virtual line index for this original line
   *
   * For example:
   * - Original line 0 (normal) -> virtual line 0
   * - Original line 1 (formatted into 100 lines) -> virtual line 1 (first sub-line)
   * - Original line 2 (normal) -> virtual line 101
   */
  const getVirtualLineIndexForOriginalLine = React.useCallback(
    (originalLineIndex: number): number => {
      // Find the first virtual line that corresponds to this original line
      const foundIndex = virtualLines.findIndex((vl) => vl.originalLineIndex === originalLineIndex);
      return foundIndex >= 0 ? foundIndex : originalLineIndex;
    },
    [virtualLines],
  );

  return {
    virtualLines,
    getOriginalLineInfo,
    getVirtualLineIndexForOriginalLine,
  };
}
