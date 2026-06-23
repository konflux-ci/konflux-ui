import React from 'react';
import { Button, Flex, FlexItem, Text } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import type { SectionHeaderRow } from './types';

import './SectionLogUI.scss';
import './VirtualizedLogContent.scss';

export const SectionHeaderButton: React.FC<{ row: SectionHeaderRow; onToggle: () => void }> = ({
  row,
  onToggle,
}) => (
  <Button
    variant="plain"
    className="pf-v5-u-p-0"
    style={{ pointerEvents: 'auto' }}
    onClick={onToggle}
    aria-expanded={row.isExpanded}
    data-test={`fold-header-${row.sectionName}`}
  >
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
      <FlexItem>
        {row.isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
      </FlexItem>
      <FlexItem className="pf-v5-c-log-viewer__text pf-v5-u-font-weight-bold">
        {row.sectionName}
      </FlexItem>
    </Flex>
  </Button>
);

export const FoldIndicatorLine: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <Text component="small" className="pf-v5-c-log-viewer__text log-content__fold-indicator">
    ··· {lineCount} {lineCount === 1 ? 'line' : 'lines'} hidden
  </Text>
);

export const StickySectionHeaderBar: React.FC<{
  row: SectionHeaderRow;
  pushUpOffset: number;
  itemSize: number;
  onToggle: () => void;
}> = ({ row, pushUpOffset, itemSize, onToggle }) => (
  <div
    className="log-content__sticky-header"
    style={{
      transform: `translateY(${pushUpOffset}px)`,
      height: `${itemSize}px`,
    }}
    data-test={`sticky-header-${row.sectionName}`}
  >
    <div className="log-content__gutter" style={{ height: `${itemSize}px` }}>
      {row.lineNumber}
    </div>
    <div
      className="log-content__row-content log-content__sticky-header-content pf-v5-c-log-viewer__list-item"
      style={{ height: `${itemSize}px` }}
    >
      <SectionHeaderButton row={row} onToggle={onToggle} />
    </div>
  </div>
);
