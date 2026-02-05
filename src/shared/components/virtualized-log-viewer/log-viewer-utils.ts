import Prism from './prism-log-language';
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
  const matches: MatchRange[] = [];
  for (const match of lineText.matchAll(regex)) {
    if (match.index !== undefined)
      matches.push({ start: match.index, end: match.index + match[0].length });
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
