import React from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { FoldIndicatorLine, SectionHeaderButton } from './SectionLogUI';
import type { LogDisplayRow } from './types';

import './LineNumberGutter.scss';
import './VirtualizedLogContent.scss';

const virtualRowStyle = (start: number): React.CSSProperties => ({
  position: 'absolute',
  top: `${start}px`,
  left: 0,
  width: '100%',
  display: 'flex',
});

function getRowLineNumber(row: LogDisplayRow): number | null {
  if (row.kind === 'section-header') return row.lineNumber;
  if (row.kind === 'content') return row.globalLineNumber;
  return null;
}

type RowContentProps = {
  row: LogDisplayRow;
  onToggleSection: (sectionIndex: number) => void;
  onDownloadFullLogs?: (sectionIndex: number) => Promise<void>;
  onViewFullLogs?: (sectionIndex: number) => void;
  renderLogLine: (flatLineIndex: number) => React.ReactNode;
};

/** Log text / section chrome without the line-number gutter. */
function RowContent({
  row,
  onToggleSection,
  onDownloadFullLogs,
  onViewFullLogs,
  renderLogLine,
}: RowContentProps) {
  if (row.kind === 'section-header') {
    return (
      <SectionHeaderButton
        row={row}
        onToggle={() => onToggleSection(row.sectionIndex)}
        onDownloadFullLogs={
          row.isTailed && onDownloadFullLogs ? () => onDownloadFullLogs(row.sectionIndex) : undefined
        }
        onViewFullLogs={
          row.isTailed && onViewFullLogs ? () => onViewFullLogs(row.sectionIndex) : undefined
        }
      />
    );
  }

  if (row.kind === 'fold-indicator') {
    return <FoldIndicatorLine lineCount={row.lineCount} />;
  }

  return renderLogLine(row.flatLineIndex);
}

type SectionedVirtualRowProps = {
  virtualIndex: number;
  start: number;
  row: LogDisplayRow;
  measureElement?: Virtualizer<HTMLDivElement, Element>['measureElement'];
  isLineHighlighted: (lineNumber: number) => boolean;
  onToggleSection: (sectionIndex: number) => void;
  onDownloadFullLogs?: (sectionIndex: number) => Promise<void>;
  onViewFullLogs?: (sectionIndex: number) => void;
  renderLogLine: (flatLineIndex: number) => React.ReactNode;
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
};

export const SectionedVirtualRow: React.FC<SectionedVirtualRowProps> = ({
  virtualIndex,
  start,
  row,
  measureElement,
  isLineHighlighted,
  onToggleSection,
  onDownloadFullLogs,
  onViewFullLogs,
  renderLogLine,
  onLineClick,
}) => {
  const lineNumber = getRowLineNumber(row);
  const isHighlighted = lineNumber !== null && isLineHighlighted(lineNumber);

  const rowClassName = `pf-v6-c-log-viewer__list-item${
    row.kind === 'content' && isLineHighlighted(row.globalLineNumber)
      ? ' log-content__line--highlighted'
      : ''
  }`;

  const gutterCell = (
    <div
      className={`log-content__gutter${isHighlighted ? ' log-content__gutter--highlighted' : ''}`}
    >
      {lineNumber !== null && (
        <a
          href={`#L${lineNumber}`}
          className="line-number__line-number"
          aria-label={`Jump to line ${lineNumber}`}
          data-line-number={lineNumber}
          onClick={(e) => {
            e.preventDefault();
            onLineClick(lineNumber, e);
          }}
        >
          {lineNumber}
        </a>
      )}
    </div>
  );

  const rowProps = {
    'data-index': virtualIndex,
    ref: measureElement,
    className: rowClassName,
    style: virtualRowStyle(start),
  };

  const rowContentProps = {
    row,
    onToggleSection,
    onDownloadFullLogs,
    onViewFullLogs,
    renderLogLine,
  };

  return (
    <div {...rowProps}>
      {gutterCell}
      <div className="log-content__row-content">
        <RowContent {...rowContentProps} />
      </div>
    </div>
  );
};
