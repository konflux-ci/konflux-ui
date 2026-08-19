import React from 'react';
import { Button, Flex, FlexItem, Content } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import type { SectionHeaderRow } from './types';

import './SectionLogUI.scss';
import './VirtualizedLogContent.scss';

export const SectionHeaderButton: React.FC<{ row: SectionHeaderRow; onToggle: () => void }> = ({
  row,
  onToggle,
}) => (
  <Button
    variant="plain"
    className="pf-v6-u-p-0 log-content__section-header-btn"
    onClick={onToggle}
    aria-expanded={row.isExpanded}
    data-test={`fold-header-${row.sectionName}`}
  >
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
      <FlexItem>
        {row.isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
      </FlexItem>
      <FlexItem className="pf-v6-c-log-viewer__text pf-v6-u-font-weight-bold">
        {row.sectionName}
      </FlexItem>
    </Flex>
  </Button>
);

export const FoldIndicatorLine: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <Content component="small" className="pf-v6-c-log-viewer__text log-content__fold-indicator">
    ··· {lineCount} {lineCount === 1 ? 'line' : 'lines'} hidden
  </Content>
);

export const StickySectionHeaderBar: React.FC<{
  row: SectionHeaderRow;
  pushUpOffset: number;
  itemSize: number;
  listClientWidth: number;
  contentScrollLeft: number;
  onToggle: () => void;
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
}> = ({
  row,
  pushUpOffset,
  itemSize,
  listClientWidth,
  contentScrollLeft,
  onToggle,
  onLineClick,
}) => (
  <Flex
    direction={{ default: 'row' }}
    className="log-content__sticky-header"
    style={{
      transform: `translateY(${pushUpOffset}px)`,
      height: `${itemSize}px`,
      width: listClientWidth > 0 ? `${listClientWidth}px` : undefined,
    }}
    data-test={`sticky-header-${row.sectionName}`}
  >
    <FlexItem
      flex={{ default: 'flexNone' }}
      className="log-content__gutter-rail log-content__gutter--sticky"
      style={{ height: `${itemSize}px` }}
    >
      <a
        href={`#L${row.lineNumber}`}
        className="line-number__line-number"
        aria-label={`Jump to line ${row.lineNumber}`}
        data-line-number={row.lineNumber}
        onClick={(e) => {
          e.preventDefault();
          onLineClick(row.lineNumber, e);
        }}
      >
        {row.lineNumber}
      </a>
    </FlexItem>
    <FlexItem
      flex={{ default: 'flex_1' }}
      className="log-content__sticky-header-content"
      style={{ height: `${itemSize}px`, minWidth: 0, width: 0 }}
    >
      <div
        className="log-content__sticky-header-content-inner"
        style={{ transform: `translateX(-${contentScrollLeft}px)` }}
      >
        <SectionHeaderButton row={row} onToggle={onToggle} />
      </div>
    </FlexItem>
  </Flex>
);
