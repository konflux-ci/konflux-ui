import * as React from 'react';
import { useK8sWatchResource } from '../../../../k8s';
import { PodModel } from '../../../../models/pod';
import { TaskRunKind } from '../../../../types';
import { WatchK8sResource } from '../../../../types/k8s';
import { LoadingInline } from '../../status-box/StatusBox';
import { PodKind } from '../../types';
import { MultiStreamLogs } from './MultiStreamLogs';
import { TektonTaskRunLog } from './TektonTaskRunLog';

type LogsWrapperComponentProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  resource: WatchK8sResource;
};

const LogsWrapperComponent: React.FC<React.PropsWithChildren<LogsWrapperComponentProps>> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  ...props
}) => {
  const resourceRef = React.useRef(null);
  const {
    data: obj,
    isLoading,
    error,
  } = useK8sWatchResource<PodKind>({ ...resource, watch: true }, PodModel, { retry: false });

  if (!isLoading && !error && resource.name === obj.metadata.name) {
    resourceRef.current = obj;
  } else if (error) {
    resourceRef.current = null;
  }

  return (
    <div className="multi-stream-logs">
      {!isLoading || error ? (
        <>
          {!error ? (
            <MultiStreamLogs
              {...props}
              taskRun={taskRun}
              resourceName={resource?.name}
              resource={resourceRef.current}
              onDownloadAll={onDownloadAll}
              downloadAllLabel={downloadAllLabel}
            />
          ) : (
            <TektonTaskRunLog
              taskRun={taskRun}
              onDownloadAll={onDownloadAll}
              downloadAllLabel={downloadAllLabel}
            />
          )}
        </>
      ) : (
        <span
          className="multi-stream-logs__taskName__loading-indicator"
          data-testid="loading-indicator"
        >
          <LoadingInline />
        </span>
      )}
    </div>
  );
};

export default LogsWrapperComponent;
