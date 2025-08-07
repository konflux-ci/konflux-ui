import * as React from 'react';
import { useTRTaskRunLog } from '../../../../hooks/useTektonResults';
import { HttpError } from '../../../../k8s/error';
import { TaskRunKind } from '../../../../types';
import LogViewer from './LogViewer';

import './Logs.scss';
import './MultiStreamLogs.scss';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
};

export const TektonTaskRunLog: React.FC<React.PropsWithChildren<TektonTaskRunLogProps>> = ({
  taskRun,
  downloadAllLabel,
  onDownloadAll,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const [trResults, trLoaded, trError] = useTRTaskRunLog(taskRun.metadata.namespace, taskRun);

  const errorMessage =
    (trError as HttpError)?.code === 404
      ? `Logs are no longer accessible for ${taskName} task`
      : null;

  return (
    <>
      <div className="multi-stream-logs__container" data-testid="tr-logs-task-container">
        {!errorMessage && trLoaded ? (
          <div className="logs" data-testid="tr-logs-container">
            <LogViewer
              data={trResults}
              autoScroll
              downloadAllLabel={downloadAllLabel}
              onDownloadAll={onDownloadAll}
              taskRun={taskRun}
              isLoading={!trLoaded}
              errorMessage={errorMessage}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};
