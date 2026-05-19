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

// ── Sectioned log types ───────────────────────────────────────────────────────

/** A named step/container section of logs (e.g. one container in a pipeline task) */
export interface LogSection {
  readonly name: string;
  readonly data: string;
  /** True once the container has terminated; collapsed by default */
  readonly isCompleted?: boolean;
}

/** A section-header display row (clickable fold/unfold button) */
export type SectionHeaderRow = {
  readonly kind: 'section-header';
  readonly sectionName: string;
  readonly sectionIndex: number;
  readonly lineNumber: number;
  readonly lineCount: number;
  readonly isExpanded: boolean;
};

/** A content display row (one log line inside an expanded section) */
export type ContentRow = {
  readonly kind: 'content';
  readonly globalLineNumber: number;
  /** Index into the flat allLines array used for Prism tokenisation */
  readonly flatLineIndex: number;
  readonly sectionIndex: number;
};

/** A fold-indicator row shown when a section is collapsed */
export type FoldIndicatorRow = {
  readonly kind: 'fold-indicator';
  readonly sectionIndex: number;
  readonly lineCount: number;
};

/** Union of all display row types used by the sectioned log viewer */
export type LogDisplayRow = SectionHeaderRow | ContentRow | FoldIndicatorRow;
