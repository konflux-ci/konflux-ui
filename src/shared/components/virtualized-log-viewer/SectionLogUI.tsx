import React from 'react';
import { Button, Flex, FlexItem, Content, Label } from '@patternfly/react-core';
import {
  AngleDownIcon,
  AngleRightIcon,
  DownloadIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import { logger } from '~/monitoring/logger';
import type { SectionHeaderRow } from './types';

import './SectionLogUI.scss';
import './VirtualizedLogContent.scss';

export const SectionHeaderButton: React.FC<{
  row: SectionHeaderRow;
  onToggle: () => void;
  onDownloadFullLogs?: () => Promise<void>;
}> = ({ row, onToggle, onDownloadFullLogs }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDownloadFullLogs || isDownloading) return;
    setIsDownloading(true);
    void onDownloadFullLogs()
      .catch((err: unknown) => {
        logger.warn('Failed to download full logs', {
          error: err instanceof Error ? err.message : '',
        });
      })
      .finally(() => setIsDownloading(false));
  };

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
      <FlexItem>
        <Button
          variant="plain"
          className="pf-v6-u-p-0 log-content__section-header-btn"
          onClick={onToggle}
          aria-expanded={row.isExpanded}
          data-test={`fold-header-${row.sectionName}`}
        >
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsXs' }}
          >
            <FlexItem>
              {row.isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
            </FlexItem>
            <FlexItem className="pf-v6-c-log-viewer__text pf-v6-u-font-weight-bold">
              {row.sectionName}
            </FlexItem>
          </Flex>
        </Button>
      </FlexItem>
      {row.isTailed && (
        <>
          <FlexItem>
            <Label isCompact>showing last {row.lineCount} lines</Label>
          </FlexItem>
          {onDownloadFullLogs && (
            <FlexItem>
              <Button
                variant="link"
                isInline
                isDisabled={isDownloading}
                isLoading={isDownloading}
                onClick={handleDownload}
                data-test={`download-full-logs-${row.sectionName}`}
              >
                {!isDownloading && <DownloadIcon className="pf-v6-u-mr-xs" />}
                Download full logs
              </Button>
            </FlexItem>
          )}
        </>
      )}
    </Flex>
  );
};

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
  onDownloadFullLogs?: () => Promise<void>;
}> = ({ row, pushUpOffset, itemSize, onToggle, onLineClick, onDownloadFullLogs }) => (
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
      <SectionHeaderButton row={row} onToggle={onToggle} onDownloadFullLogs={onDownloadFullLogs} />
    </div>
  </div>
);
