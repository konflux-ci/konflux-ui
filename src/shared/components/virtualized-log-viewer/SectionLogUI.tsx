import React from 'react';
import { Button, Flex, FlexItem, Content, Label } from '@patternfly/react-core';
import {
  AngleDownIcon,
  AngleRightIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import { KUBEARCHIVE_LOG_TAIL_LINES } from '~/kubearchive/const';
import type { SectionHeaderRow } from './types';

import './SectionLogUI.scss';
import './VirtualizedLogContent.scss';

const TailedLogIndicator: React.FC<{ fullLogUrl: string }> = ({ fullLogUrl }) => (
  <Label
    color="blue"
    isCompact
    data-test="tailed-log-indicator"
    render={({ className, content }) => (
      <a
        href={fullLogUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-test="tailed-log-link"
      >
        {content}
      </a>
    )}
  >
    Showing last {KUBEARCHIVE_LOG_TAIL_LINES} lines, see full logs <ExternalLinkAltIcon />
  </Label>
);

export const SectionHeaderButton: React.FC<{ row: SectionHeaderRow; onToggle: () => void }> = ({
  row,
  onToggle,
}) => (
  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
    <FlexItem>
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
    </FlexItem>
    {row.fullLogUrl && (
      <FlexItem>
        <TailedLogIndicator fullLogUrl={row.fullLogUrl} />
      </FlexItem>
    )}
  </Flex>
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
  onToggle: () => void;
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
}> = ({ row, pushUpOffset, itemSize, onToggle, onLineClick }) => (
  <div
    className="log-content__sticky-header"
    style={{
      transform: `translateY(${pushUpOffset}px)`,
      height: `${itemSize}px`,
    }}
    data-test={`sticky-header-${row.sectionName}`}
  >
    <div
      className="log-content__gutter log-content__gutter--sticky"
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
    </div>
    <div
      className="log-content__row-content log-content__sticky-header-content pf-v6-c-log-viewer__list-item"
      style={{ height: `${itemSize}px` }}
    >
      <SectionHeaderButton row={row} onToggle={onToggle} />
    </div>
  </div>
);
