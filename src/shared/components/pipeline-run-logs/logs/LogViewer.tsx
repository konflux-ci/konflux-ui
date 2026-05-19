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
import { ANSI_ESCAPE_REGEX } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import type { LogSection } from '~/shared/components/virtualized-log-viewer/types';
import { useFullscreen } from '~/shared/hooks/fullscreen';
import { TaskRunKind } from '~/types';
import LogsTaskDuration from './LogsTaskDuration';
import { useLogViewerTheme } from './useLogViewerTheme';

import './LogViewer.scss';

// Re-export so existing callers (Logs.tsx, tests) don't need to change imports
export type { LogSection };

export type Props = {
  showSearch?: boolean;
  /** Raw log string — used by TektonTaskRunLog (single-stream, no folding) */
  data?: string;
  /** Per-container sections — used by Logs.tsx (multi-stream, foldable steps) */
  logSections?: readonly LogSection[];
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
  data: dataProp = '',
  logSections,
  downloadAllLabel,
  onDownloadAll,
  taskRun,
  isLoading,
  errorMessage,
  onScroll: onScrollProp,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const [logTheme, setLogTheme] = useLogViewerTheme();
  const themeCheckboxId = React.useId();

  // Build a flat string for the search index.
  // In sections mode: join section-name + content per section so search
  // covers all steps. In plain mode: use dataProp directly.
  const searchData = React.useMemo(() => {
    if (dataProp) return dataProp;
    if (logSections?.length) {
      return logSections.map((s) => `${s.name.toUpperCase()}\n${s.data}`).join('\n\n');
    }
    return '';
  }, [dataProp, logSections]);

  // Strip ANSI + normalise line endings for the search index
  const processedData = React.useMemo(
    () => searchData.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, ''),
    [searchData],
  );

  const lines = React.useMemo(() => processedData.split('\n'), [processedData]);

  const { autoScroll, showResumeStreamButton, handleScroll, handleResumeClick } =
    useAutoScrollWithResume({ allowAutoScroll, onScroll: onScrollProp });

  const { logViewerContextValue, toolbarContextValue, scrolledRow } = useLogViewerSearch({
    lines,
    autoScroll,
  });

  const [isFullscreen, fullscreenRef, fullscreenToggle, isFullscreenSupported] =
    useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);

  const downloadLogs = () => {
    if (!searchData) return;
    const blob = new Blob([searchData], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${taskName || `task-run-${uuidv4()}`}.log`);
  };

  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll()
      .then(() => setDownloadAllStatus(false))
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        // eslint-disable-next-line no-console
        console.warn(err.message || 'Error downloading logs.');
      });
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewerHeight, setViewerHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const updateHeight = (immediate = false) => {
      if (containerRef.current) {
        const measured = containerRef.current.clientHeight;
        if (measured > 0) {
          if (immediate) {
            setViewerHeight(measured);
          } else {
            requestAnimationFrame(() => setViewerHeight(measured));
          }
        }
      }
    };

    updateHeight(true);
    const debouncedUpdateHeight = debounce(() => updateHeight(false), 150);
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
            'log-viewer--light': logTheme === 'light',
          })}
        >
          {/* Toolbar */}
          <div className="pf-v5-c-log-viewer__header">
            <Toolbar>
              <ToolbarContent
                className={classNames({ 'log-viewer--fullscreen': isFullscreen })}
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
                      id={themeCheckboxId}
                      label="Dark theme"
                      checked={logTheme === 'dark'}
                      onClick={() => setLogTheme(logTheme === 'dark' ? 'light' : 'dark')}
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
              <Bullseye className="log-viewer__bullseye">
                <Spinner size="lg" />
              </Bullseye>
            )}
            {errorMessage && <Alert variant="danger" isInline title={errorMessage} />}
          </Banner>

          {/* Log content — single VirtualizedLogViewer handles both plain and sectioned data */}
          <div ref={containerRef} className="log-viewer__content">
            {viewerHeight && (
              <VirtualizedLogViewer
                key={taskRun?.metadata?.uid || 'default'}
                data={processedData}
                sections={logSections?.length ? logSections : undefined}
                height={viewerHeight}
                scrollToRow={scrolledRow}
                onScroll={handleScroll}
              />
            )}
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
