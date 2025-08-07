import React from 'react';
import { Alert, Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { CompressIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons/dist/esm/icons';
import {
  LogViewer as PatternFlyLogViewer,
  LogViewerProps,
  LogViewerSearch,
} from '@patternfly/react-log-viewer';
import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { TaskRunKind } from '../../../../types';
import { useFullscreen } from '../../../hooks/fullscreen';
import { LoadingInline } from '../../status-box/StatusBox';
import LogsTaskDuration from './LogsTaskDuration';

export type Props = LogViewerProps & {
  showSearch?: boolean;
  data: string;
  autoScroll?: boolean;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  taskRun?: TaskRunKind;
  isLoading: boolean;
  errorMessage: string | null;
};

const LogViewer: React.FC<Props> = ({
  showSearch = true,
  autoScroll,
  data = '',
  downloadAllLabel,
  onDownloadAll,
  taskRun,
  isLoading,
  errorMessage,
  ...props
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const scrolledRow = React.useMemo(
    () => (autoScroll ? data.split('\n').length : 0),
    [autoScroll, data],
  );

  const [isFullscreen, fullscreenRef, fullscreenToggle] = useFullscreen<HTMLDivElement>();
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);

  const downloadLogs = () => {
    if (!data) return;
    const blob = new Blob([data], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName}.log`);
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
    <div ref={fullscreenRef} style={{ height: isFullscreen ? '100vh' : '100%' }}>
      <PatternFlyLogViewer
        {...props}
        hasLineNumbers={false}
        height={isFullscreen ? '100%' : undefined}
        data={data}
        theme="dark"
        scrollToRow={scrolledRow}
        header={
          <div className="multi-stream-logs__taskName" data-testid="logs-taskName">
            {taskName} <LogsTaskDuration taskRun={taskRun} />
            {isLoading && (
              <span className="multi-stream-logs__taskName__loading-indicator">
                <LoadingInline />
              </span>
            )}
            {errorMessage && (
              <span className="multi-stream-logs__taskName__error-indicator">
                <Alert variant="danger" isInline title={errorMessage} />
              </span>
            )}
          </div>
        }
        toolbar={
          <Toolbar>
            <ToolbarContent
              className={classNames({
                'multi-stream-logs--fullscreen': isFullscreen,
              })}
            >
              {showSearch && (
                <ToolbarItem
                  alignSelf="center"
                  style={{ flex: 1 }}
                  className="multi-stream-logs__button"
                >
                  <LogViewerSearch placeholder="Search" minSearchChars={0} width="100%" />
                  <div className="multi-stream-logs__divider" style={{ alignSelf: 'center' }}>
                    |
                  </div>
                </ToolbarItem>
              )}
              <ToolbarItem alignSelf="center" className="multi-stream-logs__button">
                <Button variant="link" onClick={downloadLogs} isInline>
                  <DownloadIcon className="multi-stream-logs__icon" />
                  Download
                </Button>
                <div className="multi-stream-logs__divider">|</div>
              </ToolbarItem>
              {onDownloadAll && (
                <ToolbarItem alignSelf="center" className="multi-stream-logs__button">
                  <Button
                    variant="link"
                    onClick={startDownloadAll}
                    isDisabled={downloadAllStatus}
                    isInline
                  >
                    <DownloadIcon className="multi-stream-logs__icon" />
                    {downloadAllLabel}
                    {downloadAllStatus && <LoadingInline />}
                  </Button>
                  <div className="multi-stream-logs__divider">|</div>
                </ToolbarItem>
              )}
              {fullscreenToggle && (
                <ToolbarItem alignSelf="center" className="multi-stream-logs__button">
                  <Button variant="link" onClick={fullscreenToggle} isInline>
                    {isFullscreen ? (
                      <>
                        <CompressIcon className="multi-stream-logs__icon" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ExpandIcon className="multi-stream-logs__icon" />
                        Expand
                      </>
                    )}
                  </Button>
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>
        }
      />
    </div>
  );
};

export default LogViewer;
