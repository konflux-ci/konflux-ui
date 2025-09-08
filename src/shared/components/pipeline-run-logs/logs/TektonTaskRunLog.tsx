import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { useTRTaskRunLog } from '../../../../hooks/useTektonResults';
import { HttpError } from '../../../../k8s/error';
import { TaskRunKind } from '../../../../types';
import LogViewer from './LogViewer';

type TektonTaskRunLogProps = {
  taskRun: TaskRunKind | null;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
};

export const TektonTaskRunLog: React.FC<React.PropsWithChildren<TektonTaskRunLogProps>> = ({
  taskRun,
  downloadAllLabel,
  onDownloadAll,
}) => {
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const [trResults, trLoaded, trError] = useTRTaskRunLog(taskRun?.metadata.namespace, taskRun);

  const errorMessage =
    (trError as HttpError)?.code === 404
      ? `Logs are no longer accessible for ${taskName} task`
      : null;

  return (
    <PageSection isFilled data-testid="tr-logs-container">
      <LogViewer
        data={trResults ?? ''}
        downloadAllLabel={downloadAllLabel}
        onDownloadAll={onDownloadAll}
        taskRun={taskRun}
        isLoading={!trLoaded && !errorMessage}
        errorMessage={errorMessage}
      />
    </PageSection>
  );
};
