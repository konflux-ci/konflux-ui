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

import './LogViewer.scss';

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

  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(allowAutoScroll);

  const scrolledRow = React.useMemo(
    () => (autoScroll ? data.split('\n').length : 0),
    [autoScroll, data],
  );

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
      <PatternFlyLogViewer
        {...props}
        hasLineNumbers={false}
        height={isFullscreen ? '100%' : undefined}
        data={data}
        theme={logTheme}
        scrollToRow={scrolledRow}
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
                  <FeatureFlagIndicator flags={['kubearchive-logs']} />
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
  );
};

export default LogViewer;
