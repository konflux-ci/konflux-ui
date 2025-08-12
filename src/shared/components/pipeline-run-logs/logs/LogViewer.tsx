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
  ToolbarItem,
} from '@patternfly/react-core';
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

import './LogViewer.scss';

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
  const [logTheme, setLogTheme] = React.useState<LogViewerProps['theme']>('dark');
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
    <div
      ref={fullscreenRef}
      style={{ height: isFullscreen ? '100vh' : '100%' }}
      className={classNames('log-viewer__container', 'log-viewer-theme-isolation', {
        'log-viewer-theme-isolation--dark': logTheme === 'dark',
        'log-viewer-theme-isolation--light': logTheme === 'light',
      })}
    >
      <PatternFlyLogViewer
        {...props}
        hasLineNumbers={false}
        height={isFullscreen ? '100%' : undefined}
        data={data}
        theme={logTheme}
        scrollToRow={scrolledRow}
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
            >
              {showSearch && (
                <>
                  <ToolbarItem alignSelf="center" style={{ flex: 1 }}>
                    <LogViewerSearch placeholder="Search" minSearchChars={0} width="100%" />
                  </ToolbarItem>
                  <ToolbarItem variant="separator" className="log-viewer__divider" />
                </>
              )}
              <ToolbarItem alignSelf="center">
                <Checkbox
                  id="theme"
                  label="Dark theme"
                  checked={logTheme === 'dark'}
                  onClick={() =>
                    setLogTheme((prev) => {
                      if (prev === 'dark') return 'light';
                      return 'dark';
                    })
                  }
                />
              </ToolbarItem>
              <ToolbarItem variant="separator" className="log-viewer__divider" />
              <ToolbarItem alignSelf="center">
                <Button variant="link" onClick={downloadLogs} isInline>
                  <DownloadIcon className="log-viewer__icon" />
                  Download
                </Button>
              </ToolbarItem>
              <ToolbarItem variant="separator" className="log-viewer__divider" />
              {onDownloadAll && (
                <>
                  <ToolbarItem alignSelf="center">
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
              {fullscreenToggle && (
                <ToolbarItem alignSelf="center">
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
            </ToolbarContent>
          </Toolbar>
        }
      />
    </div>
  );
};

export default LogViewer;
