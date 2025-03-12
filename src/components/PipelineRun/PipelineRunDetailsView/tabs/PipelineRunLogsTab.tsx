import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { usePipelineRun } from '../../../../hooks/usePipelineRuns';
import { useSearchParam } from '../../../../hooks/useSearchParam';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { PipelineRunLogs } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';

const PipelineRunLogsTab: React.FC = () => {
  const pipelineRunName = useParams<RouterParams>().pipelineRunName;
  const namespace = useNamespace();
  const [pipelineRun, loaded, error] = usePipelineRun(namespace, pipelineRunName);
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRuns(namespace, pipelineRunName);
  const [activeTask, setActiveTask, unSetActiveTask] = useSearchParam('task', undefined);

  const handleActiveTaskChange = React.useCallback(
    (value: string | undefined) => {
      value ? setActiveTask(value) : unSetActiveTask();
    },
    [setActiveTask, unSetActiveTask],
  );

  const loadError = error || taskRunError;
  if (loadError) {
    const httpError = HttpError.fromCode((loadError as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load pipeline run ${pipelineRunName}`}
        body={httpError.message}
      />
    );
  }

  if (!(loaded && taskRunsLoaded)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <PipelineRunLogs
      className="pf-v5-u-pt-md"
      obj={pipelineRun}
      taskRuns={taskRuns}
      activeTask={activeTask}
      onActiveTaskChange={handleActiveTaskChange}
    />
  );
};

export default PipelineRunLogsTab;
