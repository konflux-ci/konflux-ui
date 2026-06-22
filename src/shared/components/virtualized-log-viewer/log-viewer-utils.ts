import Prism from 'prismjs';
import type { LogSection, MatchRange } from './types';

// ANSI escape code regex for removing color codes from terminal output
// ESC character (\u001b) is a control character but necessary for ANSI escape sequences
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g;

export const normalizeLineEndings = (value: string): string => value.replace(/\r\n?/g, '\n');

export const stripAnsiCodes = (value: string): string => value.replace(ANSI_ESCAPE_REGEX, '');

export const buildLines = (sections: LogSection[]): string[] => {
  const result: string[] = [];
  for (const section of sections) {
    if (section.containerName) {
      result.push(section.containerName);
    }
    if (section.data) {
      result.push(...stripAnsiCodes(normalizeLineEndings(section.data)).split('\n'));
    }
  }
  return result;
};

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
