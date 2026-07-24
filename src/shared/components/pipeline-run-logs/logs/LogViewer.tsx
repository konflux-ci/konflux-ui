import React from 'react';
import {
  Alert,
  Banner,
  Button,
  Checkbox,
  Flex,
  FlexItem,
  Popover,
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
  OutlinedKeyboardIcon,
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
import { logger } from '~/monitoring/logger';
import {
  KeyboardShortcutHint,
  type ShortcutEntry,
} from '~/shared/components/keyboard-shortcut-hint';
import { useAutoScrollWithResume } from '~/shared/components/pipeline-run-logs/logs/useAutoScrollWithResume';
import { useLogViewerSearch } from '~/shared/components/pipeline-run-logs/logs/useLogViewerSearch';
import { LoadingInline } from '~/shared/components/status-box/StatusBox';
import {
  VirtualizedLogViewer,
  type LogSection,
  normalizeSection,
  useLineNumberNavigation,
} from '~/shared/components/virtualized-log-viewer';
import { useContainerHeight } from '~/shared/hooks';
import { useFullscreen } from '~/shared/hooks/fullscreen';
import { TaskRunKind } from '~/types';
import { prepareLogViewerContent } from './log-viewer-content';
import LogsTaskDuration from './LogsTaskDuration';
import { useLogViewerTheme } from './useLogViewerTheme';

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
  sections: LogSection[];
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
  sections,
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

  const normalizedSections = React.useMemo(() => sections.map(normalizeSection), [sections]);

  const lines = React.useMemo(
    () => prepareLogViewerContent(normalizedSections),
    [normalizedSections],
  );

  // Tracks the line currently targeted via URL hash navigation (e.g. `#L20000`). Computed here
  // (rather than read from VirtualizedLogContent) so it's available in the very same render —
  // no round-trip delay through child effects/callbacks — and used to pause auto-scroll-to-bottom
  // so it doesn't keep fighting the scroll-to-that-line navigation as new log lines stream in.
  const { highlightedLines: activeLineTarget } = useLineNumberNavigation();

  const { autoScroll, showResumeStreamButton, handleScroll, handleResumeClick } =
    useAutoScrollWithResume({
      allowAutoScroll,
      activeLineTarget,
      onScroll: onScrollProp,
    });

  const { logViewerContextValue, toolbarContextValue, scrolledRow } = useLogViewerSearch({
    lines,
    autoScroll,
  });

  const [isFullscreen, fullscreenRef, fullscreenToggle, isFullscreenSupported] =
    useFullscreen<HTMLDivElement>();

  const downloadData = React.useMemo(() => {
    return sections
      .map((s) => (s.containerName ? `${s.containerName}\n${s.data}` : s.data))
      .join('\n\n');
  }, [sections]);

  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);

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
  const { containerRef, viewerHeight } = useContainerHeight({ isFullscreen });

  return (
    <LogViewerContext.Provider value={logViewerContextValue}>
      <LogViewerToolbarContext.Provider value={toolbarContextValue}>
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
                <ToolbarGroup align={{ default: 'alignEnd' }}>
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
                    <Button variant="link" onClick={downloadLogs}>
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
                    <ToolbarItem gap={{ default: 'gapMd' }}>
                      <Button variant="link" onClick={fullscreenToggle}>
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
            {viewerHeight && (
              <VirtualizedLogViewer
                key={taskRun?.metadata?.uid || 'default'}
                sections={sections}
                normalizedSections={normalizedSections}
                height={viewerHeight}
                scrollToRow={scrolledRow}
                onScroll={handleScroll}
                readyToNavigate={!isLoading}
              />
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
      </LogViewerToolbarContext.Provider>
    </LogViewerContext.Provider>
  );
};

export default LogViewer;
