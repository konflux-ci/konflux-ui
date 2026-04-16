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
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleUpIcon } from '@patternfly/react-icons/dist/esm/icons/angle-up-icon';
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
import { TaskRunKind } from '~/types';
import LogsTaskDuration from './LogsTaskDuration';
import { useLogViewerTheme } from './useLogViewerTheme';

import './LogViewer.scss';

// ANSI escape code regex for removing color codes from terminal output
// ESC character (\u001b) is a control character but necessary for ANSI escape sequences
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g;

/** Virtualized row height matches `VirtualizedLogContent` default estimate. */
const SECTION_LOG_LINE_PX = 20;
const SECTION_LOG_MIN_PX = 64;
const SECTION_LOG_MAX_PX = 440;
/** Gutter / chrome inside the log viewport (not line text). */
const SECTION_LOG_CHROME_PX = 24;

/** Tight viewport for few lines; caps long output so each step scrolls internally. */
function getSectionLogViewportHeightPx(logText: string): number {
  const lineCount = Math.max(1, logText.split('\n').length);
  const contentPx = lineCount * SECTION_LOG_LINE_PX + SECTION_LOG_CHROME_PX;
  return Math.round(Math.min(SECTION_LOG_MAX_PX, Math.max(SECTION_LOG_MIN_PX, contentPx)));
}

export type LogSection = { id: string; title: string; data: string };

export type Props = {
  showSearch?: boolean;
  /** When set, one block per step (container) with its own heading and collapsible body. */
  logSections?: LogSection[];
  /** Step (container) currently in progress; unfolded by default while others start folded. */
  inProgressSectionId?: string;
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
  logSections,
  inProgressSectionId,
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
  const [logTheme, setLogTheme] = useLogViewerTheme();
  const themeCheckboxId = React.useId();

  const sectionCount = logSections?.length ?? 0;
  const useSectionedLayout = sectionCount > 0;
  const singleSectionLayout = sectionCount === 1;
  const multiSectionLayout = sectionCount > 1;
  const showSearchToolbar = showSearch && (!useSectionedLayout || singleSectionLayout);

  const getDefaultCollapsedSectionIds = React.useCallback((): ReadonlySet<string> => {
    const defaultCollapsed = new Set((logSections ?? []).map((section) => section.id));
    if (inProgressSectionId) {
      defaultCollapsed.delete(inProgressSectionId);
    }
    return defaultCollapsed;
  }, [logSections, inProgressSectionId]);

  const [collapsedSectionIds, setCollapsedSectionIds] = React.useState<ReadonlySet<string>>(
    getDefaultCollapsedSectionIds,
  );
  const [hasUserToggledSections, setHasUserToggledSections] = React.useState(false);

  const toggleSectionCollapsed = React.useCallback((sectionId: string) => {
    setHasUserToggledSections(true);
    setCollapsedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (!useSectionedLayout || hasUserToggledSections) {
      return;
    }
    setCollapsedSectionIds(getDefaultCollapsedSectionIds());
  }, [useSectionedLayout, hasUserToggledSections, getDefaultCollapsedSectionIds]);

  // Auto-scroll and resume button logic
  const { autoScroll, showResumeStreamButton, handleScroll, handleResumeClick } =
    useAutoScrollWithResume({
      allowAutoScroll,
      onScroll: onScrollProp,
    });

  // Console rewind action adds \r to the logs, this replaces them not to cause line overlap
  // Remove ANSI escape codes for plain text display
  const processedData = React.useMemo(() => {
    return data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '');
  }, [data]);

  const lines = React.useMemo(() => {
    if (multiSectionLayout) {
      return processedData.split('\n');
    }
    if (singleSectionLayout && logSections?.[0]) {
      return logSections[0].data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '').split('\n');
    }
    return processedData.split('\n');
  }, [multiSectionLayout, singleSectionLayout, logSections, processedData]);

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
  const [viewerHeight, setViewerHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (multiSectionLayout) {
      setViewerHeight(undefined);
      return undefined;
    }

    if (singleSectionLayout && logSections?.[0] && collapsedSectionIds.has(logSections[0].id)) {
      setViewerHeight(undefined);
      return undefined;
    }

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
  }, [isFullscreen, multiSectionLayout, singleSectionLayout, logSections, collapsedSectionIds]);

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
                {showSearchToolbar && (
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
              <Bullseye>
                <Spinner size="lg" />
              </Bullseye>
            )}
            {errorMessage && <Alert variant="danger" isInline title={errorMessage} />}
          </Banner>

          {/* Log Viewer */}
          {useSectionedLayout ? (
            <div
              className={classNames(
                'log-viewer__content',
                'log-viewer__content--sections',
                singleSectionLayout && 'log-viewer__content--sections-single',
              )}
            >
              {(logSections ?? []).map((sec) => {
                const sectionData = sec.data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '');
                const isCollapsed = collapsedSectionIds.has(sec.id);
                const showViewer = multiSectionLayout || viewerHeight;
                const sectionContentHeightPx = getSectionLogViewportHeightPx(sectionData);
                const sectionViewerHeightPx = multiSectionLayout
                  ? sectionContentHeightPx
                  : Math.min(viewerHeight ?? SECTION_LOG_MAX_PX, sectionContentHeightPx);

                return (
                  <div key={sec.id} className="log-viewer__section">
                    <button
                      type="button"
                      className="log-viewer__section-header"
                      onClick={() => toggleSectionCollapsed(sec.id)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`log-viewer-section-body-${sec.id}`}
                      data-test={`log-section-toggle-${sec.id}`}
                    >
                      <span className="log-viewer__section-heading">{sec.title}</span>
                      <span className="log-viewer__section-toggle-icon" aria-hidden="true">
                        {isCollapsed ? <AngleDownIcon /> : <AngleUpIcon />}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div
                        id={`log-viewer-section-body-${sec.id}`}
                        ref={singleSectionLayout ? containerRef : undefined}
                        className="log-viewer__section-body"
                      >
                        {showViewer && (
                          <VirtualizedLogViewer
                            data={sectionData}
                            height={sectionViewerHeightPx}
                            scrollToRow={singleSectionLayout ? scrolledRow : undefined}
                            onScroll={handleScroll}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div ref={containerRef} className="log-viewer__content">
              {viewerHeight && (
                <VirtualizedLogViewer
                  data={processedData}
                  height={viewerHeight}
                  scrollToRow={scrolledRow}
                  onScroll={handleScroll}
                />
              )}
            </div>
          )}

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
