import React from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { FoldIndicatorLine, SectionHeaderButton } from './SectionLogUI';
import type { LogDisplayRow } from './types';

import './LineNumberGutter.scss';
import './VirtualizedLogContent.scss';

/** Which slice of a row to render in the nowrap split layout. */
export type VirtualRowPart = 'full' | 'gutter' | 'content';

const virtualRowStyle = (
  start: number,
  rowPart: VirtualRowPart = 'full',
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${start}px`,
    left: 0,
  };

  switch (rowPart) {
    case 'gutter':
      return { ...baseStyle, right: 0 };
    case 'content':
      return { ...baseStyle, width: 'max-content', minWidth: '100%' };
    default:
      return {
        ...baseStyle,
        width: '100%',
        display: 'flex',
      };
  }
};

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
  rowPart?: VirtualRowPart;
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
  rowPart = 'full',
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
    style: virtualRowStyle(start, rowPart),
  };

  const rowContentProps = {
    row,
    onToggleSection,
    onDownloadFullLogs,
    onViewFullLogs,
    renderLogLine,
  };

  // Nowrap split layout: render only the gutter or content column.
  if (rowPart === 'gutter') {
    return <div {...rowProps}>{gutterCell}</div>;
  }

  if (rowPart === 'content') {
    return (
      <div {...rowProps} className={`${rowClassName} log-content__row-content`}>
        <RowContent {...rowContentProps} />
      </div>
    );
  }

  // Full row: gutter + content side by side (used in wrap mode).
  return (
    <div {...rowProps}>
      {gutterCell}
      <div className="log-content__row-content">
        <RowContent {...rowContentProps} />
      </div>
    </div>
  );
};
