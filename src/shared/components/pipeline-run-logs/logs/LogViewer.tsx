import React from 'react';
import {
  Alert,
  Banner,
  Bullseye,
  Button,
  Checkbox,
  Flex,
  FlexItem,
  Spinner,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Truncate,
} from '@patternfly/react-core';
import {
  CompressIcon,
  DownloadIcon,
  ExpandIcon,
  OutlinedPlayCircleIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import {
  LogViewerSearch,
  LogViewerContext,
  LogViewerToolbarContext,
} from '@patternfly/react-log-viewer';
import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { TaskRunKind } from '~/types';
import { useFullscreen } from '../../../hooks/fullscreen';
import { useTheme } from '../../../theme';
import { LoadingInline } from '../../status-box/StatusBox';
import { VirtualizedLogViewer } from '../../virtualized-log-viewer';
import LogsTaskDuration from './LogsTaskDuration';

import './LogViewer.scss';

interface SearchedWord {
  rowIndex: number;
  matchIndex: number;
}

export type Props = {
  showSearch?: boolean;
  data: string;
  allowAutoScroll?: boolean;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  taskRun: TaskRunKind | null;
  isLoading: boolean;
  errorMessage: string | null;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
};

const LogViewer: React.FC<Props> = ({
  showSearch = true,
  allowAutoScroll,
  data = '',
  downloadAllLabel,
  onDownloadAll,
  taskRun,
  isLoading,
  errorMessage,
  onScroll: onScrollProp,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const { effectiveTheme } = useTheme();
  const [logTheme, setLogTheme] = React.useState<'light' | 'dark'>('dark');

  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(allowAutoScroll);

  // Search state for LogViewerContext
  const [searchedWordIndexes, setSearchedWordIndexes] = React.useState<SearchedWord[]>([]);
  const [searchedInput, setSearchedInput] = React.useState('');
  const [currentSearchedItemCount, setCurrentSearchedItemCount] = React.useState(0);
  const [rowInFocus, setRowInFocus] = React.useState<SearchedWord>({
    rowIndex: -1,
    matchIndex: -1,
  });

  // Console rewind action adds \r to the logs, this replaces them not to cause line overlap
  // Remove ANSI escape codes for plain text display
  const sanitizedData = React.useMemo(() => {
    const ansiEscapePattern = String.raw`\u001b\[[0-9;]*m`;
    return data.replace(/\r/g, '\n').replace(new RegExp(ansiEscapePattern, 'g'), '');
  }, [data]);

  const lines = React.useMemo(() => sanitizedData.split('\n'), [sanitizedData]);

  const handleScrollToRow = React.useCallback((row: SearchedWord) => {
    setRowInFocus(row);
  }, []);

  const logViewerContextValue = React.useMemo(
    () => ({
      parsedData: lines,
      searchedInput,
    }),
    [lines, searchedInput],
  );

  const toolbarContextValue = React.useMemo(
    () => ({
      searchedWordIndexes,
      scrollToRow: handleScrollToRow,
      setSearchedInput,
      setCurrentSearchedItemCount,
      setRowInFocus,
      setSearchedWordIndexes,
      currentSearchedItemCount,
      searchedInput,
      itemCount: lines.length,
      rowInFocus,
    }),
    [
      searchedWordIndexes,
      handleScrollToRow,
      currentSearchedItemCount,
      searchedInput,
      lines.length,
      rowInFocus,
    ],
  );

  const scrolledRow = React.useMemo(() => {
    // If searching and have a current match, scroll to it
    if (rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    // Otherwise, if auto-scroll is enabled, scroll to end
    if (autoScroll) {
      return lines.length;
    }
    return 0;
  }, [autoScroll, lines.length, rowInFocus]);

  const [isFullscreen, fullscreenRef, fullscreenToggle, isFullscreenSupported] =
    useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);

  const showResumeStreamButton = allowAutoScroll && scrollDirection === 'backward';

  // track when logs become available to enable auto-scroll
  React.useEffect(() => {
    if (data && allowAutoScroll) {
      setAutoScroll(true);
    }
  }, [data, allowAutoScroll]);

  const downloadLogs = () => {
    if (!sanitizedData) return;
    const blob = new Blob([sanitizedData], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName || `task-run-${uuidv4()}`}.log`);
  };

  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll()
      .then(() => {
        setDownloadAllStatus(false);
      })
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        // eslint-disable-next-line no-console
        console.warn(err.message || 'Error downloading logs.');
      });
  };

  // Use containerRef to measure actual height for VirtualizedLogViewer
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewerHeight, setViewerHeight] = React.useState(600);

  React.useEffect(() => {
    if (containerRef.current) {
      const measured = containerRef.current.clientHeight;
      if (measured > 0) {
        setViewerHeight(measured);
      }
    }
  }, [isFullscreen]);

  return (
    <LogViewerContext.Provider value={logViewerContextValue}>
      <LogViewerToolbarContext.Provider value={toolbarContextValue}>
        <Stack
          ref={fullscreenRef}
          style={{
            height: isFullscreen ? '100vh' : '100%',
          }}
          className={classNames('log-viewer__container')}
        >
          {/* Header */}
          <StackItem>
            <Banner data-testid="logs-taskName">
              <Flex gap={{ default: 'gapSm' }}>
                {taskName && (
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
                    <Truncate content={taskName} />
                  </FlexItem>
                )}
                <FlexItem flex={{ default: 'flexNone' }}>
                  <LogsTaskDuration taskRun={taskRun} />
                </FlexItem>
              </Flex>
              {isLoading && (
                <Bullseye>
                  <Spinner size="lg" />
                </Bullseye>
              )}
              {errorMessage && <Alert variant="danger" isInline title={errorMessage} />}
            </Banner>
          </StackItem>

          {/* Toolbar */}
          <StackItem>
            <Toolbar>
              <ToolbarContent
                className={classNames({
                  'log-viewer--fullscreen': isFullscreen,
                })}
                alignItems="center"
              >
                <ToolbarGroup>
                  <ToolbarItem>
                    <FeatureFlagIndicator flags={['kubearchive-logs', 'taskruns-kubearchive']} />
                  </ToolbarItem>
                </ToolbarGroup>
                {showSearch && (
                  <ToolbarGroup>
                    <ToolbarItem>
                      <LogViewerSearch placeholder="Search" minSearchChars={0} />
                    </ToolbarItem>
                  </ToolbarGroup>
                )}
                <ToolbarGroup align={{ default: 'alignRight' }}>
                  <ToolbarItem>
                    <Checkbox
                      id="theme"
                      label="Dark theme"
                      isDisabled={effectiveTheme === 'dark'}
                      checked={logTheme === 'dark'}
                      onClick={() => setLogTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    />
                  </ToolbarItem>
                  <ToolbarItem variant="separator" className="log-viewer__divider" />
                  <ToolbarItem>
                    <Button variant="link" onClick={downloadLogs} isInline>
                      <DownloadIcon className="log-viewer__icon" />
                      Download
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem variant="separator" className="log-viewer__divider" />
                  {onDownloadAll && (
                    <>
                      <ToolbarItem>
                        <Button
                          variant="link"
                          onClick={startDownloadAll}
                          isDisabled={downloadAllStatus}
                          isInline
                        >
                          <DownloadIcon className="log-viewer__icon" />
                          {downloadAllLabel}
                          {downloadAllStatus && <LoadingInline />}
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem variant="separator" className="log-viewer__divider" />
                    </>
                  )}
                  {fullscreenToggle && isFullscreenSupported && (
                    <ToolbarItem spacer={{ default: 'spacerMd' }}>
                      <Button variant="link" onClick={fullscreenToggle} isInline>
                        {isFullscreen ? (
                          <>
                            <CompressIcon className="log-viewer__icon" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ExpandIcon className="log-viewer__icon" />
                            Expand
                          </>
                        )}
                      </Button>
                    </ToolbarItem>
                  )}
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
          </StackItem>

          {/* Log Viewer */}
          <StackItem isFilled ref={containerRef} style={{ minHeight: 0 }}>
            <VirtualizedLogViewer
              data={sanitizedData}
              height={viewerHeight}
              theme={logTheme}
              scrollToRow={scrolledRow}
              onScroll={(onScrollProps) => {
                const { scrollDirection: logViewerScrollDirection, scrollUpdateWasRequested } =
                  onScrollProps;
                setScrollDirection(logViewerScrollDirection);

                // Only disable auto-scroll on user-initiated scrolls (not programmatic scrolls)
                // scrollUpdateWasRequested=false indicates user manually scrolled
                if (!scrollUpdateWasRequested) {
                  setAutoScroll(false);
                }

                onScrollProp?.(onScrollProps);
              }}
            />
          </StackItem>

          {/* Footer */}
          {showResumeStreamButton && (
            <StackItem>
              <div className="log-viewer__resume-stream-button-wrapper">
                <Button
                  data-testid="resume-log-stream"
                  variant="primary"
                  isBlock
                  onClick={() => setAutoScroll(true)}
                >
                  <OutlinedPlayCircleIcon /> Resume log stream
                </Button>
              </div>
            </StackItem>
          )}
        </Stack>
      </LogViewerToolbarContext.Provider>
    </LogViewerContext.Provider>
  );
};

export default LogViewer;
