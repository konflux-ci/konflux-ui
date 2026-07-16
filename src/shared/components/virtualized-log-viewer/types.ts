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
  /**
   * Set when this section's log data failed to fetch (e.g. a network error for this
   * specific container/step). Any log data already received for the section is still
   * shown; this is surfaced as an indicator on the section's header rather than failing
   * the whole log viewer.
   */
  error?: string;
}

/** A LogSection whose data has been normalized (ANSI stripped, line endings unified, split into lines) */
export interface NormalizedLogSection {
  containerName: string;
  lines: string[];
  error?: string;
}

export type SectionHeaderRow = {
  readonly kind: 'section-header';
  readonly sectionName: string;
  readonly sectionIndex: number;
  readonly lineNumber: number;
  readonly lineCount: number;
  readonly isExpanded: boolean;
  readonly error?: string;
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

/** Renders the section's fetch error as a visible line in the log body (not just the header icon) */
export type SectionErrorRow = {
  readonly kind: 'section-error';
  readonly sectionIndex: number;
  readonly error: string;
};

export type LogDisplayRow = SectionHeaderRow | ContentRow | FoldIndicatorRow | SectionErrorRow;
