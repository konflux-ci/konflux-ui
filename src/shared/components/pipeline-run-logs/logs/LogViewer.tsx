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
import { debounce } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useAutoScrollWithResume } from '~/shared/components/pipeline-run-logs/logs/useAutoScrollWithResume';
import { useLogViewerSearch } from '~/shared/components/pipeline-run-logs/logs/useLogViewerSearch';
import { LoadingInline } from '~/shared/components/status-box/StatusBox';
import { VirtualizedLogViewer } from '~/shared/components/virtualized-log-viewer';
import { useFullscreen } from '~/shared/hooks/fullscreen';
import { useTheme } from '~/shared/theme';
import { TaskRunKind } from '~/types';
import LogsTaskDuration from './LogsTaskDuration';

import './LogViewer.scss';

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

  // Auto-scroll and resume button logic
  const { autoScroll, showResumeStreamButton, handleScroll, handleResumeClick } =
    useAutoScrollWithResume({
      allowAutoScroll,
      onScroll: onScrollProp,
    });

  // Console rewind action adds \r to the logs, this replaces them not to cause line overlap
  // Remove ANSI escape codes for plain text display
  const processedData = React.useMemo(() => {
    // eslint-disable-next-line no-control-regex
    const ANSI_ESCAPE_REGEX = new RegExp('\\u001b\\[[0-9;]*m', 'g');
    return data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '');
  }, [data]);

  const lines = React.useMemo(() => processedData.split('\n'), [processedData]);

  // Search state and context management
  const { logViewerContextValue, toolbarContextValue, scrolledRow } = useLogViewerSearch({
    lines,
    autoScroll,
  });

  const [isFullscreen, fullscreenRef, fullscreenToggle, isFullscreenSupported] =
    useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);

  const downloadLogs = () => {
    if (!data) return;
    const blob = new Blob([data], {
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
    const updateHeight = (immediate = false) => {
      if (containerRef.current) {
        const measured = containerRef.current.clientHeight;
        if (measured > 0) {
          if (immediate) {
            // Immediate update for fullscreen toggle and initial mount
            setViewerHeight(measured);
          } else {
            // Use requestAnimationFrame for resize events to avoid ResizeObserver warnings
            requestAnimationFrame(() => {
              setViewerHeight(measured);
            });
          }
        }
      }
    };

    // Update immediately on mount and fullscreen changes
    updateHeight(true);

    // Debounced resize handler for better performance (150ms delay)
    const debouncedUpdateHeight = debounce(() => updateHeight(false), 150);

    // Update on window resize
    window.addEventListener('resize', debouncedUpdateHeight);
    return () => {
      window.removeEventListener('resize', debouncedUpdateHeight);
      debouncedUpdateHeight.cancel();
    };
  }, [isFullscreen]);

  return (
    <LogViewerContext.Provider value={logViewerContextValue}>
      <LogViewerToolbarContext.Provider value={toolbarContextValue}>
        <div
          ref={fullscreenRef}
          style={{ height: isFullscreen ? '100vh' : '100%' }}
          className={classNames('log-viewer__container', 'pf-v5-c-log-viewer', {
            'pf-m-dark': logTheme === 'dark',
          })}
        >
          {/* Toolbar */}
          <div className="pf-v5-c-log-viewer__header">
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
                      id={React.useId()}
                      label="Dark theme"
                      // theme toggle should be disabled if global theme is dark
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
          </div>

          {/* Header */}
          <Banner data-testid="logs-taskName">
            <Flex gap={{ default: 'gapSm' }}>
              {taskName && (
                <FlexItem flex={{ default: 'flex_1' }} className="log-viewer__task-name">
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

          {/* Log Viewer */}
          <div ref={containerRef} className="log-viewer__content">
            <VirtualizedLogViewer
              data={processedData}
              height={viewerHeight}
              scrollToRow={scrolledRow}
              onScroll={handleScroll}
            />
          </div>

          {/* Footer */}
          {showResumeStreamButton && (
            <div className="log-viewer__resume-stream-button-wrapper">
              <Button
                data-testid="resume-log-stream"
                variant="primary"
                isBlock
                onClick={handleResumeClick}
              >
                <OutlinedPlayCircleIcon /> Resume log stream
              </Button>
            </div>
          )}
        </div>
      </LogViewerToolbarContext.Provider>
    </LogViewerContext.Provider>
  );
};

export default LogViewer;
