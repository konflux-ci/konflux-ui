import React from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { FoldIndicatorLine, SectionHeaderButton } from './SectionLogUI';
import type { LogDisplayRow } from './types';

import './LineNumberGutter.scss';
import './VirtualizedLogContent.scss';

const virtualRowStyle = (start: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  transform: `translateY(${start}px)`,
});

function getRowLineNumber(row: LogDisplayRow): number | null {
  if (row.kind === 'section-header') return row.lineNumber;
  if (row.kind === 'content') return row.globalLineNumber;
  return null;
}

type SectionedVirtualRowProps = {
  virtualIndex: number;
  start: number;
  row: LogDisplayRow;
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement'];
  isLineHighlighted: (lineNumber: number) => boolean;
  onToggleSection: (sectionIndex: number) => void;
  onDownloadFullLogs?: (sectionIndex: number) => Promise<void>;
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

  if (row.kind === 'section-header') {
    return (
      <div {...rowProps}>
        {gutterCell}
        <div className="log-content__row-content">
          <SectionHeaderButton
            row={row}
            onToggle={() => onToggleSection(row.sectionIndex)}
            onDownloadFullLogs={
              row.isTailed && onDownloadFullLogs
                ? () => onDownloadFullLogs(row.sectionIndex)
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (row.kind === 'fold-indicator') {
    return (
      <div {...rowProps}>
        {gutterCell}
        <div className="log-content__row-content">
          <FoldIndicatorLine lineCount={row.lineCount} />
        </div>
      </div>
    );
  }

  return (
    <div {...rowProps}>
      {gutterCell}
      <div className="log-content__row-content">{renderLogLine(row.flatLineIndex)}</div>
    </div>
  );
};
