import React from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { FoldIndicatorLine, SectionHeaderButton } from './SectionLogUI';
import type { LogDisplayRow } from './types';

import './LineNumberGutter.scss';
import './VirtualizedLogContent.scss';

const virtualRowStyle = (start: number): React.CSSProperties => ({
  position: 'absolute',
  top: start,
  left: 0,
  width: '100%',
  display: 'flex',
});

function getRowLineNumber(row: LogDisplayRow): number | null {
  if (row.kind === 'section-header') return row.lineNumber;
  if (row.kind === 'content') return row.globalLineNumber;
  return null;
}

type VirtualGutterCellProps = {
  start: number;
  size: number;
  row: LogDisplayRow;
  isLineHighlighted: (lineNumber: number) => boolean;
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
};

export const VirtualGutterCell: React.FC<VirtualGutterCellProps> = ({
  start,
  size,
  row,
  isLineHighlighted,
  onLineClick,
}) => {
  const lineNumber = getRowLineNumber(row);
  const isHighlighted = lineNumber !== null && isLineHighlighted(lineNumber);

  return (
    <div
      className={`log-content__gutter${isHighlighted ? ' log-content__gutter--highlighted' : ''}`}
      style={{ top: start, height: size }}
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
};

type SectionedVirtualRowProps = {
  virtualIndex: number;
  start: number;
  row: LogDisplayRow;
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement'];
  isLineHighlighted: (lineNumber: number) => boolean;
  onToggleSection: (sectionIndex: number) => void;
  onDownloadFullLogs?: (sectionIndex: number) => Promise<void>;
  onViewFullLogs?: (sectionIndex: number) => void;
  renderLogLine: (flatLineIndex: number) => React.ReactNode;
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
}) => {
  const lineNumber = getRowLineNumber(row);
  const isHighlighted = lineNumber !== null && isLineHighlighted(lineNumber);

  const rowClassName = `pf-v6-c-log-viewer__list-item${
    isHighlighted ? ' log-content__line--highlighted' : ''
  }`;

  const rowProps = {
    'data-index': virtualIndex,
    ref: measureElement,
    className: rowClassName,
    style: virtualRowStyle(start),
  };

  if (row.kind === 'section-header') {
    return (
      <div {...rowProps}>
        <div className="log-content__row-content">
          <SectionHeaderButton
            row={row}
            onToggle={() => onToggleSection(row.sectionIndex)}
            onDownloadFullLogs={
              row.isTailed && onDownloadFullLogs
                ? () => onDownloadFullLogs(row.sectionIndex)
                : undefined
            }
            onViewFullLogs={
              row.isTailed && onViewFullLogs ? () => onViewFullLogs(row.sectionIndex) : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (row.kind === 'fold-indicator') {
    return (
      <div {...rowProps}>
        <div className="log-content__row-content">
          <FoldIndicatorLine lineCount={row.lineCount} />
        </div>
      </div>
    );
  }

  return (
    <div {...rowProps}>
      <div className="log-content__row-content">{renderLogLine(row.flatLineIndex)}</div>
    </div>
  );
};
