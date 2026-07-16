import React from 'react';
import {
  Button,
  Content,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem,
  Icon,
  Tooltip,
} from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
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
      {row.error && (
        <FlexItem>
          <Tooltip content={row.error}>
            <Icon
              status="danger"
              data-test={`fold-header-error-${row.sectionName}`}
              aria-label={`Failed to fetch logs for this step: ${row.error}`}
            >
              <ExclamationCircleIcon aria-hidden />
            </Icon>
          </Tooltip>
        </FlexItem>
      )}
    </Flex>
  </Button>
);

export const FoldIndicatorLine: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <Content component="small" className="pf-v6-c-log-viewer__text log-content__fold-indicator">
    ··· {lineCount} {lineCount === 1 ? 'line' : 'lines'} hidden
  </Content>
);

export const SectionErrorLine: React.FC<{ error: string }> = ({ error }) => (
  <HelperText data-test="section-error-line">
    <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
      Failed to fetch logs for this step: {error}
    </HelperTextItem>
  </HelperText>
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
