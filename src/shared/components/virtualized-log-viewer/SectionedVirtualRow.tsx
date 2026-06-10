import React from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { FoldIndicatorLine, SectionHeaderButton } from './section-log-ui';
import type { LogDisplayRow } from './types';

const virtualRowStyle = (start: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  transform: `translateY(${start}px)`,
});

type SectionedVirtualRowProps = {
  virtualIndex: number;
  start: number;
  row: LogDisplayRow;
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement'];
  isLineHighlighted: (lineNumber: number) => boolean;
  onToggleSection: (sectionIndex: number) => void;
  renderLogLine: (flatLineIndex: number) => React.ReactNode;
};

export const SectionedVirtualRow: React.FC<SectionedVirtualRowProps> = ({
  virtualIndex,
  start,
  row,
  measureElement,
  isLineHighlighted,
  onToggleSection,
  renderLogLine,
}) => {
  const rowClassName = `pf-v5-c-log-viewer__list-item${
    row.kind === 'content' && isLineHighlighted(row.globalLineNumber)
      ? ' log-content__line--highlighted'
      : ''
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
        <SectionHeaderButton row={row} onToggle={() => onToggleSection(row.sectionIndex)} />
      </div>
    );
  }

  if (row.kind === 'fold-indicator') {
    return (
      <div {...rowProps}>
        <FoldIndicatorLine lineCount={row.lineCount} />
      </div>
    );
  }

  return <div {...rowProps}>{renderLogLine(row.flatLineIndex)}</div>;
};
