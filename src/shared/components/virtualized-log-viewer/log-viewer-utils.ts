import Prism from 'prismjs';
import { logger } from '~/monitoring/logger';
import type { MatchRange } from './types';

/** Recursively flattens nested Prism tokens into plain text */
export function flattenTokenText(token: string | Prism.Token): string {
  if (typeof token === 'string') return token;
  if (Array.isArray(token.content)) return token.content.map(flattenTokenText).join('');
  return flattenTokenText(token.content);
}

/** Finds all search pattern matches in a line and returns their positions */
export function getLineMatches(lineText: string, regex: RegExp | undefined): MatchRange[] {
  if (!regex) return [];

  // Prevent performance issues on extremely large lines
  // If line is too long, limit search to avoid hanging the browser
  const MAX_SEARCH_LENGTH = 100 * 1024; // 100KB
  const searchText =
    lineText.length > MAX_SEARCH_LENGTH ? lineText.substring(0, MAX_SEARCH_LENGTH) : lineText;

  const matches: MatchRange[] = [];
  try {
    for (const match of searchText.matchAll(regex)) {
      if (match.index !== undefined)
        matches.push({ start: match.index, end: match.index + match[0].length });
    }
  } catch (error) {
    // In case regex execution times out or fails on very long strings
    logger.warn('Search match failed', { error });
  }
  return matches;
}

/** Checks if a range overlaps with the currently selected search match */
export function isMatchCurrent(
  start: number,
  end: number,
  currentMatch: MatchRange | null,
): boolean {
  return currentMatch !== null && start < currentMatch.end && end > currentMatch.start;
}
