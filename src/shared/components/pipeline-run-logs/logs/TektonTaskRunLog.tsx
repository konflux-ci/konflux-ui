import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { singleLogSection } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import { taskRunStatus } from '~/utils/pipeline-utils';
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

  const sections = React.useMemo(() => {
    if (!trResults) {
      return [];
    }

    const status = taskRun ? taskRunStatus(taskRun) : runStatus.Unknown;
    const inProgress =
      status === runStatus.Running || status === runStatus.Pending || status === runStatus.Idle;

    return [singleLogSection(trResults, taskName ?? 'log', trLoaded && !inProgress)];
  }, [trResults, taskName, taskRun, trLoaded]);

  return (
    <LogViewer
      sections={sections}
      downloadAllLabel={downloadAllLabel}
      onDownloadAll={onDownloadAll}
      taskRun={taskRun}
      isLoading={!trLoaded && !errorMessage}
      errorMessage={errorMessage}
    />
  );
};
