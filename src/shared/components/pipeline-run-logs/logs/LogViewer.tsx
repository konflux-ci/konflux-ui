import React from 'react';
import {
  Alert,
  Banner,
  Bullseye,
  Button,
  Checkbox,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  CompressIcon,
  DownloadIcon,
  ExpandIcon,
  OutlinedPlayCircleIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import {
  LogViewer as PatternFlyLogViewer,
  LogViewerProps,
  LogViewerSearch,
} from '@patternfly/react-log-viewer';
import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { TaskRunKind } from '~/types';
import { useFullscreen } from '../../../hooks/fullscreen';
import { useTheme } from '../../../theme';
import { LoadingInline } from '../../status-box/StatusBox';
import LogsTaskDuration from './LogsTaskDuration';
import { useLogSyntaxHighlighting } from './useLogSyntaxHighlighting';

import './LogViewer.scss';
import './LogViewerEnhancements.scss';

export type Props = LogViewerProps & {
  showSearch?: boolean;
  data: string;
  allowAutoScroll?: boolean;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  taskRun: TaskRunKind | null;
  isLoading: boolean;
  errorMessage: string | null;
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
  ...props
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const { effectiveTheme } = useTheme();
  const [logTheme, setLogTheme] = React.useState<LogViewerProps['theme']>('dark');
  const [syntaxHighlightEnabled, setSyntaxHighlightEnabled] = React.useState(true);

  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(allowAutoScroll);

  // Apply syntax highlighting to log data
  const highlightedData = useLogSyntaxHighlighting(data, syntaxHighlightEnabled);

  // Ref for log viewer container to add line number click handlers
  const logViewerRef = React.useRef<HTMLDivElement>(null);

  // Track last clicked line for range selection
  const [lastClickedLine, setLastClickedLine] = React.useState<number | null>(null);

  // Track selected line range (for re-applying after virtual scroll updates)
  const [selectedRange, setSelectedRange] = React.useState<{ start: number; end: number } | null>(null);

  // Track target scroll row for hash navigation
  const [targetScrollRow, setTargetScrollRow] = React.useState<number | null>(null);

  // Helper function to highlight lines
  const highlightLines = React.useCallback((start: number, end: number) => {
    const container = logViewerRef.current;
    if (!container) return;

    // Remove all previous highlights
    container.querySelectorAll('.log-line-selected').forEach((el) => {
      el.classList.remove('log-line-selected');
    });

    // Add highlight to selected range by finding elements with matching line numbers
    const allLines = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');

    allLines.forEach((lineElement) => {
      // Find the line number element within this line
      const lineNumberEl = lineElement.querySelector('.pf-v5-c-log-viewer__index');
      if (!lineNumberEl) return;

      const lineText = lineNumberEl.textContent?.trim();
      if (!lineText) return;

      const lineNumber = parseInt(lineText, 10);
      if (isNaN(lineNumber)) return;

      // Check if this line is in the selected range
      if (lineNumber >= start && lineNumber <= end) {
        lineElement.classList.add('log-line-selected');
      }
    });

    // Store the selected range for re-application after DOM updates
    setSelectedRange({ start, end });
  }, []);

  // Add click handler for line numbers with range selection and highlighting
  React.useEffect(() => {
    const container = logViewerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;

      // Check if click was on a line number element
      // PatternFly uses class: pf-v5-c-log-viewer__index
      const lineNumberEl = target.closest('.pf-v5-c-log-viewer__index');
      if (!lineNumberEl) return;

      // Get the line number from the element's text content
      const lineText = lineNumberEl.textContent?.trim();
      if (!lineText) return;

      const lineNumber = parseInt(lineText, 10);
      if (isNaN(lineNumber)) return;

      // Check if Shift key is pressed for range selection
      if (e.shiftKey && lastClickedLine !== null) {
        // Range selection: from lastClickedLine to current lineNumber
        const start = Math.min(lastClickedLine, lineNumber);
        const end = Math.max(lastClickedLine, lineNumber);
        window.location.hash = `#L${start}-L${end}`;
        highlightLines(start, end);
        setTargetScrollRow(null);
      } else {
        // Single line selection
        window.location.hash = `#L${lineNumber}`;
        setLastClickedLine(lineNumber);
        highlightLines(lineNumber, lineNumber);
        setTargetScrollRow(null);
      }
    };

    // Use event delegation on the container
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [lastClickedLine, highlightLines]);

  // Monitor DOM changes to re-apply highlights after virtual scroll updates
  React.useEffect(() => {
    const container = logViewerRef.current;
    if (!container || !selectedRange) return;

    let isApplying = false; // Prevent infinite loops

    const observer = new MutationObserver(() => {
      // Re-apply highlights when DOM changes (virtual scroll)
      if (selectedRange && !isApplying) {
        isApplying = true;
        // Use requestAnimationFrame to avoid blocking
        requestAnimationFrame(() => {
          highlightLines(selectedRange.start, selectedRange.end);
          isApplying = false;
        });
      }
    });

    // Observe the log viewer list for changes
    const listElement = container.querySelector('.pf-v5-c-log-viewer__list');
    if (listElement) {
      observer.observe(listElement, {
        childList: true,
        subtree: false, // Only watch direct children, not all descendants
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [selectedRange, highlightLines]);

  // Helper function to navigate to a hash
  const navigateToHash = React.useCallback((hash: string) => {
    if (!hash) return;

    const match = hash.match(/#L(\d+)(?:-L(\d+))?/);
    if (!match) return;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    // Disable auto-scroll when navigating to a specific line
    setAutoScroll(false);

    // Use PatternFly's scrollToRow to ensure the line is rendered
    setTargetScrollRow(start);

    // Highlight after a delay to ensure DOM is updated
    setTimeout(() => {
      highlightLines(start, end);
      setLastClickedLine(start);
    }, 300);
  }, [highlightLines]);

  // Handle initial URL hash navigation (e.g., #L25 or #L10-L20)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !data) return;

    // Delay to ensure DOM is ready after data loads
    const timeoutId = setTimeout(() => {
      navigateToHash(hash);
    }, 500); // Increased delay to ensure virtual scroll has rendered

    return () => clearTimeout(timeoutId);
  }, [data, navigateToHash]); // Re-run when data loads

  // Handle hash changes (browser back/forward)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        navigateToHash(hash);
      } else {
        // Clear highlights if hash is removed
        const container = logViewerRef.current;
        container?.querySelectorAll('.log-line-selected').forEach((el) => {
          el.classList.remove('log-line-selected');
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [navigateToHash]);


  const scrolledRow = React.useMemo(() => {
    // If we have a target row from hash navigation, use that
    if (targetScrollRow !== null) {
      return targetScrollRow;
    }
    // Otherwise use auto-scroll behavior
    return autoScroll ? data.split('\n').length : 0;
  }, [autoScroll, data, targetScrollRow]);

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

  return (
    <div
      ref={fullscreenRef}
      style={{ height: isFullscreen ? '100vh' : '100%' }}
      className={classNames('log-viewer__container')}
    >
      <div ref={logViewerRef} style={{ height: '100%' }}>
        <PatternFlyLogViewer
        {...props}
        hasLineNumbers={true}
        height={isFullscreen ? '100%' : undefined}
        data={highlightedData}
        theme={logTheme}
        scrollToRow={scrolledRow}
        isTextWrapped={true}
        onScroll={(onScrollProps) => {
          const { scrollDirection: logViewerScrollDirection, scrollUpdateWasRequested } =
            onScrollProps;
          setScrollDirection(logViewerScrollDirection);

          if (scrollUpdateWasRequested) {
            setAutoScroll(false);
          }

          props.onScroll?.(onScrollProps);
        }}
        header={
          <Banner data-testid="logs-taskName">
            {taskName} <LogsTaskDuration taskRun={taskRun} />
            {isLoading && (
              <Bullseye>
                <Spinner size="lg" />
              </Bullseye>
            )}
            {errorMessage && <Alert variant="danger" isInline title={errorMessage} />}
          </Banner>
        }
        toolbar={
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
                    // theme toggle should be disabled if global theme is dark
                    isDisabled={effectiveTheme === 'dark'}
                    checked={logTheme === 'dark'}
                    onClick={() => setLogTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                  />
                </ToolbarItem>
                <ToolbarItem variant="separator" className="log-viewer__divider" />
                <ToolbarItem>
                  <Checkbox
                    id="syntax-highlight"
                    label="Syntax highlighting"
                    checked={syntaxHighlightEnabled}
                    onClick={() => setSyntaxHighlightEnabled((prev) => !prev)}
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
        }
        footer={
          showResumeStreamButton && (
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
          )
        }
      />
      </div>
    </div>
  );
};

export default LogViewer;