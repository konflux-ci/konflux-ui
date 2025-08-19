import * as React from 'react';
import { useTRTaskRunLog } from '../../../../hooks/useTektonResults';
import { HttpError } from '../../../../k8s/error';
import { TaskRunKind } from '../../../../types';
import LogViewer from './LogViewer';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<void>;
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
      {!errorMessage && trLoaded ? (
        <div data-testid="tr-logs-container">
          <LogViewer
            data={trResults}
            allowAutoScroll
            downloadAllLabel={downloadAllLabel}
            onDownloadAll={onDownloadAll}
            taskRun={taskRun}
            isLoading={!trLoaded}
            errorMessage={errorMessage}
          />
        </div>
      ) : null}
    </>
  );
};
