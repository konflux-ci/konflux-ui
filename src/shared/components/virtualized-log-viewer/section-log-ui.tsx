import React from 'react';
import { Button, Flex, FlexItem, Text } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import type { SectionHeaderRow } from './types';

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
        {row.sectionName.toUpperCase()}
      </FlexItem>
    </Flex>
  </Button>
);

export const FoldIndicatorLine: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <Text
    component="small"
    className="pf-v5-c-log-viewer__text"
    style={{ fontStyle: 'italic', color: 'var(--pf-v5-global--disabled-color--100)' }}
  >
    ··· {lineCount} lines hidden
  </Text>
);

export const StickySectionHeaderBar: React.FC<{
  row: SectionHeaderRow;
  pushUpOffset: number;
  itemSize: number;
  onToggle: () => void;
}> = ({ row, pushUpOffset, itemSize, onToggle }) => (
  <Flex
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      pointerEvents: 'none',
      transform: `translateY(${pushUpOffset}px)`,
      height: `${itemSize}px`,
      background:
        'var(--pf-v5-c-log-viewer__main--BackgroundColor, var(--pf-v5-global--BackgroundColor--200))',
      boxShadow: 'var(--pf-v5-global--BoxShadow--sm)',
    }}
    data-test={`sticky-header-${row.sectionName}`}
  >
    <Flex
      className="line-number__gutter"
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentFlexEnd' }}
      style={{ position: 'relative', height: `${itemSize}px` }}
    >
      <FlexItem className="line-number__line-number pf-v5-u-pr-sm">{row.lineNumber}</FlexItem>
    </Flex>
    <Flex
      className="log-content__content-column pf-v5-c-log-viewer__list-item"
      flex={{ default: 'flex_1' }}
      alignItems={{ default: 'alignItemsCenter' }}
      style={{ minWidth: 0, height: `${itemSize}px` }}
    >
      <FlexItem>
        <SectionHeaderButton row={row} onToggle={onToggle} />
      </FlexItem>
    </Flex>
  </Flex>
);
