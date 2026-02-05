import type Prism from './prism-log-language';

/** Represents a search match location in the log viewer */
export interface SearchedWord {
  /** Zero-based row index of the match */
  rowIndex: number;
  /** Match index within the row (1-based, following PatternFly convention) */
  matchIndex: number;
}

/** Tokenized line data with syntax-highlighted tokens and plain text */
export type TokenizedLine = {
  tokens: (string | Prism.Token)[];
  text: string;
} | null;

/** Range representing start and end positions of a match */
export type MatchRange = { start: number; end: number };
