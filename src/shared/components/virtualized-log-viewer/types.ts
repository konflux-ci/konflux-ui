import type Prism from 'prismjs';

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

/** A section of log output from a single container or task step */
export interface LogSection {
  containerName: string;
  data: string;
  isCompleted?: boolean;
}

/** A LogSection whose data has been normalized (ANSI stripped, line endings unified, split into lines) */
export interface NormalizedLogSection {
  containerName: string;
  lines: string[];
  isCompleted?: boolean;
}

export type SectionHeaderRow = {
  readonly kind: 'section-header';
  readonly sectionName: string;
  readonly sectionIndex: number;
  readonly lineNumber: number;
  readonly lineCount: number;
  readonly isExpanded: boolean;
};

export type ContentRow = {
  readonly kind: 'content';
  readonly globalLineNumber: number;
  readonly flatLineIndex: number;
  readonly sectionIndex: number;
};

export type FoldIndicatorRow = {
  readonly kind: 'fold-indicator';
  readonly sectionIndex: number;
  readonly lineCount: number;
};

export type LogDisplayRow = SectionHeaderRow | ContentRow | FoldIndicatorRow;
