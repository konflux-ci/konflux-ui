import * as React from 'react';
import { useTRTaskRunLog } from '../../../../hooks/useTektonResults';
import { HttpError } from '../../../../k8s/error';
import { TaskRunKind } from '../../../../types';
import { LoadingInline } from '../../status-box/StatusBox';
import LogsTaskDuration from './LogsTaskDuration';
import LogViewer from './LogViewer';

import './Logs.scss';
import './MultiStreamLogs.scss';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: React.FC<React.PropsWithChildren<TektonTaskRunLogProps>> = ({
  taskRun,
  setCurrentLogsGetter,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const [trResults, trLoaded, trError] = useTRTaskRunLog(taskRun.metadata.namespace, taskRun);

  React.useEffect(() => {
    setCurrentLogsGetter(() => trResults);
  }, [setCurrentLogsGetter, trResults]);

  const errorMessage =
    (trError as HttpError)?.code === 404
      ? `Logs are no longer accessible for ${taskName} task`
      : null;

  return (
    <>
      <div className="multi-stream-logs__taskName" data-testid="logs-taskName">
        {taskName}
        <LogsTaskDuration taskRun={taskRun} />
        {!trLoaded && (
          <span
            className="multi-stream-logs__taskName__loading-indicator"
            data-testid="loading-indicator"
          >
            <LoadingInline />
          </span>
        )}
      </div>
      <div className="multi-stream-logs__container" data-testid="tr-logs-task-container">
        <div className="multi-stream-logs__container__logs" data-testid="tr-logs-container">
          {errorMessage && (
            <div className="pipeline-run-logs__logtext" data-testid="tr-logs-error-message">
              {errorMessage}
            </div>
          )}
          {!errorMessage && trLoaded ? (
            <div className="logs" data-testid="tr-logs-container">
              <p className="logs__name">{taskName}</p>
              <LogViewer data={trResults} autoScroll />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
