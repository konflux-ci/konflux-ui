import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { usePipelineRun } from '../../../../hooks/usePipelineRuns';
import { useSearchParam } from '../../../../hooks/useSearchParam';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { RouterParams } from '../../../../routes/utils';
import { PipelineRunLogs } from '../../../../shared';

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

  if (!(loaded && taskRunsLoaded)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'pipeline run');
  }

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunsLoaded, 'task runs');
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
