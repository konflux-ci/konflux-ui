import React from 'react';
import {
  Alert,
  Banner,
  Button,
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  Popover,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Truncate,
} from '@patternfly/react-core';
import { CompressIcon } from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import { DownloadIcon } from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { ExpandIcon } from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import { OutlinedKeyboardIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-keyboard-icon';
import { OutlinedPlayCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-play-circle-icon';
import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { logger } from '~/monitoring/logger';
import {
  KeyboardShortcutHint,
  type ShortcutEntry,
} from '~/shared/components/keyboard-shortcut-hint';
import { useAutoScrollWithResume } from '~/shared/components/pipeline-run-logs/logs/useAutoScrollWithResume';
import { LoadingInline } from '~/shared/components/status-box/StatusBox';
import {
  type LogSection,
  type NormalizedLogSection,
  type VirtualizedLogContentImperativeHandleMethods,
  normalizeSection,
  useLineNumberNavigation,
  VirtualizedLogContent,
} from '~/shared/components/virtualized-log-viewer';
import { useContainerHeight } from '~/shared/hooks';
import { useFullscreen } from '~/shared/hooks/fullscreen';
import { TaskRunKind } from '~/types';
import { useLogSearch } from '../useLogSearch';
import LogsTaskDuration from './LogsTaskDuration';
import { useLogViewerTheme } from './useLogViewerTheme';

import '@patternfly/react-log-viewer/dist/css/log-viewer.css';

import './LogViewer.scss';

const LOG_VIEWER_SHORTCUTS: ShortcutEntry[] = [
  { keys: 'Arrow Up', macKeys: 'Arrow Up', description: 'Scroll up one line' },
  { keys: 'Arrow Down', macKeys: 'Arrow Down', description: 'Scroll down one line' },
  { keys: 'PageUp', macKeys: 'Fn + Arrow Up', description: 'Scroll up one page' },
  { keys: 'PageDown', macKeys: 'Fn + Arrow Down', description: 'Scroll down one page' },
  { keys: 'Home', macKeys: 'Fn + Arrow Left', description: 'Scroll to top' },
  { keys: 'End', macKeys: 'Fn + Arrow Right', description: 'Scroll to bottom' },
];

export type Props = {
  showSearch?: boolean;
  sections?: LogSection[];
  normalizedSections?: NormalizedLogSection[];
  allowAutoScroll?: boolean;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  onDownloadFullLogs?: (sectionIndex: number) => Promise<void>;
  onViewFullLogs?: (sectionIndex: number) => void;
  taskRun: TaskRunKind | null;
  isLoading: boolean;
  errorMessage: string | null;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  enableLineNavigation?: boolean;
  allowExpandAllSections?: boolean;
};

const LogViewer: React.FC<Props> = ({
  showSearch = true,
  allowAutoScroll,
  sections,
  normalizedSections: normalizedSectionsProp,
  downloadAllLabel = 'Download all task logs',
  onDownloadAll,
  onDownloadFullLogs,
  onViewFullLogs,
  taskRun,
  isLoading,
  errorMessage,
  onScroll: onScrollProp,
  enableLineNavigation = true,
  allowExpandAllSections = false,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const [logTheme, setLogTheme] = useLogViewerTheme();
  const themeCheckboxId = React.useId();

  const normalizedSections = React.useMemo(
    () => normalizedSectionsProp ?? sections?.map(normalizeSection) ?? [],
    [normalizedSectionsProp, sections],
  );

  const lineNumberNavigationProps = useLineNumberNavigation();

  const { autoScroll, showResumeStreamButton, handleScroll, handleResumeClick } =
    useAutoScrollWithResume({
      allowAutoScroll,
      activeLineTarget: enableLineNavigation ? lineNumberNavigationProps.highlightedLines : null,
      onScroll: onScrollProp,
    });

  const [isFullscreen, fullscreenRef, fullscreenToggle, isFullscreenSupported] =
    useFullscreen<HTMLDivElement>();

  const downloadData = React.useMemo(() => {
    return normalizedSections
      .map((s) =>
        s.containerName ? `${s.containerName}\n${s.lines.join('\n')}` : s.lines.join('\n'),
      )
      .join('\n\n');
  }, [normalizedSections]);

  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false);

  const downloadLogs = () => {
    if (!downloadData) return;
    const blob = new Blob([downloadData], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName || `task-run-${uuidv4()}`}.log`);
  };

  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll?.()
      .then(() => {
        setDownloadAllStatus(false);
      })
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        logger.warn(err.message || 'Error downloading logs.');
      });
  };

  // Use containerRef to measure actual height for VirtualizedLogViewer
  const { containerRef, containerHeight } = useContainerHeight();

  const allLines = React.useMemo(
    () => normalizedSections.flatMap((s) => s.lines),
    [normalizedSections],
  );
  const {
    scrollToRow: searchScrollToRow,
    searchText,
    setSearchText,
    currentMatch,
    matchCount,
    currentMatchIndex,
    nextMatch,
    prevMatch,
  } = useLogSearch(allLines);

  const scrollToRow = searchScrollToRow || (autoScroll ? allLines.length : 0);

  const childRef = React.useRef<VirtualizedLogContentImperativeHandleMethods | null>(null);

  const handleOnToggleAllSections = () => {
    childRef?.current?.toggleAllSections();
  };

  return (
    <div
      ref={fullscreenRef}
      style={{ height: isFullscreen ? '100vh' : '100%' }}
      className={classNames('log-viewer__container', 'pf-v6-c-log-viewer', {
        'pf-m-dark': logTheme === 'dark',
        'log-viewer--light': logTheme === 'light',
      })}
    >
      {/* Toolbar */}
      <div className="pf-v6-c-log-viewer__header">
        <Toolbar>
          <ToolbarContent
            className={classNames({
              'log-viewer--fullscreen': isFullscreen,
            })}
            alignItems="center"
          >
            <ToolbarGroup>
              <ToolbarItem className="log-viewer__toolbar-item--padded">
                <FeatureFlagIndicator flags={['kubearchive-logs', 'taskruns-kubearchive']} />
              </ToolbarItem>
            </ToolbarGroup>
            {showSearch && (
              <ToolbarGroup>
                <ToolbarItem>
                  <SearchInput
                    key={allLines.length > 0 ? 'logs-ready' : 'logs-empty'}
                    value={searchText}
                    onChange={(_event, value) => setSearchText(value)}
                    resultsCount={
                      matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : undefined
                    }
                    onNextClick={nextMatch}
                    onPreviousClick={prevMatch}
                    onClear={() => setSearchText('')}
                    placeholder="Search"
                    name="logViewerSearchInput"
                    aria-label="Search logs"
                  />
                </ToolbarItem>
              </ToolbarGroup>
            )}
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              {!!allowExpandAllSections && (
                <ToolbarItem>
                  <Button
                    variant="link"
                    aria-label="Expand/Collapse all"
                    onClick={handleOnToggleAllSections}
                  >
                    Expand/Collapse all
                  </Button>
                </ToolbarItem>
              )}
              <ToolbarItem>
                <Checkbox
                  id={themeCheckboxId}
                  label="Dark theme"
                  checked={logTheme === 'dark'}
                  onClick={() => setLogTheme(logTheme === 'dark' ? 'light' : 'dark')}
                />
              </ToolbarItem>
              <ToolbarItem variant="separator" className="log-viewer__divider" />
              <ToolbarItem>
                <Dropdown
                  isOpen={isDownloadOpen}
                  onSelect={() => setIsDownloadOpen(false)}
                  onOpenChange={setIsDownloadOpen}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="plain"
                      onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                      isExpanded={isDownloadOpen}
                      aria-label="Download logs"
                      data-test="download-logs-toggle"
                    >
                      <DownloadIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem key="download" onClick={downloadLogs} data-test="download-log">
                      Download
                    </DropdownItem>
                    {onDownloadAll && (
                      <DropdownItem
                        key="download-all"
                        onClick={startDownloadAll}
                        isDisabled={downloadAllStatus}
                        data-test="download-all-logs"
                      >
                        <span className="log-viewer__download-all-label">
                          {downloadAllLabel}
                          {downloadAllStatus && <LoadingInline />}
                        </span>
                      </DropdownItem>
                    )}
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
              {fullscreenToggle && isFullscreenSupported && (
                <>
                  <ToolbarItem variant="separator" className="log-viewer__divider" />
                  <ToolbarItem>
                    <Button
                      icon={isFullscreen ? <CompressIcon /> : <ExpandIcon />}
                      variant="plain"
                      onClick={fullscreenToggle}
                      aria-label={isFullscreen ? 'Collapse' : 'Expand'}
                    />
                  </ToolbarItem>
                </>
              )}
              <ToolbarItem variant="separator" className="log-viewer__divider" />
              <ToolbarItem>
                <Popover
                  aria-label="Keyboard shortcuts"
                  appendTo={() =>
                    document.getElementById('hacDev-modal-container') || document.body
                  }
                  bodyContent={
                    <KeyboardShortcutHint
                      shortcuts={LOG_VIEWER_SHORTCUTS}
                      title="Keyboard shortcuts"
                      helperText="Click the log area to enable these shortcuts."
                    />
                  }
                  hasAutoWidth
                >
                  <Button
                    className="log-viewer__toolbar-item--padded"
                    icon={<OutlinedKeyboardIcon />}
                    variant="plain"
                    aria-label="Show keyboard shortcuts"
                  />
                </Popover>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </div>

      {/* Header */}
      <Banner data-test="logs-taskName">
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'nowrap' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
        >
          {(taskName || isLoading) && (
            <FlexItem className="log-viewer__task-name-group">
              <Flex
                gap={{ default: 'gapSm' }}
                alignItems={{ default: 'alignItemsCenter' }}
                flexWrap={{ default: 'nowrap' }}
              >
                {taskName && (
                  <FlexItem flex={{ default: 'flex_1' }} className="log-viewer__task-name">
                    <Truncate content={taskName} />
                  </FlexItem>
                )}
                {isLoading && (
                  <FlexItem flex={{ default: 'flexNone' }}>
                    <Spinner
                      isInline
                      aria-label="Loading logs"
                      className="log-viewer__task-name-spinner"
                    />
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          )}
          <FlexItem flex={{ default: 'flexNone' }}>
            <LogsTaskDuration taskRun={taskRun} />
          </FlexItem>
        </Flex>
        {errorMessage && <Alert variant="danger" isInline title={errorMessage} />}
      </Banner>

      {/* Log Viewer */}
      <div ref={containerRef} className="log-viewer__content">
        {containerHeight && (
          <div className="pf-v6-c-log-viewer__main">
            <VirtualizedLogContent
              ref={childRef}
              key={taskRun?.metadata?.uid || 'default'}
              sections={sections ?? []}
              normalizedSections={normalizedSections}
              height={containerHeight}
              width="100%"
              scrollToRow={scrollToRow}
              onScroll={handleScroll}
              searchText={searchText}
              currentSearchMatch={currentMatch}
              onDownloadFullLogs={onDownloadFullLogs}
              onViewFullLogs={onViewFullLogs}
              lineNumberNavigationProps={
                enableLineNavigation
                  ? isLoading
                    ? { ...lineNumberNavigationProps, highlightedLines: null }
                    : lineNumberNavigationProps
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {showResumeStreamButton && (
        <div className="log-viewer__resume-stream-button-wrapper">
          <Button
            data-test="resume-log-stream"
            variant="primary"
            isBlock
            onClick={handleResumeClick}
          >
            <OutlinedPlayCircleIcon /> Resume log stream
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
