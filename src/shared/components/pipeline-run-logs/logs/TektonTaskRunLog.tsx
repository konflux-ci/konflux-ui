import * as React from 'react';
import { normalizeLogLines } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import type { NormalizedLogSection } from '~/shared/components/virtualized-log-viewer/types';
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

  const normalizedSections = React.useMemo<NormalizedLogSection[]>(
    () =>
      trResults
        ? [
            {
              containerName: taskName ?? 'log',
              lines: normalizeLogLines(trResults),
              isCompleted: true,
            },
          ]
        : [],
    [trResults, taskName],
  );

  return (
    <LogViewer
      normalizedSections={normalizedSections}
      downloadAllLabel={downloadAllLabel}
      onDownloadAll={onDownloadAll}
      taskRun={taskRun}
      isLoading={!trLoaded && !errorMessage}
      errorMessage={errorMessage}
    />
  );
};
